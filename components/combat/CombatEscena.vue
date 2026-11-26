<template>
  <div class="escenario" :class="[`nivel-${(nivel.numeroArte ?? nivel.numero)}`, { urgente, 'arena-esquiva': posicionEsquiva !== null, 'esquiva-exitosa': ataque?.esquivado }]" :style="{ '--fondo': `url('${levelBackground(nivel)}')`, '--carga': carga ?? 0, '--posicion-esquiva': posicionEsquiva === null ? null : posicionEsquiva + '%' }">
    <div class="secuencia" :class="[ataque?.id, ataque?.final && ataque.remate, { activa: ataque, 'esperando-audio': esperaSolar, magia: ataque?.magia, final: ataque?.final, urgente, congelado, oculta }]" :style="tiempos"
      @animationend.self="emit('terminar')">
      <span class="ambiente" aria-hidden="true">
        <span v-for="(m, i) in motas" :key="i" class="mota" :style="m" />
      </span>
      <div class="accion">
        <span v-if="ataque?.final" class="penumbra" aria-hidden="true" />
        <div class="luchador caballero" data-destino-palabra="heroe" :class="[caballero, { esperando, 'en-guardia': enGuardia, victoria, tenso: urgente, 'esquiva-lograda': ataque?.esquivado }]" role="img" :aria-label="t(sinArma ? 'Caballero sin arma' : 'Caballero con hacha y escudo solar')">
          <span v-if="furia" class="aura-furia" aria-hidden="true" />
          <span v-if="bloqueando" class="barrera-bloqueo" aria-hidden="true"><b>{{ t('¡Bloqueado!') }}</b></span>
          <img v-for="pose in montadasCaballero" v-show="!sinArma" :key="pose" class="pose"
            :class="pose" :style="estiloPose('caballero', pose)"
            :src="poseUrl('/images/personajes-mate/caballero', pose)" alt="" draggable="false" />
          <img v-if="sinArma" class="pose sin-arma" :style="estiloPose('caballero', 'sin-arma')" :src="imageUrl('/images/personajes-mate/caballero/sin-arma.webp')" alt="" draggable="false" />
          <template v-if="remateSolar">
            <span class="aura-solar" aria-hidden="true" />
            <img class="pose ascension" :style="estiloPose('caballero', 'impacto-rayo')" :src="imageUrl('/images/personajes-mate/caballero/impacto-rayo.png')" alt="" draggable="false" />
          </template>
        </div>
        <div class="luchador guardian" data-destino-palabra="monstruo" :class="[guardian, { esperando, 'con-derrota': nivel.derrota, c1: faseCarga === 1, c2: faseCarga === 2, 'desde-carga': cargaPrevia > 0 }]"
          :style="{ '--carga': carga ?? 0 }" role="img" :aria-label="nivel.guardian">
          <span v-if="enfurecido" class="aura-ira" aria-hidden="true" />
          <img v-for="pose in montadasGuardian" :key="pose" class="pose"
            :class="pose" :style="estiloPose(carpetaGuardian, pose)"
            :src="poseUrl(nivel.arte, pose)" alt="" draggable="false" />
          <!-- Chorro (veneno / aliento): nace en la boca del sprite «ataque» y viaja con el jefe, sin depender del tamaño de la escena -->
          <img v-if="ataqueRival && chorro && !ladoGolpe" class="chorro" :style="estiloPose(carpetaGuardian, 'ataque')" :class="`chorro-${(nivel.numeroArte ?? nivel.numero)}`" :src="imageUrl(chorro)" alt="" draggable="false" />
          <span class="onda-suelo" aria-hidden="true" />
          <span class="particulas-carga" aria-hidden="true">
            <span v-for="(p, i) in particulasCarga" :key="i" class="p" :style="p" />
          </span>
        </div>
        <template v-if="ataque?.final">
          <span class="rotulo-final" aria-hidden="true">{{ ataque.nombre }}</span>
          <div v-if="remateSolar" class="descarga-solar" :style="estiloPose('caballero', 'impacto-rayo')" aria-hidden="true">
            <span class="esfera-solar" />
            <span class="rayo-solar" />
          </div>
          <template v-if="remateSolar">
            <span class="pulso-solar pulso-transformacion" aria-hidden="true" @animationstart.self="iniciarTransformacion" />
            <span class="pulso-solar pulso-disparo" aria-hidden="true" @animationstart.self="esperarClipSolar" />
            <span class="pulso-solar pulso-carga" aria-hidden="true" @animationstart.self="encadenarCarga" />
          </template>
          <div v-if="remateCruzado" class="corte-cruzado" aria-hidden="true">
            <span class="tajo-cruzado primero" />
            <span class="tajo-cruzado segundo" />
          </div>
          <div v-if="remateSombras" class="invocacion-sombras" aria-hidden="true">
            <span class="portal-sombras" />
            <template v-for="i in 3" :key="i">
              <div class="guerrero-sombra" :style="{ '--fila': i - 2, '--adelanto': (3 - i) * 240 + 'ms' }">
                <img class="sombra-guardia" :src="imageUrl('/images/personajes-mate/caballero/guardia.webp')" alt="" draggable="false" />
                <img class="sombra-golpe" :src="imageUrl('/images/personajes-mate/caballero/impacto-hachazo.png')" alt="" draggable="false" />
              </div>
              <span class="impacto-sombras" :style="{
                '--contacto': 'calc(var(--momento-impacto) - ' + (3 - i) * 240 + 'ms)',
                '--altura-tajo': (45 + i * 5) + '%',
                '--giro-tajo': (i % 2 ? -38 : 28) + 'deg'
              }">
                <i v-for="chispa in 6" :key="chispa" class="chispa-sombra" :style="{ '--angulo': (chispa - 3) * 44 + 'deg' }" />
              </span>
            </template>
          </div>
          <template v-if="nivel.derrota">
            <span v-for="(estilo, i) in chispasFinal" :key="i" class="chispa-final" :style="estilo" aria-hidden="true" />
          </template>
        </template>
        <template v-if="ataque">
          <span class="pulso-impacto" aria-hidden="true" @animationstart.self="alImpactar" />
          <div v-if="ladoGolpe" class="zona-coletazo" :class="ladoGolpe" aria-hidden="true">
            <span class="advertencia-coletazo" />
            <img :src="nivel.efecto" alt="" />
          </div>
          <CombatEfectos v-else-if="!ataque.remate" :class="`nivel-${(nivel.numeroArte ?? nivel.numero)}`" :nivel="(nivel.numeroArte ?? nivel.numero)" :ataque="ataque" :estela="efecto"
            :dano="bloqueando ? null : danoAplicado" :curacion="curacion" />
        </template>
      </div>
      <!-- Profundidad: niebla baja y partículas que pasan por delante de los luchadores -->
      <span class="bruma-frontal" aria-hidden="true" />
      <span class="polvo-frontal" aria-hidden="true">
        <span v-for="(m, i) in primerPlano" :key="i" class="mota-frontal" :style="m" />
      </span>
    </div>
    <slot name="actividad" />
    <span v-if="ataque?.lado && danoAplicado !== null" class="resultado-esquiva"
      :class="{ acierto: ataque.esquivado }" role="status">
      {{ ataque.esquivado ? t('¡Esquiva! · Contraataca') : '−' + danoAplicado + ' ' + t('PV') }}
    </span>
    <span v-if="vidaBaja" class="vida-baja" aria-hidden="true" />
    <span class="peligro" aria-hidden="true" />
  </div>
</template>

<script setup>
import medidasPoses from '~/data/medidas-poses.json'

const { t } = useLanguage()
const { imageUrl, levelBackground, prepareImages, levelEssentials, levelPriorities, quality, assets } = useGameGraphics()
import { PRIORIDAD } from '~/composables/useAssetManager.js'
const props = defineProps({
  nivel: { type: Object, required: true },
  ataque: { type: Object, default: null },
  danoAplicado: { type: Number, default: null },
  curacion: { type: Number, default: 0 },
  posicionEsquiva: { type: Number, default: null },
  ladoGolpe: { type: String, default: null },
  sinArma: Boolean,
  vidaCaballero: { type: Number, required: true },
  vidaRival: { type: Number, required: true },
  // Furia al máximo (aura dorada en el caballero), guardián en su segunda fase y bloqueo del contraataque
  furia: Boolean,
  enfurecido: Boolean,
  bloqueado: Boolean,
  // Progreso de la carga del enemigo mientras el estudiante piensa (0 a 1). null cuando no hay pregunta en curso.
  carga: { type: Number, default: null }
})
const emit = defineEmits(['impactar', 'terminar'])
const posesReaccion = ['retroceso', 'dolor', 'tambaleo', 'recuperacion', 'caida']
const posesCaballero = [
  'reposo', 'preparacion-hachazo', 'impacto-hachazo',
  'preparacion-barrido', 'impacto-barrido', 'preparacion-escudo', 'impacto-escudo',
  'preparacion-rayo', 'impacto-rayo', 'preparacion-fenix', 'impacto-fenix',
  'salida-hachazo', 'salida-barrido', 'salida-escudo', 'salida-magia', ...posesReaccion
]
// Los cuadros intermedios «tw-*» (mezclas translúcidas de dos poses) ya no se usan: al verse a la vez dos siluetas
// el golpe parecía superpuesto. Ahora solo hay una pose visible en cada instante y el movimiento lo da el desplazamiento.
const posesGuardian = ['reposo', 'preparacion', 'impacto', ...posesReaccion]
// Poses nuevas: vienen recortadas a su tamaño real, no en el lienzo fijo de las poses de reposo.
const posesNuevasCaballero = ['guardia', 'final-1', 'final-2', 'final-3', 'golpeado', 'anticipacion', 'esquiva']
const posesNuevasGuardian = computed(() => ['carga-1', 'carga-2', 'ataque', ...(props.nivel.derrota ? ['derrota-1', 'derrota-2'] : [])])
const nuevas = new Set([...posesNuevasCaballero, 'carga-1', 'carga-2', 'ataque', 'derrota-1', 'derrota-2'])
const extension = (pose) => (nuevas.has(pose) ? 'webp' : 'png')
// Las poses visibles al comenzar ya se prepararon durante la transición.
const listas = reactive(new Set(levelEssentials(props.nivel)))
const colaPoses = new AbortController()
let tokenNivel = null
const ambitoNivel = () => `nivel-${props.nivel.numero}`

