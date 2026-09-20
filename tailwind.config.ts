import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        xray: {
          50: '#f3f7ff',
          100: '#dfeaff',
          300: '#8fb6ff',
          500: '#3f75ff',
          700: '#1d4fd2',
          900: '#101b45'
        }
      }
    }
  },
  plugins: []
};

export default config;
