<template>
  <section class="desafio">
    <AudioEfecto :ruta="golpeSonido.ruta" :disparo="golpeSonido.disparo" />
    <AudioEfecto :ruta="vozJefe.ruta" :disparo="vozJefe.disparo" :volumen="0.75" canal="voces" />
    <header class="cabecera">
      <AudioSonidoBoton @click="pedirSalida">
        <v-btn variant="text" color="amber-lighten-3" class="btn-volver">{{ t('Volver al mapa') }}</v-btn>
      </AudioSonidoBoton>
      <h1>{{ nivel.nombre }} <small>{{ nivel.tema }}</small></h1>
      <v-btn v-if="puedePausar" variant="text" color="amber-lighten-3" class="boton-pausa" :aria-label="t('Pausar el desafío')" @click="abrirPausa">{{ t('Pausa') }}</v-btn>
      <!-- Gráficos y Accesibilidad: dos controles independientes. Al abrirlos el combate se pausa; el cambio de perfil se aplica en un momento seguro. -->
      <UiOpcionesRapidas ref="rapidas" class="rapidas-combate" diferido :pendiente="perfilPendiente" :preparando="preparandoPerfil" :error-perfil="errorPerfil"
        @abrir="alAbrirAjustes" @cerrar="alCerrarAjustes" @elegir-perfil="elegirPerfil" />
      <!-- Controles de desarrollo: import.meta.dev es false en la compilación publicada, así que nunca se muestran ni se activan. -->
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
      <div v-if="fase === 'pregunta'" class="reloj" :class="{ urgente: !sinLimite && tiempoRestante <= 3 }" role="timer" :aria-label="sinLimite ? t('Sin límite de tiempo') : t('Tiempo restante')">
        <span class="reloj-barra"><span :style="{ transform: `scaleX(${sinLimite ? 1 : tiempoRestante / tiempoTotal})` }" /></span>
        <span class="reloj-num" aria-hidden="true">{{ sinLimite ? t('Sin límite') : Math.ceil(tiempoRestante) + ' s' }}</span>
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
            <component :is="componenteEscena" :nivel="nivel" :ataque="ataque" :dano-aplicado="danoAplicado"
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
                  :restante="tiempoRestante" :total="tiempoTotal" :pausado="pausado" :sin-limite="sinLimite"
                  :tiempo-activo="motor.tiempoActivo" :detenido="motor.relojDetenido" @cortar="cortarAtaque" />
                <CombatCortar v-if="rondaCortes && ['pregunta', 'elegir'].includes(fase)"
                  :key="indice" :pregunta="pregunta" :detenido="motor.relojDetenido" @responder="responder" />
                <CombatClasificar v-if="fase === 'pregunta' && pregunta.tipo === 'clasificar'" :key="indice" :pregunta="pregunta"
                  @impacto="aplicarPalabra" @error="palabraIncorrecta" @completar="completarPalabras" />
                <CombatConjuro v-if="rondaConjuro && ['invocacion', 'pregunta', 'conjuro'].includes(fase)"
                  :key="indice" :pregunta="pregunta" :invocando="fase === 'invocacion'"
                  :resuelto="fase === 'conjuro'" @responder="resolverConjuro" />
                <CombatEsquiva v-if="rondaEsquiva && fase === 'pregunta'" :key="indice" :pregunta="pregunta"
                  @mover-heroe="desplazamientoEsquiva = $event" @esquivar="esquivar" @completar="completarAviso" />
                <p v-if="ataque?.lado && pregunta.tipo === 'esquivar'" class="aviso-completado" lang="en">{{ pregunta.texto }}</p>
                <p v-if="ataque?.esquivado && pregunta.tipo === 'esquiva-frase'" class="aviso-completado" lang="en">
                  {{ pregunta.texto.split('___')[0] }}<strong>{{ respuesta }}</strong>{{ pregunta.texto.split('___')[1] }}
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
            </component>
            <p v-if="escudoPreparado" class="proteccion" role="status">{{ t('Escudo preparado · Reduce el próximo golpe recibido.') }}</p>
          </div>
        </div>
        <CombatPreguntaDuelo v-if="armandoFrase" class="mesa-frase" :key="indice"
          :pregunta="pregunta" @responder="responder" />
      </div>

      <aside v-if="(fase !== 'pregunta' && fase !== 'resultado') || (fase === 'pregunta' && rondaPanel)" class="panel sin-barra" :class="{ revision: fase === 'revision' }" :aria-label="t('Desafío de inglés')">
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
          <!-- Retroalimentación compacta: acierto/fallo, consecuencia y explicación corta. El detalle va plegado y el botón siempre visible. -->
          <div class="rv-cuerpo">
            <p class="rv-cabeza" role="status">
              <strong :class="retro.acierto ? 'rv-ok' : 'rv-mal'">{{ retro.acierto ? '✔ ' + t('Respuesta correcta') : '✖ ' + t('Respuesta incorrecta') }}</strong>
              <span v-if="textoConsecuencia" class="rv-cons">{{ textoConsecuencia }}</span>
            </p>
            <p class="rv-expl"><b lang="en">{{ pregunta.correcta }}</b> — {{ pregunta.explicacion }}</p>
            <details class="rv-mas">
              <summary>{{ t('Más ayuda') }}</summary>
              <p v-if="!retro.acierto && retro.respuesta && !esMotriz">{{ t('Tu respuesta') }} <span lang="en">{{ retro.respuesta }}</span></p>
              <p v-if="retro.regla" class="retro"><b>{{ t('Regla para repasar') }}</b> {{ t(retro.regla) }}</p>
              <p v-if="retro.consejo" class="retro"><b>{{ t('Cómo resolver algo parecido') }}</b> {{ t(retro.consejo) }}</p>
            </details>
            <p v-if="recomendacion" class="retro aviso-calidad" role="status">
              {{ t('El juego ha perdido fluidez. ¿Quieres usar una calidad gráfica inferior?') }}
              <v-btn size="small" variant="tonal" @click="aplicarSugerencia">{{ t('Cambiar a Lite') }}</v-btn>
              <v-btn size="small" variant="text" @click="descartarRecomendacion">{{ t('Ahora no') }}</v-btn>
            </p>
            <p v-if="perfilPendiente" class="retro aviso-calidad" role="status">{{ t('Cambio de gráficos pendiente: se aplicará ahora.') }}</p>
            <p v-if="aviso" class="retro aviso-calidad" role="status">{{ aviso }}</p>
          </div>
          <AudioSonidoBoton @click="siguiente">
            <v-btn block class="rv-siguiente" color="amber-lighten-3">{{ t('Siguiente pregunta') }}</v-btn>
          </AudioSonidoBoton>
        </template>
      </aside>
    </div>
    <!-- Pantalla de resultados: aparece al terminar la secuencia final, sin reducir el escenario durante la animación -->
    <button v-if="fase === 'resultado' && !mostrarResultados" type="button" class="ver-resultados" @click="mostrarResultados = true">{{ t('Ver resultados') }}</button>
    <LazyCombatResultados v-if="mostrarResultados" :informe="informe" :nivel="nivel" :historial="historial" :victoria="vidaRival === 0" :prueba-remate="pruebaRemate"
      :practica="progreso.estado.ajustes.practica" :aciertos="aciertos"
      @volver="emit('volver')" @reintentar="emit('reintentar')" @reforzar="(n) => emit('reforzar', n)" @menu="emit('menu')" />

    <div v-if="menuPausa || confirmandoSalida" class="pausa" role="dialog" aria-modal="true" aria-labelledby="pausa-titulo" @keydown.esc.stop="confirmandoSalida ? cancelarSalida() : continuarPausa()">
      <div class="pausa-caja">
        <template v-if="confirmandoSalida">
          <h2 id="pausa-titulo">{{ t('¿Volver al mapa?') }}</h2>
          <p>{{ t('Perderás el progreso de esta batalla.') }}</p>
          <v-btn color="amber-lighten-3" variant="flat" autofocus @click="cancelarSalida">{{ t('Seguir luchando') }}</v-btn>
          <v-btn variant="tonal" color="amber-lighten-3" @click="emit('volver')">{{ t('Sí, volver al mapa') }}</v-btn>
        </template>
        <template v-else>
          <h2 id="pausa-titulo">{{ t('Desafío en pausa') }}</h2>
          <p>{{ t('El tiempo está detenido y no pierdes progreso.') }}</p>
          <v-btn color="amber-lighten-3" variant="flat" autofocus @click="continuarPausa">{{ t('Continuar') }}</v-btn>
          <v-btn variant="tonal" color="amber-lighten-3" :aria-expanded="verInstrucciones" @click="verInstrucciones = !verInstrucciones">{{ t('Instrucciones de la actividad') }}</v-btn>
          <p v-if="verInstrucciones" class="retro">{{ instruccion }}</p>
          <div class="pausa-ajustes">
            <v-btn variant="tonal" color="amber-lighten-3" @click="rapidas?.abrir('graficos')">{{ t('Gráficos') }}</v-btn>
            <v-btn variant="tonal" color="amber-lighten-3" @click="rapidas?.abrir('accesibilidad')">{{ t('Accesibilidad') }}</v-btn>
          </div>
          <v-btn variant="tonal" color="amber-lighten-3" @click="confirmandoSalida = true">{{ t('Regresar al mapa') }}</v-btn>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import CombatClasificar from './CombatClasificar.vue'
