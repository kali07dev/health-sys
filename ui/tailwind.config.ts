import type { Config } from "tailwindcss";
import { theme as appTheme } from "./app/styles/themes";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: appTheme.colors.primary,
        gray: appTheme.colors.gray,
        notification: appTheme.colors.notification,
      },
      borderRadius: appTheme.borderRadius,
      boxShadow: {
        sm: appTheme.shadows.sm,
        md: appTheme.shadows.md,
        lg: appTheme.shadows.lg,
      },
      fontFamily: {
        sans: [appTheme.typography.fontFamily],
      },
      fontSize: appTheme.typography.fontSize,
      // fontWeight: appTheme.typography.fontWeights,
      transitionDuration: {
        fast: appTheme.animation.fast,
        normal: appTheme.animation.normal,
        slow: appTheme.animation.slow,
      },
    },
  },
  plugins: [],
} satisfies Config;