// PLUGIN DE VUETIFY (plugins/vuetify.js)
// Nuxt carga automáticamente todo lo que esté en plugins/.
// Si tu proyecto ya tiene este plugin, conserva el tuyo.

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    ssr: true,
    // Tema oscuro: todo el juego usa colores nocturnos
    theme: { defaultTheme: 'dark' }
  })

  nuxtApp.vueApp.use(vuetify)
})
