import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A192F",
        secondary: "#00F2FF",
        tertiary: "#FF8A00",
        neutral: "#FFFFFF",
        dark: "#1A202C",
        "dark-accent": "#2D3748"
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Geist", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
