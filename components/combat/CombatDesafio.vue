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

    <p class="giro">Gira tu celular para pelear</p>

    <div class="contenido">
      <div>
        <CombatEscena :nivel="nivel" :ataque="ataque" :dano-aplicado="danoAplicado"
          :curacion="curacionAplicada" :vida-caballero="vidaCaballero" :vida-rival="vidaRival" :carga="carga"
          :posicion-esquiva="posicionEsquiva" :lado-golpe="ataque?.lado"
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
          </template>
          <template #hud>
            <div class="marcador" aria-live="polite">
              <div>
                <p class="identidad"><strong>Caballero</strong> <span>{{ vidaCaballero }}/100</span></p>
                <div class="marco-vida">
                  <CombatBar :valor="vidaCaballero" color="green-darken-1" etiqueta="Vida del caballero" />
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

      <aside class="panel" aria-label="Desafío de inglés">
        <div class="panel-cabecera">
          <p class="etiqueta">DESAFÍO {{ indice + 1 }} / {{ nivel.preguntas.length }}</p>
          <p v-if="fase === 'pregunta'" class="pista">{{ instruccion }}</p>
        </div>
        <div v-if="fase === 'pregunta'" class="reloj" :class="{ urgente: tiempoRestante <= 3 }" role="timer" aria-label="Tiempo restante">
          <span class="reloj-barra"><span :style="{ transform: `scaleX(${tiempoRestante / tiempoTotal})` }" /></span>
          <span class="reloj-num" aria-hidden="true">{{ Math.ceil(tiempoRestante) }} s</span>
        </div>

        <template v-if="fase === 'pregunta'">
          <CombatPreguntaDuelo v-if="!rondaHacha && !rondaCortes && !rondaConjuro && !rondaEsquiva && pregunta.tipo !== 'clasificar'" :key="indice" :pregunta="pregunta" @responder="responder" />
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
          <p role="status">{{ danoAplicado === null ? 'Preparando el ataque…' : ataque.esquivado ? '¡Esquivaste el ataque!' : '¡Impacto!' }}</p>
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

const pregunta = computed(() => props.nivel.preguntas[indice.value])
const rondaHacha = computed(() => pregunta.value.tipo === 'hacha')
const rondaCortes = computed(() => pregunta.value.tipo === 'cortar')
const rondaEsquiva = computed(() => ['esquivar', 'esquiva-frase'].includes(pregunta.value.tipo))
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
  if (pregunta.value.tipo === 'clasificar') return 'Suelta las palabras sobre los personajes antes de que ataque el guardián.'
  return 'Si aciertas, eliges un ataque. Si fallas o se acaba el tiempo, el guardián te ataca.'
})
const tiempoTotal = computed(() => Math.min(props.nivel.tiempo ?? TIEMPO_MAXIMO, TIEMPO_MAXIMO))
const tiempoRestante = ref(tiempoTotal.value)
// El enemigo carga su ataque a medida que se acaba el tiempo
const carga = computed(() => {
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
  // El tiempo no corre con la pestaña oculta ni con el aviso de girar el celular
  if (document.hidden || window.matchMedia('(orientation: portrait) and (pointer: coarse)').matches) return
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
  arrancarReloj()
  sonar(vozJefe, `${sonidosJefe.value}-grito.mp3`)
})
onBeforeUnmount(() => {
  pararReloj()
  clearTimeout(temporizadorConjuro)
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
  return movimiento.dano + (props.nivel.debilidad === movimiento.id ? 4 : 0)
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
  cerrarRonda()
}

function atacar(movimiento) {
  if (fase.value !== 'elegir') return
  if (movimiento.id === 'rayo') {
    if (rayoUsado.value) return
    rayoUsado.value = true
  }
  const dano = fuerza(movimiento)
  // El golpe que remata al guardián se convierte en una secuencia final
  if (dano >= vidaRival.value) {
    iniciarRemate(dano)
    return
  }
  iniciarAtaque({ ...movimiento, dano })
}

function probarRemate() {
  if (!puedeProbarRemate.value) return
  pararReloj()
  clearTimeout(temporizadorConjuro)
  temporizadorConjuro = null
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
  } else if (golpe.id === 'rival') {
    const mitigacion = escudoPreparado.value ? 12 : 0
    danoAplicado.value = Math.min(vidaCaballero.value, golpe.dano - mitigacion)
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

  if (golpe.id === 'rival') sonar(golpeSonido, `${sonidosJefe.value}-golpe.mp3`)
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
  const esquivado = ataque.value.esquivado
  if (!esquivado) {
    historial.value.push({ pregunta: pregunta.value, respuesta: respuesta.value, acierto: ataque.value.id !== 'rival', agotado: agotado.value })
  }
  ataque.value = null

  if (esquivado) {
    fase.value = 'elegir'
    return
  }
  cerrarRonda()
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
.desafio {
  min-height: 100dvh;
  padding: 0.4rem clamp(0.5rem, 2vw, 1.8rem) 0.85rem;
  background: radial-gradient(ellipse at top, #252b31, #11161e 76%);
  color: #f1e8d3;
}
.cabecera, .contenido, .giro { max-width: 1240px; margin-inline: auto; }
.cabecera { display: flex; align-items: center; flex-wrap: wrap; gap: 0.15rem 0.75rem; margin-bottom: 0.4rem; }
.cabecera :deep(.v-btn) { min-height: 40px; letter-spacing: 0.06em; }
h1 { color: #f5e5c2; font-family: Georgia, serif; font-size: clamp(1rem, 3vw, 1.45rem); }
h1 small { color: #c4c7cd; font-family: system-ui, sans-serif; font-size: 0.68em; font-weight: 500; }
.contenido { display: grid; gap: 0.55rem; }
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
.reloj { display: flex; align-items: center; gap: 0.5rem; margin: 0.2rem 0 0.1rem; }
.reloj-barra { flex: 1; height: 6px; overflow: hidden; border-radius: 3px; background: #0006; }
.reloj-barra span { display: block; height: 100%; transform-origin: left; background: linear-gradient(90deg, #e6b96e, #f3d58f); transition: transform 100ms linear; }
.reloj-num { min-width: 2.2rem; color: #f3d58f; font-size: 0.8rem; font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
.reloj.urgente .reloj-barra span { background: linear-gradient(90deg, #d4483a, #ff8a5c); }
.reloj.urgente .reloj-num { color: #ff9a7a; }
.proteccion { margin-top: 0.4rem; color: #b8dcec; font-size: 0.8rem; }
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
  inset: 2.65rem 0.45rem auto;
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
.giro { display: none; }

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

@media (orientation: portrait) and (pointer: coarse) {
  .contenido { height: 0; overflow: hidden; visibility: hidden; }
  .giro { display: block; padding: 1rem; border: 1px solid #ac8850; border-radius: 12px; color: #ffe09a; text-align: center; }
}
</style>
