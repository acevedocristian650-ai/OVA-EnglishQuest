// Progreso, estadísticas y ajustes del jugador. Solo localStorage (formato versionado) y reactividad nativa de Vue.
//
// La lógica no toca el DOM: recibe el «storage» como parámetro (localStorage en el navegador, un objeto simulado
// en las pruebas). Si el almacenamiento está bloqueado o lleno el juego sigue funcionando durante la sesión.
import { reactive, computed } from 'vue'

export const CLAVE = 'english-quest-v2'
export const VERSION = 2
const CLAVES_ANTIGUAS = { graficos: 'english-quest-graphics-v1', nivel: 'english-quest-unlocked-level' }
export const NIVELES_TOTALES = 5 // cuatro batallas + «La última prueba del reino» (evaluación integradora)
export const NIVEL_FINAL = 5
export const APROBACION_INICIAL = 0.7 // el valor real se lee de data/evaluacion.json
// Solo existen dos perfiles gráficos. Las preferencias antiguas «equilibrada» y «auto» se migran a Lite (alternativa segura).
export const PERFILES_VALIDOS = ['alta', 'lite']
const MAX_ERRORES = 60

// Rangos de la narrativa medieval. El XP se deriva de los mejores resultados (no se acumula por repetir).
export const RANGOS = [
  { id: 'aprendiz', nombre: 'Aprendiz de escudero', min: 0 },
  { id: 'escudero', nombre: 'Escudero del Alba', min: 80 },
  { id: 'caballero', nombre: 'Caballero del Reino', min: 220 },
  { id: 'capitan', nombre: 'Capitán de la Guardia', min: 400 },
  { id: 'paladin', nombre: 'Paladín Real', min: 560 },
  { id: 'campeon', nombre: 'Campeón del Reino', min: 700 }
]
export const XP_ACIERTO = 10
export const XP_VICTORIA = 60
export const XP_ESTRELLA = 20
// Tipos de actividad sin evidencia lingüística: miden destreza, no dominio del inglés.
export const TIPOS_MOTRICES = ['hacha']

export function rangoDe(xp) {
  let actual = RANGOS[0]
  for (const r of RANGOS) if (xp >= r.min) actual = r
  const siguiente = RANGOS[RANGOS.indexOf(actual) + 1] ?? null
  const progreso = siguiente ? (xp - actual.min) / (siguiente.min - actual.min) : 1
  return { ...actual, siguiente, progreso: Math.min(1, Math.max(0, progreso)), xp }
}

export function ajustesIniciales() {
  return {
    calidad: 'lite', introVista: false, tourVisto: false, idioma: 'es',
    textoEscala: 1, altoContraste: false, movimiento: 'sistema', sinDestellos: false, sinCamara: false,
    volumen: { musica: 0.8, efectos: 1, voces: 1 }, tiempoExtra: 1, practica: false
  }
}
const nivelVacio = () => ({ intentos: 0, victorias: 0, derrotas: 0, completado: false, estrellas: 0, mejorAciertos: 0, mejorPrecision: 0, mejorVida: 0, mejorTiempo: null, ultimaFecha: null, aprobada: false })
export function progresoInicial() {
  return {
    desbloqueado: 1, niveles: {}, temas: {}, tipos: {},
    combate: { proyectilesCortados: 0, esquivasLogradas: 0, esquivasFallidas: 0, paradasPerfectas: 0, paradasParciales: 0, golpesRecibidos: 0, danoRecibido: 0, derrotasPorVida: 0 },
    segundosActividades: 0, refuerzo: {}, ultimaSesion: null, sesiones: 0
  }
}
export function datosIniciales() { return { app: 'english-quest', version: VERSION, ajustes: ajustesIniciales(), progreso: progresoInicial() } }

const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const num = (v, min, max, def) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def)
const ent = (v, min, max, def) => Math.round(num(v, min, max, def))
const cadena = (v, def = '', max = 400) => (typeof v === 'string' ? v.slice(0, max) : def)
const fecha = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null)

