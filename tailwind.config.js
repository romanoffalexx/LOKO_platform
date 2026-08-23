/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Основные токены дизайн-системы ЯОКО
        loko: {
          // Фоны
          bg: {
            base: '#0A0414',     // основной фон
            surface: '#120820',  // поверхность карточек
            elevated: '#1A0E2E', // приподнятые элементы
            border: '#2A1A45',   // границы
          },
          // Акценты
          pink: '#FF2D6A',       // основной акцент (красный)
          magenta: '#E91E63',     // акцент-2
          violet: '#7C3AED',      // фиолетовый
          purple: '#A855F7',      // пурпурный
          cyan: '#22D3EE',        // инфо
          success: '#10B981',     // успех
          warn: '#F59E0B',        // предупреждение
          danger: '#EF4444',      // ошибка
          // Текст
          text: {
            primary: '#F5F0FF',
            secondary: '#A89BC4',
            muted: '#6B5E85',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bebas Neue"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(255, 45, 106, 0.35)',
        'glow-soft': '0 0 24px rgba(168, 85, 247, 0.25)',
        'glow-strong': '0 0 60px rgba(255, 45, 106, 0.5)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FF2D6A 0%, #A855F7 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, rgba(255, 45, 106, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        'gradient-radial': 'radial-gradient(ellipse at top, rgba(124, 58, 237, 0.2), transparent 60%)',
        'gradient-mesh': 'radial-gradient(at 20% 20%, rgba(255, 45, 106, 0.18) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(124, 58, 237, 0.18) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(168, 85, 247, 0.15) 0px, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 45, 106, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 45, 106, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
