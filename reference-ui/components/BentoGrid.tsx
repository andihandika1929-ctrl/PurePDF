import React from 'react';

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4 | 12;
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * BentoGrid Container
 * Flexible responsive grid layout for bento boxes.
 */
export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  columns = 12,
  gap = 'md',
  className = '',
  ...props
}) => {
  const gapStyles = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }[gap];

  const colStyles = {
    2: 'grid grid-cols-1 md:grid-cols-2',
    3: 'grid grid-cols-1 md:grid-cols-3',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    12: 'grid grid-cols-1 md:grid-cols-12'
  }[columns];

  return (
    <div className={`w-full ${colStyles} ${gapStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
