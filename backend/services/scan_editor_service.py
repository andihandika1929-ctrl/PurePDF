# backend/services/scan_editor_service.py
"""
Lightweight 4-Stage Scanned & Screenshot PDF Editor Pipeline
Designed for Render Free Tier (512MB RAM): processes strictly one page at a time,
zero heavy ML frameworks (no torch/easyocr/paddleocr), zero disk retention.

Stage 1: PyMuPDF renders page (180 DPI) + Tesseract OCR detects word/line boxes & skew.
Stage 2: Stroke-accurate OpenCV Telea inpainting removes old text pixels while preserving
         original paper grain, cream/gray background, and gradients (zero solid patch boxes).
Stage 3: Auto-samples darkest ink pixel color (10th percentile) & computes font size from box height.
Stage 4: Renders anti-aliased replacement text with micro-softness for scan blending and
         reassembles cleanly into PDF via PyMuPDF.
"""

import base64
import gc
import io
import os
from typing import Any, Dict, List, Optional, Tuple

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    import pytesseract
except ImportError:
    pytesseract = None

RENDER_DPI = 180


def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    cleaned = (hex_color or "#111110").strip().lstrip("#")
    if len(cleaned) == 3:
        cleaned = "".join(c * 2 for c in cleaned)
    if len(cleaned) != 6:
        return (17, 17, 16)
    try:
        return (int(cleaned[0:2], 16), int(cleaned[2:4], 16), int(cleaned[4:6], 16))
    except ValueError:
        return (17, 17, 16)


def _rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{max(0, min(255, int(r))):02x}{max(0, min(255, int(g))):02x}{max(0, min(255, int(b))):02x}"


