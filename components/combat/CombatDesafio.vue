<template>
  <section class="desafio">
    <AudioEfecto :ruta="golpeSonido.ruta" :disparo="golpeSonido.disparo" />
    <AudioEfecto :ruta="vozJefe.ruta" :disparo="vozJefe.disparo" :volumen="0.75" />
    <header class="cabecera">
      <AudioSonidoBoton @click="emit('volver')">
        <v-btn variant="text" color="amber-lighten-3">{{ t('Volver al mapa') }}</v-btn>
      </AudioSonidoBoton>
      <h1>{{ nivel.nombre }} <small>{{ nivel.tema }}</small></h1>
      <AudioSonidoBoton v-if="modoPruebas" @click="superarPrueba">
        <v-btn variant="tonal" color="amber-lighten-3">{{ t('Superar prueba') }}</v-btn>
      </AudioSonidoBoton>
      <AudioSonidoBoton v-if="modoPruebas" @click="probarRemate">
        <v-btn variant="tonal" color="amber-lighten-3" :disabled="!puedeProbarRemate">{{ t('Probar golpe final') }}</v-btn>
      </AudioSonidoBoton>
    </header>

    <div class="banda-ronda">
      <p class="etiqueta">{{ t('DESAFÍO') }} {{ indice + 1 }} / {{ nivel.preguntas.length }}</p>
      <details v-if="fase === 'pregunta'" :key="indice" class="ayuda-desafio" @toggle="ayudaAbierta = $event.currentTarget.open">
        <summary>{{ t('Cómo jugar') }}</summary>
        <p>{{ instruccion }}</p>
      </details>
      <div v-if="fase === 'pregunta'" class="reloj" :class="{ urgente: tiempoRestante <= 3 }" role="timer" :aria-label="t('Tiempo restante')">
        <span class="reloj-barra"><span :style="{ transform: `scaleX(${tiempoRestante / tiempoTotal})` }" /></span>
        <span class="reloj-num" aria-hidden="true">{{ Math.ceil(tiempoRestante) }} s</span>
      </div>
    </div>

    <div class="contenido" v-panel-adaptable="fase === 'pregunta' && (rondaPanel || armandoFrase) ? indice : null">
      <div class="zona-escena" :class="{ 'con-frase': armandoFrase }">
        <div class="vista-arena">
          <div class="marcador" aria-live="polite">
            <div>
              <p class="identidad"><strong>{{ t('Caballero') }}</strong> <span>{{ vidaCaballero }}/100</span></p>
              <div class="marco-vida">
                <CombatBar :valor="vidaCaballero" color="green-darken-1" :etiqueta="t('Vida del caballero')" />
              </div>
              <div class="furia" :class="{ llena: furia >= FURIA_MAXIMA }" role="status"
                :aria-label="`${t('Furia')} ${furia} ${t('de')} ${FURIA_MAXIMA}`">
                <span class="furia-etiqueta">{{ furia >= FURIA_MAXIMA ? t('¡FURIA! +50 % de daño') : t('Furia') }}</span>
                <i v-for="n in FURIA_MAXIMA" :key="n" :class="{ llena: n <= furia }" />
              </div>
            </div>
            <div class="marcador-rival">
              <p class="identidad"><strong>{{ nivel.guardian }}</strong> <span>{{ vidaRival }}/{{ nivel.vida }}</span></p>
              <div class="marco-vida">
                <CombatBar :valor="vidaRival" :maximo="nivel.vida" color="red-darken-2" :etiqueta="t('Vida del guardián')" />
              </div>
            </div>
          </div>
          <p v-if="consignaCampo" class="consigna-campo">{{ consignaCampo }}</p>
          <div class="campo" :class="{ 'campo-escucha': fase === 'pregunta' && pregunta.tipo === 'escuchar' }">
            <CombatEscena :nivel="nivel" :ataque="ataque" :dano-aplicado="danoAplicado"
              :curacion="curacionAplicada" :vida-caballero="vidaCaballero" :vida-rival="vidaRival" :carga="carga"
              :posicion-esquiva="posicionEsquiva" :lado-golpe="ataque?.lado"
              :furia="furia >= FURIA_MAXIMA" :enfurecido="enfurecido" :bloqueado="bloqueo === 'perfecto'"
              :sin-arma="rondaHacha && (fase === 'pregunta' || fase === 'intercepcion' || fase === 'ataque' && ataque?.id === 'rival')"
              @impactar="impactar" @terminar="terminarAtaque">
              <template #actividad>
                <CombatEscuchar v-if="fase === 'pregunta' && pregunta.tipo === 'escuchar'"
                  :key="indice" :pregunta="pregunta" @responder="responder" />
                <CombatHacha v-if="rondaHacha && ['pregunta', 'intercepcion'].includes(fase)"
                  :key="indice" :pregunta="pregunta" :nivel="nivel.numero"
                  :restante="tiempoRestante" :total="tiempoTotal" @cortar="cortarAtaque" />
                <CombatCortar v-if="rondaCortes && ['pregunta', 'elegir'].includes(fase)"
                  :key="indice" :pregunta="pregunta" @responder="responder" />
                <CombatClasificar v-if="fase === 'pregunta' && pregunta.tipo === 'clasificar'" :key="indice" :pregunta="pregunta"
                  @impacto="aplicarPalabra" @error="palabraIncorrecta" @completar="completarPalabras" />
                <CombatConjuro v-if="rondaConjuro && ['invocacion', 'pregunta', 'conjuro'].includes(fase)"
                  :key="indice" :pregunta="pregunta" :invocando="fase === 'invocacion'"
                  :resuelto="fase === 'conjuro'" @responder="resolverConjuro" />
                <CombatEsquiva v-if="rondaEsquiva && fase === 'pregunta'" :key="indice" :pregunta="pregunta"
                  @mover-heroe="desplazamientoEsquiva = $event" @esquivar="esquivar" @completar="completarAviso" />
                <p v-if="ataque?.lado && pregunta.tipo === 'esquivar'" class="aviso-completado" lang="en">{{ pregunta.texto }}</p>
                <p v-if="ataque?.esquivado && pregunta.tipo === 'esquiva-frase'" class="aviso-completado" lang="en">
                  It <strong>{{ respuesta }}</strong> attack!
                </p>
                <div v-if="efectoPalabra" :key="efectoPalabra.id" class="efecto-palabra"
                  :class="[efectoPalabra.destino, efectoPalabra.tipo]" role="status">{{ t(efectoPalabra.texto).replace('PV', t('PV')) }}</div>
                <p v-if="avisoFase" class="banner-fase" role="status">{{ nivel.guardian }}{{ t(' se enfurece') }}</p>
                <!-- Parada con tiempo: el anillo se cierra sobre el caballero y hay que tocar el escudo justo cuando lo alcanza -->
                <div v-if="paradaActiva" class="parada" :style="{ '--t': duracionAnillo + 'ms' }">
                  <button type="button" class="escudo-parada" :class="{ pronto: paradaPronto, logrado: bloqueo !== '' }"
                    :disabled="bloqueo !== ''" :aria-label="t('Alzar el escudo. Toca cuando el anillo lo alcance, o pulsa la barra espaciadora.')"
                    @pointerdown.prevent="parar">
                    <span class="anillo-parada" aria-hidden="true" />
                    <span class="icono-parada" aria-hidden="true">🛡</span>
                  </button>
                </div>
              </template>
            </CombatEscena>
            <p v-if="escudoPreparado" class="proteccion" role="status">{{ t('Escudo preparado · Reduce el próximo golpe recibido.') }}</p>
          </div>
        </div>
        <CombatPreguntaDuelo v-if="armandoFrase" class="mesa-frase" :key="indice"
          :pregunta="pregunta" @responder="responder" />
      </div>

      <aside v-if="fase !== 'pregunta' || rondaPanel" class="panel sin-barra" :class="{ resultado: fase === 'resultado' }" :aria-label="t('Desafío de inglés')">
        <template v-if="fase === 'pregunta'">
          <CombatErrores v-if="pregunta.tipo === 'errores'" :key="indice" :pregunta="pregunta" @responder="responder" />
          <CombatParejas v-if="pregunta.tipo === 'parejas'" :key="indice" :pregunta="pregunta" @responder="responder" />
          <CombatPreguntaDuelo v-if="pregunta.tipo === 'zona'" :key="indice" :pregunta="pregunta" @responder="responder" />
        </template>

        <template v-else-if="fase === 'aviso-contra'">
          <h2>{{ t('¡Contraataque!') }}</h2>
          <p role="status">{{ nivel.guardian }} {{ t('responde. Toca el escudo del caballero justo cuando el anillo lo alcance (o pulsa la barra espaciadora).') }}</p>
        </template>

        <template v-else-if="fase === 'intercepcion'">
          <p>{{ t('¡Cortaste los tres ataques! Prepara tu contraataque.') }}</p>
        </template>

        <template v-else-if="fase === 'invocacion'">
          <p role="status">{{ t('El guardián invoca a un gigante…') }}</p>
        </template>

        <template v-else-if="fase === 'conjuro'">
          <h2>{{ pregunta.tipo === 'romper-hechizo' ? t('¡Hechizo roto!') : t('¡Promesa cumplida!') }}</h2>
          <p>{{ pregunta.tipo === 'romper-hechizo' ? t('La magia se devuelve al guardián. Prepara tu contraataque.') : t('El aliado está protegido. Tu escudo reducirá el próximo golpe.') }}</p>
        </template>

        <template v-else-if="fase === 'elegir'">
          <h2>{{ t('¡Acertaste! Elige tu ataque') }}</h2>
          <p v-if="furia >= FURIA_MAXIMA" class="aviso-furia" role="status">{{ t('¡Furia al máximo! Tu próximo ataque hace +50 % de daño.') }}</p>
          <div class="opciones ataques">
            <AudioSonidoBoton v-for="movimiento in ataques" :key="movimiento.id" @click="atacar(movimiento)">
              <v-btn block :color="movimiento.magia ? 'light-blue-lighten-3' : 'amber-lighten-3'"
                :variant="nivel.debilidad === movimiento.id ? 'flat' : 'tonal'"
                :disabled="movimiento.id === 'rayo' && rayoUsado">
                <span class="movimiento">
                  <strong>{{ t(movimiento.nombre) }}</strong>
                  <small v-if="movimiento.id === 'rayo' && rayoUsado">{{ t('Ya lo usaste en este duelo') }}</small>
                  <small v-else>{{ Math.min(danoDisponible(), fuerza(movimiento)) }} {{ t(' de daño · ') }}{{ t(movimiento.descripcion) }}</small>
                </span>
              </v-btn>
            </AudioSonidoBoton>
          </div>
        </template>

        <template v-else-if="fase === 'ataque'">
          <h2>{{ t(ataque.nombre) }}</h2>
          <p role="status">{{ textoAtaque }}</p>
        </template>

        <template v-else-if="fase === 'revision'">
          <h2>{{ ultimaRespuesta.acierto ? (rondaEsquiva ? t('¡Esquiva lograda!') : t('¡Buen golpe!')) : ultimaRespuesta.agotado ? t('Se acabó el tiempo') : t('El guardián te alcanzó') }}</h2>
          <p>{{ t('Respuesta correcta') }} <strong lang="en">{{ pregunta.correcta }}</strong></p>
          <p>{{ pregunta.explicacion }}</p>
          <AudioSonidoBoton @click="siguiente">
            <v-btn block color="amber-lighten-3">{{ t('Siguiente pregunta') }}</v-btn>
          </AudioSonidoBoton>
        </template>

        <template v-else>
          <h2>{{ pruebaRemate ? t('Prueba de remate completada') : vidaRival === 0 ? t('¡Victoria!') : t('Fin del desafío') }}</h2>
          <div v-if="registroRepaso" class="repaso" aria-live="polite">
            <h3 lang="en">{{ registroRepaso.pregunta.texto }}</h3>
            <p>{{ t('Tu respuesta') }} <span lang="en">{{ registroRepaso.respuesta || t('Sin respuesta') }}</span></p>
            <p>{{ t('Respuesta correcta') }} <strong lang="en">{{ registroRepaso.pregunta.correcta }}</strong></p>
            <p>{{ registroRepaso.pregunta.explicacion }}</p>
            <div class="paginas">
              <v-btn size="small" :disabled="indiceRepaso === 0" @click="indiceRepaso--">{{ t('Anterior') }}</v-btn>
              <span>{{ indiceRepaso + 1 }} / {{ historial.length }}</span>
              <v-btn size="small" :disabled="indiceRepaso + 1 === historial.length" @click="indiceRepaso++">{{ t('Siguiente') }}</v-btn>
              <v-btn size="small" @click="indiceRepaso = null">{{ t('Volver al resultado') }}</v-btn>
            </div>
          </div>
          <template v-else-if="!pruebaRemate">
            <div v-if="nivel.numero === 4 && vidaRival === 0" class="epilogo-real" role="status" aria-live="polite">
              <span class="epilogo-sello" aria-hidden="true">{{ t('✦ Victoria del Reino ✦') }}</span>
              <p>{{ t('Lo has logrado, regresaste al castillo del rey; serás recordado hasta el fin de los tiempos.') }}</p>
            </div>
            <p>{{ mensajeFinal }}</p>
            <p>{{ t('Aciertos') }} {{ aciertos }} {{ t(' de ') }}{{ historial.length }}.</p>
            <template v-if="!ultimaRespuesta.acierto">
              <p>{{ t('Respuesta correcta') }} <strong lang="en">{{ pregunta.correcta }}</strong></p>
              <p>{{ pregunta.explicacion }}</p>
            </template>
            <v-btn v-if="historial.length" variant="text" color="amber-lighten-3" @click="indiceRepaso = 0">
              {{ t('Revisar respuestas') }}
            </v-btn>
          </template>
          <div v-if="!registroRepaso" class="opciones">
            <AudioSonidoBoton @click="emit('volver')">
              <v-btn block color="amber-lighten-3" variant="flat">{{ t('Regresar al mapa') }}</v-btn>
            </AudioSonidoBoton>
            <AudioSonidoBoton @click="emit('reintentar')">
              <v-btn block color="amber-lighten-3" variant="tonal">{{ t('Reintentar') }}</v-btn>
            </AudioSonidoBoton>
          </div>
        </template>
      </aside>
    </div>
  </section>
