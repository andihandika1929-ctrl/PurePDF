'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SPRINGS } from '@/lib/motion';
import { PenTool, Type, Trash2, ArrowRight, Loader2 } from 'lucide-react';

export interface SignPdfOptions {
  signaturePngDataUrl: string;
  position: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right';
  targetPages: 'last' | 'first' | 'all';
  signerName?: string;
  includeDate?: boolean;
}

interface SignPdfPanelProps {
  onApply: (options: SignPdfOptions) => void;
  isProcessing: boolean;
  language: 'en' | 'id';
}

const INK_COLORS = [
  { id: 'ink', label: 'Black', hex: '#111110' },
  { id: 'navy', label: 'Navy', hex: '#1D4ED8' },
  { id: 'vermilion', label: 'Signal', hex: '#FF3700' },
] as const;

export const SignPdfPanel: React.FC<SignPdfPanelProps> = ({
  onApply,
  isProcessing,
  language,
}) => {
  const isId = language === 'id';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [inkColor, setInkColor] = useState<string>('#111110');
  const [typedSignature, setTypedSignature] = useState('');
  const [hasStrokes, setHasStrokes] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const [position, setPosition] = useState<SignPdfOptions['position']>('bottom-right');
  const [targetPages, setTargetPages] = useState<SignPdfOptions['targetPages']>('last');
  const [signerName, setSignerName] = useState('');
  const [includeDate, setIncludeDate] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize high-DPI canvas
  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = inkColor;
      }
    }
    setHasStrokes(false);
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = inkColor;
    }
  }, [inkColor]);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasStrokes(true);
    setValidationError(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const renderTypedSignatureToPng = (text: string, color: string): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 640;
    offscreen.height = 200;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';
    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = color;
    ctx.font = 'italic 68px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.trim(), offscreen.width / 2, offscreen.height / 2);
    return offscreen.toDataURL('image/png');
  };

  const handleSubmit = () => {
    setValidationError(null);
    let dataUrl = '';

    if (mode === 'draw') {
      if (!hasStrokes || !canvasRef.current) {
        setValidationError(
          isId ? 'Silakan gambar tanda tangan terlebih dahulu.' : 'Please draw your signature first.'
        );
        return;
      }
      dataUrl = canvasRef.current.toDataURL('image/png');
    } else {
      if (!typedSignature.trim()) {
        setValidationError(
          isId ? 'Silakan ketik nama tanda tangan terlebih dahulu.' : 'Please type your signature text first.'
        );
        return;
      }
      dataUrl = renderTypedSignatureToPng(typedSignature, inkColor);
    }

    onApply({
      signaturePngDataUrl: dataUrl,
      position,
      targetPages,
      signerName: signerName.trim() || (mode === 'type' ? typedSignature.trim() : ''),
      includeDate,
    });
  };

  return (
    <div className="p-5 sm:p-6 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] space-y-5">
      {/* Header + Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="font-display text-sm font-semibold text-[var(--color-text)]">
            {isId ? 'Buat Tanda Tangan Digital' : 'Create Digital Signature'}
          </span>
        </div>

        <div className="inline-flex items-center p-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] w-fit">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'draw'
                ? 'bg-[var(--color-text)] text-[var(--color-surface)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>{isId ? 'Gambar' : 'Draw'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'type'
                ? 'bg-[var(--color-text)] text-[var(--color-surface)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Type className="w-3 h-3" />
            <span>{isId ? 'Ketik' : 'Type'}</span>
          </button>
        </div>
      </div>

      {/* Ink Color Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            {isId ? 'Warna Tinta:' : 'Ink:'}
          </span>
          {INK_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setInkColor(c.hex)}
              title={c.label}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                inkColor === c.hex
                  ? 'border-[var(--color-accent)] scale-110'
                  : 'border-[var(--color-border)]'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        {mode === 'draw' && (
          <button
            type="button"
            onClick={clearCanvas}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isId ? 'Bersihkan Kanvas' : 'Clear Pad'}</span>
          </button>
        )}
      </div>

      {/* Signature Pad or Typed Preview */}
      {mode === 'draw' ? (
        <div className="relative rounded-md border border-dashed border-[var(--color-border-strong)] bg-white overflow-hidden">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-40 touch-none cursor-crosshair block"
          />
          {!hasStrokes && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs text-neutral-400">
                {isId ? 'Tanda tangan di sini (mouse / sentuh)' : 'Sign here (mouse or touch)'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={typedSignature}
            onChange={(e) => {
              setTypedSignature(e.target.value);
              setValidationError(null);
            }}
            placeholder={isId ? 'Ketik nama tanda tangan Anda...' : 'Type your full signature...'}
            className="w-full h-11 px-4 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
          />
          <div className="h-28 rounded-md border border-dashed border-[var(--color-border-strong)] bg-white flex items-center justify-center px-4 overflow-hidden">
            <span
              className="text-4xl italic font-serif truncate select-none"
              style={{ color: inkColor }}
            >
              {typedSignature.trim() || (isId ? 'Pratinjau Tanda Tangan' : 'Signature Preview')}
            </span>
          </div>
        </div>
      )}

      {/* Placement & Page Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] block">
            {isId ? 'Posisi Tanda Tangan' : 'Placement Position'}
          </label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as SignPdfOptions['position'])}
            className="w-full h-10 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="bottom-right">{isId ? 'Kanan Bawah (Standar)' : 'Bottom Right (Standard)'}</option>
            <option value="bottom-left">{isId ? 'Kiri Bawah' : 'Bottom Left'}</option>
            <option value="bottom-center">{isId ? 'Tengah Bawah' : 'Bottom Center'}</option>
            <option value="top-right">{isId ? 'Kanan Atas' : 'Top Right'}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] block">
            {isId ? 'Terapkan ke Halaman' : 'Apply to Pages'}
          </label>
          <select
            value={targetPages}
            onChange={(e) => setTargetPages(e.target.value as SignPdfOptions['targetPages'])}
            className="w-full h-10 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="last">{isId ? 'Halaman Terakhir Saja' : 'Last Page Only'}</option>
            <option value="first">{isId ? 'Halaman Pertama Saja' : 'First Page Only'}</option>
            <option value="all">{isId ? 'Semua Halaman' : 'All Pages'}</option>
          </select>
        </div>
      </div>

      {/* Optional Signer Caption & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <input
          type="text"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder={isId ? 'Nama penandatangan (opsional)' : 'Signer name label (optional)'}
          className="w-full h-10 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeDate}
            onChange={(e) => setIncludeDate(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)] rounded"
          />
          <span>{isId ? 'Sertakan stempel tanggal otomatis' : 'Include automatic date stamp'}</span>
        </label>
      </div>

      {validationError && (
        <p className="text-xs font-mono text-[var(--color-danger)]">{validationError}</p>
      )}

      {/* Submit Action */}
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRINGS.tactile}
        disabled={isProcessing}
        onClick={handleSubmit}
        className="w-full h-12 px-6 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-display font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isId ? 'Menyematkan Tanda Tangan...' : 'Embedding Signature...'}</span>
          </>
        ) : (
          <>
            <span>{isId ? 'Bubuhkan Tanda Tangan ke PDF' : 'Apply Signature to PDF'}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>
    </div>
  );
};