// Devuelve datos limpios (los campos desconocidos o fuera de rango se sustituyen por valores válidos).
export function validarDatos(bruto) {
  const base = datosIniciales()
  if (!esObjeto(bruto)) return { datos: base, reparado: true }
  let reparado = false
  const aj = esObjeto(bruto.ajustes) ? bruto.ajustes : (reparado = true, {})
  const a = base.ajustes
  // Migración: «equilibrada», «auto» o un valor desconocido pasan a Lite; el progreso educativo no se toca.
  a.calidad = PERFILES_VALIDOS.includes(aj.calidad) ? aj.calidad : 'lite'
  a.introVista = aj.introVista === true
  // Quien ya había completado la preparación en una versión anterior no vuelve a ver el recorrido inicial.
  a.tourVisto = typeof aj.tourVisto === 'boolean' ? aj.tourVisto : aj.introVista === true
  a.idioma = aj.idioma === 'en' ? 'en' : 'es'
  a.textoEscala = [1, 1.15, 1.3].includes(aj.textoEscala) ? aj.textoEscala : 1
  a.altoContraste = aj.altoContraste === true
  a.movimiento = ['sistema', 'reducido', 'completo'].includes(aj.movimiento) ? aj.movimiento : 'sistema'
  a.sinDestellos = aj.sinDestellos === true
  a.sinCamara = aj.sinCamara === true
  const v = esObjeto(aj.volumen) ? aj.volumen : {}
  a.volumen = { musica: num(v.musica, 0, 1, 0.8), efectos: num(v.efectos, 0, 1, 1), voces: num(v.voces, 0, 1, 1) }
  a.tiempoExtra = [1, 1.5, 2].includes(aj.tiempoExtra) ? aj.tiempoExtra : 1
  a.practica = aj.practica === true

  const pr = esObjeto(bruto.progreso) ? bruto.progreso : (reparado = true, {})
  const p = base.progreso
  p.desbloqueado = ent(pr.desbloqueado, 1, NIVELES_TOTALES + 1, 1)
  for (const [k, n] of Object.entries(esObjeto(pr.niveles) ? pr.niveles : {})) {
    if (!/^[1-5]$/.test(k) || !esObjeto(n)) { reparado = true; continue }
    p.niveles[k] = {
      intentos: ent(n.intentos, 0, 1e6, 0), victorias: ent(n.victorias, 0, 1e6, 0), derrotas: ent(n.derrotas, 0, 1e6, 0),
      completado: n.completado === true, estrellas: ent(n.estrellas, 0, 3, 0), mejorAciertos: ent(n.mejorAciertos, 0, 50, 0),
      mejorPrecision: num(n.mejorPrecision, 0, 1, 0), mejorVida: ent(n.mejorVida, 0, 100, 0),
      mejorTiempo: Number.isFinite(n.mejorTiempo) ? num(n.mejorTiempo, 0, 1e6, null) : null, ultimaFecha: fecha(n.ultimaFecha), aprobada: n.aprobada === true
    }
  }
  const contadores = (origen) => Object.fromEntries(Object.entries(esObjeto(origen) ? origen : {}).slice(0, 40)
    .map(([k, c]) => [cadena(k, '', 80), { correctas: ent(c?.correctas, 0, 1e6, 0), incorrectas: ent(c?.incorrectas, 0, 1e6, 0) }]))
  p.temas = contadores(pr.temas)
  p.tipos = contadores(pr.tipos)
  for (const k of Object.keys(p.combate)) p.combate[k] = ent(esObjeto(pr.combate) ? pr.combate[k] : 0, 0, 1e9, 0)
  p.segundosActividades = ent(pr.segundosActividades, 0, 1e9, 0)
  for (const [k, r] of Object.entries(esObjeto(pr.refuerzo) ? pr.refuerzo : {}).slice(0, MAX_ERRORES)) {
    if (!esObjeto(r) || !r.texto) { reparado = true; continue }
    p.refuerzo[cadena(k, '', 160)] = {
      nivel: ent(r.nivel, 1, NIVELES_TOTALES, 1), indice: ent(r.indice, 0, 20, 0), tipo: cadena(r.tipo, '', 40), tema: cadena(r.tema, '', 80),
      texto: cadena(r.texto), correcta: cadena(r.correcta), explicacion: cadena(r.explicacion, '', 600),
      fallos: ent(r.fallos, 1, 1e4, 1), aciertosSeguidos: ent(r.aciertosSeguidos, 0, 100, 0), ultimaFecha: fecha(r.ultimaFecha)
    }
  }
  p.ultimaSesion = fecha(pr.ultimaSesion)
  p.sesiones = ent(pr.sesiones, 0, 1e6, 0)
  // Un nivel no puede estar desbloqueado si el anterior no se completó… pero se respeta el máximo guardado.
  return { datos: { app: 'english-quest', version: VERSION, ajustes: a, progreso: p }, reparado }
}

