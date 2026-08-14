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
        coral:       '#FF7E5F',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        'card-lg': '20px',
      },
    },
  },
  plugins: [],
}
