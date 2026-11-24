'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToolMeta } from '@/config/toolsConfig';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageGridBoard } from './PageGridBoard';
import { CompressOptions, AdvancedCompressSettings } from './CompressOptions';
import { jobStore } from '@/lib/jobStore';
import {
  mergePdfs,
  splitPdf,
  splitPdfEvenOdd,
  splitPdfEveryNPages,
  deletePages,
  extractPages,
  reorderAndRotatePages,
  rotatePdf,
  imagesToPdf,
  pdfToImages,
  pdfToText,
  pdfToWordDocx,
  pdfToExcel,
  compressPdf,
  compressPdfAdvanced,
  protectPdf,
  unlockPdf,
  flattenPdf,
  watermarkPdf,
  addPageNumbers,
  cropPdf,
  redactPdf,
  overlayPdf,
  repairPdf,
  convertToGrayscalePdf,
  ocrPdf,
  genericDocumentToPdf,
} from '@/lib/clientPdfOps';
import {
  UploadCloud,
  FileCheck2,
  ArrowRight,
  Loader2,
  Lock,
  Stamp,
  Hash,
  Crop,
  Layers,
  Image as ImageIcon,
  FileType,
  FileSpreadsheet,
  FileText,
  Scissors,
  CheckCircle2,
  Plus,
  EyeOff,
  Palette,
  Wrench,
  GitCompare,
  ScanLine,
  Crown,
  Zap,
  Sparkles,
  Infinity as InfinityIcon,
} from 'lucide-react';
import {
  apiCompressTarget,
  apiForceUnlock,
  apiPdfToWord,
  apiAiEditScanned,
  apiOcrDetect,
  apiInpaint,
  apiScanEditor,
  ScanEditorResponse,
  BACKEND_URL,
} from '@/lib/apiClient';
import { InteractiveDocumentEditor } from './InteractiveDocumentEditor';
import { recordUsageLog } from '@/lib/supabaseClient';

