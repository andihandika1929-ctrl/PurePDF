'use client';

import React, { useState } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { getToolBySlug } from '@/config/toolsConfig';
import { AdSlot } from '@/components/layout/AdSlot';
import { SeoContentBlock } from '@/components/layout/SeoContentBlock';
import { DropzoneUploader } from '@/components/workspace/DropzoneUploader';
import { Badge } from '@/components/ui/Badge';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { SecretAdminDashboard } from '@/components/admin/SecretAdminDashboard';

interface ToolPageProps {
  params: {
    toolSlug: string;
  };
}

export default function ToolPage({ params }: ToolPageProps) {
  const { language, isInternalMode } = useApp();
  const [isEditorActive, setIsEditorActive] = useState(false);

  const expectedSecret =
    process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH ||
    process.env.ADMIN_SECRET_PATH ||
    '6664dm1n';

  // Secret Admin Route Gateway (Blocked in internal mode)
  if (params.toolSlug === expectedSecret || params.toolSlug === '6664dm1n') {
    if (isInternalMode) {
      notFound();
    }
    return <SecretAdminDashboard secretParam={params.toolSlug} />;
  }

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
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'id' ? '← Kembali ke 26 Alat' : '← Back to All 26 Tools'}</span>
        </Link>

        <div className="flex items-center gap-2">
          {tool.isPro ? (
            <Badge variant="pro" size="sm">
              PRO AI TOOL
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              {language === 'id' ? '100% GRATIS DI BROWSER' : '100% CLIENT-SIDE FREE'}
            </Badge>
          )}
        </div>
      </div>

      {/* Tool Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white dark:bg-zinc-800 shadow-[0px_2px_8px_rgba(0,0,0,0.06)] border border-black/5 dark:border-white/5 mb-2">
          <ToolIcon
            name={tool.iconName}
            className={`w-7 h-7 ${tool.isPro ? 'text-[#ff3700]' : 'text-black dark:text-white'}`}
          />
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-black dark:text-white">
          {name}
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed">
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