import CombatEsquiva from './CombatEsquiva.vue'
import CombatHacha from './CombatHacha.vue'
import CombatCortar from './CombatCortar.vue'
import CombatConjuro from './CombatConjuro.vue'
import CombatErrores from './CombatErrores.vue'
import CombatParejas from './CombatParejas.vue'
import CombatEscuchar from './CombatEscuchar.vue'
import CombatInforme from './CombatInforme.vue'
import lecciones from '~/data/lecciones.json'
import evaluacion from '~/data/evaluacion.json'

const props = defineProps({ nivel: { type: Object, required: true } })
const emit = defineEmits(['victoria', 'volver', 'reintentar', 'reforzar', 'menu'])
const { t } = useLanguage()
const { quality, recomendacion, aplicarRecomendacion, descartarRecomendacion, levelEssentials, prepareImages, setQuality, releaseScope } = useGameGraphics()
const progreso = usePlayerProgress()

// La escena pesada y la Lite son módulos distintos: solo se descarga y monta la que corresponde al perfil.
const EscenaCompleta = defineAsyncComponent(() => import('./CombatEscena.vue'))
const EscenaLite = defineAsyncComponent(() => import('./CombatEscenaLite.vue'))
// El perfil de la escena cambia únicamente en momentos seguros (entre rondas), sin tocar el estado del combate.
const perfilEscena = ref(quality.value)
const componenteEscena = computed(() => (perfilEscena.value === 'lite' ? EscenaLite : EscenaCompleta))

