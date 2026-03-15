/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#0f1b2a',
        accent: '#d4b04f',
        surface: {
          900: '#0a151e',
          800: '#0f1b2a',
          700: '#172936',
          600: '#1f3440',
        },
        border: {
          900: '#11202b',
          800: '#1e2d3a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

