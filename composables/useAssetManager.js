// Gestión de imágenes del juego: variantes por perfil (alta | lite), decodificación única y memoria acotada.
//
// - Las variantes salen de data/variantes-imagenes.json (generado por scripts/generar-variantes.mjs).
//   Solo se pide un archivo si el manifiesto confirma que existe: no hay solicitudes a rutas inventadas.
// - La caché guarda objetos Image ya decodificados con su coste teórico (ancho × alto × 4 bytes).
//   Esa cifra es una ESTIMACIÓN de memoria RGBA, no una medición: el navegador decide cuándo libera
//   realmente los píxeles. Soltar la referencia solo permite que pueda hacerlo.
// - Cada recurso pertenece a uno o más «ámbitos» (menu, nivel-2...) con una PRIORIDAD por ámbito:
//     0 visible · 1 imprescindible · 2 próximas poses · 3 secundario · 4 baja prioridad.
//   Pertenecer al nivel actual NO basta para quedarse: si se supera el presupuesto se expulsan, de menor a
//   mayor prioridad y del menos al más reciente, los recursos 4, 3 y 2. Nunca se expulsan los visibles (0)
//   ni los imprescindibles (1); si por sí solos superan el límite se anota en `estadisticas.excesos`
//   (diagnóstico) y se dejan de preparar los recursos secundarios.
// - Invalidación: cada ámbito tiene un número de generación. Un resultado que llega de una generación
//   anterior (batalla abandonada, cambio de perfil, reintento) se descarta y no queda retenido.
import manifiesto from '../data/variantes-imagenes.json' with { type: 'json' }

export const PERFILES = ['alta', 'lite']
// Presupuesto de memoria decodificada teórica por perfil (bytes).
export const PRESUPUESTO = { alta: 96 * 1048576, lite: 28 * 1048576 }
export const PRIORIDAD = { VISIBLE: 0, ESENCIAL: 1, PROXIMA: 2, SECUNDARIA: 3, BAJA: 4 }
const CADENA = { alta: ['alta', 'lite'], lite: ['lite', 'alta'] }

const tallo = (src) => src.replace(/\.(png|webp)$/, '').replace(/-lite$/, '')

// Función pura: devuelve la URL de la variante para un perfil, o el mismo src si no hay manifiesto para él.
export function resolverImagen(src, perfil = 'lite', sustituciones) {
  if (typeof src !== 'string') return src
  const entrada = manifiesto[tallo(src)]
  if (!entrada || !/\.(png|webp)$/.test(src)) return src
  const elegida = CADENA[perfil]?.find((p) => entrada[p])
  const url = elegida ? entrada[elegida][0] : src
  return sustituciones?.get(url) || url
}

// Dimensiones y peso conocidos de una URL concreta (null si no está en el manifiesto).
export function medidasDe(url) {
  const entrada = manifiesto[tallo(url)]
  if (!entrada) return null
  for (const v of Object.values(entrada)) if (v[0] === url) return { ancho: v[1], alto: v[2], bytes: v[3], memoria: v[1] * v[2] * 4 }
  return null
}

export function variantesDisponibles(src) {
  const entrada = manifiesto[tallo(src)]
  return entrada ? Object.keys(entrada) : []
}
export const existeImagen = (src) => Boolean(manifiesto[tallo(src)])

