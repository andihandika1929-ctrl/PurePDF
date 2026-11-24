/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './*.html'
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg, #d9d9d9)',
        surface: {
          DEFAULT: 'var(--color-surface, #ffffff)',
          glass: 'var(--color-surface-glass, rgba(255, 255, 255, 0.82))',
          dark: 'var(--color-surface-dark, #141414)'
        },
        border: {
          DEFAULT: 'var(--color-border, #e5e5e5)',
          subtle: 'var(--color-border-subtle, rgba(0, 0, 0, 0.06))',
          glass: 'var(--color-border-glass, rgba(255, 255, 255, 0.5))',
          input: 'var(--color-border-input, #737373)'
        },
        text: {
          DEFAULT: 'var(--color-text, #000000)',
          secondary: 'var(--color-text-secondary, #262626)',
          muted: 'var(--color-text-muted, #666666)',
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
        card: 'var(--shadow-card)',
        'card-ambient': 'var(--shadow-card-ambient)',
        'card-elevated': 'var(--shadow-card-elevated)',
        button: 'var(--shadow-button)',
        'button-hover': 'var(--shadow-button-hover)',
        'accent-glow': 'var(--shadow-accent-glow)',
        'scroll-header': 'var(--shadow-scroll-header)'
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
};
