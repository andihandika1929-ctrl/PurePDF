import React from 'react';
import { cn } from '@/lib/utils';

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'dark' | 'pro';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'lg' | 'xl' | '2xl';
  interactive?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  rounded = 'xl',
  interactive = true,
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';

  const roundedStyles = {
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl'
  }[rounded];

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4 sm:p-5',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-7'
  }[padding];

  const variantStyles = {
    default:
      'bg-white dark:bg-zinc-900 text-black dark:text-white border border-black/[0.06] dark:border-white/[0.08] ' +
      'shadow-[0px_0.5px_1.25px_-1.25px_rgba(0,0,0,0.29),0px_1.83px_4.76px_-2.5px_rgba(0,0,0,0.25),0px_8px_20.8px_-3.75px_rgba(0,0,0,0.1)] ' +
      (interactive
        ? 'hover:-translate-y-1 hover:shadow-[0px_0px_0px_8px_rgba(255,255,255,0.35),12px_16px_16px_0px_rgba(0,0,0,0.1)] dark:hover:shadow-[0px_0px_0px_8px_rgba(255,255,255,0.06),12px_16px_24px_0px_rgba(0,0,0,0.4)]'
        : ''),

    elevated:
      'bg-white dark:bg-zinc-900 text-black dark:text-white border border-black/[0.04] dark:border-white/[0.08] ' +
      'shadow-[0px_0px_0px_8px_rgba(255,255,255,0.25),12px_16px_16px_0px_rgba(0,0,0,0.1)] ' +
      (interactive ? 'hover:-translate-y-1' : ''),

    glass:
      'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-black dark:text-white border border-white/60 dark:border-white/10 ' +
      'shadow-[0px_0.5px_1.25px_-1.25px_rgba(0,0,0,0.2),0px_8px_20.8px_-3.75px_rgba(0,0,0,0.08)] ' +
      (interactive ? 'hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-zinc-900/90' : ''),

    dark:
      'bg-[#141414] text-white border border-white/10 ' +
      'shadow-[0px_1px_2px_rgba(0,0,0,0.4),0px_12px_24px_rgba(0,0,0,0.3)] ' +
      (interactive ? 'hover:-translate-y-1 hover:border-white/20' : ''),

    pro:
      'bg-white dark:bg-zinc-900 text-black dark:text-white border border-[#ff3700]/30 dark:border-[#ff3700]/40 ' +
      'shadow-[0px_0.62px_0.62px_-0.7px_rgba(255,38,0,0.4),0px_1.7px_1.7px_-1.4px_rgba(255,38,0,0.3),0px_8.26px_8.26px_-2.8px_rgba(255,38,0,0.18)] ' +
      (interactive
        ? 'hover:-translate-y-1.5 hover:border-[#ff3700]/60 hover:shadow-[0px_0.62px_0.62px_-0.7px_rgba(255,38,0,0.6),0px_3.72px_3.72px_-2.1px_rgba(255,38,0,0.5),0px_21px_21px_-3.5px_rgba(255,38,0,0.3)]'
        : '')
  }[variant];

  return (
    <div
      className={cn(baseStyles, roundedStyles, paddingStyles, variantStyles, className)}
      {...props}
    >
      {children}
    </div>
  );
};