</template>

<script setup>
import CombatClasificar from './CombatClasificar.vue'
import CombatEsquiva from './CombatEsquiva.vue'
import CombatHacha from './CombatHacha.vue'
import CombatCortar from './CombatCortar.vue'
import CombatConjuro from './CombatConjuro.vue'
import CombatErrores from './CombatErrores.vue'
import CombatParejas from './CombatParejas.vue'
import CombatEscuchar from './CombatEscuchar.vue'

const props = defineProps({ nivel: { type: Object, required: true } })
const emit = defineEmits(['victoria', 'volver', 'reintentar'])
const { t } = useLanguage()

const modoPruebas = import.meta.dev
const pruebaRemate = ref(false)
const puedeProbarRemate = computed(() => modoPruebas && vidaRival.value > 0 &&
  fase.value !== 'ataque' && fase.value !== 'resultado')

function superarPrueba() {
  emit('victoria')
  emit('volver')
}

const ataques = [
  { id: 'hachazo', nombre: 'Hachazo descendente', dano: 24, duracion: 2400, sangre: true, descripcion: 'Golpe pesado' },
  { id: 'barrido', nombre: 'Barrido de hacha', dano: 22, duracion: 2200, sangre: true, descripcion: 'Corte veloz' },
  { id: 'escudo', nombre: 'Golpe de escudo', dano: 21, duracion: 2300, descripcion: 'Reduce el próximo golpe' },
  { id: 'rayo', nombre: 'Rayo del Alba', dano: 27, duracion: 2900, magia: true, descripcion: 'Relámpago · 1 uso por duelo' },
  { id: 'fenix', nombre: 'Llama del Fénix', dano: 20, duracion: 3200, magia: true, curacion: 12, descripcion: 'Recupera hasta 12 de vida' }
]

