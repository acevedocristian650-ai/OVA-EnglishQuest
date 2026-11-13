<template>
  <div ref="arena" class="conjuro" :class="{ resuelto }"
    @pointermove="mover" @pointerup="soltar" @pointercancel="cancelar" @lostpointercapture="cancelar">
    <template v-if="pregunta.tipo === 'romper-hechizo'">
      <div v-if="pregunta.invocacion" class="invocado" :class="{ repelido: resuelto }">
        <span class="portal" aria-hidden="true" />
        <img src="/images/personajes-mate/viento/gigante.webp" alt="Gigante invocado" draggable="false" />
      </div>
      <span v-if="pregunta.invocacion && resuelto" class="retorno" aria-hidden="true" />
      <div v-if="!invocando" class="hechizo" :class="{ roto: resuelto }">
        <p class="objetivo">{{ resuelto ? '¡Hechizo devuelto!' : 'Rompe el hechizo con not' }}</p>
        <div class="oracion" lang="en">
          <template v-for="(palabra, indice) in pregunta.frase" :key="indice">
            <span v-if="!resuelto && (!pregunta.huecos || pregunta.huecos.includes(indice))"
              class="insercion" :class="{ activo: destino === indice }"
              :data-hueco="indice">·</span>
            <strong v-if="resuelto && indice === colocacion" class="negacion">not</strong>
            <span>{{ palabra }}</span>
          </template>
          <span v-if="!resuelto && (!pregunta.huecos || pregunta.huecos.includes(pregunta.frase.length))"
            class="insercion" :class="{ activo: destino === pregunta.frase.length }"
            :data-hueco="pregunta.frase.length">·</span>
          <strong v-if="resuelto && colocacion === pregunta.frase.length" class="negacion">not</strong>
        </div>
      </div>
      <button v-if="!resuelto && !invocando" type="button" class="runa" :class="{ arrastrando: gesto }"
        :style="gesto ? { translate: `${gesto.dx}px ${gesto.dy}px` } : null"
        @pointerdown="tomar" lang="en" aria-label="Arrastra not al lugar que convierte el hechizo en una negación">not</button>
    </template>

    <template v-else>
      <svg v-if="trazo.length" class="trazo" aria-hidden="true"><polyline :points="trazo.map(p => p.join(',')).join(' ')" /></svg>
      <p class="peticion" lang="en">{{ pregunta.contexto }}</p>
      <div class="aliado" :class="{ protegido: resuelto }">
        <img src="/images/personajes-mate/caballero/guardia.webp" alt="Espíritu aliado" draggable="false" />
        <span class="barrera" aria-hidden="true" />
        <span class="nombre-aliado">{{ resuelto ? '¡Aliado protegido!' : 'Aliado' }}</span>
      </div>
      <div class="cadena" :class="{ completa: resuelto }" :lang="frasePromesa ? 'en' : 'es'" aria-live="polite">
        {{ frasePromesa || 'Une las palabras de la promesa' }}
      </div>
      <div v-if="!resuelto" class="nodos">
        <button v-for="(palabra, indice) in pregunta.nodos" :key="indice"
          type="button" :data-nodo="indice" :aria-pressed="seleccion.includes(indice)"
          @pointerdown="iniciarPromesa($event, indice)" lang="en">{{ palabra }}</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

const props = defineProps({
  pregunta: { type: Object, required: true },
  invocando: Boolean,
  resuelto: { type: Boolean, default: false }
})
const emit = defineEmits(['responder'])
const arena = shallowRef(null)
const gesto = ref(null)
const destino = ref(null)
const seleccion = ref([])
const colocacion = ref(null)
const puntos = ref([])
const trazo = ref([])
const frasePromesa = computed(() => seleccion.value.map(i => props.pregunta.nodos[i]).join(' '))

let vozGigante = null

watch(() => props.invocando, (invocando) => {
  if (invocando || !props.pregunta.invocacion || document.hidden || !window.speechSynthesis
    || !window.SpeechSynthesisUtterance) return
  vozGigante = new SpeechSynthesisUtterance(props.pregunta.frase.join(' '))
  vozGigante.lang = 'en-US'
  vozGigante.pitch = 0.55
  vozGigante.rate = 0.87
  vozGigante.onend = vozGigante.onerror = () => { vozGigante = null }
  window.speechSynthesis.speak(vozGigante)
})

onBeforeUnmount(() => {
  if (vozGigante) window.speechSynthesis.cancel()
})

function tomar(evento) {
  if (props.resuelto || gesto.value || evento.button !== 0) return
  evento.currentTarget.setPointerCapture(evento.pointerId)
  gesto.value = { puntero: evento.pointerId, x: evento.clientX, y: evento.clientY, dx: 0, dy: 0 }
}