export function crearGestorImagenes({ crearImagen = () => new Image(), perfil = () => 'lite', limiteMs = 12000, memoriaPorDefecto = 512 * 512 * 4 } = {}) {
  const cache = new Map() // url → { imagen, memoria, ambitos:Map(ambito→prioridad), usos, ultimo }
  const pendientes = new Map() // url → { promesa, suscriptores:Set(token), sinToken, cancelar } (las solicitudes duplicadas comparten descarga)
  const sustituciones = new Map() // url que falló → url alternativa que sí cargó
  const visibles = new Map() // url → nº de usos visibles
  const generaciones = new Map() // ámbito → generación vigente
  let generacionGlobal = 0
  const estadisticas = { descargas: 0, aciertos: 0, fallos: 0, liberadas: 0, descartadas: 0, canceladas: 0, omitidas: 0, excesos: 0, ultimoExceso: 0 }
  let reloj = 0

  const memoriaDe = (url) => medidasDe(url)?.memoria ?? memoriaPorDefecto
  const memoriaTotal = () => { let n = 0; for (const e of cache.values()) n += e.memoria; return n }
  const limiteActual = () => PRESUPUESTO[perfil()] ?? PRESUPUESTO.lite
  const resolver = (src, p = perfil()) => resolverImagen(src, p, sustituciones)

  // --- Ámbitos y tokens de generación
  function tokenDe(ambito) {
    if (!ambito) return null
    if (typeof ambito === 'object') return ambito
    if (!generaciones.has(ambito)) generaciones.set(ambito, 1)
    return { ambito, gen: generaciones.get(ambito), global: generacionGlobal }
  }
  const vigente = (token) => !token || (generaciones.get(token.ambito) === token.gen && token.global === generacionGlobal)
  const abrirAmbito = (ambito) => tokenDe(ambito)

  function soltar(url, e) {
    if (e) { try { e.imagen.onload = e.imagen.onerror = null; e.imagen.src = '' } catch { /* sin efecto */ } }
    cache.delete(url)
    estadisticas.liberadas++
  }
  function prioridadDe(e) {
    let p = 99 // sin ámbito = obsoleto
    for (const v of e.ambitos.values()) p = Math.min(p, v)
    return p
  }

  // Expulsión por prioridad. Devuelve true si se cumple el presupuesto.
  // `minPrioridad`: solo se pueden expulsar recursos de esa prioridad o inferior (nunca los de mayor prioridad).
  function ajustar(excepto, minPrioridad = PRIORIDAD.PROXIMA) {
    const limite = limiteActual()
    if (memoriaTotal() <= limite) return true
    const candidatas = [...cache.entries()]
      .filter(([url, e]) => url !== excepto && !visibles.has(url) && prioridadDe(e) >= Math.max(minPrioridad, PRIORIDAD.PROXIMA))
      // 1.º obsoletas (sin ámbito), 2.º menor prioridad (número mayor), 3.º menos reciente
      .sort((a, b) => prioridadDe(b[1]) - prioridadDe(a[1]) || a[1].ultimo - b[1].ultimo)
    for (const [url, e] of candidatas) {
      if (memoriaTotal() <= limite) break
      soltar(url, e)
    }
    if (memoriaTotal() > limite) { estadisticas.excesos++; estadisticas.ultimoExceso = memoriaTotal() - limite; return false }
    return true
  }

  function registrarEnCache(url, imagen, token, prioridad) {
    let e = cache.get(url)
    if (!e) { e = { imagen, memoria: memoriaDe(url), ambitos: new Map(), usos: 0, ultimo: 0 }; cache.set(url, e) }
    e.usos++; e.ultimo = ++reloj
    if (token) e.ambitos.set(token.ambito, Math.min(prioridad, e.ambitos.get(token.ambito) ?? 99))
    return e
  }

  function cargar(url, token) {
    let p = pendientes.get(url)
    if (p) { if (token) p.suscriptores.add(token); else p.sinToken = true; return p.promesa }
    const imagen = crearImagen()
    estadisticas.descargas++
    p = { suscriptores: new Set(token ? [token] : []), sinToken: !token, promesa: null, cancelar: null }
    p.promesa = new Promise((resolve) => {
      const temporizador = setTimeout(() => { imagen.onload = imagen.onerror = null; resolve(false) }, limiteMs)
      p.cancelar = () => { clearTimeout(temporizador); imagen.onload = imagen.onerror = null; try { imagen.src = '' } catch { /* sin efecto */ } estadisticas.canceladas++; resolve(false) }
      imagen.onload = async () => {
        try { await imagen.decode?.(); resolve(imagen) } catch { resolve(false) } finally { clearTimeout(temporizador) }
      }
      imagen.onerror = () => { clearTimeout(temporizador); resolve(false) }
      imagen.src = url
    }).then((resultado) => {
      if (pendientes.get(url) === p) pendientes.delete(url)
      if (resultado) estadisticas.aciertos++; else estadisticas.fallos++
      return resultado
    })
    pendientes.set(url, p)
    return p.promesa
  }

  // Si ninguna solicitud en curso sigue vigente, se cancela la descarga (con Image, vaciando src).
  function podarPendientes() {
    for (const [url, p] of [...pendientes]) {
      for (const t of [...p.suscriptores]) if (!vigente(t)) p.suscriptores.delete(t)
      if (!p.sinToken && !p.suscriptores.size) { pendientes.delete(url); p.cancelar?.() }
    }
  }

  // Decodifica una URL ya resuelta. Los aciertos se reutilizan; los fallos no se guardan, así un reintento vuelve a pedir.
  // `ambito` puede ser un nombre o un token; el resultado de un ámbito ya cerrado se rechaza (devuelve false).
  async function decodificar(url, ambito, prioridad = PRIORIDAD.ESENCIAL) {
    if (!url) return false
    const token = tokenDe(ambito)
    const e = cache.get(url)
    if (e) {
      if (!vigente(token)) return false
      registrarEnCache(url, e.imagen, token, prioridad)
      return e.imagen
    }
    const imagen = await cargar(url, token)
    if (!imagen) return false
    if (!vigente(token)) { estadisticas.descartadas++; return false } // llegó tarde: no se retiene a nombre de un ámbito inexistente
    registrarEnCache(url, imagen, token, prioridad)
    ajustar(url)
    return imagen
  }

  // Prepara varias imágenes con la variante del perfil; si una variante falla, prueba la siguiente de la cadena.
  // `fuentes` admite cadenas o { src, prioridad }. Los recursos de prioridad ≥ 2 no se piden si ya no caben.
  async function preparar(fuentes, { signal, onProgress, perfil: p = perfil(), profile, ambito, prioridad = PRIORIDAD.ESENCIAL, concurrencia = 3 } = {}) {
    p = profile ?? p
    const token = tokenDe(ambito)
    const prioridades = new Map()
    for (const f of fuentes.filter(Boolean)) {
      const src = typeof f === 'string' ? f : f.src
      const pr = typeof f === 'string' ? prioridad : (f.prioridad ?? prioridad)
      prioridades.set(src, Math.min(pr, prioridades.get(src) ?? 99))
    }
    const unicas = [...prioridades.keys()]
    let cargadas = 0, falladas = 0, cursor = 0
    const cancelado = () => Boolean(signal?.aborted) || !vigente(token)
    const avanzar = () => { cargadas++; onProgress?.({ loaded: cargadas, total: unicas.length, failed: falladas }) }
    const trabajador = async () => {
      while (cursor < unicas.length && !cancelado()) {
        const original = unicas[cursor++]
        const pr = prioridades.get(original)
        const alternativa = original.startsWith('/images/arenas/static/') ? original.replace('/arenas/static/', '/arenas/').replace('.webp', '-animado.svg') : null
        const intentos = [...new Set([resolver(original, p), ...(CADENA[p] ?? []).map((q) => resolverImagen(original, q)), original, alternativa].filter(Boolean))]
        // Recurso secundario que ya no cabe: no se pide (evita ciclos de descarga, decodificación y expulsión)
        if (pr >= PRIORIDAD.PROXIMA && !cache.has(intentos[0]) && memoriaTotal() + memoriaDe(intentos[0]) > limiteActual()) {
          ajustar(undefined, pr)
          if (memoriaTotal() + memoriaDe(intentos[0]) > limiteActual()) { estadisticas.omitidas++; avanzar(); continue }
        }
        let ok = false
        for (const url of intentos) {
          if (cancelado()) return
          ok = await decodificar(url, token, pr)
          if (ok) { if (url !== intentos[0]) sustituciones.set(intentos[0], url); break }
        }
        if (cancelado()) return
        if (!ok) falladas++
        avanzar()
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrencia, unicas.length) }, trabajador))
    return { loaded: cargadas, total: unicas.length, failed: falladas, cancelled: cancelado() }
  }

  // Cierra un ámbito: invalida sus solicitudes en curso y suelta las referencias que nadie más necesita.
  function liberarAmbito(ambito) {
    generaciones.set(ambito, (generaciones.get(ambito) ?? 1) + 1)
    for (const [url, e] of [...cache]) {
      if (!e.ambitos.delete(ambito) || e.ambitos.size) continue
      soltar(url, e)
    }
    podarPendientes()
  }
  // Cambio de perfil o reinicio: invalida todo y suelta lo que no pertenece a los ámbitos indicados.
  function liberarTodoExcepto(...conservar) {
    generacionGlobal++
    for (const [url, e] of [...cache]) {
      if ([...e.ambitos.keys()].some((a) => conservar.includes(a))) continue
      soltar(url, e)
    }
    sustituciones.clear()
    visibles.clear()
    podarPendientes()
  }
  // Prioridad 0: la pose se está mostrando ahora y no puede expulsarse.
  function marcarVisible(url, activo = true) {
    if (!url) return
    const n = (visibles.get(url) ?? 0) + (activo ? 1 : -1)
    if (n > 0) visibles.set(url, n); else visibles.delete(url)
  }
  function fijar(ambito, urls, prioridad = PRIORIDAD.ESENCIAL) {
    for (const u of urls) { const e = cache.get(u); if (e) e.ambitos.set(ambito, Math.min(prioridad, e.ambitos.get(ambito) ?? 99)) }
  }
  function listo(src, p = perfil()) { return cache.has(resolver(src, p)) }
  function instantanea() {
    return { entradas: cache.size, memoriaTeorica: memoriaTotal(), presupuesto: limiteActual(), visibles: visibles.size, pendientes: pendientes.size, ...estadisticas }
  }

  return { resolver, decodificar, preparar, liberarAmbito, liberarTodoExcepto, abrirAmbito, marcarVisible, fijar, listo, instantanea, ajustar }
}

