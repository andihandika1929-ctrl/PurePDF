# backend/services/scan_editor_service.py
"""
Precision 4-Stage Scanned & Screenshot PDF Editor Pipeline (Adobe Acrobat Edit Scan style)
RAM-safe for Render Free Tier (512MB RAM): strictly one page at a time, zero temp files on disk.

Stage 1: PyMuPDF renders page (180 DPI) + Tesseract OCR (image_to_data) extracts REAL text
         per line/phrase (ZERO fake placeholders).
Stage 2: Visual typography analysis per box:
         - Skew angle via OpenCV minAreaRect
         - Font family classification (Serif / Sans / Carlito / Mono) & Bold via stroke-width distanceTransform
         - True cap-height font size & exact baseline Y coordinate
         - Darkest ink color sampling (15th percentile of ink strokes)
Stage 3: Table-safe stroke-only adaptive+Otsu mask (excludes horizontal/vertical table borders)
         + OpenCV Telea inpainting to erase old ink while preserving paper texture & grain.
Stage 4: Renders replacement text using embedded backend/fonts (Liberation Serif/Sans/Mono, Carlito)
         anchored to exact baseline Y, rotated to match scan skew, with subtle scan softness,
         and reassembles cleanly into PDF via PyMuPDF.
"""

import base64
import gc
import os
import shutil
from pathlib import Path
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
BACKEND_FONTS_DIR = Path(__file__).resolve().parent.parent / "fonts"


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


def _resolve_truetype_font(
    family: str,
    size_px: int,
    bold: bool = False,
) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """
    Resolve deterministic document fonts from backend/fonts/ first, then Linux system fonts,
    then Windows standard equivalents (Times New Roman, Arial, Calibri, Courier New).
    """
    fam = (family or "serif").lower()

    if "serif" in fam and "sans" not in fam:
        fname = "LiberationSerif-Bold.ttf" if bold else "LiberationSerif-Regular.ttf"
        candidates = [
            str(BACKEND_FONTS_DIR / fname),
            f"/usr/share/fonts/truetype/liberation/{fname}",
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
            "C:/Windows/Fonts/timesbd.ttf" if bold else "C:/Windows/Fonts/times.ttf",
            "C:/Windows/Fonts/georgiab.ttf" if bold else "C:/Windows/Fonts/georgia.ttf",
        ]
    elif "mono" in fam or "courier" in fam:
        fname = "LiberationMono-Bold.ttf" if bold else "LiberationMono-Regular.ttf"
        candidates = [
            str(BACKEND_FONTS_DIR / fname),
            f"/usr/share/fonts/truetype/liberation/{fname}",
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
            "C:/Windows/Fonts/courbd.ttf" if bold else "C:/Windows/Fonts/cour.ttf",
        ]
    elif "carlito" in fam or "calibri" in fam:
        fname = "Carlito-Bold.ttf" if bold else "Carlito-Regular.ttf"
        candidates = [
            str(BACKEND_FONTS_DIR / fname),
            f"/usr/share/fonts/truetype/crosextra/{fname}",
            str(BACKEND_FONTS_DIR / ("LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf")),
            "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
            "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        ]
    else:
        fname = "LiberationSans-Bold.ttf" if bold else "LiberationSans-Regular.ttf"
        candidates = [
            str(BACKEND_FONTS_DIR / fname),
            f"/usr/share/fonts/truetype/liberation/{fname}",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
        ]

    px = max(7, int(round(size_px)))
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, px)
            except Exception:
                continue
    return ImageFont.load_default()


