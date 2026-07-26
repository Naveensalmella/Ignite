import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ignite: {
          bg: "#07090d",
          surface: "#0d1117",
          card: "#111827",
          primary: "var(--accent, #10b981)",
          accent: "#06b6d4",
          text: "#f3f4f6",
          muted: "#6b7280",
          dim: "#4b5563",
        },
      },
      fontFamily: {
        heading: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "dot-pulse": "dotPulse 1.2s infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        dotPulse: { "0%,100%": { opacity: "0.3", transform: "scale(0.8)" }, "50%": { opacity: "1", transform: "scale(1.2)" } },
      },
    },
  },
  plugins: [],
};
export default config;
