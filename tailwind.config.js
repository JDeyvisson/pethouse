/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All semantic colors resolve through CSS variables so the same
        // Tailwind class (bg-bg, text-text, etc.) works in both themes.
        bg:          'rgb(var(--color-bg)         / <alpha-value>)',
        surface:     'rgb(var(--color-surface)    / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2)  / <alpha-value>)',
        text:        'rgb(var(--color-text)        / <alpha-value>)',
        muted:       'rgb(var(--color-muted)       / <alpha-value>)',
        primary:     '#5E8B7E',
        'primary-dark': '#4a7267',
        coral:       'rgb(var(--color-coral) / <alpha-value>)',
        'coral-dark': '#e8663f',
        honey:       'rgb(var(--color-honey) / <alpha-value>)',
        info:        'rgb(var(--color-info) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        'card-lg': '20px',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'paw-pop': {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-8deg)' },
          '60%': { opacity: '1', transform: 'scale(1.08) rotate(4deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        float: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.8)' },
          '15%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(-40px) scale(1.1)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wag: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'paw-pop': 'paw-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        float: 'float 1.4s ease-out forwards',
        'bounce-soft': 'bounce-soft 1.4s ease-in-out infinite',
        wag: 'wag 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}
