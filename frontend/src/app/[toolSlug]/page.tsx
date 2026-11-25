'use client';

import React, { useState } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { TOOLS, getToolBySlug } from '@/config/toolsConfig';
import { AdSlot } from '@/components/layout/AdSlot';
import { SeoContentBlock } from '@/components/layout/SeoContentBlock';
import { DropzoneUploader } from '@/components/workspace/DropzoneUploader';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface ToolPageProps {
  params: {
    toolSlug: string;
  };
}

export default function ToolPage({ params }: ToolPageProps) {
  const { language, isInternalMode } = useApp();
  const [isEditorActive, setIsEditorActive] = useState(false);

  // Auto-redirect deprecated 100KB/200KB routes to unified /compress-pdf
  if (params.toolSlug === 'compress-pdf-100kb' || params.toolSlug === 'compress-pdf-200kb') {
    redirect('/compress-pdf');
  }

  const tool = getToolBySlug(params.toolSlug);

  if (!tool || (isInternalMode && (tool.isPro || tool.category === '✨ PRO AI')) || tool.isComingSoon) {
    notFound();
  }

  const name = language === 'id' ? tool.nameId : tool.nameEn;
  const desc = language === 'id' ? tool.shortDescId : tool.shortDescEn;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-12">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>
            {language === 'id'
              ? `Kembali ke ${TOOLS.length} Alat`
              : `Back to All ${TOOLS.length} Tools`}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {tool.isPro ? (
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-sm bg-[var(--color-accent)] text-[var(--color-on-accent)]">
              PRO AI TOOL
            </span>
          ) : (
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-sm bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
              {language === 'id' ? 'LOKAL DI BROWSER · GRATIS' : 'LOCAL WASM · FREE'}
            </span>
          )}
        </div>
      </div>

      {/* Tool Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-card mb-1">
          <ToolIcon
            name={tool.iconName}
            className={`w-6 h-6 ${tool.isPro ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}
          />
        </div>
        
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-[var(--color-text)] leading-[1.06]">
          {name}
        </h1>

        <p className="text-sm sm:text-base text-[var(--color-text-secondary)] font-normal leading-relaxed">
          {desc}
        </p>
      </div>

      {/* 3-Column Layout: AdSlot Left (160x600) + Dropzone Center + AdSlot Right (160x600) */}
      <div className="flex items-start justify-center gap-6 lg:gap-8">
        
        {/* Left Column AdSense (160x600 Skyscraper) - Hidden in Editor Mode */}
        {!isEditorActive && (
          <div className="hidden xl:block shrink-0 sticky top-24">
            <AdSlot format="skyscraper" />
          </div>
        )}

        {/* Center Column: Interactive Dropzone Uploader / Canvas Editor */}
        <div className={`w-full transition-all duration-300 ${isEditorActive ? 'max-w-6xl' : 'max-w-2xl'}`}>
          <DropzoneUploader tool={tool} onEditorActiveChange={setIsEditorActive} />
          
          {/* Privacy Guarantee Banner Under Dropzone */}
          {!isEditorActive && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>
                {language === 'id'
                  ? 'PurePDF Zero-Storage: File tidak pernah disimpan di cloud atau server'
                  : 'PurePDF Zero-Storage: File leaves neither your device nor memory buffer'}
              </span>
            </div>
          )}
        </div>

        {/* Right Column AdSense (160x600 Skyscraper) - Hidden in Editor Mode */}
        {!isEditorActive && (
          <div className="hidden xl:block shrink-0 sticky top-24">
            <AdSlot format="skyscraper" />
          </div>
        )}

      </div>

      {/* Mobile / Tablet Responsive Banner Ad - Hidden in Editor Mode */}
      {!isEditorActive && (
        <div className="xl:hidden flex justify-center py-4">
          <AdSlot format="leaderboard" className="max-w-full" />
        </div>
      )}

      {/* Bottom Section: Comprehensive SEO Guide, Steps & JSON-LD FAQs */}
      {!isEditorActive && <SeoContentBlock tool={tool} />}

    </div>
  );
}