export const DropzoneUploader: React.FC<{
  tool: ToolMeta;
  onEditorActiveChange?: (active: boolean) => void;
}> = ({ tool, onEditorActiveChange }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const secondFileInputRef = useRef<HTMLInputElement>(null);
  const {
    user,
    setPaywallOpen,
    setActiveProToolName,
    isVvip,
    isUnlimited,
    dailyAiUsed,
    credits,
    spendCredits,
    openAuthModal,
    checkAndConsumeAiQuota,
    isInternalMode,
    language,
    t
  } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [secondFile, setSecondFile] = useState<File | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive Document Canvas Editor states (AI Edit Scanned)
  const [scanEditorData, setScanEditorData] = useState<ScanEditorResponse | null>(null);
  const [isEditorActive, setIsEditorActive] = useState<boolean>(false);

  useEffect(() => {
    onEditorActiveChange?.(isEditorActive);
  }, [isEditorActive, onEditorActiveChange]);

  // Form states for specialized tools
  const [password, setPassword] = useState('');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [cropTrim, setCropTrim] = useState(10);
  const [imageFormat, setImageFormat] = useState<'jpg' | 'png'>('jpg');

  // Redact & Overlay states
  const [redactKeywords, setRedactKeywords] = useState('CONFIDENTIAL, NIK, RAHASIA');
  const [overlayPosition, setOverlayPosition] = useState<'background' | 'foreground'>('background');
  const [ocrLanguage, setOcrLanguage] = useState('id');

  const toolName = language === 'id' ? tool.nameId : tool.nameEn;
  const isId = language === 'id';

  const isOrganizeTool = [
    'organize-pdf',
    'merge-pdf',
    'split-pdf',
    'remove-pages',
    'extract-pages',
    'rotate-pdf',
  ].includes(tool.slug);

  const isImageToPdf = tool.slug === 'jpg-to-pdf';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (isImageToPdf) {
        setImageFiles(Array.from(e.dataTransfer.files));
        setFile(e.dataTransfer.files[0]);
      } else {
        setFile(e.dataTransfer.files[0]);
        if (e.dataTransfer.files.length > 1) {
          setAdditionalFiles(Array.from(e.dataTransfer.files).slice(1));
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isImageToPdf) {
        setImageFiles(Array.from(e.target.files));
        setFile(e.target.files[0]);
      } else {
        setFile(e.target.files[0]);
        if (e.target.files.length > 1) {
          setAdditionalFiles(Array.from(e.target.files).slice(1));
        }
      }
    }
  };

  // Helper to hand over completed result to download page
  const handoffDownload = (blob: Blob, filename: string, mimeType: string, isTextDominated?: boolean) => {
    const randomJobId = 'job_' + Math.random().toString(36).substring(2, 9);
    jobStore.setJob(randomJobId, {
      blob,
      filename,
      mimeType,
      fileSize: blob.size,
      originalSize: file?.size || 0,
      toolSlug: tool.slug,
      isTextDominated,
    });
    router.push(`/download/${randomJobId}?tool=${tool.slug}`);
  };

  // Execution dispatcher for standard Tier 1 operations
  const executeOperation = async (customParams?: any) => {
    if (!file && !isImageToPdf) {
      fileInputRef.current?.click();
      return;
    }

    // PRO AI Tools check
    if (tool.isPro && !isInternalMode) {
      if (!user) {
        openAuthModal('login');
        return;
      }
      const cost = tool.creditCost || 2;
      const quotaRes = await checkAndConsumeAiQuota(cost);
      if (!quotaRes.allowed) {
        setActiveProToolName(toolName);
        setPaywallOpen(true);
        return;
      }
      const creditsCharged =
        quotaRes.quotaType === 'free_credits' || quotaRes.quotaType === 'vvip_backup'
          ? cost
          : 0;
      recordUsageLog(tool.slug, true, creditsCharged).catch(console.error);
    } else {
      recordUsageLog(tool.slug, false, 0).catch(console.error);
    }

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage(t.uploader.reading);
    setErrorMessage(null);

    const baseName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';

    try {
      // 0. PRO AI Tools Backend Execution
      if (tool.slug === 'force-unlock-pdf') {
        setStatusMessage(
          isId
            ? 'Menghapus batasan izin dokumen...'
            : 'Stripping owner security restrictions...'
        );
        setProgress(40);
        try {
          const blob = await apiForceUnlock(file!, password);
          setProgress(100);
          handoffDownload(blob, `${baseName}_unlocked.pdf`, 'application/pdf');
          return;
        } catch (backendErr: any) {
          throw new Error(
            isId
              ? `⚠️ Layanan pemrosesan dokumen belum aktif di ${BACKEND_URL}. Silakan mulai server backend Python.`
              : `⚠️ Document processing service is offline at ${BACKEND_URL}. Please start the backend service.`
          );
        }
      }

      if (tool.slug === 'high-accuracy-pdf-to-word') {
        setStatusMessage(
          isId
            ? 'Mengonversi ke Word presisi tinggi...'
            : 'Converting to Word with neural layout preservation...'
        );
        setProgress(40);
        try {
          const blob = await apiPdfToWord(file!);
          setProgress(100);
          handoffDownload(
            blob,
            `${baseName}_high_accuracy.docx`,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          );
          return;
        } catch (backendErr: any) {
          throw new Error(
            isId
              ? `⚠️ Layanan pemrosesan dokumen belum aktif di ${BACKEND_URL}. Silakan mulai server backend Python.`
              : `⚠️ Document processing service is offline at ${BACKEND_URL}. Please start the backend service.`
          );
        }
      }

      if (tool.slug === 'ai-edit-pdf') {
        if (tool.isComingSoon) {
          throw new Error(
            isId
              ? 'Fitur AI Edit PDF Scan & Screenshot sedang dalam pengembangan dan segera hadir.'
              : 'AI Edit Scanned & Screenshot PDF is currently under development and coming soon.'
          );
        }
        setStatusMessage(
          isId
            ? 'Memindai area teks & warna dokumen...'
            : 'Scanning document text & color boundaries...'
        );
        setProgress(40);
        try {
          const scanRes = await apiScanEditor(file!, 0);
          setProgress(90);
          setStatusMessage(
            isId
              ? 'Menyiapkan kanvas editor...'
              : 'Initializing interactive canvas editor...'
          );
          setScanEditorData(scanRes);
          setIsEditorActive(true);
          setIsProcessing(false);
          return;
        } catch (backendErr: any) {
          throw new Error(
            isId
              ? `⚠️ Layanan pemrosesan dokumen belum aktif di ${BACKEND_URL}. Silakan mulai server backend Python.`
              : `⚠️ Document processing service is offline at ${BACKEND_URL}. Please start the backend service.`
          );
        }
      }
      // 1. Organize Tools handled via PageGridBoard callback
      if (tool.slug === 'merge-pdf') {
        const filesToMerge = customParams?.mergedFiles || [file!, ...additionalFiles];
        const blob = await mergePdfs(filesToMerge, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_merged.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'split-pdf') {
        if (customParams?.splitMode === 'evenOdd') {
          const result = await splitPdfEvenOdd(file!, (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          });
          handoffDownload(result.blob, result.filename, result.mimeType);
          return;
        }

        if (customParams?.splitMode === 'everyN') {
          const result = await splitPdfEveryNPages(file!, customParams.splitNPages || 2, (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          });
          handoffDownload(result.blob, result.filename, result.mimeType);
          return;
        }

        const result = await splitPdf(
          file!,
          customParams?.splitRange || '1-2',
          customParams?.splitAll || false,
          (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          }
        );
        handoffDownload(result.blob, result.filename, result.mimeType);
        return;
      }

      if (tool.slug === 'remove-pages') {
        const blob = await deletePages(
          file!,
          customParams?.pagesToDelete || [],
          (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          }
        );
        handoffDownload(blob, `${baseName}_cleaned.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'extract-pages') {
        const blob = await extractPages(
          file!,
          customParams?.pagesToExtract || [0],
          (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          }
        );
        handoffDownload(blob, `${baseName}_extracted.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'organize-pdf') {
        const blob = await reorderAndRotatePages(
          file!,
          customParams?.pagesConfig || [],
          (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          }
        );
        handoffDownload(blob, `${baseName}_organized.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'rotate-pdf') {
        const blob = await rotatePdf(
          file!,
          customParams?.rotationAngle || 90,
          (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          }
        );
        handoffDownload(blob, `${baseName}_rotated.pdf`, 'application/pdf');
        return;
      }

      // 2. Compress PDF (Preset or Advanced DPI/Quality, Vector-Safe)
      if (tool.slug === 'compress-pdf') {
        let compressResult: { blob: Blob; isTextDominated: boolean };
        if (customParams?.mode === 'advanced') {
          compressResult = await compressPdfAdvanced(file!, customParams, (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          });
        } else {
          const level = customParams?.level || 'medium';
          compressResult = await compressPdf(file!, level, (pct, msg) => {
            setProgress(pct);
            setStatusMessage(msg);
          });
        }
        handoffDownload(compressResult.blob, `${baseName}_compressed.pdf`, 'application/pdf', compressResult.isTextDominated);
        return;
      }

      // 3. Convert Tools
      if (tool.slug === 'jpg-to-pdf') {
        const imgs = imageFiles.length > 0 ? imageFiles : (file ? [file] : []);
        const blob = await imagesToPdf(imgs, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_images.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'pdf-to-jpg' || tool.slug === 'pdf-to-png') {
        const fmt = tool.slug === 'pdf-to-png' ? 'png' : imageFormat;
        const result = await pdfToImages(file!, fmt, 0.92, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(result.blob, result.filename, result.mimeType);
        return;
      }

      if (tool.slug === 'pdf-to-word') {
        const blob = await pdfToWordDocx(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(
          blob,
          `${baseName}.docx`,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        return;
      }

      if (tool.slug === 'pdf-to-excel') {
        const blob = await pdfToExcel(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_tables.csv`, 'text/csv');
        return;
      }

      if (tool.slug === 'pdf-to-ppt' || tool.slug === 'pdf-to-txt') {
        const blob = await pdfToText(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_extracted.txt`, 'text/plain');
        return;
      }

      // 4. Security & Optimization Tools
      if (tool.slug === 'protect-pdf') {
        const blob = await protectPdf(file!, password || 'purepdf123', (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_protected.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'unlock-pdf') {
        const blob = await unlockPdf(file!, password, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_unlocked.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'watermark-pdf') {
        const blob = await watermarkPdf(file!, watermarkText, watermarkOpacity, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_watermarked.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'page-numbers') {
        const blob = await addPageNumbers(file!, pageNumberPosition, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_numbered.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'crop-pdf') {
        const blob = await cropPdf(file!, cropTrim, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_cropped.pdf`, 'application/pdf');
        return;
      }

      // 5. New PDF24 Suite Tools (Redact, Overlay, Grayscale, Repair, OCR, Compare)
      if (tool.slug === 'redact-pdf') {
        const keywords = redactKeywords.split(',').map((s) => s.trim()).filter(Boolean);
        const blob = await redactPdf(file!, keywords, [], (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_redacted.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'overlay-pdf') {
        const tFile = templateFile || file!;
        const blob = await overlayPdf(file!, tFile, overlayPosition, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_overlayed.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'pdf-to-grayscale') {
        const blob = await convertToGrayscalePdf(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_grayscale.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'repair-pdf') {
        const blob = await repairPdf(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_repaired.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'ocr-pdf') {
        const blob = await ocrPdf(file!, ocrLanguage, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_searchable_ocr.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'compare-pdf') {
        const second = secondFile || file!;
        const text1 = await pdfToText(file!);
        const text2 = await pdfToText(second);
        const diffReport = `PurePDF Document Comparison Report\r\n` +
          `File 1: ${file!.name} (${(file!.size / 1024).toFixed(0)} KB)\r\n` +
          `File 2: ${second.name} (${(second.size / 1024).toFixed(0)} KB)\r\n` +
          `Date: ${new Date().toLocaleString()}\r\n` +
          `============================================================\r\n\r\n` +
          `[ORIGINAL DOCUMENT TEXT]:\r\n${await text1.text()}\r\n\r\n` +
          `============================================================\r\n` +
          `[REVISED DOCUMENT TEXT]:\r\n${await text2.text()}\r\n`;

        const blob = new Blob([diffReport], { type: 'text/plain;charset=utf-8' });
        handoffDownload(blob, `${baseName}_comparison_diff.txt`, 'text/plain');
        return;
      }

      // Generic Document to PDF (word-to-pdf, excel-to-pdf, ppt-to-pdf, html-to-pdf)
      const blob = await genericDocumentToPdf(file!, (pct, msg) => {
        setProgress(pct);
        setStatusMessage(msg);
      });
      handoffDownload(blob, `${baseName}_converted.pdf`, 'application/pdf');
    } catch (err: any) {
      console.error('Operation failed:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Processing failed. Please try a different document.');
    }
  };

  return (
    <div className="w-full bento-card p-6 sm:p-10 space-y-6 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-[0px_4px_24px_rgba(0,0,0,0.06)]">
      
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={tool.slug === 'merge-pdf' || isImageToPdf}
        accept={
          isImageToPdf
            ? '.jpg,.jpeg,.png,.webp'
            : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.html'
        }
        className="hidden"
        onChange={handleFileChange}
      />

      <input
        ref={templateInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setTemplateFile(e.target.files[0]);
          }
        }}
      />

      <input
        ref={secondFileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setSecondFile(e.target.files[0]);
          }
        }}
      />

      {/* 0. INTERACTIVE CANVAS DOCUMENT EDITOR (When in Editor mode) */}
      {isEditorActive && scanEditorData && file ? (
        <InteractiveDocumentEditor
          file={file}
          initialScan={scanEditorData}
          language={language}
          onClose={() => {
            setIsEditorActive(false);
            setScanEditorData(null);
          }}
          onDownload={(finalBlob, filename) => {
            handoffDownload(finalBlob, filename, 'application/pdf');
          }}
        />
      ) : !file && imageFiles.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-[#ff3700] bg-[#ff3700]/5 scale-[1.01]'
              : 'border-neutral-300 dark:border-zinc-700 hover:border-black dark:hover:border-white bg-neutral-50/50 dark:bg-zinc-950/50'
          }`}
        >
          <div className="p-4 rounded-full bg-white dark:bg-zinc-800 shadow-[0px_2px_8px_rgba(0,0,0,0.08)] mb-4">
            <UploadCloud className="w-8 h-8 text-[#ff3700]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-black dark:text-white text-center">
            {t.uploader.dropTitle} <span className="text-[#ff3700] underline">{t.uploader.browse}</span>
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 text-center">
            {t.uploader.maxSize}
          </p>

          <div className="mt-6">
            <Button size="md" variant="primary" type="button">
              {isImageToPdf
                ? isId
                  ? 'Pilih Gambar (JPG, PNG)'
                  : 'Select Images (JPG, PNG)'
                : t.uploader.selectFile}
            </Button>
          </div>
        </div>
      ) : (
        /* FILE LOADED & WORKSPACE CONTROLS */
        <div className="space-y-6">
          
          {/* File Card Header */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3 truncate">
              <div className="p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-black dark:text-white truncate">
                  {isImageToPdf && imageFiles.length > 1
                    ? `${imageFiles.length} ${isId ? 'gambar dipilih' : 'images selected'}`
                    : file?.name}
                </p>
                <p className="text-xs font-mono text-neutral-500">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''} • {t.uploader.ready}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setImageFiles([]);
                setAdditionalFiles([]);
                setTemplateFile(null);
                setSecondFile(null);
                setIsProcessing(false);
                setErrorMessage(null);
              }}
              className="text-xs text-neutral-500 hover:text-red-500 font-mono transition-colors p-2"
            >
              {t.uploader.remove}
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Progress Bar during execution */}
          {isProcessing && (
            <div className="space-y-3 p-5 rounded-2xl bg-[#ff3700]/5 border border-[#ff3700]/20 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#ff3700] font-bold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {statusMessage || 'Processing...'}
                </span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-[#ff3700] transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* SPECIALIZED WORKSPACE PANELS */}
          {!isProcessing && (
            <>
              {/* 1. PageGridBoard for Organize Tools */}
              {isOrganizeTool && file && (
                <PageGridBoard
                  toolSlug={tool.slug}
                  primaryFile={file}
                  additionalFiles={additionalFiles}
                  onAddFiles={(newFiles) => setAdditionalFiles((prev) => [...prev, ...newFiles])}
                  onRemoveFile={(idx) =>
                    setAdditionalFiles((prev) => prev.filter((_, i) => i !== idx - 1))
                  }
                  onExecute={executeOperation}
                  isProcessing={isProcessing}
                  language={language}
                />
              )}

              {/* 2. CompressOptions for Standard Compress PDF */}
              {tool.slug === 'compress-pdf' && file && (
                <CompressOptions
                  file={file}
                  onCompress={(settings: AdvancedCompressSettings) => executeOperation(settings)}
                  isProcessing={isProcessing}
                  language={language}
                />
              )}

              {/* 3. Protect PDF Password Options */}
              {tool.slug === 'protect-pdf' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <Lock className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Tentukan Password Dokumen' : 'Set Document Access Password'}</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isId ? 'Ketik password pengaman...' : 'Enter security password...'}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                  />
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Kunci & Enkripsi Dokumen →' : 'Encrypt & Protect PDF →'}
                  </Button>
                </div>
              )}

              {/* 4. Watermark PDF Options */}
              {tool.slug === 'watermark-pdf' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <Stamp className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Pengaturan Cap Air Watermark' : 'Watermark Stamp Settings'}</span>
                  </div>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="CONFIDENTIAL"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                  />
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500">{isId ? 'Transparansi:' : 'Opacity:'} {Math.round(watermarkOpacity * 100)}%</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-48 accent-[#ff3700]"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Beri Cap Air & Simpan →' : 'Apply Watermark & Save →'}
                  </Button>
                </div>
              )}

              {/* 5. Add Page Numbers Options */}
              {tool.slug === 'page-numbers' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <Hash className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Posisi Penomoran Halaman' : 'Page Number Position'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'bottom-center' as const, label: isId ? 'Bawah Tengah' : 'Bottom Center' },
                      { id: 'bottom-right' as const, label: isId ? 'Bawah Kanan' : 'Bottom Right' },
                      { id: 'top-right' as const, label: isId ? 'Atas Kanan' : 'Top Right' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPageNumberPosition(pos.id)}
                        className={`p-3 text-xs font-bold rounded-xl border transition-all ${
                          pageNumberPosition === pos.id
                            ? 'border-[#ff3700] bg-[#ff3700]/10 text-[#ff3700]'
                            : 'border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Cetak Nomor Halaman →' : 'Stamp Page Numbers →'}
                  </Button>
                </div>
              )}

              {/* 6. Crop PDF Options */}
              {tool.slug === 'crop-pdf' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <Crop className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Potong Margin Tepi Dokumen' : 'Trim Margin Percentage'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setCropTrim(pct)}
                        className={`p-2.5 text-xs font-bold rounded-xl border transition-all ${
                          cropTrim === pct
                            ? 'border-[#ff3700] bg-[#ff3700]/10 text-[#ff3700]'
                            : 'border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {pct}% {isId ? 'Tepi' : 'Trim'}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Potong Margin & Simpan →' : 'Crop Margins & Save →'}
                  </Button>
                </div>
              )}

              {/* 7. Redact / Blackout PDF Options (PDF24 style) */}
              {tool.slug === 'redact-pdf' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <EyeOff className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Kata Kunci atau Data yang Ingin Disensor' : 'Redaction & Blackout Settings'}</span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {isId
                      ? 'Area rahasia akan ditutup kotak hitam pekat permanen dan teks di baliknya dimusnahkan agar tidak bisa disalin.'
                      : 'Sensitive regions will be permanently masked with solid black vectors, destroying the underlying text.'}
                  </p>
                  <input
                    type="text"
                    value={redactKeywords}
                    onChange={(e) => setRedactKeywords(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL, NIK, 12345678"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                  />
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Hitamkan & Sensor Permanen →' : 'Apply Permanent Redaction →'}
                  </Button>
                </div>
              )}

              {/* 8. Overlay PDF / Letterhead Options (PDF24 style) */}
              {tool.slug === 'overlay-pdf' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <Layers className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Pilih Template Kertas Kop Surat' : 'Select Letterhead Template PDF'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                    <div className="truncate text-xs font-mono">
                      {templateFile ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Template: {templateFile.name}
                        </span>
                      ) : (
                        <span className="text-neutral-400">
                          {isId ? 'Belum ada template dipilih (opsional)' : 'No template selected yet'}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => templateInputRef.current?.click()}
                      className="text-xs h-8 bg-neutral-100 dark:bg-zinc-800"
                    >
                      {isId ? 'Unggah Kop Surat' : 'Upload Letterhead'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      {isId ? 'Posisi:' : 'Position:'}
                    </span>
                    {(['background', 'foreground'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setOverlayPosition(pos)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          overlayPosition === pos
                            ? 'border-[#ff3700] bg-[#ff3700]/10 text-[#ff3700]'
                            : 'border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {pos === 'background' ? (isId ? 'Latar Belakang' : 'Background') : (isId ? 'Latar Depan' : 'Foreground')}
                      </button>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Satukan Kop Surat & Dokumen →' : 'Overlay & Merge Letterhead →'}
                  </Button>
                </div>
              )}

              {/* 9. OCR PDF Options */}
              {tool.slug === 'ocr-pdf' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <ScanLine className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Pengaturan Pengenalan Teks (OCR)' : 'OCR Text Recognition Settings'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">
                      {isId ? 'Bahasa Dokumen:' : 'Document Language:'}
                    </span>
                    <select
                      value={ocrLanguage}
                      onChange={(e) => setOcrLanguage(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold focus:outline-none"
                    >
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English (US/UK)</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Jadikan Dokumen Bisa Dicari (OCR) →' : 'Generate Searchable OCR PDF →'}
                  </Button>
                </div>
              )}

              {/* 10. Compare PDF Options */}
              {tool.slug === 'compare-pdf' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <GitCompare className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Bandingkan Dokumen Revisi' : 'Compare with Revised Document'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                    <div className="truncate text-xs font-mono">
                      {secondFile ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {isId ? 'Draft Kedua:' : 'Draft 2:'} {secondFile.name}
                        </span>
                      ) : (
                        <span className="text-neutral-400">
                          {isId ? 'Pilih berkas draft kedua untuk dibandingkan' : 'Select second file for diffing'}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => secondFileInputRef.current?.click()}
                      className="text-xs h-8 bg-neutral-100 dark:bg-zinc-800"
                    >
                      {isId ? 'Unggah File ke-2' : 'Upload File 2'}
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Bandingkan Perbedaan Teks →' : 'Compare Differences Now →'}
                  </Button>
                </div>
              )}

              {/* 11. PDF to Grayscale Options */}
              {tool.slug === 'pdf-to-grayscale' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <Palette className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Konversi ke Skala Abu-Abu (Monokrom)' : 'Convert to Monochrome Grayscale'}</span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {isId
                      ? 'Menghilangkan seluruh elemen warna untuk menghemat tinta printer hingga 70% dan memperkecil ukuran file.'
                      : 'Desaturates all color elements into clean 8-bit black & white to save printer toner and disk space.'}
                  </p>
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Ubah ke Hitam Putih Sekarang →' : 'Convert to Grayscale Now →'}
                  </Button>
                </div>
              )}

              {/* 12. Repair PDF Options */}
              {tool.slug === 'repair-pdf' && file && (
                <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                    <Wrench className="w-4 h-4 text-[#ff3700]" />
                    <span>{isId ? 'Rekonstruksi & Perbaiki Berkas PDF' : 'Reconstruct & Repair PDF Streams'}</span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {isId
                      ? 'Memindai objek data dan membangun ulang tabel indeks XRef yang rusak agar dokumen dapat dibuka kembali.'
                      : 'Scans stream objects and rebuilds corrupt XRef indexing tables to restore unreadable documents.'}
                  </p>
                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? 'Perbaiki Dokumen Sekarang →' : 'Repair PDF Document Now →'}
                  </Button>
                </div>
              )}

              {/* 13. JPG to PDF Image Multi-Deck */}
              {isImageToPdf && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-500">
                      {imageFiles.length} {isId ? 'gambar akan digabung menjadi 1 PDF' : 'images will merge into 1 PDF'}
                    </span>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                          }
                        }}
                      />
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 shadow-sm">
                        <Plus className="w-3.5 h-3.5 text-[#ff3700]" />
                        {isId ? 'Tambah Gambar Lain' : 'Add More Photos'}
                      </span>
                    </label>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => executeOperation()}
                    className="w-full bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 rounded-full shadow-md"
                  >
                    {isId ? `Konversi ${imageFiles.length} Gambar ke PDF →` : `Convert ${imageFiles.length} Images to PDF →`}
                  </Button>
                </div>
              )}

              {/* 14. Default Action Bar for remaining tools (Convert, PRO AI, etc.) */}
              {!isOrganizeTool &&
                tool.slug !== 'compress-pdf' &&
                tool.slug !== 'protect-pdf' &&
                tool.slug !== 'watermark-pdf' &&
                tool.slug !== 'page-numbers' &&
                tool.slug !== 'crop-pdf' &&
                tool.slug !== 'redact-pdf' &&
                tool.slug !== 'overlay-pdf' &&
                tool.slug !== 'ocr-pdf' &&
                tool.slug !== 'compare-pdf' &&
                tool.slug !== 'pdf-to-grayscale' &&
                tool.slug !== 'repair-pdf' &&
                !isImageToPdf && (
                  <div className="flex flex-col gap-4 pt-2">
                    {/* Optional password input for Force Unlock tool */}
                    {tool.slug === 'force-unlock-pdf' && (
                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 space-y-2">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#ff3700]" />
                          <span>{isId ? 'Password Dokumen (Opsional)' : 'Document Password (Optional)'}</span>
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isId ? 'Kosongkan jika hanya ingin membuka batasan print / salin' : 'Leave empty if stripping print/copy restrictions only'}
                          className="w-full px-3.5 py-2 text-xs rounded-lg border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                        />
                      </div>
                    )}

                    {/* PRO AI Engine & Quota Status Indicator */}
                    {tool.isPro && !isInternalMode && (
                      <div className="w-full bg-neutral-900 text-neutral-100 rounded-2xl p-4 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#ff3700]/15 text-[#ff3700] flex items-center justify-center font-bold">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-2 text-white">
                              <span>AI Smart Document Engine</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ff3700] text-white">PRO AI</span>
                            </div>
                            <div className="text-xs text-neutral-400 font-mono mt-0.5">
                              {!user ? (
                                <span className="text-amber-400">
                                  {isId ? 'Perlu Login • 2 Kredit atau Gratis untuk Member VVIP' : 'Login Required • 2 Credits or Free for VVIP'}
                                </span>
                              ) : isUnlimited ? (
                                <span className="text-emerald-400 font-medium">
                                  {isId ? 'Akses Unlimited Aktif (0 Kredit)' : 'Unlimited Access Active (0 Credits)'}
                                </span>
                              ) : isVvip ? (
                                dailyAiUsed < 15 ? (
                                  <span className="text-emerald-400 font-medium">
                                    {isId ? `Sisa Kuota Harian: ${15 - dailyAiUsed} / 15 hari ini (Gratis)` : `Daily AI Quota: ${15 - dailyAiUsed} / 15 remaining today (Free)`}
                                  </span>
                                ) : (
                                  <span className="text-amber-400">
                                    {isId
                                      ? `Kuota Harian Habis (15/15) • Pakai Cadangan (${credits} pts tersedia, biaya 2 kredit)`
                                      : `Daily Quota Exhausted (15/15) • Using Reserve (${credits} pts available, costs 2 credits)`}
                                  </span>
                                )
                              ) : (
                                <span className={credits >= 2 ? 'text-neutral-300' : 'text-red-400 font-medium'}>
                                  {isId
                                    ? `Biaya: 2 Kredit • Saldo Anda: ${credits} pts ${credits < 2 ? '(Kredit Tidak Cukup)' : ''}`
                                    : `Cost: 2 Credits • Your Balance: ${credits} pts ${credits < 2 ? '(Insufficient Credits)' : ''}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!user ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openAuthModal('login')}
                            className="text-xs h-8 px-3.5 rounded-lg self-end sm:self-center bg-white text-black hover:bg-neutral-200"
                          >
                            {isId ? 'Masuk Akun' : 'Sign In'}
                          </Button>
                        ) : !isVvip && credits < 2 ? (
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => {
                              setActiveProToolName(toolName);
                              setPaywallOpen(true);
                            }}
                            className="text-xs h-8 px-3.5 rounded-lg self-end sm:self-center"
                          >
                            {isId ? 'Isi Kredit' : 'Top Up'}
                          </Button>
                        ) : null}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-mono">
                        {tool.isPro ? (
                          <>
                            <Badge variant="pro" size="sm">PRO</Badge>
                            <span>{t.uploader.proNotice}</span>
                          </>
                        ) : (
                          <span>{t.uploader.freeNotice}</span>
                        )}
                      </div>

                      <Button
                        size="lg"
                        variant="accent"
                        onClick={() => executeOperation()}
                        disabled={isProcessing}
                        className="w-full sm:w-auto h-12 px-8 rounded-full shadow-[0px_2px_12px_rgba(255,55,0,0.35)]"
                      >
                        <span className="flex items-center gap-2">
                          <span>{t.uploader.processWith} {toolName}</span>
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
            </>
          )}

        </div>
      )}

    </div>
  );
};
