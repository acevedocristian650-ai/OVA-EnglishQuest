// Ciclo de vida del audio: volumen por canal (música, efectos, voces), una sola música activa,
// reutilización de elementos de audio y límite de efectos simultáneos. No descarga nada por adelantado:
// cada archivo se pide la primera vez que suena.
import { usePlayerProgress } from './usePlayerProgress.js'

// Los archivos de public/ se sirven desde app.baseURL, no desde el base de Vite
// (que puede incluir buildAssetsDir, por ejemplo /_nuxt/). Se configura en el plugin cliente.
let baseAudio = ''
export function configurarBaseAudio(base = '/') {
  baseAudio = String(base || '/').replace(/\/+$/, '')
}
export function rutaAudio(ruta) {
  if (typeof ruta !== 'string' || !ruta.startsWith('/') || ruta.startsWith('//')) return ruta
  if (!baseAudio || ruta === baseAudio || ruta.startsWith(baseAudio + '/')) return ruta
  return baseAudio + ruta
}

const MAX_EFECTOS = 8
const MAX_VOCES = 2
const activos = { efectos: [], voces: [] }
const clips = new Set() // clips largos de secuencias (transformación solar): se detienen al salir de la batalla
const libres = new Map() // ruta → [Audio] reutilizables
let musica = null

export function volumenCanal(canal) {
  const v = usePlayerProgress().estado.ajustes.volumen
  return typeof v[canal] === 'number' ? v[canal] : 1
}

function tomar(ruta) {
  const url = rutaAudio(ruta)
  const lista = libres.get(url)
  const audio = lista?.pop() ?? new Audio(url)
  audio.currentTime = 0
  return audio
}
function devolver(ruta, audio) {
  const url = audio.src || rutaAudio(ruta)
  const clave = typeof location !== 'undefined' ? new URL(url, location.href).pathname : url
  const lista = libres.get(clave) ?? []
  if (lista.length < 2) { lista.push(audio); libres.set(clave, lista) }
}

// Reproduce un efecto. Si hay demasiados a la vez se corta el más antiguo (los avisos importantes son los más recientes).
export function reproducirEfecto(ruta, { volumen = 0.85, canal = 'efectos' } = {}) {
  if (!ruta || typeof Audio === 'undefined') return null
  const cola = activos[canal] ?? activos.efectos
  const limite = canal === 'voces' ? MAX_VOCES : MAX_EFECTOS
  while (cola.length >= limite) cola[0].detener()
  const audio = tomar(ruta)
  audio.volume = Math.min(1, Math.max(0, volumen * volumenCanal(canal)))
  let terminado = false
  let resolver
  const fin = new Promise((r) => { resolver = r })
  const entrada = { audio, fin, detener: () => terminar() }
  function terminar(reutilizar = true) {
    if (terminado) return
    terminado = true
    audio.onended = audio.onerror = null
    audio.pause()
    const i = cola.indexOf(entrada)
    if (i >= 0) cola.splice(i, 1)
    if (reutilizar) devolver(ruta, audio)
    resolver()
  }
  audio.onended = () => terminar()
  audio.onerror = () => { console.warn('[English Quest] No se pudo cargar el audio:', audio.src); terminar(false) }
  cola.push(entrada)
  audio.play().catch((error) => {
    if (terminado) return
    if (error?.name !== 'NotAllowedError' && error?.name !== 'AbortError') console.warn('[English Quest] No se pudo reproducir el audio:', audio.src, error)
    terminar(false)
  })
  return entrada
}

// Clip de una secuencia: devuelve { fin: Promise, detener() }. Usa el volumen del canal de efectos, reutiliza
// elementos de audio y siempre termina (fin del audio, error, bloqueo del navegador o límite de seguridad).
export function reproducirClipAudio(ruta, { volumen = 0.75, canal = 'efectos', limiteMs = 12000 } = {}) {
  if (!ruta || typeof Audio === 'undefined') return { fin: Promise.resolve(), detener() {} }
  const audio = tomar(ruta)
  audio.volume = Math.min(1, Math.max(0, volumen * volumenCanal(canal)))
  let resuelto = false
  let resolver
  const fin = new Promise((r) => { resolver = r })
  const clip = { fin, detener: () => terminar() }
  const limite = setTimeout(() => terminar(), limiteMs)
  function terminar() {
    if (resuelto) return
    resuelto = true
    clearTimeout(limite)
    audio.onended = audio.onerror = null
    audio.pause()
    clips.delete(clip)
    devolver(ruta, audio)
    resolver()
  }
  audio.onended = terminar
  audio.onerror = () => { console.warn('[English Quest] No se pudo cargar el clip:', audio.src); terminar() }
  clips.add(clip)
  audio.play().catch(terminar) // autoplay bloqueado: la secuencia visual continúa sin esperar al audio
  return clip
}

export function detenerEfectos() {
  for (const c of [...clips]) c.detener()
  for (const canal of Object.keys(activos)) for (const e of [...activos[canal]]) e.detener()
}
// Al salir de una batalla se sueltan los audios reutilizables (efectos de combate, voces del jefe).
export function liberarAudioBatalla() {
  detenerEfectos()
  for (const [ruta, lista] of libres) if (ruta.includes('/audio/combate/')) { lista.forEach((a) => { a.src = '' }); libres.delete(ruta) }
}

// Música: solo una pista a la vez; al registrar otra, la anterior se detiene.
export function registrarMusica(audio, volumenBase) {
  if (musica && musica.audio !== audio) { musica.audio.pause() }
  musica = { audio, volumenBase }
  aplicarVolumenMusica()
}
export function liberarMusica(audio) { if (musica?.audio === audio) musica = null }
export function aplicarVolumenMusica() { if (musica) musica.audio.volume = Math.min(1, Math.max(0, musica.volumenBase * volumenCanal('musica'))) }
