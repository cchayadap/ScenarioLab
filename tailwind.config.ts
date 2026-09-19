import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12141a",
        panel: "#1b1e27",
        accent: "#7dd3fc",
        good: "#4ade80",
        bad: "#f87171",
      },
    },
  },
  plugins: [],
};
export default config;