def _resolve_truetype_font(family: str, size_px: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Resolve crisp Serif, Sans, or Mono TrueType fonts across Linux (Render) and Windows."""
    fam = (family or "sans").lower()
    if "serif" in fam and "sans" not in fam:
        candidates = (
            [
                "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
                "C:/Windows/Fonts/timesbd.ttf",
                "C:/Windows/Fonts/georgiab.ttf",
            ]
            if bold
            else [
                "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
                "C:/Windows/Fonts/times.ttf",
                "C:/Windows/Fonts/georgia.ttf",
            ]
        )
    elif "mono" in fam or "courier" in fam:
        candidates = (
            [
                "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
                "C:/Windows/Fonts/courbd.ttf",
            ]
            if bold
            else [
                "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
                "C:/Windows/Fonts/cour.ttf",
            ]
        )
    else:
        candidates = (
            [
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "C:/Windows/Fonts/arialbd.ttf",
                "C:/Windows/Fonts/calibrib.ttf",
            ]
            if bold
            else [
                "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/calibri.ttf",
            ]
        )

    px = max(8, int(round(size_px)))
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, px)
            except Exception:
                continue
    return ImageFont.load_default()


def _sample_ink_and_bg_colors(bgr_img: np.ndarray, x: int, y: int, w: int, h: int) -> Tuple[str, str, bool]:
    """
    Stage 3: Auto-samples original text ink color (10th-percentile darkest foreground pixels)
    and surrounding paper background color (median border pixels), plus estimates boldness.
    """
    img_h, img_w = bgr_img.shape[:2]
    x0 = max(0, x)
    y0 = max(0, y)
    x1 = min(img_w, x + max(1, w))
    y1 = min(img_h, y + max(1, h))
    roi = bgr_img[y0:y1, x0:x1]
    if roi.size == 0:
        return "#111110", "#f4f4f2", False

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    # Otsu threshold separates dark text strokes from lighter scanned paper
    _, binary_inv = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    ink_pixels = roi[binary_inv > 0]
    bg_pixels = roi[binary_inv == 0]

    if len(ink_pixels) >= 4:
        # 10th percentile luminance gives authentic dark ink without picking JPEG edge artifacts
        ink_b = int(np.percentile(ink_pixels[:, 0], 15))
        ink_g = int(np.percentile(ink_pixels[:, 1], 15))
        ink_r = int(np.percentile(ink_pixels[:, 2], 15))
        text_hex = _rgb_to_hex(ink_r, ink_g, ink_b)
    else:
        text_hex = "#111110"

    if len(bg_pixels) >= 4:
        bg_b = int(np.median(bg_pixels[:, 0]))
        bg_g = int(np.median(bg_pixels[:, 1]))
        bg_r = int(np.median(bg_pixels[:, 2]))
        bg_hex = _rgb_to_hex(bg_r, bg_g, bg_b)
    else:
        bg_hex = "#f4f4f2"

    ink_density = float(len(ink_pixels)) / float(max(1, roi.shape[0] * roi.shape[1]))
    is_bold = ink_density > 0.34
    return text_hex, bg_hex, is_bold


def _estimate_box_skew(bgr_img: np.ndarray, x: int, y: int, w: int, h: int) -> float:
    """Estimate subtle skew angle (degrees, clamped to [-5, 5]) of text inside box."""
    img_h, img_w = bgr_img.shape[:2]
    roi = bgr_img[max(0, y):min(img_h, y + max(1, h)), max(0, x):min(img_w, x + max(1, w))]
    if roi.size == 0 or roi.shape[0] < 6 or roi.shape[1] < 16:
        return 0.0
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) < 20:
        return 0.0
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    elif angle > 45:
        angle = 90 - angle
    else:
        angle = -angle
    return round(float(max(-5.0, min(5.0, angle))), 2)


def _merge_line_boxes(raw_boxes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Group adjacent words on the same horizontal line without merging separate columns."""
    if not raw_boxes:
        return []
    sorted_boxes = sorted(raw_boxes, key=lambda b: (b["y"], b["x"]))
    merged: List[Dict[str, Any]] = []

    for b in sorted_boxes:
        if not merged:
            merged.append(dict(b))
            continue
        prev = merged[-1]
        y_overlap = max(0, min(prev["y"] + prev["h"], b["y"] + b["h"]) - max(prev["y"], b["y"]))
        min_h = min(prev["h"], b["h"])
        h_gap = b["x"] - (prev["x"] + prev["w"])
        max_gap = max(12, int(min_h * 1.45))

        if min_h > 0 and (y_overlap / min_h) >= 0.45 and -8 <= h_gap <= max_gap:
            prev["text"] = f'{prev["text"]} {b["text"]}'.strip()
            nx = min(prev["x"], b["x"])
            ny = min(prev["y"], b["y"])
            prev["w"] = max(prev["x"] + prev["w"], b["x"] + b["w"]) - nx
            prev["h"] = max(prev["y"] + prev["h"], b["y"] + b["h"]) - ny
            prev["x"] = nx
            prev["y"] = ny
        else:
            merged.append(dict(b))
    return merged


def _detect_boxes_tesseract(bgr_img: np.ndarray) -> List[Dict[str, Any]]:
    """Run lightweight Tesseract OCR (ind+eng) to extract word/line bounding boxes."""
    if pytesseract is None:
        return []

    rgb = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)

    data = None
    for lang in ("ind+eng", "eng"):
        try:
            data = pytesseract.image_to_data(
                pil_img,
                lang=lang,
                config="--oem 3 --psm 6",
                output_type=pytesseract.Output.DICT,
            )
            break
        except Exception:
            continue

    if not data or "text" not in data:
        return []

    words: List[Dict[str, Any]] = []
    n = len(data["text"])
    for i in range(n):
        txt = (data["text"][i] or "").strip()
        try:
            conf = float(data["conf"][i])
        except Exception:
            conf = -1.0
        w = int(data["width"][i])
        h = int(data["height"][i])
        if not txt or conf < 25 or w < 4 or h < 6:
            continue
        words.append(
            {
                "text": txt,
                "x": int(data["left"][i]),
                "y": int(data["top"][i]),
                "w": w,
                "h": h,
            }
        )

    return _merge_line_boxes(words)


def _detect_boxes_opencv_fallback(bgr_img: np.ndarray) -> List[Dict[str, Any]]:
    """
    Fallback detector if Tesseract binary is unavailable locally:
    uses morphological horizontal dilation to detect text line contours accurately.
    """
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 12
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (18, 3))
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    img_h, img_w = bgr_img.shape[:2]
    boxes: List[Dict[str, Any]] = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w < 18 or h < 8 or h > img_h * 0.15 or w > img_w * 0.96:
            continue
        boxes.append({"text": "Detected Text Region", "x": x, "y": y, "w": w, "h": h})

    return sorted(boxes, key=lambda b: (b["y"], b["x"]))[:80]


