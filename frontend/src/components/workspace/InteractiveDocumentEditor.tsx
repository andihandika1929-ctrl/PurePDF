'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ScanEditorBlock,
  ScanEditorResponse,
  ScanEditItem,
  apiScanEditor,
  apiApplyScanEdits,
} from '@/lib/apiClient';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  Type,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Loader2,
  Bold,
  Pipette,
  Sparkles,
  AlertCircle,
  Check,
  MoveHorizontal,
  MoveVertical,
} from 'lucide-react';

interface InteractiveDocumentEditorProps {
  file: File;
  initialScan: ScanEditorResponse;
  language: 'id' | 'en';
  onClose: () => void;
  onDownload: (blob: Blob, filename: string) => void;
}

type FontFamilyChoice = 'serif' | 'sans' | 'mono';

interface BlockEditState {
  pageIndex: number;
  blockId: string;
  bbox: ScanEditorBlock['bbox'];
  originalText: string;
  mode: 'erase' | 'replace';
  newText: string;
  offsetX: number;
  offsetY: number;
  fontSize: number;
  fontFamily: FontFamilyChoice;
  isBold: boolean;
  textColor: string;
  autoTextColor: string;
}

function normalizeFontChoice(family?: string, category?: string): FontFamilyChoice {
  const raw = `${family || ''} ${category || ''}`.toLowerCase();
  if (raw.includes('mono') || raw.includes('courier') || raw.includes('consolas')) return 'mono';
  if (raw.includes('serif') || raw.includes('times') || raw.includes('georgia')) return 'serif';
  return 'sans';
}

function fontChoiceToCss(choice: FontFamilyChoice): string {
  if (choice === 'serif') return "'Times New Roman', Georgia, serif";
  if (choice === 'mono') return "'IBM Plex Mono', 'Courier New', monospace";
  return "'DM Sans', Arial, Helvetica, sans-serif";
}

