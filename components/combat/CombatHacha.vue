<template>
  <div ref="arena" class="intercepcion" :class="{ 'ultimo-corte': cantidad === bolas.length }"
    :style="{ '--energia': colores[nivel - 1] }"
    @pointermove="mover" @pointerup="soltar" @pointercancel="cancelar" @lostpointercapture="cancelar">
    <!-- Un sonido por cada bola cortada -->
    <AudioEfecto ruta="/audio/combate/hachazo.mp3" :disparo="cantidad" :volumen="0.55" />


    <!-- Estela luminosa que deja la hoja al moverse -->
    <svg class="rastro" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line v-for="(tramo, i) in tramos" :key="tramo.id"
        :x1="tramo.x1" :y1="tramo.y1" :x2="tramo.x2" :y2="tramo.y2"
        :style="{ opacity: (i + 1) / tramos.length, strokeWidth: 1.5 + 5 * (i + 1) / tramos.length + 'px' }" />
    </svg>

    <div v-for="bola in bolas" :ref="referenciasBola[bola.id]"
      v-show="transcurrido >= bola.salida" :key="bola.id"
      class="bola" :class="{ partida: cortes[bola.id] !== undefined, peligro: cortes[bola.id] === undefined && posicion(bola) < 42 }"
      :data-bola="bola.id" :style="{ left: (cortes[bola.id] ?? posicion(bola)) + '%', top: bola.altura + '%' }"
      aria-hidden="true">
      <span /><span />
    </div>

    <!-- Estallido en el punto de cada corte -->
    <div v-for="destello in destellos" :key="destello.id" class="destello"
      :style="{ left: destello.x + '%', top: destello.y + '%' }" aria-hidden="true">
      <i class="flash" />
      <i class="anillo" />
      <i v-for="n in 8" :key="n" class="astilla" :style="{ '--a': n * 45 + 'deg' }" />
      <b class="texto">{{ t(destello.texto) }}</b>
    </div>

    <div class="contador" role="status">
      <span class="pips" aria-hidden="true">
        <i v-for="n in bolas.length" :key="n" :class="{ llena: n <= cantidad }" />
      </span>
      <span>{{ cantidad === bolas.length ? t('¡Ataques cortados!') : cantidad + ' / ' + bolas.length + ' ' + t('bolas cortadas') }}</span>
    </div>

    <button type="button" class="hacha" :class="{ moviendo: giro !== 0 }" :disabled="cantidad === bolas.length"
      :style="estiloHacha"
      :aria-label="t('Arrastra el hacha para cortar las bolas de energía')"
      @pointerdown="tomar">
      <span class="mango" aria-hidden="true" />
      <span class="hoja" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import AudioEfecto from '../audio/Efecto.vue'

const { t } = useLanguage()
const props = defineProps({
  pregunta: { type: Object, required: true },
  nivel: { type: Number, required: true },
  restante: { type: Number, required: true },
  total: { type: Number, required: true }
})
const emit = defineEmits(['cortar'])

const bolas = [
  { id: 0, salida: .45, altura: 56 },
  { id: 1, salida: 1.6, altura: 68 },
  { id: 2, salida: 2.75, altura: 45 }
]
const colores = ['#ffad55', '#9fee68', '#8ed9ff', '#ff8267']
const textosCorte = ['¡Corte!', '¡Doble!', '¡Triple!']
const arena = ref(null)
const centro = ref(null)
const cortes = ref({})
const rastro = ref([])
const destellos = ref([])
const giro = ref(0)
const cantidad = computed(() => Object.keys(cortes.value).length)
const transcurrido = computed(() => props.total - props.restante)
const estiloHacha = computed(() => ({
  ...(centro.value ? { left: centro.value.x + '%', top: centro.value.y + '%' } : {}),
  rotate: giro.value + 'deg'
}))
const tramos = computed(() => rastro.value.slice(1).map((punto, i) => ({
  id: punto.id, x1: rastro.value[i].x, y1: rastro.value[i].y, x2: punto.x, y2: punto.y
})))
let puntero = null
let agarre = null
let campoActivo = null
let anchoHacha = 0
let alturaHacha = 0
let movimientoPendiente = null
let cuadroMovimiento = null
let idPunto = 0
let idDestello = 0
let temporizadorRastro = null
let temporizadorGiro = null
const temporizadores = new Set()
const elementosBola = new Map()
const referenciasBola = Object.fromEntries(bolas.map((bola) => [
  bola.id,
  (elemento) => asignarBola(elemento, bola.id)
]))

