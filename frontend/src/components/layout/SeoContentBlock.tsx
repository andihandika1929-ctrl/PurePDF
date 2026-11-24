'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import { ToolMeta } from '@/config/toolsConfig';
import { useApp } from '@/context/AppContext';
import { ChevronDown, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const SeoContentBlock: React.FC<{ tool: ToolMeta }> = ({ tool }) => {
  const { language } = useApp();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isId = language === 'id';
  const toolName = isId ? tool.nameId : tool.nameEn;
  const steps = isId ? tool.howToStepsId : tool.howToStepsEn;
  const faqs = isId ? tool.faqsId : tool.faqsEn;
  const desc = isId ? tool.seoDescriptionId : tool.seoDescriptionEn;

  // Generate JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: `How to use ${toolName} on PurePDF`,
        description: desc,
        step: steps.map((s) => ({
          '@type': 'HowToStep',
          position: s.step,
          name: s.title,
          text: s.desc
        }))
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer
          }
        }))
      }
    ]
  };

  return (
    <section className="w-full max-w-4xl mx-auto space-y-12 mt-16 pt-12 border-t border-black/10 dark:border-white/10">
      {/* JSON-LD Script */}
      <Script
        id={`json-ld-${tool.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* How To Steps */}
      <div className="space-y-6">
        <div className="text-center md:text-left space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-[#ff3700] font-semibold">
            {isId ? 'PANDUAN LANGKAH DEMI LANGKAH' : 'STEP-BY-STEP TUTORIAL'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
            {isId ? 'Cara Menggunakan' : 'How to use'}{' '}
            <span className="font-editorial text-[#ff3700]">{toolName}</span>{' '}
            {isId ? 'dalam beberapa detik' : 'in seconds'}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            {isId
              ? 'Tanpa perlu instalasi aplikasi apapun. 100% berbasis web dan aman.'
              : 'No software installation required. 100% web-based and secure.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div
              key={step.step}
              className="bento-card p-5 sm:p-6 space-y-3 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold font-mono">
                  0{step.step}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-black dark:text-white">{step.title}</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Feature Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 rounded-2xl bg-white/70 dark:bg-zinc-900/70 border border-black/5 dark:border-white/10">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-black dark:text-white">
              {isId ? 'Kebijakan Zero-Storage' : 'Zero File Storage Policy'}
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isId
                ? 'File diproses di RAM browser Anda atau memori cloud sementara yang langsung terhapus otomatis setelah diunduh.'
                : 'Files are processed client-side in browser RAM or ephemeral cloud memory buffers that auto-delete immediately after export.'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#ff3700] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-black dark:text-white">
              {isId ? 'Kecepatan Proses Vektor Instan' : 'Lightning Fast Rendering'}
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {isId
                ? 'Didukung WebAssembly berkinerja tinggi untuk pemrosesan super cepat tanpa lag di perangkat apapun.'
                : 'Powered by high-performance WASM and modern PDF primitives for near-instant rendering on any device.'}
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
            {isId ? 'PERTANYAAN UMUM' : 'COMMON INQUIRIES'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            {isId ? 'Pertanyaan yang Sering Diajukan' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 overflow-hidden transition-all shadow-[0px_1px_3px_rgba(0,0,0,0.04)]"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-sm sm:text-base text-black dark:text-white hover:text-[#ff3700] dark:hover:text-[#ff3700] transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-[#ff3700]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
