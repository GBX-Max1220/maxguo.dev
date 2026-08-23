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
        shell: '1160px',
        content: '1000px',
        narrow: '720px',
      },
      spacing: {
        section: '6rem',
        'section-sm': '3.5rem',
      },
      borderRadius: {
        sm: '3px',
        md: '6px',
        lg: '10px',
        xl: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,59,86,0.06), 0 1px 3px rgba(24,59,86,0.05)',
        'card-hover': '0 4px 14px rgba(24,59,86,0.10), 0 2px 4px rgba(24,59,86,0.06)',
        elevated: '0 8px 28px rgba(24,59,86,0.12)',
        subtle: '0 1px 2px rgba(24,59,86,0.05)',
      },
    },
  },
  plugins: [],
};