const segundosPorActividad = {
  ordenar: 35, escuchar: 35, parejas: 32, errores: 28, clasificar: 26,
  'romper-hechizo': 26, 'proteger-aliado': 26, zona: 25, 'esquiva-frase': 24,
  esquivar: 20, cortar: 22, hacha: 20
}
const DANO_PALABRA = 14
const CURACION_PALABRA = 8

const fase = ref('pregunta')
const indice = ref(0)
const respuesta = ref('')
const vidaCaballero = ref(100)
const vidaRival = ref(props.nivel.vida)
const escudoPreparado = ref(false)
const ataque = ref(null)
const danoAplicado = ref(null)
const curacionAplicada = ref(0)
const rayoUsado = ref(false)
const historial = ref([])
const indiceRepaso = ref(null)
const registroRepaso = computed(() => historial.value[indiceRepaso.value])
const agotado = ref(false)
const efectoPalabra = ref(null)
let idEfectoPalabra = 0

// Furia: cada acierto o bloqueo llena una carga; con todas, el siguiente ataque hace +50 %. Fallar o agotar el tiempo la reinicia.
const FURIA_MAXIMA = 3
const BONO_FURIA = 1.5
const furia = ref(0)
// Contraataque: tras un golpe acertado, el guardián responde y el jugador puede hacer una parada con tiempo.
// bloqueo: '' (ninguno) | 'perfecto' (sin daño) | 'parcial' (mitad de daño). Bloquear nunca daña al guardián ni da Furia.
const VENTANA_PERFECTA = 250 // ms alrededor del impacto
const VENTANA_PARCIAL = 650
const bloqueo = ref('')
const duracionAnillo = ref(0)
const paradaPronto = ref(false)
let impactoNominal = 0
let temporizadorPronto = null
const avisoFase = ref(false)
let temporizadorAviso = null
let temporizadorBanner = null
// Segunda fase: con la mitad de vida o menos el guardián se enfurece (contraataque más rápido y más fuerte).
const enfurecido = computed(() => vidaRival.value > 0 && vidaRival.value <= props.nivel.vida / 2)
const danoContra = computed(() => Math.round(props.nivel.dano * (enfurecido.value ? 0.75 : 0.5)))
const paradaActiva = computed(() => fase.value === 'aviso-contra' ||
  (fase.value === 'ataque' && Boolean(ataque.value?.contra) && danoAplicado.value === null))
const textoAtaque = computed(() => {
  if (ataque.value?.contra) {
    if (danoAplicado.value === null) return t(bloqueo.value ? '¡Bloqueo preparado!' : 'El guardián contraataca… ¡toca el escudo!')
    if (bloqueo.value === 'perfecto') return t('¡Parada perfecta! Sin daño.')
    if (bloqueo.value === 'parcial') return t('¡Bloqueo parcial! Recibes la mitad.')
    return t('¡Impacto!')
  }
  if (danoAplicado.value === null) return t('Preparando el ataque…')
  return ataque.value?.esquivado ? t('¡Esquivaste el ataque!') : t('¡Impacto!')
})

const pregunta = computed(() => props.nivel.preguntas[indice.value])
const rondaHacha = computed(() => pregunta.value.tipo === 'hacha')
const rondaCortes = computed(() => pregunta.value.tipo === 'cortar')
const rondaEsquiva = computed(() => ['esquivar', 'esquiva-frase'].includes(pregunta.value.tipo))
const rondaPanel = computed(() => ['errores', 'parejas', 'zona'].includes(pregunta.value.tipo))
let desconectarPanel
function ajustarPanel(contenido, indicePregunta) {
  desconectarPanel?.()
  contenido.classList.remove('superpuesto')
  if (indicePregunta === null) return
  const panel = contenido.querySelector('.panel, .mesa-frase')
  if (!panel) return
  const horizontal = window.matchMedia('(orientation: landscape) and (max-height: 600px), (orientation: landscape) and (pointer: coarse)')
  function medir() {
    // Medir siempre debajo de la arena, incluso si la pregunta ya está superpuesta.
    contenido.classList.remove('superpuesto')
    if (horizontal.matches && panel.scrollHeight > panel.clientHeight + 1) {
      contenido.classList.add('superpuesto')
    }
  }
  const tamano = new ResizeObserver(medir)
  tamano.observe(contenido)
  tamano.observe(panel)
  const cambios = new MutationObserver(medir)
  cambios.observe(panel, { subtree: true, childList: true, characterData: true, attributes: true })
  horizontal.addEventListener('change', medir)
  desconectarPanel = () => {
    tamano.disconnect()
    cambios.disconnect()
    horizontal.removeEventListener('change', medir)
    desconectarPanel = undefined
  }
  medir()
}
const vPanelAdaptable = {
  mounted(el, { value }) { ajustarPanel(el, value) },
  updated(el, { value, oldValue }) { if (value !== oldValue) ajustarPanel(el, value) },
  unmounted() { desconectarPanel?.() }
}
const rondaConjuro = computed(() => ['romper-hechizo', 'proteger-aliado'].includes(pregunta.value.tipo))
let temporizadorConjuro = null
const desplazamientoEsquiva = ref(0)
const posicionEsquiva = computed(() => {
  if (ataque.value?.lado) return ataque.value.posicion
  if (fase.value === 'pregunta' && rondaEsquiva.value) return desplazamientoEsquiva.value
  return null
})
const instruccion = computed(() => {
  if (rondaCortes.value) return t('Desliza sobre las dos fichas incorrectas. Deja intacta la correcta.')
  if (rondaHacha.value) return t('Arrastra el hacha y corta las tres bolas antes de que lleguen al caballero.')
  if (pregunta.value.tipo === 'romper-hechizo') return t('Arrastra not al lugar correcto del hechizo para devolver su magia.')
  if (pregunta.value.tipo === 'proteger-aliado') return t('Une las palabras de la promesa en un trazo. Si te equivocas, suelta y vuelve a empezar.')
  if (pregunta.value.tipo === 'esquivar') return t('Lee el aviso y arrastra al héroe hacia un lado del puente.')
  if (pregunta.value.tipo === 'esquiva-frase') return t('Arrastra la ficha al espacio del aviso para activar la esquiva.')
  if (pregunta.value.tipo === 'errores') return t('Toca la palabra incorrecta de la frase.')
  if (pregunta.value.tipo === 'parejas') return t('Toca una carta de cada columna para unir las parejas. Tienes dos errores.')
  if (pregunta.value.tipo === 'escuchar') return t('Escucha la frase y toca la opción que oíste.')
  if (pregunta.value.tipo === 'clasificar') return t('Suelta las palabras sobre los personajes antes de que ataque el guardián.')
  return t('Si aciertas, eliges un ataque. Si fallas o se acaba el tiempo, el guardián te ataca.')
})
const armandoFrase = computed(() => fase.value === 'pregunta' && pregunta.value.tipo === 'ordenar')
const consignaCampo = computed(() => {
  if (fase.value !== 'pregunta') return ''
  if (pregunta.value.tipo === 'proteger-aliado') return pregunta.value.contexto
  return ['clasificar', 'cortar', 'hacha', 'esquivar'].includes(pregunta.value.tipo) ? pregunta.value.texto : ''
})
const ayudaAbierta = ref(false)
const tiempoTotal = computed(() => pregunta.value.tiempo ?? props.nivel.tiempo ?? segundosPorActividad[pregunta.value.tipo] ?? 25)
const tiempoRestante = ref(tiempoTotal.value)
// El enemigo carga su ataque a medida que se acaba el tiempo
const carga = computed(() => {
  // Durante el aviso del contraataque el guardián se muestra cargado
  if (fase.value === 'aviso-contra') return 0.9
  if (fase.value === 'pregunta') return 1 - tiempoRestante.value / tiempoTotal.value
  return fase.value === 'elegir' ? 0 : null
})

