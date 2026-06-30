/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Color principal de la marca (azul Google del manifest)
        marca: '#4285f4',
      },
    },
  },
  plugins: [],
};
