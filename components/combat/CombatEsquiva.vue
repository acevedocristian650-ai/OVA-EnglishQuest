<template>
  <div class="esquiva-actividad" :class="{ arrastre: gesto }" @pointermove="mover" @pointerup="soltar"
    @pointercancel="cancelar" @lostpointercapture="cancelar">
    <p v-if="pregunta.tipo === 'esquivar'" class="aviso" lang="en">{{ pregunta.texto }}</p>
    <p v-else class="aviso" lang="en">
      It <span ref="hueco" class="hueco" :class="{ resaltado: sobreHueco }">___</span> attack!
    </p>
    <div v-if="pregunta.tipo === 'esquivar'" class="carriles" aria-hidden="true">
      <span :class="{ elegido: ladoElegido === 'izquierda' }">← Izquierda</span>
      <span :class="{ elegido: ladoElegido === 'derecha' }">Derecha →</span>
    </div>
    <button v-if="pregunta.tipo === 'esquivar'" type="button" class="control-heroe"
      :style="{ '--desplazamiento-control': gesto ? Math.max(-gesto.ancho * 0.15, Math.min(gesto.ancho * 0.15, gesto.dx)) + 'px' : null }"
      aria-label="Arrastra al héroe o usa las flechas izquierda y derecha."
      @pointerdown="tomar" @keydown.left.prevent="emit('esquivar', 'izquierda')"
      @keydown.right.prevent="emit('esquivar', 'derecha')">
      <span aria-hidden="true">↔</span>
    </button>
    <div v-else class="fichas-esquiva">
      <button v-for="ficha in pregunta.fichas" :key="ficha" type="button" class="ficha" lang="en"
        :class="{ arrastrando: gesto?.ficha === ficha }"
        :style="gesto?.ficha === ficha ? { translate: `${gesto.dx}px ${gesto.dy}px` } : null"
        @pointerdown="tomar($event, ficha)" @click="confirmarConTeclado($event, ficha)">
        {{ ficha }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, shallowRef } from 'vue'

defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['mover-heroe', 'esquivar', 'completar'])
const gesto = ref(null)
const hueco = shallowRef(null)
const sobreHueco = ref(false)
const ladoElegido = computed(() => {
  if (!gesto.value || gesto.value.ficha || Math.abs(gesto.value.dx) < umbral(gesto.value.ancho)) return null
  return gesto.value.dx < 0 ? 'izquierda' : 'derecha'
})

function umbral(ancho) {
  return Math.min(64, ancho * 0.09)
}

function tomar(evento, ficha = null) {
  if (gesto.value || evento.button !== 0) return
  const control = evento.currentTarget
  control.setPointerCapture(evento.pointerId)
  gesto.value = {
    puntero: evento.pointerId,
    x: evento.clientX,
    y: evento.clientY,
    ancho: control.closest('.esquiva-actividad').clientWidth,
    ficha,
    dx: 0,
    dy: 0
  }
}

function dentroDelHueco(evento) {
  const rect = hueco.value?.getBoundingClientRect()
  const ficha = evento.currentTarget.querySelector?.('.ficha.arrastrando')?.getBoundingClientRect()
  const x = ficha ? ficha.left + ficha.width / 2 : evento.clientX
  const y = ficha ? ficha.top + ficha.height / 2 : evento.clientY
  return Boolean(rect && x >= rect.left - 12 && x <= rect.right + 12 &&
    y >= rect.top - 12 && y <= rect.bottom + 12)
}

function mover(evento) {
  const actual = gesto.value
  if (actual?.puntero !== evento.pointerId) return
  actual.dx = evento.clientX - actual.x
  actual.dy = evento.clientY - actual.y
  if (actual.ficha) {
    sobreHueco.value = dentroDelHueco(evento)
  } else {
    emit('mover-heroe', Math.max(-15, Math.min(15, actual.dx / actual.ancho * 100)))
  }
}

