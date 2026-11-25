'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export interface GoogleAdSenseProps {
  format: 'skyscraper' | 'leaderboard' | 'banner';
  slotId?: string;
  className?: string;
}

export const GoogleAdSense: React.FC<GoogleAdSenseProps> = ({
  format,
  slotId,
  className = '',
}) => {
  const { showAds } = useApp();
  const pushedRef = useRef(false);

  const clientId = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '').trim();
  const resolvedSlotId = (slotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || '').trim();
  const isConfigured = Boolean(clientId && resolvedSlotId);

  useEffect(() => {
    if (!showAds || !isConfigured || pushedRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // AdSense script not ready or blocked by browser extension
    }
  }, [showAds, isConfigured]);

  // Tier 3 (VVIP / Unlimited / Internal): 100% Ad-Free
  if (!showAds) {
    return null;
  }

  const formats = {
    skyscraper: 'w-[160px] min-h-[600px]',
    leaderboard: 'w-full max-w-[728px] min-h-[90px]',
    banner: 'w-full max-w-[336px] min-h-[250px]',
  };

  if (isConfigured) {
    return (
      <aside
        aria-label="Advertisement"
        data-testid={`ad-slot-${format}`}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden',
          formats[format],
          className
        )}
      >
        <ins
          className="adsbygoogle block w-full h-full"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={resolvedSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    );
  }

  // Clean Swiss Industrial placeholder until AdSense env vars are configured
  return (
    <aside
      aria-label="Advertisement"
      data-testid={`ad-slot-${format}`}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-md bg-[var(--color-surface)]/80 border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)] overflow-hidden select-none',
        formats[format],
        className
      )}
    >
      <div className="absolute top-2 left-2.5 text-[9px] font-mono uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        ADVERTISEMENT
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center p-4">
        <span className="text-xs font-mono font-semibold text-[var(--color-text-secondary)]">
          Google AdSense
        </span>
        <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
          {format === 'skyscraper' && '160 × 600 Skyscraper'}
          {format === 'leaderboard' && '728 × 90 Leaderboard'}
          {format === 'banner' && '300 × 250 Safe Banner'}
        </span>
      </div>
      <div className="absolute bottom-2 right-2.5 text-[9px] font-mono uppercase tracking-[0.06em] opacity-60">
        AD_SLOT_READY
      </div>
    </aside>
  );
};