let reloj = null
let ultimoTick = 0

function arrancarReloj() {
  ayudaAbierta.value = false
  pararReloj()
  tiempoRestante.value = tiempoTotal.value
  ultimoTick = performance.now()
  reloj = setInterval(tick, 100)
}

function pararReloj() {
  if (reloj) clearInterval(reloj)
  reloj = null
}

function reiniciarReferencia() {
  ultimoTick = performance.now()
}

function tick() {
  const ahora = performance.now()
  const transcurrido = ahora - ultimoTick
  ultimoTick = ahora
  // El tiempo no corre con la pestaña oculta
  if (document.hidden || ayudaAbierta.value) return
  tiempoRestante.value = Math.max(0, tiempoRestante.value - transcurrido / 1000)
  if (tiempoRestante.value === 0) agotar()
}

function agotar() {
  if (fase.value !== 'pregunta') return
  pararReloj()
  agotado.value = true
  respuesta.value = ''
  if (rondaEsquiva.value) lanzarColetazo(false)
  else iniciarAtaque(ataqueRival())
}

// Dos canales para que la voz del jefe y el golpe puedan sonar a la vez
const golpeSonido = reactive({ ruta: '', disparo: 0 })
const vozJefe = reactive({ ruta: '', disparo: 0 })
const sonidosJefe = computed(() => `/audio/combate/jefe-${props.nivel.numero}`)

function sonar(canal, ruta) {
  canal.ruta = ruta
  canal.disparo++
}

watch([fase, indice], () => (fase.value === 'pregunta' ? arrancarReloj() : pararReloj()))
onMounted(() => {
  window.addEventListener('keydown', teclaParada)
  document.addEventListener('visibilitychange', reiniciarReferencia)
  arrancarReloj()
  sonar(vozJefe, `${sonidosJefe.value}-grito.mp3`)
})
watch(enfurecido, (activo) => {
  if (!activo) return
  avisoFase.value = true
  sonar(vozJefe, `${sonidosJefe.value}-grito.mp3`)
  clearTimeout(temporizadorBanner)
  temporizadorBanner = setTimeout(() => { avisoFase.value = false }, 2200)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', teclaParada)
  document.removeEventListener('visibilitychange', reiniciarReferencia)
  pararReloj()
  clearTimeout(temporizadorConjuro)
  clearTimeout(temporizadorAviso)
  clearTimeout(temporizadorBanner)
  clearTimeout(temporizadorPronto)
})

function ataqueRival() {
  return { id: 'rival', nombre: props.nivel.golpe, dano: props.nivel.dano, duracion: 2600, sangre: props.nivel.corte }
}
const ultimaRespuesta = computed(() => historial.value[historial.value.length - 1])
const aciertos = computed(() => historial.value.filter((registro) => registro.acierto).length)
const mensajeFinal = computed(() => {
  if (vidaRival.value === 0) return `${t('Derrotaste al guardián de')} ${props.nivel.nombre}.`
  if (vidaCaballero.value === 0) return t('El caballero se quedó sin vida.')
  return t('El guardián resistió los seis desafíos. Puedes revisar tus respuestas y volver a intentarlo.')
})

// Reservar vida para las rondas pendientes evita que un ataque fuerte se salte su actividad.
function danoDisponible() {
  const rondasPendientes = props.nivel.preguntas.length - indice.value - 1
  const reserva = Math.ceil(props.nivel.vida * rondasPendientes / (2 * props.nivel.preguntas.length))
  return Math.max(0, vidaRival.value - reserva)
}

function fuerza(movimiento) {
  const base = movimiento.dano + (props.nivel.debilidad === movimiento.id ? 4 : 0)
  return furia.value >= FURIA_MAXIMA ? Math.round(base * BONO_FURIA) : base
}

function ganarFuria() {
  furia.value = Math.min(FURIA_MAXIMA, furia.value + 1)
}

function normalizar(texto) {
  return texto.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.?!]+$/, '').trimEnd().replace(/\s+/g, ' ')
}

function responder(opcion) {
  if (fase.value !== 'pregunta') return
  respuesta.value = opcion
  agotado.value = false

  const { correcta, alternativas = [] } = pregunta.value
  const solucion = normalizar(opcion)
  if ([correcta, ...alternativas].some((valida) => normalizar(valida) === solucion)) {
    fase.value = 'elegir'
    return
  }

  iniciarAtaque(ataqueRival())
}

