/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        tahoma: ['Tahoma', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      colors: {
        datev: {
          gray: '#F0F0F0',
          border: '#A0A0A0',
          green: '#B5E6A2',
          greenDark: '#4A9B3A',
          yellow: '#FFFFCC',
          blue: '#003399',
          headerBg: '#E8E8E8',
          activeBg: '#C8E8FF',
          treeSelected: '#FFFF99',
        }
      }
    },
  },
  plugins: [],
}
