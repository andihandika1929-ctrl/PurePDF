'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useSmoothScroll } from '@/components/providers/MotionProviders';
import { TOOLS } from '@/config/toolsConfig';
import { SPRINGS } from '@/lib/motion';
import { AccountDrawer } from '@/components/profile/AccountDrawer';
import {
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  Zap,
  Crown,
  Menu,
  X,
  Minimize2,
  FileSpreadsheet,
  Layers,
  Lock,
  User as UserIcon,
  ArrowUpRight,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { lenis } = useSmoothScroll();
  const {
    credits,
    isVvip,
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    user,
    logout,
    authLoading,
    isInternalMode,
    openAuthModal,
    isAccountDrawerOpen,
    openAccountDrawer,
    closeAccountDrawer,
  } = useApp();

  const availableTools = useMemo(
    () => (isInternalMode ? TOOLS.filter((tool) => !tool.isPro && tool.category !== '✨ PRO AI') : TOOLS),
    [isInternalMode]
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMegaMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close Mega-Menu on Escape
  useEffect(() => {
    if (!isMegaMenuOpen && !isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMegaMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMegaMenuOpen, isMobileMenuOpen]);

  // Pause Lenis scroll when overlays are open
  useEffect(() => {
    if (!lenis) return;
    if (isMegaMenuOpen || isAccountDrawerOpen) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [lenis, isMegaMenuOpen, isAccountDrawerOpen]);

  const proAiTools = availableTools.filter((item) => item.category === '✨ PRO AI');
  const compressTools = availableTools.filter((item) => item.category === 'Compress');
  const convertTools = availableTools.filter((item) => item.category === 'Convert');
  const organizeTools = availableTools.filter((item) => item.category === 'Organize');
  const securityTools = availableTools.filter((item) => item.category === 'Security');

  const isId = language === 'id';

  return (
    <header className="sticky top-3 sm:top-4 z-50 w-full px-4 sm:px-6 max-w-7xl mx-auto">
      <div
        className={`flex items-center justify-between h-14 px-2.5 sm:px-3.5 rounded-full border transition-[background-color,border-color,box-shadow] duration-200 ease-precision ${
          isScrolled
            ? 'bg-[var(--color-surface)]/92 backdrop-blur-md border-[var(--color-border-strong)] shadow-scroll-header'
            : 'bg-[var(--color-surface)]/80 backdrop-blur-sm border-[var(--color-border)]'
        }`}
      >
        {/* Left: Swiss Wordmark + All Tools Trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/"
            className="group flex items-center gap-2 h-9 px-3.5 rounded-full bg-[var(--color-surface-subtle)]/70 hover:bg-[var(--color-surface-subtle)] border border-[var(--color-border)] transition-colors select-none"
          >
            <span className="w-2 h-2 rounded-[2px] bg-[var(--color-accent)] transition-transform duration-200 group-hover:rotate-45" />
            <span className="font-display font-bold text-[15px] tracking-[-0.03em] text-[var(--color-text)]">
              Pure<span className="text-[var(--color-accent)]">PDF</span>
            </span>
          </Link>

          {/* Desktop 'All Tools' Mega-Menu Trigger */}
          <div className="relative hidden md:block">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={SPRINGS.tactile}
              onClick={() => setIsMegaMenuOpen((prev) => !prev)}
              aria-expanded={isMegaMenuOpen}
              className={`flex items-center gap-2 h-9 px-3.5 rounded-full text-xs font-medium border transition-colors select-none ${
                isMegaMenuOpen
                  ? 'bg-[var(--color-text)] text-[var(--color-surface)] border-[var(--color-text)]'
                  : 'bg-transparent hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] border-[var(--color-border)]'
              }`}
            >
              <span>{isId ? 'Semua Alat' : 'All Tools'}</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                  isMegaMenuOpen
                    ? 'bg-[var(--color-surface)]/15 text-[var(--color-surface)]'
                    : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]'
                }`}
              >
                {availableTools.length}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isMegaMenuOpen ? 'rotate-180' : 'opacity-60'
                }`}
              />
            </motion.button>
          </div>
        </div>

        {/* Right: Precision Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isInternalMode &&
            (authLoading ? (
              <div className="hidden sm:flex items-center h-9 w-24 rounded-full bg-[var(--color-surface-subtle)] animate-pulse border border-[var(--color-border)]" />
            ) : user ? (
              <>
                <Link
                  href="/pricing"
                  title={isId ? 'Kelola Paket & Kredit' : 'Manage Subscription & Credits'}
                  className="select-none"
                >
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    transition={SPRINGS.tactile}
                    className={`flex items-center gap-1.5 h-9 px-3 rounded-full border text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                      isVvip
                        ? 'bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/15 border-[var(--color-accent)]/35 text-[var(--color-accent)]'
                        : 'bg-[var(--color-surface-subtle)]/70 hover:bg-[var(--color-surface-subtle)] border-[var(--color-border)] text-[var(--color-text)]'
                    }`}
                  >
                    {isVvip ? (
                      <>
                        <Crown className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={2} />
                        <span className="font-semibold">VVIP</span>
                        <span className="opacity-35">/</span>
                        <span>{credits}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-[var(--color-accent)]" strokeWidth={2} />
                        <span className="font-semibold">{credits}</span>
                        <span className="hidden sm:inline text-[var(--color-text-muted)]">
                          {t.nav.credits}
                        </span>
                      </>
                    )}
                  </motion.div>
                </Link>

                {/* Account Drawer Trigger with SVG Morph */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={SPRINGS.tactile}
                  onClick={() => (isAccountDrawerOpen ? closeAccountDrawer() : openAccountDrawer())}
                  title={isId ? 'Menu Akun Saya' : 'My Account Menu'}
                  aria-label="Toggle Account Drawer"
                  className={`flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-full border transition-colors select-none cursor-pointer ${
                    isAccountDrawerOpen
                      ? 'bg-[var(--color-surface-subtle)] border-[var(--color-border-strong)]'
                      : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] border-[var(--color-border)]'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--color-text)] text-[var(--color-surface)] flex items-center justify-center text-[11px] font-mono font-semibold uppercase">
                    {(user.full_name || user.email || 'U')[0]}
                  </div>
                  <span className="hidden sm:inline-block max-w-[84px] md:max-w-[104px] truncate text-[11px] font-mono font-medium text-[var(--color-text)]">
                    {user.full_name || user.email.split('@')[0]}
                  </span>

                  <div className="w-4 h-4 flex items-center justify-center relative">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[var(--color-text)]"
                    >
                      <line
                        x1="2"
                        y1="4"
                        x2="14"
                        y2="4"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className={`origin-center transition-transform duration-200 ease-precision ${
                          isAccountDrawerOpen ? 'translate-y-[4px] rotate-45' : ''
                        }`}
                      />
                      <line
                        x1="2"
                        y1="8"
                        x2="14"
                        y2="8"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className={`transition-all duration-150 ${
                          isAccountDrawerOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                        }`}
                      />
                      <line
                        x1="2"
                        y1="12"
                        x2="14"
                        y2="12"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className={`origin-center transition-transform duration-200 ease-precision ${
                          isAccountDrawerOpen ? '-translate-y-[4px] -rotate-45' : ''
                        }`}
                      />
                    </svg>
                  </div>
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="hidden lg:inline-flex">
                  <motion.span
                    whileTap={{ scale: 0.97 }}
                    transition={SPRINGS.tactile}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.nav.getVvip}</span>
                  </motion.span>
                </Link>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  transition={SPRINGS.tactile}
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{isId ? 'Masuk' : 'Sign In'}</span>
                </motion.button>
              </>
            ))}

          {/* Bilingual Hardware Switcher: EN | ID */}
          <div className="flex items-center h-9 p-0.5 rounded-full bg-[var(--color-surface-subtle)] border border-[var(--color-border)] select-none">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 h-full rounded-full text-[11px] font-mono font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-[var(--color-text)] text-[var(--color-surface)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('id')}
              className={`px-2.5 h-full rounded-full text-[11px] font-mono font-semibold transition-colors ${
                language === 'id'
                  ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              ID
            </button>
          </div>

          {/* Theme Toggle */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={SPRINGS.tactile}
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[var(--color-text)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--color-text)]" />
            )}
          </motion.button>

          {/* Mobile Menu Hamburger */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={SPRINGS.tactile}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Mobile Menu"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text)] border border-[var(--color-border)] transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      {/* Desktop Mega-Menu Dropdown (Framer Motion — no dead CSS animate-in) */}
      <AnimatePresence>
        {isMegaMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={SPRINGS.panel}
            data-lenis-prevent
            className="hidden md:block absolute left-4 right-4 top-[4.25rem] bg-[var(--color-surface)] rounded-lg border border-[var(--color-border-strong)] shadow-card-elevated p-6"
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold text-sm tracking-[-0.015em] text-[var(--color-text)]">
                  {t.nav.toolsSuite}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                  {availableTools.length} {isId ? 'ALAT • LOKAL DI BROWSER' : 'TOOLS • LOCAL-FIRST'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMegaMenuOpen(false)}
                className="text-[11px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {t.nav.close}
              </button>
            </div>

            <div className={`grid ${isInternalMode ? 'grid-cols-4' : 'grid-cols-5'} gap-6`}>
              {!isInternalMode && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--color-accent)]/30 text-[var(--color-accent)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.06em]">
                      PRO AI
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {proAiTools.map((tool) => (
                      <li key={tool.slug}>
                        {tool.isComingSoon ? (
                          <div
                            className="flex items-center justify-between px-2 py-1.5 rounded-sm opacity-55 cursor-not-allowed select-none"
                            title={isId ? 'Segera hadir' : 'Coming soon'}
                          >
                            <span className="text-xs text-[var(--color-text-muted)] truncate">
                              {isId ? tool.nameId : tool.nameEn}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                              SOON
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={`/${tool.slug}`}
                            className="group flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-[var(--color-surface-subtle)] transition-colors"
                          >
                            <span className="text-xs font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                              {isId ? tool.nameId : tool.nameEn}
                            </span>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-sm bg-[var(--color-accent)] text-[var(--color-on-accent)]">
                              PRO
                            </span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {[
                { label: t.categories.Compress, icon: Minimize2, items: compressTools },
                { label: t.categories.Convert, icon: FileSpreadsheet, items: convertTools },
                { label: t.categories.Organize, icon: Layers, items: organizeTools },
                { label: t.categories.Security, icon: Lock, items: securityTools },
              ].map((col) => {
                const Icon = col.icon;
                return (
                  <div key={col.label} className="space-y-2.5">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.06em]">
                        {col.label}
                      </span>
                    </div>
                    <ul className="space-y-1 max-h-64 overflow-y-auto pr-1" data-lenis-prevent>
                      {col.items.map((tool) => (
                        <li key={tool.slug}>
                          <Link
                            href={`/${tool.slug}`}
                            className="group flex items-center justify-between px-2 py-1.5 rounded-sm text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                          >
                            <span className="truncate">{isId ? tool.nameId : tool.nameEn}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[var(--color-accent)] shrink-0 transition-opacity" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu (Framer Motion) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={SPRINGS.panel}
            className="md:hidden mt-2.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border-strong)] shadow-card-elevated p-4 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                {t.nav.quickNav}
              </span>
              {!isInternalMode && (
                <Link
                  href="/pricing"
                  className="text-xs font-mono font-semibold text-[var(--color-accent)] hover:underline"
                >
                  {t.nav.getVvip} →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/"
                className="p-2.5 rounded-md bg-[var(--color-surface-subtle)] text-[var(--color-text)] font-medium border border-[var(--color-border)]"
              >
                {isId ? 'Beranda' : 'Home'}
              </Link>
              {!isInternalMode && (
                <Link
                  href="/pricing"
                  className="p-2.5 rounded-md bg-[var(--color-surface-subtle)] text-[var(--color-text)] font-medium border border-[var(--color-border)]"
                >
                  {isId ? 'Harga & Kredit' : 'Pricing & Credits'}
                </Link>
              )}
              <Link
                href="/compress-pdf"
                className="p-2.5 rounded-md bg-[var(--color-surface-subtle)] text-[var(--color-text)] font-medium border border-[var(--color-border)]"
              >
                {isId ? 'Kompres PDF' : 'Compress PDF'}
              </Link>
              {!isInternalMode && (
                <Link
                  href="/force-unlock-pdf"
                  className="p-2.5 rounded-md bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]/30"
                >
                  {isId ? 'Buka Paksa PDF' : 'Force Unlock PRO'}
                </Link>
              )}
            </div>

            {!isInternalMode && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                {authLoading ? (
                  <div className="h-10 rounded-md bg-[var(--color-surface-subtle)] animate-pulse" />
                ) : user ? (
                  <div className="flex items-center justify-between p-2.5 rounded-md bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <UserIcon className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                      <span className="font-mono text-[11px] truncate text-[var(--color-text)]">
                        {user.full_name || user.email}
                      </span>
                      {user.role === 'admin' && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-[var(--color-accent)] text-[var(--color-on-accent)] text-[9px] font-mono font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      className="text-xs font-mono text-[var(--color-danger)] font-semibold px-2 py-1"
                    >
                      {t.nav.signOut}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-[var(--color-text)] text-[var(--color-surface)] font-medium text-xs"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{isId ? 'Masuk / Daftar Akun' : 'Sign In / Register'}</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Account Drawer */}
      <AccountDrawer />
    </header>
  );
};
