'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Mail, Instagram, ShieldCheck, Heart, Building2, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { isInternalMode, language } = useApp();
  const isId = language === 'id';

  if (isInternalMode) {
    return (
      <footer className="w-full border-t border-black/10 dark:border-white/10 bg-neutral-100/70 dark:bg-zinc-950/70 backdrop-blur-md mt-24 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-sm tracking-tight text-black dark:text-white">Pure</span>
              <span className="font-editorial text-lg text-[#ff3700] font-normal">PDF</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold">
                <Building2 className="w-3 h-3" />
                <span>ENTERPRISE INTERNAL MODE</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
              Sistem Pengolah Dokumen Resmi Internal Kantor. Seluruh pemrosesan PDF berjalan secara aman dan lokal di perangkat Anda dengan kebijakan Zero-Storage tanpa retensi data remote.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
            <Link href="/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">
              Ketentuan Penggunaan
            </Link>
            <Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">
              Dokumentasi Sistem
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-neutral-400">
          <span>© {new Date().getFullYear()} PurePDF Enterprise. Mode Operasional Kantor.</span>
          <span className="flex items-center gap-1">
            Dikembangkan oleh <strong className="text-black dark:text-white font-semibold">Andi Handika</strong>
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full border-t border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md mt-24 py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand & Privacy Statement */}
        <div className="space-y-3 md:col-span-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5">
            <span className="font-bold text-sm tracking-tight text-black dark:text-white">Pure</span>
            <span className="font-editorial text-lg text-[#ff3700] font-normal">PDF</span>
            <span className="text-xs font-mono text-neutral-400 ml-2">v1.2 (Zero-Storage Architecture)</span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
            {isId
              ? 'Seluruh 21 alat PDF standar berjalan 100% lokal di memori web browser Anda. Dokumen tidak pernah tersimpan di server cloud. Cepat, aman, dan tanpa retensi data.'
              : 'All 21 standard PDF tools execute 100% locally inside your web browser. Confidential documents never touch external storage disks.'}
          </p>
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium pt-1">
            <span>Dikembangkan oleh</span>
            <a
              href="https://instagram.com/andihandikaaaa"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-black dark:text-white hover:text-[#ff3700] dark:hover:text-[#ff3700] transition-colors underline decoration-[#ff3700] underline-offset-4"
            >
              Andi Handika
            </a>
          </div>
        </div>

        {/* Bantuan & Komplain */}
        <div className="space-y-3 text-center md:text-left">
          <h4 className="text-xs font-bold font-mono uppercase text-black dark:text-white tracking-wider flex items-center justify-center md:justify-start gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#ff3700]" />
            <span>{isId ? 'Bantuan & Komplain' : 'Help & Support'}</span>
          </h4>
          <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
            <li>
              <a
                href="mailto:andihandika1929@gmail.com"
                className="inline-flex items-center gap-2 hover:text-[#ff3700] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span className="truncate">andihandika1929@gmail.com</span>
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/andihandikaaaa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-[#ff3700] transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-neutral-400" />
                <span>@andihandikaaaa</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Legal & Navigasi */}
        <div className="space-y-3 text-center md:text-left">
          <h4 className="text-xs font-bold font-mono uppercase text-black dark:text-white tracking-wider">
            {isId ? 'Navigasi' : 'Navigation'}
          </h4>
          <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
            <li>
              <Link href="/pricing" className="text-[#ff3700] hover:underline font-semibold">
                {isId ? 'Paket VVIP & Kredit' : 'Pricing & Credits'}
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">
                About PurePDF
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-black dark:hover:text-white transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-neutral-400">
        <div>
          © {new Date().getFullYear()} PurePDF. Built for speed, zero-file retention & bank-grade privacy.
        </div>
        <div className="flex items-center gap-1.5">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-[#ff3700] fill-[#ff3700]" />
          <span>by Andi Handika</span>
        </div>
      </div>
    </footer>
  );
};
