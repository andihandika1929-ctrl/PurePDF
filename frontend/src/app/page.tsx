'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { TOOLS, CATEGORIES, Category, ToolMeta } from '@/config/toolsConfig';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { EASES, SPRINGS } from '@/lib/motion';
import {
  Search,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  SlidersHorizontal,
  Smartphone,
  Lock,
  X,
  Cpu,
} from 'lucide-react';

export default function HomePage() {
  const { t, language, isInternalMode } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleCardSpotlight = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  // Command Search shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

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

  const quickLaunchTools = useMemo(() => {
    const slugs = isInternalMode
      ? ['compress-pdf', 'merge-pdf', 'split-pdf', 'pdf-to-word']
      : ['compress-pdf', 'merge-pdf', 'pdf-to-word', 'force-unlock-pdf'];
    return slugs
      .map((slug) => availableTools.find((tool) => tool.slug === slug))
      .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
  }, [availableTools, isInternalMode]);

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-12 sm:space-y-16">
      
      {/* Swiss Industrial Utility Hero Section */}
      <section className="relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hero-ambient-glow p-6 sm:p-10 lg:p-12">
        <div className="max-w-3xl space-y-6">
          {/* Live Telemetry Pill */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASES.precision }}
            className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[11px] font-mono uppercase tracking-[0.06em] select-none"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
            <span className="font-semibold text-[var(--color-text)]">{t.hero.kicker}</span>
            <span className="text-[var(--color-border-strong)]">•</span>
            <span className="text-[var(--color-text-muted)]">
              {availableTools.length} {language === 'id' ? 'ALAT' : 'TOOLS'}
            </span>
            <span className="text-[var(--color-border-strong)]">•</span>
            <span className="text-[var(--color-text-muted)]">{t.hero.suiteBadge}</span>
          </motion.div>

          {/* Sharp Display Heading */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.42, ease: EASES.precision }}
            className="space-y-3"
          >
            <h1 className="font-display text-4xl sm:text-6xl lg:text-[4.25rem] font-bold tracking-[-0.035em] text-[var(--color-text)] leading-[1.04]">
              {t.hero.title1}{' '}
              <span className="text-[var(--color-accent)]">{t.hero.titleHighlight}</span>
              {t.hero.title2 ? ` ${t.hero.title2}` : ''}
            </h1>

            <p className="text-[15px] sm:text-lg text-[var(--color-text-secondary)] max-w-2xl leading-[1.55]">
              {t.hero.description}
            </p>
          </motion.div>

          {/* Command Search Bar (⌘K) + Quick-Launch Pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.38, ease: EASES.precision }}
            className="space-y-3.5 pt-1"
          >
            <div className="relative max-w-2xl">
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t.hero.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-20 rounded-md bg-[var(--color-bg)] text-sm sm:text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-colors"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-sm bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[11px] text-[var(--color-text-muted)] select-none pointer-events-none">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Quick-Launch Action Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-text-muted)] mr-1">
                {language === 'id' ? 'Cepat:' : 'Quick:'}
              </span>
              {quickLaunchTools.map((tool) => (
                <Link key={tool.slug} href={`/${tool.slug}`}>
                  <motion.span
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRINGS.tactile}
                    className="group inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--color-bg)] hover:bg-[var(--color-surface-subtle)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-xs font-medium text-[var(--color-text)] transition-colors"
                  >
                    <span>{language === 'id' ? tool.nameId : tool.nameEn}</span>
                    {tool.isPro && (
                      <span className="font-mono text-[9px] font-semibold px-1 py-0.5 rounded-sm bg-[var(--color-accent)] text-[var(--color-on-accent)] leading-none">
                        PRO
                      </span>
                    )}
                    <ArrowUpRight className="w-3 h-3 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                  </motion.span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter Bar (layoutId Sliding Pill) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] w-fit">
            {availableCategories.map((category) => {
              const isSelected = selectedCategory === category;
              const isPro = category === '✨ PRO AI';
              const categoryLabel =
                category === '✨ PRO AI' ? 'PRO AI' : t.categories[category];

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`relative px-3.5 sm:px-4 h-9 rounded-full text-xs sm:text-[13px] font-medium select-none flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? isPro
                        ? 'text-[var(--color-on-accent)]'
                        : 'text-[var(--color-surface)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="active-category-pill"
                      transition={SPRINGS.mechanical}
                      className={`absolute inset-0 rounded-full ${
                        isPro ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-text)]'
                      }`}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isPro && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-[var(--color-on-accent)]' : 'bg-[var(--color-accent)]'
                        }`}
                      />
                    )}
                    <span>{categoryLabel}</span>
                    {category === 'All' && (
                      <span className="font-mono text-[10px] opacity-65">
                        {availableTools.length}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Telemetry Counter */}
          <div className="text-xs font-mono uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            {t.hero.showing}{' '}
            <strong className="text-[var(--color-text)] font-semibold">
              {filteredTools.length}
            </strong>{' '}
            / {availableTools.length} {t.hero.tools}
            {selectedCategory !== 'All' &&
              ` · ${selectedCategory === '✨ PRO AI' ? 'PRO AI' : t.categories[selectedCategory]}`}
          </div>
        </div>
      </section>

      {/* Asymmetric Bento Grid + Modular Tool Catalog */}
      <section className="space-y-6">
        {filteredTools.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASES.precision }}
            className="text-center py-16 px-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] max-w-lg mx-auto space-y-3"
          >
            <div className="w-10 h-10 rounded-md bg-[var(--color-surface-subtle)] border border-[var(--color-border)] flex items-center justify-center mx-auto text-[var(--color-text-muted)]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[var(--color-text)]">
              {t.hero.noToolsFound}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">{t.hero.noToolsDesc}</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[var(--color-accent)] hover:underline pt-1"
            >
              {t.hero.resetFilters} →
            </button>
          </motion.div>
        ) : (
          (() => {
            const showFeaturedBento = selectedCategory === 'All' && !searchQuery.trim();
            const featuredSlugs = isInternalMode
              ? ['compress-pdf', 'merge-pdf']
              : ['compress-pdf', 'force-unlock-pdf'];
            const featuredTools: ToolMeta[] = showFeaturedBento
              ? featuredSlugs
                  .map((slug) => filteredTools.find((item) => item.slug === slug))
                  .filter((item): item is ToolMeta => Boolean(item))
              : [];
            const catalogTools = showFeaturedBento
              ? filteredTools.filter((item) => !featuredSlugs.includes(item.slug))
              : filteredTools;

            return (
              <>
                {/* Featured Asymmetric Bento Row (2 Wide Spec Modules) */}
                {featuredTools.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {featuredTools.map((tool, idx) => {
                      const name = language === 'id' ? tool.nameId : tool.nameEn;
                      const desc = language === 'id' ? tool.shortDescId : tool.shortDescEn;
                      const specTag =
                        tool.slug === 'compress-pdf'
                          ? language === 'id'
                            ? 'HEMAT HINGGA 85%'
                            : 'UP TO 85% SMALLER'
                          : tool.slug === 'force-unlock-pdf'
                          ? language === 'id'
                            ? 'DEKRIPSI INSTAN'
                            : 'INSTANT DECRYPT'
                          : language === 'id'
                          ? 'MULTI-DOKUMEN'
                          : 'MULTI-DOCUMENT';

                      return (
                        <Link
                          key={tool.slug}
                          href={`/${tool.slug}`}
                          className={`group block ${idx === 0 ? 'lg:col-span-7' : 'lg:col-span-5'}`}
                        >
                          <motion.div
                            onMouseMove={handleCardSpotlight}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.985 }}
                            transition={SPRINGS.tactile}
                            className={`h-full relative overflow-hidden rounded-lg border p-6 sm:p-7 flex flex-col justify-between gap-6 transition-[border-color,box-shadow] duration-200 ${
                              tool.isPro
                                ? 'bg-[var(--color-surface)] border-[var(--color-accent)]/45 hover:border-[var(--color-accent)] hover:shadow-[0_18px_40px_-10px_rgba(255,55,0,0.28),0_0_0_1px_rgba(255,55,0,0.65)]'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/60 hover:shadow-[0_18px_38px_-10px_rgba(17,17,16,0.16),0_0_0_1px_rgba(255,55,0,0.35)] dark:hover:shadow-[0_18px_38px_-10px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,55,0,0.45)]'
                            }`}
                          >
                            {/* Mouse-Tracking Border & Surface Spotlight */}
                            <div
                              className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{
                                background:
                                  'radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 55, 0, 0.12), transparent 65%)',
                              }}
                            />
                            {tool.isPro && (
                              <div className="absolute inset-x-0 top-0 h-[2px] bg-[var(--color-accent)]" />
                            )}

                            <div className="space-y-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-10 h-10 rounded-md flex items-center justify-center border transition-colors ${
                                      tool.isPro
                                        ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)]'
                                        : 'bg-[var(--color-surface-subtle)] text-[var(--color-text)] border-[var(--color-border)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-on-accent)] group-hover:border-[var(--color-accent)]'
                                    }`}
                                  >
                                    <ToolIcon name={tool.iconName} className="w-5 h-5" />
                                  </div>
                                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] px-2 py-1 rounded-sm bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                                    {specTag}
                                  </span>
                                </div>

                                <span
                                  className={`font-mono text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-1 rounded-sm ${
                                    tool.isPro
                                      ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                                      : 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                                  }`}
                                >
                                  {tool.isPro
                                    ? 'PRO AI'
                                    : language === 'id'
                                    ? 'UNGGULAN'
                                    : 'FEATURED'}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors flex items-center justify-between gap-2">
                                  <span>{name}</span>
                                  <ArrowUpRight className="w-5 h-5 shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                                  {desc}
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
                              <span>
                                {tool.isPro
                                  ? language === 'id'
                                    ? 'ENGINE AI · 2 KREDIT'
                                    : 'AI ENGINE · 2 CREDITS'
                                  : language === 'id'
                                  ? 'LOKAL DI BROWSER · GRATIS'
                                  : 'LOCAL WASM · FREE'}
                              </span>
                              <span className="text-[var(--color-text)] font-medium group-hover:text-[var(--color-accent)] transition-colors">
                                {t.card.openTool}
                              </span>
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Modular Tool Catalog Grid (Real-Time Framer Motion Search & Filter Reflow) */}
                <LayoutGroup>
                  <motion.div
                    layout
                    transition={SPRINGS.mechanical}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                    <AnimatePresence mode="popLayout">
                      {catalogTools.map((tool, index) => {
                        const name = language === 'id' ? tool.nameId : tool.nameEn;
                        const desc = language === 'id' ? tool.shortDescId : tool.shortDescEn;
                        const isComingSoon = Boolean(tool.isComingSoon);

                        const cardInner = (
                          <motion.div
                            onMouseMove={isComingSoon ? undefined : handleCardSpotlight}
                            whileHover={isComingSoon ? undefined : { y: -4 }}
                            whileTap={isComingSoon ? undefined : { scale: 0.98 }}
                            transition={SPRINGS.tactile}
                            className={`h-full relative overflow-hidden rounded-lg border p-5 flex flex-col justify-between gap-5 transition-[border-color,box-shadow] duration-200 ${
                              isComingSoon
                                ? 'bg-[var(--color-surface)]/70 border-dashed border-[var(--color-border)] opacity-65 cursor-not-allowed'
                                : tool.isPro
                                ? 'bg-[var(--color-surface)] border-[var(--color-accent)]/40 hover:border-[var(--color-accent)] hover:shadow-[0_16px_36px_-10px_rgba(255,55,0,0.28),0_0_0_1px_rgba(255,55,0,0.6)]'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/55 hover:shadow-[0_16px_32px_-10px_rgba(17,17,16,0.16),0_0_0_1px_rgba(255,55,0,0.35)] dark:hover:shadow-[0_16px_32px_-10px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,55,0,0.45)]'
                            }`}
                          >
                            {!isComingSoon && (
                              <div
                                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                  background:
                                    'radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 55, 0, 0.12), transparent 65%)',
                                }}
                              />
                            )}
                          <div className="space-y-4">
                            {/* Top Row: Monochrome Precision Icon + Mono Tag */}
                            <div className="flex items-center justify-between gap-2">
                              <div
                                className={`w-9 h-9 rounded-md flex items-center justify-center border transition-colors ${
                                  isComingSoon
                                    ? 'bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                                    : tool.isPro
                                    ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)]'
                                    : 'bg-[var(--color-surface-subtle)] text-[var(--color-text)] border-[var(--color-border)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-on-accent)] group-hover:border-[var(--color-accent)]'
                                }`}
                              >
                                <ToolIcon name={tool.iconName} className="w-4 h-4" />
                              </div>

                              {isComingSoon ? (
                                <span className="font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-sm bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                  {language === 'id' ? 'SEGERA' : 'SOON'}
                                </span>
                              ) : tool.isPro ? (
                                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-sm bg-[var(--color-accent)] text-[var(--color-on-accent)]">
                                  PRO AI
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                                  {tool.category}
                                </span>
                              )}
                            </div>

                            {/* Tool Title & 14px Description */}
                            <div className="space-y-1.5">
                              <h3
                                className={`font-display text-[17px] font-semibold tracking-[-0.015em] flex items-start justify-between gap-2 leading-snug ${
                                  isComingSoon
                                    ? 'text-[var(--color-text-muted)]'
                                    : 'text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors'
                                }`}
                              >
                                <span>{name}</span>
                                {!isComingSoon && (
                                  <ArrowUpRight className="w-4 h-4 mt-0.5 shrink-0 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all text-[var(--color-accent)]" />
                                )}
                              </h3>
                              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-[1.55]">
                                {desc}
                              </p>
                            </div>
                          </div>

                          {/* Bottom Telemetry Divider */}
                          <div className="pt-3.5 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.04em] text-[var(--color-text-muted)]">
                            <span>
                              {isComingSoon
                                ? language === 'id'
                                  ? 'PENGEMBANGAN'
                                  : 'IN PROGRESS'
                                : tool.isPro
                                ? 'PRO AI'
                                : 'LOCAL'}
                            </span>
                            <span
                              className={
                                isComingSoon
                                  ? 'text-[var(--color-text-muted)]'
                                  : 'text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors'
                              }
                            >
                              {isComingSoon
                                ? language === 'id'
                                  ? 'Segera Hadir'
                                  : 'Coming Soon'
                                : '→'}
                            </span>
                          </div>
                        </motion.div>
                      );

                      return (
                        <motion.div
                          key={tool.slug}
                          layout
                          initial={{ opacity: 0, y: 14, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.92 }}
                          transition={{
                            layout: SPRINGS.mechanical,
                            opacity: { duration: 0.22, delay: Math.min(index * 0.02, 0.24) },
                            y: { duration: 0.28, ease: EASES.precision, delay: Math.min(index * 0.02, 0.24) },
                            scale: { duration: 0.24, ease: EASES.precision },
                          }}
                          className="h-full"
                        >
                          {isComingSoon ? (
                            <div
                              className="block h-full select-none"
                              title={
                                language === 'id'
                                  ? 'Fitur ini sedang dalam pengembangan'
                                  : 'This tool is currently in development'
                              }
                            >
                              {cardInner}
                            </div>
                          ) : (
                            <Link href={`/${tool.slug}`} className="group block h-full">
                              {cardInner}
                            </Link>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
                </LayoutGroup>
              </>
            );
          })()
        )}
      </section>

      {/* Consolidated 4-Module Swiss Spec Grid (Replaces Redundant WhyUs + Feature Highlights) */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.4, ease: EASES.precision }}
        className="space-y-8 pt-10 border-t border-[var(--color-border)]"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--color-accent)] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              <span>{language === 'id' ? 'ARSITEKTUR SISTEM' : 'SYSTEM ARCHITECTURE'}</span>
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-[var(--color-text)] leading-[1.12]">
              {language === 'id'
                ? 'Dirancang untuk privasi lokal & presisi dokumen.'
                : 'Built for local privacy and document precision.'}
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md leading-relaxed">
            {language === 'id'
              ? 'Alat standar berjalan langsung di memori browser Anda. Hanya alat PRO AI yang menyentuh server sementara lalu langsung terhapus.'
              : 'Standard tools execute entirely inside browser memory. Only PRO AI tasks touch ephemeral compute and purge immediately.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              num: '01',
              icon: Cpu,
              title: language === 'id' ? 'Mesin WebAssembly Lokal' : 'Local WebAssembly Engine',
              desc:
                language === 'id'
                  ? 'Kompresi, penggabungan, dan pengurutan halaman berjalan langsung di perangkat Anda tanpa antrean upload.'
                  : 'Compression, merging, and page reordering run directly on your device with zero upload queue.',
            },
            {
              num: '02',
              icon: Lock,
              title: language === 'id' ? 'Zero Server Retention' : 'Zero Server Retention',
              desc:
                language === 'id'
                  ? 'Dokumen standar tidak pernah meninggalkan tab browser. Memori otomatis dibersihkan begitu sesi selesai.'
                  : 'Standard files never leave your browser tab. Memory buffers are purged as soon as processing completes.',
            },
            {
              num: '03',
              icon: Zap,
              title: language === 'id' ? 'Presisi Vektor & Tabel' : 'Vector & Table Fidelity',
              desc:
                language === 'id'
                  ? 'Mempertahankan ketajaman teks vektor, garis, dan struktur tabel tanpa watermark atau penurunan resolusi paksa.'
                  : 'Preserves sharp vector fonts, line art, and table boundaries without watermarks or forced rasterization.',
            },
            {
              num: '04',
              icon: Smartphone,
              title: language === 'id' ? 'Workspace Bersih & PWA' : 'Clean Workspace & PWA',
              desc:
                language === 'id'
                  ? 'Tanpa pop-up menjebak di desktop maupun mobile. Aktifkan VVIP untuk download 0 detik dan 100% bebas iklan.'
                  : 'Zero deceptive pop-ups on desktop or mobile. Upgrade to VVIP for 0-second downloads and a 100% ad-free workspace.',
            },
          ].map((spec, idx) => {
            const SpecIcon = spec.icon;
            return (
              <motion.div
                key={spec.num}
                onMouseMove={handleCardSpotlight}
                initial={{ opacity: 0, y: 36, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.48,
                  delay: idx * 0.1,
                  ease: EASES.precision,
                }}
                whileHover={{ y: -4, transition: SPRINGS.tactile }}
                className="group relative overflow-hidden rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)]/55 bg-[var(--color-surface)] p-6 flex flex-col justify-between gap-6 transition-[border-color,box-shadow] duration-200 hover:shadow-[0_16px_32px_-10px_rgba(17,17,16,0.14),0_0_0_1px_rgba(255,55,0,0.3)] dark:hover:shadow-[0_16px_32px_-10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,55,0,0.4)]"
              >
                <div
                  className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      'radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 55, 0, 0.1), transparent 65%)',
                  }}
                />
                <div className="flex items-center justify-between relative z-10">
                  <div className="w-9 h-9 rounded-md bg-[var(--color-surface-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] group-hover:text-[var(--color-accent)] group-hover:border-[var(--color-accent)]/40 transition-colors">
                    <SpecIcon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">
                    /{spec.num}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-[var(--color-text)]">
                    {spec.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-[1.55]">
                    {spec.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

    </div>
  );
}
