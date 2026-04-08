import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tuned to the Hillsdale jersey: deep forest green with golden mustard
        // pinstripes/trim. Source: IMG_1946.jpeg (sample-eyed and adjusted).
        team: {
          green: {
            DEFAULT: "#1d5a36", // body of jersey
            dark: "#0f3a21",   // shadowed seams
            light: "#2f7a4c",  // hover/active accents
          },
          gold: {
            DEFAULT: "#e8a922", // pinstripes / collar trim
            dark: "#b78114",
            light: "#f2c757",
          },
          // Legacy alias kept so existing class names keep working — `yellow`
          // points to the same gold scale.
          yellow: {
            DEFAULT: "#e8a922",
            dark: "#b78114",
            light: "#f2c757",
          },
          cream: "#fbf7e8", // soft off-white background, slightly warmer
        },
      },
      fontFamily: {
        // Aldrich is loaded via next/font/google and injected as --font-aldrich.
        // The system stack is kept as a fallback during the brief build-time
        // period before the font CSS variable is available.
        sans: [
          "var(--font-aldrich)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 61, 39, 0.08), 0 1px 2px rgba(15, 61, 39, 0.04)",
        "card-lg": "0 10px 30px -10px rgba(15, 61, 39, 0.25)",
      },
      animation: {
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232, 169, 34, 0.55)" },
          "50%": { boxShadow: "0 0 0 10px rgba(232, 169, 34, 0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
