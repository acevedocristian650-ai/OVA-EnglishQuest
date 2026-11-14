<template>
  <section class="desafio">
    <AudioEfecto :ruta="golpeSonido.ruta" :disparo="golpeSonido.disparo" />
    <AudioEfecto :ruta="vozJefe.ruta" :disparo="vozJefe.disparo" :volumen="0.75" />
    <header class="cabecera">
      <AudioSonidoBoton @click="emit('volver')">
        <v-btn variant="text" color="amber-lighten-3">Volver al mapa</v-btn>
      </AudioSonidoBoton>
      <h1>{{ nivel.nombre }} <small>{{ nivel.tema }}</small></h1>
      <AudioSonidoBoton v-if="modoPruebas" @click="superarPrueba">
        <v-btn variant="tonal" color="amber-lighten-3">Superar prueba</v-btn>
      </AudioSonidoBoton>
      <AudioSonidoBoton v-if="modoPruebas" @click="probarRemate">
        <v-btn variant="tonal" color="amber-lighten-3" :disabled="!puedeProbarRemate">Probar golpe final</v-btn>
      </AudioSonidoBoton>
    </header>

    <div class="contenido">
      <div class="zona-escena">
        <CombatEscena :nivel="nivel" :ataque="ataque" :dano-aplicado="danoAplicado"
          :curacion="curacionAplicada" :vida-caballero="vidaCaballero" :vida-rival="vidaRival" :carga="carga"
          :posicion-esquiva="posicionEsquiva" :lado-golpe="ataque?.lado"
          :furia="furia >= FURIA_MAXIMA" :enfurecido="enfurecido" :bloqueado="bloqueo === 'perfecto'"
          :sin-arma="rondaHacha && (fase === 'pregunta' || fase === 'intercepcion' || fase === 'ataque' && ataque?.id === 'rival')"
          @impactar="impactar" @terminar="terminarAtaque">
          <template #actividad>
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
              :class="[efectoPalabra.destino, efectoPalabra.tipo]" role="status">{{ efectoPalabra.texto }}</div>
            <p v-if="avisoFase" class="banner-fase" role="status">¡{{ nivel.guardian }} se enfurece!</p>
            <!-- Parada con tiempo: el anillo se cierra sobre el caballero y hay que tocar el escudo justo cuando lo alcanza -->
            <div v-if="paradaActiva" class="parada" :style="{ '--t': duracionAnillo + 'ms' }">
              <button type="button" class="escudo-parada" :class="{ pronto: paradaPronto, logrado: bloqueo !== '' }"
                :disabled="bloqueo !== ''" aria-label="Alzar el escudo. Toca cuando el anillo lo alcance, o pulsa la barra espaciadora."
                @pointerdown.prevent="parar">
                <span class="anillo-parada" aria-hidden="true" />
                <span class="icono-parada" aria-hidden="true">🛡</span>
              </button>
            </div>
          </template>
          <template #hud>
            <div class="marcador" aria-live="polite">
              <div>
                <p class="identidad"><strong>Caballero</strong> <span>{{ vidaCaballero }}/100</span></p>
                <div class="marco-vida">
                  <CombatBar :valor="vidaCaballero" color="green-darken-1" etiqueta="Vida del caballero" />
                </div>
                <div class="furia" :class="{ llena: furia >= FURIA_MAXIMA }" role="status"
                  :aria-label="`Furia ${furia} de ${FURIA_MAXIMA}`">
                  <span class="furia-etiqueta">{{ furia >= FURIA_MAXIMA ? '¡FURIA! +50 % de daño' : 'Furia' }}</span>
                  <i v-for="n in FURIA_MAXIMA" :key="n" :class="{ llena: n <= furia }" />
                </div>
              </div>
              <div class="marcador-rival">
                <p class="identidad"><strong>{{ nivel.guardian }}</strong> <span>{{ vidaRival }}/{{ nivel.vida }}</span></p>
                <div class="marco-vida">
                  <CombatBar :valor="vidaRival" :maximo="nivel.vida" color="red-darken-2" etiqueta="Vida del guardián" />
                </div>
              </div>
            </div>
          </template>
        </CombatEscena>
        <p v-if="escudoPreparado" class="proteccion" role="status">Escudo preparado · Reduce el próximo golpe recibido.</p>
      </div>

      <aside class="panel sin-barra" aria-label="Desafío de inglés">
        <div class="panel-cabecera">
          <p class="etiqueta">DESAFÍO {{ indice + 1 }} / {{ nivel.preguntas.length }}</p>
          <p v-if="fase === 'pregunta'" class="pista">{{ instruccion }}</p>
        </div>
        <div v-if="fase === 'pregunta'" class="reloj" :class="{ urgente: tiempoRestante <= 3 }" role="timer" aria-label="Tiempo restante">
          <span class="reloj-barra"><span :style="{ transform: `scaleX(${tiempoRestante / tiempoTotal})` }" /></span>
          <span class="reloj-num" aria-hidden="true">{{ Math.ceil(tiempoRestante) }} s</span>
        </div>

        <template v-if="fase === 'pregunta'">
          <CombatErrores v-if="pregunta.tipo === 'errores'" :key="indice" :pregunta="pregunta" @responder="responder" />
          <CombatParejas v-if="pregunta.tipo === 'parejas'" :key="indice" :pregunta="pregunta" @responder="responder" />
          <CombatEscuchar v-if="pregunta.tipo === 'escuchar'" :key="indice" :pregunta="pregunta" @responder="responder" />
          <CombatPreguntaDuelo v-if="!rondaHacha && !rondaCortes && !rondaConjuro && !rondaEsquiva && !rondaPanel && pregunta.tipo !== 'clasificar'" :key="indice" :pregunta="pregunta" @responder="responder" />
        </template>

        <template v-else-if="fase === 'aviso-contra'">
          <h2>¡Contraataque!</h2>
          <p role="status">{{ nivel.guardian }} responde. Toca el escudo del caballero justo cuando el anillo lo alcance (o pulsa la barra espaciadora).</p>
        </template>

        <template v-else-if="fase === 'intercepcion'">
          <p>¡Cortaste los tres ataques! Prepara tu contraataque.</p>
        </template>

        <template v-else-if="fase === 'invocacion'">
          <p role="status">El guardián invoca a un gigante…</p>
        </template>

        <template v-else-if="fase === 'conjuro'">
          <h2>{{ pregunta.tipo === 'romper-hechizo' ? '¡Hechizo roto!' : '¡Promesa cumplida!' }}</h2>
          <p>{{ pregunta.tipo === 'romper-hechizo' ? 'La magia se devuelve al guardián. Prepara tu contraataque.' : 'El aliado está protegido. Tu escudo reducirá el próximo golpe.' }}</p>
        </template>

        <template v-else-if="fase === 'elegir'">
          <h2>¡Acertaste! Elige tu ataque</h2>
          <p v-if="furia >= FURIA_MAXIMA" class="aviso-furia" role="status">¡Furia al máximo! Tu próximo ataque hace +50 % de daño.</p>
          <div class="opciones ataques">
            <AudioSonidoBoton v-for="movimiento in ataques" :key="movimiento.id" @click="atacar(movimiento)">
              <v-btn block :color="movimiento.magia ? 'light-blue-lighten-3' : 'amber-lighten-3'"
                :variant="nivel.debilidad === movimiento.id ? 'flat' : 'tonal'"
                :disabled="movimiento.id === 'rayo' && rayoUsado">
                <span class="movimiento">
                  <strong>{{ movimiento.nombre }}</strong>
                  <small v-if="movimiento.id === 'rayo' && rayoUsado">Ya lo usaste en este duelo</small>
                  <small v-else>{{ fuerza(movimiento) }} de daño · {{ movimiento.descripcion }}</small>
                </span>
              </v-btn>
            </AudioSonidoBoton>
          </div>
        </template>

        <template v-else-if="fase === 'ataque'">
          <h2>{{ ataque.nombre }}</h2>
          <p role="status">{{ textoAtaque }}</p>
        </template>

        <template v-else-if="fase === 'revision'">
          <h2>{{ ultimaRespuesta.acierto ? (rondaEsquiva ? '¡Esquiva lograda!' : '¡Buen golpe!') : ultimaRespuesta.agotado ? 'Se acabó el tiempo' : 'El guardián te alcanzó' }}</h2>
          <p>Respuesta correcta <strong lang="en">{{ pregunta.correcta }}</strong></p>
          <p>{{ pregunta.explicacion }}</p>
          <AudioSonidoBoton @click="siguiente">
            <v-btn block color="amber-lighten-3">Siguiente pregunta</v-btn>
          </AudioSonidoBoton>
        </template>

        <template v-else>
          <h2>{{ pruebaRemate ? 'Prueba de remate completada' : vidaRival === 0 ? '¡Victoria!' : 'Fin del desafío' }}</h2>
          <template v-if="!pruebaRemate">
            <p>{{ mensajeFinal }}</p>
            <p>Aciertos {{ aciertos }} de {{ historial.length }}.</p>
            <template v-if="!ultimaRespuesta.acierto">
              <p>Respuesta correcta <strong lang="en">{{ pregunta.correcta }}</strong></p>
              <p>{{ pregunta.explicacion }}</p>
            </template>
            <details>
              <summary>Revisar respuestas</summary>
              <ol>
                <li v-for="(registro, posicion) in historial" :key="posicion">
                  <strong lang="en">{{ registro.pregunta.texto }}</strong>
                  <p>Tu respuesta <span lang="en">{{ registro.respuesta || 'Sin respuesta' }}</span></p>
                  <p>Respuesta correcta <strong lang="en">{{ registro.pregunta.correcta }}</strong></p>
                  <p>{{ registro.pregunta.explicacion }}</p>
                </li>
              </ol>
            </details>
          </template>
          <div class="opciones">
            <AudioSonidoBoton @click="emit('volver')">
              <v-btn block color="amber-lighten-3" variant="flat">Regresar al mapa</v-btn>
            </AudioSonidoBoton>
            <AudioSonidoBoton @click="emit('reintentar')">
              <v-btn block color="amber-lighten-3" variant="tonal">Reintentar</v-btn>
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