function iniciarPromesa(evento, indice) {
  if (props.resuelto || gesto.value) return
  tomar(evento)
  if (gesto.value) {
    seleccion.value = [indice]
    puntos.value = [centro(evento.currentTarget)]
    trazo.value = [...puntos.value]
  }
}

function centro(elemento) {
  const caja = elemento.getBoundingClientRect()
  const campo = arena.value.getBoundingClientRect()
  return [caja.left + caja.width / 2 - campo.left, caja.top + caja.height / 2 - campo.top]
}

function elementoDebajo(evento) {
  const elemento = document.elementFromPoint(evento.clientX, evento.clientY)
  return arena.value?.contains(elemento) ? elemento : null
}

function mover(evento) {
  const actual = gesto.value
  if (actual?.puntero !== evento.pointerId) return
  actual.dx = evento.clientX - actual.x
  actual.dy = evento.clientY - actual.y
  if (props.pregunta.tipo === 'romper-hechizo') {
    const hueco = elementoDebajo(evento)?.closest('[data-hueco]')
    destino.value = hueco ? Number(hueco.dataset.hueco) : null
  } else {
    enlazarNodos(evento, actual)
  }
}

function enlazarNodos(evento, actual) {
  const campo = arena.value.getBoundingClientRect()
  const dx = evento.clientX - actual.x
  const dy = evento.clientY - actual.y
  const pasos = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6))
  const nodos = Array.from(arena.value.querySelectorAll('[data-nodo]'), nodo => ({
    indice: Number(nodo.dataset.nodo),
    caja: nodo.getBoundingClientRect()
  }))

  for (let paso = 1; paso <= pasos; paso++) {
    const x = actual.x + dx * paso / pasos
    const y = actual.y + dy * paso / pasos
    const nodo = nodos.find(({ caja }) => x >= caja.left - 5 && x <= caja.right + 5 &&
      y >= caja.top - 5 && y <= caja.bottom + 5)
    if (!nodo || seleccion.value.includes(nodo.indice)) continue
    seleccion.value.push(nodo.indice)
    puntos.value.push([nodo.caja.left + nodo.caja.width / 2 - campo.left,
      nodo.caja.top + nodo.caja.height / 2 - campo.top])
    if (frasePromesa.value === props.pregunta.correcta) {
      trazo.value = [...puntos.value]
      gesto.value = null
      emit('responder', frasePromesa.value)
      return
    }
  }
  actual.x = evento.clientX
  actual.y = evento.clientY
  trazo.value = [...puntos.value, [actual.x - campo.left, actual.y - campo.top]]
}

function cancelar(evento) {
  if (gesto.value?.puntero !== evento.pointerId) return
  gesto.value = null
  destino.value = null
  seleccion.value = []
  puntos.value = []
  trazo.value = []
}

function soltar(evento) {
  if (gesto.value?.puntero !== evento.pointerId) return
  mover(evento)
  if (!gesto.value) return
  if (props.pregunta.tipo !== 'romper-hechizo') {
    cancelar(evento)
    return
  }
  const posicion = destino.value
  gesto.value = null
  destino.value = null
  if (posicion === null) return
  colocacion.value = posicion
  const frase = [...props.pregunta.frase]
  frase.splice(posicion, 0, 'not')
  emit('responder', frase.join(' '))
}
</script>

