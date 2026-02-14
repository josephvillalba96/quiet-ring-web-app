
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sora: ["Sora", "sans-serif"],
      },
      colors: {
        "brand-orange": "#EA592D",
        "brand-coral": "#FF6B4A",
        "brand-blue": "#334295",
        "brand-red-start": "#EF4444",
        "brand-red-end": "#DC2626",
      },
      borderRadius: {
        "2xl": "16px",
      },
      boxShadow: {
        glow: "0 0 20px 4px rgba(234, 89, 45, 0.25), 0 0 40px 8px rgba(51, 66, 149, 0.15)",
        "glow-pulse":
          "0 0 24px 6px rgba(234, 89, 45, 0.3), 0 0 48px 12px rgba(51, 66, 149, 0.2)",
        card: "0 4px 24px -4px rgba(0,0,0,0.08), 0 8px 48px -8px rgba(234, 89, 45, 0.1)",
      },
    },
  },
  plugins: [],
};
