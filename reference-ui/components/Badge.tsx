import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'live' | 'accent' | 'mono';
  size?: 'sm' | 'md';
}

/**
 * Pill Badge & Kicker Component
 * Minimal categorical tags and status indicators.
 */
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
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-2'
  }[size];

  const variantStyles = {
    default: 'bg-white text-black border border-black/10 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
    live: 'bg-white text-black border border-black/10 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
    accent: 'bg-[#ff3700]/10 text-[#ff3700] border border-[#ff3700]/20 font-semibold',
    mono: 'bg-black/5 text-neutral-800 font-mono tracking-tight'
  }[variant];

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
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
