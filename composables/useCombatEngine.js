// Reglas del combate de English Quest, separadas de su representación gráfica.
//
// CombatDesafio.vue (y las escenas Alta y Lite) solo dibujan lo que este módulo decide.
// Las animaciones avisan «impactar» y «terminar» por comodidad visual, pero la lógica no depende de ellas:
// una vigilancia propia aplica cada golpe exactamente una vez aunque la animación se interrumpa,
// tarde o esté desactivada (movimiento reducido, pestaña en segundo plano, escena cambiada).
//
// Solo depende de Vue: se importa igual en el navegador y en scripts/simular-combate.mjs.
import { ref, computed, reactive, watch, toValue, toRaw } from 'vue'
import { crearRelojCombate } from './useCombatClock.js'

export const ATAQUES = [
  { id: 'hachazo', nombre: 'Hachazo descendente', dano: 24, duracion: 2400, sangre: true, descripcion: 'Golpe pesado' },
  { id: 'barrido', nombre: 'Barrido de hacha', dano: 22, duracion: 2200, sangre: true, descripcion: 'Corte veloz' },
  { id: 'escudo', nombre: 'Golpe de escudo', dano: 21, duracion: 2300, descripcion: 'Reduce el próximo golpe' },
  { id: 'rayo', nombre: 'Rayo del Alba', dano: 27, duracion: 2900, magia: true, descripcion: 'Relámpago · 1 uso por duelo' },
  { id: 'fenix', nombre: 'Llama del Fénix', dano: 20, duracion: 3200, magia: true, curacion: 12, descripcion: 'Recupera hasta 12 de vida' }
]
export const SEGUNDOS_POR_ACTIVIDAD = {
  ordenar: 35, escuchar: 35, parejas: 32, errores: 28, clasificar: 26,
  'romper-hechizo': 26, 'proteger-aliado': 26, zona: 25, 'esquiva-frase': 24,
  esquivar: 20, cortar: 22, hacha: 20
}
export const DANO_PALABRA = 14
export const CURACION_PALABRA = 8
export const FURIA_MAXIMA = 3
export const BONO_FURIA = 1.5
export const VENTANA_PERFECTA = 250 // ms alrededor del impacto
export const VENTANA_PARCIAL = 650
const MARGEN_IMPACTO = 700 // ms que se espera a la animación antes de aplicar el golpe por cuenta propia
const MARGEN_FIN = 2500
const MARGEN_SOLAR = 30000 // el remate solar espera clips de audio (hasta 12 s cada uno)
const NOMBRES_REMATE = { solar: '¡Ascensión solar!', cruzado: '¡Corte cruzado!', sombras: '¡Alzaos, sombras!' }

export const normalizar = (texto) => texto.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.?!]+$/, '').trimEnd().replace(/\s+/g, ' ')
const momentoImpacto = (golpe) => golpe.duracion * (golpe.remate === 'solar' && golpe.final ? 0.84 : golpe.final ? 0.46 : 0.54)

