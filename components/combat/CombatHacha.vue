<template>
  <div ref="arena" class="intercepcion" :class="{ 'ultimo-corte': cantidad === bolas.length }"
    :style="{ '--energia': colores[nivel - 1] }"
    @pointermove="mover" @pointerup="soltar" @pointercancel="cancelar" @lostpointercapture="cancelar">
    <!-- Un sonido por cada bola cortada -->
    <AudioEfecto ruta="/audio/combate/hachazo.mp3" :disparo="cantidad" :volumen="0.55" />

    <!-- Estela de la hoja: dos trazos que se actualizan directamente, sin pasar por la reactividad -->
    <svg class="rastro" aria-hidden="true">
      <polyline ref="rastroAncho" class="ancho" points="" />
      <polyline ref="rastroNucleo" class="nucleo" points="" />
    </svg>

    <div v-for="bola in bolas" :ref="referenciasBola[bola.id]" :key="bola.id"
      class="bola" :class="{ partida: cortes[bola.id] !== undefined }" hidden
      :data-bola="bola.id" aria-hidden="true">
      <span /><span />
    </div>

    <!-- Estallido en el punto de cada corte -->
    <div v-for="destello in destellos" :key="destello.id" class="destello"
      :style="{ left: destello.x + 'px', top: destello.y + 'px' }" aria-hidden="true">
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

    <button ref="hachaEl" type="button" class="hacha" :class="{ moviendo: giro !== 0 }" :disabled="cantidad === bolas.length"
      :style="{ rotate: giro + 'deg' }"
      :aria-label="t('Arrastra el hacha para cortar las bolas de energía. Con teclado, usa las flechas.')"
      @pointerdown="tomar" @keydown="teclado">
      <!-- Una sola pieza inclinada: el mango y la hoja giran juntos alrededor de la hoja (antes cada uno giraba sobre su propio centro y se desalineaban) -->
      <span class="arma" aria-hidden="true">
        <span class="mango" />
        <span class="hoja" />
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import AudioEfecto from '../audio/Efecto.vue'

// El movimiento visual (bolas, hacha, estela) va en su propio ciclo requestAnimationFrame y usa el tiempo
// real transcurrido. El reloj educativo (props.restante) ya no marca la fluidez: solo se usa para saber
// cuándo llegan las bolas al caballero (props.total).
const { t } = useLanguage()
const props = defineProps({
  pregunta: { type: Object, required: true },
  nivel: { type: Number, required: true },
  restante: { type: Number, required: true },
  total: { type: Number, required: true },
  pausado: Boolean,
  sinLimite: Boolean,
  // Referencia temporal compartida con el reloj educativo (segundos efectivos sin pausas) y su estado de pausa.
  tiempoActivo: { type: Function, default: null },
  detenido: { type: Function, default: null }
})
const emit = defineEmits(['cortar'])

const bolas = [
  { id: 0, salida: .45, altura: 56 },
  { id: 1, salida: 1.6, altura: 68 },
  { id: 2, salida: 2.75, altura: 45 }
]
const DURACION_SIN_LIMITE = 20
const colores = ['#ffad55', '#9fee68', '#8ed9ff', '#ff8267']
const textosCorte = ['¡Corte!', '¡Doble!', '¡Triple!']
const arena = ref(null)
const hachaEl = ref(null)
const rastroAncho = ref(null)
const rastroNucleo = ref(null)
const cortes = ref({})
const destellos = ref([])
const giro = ref(0)
const cantidad = computed(() => Object.keys(cortes.value).length)

// Estado de alta frecuencia: variables normales, no reactivas.
const medida = { escala: 1, ancho: 0, alto: 0, izq: 0, arriba: 0, radioBola: 20, ancho_hacha: 76, alto_hacha: 76 }
const hacha = { x: .34, y: .76 } // fracciones del campo (se conserva al girar la pantalla)
let anterior = { x: 0, y: 0 }
const estadoBolas = bolas.map((b) => ({ ...b, el: null, x: 0, y: 0, visible: false, peligro: false }))
let transcurrido = 0
let ultimoCuadro = 0
let cuadro = 0
let puntero = null
let agarre = { x: 0, y: 0 }
let movimientoPendiente = null
let cuadroMovimiento = 0
let puntos = []
let ultimoMovimiento = 0
let temporizadorGiro = 0
let idDestello = 0
const temporizadores = new Set()
let observador = null
const referenciasBola = Object.fromEntries(bolas.map((b) => [b.id, (el) => { estadoBolas[b.id].el = el }]))

const duracion = () => (props.sinLimite ? DURACION_SIN_LIMITE : props.total)

// Posición horizontal (0..1 del campo) de una bola en el instante t. Llega al caballero al terminar la duración.
function progresoBola(bola, t) {
  return Math.max(0, Math.min(1, (t - bola.salida) / (duracion() - bola.salida)))
}
const posX = (bola, t) => (77 - 53 * progresoBola(bola, t)) / 100