// Preparadas ≠ montadas ≠ visibles. Solo se montan en el DOM las poses de reposo/estado (siempre posibles) y las que
// necesita el golpe en curso; el resto está preparado (decodificado) pero no ocupa nodos ni capas de composición.
const baseCaballero = ['reposo', 'guardia', 'dolor', 'caida', 'final-3']
const baseGuardian = computed(() => ['reposo', 'dolor', 'caida', 'carga-1', 'carga-2', ...(props.nivel.derrota ? ['derrota-2'] : [])])
function necesaria(esHeroe, pose) {
  const golpe = props.ataque
  if (!golpe) return false
  const recibe = esHeroe === (golpe.id === 'rival')
  return recibe
    ? posesReaccion.includes(pose) || ['golpeado', 'esquiva', 'derrota-1', 'derrota-2'].includes(pose)
    : golpe.id === 'rival'
      ? ['preparacion', 'impacto', 'ataque', 'recuperacion'].includes(pose) // el guardián ataca desde su carga
      : pose.includes(golpe.id) || ['anticipacion', 'salida-magia'].includes(pose) ||
        (golpe.final && /^(final-|impacto|preparacion|salida)/.test(pose))
}
const montadasCaballero = computed(() => [...posesCaballero, ...posesNuevasCaballero].filter((p) => baseCaballero.includes(p) || necesaria(true, p)))
const montadasGuardian = computed(() => [...posesGuardian, ...posesNuevasGuardian.value].filter((p) => baseGuardian.value.includes(p) || necesaria(false, p)))

function poseUrl(carpeta, pose) {
  const ruta = `${carpeta}/${pose}.${extension(pose)}`
  if (listas.has(ruta)) return imageUrl(ruta)
  const golpe = props.ataque
  if (!golpe) return undefined
  const esHeroe = carpeta.endsWith('/caballero')
  return necesaria(esHeroe, pose) ? imageUrl(ruta) : undefined
}
// Preparación progresiva (próximas poses → secundarias) con prioridades; el gestor omite las que no caben en el presupuesto.
onMounted(async () => {
  tokenNivel = assets.abrirAmbito(ambitoNivel())
  const { proximas, secundarias } = levelPriorities(props.nivel, 'alta')
  const lista = [...proximas.map((src) => ({ src, prioridad: PRIORIDAD.PROXIMA })), ...secundarias.map((src) => ({ src, prioridad: PRIORIDAD.SECUNDARIA }))]
  for (const r of lista) {
    if (colaPoses.signal.aborted) return
    if (listas.has(r.src)) continue
    // Nunca se decodifica mientras el estudiante resuelve una actividad con reloj en marcha
    while (!colaPoses.signal.aborted && props.carga !== null && props.carga > 0) await new Promise((x) => setTimeout(x, 400))
    const res = await prepareImages([r], { signal: colaPoses.signal, ambito: tokenNivel, concurrencia: 1 })
    if (!colaPoses.signal.aborted && !res.cancelled) listas.add(r.src)
  }
})
onBeforeUnmount(() => colaPoses.abort())
const carpetaGuardian = computed(() => props.nivel.arte.split('/').pop())
// Los jefes 2 y 4 lanzan un chorro desde la boca; el 1 lanza una bola (se dibuja en CombatEfectos) y el 3 invoca un rayo.
const chorros = { 2: '/images/jefes/rio/ola-venenosa.png', 4: '/images/jefes/real/aliento-fuego.png' }
const chorro = computed(() => chorros[(props.nivel.numeroArte ?? props.nivel.numero)])
// Una unidad equivale a la raíz del área opaca (suma de alfa / 255) de cada archivo.
// El centro y el margen bajo la silueta se miden en esas mismas unidades.
function estiloPose(personaje, pose) {
  const medida = medidasPoses[personaje][pose]
  return {
    '--ancho-pose': medida.ancho,
    '--centro-pose': medida.centro,
    '--margen-inferior': medida.margenInferior
  }
}
// Chispas del enemigo al deshacerse (valores fijos para que servidor y cliente pinten lo mismo)
const chispasFinalTodas = Array.from({ length: 14 }, (_, i) => ({
  left: `${60 + ((i * 37) % 28)}%`,
  top: `${36 + ((i * 23) % 26)}%`,
  '--d': (i * 131) % 500,
  '--s': `${5 + ((i * 7) % 7)}px`
}))
// Partículas de energía que el enemigo absorbe mientras carga, y motas de ambiente (valores fijos: servidor y cliente pintan lo mismo)
const particulasCargaTodas = Array.from({ length: 14 }, (_, i) => {
  const ang = (i * 137) % 360
  return {
    '--ax': Math.round(Math.cos((ang * Math.PI) / 180) * 70),
    '--ay': Math.round(Math.sin((ang * Math.PI) / 180) * 48),
    '--r': `${-((i * 0.29) % 1.6).toFixed(2)}s`
  }
})
const motasTodas = Array.from({ length: 12 }, (_, i) => ({
  '--x': `${(i * 53 + 7) % 100}%`,
  '--s': `${2 + ((i * 5) % 4)}px`,
  '--t': `${9 + ((i * 7) % 8)}s`,
  '--d': (i * 1.7).toFixed(1),
  '--v': `${((i * 29) % 44) - 22}px`
}))
// Partículas de primer plano: más grandes y rápidas que las del fondo, para dar sensación de profundidad.
const primerPlanoTodas = Array.from({ length: 7 }, (_, i) => ({
  '--y': `${38 + ((i * 17) % 50)}%`,
  '--s': `${5 + ((i * 3) % 9)}px`,
  '--t': `${7 + ((i * 5) % 6)}s`,
  '--d': (i * 1.9).toFixed(1),
  '--v': `${((i * 23) % 40) - 20}px`
}))
// Menos elementos reales en el DOM según el perfil: Alta conserva todo; Lite (mientras llega el cambio de escena), un tercio.
const reducir = (lista) => computed(() => (quality.value === 'alta' ? lista : lista.filter((_, i) => i % 3 === 0)))
const chispasFinal = reducir(chispasFinalTodas)
const particulasCarga = reducir(particulasCargaTodas)
const motas = reducir(motasTodas)
const primerPlano = reducir(primerPlanoTodas)
const vidaBaja = computed(() => props.vidaCaballero > 0 && props.vidaCaballero <= 30)
const esperando = computed(() => props.carga !== null && !props.ataque)
const faseCarga = computed(() => (!esperando.value ? 0 : props.carga >= 0.66 ? 2 : props.carga >= 0.33 ? 1 : 0))
const enGuardia = computed(() => esperando.value && props.carga > 0.06)
const urgente = computed(() => esperando.value && props.carga >= 0.7)
const victoria = computed(() => props.vidaRival === 0 && props.vidaCaballero > 0 && !props.ataque)
const ataqueRival = computed(() => props.ataque?.id === 'rival')
const remateSolar = computed(() => props.ataque?.final && props.ataque.remate === 'solar')

const esperaSolar = ref(false)
let cancelarClip
let finClip
let secuenciaSolar = 0

// Los clips de la transformación solar pasan por el mezclador de audio (volumen del canal, sin instancias sueltas,
// se detienen al salir de la batalla y no se descargan hasta que se necesitan).
function reproducirClip(ruta) {
  const clip = reproducirClipAudio(ruta)
  cancelarClip = clip.detener
  return clip.fin
}

function iniciarTransformacion() {
  finClip = reproducirClip('/audio/combate/solar-transformacion.mp3')
}

async function esperarClipSolar() {
  const turno = secuenciaSolar
  esperaSolar.value = true
  await finClip
  if (turno !== secuenciaSolar) return false
  esperaSolar.value = false
  return remateSolar.value
}