function resolverConjuro(opcion) {
  if (fase.value !== 'pregunta') return
  pararReloj()
  respuesta.value = opcion
  agotado.value = false
  if (normalizar(opcion) !== normalizar(pregunta.value.correcta)) {
    iniciarAtaque(ataqueRival())
    return
  }

  fase.value = 'conjuro'
  if (pregunta.value.tipo === 'romper-hechizo') {
    const dano = Math.min(12, danoDisponible())
    vidaRival.value -= dano
    mostrarEfectoPalabra('monstruo', 'dano', `−${dano} PV`)
    sonar(golpeSonido, '/audio/combate/rayo.mp3')
    if (vidaRival.value === 0) sonar(vozJefe, `${sonidosJefe.value}-derrota.mp3`)
  } else {
    escudoPreparado.value = true
    sonar(golpeSonido, '/audio/combate/escudo.mp3')
  }

  temporizadorConjuro = setTimeout(() => {
    temporizadorConjuro = null
    if (vidaRival.value === 0) {
      historial.value.push({ pregunta: pregunta.value, respuesta: respuesta.value, acierto: true, agotado: false })
      cerrarRonda()
    } else {
      fase.value = 'elegir'
    }
  }, 850)
}

function lanzarColetazo(esquivado, posicion = 0) {
  const lado = pregunta.value.lado ?? 'derecha'
  pararReloj()
  iniciarAtaque({ ...ataqueRival(), duracion: 1500, lado, posicion, esquivado, sangre: false })
}

function cortarAtaque() {
  if (!rondaHacha.value || fase.value !== 'pregunta') return
  pararReloj()
  respuesta.value = pregunta.value.correcta
  agotado.value = false
  fase.value = 'intercepcion'
  sonar(golpeSonido, '/audio/combate/escudo.mp3')
  temporizadorConjuro = setTimeout(() => {
    temporizadorConjuro = null
    fase.value = 'elegir'
  }, 500)
}

function esquivar(lado) {
  if (fase.value !== 'pregunta') return
  respuesta.value = lado === 'izquierda' ? 'Move left.' : 'Move right.'
  lanzarColetazo(lado !== pregunta.value.lado, lado === 'izquierda' ? -15 : 15)
}

function completarAviso(ficha) {
  if (fase.value !== 'pregunta') return
  respuesta.value = ficha
  const esquivado = ficha === pregunta.value.correcta
  lanzarColetazo(esquivado, esquivado ? -15 : 0)
}

function mostrarEfectoPalabra(destino, tipo, texto) {
  efectoPalabra.value = { destino, tipo, texto, id: ++idEfectoPalabra }
}

function aplicarPalabra(destino) {
  if (fase.value !== 'pregunta') return
  if (destino === 'heroe') {
    const recuperado = Math.min(100 - vidaCaballero.value, CURACION_PALABRA)
    vidaCaballero.value += recuperado
    mostrarEfectoPalabra(destino, 'cura', recuperado ? `+${recuperado} PV` : t('Vida al máximo'))
    return
  }

  const dano = Math.min(danoDisponible(), DANO_PALABRA)
  vidaRival.value -= dano
  mostrarEfectoPalabra(destino, 'dano', `−${dano} PV`)
  sonar(golpeSonido, '/audio/combate/escudo.mp3')
}

function palabraIncorrecta(destino) {
  if (fase.value === 'pregunta') mostrarEfectoPalabra(destino, 'error', t('Prueba con el otro personaje'))
}

function completarPalabras() {
  if (fase.value !== 'pregunta') return
  historial.value.push({ pregunta: pregunta.value, respuesta: pregunta.value.correcta, acierto: true, agotado: false })
  ganarFuria()
  cerrarRonda()
}

function atacar(movimiento) {
  if (fase.value !== 'elegir') return
  if (movimiento.id === 'rayo') {
    if (rayoUsado.value) return
    rayoUsado.value = true
  }
  const usaFuria = furia.value >= FURIA_MAXIMA
  const dano = Math.min(danoDisponible(), fuerza(movimiento))
  if (usaFuria) furia.value = 0
  // El golpe que remata al guardián se convierte en una secuencia final
  if (dano >= vidaRival.value) {
    iniciarRemate(dano)
    return
  }
  iniciarAtaque({ ...movimiento, dano, furia: usaFuria })
}

function probarRemate() {
  if (!puedeProbarRemate.value) return
  pararReloj()
  clearTimeout(temporizadorConjuro)
  temporizadorConjuro = null
  clearTimeout(temporizadorAviso)
  temporizadorAviso = null
  bloqueo.value = ''
  efectoPalabra.value = null
  pruebaRemate.value = true
  iniciarRemate(vidaRival.value)
}

function iniciarRemate(dano) {
  const remate = props.nivel.remate
  const nombresRemate = {
    solar: '¡Ascensión solar!',
    cruzado: '¡Corte cruzado!',
    sombras: '¡Alzaos, sombras!'
  }
  iniciarAtaque({
    id: 'hachazo', nombre: nombresRemate[remate] ?? '¡Golpe final!',
    dano, duracion: remate === 'solar' ? 14000 : 5600, sangre: !remate, final: true, remate
  })
}

function iniciarAtaque(movimiento) {
  ataque.value = movimiento
  danoAplicado.value = null
  curacionAplicada.value = 0
  fase.value = 'ataque'
  if (movimiento.id === 'rival') sonar(vozJefe, `${sonidosJefe.value}-grito.mp3`)
}

function impactar() {
  if (fase.value !== 'ataque' || danoAplicado.value !== null) return
  const golpe = ataque.value

  if (golpe.esquivado) {
    danoAplicado.value = 0
  } else if (golpe.id === 'rival' && golpe.contra && bloqueo.value === 'perfecto') {
    // Parada perfecta: no hay daño y el escudo preparado se conserva
    danoAplicado.value = 0
  } else if (golpe.id === 'rival') {
    const mitigacion = escudoPreparado.value ? 12 : 0
    // Parada parcial: la mitad del daño. El contraataque es un castigo suave: nunca deja al caballero sin vida
    const base = golpe.contra && bloqueo.value === 'parcial' ? Math.ceil(golpe.dano / 2) : golpe.dano
    const maximo = golpe.contra ? vidaCaballero.value - 1 : vidaCaballero.value
    danoAplicado.value = Math.max(0, Math.min(maximo, base - mitigacion))
    vidaCaballero.value -= danoAplicado.value
    escudoPreparado.value = false
  } else {
    danoAplicado.value = Math.min(vidaRival.value, golpe.dano)
    vidaRival.value -= danoAplicado.value
    if (golpe.id === 'escudo') escudoPreparado.value = true
    if (golpe.curacion) {
      curacionAplicada.value = Math.min(100 - vidaCaballero.value, golpe.curacion)
      vidaCaballero.value += curacionAplicada.value
    }
  }

  if (golpe.id === 'rival') sonar(golpeSonido, golpe.contra && bloqueo.value ? '/audio/combate/escudo.mp3' : `${sonidosJefe.value}-golpe.mp3`)
  else sonar(golpeSonido, `/audio/combate/${golpe.final ? 'golpe-final' : golpe.id}.mp3`)
  if (vidaRival.value === 0) sonar(vozJefe, `${sonidosJefe.value}-derrota.mp3`)
}

