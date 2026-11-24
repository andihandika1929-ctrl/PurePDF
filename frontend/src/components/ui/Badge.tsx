import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'pro' | 'live' | 'accent' | 'mono' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center select-none font-medium rounded-full transition-colors duration-150';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  }[size];

  const variantStyles = {
    default: 'bg-white dark:bg-zinc-800 text-black dark:text-white border border-black/10 dark:border-white/10 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
    pro: 'bg-[#ff3700] text-white font-bold tracking-wider shadow-[0_0_10px_rgba(255,55,0,0.5)]',
    live: 'bg-white dark:bg-zinc-800 text-black dark:text-white border border-black/10 dark:border-white/10 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
    accent: 'bg-[#ff3700]/10 text-[#ff3700] border border-[#ff3700]/25 font-semibold',
    mono: 'bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-mono tracking-tight',
    outline: 'bg-transparent text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-zinc-700'
  }[variant];

  return (
    <span className={cn(baseStyles, sizeStyles, variantStyles, className)} {...props}>
      {variant === 'live' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {children}
    </span>
  );
};