const modoPruebas = import.meta.dev
const informe = ref(null)
const aviso = ref('')
const rutasSonido = {
  golpe: (clave) => (clave === 'jefe-golpe' ? `${sonidosJefe.value}-golpe.mp3` : `/audio/combate/${clave}.mp3`),
  voz: (clave) => `${sonidosJefe.value}-${clave}.mp3`
}
// Dos canales para que la voz del jefe y el golpe puedan sonar a la vez
const golpeSonido = reactive({ ruta: '', disparo: 0 })
const vozJefe = reactive({ ruta: '', disparo: 0 })
const sonidosJefe = computed(() => `/audio/combate/jefe-${props.nivel.numeroArte ?? props.nivel.numero}`)
function sonar(canal, clave) {
  const destino = canal === 'voz' ? vozJefe : golpeSonido
  destino.ruta = rutasSonido[canal](clave)
  destino.disparo++
}

const motor = useCombatEngine({
  nivel: () => props.nivel,
  t,
  sonar,
  emit,
  ajustes: { tiempoExtra: () => progreso.estado.ajustes.tiempoExtra, practica: () => progreso.estado.ajustes.practica },
  alTerminar: (resumen) => {
    const r = resumen.resultado === 'incompleto' ? { ...resumen, resultado: 'derrota' } : resumen
    informe.value = progreso.registrarPartida({ ...r, aprobacion: evaluacion.aprobacion, minimoPorTema: evaluacion.minimoPorTema })
  }
})
const {
  fase, indice, respuesta, vidaCaballero, vidaRival, escudoPreparado, ataque, danoAplicado, curacionAplicada, rayoUsado,
  historial, efectoPalabra, furia, bloqueo, duracionAnillo, paradaPronto, avisoFase, pruebaRemate, desplazamientoEsquiva,
  pausado, ayudaAbierta, pregunta, rondaHacha, rondaCortes, rondaEsquiva, rondaPanel, rondaConjuro, armandoFrase,
  enfurecido, paradaActiva, textoAtaque, posicionEsquiva, tiempoTotal, tiempoRestante, sinLimite, carga,
  ultimaRespuesta, aciertos, mensajeFinal, puedePausar, puedeProbarRemate, ataques, FURIA_MAXIMA
} = motor
const { responder, resolverConjuro, cortarAtaque, esquivar, completarAviso, aplicarPalabra, palabraIncorrecta,
  completarPalabras, atacar, probarRemate, impactar, parar, siguiente, danoDisponible, fuerza } = motor
