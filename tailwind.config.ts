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
        ink: "#181713",
        muted: "#716f66",
        line: "#dfdccf",
        field: "#f7f4eb",
        moss: "#1f6b5d",
        leaf: "#11c986",
        coral: "#e35d45",
        amber: "#ffca3a",
        night: "#161616",
        butter: "#ffe07a",
        skywash: "#eaf4f5"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(24, 23, 19, 0.08)",
        lift: "0 24px 80px rgba(24, 23, 19, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