export const InteractiveDocumentEditor: React.FC<InteractiveDocumentEditorProps> = ({
  file,
  initialScan,
  language,
  onClose,
  onDownload,
}) => {
  const isId = language === 'id';
  const { openAuthModal, setPaywallOpen, setActiveProToolName } = useApp();

  // Cache scanned pages so switching pages is instant
  const [pagesCache, setPagesCache] = useState<Record<number, ScanEditorResponse>>({
    [initialScan.pageIndex]: initialScan,
  });
  const [currentPage, setCurrentPage] = useState<number>(initialScan.pageIndex);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);

  // Map of `${pageIndex}:${blockId}` -> BlockEditState
  const [editsMap, setEditsMap] = useState<Record<string, BlockEditState>>({});
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Viewport & UI states
  const [zoom, setZoom] = useState<number>(100);
  const [showOverlayBoxes, setShowOverlayBoxes] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isColdStartNotice, setIsColdStartNotice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeScan = pagesCache[currentPage] || initialScan;
  const totalPages = activeScan.totalPages || 1;

  // Show reassuring cold-start notice if export or page scan takes > 4s
  useEffect(() => {
    if (!isExporting && !isLoadingPage) {
      setIsColdStartNotice(false);
      return;
    }
    const timer = setTimeout(() => setIsColdStartNotice(true), 4000);
    return () => clearTimeout(timer);
  }, [isExporting, isLoadingPage]);

  const makeKey = (pageIdx: number, blockId: string) => `${pageIdx}:${blockId}`;

  const selectedBlock: ScanEditorBlock | null = useMemo(() => {
    if (!selectedBlockId) return null;
    return activeScan.blocks.find((b) => b.id === selectedBlockId) || null;
  }, [activeScan.blocks, selectedBlockId]);

  const selectedKey = selectedBlock ? makeKey(currentPage, selectedBlock.id) : null;
  const selectedEdit: BlockEditState | null = selectedKey ? editsMap[selectedKey] || null : null;

  const allEditsList = useMemo(() => Object.values(editsMap), [editsMap]);
  const totalEditedCount = allEditsList.length;

  const ensureEditState = (
    block: ScanEditorBlock,
    mode: 'erase' | 'replace' = 'replace'
  ): BlockEditState => {
    const key = makeKey(currentPage, block.id);
    const existing = editsMap[key];
    if (existing) {
      return { ...existing, mode };
    }
    return {
      pageIndex: currentPage,
      blockId: block.id,
      bbox: block.bbox,
      originalText: block.text,
      mode,
      newText: block.text,
      offsetX: 0,
      offsetY: 0,
      fontSize: Math.max(8, Math.min(72, Math.round(block.fontSize || 16))),
      fontFamily: normalizeFontChoice(block.fontFamily, block.fontCategory),
      isBold: Boolean(block.isBold),
      textColor: block.textColor || '#1A1A1A',
      autoTextColor: block.textColor || '#1A1A1A',
    };
  };

  const handleSelectBlock = (block: ScanEditorBlock) => {
    setSelectedBlockId(block.id);
    setErrorMsg(null);
  };

  const updateSelectedEdit = (patch: Partial<BlockEditState>) => {
    if (!selectedBlock) return;
    const key = makeKey(currentPage, selectedBlock.id);
    setEditsMap((prev) => {
      const base = prev[key] || ensureEditState(selectedBlock, patch.mode || 'replace');
      return {
        ...prev,
        [key]: { ...base, ...patch },
      };
    });
  };

  const handleResetSelectedBlock = () => {
    if (!selectedBlock) return;
    const key = makeKey(currentPage, selectedBlock.id);
    setEditsMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleResetAll = () => {
    setEditsMap({});
    setSelectedBlockId(null);
    setErrorMsg(null);
  };

  const handleSwitchPage = async (targetPage: number) => {
    if (targetPage < 0 || targetPage >= totalPages || targetPage === currentPage || isLoadingPage) {
      return;
    }
    setSelectedBlockId(null);
    setErrorMsg(null);

    if (pagesCache[targetPage]) {
      setCurrentPage(targetPage);
      return;
    }

    setIsLoadingPage(true);
    try {
      const scanRes = await apiScanEditor(file, targetPage);
      setPagesCache((prev) => ({ ...prev, [targetPage]: scanRes }));
      setCurrentPage(targetPage);
    } catch (err: any) {
      if (err?.status === 401) {
        setErrorMsg(
          err?.message
            ? `${isId ? 'Verifikasi sesi ditolak server' : 'Server rejected auth session'}: ${err.message}`
            : isId
            ? 'Sesi login Anda habis. Silakan keluar lalu masuk kembali.'
            : 'Your session expired. Please sign out and sign in again.'
        );
      } else if (err?.status === 503) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(
          isId
            ? 'Gagal memuat halaman berikutnya. Coba beberapa detik lagi.'
            : 'Failed to scan the next page. Please try again in a few seconds.'
        );
      }
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handleApplyAndExport = async () => {
    if (totalEditedCount === 0) {
      setErrorMsg(
        isId
          ? 'Klik minimal satu kotak teks untuk dihapus (Erase) atau diganti (Replace) terlebih dahulu.'
          : 'Click at least one text box to Erase or Replace before exporting.'
      );
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);

    const payload: ScanEditItem[] = allEditsList.map((item) => ({
      pageIndex: item.pageIndex,
      blockId: item.blockId,
      bbox: item.bbox,
      mode: item.mode,
      newText: item.mode === 'replace' ? item.newText : '',
      offsetX: item.offsetX,
      offsetY: item.offsetY,
      fontSize: item.fontSize,
      fontFamily: item.fontFamily,
      isBold: item.isBold,
      textColor: item.textColor,
    }));

    try {
      const blob = await apiApplyScanEdits(file, payload);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      onDownload(blob, `${baseName}_ai_edited.pdf`);
    } catch (err: any) {
      if (err?.status === 401) {
        setErrorMsg(
          err?.message
            ? `${isId ? 'Verifikasi sesi ditolak server' : 'Server rejected auth session'}: ${err.message}`
            : isId
            ? 'Sesi login Anda habis. Silakan keluar lalu masuk kembali.'
            : 'Your session expired. Please sign out and sign in again.'
        );
      } else if (err?.status === 402) {
        setActiveProToolName(isId ? 'AI Edit PDF Scan & Screenshot' : 'AI Edit Scanned & Screenshot PDF');
        setPaywallOpen(true);
        setErrorMsg(isId ? 'Kredit atau kuota harian AI Anda tidak mencukupi.' : 'Insufficient AI credits or daily quota.');
      } else if (err?.status === 413 || err?.status === 503) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(
          isId
            ? 'Server AI sedang sibuk atau bangun dari mode tidur. Mohon coba beberapa detik lagi.'
            : 'The AI server is waking up or busy. Please try again in a few seconds.'
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Current inspector values (either active edit or detected block defaults)
  const inspectorMode: 'none' | 'erase' | 'replace' = selectedEdit ? selectedEdit.mode : 'none';
  const inspectorText = selectedEdit ? selectedEdit.newText : selectedBlock?.text || '';
  const inspectorOffsetX = selectedEdit ? selectedEdit.offsetX : 0;
  const inspectorOffsetY = selectedEdit ? selectedEdit.offsetY : 0;
  const inspectorFontSize = selectedEdit
    ? selectedEdit.fontSize
    : Math.max(8, Math.min(72, Math.round(selectedBlock?.fontSize || 16)));
  const inspectorFontFamily: FontFamilyChoice = selectedEdit
    ? selectedEdit.fontFamily
    : normalizeFontChoice(selectedBlock?.fontFamily, selectedBlock?.fontCategory);
  const inspectorIsBold = selectedEdit ? selectedEdit.isBold : Boolean(selectedBlock?.isBold);
  const inspectorColor = selectedEdit ? selectedEdit.textColor : selectedBlock?.textColor || '#1A1A1A';

  return (
    <div className="w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] overflow-hidden shadow-card-elevated">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-border-strong)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isId ? 'Ganti File' : 'Change File'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25 text-[11px] font-mono font-semibold text-[var(--color-accent)]">
            <Sparkles className="w-3 h-3" />
            <span>OpenCV Inpaint + OCR</span>
          </div>
        </div>

        {/* Page Navigation & Zoom */}
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-1">
              <button
                type="button"
                disabled={currentPage <= 0 || isLoadingPage}
                onClick={() => handleSwitchPage(currentPage - 1)}
                className="p-1 rounded-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-35"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] font-semibold px-1.5 text-[var(--color-text)]">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1 || isLoadingPage}
                onClick={() => handleSwitchPage(currentPage + 1)}
                className="p-1 rounded-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-35"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="inline-flex items-center gap-1 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 15))}
              className="p-1 rounded-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-semibold w-10 text-center text-[var(--color-text)]">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(180, z + 15))}
              className="p-1 rounded-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowOverlayBoxes((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
            title={isId ? 'Tampilkan / Sembunyikan Kotak Deteksi' : 'Toggle Detected Text Boxes'}
          >
            {showOverlayBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isId ? 'Kotak Teks' : 'Boxes'}</span>
          </button>
        </div>

        {/* Export CTA */}
        <div className="flex items-center gap-2">
          {totalEditedCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              disabled={isExporting}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isId ? 'Reset' : 'Reset'} ({totalEditedCount})</span>
            </button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isExporting || totalEditedCount === 0}
            onClick={handleApplyAndExport}
            className="gap-1.5"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isId ? 'Memproses Inpainting...' : 'Inpainting & Exporting...'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  {isId ? 'Terapkan & Export PDF' : 'Apply & Export PDF'}
                  {totalEditedCount > 0 ? ` (${totalEditedCount})` : ''}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cold-start or Error Banner */}
      {isColdStartNotice && (isExporting || isLoadingPage) && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>
            {isId
              ? 'Server AI sedang memproses OpenCV inpainting / bangun dari mode tidur (~20–45 detik). Mohon tunggu sebentar...'
              : 'AI server is running OpenCV inpainting or waking from cold start (~20–45s). Please wait...'}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Left/Center: Interactive Scanned Document Canvas */}
        <div className="lg:col-span-8 bg-[#EAE8E3] p-4 sm:p-6 overflow-auto max-h-[75vh] flex items-start justify-center relative">
          {isLoadingPage ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--color-text-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
              <p className="text-xs font-mono uppercase tracking-wider">
                {isId ? 'Memindai halaman via OCR...' : 'Scanning page via OCR...'}
              </p>
            </div>
          ) : (
            <div
              className="relative shadow-[0_12px_36px_rgba(17,17,16,0.18)] border border-black/15 bg-white select-none transition-all duration-150"
              style={{
                width: `${zoom}%`,
                maxWidth: zoom <= 100 ? '760px' : 'none',
                minWidth: '320px',
              }}
            >
              {/* Underlying Scanned Page Image */}
              <img
                src={activeScan.image}
                alt={`Scanned page ${currentPage + 1}`}
                className="w-full h-auto block pointer-events-none"
                draggable={false}
              />

              {/* Interactive Detected Text Bounding Boxes */}
              {activeScan.blocks.map((block) => {
                const key = makeKey(currentPage, block.id);
                const edit = editsMap[key];
                const isSelected = selectedBlockId === block.id;
                const isErased = edit?.mode === 'erase';
                const isReplaced = edit?.mode === 'replace';

                if (!showOverlayBoxes && !edit && !isSelected) {
                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => handleSelectBlock(block)}
                      style={{
                        left: `${block.bbox.x}%`,
                        top: `${block.bbox.y}%`,
                        width: `${block.bbox.width}%`,
                        height: `${block.bbox.height}%`,
                      }}
                      className="absolute cursor-pointer bg-transparent hover:bg-[var(--color-accent)]/15 hover:outline hover:outline-1 hover:outline-[var(--color-accent)] transition-colors"
                      title={block.text}
                    />
                  );
                }

                return (
                  <button
                    key={block.id}
                    type="button"
                    data-testid={`scan-block-${block.id}`}
                    onClick={() => handleSelectBlock(block)}
                    style={{
                      left: `${block.bbox.x}%`,
                      top: `${block.bbox.y}%`,
                      width: `${block.bbox.width}%`,
                      height: `${block.bbox.height}%`,
                    }}
                    className={`absolute text-left cursor-pointer transition-all rounded-[2px] group ${
                      isSelected
                        ? 'ring-2 ring-[var(--color-accent)] z-20'
                        : isReplaced
                        ? 'ring-1 ring-emerald-600/80 z-10'
                        : isErased
                        ? 'ring-1 ring-red-500/80 z-10'
                        : 'border border-dashed border-sky-600/45 bg-sky-500/[0.06] hover:bg-[var(--color-accent)]/15 hover:border-[var(--color-accent)]'
                    }`}
                    title={block.text}
                  >
                    {/* Live Visual Preview for Erase */}
                    {isErased && (
                      <div
                        className="w-full h-full flex items-center justify-center rounded-[1px]"
                        style={{
                          backgroundColor: block.bgColor || '#f2efe9',
                          backgroundImage:
                            'repeating-linear-gradient(45deg, rgba(220,38,38,0.14) 0, rgba(220,38,38,0.14) 4px, transparent 4px, transparent 8px)',
                        }}
                      >
                        <span className="sr-only">Erased</span>
                      </div>
                    )}

                    {/* Live Visual Preview for Replace */}
                    {isReplaced && edit && (
                      <div
                        className="w-full h-full flex items-center overflow-visible px-0.5 rounded-[1px]"
                        style={{
                          backgroundColor: `${block.bgColor || '#f5f2eb'}E8`,
                        }}
                      >
                        <span
                          className="whitespace-nowrap leading-none pointer-events-none"
                          style={{
                            color: edit.textColor,
                            fontFamily: fontChoiceToCss(edit.fontFamily),
                            fontWeight: edit.isBold ? 700 : 400,
                            fontSize: `clamp(8px, ${(edit.fontSize / (activeScan.pixelWidth || 1200)) * 100}cqw, 48px)`,
                            transform: `translate(${edit.offsetX * 0.5}px, ${edit.offsetY * 0.5}px)`,
                          }}
                        >
                          {edit.newText}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Precision Inspector */}
        <aside className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 flex flex-col justify-between gap-5">
          {!selectedBlock ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-3 my-auto">
              <div className="w-11 h-11 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)] flex items-center justify-center mb-3.5">
                <Type className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h3 className="font-display text-base font-semibold text-[var(--color-text)] mb-1.5">
                {isId ? 'Pilih Kotak Teks di Dokumen' : 'Select a Text Box on the Page'}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-xs mb-4">
                {isId
                  ? `Terdeteksi ${activeScan.blocks.length} area teks. Klik kotak mana saja untuk menghapus (Erase) atau mengganti teks (Replace) dengan tekstur kertas asli.`
                  : `${activeScan.blocks.length} text regions detected. Click any box to Erase or Replace text while preserving original paper texture via OpenCV inpainting.`}
              </p>
              <div className="w-full rounded-sm border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-left space-y-1.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                <div className="flex justify-between">
                  <span>{isId ? 'Engine Deteksi' : 'Detection Engine'}</span>
                  <span className="text-[var(--color-text)] font-semibold">
                    {activeScan.ocrEngine || 'tesseract'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isId ? 'Resolusi Scan' : 'Scan Resolution'}</span>
                  <span className="text-[var(--color-text)] font-semibold">
                    {activeScan.pixelWidth} × {activeScan.pixelHeight}px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isId ? 'Total Edit Aktif' : 'Active Edits'}</span>
                  <span className="text-[var(--color-accent)] font-semibold">{totalEditedCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    {isId ? 'Area Teks Terpilih' : 'Selected Text Region'}
                  </span>
                  <p className="text-xs font-medium text-[var(--color-text)] mt-0.5 line-clamp-2">
                    “{selectedBlock.text}”
                  </p>
                </div>
                {selectedEdit && (
                  <button
                    type="button"
                    onClick={handleResetSelectedBlock}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isId ? 'Batal' : 'Undo'}</span>
                  </button>
                )}
              </div>

              {/* Action Mode Toggle: Replace / Erase */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  {isId ? 'Aksi Inpainting' : 'Inpainting Action'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSelectedEdit({ mode: 'replace' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border text-xs font-semibold transition-colors ${
                      inspectorMode === 'replace'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>{isId ? 'Ganti Teks' : 'Replace'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSelectedEdit({ mode: 'erase' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border text-xs font-semibold transition-colors ${
                      inspectorMode === 'erase'
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-red-400'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>{isId ? 'Hapus Teks' : 'Erase'}</span>
                  </button>
                </div>
              </div>

              {/* Replace Controls */}
              {inspectorMode !== 'erase' && (
                <div className="space-y-4 pt-1">
                  {/* Replacement Text */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="scan-replace-text"
                      className="block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                    >
                      {isId ? 'Teks Pengganti' : 'Replacement Text'}
                    </label>
                    <input
                      id="scan-replace-text"
                      type="text"
                      value={inspectorText}
                      onChange={(e) =>
                        updateSelectedEdit({ mode: 'replace', newText: e.target.value })
                      }
                      placeholder={isId ? 'Ketik teks baru...' : 'Type replacement text...'}
                      className="w-full px-3 py-2 rounded-sm border border-[var(--color-border-strong)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>

                  {/* Font Family (Serif / Sans / Mono) + Bold */}
                  <div className="space-y-1.5">
                    <label className="block font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                      {isId ? 'Gaya Font' : 'Font Family'}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['serif', 'sans', 'mono'] as FontFamilyChoice[]).map((fam) => (
                        <button
                          key={fam}
                          type="button"
                          onClick={() => updateSelectedEdit({ mode: 'replace', fontFamily: fam })}
                          className={`py-1.5 px-2 rounded-sm border text-xs font-medium capitalize transition-colors ${
                            inspectorFontFamily === fam
                              ? 'border-[var(--color-text)] bg-[var(--color-text)] text-white'
                              : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-border-strong)]'
                          }`}
                        >
                          {fam}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedEdit({ mode: 'replace', isBold: !inspectorIsBold })
                        }
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-sm border text-xs font-semibold transition-colors ${
                          inspectorIsBold
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                            : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-border-strong)]'
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Font Size Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="scan-font-size"
                        className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                      >
                        {isId ? 'Ukuran Font' : 'Font Size'}
                      </label>
                      <span className="font-mono text-xs font-semibold text-[var(--color-text)]">
                        {inspectorFontSize} px
                      </span>
                    </div>
                    <input
                      id="scan-font-size"
                      type="range"
                      min={8}
                      max={72}
                      step={1}
                      value={inspectorFontSize}
                      onChange={(e) =>
                        updateSelectedEdit({
                          mode: 'replace',
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[var(--color-accent)] cursor-pointer"
                    />
                  </div>

                  {/* Fine-tuning Position X & Y */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="scan-offset-x"
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                        >
                          <MoveHorizontal className="w-3 h-3" />
                          <span>Offset X</span>
                        </label>
                        <span className="font-mono text-[11px] font-semibold text-[var(--color-text)]">
                          {inspectorOffsetX > 0 ? `+${inspectorOffsetX}` : inspectorOffsetX}px
                        </span>
                      </div>
                      <input
                        id="scan-offset-x"
                        type="range"
                        min={-40}
                        max={40}
                        step={1}
                        value={inspectorOffsetX}
                        onChange={(e) =>
                          updateSelectedEdit({
                            mode: 'replace',
                            offsetX: Number(e.target.value),
                          })
                        }
                        className="w-full accent-[var(--color-accent)] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="scan-offset-y"
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                        >
                          <MoveVertical className="w-3 h-3" />
                          <span>Offset Y</span>
                        </label>
                        <span className="font-mono text-[11px] font-semibold text-[var(--color-text)]">
                          {inspectorOffsetY > 0 ? `+${inspectorOffsetY}` : inspectorOffsetY}px
                        </span>
                      </div>
                      <input
                        id="scan-offset-y"
                        type="range"
                        min={-40}
                        max={40}
                        step={1}
                        value={inspectorOffsetY}
                        onChange={(e) =>
                          updateSelectedEdit({
                            mode: 'replace',
                            offsetY: Number(e.target.value),
                          })
                        }
                        className="w-full accent-[var(--color-accent)] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Auto Ink Color Picker */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="scan-ink-color"
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                      >
                        <Pipette className="w-3 h-3" />
                        <span>{isId ? 'Warna Tinta (Auto-Sample)' : 'Ink Color (Auto-Sampled)'}</span>
                      </label>
                      {selectedBlock.textColor &&
                        inspectorColor.toLowerCase() !== selectedBlock.textColor.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedEdit({
                                mode: 'replace',
                                textColor: selectedBlock.textColor,
                              })
                            }
                            className="text-[10px] font-mono text-[var(--color-accent)] hover:underline"
                          >
                            {isId ? 'Auto' : 'Reset Auto'}
                          </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2.5 p-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-bg)]">
                      <input
                        id="scan-ink-color"
                        type="color"
                        value={inspectorColor}
                        onChange={(e) =>
                          updateSelectedEdit({ mode: 'replace', textColor: e.target.value })
                        }
                        className="w-8 h-7 rounded-sm border border-[var(--color-border-strong)] cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-xs font-semibold text-[var(--color-text)] uppercase">
                        {inspectorColor}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-[var(--color-text-muted)]">
                        {isId ? 'Tinta Asli' : 'Sampled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {inspectorMode === 'erase' && (
                <div className="rounded-sm border border-red-200 bg-red-50/70 p-3 text-xs text-red-800 leading-relaxed">
                  {isId
                    ? 'Teks pada kotak ini akan dihapus dengan OpenCV Telea Inpainting sehingga tekstur & gradasi kertas asli tetap menyatu mulus tanpa kotak tambalan.'
                    : 'Text in this box will be erased via OpenCV Telea inpainting, seamlessly restoring the original paper texture and gradient without patch boxes.'}
                </div>
              )}
            </div>
          )}

          {/* Footer Summary */}
          <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isId ? 'Zero-Storage (RAM Only)' : 'Zero-Storage (RAM Only)'}</span>
            </span>
            <span>2 Credits / VVIP</span>
          </div>
        </aside>
      </div>
    </div>
  );
};
