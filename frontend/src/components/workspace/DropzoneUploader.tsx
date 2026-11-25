'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ToolMeta } from '@/config/toolsConfig';
import { useApp } from '@/context/AppContext';
import { SPRINGS, EASES } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CircularProgressRing } from '@/components/ui/MotionStatus';
import { AdSenseCountdownGate } from './AdSenseCountdownGate';
import { PageGridBoard } from './PageGridBoard';
import { CompressOptions, AdvancedCompressSettings } from './CompressOptions';
import { SignPdfPanel, SignPdfOptions } from './SignPdfPanel';
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
  pdfToPptx,
  pdfToExcel,
  compressPdf,
  compressPdfAdvanced,
  protectPdf,
  unlockPdf,
  watermarkPdf,
  addPageNumbers,
  cropPdf,
  redactPdf,
  overlayPdf,
  repairPdf,
  convertToGrayscalePdf,
  ocrPdf,
  signPdf,
  wordToPdf,
  excelToPdf,
  pptToPdf,
  htmlToPdf,
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
  Download,
  RotateCcw,
  ArrowDown,
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
    openAuthModal,
    refreshUserProfile,
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
  const [isHoveringDropzone, setIsHoveringDropzone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isColdStartNotice, setIsColdStartNotice] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<{
    jobId: string;
    blob: Blob;
    filename: string;
    mimeType: string;
    fileSize: number;
    originalSize: number;
    isTextDominated?: boolean;
  } | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // Interactive Document Canvas Editor states (AI Edit Scanned)
  const [scanEditorData, setScanEditorData] = useState<ScanEditorResponse | null>(null);
  const [isEditorActive, setIsEditorActive] = useState<boolean>(false);

  useEffect(() => {
    onEditorActiveChange?.(isEditorActive);
  }, [isEditorActive, onEditorActiveChange]);

  // Show reassuring Render cold-start notice if a PRO AI server request takes > 4s
  useEffect(() => {
    if (!isProcessing || !tool.isPro) {
      setIsColdStartNotice(false);
      return;
    }
    const timer = setTimeout(() => setIsColdStartNotice(true), 4000);
    return () => clearTimeout(timer);
  }, [isProcessing, tool.isPro]);

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

  // Helper to hand over completed result to inline SVG-checkmark success state (and store in jobStore)
  const handoffDownload = (blob: Blob, filename: string, mimeType: string, isTextDominated?: boolean) => {
    const randomJobId = 'job_' + Math.random().toString(36).substring(2, 9);
    const originalSize = file?.size || 0;
    jobStore.setJob(randomJobId, {
      blob,
      filename,
      mimeType,
      fileSize: blob.size,
      originalSize,
      toolSlug: tool.slug,
      isTextDominated,
    });
    setProgress(100);
    setStatusMessage(t.uploader.readyStatus);
    setHasDownloaded(false);
    setCompletedResult({
      jobId: randomJobId,
      blob,
      filename,
      mimeType,
      fileSize: blob.size,
      originalSize,
      isTextDominated,
    });
    setIsProcessing(false);
  };

  const triggerDirectDownload = () => {
    if (!completedResult) return;
    setHasDownloaded(true);
    const url = URL.createObjectURL(completedResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = completedResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  // Execution dispatcher for standard Tier 1 operations
  const executeOperation = async (customParams?: any) => {
    if (!file && !isImageToPdf) {
      fileInputRef.current?.click();
      return;
    }

    // PRO AI Tools pre-check (actual atomic credit deduction is enforced server-side in FastAPI!)
    if (tool.isPro && !isInternalMode) {
      if (!user) {
        openAuthModal('login');
        return;
      }
      const cost = tool.creditCost || 2;
      const hasDailyVvip = isVvip && dailyAiUsed < 15;
      if (!isUnlimited && !hasDailyVvip && credits < cost) {
        setActiveProToolName(toolName);
        setPaywallOpen(true);
        return;
      }
      recordUsageLog(tool.slug, true, isUnlimited || hasDailyVvip ? 0 : cost).catch(console.error);
    } else {
      recordUsageLog(tool.slug, false, 0).catch(console.error);
    }

    setIsProcessing(true);
    setCompletedResult(null);
    setHasDownloaded(false);
    setProgress(10);
    setStatusMessage(t.uploader.reading);
    setErrorMessage(null);

    const baseName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';

    try {
      // 0. PRO AI Tools Backend Execution (server verifies JWT & deducts credits atomically)
      if (tool.slug === 'force-unlock-pdf') {
        setStatusMessage(
          isId
            ? 'Menghubungkan ke server AI & melepas proteksi dokumen...'
            : 'Connecting to AI server & stripping security restrictions...'
        );
        setProgress(40);
        try {
          const blob = await apiForceUnlock(file!, password);
          setProgress(100);
          refreshUserProfile().catch(() => {});
          handoffDownload(blob, `${baseName}_unlocked.pdf`, 'application/pdf');
          return;
        } catch (backendErr: any) {
          if (backendErr?.status === 401) {
            openAuthModal('login');
            throw new Error(isId ? 'Sesi login Anda habis. Silakan masuk kembali.' : 'Your session expired. Please sign in again.');
          }
          if (backendErr?.status === 402) {
            setActiveProToolName(toolName);
            setPaywallOpen(true);
            throw new Error(isId ? 'Kredit atau kuota harian AI Anda tidak mencukupi.' : 'Insufficient AI credits or daily quota.');
          }
          if (backendErr?.status === 413) {
            throw new Error(backendErr.message);
          }
          throw new Error(
            isId
              ? 'Server AI sedang sibuk atau bangun dari mode tidur. Mohon coba beberapa detik lagi.'
              : 'The AI server is currently waking up or busy. Please try again in a few seconds.'
          );
        }
      }

      if (tool.slug === 'high-accuracy-pdf-to-word') {
        setStatusMessage(
          isId
            ? 'Menghubungkan ke server AI & mengonversi ke Word presisi tinggi...'
            : 'Connecting to AI server & converting to high-accuracy Word...'
        );
        setProgress(40);
        try {
          const blob = await apiPdfToWord(file!);
          setProgress(100);
          refreshUserProfile().catch(() => {});
          handoffDownload(
            blob,
            `${baseName}_high_accuracy.docx`,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          );
          return;
        } catch (backendErr: any) {
          if (backendErr?.status === 401) {
            openAuthModal('login');
            throw new Error(isId ? 'Sesi login Anda habis. Silakan masuk kembali.' : 'Your session expired. Please sign in again.');
          }
          if (backendErr?.status === 402) {
            setActiveProToolName(toolName);
            setPaywallOpen(true);
            throw new Error(isId ? 'Kredit atau kuota harian AI Anda tidak mencukupi.' : 'Insufficient AI credits or daily quota.');
          }
          if (backendErr?.status === 413) {
            throw new Error(backendErr.message);
          }
          throw new Error(
            isId
              ? 'Server AI sedang sibuk atau bangun dari mode tidur. Mohon coba beberapa detik lagi.'
              : 'The AI server is currently waking up or busy. Please try again in a few seconds.'
          );
        }
      }

      if (tool.slug === 'ai-edit-pdf') {
        setStatusMessage(
          isId
            ? 'Memindai teks OCR & tekstur kertas dokumen...'
            : 'Scanning OCR text boxes & paper texture...'
        );
        setProgress(40);
        try {
          const scanRes = await apiScanEditor(file!, 0);
          setProgress(90);
          setStatusMessage(
            isId
              ? 'Menyiapkan editor visual interaktif...'
              : 'Initializing interactive visual editor...'
          );
          setScanEditorData(scanRes);
          setIsEditorActive(true);
          setIsProcessing(false);
          return;
        } catch (backendErr: any) {
          if (backendErr?.status === 401) {
            openAuthModal('login');
            throw new Error(isId ? 'Sesi login Anda habis. Silakan masuk kembali.' : 'Your session expired. Please sign in again.');
          }
          if (backendErr?.status === 402) {
            setActiveProToolName(toolName);
            setPaywallOpen(true);
            throw new Error(isId ? 'Kredit atau kuota harian AI Anda tidak mencukupi.' : 'Insufficient AI credits or daily quota.');
          }
          if (backendErr?.status === 413) {
            throw new Error(backendErr.message);
          }
          throw new Error(
            isId
              ? 'Server AI sedang sibuk atau bangun dari mode tidur. Mohon coba beberapa detik lagi.'
              : 'The AI server is currently waking up or busy. Please try again in a few seconds.'
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

      if (tool.slug === 'word-to-pdf') {
        const blob = await wordToPdf(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'excel-to-pdf') {
        const blob = await excelToPdf(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'ppt-to-pdf') {
        const blob = await pptToPdf(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'html-to-pdf') {
        const blob = await htmlToPdf(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}.pdf`, 'application/pdf');
        return;
      }

      if (tool.slug === 'sign-pdf') {
        const sigOpts = customParams as SignPdfOptions | undefined;
        if (!sigOpts?.signaturePngDataUrl) {
          throw new Error(
            isId
              ? 'Silakan buat tanda tangan terlebih dahulu sebelum memproses.'
              : 'Please draw or type your signature before applying.'
          );
        }
        const blob = await signPdf(file!, sigOpts.signaturePngDataUrl, sigOpts, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(blob, `${baseName}_signed.pdf`, 'application/pdf');
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

      if (tool.slug === 'pdf-to-ppt') {
        const blob = await pdfToPptx(file!, (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        });
        handoffDownload(
          blob,
          `${baseName}.pptx`,
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        );
        return;
      }

      if (tool.slug === 'pdf-to-txt') {
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
    <div className="w-full rounded-lg p-5 sm:p-8 space-y-6 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-card">
      
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={tool.slug === 'merge-pdf' || isImageToPdf}
        accept={
          isImageToPdf
            ? '.jpg,.jpeg,.png,.webp'
            : tool.slug === 'ai-edit-pdf'
            ? '.pdf,.jpg,.jpeg,.png,.webp'
            : tool.slug === 'word-to-pdf'
            ? '.docx,.doc,.txt'
            : tool.slug === 'excel-to-pdf'
            ? '.xlsx,.xls,.csv'
            : tool.slug === 'ppt-to-pdf'
            ? '.pptx,.ppt'
            : tool.slug === 'html-to-pdf'
            ? '.html,.htm'
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
            refreshUserProfile().catch(() => {});
            setIsEditorActive(false);
            setScanEditorData(null);
            handoffDownload(finalBlob, filename, 'application/pdf');
          }}
        />
      ) : !file && imageFiles.length === 0 ? (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseEnter={() => setIsHoveringDropzone(true)}
          onMouseLeave={() => setIsHoveringDropzone(false)}
          onClick={() => fileInputRef.current?.click()}
          animate={{
            scale: isDragging ? 1.02 : 1,
          }}
          transition={SPRINGS.tactile}
          className={`relative overflow-hidden flex flex-col items-center justify-center px-6 py-10 sm:p-12 rounded-md border-2 border-dashed cursor-pointer select-none transition-[border-color,background-color,box-shadow] duration-200 ${
            isDragging
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/[0.07] shadow-[0_0_0_4px_rgba(255,55,0,0.16),0_16px_36px_-8px_rgba(255,55,0,0.24)]'
              : 'border-[var(--color-border-strong)] hover:border-[var(--color-accent)]/70 bg-[var(--color-bg)]/70 hover:shadow-[0_8px_24px_-8px_rgba(17,17,16,0.1)]'
          }`}
        >
          {/* Swiss Corner Registration Marks */}
          <span
            className={`pointer-events-none absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 transition-colors ${
              isDragging ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-strong)]'
            }`}
          />
          <span
            className={`pointer-events-none absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 transition-colors ${
              isDragging ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-strong)]'
            }`}
          />
          <span
            className={`pointer-events-none absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 transition-colors ${
              isDragging ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-strong)]'
            }`}
          />
          <span
            className={`pointer-events-none absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 transition-colors ${
              isDragging ? 'border-[var(--color-accent)]' : 'border-[var(--color-border-strong)]'
            }`}
          />

          {/* Tactile Stacked-Paper Spring Visual */}
          <div className="relative w-24 h-20 flex items-center justify-center mb-5">
            {/* Back-Left Paper Sheet */}
            <motion.div
              animate={
                isDragging
                  ? { x: -20, y: -6, rotate: -13, opacity: 1 }
                  : isHoveringDropzone
                  ? { x: -11, y: -2, rotate: -7, opacity: 0.9 }
                  : { x: -5, y: 2, rotate: -3, opacity: 0.7 }
              }
              transition={SPRINGS.tactile}
              className="absolute w-12 h-16 rounded-sm bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-card"
            >
              <div className="mt-3 mx-2 space-y-1.5">
                <div className="h-1 w-6 rounded-full bg-[var(--color-border)]" />
                <div className="h-1 w-4 rounded-full bg-[var(--color-border)]" />
              </div>
            </motion.div>

            {/* Back-Right Paper Sheet */}
            <motion.div
              animate={
                isDragging
                  ? { x: 20, y: -6, rotate: 13, opacity: 1 }
                  : isHoveringDropzone
                  ? { x: 11, y: -2, rotate: 7, opacity: 0.9 }
                  : { x: 5, y: 2, rotate: 3, opacity: 0.7 }
              }
              transition={SPRINGS.tactile}
              className="absolute w-12 h-16 rounded-sm bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-card"
            >
              <div className="mt-3 mx-2 space-y-1.5">
                <div className="h-1 w-5 rounded-full bg-[var(--color-border)]" />
                <div className="h-1 w-7 rounded-full bg-[var(--color-border)]" />
              </div>
            </motion.div>

            {/* Front Active Paper Sheet */}
            <motion.div
              animate={
                isDragging
                  ? { y: -10, scale: 1.08, rotate: 0 }
                  : isHoveringDropzone
                  ? { y: -4, scale: 1.03, rotate: 0 }
                  : { y: 0, scale: 1, rotate: 0 }
              }
              transition={SPRINGS.tactile}
              className={`relative z-10 w-14 h-18 py-3 rounded-sm bg-[var(--color-surface)] border flex flex-col items-center justify-center gap-1.5 shadow-card-elevated transition-colors ${
                isDragging
                  ? 'border-[var(--color-accent)]'
                  : 'border-[var(--color-border-strong)]'
              }`}
            >
              <UploadCloud
                className={`w-6 h-6 transition-colors ${
                  isDragging || isHoveringDropzone
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-text)]'
                }`}
              />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {isImageToPdf ? 'IMG' : 'PDF'}
              </span>
            </motion.div>
          </div>

          <h3 className="font-display text-lg sm:text-xl font-semibold tracking-[-0.02em] text-[var(--color-text)] text-center">
            {isDragging ? (
              <span className="text-[var(--color-accent)]">
                {isId ? 'Lepas file untuk memuat ke memori' : 'Release to load into memory'}
              </span>
            ) : (
              <>
                {t.uploader.dropTitle}{' '}
                <span className="text-[var(--color-accent)] underline underline-offset-4">
                  {t.uploader.browse}
                </span>
              </>
            )}
          </h3>

          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--color-text-muted)] mt-2 text-center">
            {t.uploader.maxSize}
          </p>

          <motion.div
            whileTap={{ scale: 0.97 }}
            transition={SPRINGS.tactile}
            className="mt-6"
          >
            <Button size="md" variant="primary" type="button">
              {isImageToPdf
                ? isId
                  ? 'Pilih Gambar (JPG, PNG)'
                  : 'Select Images (JPG, PNG)'
                : t.uploader.selectFile}
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        /* FILE LOADED & WORKSPACE CONTROLS (Paper-Drop Spring Entrance) */
        <motion.div
          key="workspace-loaded"
          initial={{ opacity: 0, y: -14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={SPRINGS.tactile}
          className="space-y-6"
        >
          
          {/* File Card Header */}
          <div className="flex items-center justify-between p-4 rounded-md bg-[var(--color-surface-subtle)]/70 border border-[var(--color-border)]">
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-md bg-[var(--color-text)] text-[var(--color-surface)] flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="font-display text-sm font-semibold text-[var(--color-text)] truncate">
                  {isImageToPdf && imageFiles.length > 1
                    ? `${imageFiles.length} ${isId ? 'gambar dipilih' : 'images selected'}`
                    : file?.name}
                </p>
                <p className="text-xs font-mono text-[var(--color-text-muted)]">
                  {file ? formatFileSize(file.size) : ''} · {completedResult ? (isId ? 'Selesai diproses' : 'Processed') : t.uploader.ready}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setImageFiles([]);
                setAdditionalFiles([]);
                setTemplateFile(null);
                setSecondFile(null);
                setIsProcessing(false);
                setCompletedResult(null);
                setHasDownloaded(false);
                setErrorMessage(null);
              }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] font-mono transition-colors p-2"
            >
              {t.uploader.remove}
            </button>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: EASES.precision }}
                className="p-4 rounded-md bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/35 text-[var(--color-danger)] text-sm"
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Panel: Circular Progress Ring + Horizontal Bar + Spinner Button */}
          <AnimatePresence mode="wait">
            {isProcessing && (
              <motion.div
                key="processing-panel"
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={SPRINGS.panel}
                className="p-6 sm:p-8 rounded-md bg-[var(--color-bg)] border border-[var(--color-accent)]/35 space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <CircularProgressRing progress={progress} size={82} strokeWidth={4.5} />

                  <div className="flex-1 w-full space-y-2.5 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-accent)] font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isId ? 'MEMPROSES DI MEMORI' : 'PROCESSING IN MEMORY'}</span>
                    </div>
                    <p className="font-display text-base font-semibold text-[var(--color-text)]">
                      {statusMessage || (isId ? 'Sedang memproses dokumen...' : 'Processing document...')}
                    </p>
                    <div className="w-full h-2 rounded-full bg-[var(--color-surface-subtle)] overflow-hidden border border-[var(--color-border)]">
                      <motion.div
                        className="h-full w-full bg-[var(--color-accent)] origin-left rounded-full"
                        initial={{ scaleX: 0.04 }}
                        animate={{ scaleX: Math.max(0.04, Math.min(1, progress / 100)) }}
                        transition={SPRINGS.mechanical}
                      />
                    </div>
                    {isColdStartNotice && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-mono text-[var(--color-text-muted)] pt-1"
                      >
                        {isId
                          ? 'Server AI sedang bangun dari mode tidur (cold-start ~30–50 detik pada permintaan pertama). Mohon jangan tutup halaman ini.'
                          : 'Waking up AI server from cold-start (~30–50s on first request). Please keep this tab open.'}
                      </motion.p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center sm:justify-end pt-2 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)] font-mono text-xs font-semibold cursor-wait select-none"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-accent)]" />
                    <span>{isId ? 'Memproses...' : 'Processing...'}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Inline 3-Tier Completion & AdSense Countdown Gate */}
            {!isProcessing && completedResult && (
              <AdSenseCountdownGate
                filename={completedResult.filename}
                mimeType={completedResult.mimeType}
                fileSize={completedResult.fileSize}
                originalSize={completedResult.originalSize}
                hasDownloaded={hasDownloaded}
                onDownload={triggerDirectDownload}
                onReset={() => {
                  setFile(null);
                  setImageFiles([]);
                  setAdditionalFiles([]);
                  setTemplateFile(null);
                  setSecondFile(null);
                  setCompletedResult(null);
                  setHasDownloaded(false);
                  setErrorMessage(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* SPECIALIZED WORKSPACE PANELS */}
          {!isProcessing && !completedResult && (
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

              {/* 2b. Sign PDF Interactive Signature Pad */}
              {tool.slug === 'sign-pdf' && file && (
                <SignPdfPanel
                  onApply={(sigOptions) => executeOperation(sigOptions)}
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
                tool.slug !== 'sign-pdf' &&
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

        </motion.div>
      )}

    </div>
  );
};
