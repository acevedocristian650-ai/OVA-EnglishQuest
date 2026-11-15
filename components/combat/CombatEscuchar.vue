<template>
  <div class="escuchar">
    <h2>{{ pregunta.texto }}</h2>
    <p v-if="pregunta.contexto" class="contexto">{{ pregunta.contexto }}</p>

    <div v-if="hayVoz" class="voz">
      <AudioSonidoBoton @click="hablar(false)">
        <v-btn type="button" variant="tonal" color="amber-lighten-3">🔊 {{ t('Escuchar otra vez') }}</v-btn>
      </AudioSonidoBoton>
      <AudioSonidoBoton @click="hablar(true)">
        <v-btn type="button" variant="outlined" color="amber-lighten-3">🐢 {{ t('Despacio') }}</v-btn>
      </AudioSonidoBoton>
    </div>
    <p v-else class="sin-voz" lang="en">
      {{ t('Tu navegador no tiene voz. Lee la frase:') }} <strong>{{ pregunta.audio }}</strong>
    </p>

    <div class="opciones" role="group" :aria-label="t('Opciones')" lang="en">
      <AudioSonidoBoton v-for="opcion in pregunta.opciones" :key="opcion" @click="elegir(opcion)">
        <v-btn block type="button" variant="outlined" color="amber-lighten-3" :disabled="elegida !== ''">{{ opcion }}</v-btn>
      </AudioSonidoBoton>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const { t } = useLanguage()
// Datos: { audio: 'frase que se pronuncia', opciones: [...], correcta: '...' }
const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['responder'])
const hayVoz = ref(true)
const elegida = ref('')
const audioEnPrimerPlano = useState('audio-en-primer-plano', () => false)
let vozActiva = null

function hablar(lento = false) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const voz = new SpeechSynthesisUtterance(props.pregunta.audio)
  vozActiva = voz
  audioEnPrimerPlano.value = true
  window.speechSynthesis.cancel()
  voz.lang = 'en-US'
  voz.rate = lento ? 0.55 : 0.85
  const ingles = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('en'))
  if (ingles) voz.voice = ingles
  const liberarAudio = () => {
    if (vozActiva !== voz) return
    vozActiva = null
    audioEnPrimerPlano.value = false
  }
  voz.onend = liberarAudio
  voz.onerror = liberarAudio
  window.speechSynthesis.speak(voz)
}

function elegir(opcion) {
  if (elegida.value) return
  elegida.value = opcion
  emit('responder', opcion)
}

onMounted(() => {
  hayVoz.value = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
  if (hayVoz.value) hablar()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  vozActiva = null
  audioEnPrimerPlano.value = false
})
</script>

<style scoped>
h2 { margin: 0.2rem 0 0.4rem; color: #fff0cc; font: 600 clamp(1rem, 2.5vw, 1.3rem) Georgia, serif; }
.contexto { color: #e3d4bd; }
.sin-voz { padding: 0.5rem; border: 1px dashed #b3955c80; border-radius: 6px; color: #fff0cc; }
.voz { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.opciones { display: grid; gap: 0.4rem; margin-top: 0.5rem; }
</style>