let compartido = null
export function useAssetManager(obtenerPerfil) {
  if (!compartido) {
    compartido = crearGestorImagenes({ perfil: () => compartido.perfilActual?.() ?? 'lite' })
  }
  if (obtenerPerfil) compartido.perfilActual = obtenerPerfil
  return compartido
}

// Fondo del nivel según perfil: Lite usa la imagen estática; Alta, el fondo animado.
export function fondoNivel(nivel, perfil) {
  if (perfil !== 'lite') return nivel.fondo
  return nivel.fondo.replace('/arenas/', '/arenas/static/').replace(/-animado\.svg$/, '.webp')
}

const HEROE = '/images/personajes-mate/caballero'

// Recursos imprescindibles para empezar la batalla (poses iniciales, guardián, primeras animaciones).
export function recursosEsenciales(nivel, perfil) {
  const guardian = nivel.arte
  const base = [
    fondoNivel(nivel, perfil),
    `${HEROE}/reposo.png`, `${HEROE}/preparacion-hachazo.png`, `${HEROE}/impacto-hachazo.png`, `${HEROE}/guardia.webp`,
    `${guardian}/reposo.png`, `${guardian}/preparacion.png`, `${guardian}/impacto.png`, `${guardian}/carga-1.webp`, `${guardian}/carga-2.webp`,
    ...(nivel.preguntas.some((q) => q.tipo === 'hacha') ? [`${HEROE}/sin-arma.webp`] : [])
  ]
  // Lite dibuja una sola pose por luchador: se aseguran también las reacciones más frecuentes.
  if (perfil === 'lite') base.push(`${HEROE}/dolor.png`, `${HEROE}/golpeado.webp`, `${guardian}/ataque.webp`)
  return base
}