const TIEMPO_MAXIMO = 10
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
    if (danoAplicado.value === null) return bloqueo.value ? '¡Bloqueo preparado!' : 'El guardián contraataca… ¡toca el escudo!'
    if (bloqueo.value === 'perfecto') return '¡Parada perfecta! Sin daño.'
    if (bloqueo.value === 'parcial') return '¡Bloqueo parcial! Recibes la mitad.'
    return '¡Impacto!'
  }
  if (danoAplicado.value === null) return 'Preparando el ataque…'
  return ataque.value?.esquivado ? '¡Esquivaste el ataque!' : '¡Impacto!'
})

const pregunta = computed(() => props.nivel.preguntas[indice.value])
const rondaHacha = computed(() => pregunta.value.tipo === 'hacha')
const rondaCortes = computed(() => pregunta.value.tipo === 'cortar')
const rondaEsquiva = computed(() => ['esquivar', 'esquiva-frase'].includes(pregunta.value.tipo))
const rondaPanel = computed(() => ['errores', 'parejas', 'escuchar'].includes(pregunta.value.tipo))
const rondaConjuro = computed(() => ['romper-hechizo', 'proteger-aliado'].includes(pregunta.value.tipo))
let temporizadorConjuro = null
const desplazamientoEsquiva = ref(0)
const posicionEsquiva = computed(() => {
  if (ataque.value?.lado) return ataque.value.posicion
  if (fase.value === 'pregunta' && rondaEsquiva.value) return desplazamientoEsquiva.value
  return null
})
const instruccion = computed(() => {
  if (rondaCortes.value) return 'Desliza sobre las dos fichas incorrectas. Deja intacta la correcta.'
  if (rondaHacha.value) return 'Arrastra el hacha y corta las tres bolas antes de que lleguen al caballero.'
  if (pregunta.value.tipo === 'romper-hechizo') return 'Arrastra not al lugar correcto del hechizo para devolver su magia.'
  if (pregunta.value.tipo === 'proteger-aliado') return 'Une las palabras de la promesa en un trazo. Si te equivocas, suelta y vuelve a empezar.'
  if (pregunta.value.tipo === 'esquivar') return 'Lee el aviso y arrastra al héroe hacia un lado del puente.'
  if (pregunta.value.tipo === 'esquiva-frase') return 'Arrastra la ficha al espacio del aviso para activar la esquiva.'
  if (pregunta.value.tipo === 'errores') return 'Toca la palabra incorrecta de la frase.'
  if (pregunta.value.tipo === 'parejas') return 'Toca una carta de cada columna para unir las parejas. Tienes dos errores.'
  if (pregunta.value.tipo === 'escuchar') return 'Escucha la frase y toca la opción que oíste.'
  if (pregunta.value.tipo === 'clasificar') return 'Suelta las palabras sobre los personajes antes de que ataque el guardián.'
  return 'Si aciertas, eliges un ataque. Si fallas o se acaba el tiempo, el guardián te ataca.'
})
const tiempoTotal = computed(() => Math.min(props.nivel.tiempo ?? TIEMPO_MAXIMO, TIEMPO_MAXIMO))
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
  pararReloj()
  tiempoRestante.value = tiempoTotal.value
  ultimoTick = performance.now()
  reloj = setInterval(tick, 100)
}

