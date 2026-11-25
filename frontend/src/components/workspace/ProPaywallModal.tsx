'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { SPRINGS } from '@/lib/motion';
import { Sparkles, Crown, X, ShieldCheck, Check, ArrowUpRight } from 'lucide-react';

export const ProPaywallModal: React.FC = () => {
  const {
    isPaywallOpen,
    setPaywallOpen,
    activeProToolName,
    credits,
    language,
    t,
    user,
    openAuthModal,
  } = useApp();

  const isId = language === 'id';

  return (
    <AnimatePresence>
      {isPaywallOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={SPRINGS.panel}
            className="relative w-full max-w-lg rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-card-elevated p-6 sm:p-8 space-y-6 overflow-hidden"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setPaywallOpen(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[11px] font-mono font-semibold uppercase tracking-[0.06em]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.paywall.kicker}</span>
              </div>
              <h3 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--color-text)]">
                {t.paywall.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto">
                {t.paywall.subtitle} <strong>{activeProToolName}</strong>.
              </p>
            </div>

            {/* Sign In Prompt if guest */}
            {!user && (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)]">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-[var(--color-text)]">
                    {isId ? 'Masuk ke Akun Terlebih Dahulu' : 'Sign In First'}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {isId ? 'Kredit & status VVIP terhubung ke email akun Anda.' : 'Credits and VVIP attach directly to your account email.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPaywallOpen(false);
                    openAuthModal('login');
                  }}
                  className="px-3.5 py-2 rounded-full bg-[var(--color-text)] text-[var(--color-surface)] text-xs font-medium shrink-0"
                >
                  {isId ? 'Masuk' : 'Sign In'}
                </button>
              </div>
            )}

            {/* Options (Strictly redirect to /pricing for manual admin-verified order) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-semibold text-[var(--color-text)]">
                    <span>{t.paywall.optionCredits}</span>
                    <span className="text-[var(--color-accent)]">{t.paywall.optionCreditsCost}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
                    {t.paywall.yourBalance} <strong className="text-[var(--color-text)]">{credits}</strong>
                  </p>
                </div>
                <Link
                  href="/pricing"
                  onClick={() => setPaywallOpen(false)}
                  className="w-full h-9 px-4 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>{t.paywall.topUp}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-4 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/[0.06] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--color-accent)]">
                    <Crown className="w-3.5 h-3.5" />
                    <span>{t.paywall.vvipTitle}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display text-lg font-bold text-[var(--color-text)]">
                      {isId ? 'Rp 29.000' : '$2.00'}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                      {t.paywall.vvipPeriod}
                    </span>
                  </div>
                  <ul className="text-[11px] text-[var(--color-text-secondary)] space-y-1 mt-2">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
                      <span>{t.paywall.vvipAdv1}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
                      <span>{t.paywall.vvipAdv2}</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/pricing"
                  onClick={() => setPaywallOpen(false)}
                  className="w-full h-9 px-4 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>{t.paywall.simulateVvip}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--color-text-muted)] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>{t.paywall.zeroStorageNotice}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
