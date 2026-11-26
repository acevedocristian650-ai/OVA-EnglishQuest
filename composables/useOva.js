// Utilidades compartidas del OVA: pantalla completa, voz del navegador, avance de la biblioteca y estado del recorrido.
// Solo usa localStorage (clave propia, separada del progreso de combate) y la reactividad nativa de Vue.
import { reactive } from 'vue'

// ---------- Pantalla completa (Fullscreen API) ----------
let escuchandoPantalla = false
export function usePantallaCompleta() {
  const activa = useState('eq-pantalla-completa', () => false)
  const disponible = useState('eq-pantalla-completa-disponible', () => false)
  const sincronizar = () => { activa.value = Boolean(document.fullscreenElement || document.webkitFullscreenElement) }

  // Llamar desde onMounted: detecta el soporte y escucha los cambios (una sola vez para toda la aplicación).
  function iniciar() {
    const el = document.documentElement
    disponible.value = Boolean((document.fullscreenEnabled || document.webkitFullscreenEnabled) && (el.requestFullscreen || el.webkitRequestFullscreen))
    if (!escuchandoPantalla) {
      escuchandoPantalla = true
      document.addEventListener('fullscreenchange', sincronizar)
      document.addEventListener('webkitfullscreenchange', sincronizar)
    }
    sincronizar()
  }

  // IMPORTANTE: se debe llamar de forma síncrona dentro del manejador del toque/clic, antes de cualquier await.
  // Si el navegador la rechaza o no la admite, el juego continúa sin avisos.
  function solicitar() {
    try {
      const el = document.documentElement
      if (document.fullscreenElement || document.webkitFullscreenElement) return
      const pedir = el.requestFullscreen ?? el.webkitRequestFullscreen
      const promesa = pedir?.call(el, { navigationUI: 'hide' })
      promesa?.catch?.(() => {})
    } catch { /* sin soporte o rechazada: se continúa */ }
  }
  function salir() {
    try { (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document)?.catch?.(() => {}) } catch { /* nada */ }
  }
  function alternar() { (document.fullscreenElement || document.webkitFullscreenElement) ? salir() : solicitar() }
  return { activa, disponible, iniciar, solicitar, salir, alternar }
}

// ---------- Pronunciación (síntesis de voz del navegador, con alternativa textual) ----------
export function vozDisponible() { return import.meta.client && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined' }
export function hablar(texto, volumen = 1) {
  if (!vozDisponible()) return false
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(texto)
    u.lang = 'en-US'; u.rate = 0.85; u.volume = volumen
    window.speechSynthesis.speak(u)
    return true
  } catch { return false }
}
export function callar() { try { if (vozDisponible()) window.speechSynthesis.cancel() } catch { /* nada */ } }

// ---------- Avance de la biblioteca (consultado ≠ evaluado) ----------
const CLAVE_BIBLIOTECA = 'english-quest-biblioteca-v1'
const biblioteca = reactive({ cargada: false, consultados: {}, practica: {} })
function guardarBiblioteca() {
  try { localStorage.setItem(CLAVE_BIBLIOTECA, JSON.stringify({ consultados: biblioteca.consultados, practica: biblioteca.practica })) } catch { /* sin almacenamiento */ }
}
export function useBiblioteca() {
  if (import.meta.client && !biblioteca.cargada) {
    biblioteca.cargada = true
    try {
      const bruto = JSON.parse(localStorage.getItem(CLAVE_BIBLIOTECA) || '{}')
      if (bruto && typeof bruto === 'object') {
        if (bruto.consultados && typeof bruto.consultados === 'object') biblioteca.consultados = bruto.consultados
        if (bruto.practica && typeof bruto.practica === 'object') biblioteca.practica = bruto.practica
      }
    } catch { /* datos dañados: se empieza limpio */ }
  }
  function marcarConsultado(nivel) {
    if (biblioteca.consultados[nivel]) return
    biblioteca.consultados[nivel] = new Date().toISOString()
    guardarBiblioteca()
  }
  // La práctica se registra aparte: no da experiencia, estrellas ni afecta a la vida del caballero.
  function registrarPractica(nivel, id, acierto) {
    const tema = (biblioteca.practica[nivel] ??= {})
    const a = (tema[id] ??= { intentos: 0, aciertos: 0, superada: false })
    a.intentos++
    if (acierto) { a.aciertos++; a.superada = true }
    guardarBiblioteca()
  }
  const practicaDe = (nivel) => biblioteca.practica[nivel] ?? {}
  const superadas = (nivel) => Object.values(practicaDe(nivel)).filter((a) => a.superada).length
  return { biblioteca, marcarConsultado, registrarPractica, practicaDe, superadas, consultado: (n) => Boolean(biblioteca.consultados[n]) }
}

// ---------- Recorrido inicial ----------
export function useRecorrido() {
  const activo = useState('eq-recorrido-activo', () => false)
  return { activo, iniciar: () => { activo.value = true }, cerrar: () => { activo.value = false } }
}