function cancelar(evento) {
  if (gesto.value?.puntero !== evento.pointerId) return
  gesto.value = null
  sobreHueco.value = false
  emit('mover-heroe', 0)
}

function soltar(evento) {
  const actual = gesto.value
  if (actual?.puntero !== evento.pointerId) return
  const dx = evento.clientX - actual.x
  const enHueco = dentroDelHueco(evento)
  gesto.value = null
  sobreHueco.value = false

  if (actual.ficha) {
    if (enHueco) emit('completar', actual.ficha)
    return
  }

  if (Math.abs(dx) >= umbral(actual.ancho)) {
    emit('esquivar', dx < 0 ? 'izquierda' : 'derecha')
  } else {
    emit('mover-heroe', 0)
  }
}

function confirmarConTeclado(evento, ficha) {
  if (evento.detail === 0) emit('completar', ficha)
}
</script>

<style scoped>
.esquiva-actividad { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.aviso {
  position: absolute;
  inset: 2.65rem 0.45rem auto;
  width: fit-content;
  margin-inline: auto;
  padding: 0.28rem 0.55rem;
  border: 1px solid #b58c51;
  border-radius: 6px;
  background: #101928f5;
  color: #fff1d0;
  text-align: center;
  font: 700 clamp(0.82rem, 2vw, 1.12rem) Georgia, serif;
}
.carriles {
  position: absolute;
  inset: auto 42% 4% 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  text-align: center;
  font-size: clamp(0.7rem, 1.7vw, 0.9rem);
  color: #ffedc9;
}
.carriles span {
  transition: background 120ms, border-color 120ms;
  margin-inline: 0.25rem;
  padding: 0.2rem 0.25rem;
  border-bottom: 2px solid #e6b96e;
  border-radius: 4px;
  background: #101928d9;
}
.carriles span.elegido {
  color: #fff4d1;
  background: #745324e8;
  border-color: #ffe09a;
  box-shadow: 0 0 15px #ffc96a44;
}
.control-heroe {
  position: absolute;
  display: grid;
  align-items: end;
  justify-items: center;
  inset: 34% auto 16% 29%;
  translate: calc(-50% + var(--desplazamiento-control, 0px)) 0;
  width: 27%;
  min-height: 44px;
  border-radius: 8px;
  touch-action: none;
  user-select: none;
  cursor: grab;
  pointer-events: auto;
}
.control-heroe span {
  padding: 0 0.45rem;
  border: 1px solid #e6b96e;
  border-radius: 4px;
  background: #101928e8;
  color: #ffe09a;
  font-weight: 700;
}
.control-heroe:active { cursor: grabbing; }
.control-heroe:focus-visible, .ficha:focus-visible { outline: 2px solid #ffe09a; outline-offset: 2px; }
.hueco {
  display: inline-grid;
  place-items: center;
  min-width: 5.25rem;
  min-height: 44px;
  border: 1px dashed #e6b96e;
  border-radius: 5px;
}
.hueco.resaltado { border: 2px solid #ffe09a; background: #685028; box-shadow: 0 0 18px #ffe09a66; }
.fichas-esquiva {
  position: absolute;
  inset: auto 0.4rem 0.4rem;
  display: flex;
  justify-content: center;
  gap: 0.35rem;
}
.ficha {
  min-height: 44px;
  padding: 0.25rem 0.65rem;
  border: 1px solid #be9348;
  border-radius: 6px;
  background: #101928f5;
  color: #ffe09a;
  font-weight: 700;
  font-size: clamp(0.77rem, 1.8vw, 0.93rem);
  touch-action: none;
  user-select: none;
  cursor: grab;
  pointer-events: auto;
}
.ficha.arrastrando {
  position: relative;
  z-index: 1;
  background: #4f371a;
  border-color: #ffe09a;
  box-shadow: 0 8px 16px #0009, 0 0 12px #ffe09a66;
  cursor: grabbing;
}
@media (prefers-reduced-motion: reduce) {
  .carriles span { transition: none; }
}
</style>
