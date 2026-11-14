// CONFIGURACIÓN DE NUXT (nuxt.config.js)
export default defineNuxtConfig({
  // Fecha de compatibilidad de Nuxt (déjala así)
  compatibilityDate: '2025-01-01',

  // Las carpetas pages/, components/, layouts/ están en la raíz del proyecto
  // (si usas la carpeta app/ de Nuxt 4, borra esta línea)
  srcDir: '.',

  devtools: { enabled: false },

  // Reglas globales para móvil y táctil (barra de scroll, toques, zona segura)
  css: ['~/assets/css/responsive.css'],

  app: {
    head: {
      // viewport-fit=cover permite usar env(safe-area-inset-*) en celulares con notch
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'theme-color', content: '#0b1325' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ]
    }
  },

  // Vuetify necesita ser "transpilado" por Nuxt
  build: {
    transpile: ['vuetify']
  },

  // En desarrollo, Vite empaqueta Vuetify en un solo archivo en vez de servir
  // cientos de módulos sueltos (la primera carga en el celular es mucho más rápida)
  vite: {
    optimizeDeps: {
      include: ['vuetify', 'vuetify/components', 'vuetify/directives']
    }
  }
})