def _render_input_page(file_bytes: bytes, page_index: int = 0) -> Tuple[np.ndarray, int, float, float, Optional[fitz.Page]]:
    """
    Load a single page from PDF (at 180 DPI) or decode a screenshot image directly.
    Returns (bgr_img, total_pages, page_w_pt, page_h_pt, fitz_page_or_none).
    """
    is_pdf = file_bytes[:4] == b"%PDF"
    if is_pdf:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)
        safe_idx = max(0, min(page_index, total_pages - 1))
        page = doc[safe_idx]
        rect = page.rect
        zoom = RENDER_DPI / 72.0
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        img_rgb = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
        bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        return bgr, total_pages, float(rect.width), float(rect.height), page

    # Direct image screenshot (.png / .jpg / .webp)
    arr = np.frombuffer(file_bytes, np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Unsupported file format. Please upload a valid PDF, PNG, or JPG.")
    h, w = bgr.shape[:2]
    # Keep max dimension reasonable for 512MB RAM
    max_dim = 2200
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        bgr = cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = bgr.shape[:2]
    return bgr, 1, float(w * 72.0 / RENDER_DPI), float(h * 72.0 / RENDER_DPI), None


def scan_document_for_editor(file_bytes: bytes, page_index: int = 0) -> Dict[str, Any]:
    """
    Stage 1 API handler: Renders requested page at 180 DPI, detects text boxes via
    PyMuPDF native text (if digital) or Tesseract OCR (if scanned/screenshot),
    and auto-samples ink color + font size + skew for every detected region.
    """
    bgr, total_pages, page_w, page_h, fitz_page = _render_input_page(file_bytes, page_index)
    img_h, img_w = bgr.shape[:2]

    raw_boxes: List[Dict[str, Any]] = []

    # 1. Try native PyMuPDF words first if PDF contains digital text layer
    if fitz_page is not None:
        zoom = RENDER_DPI / 72.0
        words = fitz_page.get_text("words")
        if words and len(words) >= 2:
            word_boxes = []
            for w_item in words:
                x0, y0, x1, y1, word_str = w_item[0], w_item[1], w_item[2], w_item[3], w_item[4]
                if not str(word_str).strip():
                    continue
                word_boxes.append(
                    {
                        "text": str(word_str).strip(),
                        "x": int(round(x0 * zoom)),
                        "y": int(round(y0 * zoom)),
                        "w": max(4, int(round((x1 - x0) * zoom))),
                        "h": max(6, int(round((y1 - y0) * zoom))),
                    }
                )
            raw_boxes = _merge_line_boxes(word_boxes)

    # 2. Scanned PDF or Screenshot -> Tesseract OCR (lightweight, ind+eng)
    if not raw_boxes:
        raw_boxes = _detect_boxes_tesseract(bgr)

    # 3. Last-resort morphological contour fallback if Tesseract binary missing
    if not raw_boxes:
        raw_boxes = _detect_boxes_opencv_fallback(bgr)

    blocks: List[Dict[str, Any]] = []
    for idx, b in enumerate(raw_boxes):
        x, y, w, h = b["x"], b["y"], b["w"], b["h"]
        text_hex, bg_hex, is_bold = _sample_ink_and_bg_colors(bgr, x, y, w, h)
        skew = _estimate_box_skew(bgr, x, y, w, h)
        est_font_px = max(10, int(round(h * 0.82)))

        blocks.append(
            {
                "id": f"p{page_index}_b{idx}",
                "text": b["text"],
                "bbox": {
                    "x": round((x / img_w) * 100.0, 4),
                    "y": round((y / img_h) * 100.0, 4),
                    "width": round((w / img_w) * 100.0, 4),
                    "height": round((h / img_h) * 100.0, 4),
                },
                "bgColor": bg_hex,
                "textColor": text_hex,
                "fontSize": est_font_px,
                "isBold": is_bold,
                "fontCategory": "sans",
                "fontFamily": "sans",
                "skewAngle": skew,
            }
        )

    # Encode clean preview JPEG
    _, enc = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
    b64_img = "data:image/jpeg;base64," + base64.b64encode(enc.tobytes()).decode("ascii")

    # Release memory immediately
    del bgr, enc
    gc.collect()

    return {
        "pageIndex": max(0, min(page_index, total_pages - 1)),
        "totalPages": total_pages,
        "pageWidth": page_w,
        "pageHeight": page_h,
        "pixelWidth": img_w,
        "pixelHeight": img_h,
        "image": b64_img,
        "blocks": blocks,
    }


def inpaint_and_render_edits_on_image(
    bgr_img: np.ndarray,
    edits: List[Dict[str, Any]],
) -> np.ndarray:
    """
    Stages 2, 3 & 4 on a single rendered page image:
    - Stage 2: Builds a stroke-accurate binary mask of old text ink inside each edited bbox
      and applies cv2.inpaint (Telea) so the surrounding paper texture/gradient stays intact.
    - Stage 4: Renders replacement text with TrueType font, sampled/custom ink color,
      X/Y fine-tune offsets, and subtle Gaussian anti-aliasing softness so it blends naturally.
    """
    result_bgr = bgr_img.copy()
    img_h, img_w = result_bgr.shape[:2]

    # Stage 2: Stroke-Accurate OpenCV Inpainting for ALL edited (erase or replace) boxes
    for edit in edits:
        mode = edit.get("mode", "replace")
        if mode not in ("erase", "replace"):
            continue
        bbox = edit.get("bbox") or {}
        bx = int(round((float(bbox.get("x", 0)) / 100.0) * img_w))
        by = int(round((float(bbox.get("y", 0)) / 100.0) * img_h))
        bw = int(round((float(bbox.get("width", 0)) / 100.0) * img_w))
        bh = int(round((float(bbox.get("height", 0)) / 100.0) * img_h))
        if bw < 2 or bh < 2:
            continue

        # Expand ROI slightly (padding) so cv2.inpaint has rich surrounding paper pixels
        pad = max(10, int(round(bh * 0.45)))
        rx0 = max(0, bx - pad)
        ry0 = max(0, by - pad)
        rx1 = min(img_w, bx + bw + pad)
        ry1 = min(img_h, by + bh + pad)

        roi = result_bgr[ry0:ry1, rx0:rx1]
        if roi.size == 0:
            continue

        # Local bbox coordinates inside ROI
        lx0 = max(0, bx - rx0 - 2)
        ly0 = max(0, by - ry0 - 2)
        lx1 = min(roi.shape[1], bx - rx0 + bw + 2)
        ly1 = min(roi.shape[0], by - ry0 + bh + 2)

        sub_roi = roi[ly0:ly1, lx0:lx1]
        if sub_roi.size == 0:
            continue

        # Isolate ONLY dark ink strokes using local Otsu + adaptive threshold
        gray = cv2.cvtColor(sub_roi, cv2.COLOR_BGR2GRAY)
        _, otsu_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        adapt_mask = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 8
        )
        stroke_mask = cv2.bitwise_or(otsu_mask, adapt_mask)

        # Dilate strokes by 2-3px to cleanly capture anti-aliased ink halos without erasing paper grain
        dilate_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        stroke_mask = cv2.dilate(stroke_mask, dilate_k, iterations=1)

        # Place stroke mask into full ROI mask
        full_mask = np.zeros((roi.shape[0], roi.shape[1]), dtype=np.uint8)
        full_mask[ly0:ly1, lx0:lx1] = stroke_mask

        # OpenCV Telea inpainting preserves natural cream/gray paper texture & gradients!
        inpainted_roi = cv2.inpaint(roi, full_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)
        result_bgr[ry0:ry1, rx0:rx1] = inpainted_roi

    # Stage 4: Render anti-aliased replacement text with scan-blending softness
    replace_edits = [
        e for e in edits if e.get("mode") == "replace" and str(e.get("newText", "")).strip()
    ]
    if not replace_edits:
        return result_bgr

    base_pil = Image.fromarray(cv2.cvtColor(result_bgr, cv2.COLOR_BGR2RGB)).convert("RGBA")
    text_layer = Image.new("RGBA", base_pil.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(text_layer)

    for edit in replace_edits:
        bbox = edit.get("bbox") or {}
        bx = int(round((float(bbox.get("x", 0)) / 100.0) * img_w))
        by = int(round((float(bbox.get("y", 0)) / 100.0) * img_h))
        bh = max(10, int(round((float(bbox.get("height", 2)) / 100.0) * img_h)))

        offset_x = int(round(float(edit.get("offsetX", 0))))
        offset_y = int(round(float(edit.get("offsetY", 0))))
        font_size = int(round(float(edit.get("fontSize") or max(10, bh * 0.82))))
        font_family = str(edit.get("fontFamily", "sans"))
        is_bold = bool(edit.get("isBold", False))
        new_text = str(edit.get("newText", ""))
        r, g, b = _hex_to_rgb(str(edit.get("textColor", "#111110")))

        font = _resolve_truetype_font(font_family, font_size, bold=is_bold)
        # Slightly below 100% alpha (238/255) lets subtle paper micro-grain bleed through naturally
        draw.text((bx + offset_x, by + offset_y), new_text, font=font, fill=(r, g, b, 238))

    # Micro Gaussian softness (radius 0.45) blends crisp digital edges into scanned/screenshot quality
    text_layer = text_layer.filter(ImageFilter.GaussianBlur(radius=0.45))
    composited = Image.alpha_composite(base_pil, text_layer).convert("RGB")
    return cv2.cvtColor(np.array(composited), cv2.COLOR_RGB2BGR)


def apply_scan_edits_to_pdf(file_bytes: bytes, edits: List[Dict[str, Any]]) -> bytes:
    """
    Applies all user edits (grouped by pageIndex) page-by-page with strict RAM cleanup
    and reassembles a clean PDF via PyMuPDF. Zero disk temp files used.
    """
    edits_by_page: Dict[int, List[Dict[str, Any]]] = {}
    for e in edits:
        p_idx = int(e.get("pageIndex", 0))
        edits_by_page.setdefault(p_idx, []).append(e)

    is_pdf = file_bytes[:4] == b"%PDF"
    out_doc = fitz.open()

    if is_pdf:
        src_doc = fitz.open(stream=file_bytes, filetype="pdf")
        try:
            total = len(src_doc)
            for p_idx in range(total):
                page_edits = edits_by_page.get(p_idx, [])
                if not page_edits:
                    # Keep unedited pages untouched in original vector fidelity
                    out_doc.insert_pdf(src_doc, from_page=p_idx, to_page=p_idx)
                    continue

                page = src_doc[p_idx]
                rect = page.rect
                zoom = RENDER_DPI / 72.0
                pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
                img_rgb = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
                bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

                edited_bgr = inpaint_and_render_edits_on_image(bgr, page_edits)
                _, jpg_buf = cv2.imencode(".jpg", edited_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 93])

                new_page = out_doc.new_page(width=rect.width, height=rect.height)
                new_page.insert_image(rect, stream=jpg_buf.tobytes())

                # Free page buffers immediately for Render 512MB RAM safety
                del pix, img_rgb, bgr, edited_bgr, jpg_buf
                gc.collect()
        finally:
            src_doc.close()
    else:
        # Image screenshot -> edited single-page PDF
        bgr, _, page_w, page_h, _ = _render_input_page(file_bytes, 0)
        page_edits = edits_by_page.get(0, [])
        edited_bgr = inpaint_and_render_edits_on_image(bgr, page_edits) if page_edits else bgr
        _, jpg_buf = cv2.imencode(".jpg", edited_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 93])

        new_page = out_doc.new_page(width=page_w, height=page_h)
        new_page.insert_image(fitz.Rect(0, 0, page_w, page_h), stream=jpg_buf.tobytes())
        del bgr, edited_bgr, jpg_buf
        gc.collect()

    out_bytes = out_doc.tobytes(garbage=4, deflate=True)
    out_doc.close()
    gc.collect()
    return out_bytes
