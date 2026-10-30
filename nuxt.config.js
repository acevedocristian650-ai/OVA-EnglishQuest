// CONFIGURACIÓN DE NUXT (nuxt.config.js)
export default defineNuxtConfig({
  // Fecha de compatibilidad de Nuxt (déjala así)
  compatibilityDate: '2025-01-01',

  // Las carpetas pages/, components/, layouts/ están en la raíz del proyecto
  // (si usas la carpeta app/ de Nuxt 4, borra esta línea)
  srcDir: '.',

  // CSS global (muy pequeño)
  css: ['~/assets/css/main.css'],

  // Vuetify necesita ser "transpilado" por Nuxt
  build: {
    transpile: ['vuetify']
  }
})
