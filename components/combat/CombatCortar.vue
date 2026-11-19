<template>
  <div class="cortes" @pointerdown="iniciar" @pointermove="mover" @pointerup="soltar"
    @pointercancel="cancelar" @lostpointercapture="cancelar">

    <div ref="fichas" class="fichas">
      <button v-for="(opcion, i) in pregunta.opciones" :key="opcion" type="button" lang="en"
        :class="{ partida: cortadas.includes(i) }" :disabled="terminado || cortadas.includes(i)"
        @click="cortarConTeclado($event, i)">
        <span>{{ opcion }}</span>
      </button>
    </div>
    <span v-if="trazo" class="tajo" :style="trazo" aria-hidden="true" />
    <p v-if="sugerencia" class="sugerencia" role="status">↔ {{ t('Desliza el dedo sobre la ficha para cortarla') }}</p>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

const { t } = useLanguage()
const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['responder'])
const fichas = ref(null)
const cortadas = ref([])
const terminado = ref(false)
const trazo = ref(null)
const sugerencia = ref(false)
let gesto = null
let temporizadorSugerencia = null

onBeforeUnmount(() => clearTimeout(temporizadorSugerencia))

function iniciar(evento) {
  if (terminado.value || gesto || evento.button !== 0) return
  evento.currentTarget.setPointerCapture(evento.pointerId)
  gesto = { id: evento.pointerId, x: evento.clientX, y: evento.clientY }
}

function mover(evento) {
  if (terminado.value || gesto?.id !== evento.pointerId) return
  const dx = evento.clientX - gesto.x
  const dy = evento.clientY - gesto.y
  const distancia = Math.hypot(dx, dy)
  if (distancia < 7) return
  gesto.movio = true

  const arena = evento.currentTarget.getBoundingClientRect()
  trazo.value = {
    left: (gesto.x - arena.left) + 'px',
    top: (gesto.y - arena.top) + 'px',
    width: distancia + 'px',
    transform: `rotate(${Math.atan2(dy, dx)}rad)`
  }

  // Recorre el segmento para detectar fichas incluso si el gesto pasa rápido.
  const cajas = Array.from(fichas.value.children, ficha => ficha.getBoundingClientRect())
  const pasos = Math.ceil(distancia / 6)
  for (let paso = 0; paso <= pasos && !terminado.value; paso++) {
    const x = gesto.x + dx * paso / pasos
    const y = gesto.y + dy * paso / pasos
    const indice = cajas.findIndex(caja => x >= caja.left && x <= caja.right && y >= caja.top && y <= caja.bottom)
    if (indice !== -1) cortar(indice)
  }
  gesto.x = evento.clientX
  gesto.y = evento.clientY
}

function soltar(evento) {
  mover(evento)
  cancelar(evento)
}

function cancelar(evento) {
  if (gesto?.id !== evento.pointerId) return
  // Un toque sin deslizar no corta nada: se recuerda cómo se juega
  if (!gesto.movio && !terminado.value && evento.type === 'pointerup') {
    sugerencia.value = true
    clearTimeout(temporizadorSugerencia)
    temporizadorSugerencia = setTimeout(() => { sugerencia.value = false }, 1800)
  }
  gesto = null
  if (!terminado.value) trazo.value = null
}

function cortarConTeclado(evento, indice) {
  if (evento.detail === 0) cortar(indice)
}

function cortar(indice) {
  if (terminado.value || cortadas.value.includes(indice)) return
  cortadas.value.push(indice)
  const opcion = props.pregunta.opciones[indice]
  const correcto = props.pregunta.correcta
  const cortoLaCorrecta = opcion === correcto
  if (!cortoLaCorrecta && cortadas.value.length < props.pregunta.opciones.length - 1) return
  terminado.value = true
  emit('responder', cortoLaCorrecta ? t('Cortaste la respuesta correcta.') : correcto)
}
</script>

<style scoped>
.cortes { position: absolute; inset: 0; z-index: 3; touch-action: none; user-select: none; }
.sugerencia {
  position: absolute;
  inset: auto 0.5rem 5%;
  width: fit-content;
  margin-inline: auto;
  padding: 0.3rem 0.7rem;
  border: 1px solid #ffe09a;
  border-radius: 6px;
  background: #101928f0;
  color: #fff0cd;
  font-size: 1rem;
  font-weight: 700;
  text-align: center;
  pointer-events: none;
  animation: aparecer-pista 200ms ease-out;
}
@keyframes aparecer-pista { from { opacity: 0; translate: 0 8px; } }
@media (prefers-reduced-motion: reduce) { .sugerencia { animation: none; } }
.fichas {
  position: absolute;
  inset: auto 4% 14%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(6px, 2vw, 20px);
}
.fichas button {
  min-height: 52px;
  padding: 0.3rem;
  border: 1px solid #c19a63;
  border-radius: 8px;
  background: linear-gradient(135deg, #392d24, #151c2b);
  color: #fff1ce;
  font-size: clamp(0.78rem, 2vw, 1.06rem);
  cursor: crosshair;
  touch-action: none;
}
.fichas button { animation: entrar 320ms cubic-bezier(.2, 1.4, .4, 1) backwards; transition: border-color 120ms; }
.fichas button:nth-child(2) { animation-delay: 70ms; }
.fichas button:nth-child(3) { animation-delay: 140ms; }
.fichas button:not(:disabled):hover { border-color: #ffe09a; }
@keyframes entrar { from { opacity: 0; translate: 0 12px; scale: 0.7; } }
.fichas button:focus-visible { outline: 2px solid #ffe09a; outline-offset: 3px; }
.fichas button.partida {
  background: linear-gradient(155deg, #251c22 48%, #ffc079 49% 51%, #251c22 52%);
  border-color: #8d6553;
  animation: partir 220ms ease-out both;
}
.partida span { opacity: .6; text-decoration: line-through; }
.tajo {
  position: absolute;
  height: 3px;
  transform-origin: left center;
  background: #fff1cd;
  box-shadow: 0 0 8px 2px #ffb868;
  pointer-events: none;
}
@keyframes partir {
  30% { scale: 1.12; filter: brightness(1.9); }
  to { opacity: .55; scale: 0.94; rotate: -3deg; }
}
@media (prefers-reduced-motion: reduce) {
  .fichas button, .fichas button.partida { animation: none; }
  .fichas button.partida { opacity: .65; }
}
</style>
