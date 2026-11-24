'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { BentoCard } from '@/components/ui/BentoCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  CreditCard,
  X,
  User as UserIcon
} from 'lucide-react';

export default function PricingPage() {
  const { credits, isVvip, addCredits, activateVvip, language, t, user, loginWithGoogle, openAuthModal } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [qrisModalItem, setQrisModalItem] = useState<{ name: string; price: string; credits?: number; isVvip?: boolean } | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenPayment = (name: string, price: string, credits?: number, isVvip?: boolean) => {
    setQrisModalItem({ name, price, credits, isVvip });
  };

  const handleSimulatePaymentSuccess = () => {
    if (!qrisModalItem) return;

    if (qrisModalItem.isVvip) {
      activateVvip();
      showNotification(language === 'id' ? 'Pembayaran QRIS Berhasil! Status VVIP Anda telah aktif.' : 'Payment Successful! PurePDF VVIP is now active.');
    } else if (qrisModalItem.credits) {
      addCredits(qrisModalItem.credits);
      showNotification(language === 'id' ? `Pembayaran QRIS Berhasil! +${qrisModalItem.credits} Kredit ditambahkan.` : `Payment Successful! +${qrisModalItem.credits} Credits added.`);
    }

    setQrisModalItem(null);
  };

  const isId = language === 'id';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 space-y-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-[0_10px_30px_rgba(0,0,0,0.3)] text-xs sm:text-sm font-medium animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 text-xs font-mono select-none">
          <span className="font-semibold text-black dark:text-white">{t.pricing.kicker}</span>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <span className="text-[#ff3700] font-bold">
            {t.pricing.balance}: {isVvip ? t.pricing.vvipUnlimited : `${credits} ${t.pricing.credits}`}
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-black dark:text-white leading-[1.1]">
          {t.pricing.title1}{' '}
          <span className="font-editorial text-[#ff3700] font-normal">{t.pricing.titleHighlight}</span>{' '}
          {t.pricing.title2}
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
          {t.pricing.description}
        </p>

        {/* Google Sign In CTA Banner if not logged in */}
        {!user && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-black/10 dark:border-white/10 max-w-xl mx-auto shadow-sm">
            <div className="text-center sm:text-left space-y-0.5">
              <p className="text-xs font-bold text-black dark:text-white">
                {isId ? 'Simpan Kredit Anda Permanen' : 'Sync & Save Your Credits Across Devices'}
              </p>
              <p className="text-[11px] text-neutral-500">
                {isId ? 'Masuk dengan Google agar kredit tetap tersimpan di akun Anda.' : 'Sign in with Google so your credits attach permanently to your email.'}
              </p>
            </div>
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-black dark:text-white text-xs font-bold border border-black/10 dark:border-white/10 shadow-sm transition-transform active:scale-95 shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isId ? 'Masuk / Daftar Akun' : 'Sign In / Register'}</span>
            </button>
          </div>
        )}
      </section>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Tier 1: Starter (Rp 5.000 / $0.50) */}
        <BentoCard padding="lg" rounded="xl" className="flex flex-col justify-between space-y-6 bg-white dark:bg-zinc-900">
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase text-neutral-500">{t.pricing.starterTitle}</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-black dark:text-white">
                {isId ? 'Rp 5.000' : '$0.50'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                {isId ? '~$0.50 USD / Sekali Bayar' : 'Rp 5.000 / One-time'}
              </p>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {t.pricing.starterDesc}
            </p>

            <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 pt-2 border-t border-black/5 dark:border-white/5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>5 AI Credits</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.pricing.starterItem2}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.pricing.starterItem3}</span>
              </li>
            </ul>
          </div>

          <Button
            size="md"
            variant="secondary"
            onClick={() => handleOpenPayment(t.pricing.starterTitle, isId ? 'Rp 5.000' : '$0.50', 5)}
            className="w-full"
          >
            {isId ? 'Beli 5 Kredit (Rp 5.000)' : 'Buy 5 Credits ($0.50)'}
          </Button>
        </BentoCard>

        {/* Tier 2: Decoy (Rp 10.000 / $1.00) */}
        <BentoCard padding="lg" rounded="xl" className="flex flex-col justify-between space-y-6 bg-white dark:bg-zinc-900">
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase text-neutral-500">{t.pricing.decoyTitle}</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-black dark:text-white">
                {isId ? 'Rp 10.000' : '$1.00'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                {isId ? '~$1.00 USD / Sekali Bayar' : 'Rp 10.000 / One-time'}
              </p>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {t.pricing.decoyDesc}
            </p>

            <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 pt-2 border-t border-black/5 dark:border-white/5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>12 AI Credits</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.pricing.decoyItem2}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.pricing.decoyItem3}</span>
              </li>
            </ul>
          </div>

          <Button
            size="md"
            variant="secondary"
            onClick={() => handleOpenPayment(t.pricing.decoyTitle, isId ? 'Rp 10.000' : '$1.00', 12)}
            className="w-full"
          >
            {isId ? 'Beli 12 Kredit (Rp 10.000)' : 'Buy 12 Credits ($1.00)'}
          </Button>
        </BentoCard>

        {/* Tier 3: Popular Pack (Rp 15.000 / $1.50) */}
        <BentoCard padding="lg" rounded="xl" className="flex flex-col justify-between space-y-6 relative bg-white dark:bg-zinc-900">
          <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300">
            {t.pricing.popularBadge}
          </span>
          <div className="space-y-4">
            <span className="text-xs font-mono uppercase text-neutral-500">{t.pricing.popularTitle}</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-black dark:text-white">
                {isId ? 'Rp 15.000' : '$1.50'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                {isId ? '~$1.50 USD / Sekali Bayar' : 'Rp 15.000 / One-time'}
              </p>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {t.pricing.popularDesc}
            </p>

            <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300 pt-2 border-t border-black/5 dark:border-white/5">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>25 AI Credits</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.pricing.popularItem2}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.pricing.popularItem3}</span>
              </li>
            </ul>
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={() => handleOpenPayment(t.pricing.popularTitle, isId ? 'Rp 15.000' : '$1.50', 25)}
            className="w-full"
          >
            {isId ? 'Beli 25 Kredit (Rp 15.000)' : 'Buy 25 Credits ($1.50)'}
          </Button>
        </BentoCard>

        {/* Tier 4: PurePDF VVIP Pass (Rp 29.000 / $2.00) */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#ff3700] to-[#d62e00] text-white p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-[0px_8px_32px_rgba(255,55,0,0.35)] scale-100 lg:scale-105 border-2 border-white/20">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-black text-white shadow-md select-none whitespace-nowrap">
            {t.pricing.vvipBadge}
          </span>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-white/90">
              <Crown className="w-4 h-4 fill-white" />
              <span>{t.pricing.vvipTag}</span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1">
                <h3 className="text-3xl sm:text-4xl font-extrabold">
                  {isId ? 'Rp 29.000' : '$2.00'}
                </h3>
                <span className="text-xs font-medium text-white/80">{t.pricing.vvipPeriod}</span>
              </div>
              <p className="text-xs text-white/80 font-mono">
                {isId ? '~$2.00 USD / Batalkan kapan saja' : 'Rp 29.000 / Cancel anytime'}
              </p>
            </div>

            <p className="text-xs text-white/90 leading-relaxed">
              {t.pricing.vvipDesc}
            </p>

            <ul className="space-y-2 text-xs text-white pt-2 border-t border-white/20">
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>{t.pricing.vvipItem1}</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>{t.pricing.vvipItem2}</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>{t.pricing.vvipItem3}</span>
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>{t.pricing.vvipItem4}</span>
              </li>
            </ul>
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={() => handleOpenPayment('PurePDF VVIP Pass', isId ? 'Rp 29.000' : '$2.00', undefined, true)}
            className="w-full !bg-white !text-black hover:!bg-neutral-100 shadow-[0_4px_16px_rgba(0,0,0,0.3)] !text-sm !font-bold"
          >
            {isVvip ? t.pricing.vvipActive : isId ? 'Aktifkan VVIP (Rp 29.000)' : 'Activate VVIP ($2.00)'}
          </Button>
        </div>

      </div>

      {/* Payment Methods Info Box */}
      <section className="bento-card p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-black dark:text-white">{t.pricing.paymentTitle}</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t.pricing.paymentDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-neutral-400">
          <span>{t.pricing.sslEncrypted}</span>
        </div>
      </section>

      {/* QRIS / Checkout Simulation Modal */}
      {qrisModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-[0px_25px_60px_rgba(0,0,0,0.3)] p-6 sm:p-8 space-y-6">
            
            <button
              onClick={() => setQrisModalItem(null)}
              className="absolute top-5 right-5 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 hover:text-black dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#ff3700] font-bold">
                {isId ? 'METODE PEMBAYARAN INSTAN' : 'INSTANT SECURE CHECKOUT'}
              </span>
              <h3 className="text-xl font-bold">{qrisModalItem.name}</h3>
              <p className="text-2xl font-black text-[#ff3700]">{qrisModalItem.price}</p>
            </div>

            {/* Google Sign In reminder in modal if not logged in */}
            {!user && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-100 dark:bg-zinc-800 border border-black/5 dark:border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-black dark:text-white">
                    {isId ? 'Ingin simpan kredit ke akun?' : 'Attach credits to account?'}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    {isId ? 'Masuk dengan Google sebelum checkout.' : 'Sign in with Google before completing.'}
                  </p>
                </div>
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 text-xs font-bold border border-black/10 dark:border-white/10 shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
                >
                  <UserIcon className="w-3 h-3 text-[#ff3700]" />
                  <span>{isId ? 'Masuk' : 'Sign In'}</span>
                </button>
              </div>
            )}

            {/* QRIS or Card UI */}
            {isId ? (
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  <QrCode className="w-4 h-4 text-[#ff3700]" />
                  <span>Scan QRIS (Semua Pembayaran)</span>
                </div>
                {/* Mock QR Code Image/Box */}
                <div className="w-44 h-44 mx-auto bg-white p-3 rounded-xl border border-neutral-300 shadow-inner flex flex-col items-center justify-center">
                  <div className="w-36 h-36 border-4 border-black border-dashed flex flex-col items-center justify-center text-black text-[11px] font-mono font-bold p-2 text-center">
                    [ QRIS MOCK ]
                    <span className="text-[9px] font-normal text-neutral-500 mt-1">GoPay / OVO / Dana / BCA</span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Buka aplikasi e-wallet / mobile banking lalu scan QR di atas.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  <CreditCard className="w-4 h-4 text-[#ff3700]" />
                  <span>Stripe / LemonSqueezy Gateway</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-neutral-500">
                    Card: •••• •••• •••• 4242
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 font-mono text-center">
                  Instant card authorization with auto credit sync.
                </p>
              </div>
            )}

            <Button
              size="md"
              variant="accent"
              onClick={handleSimulatePaymentSuccess}
              className="w-full !font-bold"
            >
              {isId ? 'Konfirmasi & Simulasikan Pembayaran Berhasil' : 'Simulate Successful Payment'}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
