// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Esta línea es crucial: le dice a Tailwind que escanee todos los archivos
    // .js, .ts, .jsx, .tsx dentro de la carpeta 'src' y sus subcarpetas.
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Aquí puedes extender el tema por defecto de Tailwind (colores, fuentes, etc.)
    extend: {},
  },
  // Aquí puedes añadir plugins de Tailwind si los necesitas (ej. @tailwindcss/forms)
  plugins: [],
}