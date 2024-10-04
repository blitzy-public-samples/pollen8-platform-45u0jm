/** @type {import('tailwindcss').Config} */
module.exports = {
  // Define content paths for utility class scanning
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Extend theme with custom colors (black, white, light gray)
      colors: {
        'pollen8-black': '#000000',
        'pollen8-white': '#FFFFFF',
        'pollen8-light-gray': '#EFEFEF',
      },
      // Configure custom font family (Proxima Nova)
      fontFamily: {
        'proxima-nova': ['Proxima Nova', 'sans-serif'],
      },
      // Set up specific font sizes for different text elements
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
    },
  },
  plugins: [],
  // Utilize default Tailwind breakpoints for responsive design
  screens: {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px',
  },
}