import type { Config } from 'tailwindcss';

/**
 * Bahasa desain LexVera: "arsip negara / penerbitan hukum".
 * Kertas hangat, tinta navy, aksen merah stempel (segel dokumen resmi),
 * brass untuk penanda arsip. Tanpa gradien, tanpa kartu SaaS generik.
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF6EE', // kertas hangat
          deep: '#F2ECDF',    // kertas tua (panel)
          edge: '#E7DFCE',    // garis kertas
        },
        ink: {
          DEFAULT: '#1C2434',  // tinta dokumen
          soft: '#3B4557',
          mute: '#68707F',
          faint: '#98A0AD',
        },
        seal: {
          DEFAULT: '#A63A2B', // merah stempel
          deep: '#7E2A1F',
          wash: '#F6E8E4',    // latar merah pudar
        },
        sage: {
          DEFAULT: '#3E5C4B', // hijau arsip (status berlaku/baru)
          wash: '#E7EDE7',
        },
        brass: {
          DEFAULT: '#8A6D3B', // kuningan arsip (status diubah)
          wash: '#F1EADA',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        serif: ['Newsreader', 'Georgia', 'Times New Roman', 'serif'],
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto',
          'Helvetica Neue', 'Arial', 'sans-serif',
        ],
        mono: ['IBM Plex Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        sheet: '0 1px 0 rgba(28,36,52,0.05), 0 8px 24px -18px rgba(28,36,52,0.25)',
        lift: '0 2px 0 rgba(28,36,52,0.06), 0 16px 32px -20px rgba(28,36,52,0.35)',
      },
      letterSpacing: {
        caps: '0.14em',
      },
    },
  },
  plugins: [],
};
export default config;
