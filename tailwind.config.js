/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sanctuary: {
          bg:      "#0E0E0E",
          surface: "#141414",
          divider: "#222222",
          text:    "#E5E0D8",
          muted:   "#71717A",
          accent:  "#C9B99A",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"EB Garamond"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        sanctuary: "420px",
      },
    },
  },
  plugins: [],
}
