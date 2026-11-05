/* Configuración Tailwind compilada fuera del navegador para evitar eval y unsafe-eval. */
module.exports = {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: { ink: '#291C0E', clay: '#6E473B', accent: '#A78D78', border: '#BEB5A9', sand: '#E1D4C2', cream: '#F4E6D2', success: '#4F7A4A', warning: '#C08A2B', error: '#A8402F' },
      fontFamily: { sans: ['Urbanist', 'ui-sans-serif', 'system-ui'] },
      boxShadow: { soft: '0 12px 32px rgba(41, 28, 14, .08)', lift: '0 18px 42px rgba(41, 28, 14, .13)' }
    }
  }
};
