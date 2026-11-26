import { configurarBaseAudio } from '../composables/useAudioMixer.js'

export default defineNuxtPlugin(() => {
  configurarBaseAudio(useRuntimeConfig().app.baseURL)
})
