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
          primary: '#3D291A',
          darkest: '#26190F',
          sidebar: '#26190F',
          sidebarHover: '#332215',
          sidebarBorder: '#3D291A',
          secondary: '#4E3C2F',
          warm: '#4E3C2F',
          accent: '#895A38',
          caramel: '#895A38',
          caramelHover: '#744A2D',
          caramelLight: '#F0ECE8',
          gold: '#B8865B',
          goldLight: '#F5EBE1',
          cream: '#F0ECE8',
          creamDark: '#E2DDD7',
          beige: '#E2DDD7',
          background: '#F8F5F2',
          offwhite: '#F8F5F2',
          card: '#F0ECE8',
          border: '#D5CCC5',
          borderDark: '#C2B6AC',
          textDark: '#30241F',
          text: '#30241F',
          textMedium: '#4E3C2F',
          textMuted: '#7F7065',
          textLight: '#A3968C',
        },
        status: {
          success: '#6B8E62',
          successBg: '#F1F6F0',
          successBorder: '#C8DAC4',
          warning: '#B8865B',
          warningBg: '#FAF5EE',
          warningBorder: '#E8D5C2',
          danger: '#A65D4D',
          dangerBg: '#FDF2F0',
          dangerBorder: '#E6BFB8',
          info: '#895A38',
          infoBg: '#F0ECE8',
          infoBorder: '#D5CCC5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 2px 0 rgba(61, 41, 26, 0.04)',
        'warm': '0 2px 8px -1px rgba(61, 41, 26, 0.06), 0 1px 3px -1px rgba(61, 41, 26, 0.03)',
        'warm-md': '0 4px 14px -2px rgba(61, 41, 26, 0.08), 0 2px 6px -2px rgba(61, 41, 26, 0.04)',
        'warm-lg': '0 10px 25px -3px rgba(61, 41, 26, 0.10), 0 4px 10px -2px rgba(61, 41, 26, 0.04)',
        'warm-glow': '0 0 20px rgba(137, 90, 56, 0.18)',
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
