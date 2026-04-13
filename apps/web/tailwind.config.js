/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'sans-serif'],
      },
      colors: {
        bg: '#0d0818',
        surface: '#180e2a',
        border: '#2a1850',
        // Warm primary palette
        'orange': '#F97316',
        'orange-dark': '#C2410C',
        'yellow': '#FFD23F',
        'yellow-dark': '#D97706',
        'coral': '#FF6B6B',
        // Status
        'hot-coral': '#FF6B6B',
        'lime-green': '#84CC16',
        // Player accent colours (kept for player chips)
        'electric-purple': '#8B5CF6',
        'neon-teal': '#0DD3C5',
        'golden-yellow': '#F59E0B',
        'sky-blue': '#38BDF8',
        'flamingo-pink': '#EC4899',
        'warm-orange': '#F97316',
        // Phone warm background
        'phone-bg': '#FFF5E0',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-soft': 'bounce 1s ease-in-out infinite',
      },
      keyframes: {
        particleBurst: {
          '0%':   { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1.5) rotate(360deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
