'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { TOOLS, CATEGORIES, Category, ToolMeta } from '@/config/toolsConfig';
import { BentoCard } from '@/components/ui/BentoCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ToolIcon } from '@/components/ui/ToolIcon';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  SlidersHorizontal,
  Flame,
  Smartphone,
  Lock,
  Ban,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const { t, language, isInternalMode } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

  // Filter categories for internal mode if needed
  const availableCategories = useMemo(() => {
    if (isInternalMode) {
      return CATEGORIES.filter((c) => c !== '✨ PRO AI');
    }
    return CATEGORIES;
  }, [isInternalMode]);

  // Filter available tools list
  const availableTools = useMemo(() => {
    if (isInternalMode) {
      return TOOLS.filter((tool) => !tool.isPro && tool.category !== '✨ PRO AI');
    }
    return TOOLS;
  }, [isInternalMode]);

  // Filter tools in real-time
  const filteredTools = useMemo(() => {
    return availableTools.filter((tool) => {
      const name = language === 'id' ? tool.nameId : tool.nameEn;
      const desc = language === 'id' ? tool.shortDescId : tool.shortDescEn;

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.slug.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ? true : tool.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [availableTools, searchQuery, selectedCategory, language]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 space-y-12 sm:space-y-16">
      
      {/* Hero Section with Ambient Glow */}
      <section className="relative text-center space-y-6 max-w-4xl mx-auto pt-6 sm:pt-10 hero-ambient-glow rounded-3xl p-6 sm:p-10">
        
        {/* Kicker Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 shadow-[0px_1px_3px_rgba(0,0,0,0.04)] text-xs font-mono select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-black dark:text-white">{t.hero.kicker}</span>
          <span className="text-neutral-300 dark:text-neutral-700">•</span>
          <span className="text-neutral-600 dark:text-neutral-400 font-bold">
            {availableTools.length} {language === 'id' ? 'Tools Lengkap' : 'Tools Suite'}
          </span>
        </div>

        {/* Editorial Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black dark:text-white leading-[1.08]">
          {t.hero.title1} <br className="hidden sm:inline" />
          <span className="font-editorial text-[#ff3700] font-normal">{t.hero.titleHighlight}</span>{' '}
          {t.hero.title2}
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto font-normal leading-relaxed">
          {t.hero.description}
        </p>

        {/* Real-Time Search Bar */}
        <div className="max-w-xl mx-auto pt-2">
          <Input
            icon={<Search className="w-5 h-5 text-neutral-400" />}
            type="text"
            placeholder={t.hero.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-base !h-13 shadow-[0px_2px_12px_rgba(0,0,0,0.06)] border-black/[0.08] dark:border-white/10"
          />
        </div>

      </section>

      {/* Category Filter Buttons */}
      <section className="space-y-4">
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5">
          {availableCategories.map((category) => {
            const isSelected = selectedCategory === category;
            const isPro = category === '✨ PRO AI';
            const categoryLabel = t.categories[category];

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`relative px-4 sm:px-5 h-10 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 select-none flex items-center gap-1.5 ${
                  isSelected
                    ? isPro
                      ? 'bg-[#ff3700] text-white shadow-[0_0_15px_rgba(255,55,0,0.4)] scale-105 font-bold'
                      : 'bg-black text-white dark:bg-white dark:text-black shadow-[0px_2px_8px_rgba(0,0,0,0.18)] scale-105 font-bold'
                    : 'bg-white dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300 border border-black/[0.08] dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 hover:bg-neutral-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{categoryLabel}</span>
                {category === 'All' && (
                  <span className="text-[10px] font-mono opacity-60">({availableTools.length})</span>
                )}
                {isPro && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3700] animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Counter Info */}
        <div className="text-center text-xs font-mono text-neutral-500 dark:text-neutral-400">
          {t.hero.showing} <strong className="text-black dark:text-white font-bold">{filteredTools.length}</strong> {t.hero.of} {availableTools.length} {t.hero.tools}
          {selectedCategory !== 'All' && ` ${t.hero.inCategory} "${t.categories[selectedCategory]}"`}
        </div>
      </section>

      {/* Bento Grid Tools */}
      <section>
        {filteredTools.length === 0 ? (
          <div className="text-center py-20 bento-card p-12 bg-white dark:bg-zinc-900 max-w-lg mx-auto space-y-4">
            <SlidersHorizontal className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-lg font-bold">{t.hero.noToolsFound}</h3>
            <p className="text-xs text-neutral-500">{t.hero.noToolsDesc}</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-xs font-mono text-[#ff3700] hover:underline"
            >
              {t.hero.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredTools.map((tool) => {
              const name = language === 'id' ? tool.nameId : tool.nameEn;
              const desc = language === 'id' ? tool.shortDescId : tool.shortDescEn;
              const isComingSoon = Boolean(tool.isComingSoon);

              const cardContent = (
                <BentoCard
                  variant={isComingSoon ? 'default' : tool.isPro ? 'pro' : 'default'}
                  padding="md"
                  rounded="xl"
                  className={`h-full flex flex-col justify-between bg-white dark:bg-zinc-900 transition-all ${
                    isComingSoon
                      ? 'opacity-75 cursor-not-allowed border-dashed border-amber-500/40 dark:border-amber-500/30 shadow-none'
                      : 'group-hover:border-neutral-400 dark:group-hover:border-zinc-600'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-2.5 rounded-xl transition-all ${
                          isComingSoon
                            ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
                            : tool.isPro
                            ? 'bg-[#ff3700] text-white shadow-[0_0_12px_rgba(255,55,0,0.4)] group-hover:scale-110'
                            : 'bg-neutral-100 dark:bg-zinc-800 text-black dark:text-white group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black group-hover:scale-110'
                        }`}
                      >
                        <ToolIcon name={tool.iconName} className="w-5 h-5" />
                      </div>

                      {isComingSoon ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider">
                          {language === 'id' ? 'SEGERA HADIR' : 'COMING SOON'}
                        </span>
                      ) : tool.isPro ? (
                        <Badge variant="pro" size="sm">
                          {t.card.proAi}
                        </Badge>
                      ) : (
                        <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-tight">
                          {tool.category}
                        </span>
                      )}
                    </div>

                    {/* Tool Name & Description */}
                    <div className="space-y-1.5">
                      <h3
                        className={`text-base sm:text-lg font-bold text-black dark:text-white flex items-center justify-between ${
                          !isComingSoon
                            ? 'group-hover:text-[#ff3700] dark:group-hover:text-[#ff3700] transition-colors'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <span>{name}</span>
                        {!isComingSoon && (
                          <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all text-[#ff3700]" />
                        )}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Indicator */}
                  <div className="pt-4 mt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>
                      {isComingSoon
                        ? (language === 'id' ? 'Dalam Pengembangan' : 'Under Development')
                        : tool.isPro
                        ? t.card.neuralFast
                        : t.card.inBrowser}
                    </span>
                    <span
                      className={
                        !isComingSoon
                          ? 'group-hover:text-black dark:group-hover:text-white transition-colors font-medium'
                          : 'font-bold text-amber-600 dark:text-amber-400'
                      }
                    >
                      {isComingSoon
                        ? (language === 'id' ? 'Segera Hadir' : 'Coming Soon')
                        : t.card.openTool}
                    </span>
                  </div>
                </BentoCard>
              );

              if (isComingSoon) {
                return (
                  <div
                    key={tool.slug}
                    className="block h-full cursor-not-allowed select-none"
                    title={language === 'id' ? 'Fitur ini sedang dalam pengembangan dan segera hadir' : 'This feature is under development and coming soon'}
                  >
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link key={tool.slug} href={`/${tool.slug}`} className="group block h-full">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* "Mengapa PurePDF?" 4-Card Keunggulan Section */}
      <section className="space-y-8 pt-6 border-t border-black/5 dark:border-white/5">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff3700]/10 text-[#ff3700] text-xs font-bold font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.whyUs.kicker}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-black dark:text-white">
            {t.whyUs.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {t.whyUs.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Pemrosesan Cepat & Presisi */}
          <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-[#ff3700]/10 text-[#ff3700]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-black dark:text-white">
                {t.whyUs.c1Title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t.whyUs.c1Desc}
              </p>
            </div>
          </div>

          {/* Card 2: Privasi File Terjaga & Otomatis Terhapus */}
          <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-black dark:text-white">
                {t.whyUs.c2Title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t.whyUs.c2Desc}
              </p>
            </div>
          </div>

          {/* Card 3: Tanpa Iklan Mengganggu */}
          <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-blue-500/10 text-blue-500">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-black dark:text-white">
                {t.whyUs.c3Title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t.whyUs.c3Desc}
              </p>
            </div>
          </div>

          {/* Card 4: Siap Pakai di Desktop & Mobile */}
          <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 w-fit rounded-2xl bg-amber-500/10 text-amber-500">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-black dark:text-white">
                {t.whyUs.c4Title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {t.whyUs.c4Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 space-y-3">
          <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold">{t.features.f1Title}</h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {t.features.f1Desc}
          </p>
        </div>

        <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 space-y-3">
          <div className="p-3 w-fit rounded-xl bg-[#ff3700]/10 text-[#ff3700]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold">{t.features.f2Title}</h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {t.features.f2Desc}
          </p>
        </div>

        <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/10 space-y-3">
          <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold">{t.features.f3Title}</h4>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {t.features.f3Desc}
          </p>
        </div>
      </section>

    </div>
  );
}
