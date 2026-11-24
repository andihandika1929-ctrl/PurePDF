# backend/services/compress_service.py
import os
import io
import glob
import math
import shutil
import subprocess
import tempfile
from typing import Optional, List, Tuple

class GhostscriptNotFoundError(FileNotFoundError):
    """Raised when Ghostscript binary cannot be located on the system."""
    pass

def get_ghostscript_binary() -> Optional[str]:
    """
    Deteksi Ghostscript di Windows & Linux:
    1. GHOSTSCRIPT_PATH dari environment variable jika valid
    2. Cari binary 'gswin64c', 'gswin32c', 'gs' di PATH sistem
    3. Scan folder instalasi Windows menggunakan glob:
       - C:\\Program Files\\gs\\gs*\\bin\\gswin64c.exe
       - C:\\Program Files (x86)\\gs\\gs*\\bin\\gswin32c.exe
       - C:\\Program Files\\gs\\*\\bin\\gswin64c.exe
       - C:\\Program Files (x86)\\gs\\*\\bin\\gswin32c.exe
    """
    custom_path = os.getenv("GHOSTSCRIPT_PATH")
    if custom_path and os.path.isfile(custom_path):
        return custom_path

    # Cari di PATH lingkungan sistem
    candidates = ["gswin64c", "gswin32c", "gs", "ghostscript"]
    for name in candidates:
        found = shutil.which(name)
        if found and os.path.isfile(found):
            return found

    # Scan Windows standard install folders menggunakan glob
    if os.name == "nt":
        glob_patterns = [
            r"C:\Program Files\gs\gs*\bin\gswin64c.exe",
            r"C:\Program Files (x86)\gs\gs*\bin\gswin32c.exe",
            r"C:\Program Files\gs\*\bin\gswin64c.exe",
            r"C:\Program Files (x86)\gs\*\bin\gswin32c.exe",
            r"C:\Program Files\gs\*\bin\gswin32c.exe",
            r"C:\Program Files (x86)\gs\*\bin\gswin32c.exe",
        ]

        for pattern in glob_patterns:
            matches = glob.glob(pattern)
            if matches:
                matches.sort(reverse=True)
                for m in matches:
                    if os.path.isfile(m):
                        return m

    return None

def check_pdf_has_vector_text(pdf_bytes: bytes) -> bool:
    """
    Periksa apakah PDF memiliki teks vektor asli.
    Jika True, halaman DILARANG KERAS dirasterisasi agar teks tetap tajam 100%.
    """
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_text_len = 0
        for page in doc:
            total_text_len += len(page.get_text().strip())
            if total_text_len > 15:
                doc.close()
                return True
        doc.close()
        return False
    except Exception:
        return True

def cleanup_pdf_objects(pdf_bytes: bytes) -> bytes:
    """
    Pembersihan Objek & Metadata via PyMuPDF (fitz):
    Menjalankan doc.ez_save(..., garbage=4, deflate=True, clean=True)
    untuk membuang font duplikat, metadata tersembunyi, dan objek tak terpakai.
    """
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        out_buf = io.BytesIO()
        doc.ez_save(out_buf, garbage=4, deflate=True, clean=True)
        doc.close()
        res = out_buf.getvalue()
        if len(res) < len(pdf_bytes):
            return res
        return pdf_bytes
    except Exception as e:
        print(f"[PyMuPDF cleanup error]: {e}")
        return pdf_bytes

