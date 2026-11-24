import React from 'react';
import { cn } from '@/lib/utils';

export interface AdSlotProps {
  format: 'skyscraper' | 'leaderboard' | 'banner';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ format, className = '' }) => {
  const formats = {
    skyscraper: 'w-[160px] h-[600px]',
    leaderboard: 'w-full max-w-[728px] h-[90px]',
    banner: 'w-full max-w-[300px] h-[250px]'
  };

  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-dashed border-neutral-300 dark:border-zinc-700/80 text-neutral-400 overflow-hidden select-none',
        formats[format],
        className
      )}
    >
      <div className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-widest text-neutral-400">
        ADVERTISEMENT
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center p-3">
        <span className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400">
          Google AdSense
        </span>
        <span className="text-[11px] font-mono text-neutral-400">
          {format === 'skyscraper' && '160 × 600 Skyscraper'}
          {format === 'leaderboard' && '728 × 90 Leaderboard'}
          {format === 'banner' && '300 × 250 Medium Banner'}
        </span>
      </div>
      <div className="absolute bottom-2 right-2 text-[8px] font-mono text-neutral-300 dark:text-zinc-600">
        SAFE_ZONE
      </div>
    </aside>
  );
};
