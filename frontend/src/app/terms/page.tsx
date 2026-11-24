import React from 'react';
import type { Metadata } from 'next';
import { FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — PurePDF Usage Agreement',
  description: 'Terms and conditions governing the use of PurePDF online tools and subscriptions.'
};

export default function TermsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-12 space-y-10">
      
      {/* Header */}
      <div className="space-y-3 border-b border-black/10 dark:border-white/10 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-semibold">
          <FileText className="w-3.5 h-3.5" />
          <span>USER SERVICE AGREEMENT</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-black dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs font-mono text-neutral-400">
          Effective Date: November 2026
        </p>
      </div>

      <div className="space-y-8 text-neutral-700 dark:text-neutral-300 text-sm sm:text-base leading-relaxed">
        
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using PurePDF (the "Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you must not use our Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white">2. Acceptable Use & Fair Usage</h2>
          <p>
            You agree not to use PurePDF to process, generate, or distribute any materials that violate international copyright laws, contain malicious viruses, or promote illegal activities.
            Automated scraping, bot querying, or reverse engineering of the PurePDF web interface is strictly prohibited.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white">3. Credit Packs & VVIP Subscriptions</h2>
          <p>
            Credit packs purchased on PurePDF are non-expiring and tied to your account. VVIP Subscriptions recur monthly at Rp 29.000 / month (or equivalent in local currencies) until cancelled by the user via their account settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-black dark:text-white">4. Limitation of Liability</h2>
          <p>
            PurePDF provides its tools "as is" and "as available". In no event shall PurePDF or its founders be liable for any incidental, consequential, or exemplary damages resulting from the use or inability to use the Service.
          </p>
        </section>

      </div>
    </div>
  );
}
