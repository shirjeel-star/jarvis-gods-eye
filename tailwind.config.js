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
        'void': '#080a0f',
        'surface': '#0d0f1a',
        'panel': '#111320',
        'border': '#1a1e30',
        'border-bright': '#252a40',
        'cyan': {
          DEFAULT: '#00d4ff',
          dim: '#0090b0',
          glow: 'rgba(0,212,255,0.15)',
        },
        'amber': {
          DEFAULT: '#f59e0b',
          dim: '#b07208',
        },
        'emerald': {
          DEFAULT: '#10b981',
          dim: '#0a7d57',
        },
        'crimson': {
          DEFAULT: '#ef4444',
          dim: '#991b1b',
        },
        'text': {
          primary: '#e2e8f0',
          secondary: '#64748b',
          muted: '#374151',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(26,30,48,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(26,30,48,0.5) 1px, transparent 1px)",
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0,212,255,0.05) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-cyan': 'pulse-cyan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-cyan': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      },
      boxShadow: {
        'cyan-sm': '0 0 10px rgba(0,212,255,0.2)',
        'cyan-md': '0 0 20px rgba(0,212,255,0.3)',
        'cyan-lg': '0 0 40px rgba(0,212,255,0.4)',
        'panel': '0 4px 24px rgba(0,0,0,0.5)',
      }
    },
  },
  plugins: [],
}
