/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#f0f4f8',
          100: '#dbe5f0',
          200: '#b7cce1',
          300: '#93b3d2',
          400: '#6f9ac3',
          500: '#2B4C6B', // Azul Marinho Principal
          600: '#24405c',
          700: '#1d344d',
          800: '#16283e',
          900: '#0f1c2f',
        },
        'accent': {
          50: '#fef9f3',
          100: '#fdf3e7',
          200: '#fce7cf',
          300: '#fad9b7',
          400: '#f8c99f',
          500: '#C9A961', // Ouro/Bege Principal
          600: '#a88850',
          700: '#87673f',
          800: '#66462e',
          900: '#45251d',
        },
        'danger': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#D24545', // Vermelho Principal
          600: '#b83636',
          700: '#9d2626',
          800: '#821515',
          900: '#670404',
        },
      },
      fontFamily: {
        'sans': ['system-ui', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        'sm': '0.25rem',
        'base': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'golden': '0 10px 15px -3px rgba(201, 169, 97, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      aspectRatio: {
        'pizza': '1 / 1',
        'banner': '16 / 9',
      },
    },
  },
  plugins: [
    // Suporte a safe areas (PWA/notch support)
    function({ addBase, theme }) {
      addBase({
        'body': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
      })
    },
  ],
}
