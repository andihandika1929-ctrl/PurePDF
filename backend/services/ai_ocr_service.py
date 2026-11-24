# backend/services/ai_ocr_service.py
import io
import json
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[Gemini client init error]: {e}")
        return None

def generate_gemini_content(client, contents):
    """
    Generate content with Gemini model, prioritizing gemini-2.5-flash
    and gracefully falling back to gemini-3.5-flash / gemini-3.8-flash / gemini-2.5-flash-lite
    if a model is unavailable or deprecated by Google.
    """
    models = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash-lite"]
    last_err = None
    for model_name in models:
        try:
            return client.models.generate_content(model=model_name, contents=contents)
        except Exception as e:
            last_err = e
            err_str = str(e).lower()
            if "not_found" in err_str or "unavailable" in err_str or "no longer available" in err_str or "503" in err_str or "404" in err_str:
                continue
            raise e
    if last_err:
        print(f"[Gemini generation fallback notice]: {last_err}")
    return None

def detect_text_regions(image_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Detect text bounding boxes in document scans/screenshots using EasyOCR / OpenCV
    with optional Gemini 2.5 Flash assistance.
    """
    regions = []

    # 1. Try EasyOCR / OpenCV
    try:
        import numpy as np
        import cv2

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is not None:
            h, w = img.shape[:2]

            try:
                import easyocr
                reader = easyocr.Reader(['en', 'id'], gpu=False)
                results = reader.readtext(img)

                for bbox, text, conf in results:
                    x_coords = [p[0] for p in bbox]
                    y_coords = [p[1] for p in bbox]
                    min_x, max_x = int(min(x_coords)), int(max(x_coords))
                    min_y, max_y = int(min(y_coords)), int(max(y_coords))

                    regions.append({
                        "text": text,
                        "confidence": float(conf),
                        "box": {
                            "x": min_x,
                            "y": min_y,
                            "w": max_x - min_x,
                            "h": max_y - min_y
                        }
                    })
            except Exception:
                # Fallback: adaptive threshold contour detection
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                for c in contours:
                    x, y, bw, bh = cv2.boundingRect(c)
                    if 20 < bw < w * 0.9 and 10 < bh < h * 0.2:
                        regions.append({
                            "text": "Detected Text",
                            "confidence": 0.9,
                            "box": {"x": x, "y": y, "w": bw, "h": bh}
                        })
    except Exception as e:
        print(f"[OCR detection error]: {e}")

    # 2. If Gemini 2.5 Flash client is active and no regions found, transcribe via Gemini
    if not regions:
        client = get_gemini_client()
        if client:
            try:
                from google.genai import types
                prompt = (
                    "Detect the main text blocks in this document image. "
                    "Return ONLY a JSON list of objects with keys 'text', 'box' (with x, y, w, h in pixels approx)."
                )
                response = generate_gemini_content(
                    client=client,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        prompt
                    ]
                )
                if response and response.text:
                    cleaned = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                    parsed = json.loads(cleaned)
                    if isinstance(parsed, list):
                        regions = parsed
            except Exception as e:
                print(f"[Gemini OCR assist error]: {e}")

    return regions

def inpaint_text_regions(image_bytes: bytes, boxes: List[Dict[str, int]]) -> bytes:
    """
    Seamlessly erase text regions inside image/scanned PDF using OpenCV Telea Inpainting.
    Restores the underlying paper texture and background color.
    """
    try:
        import numpy as np
        import cv2

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        mask = np.zeros(img.shape[:2], dtype=np.uint8)

        for b in boxes:
            x, y, w, h = b.get("x", 0), b.get("y", 0), b.get("w", 0), b.get("h", 0)
            pad = 2
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img.shape[1], x + w + pad)
            y2 = min(img.shape[0], y + h + pad)
            cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)

        # Telea inpainting algorithm
        inpainted = cv2.inpaint(img, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

        _, enc_bytes = cv2.imencode(".jpg", inpainted, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        return enc_bytes.tobytes()

    except Exception as e:
        print(f"[Inpainting error]: {e}")
        return image_bytes

def neural_font_match(image_bytes: bytes, text_snippet: str) -> Dict[str, Any]:
    """
    Analyze typography, font family, color, and size using Google Gemini 2.5 Flash.
    """
    client = get_gemini_client()
    if not client:
        return {
            "fontFamily": "Inter, Arial, sans-serif",
            "fontSize": 12,
            "color": "#111827",
            "backgroundColor": "#FFFFFF",
            "provider": "default_rules"
        }

    try:
        from google.genai import types
        prompt = (
            f"Analyze the typography for the text snippet: '{text_snippet}' in this image. "
            "Return ONLY a JSON object with keys: fontFamily (string, e.g. 'Arial, sans-serif'), "
            "fontSize (integer in pt), color (hex string like '#000000'), "
            "backgroundColor (hex string like '#ffffff'), fontWeight (string: 'normal' or 'bold')."
        )
        response = generate_gemini_content(
            client=client,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt
            ]
        )
        if response and response.text:
            cleaned = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(cleaned)
            data["provider"] = "gemini-2.5-flash"
            return data
    except Exception as e:
        print(f"[Gemini 2.5 Flash font match error]: {e}")

    return {
        "fontFamily": "Arial, sans-serif",
        "fontSize": 12,
        "color": "#000000",
        "backgroundColor": "#FFFFFF",
        "provider": "fallback"
    }

def process_scanned_pdf_ai_edit(
    input_bytes: bytes,
    boxes: Optional[List[Dict[str, int]]] = None,
    instruction: str = ""
) -> bytes:
    """
    Comprehensive AI Edit for Scanned & Screenshot PDF using PyMuPDF, OpenCV, and Gemini 2.5 Flash.
    Renders pages, in-paints targeted text areas, and embeds clean pages into an updated PDF.
    """
    import fitz

    boxes = boxes or []

    try:
        # Check if input is a valid PDF
        doc = fitz.open(stream=input_bytes, filetype="pdf")
        out_doc = fitz.open()

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("jpeg")

            # Determine boxes for this page
            page_boxes = boxes if page_idx == 0 or len(boxes) > 0 else []
            if not page_boxes:
                # If no boxes provided, auto-detect top text regions
                page_boxes = [r["box"] for r in detect_text_regions(img_bytes)[:5]]

            inpainted_bytes = inpaint_text_regions(img_bytes, page_boxes)

            # Create clean output page with inpainted image
            img_doc = fitz.open(stream=inpainted_bytes, filetype="jpeg")
            rect = page.rect
            out_page = out_doc.new_page(width=rect.width, height=rect.height)
            out_page.insert_image(rect, stream=inpainted_bytes)

        out_buffer = io.BytesIO()
        out_doc.save(out_buffer, deflate=True)
        out_doc.close()
        doc.close()

        return out_buffer.getvalue()

    except Exception as e:
        print(f"[process_scanned_pdf_ai_edit error]: {e}")
        # If input was a raw image (PNG/JPEG) instead of PDF:
        try:
            inpainted = inpaint_text_regions(input_bytes, boxes)
            # Wrap image in a PDF page
            doc = fitz.open()
            img_doc = fitz.open(stream=inpainted, filetype="jpeg")
            rect = img_doc[0].rect
            page = doc.new_page(width=rect.width, height=rect.height)
            page.insert_image(rect, stream=inpainted)
            out_buf = io.BytesIO()
            doc.save(out_buf, deflate=True)
            doc.close()
            return out_buf.getvalue()
        except Exception as e2:
            print(f"[Image to PDF fallback error]: {e2}")
            return input_bytes
