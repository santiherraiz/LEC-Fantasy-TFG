/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        midnight: '#0B0E14',
        surface: '#1A202C',
        'surface-light': '#2D3748',
        'accent-cyan': '#00D1FF',
        'neon-green': '#39FF14',
        'crimson': '#FF003F',
        'gold': '#FFD700',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
      }
    },
  },
  plugins: [],
}