export function useCombatEngine({
  nivel: fuenteNivel,
  t = (x) => x,
  sonar = () => {},
  emit = () => {},
  alTerminar = () => {},
  ajustes = {},
  entorno = {}
} = {}) {
  const ahora = entorno.ahora ?? (() => performance.now())
  const poner = entorno.setTimeout ?? ((fn, ms) => setTimeout(fn, ms))
  const quitar = entorno.clearTimeout ?? ((id) => clearTimeout(id))
  const oculto = entorno.oculto ?? (() => (typeof document !== 'undefined' && document.hidden))
  const nivel = () => toValue(fuenteNivel)
  const tiempoExtra = () => toValue(ajustes.tiempoExtra) ?? 1
  const modoPractica = () => Boolean(toValue(ajustes.practica))

  const fase = ref('pregunta')
  const indice = ref(0)
  const respuesta = ref('')
  const vidaCaballero = ref(100)
  const vidaRival = ref(nivel().vida)
  const escudoPreparado = ref(false)
  const ataque = ref(null)
  const danoAplicado = ref(null)
  const curacionAplicada = ref(0)
  const rayoUsado = ref(false)
  const historial = ref([])
  const agotado = ref(false)
  const efectoPalabra = ref(null)
  const furia = ref(0)
  const bloqueo = ref('') // '' | 'perfecto' | 'parcial'
  const duracionAnillo = ref(0)
  const paradaPronto = ref(false)
  const avisoFase = ref(false)
  const pruebaRemate = ref(false)
  const desplazamientoEsquiva = ref(0)
  const pausado = ref(false)
  const ayudaAbierta = ref(false)
  const estadisticas = reactive({
    proyectilesCortados: 0, esquivasLogradas: 0, esquivasFallidas: 0, paradasPerfectas: 0, paradasParciales: 0,
    golpesRecibidos: 0, danoRecibido: 0, golpesAplicados: 0
  })
  let idEfectoPalabra = 0
  let impactoNominal = 0
  let temporizadorPronto = null
  let temporizadorAviso = null
  let temporizadorBanner = null
  let temporizadorConjuro = null
  let vigilanteImpacto = null
  let vigilanteFin = null
  let segundosRonda = 0
  let resultadoEntregado = false

  const pregunta = computed(() => nivel().preguntas[indice.value])
  const rondaHacha = computed(() => pregunta.value.tipo === 'hacha')
  const rondaCortes = computed(() => pregunta.value.tipo === 'cortar')
  const rondaEsquiva = computed(() => ['esquivar', 'esquiva-frase'].includes(pregunta.value.tipo))
  const rondaPanel = computed(() => ['errores', 'parejas', 'zona'].includes(pregunta.value.tipo))
  const rondaConjuro = computed(() => ['romper-hechizo', 'proteger-aliado'].includes(pregunta.value.tipo))
  const armandoFrase = computed(() => fase.value === 'pregunta' && pregunta.value.tipo === 'ordenar')

  // Segunda fase: con la mitad de vida o menos el guardián se enfurece (contraataque más rápido y más fuerte).
  const enfurecido = computed(() => vidaRival.value > 0 && vidaRival.value <= nivel().vida / 2)
  const danoContra = computed(() => Math.round(nivel().dano * (enfurecido.value ? 0.75 : 0.5)))
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
  const posicionEsquiva = computed(() => {
    if (ataque.value?.lado) return ataque.value.posicion
    if (fase.value === 'pregunta' && rondaEsquiva.value) return desplazamientoEsquiva.value
    return null
  })

  // --- Reloj educativo
  const sinLimite = computed(() => modoPractica())
  const tiempoTotal = computed(() => {
    const base = pregunta.value.tiempo ?? nivel().tiempo ?? SEGUNDOS_POR_ACTIVIDAD[pregunta.value.tipo] ?? 25
    return Math.round(base * tiempoExtra())
  })
  const reloj = crearRelojCombate({
    ahora,
    programar: entorno.setInterval ?? ((fn, ms) => setInterval(fn, ms)),
    cancelar: entorno.clearInterval ?? ((id) => clearInterval(id)),
    detenido: () => oculto() || ayudaAbierta.value || pausado.value,
    sinLimite: () => sinLimite.value,
    alAgotar: () => agotar()
  })
  const tiempoRestante = reloj.restante
  const carga = computed(() => {
    // Durante el aviso del contraataque el guardián se muestra cargado
    if (fase.value === 'aviso-contra') return 0.9
    if (fase.value === 'pregunta') return sinLimite.value ? 0 : 1 - tiempoRestante.value / (reloj.total.value || tiempoTotal.value)
    return fase.value === 'elegir' ? 0 : null
  })
  function arrancarReloj() {
    ayudaAbierta.value = false
    reloj.arrancar(tiempoTotal.value)
  }

  function registrar(acierto, extra = {}) {
    const q = pregunta.value
    historial.value.push({
      pregunta: q, respuesta: respuesta.value, acierto, agotado: agotado.value, ...extra,
      tipo: q.tipo, texto: q.texto, correcta: q.correcta, explicacion: q.explicacion, indice: indice.value, tema: q.tema, fase: q.fase,
      segundos: Math.round(segundosRonda * 10) / 10
    })
  }

  // --- Ciclo de vida: el componente llama a iniciar() al montarse y a destruir() al desmontarse.
  const parar = []
  function iniciar() {
    parar.push(watch([fase, indice], () => (fase.value === 'pregunta' ? arrancarReloj() : reloj.parar())))
    parar.push(watch(fase, (nueva, previa) => {
      if (previa === 'pregunta' && nueva !== 'pregunta') segundosRonda = reloj.transcurrido.value
      if (nueva === 'resultado' && !pruebaRemate.value && !resultadoEntregado) {
        resultadoEntregado = true
        alTerminar(resumen())
      }
    }, { flush: 'sync' }))
    parar.push(watch(enfurecido, (activo) => {
      if (!activo) return
      avisoFase.value = true
      sonar('voz', 'grito')
      quitar(temporizadorBanner)
      temporizadorBanner = poner(() => { avisoFase.value = false }, 2200)
    }))
    sonar('voz', 'grito')
    arrancarReloj()
  }
  function destruir() {
    parar.splice(0).forEach((p) => p())
    reloj.parar()
    for (const id of [temporizadorConjuro, temporizadorAviso, temporizadorBanner, temporizadorPronto, vigilanteImpacto, vigilanteFin]) quitar(id)
    temporizadorConjuro = temporizadorAviso = temporizadorBanner = temporizadorPronto = vigilanteImpacto = vigilanteFin = null
  }
  function reiniciarReferencia() { reloj.reiniciarReferencia() }

  // --- Pausa segura: solo mientras el estudiante piensa. Ningún golpe está en marcha, así que no se pierde progreso.
  const puedePausar = computed(() => fase.value === 'pregunta')
  function pausar() { if (puedePausar.value) { reloj.tick(); pausado.value = true } } // tick: contabiliza lo transcurrido antes de detener
  function reanudar() { if (pausado.value) { pausado.value = false; reloj.reiniciarReferencia() } }

  function agotar() {
    if (fase.value !== 'pregunta') return
    reloj.parar()
    agotado.value = true
    respuesta.value = ''
    if (rondaEsquiva.value) lanzarColetazo(false)
    else iniciarAtaque(ataqueRival())
  }

  function ataqueRival() {
    return { id: 'rival', nombre: nivel().golpe, dano: nivel().dano, duracion: 2600, sangre: nivel().corte }
  }

  const ultimaRespuesta = computed(() => historial.value[historial.value.length - 1])
  const aciertos = computed(() => historial.value.filter((r) => r.acierto).length)
  const mensajeFinal = computed(() => {
    if (vidaRival.value === 0) return `${t('Derrotaste al guardián de')} ${nivel().nombre}.`
    if (vidaCaballero.value === 0) return t('El caballero se quedó sin vida.')
    return t('El guardián resistió los seis desafíos. Puedes revisar tus respuestas y volver a intentarlo.')
  })

  // Reservar vida para las rondas pendientes evita que un ataque fuerte se salte su actividad.
  function danoDisponible() {
    const pendientes = nivel().preguntas.length - indice.value - 1
    const reserva = Math.ceil(nivel().vida * pendientes / (2 * nivel().preguntas.length))
    return Math.max(0, vidaRival.value - reserva)
  }
  // ── Progresión ascendente del daño (lógica compartida por todas las escenas: vive aquí, en el motor).
  // Cada ronda que puede terminar en ataque (todas salvo «clasificar») tiene un daño planificado que crece ronda a
  // ronda y que culmina en un golpe final importante. Los ataques secundarios (palabras clasificadas, hechizo roto)
  // son pequeños y se descuentan del presupuesto. Si se falla alguna ronda, el guardián sobrevive: no se regala la victoria.
  const danoSecundario = () => Math.max(4, Math.round(nivel().vida * 0.06))
  function planDano() {
    const q = nivel().preguntas
    const rondas = q.map((p, i) => [p, i]).filter(([p]) => p.tipo !== 'clasificar').map(([, i]) => i)
    const secundarios = q.reduce((t, p) => t + (p.tipo === 'clasificar' ? (p.palabras ?? []).filter((w) => !w.futuro).length : p.tipo === 'romper-hechizo' ? 1 : 0), 0)
    const presupuesto = Math.max(nivel().vida * 0.5, nivel().vida - secundarios * danoSecundario())
    const m = rondas.length
    // pesos 1 → 3 de forma lineal y un último golpe 1,4 veces mayor que el penúltimo
    const pesos = rondas.map((_, k) => (k < m - 1 ? 1 + (2 * k) / Math.max(1, m - 2) : m > 1 ? 3 * 1.4 : 1))
    const total = pesos.reduce((a, b) => a + b, 0) || 1
    return rondas.map((indiceRonda, k) => ({ indice: indiceRonda, dano: Math.round(presupuesto * pesos[k] / total), ultima: k === m - 1 }))
  }
  function danoPlanificado() { return planDano().find((x) => x.indice === indice.value) ?? { dano: 0, ultima: false } }
  function fuerza(movimiento) {
    const plan = danoPlanificado()
    // El tipo de ataque y la debilidad del guardián modifican el daño planificado, no lo sustituyen.
    const relativo = movimiento.dano / 24 * (nivel().debilidad === movimiento.id ? 1.15 : 1)
    const base = Math.max(1, Math.round(plan.dano * relativo))
    const total = furia.value >= FURIA_MAXIMA ? Math.round(base * BONO_FURIA) : base
    // Golpe final: solo en la última ronda ofensiva y solo si el estudiante llega con la vida del guardián dentro de lo previsto.
    if (plan.ultima && vidaRival.value <= Math.round(plan.dano * 1.75)) return Math.max(total, vidaRival.value)
    return total
  }
  function ganarFuria() { furia.value = Math.min(FURIA_MAXIMA, furia.value + 1) }

  // Con pausa manual o ayuda abierta no se aceptan respuestas, cortes ni golpes (el reloj tampoco avanza).
  const entradaBloqueada = () => pausado.value || ayudaAbierta.value
  function responder(opcion) {
    if (fase.value !== 'pregunta' || entradaBloqueada()) return
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
    if (fase.value !== 'pregunta' || entradaBloqueada()) return
    reloj.parar()
    respuesta.value = opcion
    agotado.value = false
    if (normalizar(opcion) !== normalizar(pregunta.value.correcta)) {
      iniciarAtaque(ataqueRival())
      return
    }
    fase.value = 'conjuro'
    if (pregunta.value.tipo === 'romper-hechizo') {
      const dano = Math.min(danoSecundario(), danoDisponible())
      vidaRival.value -= dano
      mostrarEfectoPalabra('monstruo', 'dano', `−${dano} PV`)
      sonar('golpe', 'rayo')
      if (vidaRival.value === 0) sonar('voz', 'derrota')
    } else {
      escudoPreparado.value = true
      sonar('golpe', 'escudo')
    }
    temporizadorConjuro = poner(() => {
      temporizadorConjuro = null
      if (vidaRival.value === 0) {
        registrar(true, { agotado: false })
        cerrarRonda()
      } else {
        fase.value = 'elegir'
      }
    }, 850)
  }

  function lanzarColetazo(esquivado, posicion = 0) {
    const lado = pregunta.value.lado ?? 'derecha'
    reloj.parar()
    if (esquivado) estadisticas.esquivasLogradas++
    else estadisticas.esquivasFallidas++
    iniciarAtaque({ ...ataqueRival(), duracion: 1500, lado, posicion, esquivado, sangre: false })
  }

  function cortarAtaque() {
    if (!rondaHacha.value || fase.value !== 'pregunta' || entradaBloqueada()) return
    reloj.parar()
    respuesta.value = pregunta.value.correcta
    agotado.value = false
    estadisticas.proyectilesCortados += 3
    fase.value = 'intercepcion'
    sonar('golpe', 'escudo')
    temporizadorConjuro = poner(() => {
      temporizadorConjuro = null
      fase.value = 'elegir'
    }, 500)
  }

  function esquivar(lado) {
    if (fase.value !== 'pregunta' || entradaBloqueada()) return
    respuesta.value = lado === 'izquierda' ? 'Move left.' : 'Move right.'
    lanzarColetazo(lado !== pregunta.value.lado, lado === 'izquierda' ? -15 : 15)
  }

  function completarAviso(ficha) {
    if (fase.value !== 'pregunta' || entradaBloqueada()) return
    respuesta.value = ficha
    const esquivado = ficha === pregunta.value.correcta
    lanzarColetazo(esquivado, esquivado ? -15 : 0)
  }

  function mostrarEfectoPalabra(destino, tipo, texto) {
    efectoPalabra.value = { destino, tipo, texto, id: ++idEfectoPalabra }
  }

  function aplicarPalabra(destino) {
    if (fase.value !== 'pregunta' || entradaBloqueada()) return
    if (destino === 'heroe') {
      const recuperado = Math.min(100 - vidaCaballero.value, CURACION_PALABRA)
      vidaCaballero.value += recuperado
      mostrarEfectoPalabra(destino, 'cura', recuperado ? `+${recuperado} PV` : t('Vida al máximo'))
      return
    }
    const dano = Math.min(danoDisponible(), danoSecundario())
    vidaRival.value -= dano
    mostrarEfectoPalabra(destino, 'dano', `−${dano} PV`)
    sonar('golpe', 'escudo')
  }

  function palabraIncorrecta(destino) {
    if (fase.value === 'pregunta' && !entradaBloqueada()) mostrarEfectoPalabra(destino, 'error', t('Prueba con el otro personaje'))
  }

  function completarPalabras() {
    if (fase.value !== 'pregunta' || entradaBloqueada()) return
    respuesta.value = pregunta.value.correcta
    registrar(true, { agotado: false })
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

  const puedeProbarRemate = computed(() => vidaRival.value > 0 && fase.value !== 'ataque' && fase.value !== 'resultado')
  function probarRemate() {
    if (!puedeProbarRemate.value) return
    reloj.parar()
    quitar(temporizadorConjuro); temporizadorConjuro = null
    quitar(temporizadorAviso); temporizadorAviso = null
    bloqueo.value = ''
    efectoPalabra.value = null
    pruebaRemate.value = true
    iniciarRemate(vidaRival.value)
  }

  function iniciarRemate(dano) {
    const remate = nivel().remate
    iniciarAtaque({
      id: 'hachazo', nombre: NOMBRES_REMATE[remate] ?? '¡Golpe final!',
      dano, duracion: remate === 'solar' ? 14000 : 5600, sangre: !remate, final: true, remate
    })
  }

  // Vigilancia: si la escena no avisa, el golpe se aplica igualmente (una sola vez, ver impactar/terminarAtaque).
  function vigilar(golpe) {
    quitar(vigilanteImpacto); quitar(vigilanteFin)
    const solar = golpe.final && golpe.remate === 'solar'
    const esperar = (accion, ms) => {
      const id = poner(() => {
        if (toRaw(ataque.value) !== toRaw(golpe)) return
        if (oculto()) { reprogramar(accion, 500); return }
        accion()
      }, ms)
      return id
    }
    const reprogramar = (accion, ms) => {
      if (accion === impactar) vigilanteImpacto = esperar(accion, ms)
      else vigilanteFin = esperar(accion, ms)
    }
    vigilanteImpacto = esperar(impactar, momentoImpacto(golpe) + (solar ? MARGEN_SOLAR : MARGEN_IMPACTO))
    vigilanteFin = esperar(terminarAtaque, golpe.duracion + (solar ? MARGEN_SOLAR : MARGEN_FIN))
  }

  function iniciarAtaque(movimiento) {
    ataque.value = movimiento
    danoAplicado.value = null
    curacionAplicada.value = 0
    fase.value = 'ataque'
    if (movimiento.id === 'rival') sonar('voz', 'grito')
    vigilar(movimiento)
  }

  // Cada ataque aplica su daño una sola vez: danoAplicado deja de ser null y las llamadas repetidas se ignoran.
  function impactar() {
    if (fase.value !== 'ataque' || danoAplicado.value !== null) return
    const golpe = ataque.value
    if (golpe.esquivado) {
      danoAplicado.value = 0
    } else if (golpe.id === 'rival' && golpe.contra && bloqueo.value === 'perfecto') {
      // Parada perfecta: no hay daño y el escudo preparado se conserva
      danoAplicado.value = 0
      estadisticas.paradasPerfectas++
    } else if (golpe.id === 'rival') {
      const mitigacion = escudoPreparado.value ? 12 : 0
      // Parada parcial: la mitad del daño. El contraataque es un castigo suave: nunca deja al caballero sin vida
      const base = golpe.contra && bloqueo.value === 'parcial' ? Math.ceil(golpe.dano / 2) : golpe.dano
      const maximo = golpe.contra ? vidaCaballero.value - 1 : vidaCaballero.value
      danoAplicado.value = Math.max(0, Math.min(maximo, base - mitigacion))
      vidaCaballero.value -= danoAplicado.value
      escudoPreparado.value = false
      if (golpe.contra && bloqueo.value === 'parcial') estadisticas.paradasParciales++
      estadisticas.golpesRecibidos++
      estadisticas.danoRecibido += danoAplicado.value
    } else {
      danoAplicado.value = Math.min(vidaRival.value, golpe.dano)
      vidaRival.value -= danoAplicado.value
      estadisticas.golpesAplicados++
      if (golpe.id === 'escudo') escudoPreparado.value = true
      if (golpe.curacion) {
        curacionAplicada.value = Math.min(100 - vidaCaballero.value, golpe.curacion)
        vidaCaballero.value += curacionAplicada.value
      }
    }
    if (golpe.id === 'rival') sonar('golpe', golpe.contra && bloqueo.value ? 'escudo' : 'jefe-golpe')
    else sonar('golpe', golpe.final ? 'golpe-final' : golpe.id)
    if (vidaRival.value === 0) sonar('voz', 'derrota')
  }

  function terminarAtaque() {
    if (fase.value !== 'ataque') return
    impactar()
    quitar(vigilanteImpacto); quitar(vigilanteFin)
    vigilanteImpacto = vigilanteFin = null
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
    if (!esquivado) registrar(golpe.id !== 'rival')
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
    impactoNominal = ahora() + duracionAnillo.value
    bloqueo.value = ''
    fase.value = 'aviso-contra'
    temporizadorAviso = poner(() => {
      temporizadorAviso = null
      iniciarAtaque({ ...ataqueRival(), nombre: 'Contraataque', dano: danoContra.value, contra: true })
    }, aviso)
  }

  // Parada con tiempo: cuanto más cerca del impacto, mejor. Demasiado pronto no cuenta (se puede volver a intentar).
  function parada() {
    if (bloqueo.value || !paradaActiva.value) return
    const distancia = Math.abs(ahora() - impactoNominal)
    if (distancia > VENTANA_PARCIAL) {
      paradaPronto.value = true
      quitar(temporizadorPronto)
      temporizadorPronto = poner(() => { paradaPronto.value = false }, 260)
      return
    }
    bloqueo.value = distancia <= VENTANA_PERFECTA ? 'perfecto' : 'parcial'
  }

  function teclaParada(evento) {
    if (evento.repeat || !paradaActiva.value || !['Space', 'Enter'].includes(evento.code)) return
    evento.preventDefault()
    parada()
  }

  function cerrarRonda() {
    const terminado = vidaRival.value === 0 || vidaCaballero.value === 0 || historial.value.length === nivel().preguntas.length
    fase.value = terminado ? 'resultado' : 'revision'
    if (vidaRival.value === 0 && historial.value.length === nivel().preguntas.length) emit('victoria')
  }

  function siguiente() {
    if (fase.value !== 'revision') return
    efectoPalabra.value = null
    desplazamientoEsquiva.value = 0
    indice.value++
    if (pregunta.value.invocacion) {
      fase.value = 'invocacion'
      temporizadorConjuro = poner(() => {
        temporizadorConjuro = null
        fase.value = 'pregunta'
      }, 1200)
    } else {
      fase.value = 'pregunta'
    }
  }

  function resumen() {
    const resultado = vidaRival.value === 0 ? 'victoria' : vidaCaballero.value === 0 ? 'derrota' : 'incompleto'
    const { golpesAplicados: _g, ...combate } = estadisticas
    return {
      nivel: nivel().numero, tema: nivel().tema, resultado, historial: historial.value.map((h) => ({ ...h, pregunta: undefined })),
      vidaCaballero: vidaCaballero.value, segundos: historial.value.reduce((s, h) => s + (h.segundos || 0), 0),
      combate: { ...combate }, totalRondas: nivel().preguntas.length, practica: modoPractica()
    }
  }

  return {
    // estado
    fase, indice, respuesta, vidaCaballero, vidaRival, escudoPreparado, ataque, danoAplicado, curacionAplicada, rayoUsado,
    historial, agotado, efectoPalabra, furia, bloqueo, duracionAnillo, paradaPronto, avisoFase, pruebaRemate,
    desplazamientoEsquiva, pausado, ayudaAbierta, estadisticas,
    // derivados
    pregunta, rondaHacha, rondaCortes, rondaEsquiva, rondaPanel, rondaConjuro, armandoFrase, enfurecido, danoContra,
    paradaActiva, textoAtaque, posicionEsquiva, tiempoTotal, tiempoRestante, sinLimite, carga, ultimaRespuesta, aciertos,
    mensajeFinal, puedePausar, puedeProbarRemate,
    // acciones
    iniciar, destruir, reiniciarReferencia, pausar, reanudar, responder, resolverConjuro, cortarAtaque, esquivar, completarAviso,
    aplicarPalabra, palabraIncorrecta, completarPalabras, atacar, probarRemate, impactar, terminarAtaque, parar: parada,
    teclaParada, siguiente, agotar, resumen, danoDisponible, fuerza, planDano, reloj,
    // referencia temporal compartida con las actividades (proyectiles, colisiones)
    tiempoActivo: () => reloj.tiempoActivo(), relojDetenido: () => reloj.detenido(),
    ataques: ATAQUES, FURIA_MAXIMA
  }
}