function terminarAtaque() {
  if (fase.value !== 'ataque') return
  impactar()
  if (pruebaRemate.value) {
    ataque.value = null
    fase.value = 'resultado'
    return
  }
  const golpe = ataque.value
  // Fin del contraataque: la ronda ya estaba anotada en el historial
  if (golpe.contra) {
    ataque.value = null
    bloqueo.value = ''
    cerrarRonda()
    return
  }
  const esquivado = golpe.esquivado
  if (!esquivado) {
    historial.value.push({ pregunta: pregunta.value, respuesta: respuesta.value, acierto: golpe.id !== 'rival', agotado: agotado.value })
  }
  ataque.value = null

  if (esquivado) {
    fase.value = 'elegir'
    return
  }
  if (golpe.id === 'rival') furia.value = 0
  else if (!golpe.furia) ganarFuria()
  if (puedeContraatacar(golpe)) {
    iniciarAviso()
    return
  }
  cerrarRonda()
}

// Las rondas de esquiva y de hacha ya tienen su propio ataque del guardián, así que no llevan contraataque.
function puedeContraatacar(golpe) {
  return golpe.id !== 'rival' && !golpe.final && vidaRival.value > 0 && vidaCaballero.value > 0 &&
    !rondaEsquiva.value && !rondaHacha.value
}

function iniciarAviso() {
  const aviso = enfurecido.value ? 450 : 700
  // El impacto llega al 54 % de la duración del ataque; el anillo se cierra justo en ese momento.
  duracionAnillo.value = aviso + Math.round(ataqueRival().duracion * 0.54)
  impactoNominal = performance.now() + duracionAnillo.value
  bloqueo.value = ''
  fase.value = 'aviso-contra'
  temporizadorAviso = setTimeout(() => {
    temporizadorAviso = null
    iniciarAtaque({ ...ataqueRival(), nombre: 'Contraataque', dano: danoContra.value, contra: true })
  }, aviso)
}

// Parada con tiempo: cuanto más cerca del impacto, mejor. Demasiado pronto no cuenta (se puede volver a intentar).
function parar() {
  if (bloqueo.value || !paradaActiva.value) return
  const distancia = Math.abs(performance.now() - impactoNominal)
  if (distancia > VENTANA_PARCIAL) {
    paradaPronto.value = true
    clearTimeout(temporizadorPronto)
    temporizadorPronto = setTimeout(() => { paradaPronto.value = false }, 260)
    return
  }
  bloqueo.value = distancia <= VENTANA_PERFECTA ? 'perfecto' : 'parcial'
}

function teclaParada(evento) {
  if (evento.repeat || !paradaActiva.value || !['Space', 'Enter'].includes(evento.code)) return
  evento.preventDefault()
  parar()
}

function cerrarRonda() {
  const terminado = vidaRival.value === 0 || vidaCaballero.value === 0 || historial.value.length === props.nivel.preguntas.length
  fase.value = terminado ? 'resultado' : 'revision'
  if (vidaRival.value === 0 && historial.value.length === props.nivel.preguntas.length) emit('victoria')
}

function siguiente() {
  if (fase.value !== 'revision') return
  efectoPalabra.value = null
  desplazamientoEsquiva.value = 0
  indice.value++
  if (pregunta.value.invocacion) {
    fase.value = 'invocacion'
    temporizadorConjuro = setTimeout(() => {
      temporizadorConjuro = null
      fase.value = 'pregunta'
    }, 1200)
  } else {
    fase.value = 'pregunta'
  }
}
</script>

<style scoped>
/* El combate mide exactamente la pantalla visible: cabecera arriba, panel abajo
   y la arena ocupa todo lo que sobra. Así nunca aparece scroll en la página. */
