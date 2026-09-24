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
          DEFAULT: '#F8FAFC', // clean modern slate-50
          deep: '#FFFFFF',    // crisp white surfaces/cards
          edge: '#E2E8F0',    // sleek slate-200 border
          dark: '#0F172A',
        },
        ink: {
          DEFAULT: '#0F172A',  // rich slate-900
          soft: '#334155',     // slate-700
          mute: '#64748B',     // slate-500
          faint: '#94A3B8',    // slate-400
        },
        seal: {
          DEFAULT: '#94191C', // Rich Crimson Maroon (FH Ubaya)
          deep: '#861619',    // Deep Crimson Red (Top bar)
          dark: '#6A2225',    // Wine Maroon (Pill Terbaru)
          wash: '#FFF5F5',    // Soft crimson wash
          tint: '#FDE8E9',    // Light crimson tint
        },
        maroon: {
          950: '#1E0507',
          900: '#2B0B06',
          850: '#3A0F08',
          800: '#4F130B',
          700: '#6A2225',
          600: '#861619',
          500: '#94191C',
          400: '#A81D21',
          100: '#FDE8E9',
          50: '#FFF5F5',
        },
        gold: {
          DEFAULT: '#C5A059',
          light: '#D4AF37',
          deep: '#9B7426',
          wash: '#FEF9E7',
        },
        sage: {
          DEFAULT: '#059669', // emerald-600
          wash: '#ECFDF5',    // emerald-50 soft tint
        },
        brass: {
          DEFAULT: '#C5A059', // gold amber
          wash: '#FFFBEB',    // amber-50 soft tint
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        sheet: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        lift: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
      letterSpacing: {
        caps: '0.08em',
      },
    },
  },
  plugins: [],
};
export default config;
