import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {icon && (
          <span className="absolute left-4 text-neutral-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 sm:h-12 w-full rounded-full bg-white dark:bg-zinc-900 px-5 text-sm sm:text-base text-black dark:text-white border border-black/10 dark:border-white/10 shadow-[0px_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-11' : '',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
