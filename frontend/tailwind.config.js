/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0e17',
        surface: {
          DEFAULT: '#111827',
          card: '#0f172a',
          hover: '#1e293b',
          border: '#1e293b',
        },
        brand: {
          primary: '#2563eb',
          secondary: '#3b82f6',
          accent: '#60a5fa',
        },
        status: {
          available: '#10b981', // Green
          occupied: '#ef4444',  // Red
          reserved: '#f59e0b',  // Yellow / Orange
          info: '#3b82f6',      // Blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