// Próximas poses (reacciones y salida del golpe básico) y recursos secundarios (ataques especiales, remates, derrotas).
// Solo se incluyen los que existen en el manifiesto y no son esenciales. La extensión no importa: se resuelve por nombre.
export function recursosPorPrioridad(nivel, perfil = 'lite') {
  const guardian = nivel.arte
  const esenciales = new Set([...recursosEsenciales(nivel, 'alta'), ...recursosEsenciales(nivel, 'lite')].map((s) => s.replace(/\.(png|webp)$/, '')))
  const proximas = [
    `${HEROE}/dolor.png`, `${HEROE}/golpeado.webp`, `${HEROE}/esquiva.webp`, `${HEROE}/salida-hachazo.png`,
    `${guardian}/ataque.webp`, `${guardian}/recuperacion.png`, `${guardian}/retroceso.png`, `${guardian}/tambaleo.png`, `${guardian}/dolor.png`,
    // La escena Alta también usa las poses de reacción del héroe (Lite dibuja una sola pose por luchador y no las necesita)
    ...(perfil === 'alta' ? [`${HEROE}/recuperacion.png`, `${HEROE}/retroceso.png`, `${HEROE}/tambaleo.png`] : [])
  ]
  const especiales = ['escudo', 'barrido', 'fenix', 'rayo'].flatMap((n) => [`preparacion-${n}`, `impacto-${n}`, `salida-${n}`].map((p) => `${HEROE}/${p}.png`))
  const secundarias = [
    ...especiales, `${HEROE}/anticipacion.webp`, `${HEROE}/final-1.webp`, `${HEROE}/final-2.webp`, `${HEROE}/final-3.webp`, `${HEROE}/caida.png`,
    `${guardian}/caida.png`, `${guardian}/derrota-1.webp`, `${guardian}/derrota-2.webp`
  ]
  const util = (lista) => lista.filter((s) => existeImagen(s) && !esenciales.has(s.replace(/\.(png|webp)$/, '')))
  return { proximas: util(proximas), secundarias: util(secundarias) }
}