def pymupdf_safe_reencode_images(pdf_bytes: bytes, target_bytes: int) -> bytes:
    """
    Pembersihan & Re-encode Gambar Aman via PyMuPDF (fitz) + Pillow:
    Jika gambar memiliki smask / transparansi, gabungkan (composite) dulu di atas
    background putih (RGB) sebelum disimpan ulang sebagai JPEG terkompresi,
    lalu perbarui gambar via page.replace_image(xref, stream=...).
    Dengan cara ini:
    - Teks vektor tetap 100% tajam.
    - Gambar ber-transparansi TIDAK PERNAH menjadi kotak hitam.
    - Ukuran file turun di bawah target_bytes.
    """
    try:
        import fitz
        from PIL import Image
    except ImportError:
        return pdf_bytes

    # Profil kompresi gambar bertingkat
    profiles = [
        {"quality": 65, "max_dim": 1200},
        {"quality": 50, "max_dim": 900},
        {"quality": 40, "max_dim": 700},
        {"quality": 30, "max_dim": 500},
        {"quality": 20, "max_dim": 350},
    ]

    current_data = pdf_bytes

    for prof in profiles:
        try:
            doc = fitz.open(stream=current_data, filetype="pdf")
            processed_xrefs = set()
            modified = False

            for pno in range(len(doc)):
                page = doc[pno]
                images = page.get_images(full=True)

                for img_info in images:
                    xref = img_info[0]
                    smask = img_info[1]
                    if xref in processed_xrefs:
                        continue
                    processed_xrefs.add(xref)

                    try:
                        pix = fitz.Pixmap(doc, xref)

                        # Penanganan Transparansi / SMask
                        if smask > 0:
                            try:
                                mask_pix = fitz.Pixmap(doc, smask)
                                rgba_pix = fitz.Pixmap(pix, mask_pix)
                                pil_img = Image.open(io.BytesIO(rgba_pix.tobytes("png"))).convert("RGBA")
                            except Exception:
                                pil_img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
                        elif pix.alpha:
                            pil_img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
                        else:
                            try:
                                pil_img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
                            except Exception:
                                pil_img = Image.open(io.BytesIO(pix.tobytes("jpeg"))).convert("RGB")

                        # Gabungkan transparansi ke latar putih bersih (RGB) agar tidak hitam
                        if pil_img.mode in ("RGBA", "LA") or (pil_img.mode == "P" and "transparency" in pil_img.info):
                            pil_img = pil_img.convert("RGBA")
                            bg = Image.new("RGB", pil_img.size, (255, 255, 255))
                            bg.paste(pil_img, mask=pil_img.split()[3])
                            pil_img = bg
                        elif pil_img.mode != "RGB":
                            pil_img = pil_img.convert("RGB")

                        # Resize jika dimensi melebihi batas profil
                        max_d = prof["max_dim"]
                        if pil_img.width > max_d or pil_img.height > max_d:
                            scale = min(max_d / pil_img.width, max_d / pil_img.height)
                            new_w = max(32, int(pil_img.width * scale))
                            new_h = max(32, int(pil_img.height * scale))
                            pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

                        # Simpan sebagai JPEG berkualitas terkompresi
                        jpeg_buf = io.BytesIO()
                        pil_img.save(jpeg_buf, format="JPEG", quality=prof["quality"], optimize=True)
                        jpeg_bytes = jpeg_buf.getvalue()

                        # Ganti gambar di dalam PDF via replace_image
                        if hasattr(page, "replace_image"):
                            page.replace_image(xref, stream=jpeg_bytes)
                        else:
                            doc.update_stream(xref, jpeg_bytes)
                        modified = True
                    except Exception as e:
                        pass

            if modified:
                out_buf = io.BytesIO()
                doc.ez_save(out_buf, garbage=4, deflate=True, clean=True)
                doc.close()

                new_bytes = out_buf.getvalue()
                if len(new_bytes) < len(current_data):
                    current_data = new_bytes

                # Jika sudah di bawah target_bytes, langsung selesai!
                if len(current_data) <= target_bytes:
                    return current_data
            else:
                doc.close()

        except Exception as e:
            print(f"[PyMuPDF safe re-encode error]: {e}")

    return current_data

def pymupdf_scan_only_compress(pdf_bytes: bytes, target_bytes: int) -> bytes:
    """
    Rasterisasi halaman KHUSUS untuk PDF yang MURNI hasil scan gambar (0 teks vektor).
    Menggunakan MINIMAL 150 DPI agar teks pada scan tetap tajam dan terbaca jelas.
    """
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)
        if page_count == 0:
            doc.close()
            return pdf_bytes

        min_scale = 150.0 / 72.0  # 150 DPI minimum
        qualities = [65, 55, 45, 35, 25]
        best_output = None

        for q in qualities:
            out_doc = fitz.open()
            for page in doc:
                rect = page.rect
                pix = page.get_pixmap(matrix=fitz.Matrix(min_scale, min_scale), alpha=False)
                img_bytes = pix.tobytes("jpeg", jpg_quality=q)
                new_page = out_doc.new_page(width=rect.width, height=rect.height)
                new_page.insert_image(rect, stream=img_bytes)

            out_buf = io.BytesIO()
            out_doc.ez_save(out_buf, garbage=4, deflate=True, clean=True)
            out_doc.close()

            rendered_pdf = out_buf.getvalue()
            best_output = rendered_pdf

            if len(rendered_pdf) <= target_bytes:
                doc.close()
                return rendered_pdf

        doc.close()
        return best_output or pdf_bytes
    except Exception as e:
        print(f"[PyMuPDF scan rasterize error]: {e}")
        return pdf_bytes

