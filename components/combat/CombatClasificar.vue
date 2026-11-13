<template>
  <div class="palabras-combate" @pointermove="mover" @pointerup="soltar" @pointercancel="cancelar" @lostpointercapture="cancelar">
    <p class="instruccion">{{ pregunta.texto }}</p>
    <div class="fichas-arena">
      <div v-for="(palabra, indice) in pregunta.palabras" :key="palabra.texto" class="espacio-ficha">
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
import { ref } from 'vue'

const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['impacto', 'error', 'completar'])
const usadas = ref([])
const arrastre = ref(null)

function tomar(evento, indice) {
  if (arrastre.value || evento.button !== 0) return
  evento.currentTarget.setPointerCapture(evento.pointerId)
  arrastre.value = { indice, puntero: evento.pointerId, x: evento.clientX, y: evento.clientY, dx: 0, dy: 0 }
}

function mover(evento) {
  const ficha = arrastre.value
  if (ficha?.puntero !== evento.pointerId) return
  ficha.dx = evento.clientX - ficha.x
  ficha.dy = evento.clientY - ficha.y
}

function cancelar(evento) {
  if (arrastre.value?.puntero === evento.pointerId) arrastre.value = null
}

function soltar(evento) {
  const ficha = arrastre.value
  if (ficha?.puntero !== evento.pointerId) return
  arrastre.value = null
  const arena = evento.currentTarget.closest('.escenario')
  const destino = Array.from(arena.querySelectorAll('[data-destino-palabra]')).find((luchador) => {
    const rect = luchador.getBoundingClientRect()
    return evento.clientX >= rect.left && evento.clientX <= rect.right &&
      evento.clientY >= rect.top && evento.clientY <= rect.bottom
  })?.dataset.destinoPalabra
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
.instruccion {
  position: absolute;
  inset: 2.25rem 0.4rem auto;
  width: fit-content;
  margin-inline: auto;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: #101928ed;
  color: #ffe09a;
  text-align: center;
  font-size: clamp(0.72rem, 1.8vw, 0.95rem);
}
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
.arrastrando { z-index: 1; background: #4f371a; box-shadow: 0 0 12px #ffe09a; cursor: grabbing; }
</style>