function posicion(bola) {
  const progreso = (transcurrido.value - bola.salida) / (props.total - bola.salida)
  return 77 - 53 * Math.max(0, Math.min(1, progreso))
}

function tomar(evento) {
  if (puntero !== null || evento.button !== 0 || cantidad.value === bolas.length) return
  evento.currentTarget.setPointerCapture(evento.pointerId)
  puntero = evento.pointerId
  const campo = arena.value.getBoundingClientRect()
  campoActivo = campo
  const hacha = evento.currentTarget.getBoundingClientRect()
  anchoHacha = hacha.width
  alturaHacha = hacha.height
  const x = hacha.left + hacha.width / 2
  const y = hacha.top + hacha.height / 2
  agarre = { x: evento.clientX - x, y: evento.clientY - y }
  centro.value = { x: (x - campo.left) / campo.width * 100, y: (y - campo.top) / campo.height * 100 }
}

function asignarBola(elemento, id) {
  if (elemento) elementosBola.set(id, elemento)
  else elementosBola.delete(id)
}

// Rastro: guarda los últimos puntos de la hoja (en %) y lo borra poco después de dejar de mover.
function marcarRastro(campo, hojaX, hojaY) {
  rastro.value.push({ id: ++idPunto, x: hojaX / campo.width * 100, y: hojaY / campo.height * 100 })
  if (rastro.value.length > 12) rastro.value.shift()
  clearTimeout(temporizadorRastro)
  temporizadorRastro = setTimeout(() => { rastro.value = [] }, 140)
}

// El hacha se inclina un poco hacia donde se mueve (máximo 18°, para que la hoja siga en su zona de corte).
function inclinar(dx) {
  giro.value = Math.round(Math.max(-18, Math.min(18, dx * 0.9)))
  clearTimeout(temporizadorGiro)
  temporizadorGiro = setTimeout(() => { giro.value = 0 }, 110)
}

function estallar(x, y) {
  const destello = { id: ++idDestello, x, y, texto: textosCorte[Math.min(cantidad.value, bolas.length) - 1] }
  destellos.value.push(destello)
  const temporizador = setTimeout(() => {
    destellos.value = destellos.value.filter((d) => d.id !== destello.id)
    temporizadores.delete(temporizador)
  }, 800)
  temporizadores.add(temporizador)
}

function mover(evento) {
  if (puntero !== evento.pointerId || cantidad.value === bolas.length) return
  movimientoPendiente = evento
  if (cuadroMovimiento !== null) return
  cuadroMovimiento = requestAnimationFrame(() => {
    cuadroMovimiento = null
    const movimiento = movimientoPendiente
    movimientoPendiente = null
    if (movimiento) procesarMovimiento(movimiento)
  })
}

function distanciaAlSegmento(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const longitudCuadrada = dx * dx + dy * dy
  const proporcion = longitudCuadrada === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / longitudCuadrada))
  const diferenciaX = x - (x1 + proporcion * dx)
  const diferenciaY = y - (y1 + proporcion * dy)
  return diferenciaX * diferenciaX + diferenciaY * diferenciaY
}