async function encadenarCarga() {
  if (await esperarClipSolar()) finClip = reproducirClip('/audio/combate/solar-carga.mp3')
}

function cancelarSolar() {
  secuenciaSolar++
  cancelarClip?.()
  finClip = null
  esperaSolar.value = false
}
watch(remateSolar, activo => { if (!activo) cancelarSolar() })
const remateCruzado = computed(() => props.ataque?.final && props.ataque.remate === 'cruzado')
const remateSombras = computed(() => props.ataque?.final && props.ataque.remate === 'sombras')

// Cuánta carga llevaba el enemigo cuando empezó su ataque: si ya estaba cargado, no «retrocede» a una pose anterior.
let ultimaCarga = 0
const cargaPrevia = ref(0)
watch(() => props.carga, (valor) => { if (valor !== null) ultimaCarga = valor }, { immediate: true })
watch(() => props.ataque, (nuevo) => {
  if (nuevo?.id === 'rival') cargaPrevia.value = ultimaCarga >= 0.66 ? 2 : ultimaCarga >= 0.33 ? 1 : 0
})

// Pausa de impacto: en el contacto la imagen se congela una fracción de segundo, como en los juegos de pelea
const congelado = ref(false)
let temporizadorPausa = null
function alImpactar() {
  if (!props.ataque || props.danoAplicado !== null || congelado.value) return
  emit('impactar')
  congelado.value = true
  clearTimeout(temporizadorPausa)
  temporizadorPausa = setTimeout(() => (congelado.value = false), props.ataque?.final ? 150 : 95)
}

onBeforeUnmount(() => {
  clearTimeout(temporizadorPausa)
  cancelarSolar()
})
// Un golpe bloqueado no hace reaccionar al caballero (igual que una esquiva)
const bloqueando = computed(() => props.bloqueado && props.ataque?.id === 'rival')
const caballero = computed(() => props.ataque?.esquivado || bloqueando.value
  ? { herido: props.vidaCaballero / 100 <= 0.34 }
  : estadoLuchador(props.vidaCaballero, 100, ataqueRival.value))
const guardian = computed(() => estadoLuchador(props.vidaRival, props.nivel.vida, !ataqueRival.value))

function estadoLuchador(vida, maxima, recibe) {
  return {
    receptor: Boolean(props.ataque) && recibe,
    emisor: Boolean(props.ataque) && !recibe,
    herido: vida > 0 && vida / maxima <= 0.34,
    tendido: vida === 0
  }
}

const tiempos = computed(() => {
  if (!props.ataque) return null
  const duracion = props.ataque.duracion
  // El 54 % es el contacto en las animaciones de avance y de proyectil (el golpe final lo adelanta al 46 %).
  const impacto = Math.round(duracion * (remateSolar.value ? 0.84 : props.ataque.final ? 0.46 : 0.54))
  return {
    '--duracion': `${duracion}ms`,
    '--momento-impacto': `${impacto}ms`,
    '--duracion-reaccion': `${duracion - impacto}ms`
  }
})

// Los eventos CSS conservan la sincronía visual. El reloj cubre eventos perdidos
// y descuenta las pausas de audio, impacto y pestaña oculta.
const oculta = ref(import.meta.client && document.hidden)
function actualizarVisibilidad() { oculta.value = document.hidden }
onMounted(() => document.addEventListener('visibilitychange', actualizarVisibilidad))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', actualizarVisibilidad))
let golpeActual
let tiempoActivo = 0
watch([() => props.ataque, esperaSolar, congelado, oculta], ([golpe, audio, pausa, ocultaAhora], _, limpiar) => {
  if (golpe !== golpeActual) {
    golpeActual = golpe
    tiempoActivo = 0
  }
  if (!golpe || audio || pausa || ocultaAhora) return
  const inicio = performance.now()
  const contacto = parseFloat(tiempos.value['--momento-impacto'])
  const impacto = props.danoAplicado === null
    ? setTimeout(alImpactar, Math.max(0, contacto - tiempoActivo) + 60) : null
  const fin = setTimeout(() => emit('terminar'), Math.max(0, golpe.duracion - tiempoActivo) + 80)
  limpiar(() => {
    clearTimeout(impacto)
    clearTimeout(fin)
    tiempoActivo += performance.now() - inicio
  })
}, { flush: 'sync' })

const efecto = computed(() => {
  if (!props.ataque || props.ataque.magia || props.ataque.remate) return undefined
  const id = props.ataque?.id
  if (id === 'rival') return props.nivel.efecto
  return id === 'hachazo' ? '/images/bosque-del-alba/hachazo.svg' : `/images/caballero/${id}.svg`
})
</script>

<style scoped>
/* --alto se registra como longitud para que se calcule una sola vez en .escenario
   (en píxeles) y los hijos con container-type no lo reinterpreten. */
@property --alto {
  syntax: '<length>';
  inherits: true;
  initial-value: 300px;
}
.escenario {
  /* CombatDesafio pasa --alto-escena con el alto libre de la pantalla */
  --alto: var(--alto-escena, clamp(175px, 60dvh, 610px));
  position: relative;
  height: var(--alto);
  overflow: hidden;
  isolation: isolate;
  border: 1px solid #938060;
  border-radius: 10px;
  background: #293335;
  box-shadow: 0 12px 34px #0008;
}

