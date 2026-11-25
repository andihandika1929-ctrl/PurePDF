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
  rounded = 'lg',
  interactive = true,
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative overflow-hidden transition-[border-color,background-color,box-shadow] duration-200 ease-precision';

  const roundedStyles = {
    lg: 'rounded-lg',
    xl: 'rounded-lg',
    '2xl': 'rounded-2xl',
  }[rounded];

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4 sm:p-5',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-7',
  }[padding];

  const variantStyles = {
    default:
      'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-card ' +
      (interactive ? 'hover:border-[var(--color-border-strong)] hover:shadow-card-elevated' : ''),

    elevated:
      'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border-strong)] shadow-card-elevated',

    glass:
      'bg-[var(--color-surface-glass)] backdrop-blur-md text-[var(--color-text)] border border-[var(--color-border)] shadow-card ' +
      (interactive ? 'hover:border-[var(--color-border-strong)]' : ''),

    dark:
      'bg-[var(--color-surface-dark)] text-[var(--color-on-accent)] border border-[var(--color-border)] shadow-card-elevated',

    pro:
      'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-accent)]/40 shadow-card ' +
      (interactive
        ? 'hover:border-[var(--color-accent)] hover:shadow-accent-glow'
        : ''),
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
