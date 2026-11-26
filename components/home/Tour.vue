<!--
  Tour.vue - Recorrido guiado sobre la pantalla principal (sin dependencias externas).
  · Oscurece el fondo y deja iluminado solo el botón real que se explica (recuadro con sombra gigante).
  · Una capa transparente a pantalla completa intercepta los toques: los botones destacados no se activan.
  · Se re-mide el botón con resize/orientationchange/ResizeObserver y un temporizador ligero, así que sigue al
    botón aunque se mueva (animación de entrada del menú, giro del móvil, cambio de tamaño del texto).
  · Teclado: Flecha derecha / Intro = Siguiente, Flecha izquierda = Anterior, Esc = omitir. El foco queda atrapado en la tarjeta.
-->
<template>
  <Teleport to="body">
    <div class="tour" role="dialog" aria-modal="true" aria-labelledby="tour-titulo" aria-describedby="tour-texto" @keydown="teclado">
      <div class="bloqueo" aria-hidden="true" @click.stop.prevent @pointerdown.stop.prevent />
      <div v-if="marco" class="foco" :style="marco" aria-hidden="true" />
      <div v-else class="velo" aria-hidden="true" />
      <section ref="tarjeta" class="tarjeta-tour" :style="posTarjeta">
        <p class="paso">{{ t('Paso') }} {{ indice + 1 }} / {{ pasos.length }}</p>
        <h2 id="tour-titulo">{{ t(paso.titulo) }}</h2>
        <p id="tour-texto">{{ t(paso.texto) }}</p>
        <div class="acciones">
          <button type="button" class="b-omitir" @click="terminar">{{ t('Omitir') }}</button>
          <span class="espacio" />
          <button type="button" class="b-sec" :disabled="indice === 0" @click="anterior">{{ t('Anterior') }}</button>
          <button ref="botonSiguiente" type="button" class="b-pri" @click="siguiente">{{ t(indice === pasos.length - 1 ? 'Finalizar' : 'Siguiente') }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['fin'])
const { t } = useLanguage()
// El orden del recorrido es el pedido: Comenzar, Cómo jugar, Opciones, Créditos, Contenidos.
const pasos = [
  { id: 'comenzar', titulo: 'Comenzar aventura', texto: 'Comienza tu aventura, explora el reino y enfréntate a los guardianes mientras pones en práctica tus conocimientos de inglés.' },
  { id: 'como-jugar', titulo: 'Cómo jugar', texto: 'Conoce los controles, las mecánicas de combate y las acciones que podrás realizar durante tu aventura.' },
  { id: 'opciones', titulo: 'Opciones', texto: 'Personaliza el sonido, los gráficos y las opciones de accesibilidad para adaptar el juego a tus necesidades.' },
  { id: 'creditos', titulo: 'Créditos', texto: 'Conoce a los integrantes que desarrollaron este objeto virtual de aprendizaje.' },
  { id: 'contenidos', titulo: 'Contenidos', texto: 'Estudia las temáticas, consulta ejemplos, realiza actividades complementarias y accede a recursos educativos antes de enfrentarte a los guardianes.' }
]
const indice = ref(0)
const paso = computed(() => pasos[indice.value])
const marco = ref(null)
const posTarjeta = ref({})
const tarjeta = ref(null)
const botonSiguiente = ref(null)
let observador = null
let temporizador = 0
let elementoPrevio = null