<style scoped>
.conjuro { position: absolute; inset: 0; z-index: 3; pointer-events: none; color: #fff0cf; }
.hechizo {
  position: absolute;
  inset: 28% 3% auto;
  padding: 0.45rem;
  border-radius: 40% 40% 15px 15px;
  background: radial-gradient(ellipse, #361550f2, #151021c9 65%, transparent 72%);
  filter: drop-shadow(0 0 9px #8e55bc99);
}
.objetivo { text-align: center; font-size: 0.75rem; margin: 0 0 0.3rem; }
.oracion { display: flex; align-items: center; justify-content: center; gap: 2px; font-size: clamp(0.83rem, 2vw, 1.2rem); font-weight: 700; }
.insercion {
  display: inline-grid;
  place-items: center;
  width: clamp(32px, 5vw, 56px);
  min-height: 44px;
  border-bottom: 2px solid #bd95e2;
  color: #ddc2f5;
  pointer-events: auto;
}
.insercion.activo { background: #bd95e244; box-shadow: 0 0 12px #bb81dd; }
.runa {
  position: absolute;
  left: calc(50% - 35px);
  bottom: 8%;
  width: 70px;
  min-height: 48px;
  border: 1px solid #e8bdff;
  border-radius: 12px;
  background: #261139f5;
  color: #f6daff;
  box-shadow: 0 0 18px #a554be77;
  font: 700 1.15rem Georgia, serif;
  touch-action: none;
  user-select: none;
  cursor: grab;
  pointer-events: auto;
}
.runa.arrastrando { pointer-events: none; z-index: 2; }
.negacion { color: #a4ffd4; }
.invocado {
  position: absolute;
  inset: 11% auto 4% 50%;
  translate: -50% 0;
  width: 29%;
  animation: aparecer-gigante 1050ms ease-out both;
}
.invocado img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 0 12px #aa75edb0);
}
.portal {
  position: absolute;
  inset: auto 4% 0;
  height: 17%;
  border-radius: 50%;
  background: radial-gradient(ellipse, #cf9bf78c, #6e27b363 48%, transparent 72%);
}
.invocado.repelido { animation: expulsar-gigante 800ms ease-in both; }
@keyframes aparecer-gigante {
  from { opacity: 0; transform: translateY(12%) scale(.82); filter: brightness(2); }
  to { opacity: 1; transform: none; }
}
@keyframes expulsar-gigante {
  0% { opacity: 1; }
  25% { filter: brightness(2.4); }
  100% { opacity: 0; transform: translate(20%, -6%) scale(.88); }
}
.retorno {
  position: absolute;
  left: 48%;
  top: 48%;
  width: clamp(20px, 6%, 70px);
  aspect-ratio: 2;
  border-radius: 50%;
  background: #e5c1ff;
  box-shadow: 0 0 14px 5px #b66bff;
  animation: devolver-hechizo 500ms ease-out both;
}
@keyframes devolver-hechizo {
  from { left: 32%; opacity: 1; }
  65% { opacity: 1; }
  to { left: 50%; opacity: 0; }
}
.roto { animation: romper 850ms ease-out both; }
@keyframes romper {
  0% { filter: brightness(2) drop-shadow(0 0 20px #ad7fd9); }
  45% { scale: 1.04; }
  100% { filter: drop-shadow(0 0 4px #8ce4b5); }
}
.peticion { position: absolute; inset: 2.6rem 0.5rem auto; width: fit-content; margin: auto; padding: 0.25rem 0.55rem; background: #101928f2; border-radius: 6px; font-size: clamp(0.78rem, 1.8vw, 1rem); }
.aliado { position: absolute; inset: 31% auto 40% 44%; width: 16%; min-width: 70px; }
.aliado img { width: 100%; height: 100%; object-fit: contain; filter: sepia(0.5) hue-rotate(125deg) drop-shadow(0 0 6px #7ff2e9); opacity: 0.85; pointer-events: none; }
.nombre-aliado { position: absolute; inset: auto -15% -1.2rem; text-align: center; color: #b6f3ee; font-size: 0.72rem; pointer-events: none; }
.barrera { position: absolute; inset: -10%; border: 2px solid #80f3de; border-radius: 50%; opacity: 0; pointer-events: none; }
.protegido .barrera { opacity: 1; background: radial-gradient(ellipse, transparent 45%, #47cdb344); box-shadow: 0 0 18px #7ce8d5; animation: proteger 700ms ease-out; }
@keyframes proteger { from { scale: 0.4; opacity: 0; } to { scale: 1; opacity: 1; } }
.cadena { position: absolute; inset: auto 25% 2% 5%; padding: 0.35rem; border-bottom: 2px solid #85b9dc; background: #101928dd; text-align: center; font-size: clamp(0.8rem, 1.8vw, 1.1rem); }
.cadena.completa { border-color: #80f3de; color: #b6f3ee; }
.nodos { position: absolute; inset: 0; }
.nodos button { position: absolute; bottom: 18%; min-width: 55px; min-height: 48px; padding: 0.4rem; border: 1px solid #c7a263; border-radius: 50%; background: #101928f5; color: #fff0cf; touch-action: none; user-select: none; pointer-events: auto; }
.nodos button:nth-child(1) { left: 15%; }
.nodos button:nth-child(2) { left: 38%; }
.nodos button:nth-child(3) { left: 78%; bottom: 42%; }
.nodos button:nth-child(4) { left: 61%; }
.trazo { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.trazo polyline { fill: none; stroke: #90f5dc; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 5px #85e4cc); }
.nodos button[aria-pressed="true"] { border-color: #90f5dc; background: #164338; box-shadow: 0 0 12px #85e4cc88; }
@media (prefers-reduced-motion: reduce) {
  .roto, .protegido .barrera, .invocado, .invocado.repelido { animation: none; }
  .invocado.repelido { opacity: 0; }
  .retorno { display: none; }
}
</style>
