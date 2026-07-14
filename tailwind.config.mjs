/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Cascadia Code', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '1040px',
        narrow: '680px',
      },
      spacing: {
        section: '6rem',
        'section-sm': '3.5rem',
      },
      borderRadius: {
        sm: '3px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(44,40,34,0.06), 0 1px 2px rgba(44,40,34,0.04)',
        'card-hover': '0 4px 16px rgba(44,40,34,0.08), 0 2px 4px rgba(44,40,34,0.04)',
        elevated: '0 8px 30px rgba(44,40,34,0.08)',
        subtle: '0 1px 2px rgba(44,40,34,0.04)',
      },
    },
  },
  plugins: [],
};