function medir() {
  const el = document.querySelector(`[data-tour="${paso.value.id}"]`)
  const vw = window.innerWidth, vh = window.innerHeight
  const caja = tarjeta.value
  const w = caja?.offsetWidth || Math.min(360, vw - 24), h = caja?.offsetHeight || 190
  if (!el) { marco.value = null; posTarjeta.value = { left: `${(vw - w) / 2}px`, top: `${Math.max(12, (vh - h) / 2)}px` }; return }
  const r = el.getBoundingClientRect()
  const pad = 8
  marco.value = { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` }
  // Colocación: a la derecha del botón si cabe; si no, debajo; si no, encima. Siempre dentro de la pantalla.
  const m = 12
  let left, top
  if (r.right + pad + m + w <= vw - m) { left = r.right + pad + m; top = r.top + r.height / 2 - h / 2 }
  else if (r.bottom + pad + m + h <= vh - m) { left = r.left + r.width / 2 - w / 2; top = r.bottom + pad + m }
  else { left = r.left + r.width / 2 - w / 2; top = r.top - pad - m - h }
  left = Math.min(Math.max(m, left), Math.max(m, vw - w - m))
  top = Math.min(Math.max(m, top), Math.max(m, vh - h - m))
  posTarjeta.value = { left: `${left}px`, top: `${top}px` }
}
function observar() {
  observador?.disconnect()
  const el = document.querySelector(`[data-tour="${paso.value.id}"]`)
  if (el && typeof ResizeObserver !== 'undefined') { observador = new ResizeObserver(medir); observador.observe(el) }
}
watch(indice, () => { observar(); nextTick(medir) })

const siguiente = () => { if (indice.value < pasos.length - 1) indice.value++; else terminar() }
const anterior = () => { if (indice.value > 0) indice.value-- }
function terminar() { emit('fin') }

function teclado(e) {
  if (e.key === 'ArrowRight') { e.preventDefault(); siguiente() }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); anterior() }
  else if (e.key === 'Escape') { e.preventDefault(); terminar() }
  else if (e.key === 'Tab') {
    // Foco atrapado dentro de la tarjeta
    const focos = [...tarjeta.value.querySelectorAll('button:not(:disabled)')]
    if (!focos.length) return
    const primero = focos[0], ultimo = focos[focos.length - 1]
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus() }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus() }
  }
}

onMounted(() => {
  elementoPrevio = document.activeElement
  medir(); observar()
  window.addEventListener('resize', medir)
  window.addEventListener('orientationchange', medir)
  // Re-medida ligera (4 veces por segundo): sigue al botón durante la animación de entrada del menú.
  temporizador = window.setInterval(medir, 250)
  nextTick(() => { medir(); botonSiguiente.value?.focus({ preventScroll: true }) })
})
onBeforeUnmount(() => {
  observador?.disconnect()
  window.removeEventListener('resize', medir)
  window.removeEventListener('orientationchange', medir)
  clearInterval(temporizador)
  elementoPrevio?.focus?.({ preventScroll: true })
})
</script>

<style scoped>
.tour { position: fixed; inset: 0; z-index: 99999; }
.bloqueo { position: absolute; inset: 0; z-index: 3; background: transparent; cursor: default; touch-action: none; }
.foco { position: fixed; z-index: 1; border-radius: 14px; border: 2px solid #ffe09a; box-shadow: 0 0 0 100vmax #040810b8, 0 0 18px 2px #ffd66b88; pointer-events: none; transition: left .25s ease, top .25s ease, width .25s ease, height .25s ease; }
.velo { position: absolute; inset: 0; background: #040810b8; }
.tarjeta-tour { position: fixed; z-index: 4; width: min(360px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow-y: auto; padding: 1rem 1.1rem; color: #f7edda; border: 1px solid #b68a48; border-radius: 12px; background: linear-gradient(145deg, #30271f, #121a29 80%); box-shadow: 0 14px 40px #000b; }
.paso { margin: 0; color: #e8bd71; font: 800 .75rem system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; }
h2 { margin: .2rem 0 .4rem; color: #ffe09a; font: 800 1.25rem Georgia, serif; }
#tour-texto { margin: 0 0 .8rem; line-height: 1.45; font-size: .98rem; }
.acciones { display: flex; align-items: center; gap: .5rem; }
.espacio { flex: 1; }
button { min-height: 44px; padding: 0 .9rem; font: 700 .95rem system-ui, sans-serif; border-radius: 8px; cursor: pointer; }
button:focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }
.b-pri { color: #2a1d08; background: #ffe09a; border: 1px solid #ffe09a; }
.b-sec { color: #ffe09a; background: transparent; border: 1px solid #b3955c; }
.b-sec:disabled { opacity: .4; cursor: default; }
.b-omitir { color: #d3cbbb; background: transparent; border: 0; text-decoration: underline; padding: 0 .3rem; }
@media (prefers-reduced-motion: reduce) { .foco { transition: none; } }
:global([data-movimiento='reducido']) .foco { transition: none; }
</style>
