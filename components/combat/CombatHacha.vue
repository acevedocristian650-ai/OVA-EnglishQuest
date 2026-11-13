<template>
  <div ref="arena" class="intercepcion" :style="{ '--energia': colores[nivel - 1] }"
    @pointermove="mover" @pointerup="soltar" @pointercancel="cancelar" @lostpointercapture="cancelar">
    <p class="aviso" lang="en">{{ pregunta.texto }}</p>
    <div v-for="bola in bolas" v-show="transcurrido >= bola.salida" :key="bola.id"
      class="bola" :class="{ partida: cortes[bola.id] !== undefined }"
      :data-bola="bola.id" :style="{ left: (cortes[bola.id] ?? posicion(bola)) + '%', top: bola.altura + '%' }"
      aria-hidden="true">
      <span /><span />
    </div>
    <p class="contador" role="status">{{ cantidad === bolas.length ? '¡Ataques cortados!' : cantidad + ' / ' + bolas.length + ' bolas cortadas' }}</p>
    <button type="button" class="hacha" :disabled="cantidad === bolas.length"
      :style="centro ? { left: centro.x + '%', top: centro.y + '%' } : null"
      aria-label="Arrastra el hacha para cortar las bolas de energía"
      @pointerdown="tomar">
      <span class="mango" aria-hidden="true" />
      <span class="hoja" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  pregunta: { type: Object, required: true },
  nivel: { type: Number, required: true },
  restante: { type: Number, required: true },
  total: { type: Number, required: true }
})
const emit = defineEmits(['cortar'])
const bolas = [
  { id: 0, salida: .65, altura: 56 },
  { id: 1, salida: 1.65, altura: 68 },
  { id: 2, salida: 2.65, altura: 45 }
]
const colores = ['#ffad55', '#9fee68', '#8ed9ff', '#ff8267']
const arena = ref(null)
const centro = ref(null)
const cortes = ref({})
const cantidad = computed(() => Object.keys(cortes.value).length)
const transcurrido = computed(() => props.total - props.restante)
let puntero = null
let agarre = null

function posicion(bola) {
  const progreso = (transcurrido.value - bola.salida) / (props.total - bola.salida)
  return 77 - 53 * Math.max(0, Math.min(1, progreso))
}

function tomar(evento) {
  if (puntero !== null || evento.button !== 0 || cantidad.value === bolas.length) return
  evento.currentTarget.setPointerCapture(evento.pointerId)
  puntero = evento.pointerId
  const campo = arena.value.getBoundingClientRect()
  const hacha = evento.currentTarget.getBoundingClientRect()
  const x = hacha.left + hacha.width / 2
  const y = hacha.top + hacha.height / 2
  agarre = { x: evento.clientX - x, y: evento.clientY - y }
  centro.value = { x: (x - campo.left) / campo.width * 100, y: (y - campo.top) / campo.height * 100 }
}

function mover(evento) {
  if (puntero !== evento.pointerId || cantidad.value === bolas.length) return
  const campo = arena.value.getBoundingClientRect()
  const anchoHacha = evento.target.offsetWidth
  const x = centro.value.x * campo.width / 100
  const y = centro.value.y * campo.height / 100
  const destinoX = Math.max(0, Math.min(campo.width, evento.clientX - campo.left - agarre.x))
  const destinoY = Math.max(0, Math.min(campo.height, evento.clientY - campo.top - agarre.y))
  const dx = destinoX - x
  const dy = destinoY - y
  const pasos = Math.ceil(Math.hypot(dx, dy) / 5)
  centro.value = { x: destinoX / campo.width * 100, y: destinoY / campo.height * 100 }

  for (const bola of bolas) {
    if (transcurrido.value < bola.salida || cortes.value[bola.id] !== undefined) continue
    const caja = arena.value.querySelector(`[data-bola="${bola.id}"]`)?.getBoundingClientRect()
    if (!caja?.width) continue
    const blancoX = caja.left + caja.width / 2
    const blancoY = caja.top + caja.height / 2

    for (let paso = 0; paso <= pasos && pasos > 0; paso++) {
      const hojaX = campo.left + x + dx * paso / pasos + anchoHacha * .1
      const hojaY = campo.top + y + dy * paso / pasos - anchoHacha * .24
      if (Math.hypot(hojaX - blancoX, hojaY - blancoY) > caja.width / 2 + anchoHacha * .21) continue
      cortes.value[bola.id] = (blancoX - campo.left) / campo.width * 100
      break
    }
  }
  if (cantidad.value === bolas.length) emit('cortar')
}

function soltar(evento) {
  mover(evento)
  cancelar(evento)
}

function cancelar(evento) {
  if (puntero === evento.pointerId) puntero = null
}
</script>

<style scoped>
.intercepcion { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.aviso, .contador {
  position: absolute;
  width: fit-content;
  margin-inline: auto;
  padding: .25rem .65rem;
  border-radius: 6px;
  background: #101928ed;
  color: #fff0cd;
  text-align: center;
}
.aviso { inset: 2.7rem 8px auto; }
.contador { inset: auto 8px 4%; font-size: .85rem; }
.bola {
  position: absolute;
  width: clamp(30px, 6vw, 58px);
  aspect-ratio: 1;
  translate: -50% -50%;
  transition: left 100ms linear;
}
.bola::after {
  content: '';
  position: absolute;
  inset: 23% -95% 23% 45%;
  background: linear-gradient(90deg, var(--energia), transparent);
  border-radius: 50%;
  opacity: .55;
}
.bola span {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fff 5%, var(--energia) 44%, #513249 86%);
  box-shadow: 0 0 15px var(--energia);
}
.bola span + span { display: none; }
.bola.partida { transition: none; }
.partida::after { display: none; }
.partida span { clip-path: polygon(0 0, 100% 0, 0 100%); animation: separar 440ms ease-out both; }
.partida span + span {
  display: block;
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  animation-name: separar-abajo;
}
@keyframes separar { to { transform: translate(-35%, -70%) rotate(-25deg); opacity: 0; } }
@keyframes separar-abajo { to { transform: translate(35%, 70%) rotate(25deg); opacity: 0; } }
.hacha {
  position: absolute;
  z-index: 2;
  left: 34%;
  top: 76%;
  width: clamp(76px, 13vmin, 108px);
  aspect-ratio: 1;
  translate: -50% -50%;
  background: radial-gradient(ellipse, #dfa75b55, transparent 69%);
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  cursor: grab;
  filter: drop-shadow(0 2px 3px #000);
}
.hacha:active { cursor: grabbing; }
.hacha span { position: absolute; pointer-events: none; }
.mango {
  width: 10%;
  height: 76%;
  left: 45%;
  top: 12%;
  rotate: 31deg;
  border-radius: 3px;
  background: linear-gradient(90deg, #452619, #c29158 58%, #67402b);
}
.hoja {
  width: 61%;
  height: 47%;
  left: 29%;
  top: 3%;
  rotate: 31deg;
  clip-path: polygon(0 0, 19% 14%, 41% 27%, 59% 27%, 81% 14%, 100% 0, 96% 36%, 100% 100%, 77% 80%, 59% 65%, 41% 65%, 23% 80%, 0 100%, 4% 36%);
  background: linear-gradient(100deg, #f4eedc, #8896a4 15%, #4a525c 49%, #a1acb4 81%, #f4eedc);
}
@media (prefers-reduced-motion: reduce) {
  .bola { transition: none; }
  .bola.partida { visibility: hidden; }
}
</style>