// Migra las claves de versiones anteriores sin borrarlas (siguen ahí por si el estudiante vuelve atrás).
export function migrarClavesAntiguas(storage) {
  const datos = datosIniciales()
  let migrado = false
  try {
    const g = JSON.parse(storage.getItem(CLAVES_ANTIGUAS.graficos) || 'null')
    if (esObjeto(g)) {
      if (PERFILES_VALIDOS.includes(g.quality)) { datos.ajustes.calidad = g.quality; migrado = true }
      if (g.introSeen === true) { datos.ajustes.introVista = true; migrado = true }
    }
  } catch { /* clave antigua dañada: se ignora */ }
  try {
    const n = Number(storage.getItem(CLAVES_ANTIGUAS.nivel))
    if (Number.isInteger(n) && n >= 1 && n <= NIVELES_TOTALES + 1) {
      datos.progreso.desbloqueado = n
      for (let i = 1; i < n; i++) datos.progreso.niveles[i] = { ...nivelVacio(), completado: true, victorias: 1, intentos: 1, estrellas: 1 }
      migrado = true
    }
  } catch { /* almacenamiento no disponible */ }
  return { datos: validarDatos(datos).datos, migrado }
}

// Lectura segura: devuelve { datos, origen: 'nuevo'|'v2'|'migrado'|'recuperado', almacenamiento }
export function leerAlmacen(storage) {
  if (!storage) return { datos: datosIniciales(), origen: 'nuevo', almacenamiento: 'memoria' }
  let crudo
  try { crudo = storage.getItem(CLAVE) } catch { return { datos: datosIniciales(), origen: 'nuevo', almacenamiento: 'bloqueado' } }
  if (crudo == null) {
    const m = migrarClavesAntiguas(storage)
    return { datos: m.datos, origen: m.migrado ? 'migrado' : 'nuevo', almacenamiento: 'ok' }
  }
  try {
    const bruto = JSON.parse(crudo)
    if (!esObjeto(bruto) || bruto.app !== 'english-quest' || !Number.isInteger(bruto.version) || bruto.version > VERSION) throw new Error('formato no reconocido')
    const { datos, reparado } = validarDatos(bruto)
    return { datos, origen: reparado ? 'recuperado' : 'v2', almacenamiento: 'ok' }
  } catch {
    // Datos corruptos: se conserva una copia para no destruirlos y se empieza con valores limpios.
    try { storage.setItem(CLAVE + '-corrupto', String(crudo).slice(0, 200000)) } catch { /* sin espacio */ }
    return { datos: datosIniciales(), origen: 'recuperado', almacenamiento: 'ok' }
  }
}

