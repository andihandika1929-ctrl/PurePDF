'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useSmoothScroll } from '@/components/providers/MotionProviders';
import { SPRINGS, EASES } from '@/lib/motion';
import {
  Check,
  Crown,
  ShieldCheck,
  X,
  User as UserIcon,
  Mail,
  Instagram,
  Copy,
  CheckCheck,
  ExternalLink,
  QrCode,
} from 'lucide-react';

const ADMIN_EMAIL = 'andihandika1929@gmail.com';
const ADMIN_IG_URL = 'https://instagram.com/andihandikaaaa';

interface OrderPackage {
  name: string;
  priceId: string;
  priceEn: string;
  creditsLabel: string;
  isVvip?: boolean;
}

export default function PricingPage() {
  const { credits, isVvip, language, t, user, openAuthModal } = useApp();
  const { lenis } = useSmoothScroll();
  const [selectedOrder, setSelectedOrder] = useState<OrderPackage | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const isId = language === 'id';

  // Pause Lenis smooth scroll while order modal is open + close on Escape
  useEffect(() => {
    if (lenis) {
      if (selectedOrder) lenis.stop();
      else lenis.start();
    }
    if (!selectedOrder) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrder(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedOrder, lenis]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_EMAIL);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2200);
    } catch {}
  };

  const buildMailtoHref = (pkg: OrderPackage) => {
    const price = isId ? pkg.priceId : `${pkg.priceEn} (${pkg.priceId})`;
    const userEmail = user?.email || (isId ? '[isi email akun PurePDF saya]' : '[my PurePDF account email]');
    const subject = encodeURIComponent(`[PurePDF Order] ${pkg.name} — ${price}`);
    const body = encodeURIComponent(
      isId
        ? `Halo Admin PurePDF,\n\nSaya ingin melakukan order manual (QRIS / Transfer):\n- Paket: ${pkg.name}\n- Harga: ${price}\n- Email Akun PurePDF: ${userEmail}\n\nMohon info QRIS / rekening transfernya. Terima kasih!`
        : `Hi PurePDF Admin,\n\nI would like to place a manual order (QRIS / Bank Transfer):\n- Package: ${pkg.name}\n- Price: ${price}\n- PurePDF Account Email: ${userEmail}\n\nPlease share payment instructions. Thank you!`
    );
    return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
  };

  const packages: {
    id: string;
    badge?: string;
    title: string;
    priceId: string;
    priceEn: string;
    subId: string;
    subEn: string;
    desc: string;
    items: string[];
    ctaId: string;
    ctaEn: string;
    creditsLabel: string;
    isPopular?: boolean;
    isVvip?: boolean;
  }[] = [
    {
      id: 'starter',
      title: t.pricing.starterTitle,
      priceId: 'Rp 5.000',
      priceEn: '$0.50',
      subId: '~$0.50 USD / Sekali Bayar',
      subEn: 'Rp 5.000 / One-time',
      desc: t.pricing.starterDesc,
      items: ['5 AI Credits', t.pricing.starterItem2, t.pricing.starterItem3],
      ctaId: 'Order 5 Kredit (Rp 5.000)',
      ctaEn: 'Order 5 Credits ($0.50)',
      creditsLabel: '5 AI Credits',
    },
    {
      id: 'best-value',
      title: t.pricing.decoyTitle,
      priceId: 'Rp 10.000',
      priceEn: '$1.00',
      subId: '~$1.00 USD / Sekali Bayar',
      subEn: 'Rp 10.000 / One-time',
      desc: t.pricing.decoyDesc,
      items: ['12 AI Credits', t.pricing.decoyItem2, t.pricing.decoyItem3],
      ctaId: 'Order 12 Kredit (Rp 10.000)',
      ctaEn: 'Order 12 Credits ($1.00)',
      creditsLabel: '12 AI Credits',
    },
    {
      id: 'power',
      badge: t.pricing.popularBadge,
      title: t.pricing.popularTitle,
      priceId: 'Rp 15.000',
      priceEn: '$1.50',
      subId: '~$1.50 USD / Sekali Bayar',
      subEn: 'Rp 15.000 / One-time',
      desc: t.pricing.popularDesc,
      items: ['25 AI Credits', t.pricing.popularItem2, t.pricing.popularItem3],
      ctaId: 'Order 25 Kredit (Rp 15.000)',
      ctaEn: 'Order 25 Credits ($1.50)',
      creditsLabel: '25 AI Credits',
      isPopular: true,
    },
    {
      id: 'vvip',
      badge: t.pricing.vvipBadge,
      title: 'PurePDF VVIP Pass',
      priceId: 'Rp 29.000',
      priceEn: '$2.00',
      subId: '~$2.00 USD / bulan • Batalkan kapan saja',
      subEn: 'Rp 29.000 / month • Cancel anytime',
      desc: t.pricing.vvipDesc,
      items: [t.pricing.vvipItem1, t.pricing.vvipItem2, t.pricing.vvipItem3, t.pricing.vvipItem4],
      ctaId: isVvip ? t.pricing.vvipActive : 'Order VVIP (Rp 29.000)',
      ctaEn: isVvip ? t.pricing.vvipActive : 'Order VVIP ($2.00)',
      creditsLabel: 'VVIP Unlimited Pass (30 Days)',
      isVvip: true,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-16 space-y-14">
      {/* Header */}
      <section className="text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-mono uppercase tracking-[0.06em] select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
          <span className="font-semibold text-[var(--color-text)]">{t.pricing.kicker}</span>
          <span className="text-[var(--color-border-strong)]">•</span>
          <span className="text-[var(--color-accent)] font-semibold">
            {t.pricing.balance}: {isVvip ? t.pricing.vvipUnlimited : `${credits} ${t.pricing.credits}`}
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-[-0.035em] text-[var(--color-text)] leading-[1.06]">
          {t.pricing.title1}{' '}
          <span className="text-[var(--color-accent)]">{t.pricing.titleHighlight}</span>{' '}
          {t.pricing.title2}
        </h1>

        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
          {t.pricing.description}
        </p>

        {/* Sign-In Reminder Banner if guest */}
        {!user && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] max-w-xl mx-auto">
            <div className="text-center sm:text-left space-y-0.5">
              <p className="text-xs font-semibold text-[var(--color-text)]">
                {isId ? 'Masuk agar kredit masuk ke akun Anda' : 'Sign in to attach credits to your account'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isId
                  ? 'Admin akan mengaktifkan paket langsung ke email akun yang Anda gunakan.'
                  : 'Admin activates your package directly onto your registered account email.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[var(--color-text)] text-[var(--color-surface)] text-xs font-medium shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{isId ? 'Masuk / Daftar' : 'Sign In / Register'}</span>
            </button>
          </div>
        )}
      </section>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {packages.map((pkg) => {
          if (pkg.isVvip) {
            return (
              <motion.div
                key={pkg.id}
                whileHover={{ y: -4 }}
                transition={SPRINGS.tactile}
                className="relative rounded-lg bg-[var(--color-accent)] text-[var(--color-on-accent)] p-6 sm:p-7 flex flex-col justify-between gap-6 border border-[var(--color-accent)] shadow-accent-glow"
              >
                {pkg.badge && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-[0.06em] bg-[#111110] text-white select-none">
                    {pkg.badge}
                  </span>
                )}

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-[0.06em] text-white/90">
                    <Crown className="w-3.5 h-3.5" />
                    <span>{t.pricing.vvipTag}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.03em]">
                        {isId ? pkg.priceId : pkg.priceEn}
                      </h3>
                      <span className="text-xs font-mono text-white/80">{t.pricing.vvipPeriod}</span>
                    </div>
                    <p className="text-xs text-white/80 font-mono">
                      {isId ? pkg.subId : pkg.subEn}
                    </p>
                  </div>

                  <p className="text-sm text-white/90 leading-relaxed">{pkg.desc}</p>

                  <ul className="space-y-2 text-xs text-white pt-3 border-t border-white/20">
                    {pkg.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  transition={SPRINGS.tactile}
                  onClick={() =>
                    setSelectedOrder({
                      name: pkg.title,
                      priceId: pkg.priceId,
                      priceEn: pkg.priceEn,
                      creditsLabel: pkg.creditsLabel,
                      isVvip: true,
                    })
                  }
                  className="w-full h-11 px-5 rounded-full bg-white hover:bg-neutral-100 text-[#111110] font-display font-semibold text-sm transition-colors"
                >
                  {isId ? pkg.ctaId : pkg.ctaEn}
                </motion.button>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={pkg.id}
              whileHover={{ y: -4 }}
              transition={SPRINGS.tactile}
              className={`relative rounded-lg bg-[var(--color-surface)] border p-6 sm:p-7 flex flex-col justify-between gap-6 transition-[border-color,box-shadow] duration-200 ${
                pkg.isPopular
                  ? 'border-[var(--color-border-strong)] shadow-card-elevated'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)] shadow-card'
              }`}
            >
              {pkg.badge && (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded-sm text-[10px] font-mono font-semibold uppercase tracking-[0.06em] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {pkg.badge}
                </span>
              )}

              <div className="space-y-4">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)] block">
                  {pkg.title}
                </span>

                <div className="space-y-1">
                  <h3 className="font-display text-3xl font-bold tracking-[-0.03em] text-[var(--color-text)]">
                    {isId ? pkg.priceId : pkg.priceEn}
                  </h3>
                  <p className="text-xs font-mono text-[var(--color-text-muted)]">
                    {isId ? pkg.subId : pkg.subEn}
                  </p>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {pkg.desc}
                </p>

                <ul className="space-y-2 text-xs text-[var(--color-text-secondary)] pt-3 border-t border-[var(--color-border)]">
                  {pkg.items.map((item, i) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 mt-0.5" />
                      <span className={i === 0 ? 'font-semibold text-[var(--color-text)]' : ''}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                transition={SPRINGS.tactile}
                onClick={() =>
                  setSelectedOrder({
                    name: pkg.title,
                    priceId: pkg.priceId,
                    priceEn: pkg.priceEn,
                    creditsLabel: pkg.creditsLabel,
                  })
                }
                className={`w-full h-11 px-5 rounded-full font-display font-semibold text-sm transition-colors ${
                  pkg.isPopular
                    ? 'bg-[var(--color-text)] text-[var(--color-surface)] hover:opacity-90'
                    : 'bg-[var(--color-surface-subtle)] hover:bg-[var(--color-text)] text-[var(--color-text)] hover:text-[var(--color-surface)] border border-[var(--color-border)]'
                }`}
              >
                {isId ? pkg.ctaId : pkg.ctaEn}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Payment Verification Info Box */}
      <section className="rounded-lg p-6 sm:p-7 bg-[var(--color-surface)] border border-[var(--color-border)] max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-md bg-[var(--color-surface-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-semibold text-[var(--color-text)]">
              {t.pricing.paymentTitle}
            </h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t.pricing.paymentDesc}
            </p>
          </div>
        </div>

        <div className="shrink-0 font-mono text-[11px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-sm bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
          {t.pricing.sslEncrypted}
        </div>
      </section>

      {/* Manual Order Confirmation Modal (QRIS / Bank Transfer — ZERO Simulation) */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRINGS.panel}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent
              className="relative w-full max-w-md rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-card-elevated p-6 sm:p-7 space-y-5"
            >
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order modal"
                className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-1.5 pr-8">
                <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-accent)] font-semibold">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{isId ? 'KONFIRMASI ORDER MANUAL (QRIS / TRANSFER)' : 'MANUAL ORDER (QRIS / TRANSFER)'}</span>
                </div>
                <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-[var(--color-text)]">
                  {selectedOrder.name}
                </h3>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono uppercase text-[var(--color-text-muted)]">
                    {isId ? 'Paket' : 'Package'}
                  </span>
                  <span className="font-semibold text-[var(--color-text)]">
                    {selectedOrder.creditsLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono uppercase text-[var(--color-text-muted)]">
                    {isId ? 'Total Harga' : 'Price'}
                  </span>
                  <span className="font-display text-base font-bold text-[var(--color-accent)]">
                    {isId
                      ? `${selectedOrder.priceId} (${selectedOrder.priceEn})`
                      : `${selectedOrder.priceEn} (${selectedOrder.priceId})`}
                  </span>
                </div>
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <span className="font-mono uppercase text-[var(--color-text-muted)]">
                    {isId ? 'Email Akun' : 'Account Email'}
                  </span>
                  {user?.email ? (
                    <span className="font-mono font-semibold text-[var(--color-text)] truncate max-w-[210px]">
                      {user.email}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(null);
                        openAuthModal('login');
                      }}
                      className="font-mono font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      {isId ? 'Masuk dulu →' : 'Sign in first →'}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {isId
                  ? 'Kirim detail paket di atas ke admin via Instagram atau Email untuk mendapatkan QRIS / rekening transfer. Saldo atau status VVIP akan diaktifkan manual oleh admin setelah pembayaran terverifikasi.'
                  : 'Send the order details above to our admin via Instagram DM or Email to receive QRIS / transfer details. Credits or VVIP status will be activated by admin once payment is confirmed.'}
              </p>

              {/* Action Buttons: Order via Instagram + Order via Email + Copy Email */}
              <div className="space-y-2.5">
                <a
                  href={ADMIN_IG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 px-5 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-display font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{isId ? 'Order via Instagram' : 'Order via Instagram'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={buildMailtoHref(selectedOrder)}
                  className="w-full h-11 px-5 rounded-full bg-[var(--color-text)] hover:opacity-90 text-[var(--color-surface)] font-display font-semibold text-sm inline-flex items-center justify-center gap-2 transition-opacity"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isId ? 'Order via Email' : 'Order via Email'}</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="w-full h-10 px-4 rounded-md bg-[var(--color-bg)] hover:bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] inline-flex items-center justify-center gap-2 transition-colors"
                >
                  {copiedEmail ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-[var(--color-success)]" />
                      <span className="text-[var(--color-success)] font-semibold">
                        {isId ? `Tersalin: ${ADMIN_EMAIL}` : `Copied: ${ADMIN_EMAIL}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <span>
                        {isId ? `Copy Email (${ADMIN_EMAIL})` : `Copy Email (${ADMIN_EMAIL})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