.desafio {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  padding:
    max(0.4rem, env(safe-area-inset-top))
    max(clamp(0.5rem, 2vw, 1.8rem), env(safe-area-inset-right))
    max(0.6rem, env(safe-area-inset-bottom))
    max(clamp(0.5rem, 2vw, 1.8rem), env(safe-area-inset-left));
  background: radial-gradient(ellipse at top, #252b31, #11161e 76%);
  color: #f1e8d3;
  overscroll-behavior: none;
}
.cabecera, .contenido { width: 100%; max-width: 1240px; margin-inline: auto; }
.cabecera { flex: none; display: flex; align-items: center; flex-wrap: wrap; gap: 0.15rem 0.75rem; margin-bottom: 0.4rem; }
.cabecera :deep(.v-btn) { min-height: 40px; letter-spacing: 0.06em; }
h1 { min-width: 0; color: #f5e5c2; font-family: Georgia, serif; font-size: clamp(1rem, 3vw, 1.45rem); }
h1 small { color: #c4c7cd; font-family: system-ui, sans-serif; font-size: 0.68em; font-weight: 500; }
.contenido { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 0.55rem; }

.zona-escena { position: relative; flex: 1 1 0; min-height: 0; min-width: 0; display: flex; flex-direction: column; }
.vista-arena { min-height: 0; min-width: 0; flex: 1; display: flex; flex-direction: column; }
.campo { flex: 1; min-height: 0; container-type: size; display: grid; align-items: center; --alto-escena: min(100cqh, 62cqw); }
.banda-ronda { flex: none; width: 100%; max-width: 1240px; margin: 0 auto 4px; display: flex; align-items: center; gap: 12px; }
.banda-ronda .reloj { flex: 1; max-width: 24rem; margin: 0 0 0 auto; }
.banda-ronda .ayuda-desafio { margin: 0; }
.ayuda-desafio[open] p { position: absolute; top: 100%; left: 0; z-index: 20; width: min(270px, 60vw); padding: 8px; background: #121c2b; border: 1px solid #b3955c; border-radius: 5px; }
.marcador { flex: none; padding: 3px 10px; }
.consigna-campo { flex: none; text-align: center; margin: 0; padding: 3px 8px; color: #ffebc3; background: #1a222b; font: 600 clamp(13px, 1.8vw, 19px)/1.2 Georgia, serif; }
.mesa-frase { flex: none; border: 1px solid #917751; border-radius: 8px; background: #182029; padding: 6px 12px; }
/* Panel del desafío: toma lo que necesita; si el contenido es muy largo
   (revisión final) se desplaza por dentro, sin barra visible. */
.panel {
  flex: 0 1 auto;
  max-height: 68%;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.marcador { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(0.85rem, 2.5vw, 2.2rem); }
.identidad {
  margin: 0 0 0.2rem;
  color: #fff4dc;
  font: clamp(0.78rem, 1.8vw, 1.17rem) / 1.15 Georgia, serif;
  text-shadow: 0 1px 4px #000, 0 0 10px #000;
}
.identidad strong { font-weight: 600; }
.identidad span { font-variant-numeric: tabular-nums; white-space: nowrap; }
.marcador-rival { text-align: right; }
.marco-vida {
  position: relative;
  padding: 2px;
  border: 1px solid #c2a47a;
  border-radius: 4px;
  background: linear-gradient(#8c7b62, #423830 55%, #16191b);
  box-shadow: 0 2px 6px #000c;
}
.marco-vida::before, .marco-vida::after {
  content: '';
  position: absolute;
  z-index: -1;
  top: 50%;
  width: 10px;
  height: 10px;
  border: 1px solid #bca382;
  background: #524739;
  transform: translateY(-50%) rotate(45deg);
}
.marco-vida::before { left: -6px; }
.marco-vida::after { right: -6px; }
.marco-vida :deep(.v-progress-linear) { height: clamp(8px, 1.45dvh, 13px) !important; background: #13171b; }
.marco-vida :deep(.v-progress-linear__background) { opacity: 0; }
.marco-vida :deep(.v-progress-linear__determinate) {
  background-image: linear-gradient(#fff5, #fff1 43%, #0003 56%, #0005);
  box-shadow: inset 0 0 4px #1118;
}
/* Furia y contraataque */
.furia { display: flex; align-items: center; gap: 4px; margin-top: 3px; color: #ffe09a; font: 700 clamp(0.6rem, 1.4vw, 0.8rem) Georgia, serif; text-shadow: 0 1px 3px #000; }
.furia-etiqueta { margin-right: 4px; }
.furia i { width: 11px; height: 11px; border: 1.5px solid #ffcf6b; border-radius: 50%; background: #1a1308aa; }
.furia i.llena { background: radial-gradient(circle at 35% 35%, #fff, #ffb300 65%); box-shadow: 0 0 7px #ffb300; animation: llenar-furia 300ms cubic-bezier(.2, 1.6, .4, 1); }
.furia.llena .furia-etiqueta { color: #fff3c4; animation: latido-furia 700ms ease-in-out infinite alternate; }
@keyframes llenar-furia { from { scale: 0.3; } 60% { scale: 1.4; } }
@keyframes latido-furia { to { scale: 1.06; text-shadow: 0 0 8px #ffb300; } }
.aviso-furia { color: #ffe09a; font-weight: 700; }

/* Parada con tiempo: el anillo se cierra sobre el torso del caballero (≈ 24 % / 47 % de la escena) */
.parada {
  position: absolute;
  left: 24%;
  top: 47%;
  z-index: 6;
  width: clamp(60px, 11vmin, 92px);
  aspect-ratio: 1;
  translate: -50% -50%;
  pointer-events: none;
}
.escudo-parada {
  position: relative;
  width: 100%;
  height: 100%;
  border: 3px solid #ffe09a;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff4, #1d2f4af0 70%);
  box-shadow: 0 0 14px #ffd54f88;
  color: #fff;
  font-size: clamp(1.3rem, 4vmin, 2.1rem);
  line-height: 1;
  cursor: pointer;
  pointer-events: auto;
  touch-action: none;
  user-select: none;
}
.escudo-parada::before { content: ''; position: absolute; inset: -18px; border-radius: 50%; }
.anillo-parada {
  position: absolute;
  inset: -3px;
  border: 4px solid #ff8a65;
  border-radius: 50%;
  pointer-events: none;
  animation: cerrar-anillo var(--t) linear both;
}
@keyframes cerrar-anillo { from { scale: 3.2; opacity: 0.3; } to { scale: 1; opacity: 1; } }
.escudo-parada.pronto { border-color: #ff6b5a; animation: sacudir-escudo 260ms ease-out; }
@keyframes sacudir-escudo { 25% { translate: -5px 0; } 75% { translate: 5px 0; } }
.escudo-parada.logrado { border-color: #89d6ad; box-shadow: 0 0 18px #89d6ad; }
.escudo-parada.logrado .anillo-parada { animation: none; scale: 1; border-color: #89d6ad; }
.banner-fase {
  position: absolute;
  left: 50%;
  top: 30%;
  z-index: 6;
  margin: 0;
  padding: 0.35rem 1rem;
  translate: -50% 0;
  border: 1px solid #ff8a65;
  border-radius: 6px;
  background: #2a0c08e6;
  color: #ffd0c0;
  max-width: calc(100% - 1rem);
  font: 800 clamp(1.05rem, 2.8vw, 1.5rem) / 1.25 Georgia, serif;
  letter-spacing: 0.06em;
  text-shadow: 0 0 10px #ff5722;
  text-align: center;
  pointer-events: none;
  animation: entrar-banner 2.2s ease-out both;
}
@keyframes entrar-banner {
  0% { opacity: 0; scale: 0.6; }
  12% { opacity: 1; scale: 1.12; }
  22% { scale: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .furia i.llena, .furia.llena .furia-etiqueta, .escudo-parada.pronto { animation: none; }
  .banner-fase { animation: none; }
}

.reloj { display: flex; align-items: center; gap: 0.5rem; margin: 0.2rem 0 0.1rem; }
.reloj-barra { flex: 1; height: 6px; overflow: hidden; border-radius: 3px; background: #0006; }
.reloj-barra span { display: block; height: 100%; transform-origin: left; background: linear-gradient(90deg, #e6b96e, #f3d58f); transition: transform 100ms linear; }
.reloj-num { min-width: 2.2rem; color: #f3d58f; font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
.reloj.urgente .reloj-barra span { background: linear-gradient(90deg, #d4483a, #ff8a5c); }
.reloj.urgente .reloj-num { color: #ff9a7a; animation: latido-reloj 500ms ease-in-out infinite alternate; }
.reloj.urgente .reloj-barra { box-shadow: 0 0 8px #ff6b4acc; }
@keyframes latido-reloj { to { scale: 1.2; } }
@media (prefers-reduced-motion: reduce) {
  .reloj.urgente .reloj-num { animation: none; }
}
/* Aviso del escudo: flota sobre el borde inferior de la arena para no robar alto */
.proteccion {
  position: absolute;
  left: 0.5rem;
  bottom: 0.4rem;
  z-index: 5;
  margin: 0;
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  background: #101928e0;
  color: #b8dcec;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
  pointer-events: none;
}
.panel { padding: 0.55rem clamp(0.6rem, 2vw, 1.25rem); border: 1px solid #74634d; border-radius: 8px; background: linear-gradient(110deg, #292927, #1b2028 78%); }
.etiqueta { color: #e6b96e; font-size: 0.67rem; font-weight: 800; letter-spacing: 0.13em; }
h2 { margin: 0.2rem 0 0.35rem; color: #fff0cc; font-family: Georgia, serif; font-size: clamp(1rem, 2.5vw, 1.35rem); }
.panel p:not(.etiqueta) { margin-bottom: 0.5rem; font-size: 0.95rem; line-height: 1.35; }
.epilogo-real {
  position: relative;
  margin: 0.55rem 0 0.75rem;
  padding: 0.75rem clamp(0.75rem, 3vw, 1.5rem);
  border: 2px solid #c9a65f;
  border-radius: 8px;
  background:
    linear-gradient(135deg, #6e5126 0%, #33291e 12%, #211e1a 50%, #33291e 88%, #6e5126 100%);
  box-shadow: inset 0 0 0 3px #241b1477, 0 3px 12px #0008;
  color: #fff0c2;
  text-align: center;
}
.epilogo-sello {
  display: block;
  margin-bottom: 0.35rem;
  color: #f0cc7b;
  font: 700 0.82rem Georgia, serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.panel .epilogo-real p:not(.etiqueta) {
  margin: 0;
  color: #fff2d5;
  font: 700 clamp(1.05rem, 2vw, 1.35rem) / 1.4 Georgia, serif;
  text-shadow: 0 1px 3px #000;
}
.ayuda-desafio { position: relative; margin: 0; font-size: 0.85rem; }
.ayuda-desafio summary {
  padding: 0.2rem 0.55rem;
  border: 1px solid #8a775a;
  border-radius: 5px;
  color: #ffe09a;
  font-weight: 700;
  cursor: pointer;
}
.paginas { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.opciones { display: grid; gap: 0.35rem; }
.movimiento { display: grid; line-height: 1.3; text-align: left; }
.movimiento small { font-size: 0.72rem; }
.panel :deep(.v-btn) { min-height: 44px; height: auto; padding-block: 0.35rem; border: 1px solid #b3955c57; text-transform: none; letter-spacing: normal; }
.panel :deep(.v-btn__content) { white-space: normal; }
details { margin-block: 0.55rem; font-size: 0.82rem; }
summary { cursor: pointer; color: #ffe09a; }
.aviso-completado {
  position: absolute;
  inset: 3.5rem 0.45rem auto;
  z-index: 2;
  width: fit-content;
  max-width: calc(100% - 1rem);
  margin-inline: auto;
  padding: 0.4rem 0.75rem;
  border: 1px solid #83bc90;
  border-radius: 6px;
  background: #101928f5;
  color: #dcf4df;
  font: 800 clamp(1rem, 2.8vw, 1.45rem) / 1.25 Georgia, serif;
  text-align: center;
  pointer-events: none;
}
.efecto-palabra {
  position: absolute;
  z-index: 11;
  top: 46%;
  left: 25%;
  translate: -50% -50%;
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  background: #101928ec;
  color: #a8efb6;
  font-weight: 800;
  text-align: center;
  pointer-events: none;
  animation: impacto-palabra 850ms ease-out both;
}
.efecto-palabra.monstruo { left: 74%; }
.efecto-palabra.dano { color: #ff9988; }
.efecto-palabra.error { color: #ffe09a; font-size: 1rem; }
@keyframes impacto-palabra {
  0% { opacity: 0; }
  15%, 70% { opacity: 1; }
  100% { opacity: 0; translate: -50% -120%; }
}
@media (prefers-reduced-motion: reduce) {
  .efecto-palabra { animation-name: fundido-palabra; }
  @keyframes fundido-palabra {
    0%, 80% { opacity: 1; }
    100% { opacity: 0; }
  }
}

@media (min-width: 530px) {
  .opciones { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ataques { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 780px) {
  .ataques { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}

@media (orientation: landscape) and (max-height: 470px) {
  .panel p:not(.etiqueta) { font-size: 0.85rem; }
  .cabecera { margin-bottom: 0.3rem; }
}

/* La arena y los controles comparten el ancho disponible. */
@media (orientation: landscape) and (max-height: 520px) {
  .desafio { padding-top: max(0.25rem, env(safe-area-inset-top)); padding-bottom: max(0.3rem, env(safe-area-inset-bottom)); }
  .cabecera { flex-wrap: nowrap; gap: 0.5rem; margin-bottom: 0.25rem; }
  .cabecera :deep(.v-btn) { min-height: 32px; height: 32px; padding-inline: 0.5rem; font-size: 0.72rem; }
  h1 { flex: 1; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .contenido, .zona-escena.con-frase { gap: 4px; }
  .con-frase .mesa-frase { min-height: 0; max-height: 44%; overflow-y: auto; }
  .campo { --alto-escena: 100cqh; }
  .banda-ronda { gap: 8px; }
  .identidad { font-size: clamp(12px, 2.9dvh, 15px); }
  .marcador { padding: 0 5px 3px; }
  .furia { font-size: 10px; margin-top: 1px; }
  .cabecera { min-height: 30px; }
  .panel {
    flex: 0 1 auto;
    max-height: 42%;
    padding: 0.4rem 0.55rem;
  }
  .panel :deep(.v-btn) { min-height: 38px; padding-block: 0.2rem; }
  .opciones, .ataques { grid-template-columns: repeat(auto-fit, minmax(105px, 1fr)); }
  h2 { margin: 0.1rem 0 0.2rem; font-size: 0.95rem; }
  .movimiento small { font-size: 0.65rem; }
  .panel p:not(.etiqueta) { margin-bottom: 0.3rem; }
  /* Títulos y textos de las actividades del panel (componentes hijos) */
  .panel :deep(h2) { margin: 0.1rem 0 0.2rem; font-size: 1rem; line-height: 1.2; }
  .panel :deep(p) { font-size: 0.9rem; }
  .ayuda-desafio { font-size: 0.8rem; }
}

/* El HUD ocupa su propia fila. Las actividades comparten la segunda con la arena. */
@media (orientation: landscape) and (max-height: 600px), (orientation: landscape) and (pointer: coarse) {
  .con-frase .mesa-frase { min-height: 0; max-height: 44%; overflow-y: auto; }
  .contenido .panel.resultado { max-height: none; }
  .contenido.superpuesto {
    display: grid;
    grid-template: auto minmax(0, 1fr) / minmax(0, 1fr);
    gap: 0;
  }
  .superpuesto .zona-escena, .superpuesto .vista-arena { display: contents; }
  .superpuesto .marcador { grid-area: 1 / 1; }
  .superpuesto .campo { grid-area: 2 / 1; --alto-escena: 100cqh; }
  .superpuesto .panel, .superpuesto .mesa-frase {
    grid-area: 2 / 1;
    align-self: center;
    justify-self: start;
    position: relative;
    z-index: 6;
    width: min(60%, 660px);
    margin-left: 5px;
    max-height: none;
    overflow: visible;
    padding: 6px 8px;
    background: rgb(19 26 35 / 91%);
  }
  .superpuesto .panel :deep(.carta) { min-height: 34px; }
  .superpuesto .proteccion { left: auto; right: 5px; max-width: 36%; font-size: .75rem; }
  .superpuesto .panel :deep(.columna) { gap: 4px; }
  .superpuesto .panel :deep(.tablero) { display: flex; align-items: center; gap: 6px; padding: 4px; }
  .superpuesto .panel :deep(.zonas) { flex: 1; }
  .superpuesto .panel :deep(.señal) { margin: 0; }
  .resultado .epilogo-real { margin: 3px 0; padding: 4px; }
  .resultado .epilogo-real p { font-size: 1rem; }
  .superpuesto .panel :deep(.v-btn) { min-height: 32px; }
}
@media (orientation: landscape) and (max-height: 360px) {
  .superpuesto .panel, .superpuesto .mesa-frase { width: calc(100% - 10px); }
}

/* Pantallas angostas (celular en vertical): cabecera compacta en dos filas */
@media (orientation: portrait) and (max-width: 600px) {
  .cabecera { gap: 0.25rem 0.4rem; margin-bottom: 0.35rem; }
  .cabecera :deep(.v-btn) { min-height: 34px; height: 34px; padding-inline: 0.55rem; font-size: 0.7rem; letter-spacing: 0.04em; }
  h1 { order: 5; flex-basis: 100%; font-size: 1rem; line-height: 1.2; }
}

/* Celular o tableta en vertical: arena arriba a todo el ancho y panel debajo,
   que ocupa el resto de la pantalla y se desplaza por dentro si hace falta. */
@media (orientation: portrait) and (max-width: 900px) {
  .zona-escena { flex: 1 1 0; min-height: 0; }
  .campo { --alto-escena: min(100cqh, 85cqw); }
  .campo.campo-escucha { --alto-escena: 100cqh; }
  .panel { flex: 0 1 auto; max-height: 46%; }
  .banda-ronda { gap: 6px; }
  .banda-ronda .reloj { min-width: 65px; }
}
</style>
