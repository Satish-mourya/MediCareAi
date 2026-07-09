/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12211F',
        surface: '#F6F9F8',
        card: '#FFFFFF',
        border: '#E1E9E6',
        teal: {
          50: '#EAF5F2',
          100: '#CFE9E2',
          300: '#7CC1B2',
          500: '#3FA796',
          600: '#237A6C',
          700: '#146356',
          800: '#0F4B41',
          900: '#0A3931',
        },
        coral: {
          50: '#FDECE9',
          100: '#F9CFC7',
          400: '#EF7B67',
          500: '#E8543E',
          600: '#C43F2B',
        },
        amber: {
          400: '#E7A93B',
          500: '#D9922A',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 10px rgba(18, 33, 31, 0.06)',
        card: '0 4px 24px rgba(18, 33, 31, 0.08)',
        lift: '0 12px 32px rgba(18, 33, 31, 0.14)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        pulseLine: {
          '0%': { strokeDashoffset: '240' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseLine: 'pulseLine 1.8s ease-out forwards',
        fadeUp: 'fadeUp 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};