.secuencia {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #1012179e, transparent 24%, transparent 78%, #0c111945), var(--fondo) center 66% / cover;
}
.secuencia::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 clamp(20px, 8vw, 100px) #0a0c135e;
}
.secuencia.activa { transform-origin: 60% 62%; animation: camara var(--duracion) ease-out both; }
.secuencia.rival { transform-origin: 38% 62%; }
.arena-esquiva .secuencia.rival { --sacudida: 0px; }
.arena-esquiva .secuencia.rival .guardian { --avance: -8%; }
.resultado-esquiva {
  position: absolute;
  z-index: 12;
  left: 29%;
  top: 62%;
  translate: -50% -50%;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid #df8b78;
  background: #25141bf2;
  color: #ffb09e;
  font-size: clamp(1rem, 2.2vw, 1.2rem);
  font-weight: 800;
  pointer-events: none;
}
.resultado-esquiva.acierto { border-color: #95d9ba; background: #112b26f2; color: #c3ffe2; }
@media (prefers-reduced-motion: no-preference) {
  .arena-esquiva .secuencia.rival .caballero { transition: left 180ms ease-out; }
}
.arena-esquiva .secuencia.activa .accion::after { display: none; }
.arena-esquiva .accion { width: 100%; }
.arena-esquiva .caballero { left: calc(6.5% + var(--posicion-esquiva)); z-index: 1; }
.arena-esquiva .caballero.esquiva-lograda .pose { opacity: 0; animation: none; }
.arena-esquiva .caballero.esquiva-lograda .pose.esquiva { opacity: 1; }
.arena-esquiva .caballero.esquiva-lograda :is(.guardia, .dolor) { opacity: 0; }
.zona-coletazo {
  position: absolute;
  inset: 29% 71% 4% 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}
.zona-coletazo.derecha { inset-inline: 29% 42%; }
.advertencia-coletazo {
  position: absolute;
  inset: 20% 4% 0;
  border-bottom: 4px solid #efaa65;
  border-radius: 50%;
  background: radial-gradient(ellipse at center bottom, #d65b354d, transparent 75%);
  animation: aviso-coletazo var(--momento-impacto) ease-in both;
}
.zona-coletazo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  animation: coletazo-lateral 600ms ease-out var(--momento-impacto) both;
}
@keyframes aviso-coletazo {
  from { opacity: 0; }
  75% { opacity: 1; }
  to { opacity: 0; }
}
.zona-coletazo.derecha img { scale: -1 1; }
@keyframes coletazo-lateral {
  0%, 100% { opacity: 0; }
  30%, 60% { opacity: 1; }
}
/* Intensidad y color del impacto según el ataque */
.secuencia { --sacudida: 6px; --tinte: #fff3cf; --fx: 62%; --fy: 57%; }
.secuencia.hachazo { --sacudida: 9px; --fy: 69%; }
.secuencia.barrido { --sacudida: 7px; --tinte: #d6f1ff; }
.secuencia.escudo { --sacudida: 10px; --fx: 61%; }
.secuencia.rayo { --sacudida: 6px; --tinte: #cfeaff; --fx: 64%; --fy: 53%; }
.secuencia.fenix { --sacudida: 8px; --tinte: #ffd89a; --fx: 64%; --fy: 55%; }
.secuencia.rival { --sacudida: 9px; --tinte: #ffc7b0; --fx: 34%; --fy: 55%; }
/* Destello de pantalla en el momento exacto del contacto */
.secuencia.activa .accion::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
  background: radial-gradient(circle at var(--fx) var(--fy), var(--tinte) 0, #ffffff2e 26%, transparent 58%);
  animation: destello-golpe 280ms ease-out var(--momento-impacto) forwards;
}
.emisor { transform-origin: center bottom; }
/* La unidad se calcula una vez sobre la arena. Las cajas de los luchadores también
   son contenedores: registrar la longitud evita que sus hijos la vuelvan a calcular. */
@property --unidad-figura {
  syntax: '<length>';
  inherits: true;
  initial-value: 60px;
}
.accion { position: relative; width: min(100%, calc(var(--alto) * 3.2)); height: 100%; margin-inline: auto; container-type: size; --suelo: 10%; }
.luchador, .descarga-solar { --unidad-figura: min(18.5cqw, 45cqh); }
.luchador { position: absolute; width: 46%; height: 100%; bottom: 0; container-type: size; }
.caballero { left: 2.5%; }
.guardian { left: 51%; }
.luchador::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: calc(var(--suelo) - 4.5%);
  width: min(72%, calc(var(--alto) * 0.87));
  height: 9%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, #101112bd 5%, #10111262 44%, transparent 74%);
}
.escenario.nivel-1 { --aura: #ffd54f; }
.escenario.nivel-2 { --aura: #00e676; }
.escenario.nivel-3 { --aura: #00e5ff; }
.escenario.nivel-4 { --aura: #ff5722; }
.pose {
  position: absolute;
  left: calc(50% - var(--unidad-figura) * var(--centro-pose));
  bottom: calc(var(--suelo) - var(--unidad-figura) * var(--margen-inferior));
  width: calc(var(--unidad-figura) * var(--ancho-pose));
  max-width: none;
  height: auto;
  transform-origin: center bottom;
  opacity: 0;
  filter: drop-shadow(0 2px 3px #15141660);
}
.pose.reposo { opacity: 1; }
.caballero .pose.sin-arma { opacity: 1; }
.arena-esquiva .caballero.esquiva-lograda .pose.sin-arma { opacity: 1; }
/* Respiración en espera: los luchadores ya no se quedan congelados entre ataques */
.luchador:not(.emisor, .receptor, .tendido) { transform-origin: center bottom; animation: respirar 3.2s ease-in-out infinite, mecer 5.3s ease-in-out infinite; }
.guardian:not(.emisor, .receptor, .tendido) { animation-duration: 3.8s, 6.1s; animation-delay: -1.4s, -2.2s; }
.luchador:is(.herido, .tendido):not(.emisor, .receptor) .reposo { opacity: 0; }
.herido:not(.emisor, .receptor) .dolor { opacity: 1; animation: respiracion 1.9s ease-in-out infinite; }
.tendido:not(.receptor) .caida { opacity: 1; }

.hachazo .caballero { animation: avance-hachazo var(--duracion) ease-in-out both, deformar var(--duracion) ease-in-out both; }
.barrido .caballero { animation: avance-barrido var(--duracion) ease-in-out both, deformar var(--duracion) ease-in-out both; }
.escudo .caballero {
  --alcance-escudo: clamp(19%, calc(107% - var(--alto) * 0.96), 50%);
  animation: avance-escudo var(--duracion) ease-in-out both, deformar var(--duracion) ease-in-out both;
}
.nivel-1 .escudo .caballero { --alcance-escudo: clamp(26%, calc(112% - var(--alto) * 0.83), 53%); }
.magia .caballero { animation: conjurar var(--duracion) ease-out both, deformar-magia var(--duracion) ease-in-out both; }
.rival .guardian { --avance: -13%; animation: avance-rival var(--duracion) ease-out both, deformar-rival var(--duracion) ease-in-out both; }
.nivel-2 .rival .guardian { --avance: -20%; }
.nivel-3 .rival .guardian { --avance: -40%; --altura: -18%; }
.nivel-4 .rival .guardian { --avance: -5%; }
.receptor {
  --retroceso: 13%;
  --inclinacion: 5deg;
  animation: recibir var(--duracion-reaccion) ease-out var(--momento-impacto) both, impacto-recibido 420ms ease-out var(--momento-impacto) forwards;
  transform-origin: center 87%;
}
.caballero.receptor {
  --retroceso: -17%;
  --inclinacion: -6deg;
  animation: recibir var(--duracion-reaccion) ease-out var(--momento-impacto) both, impacto-rojo 760ms ease-out var(--momento-impacto) forwards;
}
.caballero.receptor :is(.retroceso, .dolor) { display: none; }
.receptor .golpeado { animation-name: golpeado-rx; }
@keyframes golpeado-rx { 0% { opacity: 1; } 42%, 100% { opacity: 0; } }
@keyframes impacto-rojo {
  0%   { filter: brightness(2.4) saturate(0.2); scale: 0.92 1.06; }
  14%  { filter: brightness(1.35) sepia(1) saturate(6) hue-rotate(-50deg); scale: 1.05 0.96; }
  32%  { filter: brightness(1.05); scale: 0.99 1.01; }
  46%  { filter: brightness(1.2) sepia(1) saturate(4) hue-rotate(-50deg); scale: 1 1; }
  62%  { filter: none; }
  100% { filter: none; scale: 1 1; }
}

.emisor .reposo { animation: reposo-atacante var(--duracion) step-end both; }
.rival .emisor .reposo { animation-name: reposo-guardian; }
.receptor .reposo { animation: reposo-rival 1ms step-start var(--momento-impacto) forwards; }
.hachazo .preparacion-hachazo, .barrido .preparacion-barrido, .escudo .preparacion-escudo { animation: preparar var(--duracion) step-end both; }
.hachazo .anticipacion, .barrido .anticipacion { animation: anticipar var(--duracion) step-end both; }
.hachazo .preparacion-hachazo, .barrido .preparacion-barrido { animation-name: preparar-tarde; }
/* El golpe entra con una pose limpia y un breve «trazo» (inclinación + desenfoque) en lugar de mezclar dos poses */
.hachazo .impacto-hachazo, .barrido .impacto-barrido, .escudo .impacto-escudo { animation: golpear var(--duracion) step-end both, trazo-golpe var(--duracion) ease-out both; }
.rayo .preparacion-rayo, .fenix .preparacion-fenix { animation: cargar-conjuro var(--duracion) step-end both; }
.rayo .impacto-rayo, .fenix .impacto-fenix { animation: lanzar-conjuro var(--duracion) step-end both, trazo-conjuro var(--duracion) ease-out both; }
.hachazo .salida-hachazo, .barrido .salida-barrido, .escudo .salida-escudo, .magia .salida-magia { animation: recoger-golpe var(--duracion) step-end both; }
.receptor .pose:not(.reposo) {
  animation-duration: var(--duracion-reaccion);
  animation-delay: var(--momento-impacto);
  animation-timing-function: var(--ritmo-reaccion, step-end);
  animation-fill-mode: forwards;
}
.receptor .retroceso { animation-name: sacudida; }
.receptor .dolor { animation-name: dolor; }
.receptor .tambaleo { animation-name: tambalear; }
.receptor .recuperacion { animation-name: recomponerse; }
.receptor .caida { --ritmo-reaccion: ease-out; visibility: hidden; animation-name: desplomarse; }
.receptor.tendido .recuperacion { visibility: hidden; }
.receptor.tendido .caida { visibility: visible; }

.pulso-impacto { position: absolute; visibility: hidden; animation: pulso 1ms linear var(--momento-impacto); }
.pulso-solar { position: absolute; visibility: hidden; animation: pulso 1ms linear; }
.pulso-transformacion { animation-delay: 450ms; }
.pulso-carga { animation-delay: 5450ms; }
.pulso-disparo { animation-delay: 11650ms; }
.secuencia.solar.esperando-audio, .secuencia.solar.esperando-audio * { animation-play-state: paused !important; }

/* ---------- Espera de la pregunta: el enemigo carga su ataque ---------- */
.esperando .pose { transition: opacity 220ms cubic-bezier(0.25, 0.8, 0.25, 1); }
.guardian::after {
  content: '';
  position: absolute;
  z-index: -1;
  left: 50%;
  bottom: 12%;
  width: 90%;
  height: 78%;
  translate: -50% 0;
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--aura, #ffd85a) 0, transparent 68%);
  opacity: 0;
  pointer-events: none;
}
.guardian.esperando::after { opacity: calc(var(--carga, 0) * 0.5); animation: aura 0.9s ease-in-out infinite; }
.guardian.esperando:is(.c1, .c2) :is(.reposo, .dolor) { opacity: 0; }
.guardian.esperando.c1 .carga-1 { opacity: 1; }
.guardian.esperando.c2 .carga-2 { opacity: 1; }
.guardian.c2:not(.emisor, .receptor, .tendido) { animation: temblar 0.16s linear infinite; }
.luchador.caballero.en-guardia :is(.reposo, .dolor) { opacity: 0; }
.luchador.caballero.en-guardia .guardia { opacity: 1; }
@keyframes aura { 50% { scale: 1.12; } }

/* Energía que el enemigo absorbe: más partículas y ondas más rápidas a medida que se acaba el tiempo */
.particulas-carga { position: absolute; inset: 0; pointer-events: none; }
.particulas-carga .p { position: absolute; left: 50%; top: 52%; width: 7px; height: 7px; margin: -3px; border-radius: 50%; display: none; opacity: 0;
  background: radial-gradient(circle, #fff 0, var(--aura, #ffd85a) 55%, transparent 75%); }
/* El núcleo crece continuamente, incluso entre los cambios de pose del guardián. */
.guardian.esperando .particulas-carga::after {
  content: ''; position: absolute; left: 45%; top: 50%; width: 16%; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle, #fff 5%, var(--aura, #ffd85a) 32%, transparent 70%);
  opacity: var(--carga); transform: scale(calc(.25 + 1.8 * var(--carga))); transition: transform .12s linear;
}
.guardian.esperando:is(.c1, .c2) .particulas-carga .p:nth-child(odd), .guardian.esperando.c2 .particulas-carga .p { display: block; animation: absorber 1.3s ease-in infinite; animation-delay: var(--r); }
@keyframes absorber {
  0% { translate: calc(var(--ax) * 1cqw) calc(var(--ay) * 1cqh); opacity: 0; scale: 1.3; }
  20% { opacity: 1; }
  100% { translate: 0 0; opacity: 0; scale: 0.3; }
}
.onda-suelo { position: absolute; left: 50%; bottom: 13%; width: 80%; height: 10%; translate: -50% 0; border-radius: 50%; border: 2px solid var(--aura, #ffd85a); opacity: 0; pointer-events: none; }
.guardian.esperando:is(.c1, .c2) .onda-suelo { animation: onda calc(1.7s - var(--carga, 0) * 1.1s) ease-out infinite; }
@keyframes onda { 0% { opacity: 0.75; scale: 0.3; } 100% { opacity: 0; scale: 1.3; } }
.peligro { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at center, transparent 52%, #c4121f 135%); }
.escenario.urgente .peligro { animation: latido-peligro calc(1.15s - var(--carga, 0) * 0.55s) ease-in-out infinite; }
@keyframes latido-peligro { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }
.secuencia.urgente { transform-origin: 60% 62%; animation: latido-camara calc(1.15s - var(--carga, 0) * 0.55s) ease-in-out infinite; }
@keyframes latido-camara { 0%, 100% { transform: scale(1); } 14% { transform: scale(1.014); } 28% { transform: scale(1); } 40% { transform: scale(1.008); } 54% { transform: scale(1); } }
.luchador.caballero.tenso:not(.emisor, .receptor, .tendido) { animation: tensar 0.5s ease-in-out infinite; }
@keyframes tensar { 0%, 100% { transform: translateX(-2%) scale(1.02, 0.97); } 50% { transform: translateX(-3.4%) scale(1.035, 0.95); } }

/* Ambiente: motas flotando para que el fondo no se sienta como una imagen quieta */
.ambiente { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.mota { position: absolute; left: var(--x); bottom: -4%; width: var(--s); height: var(--s); border-radius: 50%; background: var(--aura, #ffd85a); opacity: 0; animation: flotar-mota var(--t) linear infinite; animation-delay: calc(var(--d) * -1s); }
@keyframes flotar-mota { 0% { opacity: 0; translate: 0 0; } 15% { opacity: 0.55; } 85% { opacity: 0.25; } 100% { opacity: 0; translate: var(--v) calc(var(--alto) * -1.05); } }

/* Profundidad: niebla baja delante de los pies y partículas de primer plano */
.bruma-frontal {
  position: absolute;
  inset: auto -10% 0;
  height: 26%;
  pointer-events: none;
  background:
    radial-gradient(ellipse 38% 70% at 28% 100%, #e6ecf040, transparent 70%),
    radial-gradient(ellipse 42% 60% at 74% 100%, #e6ecf033, transparent 70%);
  filter: blur(5px);
  animation: derivar-bruma 14s ease-in-out infinite alternate;
}
@keyframes derivar-bruma { from { translate: -4% 0; } to { translate: 4% -2%; } }
.polvo-frontal { position: absolute; inset: 0; overflow: hidden; pointer-events: none; container-type: size; }
.mota-frontal {
  position: absolute;
  left: 0;
  top: var(--y);
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: radial-gradient(circle, #fffb, var(--aura, #ffe9b0) 55%, transparent 72%);
  filter: blur(1.2px);
  opacity: 0;
  animation: cruzar-mota var(--t) linear infinite;
  animation-delay: calc(var(--d) * -1s);
}
@keyframes cruzar-mota {
  0% { opacity: 0; translate: -6cqw 0; }
  10% { opacity: 0.7; }
  50% { translate: 50cqw var(--v); }
  90% { opacity: 0.45; }
  100% { opacity: 0; translate: 108cqw calc(var(--v) * -1); }
}

/* Respiración sutil de la cámara mientras no hay ataque ni urgencia (amplitud pequeña: al empezar un ataque no se nota el salto) */
.secuencia:not(.activa, .urgente, .congelado) { transform-origin: 55% 62%; animation: deriva-camara 10s ease-in-out infinite alternate; }
@keyframes deriva-camara { from { transform: scale(1); } to { transform: scale(1.012) translateX(-0.4%); } }

/* Borde rojo que late cuando al caballero le queda poca vida */
.vida-baja {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  box-shadow: inset 0 0 clamp(30px, 9vw, 110px) 6px #d32f2fa6;
  animation: latido-vida 1.3s ease-in-out infinite;
}
@keyframes latido-vida { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .bruma-frontal, .mota-frontal, .vida-baja { animation: none; }
  .mota-frontal { display: none; }
  .vida-baja { opacity: 0.7; }
  .secuencia:not(.activa, .urgente, .congelado) { animation: none; }
}

/* Furia del caballero, ira del guardián y bloqueo del contraataque */
.aura-furia, .aura-ira { position: absolute; left: 6%; right: 6%; bottom: 2%; height: 84%; border-radius: 50%; pointer-events: none; }
.aura-furia {
  background: radial-gradient(ellipse at 50% 60%, #ffd54f77 0%, #ffb30033 42%, transparent 70%);
  animation: pulso-furia 1.1s ease-in-out infinite alternate;
}
.aura-ira {
  background: radial-gradient(ellipse at 50% 58%, #ff3d0066 0%, #b71c1c33 44%, transparent 72%);
  animation: pulso-furia 0.8s ease-in-out infinite alternate;
}
@keyframes pulso-furia { from { scale: 0.92; opacity: 0.7; } to { scale: 1.08; opacity: 1; } }
.barrera-bloqueo {
  position: absolute;
  z-index: 5;
  left: 48%;
  top: 16%;
  width: 52%;
  height: 68%;
  border: 4px solid #ffe9a8;
  border-radius: 50%;
  background: radial-gradient(circle, #fff7 0%, #ffd54f44 55%, transparent 74%);
  box-shadow: 0 0 22px #ffd54f;
  opacity: 0;
  pointer-events: none;
  animation: bloqueo-flash 600ms ease-out var(--momento-impacto, 700ms) both;
}
.barrera-bloqueo b {
  position: absolute;
  left: 50%;
  top: -24%;
  translate: -50% 0;
  white-space: nowrap;
  color: #fff6d8;
  font: 900 clamp(0.8rem, 2.4vw, 1.2rem) Georgia, serif;
  text-shadow: 0 0 8px #ffb300, 0 2px 4px #000;
}
@keyframes bloqueo-flash {
  0% { opacity: 0; scale: 0.5; }
  15% { opacity: 1; scale: 1.1; }
  100% { opacity: 0; scale: 1.25; }
}
@media (prefers-reduced-motion: reduce) {
  .aura-furia, .aura-ira { animation: none; }
  .barrera-bloqueo { display: none; }
}

/* Pausa de impacto */
.secuencia.oculta, .secuencia.oculta *, .secuencia.congelado, .secuencia.congelado * { animation-play-state: paused !important; }
@keyframes temblar { 25% { translate: -2px 1px; } 50% { translate: 2px -1px; } 75% { translate: -1px -1px; } }

/* El enemigo ataca desde su carga: carga-1 → carga-2 → «ataque» (se suelta el golpe en el 36 %) → reposo.
   Solo hay una pose visible a la vez (se quitaron los «ecos» translúcidos que dejaban al jefe con aspecto fantasmal). */
.rival .guardian :is(.preparacion, .impacto) { display: none; }
.rival .guardian .carga-1 { animation: rival-carga-1 var(--duracion) step-end both; }
.rival .guardian .carga-2 { animation: rival-carga-2 var(--duracion) step-end both; }
.rival .guardian.desde-carga .carga-1 { animation: none; }
.rival .guardian.desde-carga .carga-2 { animation-name: rival-carga-2-directa; }
.rival .guardian .ataque { animation: golpear-rival var(--duracion) step-end both, trazo-rival var(--duracion) ease-out both; }
.rival .guardian::after { opacity: 0.6; animation: aura-ataque var(--duracion) ease-out both; }
@keyframes aura-ataque { 0% { opacity: 0.55; scale: 1; } 35% { opacity: 1; scale: 1.28; } 42% { opacity: 0.9; scale: 1.15; } 62%, 100% { opacity: 0; scale: 1; } }
@keyframes rival-carga-1 { 0% { opacity: 1; } 12%, 100% { opacity: 0; } }
@keyframes rival-carga-2 { 0%, 100% { opacity: 0; } 12% { opacity: 1; } 36% { opacity: 0; } }
@keyframes rival-carga-2-directa { 0% { opacity: 1; } 36%, 100% { opacity: 0; } }
@keyframes golpear-rival { 0%, 88%, 100% { opacity: 0; } 36% { opacity: 1; } }
/* Entrada del «ataque»: el jefe llega ya inclinado hacia delante y se asienta en su pose */
@keyframes trazo-rival {
  0%, 35.9% { transform: translateX(4%) skewX(7deg) scaleX(1.05); filter: drop-shadow(0 2px 3px #15141660) blur(1.2px); }
  41%, 100% { transform: none; filter: drop-shadow(0 2px 3px #15141660); }
}

/* Las bocas están medidas en el lienzo de ataque original (560 × 512).
   El chorro y la pose usan la misma escala y el mismo anclaje al suelo. */
.chorro {
  position: absolute;
  z-index: 3;
  --pixel-ataque: calc(var(--unidad-figura) * var(--ancho-pose) / 560);
  --origen-x: calc(50% - var(--unidad-figura) * var(--centro-pose));
  --origen-y: calc(var(--suelo) - var(--unidad-figura) * var(--margen-inferior));
  max-width: none;
  opacity: 0;
  pointer-events: none;
  object-fit: fill;
}
.chorro-4 {
  height: calc(184 * var(--pixel-ataque)); width: calc(552 * var(--pixel-ataque));
  left: calc(var(--origen-x) - 503 * var(--pixel-ataque));
  bottom: calc(var(--origen-y) + 183 * var(--pixel-ataque));
  transform-origin: 99.8% 61.5%;
  filter: drop-shadow(0 0 10px #ff5722cc) drop-shadow(0 0 22px #ffc107a6);
  animation: chorro-fuego var(--duracion) linear both;
}
.chorro-2 {
  height: calc(205 * var(--pixel-ataque)); width: calc(615 * var(--pixel-ataque));
  left: calc(var(--origen-x) - 564 * var(--pixel-ataque));
  bottom: calc(var(--origen-y) + 112 * var(--pixel-ataque));
  transform-origin: 99.4% 79%;
  filter: drop-shadow(0 0 14px #00e676cc);
  animation: chorro-ola var(--duracion) linear both;
}
@keyframes chorro-fuego {
  0%, 35% { opacity: 0; transform: scale(0.05, 0.3); }
  37%     { opacity: 1; transform: scale(0.14, 0.45); }
  46%     { opacity: 1; transform: scale(0.72, 0.9); }
  54%, 68% { opacity: 1; transform: scale(1, 1); }
  80%     { opacity: 0.75; transform: scale(1.02, 0.82); }
  92%, 100% { opacity: 0; transform: scale(1.04, 0.5); }
}
@keyframes chorro-ola {
  0%, 35% { opacity: 0; transform: scale(0.05, 0.25); }
  37%     { opacity: 1; transform: scale(0.12, 0.35); }
  47%     { opacity: 1; transform: scale(0.7, 0.85); }
  55%, 70% { opacity: 1; transform: scale(1, 1); }
  82%     { opacity: 0.7; transform: scale(1.02, 0.8); }
  94%, 100% { opacity: 0; transform: scale(1.04, 0.55); }
}

/* ---------- Golpe final: el caballero salta, remata y el enemigo cae ---------- */
.secuencia.final.activa { transform-origin: 62% 62%; animation-name: camara-final; animation-timing-function: ease-in-out; }
.penumbra {
  position: absolute;
  inset: -2%;
  pointer-events: none;
  background: radial-gradient(ellipse at 60% 62%, transparent 22%, #04050c 100%);
  opacity: 0;
  animation: oscurecer var(--duracion) ease-in-out both;
}
.secuencia.final .accion::before {
  content: '';
  position: absolute;
  inset: -10%;
  pointer-events: none;
  opacity: 0;
  background: repeating-conic-gradient(from 0deg at var(--fx) var(--fy), #0000 0 5deg, #ffffffa6 5deg 5.7deg, #0000 5.7deg 11deg);
  -webkit-mask: radial-gradient(circle at var(--fx) var(--fy), transparent 14%, #000 62%);
  mask: radial-gradient(circle at var(--fx) var(--fy), transparent 14%, #000 62%);
  animation: lineas var(--duracion) linear both;
}
.secuencia.final.activa .accion::after {
  background: radial-gradient(circle at var(--fx) var(--fy), #fffffff2 0, #ffffff70 28%, transparent 66%);
  animation-name: destello-final;
  animation-duration: 560ms;
}
.secuencia.final .luchador.caballero { animation: heroe-final var(--duracion) ease-in-out both, deformar var(--duracion) ease-in-out both; }
.secuencia.final .luchador.caballero .pose:not(.reposo, .anticipacion, .final-1, .final-2, .final-3, .ascension) { display: none; }
.secuencia.final .luchador.caballero .reposo { animation: final-reposo var(--duracion) step-end both; }
.secuencia.final .luchador.caballero .anticipacion { animation: final-guardia var(--duracion) step-end both; }
.secuencia.final .luchador.caballero .final-1 { animation: final-pose-1 var(--duracion) step-end both; }
.secuencia.final .luchador.caballero .final-2 { animation: final-pose-2 var(--duracion) step-end both; }
.secuencia.final .luchador.caballero .final-3 { animation: final-pose-3 var(--duracion) step-end both; }
.secuencia.final.sombras .luchador.caballero { animation: none; }
.secuencia.final.sombras .caballero .pose:not(.anticipacion) { display: none; }
.secuencia.final.sombras .caballero .anticipacion {
  animation: none;
  opacity: 1;
  filter: drop-shadow(0 0 10px #a378f3);
}
.invocacion-sombras { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.portal-sombras {
  position: absolute;
  inset: auto 47% 12% 21%;
  height: 17%;
  border-radius: 50%;
  background: radial-gradient(ellipse, #080512 28%, #7346b4 48%, #9d71d76e 60%, transparent 73%);
  animation: abrir-portal var(--duracion) ease-out both;
}
.guerrero-sombra {
  position: absolute;
  left: calc(25% + var(--fila) * 4%);
  bottom: calc(12% + var(--fila) * 7%);
  width: min(24%, calc(var(--alto) * .52));
  aspect-ratio: 1;
  filter: grayscale(1) brightness(.43) sepia(1) hue-rotate(215deg) saturate(2)
    drop-shadow(0 0 7px #a06bff);
  animation: avanzar-sombra var(--duracion) ease-in-out calc(-1 * var(--adelanto)) both;
}
.guerrero-sombra img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: bottom; }
.sombra-guardia { animation: guardia-sombra var(--duracion) step-end calc(-1 * var(--adelanto)) both; }
.sombra-golpe { animation: golpe-sombra var(--duracion) step-end calc(-1 * var(--adelanto)) both; }
@keyframes guardia-sombra { 0%, 51%, 100% { opacity: 1; } 46% { opacity: 0; } }
@keyframes golpe-sombra { 0%, 51%, 100% { opacity: 0; } 46% { opacity: 1; } }
.impacto-sombras {
  position: absolute;
  left: 74%;
  top: var(--altura-tajo);
  width: min(34%, calc(var(--alto) * .8));
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(circle, #efe3ff, #8f57df88 36%, transparent 68%);
  animation: estallido-sombras 330ms ease-out var(--contacto) both;
}
.impacto-sombras::before, .impacto-sombras::after {
  content: '';
  position: absolute;
  inset: 46% 4% auto;
  height: 7%;
  border-radius: 50%;
  background: #f4dbff;
  box-shadow: 0 0 16px #a16bff;
  rotate: var(--giro-tajo);
}
.impacto-sombras::after { translate: 0 145%; height: 2%; }
.chispa-sombra {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 18%;
  height: 2px;
  transform-origin: left;
  background: linear-gradient(90deg, #f9eaff, #ab71ff00);
  animation: chispa-sombra 330ms ease-out var(--contacto) both;
}
@keyframes chispa-sombra {
  from { transform: rotate(var(--angulo)) translateX(15%); }
  to { transform: rotate(var(--angulo)) translateX(185%); }
}
@keyframes abrir-portal {
  0%, 5% { opacity: 0; scale: .35; }
  18%, 45% { opacity: 1; scale: 1; }
  72%, 100% { opacity: 0; scale: .55; }
}
@keyframes avanzar-sombra {
  0%, 8% { opacity: 0; translate: 0 15%; }
  22%, 29% { opacity: 1; translate: 0 0; }
  46% { opacity: 1; left: calc(63% + var(--fila) * 5%); translate: 0 -18%; rotate: 9deg; }
  59% { opacity: .75; left: calc(67% + var(--fila) * 5%); translate: 0 -7%; }
  75%, 100% { opacity: 0; left: calc(69% + var(--fila) * 5%); translate: 0 0; }
}
@keyframes estallido-sombras {
  0% { opacity: 0; scale: .58; }
  13% { opacity: 1; scale: 1; }
  45% { opacity: .85; }
  100% { opacity: 0; scale: 1.16; }
}
.secuencia.final.cruzado .luchador.caballero {
  animation: avance-cruzado var(--duracion) ease-in-out both;
}
.corte-cruzado {
  position: absolute;
  z-index: 4;
  left: 74%;
  top: 57%;
  width: min(37%, calc(var(--alto) * .83));
  aspect-ratio: 1;
  translate: -50% -50%;
  pointer-events: none;
}
.tajo-cruzado {
  position: absolute;
  inset: 46% -12% auto;
  height: 8%;
  border-radius: 50%;
  background: linear-gradient(transparent, #85e5de 24%, #fff9e5 48%, #fff 52%, #85e5de 76%, transparent);
  box-shadow: 0 0 17px #55dfcda0;
  rotate: 42deg;
  animation: dibujar-tajo 850ms ease-out calc(var(--momento-impacto) - 220ms) both;
}
.tajo-cruzado.segundo {
  rotate: -42deg;
  animation-delay: var(--momento-impacto);
}
@keyframes dibujar-tajo {
  0% { opacity: 0; clip-path: inset(-100% 100% -100% 0); }
  18%, 67% { opacity: 1; clip-path: inset(-100% -15%); }
  100% { opacity: 0; clip-path: inset(-100% -15%); }
}
@keyframes avance-cruzado {
  0%, 18%, 100% { transform: none; }
  30% { transform: translateX(-8%) rotate(-6deg); }
  42% { transform: translateX(64%) rotate(6deg); }
  46%, 51% { transform: translateX(78%); }
  71% { transform: none; }
}
.secuencia.final.solar .luchador.caballero { animation: none; }
.secuencia.final.solar.activa { animation-name: reloj; }
@keyframes reloj { to { opacity: 1; } }
.secuencia.final.solar .caballero .pose { display: none; }
.secuencia.final.solar .caballero :is(.reposo, .ascension) { display: block; }
.secuencia.final.solar .caballero .reposo { animation: antes-de-ascender var(--duracion) step-end both; }
.secuencia.final.solar .caballero .ascension {
  animation: ascender var(--duracion) ease-out both;
}
.aura-solar {
  position: absolute;
  inset: 25% 9% 2%;
  border-radius: 50%;
  background: radial-gradient(ellipse, #fff1a74d, #ff9a202b 45%, transparent 70%);
  animation: aura-solar var(--duracion) ease-in-out both;
}
.descarga-solar {
  /* La mano está cerca de (400, 255) en el lienzo cuadrado de 512 px. */
  --pixel-solar: calc(var(--unidad-figura) * var(--ancho-pose) / 512);
  --origen-solar: calc(25.5% - var(--unidad-figura) * var(--centro-pose) + 400 * var(--pixel-solar));
  --altura-solar: calc(100% - var(--suelo) + var(--unidad-figura) * var(--margen-inferior) - 257 * var(--pixel-solar));
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.esfera-solar {
  position: absolute;
  left: var(--origen-solar);
  top: var(--altura-solar);
  width: clamp(15px, 5%, 55px);
  aspect-ratio: 1;
  border-radius: 50%;
  translate: -50% -50%;
  background: radial-gradient(circle, #fff 20%, #fff3b0 48%, #fca343 70%);
  box-shadow: 0 0 22px 7px #ffc152;
  animation: esfera-solar var(--duracion) ease-in both;
}
.rayo-solar {
  position: absolute;
  inset: var(--altura-solar) 24% auto var(--origen-solar);
  height: clamp(12px, 8%, 60px);
  translate: 0 -50%;
  transform-origin: left center;
  border-radius: 35% 55% 55% 35%;
  background: linear-gradient(transparent, #fba134 16%, #fff2ac 35%, #fff 50%, #fff2ac 65%, #fba134 84%, transparent);
  box-shadow: 0 0 20px #ffae41;
  animation: rayo-solar var(--duracion) ease-out both;
}
@keyframes antes-de-ascender { 0% { opacity: 1; } 7%, 100% { opacity: 0; } }
@keyframes ascender {
  0%, 6.9% { opacity: 0; }
  7% { opacity: 1; filter: brightness(1.12) drop-shadow(0 0 7px #ffc45b99); }
  20%, 100% { opacity: 1; filter: drop-shadow(0 0 4px #ffc45b77); }
}
@keyframes aura-solar {
  0%, 3% { opacity: 0; scale: .7; }
  16%, 86% { opacity: 1; scale: 1.15; }
  100% { opacity: 0; scale: 1; }
}
@keyframes esfera-solar {
  0%, 38.9% { opacity: 0; scale: .15; }
  83% { opacity: 1; scale: 1; }
  85%, 100% { opacity: 0; }
}
@keyframes rayo-solar {
  0%, 83.3% { opacity: 0; scale: 0 .65; }
  84%, 89% { opacity: 1; scale: 1 1; }
  96%, 100% { opacity: 0; scale: 1 .2; }
}
/* Después del golpe, el caballero se queda en su pose de victoria */
.luchador.caballero.victoria :is(.reposo, .dolor) { opacity: 0; }
.luchador.caballero.victoria .final-3 { opacity: 1; }

/* Enemigo con secuencia de derrota propia: queda herido, cae de rodillas y se deshace en luz */
.secuencia.final .receptor.con-derrota :is(.retroceso, .dolor, .tambaleo, .recuperacion, .caida) { display: none; }
/* Solo en el golpe final: antes se disparaba también con golpes normales y se sumaba a la reacción habitual */
.secuencia.final .receptor.con-derrota .derrota-1 { animation: derrota-1 var(--duracion-reaccion) step-end var(--momento-impacto) forwards; }
.secuencia.final .receptor.con-derrota .derrota-2 { animation: derrota-2 var(--duracion-reaccion) ease-in var(--momento-impacto) forwards; }
.guardian.con-derrota.tendido:not(.receptor) .caida { opacity: 0; }

.rotulo-final {
  position: absolute;
  top: 17%;
  left: 50%;
  translate: -50% 0;
  color: #fff3c9;
  font: 800 clamp(1.1rem, 4.4dvh, 2.6rem) / 1 Georgia, serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow: 0 0 14px var(--aura, #ffd85a), 0 2px 0 #3a2200, 0 0 30px #000;
  opacity: 0;
  pointer-events: none;
  animation: rotulo var(--duracion) ease-out both;
}
.chispa-final {
  position: absolute;
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0, var(--aura, #ffd85a) 45%, transparent 72%);
  opacity: 0;
  pointer-events: none;
  animation: chispa-final 1300ms ease-out calc(var(--momento-impacto) + 900ms + var(--d) * 1ms) both;
}

/* Ritmo de cada golpe (en % de la duración):
   anticipación → preparación → impacto (cambio de pose en el 34 %, cuando el cuerpo empieza a lanzarse) → salida → reposo */
@keyframes preparar { 0% { opacity: 1; } 34%, 100% { opacity: 0; } }
@keyframes anticipar { 0% { opacity: 1; } 17%, 100% { opacity: 0; } }
@keyframes preparar-tarde { 0%, 16.9% { opacity: 0; } 17% { opacity: 1; } 34%, 100% { opacity: 0; } }
@keyframes golpear { 0%, 70%, 100% { opacity: 0; } 34% { opacity: 1; } }
/* Magia: el conjuro se carga antes, así que su pose de lanzamiento llega antes */
@keyframes cargar-conjuro { 0% { opacity: 1; } 32%, 100% { opacity: 0; } }
@keyframes lanzar-conjuro { 0%, 70%, 100% { opacity: 0; } 32% { opacity: 1; } }
/* «Trazo»: al cambiar de pose la figura va inclinada hacia delante y algo desenfocada, y se asienta en pocos cuadros */
@keyframes trazo-golpe {
  0%, 33.9% { transform: translateX(-4%) skewX(-8deg) scaleX(1.05); filter: drop-shadow(0 2px 3px #15141660) blur(1.3px); }
  39%, 100% { transform: none; filter: drop-shadow(0 2px 3px #15141660); }
}
@keyframes trazo-conjuro {
  0%, 31.9% { transform: translateY(2%) scale(0.97, 1.03); }
  37%, 100% { transform: none; }
}
@keyframes recoger-golpe { 0% { opacity: 0; } 70% { opacity: 1; } 88%, 100% { opacity: 0; } }
@keyframes reposo-atacante { 0% { opacity: 0; } 88%, 100% { opacity: 1; } }
@keyframes reposo-guardian { 0% { opacity: 0; } 88%, 100% { opacity: 1; } }
@keyframes reposo-rival { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes sacudida { 0% { opacity: 1; } 18%, 100% { opacity: 0; } }
@keyframes dolor { 0%, 42%, 100% { opacity: 0; } 18% { opacity: 1; } }
@keyframes tambalear { 0%, 66%, 100% { opacity: 0; } 42% { opacity: 1; } }
@keyframes recomponerse { 0% { opacity: 0; } 66%, 100% { opacity: 1; } }
@keyframes desplomarse { 0%, 65.9% { opacity: 0; } 66% { opacity: 1; transform: translateY(-7%); } 94%, 100% { opacity: 1; transform: none; } }
@keyframes respirar { 50% { transform: scale(1.018, 1.03); } }
@keyframes mecer { 25% { translate: 0.6% -0.8%; } 75% { translate: -0.6% 0.3%; } }
@keyframes respiracion { 50% { transform: scaleY(0.985); } }

@keyframes avance-hachazo {
  15% { transform: translateX(-3%); }
  34% { transform: translate(-8%, -2%) rotate(-4deg); }
  43% { transform: translate(12%, -4%) rotate(-2deg); }
  54%, 58% { transform: translate(39%, 1%); }
  69% { transform: translate(28%, 2%) rotate(3deg); }
  84% { transform: translateX(6%); }
  94% { transform: translateX(1.5%); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@keyframes avance-barrido {
  20% { transform: translate(-7%, 1%) rotate(-5deg); }
  36% { transform: translate(1%, 2%); }
  45% { transform: translate(18%, 1%) rotate(2deg); }
  54%, 57% { transform: translate(37%, 1%) rotate(4deg); }
  69% { transform: translate(22%, 3%) rotate(2deg); }
  84% { transform: translateX(5%); }
  94% { transform: translateX(1.2%); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@keyframes avance-escudo {
  19% { transform: translate(-5%, 3%); }
  36% { transform: translate(6%, 1%) rotate(2deg); }
  45% { transform: translate(23%, 2%) rotate(3deg); }
  54%, 58% { transform: translateX(var(--alcance-escudo)); }
  69% { transform: translate(25%, 3%) rotate(-4deg); }
  84% { transform: translateX(6%); }
  94% { transform: translateX(1.5%); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
/* Se agacha mientras carga, queda en su sitio al soltar el golpe (36 %), se lanza y regresa */
@keyframes avance-rival {
  0%   { transform: translate(0, 0); }
  18%  { transform: translateY(1.8%); }
  30%  { transform: translateY(1%); }
  36%  { transform: translate(0, var(--altura, 0%)); }
  46%  { transform: translateX(calc(var(--avance) * 0.55)); }
  54%, 58% { transform: translateX(var(--avance)); }
  70%  { transform: translate(calc(var(--avance) * 0.6), 1%); }
  83%  { transform: translateX(calc(var(--avance) * 0.22)); }
  94%  { transform: translateX(calc(var(--avance) * 0.05)); }
  100% { transform: translate(0, 0); }
}
@keyframes recibir {
  0%, 7% { transform: none; }
  18% { transform: translateX(var(--retroceso)) rotate(var(--inclinacion)); }
  38% { transform: translate(calc(var(--retroceso) * 0.75), 1%) rotate(calc(var(--inclinacion) * -0.45)); }
  58% { transform: translate(calc(var(--retroceso) * 0.45), 2%); }
  75% { transform: translateX(calc(var(--retroceso) * 0.2)); }
  90% { transform: translateX(calc(var(--retroceso) * 0.05)); }
  100% { transform: none; }
}
@keyframes conjurar {
  16% { transform: translate(-3%, 1%); }
  30% { transform: translateY(-3%); }
  42%, 57% { transform: translateX(5%); }
  72% { transform: translate(2%, 2%); }
  88% { transform: translate(0.5%, 0.5%); }
  100% { transform: translate(0, 0); }
}
/* Cámara: se acerca despacio mientras el atacante se carga, golpea con zoom + sacudida y vuelve */
@keyframes camara {
  0%   { transform: scale(1) translate(0, 0); }
  30%  { transform: scale(1.015) translate(0, 0); }
  53%  { transform: scale(1.03) translate(0, 0); }
  55%  { transform: scale(1.055) translate(calc(var(--sacudida) * -1.2), calc(var(--sacudida) * 0.3)); }
  58%  { transform: scale(1.045) translate(var(--sacudida), calc(var(--sacudida) * -0.3)); }
  61%  { transform: scale(1.04) translate(calc(var(--sacudida) * -0.6), 0); }
  64%  { transform: scale(1.03) translate(calc(var(--sacudida) * 0.35), 0); }
  68%  { transform: scale(1.02) translate(calc(var(--sacudida) * -0.15), 0); }
  80%  { transform: scale(1.008) translate(0, 0); }
  100% { transform: scale(1) translate(0, 0); }
}
@keyframes pulso { to { opacity: 0; } }
@keyframes camara-final {
  0%   { transform: scale(1) translate(0, 0); }
  10%  { transform: scale(1.02) translate(0, 0); }
  30%  { transform: scale(1.07) translate(-1%, 1%); }
  45%  { transform: scale(1.12) translate(0, 0); }
  47%  { transform: scale(1.19) translate(calc(var(--sacudida) * -1.4), calc(var(--sacudida) * 0.4)); }
  50%  { transform: scale(1.15) translate(calc(var(--sacudida) * 1.1), calc(var(--sacudida) * -0.4)); }
  53%  { transform: scale(1.13) translate(calc(var(--sacudida) * -0.7), 0); }
  56%  { transform: scale(1.12) translate(calc(var(--sacudida) * 0.35), 0); }
  66%  { transform: scale(1.09) translate(0, 0); }
  100% { transform: scale(1) translate(0, 0); }
}
@keyframes oscurecer { 0% { opacity: 0; } 12%, 42% { opacity: 0.85; } 46% { opacity: 0.3; } 58%, 80% { opacity: 0.55; } 100% { opacity: 0; } }
@keyframes lineas { 0%, 24% { opacity: 0; } 30%, 45% { opacity: 0.7; } 47%, 100% { opacity: 0; } }
@keyframes destello-final { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes heroe-final {
  0%, 5% { transform: none; }
  14% { transform: translate(-5%, 3%); }
  23% { transform: translate(7%, -21%) rotate(-4deg); }
  33% { transform: translate(22%, -17%) rotate(-2deg); }
  42% { transform: translate(34%, -6%) rotate(5deg); }
  46%, 52% { transform: translate(40%, 1%); }
  62% { transform: translate(32%, 3%); }
  80% { transform: translate(15%, 3%); }
  100% { transform: translate(9%, 0); }
}
@keyframes final-reposo { 0% { opacity: 1; } 5%, 100% { opacity: 0; } }
@keyframes final-guardia { 0%, 16%, 100% { opacity: 0; } 5% { opacity: 1; } }
@keyframes final-pose-1 { 0%, 30%, 100% { opacity: 0; } 16% { opacity: 1; } }
@keyframes final-pose-2 { 0%, 56%, 100% { opacity: 0; } 30% { opacity: 1; } }
@keyframes final-pose-3 { 0% { opacity: 0; } 56%, 100% { opacity: 1; } }
@keyframes derrota-1 { 0% { opacity: 1; } 40%, 100% { opacity: 0; } }
@keyframes derrota-2 {
  0%, 39.9% { opacity: 0; }
  40% { opacity: 1; filter: brightness(1); transform: none; }
  70% { opacity: 1; filter: brightness(1.3); transform: none; }
  100% { opacity: 0; filter: brightness(2.6) blur(2px); transform: translateY(-8%) scale(1.03); }
}
@keyframes rotulo {
  0%, 24% { opacity: 0; scale: 1.7; }
  30% { opacity: 1; scale: 1; }
  43% { opacity: 1; scale: 1.04; }
  48%, 100% { opacity: 0; scale: 1.1; }
}
@keyframes chispa-final {
  0% { opacity: 0; transform: translateY(0) scale(0.6); }
  15% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-90px) scale(1.3); }
}
/* Squash & stretch del atacante: se encoge al cargar, se estira al lanzarse, se aplasta al contacto */
@keyframes deformar {
  0%, 100% { scale: 1 1; }
  30% { scale: 1.04 0.94; }
  43% { scale: 0.95 1.06; }
  54% { scale: 1.07 0.94; }
  63% { scale: 0.99 1.02; }
  76% { scale: 1 1; }
}
@keyframes deformar-rival {
  0%, 100% { scale: 1 1; }
  20% { scale: 1.03 0.97; }
  36% { scale: 1 1; }
  46% { scale: 0.97 1.04; }
  54% { scale: 1.04 0.97; }
  66% { scale: 1 1; }
}
@keyframes deformar-magia {
  0%, 100% { scale: 1 1; }
  24% { scale: 1.03 0.95; }
  32% { scale: 0.97 1.05; }
  44% { scale: 1.04 0.97; }
  60% { scale: 1 1; }
}
/* El que recibe: flash blanco y aplastamiento */
@keyframes impacto-recibido {
  0%   { filter: brightness(2.6) saturate(0.25); scale: 0.92 1.06; }
  22%  { filter: brightness(1.5) saturate(0.7); scale: 1.04 0.97; }
  50%  { filter: brightness(1.1); scale: 0.99 1.01; }
  100% { filter: none; scale: 1 1; }
}
@keyframes destello-golpe { 0% { opacity: 0.6; } 100% { opacity: 0; } }

</style>
