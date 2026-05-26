import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        surface: "#12121A",
        card: "#1A1A26",
        border: "#2A2A3A",
        primary: {
          DEFAULT: "#6C63FF",
          hover: "#5A52E0",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#00D4AA",
          hover: "#00B894",
          foreground: "#0A0A0F",
        },
        danger: {
          DEFAULT: "#FF4757",
          hover: "#E0394A",
        },
        text: {
          primary: "#F0F0FF",
          muted: "#8B8BA8",
        },
        // shadcn compat
        foreground: "#F0F0FF",
        "muted-foreground": "#8B8BA8",
        accent: "#6C63FF",
        "accent-foreground": "#FFFFFF",
        destructive: "#FF4757",
        "destructive-foreground": "#FFFFFF",
        input: "#2A2A3A",
        ring: "#6C63FF",
        popover: "#1A1A26",
        "popover-foreground": "#F0F0FF",
        muted: "#12121A",
muted_foreground: "#8B8BA8",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        DEFAULT: "8px",
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary":
          "linear-gradient(135deg, #6C63FF 0%, #00D4AA 100%)",
        "gradient-dark":
          "linear-gradient(180deg, #0A0A0F 0%, #12121A 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        glow: "0 0 20px rgba(108, 99, 255, 0.3)",
        "glow-teal": "0 0 20px rgba(0, 212, 170, 0.3)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
