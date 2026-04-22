/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#D4AF37',
          light:  '#FFD700',
          dark:   '#B8860B',
          muted:  '#9A7D2E',
        },
        obsidian: {
          DEFAULT: '#0A0A0A',
          50:  '#1A1A1A',
          100: '#141414',
          200: '#111111',
          300: '#0D0D0D',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #B8860B 100%)',
        'gold-radial': 'radial-gradient(ellipse at center, #D4AF37 0%, #B8860B 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #111111 100%)',
      },
      boxShadow: {
        'gold-sm': '0 0 8px rgba(212, 175, 55, 0.3)',
        'gold-md': '0 0 20px rgba(212, 175, 55, 0.4)',
        'gold-lg': '0 0 40px rgba(212, 175, 55, 0.5)',
        'gold-xl': '0 0 60px rgba(212, 175, 55, 0.6)',
        'inner-gold': 'inset 0 0 20px rgba(212, 175, 55, 0.15)',
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-in': 'glowIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'spin-slow': 'spin 8s linear infinite',
        'orb-1': 'orb1 12s ease-in-out infinite',
        'orb-2': 'orb2 15s ease-in-out infinite',
        'orb-3': 'orb3 10s ease-in-out infinite',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,175,55,0.4)' },
          '50%': { boxShadow: '0 0 50px rgba(212,175,55,0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowIn: {
          from: { opacity: 0, transform: 'scale(0.9)', filter: 'blur(10px)' },
          to: { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        orb1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(60px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.95)' },
        },
        orb2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-50px, 60px) scale(1.05)' },
          '66%': { transform: 'translate(40px, -20px) scale(0.9)' },
        },
        orb3: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(30px, 40px) scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
};
