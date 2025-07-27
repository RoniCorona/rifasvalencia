// postcss.config.js
export default {
  plugins: {
    // Este plugin es la conexión entre PostCSS y Tailwind CSS.
    // Necesita que hayas instalado el paquete '@tailwindcss/postcss'.
    '@tailwindcss/postcss': {},
    // Autoprefixer añade prefijos de navegador a tu CSS para asegurar compatibilidad.
    autoprefixer: {},
  },
}