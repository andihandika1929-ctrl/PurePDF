// frontend/src/lib/apiClient.ts
import { getSupabase } from './supabaseClient';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  if (!supabase) return {};
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

export async function checkBackendHealth(): Promise<{
  online: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { online: true, version: data.version };
  } catch (err: any) {
    return {
      online: false,
      error: 'Backend Python FastAPI is offline at ' + BACKEND_URL,
    };
  }
}

async function parseBackendError(res: Response, fallback: string): Promise<Error> {
  let message = fallback;
  try {
    const text = await res.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.detail === 'string' && parsed.detail.trim()) {
          message = parsed.detail.trim();
        } else if (typeof parsed?.error === 'string' && parsed.error.trim()) {
          message = parsed.error.trim();
        }
      } catch {
        // Avoid dumping raw HTML error pages from Render/proxies
        if (!text.trim().startsWith('<') && text.length < 220) {
          message = text.trim();
        }
      }
    }
  } catch {}

  const err: any = new Error(message);
  err.status = res.status;
  return err;
}

export async function apiCompressTarget(file: File, targetKb: number): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_kb', String(targetKb));

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/compress-target`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    throw await parseBackendError(res, `Compression failed (HTTP ${res.status}).`);
  }

  return await res.blob();
}

export async function apiForceUnlock(file: File, password = ''): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/force-unlock`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    throw await parseBackendError(res, `Force unlock failed (HTTP ${res.status}).`);
  }

  return await res.blob();
}

export async function apiPdfToWord(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/pdf-to-word`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    throw await parseBackendError(res, `High-accuracy Word conversion failed (HTTP ${res.status}).`);
  }

  return await res.blob();
}

export async function apiAiEditScanned(
  file: File,
  boxes: any[] = [],
  instruction = ''
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('boxes', JSON.stringify(boxes));
  if (instruction) formData.append('instruction', instruction);

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/ai-edit-scanned`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    throw await parseBackendError(res, `AI Edit Scanned failed (HTTP ${res.status}).`);
  }

  return await res.blob();
}

export async function apiOcrDetect(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/ocr-detect`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    throw await parseBackendError(res, `OCR detection failed (HTTP ${res.status}).`);
  }

  return await res.json();
}

export async function apiInpaint(file: File, boxes: any[]): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('boxes', JSON.stringify(boxes));

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/inpaint`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    throw await parseBackendError(res, `Neural inpainting failed (HTTP ${res.status}).`);
  }

  return await res.blob();
}

export interface ScanEditorBlock {
  id: string;
  text: string;
  bbox: {
    x: number;      // percentage [0..100]
    y: number;      // percentage [0..100]
    width: number;  // percentage [0..100]
    height: number; // percentage [0..100]
  };
  bgColor: string;     // sampled natural paper background hex, e.g. #faf7f2
  textColor: string;   // sampled font hex, e.g. #111827
  fontSize: number;    // estimated pt size
  isBold: boolean;
  fontWeight?: number; // 400, 600, 700
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number; // letter spacing in px
  fontCategory?: 'formal_serif' | 'modern_sans' | 'condensed' | 'monospace' | 'slab_serif' | 'script' | string;
  fontFamily: string;
  isUnderline?: boolean; // underline detection from backend / toggled by user
  isModified?: boolean;
  isDeleted?: boolean;
  isErased?: boolean;
}

export interface ScanEditorResponse {
  pageIndex: number;
  totalPages: number;
  pageWidth: number;
  pageHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  image: string;       // base64 data:image/jpeg;base64,...
  blocks: ScanEditorBlock[];
}

export async function apiScanEditor(
  file: File,
  pageIndex: number = 0
): Promise<ScanEditorResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('page_index', String(pageIndex));

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/ai/scan-editor`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Failed to scan document: HTTP ${res.status}`);
  }

  return await res.json();
}