function pararReloj() {
  if (reloj) clearInterval(reloj)
  reloj = null
}

function tick() {
  const ahora = performance.now()
  const transcurrido = ahora - ultimoTick
  ultimoTick = ahora
  // El tiempo no corre con la pestaña oculta
  if (document.hidden) return
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
  if (vidaRival.value === 0) return `Derrotaste al guardián de ${props.nivel.nombre}.`
  if (vidaCaballero.value === 0) return 'El caballero se quedó sin vida.'
  return 'El guardián resistió los seis desafíos. Puedes revisar tus respuestas y volver a intentarlo.'
})

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
    const dano = Math.min(12, vidaRival.value)
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
    mostrarEfectoPalabra(destino, 'cura', recuperado ? `+${recuperado} PV` : 'Vida al máximo')
    return
  }

  const dano = Math.min(vidaRival.value, DANO_PALABRA)
  vidaRival.value -= dano
  mostrarEfectoPalabra(destino, 'dano', `−${dano} PV`)
  sonar(golpeSonido, '/audio/combate/escudo.mp3')
}

function palabraIncorrecta(destino) {
  if (fase.value === 'pregunta') mostrarEfectoPalabra(destino, 'error', 'Prueba con el otro personaje')
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
  const dano = fuerza(movimiento)
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
  if (vidaRival.value === 0) emit('victoria')
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

/* Arena: ocupa el alto libre. Su alto se pasa a CombatEscena con --alto-escena
   (62cqw evita que quede demasiado alta y estrecha en ventanas angostas). */
.zona-escena {
  position: relative;
  flex: 1 1 auto;
  min-height: 120px;
  display: grid;
  align-content: end;
  container-type: size;
  --alto-escena: min(100cqh, 62cqw);
}

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
  font: 800 clamp(0.9rem, 2.6vw, 1.5rem) Georgia, serif;
  letter-spacing: 0.06em;
  text-shadow: 0 0 10px #ff5722;
  white-space: nowrap;
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
  font-size: 0.8rem;
  pointer-events: none;
}
.panel { padding: 0.55rem clamp(0.6rem, 2vw, 1.25rem); border: 1px solid #74634d; border-radius: 8px; background: linear-gradient(110deg, #292927, #1b2028 78%); }
.panel-cabecera { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.15rem 1rem; }
.etiqueta { color: #e6b96e; font-size: 0.67rem; font-weight: 800; letter-spacing: 0.13em; }
h2 { margin: 0.2rem 0 0.35rem; color: #fff0cc; font-family: Georgia, serif; font-size: clamp(1rem, 2.5vw, 1.35rem); }
.panel p:not(.etiqueta) { margin-bottom: 0.5rem; font-size: 0.82rem; }
.panel .pista { margin-bottom: 0; color: #d3c8b8; }
.opciones { display: grid; gap: 0.35rem; }
.movimiento { display: grid; line-height: 1.3; text-align: left; }
.movimiento small { font-size: 0.72rem; }
.panel :deep(.v-btn) { min-height: 44px; height: auto; padding-block: 0.35rem; border: 1px solid #b3955c57; text-transform: none; letter-spacing: normal; }
.panel :deep(.v-btn__content) { white-space: normal; }
details { margin-block: 0.55rem; font-size: 0.82rem; }
summary { cursor: pointer; color: #ffe09a; }
ol { padding-left: 1.2rem; }
li { margin-block: 0.55rem; }
.aviso-completado {
  position: absolute;
  inset: 3.5rem 0.45rem auto;
  z-index: 2;
  width: fit-content;
  margin-inline: auto;
  padding: 0.28rem 0.55rem;
  border: 1px solid #83bc90;
  border-radius: 6px;
  background: #101928f5;
  color: #dcf4df;
  font: 700 clamp(0.82rem, 2vw, 1.12rem) Georgia, serif;
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
.efecto-palabra.error { color: #ffe09a; font-size: 0.78rem; }
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
  .panel p:not(.etiqueta) { font-size: 0.75rem; }
  .cabecera { margin-bottom: 0.3rem; }
}

/* Celular en horizontal: el alto es lo que escasea, así que la arena y el panel
   van lado a lado. La arena usa todo el alto libre y el panel se desplaza por dentro. */
@media (orientation: landscape) and (max-height: 520px) {
  .desafio { padding-top: max(0.25rem, env(safe-area-inset-top)); padding-bottom: max(0.3rem, env(safe-area-inset-bottom)); }
  .cabecera { flex-wrap: nowrap; gap: 0.5rem; margin-bottom: 0.25rem; }
  .cabecera :deep(.v-btn) { min-height: 32px; height: 32px; padding-inline: 0.5rem; font-size: 0.72rem; }
  h1 { flex: 1; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .contenido { flex-direction: row; gap: 0.4rem; }
  .zona-escena { flex: 1 1 auto; min-width: 0; min-height: 0; align-content: center; }
  .panel {
    flex: 0 0 clamp(210px, 36%, 340px);
    max-height: none;
    padding: 0.4rem 0.55rem;
  }
  .panel :deep(.v-btn) { min-height: 38px; padding-block: 0.2rem; }
  .opciones, .ataques { grid-template-columns: minmax(0, 1fr); }
  h2 { margin: 0.1rem 0 0.2rem; font-size: 0.95rem; }
  .movimiento small { font-size: 0.65rem; }
  .panel p:not(.etiqueta) { margin-bottom: 0.3rem; }
  .panel-cabecera { gap: 0.1rem 0.6rem; }
  /* Títulos y textos de las actividades del panel (componentes hijos) */
  .panel :deep(h2) { margin: 0.1rem 0 0.2rem; font-size: 1rem; line-height: 1.2; }
  .panel :deep(p) { font-size: 0.8rem; }
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
  .zona-escena {
    flex: 0 0 auto;
    height: min(80vw, 50%);
    min-height: 170px;
    align-content: start;
    --alto-escena: 100cqh;
  }
  .panel { flex: 1 1 auto; max-height: none; }
}
</style>
