import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "work order" palette — off-white paper, near-black ink, one decisive
        // accent (desaturated navy, like stamped approval ink). Deliberately
        // not the purple/cyan-on-dark AI default.
        paper: "#f2f1ec",
        paperLine: "#dcd9cd",
        ink: "#1c1b17",
        inkFaint: "#6b6a60",
        stamp: "#2c4a63", // primary accent — used sparingly, not glowing
        good: "#3f6b3f",
        bad: "#8c3a2b",
      },
      fontFamily: {
        // Serif for scenario/headline copy, monospace for ticket metadata
        // (round counter, role tag). Neither is Inter/system-sans-everywhere.
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
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
