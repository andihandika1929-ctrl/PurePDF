import React, { useState, useEffect } from 'react';
import { Button } from './Button';

export interface NavbarProps {
  wordmarkTitle?: string;
  wordmarkAccent?: string;
  onMenuClick?: () => void;
  ctaText?: string;
  onCtaClick?: () => void;
  scrollThreshold?: number;
  className?: string;
}

/**
 * Sticky Navbar with Dynamic Scroll Shadow
 * Replicating the scroll-driven elevation effect:
 * - At resting position: transparent floating bar, minimal or resting pill shadow
 * - On scroll (scrollY > 15px): triggers elevation transition to frosted glassmorphism
 *   with multi-layer shadow (0 1px 2px, 0 4px 12px, 0 16px 32px)
 */
export const Navbar: React.FC<NavbarProps> = ({
  wordmarkTitle = 'STUDIO',
  wordmarkAccent = 'Design',
  onMenuClick,
  ctaText = 'Get in Touch',
  onCtaClick,
  scrollThreshold = 15,
  className = ''
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setIsScrolled(scrollPos > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  return (
    <header className={`sticky top-4 z-50 w-full px-4 sm:px-8 max-w-7xl mx-auto ${className}`}>
      <div
        className={`flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? 'bg-white/85 backdrop-blur-md border border-white/60 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.08),0_16px_32px_-4px_rgba(0,0,0,0.06)]'
            : 'bg-transparent border border-transparent'
        }`}
      >
        {/* Wordmark Pill */}
        <div className="flex items-center gap-1.5 h-11 px-5 rounded-full bg-white text-black border border-black/[0.06] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] select-none">
          <span className="font-sans font-bold text-sm tracking-tight">{wordmarkTitle}</span>
          <span className="font-serif italic font-normal text-base text-neutral-800">
            {wordmarkAccent}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {ctaText && (
            <Button
              size="sm"
              variant="primary"
              onClick={onCtaClick}
              className="hidden sm:inline-flex"
            >
              {ctaText}
            </Button>
          )}

          {/* Menu Trigger Pill */}
          <button
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-black border border-black/[0.06] shadow-[0px_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0px_2px_6px_rgba(0,0,0,0.12)] active:translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            <div className="flex flex-col gap-1 w-4">
              <span className="w-full h-0.5 bg-black rounded-full" />
              <span className="w-full h-0.5 bg-black rounded-full" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
