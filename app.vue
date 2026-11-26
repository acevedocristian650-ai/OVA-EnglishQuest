<template>
  <v-app :data-graphics="quality">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <component :is="PanelDiagnostico" v-if="PanelDiagnostico" />
  </v-app>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
const { language } = useLanguage()
const { quality, loadPreferences } = useGameGraphics()
const store = usePlayerProgress()
// El panel de diagnóstico solo existe en desarrollo: en producción este módulo no se incluye.
const PanelDiagnostico = import.meta.dev && import.meta.client ? defineAsyncComponent(() => import('~/components/dev/DevDiagnostico.vue')) : null

onMounted(() => {
  loadPreferences()
  const html = document.documentElement
  // Los ajustes de accesibilidad se reflejan en atributos del documento: no dependen del perfil gráfico.
  watchEffect(() => {
    const a = store.estado.ajustes
    html.style.setProperty('--eq-texto', String(a.textoEscala))
    html.dataset.contraste = a.altoContraste ? 'alto' : 'normal'
    html.dataset.movimiento = a.movimiento
    html.dataset.destellos = a.sinDestellos ? 'no' : 'si'
    html.dataset.camara = a.sinCamara ? 'no' : 'si'
  })
})

useHead({
  htmlAttrs: { lang: computed(() => language.value) }
})
</script>
