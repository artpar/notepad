// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4a7bab',
          50: '#f0f6fc',
          100: '#d8e8f7',
          200: '#b4d1ed',
          300: '#88b9e3',
          400: '#5c9cd6',
          500: '#4a7bab',
          600: '#3d6593',
          700: '#32507a',
          800: '#273c62',
          900: '#1c2d4a',
        },
        editor: {
          bg: {
            light: '#ffffff',
            dark: '#1e1e1e',
          },
          line: {
            light: '#f7f7f7',
            dark: '#252526',
          },
          text: {
            light: '#333333',
            dark: '#d4d4d4',
          },
          gutter: {
            light: '#eeeeee',
            dark: '#2d2d2d',
          }
        }
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      maxHeight: {
        '0': '0',
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
        'full': '100%',
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['active'],
      textColor: ['active'],
    },
  },
  plugins: [],
}
