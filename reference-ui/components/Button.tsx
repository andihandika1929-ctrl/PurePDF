import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

/**
 * Tactile Pill Button
 * Replicating the distinct physical feel:
 * - Multi-stop layered drop shadow
 * - Inset bevel lighting shadow
 * - Lift and scale-up on hover (translateY -1px, scale 1.01)
 * - Depress on active/click (translateY 1px, scale 0.98)
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-sans font-medium select-none transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none';

  const sizeStyles = {
    sm: 'text-xs h-9 px-4 rounded-full gap-1.5',
    md: 'text-[15px] h-11 px-6 rounded-full gap-2',
    lg: 'text-base h-13 px-8 rounded-full gap-2.5',
    icon: 'h-11 w-11 rounded-full p-0 flex items-center justify-center'
  }[variant === 'icon' ? 'icon' : size];

  const variantStyles = {
    primary:
      'bg-black text-white hover:bg-neutral-900 active:bg-black ' +
      'shadow-[0.57px_0.57px_1.76px_-0.42px_rgba(0,0,0,0.18),1.45px_1.45px_4.5px_-0.83px_rgba(0,0,0,0.18),2.9px_2.9px_9px_-1.25px_rgba(0,0,0,0.18),5.5px_5.5px_17.1px_-1.67px_rgba(0,0,0,0.18),10.9px_10.9px_34px_-2.08px_rgba(0,0,0,0.18),24px_24px_74.7px_-2.5px_rgba(0,0,0,0.18),inset_0px_-16px_48px_0px_rgb(0,0,0)] ' +
      'hover:shadow-[0.57px_0.57px_1.76px_-0.42px_rgba(0,0,0,0.22),1.45px_1.45px_4.5px_-0.83px_rgba(0,0,0,0.22),2.9px_2.9px_9px_-1.25px_rgba(0,0,0,0.22),5.5px_5.5px_17.1px_-1.67px_rgba(0,0,0,0.22),10.9px_10.9px_34px_-2.08px_rgba(0,0,0,0.22),24px_24px_74.7px_-2.5px_rgba(0,0,0,0.22),inset_0px_-16px_48px_0px_rgb(64,64,64)] ' +
      'hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0.5 active:scale-[0.98]',

    accent:
      'bg-[#ff3700] text-white hover:bg-[#e63200] ' +
      'shadow-[0px_0.62px_0.62px_-0.7px_rgba(255,38,0,0.69),0px_1.7px_1.7px_-1.4px_rgba(255,38,0,0.67),0px_3.72px_3.72px_-2.1px_rgba(255,38,0,0.63),0px_8.26px_8.26px_-2.8px_rgba(255,38,0,0.54),0px_21px_21px_-3.5px_rgba(255,38,0,0.3)] ' +
      'hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0.5 active:scale-[0.98]',

    secondary:
      'bg-white text-black border border-black/10 hover:border-black/20 hover:bg-neutral-50 ' +
      'shadow-[0px_1px_2px_rgba(0,0,0,0.06),0px_4px_12px_rgba(0,0,0,0.05)] ' +
      'hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98]',

    ghost:
      'bg-transparent text-black hover:bg-black/5 active:bg-black/10 ' +
      'hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98]',

    icon:
      'bg-white text-black border border-black/10 hover:border-black/20 ' +
      'shadow-[0px_1px_3px_rgba(0,0,0,0.08)] ' +
      'hover:-translate-y-0.5 hover:scale-105 active:translate-y-0.5 active:scale-95'
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="transition-transform duration-200 group-hover:-translate-x-0.5">
              {icon}
            </span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
};
