'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { TOOLS } from '@/config/toolsConfig';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
  Globe,
  User as UserIcon,
  LogOut
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const {
    credits,
    isVvip,
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    user,
    loginWithGoogle,
    logout,
    authLoading,
    isInternalMode,
    openAuthModal,
    isAccountDrawerOpen,
    openAccountDrawer,
    closeAccountDrawer,
  } = useApp();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMegaMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const proAiTools = TOOLS.filter((t) => t.category === '✨ PRO AI');
  const compressTools = TOOLS.filter((t) => t.category === 'Compress');
  const convertTools = TOOLS.filter((t) => t.category === 'Convert');
  const organizeTools = TOOLS.filter((t) => t.category === 'Organize');
  const securityTools = TOOLS.filter((t) => t.category === 'Security');

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 max-w-7xl mx-auto transition-all duration-300">
      <div
        className={`flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? 'bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06),0_24px_48px_-4px_rgba(0,0,0,0.06)]'
            : 'bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-black/[0.04] dark:border-white/[0.06]'
        }`}
      >
        {/* Left: Brand Pill Wordmark */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 h-11 px-5 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-white border border-black/[0.06] dark:border-white/[0.08] shadow-[0px_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all select-none group"
          >
            <span className="font-bold text-sm tracking-tight">Pure</span>
            <span className="font-editorial text-lg text-[#ff3700] font-normal group-hover:scale-105 transition-transform">
              PDF
            </span>
          </Link>

          {/* Desktop 'All Tools' Mega-Menu Trigger */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 text-xs font-medium text-black dark:text-white border border-black/[0.06] dark:border-white/10 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] transition-all select-none"
            >
              <span>{t.nav.allTools}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 ${
                  isMegaMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Controls when Public Mode */}
          {!isInternalMode && (
            authLoading ? (
              <div className="hidden sm:flex items-center h-10 w-28 rounded-full bg-neutral-100 dark:bg-zinc-800 animate-pulse border border-black/[0.04] dark:border-white/[0.06]" />
            ) : user ? (
              <>
                {/* Status Singkat di Kanan Atas: Badge VVIP Amber + Sisa Credits atau Credits Free */}
                <Link
                  href="/pricing"
                  title={language === 'id' ? 'Kelola Paket & Kredit' : 'Manage Subscription & Credits'}
                  className="select-none"
                >
                  <div
                    className={`flex items-center gap-1.5 sm:gap-2 h-10 px-3 sm:px-3.5 rounded-full border transition-all cursor-pointer ${
                      isVvip
                        ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-[0px_1px_4px_rgba(245,158,11,0.12)] hover:-translate-y-0.5'
                        : 'bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-black dark:text-white border-black/[0.08] dark:border-white/10 shadow-[0px_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5'
                    }`}
                  >
                    {isVvip ? (
                      <>
                        <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" strokeWidth={1.75} />
                        <span className="text-[11px] font-bold tracking-tight">VVIP</span>
                        <span className="text-amber-500/30">|</span>
                        <span className="text-[11px] font-mono font-bold">
                          {credits} <span className="font-normal text-[10px] opacity-75">pts</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-[#ff3700] fill-[#ff3700]" strokeWidth={1.75} />
                        <span className="text-[11px] font-bold font-mono">
                          {credits} <span className="font-normal text-neutral-400 text-[10px]">{t.nav.credits}</span>
                        </span>
                      </>
                    )}
                  </div>
                </Link>

                {/* Tombol Menu Hamburger dengan Animated SVG Morphing ke Ikon X */}
                <button
                  onClick={() => (isAccountDrawerOpen ? closeAccountDrawer() : openAccountDrawer())}
                  title={language === 'id' ? 'Menu Akun Saya' : 'My Account Menu'}
                  aria-label="Toggle Account Drawer"
                  className={`flex items-center gap-2 h-10 pl-2 pr-3 sm:px-3 rounded-full border transition-all select-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 ${
                    isAccountDrawerOpen
                      ? 'bg-black/5 dark:bg-white/10 border-black/20 dark:border-white/20 shadow-inner'
                      : 'bg-white dark:bg-zinc-900 border-black/[0.08] dark:border-white/10 shadow-[0px_1px_3px_rgba(0,0,0,0.06)]'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ff3700] via-orange-500 to-amber-500 text-white flex items-center justify-center text-[11px] font-bold uppercase shadow-sm">
                    {(user.full_name || user.email || 'A')[0]}
                  </div>
                  <span className="hidden sm:inline-block max-w-[80px] md:max-w-[100px] truncate text-[11px] font-mono font-semibold text-black dark:text-white">
                    {user.full_name || user.email.split('@')[0]}
                  </span>

                  {/* Animated SVG Morph: Hamburger <=> X */}
                  <div className="w-4 h-4 flex items-center justify-center relative">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-neutral-700 dark:text-neutral-300"
                    >
                      {/* Top Bar -> diagonal \ */}
                      <line
                        x1="2"
                        y1="4"
                        x2="14"
                        y2="4"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className={`origin-center transition-all duration-300 ease-out ${
                          isAccountDrawerOpen ? 'translate-y-[4px] rotate-45' : ''
                        }`}
                      />
                      {/* Middle Bar -> fade/scale */}
                      <line
                        x1="2"
                        y1="8"
                        x2="14"
                        y2="8"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className={`transition-all duration-200 ease-out ${
                          isAccountDrawerOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                        }`}
                      />
                      {/* Bottom Bar -> diagonal / */}
                      <line
                        x1="2"
                        y1="12"
                        x2="14"
                        y2="12"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className={`origin-center transition-all duration-300 ease-out ${
                          isAccountDrawerOpen ? '-translate-y-[4px] -rotate-45' : ''
                        }`}
                      />
                    </svg>
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* CTA Get VVIP */}
                <Link href="/pricing" className="hidden lg:inline-flex">
                  <Button size="sm" variant="accent" className="!h-10 !text-xs !px-4">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>{t.nav.getVvip}</span>
                  </Button>
                </Link>

                {/* Tombol Masuk / Daftar */}
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-black dark:text-white text-xs font-semibold border border-black/[0.08] dark:border-white/10 shadow-[0px_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#ff3700]" />
                  <span>{language === 'id' ? 'Masuk / Daftar' : 'Sign In / Register'}</span>
                </button>
              </>
            )
          )}

          {/* Bilingual Switcher: Pill EN | ID */}
          <div className="flex items-center h-10 p-0.5 rounded-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 shadow-[0px_1px_3px_rgba(0,0,0,0.06)] select-none">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 h-full rounded-full text-xs font-bold font-mono transition-all ${
                language === 'en'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('id')}
              className={`px-2.5 h-full rounded-full text-xs font-bold font-mono transition-all ${
                language === 'id'
                  ? 'bg-[#ff3700] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              ID
            </button>
          </div>

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-white border border-black/[0.08] dark:border-white/10 shadow-[0px_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-white border border-black/[0.08] dark:border-white/10 shadow-[0px_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 5-Column Mega-Menu Modal Dropdown */}
      {isMegaMenuOpen && (
        <div className="hidden md:block absolute left-4 right-4 top-20 bg-white dark:bg-zinc-900 rounded-3xl border border-black/10 dark:border-white/10 shadow-[0px_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0px_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">{t.nav.toolsSuite}</span>
              <span className="text-xs text-neutral-400 font-mono">({t.nav.zeroStorageDesc})</span>
            </div>
            <button
              onClick={() => setIsMegaMenuOpen(false)}
              className="text-xs font-mono text-neutral-400 hover:text-black dark:hover:text-white"
            >
              {t.nav.close}
            </button>
          </div>

          <div className={`grid ${isInternalMode ? 'grid-cols-4' : 'grid-cols-5'} gap-6`}>
            {/* Col 1: PRO AI (Hidden in internal mode) */}
            {!isInternalMode && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 pb-2 border-b border-[#ff3700]/20 text-[#ff3700]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">PRO AI</span>
                </div>
                <ul className="space-y-1.5">
                  {proAiTools.map((tool) => (
                    <li key={tool.slug}>
                      {tool.isComingSoon ? (
                        <div
                          className="flex items-center justify-between p-1.5 rounded-lg opacity-60 cursor-not-allowed select-none"
                          title={language === 'id' ? 'Segera hadir' : 'Coming soon'}
                        >
                          <span className="text-xs font-medium text-neutral-400">
                            {language === 'id' ? tool.nameId : tool.nameEn}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                            SOON
                          </span>
                        </div>
                      ) : (
                        <Link
                          href={`/${tool.slug}`}
                          className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <span className="text-xs font-medium text-black dark:text-zinc-200 group-hover:text-[#ff3700] transition-colors">
                            {language === 'id' ? tool.nameId : tool.nameEn}
                          </span>
                          <Badge variant="pro" size="sm">
                            PRO
                          </Badge>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Col 2: Compress */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300">
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">{t.categories.Compress}</span>
              </div>
              <ul className="space-y-1.5">
                {compressTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/${tool.slug}`}
                      className="block p-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {language === 'id' ? tool.nameId : tool.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Convert */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">{t.categories.Convert}</span>
              </div>
              <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {convertTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/${tool.slug}`}
                      className="block p-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors truncate"
                    >
                      {language === 'id' ? tool.nameId : tool.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Organize */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300">
                <Layers className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">{t.categories.Organize}</span>
              </div>
              <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {organizeTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/${tool.slug}`}
                      className="block p-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors truncate"
                    >
                      {language === 'id' ? tool.nameId : tool.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 5: Security */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">{t.categories.Security}</span>
              </div>
              <ul className="space-y-1.5">
                {securityTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/${tool.slug}`}
                      className="block p-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {language === 'id' ? tool.nameId : tool.nameEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 bg-white dark:bg-zinc-900 rounded-3xl border border-black/10 dark:border-white/10 shadow-[0px_16px_40px_rgba(0,0,0,0.15)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
            <span className="font-bold text-xs uppercase tracking-wider">{t.nav.quickNav}</span>
            <Link
              href="/pricing"
              className="text-xs font-bold text-[#ff3700] hover:underline"
            >
              {t.nav.getVvip} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link href="/" className="p-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 font-medium">
              {t.nav.home}
            </Link>
            {!isInternalMode && (
              <Link href="/pricing" className="p-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 font-medium">
                {t.nav.pricing}
              </Link>
            )}
            <Link href="/compress-pdf" className="p-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 font-medium">
              {t.nav.compress}
            </Link>
            {!isInternalMode && (
              <Link href="/force-unlock-pdf" className="p-2.5 rounded-xl bg-[#ff3700]/10 text-[#ff3700] font-bold">
                {t.nav.proAi}
              </Link>
            )}
          </div>

          {/* Mobile User / Sign In (Hidden in internal mode) */}
          {!isInternalMode && (
            <div className="pt-2 border-t border-black/5 dark:border-white/5">
              {authLoading ? (
                <div className="h-10 rounded-xl bg-neutral-100 dark:bg-zinc-800 animate-pulse" />
              ) : user ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <UserIcon className="w-3.5 h-3.5 text-[#ff3700]" />
                    <span className="font-mono text-[11px] truncate">{user.full_name || user.email}</span>
                    {user.role === 'admin' && (
                      <span className="px-1.5 py-0.5 rounded bg-[#ff3700] text-white text-[9px] font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="text-xs text-red-500 font-bold px-2 py-1"
                  >
                    {t.nav.signOut}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs shadow-sm"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#ff3700]" />
                  <span>{language === 'id' ? 'Masuk / Daftar Akun' : 'Sign In / Register'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Slide-over Drawer "Akun Saya" */}
      <AccountDrawer />
    </header>
  );
};