function procesarMovimiento(evento) {
  if (puntero !== evento.pointerId || cantidad.value === bolas.length || !campoActivo) return
  const campo = campoActivo
  const x = centro.value.x * campo.width / 100
  const y = centro.value.y * campo.height / 100
  const destinoX = Math.max(0, Math.min(campo.width, evento.clientX - campo.left - agarre.x))
  const destinoY = Math.max(0, Math.min(campo.height, evento.clientY - campo.top - agarre.y))
  const dx = destinoX - x
  const dy = destinoY - y
  centro.value = { x: destinoX / campo.width * 100, y: destinoY / campo.height * 100 }
  if (dx !== 0 || dy !== 0) {
    marcarRastro(campo, destinoX + anchoHacha * .1, destinoY - anchoHacha * .24)
    inclinar(dx)
  }

  for (const bola of bolas) {
    if (transcurrido.value < bola.salida || cortes.value[bola.id] !== undefined) continue
    const caja = elementosBola.get(bola.id)?.getBoundingClientRect()
    if (!caja?.width) continue
    const blancoX = caja.left + caja.width / 2
    const blancoY = caja.top + caja.height / 2
    const inicioX = campo.left + x + anchoHacha * .1
    const inicioY = campo.top + y - alturaHacha * .24
    const finalX = campo.left + destinoX + anchoHacha * .1
    const finalY = campo.top + destinoY - alturaHacha * .24
    const radio = caja.width / 2 + anchoHacha * .21
    if (distanciaAlSegmento(blancoX, blancoY, inicioX, inicioY, finalX, finalY) > radio * radio) continue
    cortes.value[bola.id] = (blancoX - campo.left) / campo.width * 100
    estallar(cortes.value[bola.id], bola.altura)
  }
  if (cantidad.value === bolas.length) emit('cortar')
}

function soltar(evento) {
  if (cuadroMovimiento !== null) {
    cancelAnimationFrame(cuadroMovimiento)
    cuadroMovimiento = null
    movimientoPendiente = null
  }
  if (puntero === evento.pointerId) procesarMovimiento(evento)
  cancelar(evento)
}

function cancelar(evento) {
  if (puntero !== evento.pointerId) return
  if (cuadroMovimiento !== null) cancelAnimationFrame(cuadroMovimiento)
  cuadroMovimiento = null
  movimientoPendiente = null
  puntero = null
  campoActivo = null
}

onBeforeUnmount(() => {
  if (cuadroMovimiento !== null) cancelAnimationFrame(cuadroMovimiento)
  clearTimeout(temporizadorRastro)
  clearTimeout(temporizadorGiro)
  temporizadores.forEach((temporizador) => clearTimeout(temporizador))
  temporizadores.clear()
})
</script>

