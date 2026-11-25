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
        bg: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          subtle: 'var(--color-surface-subtle)',
          glass: 'var(--color-surface-glass)',
          dark: 'var(--color-surface-dark)',
          card: 'var(--color-surface)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
          subtle: 'var(--color-border-subtle)',
          glass: 'var(--color-border-glass)',
          input: 'var(--color-border-strong)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          dark: 'var(--color-on-accent)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          on: 'var(--color-on-accent)',
          glow: 'rgba(255, 55, 0, 0.35)',
        },
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-lg)',
        '2xl': 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        hairline: '0 0 0 1px var(--color-border)',
        'hairline-strong': '0 0 0 1px var(--color-border-strong)',
        card: '0 1px 2px rgba(17, 17, 16, 0.04), 0 4px 12px rgba(17, 17, 16, 0.03)',
        'card-elevated': '0 1px 2px rgba(17, 17, 16, 0.06), 0 12px 28px -8px rgba(17, 17, 16, 0.1)',
        'accent-glow': '0 0 0 1px rgba(255, 55, 0, 0.35), 0 8px 24px -6px rgba(255, 55, 0, 0.32)',
        'scroll-header': '0 1px 2px rgba(17, 17, 16, 0.05), 0 10px 28px -6px rgba(17, 17, 16, 0.08)',
      },
      transitionTimingFunction: {
        precision: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
