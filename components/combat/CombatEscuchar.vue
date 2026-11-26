<template>
  <div class="escuchar">
    <header class="cabecera">
      <div>
        <h2 lang="en">{{ pregunta.texto }}</h2>
        <p v-if="contextoVisible" class="contexto">{{ contextoVisible }}</p>
      </div>

      <div v-if="hayVoz" class="voz">
        <AudioSonidoBoton @click="hablar(false)">
          <v-btn type="button" class="cuerno" :class="{ sonando }" variant="tonal" color="amber-lighten-3">🔊 <span class="ondas" aria-hidden="true"><i /><i /><i /></span> {{ t('Escuchar otra vez') }}</v-btn>
        </AudioSonidoBoton>
        <AudioSonidoBoton @click="hablar(true)">
          <v-btn type="button" variant="outlined" color="amber-lighten-3">🐢 {{ t('Despacio') }}</v-btn>
        </AudioSonidoBoton>
        <AudioSonidoBoton @click="mostrarTranscripcion">
          <v-btn type="button" variant="text" color="amber-lighten-3" :aria-pressed="transcripcion" :disabled="transcripcion">📝 {{ t('Transcripción') }}</v-btn>
        </AudioSonidoBoton>
      </div>
      <p v-else class="sin-voz">{{ t('Sin voz en este navegador: lee la frase. Contará como lectura, no como escucha.') }}</p>
      <!-- Alternativa accesible: la transcripción es una ayuda. El acierto se registra como lectura con ayuda, no como comprensión auditiva. -->
      <p v-if="transcripcion" class="transcripcion" lang="en" role="note"><span aria-hidden="true">📝</span> <strong>{{ pregunta.audio }}</strong></p>
    </header>

    <div class="opciones" role="group" :aria-label="t('Opciones')" lang="en">
      <AudioSonidoBoton v-for="opcion in pregunta.opciones" :key="opcion" @click="elegir(opcion)">
        <v-btn block type="button" class="pergamino" variant="outlined" color="amber-lighten-3" :disabled="elegida !== ''"><span class="letra" aria-hidden="true">{{ 'ABC'[pregunta.opciones.indexOf(opcion)] }}</span>{{ opcion }}</v-btn>
      </AudioSonidoBoton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const { t } = useLanguage()
// Datos: { audio: 'frase que se pronuncia', opciones: [...], correcta: '...' }
const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['responder', 'ayuda'])
const hayVoz = ref(true)
const transcripcion = ref(false)
const contextoVisible = computed(() => contextoUtil(props.pregunta))
const elegida = ref('')
const sonando = ref(false)
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
  voz.onstart = () => { if (vozActiva === voz) sonando.value = true }
  const liberarAudio = () => {
    sonando.value = false
    if (vozActiva !== voz) return
    vozActiva = null
    audioEnPrimerPlano.value = false
  }
  voz.onend = liberarAudio
  voz.onerror = () => { if (vozActiva !== voz) return; liberarAudio(); hayVoz.value = false; mostrarTranscripcion() }
  try { window.speechSynthesis.speak(voz) } catch { liberarAudio(); hayVoz.value = false; mostrarTranscripcion() }
}

function mostrarTranscripcion() {
  transcripcion.value = true
  emit('ayuda', hayVoz.value ? 'transcripcion' : 'sin-voz')
}

function elegir(opcion) {
  if (elegida.value) return
  elegida.value = opcion
  emit('responder', opcion)
}

onMounted(() => {
  hayVoz.value = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
  if (hayVoz.value) hablar()
  else { transcripcion.value = true; emit('ayuda', 'sin-voz') }
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
.transcripcion { padding: 3px 8px; border-left: 3px solid #e6b96e; background: #1d2638f2; color: #fff0cc; font-size: .95rem; }
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

/* Cuerno de alerta: el jugador ESCUCHA el aviso (ondas animadas) y elige entre pergaminos con letra */
.cuerno.v-btn { border-radius: 999px; font-weight: 800; }
.ondas { display: inline-flex; align-items: flex-end; gap: 2px; height: 14px; margin-inline: 4px; }
.ondas i { width: 3px; height: 5px; border-radius: 2px; background: #ffe09a; }
.cuerno.sonando .ondas i { animation: onda 700ms ease-in-out infinite alternate; }
.cuerno.sonando .ondas i:nth-child(2) { animation-delay: 120ms; }
.cuerno.sonando .ondas i:nth-child(3) { animation-delay: 240ms; }
.cuerno.sonando { box-shadow: 0 0 14px #ffe09a88; }
@keyframes onda { to { height: 14px; } }
.pergamino.v-btn { border-color: #b68a48 !important; background: linear-gradient(#2a2418, #171d2b) !important; }
.pergamino :deep(.v-btn__content) { display: flex !important; align-items: center; gap: 8px; text-align: left; }
.letra { flex: none; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: #e6b96e; color: #1a1408; font: 800 0.75rem Georgia, serif; }
@media (prefers-reduced-motion: reduce) { .cuerno.sonando .ondas i { animation: none; height: 10px; } }
</style>
