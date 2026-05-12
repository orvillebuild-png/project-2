import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        muted: "#667085",
        line: "#d8dde3",
        field: "#f8faf9",
        moss: "#39705f",
        leaf: "#6f9f77",
        coral: "#df705f",
        amber: "#c88a32"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