export function guardarAlmacen(storage, datos) {
  if (!storage) return 'memoria'
  try { storage.setItem(CLAVE, JSON.stringify(datos)); return 'ok' } catch (e) {
    return e && (e.name === 'QuotaExceededError' || e.code === 22) ? 'lleno' : 'bloqueado'
  }
}

export function xpDe(progreso) {
  return Object.values(progreso.niveles).reduce((t, n) => t + n.mejorAciertos * XP_ACIERTO + (n.completado ? XP_VICTORIA : 0) + n.estrellas * XP_ESTRELLA, 0)
}

export const esLinguistico = (tipo) => !TIPOS_MOTRICES.includes(tipo)
export const claveRefuerzo = (nivel, texto) => `${nivel}|${texto}`.slice(0, 160)

export function crearProgreso(storage, { ahora = () => new Date(), diferirGuardado = (fn) => { fn(); return 0 } } = {}) {
  const estado = reactive({ cargado: false, origen: 'nuevo', almacenamiento: storage ? 'ok' : 'memoria', ...datosIniciales() })
  const xp = computed(() => xpDe(estado.progreso))
  const rango = computed(() => rangoDe(xp.value))

  function snapshot() { return { app: 'english-quest', version: VERSION, ajustes: JSON.parse(JSON.stringify(estado.ajustes)), progreso: JSON.parse(JSON.stringify(estado.progreso)) } }
  let pendiente = false
  function guardar() {
    if (pendiente) return
    pendiente = true
    diferirGuardado(() => { pendiente = false; estado.almacenamiento = guardarAlmacen(storage, snapshot()) })
  }
  function guardarYa() { pendiente = false; estado.almacenamiento = guardarAlmacen(storage, snapshot()) }
  function aplicar(datos) { estado.ajustes = datos.ajustes; estado.progreso = datos.progreso }

  function cargar() {
    if (estado.cargado) return
    const r = leerAlmacen(storage)
    aplicar(r.datos)
    estado.origen = r.origen
    estado.almacenamiento = r.almacenamiento
    estado.progreso.sesiones++
    estado.progreso.ultimaSesion = ahora().toISOString()
    estado.cargado = true
    guardar()
  }

  function ajustar(cambios) {
    const { datos } = validarDatos({ ...snapshot(), ajustes: { ...estado.ajustes, ...cambios } })
    estado.ajustes = datos.ajustes
    guardar()
  }

  const nivel = (n) => (estado.progreso.niveles[n] ??= nivelVacio())
  function contar(destino, clave, acierto) {
    const c = (destino[clave] ??= { correctas: 0, incorrectas: 0 })
    acierto ? c.correctas++ : c.incorrectas++
  }

  // Registra el resultado de una partida. «historial» es el del motor de combate (una entrada por ronda).
  // La práctica y el refuerzo no pasan por aquí: no alteran intentos, estrellas ni experiencia.
  function registrarPartida({ nivel: n, tema, resultado, historial, vidaCaballero = 0, segundos = 0, combate = {}, totalRondas = 6, aprobacion = APROBACION_INICIAL, minimoPorTema = 3 }) {
    const p = estado.progreso
    const antes = { xp: xp.value, rango: rango.value.id, estrellas: nivel(n).estrellas, completado: nivel(n).completado }
    const registro = nivel(n)
    registro.intentos++
    registro.ultimaFecha = ahora().toISOString()
    const lingu = historial.filter((h) => esLinguistico(h.tipo))
    const aciertos = lingu.filter((h) => h.acierto).length
    const precision = lingu.length ? aciertos / lingu.length : 0
    p.segundosActividades += Math.round(historial.reduce((t, h) => t + (h.segundos || 0), 0))
    for (const h of historial) {
      if (esLinguistico(h.tipo)) { contar(p.temas, h.tema ?? tema, h.acierto); contar(p.tipos, h.tipo, h.acierto) }
      const clave = claveRefuerzo(n, h.texto)
      if (!h.acierto && esLinguistico(h.tipo)) {
        const r = p.refuerzo[clave]
        p.refuerzo[clave] = { nivel: n, indice: h.indice ?? 0, tipo: h.tipo, tema, texto: h.texto, correcta: h.correcta, explicacion: h.explicacion || '', fallos: (r?.fallos ?? 0) + 1, aciertosSeguidos: 0, ultimaFecha: ahora().toISOString() }
      } else if (h.acierto && p.refuerzo[clave]) {
        // Acertar de nuevo en una partida normal también cuenta como evidencia de mejora.
        p.refuerzo[clave].aciertosSeguidos++
        if (p.refuerzo[clave].aciertosSeguidos >= 2) delete p.refuerzo[clave]
      }
    }
    // Evaluación integradora: el resultado EDUCATIVO se calcula aparte del resultado de COMBATE.
    // Solo cuentan las respuestas lingüísticas; una victoria sobre el guardián no equivale a aprobar.
    let final = null
    if (n === NIVEL_FINAL) {
      const grupos = new Map()
      for (const h of lingu) {
        const g = grupos.get(h.tema) ?? { tema: h.tema, fase: h.fase ?? 0, aciertos: 0, total: 0 }
        g.total++; if (h.acierto) g.aciertos++
        grupos.set(h.tema, g)
      }
      const porTema = [...grupos.values()].sort((a, b) => a.fase - b.fase).map((g) => ({ ...g, precision: g.total ? g.aciertos / g.total : 0, aprobado: g.total >= minimoPorTema && g.aciertos / g.total >= aprobacion }))
      const completo = lingu.length >= totalRondas
      final = { completo, umbral: aprobacion, aprobada: completo && precision >= aprobacion && porTema.every((g) => g.aprobado) || (completo && precision >= aprobacion && porTema.length > 0 && porTema.filter((g) => !g.aprobado).length === 0), porTema, reforzar: porTema.filter((g) => !g.aprobado) }
      // «Aprobada» exige todos los desafíos lingüísticos, el porcentaje global y el mínimo en cada temática.
      final.aprobada = completo && precision >= aprobacion && final.reforzar.length === 0
      if (completo) registro.mejorPrecision = Math.max(registro.mejorPrecision, precision)
      if (final.aprobada) registro.aprobada = true
    }
    const claves = Object.keys(p.refuerzo)
    if (claves.length > MAX_ERRORES) claves.sort((a, b) => (p.refuerzo[a].ultimaFecha || '').localeCompare(p.refuerzo[b].ultimaFecha || '')).slice(0, claves.length - MAX_ERRORES).forEach((k) => delete p.refuerzo[k])
    for (const k of Object.keys(p.combate)) if (k in combate) p.combate[k] += Math.max(0, Math.round(combate[k] || 0))
    let estrellas = 0
    if (resultado === 'victoria') {
      registro.victorias++
      registro.completado = true
      estrellas = 1 + (precision >= 0.7 ? 1 : 0) + (precision >= 0.9 && vidaCaballero >= 40 ? 1 : 0)
      registro.estrellas = Math.max(registro.estrellas, estrellas)
      registro.mejorAciertos = Math.max(registro.mejorAciertos, Math.min(aciertos, totalRondas))
      registro.mejorPrecision = Math.max(registro.mejorPrecision, precision)
      registro.mejorVida = Math.max(registro.mejorVida, Math.round(vidaCaballero))
      if (segundos > 0) registro.mejorTiempo = registro.mejorTiempo == null ? segundos : Math.min(registro.mejorTiempo, Math.round(segundos))
      p.desbloqueado = Math.min(NIVELES_TOTALES + 1, Math.max(p.desbloqueado, n + 1))
    } else if (resultado === 'derrota') {
      registro.derrotas++
    }
    guardar()
    const dominados = []
    const refuerzo = []
    const porTema = lingu.length ? { acierto: aciertos, total: lingu.length } : { acierto: 0, total: 0 }
    if (precision >= 0.8 && lingu.length) dominados.push(tema); else if (lingu.length) refuerzo.push(tema)
    return {
      nivel: n, tema, resultado, precision, aciertos, totalLinguistico: lingu.length, porTema,
      falladas: historial.filter((h) => !h.acierto && esLinguistico(h.tipo)),
      motrices: historial.filter((h) => !esLinguistico(h.tipo)),
      combate, vidaCaballero,
      recompensas: { xp: xp.value - antes.xp, estrellasNuevas: Math.max(0, registro.estrellas - antes.estrellas), estrellas: registro.estrellas, primeraVictoria: resultado === 'victoria' && !antes.completado, rangoNuevo: rango.value.id !== antes.rango ? rango.value : null },
      dominados: final ? final.porTema.filter((g) => g.aprobado).map((g) => g.tema) : dominados, refuerzo: final ? final.reforzar.map((g) => g.tema) : refuerzo, final
    }
  }

  // Práctica de refuerzo: no cambia XP, estrellas, intentos ni derrotas; solo la maestría de esa pregunta.
  function registrarRefuerzo(clave, acierto) {
    const r = estado.progreso.refuerzo[clave]
    if (!r) return false
    if (acierto) { r.aciertosSeguidos++; if (r.aciertosSeguidos >= 2) { delete estado.progreso.refuerzo[clave]; guardar(); return true } } else r.aciertosSeguidos = 0
    guardar()
    return false
  }

  function exportar() { return JSON.stringify(snapshot(), null, 2) }
  function importar(texto) {
    let bruto
    try { bruto = JSON.parse(texto) } catch { return { ok: false, motivo: 'json' } }
    if (!esObjeto(bruto) || bruto.app !== 'english-quest' || !Number.isInteger(bruto.version)) return { ok: false, motivo: 'formato' }
    if (bruto.version > VERSION) return { ok: false, motivo: 'version' }
    const { datos } = validarDatos(bruto)
    aplicar(datos)
    guardarYa()
    return { ok: true }
  }
  function reiniciar() { aplicar(datosIniciales()); estado.progreso.ultimaSesion = ahora().toISOString(); guardarYa() }
  function estadisticas() {
    const p = estado.progreso
    const sumar = (o) => Object.values(o).reduce((t, c) => ({ c: t.c + c.correctas, i: t.i + c.incorrectas }), { c: 0, i: 0 })
    const t = sumar(p.temas)
    return {
      correctas: t.c, incorrectas: t.i, precision: t.c + t.i ? t.c / (t.c + t.i) : 0,
      victorias: Object.values(p.niveles).reduce((s, n) => s + n.victorias, 0), derrotas: Object.values(p.niveles).reduce((s, n) => s + n.derrotas, 0),
      completados: Object.values(p.niveles).filter((n) => n.completado).length, estrellas: Object.values(p.niveles).reduce((s, n) => s + n.estrellas, 0)
    }
  }

  return { estado, xp, rango, cargar, ajustar, registrarPartida, registrarRefuerzo, exportar, importar, reiniciar, guardarYa, estadisticas, nivel, desbloquear: (n) => { estado.progreso.desbloqueado = Math.max(estado.progreso.desbloqueado, Math.min(NIVELES_TOTALES + 1, n)); guardar() } }
}

let instancia = null
export function usePlayerProgress() {
  if (!instancia) {
    let almacenamiento = null
    try { almacenamiento = typeof window !== 'undefined' ? window.localStorage : null } catch { almacenamiento = null }
    let t = 0
    instancia = crearProgreso(almacenamiento, { diferirGuardado: (fn) => { clearTimeout(t); t = setTimeout(fn, 300); return t } })
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => { if (document.hidden && instancia.estado.cargado) instancia.guardarYa() })
      window.addEventListener('pagehide', () => { if (instancia.estado.cargado) instancia.guardarYa() })
    }
  }
  return instancia
}
