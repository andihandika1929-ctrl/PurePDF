# backend/services/unlock_service.py
import io
import os
import shutil
import subprocess
import tempfile
from typing import Optional

def force_unlock_pdf(input_bytes: bytes, password: Optional[str] = "") -> bytes:
    """
    Remove owner security, print locks, form-editing prohibitions, and copy locks.
    If document is user-password locked, decrypts using provided password.
    Uses PyMuPDF (fitz) or qpdf.
    """
    # Try QPDF if installed
    qpdf_bin = shutil.which("qpdf")
    if qpdf_bin:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as in_f:
            in_f.write(input_bytes)
            in_f.flush()
            in_path = in_f.name

        out_path = in_path + ".unlocked.pdf"

        try:
            cmd = [qpdf_bin]
            if password:
                cmd.extend([f"--password={password}"])
            cmd.extend(["--decrypt", in_path, out_path])

            res = subprocess.run(cmd, capture_output=True, timeout=20)
            if res.returncode == 0 and os.path.exists(out_path):
                with open(out_path, "rb") as out_f:
                    data = out_f.read()
                return data
        except Exception as e:
            print(f"[QPDF unlock error]: {e}")
        finally:
            if os.path.exists(in_path):
                os.remove(in_path)
            if os.path.exists(out_path):
                os.remove(out_path)

    # Native PyMuPDF fitz unlock
    try:
        import fitz

        doc = fitz.open(stream=input_bytes, filetype="pdf")

        if doc.is_encrypted:
            if password:
                auth_res = doc.authenticate(password)
                if not auth_res:
                    print("[PyMuPDF]: Password failed, attempting owner permission strip...")
            else:
                # Attempt empty password authentication to strip owner restrictions
                doc.authenticate("")

        out_buffer = io.BytesIO()
        # Save completely free of encryption and restrictions
        doc.save(out_buffer, encryption=fitz.PDF_ENCRYPT_NONE, deflate=True)
        doc.close()

        return out_buffer.getvalue()
    except Exception as e:
        print(f"[PyMuPDF unlock error]: {e}")
        return input_bytes
