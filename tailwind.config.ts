import type { Config } from "tailwindcss";

const config: Config = {
  preflight: false,
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          main: "var(--primary-main)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
          contrastText: "var(--primary-contrastText)",
        },
        secondary: {
          main: "var(--secondary-main)",
          light: "var(--secondary-light)",
          dark: "var(--secondary-dark)",
          contrastText: "var(--secondary-contrastText)",
        },
        success: {
          main: "var(--success-main)",
          light: "var(--success-light)",
          dark: "var(--success-dark)",
          contrastText: "var(--success-contrastText)",
        },
        info: {
          main: "var(--info-main)",
          light: "var(--info-light)",
          dark: "var(--info-dark)",
          contrastText: "var(--info-contrastText)",
        },
        error: {
          main: "var(--error-main)",
          light: "var(--error-light)",
          dark: "var(--error-dark)",
          contrastText: "var(--error-contrastText)",
        },
        warning: {
          main: "var(--warning-main)",
          light: "var(--warning-light)",
          dark: "var(--warning-dark)",
          contrastText: "var(--warning-contrastText)",
        },
        purple: {
          A50: "var(--purple-A50)",
          A100: "var(--purple-A100)",
          A200: "var(--purple-A200)",
        },
        grey: {
          50: "var(--grey-50)",
          100: "var(--grey-100)",
          200: "var(--grey-200)",
          300: "var(--grey-300)",
          400: "var(--grey-400)",
          500: "var(--grey-500)",
          600: "var(--grey-600)",
          700: "var(--grey-700)",
          800: "var(--grey-800)",
          900: "var(--grey-900)",
          A100: "var(--grey-A100)",
          A200: "var(--grey-A200)",
          A400: "var(--grey-A400)",
          A700: "var(--grey-A700)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          disabled: "var(--text-disabled)",
        },
        action: {
          disabledBackground: "var(--action-disabledBackground)",
          hover: "var(--action-hover)",
          active: "var(--action-active)",
          selected: "var(--action-selected)",
          disabled: "var(--action-disabled)",
        },
        divider: "var(--divider)",
        common: {
          black: "var(--common-black)",
          white: "var(--common-white)",
        },
        background: {
          paper: "var(--background-paper)",
          default: "var(--background-default)",
        },
      },
    },
  },

  plugins: [],
};
export default config;