const terminarAtaque = motor.terminarAtaque
const indiceRepaso = ref(null)
const registroRepaso = computed(() => historial.value[indiceRepaso.value])

function superarPrueba() {
  progreso.desbloquear(props.nivel.numero + 1)
  emit('victoria')
  emit('volver')
}

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
const consignaCampo = computed(() => {
  if (fase.value !== 'pregunta') return ''
  if (pregunta.value.tipo === 'proteger-aliado') return pregunta.value.contexto
  return ['clasificar', 'cortar', 'hacha', 'esquivar'].includes(pregunta.value.tipo) ? pregunta.value.texto : ''
})

// Retroalimentación: por qué es correcta, qué falló, qué regla revisar y cómo resolver algo parecido.
const leccion = computed(() => lecciones.niveles[pregunta.value?.fase ?? props.nivel.numero])
const esMotriz = computed(() => TIPOS_MOTRICES.includes(pregunta.value.tipo))
const retro = computed(() => {
  const r = ultimaRespuesta.value
  if (!r) return null
  return {
    acierto: r.acierto,
    respuesta: r.respuesta,
    regla: !r.acierto && !esMotriz.value ? leccion.value?.regla : '',
    consejo: !r.acierto ? lecciones.consejos[r.tipo] : ''
  }
})

// Entre rondas es seguro cambiar de escena o de perfil, y también mostrar una recomendación de calidad.
const momentoSeguro = computed(() => ['revision', 'resultado'].includes(fase.value))
watch([quality, momentoSeguro], () => {
  if (momentoSeguro.value && perfilEscena.value !== quality.value) perfilEscena.value = quality.value
})
function aplicarSugerencia() { aplicarRecomendacion(); aviso.value = '' }

