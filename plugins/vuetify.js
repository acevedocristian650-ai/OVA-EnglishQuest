// PLUGIN DE VUETIFY (plugins/vuetify.js)
// Nuxt carga automáticamente todo lo que esté en plugins/.
// Si tu proyecto ya tiene este plugin, conserva el tuyo.

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import {
  VApp, VAvatar, VBtn, VBtnToggle, VCard,
  VCardActions, VCardText, VCardTitle, VCol, VContainer,
  VDialog, VImg, VList, VListItem, VListItemTitle,
  VMain, VProgressLinear, VRow, VSpacer
} from 'vuetify/components'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components: {
      VApp, VAvatar, VBtn, VBtnToggle, VCard,
      VCardActions, VCardText, VCardTitle, VCol, VContainer,
      VDialog, VImg, VList, VListItem, VListItemTitle,
      VMain, VProgressLinear, VRow, VSpacer
    },
    ssr: true,
    // Tema oscuro: todo el juego usa colores nocturnos
    theme: { defaultTheme: 'dark' }
  })

  nuxtApp.vueApp.use(vuetify)
})
