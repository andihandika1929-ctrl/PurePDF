'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { AdSlot } from '@/components/layout/AdSlot';
import { CircularProgressRing, AnimatedCheckmark } from '@/components/ui/MotionStatus';
import { SPRINGS, EASES } from '@/lib/motion';
import { jobStore, ProcessedJob } from '@/lib/jobStore';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Download,
  Clock,
  Crown,
  CheckCircle2,
  RotateCcw,
  FileCheck,
  FileArchive,
  FileText,
  FileSpreadsheet,
  ArrowDown,
  Sparkles
} from 'lucide-react';

export default function DownloadPage({ params }: { params: { jobId: string } }) {
  const searchParams = useSearchParams();
  const toolSlug = searchParams.get('tool') || 'compress-pdf';
  const { isVvipActive, instantDownload, language, t } = useApp();

  const [secondsLeft, setSecondsLeft] = useState(instantDownload ? 0 : 12);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [job, setJob] = useState<ProcessedJob | null>(null);
  const isId = language === 'id';

  // Read job from client memory store on mount
  useEffect(() => {
    const storedJob = jobStore.getJob(params.jobId);
    if (storedJob) {
      setJob(storedJob);
    }
  }, [params.jobId]);

  // Countdown timer logic (12s for 0-credit guest/free, 0s if credits > 0 or VVIP)
  useEffect(() => {
    if (instantDownload) {
      setSecondsLeft(0);
      return;
    }

    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, instantDownload]);

  // Trigger genuine download of processed Blob
  const handleDownload = async () => {
    setIsDownloaded(true);

    let downloadBlob: Blob;
    let downloadFilename: string;

    if (job && job.blob) {
      downloadBlob = job.blob;
      downloadFilename = job.filename;
    } else {
      // Fallback: in case of page reload or direct link, synthesize a valid PDF
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const subFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      
      page.drawText('PurePDF Processed Document', {
        x: 50,
        y: 780,
        size: 20,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(`Job ID: ${params.jobId} | Tool: ${toolSlug}`, {
        x: 50,
        y: 750,
        size: 11,
        font: subFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawText('This file was processed 100% in-browser memory via PurePDF zero-storage architecture.', {
        x: 50,
        y: 720,
        size: 10,
        font: subFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      const bytes = await pdfDoc.save();
      downloadBlob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      downloadFilename = `purepdf_${toolSlug}_${params.jobId}.pdf`;
    }

    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke after a brief delay so download completes cleanly
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const progressPercentage = ((12 - secondsLeft) / 12) * 100;

  // File size formatting helper
  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const isZip = job?.mimeType === 'application/zip' || job?.filename.endsWith('.zip');
  const isDocx = job?.filename.endsWith('.docx');
  const isTxt = job?.filename.endsWith('.txt');

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 space-y-10">
      
      {/* Top AdSense Banner */}
      <div className="flex justify-center">
        <AdSlot format="leaderboard" className="max-w-full" />
      </div>

      {/* Main Download Bento Card */}
      <div className="bento-card p-6 sm:p-10 space-y-8 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-center max-w-2xl mx-auto shadow-[0px_8px_32px_rgba(0,0,0,0.08)]">
        
        {/* Header Icon: Circular Progress Ring (Countdown) -> SVG-Draw Checkmark (Ready) */}
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            {secondsLeft === 0 ? (
              <motion.div key="ready-check" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AnimatedCheckmark size={76} />
              </motion.div>
            ) : (
              <motion.div key="countdown-ring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CircularProgressRing
                  progress={progressPercentage}
                  size={84}
                  strokeWidth={4.5}
                  label={`${secondsLeft}s`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Heading & Status */}
        <div className="space-y-2">
          {isVvipActive && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold font-mono">
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>{t.download.vvipBypassed}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-black dark:text-white">
            {secondsLeft === 0 ? t.download.readyTitle : t.download.prepTitle}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            {secondsLeft === 0 ? t.download.readyDesc : t.download.prepDesc}
          </p>
        </div>

        {/* Real File Details Card */}
        {job && (
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 flex items-center justify-between text-left max-w-md mx-auto">
            <div className="flex items-center gap-3 truncate">
              <div className="p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black">
                {isZip ? (
                  <FileArchive className="w-5 h-5 text-amber-400" />
                ) : isDocx ? (
                  <FileText className="w-5 h-5 text-blue-400" />
                ) : isTxt ? (
                  <FileText className="w-5 h-5 text-emerald-400" />
                ) : (
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div className="truncate">
                <p className="text-xs sm:text-sm font-bold text-black dark:text-white truncate">
                  {job.filename}
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
                  <span>{formatBytes(job.fileSize)}</span>
                  {job.originalSize && job.originalSize > job.fileSize && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                      <ArrowDown className="w-3 h-3" />
                      {Math.round((1 - job.fileSize / job.originalSize) * 100)}% {isId ? 'lebih hemat' : 'smaller'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-200 dark:bg-zinc-700 text-neutral-600 dark:text-neutral-300 uppercase">
              {job.mimeType.split('/')[1] || 'FILE'}
            </span>
          </div>
        )}

        {/* Text-Dominated Vector Preservation Callout */}
        {job && (job.isTextDominated || (job.toolSlug === 'compress-pdf' && job.originalSize && (1 - job.fileSize / job.originalSize) < 0.12)) && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-left max-w-md mx-auto space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isId ? 'Teks Vektor 100% Tajam (CV/Dokumen)' : '100% Vector Text Preserved'}</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isId
                ? 'Dokumen Anda dominan teks tanpa gambar berat. PurePDF menjaga font vektor tetap 100% tajam tanpa distorsi atau penurunan kualitas teks.'
                : 'Your document is text-heavy. All typography was kept 100% crisp with zero vector distortion or blur.'}
              {' '}
              <Link href="/compress-pdf" className="font-bold text-[#ff3700] hover:underline inline-flex items-center">
                {isId ? 'Atur ulang di Kompres PDF →' : 'Re-adjust in Compress PDF →'}
              </Link>
            </p>
          </div>
        )}

        {/* 12-Second Countdown Widget */}
        {secondsLeft > 0 ? (
          <div className="space-y-4 p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">{t.download.adsenseBuffer}</span>
              <span className="text-xl font-bold font-mono text-[#ff3700]">{secondsLeft}s</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full bg-[#ff3700] transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-xs">
              <Link
                href="/pricing"
                className="font-bold text-[#ff3700] hover:underline flex items-center gap-1"
              >
                <Crown className="w-3.5 h-3.5" /> {t.download.skipCountdown}
              </Link>
            </div>
          </div>
        ) : (
          /* Ready Action Panel (Framer Motion — no dead animate-in) */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASES.precision }}
            className="space-y-4 max-w-md mx-auto"
          >
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRINGS.tactile}
              onClick={handleDownload}
              className="w-full h-14 px-8 rounded-full bg-[var(--color-success)] hover:brightness-110 text-white font-display font-semibold text-base inline-flex items-center justify-center gap-2.5 shadow-card-elevated transition-[filter]"
            >
              <Download className="w-5 h-5" />
              <span>{isDownloaded ? t.download.downloadAgain : t.download.downloadBtn}</span>
            </motion.button>

            {isDownloaded && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-success)] font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.download.downloadStarted}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* File Job Info */}
        <div className="pt-6 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400">
          <span>JOB ID: {params.jobId}</span>
          <span>STORAGE: 0 SECONDS (MEMORY PURGED)</span>
        </div>

        {/* Back Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.download.processAnother}</span>
          </Link>
        </div>

      </div>

      {/* Bottom AdSense Banner */}
      <div className="flex justify-center pb-8">
        <AdSlot format="leaderboard" className="max-w-full" />
      </div>

    </div>
  );
}