// ── Pausa, ajustes y salida ────────────────────────────────────────────────────────────────────────────
const rapidas = ref(null)
const menuPausa = ref(false)
const confirmandoSalida = ref(false)
const verInstrucciones = ref(false)
let pausadoPorAjustes = false
let pausadoPorSalida = false
function abrirPausa() { if (!puedePausar.value || menuPausa.value) return; motor.pausar(); menuPausa.value = true }
function continuarPausa() { menuPausa.value = false; verInstrucciones.value = false; motor.reanudar() }
function pedirSalida() {
  if (fase.value === 'resultado') { emit('volver'); return }
  if (!pausado.value) { motor.pausar(); pausadoPorSalida = pausado.value }
  confirmandoSalida.value = true
}
function cancelarSalida() {
  confirmandoSalida.value = false
  if (pausadoPorSalida && !menuPausa.value) motor.reanudar()
  pausadoPorSalida = false
}
// Abrir Gráficos o Accesibilidad pausa el reloj (solo si el combate admite pausa); cerrarlos lo reanuda sin ventajas ni eventos duplicados.
function alAbrirAjustes() { if (!pausado.value && puedePausar.value) { motor.pausar(); pausadoPorAjustes = pausado.value } }
function alCerrarAjustes() { if (pausadoPorAjustes) { pausadoPorAjustes = false; if (!menuPausa.value && !confirmandoSalida.value) motor.reanudar() } }

// ── Cambio de perfil gráfico sin reiniciar: se prepara el nuevo perfil y la escena se sustituye en el siguiente momento seguro.
// Durante transformaciones, ataques, remates o arrastres el cambio queda pendiente (el motor y su estado no se tocan).
const perfilPendiente = ref(null)
const preparandoPerfil = ref(false)
const errorPerfil = ref(false)
let temporizadorLiberar = 0
function elegirPerfil(id) {
  errorPerfil.value = false
  if (id === quality.value) { perfilPendiente.value = null; return }
  perfilPendiente.value = id
  aplicarPerfil()
}
async function aplicarPerfil() {
  const id = perfilPendiente.value
  if (!id || !momentoSeguro.value || preparandoPerfil.value) return
  preparandoPerfil.value = true
  const ambito = `nivel-${props.nivel.numero}-${id}`
  let correcto = true
  try {
    const r = await prepareImages(levelEssentials(props.nivel, id), { profile: id, ambito })
    correcto = !(r && r.total > 0 && r.loaded === 0)
  } catch { correcto = false }
  preparandoPerfil.value = false
  if (perfilPendiente.value !== id) return
  perfilPendiente.value = null
  if (!correcto) { errorPerfil.value = true; releaseScope(ambito); return } // se conserva el perfil anterior
  setQuality(id, ambito) // guarda la preferencia y libera los recursos del perfil anterior; la escena cambia en el mismo momento seguro
  clearTimeout(temporizadorLiberar)
  temporizadorLiberar = window.setTimeout(() => releaseScope(ambito), 3000)
}
watch(momentoSeguro, aplicarPerfil)

// ── Consecuencia del último ataque (para la retroalimentación compacta)
const consecuencias = ref([])
watch(danoAplicado, (v) => {
  const golpe = ataque.value
  if (v === null || !golpe) return
  consecuencias.value.push({ a: golpe.id === 'rival' || golpe.contra ? 'caballero' : 'guardian', n: v })
})
const textoConsecuencia = computed(() => {
  const partes = consecuencias.value.map((c) => c.a === 'guardian'
    ? `${t('Golpeaste al guardián')}: −${c.n} ${t('PV')}`
    : c.n > 0 ? `${t('Recibiste daño')}: −${c.n} ${t('PV')}` : t('Bloqueaste el golpe'))
  if (!partes.length && ultimaRespuesta.value?.acierto && rondaEsquiva.value) return t('¡Esquivaste el golpe!')
  return partes.join(' · ')
})

