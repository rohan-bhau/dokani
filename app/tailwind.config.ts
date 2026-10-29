import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-subtle': '#F1F5F9',
        border: '#E2E8F0',
        'border-strong': '#94A3B8',
        brand: {
          DEFAULT: '#047857',
          hover: '#065F46',
          light: '#ECFDF5',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        bangla: ['var(--font-bangla)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
