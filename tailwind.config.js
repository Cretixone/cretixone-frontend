/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1a2e',
        'sidebar-hover': '#16213e',
        'sidebar-active': '#0f3460',
        accent: '#4ade80',
        pro: '#818cf8',
        // Brand palette (Cretixone landing)
        brand: {
          gold: '#C08C40',
          'gold-dark': '#A6772E',
          navy: '#002365',
          'navy-dark': '#001A4D',
          ink: '#0A1F4D',
        },
        background: '#ffffff',
        foreground: '#111111',
      },
      fontFamily: {
        // All text uses self-hosted Helvetica Neue (see src/index.css @font-face).
        // Both `font-sans` and `font-display` resolve to the same stack so any
        // existing className that used the display font now also renders in
        // Helvetica Neue.
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
        display: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
        dm: ['"DM Sans"', 'system-ui', 'sans-serif'],
        jasmine: ['"JasmineUPC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
