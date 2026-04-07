/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f9fafb',
        surface: '#ffffff',
        surface2: '#f9fafb',
        border: '#e5e7eb',
        text: '#2C3333',
        muted: '#6b7280',
        primary: '#4B5EAA',
        secondary: '#EAD8C0',
        favorite: '#6b7280',
      },
      fontFamily: {
        'primary' : ["Montserrat", "sans-serif"],
        'secondary' : ["Nunito Sans", "sans-serif"]
      }
    },
  },
  plugins: [],
}