<style scoped>
.intercepcion { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.contador {
  position: absolute;
  width: fit-content;
  margin-inline: auto;
  padding: .25rem .65rem;
  border-radius: 6px;
  background: #101928ed;
  color: #fff0cd;
  text-align: center;
}
.contador { inset: auto 8px 4%; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; }

/* Pastillas que se llenan con cada corte */
.pips { display: inline-flex; gap: 6px; margin-right: .5rem; }
.pips i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--energia);
  background: #0b1325;
}
.pips i.llena {
  background: radial-gradient(circle at 35% 35%, #fff, var(--energia) 70%);
  box-shadow: 0 0 9px var(--energia);
  animation: llenar 320ms cubic-bezier(.2, 1.6, .4, 1);
}
@keyframes llenar { from { scale: 0.3; } 60% { scale: 1.4; } }

/* Estela de la hoja */
.rastro { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.rastro line {
  stroke: #fff4d2;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 4px var(--energia));
}

/* Bolas de energía */
.bola {
  position: absolute;
  width: clamp(30px, 6vw, 58px);
  aspect-ratio: 1;
  translate: -50% -50%;
  transition: left 100ms linear;
  animation: aparecer 380ms cubic-bezier(.2, 1.5, .4, 1) backwards;
}
@keyframes aparecer { from { scale: 0.1; opacity: 0; } }
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
.bola span:first-child::before {
  content: '';
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: conic-gradient(transparent, #fff9, transparent 40%, #fff6 62%, transparent);
  animation: girar 900ms linear infinite;
}
@keyframes girar { to { rotate: 360deg; } }
.bola:not(.partida) span:first-child { animation: latido 650ms ease-in-out infinite alternate; }
@keyframes latido { to { scale: 1.12; box-shadow: 0 0 26px var(--energia); } }

/* Cuando está cerca del caballero se pone roja y late más rápido */
.bola.peligro:not(.partida) span:first-child {
  animation-duration: 260ms;
  background: radial-gradient(circle at 35% 35%, #fff 5%, #ff6a4d 44%, #5a1c28 86%);
  box-shadow: 0 0 22px #ff4a3a;
}
.bola.peligro::after { background: linear-gradient(90deg, #ff6a4d, transparent); opacity: .75; }

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

/* Estallido de cada corte */
.destello { position: absolute; width: 0; height: 0; z-index: 4; pointer-events: none; }
.destello i, .destello b { position: absolute; }
.flash {
  left: -28px;
  top: -28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff, var(--energia) 40%, transparent 70%);
  animation: fogonazo-corte 300ms ease-out forwards;
}
.anillo {
  left: -30px;
  top: -30px;
  width: 60px;
  height: 60px;
  border: 3px solid var(--energia);
  border-radius: 50%;
  animation: onda-corte 540ms ease-out forwards;
}
.astilla {
  left: -2px;
  top: -9px;
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(#fff, var(--energia));
  animation: astilla 540ms ease-out forwards;
}
.texto {
  left: 0;
  top: -26px;
  translate: -50% 0;
  white-space: nowrap;
  color: #fff6d8;
  font: 900 clamp(.9rem, 2.6vw, 1.3rem) 'Cinzel', Georgia, serif;
  text-shadow: 0 0 8px var(--energia), 0 2px 4px #000;
  animation: texto-corte 760ms ease-out forwards;
}
@keyframes fogonazo-corte { from { scale: 0.3; opacity: 1; } to { scale: 1.9; opacity: 0; } }
@keyframes onda-corte { from { scale: 0.2; opacity: 1; } to { scale: 2.6; opacity: 0; } }
@keyframes astilla {
  from { transform: rotate(var(--a)) translateY(-8px); opacity: 1; }
  to { transform: rotate(var(--a)) translateY(-50px) scaleY(0.3); opacity: 0; }
}
@keyframes texto-corte {
  0% { opacity: 0; translate: -50% 10px; scale: 0.6; }
  20% { opacity: 1; scale: 1.2; }
  100% { opacity: 0; translate: -50% -34px; scale: 1; }
}

/* Destello general al cortar la última bola */
.intercepcion::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 40% 62%, #fff8, var(--energia) 18%, transparent 62%);
  opacity: 0;
  pointer-events: none;
}
.ultimo-corte::after { animation: fogonazo-final 420ms ease-out; }
@keyframes fogonazo-final { 0% { opacity: .75; } 100% { opacity: 0; } }

/* Hacha */
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
  transition: scale 120ms, rotate 110ms ease-out;
}
.hacha.moviendo { filter: drop-shadow(0 0 8px var(--energia)) drop-shadow(0 2px 3px #000); }
.hacha:active { cursor: grabbing; scale: 1.1; }
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
  .bola { transition: none; animation: none; }
  .bola span, .bola span::before { animation: none !important; }
  .bola.partida { visibility: hidden; }
  .hacha { transition: none; rotate: 0deg !important; }
  .rastro { display: none; }
  .flash, .anillo, .astilla { display: none; }
  .texto { animation: fundido-corte 760ms ease-out forwards; translate: -50% 0; }
  @keyframes fundido-corte { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }
  .ultimo-corte::after, .pips i.llena { animation: none; }
}

@media (pointer: coarse) {
  .bola span { box-shadow: 0 0 8px var(--energia); }
  .bola span:first-child::before { display: none; }
  .bola:not(.partida) span:first-child,
  .bola.peligro:not(.partida) span:first-child { animation: none; }
  .bola.peligro:not(.partida) span:first-child { box-shadow: 0 0 10px #ff4a3a; }
  .rastro line { filter: none; }
  .hacha, .hacha.moviendo { filter: none; }
}
</style>
