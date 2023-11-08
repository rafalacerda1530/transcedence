/** @type {import('tailwindcss').Config} */
module.exports = {content: ["./src/**/*.{html,ts,jsx,tsx}"],
  theme: {
    extend: {
       backgroundColor: {
        'blueviolet': 'blueviolet',
      },
      colors: {
        'roxo-personalizado': '#723CEE',
      },
      spacing: {
        '10': '15rem', // Adicionando um espaçamento personalizado
      },
    },
  },
  plugins: [],
}
