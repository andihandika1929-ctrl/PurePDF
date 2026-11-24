'use client';

import React, { useState, useEffect } from 'react';
import { PageThumbnail, renderPdfThumbnails } from '@/lib/clientPdfOps';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  RotateCw,
  RotateCcw,
  Trash2,
  Undo2,
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
  FilePlus,
  Loader2,
  Eye,
  Scissors
} from 'lucide-react';

interface PageGridBoardProps {
  toolSlug: string;
  primaryFile: File;
  additionalFiles?: File[];
  onAddFiles?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  onExecute: (data: {
    pagesConfig?: { originalIndex: number; rotation: number }[];
    pagesToDelete?: number[];
    pagesToExtract?: number[];
    splitRange?: string;
    splitAll?: boolean;
    splitMode?: 'range' | 'all' | 'evenOdd' | 'everyN';
    splitNPages?: number;
    rotationAngle?: number;
    mergedFiles?: File[];
  }) => void;
  isProcessing: boolean;
  language?: 'en' | 'id';
}

export const PageGridBoard: React.FC<PageGridBoardProps> = ({
  toolSlug,
  primaryFile,
  additionalFiles = [],
  onAddFiles,
  onRemoveFile,
  onExecute,
  isProcessing,
  language = 'en',
}) => {
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Split-specific options
  const [splitMode, setSplitMode] = useState<'range' | 'all' | 'evenOdd' | 'everyN'>('range');
  const [splitRange, setSplitRange] = useState('');
  const [splitNPages, setSplitNPages] = useState(2);

  // Merge-specific options
  const [allFiles, setAllFiles] = useState<File[]>([primaryFile, ...additionalFiles]);

  const isId = language === 'id';

  // Load and render real thumbnails from PDF.js
  useEffect(() => {
    let isMounted = true;
    async function loadThumbnails() {
      setLoading(true);
      setError(null);
      try {
        const rendered = await renderPdfThumbnails(primaryFile);
        if (isMounted) {
          setPages(rendered);
          // Set initial split range placeholder
          setSplitRange(`1-${Math.min(rendered.length, 3)}`);
        }
      } catch (err: any) {
        console.error('Error rendering PDF thumbnails:', err);
        if (isMounted) {
          setError(
            isId
              ? 'Gagal memuat pratinjau halaman PDF. Pastikan file tidak rusak.'
              : 'Failed to load page previews. Please ensure the PDF is valid.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadThumbnails();
    return () => {
      isMounted = false;
    };
  }, [primaryFile, isId]);

  // Update file list when additionalFiles changes
  useEffect(() => {
    setAllFiles([primaryFile, ...additionalFiles]);
  }, [primaryFile, additionalFiles]);

  // Rotate single page
  const handleRotatePage = (index: number, deg: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + deg) % 360 } : p))
    );
  };

  // Rotate all pages
  const handleRotateAll = (deg: number) => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + deg) % 360 })));
  };

  // Toggle page deletion
  const handleToggleDelete = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, isDeleted: !p.isDeleted } : p))
    );
  };

  // Toggle page selection for extraction
  const handleToggleSelect = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, isSelected: !p.isSelected } : p))
    );
  };

  // Select all / Deselect all
  const handleSelectAll = (select: boolean) => {
    setPages((prev) => prev.map((p) => ({ ...p, isSelected: select })));
  };

  // Move page position in reordering
  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  // Primary action button handler
  const handleAction = () => {
    if (toolSlug === 'merge-pdf') {
      onExecute({ mergedFiles: allFiles });
      return;
    }

    if (toolSlug === 'split-pdf') {
      onExecute({
        splitRange,
        splitAll: splitMode === 'all',
        splitMode,
        splitNPages,
      });
      return;
    }

    if (toolSlug === 'remove-pages') {
      const pagesToDelete = pages
        .filter((p) => p.isDeleted)
        .map((p) => p.originalIndex);
      onExecute({ pagesToDelete });
      return;
    }

    if (toolSlug === 'extract-pages') {
      const pagesToExtract = pages
        .filter((p) => p.isSelected)
        .map((p) => p.originalIndex);
      onExecute({ pagesToExtract });
      return;
    }

    if (toolSlug === 'rotate-pdf') {
      onExecute({ rotationAngle: 90 });
      return;
    }

    // Default for organize-pdf: reorder and rotate
    const pagesConfig = pages.map((p) => ({
      originalIndex: p.originalIndex,
      rotation: p.rotation,
    }));
    onExecute({ pagesConfig });
  };

  // Counters
  const deletedCount = pages.filter((p) => p.isDeleted).length;
  const selectedCount = pages.filter((p) => p.isSelected).length;

  return (
    <div className="w-full space-y-6">
      
      {/* Top Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-100/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono bg-white dark:bg-zinc-900">
            {pages.length} {isId ? 'Halaman' : 'Pages'}
          </Badge>
          <span className="text-xs text-neutral-500 font-mono truncate max-w-[200px] sm:max-w-xs">
            {primaryFile.name} ({(primaryFile.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Rotate Tools */}
          {(toolSlug === 'organize-pdf' || toolSlug === 'rotate-pdf') && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRotateAll(90)}
                className="text-xs h-8 gap-1.5 bg-white dark:bg-zinc-900"
              >
                <RotateCw className="w-3.5 h-3.5" />
                {isId ? 'Putar Semua 90°' : 'Rotate All 90°'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRotateAll(180)}
                className="text-xs h-8 gap-1.5 bg-white dark:bg-zinc-900"
              >
                <RotateCw className="w-3.5 h-3.5" />
                {isId ? 'Putar 180°' : 'Rotate 180°'}
              </Button>
            </div>
          )}

          {/* Extract Tools: Select All / Deselect All */}
          {toolSlug === 'extract-pages' && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSelectAll(true)}
                className="text-xs h-8 gap-1 bg-white dark:bg-zinc-900"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {isId ? 'Pilih Semua' : 'Select All'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSelectAll(false)}
                className="text-xs h-8 gap-1 bg-white dark:bg-zinc-900"
              >
                <Square className="w-3.5 h-3.5" />
                {isId ? 'Lepas Semua' : 'Deselect All'}
              </Button>
            </div>
          )}

          {/* Merge PDF: Add More Files */}
          {toolSlug === 'merge-pdf' && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const newFiles = Array.from(e.target.files);
                    setAllFiles((prev) => [...prev, ...newFiles]);
                    onAddFiles?.(newFiles);
                  }
                }}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 hover:border-black dark:hover:border-white shadow-sm transition-all">
                <FilePlus className="w-3.5 h-3.5 text-[#ff3700]" />
                {isId ? '+ Tambah PDF Lain' : '+ Add More PDFs'}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Merge-PDF File Deck View */}
      {toolSlug === 'merge-pdf' && allFiles.length > 1 && (
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 space-y-2">
          <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
            {isId ? 'Urutan Berkas yang Akan Digabung:' : 'Files to Merge Sequence:'}
          </p>
          <div className="space-y-1.5">
            {allFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-neutral-400 font-bold">#{i + 1}</span>
                  <span className="font-medium truncate">{f.name}</span>
                  <span className="text-neutral-400 text-[10px]">
                    ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                {i > 0 && (
                  <button
                    onClick={() => {
                      const updated = allFiles.filter((_, idx) => idx !== i);
                      setAllFiles(updated);
                      onRemoveFile?.(i);
                    }}
                    className="p-1 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split-PDF Options View (PDF24 Style 4 Modes) */}
      {toolSlug === 'split-pdf' && (
        <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 space-y-4">
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setSplitMode('range')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                splitMode === 'range'
                  ? 'border-[#ff3700] bg-[#ff3700]/10 text-[#ff3700]'
                  : 'border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {isId ? 'Rentang Halaman' : 'Custom Range'}
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                splitMode === 'all'
                  ? 'border-[#ff3700] bg-[#ff3700]/10 text-[#ff3700]'
                  : 'border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {isId ? 'Semua Halaman (ZIP)' : 'All Pages (ZIP)'}
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('evenOdd')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                splitMode === 'evenOdd'
                  ? 'border-[#ff3700] bg-[#ff3700]/10 text-[#ff3700]'
                  : 'border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {isId ? 'Genap / Ganjil' : 'Even & Odd'}
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('everyN')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                splitMode === 'everyN'
                  ? 'border-[#ff3700] bg-[#ff3700]/10 text-[#ff3700]'
                  : 'border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {isId ? 'Setiap N Halaman' : 'Every N Pages'}
            </button>
          </div>

          {splitMode === 'range' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {isId
                  ? 'Masukkan nomor halaman yang ingin dipisahkan (contoh: 1-3, 5, 8):'
                  : 'Enter page ranges to extract (e.g. 1-3, 5, 8-10):'}
              </label>
              <input
                type="text"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="e.g. 1-2, 4"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
              />
            </div>
          )}

          {splitMode === 'evenOdd' && (
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 text-xs text-neutral-600 dark:text-neutral-300 border border-black/5 dark:border-white/5">
              {isId
                ? 'Dokumen akan dipecah menjadi 2 berkas PDF: Halaman Ganjil (1, 3, 5...) dan Halaman Genap (2, 4, 6...) yang dikemas dalam arsip ZIP.'
                : 'Document will be divided into 2 separate PDFs: Odd pages (1, 3, 5...) and Even pages (2, 4, 6...) bundled into a ZIP file.'}
            </div>
          )}

          {splitMode === 'everyN' && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                {isId ? 'Pecah setiap berapa halaman?' : 'Pages per split chunk:'}
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, pages.length)}
                value={splitNPages}
                onChange={(e) => setSplitNPages(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 px-3 py-1.5 text-sm rounded-xl border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
              />
              <span className="text-xs text-neutral-500 font-mono">
                {isId ? `(${Math.ceil(pages.length / splitNPages)} file PDF dalam ZIP)` : `(${Math.ceil(pages.length / splitNPages)} PDFs in ZIP)`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-zinc-800 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff3700] mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-black dark:text-white">
              {isId ? 'Merender Thumbnail Halaman Asli...' : 'Rendering Page Thumbnails...'}
            </p>
            <p className="text-xs text-neutral-500">
              {isId
                ? 'PDF.js memproses langsung di browsermu tanpa upload ke server'
                : 'Processed 100% in-browser memory via PDF.js WebAssembly'}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Page Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pages.map((page, index) => {
            const isRemoved = page.isDeleted;
            const isSelected = page.isSelected;

            return (
              <div
                key={`${page.originalIndex}-${index}`}
                className={`group relative flex flex-col items-center rounded-2xl p-3 border transition-all ${
                  isRemoved
                    ? 'opacity-40 border-red-500/50 bg-red-50/20 dark:bg-red-950/20 line-through'
                    : isSelected && toolSlug === 'extract-pages'
                    ? 'border-[#ff3700] bg-[#ff3700]/5 shadow-sm'
                    : 'border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-black/30 dark:hover:border-white/30 hover:shadow-md'
                }`}
              >
                {/* Page Number & Badge */}
                <div className="w-full flex items-center justify-between mb-2 text-[11px] font-mono">
                  <span className="font-bold text-neutral-600 dark:text-neutral-400">
                    {isId ? `Hal ${index + 1}` : `Page ${index + 1}`}
                  </span>

                  {/* Extract Checkbox */}
                  {toolSlug === 'extract-pages' && (
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(index)}
                      className="text-[#ff3700]"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 fill-[#ff3700]/10" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>
                  )}

                  {/* Remove Trash Button */}
                  {toolSlug === 'remove-pages' && (
                    <button
                      type="button"
                      onClick={() => handleToggleDelete(index)}
                      className={`p-1 rounded-md transition-colors ${
                        isRemoved
                          ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                      }`}
                      title={isRemoved ? 'Restore' : 'Delete'}
                    >
                      {isRemoved ? <Undo2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Thumbnail Image Container */}
                <div
                  className="w-full aspect-[1/1.4] bg-neutral-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner cursor-pointer"
                  onClick={() => {
                    if (toolSlug === 'extract-pages') handleToggleSelect(index);
                    if (toolSlug === 'remove-pages') handleToggleDelete(index);
                  }}
                >
                  <img
                    src={page.dataUrl}
                    alt={`Page ${index + 1}`}
                    style={{
                      transform: `rotate(${page.rotation}deg)`,
                      transition: 'transform 0.2s ease',
                    }}
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />

                  {/* Rotation Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotatePage(index, 90);
                      }}
                      className="p-1.5 rounded-full bg-white/90 text-black hover:bg-white shadow-md hover:scale-110 transition-transform"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reorder Buttons (Move Left / Right) */}
                {toolSlug === 'organize-pdf' && (
                  <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMovePage(index, index - 1)}
                      className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-20 text-neutral-600 dark:text-neutral-400"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRotatePage(index, 90)}
                      className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-600 dark:text-neutral-400"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={index === pages.length - 1}
                      onClick={() => handleMovePage(index, index + 1)}
                      className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-20 text-neutral-600 dark:text-neutral-400"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Primary Execution Action Bar */}
      <div className="p-4 sm:p-6 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-black flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0px_4px_24px_rgba(0,0,0,0.12)]">
        <div>
          <h4 className="text-sm sm:text-base font-bold">
            {toolSlug === 'merge-pdf' && (isId ? `Gabungkan ${allFiles.length} Berkas PDF` : `Merge ${allFiles.length} PDF Documents`)}
            {toolSlug === 'split-pdf' && (isId ? 'Pisahkan Halaman PDF Sekarang' : 'Split Document Pages')}
            {toolSlug === 'remove-pages' && (isId ? `Hapus ${deletedCount} Halaman Terpilih` : `Remove ${deletedCount} Selected Pages`)}
            {toolSlug === 'extract-pages' && (isId ? `Ekstrak ${selectedCount} Halaman Terpilih` : `Extract ${selectedCount} Selected Pages`)}
            {toolSlug === 'organize-pdf' && (isId ? 'Simpan Susunan & Orientasi Baru' : 'Save Reorganized PDF')}
            {toolSlug === 'rotate-pdf' && (isId ? 'Terapkan Rotasi & Simpan' : 'Save Rotated PDF')}
          </h4>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
            {isId
              ? 'Proses 100% di browser • File tidak pernah diunggah ke server'
              : '100% Client-side zero server storage • Instant export'}
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleAction}
          disabled={isProcessing || loading || (toolSlug === 'extract-pages' && selectedCount === 0) || (toolSlug === 'remove-pages' && deletedCount === 0)}
          className="w-full sm:w-auto bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 px-8 rounded-full shadow-[0px_2px_12px_rgba(255,55,0,0.35)] disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isId ? 'Memproses...' : 'Processing...'}
            </span>
          ) : (
            <span>
              {toolSlug === 'merge-pdf' && (isId ? 'Gabung Sekarang →' : 'Merge Files Now →')}
              {toolSlug === 'split-pdf' && (isId ? 'Pisahkan PDF →' : 'Split PDF Now →')}
              {toolSlug === 'remove-pages' && (isId ? 'Hapus & Simpan →' : 'Remove & Save →')}
              {toolSlug === 'extract-pages' && (isId ? 'Ekstrak Halaman →' : 'Extract Pages →')}
              {toolSlug === 'organize-pdf' && (isId ? 'Simpan PDF →' : 'Save Ordered PDF →')}
              {toolSlug === 'rotate-pdf' && (isId ? 'Simpan Rotasi →' : 'Save Rotated PDF →')}
            </span>
          )}
        </Button>
      </div>

    </div>
  );
};
