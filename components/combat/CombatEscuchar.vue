<template>
  <div class="escuchar">
    <header class="cabecera">
      <div>
        <h2 lang="en">{{ pregunta.texto }}</h2>
        <p v-if="pregunta.contexto" class="contexto">{{ pregunta.contexto }}</p>
      </div>

      <div v-if="hayVoz" class="voz">
        <AudioSonidoBoton @click="hablar(false)">
          <v-btn type="button" variant="tonal" color="amber-lighten-3">🔊 {{ t('Escuchar otra vez') }}</v-btn>
        </AudioSonidoBoton>
        <AudioSonidoBoton @click="hablar(true)">
          <v-btn type="button" variant="outlined" color="amber-lighten-3">🐢 {{ t('Despacio') }}</v-btn>
        </AudioSonidoBoton>
      </div>
      <p v-else class="sin-voz">
        {{ t('Tu navegador no tiene voz. Lee la frase:') }} <strong lang="en">{{ pregunta.audio }}</strong>
      </p>
    </header>

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
.escuchar {
  position: absolute;
  z-index: 10;
  inset: 0 0 auto;
  width: min(100%, 960px);
  margin-inline: auto;
  padding: clamp(5px, 1vw, 12px);
  display: grid;
  gap: 5px;
}
.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #101824ef;
  color: #fff0cc;
}
h2 { margin: 0; font: 600 clamp(1rem, 2vw, 1.25rem)/1.15 Georgia, serif; }
p { margin: 0; line-height: 1.2; }
.contexto, .sin-voz { font-size: .875rem; }
.voz { display: flex; flex-wrap: wrap; gap: 4px; }
.opciones { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
.escuchar :deep(.v-btn) {
  height: auto;
  min-height: 36px;
  min-width: 0;
  padding: 5px 8px;
  letter-spacing: normal;
  text-transform: none;
}
.opciones :deep(.v-btn) { min-height: 44px; background: #172030f5; }
.escuchar :deep(.v-btn__content) { display: block; white-space: normal; line-height: 1.2; }
@media (orientation: portrait) and (max-width: 600px) {
  .opciones { grid-template-columns: minmax(0, 1fr); }
}
</style>
