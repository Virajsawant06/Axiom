/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      colors: {
        'electric-blue': {
          50: 'rgb(var(--color-electric-blue-50) / <alpha-value>)',
          100: 'rgb(var(--color-electric-blue-100) / <alpha-value>)',
          200: 'rgb(var(--color-electric-blue-200) / <alpha-value>)',
          300: 'rgb(var(--color-electric-blue-300) / <alpha-value>)',
          400: 'rgb(var(--color-electric-blue-400) / <alpha-value>)',
          500: 'rgb(var(--color-electric-blue-500) / <alpha-value>)',
          600: 'rgb(var(--color-electric-blue-600) / <alpha-value>)',
          700: 'rgb(var(--color-electric-blue-700) / <alpha-value>)',
          800: 'rgb(var(--color-electric-blue-800) / <alpha-value>)',
          900: 'rgb(var(--color-electric-blue-900) / <alpha-value>)',
        },
        navy: {
          50: 'rgb(var(--color-navy-50) / <alpha-value>)',
          100: 'rgb(var(--color-navy-100) / <alpha-value>)',
          200: 'rgb(var(--color-navy-200) / <alpha-value>)',
          300: 'rgb(var(--color-navy-300) / <alpha-value>)',
          400: 'rgb(var(--color-navy-400) / <alpha-value>)',
          500: 'rgb(var(--color-navy-500) / <alpha-value>)',
          600: 'rgb(var(--color-navy-600) / <alpha-value>)',
          700: 'rgb(var(--color-navy-700) / <alpha-value>)',
          800: 'rgb(var(--color-navy-800) / <alpha-value>)',
          900: 'rgb(var(--color-navy-900) / <alpha-value>)',
          950: 'rgb(var(--color-navy-950) / <alpha-value>)',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'electric': '0 0 20px rgba(10, 132, 255, 0.3)',
        'electric-lg': '0 0 40px rgba(10, 132, 255, 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};