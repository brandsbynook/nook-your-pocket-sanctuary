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
          bg:      "#0A0A0B",
          surface: "#141416",
          divider: "#1F1F23",
          border:  "#222225",
          text:    "#E5E5E7",
          muted:   "#71717A",
          subtle:  "#52525B",
          accent:  "#E5E5E7",
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
