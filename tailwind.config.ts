import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "sm": "375px",
        "md": "414px",
        "lg": "428px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: "hsl(var(--background))",
          subtle: "hsl(var(--background-subtle))",
          card: "hsl(var(--background-card))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          muted: "hsl(var(--foreground-muted))",
          subtle: "hsl(var(--foreground-subtle))",
        },
        accent: {
          green: "hsl(var(--accent-green))",
          "green-muted": "hsl(var(--accent-green-muted))",
          red: "hsl(var(--accent-red))",
          "red-muted": "hsl(var(--accent-red-muted))",
        },
        border: {
          DEFAULT: "hsl(var(--border-subtle))",
          focus: "hsl(var(--border-focus))",
          accent: "hsl(var(--border-accent))",
        },
        input: {
          DEFAULT: "hsl(var(--input-bg))",
          border: "hsl(var(--input-border))",
          focus: "hsl(var(--input-focus))",
        },
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        medium: "var(--shadow-medium)",
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
        slow: "var(--transition-slow)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