function medir() {
  const el = arena.value
  if (!el) return
  const r = el.getBoundingClientRect()
  // Si algún ancestro está escalado (cámara de la escena), el rectángulo visible no coincide con las unidades
  // locales de translate3d: se calcula la escala y se trabaja siempre en unidades locales.
  const anchoLocal = el.offsetWidth || r.width
  medida.escala = anchoLocal ? r.width / anchoLocal || 1 : 1
  medida.ancho = anchoLocal; medida.alto = el.offsetHeight || r.height; medida.izq = r.left; medida.arriba = r.top
  const b = estadoBolas.find((e) => e.el)?.el
  if (b) medida.radioBola = (b.offsetWidth || 40) / 2
  if (hachaEl.value) { medida.ancho_hacha = hachaEl.value.offsetWidth || 76; medida.alto_hacha = hachaEl.value.offsetHeight || 76 }
  colocarHacha()
}

function colocarHacha() {
  if (!hachaEl.value) return
  hachaEl.value.style.transform = `translate3d(${hacha.x * medida.ancho}px, ${hacha.y * medida.alto}px, 0)`
}

function pintarBolas() {
  for (const b of estadoBolas) {
    const el = b.el
    if (!el) continue
    const visible = transcurrido >= b.salida
    if (visible !== b.visible) { b.visible = visible; el.hidden = !visible }
    if (!visible) continue
    if (cortes.value[b.id] === undefined) {
      b.x = posX(b, transcurrido) * medida.ancho
      b.y = b.altura / 100 * medida.alto
      el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`
      const peligro = posX(b, transcurrido) < .42
      if (peligro !== b.peligro) { b.peligro = peligro; el.classList.toggle('peligro', peligro) }
    }
  }
}

// Pausa manual, ayuda abierta o pestaña oculta: no avanzan los proyectiles, no hay colisiones ni se aceptan cortes.
const bloqueado = () => props.pausado || (props.detenido ? props.detenido() : document.hidden)
const inicioReloj = props.tiempoActivo ? props.tiempoActivo() : 0

function bucle(ahora) {
  cuadro = requestAnimationFrame(bucle)
  const dt = ultimoCuadro ? (ahora - ultimoCuadro) / 1000 : 0
  ultimoCuadro = ahora
  if (!bloqueado() && cantidad.value < bolas.length) {
    // El tiempo sale del mismo reloj que el educativo (misma política de recuperación tras bloqueos del navegador).
    if (props.tiempoActivo) transcurrido = Math.max(transcurrido, props.tiempoActivo() - inicioReloj)
    else transcurrido += Math.min(dt, .5)
  }
  pintarBolas()
}

function borrarRastro() {
  puntos = []
  rastroAncho.value?.setAttribute('points', '')
  rastroNucleo.value?.setAttribute('points', '')
}

function marcarRastro(x, y) {
  puntos.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  if (puntos.length > 10) puntos.shift()
  const lista = puntos.join(' ')
  rastroAncho.value?.setAttribute('points', lista)
  rastroNucleo.value?.setAttribute('points', lista)
  ultimoMovimiento = performance.now()
}

function inclinar(dx) {
  giro.value = Math.round(Math.max(-18, Math.min(18, dx * 0.9)))
  clearTimeout(temporizadorGiro)
  temporizadorGiro = setTimeout(() => { giro.value = 0 }, 110)
}

function estallar(x, y) {
  const destello = { id: ++idDestello, x, y, texto: textosCorte[Math.min(cantidad.value, bolas.length) - 1] }
  destellos.value = [...destellos.value.slice(-2), destello] // como máximo tres destellos a la vez
  const temporizador = setTimeout(() => {
    destellos.value = destellos.value.filter((d) => d.id !== destello.id)
    temporizadores.delete(temporizador)
  }, 800)
  temporizadores.add(temporizador)
}

function tomar(evento) {
  if (puntero !== null || evento.button !== 0 || cantidad.value === bolas.length || bloqueado()) return
  evento.currentTarget.setPointerCapture?.(evento.pointerId)
  puntero = evento.pointerId
  medir() // una sola lectura de geometría por gesto
  agarre = {
    x: (evento.clientX - medida.izq) / medida.escala - hacha.x * medida.ancho,
    y: (evento.clientY - medida.arriba) / medida.escala - hacha.y * medida.alto
  }
  anterior = { x: hacha.x * medida.ancho, y: hacha.y * medida.alto }
}

function mover(evento) {
  if (puntero !== evento.pointerId || cantidad.value === bolas.length) return
  movimientoPendiente = evento
  if (cuadroMovimiento) return
  cuadroMovimiento = requestAnimationFrame(() => {
    cuadroMovimiento = 0
    const m = movimientoPendiente
    movimientoPendiente = null
    if (m) procesarMovimiento(m)
  })
}

function distanciaCuadrada(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const l2 = dx * dx + dy * dy
  const p = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2))
  const ex = px - (x1 + p * dx)
  const ey = py - (y1 + p * dy)
  return ex * ex + ey * ey
}

function mueveHacha(destinoX, destinoY) {
  const x = Math.max(0, Math.min(medida.ancho, destinoX))
  const y = Math.max(0, Math.min(medida.alto, destinoY))
  const dx = x - anterior.x
  const dy = y - anterior.y
  hacha.x = x / medida.ancho
  hacha.y = y / medida.alto
  colocarHacha()
  const ox = medida.ancho_hacha * .1
  const oy = -medida.alto_hacha * .24
  if (dx !== 0 || dy !== 0) { marcarRastro(x + ox, y + oy); inclinar(dx) }
  // Barrido del segmento recorrido por la hoja contra la posición actual de cada bola: no se «atraviesa» un objetivo.
  const radio = medida.radioBola + medida.ancho_hacha * .21
  for (const b of estadoBolas) {
    if (transcurrido < b.salida || cortes.value[b.id] !== undefined) continue
    const bx = posX(b, transcurrido) * medida.ancho
    const by = b.altura / 100 * medida.alto
    if (distanciaCuadrada(bx, by, anterior.x + ox, anterior.y + oy, x + ox, y + oy) > radio * radio) continue
    cortes.value = { ...cortes.value, [b.id]: bx }
    estallar(bx, by)
    if (b.el) b.el.style.transform = `translate3d(${bx}px, ${by}px, 0)`
  }
  anterior = { x, y }
  if (cantidad.value === bolas.length) emit('cortar')
}

function procesarMovimiento(evento) {
  if (puntero !== evento.pointerId || cantidad.value === bolas.length || !medida.ancho || bloqueado()) return
  mueveHacha((evento.clientX - medida.izq) / medida.escala - agarre.x, (evento.clientY - medida.arriba) / medida.escala - agarre.y)
}

function soltar(evento) {
  if (cuadroMovimiento) { cancelAnimationFrame(cuadroMovimiento); cuadroMovimiento = 0; movimientoPendiente = null }
  if (puntero === evento.pointerId) procesarMovimiento(evento)
  cancelar(evento)
}

function cancelar(evento) {
  if (puntero !== evento.pointerId) return
  if (cuadroMovimiento) cancelAnimationFrame(cuadroMovimiento)
  cuadroMovimiento = 0
  movimientoPendiente = null
  puntero = null
  setTimeout(borrarRastro, 140)
}

// Alternativa sin puntero: las flechas desplazan el hacha a saltos del 6 % del campo y cortan lo que cruzan.
function teclado(evento) {
  const paso = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[evento.key]
  if (!paso || cantidad.value === bolas.length || bloqueado()) return
  evento.preventDefault()
  if (!medida.ancho) medir()
  anterior = { x: hacha.x * medida.ancho, y: hacha.y * medida.alto }
  mueveHacha(anterior.x + paso[0] * medida.ancho * .06, anterior.y + paso[1] * medida.alto * .06)
}

onMounted(() => {
  medir()
  // Reutiliza la medida del campo; solo se vuelve a leer al cambiar su tamaño u orientación.
  if (typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(medir)
    observador.observe(arena.value)
  }
  window.addEventListener('orientationchange', medir)
  cuadro = requestAnimationFrame(bucle)
})

watch(() => props.pausado, (activo) => { if (activo && puntero !== null) { puntero = null; borrarRastro() } })

onBeforeUnmount(() => {
  cancelAnimationFrame(cuadro)
  if (cuadroMovimiento) cancelAnimationFrame(cuadroMovimiento)
  observador?.disconnect()
  window.removeEventListener('orientationchange', medir)
  clearTimeout(temporizadorGiro)
  temporizadores.forEach((x) => clearTimeout(x))
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
.rastro polyline { fill: none; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.rastro .ancho { stroke: var(--energia); stroke-width: 9px; opacity: .45; }
.rastro .nucleo { stroke: #fff4d2; stroke-width: 3px; }

/* Bolas de energía */
.bola {
  position: absolute;
  width: clamp(30px, 6vw, 58px);
  aspect-ratio: 1;
  left: 0;
  top: 0;
  translate: -50% -50%;
  will-change: transform;
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
  left: 0;
  top: 0;
  will-change: transform;
  width: clamp(76px, 13vmin, 108px);
  aspect-ratio: 1;
  translate: -50% -50%;
  /* El giro y la escala pivotan sobre la hoja (≈ 59,5 % / 26,5 %): es el punto que usa la colisión */
  transform-origin: 59.5% 26.5%;
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
.arma { inset: 0; rotate: 31deg; transform-origin: 59.5% 26.5%; }
.mango {
  width: 10%;
  height: 76%;
  left: 45%;
  top: 12%;
  border-radius: 3px;
  background: linear-gradient(90deg, #452619, #c29158 58%, #67402b);
}
.hoja {
  width: 61%;
  height: 47%;
  left: 29%;
  top: 3%;
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
