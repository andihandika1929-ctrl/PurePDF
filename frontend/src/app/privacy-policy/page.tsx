import React from 'react';
import type { Metadata } from 'next';
import { ShieldCheck, Lock, EyeOff, ServerOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — PurePDF Zero-Storage Commitment',
  description:
    'PurePDF does not retain or store user PDF documents. Learn about our client-side WebAssembly processing and strict privacy protocols.'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-12 space-y-10">
      
      {/* Header */}
      <div className="space-y-3 border-b border-black/10 dark:border-white/10 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ZERO-FILE RETENTION COMMITMENT</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-black dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs font-mono text-neutral-400">
          Last Updated: November 2026 • Effective Worldwide
        </p>
      </div>

      {/* Content Blocks */}
      <div className="space-y-8 text-neutral-700 dark:text-neutral-300 text-sm sm:text-base leading-relaxed">
        
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <ServerOff className="w-5 h-5 text-[#ff3700]" />
            1. Zero-Storage Architecture
          </h2>
          <p>
            At PurePDF, our core engineering philosophy is simple: <strong>your documents belong solely to you</strong>.
            21 of our standard PDF tools (including Compress, Merge, Split, Protect, and Convert) operate 100% inside your client device’s web browser using WebAssembly and client-side JavaScript.
          </p>
          <p>
            When utilizing these tools, your PDF files are never uploaded to our servers, never cached on disk, and never accessible by our staff or third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#ff3700]" />
            2. Ephemeral Processing for PRO AI Tools
          </h2>
          <p>
            Our 5 PRO AI tools (AI Chat, AI Summarizer, Document Translator, Smart OCR, and AI Redactor) utilize high-memory neural models.
            Files submitted to PRO tools are transferred via encrypted 256-bit TLS connections directly into temporary RAM memory buffers.
          </p>
          <p>
            Once processing completes and your export is generated, the memory buffer is wiped immediately. <strong>Zero copies are stored in cloud disks or databases.</strong>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-[#ff3700]" />
            3. Cookies & Advertising
          </h2>
          <p>
            To keep PurePDF free for users worldwide, we display third-party advertisements via Google AdSense.
            Google and its advertising partners may use cookies to serve personalized or non-personalized ads based on your prior visits to this or other websites.
          </p>
          <p>
            You may opt out of personalized advertising by visiting Google Ads Settings or www.aboutads.info. PurePDF VVIP members enjoy an entirely ad-free experience.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white">
            4. Contact Our Data Protection Officer
          </h2>
          <p>
            If you have questions regarding this Privacy Policy or security audits, contact us at:
            <br />
            <a href="mailto:privacy@purepdf.app" className="text-[#ff3700] underline font-mono text-sm">
              privacy@purepdf.app
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