def _analyze_typography_and_color(
    bgr_img: np.ndarray,
    x: int,
    y: int,
    w: int,
    h: int,
    text: str = "",
) -> Dict[str, Any]:
    """
    Visual typography analysis on a single detected text box:
    - Ink color (15th percentile darkest foreground pixels) & paper bg color (median)
    - True cap-height & baseline Y from foreground ink projection
    - Bold vs Regular from cv2.distanceTransform stroke width ratio
    - Font family classification: 'serif' | 'sans' | 'carlito' | 'mono'
    - Skew angle via cv2.minAreaRect (clamped to [-5.0, 5.0])
    """
    img_h, img_w = bgr_img.shape[:2]
    x0 = max(0, x)
    y0 = max(0, y)
    x1 = min(img_w, x + max(1, w))
    y1 = min(img_h, y + max(1, h))
    roi = bgr_img[y0:y1, x0:x1]

    default_res = {
        "textColor": "#141414",
        "bgColor": "#f4f4f2",
        "isBold": False,
        "fontFamily": "serif",
        "fontSize": max(9, int(round(h * 0.85))),
        "baselineY": y0 + int(round(h * 0.82)),
        "skewAngle": 0.0,
    }
    if roi.size == 0 or roi.shape[0] < 4 or roi.shape[1] < 4:
        return default_res

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, binary_inv = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    ink_pixels = roi[binary_inv > 0]
    bg_pixels = roi[binary_inv == 0]

    # 1. Sample ink & background colors
    if len(ink_pixels) >= 4:
        ink_b = int(np.percentile(ink_pixels[:, 0], 15))
        ink_g = int(np.percentile(ink_pixels[:, 1], 15))
        ink_r = int(np.percentile(ink_pixels[:, 2], 15))
        text_hex = _rgb_to_hex(ink_r, ink_g, ink_b)
    else:
        text_hex = "#141414"

    if len(bg_pixels) >= 4:
        bg_b = int(np.median(bg_pixels[:, 0]))
        bg_g = int(np.median(bg_pixels[:, 1]))
        bg_r = int(np.median(bg_pixels[:, 2]))
        bg_hex = _rgb_to_hex(bg_r, bg_g, bg_b)
    else:
        bg_hex = "#f4f4f2"

    # 2. Measure true ink vertical span (cap-height) & baseline Y
    row_counts = np.sum(binary_inv > 0, axis=1)
    active_rows = np.where(row_counts >= max(1, int(roi.shape[1] * 0.015)))[0]
    if len(active_rows) >= 3:
        ink_top = int(active_rows[0])
        ink_bottom = int(active_rows[-1])
        ink_span = max(6, ink_bottom - ink_top + 1)
        # Check if text likely contains descenders (g, j, p, q, y)
        has_descender = any(ch in text for ch in "gjpqy,;")
        # TrueType em-size is roughly 1.25x cap-height (or 1.02x full ascender+descender span)
        est_font_px = int(round(ink_span * (1.02 if has_descender else 1.22)))
        baseline_y = y0 + (ink_bottom - int(round(ink_span * 0.18)) if has_descender else ink_bottom)
    else:
        ink_span = max(8, h)
        est_font_px = max(9, int(round(h * 0.88)))
        baseline_y = y0 + int(round(h * 0.82))

    est_font_px = max(8, min(72, est_font_px))

    # 3. Bold detection via distance transform (median half-stroke width / cap-height)
    dist = cv2.distanceTransform(binary_inv, cv2.DIST_L2, 3)
    fg_dists = dist[binary_inv > 0]
    if len(fg_dists) >= 8:
        stroke_width = float(np.percentile(fg_dists, 75)) * 2.0
        stroke_ratio = stroke_width / float(max(8, ink_span))
        is_bold = stroke_ratio > 0.165
    else:
        is_bold = False

    # 4. Font family classification (Monospace vs Serif vs Sans/Carlito)
    font_family = "sans"
    num_labels, _, stats, _ = cv2.connectedComponentsWithStats(binary_inv, connectivity=8)
    char_widths = []
    char_heights = []
    for lbl in range(1, num_labels):
        cw = int(stats[lbl, cv2.CC_STAT_WIDTH])
        ch = int(stats[lbl, cv2.CC_STAT_HEIGHT])
        area = int(stats[lbl, cv2.CC_STAT_AREA])
        if ch >= max(5, int(ink_span * 0.4)) and cw >= 2 and area >= 8:
            char_widths.append(cw)
            char_heights.append(ch)

    if len(char_widths) >= 5:
        w_arr = np.array(char_widths, dtype=np.float32)
        cv_width = float(np.std(w_arr) / max(1.0, float(np.mean(w_arr))))
        avg_aspect = float(np.mean(w_arr) / max(1.0, float(np.mean(char_heights))))
        if cv_width < 0.17 and 0.50 <= avg_aspect <= 0.82:
            font_family = "mono"
        else:
            # Serif detection: serifs add extra horizontal ink density near the top & bottom
            # of glyphs compared to the middle stem region
            roi_ink = binary_inv[active_rows[0] : active_rows[-1] + 1, :] if len(active_rows) >= 5 else binary_inv
            rh = roi_ink.shape[0]
            if rh >= 8:
                band = max(1, int(round(rh * 0.18)))
                top_d = float(np.mean(roi_ink[:band, :] > 0))
                bot_d = float(np.mean(roi_ink[-band:, :] > 0))
                mid_d = float(np.mean(roi_ink[rh // 3 : (2 * rh) // 3, :] > 0))
                # Serif fonts typically have strong feet/head flares relative to thin middle stems
                flare_ratio = (top_d + bot_d) / max(0.02, 2.0 * mid_d)
                if flare_ratio > 1.08:
                    font_family = "serif"
                elif avg_aspect < 0.52:
                    font_family = "carlito"
                else:
                    font_family = "sans"
    else:
        # Short 1-2 word boxes on formal documents default to serif if stroke contrast is high
        font_family = "serif"

    # 5. Skew angle via OpenCV minAreaRect
    skew = 0.0
    if roi.shape[0] >= 6 and roi.shape[1] >= 24:
        coords = np.column_stack(np.where(binary_inv > 0))
        if len(coords) >= 24:
            rect = cv2.minAreaRect(coords)
            angle = rect[-1]
            # Normalize OpenCV minAreaRect angle to horizontal line deviation
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle
            else:
                angle = -angle
            # Only keep subtle realistic scan tilt (ignore tall/square box 90-deg artifacts)
            if abs(angle) <= 5.0:
                skew = round(float(angle), 2)

    return {
        "textColor": text_hex,
        "bgColor": bg_hex,
        "isBold": is_bold,
        "fontFamily": font_family,
        "fontSize": est_font_px,
        "baselineY": int(baseline_y),
        "skewAngle": skew,
    }


def _merge_line_boxes(raw_boxes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Group adjacent words on the same line into editable phrases without merging across
    wide column gaps or table borders.
    """
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
        # Tight horizontal gap threshold so table columns & dates stay independently clickable
        max_gap = max(10, int(min_h * 1.15))

        if min_h > 0 and (y_overlap / min_h) >= 0.5 and -6 <= h_gap <= max_gap:
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


def _detect_boxes_tesseract(bgr_img: np.ndarray) -> Tuple[List[Dict[str, Any]], str]:
    """
    Extract REAL OCR text & bounding boxes using Tesseract image_to_data.
    Downscales grayscale to <= 1200px wide + CLAHE enhancement for fast, accurate OCR
    on Render Free Tier (0.1 vCPU / 512MB RAM). NEVER returns fake placeholder text.
    """
    if pytesseract is None or not shutil.which("tesseract"):
        return [], "unavailable"

    img_h, img_w = bgr_img.shape[:2]
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)

    # Downscale for speed while keeping crisp glyph edges
    max_ocr_w = 1200
    scale = 1.0
    if img_w > max_ocr_w:
        scale = max_ocr_w / float(img_w)
        gray = cv2.resize(
            gray,
            (int(round(img_w * scale)), int(round(img_h * scale))),
            interpolation=cv2.INTER_AREA,
        )

    # Light CLAHE improves contrast on faint/cream/shadowed scans without distorting strokes
    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    pil_gray = Image.fromarray(enhanced)

    data = None
    used_lang = "eng"
    for lang in ("ind", "eng"):
        try:
            data = pytesseract.image_to_data(
                pil_gray,
                lang=lang,
                config="--oem 1 --psm 6",
                timeout=45,
                output_type=pytesseract.Output.DICT,
            )
            used_lang = lang
            break
        except Exception:
            continue

    if not data or "text" not in data:
        return [], "timeout"

    inv_scale = 1.0 / scale
    words: List[Dict[str, Any]] = []
    n = len(data["text"])
    for i in range(n):
        txt = (data["text"][i] or "").strip()
        try:
            conf = float(data["conf"][i])
        except Exception:
            conf = -1.0
        w = int(round(int(data["width"][i]) * inv_scale))
        h = int(round(int(data["height"][i]) * inv_scale))
        if not txt or conf < 20 or w < 4 or h < 6:
            continue
        # Ignore giant page-border false boxes
        if h > img_h * 0.14 or w > img_w * 0.94:
            continue
        words.append(
            {
                "text": txt,
                "x": int(round(int(data["left"][i]) * inv_scale)),
                "y": int(round(int(data["top"][i]) * inv_scale)),
                "w": w,
                "h": h,
            }
        )

    return _merge_line_boxes(words), f"tesseract-{used_lang}"


def _render_input_page(file_bytes: bytes, page_index: int = 0) -> Tuple[np.ndarray, int, float, float, List[Dict[str, Any]]]:
    """
    Load a single page from PDF (at 180 DPI) or decode a screenshot image directly.
    Extracts native PDF words and closes the PyMuPDF document immediately so RAM is
    freed BEFORE Tesseract OCR runs (critical for Render 512MB Free Tier).
    """
    is_pdf = file_bytes[:4] == b"%PDF"
    if is_pdf:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        try:
            total_pages = len(doc)
            safe_idx = max(0, min(page_index, total_pages - 1))
            page = doc[safe_idx]
            rect = page.rect
            zoom = RENDER_DPI / 72.0
            pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
            img_rgb = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
            bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

            native_boxes: List[Dict[str, Any]] = []
            words = page.get_text("words")
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
                native_boxes = _merge_line_boxes(word_boxes)

            page_w, page_h = float(rect.width), float(rect.height)
            del pix, img_rgb
            return bgr, total_pages, page_w, page_h, native_boxes
        finally:
            doc.close()
            gc.collect()

    arr = np.frombuffer(file_bytes, np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Unsupported file format. Please upload a valid PDF, PNG, or JPG.")
    h, w = bgr.shape[:2]
    max_dim = 2200
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        bgr = cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = bgr.shape[:2]
    return bgr, 1, float(w * 72.0 / RENDER_DPI), float(h * 72.0 / RENDER_DPI), []


def scan_document_for_editor(file_bytes: bytes, page_index: int = 0) -> Dict[str, Any]:
    """
    Stage 1 & 2 API handler:
    Renders page at 180 DPI, extracts REAL text via PyMuPDF native layer or Tesseract OCR
    (strictly NO fake placeholder text), and performs per-block typography, ink, baseline,
    and skew analysis.
    """
    bgr, total_pages, page_w, page_h, raw_boxes = _render_input_page(file_bytes, page_index)
    img_h, img_w = bgr.shape[:2]

    ocr_engine = "pymupdf"

    # Scanned PDF or Screenshot (no native text layer) -> REAL Tesseract OCR
    if not raw_boxes:
        raw_boxes, ocr_engine = _detect_boxes_tesseract(bgr)

    blocks: List[Dict[str, Any]] = []
    for idx, b in enumerate(raw_boxes):
        x, y, w, h = b["x"], b["y"], b["w"], b["h"]
        typo = _analyze_typography_and_color(bgr, x, y, w, h, b["text"])

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
                "bgColor": typo["bgColor"],
                "textColor": typo["textColor"],
                "fontSize": typo["fontSize"],
                "isBold": typo["isBold"],
                "fontCategory": typo["fontFamily"],
                "fontFamily": typo["fontFamily"],
                "baselineY": round((typo["baselineY"] / img_h) * 100.0, 4),
                "skewAngle": typo["skewAngle"],
            }
        )

    # Encode clean preview JPEG
    _, enc = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
    b64_img = "data:image/jpeg;base64," + base64.b64encode(enc.tobytes()).decode("ascii")

    del bgr, enc
    gc.collect()

    return {
        "pageIndex": max(0, min(page_index, total_pages - 1)),
        "totalPages": total_pages,
        "pageWidth": page_w,
        "pageHeight": page_h,
        "pixelWidth": img_w,
        "pixelHeight": img_h,
        "ocrEngine": ocr_engine,
        "image": b64_img,
        "blocks": blocks,
    }


def inpaint_and_render_edits_on_image(
    bgr_img: np.ndarray,
    edits: List[Dict[str, Any]],
) -> np.ndarray:
    """
    Stages 3 & 4 on a single rendered page image:
    - Stage 3: Adaptive + Otsu stroke mask with structural table-line subtraction so
      ONLY letter ink is erased by cv2.inpaint (Telea), preserving paper grain & table borders.
    - Stage 4: Renders replacement text using embedded backend fonts anchored to exact
      baseline Y, rotated by detected scan skew angle, with subtle scan softness.
    """
    result_bgr = bgr_img.copy()
    img_h, img_w = result_bgr.shape[:2]

    # Stage 3: Table-safe, stroke-accurate OpenCV Telea inpainting
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

        pad = max(10, int(round(bh * 0.45)))
        rx0 = max(0, bx - pad)
        ry0 = max(0, by - pad)
        rx1 = min(img_w, bx + bw + pad)
        ry1 = min(img_h, by + bh + pad)

        roi = result_bgr[ry0:ry1, rx0:rx1]
        if roi.size == 0:
            continue

        lx0 = max(0, bx - rx0 - 1)
        ly0 = max(0, by - ry0 - 1)
        lx1 = min(roi.shape[1], bx - rx0 + bw + 1)
        ly1 = min(roi.shape[0], by - ry0 + bh + 1)

        sub_roi = roi[ly0:ly1, lx0:lx1]
        if sub_roi.size == 0:
            continue

        gray = cv2.cvtColor(sub_roi, cv2.COLOR_BGR2GRAY)
        _, otsu_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        adapt_mask = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 9
        )
        stroke_mask = cv2.bitwise_or(otsu_mask, adapt_mask)

        # Protect horizontal & vertical table borders/lines from being erased
        sh, sw = stroke_mask.shape[:2]
        if sw >= 28:
            h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(24, int(sw * 0.65)), 1))
            h_lines = cv2.morphologyEx(stroke_mask, cv2.MORPH_OPEN, h_kernel)
            stroke_mask = cv2.subtract(stroke_mask, h_lines)
        if sh >= 28:
            v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(24, int(sh * 0.65))))
            v_lines = cv2.morphologyEx(stroke_mask, cv2.MORPH_OPEN, v_kernel)
            stroke_mask = cv2.subtract(stroke_mask, v_lines)

        # Dilate remaining ink strokes slightly (3x3 ellipse) to remove anti-aliased edge halos
        dilate_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        stroke_mask = cv2.dilate(stroke_mask, dilate_k, iterations=1)

        full_mask = np.zeros((roi.shape[0], roi.shape[1]), dtype=np.uint8)
        full_mask[ly0:ly1, lx0:lx1] = stroke_mask

        inpainted_roi = cv2.inpaint(roi, full_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
        result_bgr[ry0:ry1, rx0:rx1] = inpainted_roi

    # Stage 4: Baseline-anchored, skew-rotated replacement text rendering
    replace_edits = [
        e for e in edits if e.get("mode") == "replace" and str(e.get("newText", "")).strip()
    ]
    if not replace_edits:
        return result_bgr

    base_pil = Image.fromarray(cv2.cvtColor(result_bgr, cv2.COLOR_BGR2RGB)).convert("RGBA")
    text_layer = Image.new("RGBA", base_pil.size, (0, 0, 0, 0))

    for edit in replace_edits:
        bbox = edit.get("bbox") or {}
        bx = int(round((float(bbox.get("x", 0)) / 100.0) * img_w))
        by = int(round((float(bbox.get("y", 0)) / 100.0) * img_h))
        bh = max(8, int(round((float(bbox.get("height", 2)) / 100.0) * img_h)))

        offset_x = int(round(float(edit.get("offsetX", 0))))
        offset_y = int(round(float(edit.get("offsetY", 0))))
        font_size = int(round(float(edit.get("fontSize") or max(9, bh * 0.88))))
        font_family = str(edit.get("fontFamily", "serif"))
        is_bold = bool(edit.get("isBold", False))
        skew_angle = max(-10.0, min(10.0, float(edit.get("skewAngle", 0.0) or 0.0)))
        new_text = str(edit.get("newText", ""))
        r, g, b = _hex_to_rgb(str(edit.get("textColor", "#141414")))

        font = _resolve_truetype_font(font_family, font_size, bold=is_bold)

        # Measure exact visual glyph box & ascent for baseline alignment
        try:
            tb = font.getbbox(new_text)
            glyph_w = max(4, tb[2] - tb[0])
            glyph_h = max(4, tb[3] - tb[1])
            glyph_x_off = -tb[0]
            glyph_y_off = -tb[1]
            ascent, _ = font.getmetrics()
        except Exception:
            glyph_w = max(20, len(new_text) * font_size)
            glyph_h = font_size
            glyph_x_off = 0
            glyph_y_off = 0
            ascent = int(round(font_size * 0.8))

        pad = max(12, int(round(font_size * 0.45)))
        patch = Image.new("RGBA", (glyph_w + pad * 2, glyph_h + pad * 2), (0, 0, 0, 0))
        patch_draw = ImageDraw.Draw(patch)
        patch_draw.text(
            (pad + glyph_x_off, pad + glyph_y_off),
            new_text,
            font=font,
            fill=(r, g, b, 236),
        )

        if abs(skew_angle) >= 0.15:
            patch = patch.rotate(-skew_angle, resample=Image.BICUBIC, expand=True)

        # Anchor to baselineY if provided, else center vertically inside original bbox
        baseline_pct = edit.get("baselineY")
        if baseline_pct is not None and float(baseline_pct) > 0:
            baseline_px = int(round((float(baseline_pct) / 100.0) * img_h))
            # Position patch so glyph baseline lands on baseline_px
            target_y = baseline_px - (pad + ascent + glyph_y_off) + offset_y
        else:
            target_y = int(round(by + (bh - patch.height) / 2.0)) + offset_y

        target_x = bx + offset_x - pad
        text_layer.alpha_composite(patch, (target_x, target_y))

    # Subtle Gaussian softness blends digital vector edges into scanned document grain
    text_layer = text_layer.filter(ImageFilter.GaussianBlur(radius=0.42))
    composited = Image.alpha_composite(base_pil, text_layer).convert("RGB")
    return cv2.cvtColor(np.array(composited), cv2.COLOR_RGB2BGR)


def apply_scan_edits_to_pdf(file_bytes: bytes, edits: List[Dict[str, Any]]) -> bytes:
    """
    Applies all user edits page-by-page with strict RAM cleanup and reassembles PDF via PyMuPDF.
    Zero disk temp files used.
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

                del pix, img_rgb, bgr, edited_bgr, jpg_buf
                gc.collect()
        finally:
            src_doc.close()
    else:
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
