// frontend/src/lib/apiClient.ts
import { getSupabase } from './supabaseClient';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000';

async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const supabase = getSupabase();
  if (!supabase) return {};
  try {
    let session = null as any;
    if (!forceRefresh) {
      const { data } = await supabase.auth.getSession();
      session = data?.session || null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const isExpiringSoon =
      !session?.access_token ||
      (typeof session?.expires_at === 'number' && session.expires_at - nowSec < 60);

    if (forceRefresh || isExpiringSoon) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session?.access_token) {
        session = refreshed.session;
      }
    }

    const token = session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

async function fetchWithAuthRetry(
  url: string,
  buildBody: () => FormData
): Promise<Response> {
  const headers = await getAuthHeaders(false);
  let res = await fetch(url, {
    method: 'POST',
    headers,
    body: buildBody(),
  });

  if (res.status === 401) {
    const refreshedHeaders = await getAuthHeaders(true);
    if (refreshedHeaders.Authorization && refreshedHeaders.Authorization !== headers.Authorization) {
      res = await fetch(url, {
        method: 'POST',
        headers: refreshedHeaders,
        body: buildBody(),
      });
    }
  }

  return res;
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
  const res = await fetchWithAuthRetry(`${BACKEND_URL}/api/compress-target`, () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_kb', String(targetKb));
    return formData;
  });

  if (!res.ok) {
    throw await parseBackendError(res, `Compression failed (HTTP ${res.status}).`);
  }

  return await res.blob();
}

export async function apiForceUnlock(file: File, password = ''): Promise<Blob> {
  const res = await fetchWithAuthRetry(`${BACKEND_URL}/api/force-unlock`, () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    return formData;
  });

  if (!res.ok) {
    throw await parseBackendError(res, `Force unlock failed (HTTP ${res.status}).`);
  }

  return await res.blob();
}

export async function apiPdfToWord(file: File): Promise<Blob> {
  const res = await fetchWithAuthRetry(`${BACKEND_URL}/api/pdf-to-word`, () => {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
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
  const res = await fetchWithAuthRetry(`${BACKEND_URL}/api/ai-edit-scanned`, () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('boxes', JSON.stringify(boxes));
    if (instruction) formData.append('instruction', instruction);
    return formData;
  });

  if (!res.ok) {
    throw await parseBackendError(res, `AI Edit Scanned failed (HTTP ${res.status}).`);
  }

  return await res.blob();
}

export async function apiOcrDetect(file: File): Promise<any> {
  const res = await fetchWithAuthRetry(`${BACKEND_URL}/api/ocr-detect`, () => {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  });

  if (!res.ok) {
    throw await parseBackendError(res, `OCR detection failed (HTTP ${res.status}).`);
  }

  return await res.json();
}

export async function apiInpaint(file: File, boxes: any[]): Promise<Blob> {
  const res = await fetchWithAuthRetry(`${BACKEND_URL}/api/inpaint`, () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('boxes', JSON.stringify(boxes));
    return formData;
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
  skewAngle?: number;
  ocrEngine?: string;
  image: string;       // base64 data:image/jpeg;base64,...
  blocks: ScanEditorBlock[];
}

export interface ScanEditItem {
  pageIndex: number;
  blockId?: string;
  bbox: {
    x: number;      // percentage [0..100]
    y: number;      // percentage [0..100]
    width: number;  // percentage [0..100]
    height: number; // percentage [0..100]
  };
  mode: 'erase' | 'replace';
  newText?: string;
  offsetX?: number; // px fine-tune offset at rendered DPI
  offsetY?: number; // px fine-tune offset at rendered DPI
  fontSize?: number;
  fontFamily?: 'serif' | 'sans' | 'mono';
  isBold?: boolean;
  textColor?: string;
}

export async function apiScanEditor(
  file: File,
  pageIndex: number = 0
): Promise<ScanEditorResponse> {
  const res = await fetchWithAuthRetry(`${BACKEND_URL}/api/ai/scan-editor`, () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('page_index', String(pageIndex));
    return formData;
  });

  if (!res.ok) {
    throw await parseBackendError(res, `Failed to scan document (HTTP ${res.status}).`);
  }

  return await res.json();
}

export async function apiApplyScanEdits(
  file: File,
  edits: ScanEditItem[]
): Promise<Blob> {
  const res = await fetchWithAuthRetry(`${BACKEND_URL}/api/ai/scan-editor/apply`, () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('edits', JSON.stringify(edits));
    return formData;
  });

  if (!res.ok) {
    throw await parseBackendError(res, `Failed to apply scan edits (HTTP ${res.status}).`);
  }

  return await res.blob();
}
