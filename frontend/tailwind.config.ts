import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./stores/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#101820",
        line: "#263541",
        cyanline: "#25d0c8",
        amberline: "#f5b942",
        danger: "#ff5d5d",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "Consolas", "monospace"],
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
