/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FDF8FA',
          100: '#F5E6EC',
          500: '#9C5573',
          600: '#71364B',
          700: '#5E293D',
          800: '#4B2031',
          DEFAULT: '#71364B'
        },
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        ink: { DEFAULT: '#0F172A', soft: '#64748B' },
        success: { DEFAULT: '#16A34A', soft: '#DCFCE7' },
        warning: { DEFAULT: '#D97706', soft: '#FEF3C7' },
        danger: { DEFAULT: '#DC2626', soft: '#FEE2E2' },
        info: { DEFAULT: '#2563EB', soft: '#DBEAFE' }
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px'
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15,23,42,0.05)',
        sm: '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
        md: '0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.05)',
        lg: '0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.05)',
        floating: '0 12px 32px rgba(113,54,75,0.12)'
      }
    }
  },
  plugins: []
};