// ── Pantalla de resultados: tras la secuencia final, con una breve pausa para ver la pose de victoria
const mostrarResultados = ref(false)
let temporizadorResultados = 0
watch(fase, (f) => {
  clearTimeout(temporizadorResultados)
  if (f === 'pregunta') consecuencias.value = []
  if (f === 'resultado') temporizadorResultados = window.setTimeout(() => { mostrarResultados.value = true }, vidaRival.value === 0 && !pruebaRemate.value ? 1800 : 600)
  else mostrarResultados.value = false
})
function teclaGlobal(evento) {
  if (evento.key === 'Escape') {
    if (document.querySelector('.v-overlay--active') || mostrarResultados.value) return // el diálogo abierto gestiona su propio Esc
    if (confirmandoSalida.value) cancelarSalida(); else if (menuPausa.value) continuarPausa(); else abrirPausa()
    return
  }
  motor.teclaParada(evento)
}
onMounted(() => {
  window.addEventListener('keydown', teclaGlobal)
  document.addEventListener('visibilitychange', motor.reiniciarReferencia)
  motor.iniciar()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', teclaGlobal)
  clearTimeout(temporizadorResultados); clearTimeout(temporizadorLiberar)
  releaseScope(`nivel-${props.nivel.numero}-${perfilPendiente.value ?? 'alta'}`); releaseScope(`nivel-${props.nivel.numero}-lite`)
  document.removeEventListener('visibilitychange', motor.reiniciarReferencia)
  motor.destruir()
})
</script>

<style scoped>
.pausa { position: absolute; inset: 0; z-index: 60; display: grid; place-items: center; background: #0b1018e6; }
.pausa-caja { display: grid; gap: .7rem; width: min(22rem, 90vw); padding: 1.2rem; text-align: center; border: 1px solid #b3955c; border-radius: 8px; background: #151d29; }
.pausa-caja h2 { font-family: Georgia, serif; color: #f5e5c2; }
.retro { margin: .35rem 0; font-size: .95em; line-height: 1.35; }
.retro b { color: #ffd88a; margin-right: .3em; }
.aviso-calidad { padding: .4rem .6rem; border: 1px solid #b3955c; border-radius: 6px; background: #1b2635; }
.boton-pausa { min-height: 44px; }
.rapidas-combate { margin-left: auto; }
.pausa-ajustes { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.pausa-caja { max-height: 92%; overflow-y: auto; }
.ver-resultados { position: absolute; z-index: 40; left: 50%; bottom: max(14px, env(safe-area-inset-bottom)); transform: translateX(-50%); min-height: 44px; padding: 0 1.4rem; color: #2a1d08; background: #ffe09a; border: 1px solid #ffe09a; border-radius: 8px; font: 700 1rem system-ui, sans-serif; cursor: pointer; box-shadow: 0 6px 20px #000a; }
.ver-resultados:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
/* Retroalimentación compacta: ocupa poco, el detalle se pliega y «Siguiente» no se mueve */
.panel.revision { display: flex; flex-direction: column; gap: .4rem; max-height: 44%; overflow: hidden; }
.rv-cuerpo { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.rv-cabeza { display: flex; flex-wrap: wrap; align-items: baseline; gap: .1rem .6rem; margin: 0 0 .15rem; }
.rv-ok { color: #8fe0b0; } .rv-mal { color: #ff9d90; }
.rv-cons { color: #ffe09a; font-size: .92em; }
.rv-expl { margin: .1rem 0; font-size: .95em; line-height: 1.35; }
.rv-mas { margin: .25rem 0; font-size: .9em; }
.rv-mas summary { min-height: 32px; cursor: pointer; color: #ffe09a; }
.rv-siguiente { flex: none; min-height: 44px; }
@media (orientation: landscape) and (max-height: 520px) { h1 small { display: none; } .cabecera :deep(.v-btn) { min-height: 36px; } .panel.revision { max-height: 56%; } }
/* El combate mide exactamente la pantalla visible: cabecera arriba, panel abajo
   y la arena ocupa todo lo que sobra. Así nunca aparece scroll en la página. */
.desafio {
  position: relative;
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
    max-height: calc(100% - 10px);
    overflow-y: auto;
    overscroll-behavior: contain;
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
