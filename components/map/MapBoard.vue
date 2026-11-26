<!--
  MapBoard.vue - El Reino como aventura, no como menú.
  · Un camino dorado une los destinos: lo recorrido brilla, el siguiente tramo avanza como hormigas de luz y lo desconocido queda en niebla.
  · El caballero camina de verdad por el camino: al tocar un destino viaja hasta allí y recién entonces se abre la misión;
    al volver de una victoria avanza solo hasta la siguiente zona.
  · Cada destino es el medallón de su guardián (silueta si está bloqueado, gris si ya fue derrotado).
  Es solo presentación: el combate, el progreso y las preguntas no se tocan.
-->
<template>
  <nav class="mapa" :aria-label="t('Zonas del reino')">
    <img class="ilustracion" :src="language === 'en' ? '/images/mapa-del-reino-en.svg' : '/images/mapa-del-reino.svg'" alt="" />

    <!-- Ambiente: nubes y luciérnagas (se ocultan en calidad Lite o con movimiento reducido) -->
    <div class="ambiente" aria-hidden="true">
      <i class="nube n1" /><i class="nube n2" /><i class="nube n3" />
      <i v-for="(l, n) in luciernagas" :key="n" class="luciernaga" :style="l" />
    </div>

    <svg class="ruta" viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="resplandor" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
        <radialGradient id="niebla-grad"><stop offset="0" stop-color="#cfd9e8" stop-opacity=".85" /><stop offset="1" stop-color="#cfd9e8" stop-opacity="0" /></radialGradient>
      </defs>
      <g v-for="s in segmentos" :key="s.n">
        <path :d="s.d" class="lecho" />
        <path v-if="s.estado === 'completada'" :d="s.d" class="brillo" filter="url(#resplandor)" />
        <path :ref="(el) => (rutas[s.n] = el)" :d="s.d" class="linea" :class="s.estado" />
      </g>
      <ellipse v-for="n in nieblas" :key="`n${n}`" class="niebla" :cx="px(n)" :cy="py(n)" rx="95" ry="62" fill="url(#niebla-grad)" />
    </svg>

    <MapZone
      v-for="nivel in niveles"
      :key="nivel.numero"
      :nivel="nivel"
      :estado="estadoDe(nivel.numero)"
      :estrellas="estrellasDe(nivel.numero)"
      :aqui="heroeEn === nivel.numero"
      :style="{ left: `${POS[nivel.numero - 1][0]}%`, top: `${POS[nivel.numero - 1][1]}%` }"
      @elegir="viajar"
    />

    <!-- El caballero -->
    <div class="heroe" :class="{ camina: caminando, atras: mirando < 0 }" :style="{ left: `${heroe.x / 10}%`, top: `${heroe.y / 6.4}%` }" aria-hidden="true">
      <span class="sombra" />
      <img src="/images/personajes-mate/caballero/reposo-lite.webp" alt="" decoding="async" />
    </div>

    <!-- Diario del viaje: qué sigue, sin leer párrafos -->
    <button v-if="objetivo" type="button" class="objetivo" @click="viajar(objetivo.numero)">
      <span class="obj-icono" aria-hidden="true">{{ completo ? '🏆' : '🧭' }}</span>
      <span class="obj-texto">
        <small>{{ completo ? t('¡Reino salvado!') : t('Próxima aventura') }}</small>
        <strong>{{ completo ? t('La última prueba del reino') : objetivo.nombre }}</strong>
      </span>
      <span class="obj-progreso" aria-hidden="true"><i v-for="n in niveles.length" :key="n" :class="{ hecho: n < nivelDesbloqueado }" /></span>
    </button>
  </nav>
</template>

<script setup>
const props = defineProps({
  niveles: { type: Array, required: true },
  nivelDesbloqueado: { type: Number, required: true }
})
const emit = defineEmits(['elegir'])
const { language, t } = useLanguage()
const store = usePlayerProgress()

