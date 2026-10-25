/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1f4d3a',
          dark: '#173a2c'
        },
        lime: {
          DEFAULT: '#c5e85a',
          dark: '#b6db44'
        },
        cream: '#faf7f0',
        line: '#e4dfd3',
        mute: '#66706b'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif']
      },
      maxWidth: {
        page: '1200px'
      }
    }
  },
  plugins: []
};
