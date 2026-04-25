import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
        },
        surface:  'var(--bg-surface)',
        surface2: 'var(--bg-surface-2)',
        app:      'var(--bg-app)',
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs:   'var(--shadow-xs)',
        sm:   'var(--shadow-sm)',
        card: 'var(--shadow-card)',
        fab:  'var(--shadow-fab)',
      },
      transitionTimingFunction: {
        spring: 'var(--ease-spring)',
        smooth: 'var(--ease-out)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      keyframes: {
        'fade-in':          { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up':         { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'slide-in-bottom':  { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'zoom-in-95':       { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'scale-check':      { '0%': { transform: 'scale(0.8)' }, '60%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'fade-in':         'fade-in var(--duration-base) var(--ease-out)',
        'slide-up':        'slide-up var(--duration-slow) var(--ease-out)',
        'slide-in-bottom': 'slide-in-bottom var(--duration-base) var(--ease-out)',
        'zoom-in-95':      'zoom-in-95 var(--duration-base) var(--ease-out)',
        'scale-check':     'scale-check var(--duration-base) var(--ease-spring)',
      },
    },
  },
  plugins: [],
} satisfies Config
