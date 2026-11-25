# backend/main.py
import json
import os
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from dotenv import load_dotenv

from services.auth_service import verify_supabase_jwt, consume_ai_quota_server
from services.compress_service import (
    compress_pdf_to_target,
    get_ghostscript_binary,
    GhostscriptNotFoundError,
)
from services.unlock_service import force_unlock_pdf
from services.word_service import convert_pdf_to_word_docx
from services.ai_ocr_service import (
    detect_text_regions,
    inpaint_text_regions,
    neural_font_match,
    process_scanned_pdf_ai_edit,
)
from services.scan_editor_service import scan_document_for_editor

load_dotenv()

app = FastAPI(
    title="PurePDF PRO AI Backend Engine",
    description="Python FastAPI backend powering PurePDF's 5 Neural PRO AI tools: Ghostscript <100KB/<200KB compression, PyMuPDF force unlock, pdf2docx conversion, and OpenCV/Gemini inpainting.",
    version="1.0.0",
)

# Strict CORS whitelist from CORS_ORIGINS env (never wildcard '*' with credentials)
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "https://purepdf-seven.vercel.app,http://localhost:3000,http://127.0.0.1:3000",
)
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip() and origin.strip() != "*"]

# Hard file-size limit to protect Render Free Tier (512MB RAM) from OOM crashes
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "25"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024


async def read_upload_with_limit(upload: UploadFile, max_bytes: int = MAX_UPLOAD_BYTES) -> bytes:
    """Stream-read an uploaded file with a strict byte ceiling to prevent OOM."""
    chunks = []
    total = 0
    while True:
        chunk = await upload.read(1024 * 1024)  # 1 MB chunks
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds the {MAX_UPLOAD_MB} MB server limit. Please compress or split it first.",
            )
        chunks.append(chunk)
    return b"".join(chunks)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "PurePDF PRO AI Backend",
        "version": "1.0.0",
        "zeroStorage": "Strict zero-file-storage policy enforced (all operations run in RAM buffer)",
    }

@app.post("/api/compress-target")
async def api_compress_target(
    file: UploadFile = File(...),
    target_kb: int = Form(100),
    current_user: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """
    Compress PDF to strictly under target_kb (100KB or 200KB) using Ghostscript
    with iterative target-size loop and PyMuPDF hard-cap fallback.
    """
    # 1. Deteksi Ghostscript di Windows: kembalikan HTTP 500 dengan pesan jelas jika tidak ditemukan
    gs_bin = get_ghostscript_binary()
    if not gs_bin:
        raise HTTPException(
            status_code=500,
            detail=(
                "Ghostscript binary tidak ditemukan di sistem Windows. "
                "Pastikan binary 'gswin64c', 'gswin32c', atau 'gs' terpasang di 'C:\\Program Files\\gs\\gs*\\bin\\gswin64c.exe' "
                "atau tercantum dalam PATH, atau atur GHOSTSCRIPT_PATH di file .env."
            ),
        )

    try:
        content = await read_upload_with_limit(file)
        compressed_bytes = compress_pdf_to_target(content, target_kb=target_kb)

        filename = file.filename or "document.pdf"
        out_name = f"{os.path.splitext(filename)[0]}_{target_kb}kb.pdf"

        return Response(
            content=compressed_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
        )
    except GhostscriptNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/force-unlock")
async def api_force_unlock(
    file: UploadFile = File(...),
    password: Optional[str] = Form(""),
    current_user: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """
    Remove owner security permissions, printing locks, and copy restrictions.
    """
    await consume_ai_quota_server(current_user["id"], cost=2)
    try:
        content = await read_upload_with_limit(file)
        unlocked_bytes = force_unlock_pdf(content, password=password)

        filename = file.filename or "document.pdf"
        out_name = f"{os.path.splitext(filename)[0]}_unlocked.pdf"

        return Response(
            content=unlocked_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf-to-word")
async def api_pdf_to_word(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """
    High-accuracy DOCX conversion reconstructing tables and complex paragraph layouts.
    """
    await consume_ai_quota_server(current_user["id"], cost=2)
    try:
        content = await read_upload_with_limit(file)
        docx_bytes = convert_pdf_to_word_docx(content)

        filename = file.filename or "document.pdf"
        out_name = f"{os.path.splitext(filename)[0]}.docx"

        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Word conversion failed: {str(e)}")

@app.post("/api/ocr-detect")
async def api_ocr_detect(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """
    Detect text bounding boxes and line coordinates in scanned documents.
    """
    try:
        content = await read_upload_with_limit(file)
        regions = detect_text_regions(content)
        return {"success": True, "regions": regions, "count": len(regions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/inpaint")
async def api_inpaint(
    file: UploadFile = File(...),
    boxes: str = Form("[]"),
    current_user: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """
    Erase text inside image/scanned PDF using OpenCV Telea Inpainting algorithm.
    """
    try:
        content = await read_upload_with_limit(file)
        box_list = json.loads(boxes)
        inpainted_bytes = inpaint_text_regions(content, box_list)

        return Response(
            content=inpainted_bytes,
            media_type="image/jpeg",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/font-match")
async def api_font_match(
    file: UploadFile = File(...),
    text: str = Form("Sample"),
    current_user: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """
    Match font family, size, and background color using Google Gemini Vision API.
    """
    try:
        content = await read_upload_with_limit(file)
        match_info = neural_font_match(content, text)
        return {"success": True, "typography": match_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-edit-scanned")
async def api_ai_edit_scanned(
    file: UploadFile = File(...),
    boxes: Optional[str] = Form("[]"),
    instruction: Optional[str] = Form(""),
    current_user: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """
    AI Edit Scanned & Screenshot PDF using Google Gemini 2.5 Flash and OpenCV Inpainting.
    Erases designated or auto-detected scan text, in-paints clean background texture, and exports clean PDF.
    """
    await consume_ai_quota_server(current_user["id"], cost=2)
    try:
        content = await read_upload_with_limit(file)
        box_list = []
        if boxes:
            try:
                box_list = json.loads(boxes)
            except Exception:
                box_list = []

        result_pdf_bytes = process_scanned_pdf_ai_edit(
            content,
            boxes=box_list,
            instruction=instruction or "",
        )

        filename = file.filename or "document.pdf"
        out_name = f"{os.path.splitext(filename)[0]}_ai_edited.pdf"

        return Response(
            content=result_pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{out_name}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Scanned Edit failed: {str(e)}")

@app.post("/api/ai/scan-editor")
async def api_scan_editor(
    file: UploadFile = File(...),
    page_index: int = Form(0),
    current_user: Dict[str, Any] = Depends(verify_supabase_jwt),
):
    """
    Scan document page for Interactive Canvas Editor.
    Returns page dimensions, rendered base64 image, and precision-detected text blocks
    with sampled authentic bgColor, textColor, fontSize, and percentage bounding boxes.
    """
    try:
        content = await read_upload_with_limit(file)
        data = scan_document_for_editor(content, page_index=page_index)
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan editor failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    print(f"Starting PurePDF PRO AI Backend on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
