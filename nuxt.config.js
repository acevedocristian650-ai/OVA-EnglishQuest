// CONFIGURACIÓN DE NUXT (nuxt.config.js)
export default defineNuxtConfig({
  // Fecha de compatibilidad de Nuxt (déjala así)
  compatibilityDate: '2025-01-01',

  // Las carpetas pages/, components/, layouts/ están en la raíz del proyecto
  // (si usas la carpeta app/ de Nuxt 4, borra esta línea)
  srcDir: '.',

  devtools: { enabled: false },

  // Despliegue estático: «npm run build» (nuxt generate) deja el sitio listo en dist/
  nitro: { output: { publicDir: 'dist' } },

  // Reglas globales para móvil y táctil (barra de scroll, toques, zona segura)
  css: ['~/assets/css/fuentes.css', '~/assets/css/responsive.css'],

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

  // Las escenas de combate (Alta y Lite) se descargan solo cuando se usan: Nuxt no debe precargarlas ni prefetchearlas
  // (así un celular con Lite nunca descarga el JS/CSS exclusivo de Alta). La transición de encuentro calienta la correcta.
  hooks: {
    'build:manifest': (manifest) => {
      for (const clave of Object.keys(manifest)) {
        if (/combat\/CombatEscena(Lite)?\.vue|combat\/CombatEfectos(Lite)?\.vue/.test(manifest[clave].src ?? clave)) {
          manifest[clave].prefetch = false
          manifest[clave].preload = false
        }
      }
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
