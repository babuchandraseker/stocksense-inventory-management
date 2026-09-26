/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkest: '#140A05',
          sidebar: '#1E110A',
          sidebarHover: '#2A180E',
          sidebarBorder: '#351F14',
          primary: '#2D1810',
          warm: '#4E2C1D',
          caramel: '#9A4C1C',
          caramelHover: '#823D14',
          caramelLight: '#FBEFE8',
          gold: '#D97706',
          goldLight: '#FEF3C7',
          cream: '#F7F2EC',
          creamDark: '#EFE6DC',
          offwhite: '#FDFBF9',
          border: '#E8DFD5',
          borderDark: '#D5C8B8',
          textDark: '#20140D',
          textMedium: '#5C4A3E',
          textMuted: '#8C7B70',
          textLight: '#B8ABA0',
        },
        status: {
          success: '#15803D',
          successBg: '#ECFDF5',
          successBorder: '#A7F3D0',
          warning: '#B45309',
          warningBg: '#FFFBEB',
          warningBorder: '#FDE68A',
          danger: '#B91C1C',
          dangerBg: '#FEF2F2',
          dangerBorder: '#FECACA',
          info: '#9A4C1C',
          infoBg: '#FBEFE8',
          infoBorder: '#F5D0B8',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 2px 0 rgba(43, 24, 16, 0.05)',
        'warm': '0 2px 8px -1px rgba(43, 24, 16, 0.08), 0 1px 3px -1px rgba(43, 24, 16, 0.04)',
        'warm-md': '0 4px 14px -2px rgba(43, 24, 16, 0.10), 0 2px 6px -2px rgba(43, 24, 16, 0.06)',
        'warm-lg': '0 10px 25px -3px rgba(43, 24, 16, 0.12), 0 4px 10px -2px rgba(43, 24, 16, 0.06)',
        'warm-glow': '0 0 20px rgba(154, 76, 28, 0.25)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
