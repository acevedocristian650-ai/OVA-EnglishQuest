<template>
  <section class="desafio">
    <header class="cabecera">
      <AudioSonidoBoton @click="emit('volver')">
        <v-btn variant="text" color="amber-lighten-3">Volver al mapa</v-btn>
      </AudioSonidoBoton>
      <h1>{{ nivel.nombre }} <small>{{ nivel.tema }}</small></h1>
    </header>

    <p class="giro">Gira tu celular para pelear</p>

    <div class="contenido">
      <div>
        <CombatEscena :nivel="nivel" :ataque="ataque" :dano-aplicado="danoAplicado"
          :curacion="curacionAplicada" :vida-caballero="vidaCaballero" :vida-rival="vidaRival" :carga="carga"
          @impactar="impactar" @terminar="terminarAtaque">
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
          <p v-if="fase === 'pregunta'" class="pista">Si aciertas, eliges un ataque. Si fallas o se acaba el tiempo, el guardián te ataca.</p>
        </div>
        <div v-if="fase === 'pregunta'" class="reloj" :class="{ urgente: tiempoRestante <= 3 }" role="timer" aria-label="Tiempo restante">
          <span class="reloj-barra"><span :style="{ transform: `scaleX(${tiempoRestante / tiempoTotal})` }" /></span>
          <span class="reloj-num" aria-hidden="true">{{ Math.ceil(tiempoRestante) }} s</span>
        </div>

        <template v-if="fase === 'pregunta'">
          <CombatPreguntaDuelo :key="indice" :pregunta="pregunta" @responder="responder" />
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
          <p role="status">{{ danoAplicado === null ? 'Preparando el ataque…' : '¡Impacto!' }}</p>
        </template>

        <template v-else-if="fase === 'revision'">
          <h2>{{ ultimaRespuesta.acierto ? '¡Buen golpe!' : ultimaRespuesta.agotado ? 'Se acabó el tiempo' : 'El guardián te alcanzó' }}</h2>
          <p>Respuesta correcta <strong lang="en">{{ pregunta.correcta }}</strong></p>
          <p>{{ pregunta.explicacion }}</p>
          <AudioSonidoBoton @click="siguiente">
            <v-btn block color="amber-lighten-3">Siguiente pregunta</v-btn>
          </AudioSonidoBoton>
        </template>

        <template v-else>
          <h2>{{ vidaRival === 0 ? '¡Victoria!' : 'Fin del desafío' }}</h2>
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
const props = defineProps({ nivel: { type: Object, required: true } })
const emit = defineEmits(['victoria', 'volver', 'reintentar'])

const ataques = [
  { id: 'hachazo', nombre: 'Hachazo descendente', dano: 24, duracion: 2400, sangre: true, descripcion: 'Golpe pesado' },
  { id: 'barrido', nombre: 'Barrido de hacha', dano: 22, duracion: 2200, sangre: true, descripcion: 'Corte veloz' },
  { id: 'escudo', nombre: 'Golpe de escudo', dano: 21, duracion: 2300, descripcion: 'Reduce el próximo golpe' },
  { id: 'rayo', nombre: 'Rayo del Alba', dano: 27, duracion: 2900, magia: true, descripcion: 'Relámpago · 1 uso por duelo' },
  { id: 'fenix', nombre: 'Llama del Fénix', dano: 20, duracion: 3200, magia: true, curacion: 12, descripcion: 'Recupera hasta 12 de vida' }
]

// Tiempo para responder (en segundos). Un nivel puede cambiarlo con la propiedad «tiempo».
const TIEMPO_OPCIONES = 10
const TIEMPO_ORDENAR = 18

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

const pregunta = computed(() => props.nivel.preguntas[indice.value])
const tiempoTotal = computed(() => props.nivel.tiempo ?? (pregunta.value.tipo === 'ordenar' ? TIEMPO_ORDENAR : TIEMPO_OPCIONES))
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
  const transcurrido = Math.min(ahora - ultimoTick, 250)
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
  iniciarAtaque(ataqueRival())
}

watch([fase, indice], () => (fase.value === 'pregunta' ? arrancarReloj() : pararReloj()))
onMounted(arrancarReloj)
onBeforeUnmount(pararReloj)

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

function responder(opcion) {
  if (fase.value !== 'pregunta') return
  respuesta.value = opcion
  agotado.value = false

  if (opcion === pregunta.value.correcta) {
    fase.value = 'elegir'
    return
  }

  iniciarAtaque(ataqueRival())
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
    iniciarAtaque({ id: 'hachazo', nombre: '¡Golpe final!', dano, duracion: 5600, sangre: true, final: true })
    return
  }
  iniciarAtaque({ ...movimiento, dano })
}

function iniciarAtaque(movimiento) {
  ataque.value = movimiento
  danoAplicado.value = null
  curacionAplicada.value = 0
  fase.value = 'ataque'
}

function impactar() {
  if (fase.value !== 'ataque' || danoAplicado.value !== null) return
  const golpe = ataque.value

  if (golpe.id === 'rival') {
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
}

function terminarAtaque() {
  if (fase.value !== 'ataque') return
  impactar()
  historial.value.push({ pregunta: pregunta.value, respuesta: respuesta.value, acierto: ataque.value.id !== 'rival', agotado: agotado.value })
  ataque.value = null

  const terminado = vidaRival.value === 0 || vidaCaballero.value === 0 || historial.value.length === props.nivel.preguntas.length
  fase.value = terminado ? 'resultado' : 'revision'
  if (vidaRival.value === 0) emit('victoria')
}

function siguiente() {
  if (fase.value !== 'revision') return
  indice.value++
  fase.value = 'pregunta'
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
