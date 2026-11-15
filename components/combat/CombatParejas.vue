<template>
  <div class="parejas">
    <h2 lang="en">{{ pregunta.texto }}</h2>
    <p v-if="pregunta.contexto" class="contexto">{{ pregunta.contexto }}</p>
    <div class="columnas">
      <div class="columna" role="group" :aria-label="t('Izquierda')">
        <AudioSonidoBoton v-for="(pareja, i) in pregunta.parejas" :key="'i' + i" @click="tocarIzquierda(i)">
          <button type="button" class="carta" lang="en"
            :class="[{ elegida: izquierda === i, hecha: hechas.includes(i), error: fallo === 'i' + i }, hechas.includes(i) ? 'par-' + i : '']"
            :disabled="hechas.includes(i)">
            <img v-if="pareja.imagen" :src="pareja.imagen" :alt="pareja.alt || ''" />
            <span>{{ pareja.izq }}</span>
          </button>
        </AudioSonidoBoton>
      </div>
      <div class="columna" role="group" :aria-label="t('Derecha')">
        <AudioSonidoBoton v-for="i in ordenDerecha" :key="'d' + i" @click="tocarDerecha(i)">
          <button type="button" class="carta" lang="en"
            :class="[{ elegida: derecha === i, hecha: hechas.includes(i), error: fallo === 'd' + i }, hechas.includes(i) ? 'par-' + i : '']"
            :disabled="hechas.includes(i)">
            <span>{{ pregunta.parejas[i].der }}</span>
          </button>
        </AudioSonidoBoton>
      </div>
    </div>
    <p class="intentos" aria-live="polite">{{ t('Errores permitidos:') }} {{ MAX_FALLOS - fallos }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Datos: { parejas: [{ izq, der, imagen?, alt? }], correcta: 'texto resumen' }
const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['responder'])
const { t } = useLanguage()

const MAX_FALLOS = 2
const izquierda = ref(null)
const derecha = ref(null)
const hechas = ref([])
const fallos = ref(0)
const fallo = ref('')
let terminado = false

// Orden fijo (rotado una posición) para que servidor y cliente pinten lo mismo y ninguna pareja quede alineada.
const ordenDerecha = computed(() => props.pregunta.parejas.map((_, i, lista) => (i + 1) % lista.length))

function tocarIzquierda(i) {
  izquierda.value = izquierda.value === i ? null : i
  comprobar()
}

function tocarDerecha(i) {
  derecha.value = derecha.value === i ? null : i
  comprobar()
}

function comprobar() {
  if (terminado || izquierda.value === null || derecha.value === null) return
  const i = izquierda.value
  const d = derecha.value
  izquierda.value = null
  derecha.value = null

  if (i === d) {
    hechas.value.push(i)
    if (hechas.value.length === props.pregunta.parejas.length) {
      terminado = true
      emit('responder', props.pregunta.correcta)
    }
    return
  }

  fallos.value++
  fallo.value = 'i' + i
  setTimeout(() => { fallo.value = '' }, 350)
  if (fallos.value >= MAX_FALLOS) {
    terminado = true
    emit('responder', t('Parejas incorrectas'))
  }
}
</script>

<style scoped>
h2 { margin: 0.2rem 0 0.4rem; color: #fff0cc; font: 600 clamp(1rem, 2.5vw, 1.3rem) Georgia, serif; }
.contexto { color: #e3d4bd; }
.columnas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; margin-top: 0.4rem; }
.columna { display: grid; gap: 0.4rem; align-content: start; }
.carta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  min-height: 52px;
  padding: 0.3rem 0.5rem;
  border: 1px solid #c19a63;
  border-radius: 8px;
  background: linear-gradient(135deg, #392d24, #151c2b);
  color: #fff1ce;
  font: 600 clamp(0.8rem, 2.1vw, 1rem) Georgia, serif;
  line-height: 1.15;
  cursor: pointer;
}
.carta img { width: 1.8rem; height: 1.8rem; object-fit: contain; }
.carta.elegida { border: 2px solid #ffdc96; background: #5b462b; }
.carta { transition: scale 120ms, border-color 120ms; }
.carta:not(:disabled):active { scale: 0.96; }
.carta.hecha { border-color: #89d6ad; background: #1c3a2c; color: #c8f0d9; opacity: 0.85; animation: acierto 320ms ease-out; }
@keyframes acierto { 50% { scale: 1.1; } }
/* Cada pareja unida toma su propio color, en las dos columnas */
.carta.hecha.par-1 { border-color: #8ed9ff; background: #1b3342; color: #d3f0ff; }
.carta.hecha.par-2 { border-color: #d9a6ff; background: #33244a; color: #ecd6ff; }
.carta.error { animation: temblar 300ms ease; border-color: #ff8a7a; }
.carta:focus-visible { outline: 2px solid #ffe09a; outline-offset: 2px; }
.intentos { margin: 0.4rem 0 0; color: #c8c0b3; font-size: 0.8rem; }
@keyframes temblar {
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
@media (prefers-reduced-motion: reduce) {
  .carta.error, .carta.hecha { animation: none; }
  .carta { transition: none; }
}
</style>