def compress_pdf_to_target(input_bytes: bytes, target_kb: int = 100) -> bytes:
    """
    Strategi Kompresi Vector-Safe & Anti-Black-Box:
    1. Cek apakah dokumen memiliki teks vektor asli.
       - Jika YA: DILARANG KERAS merasterisasi halaman teks menjadi JPEG.
       - Jika TIDAK (Murni scan foto): Boleh merender halaman dengan MINIMAL 150 DPI.
    2. Jalankan PyMuPDF ez_save pre-cleaning (buang font duplikat & metadata tak terpakai).
    3. Jalankan Ghostscript secara iteratif dengan:
       - -dAutoFilterColorImages=true & -dAutoFilterGrayImages=true (Hapus paksaan DCTEncode)
       - -dCompatibilityLevel=1.4 agar transparansi/SMask diratakan dengan bersih tanpa hitam
       - Resolusi bertahap: 144 -> 110 -> 85 -> 72 -> 55 -> 40 DPI
       - -dSubsetFonts=true -dCompressFonts=true -dEmbedAllFonts=true
    4. Post-cleaning via PyMuPDF ez_save setelah setiap pass.
    5. Jika ukuran file hasil <= target_bytes, berhenti dan kembalikan file tersebut.
    6. Jika setelah pass Ghostscript terendah ukuran masih > target_bytes (misal 111 KB):
       - Dokumen Vektor: Jalankan pymupdf_safe_reencode_images() dengan compositing transparansi
         ke latar putih (RGB) via Pillow dan page.replace_image().
       - Dokumen Scan Murni: Gunakan pymupdf_scan_only_compress (>= 150 DPI).
    """
    target_bytes = int(target_kb * 0.98 * 1024)

    # 1. Cek keberadaan teks vektor
    has_vector_text = check_pdf_has_vector_text(input_bytes)

    # 2. Pre-cleaning metadata & duplicate objects
    current_bytes = cleanup_pdf_objects(input_bytes)
    if len(current_bytes) <= target_bytes:
        return current_bytes

    # 3. Deteksi Ghostscript
    gs_bin = get_ghostscript_binary()
    if not gs_bin:
        raise GhostscriptNotFoundError(
            "Ghostscript binary tidak ditemukan di sistem Windows. "
            "Pastikan binary 'gswin64c', 'gswin32c', atau 'gs' terpasang di 'C:\\Program Files\\gs\\gs*\\bin\\gswin64c.exe' "
            "atau tercantum dalam PATH, atau atur GHOSTSCRIPT_PATH di file .env."
        )

    # Profil Ghostscript bertingkat (144 -> 110 -> 85 -> 72 -> 55 -> 40 DPI)
    gs_profiles = [
        {"res": 144},
        {"res": 110},
        {"res": 85},
        {"res": 72},
        {"res": 55},
        {"res": 40},
    ]

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as in_f:
        in_f.write(current_bytes)
        in_f.flush()
        in_path = in_f.name

    out_path = in_path + ".compressed.pdf"
    best_output = current_bytes

    try:
        for profile in gs_profiles:
            cmd = [
                gs_bin,
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                "-dNOPAUSE",
                "-dQUIET",
                "-dBATCH",
                # Safe auto-filtering: biarkan Ghostscript mengelola encoding secara aman
                "-dAutoFilterColorImages=true",
                "-dAutoFilterGrayImages=true",
                "-dDownsampleColorImages=true",
                "-dColorImageDownsampleType=/Bicubic",
                f"-dColorImageResolution={profile['res']}",
                "-dDownsampleGrayImages=true",
                "-dGrayImageDownsampleType=/Bicubic",
                f"-dGrayImageResolution={profile['res']}",
                "-dDownsampleMonoImages=true",
                "-dMonoImageDownsampleType=/Bicubic",
                f"-dMonoImageResolution={profile['res']}",
                # Pertahankan font & teks vektor 100% tajam
                "-dSubsetFonts=true",
                "-dCompressFonts=true",
                "-dEmbedAllFonts=true",
                "-dFastWebView=true",
                f"-sOutputFile={out_path}",
                in_path,
            ]

            result = subprocess.run(cmd, capture_output=True, timeout=35)
            if result.returncode == 0 and os.path.exists(out_path):
                with open(out_path, "rb") as out_f:
                    gs_data = out_f.read()

                # Jalankan PyMuPDF ez_save untuk membuang font duplikat dan metadata tersembunyi
                cleaned_gs = cleanup_pdf_objects(gs_data)
                best_output = cleaned_gs

                # Jika ukuran sudah memenuhi target, segera kembalikan
                if len(cleaned_gs) <= target_bytes:
                    return cleaned_gs

    except Exception as e:
        print(f"[Ghostscript compression error]: {e}")
    finally:
        if os.path.exists(in_path):
            try:
                os.remove(in_path)
            except Exception:
                pass
        if os.path.exists(out_path):
            try:
                os.remove(out_path)
            except Exception:
                pass

    # 4. Jika ukuran masih di atas target setelah pass Ghostscript terendah (misal 111 KB):
    if has_vector_text:
        # DOKUMEN VEKTOR: Re-encode gambar aman dengan Pillow white-compositing & page.replace_image
        safe_reencoded = pymupdf_safe_reencode_images(best_output, target_bytes)
        return safe_reencoded
    else:
        # DOKUMEN SCAN MURNI (0 teks vektor):
        # Gunakan rasterisasi halaman dengan MINIMAL 150 DPI agar teks scan tetap tajam
        scan_compressed = pymupdf_scan_only_compress(best_output, target_bytes)
        return scan_compressed
