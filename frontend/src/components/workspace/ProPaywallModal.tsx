'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Crown, X, ShieldCheck, Check } from 'lucide-react';

export const ProPaywallModal: React.FC = () => {
  const {
    isPaywallOpen,
    setPaywallOpen,
    activeProToolName,
    credits,
    isVvip,
    addCredits,
    activateVvip,
    spendCredits,
    language,
    t,
    user,
    loginWithGoogle,
    openAuthModal
  } = useApp();

  if (!isPaywallOpen) return null;

  const isId = language === 'id';

  const handleSimulateDeduct = () => {
    if (spendCredits(2)) {
      alert(isId ? `Berhasil menggunakan 2 kredit untuk ${activeProToolName}!` : `Successfully used 2 credits for ${activeProToolName}!`);
      setPaywallOpen(false);
    } else {
      alert(isId ? 'Kredit Anda tidak mencukupi! Silakan beli kredit atau aktifkan VVIP.' : 'Insufficient credits! Please top up credits or activate VVIP.');
    }
  };

  const handleSimulateTopUp = () => {
    addCredits(12);
    alert(isId ? 'Simulasi Berhasil: +12 Kredit telah ditambahkan ke akun Anda!' : 'Simulated Top-Up: +12 Credits added to your account balance!');
  };

  const handleSimulateVvip = () => {
    activateVvip();
    alert(isId ? 'Simulasi Berhasil: Akses VVIP Unlimited telah aktif!' : 'Simulated VVIP: Unlimited access activated successfully!');
    setPaywallOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-[0px_25px_60px_rgba(0,0,0,0.3)] p-6 sm:p-8 space-y-6 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => setPaywallOpen(false)}
          className="absolute top-5 right-5 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff3700]/10 text-[#ff3700] text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.paywall.kicker}</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            {t.paywall.title}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            {t.paywall.subtitle} <strong>{activeProToolName}</strong>.
          </p>
        </div>

        {/* Blurred Preview Box */}
        <div className="relative h-28 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 p-4 overflow-hidden flex flex-col justify-center">
          <div className="space-y-2 select-none filter blur-[3.5px] opacity-60">
            <div className="h-3 bg-neutral-300 dark:bg-zinc-700 rounded w-3/4"></div>
            <div className="h-2.5 bg-neutral-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-2.5 bg-neutral-200 dark:bg-zinc-800 rounded w-5/6"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-[1px]">
            <Badge variant="pro" size="md">
              {t.paywall.verified}
            </Badge>
          </div>
        </div>

        {/* Google Sign In Callout if not signed in */}
        {!user && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-zinc-800/80 border border-black/5 dark:border-white/5">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-black dark:text-white">
                {isId ? 'Simpan Kredit Anda Permanen' : 'Save Your Credits Across Devices'}
              </p>
              <p className="text-[11px] text-neutral-500">
                {isId ? 'Masuk dengan Google agar saldo tidak hilang.' : 'Sign in to sync credits to your profile.'}
              </p>
            </div>
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 text-xs font-bold border border-black/10 dark:border-white/10 shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isId ? 'Masuk / Daftar' : 'Sign In / Register'}</span>
            </button>
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Option A: Credits */}
          <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-zinc-800/50 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
                <span>{t.paywall.optionCredits}</span>
                <span className="text-[#ff3700]">{t.paywall.optionCreditsCost}</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                {t.paywall.yourBalance} <strong>{credits} {t.nav.credits}</strong>
              </p>
            </div>
            {credits >= 2 || isVvip ? (
              <Button size="sm" variant="primary" onClick={handleSimulateDeduct} className="w-full !text-xs">
                {t.paywall.unlockWithCredits}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={handleSimulateTopUp} className="w-full !text-xs">
                {t.paywall.topUp}
              </Button>
            )}
          </div>

          {/* Option B: VVIP */}
          <div className="p-4 rounded-2xl border-2 border-[#ff3700] bg-[#ff3700]/5 dark:bg-[#ff3700]/10 space-y-3 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff3700]">
                <Crown className="w-3.5 h-3.5" />
                <span>{t.paywall.vvipTitle}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-extrabold text-black dark:text-white">
                  {isId ? 'Rp 29.000' : '$2.00'}
                </span>
                <span className="text-[10px] text-neutral-500">{t.paywall.vvipPeriod}</span>
              </div>
              <ul className="text-[10px] text-neutral-600 dark:text-neutral-300 space-y-0.5 mt-2">
                <li className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#ff3700]" /> {t.paywall.vvipAdv1}
                </li>
                <li className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#ff3700]" /> {t.paywall.vvipAdv2}
                </li>
              </ul>
            </div>
            <Button size="sm" variant="accent" onClick={handleSimulateVvip} className="w-full !text-xs">
              {t.paywall.simulateVvip}
            </Button>
          </div>

        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t.paywall.zeroStorageNotice}</span>
        </div>

      </div>
    </div>
  );
};
