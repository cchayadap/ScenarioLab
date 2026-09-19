import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "workstation" palette — cool slate-gray desktop background, crisp
        // borders, one decisive technical-blue accent. Reads like an internal
        // engineering tool, not the purple/cyan-on-dark AI default.
        paper: "#e8ebef",
        panel: "#f8f9fb",
        paperLine: "#c3cad4",
        ink: "#161b22",
        inkFaint: "#5b6472",
        stamp: "#1d5fd6", // primary accent — used sparingly, not glowing
        good: "#1f8a4c",
        bad: "#c8382f",
      },
      fontFamily: {
        // Monospace everywhere — the whole point of the "workplace computer"
        // theme is that it reads like a terminal/IDE, not a marketing site.
        display: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
        md: "3px",
        lg: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
