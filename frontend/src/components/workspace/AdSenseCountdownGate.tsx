'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { AdSlot } from '@/components/layout/AdSlot';
import { CircularProgressRing, AnimatedCheckmark } from '@/components/ui/MotionStatus';
import { SPRINGS } from '@/lib/motion';
import { Download, RotateCcw, ArrowDown, Crown, Zap, Clock } from 'lucide-react';

interface AdSenseCountdownGateProps {
  filename: string;
  mimeType: string;
  fileSize: number;
  originalSize: number;
  hasDownloaded: boolean;
  onDownload: () => void;
  onReset: () => void;
}

const COUNTDOWN_SECONDS = 12;

export const AdSenseCountdownGate: React.FC<AdSenseCountdownGateProps> = ({
  filename,
  mimeType,
  fileSize,
  originalSize,
  hasDownloaded,
  onDownload,
  onReset,
}) => {
  const { instantDownload, isVvipActive, credits, language, t } = useApp();
  const isId = language === 'id';

  const [secondsLeft, setSecondsLeft] = useState<number>(
    instantDownload ? 0 : COUNTDOWN_SECONDS
  );

  // Sync immediately if user logs in / upgrades while panel is mounted
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
  }, [instantDownload, secondsLeft]);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const isWaiting = !instantDownload && secondsLeft > 0;
  const elapsedPct = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  return (
    <motion.div
      key="success-panel"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={SPRINGS.panel}
      data-testid={isWaiting ? 'countdown-gate-waiting' : 'download-gate-ready'}
      className={`p-6 sm:p-8 rounded-md bg-[var(--color-bg)] border text-center space-y-6 ${
        isWaiting ? 'border-[var(--color-accent)]/40' : 'border-[var(--color-success)]/40'
      }`}
    >
      {/* Top Status Icon: Circular Countdown Ring OR SVG-Draw Checkmark */}
      <div className="flex flex-col items-center space-y-3">
        {isWaiting ? (
          <CircularProgressRing
            progress={elapsedPct}
            size={78}
            strokeWidth={4.5}
            label={`${secondsLeft}s`}
          />
        ) : (
          <AnimatedCheckmark size={72} />
        )}

        <div className="space-y-1">
          {isVvipActive ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-accent)] font-semibold">
              <Crown className="w-3.5 h-3.5" />
              <span>{isId ? 'VVIP · BEBAS IKLAN · DOWNLOAD 0 DETIK' : 'VVIP · 100% AD-FREE · 0S INSTANT'}</span>
            </span>
          ) : instantDownload ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-success)] font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>
                {isId
                  ? `KREDIT AKTIF (${credits}) · DOWNLOAD INSTAN 0 DETIK`
                  : `CREDITS ACTIVE (${credits}) · 0S INSTANT DOWNLOAD`}
              </span>
            </span>
          ) : isWaiting ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-accent)] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isId
                  ? `MENYIAPKAN DOWNLOAD · ${secondsLeft} DETIK`
                  : `PREPARING DOWNLOAD · ${secondsLeft}S REMAINING`}
              </span>
            </span>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-success)] font-semibold">
              {isId ? 'PROSES SELESAI · 0 RETENTION' : 'COMPLETE · ZERO RETENTION'}
            </span>
          )}

          <h3 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--color-text)]">
            {isWaiting
              ? isId
                ? 'Menyiapkan Tautan Unduhan...'
                : 'Preparing Your Download...'
              : isId
              ? 'Dokumen Siap Diunduh'
              : 'Document Ready to Download'}
          </h3>
        </div>
      </div>

      {/* Output Telemetry Box */}
      <div className="max-w-md mx-auto p-4 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between gap-3 text-left">
        <div className="truncate">
          <p className="font-display text-sm font-semibold text-[var(--color-text)] truncate">
            {filename}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] mt-0.5">
            <span>{formatFileSize(fileSize)}</span>
            {originalSize > fileSize && (
              <span className="inline-flex items-center gap-0.5 text-[var(--color-success)] font-semibold">
                <ArrowDown className="w-3 h-3" />
                {Math.round((1 - fileSize / originalSize) * 100)}% {isId ? 'lebih hemat' : 'smaller'}
              </span>
            )}
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-1 rounded-sm bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)] shrink-0">
          {mimeType.split('/')[1] || 'PDF'}
        </span>
      </div>

      {/* Center AdSense Slot inside 12s Gate (Only for non-instant Tier 1 users) */}
      {!instantDownload && (
        <div className="flex flex-col items-center space-y-3">
          <AdSlot format="banner" className="mx-auto" />
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--color-accent)] hover:underline"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {isId
                ? 'Lewati timer 12 detik dengan Kredit (mulai Rp 5rb) atau bebas iklan 100% via VVIP →'
                : 'Skip 12s timer with any Credit Pack or go 100% Ad-Free with VVIP →'}
            </span>
          </Link>
        </div>
      )}

      {/* Primary Action Area — Strictly >= 24px (mt-8 = 32px) Safe Spacing from Ad Slot */}
      <div className="mt-8 pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <motion.button
          type="button"
          disabled={isWaiting}
          whileHover={isWaiting ? undefined : { y: -1 }}
          whileTap={isWaiting ? undefined : { scale: 0.97 }}
          transition={SPRINGS.tactile}
          onClick={onDownload}
          data-testid="gate-download-btn"
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 h-12 px-8 rounded-full font-display font-semibold text-sm transition-[filter,background-color] ${
            isWaiting
              ? 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed'
              : 'bg-[var(--color-success)] hover:brightness-110 text-white shadow-card-elevated'
          }`}
        >
          {isWaiting ? (
            <>
              <Clock className="w-4 h-4" />
              <span className="font-mono tabular-nums">
                {isId ? `Tunggu ${secondsLeft} detik...` : `Wait ${secondsLeft}s to Download...`}
              </span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>
                {hasDownloaded
                  ? isId
                    ? 'Unduh Lagi'
                    : 'Download Again'
                  : isId
                  ? 'Download File Sekarang'
                  : 'Download Processed File'}
              </span>
            </>
          )}
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          transition={SPRINGS.tactile}
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] border border-[var(--color-border)] font-medium text-xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isId ? 'Proses File Lain' : 'Process Another File'}</span>
        </motion.button>
      </div>

      {hasDownloaded && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-xs text-[var(--color-success)]"
        >
          ✓ {t.download.downloadStarted}
        </motion.p>
      )}
    </motion.div>
  );
};