// Posición de cada destino (en % del mapa); el dibujo mide 1000 × 640.
const POS = [[21, 72], [55, 57], [81, 63], [75, 35], [44, 28]]
const px = (n) => POS[n - 1][0] * 10
const py = (n) => POS[n - 1][1] * 6.4

// Camino: una curva suave (Catmull-Rom) por los destinos, con un meandro en cada tramo para que parezca un sendero real.
const segmentos = computed(() => {
  const nodos = POS.slice(0, Math.max(props.niveles.length, 2)).map((_, i) => [px(i + 1), py(i + 1)])
  const lista = []
  nodos.forEach((p, i) => {
    lista.push(p)
    const q = nodos[i + 1]
    if (!q) return
    const dx = q[0] - p[0]; const dy = q[1] - p[1]
    const largo = Math.hypot(dx, dy) || 1
    const lado = i % 2 === 0 ? 1 : -1
    lista.push([(p[0] + q[0]) / 2 - (dy / largo) * 34 * lado, (p[1] + q[1]) / 2 + (dx / largo) * 34 * lado])
  })
  const g = (i) => lista[Math.min(Math.max(i, 0), lista.length - 1)]
  const curva = (i) => {
    const [p0, p1, p2, p3] = [g(i - 1), g(i), g(i + 1), g(i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    return `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return nodos.slice(0, -1).map((p, k) => {
    const i = k * 2
    const estado = k + 1 < props.nivelDesbloqueado ? 'completada' : k + 1 === props.nivelDesbloqueado ? 'actual' : 'bloqueada'
    return { n: k + 1, estado, d: `M${p[0]} ${p[1]} ${curva(i)} ${curva(i + 1)}` }
  })
})
const rutas = []

const nieblas = computed(() => props.niveles.map((z) => z.numero).filter((n) => n > props.nivelDesbloqueado))
const estadoDe = (n) => (n < props.nivelDesbloqueado ? 'completada' : n === props.nivelDesbloqueado ? 'disponible' : 'bloqueada')
const estrellasDe = (n) => store.estado.progreso.niveles?.[n]?.estrellas ?? 0

const luciernagas = Array.from({ length: 9 }, (_, i) => ({
  left: `${(i * 37 + 11) % 92 + 3}%`, top: `${(i * 53 + 17) % 80 + 8}%`,
  animationDelay: `${(i % 5) * -1.3}s`, animationDuration: `${5 + (i % 4)}s`
}))

const completo = computed(() => props.nivelDesbloqueado > props.niveles.length)
const objetivo = computed(() => props.niveles.find((z) => z.numero === Math.min(props.nivelDesbloqueado, props.niveles.length)))

// ── El caballero camina por el sendero ──────────────────────────────────────────────────────────────
const posicionGuardada = useState('eq-mapa-heroe', () => 0) // último destino donde descansó el caballero
const heroeEn = ref(0)
const heroe = reactive({ x: px(1), y: py(1) })
const caminando = ref(false)
const mirando = ref(1)
let cuadro = 0
let cancelado = false

function ponerEn(n) {
  heroe.x = px(n); heroe.y = py(n); heroeEn.value = n
}

// Recorre los tramos entre dos destinos moviendo al caballero sobre la curva real del camino.
function caminar(desde, hasta, rapido = false) {
  return new Promise((resolver) => {
    if (store.estado.ajustes.movimiento === 'reducido' || (store.estado.ajustes.movimiento === 'sistema' && typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { ponerEn(hasta); resolver(); return }
    const tramos = []
    if (hasta > desde) for (let n = desde; n < hasta; n++) tramos.push({ el: rutas[n], atras: false })
    else for (let n = desde - 1; n >= hasta; n--) tramos.push({ el: rutas[n], atras: true })
    if (!tramos.length || tramos.some((x) => !x.el?.getTotalLength) || typeof requestAnimationFrame === 'undefined') { ponerEn(hasta); resolver(); return }
    tramos.forEach((x) => { x.largo = x.el.getTotalLength() })
    const total = tramos.reduce((a, x) => a + x.largo, 0)
    // Misiones ya completadas: el trayecto es breve (no se repite la caminata larga cada vez que se repasa una zona).
    const duracion = rapido ? Math.min(850, Math.max(320, total * 1.3)) : Math.min(2600, Math.max(650, total * 3.6))
    const inicio = performance.now()
    caminando.value = true
    heroeEn.value = 0
    let antes = null
    const paso = (ahora) => {
      if (cancelado) { caminando.value = false; resolver(); return }
      const k = Math.min(1, (ahora - inicio) / duracion)
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2 // empieza y termina suave
      let d = e * total
      let tramo = tramos[0]
      for (const x of tramos) { tramo = x; if (d <= x.largo) break; d -= x.largo }
      const local = Math.min(Math.max(d, 0), tramo.largo)
      const p = tramo.el.getPointAtLength(tramo.atras ? tramo.largo - local : local)
      if (antes && Math.abs(p.x - antes.x) > 0.2) mirando.value = p.x > antes.x ? 1 : -1
      antes = { x: p.x, y: p.y }
      heroe.x = p.x; heroe.y = p.y
      if (k < 1) cuadro = requestAnimationFrame(paso)
      else { caminando.value = false; ponerEn(hasta); resolver() }
    }
    cuadro = requestAnimationFrame(paso)
  })
}

let viajando = false
async function viajar(n) {
  if (viajando) return
  // Zona bloqueada: el caballero no se mueve, la ficha explica qué falta.
  if (n > props.nivelDesbloqueado) { emit('elegir', n); return }
  const destino = Math.min(n, props.niveles.length)
  viajando = true
  const origen = heroeEn.value || posicionGuardada.value || destino
  if (origen !== destino) await caminar(origen, destino, destino < props.nivelDesbloqueado)
  posicionGuardada.value = destino
  viajando = false
  if (!cancelado) emit('elegir', n)
}

async function iniciar() {
  const meta = Math.min(Math.max(props.nivelDesbloqueado, 1), props.niveles.length)
  const previo = posicionGuardada.value
  if (!previo || previo === meta) { ponerEn(meta); posicionGuardada.value = meta; return }
  // Volvió de una batalla: el caballero avanza solo hasta el nuevo destino.
  ponerEn(previo)
  await new Promise((r) => setTimeout(r, 900))
  if (cancelado) return
  viajando = true
  await caminar(previo, meta)
  viajando = false
  posicionGuardada.value = meta
}
// El progreso guardado se lee en el navegador; se espera a que esté cargado para colocar al caballero donde corresponde.
onMounted(() => {
  if (store.estado.cargado) { iniciar(); return }
  const parar = watch(() => store.estado.cargado, (listo) => { if (listo) { parar(); iniciar() } })
})
onBeforeUnmount(() => { cancelado = true; if (cuadro) cancelAnimationFrame(cuadro) })
</script>

<style scoped>
.mapa {
  position: relative; container-type: inline-size;
  border: 1px solid #be9348; border-radius: 18px; overflow: hidden; background: #101c32;
  box-shadow: 0 12px 35px #0009, inset 0 0 60px #0007;
}
.ilustracion { display: block; width: 100%; height: auto; aspect-ratio: 1000 / 640; }
.mapa::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 55%, #050a1599 100%); }

/* Camino */
.ruta { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
.ruta path { fill: none; stroke-linecap: round; stroke-linejoin: round; }
.lecho { stroke: #1b2a2e; stroke-width: 11; opacity: .6; }
.brillo { stroke: #ffd98a; stroke-width: 9; opacity: .7; }
.linea.completada { stroke: #ffe3a0; stroke-width: 4.5; }
.linea.actual { stroke: #fff0c2; stroke-width: 4; stroke-dasharray: 2 13; animation: hormigas 1.1s linear infinite; filter: drop-shadow(0 0 4px #ffd98a); }
.linea.bloqueada { stroke: #9aa7ba; stroke-width: 3; stroke-dasharray: 1 11; opacity: .4; }
@keyframes hormigas { to { stroke-dashoffset: -15; } }
.niebla { animation: bruma 7s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: center; }
@keyframes bruma { from { opacity: .55; transform: scale(.94); } to { opacity: .95; transform: scale(1.08); } }

/* Ambiente */
.ambiente { position: absolute; inset: 0; pointer-events: none; z-index: 2; overflow: hidden; }
.nube { position: absolute; left: -30%; width: 28%; height: 11%; border-radius: 50%; background: radial-gradient(ellipse, #ffffff2e, transparent 70%); animation: nube linear infinite; }
.n1 { top: 8%; animation-duration: 70s; }
.n2 { top: 44%; width: 36%; animation-duration: 95s; animation-delay: -40s; opacity: .8; }
.n3 { top: 76%; width: 24%; animation-duration: 80s; animation-delay: -15s; opacity: .7; }
@keyframes nube { to { translate: 460% 0; } }
.luciernaga { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #fff3b0; box-shadow: 0 0 8px 3px #ffe58a99; animation: luciernaga ease-in-out infinite alternate; }
@keyframes luciernaga { from { translate: 0 0; opacity: .1; } 50% { opacity: 1; } to { translate: 26px -22px; opacity: .2; } }

/* Caballero */
.heroe { position: absolute; z-index: 5; width: 7.2%; margin-left: -8.2%; transform: translate(-50%, -88%); transition: margin-left 400ms; pointer-events: none; }
.heroe img { display: block; width: 100%; height: auto; transition: scale 200ms; filter: drop-shadow(0 4px 4px #000a); }
.heroe.atras img { scale: -1 1; }
.heroe .sombra { position: absolute; left: 20%; right: 20%; bottom: 6%; height: 8%; border-radius: 50%; background: #0009; filter: blur(2px); }
.heroe.camina { margin-left: 0; }
.heroe.camina img { animation: paso 260ms ease-in-out infinite alternate; }
@keyframes paso { from { translate: 0 0; rotate: -3deg; } to { translate: 0 -7%; rotate: 3deg; } }

/* Diario de viaje */
.objetivo {
  position: absolute; left: 2.2%; bottom: 3.5%; z-index: 6; display: flex; align-items: center; gap: 10px;
  padding: 6px 12px 6px 8px; border: 1px solid #be9348; border-radius: 12px; color: #fff2cf; text-align: left; cursor: pointer;
  background: linear-gradient(135deg, #2a1d10f2, #101928f2); box-shadow: 0 6px 16px #000a; max-width: 46%;
}
.objetivo:hover, .objetivo:focus-visible { border-color: #ffe09a; box-shadow: 0 0 14px #ffd98a77, 0 6px 16px #000a; }
.obj-icono { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #0b1325; font-size: 18px; flex: none; }
.obj-texto { display: grid; min-width: 0; line-height: 1.2; }
.obj-texto small { color: #e1bf82; font: 800 .6rem system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; }
.obj-texto strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 700 clamp(.78rem, 1.6vw, 1rem) Georgia, serif; }
.obj-progreso { display: flex; gap: 4px; margin-inline-start: 4px; }
.obj-progreso i { width: 9px; height: 9px; transform: rotate(45deg); border: 1px solid #b68a48; background: #0b1325; }
.obj-progreso i.hecho { background: #ffd98a; box-shadow: 0 0 6px #ffd98a; }

@media (max-width: 700px), (max-height: 560px) { .objetivo { display: none; } }
@media (prefers-reduced-motion: reduce) {
  .nube, .luciernaga, .niebla, .linea.actual, .heroe.camina img { animation: none; }
}
</style>
