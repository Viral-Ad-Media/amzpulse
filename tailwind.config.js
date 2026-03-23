/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.{js,ts,jsx,tsx}",
    "./App.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        amz: {
          dark: '#232f3e',
          light: '#37475a',
          accent: '#ff9900',
          blue: '#007185'
        },
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
};
