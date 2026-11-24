import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg, #fafafa)',
        surface: {
          DEFAULT: 'var(--color-surface, #ffffff)',
          glass: 'var(--color-surface-glass, rgba(255, 255, 255, 0.88))',
          dark: 'var(--color-surface-dark, #141414)',
          card: 'var(--color-surface-card, #ffffff)'
        },
        border: {
          DEFAULT: 'var(--color-border, #e4e4e7)',
          subtle: 'var(--color-border-subtle, rgba(0, 0, 0, 0.06))',
          glass: 'var(--color-border-glass, rgba(255, 255, 255, 0.7))',
          input: 'var(--color-border-input, #a1a1aa)'
        },
        text: {
          DEFAULT: 'var(--color-text, #09090b)',
          secondary: 'var(--color-text-secondary, #27272a)',
          muted: 'var(--color-text-muted, #71717a)',
          dark: 'var(--color-text-dark, #ffffff)'
        },
        accent: {
          DEFAULT: 'var(--color-accent, #ff3700)',
          on: 'var(--color-on-accent, #ffffff)',
          glow: 'rgba(255, 55, 0, 0.4)'
        },
        danger: 'var(--color-danger, #e11d48)',
        success: 'var(--color-success, #16a34a)'
      },
      fontFamily: {
        sans: ['"Inter Display"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Fragment Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      borderRadius: {
        sm: 'var(--radius-sm, 8px)',
        md: 'var(--radius-md, 12px)',
        lg: 'var(--radius-lg, 16px)',
        xl: 'var(--radius-xl, 24px)',
        '2xl': 'var(--radius-2xl, 32px)',
        pill: 'var(--radius-pill, 9999px)'
      },
      boxShadow: {
        card: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 4px 16px rgba(0, 0, 0, 0.04)',
        'card-ambient': '0px 0px 0px 6px rgba(255, 55, 0, 0.06), 0px 12px 24px -4px rgba(0, 0, 0, 0.08)',
        'card-elevated': '0px 0.75px 0.75px -0.63px rgba(0, 0, 0, 0.18), 0px 1.93px 1.93px -1.25px rgba(0, 0, 0, 0.18), 0px 3.86px 3.86px -1.88px rgba(0, 0, 0, 0.17), 0px 7.32px 7.32px -2.5px rgba(0, 0, 0, 0.16), 0px 14.56px 14.56px -3.13px rgba(0, 0, 0, 0.13), 0px 32px 32px -3.75px rgba(0, 0, 0, 0.06), 0px 0px 0px 7px rgb(255, 255, 255)',
        button: '0.57px 0.57px 1.76px -0.42px rgba(0, 0, 0, 0.18), 1.45px 1.45px 4.5px -0.83px rgba(0, 0, 0, 0.18), 2.9px 2.9px 9px -1.25px rgba(0, 0, 0, 0.18), 5.5px 5.5px 17.1px -1.67px rgba(0, 0, 0, 0.18), 10.9px 10.9px 34px -2.08px rgba(0, 0, 0, 0.18), 24px 24px 74.7px -2.5px rgba(0, 0, 0, 0.18), inset 0px -16px 48px 0px rgb(0, 0, 0)',
        'button-hover': '0.57px 0.57px 1.76px -0.42px rgba(0, 0, 0, 0.22), 1.45px 1.45px 4.5px -0.83px rgba(0, 0, 0, 0.22), 2.9px 2.9px 9px -1.25px rgba(0, 0, 0, 0.22), 5.5px 5.5px 17.1px -1.67px rgba(0, 0, 0, 0.22), 10.9px 10.9px 34px -2.08px rgba(0, 0, 0, 0.22), 24px 24px 74.7px -2.5px rgba(0, 0, 0, 0.22), inset 0px -16px 48px 0px rgb(64, 64, 64)',
        'accent-glow': '0px 0.62px 0.62px -0.7px rgba(255, 38, 0, 0.69), 0px 1.7px 1.7px -1.4px rgba(255, 38, 0, 0.67), 0px 3.72px 3.72px -2.1px rgba(255, 38, 0, 0.63), 0px 8.26px 8.26px -2.8px rgba(255, 38, 0, 0.54), 0px 21px 21px -3.5px rgba(255, 38, 0, 0.3)',
        'scroll-header': '0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px -4px rgba(0, 0, 0, 0.06)'
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
};

export default config;
