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
        rosebrand: {
          50: "#fff1f4",
          100: "#ffe4ea",
          500: "#f43f6b",
          600: "#e11d4f",
          700: "#be123f"
        },
        softgray: "#f5f6f8",
        ink: "#27272a"
      },
      boxShadow: {
        soft: "0 18px 70px rgba(39, 39, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
