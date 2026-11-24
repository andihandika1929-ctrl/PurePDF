# backend/services/scan_editor_service.py
import base64
import io
import json
import os
import re
from typing import List, Dict, Any, Optional, Tuple
import fitz
import cv2
import numpy as np
from dotenv import load_dotenv

load_dotenv()

def get_gemini_vision_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[Gemini Vision init notice]: {e}")
        return None

def analyze_document_typography_ai(jpeg_bytes: bytes) -> Optional[Dict[str, Any]]:
    """
    Analyzes document typography using Gemini AI Vision with resilient fallback
    across modern flash models (gemini-3.5-flash-lite, gemini-3.8-flash, gemini-3.5-flash, gemini-2.5-flash).
    Identifies primary font category, heading category, closest Google Font family,
    and whether receipt/monospace/script styling is present.
    """
    client = get_gemini_vision_client()
    if not client:
        return None

    try:
        from google.genai import types

        # Downscale for ultra-fast vision response (< 1.5s)
        nparr = np.frombuffer(jpeg_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None

        h, w = img.shape[:2]
        max_dim = 1024
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            img_small = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        else:
            img_small = img

        _, enc = cv2.imencode(".jpg", img_small, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        small_bytes = enc.tobytes()

        part = types.Part.from_bytes(data=small_bytes, mime_type="image/jpeg")
        prompt = (
            "Analyze the typography of this document scan/screenshot carefully.\n"
            "Identify the font category for the main body text, headings, and whether specialized fonts "
            "(condensed/receipt, monospace/code, slab serif, or cursive script) are used.\n"
            "Categories allowed: 'formal_serif', 'modern_sans', 'condensed', 'monospace', 'slab_serif', 'script'.\n"
            "Return ONLY valid JSON matching this schema:\n"
            "{\n"
            '  "primaryCategory": "formal_serif | modern_sans | condensed | monospace | slab_serif | script",\n'
            '  "primaryFont": "Times New Roman | Inter | Roboto | Montserrat | Oswald | Courier New | Roboto Slab | Caveat",\n'
            '  "headingCategory": "formal_serif | modern_sans | slab_serif | script",\n'
            '  "headingFont": "Times New Roman | Inter | Roboto Slab | Montserrat",\n'
            '  "isTableOrReceipt": false,\n'
            '  "hasHandwriting": false\n'
            "}"
        )

        models = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash"]
        for m in models:
            try:
                resp = client.models.generate_content(
                    model=m,
                    contents=[prompt, part],
                    config=types.GenerateContentConfig(temperature=0.1)
                )
                if resp and resp.text:
                    clean = resp.text.strip()
                    if "```json" in clean:
                        clean = clean.split("```json")[1].split("```")[0].strip()
                    elif "```" in clean:
                        clean = clean.split("```")[1].split("```")[0].strip()
                    return json.loads(clean)
            except Exception as e:
                err_str = str(e).lower()
                if "404" in err_str or "not_found" in err_str or "503" in err_str or "unavailable" in err_str:
                    continue
                break
    except Exception as e:
        print(f"[AI Vision document typography notice]: {e}")

    return None

def merge_line_blocks(blocks: List[Dict[str, Any]], img_w: int, img_h: int) -> List[Dict[str, Any]]:
    """
    Combines words on the same line into a single block, BUT strictly prevents
    merging columns across large horizontal gaps.
    
    Rule: Stops merging words if horizontal distance between them is greater
    than 1.5x font height (e.g. keeping left letter-number and right date as
    two separate, independent boxes).
    """
    if not blocks:
        return []

    # Sort primarily by vertical position (y), then horizontal (x)
    sorted_blocks = sorted(blocks, key=lambda b: (b["y"], b["x"]))
    merged: List[Dict[str, Any]] = []

    for b in sorted_blocks:
        if not merged:
            merged.append(dict(b))
            continue

        prev = merged[-1]
        y_overlap = max(0, min(prev["y"] + prev["h"], b["y"] + b["h"]) - max(prev["y"], b["y"]))
        min_h = min(prev["h"], b["h"])
        horizontal_gap = b["x"] - (prev["x"] + prev["w"])

        # Strictly enforce: horizontal gap <= 1.5x line height to prevent merging distant columns!
        max_allowed_gap = max(10, int(min_h * 1.5))
        is_same_line = (min_h > 0) and ((y_overlap / min_h) >= 0.40) and (-10 <= horizontal_gap <= max_allowed_gap)

        if is_same_line:
            # Merge b into prev
            prev["text"] = prev["text"].strip() + " " + b["text"].strip()
            new_x = min(prev["x"], b["x"])
            new_y = min(prev["y"], b["y"])
            prev["w"] = max(prev["x"] + prev["w"], b["x"] + b["w"]) - new_x
            prev["h"] = max(prev["y"] + prev["h"], b["y"] + b["h"]) - new_y
            prev["x"] = new_x
            prev["y"] = new_y
            # Inherit span info if available
            if "span_info" in b and "span_info" not in prev:
                prev["span_info"] = b["span_info"]
        else:
            merged.append(dict(b))

    return merged

def trim_to_tight_ink(cv_img: np.ndarray, x: int, y: int, w: int, h: int, med_bgr: np.ndarray) -> Tuple[int, int, int, int]:
    """
    Tight Ink Bounding Box: Trims top, bottom, left, and right borders of bbox
    until it tightly hugs the actual outermost ink pixels of the characters.
    Removes excess line-height/margins so the patch never bleeds into adjacent rows!
    """
    img_h, img_w = cv_img.shape[:2]
    bx = max(0, min(img_w - 1, x))
    by = max(0, min(img_h - 1, y))
    bw = max(1, min(img_w - bx, w))
    bh = max(1, min(img_h - by, h))

    roi = cv_img[by:by + bh, bx:bx + bw]
    if roi.size == 0 or bw < 4 or bh < 4:
        return bx, by, bw, bh

    # Euclidean distance from paper background to identify ink pixels
    diff = np.linalg.norm(roi.astype(float) - med_bgr.astype(float), axis=2)
    gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, otsu_thresh = cv2.threshold(gray_roi, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Ink mask
    is_ink = (diff > 30) | (otsu_thresh > 0)

    rows = np.where(np.any(is_ink, axis=1))[0]
    cols = np.where(np.any(is_ink, axis=0))[0]

    if len(rows) > 0 and len(cols) > 0:
        y_min = int(rows[0])
        y_max = int(rows[-1])
        x_min = int(cols[0])
        x_max = int(cols[-1])

        tight_w = max(6, x_max - x_min + 1)
        tight_h = max(6, y_max - y_min + 1)
        tight_x = bx + x_min
        tight_y = by + y_min

        return tight_x, tight_y, tight_w, tight_h

    return bx, by, bw, bh

def align_horizontal_baselines(blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Unifies fontSize, Y coordinate, and height for blocks sharing roughly the same
    baseline Y (e.g. ': 23 November 2026' and 'pukul 11:00 WIB' across columns).
    """
    if len(blocks) <= 1:
        return blocks

    n = len(blocks)
    visited = [False] * n

    for i in range(n):
        if visited[i]:
            continue
        group = [i]
        b1 = blocks[i]
        h1 = b1["bbox"]["height"]
        center1 = b1["bbox"]["y"] + h1 * 0.5

        for j in range(i + 1, n):
            if visited[j]:
                continue
            b2 = blocks[j]
            h2 = b2["bbox"]["height"]
            center2 = b2["bbox"]["y"] + h2 * 0.5
            avg_h = (h1 + h2) * 0.5

            # If vertical centers are within 32% of height and heights are reasonably similar
            if abs(center1 - center2) <= (avg_h * 0.32) and abs(h1 - h2) <= (avg_h * 0.38):
                group.append(j)

        if len(group) > 1:
            avg_y = round(sum(blocks[k]["bbox"]["y"] for k in group) / len(group), 3)
            avg_h = round(sum(blocks[k]["bbox"]["height"] for k in group) / len(group), 3)
            font_sizes = [blocks[k]["fontSize"] for k in group]
            common_font_size = int(round(float(np.median(font_sizes))))

            for k in group:
                visited[k] = True
                blocks[k]["bbox"]["y"] = avg_y
                blocks[k]["bbox"]["height"] = avg_h
                blocks[k]["fontSize"] = common_font_size

    return blocks

def analyze_block_typography_cv(
    cv_img: np.ndarray,
    x: int,
    y: int,
    w: int,
    h: int,
    text: str,
    span_info: Optional[Dict[str, Any]] = None,
    doc_ai_hint: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Classifies typography into 6 versatile categories with Google Fonts stacks.
    Detects fontWeight (400, 600, 700), fontStyle, letterSpacing, and fontFamily.
    """
    img_h, img_w = cv_img.shape[:2]
    clean_text = text.strip()
    char_count = max(1, len(re.sub(r"\s+", "", clean_text)))

    # A. Check vector PDF span info if present
    if span_info:
        font_raw = str(span_info.get("font", "")).lower()
        flags = int(span_info.get("flags", 0))

        is_italic = bool((flags & 2) or "italic" in font_raw or "oblique" in font_raw or "slanted" in font_raw)
        is_bold = bool((flags & 16) or "bold" in font_raw or "black" in font_raw or "heavy" in font_raw)
        is_serif = bool((flags & 4) or any(k in font_raw for k in ["times", "serif", "georgia", "cambria", "garamond", "minion", "merriweather", "lora"]))
        is_mono = bool((flags & 8) or any(k in font_raw for k in ["courier", "mono", "consolas", "typewriter", "menlo", "sourcecode"]))

        if is_mono:
            return {
                "fontCategory": "monospace",
                "fontFamily": "'Courier New', Courier, monospace",
                "isBold": is_bold,
                "fontWeight": 700 if is_bold else 400,
                "fontStyle": "italic" if is_italic else "normal",
                "letterSpacing": 0.5,
            }
        if any(k in font_raw for k in ["condensed", "narrow", "oswald", "barlow"]):
            return {
                "fontCategory": "condensed",
                "fontFamily": "'Oswald', sans-serif",
                "isBold": is_bold,
                "fontWeight": 700 if is_bold else 400,
                "fontStyle": "italic" if is_italic else "normal",
                "letterSpacing": 0.2,
            }
        if any(k in font_raw for k in ["slab", "arvo", "rokkitt", "rockwell", "clarendon"]):
            return {
                "fontCategory": "slab_serif",
                "fontFamily": "'Roboto Slab', serif",
                "isBold": is_bold,
                "fontWeight": 700 if is_bold else 400,
                "fontStyle": "italic" if is_italic else "normal",
                "letterSpacing": 0.0,
            }
        if any(k in font_raw for k in ["script", "hand", "brush", "caveat", "dancing", "cursive"]):
            return {
                "fontCategory": "script",
                "fontFamily": "'Caveat', cursive",
                "isBold": is_bold,
                "fontWeight": 700 if is_bold else 400,
                "fontStyle": "italic" if is_italic else "normal",
                "letterSpacing": 0.0,
            }
        if is_serif:
            return {
                "fontCategory": "formal_serif",
                "fontFamily": "'Times New Roman', Times, serif",
                "isBold": is_bold,
                "fontWeight": 700 if is_bold else 400,
                "fontStyle": "italic" if is_italic else "normal",
                "letterSpacing": 0.0,
            }

        return {
            "fontCategory": "modern_sans",
            "fontFamily": "Inter, Arial, sans-serif",
            "isBold": is_bold,
            "fontWeight": 700 if is_bold else 400,
            "fontStyle": "italic" if is_italic else "normal",
            "letterSpacing": 0.0,
        }

    # B. Computer Vision Heuristic on Document Scan ROI
    box_roi = cv_img[max(0, y):min(img_h, y + h), max(0, x):min(img_w, x + w)]
    if box_roi.size == 0:
        return {
            "fontCategory": "modern_sans",
            "fontFamily": "Inter, Arial, sans-serif",
            "isBold": False,
            "fontWeight": 400,
            "fontStyle": "normal",
            "letterSpacing": 0.0,
        }

    gray = cv2.cvtColor(box_roi, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    ink_pixels = cv2.countNonZero(thresh)
    total_pixels = max(1, box_roi.shape[0] * box_roi.shape[1])
    ink_density = ink_pixels / float(total_pixels)

    if ink_density >= 0.28:
        font_weight = 700
        is_bold = True
    elif ink_density >= 0.22:
        font_weight = 600
        is_bold = True
    else:
        font_weight = 400
        is_bold = False

    font_style = "normal"
    try:
        moments = cv2.moments(thresh)
        if moments["mu20"] > 0 and moments["mu02"] > 0:
            mu11 = moments["mu11"]
            mu20 = moments["mu20"]
            mu02 = moments["mu02"]
            theta = 0.5 * np.arctan2(2 * mu11, (mu20 - mu02))
            angle_deg = np.degrees(theta)
            if 11 <= abs(angle_deg) <= 35:
                font_style = "italic"
    except Exception:
        pass

    avg_char_w = float(w) / char_count
    aspect_ratio = float(h) / max(1.0, avg_char_w)

    # 1. Condensed / Narrow
    if aspect_ratio >= 2.0 and char_count >= 4:
        return {
            "fontCategory": "condensed",
            "fontFamily": "'Oswald', sans-serif",
            "isBold": is_bold,
            "fontWeight": font_weight,
            "fontStyle": font_style,
            "letterSpacing": 0.3,
        }

    # 2. Monospace / Typewriter
    has_monospace_pattern = bool(re.match(r"^[0-9\-\.\:\/\_A-Z\s]{5,}$", clean_text))
    if has_monospace_pattern and (0.9 <= aspect_ratio <= 1.6):
        return {
            "fontCategory": "monospace",
            "fontFamily": "'Courier New', Courier, monospace",
            "isBold": is_bold,
            "fontWeight": font_weight,
            "fontStyle": font_style,
            "letterSpacing": 0.8,
        }

    # 3. Script / Handwriting
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if char_count > 6 and len(contours) < (char_count * 0.45) and font_style == "italic":
        return {
            "fontCategory": "script",
            "fontFamily": "'Caveat', cursive",
            "isBold": is_bold,
            "fontWeight": font_weight,
            "fontStyle": font_style,
            "letterSpacing": 0.0,
        }

    # 4. Check Serifs via Sobel
    try:
        sobel_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        mean_gx = np.mean(np.abs(sobel_x))
        mean_gy = np.mean(np.abs(sobel_y))
        has_serif_caps = (mean_gy > 0) and ((mean_gx / mean_gy) > 1.25)
    except Exception:
        has_serif_caps = False

    if has_serif_caps and is_bold and ink_density > 0.26:
        return {
            "fontCategory": "slab_serif",
            "fontFamily": "'Roboto Slab', serif",
            "isBold": True,
            "fontWeight": 700,
            "fontStyle": font_style,
            "letterSpacing": 0.0,
        }

    if has_serif_caps:
        return {
            "fontCategory": "formal_serif",
            "fontFamily": "'Times New Roman', Times, serif",
            "isBold": is_bold,
            "fontWeight": font_weight,
            "fontStyle": font_style,
            "letterSpacing": 0.0,
        }

    if doc_ai_hint:
        prim_cat = doc_ai_hint.get("primaryCategory", "modern_sans")
        if prim_cat == "formal_serif":
            return {
                "fontCategory": "formal_serif",
                "fontFamily": "'Times New Roman', Times, serif",
                "isBold": is_bold,
                "fontWeight": font_weight,
                "fontStyle": font_style,
                "letterSpacing": 0.0,
            }
        elif prim_cat == "condensed":
            return {
                "fontCategory": "condensed",
                "fontFamily": "'Oswald', sans-serif",
                "isBold": is_bold,
                "fontWeight": font_weight,
                "fontStyle": font_style,
                "letterSpacing": 0.2,
            }
        elif prim_cat == "monospace":
            return {
                "fontCategory": "monospace",
                "fontFamily": "'Courier New', Courier, monospace",
                "isBold": is_bold,
                "fontWeight": font_weight,
                "fontStyle": font_style,
                "letterSpacing": 0.5,
            }

    return {
        "fontCategory": "modern_sans",
        "fontFamily": "Inter, Arial, sans-serif",
        "isBold": is_bold,
        "fontWeight": font_weight,
        "fontStyle": font_style,
        "letterSpacing": 0.0,
    }

def scan_document_for_editor(
    file_bytes: bytes,
    page_index: int = 0
) -> Dict[str, Any]:
    """
    High-precision Document Scanner for Interactive Canvas Editor.
    Analyzes document pages, performs tight ink bounding box trimming,
    samples authentic paper background pixel colors (localPaperColor),
    calibrates fontSize to 0.78 * tight_bbox_height for 1:1 physical glyph match,
    and unifies horizontal baselines across columns.
    """
    is_pdf = file_bytes.startswith(b"%PDF")
    
    if is_pdf:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)
        if total_pages == 0:
            raise ValueError("PDF document is empty.")
        
        page_index = max(0, min(page_index, total_pages - 1))
        page = doc[page_index]
        page_rect = page.rect
        page_width_pt = float(page_rect.width)
        page_height_pt = float(page_rect.height)

        zoom = 150.0 / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_w, img_h = pix.width, pix.height
        jpeg_bytes = pix.tobytes("jpeg")
    else:
        total_pages = 1
        page_index = 0
        nparr = np.frombuffer(file_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Invalid or corrupted image format.")
        
        img_h, img_w = img_bgr.shape[:2]
        page_width_pt = float(img_w)
        page_height_pt = float(img_h)
        zoom = 1.0
        _, enc = cv2.imencode(".jpg", img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
        jpeg_bytes = enc.tobytes()

    nparr = np.frombuffer(jpeg_bytes, np.uint8)
    cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if cv_img is None:
        raise ValueError("Failed to decode rendered document image.")

    doc_ai_hint = analyze_document_typography_ai(jpeg_bytes)

    raw_blocks: List[Dict[str, Any]] = []

    # 1. Primary: Extract blocks from PDF if vector text exists
    if is_pdf:
        try:
            page_dict = page.get_text("rawdict")
            for block in page_dict.get("blocks", []):
                if block.get("type") == 0:
                    for line in block.get("lines", []):
                        line_spans = line.get("spans", [])
                        if not line_spans:
                            continue
                        
                        # Separate spans on the same line if horizontal gap > 1.5x font size
                        # (e.g. keeping left letter-number and right date column independent)
                        span_groups = []
                        current_group = []
                        for s in line_spans:
                            if not current_group:
                                current_group.append(s)
                            else:
                                prev_s = current_group[-1]
                                prev_x1 = prev_s.get("bbox", (0, 0, 0, 0))[2]
                                next_x0 = s.get("bbox", (0, 0, 0, 0))[0]
                                f_size = max(8, prev_s.get("size", 12))
                                if (next_x0 - prev_x1) > 1.5 * f_size:
                                    span_groups.append(current_group)
                                    current_group = [s]
                                else:
                                    current_group.append(s)
                        if current_group:
                            span_groups.append(current_group)

                        for grp in span_groups:
                            grp_text = "".join(s.get("text", "") for s in grp).strip()
                            if grp_text:
                                min_bx0 = min(s.get("bbox", (0, 0, 0, 0))[0] for s in grp)
                                min_by0 = min(s.get("bbox", (0, 0, 0, 0))[1] for s in grp)
                                max_bx1 = max(s.get("bbox", (0, 0, 0, 0))[2] for s in grp)
                                max_by1 = max(s.get("bbox", (0, 0, 0, 0))[3] for s in grp)
                                bx0 = int(min_bx0 * zoom)
                                by0 = int(min_by0 * zoom)
                                bx1 = int(max_bx1 * zoom)
                                by1 = int(max_by1 * zoom)
                                bw = max(10, bx1 - bx0)
                                bh = max(10, by1 - by0)
                                raw_blocks.append({
                                    "text": grp_text,
                                    "x": max(0, bx0),
                                    "y": max(0, by0),
                                    "w": min(img_w - bx0, bw),
                                    "h": min(img_h - by0, bh),
                                    "span_info": grp[0]
                                })
        except Exception as e:
            print(f"[scan_editor PyMuPDF block extraction notice]: {e}")

    # 2. Secondary: If scanned document / screenshot with no vector text, use OCR
    if not raw_blocks:
        try:
            import easyocr
            reader = easyocr.Reader(['en', 'id'], gpu=False)
            ocr_results = reader.readtext(cv_img)
            for bbox, text, conf in ocr_results:
                clean_text = text.strip()
                if clean_text and conf > 0.15:
                    xs = [p[0] for p in bbox]
                    ys = [p[1] for p in bbox]
                    min_x, max_x = int(min(xs)), int(max(xs))
                    min_y, max_y = int(min(ys)), int(max(ys))
                    raw_blocks.append({
                        "text": clean_text,
                        "x": max(0, min_x),
                        "y": max(0, min_y),
                        "w": max(12, max_x - min_x),
                        "h": max(10, max_y - min_y),
                        "span_info": None
                    })
        except Exception as e:
            print(f"[scan_editor OCR notice]: {e}")

    # 3. Tertiary Fallback: OpenCV contour clustering
    if not raw_blocks:
        try:
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            thresh = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
            )
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (12, 3))
            dilated = cv2.dilate(thresh, kernel, iterations=1)
            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            for c in contours:
                cx, cy, cw, ch = cv2.boundingRect(c)
                if 25 < cw < img_w * 0.95 and 10 < ch < img_h * 0.25:
                    raw_blocks.append({
                        "text": "Teks Terdeteksi",
                        "x": cx,
                        "y": cy,
                        "w": cw,
                        "h": ch,
                        "span_info": None
                    })
        except Exception as e:
            print(f"[scan_editor contour notice]: {e}")

    # 4. Merge fragmented words with strict 1.5x font-height gap limit
    raw_blocks = merge_line_blocks(raw_blocks, img_w, img_h)

    if not raw_blocks:
        raw_blocks.append({
            "text": "Klik untuk mengedit teks dokumen",
            "x": int(img_w * 0.1),
            "y": int(img_h * 0.1),
            "w": int(img_w * 0.8),
            "h": int(img_h * 0.05),
            "span_info": None
        })

    blocks: List[Dict[str, Any]] = []

    for idx, rb in enumerate(raw_blocks):
        x, y, w, h = rb["x"], rb["y"], rb["w"], rb["h"]
        text = rb["text"]
        span_info = rb.get("span_info")

        # --- A. Authentic Paper Background Sampling (localPaperColor) ---
        # Strictly samples 2 pixels outside the edge of origBbox so the patch perfectly blends
        pad_gap = 2
        sample_depth = 4
        bg_samples = []

        # Top strip (2px to 6px above top edge)
        y_top_s, y_top_e = max(0, y - pad_gap - sample_depth), max(0, y - pad_gap)
        if y_top_e > y_top_s:
            strip = cv_img[y_top_s:y_top_e, max(0, x - pad_gap):min(img_w, x + w + pad_gap)]
            if strip.size > 0:
                bg_samples.append(strip.reshape(-1, 3))

        # Bottom strip (2px to 6px below bottom edge)
        y_bot_s, y_bot_e = min(img_h, y + h + pad_gap), min(img_h, y + h + pad_gap + sample_depth)
        if y_bot_e > y_bot_s:
            strip = cv_img[y_bot_s:y_bot_e, max(0, x - pad_gap):min(img_w, x + w + pad_gap)]
            if strip.size > 0:
                bg_samples.append(strip.reshape(-1, 3))

        # Left strip (2px to 6px left of left edge)
        x_l_s, x_l_e = max(0, x - pad_gap - sample_depth), max(0, x - pad_gap)
        if x_l_e > x_l_s:
            strip = cv_img[max(0, y):min(img_h, y + h), x_l_s:x_l_e]
            if strip.size > 0:
                bg_samples.append(strip.reshape(-1, 3))

        # Right strip (2px to 6px right of right edge)
        x_r_s, x_r_e = min(img_w, x + w + pad_gap), min(img_w, x + w + pad_gap + sample_depth)
        if x_r_e > x_r_s:
            strip = cv_img[max(0, y):min(img_h, y + h), x_r_s:x_r_e]
            if strip.size > 0:
                bg_samples.append(strip.reshape(-1, 3))

        if bg_samples:
            all_bg = np.concatenate(bg_samples, axis=0)
            brightness = np.mean(all_bg, axis=1)
            bright_thresh = np.percentile(brightness, 35)
            paper_pixels = all_bg[brightness >= bright_thresh]
            if paper_pixels.size > 0:
                med_bgr = np.median(paper_pixels, axis=0).astype(int)
            else:
                med_bgr = np.median(all_bg, axis=0).astype(int)

            r, g, b = int(med_bgr[2]), int(med_bgr[1]), int(med_bgr[0])
            bg_hex = f"#{r:02x}{g:02x}{b:02x}"
        else:
            med_bgr = np.array([255, 255, 255])
            bg_hex = "#fbfaf8"

        # --- B. Tight Ink Bounding Box Trimming ---
        # Trims excess blank space above/below letters to prevent bleeding across rows
        tight_x, tight_y, tight_w, tight_h = trim_to_tight_ink(cv_img, x, y, w, h, med_bgr)

        # --- C. Text Color Sampling ---
        box_roi = cv_img[tight_y:tight_y + tight_h, tight_x:tight_x + tight_w]
        if box_roi.size > 0:
            bgr_pixels = box_roi.reshape(-1, 3)
            diffs = np.linalg.norm(bgr_pixels.astype(float) - med_bgr.astype(float), axis=1)
            contrast_pixels = bgr_pixels[diffs > 36]

            if len(contrast_pixels) >= 5:
                text_bgr = np.median(contrast_pixels, axis=0).astype(int)
                text_hex = f"#{int(text_bgr[2]):02x}{int(text_bgr[1]):02x}{int(text_bgr[0]):02x}"
            else:
                darkest = bgr_pixels[np.argmin(np.mean(bgr_pixels, axis=1))]
                text_hex = f"#{int(darkest[2]):02x}{int(darkest[1]):02x}{int(darkest[0]):02x}"
        else:
            text_hex = "#111827"

        # --- D. Typography Analysis ---
        typo = analyze_block_typography_cv(
            cv_img, tight_x, tight_y, tight_w, tight_h, text,
            span_info=span_info,
            doc_ai_hint=doc_ai_hint
        )

        # --- E. Calibrate fontSize to 0.78 * tight_bbox_height ---
        # Matches actual physical letter ink height 1:1 instead of oversized CSS em-box
        line_count = max(1, text.count("\n") + 1)
        tight_h_pt = (tight_h / float(img_h)) * page_height_pt
        single_line_tight_pt = tight_h_pt / line_count
        calibrated_font_size = max(7, min(84, int(round(0.78 * single_line_tight_pt))))

        # Calculate bounding box in percentages [0..100%]
        pct_x = round((tight_x / float(img_w)) * 100, 3)
        pct_y = round((tight_y / float(img_h)) * 100, 3)
        pct_w = round((tight_w / float(img_w)) * 100, 3)
        pct_h = round((tight_h / float(img_h)) * 100, 3)

        blocks.append({
            "id": f"block-{idx + 1}",
            "text": text,
            "bbox": {
                "x": pct_x,
                "y": pct_y,
                "width": max(1.5, pct_w),
                "height": max(1.2, pct_h),
            },
            "bgColor": bg_hex,
            "textColor": text_hex,
            "fontSize": calibrated_font_size,
            "isBold": typo["isBold"],
            "fontWeight": typo.get("fontWeight", 400),
            "fontStyle": typo.get("fontStyle", "normal"),
            "letterSpacing": typo.get("letterSpacing", 0.0),
            "fontCategory": typo.get("fontCategory", "modern_sans"),
            "fontFamily": typo.get("fontFamily", "Inter, Arial, sans-serif"),
            "isModified": False,
            "isErased": False
        })

    # --- F. Horizontal Baseline & Y-Coordinate Snapping ---
    blocks = align_horizontal_baselines(blocks)

    b64_image = "data:image/jpeg;base64," + base64.b64encode(jpeg_bytes).decode("ascii")

    return {
        "pageIndex": page_index,
        "totalPages": total_pages,
        "pageWidth": page_width_pt,
        "pageHeight": page_height_pt,
        "pixelWidth": img_w,
        "pixelHeight": img_h,
        "image": b64_image,
        "blocks": blocks,
        "docTypography": doc_ai_hint
    }
