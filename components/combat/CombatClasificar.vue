<template>
  <div class="palabras-combate" @pointermove="mover" @pointerup="soltar" @pointercancel="cancelar" @lostpointercapture="cancelar">

    <div class="fichas-arena">
      <div v-for="(palabra, indice) in pregunta.palabras" :key="palabra.texto" class="espacio-ficha" :style="{ '--n': indice }">
        <button v-if="!usadas.includes(indice)" type="button" class="palabra" lang="en"
          :class="{ arrastrando: arrastre?.indice === indice }"
          :style="arrastre?.indice === indice ? { transform: `translate(${arrastre.dx}px, ${arrastre.dy}px)` } : null"
          @pointerdown="tomar($event, indice)">
          {{ palabra.texto }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['impacto', 'error', 'completar'])
const usadas = ref([])
const arrastre = ref(null)

// Marca visualmente los dos destinos mientras se arrastra, y resalta con más fuerza el que está bajo el dedo.
let resaltado = null

function destinos(arena) {
  return Array.from(arena?.querySelectorAll('[data-destino-palabra]') ?? [])
}

function marcarDestinos(arena, activos) {
  destinos(arena).forEach((destino) => {
    if (activos) destino.setAttribute('data-zona-palabra', 'activa')
    else {
      destino.removeAttribute('data-zona-palabra')
      destino.removeAttribute('data-sobre')
    }
  })
  if (!activos) resaltado = null
}

function destinoBajo(evento, arena) {
  return destinos(arena).find((luchador) => {
    const rect = luchador.getBoundingClientRect()
    return evento.clientX >= rect.left && evento.clientX <= rect.right &&
      evento.clientY >= rect.top && evento.clientY <= rect.bottom
  })
}

function resaltar(destino) {
  if (resaltado === destino) return
  resaltado?.removeAttribute('data-sobre')
  destino?.setAttribute('data-sobre', 'true')
  resaltado = destino ?? null
}

function tomar(evento, indice) {
  if (arrastre.value || evento.button !== 0) return
  marcarDestinos(evento.currentTarget.closest('.escenario'), true)
  evento.currentTarget.setPointerCapture(evento.pointerId)
  arrastre.value = { indice, puntero: evento.pointerId, x: evento.clientX, y: evento.clientY, dx: 0, dy: 0 }
}

let cuadro = 0
let ultimoMovimiento
function mover(evento) {
  if (arrastre.value?.puntero !== evento.pointerId) return
  ultimoMovimiento = { clientX: evento.clientX, clientY: evento.clientY, pointerId: evento.pointerId, currentTarget: evento.currentTarget }
  if (!cuadro) cuadro = requestAnimationFrame(() => {
    cuadro = 0
    actualizarArrastre(ultimoMovimiento)
  })
}

function actualizarArrastre(evento) {
  const ficha = arrastre.value
  if (ficha?.puntero !== evento.pointerId) return
  ficha.dx = evento.clientX - ficha.x
  ficha.dy = evento.clientY - ficha.y
  resaltar(destinoBajo(evento, evento.currentTarget.closest('.escenario')) ?? null)
}

function cancelar(evento) {
  if (arrastre.value?.puntero !== evento.pointerId) return
  cancelAnimationFrame(cuadro)
  cuadro = 0
  arrastre.value = null
  marcarDestinos(evento.currentTarget.closest('.escenario'), false)
}

onBeforeUnmount(() => {
  cancelAnimationFrame(cuadro)
  document.querySelectorAll('[data-zona-palabra]').forEach((destino) => {
    destino.removeAttribute('data-zona-palabra')
    destino.removeAttribute('data-sobre')
  })
})

function soltar(evento) {
  const ficha = arrastre.value
  if (ficha?.puntero !== evento.pointerId) return
  cancelAnimationFrame(cuadro)
  cuadro = 0
  arrastre.value = null
  const arena = evento.currentTarget.closest('.escenario')
  const destino = destinoBajo(evento, arena)?.dataset.destinoPalabra
  marcarDestinos(arena, false)
  if (!destino || Math.hypot(evento.clientX - ficha.x, evento.clientY - ficha.y) < 8) return

  const correcto = destino === (props.pregunta.palabras[ficha.indice].futuro ? 'heroe' : 'monstruo')
  if (!correcto) {
    emit('error', destino)
    return
  }

  usadas.value.push(ficha.indice)
  emit('impacto', destino)
  if (usadas.value.length === props.pregunta.palabras.length) emit('completar')
}
</script>

<style scoped>
.palabras-combate { position: absolute; inset: 0; z-index: 10; pointer-events: none; }
.fichas-arena {
  position: absolute;
  inset: auto 0.45rem 0.45rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.3rem;
  max-width: 35rem;
  margin-inline: auto;
}
.espacio-ficha { min-height: 44px; }
.palabra {
  position: relative;
  width: 100%;
  min-height: 44px;
  padding: 0.2rem;
  border: 1px solid #be9348;
  border-radius: 7px;
  background: #101928f5;
  color: #ffe09a;
  font-size: clamp(0.72rem, 2vw, 0.95rem);
  line-height: 1.15;
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  cursor: grab;
}
.palabra { animation: entrar-ficha 380ms cubic-bezier(.2, 1.4, .4, 1) calc(var(--n, 0) * 70ms) backwards; }
.palabra:not(.arrastrando) { transition: scale 150ms, rotate 150ms; }
.palabra:active { scale: 0.96; }
.arrastrando { z-index: 1; rotate: -4deg; scale: 1.1; background: #4f371a; box-shadow: 0 0 12px #ffe09a, 0 8px 14px #0008; cursor: grabbing; }
@keyframes entrar-ficha {
  from { opacity: 0; translate: 0 14px; scale: 0.6; }
}
@media (prefers-reduced-motion: reduce) {
  .palabra { animation: none; transition: none !important; }
  .arrastrando { rotate: none; }
}
</style>

<!-- Sin scoped: los destinos pertenecen a CombatEscena, pero este componente decide cuándo resaltarlos. -->
<style>
[data-destino-palabra][data-zona-palabra="activa"] {
  outline: 2px dashed #ffe09a66;
  outline-offset: -6px;
  border-radius: 16px;
  background: radial-gradient(ellipse at 50% 62%, #ffe09a1f, transparent 68%);
  transition: outline-color 120ms, background-color 120ms;
}
[data-destino-palabra][data-sobre="true"] {
  outline: 3px solid #ffe09a;
  background: radial-gradient(ellipse at 50% 62%, #ffe09a55, transparent 72%);
}
@media (prefers-reduced-motion: reduce) {
  [data-destino-palabra][data-zona-palabra="activa"] { transition: none; }
}
</style>
