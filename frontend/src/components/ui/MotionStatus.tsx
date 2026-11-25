'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EASES, SPRINGS } from '@/lib/motion';

interface CircularProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  progress,
  size = 76,
  strokeWidth = 4,
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, progress));
  const center = size / 2;
  const radius = center - strokeWidth - 4;
  const outerRadius = center - 1.5;

  return (
    <div
      className="relative inline-flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Spinning outer precision orbital ring */}
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
      >
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.25"
          strokeDasharray="10 18"
          strokeLinecap="round"
          opacity={0.45}
        />
      </motion.svg>

      {/* Main progress track + animated arc */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0.04 }}
          animate={{ pathLength: Math.max(0.04, clamped / 100) }}
          transition={SPRINGS.mechanical}
        />
      </svg>

      {/* Tabular percentage readout */}
      <span className="absolute font-mono text-xs font-semibold text-[var(--color-text)] tabular-nums">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
};

interface AnimatedCheckmarkProps {
  size?: number;
  className?: string;
}

export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
  size = 64,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={SPRINGS.tactile}
      className={`inline-flex items-center justify-center rounded-full bg-[var(--color-success)]/12 border border-[var(--color-success)]/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle outline drawn first */}
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          stroke="var(--color-success)"
          strokeWidth="2.75"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.42, ease: EASES.precision }}
        />
        {/* Checkmark path drawn slowly right after */}
        <motion.path
          d="M15 24.5L21.5 31L33.5 18"
          stroke="var(--color-success)"
          strokeWidth="3.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.24, duration: 0.45, ease: EASES.precision }}
        />
      </svg>
    </motion.div>
  );
};
