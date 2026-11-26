// Perfiles gráficos: «alta» y «lite» (no hay perfil intermedio ni automático) y acceso a las imágenes del juego.
// La elección es siempre manual y se respeta. La detección de fluidez (useFramePacing) solo RECOMIENDA pasar de
// Alta a Lite; el cambio nunca se aplica solo ni en mitad de una actividad.
import { useAssetManager, fondoNivel, recursosEsenciales, recursosPorPrioridad } from './useAssetManager.js'
import { perfilInferior } from './useFramePacing.js'

const PROFILES = ['alta', 'lite']

export function useGameGraphics() {
  const quality = useState('english-quest-graphics-quality', () => 'lite')
  const preferencesLoaded = useState('english-quest-graphics-loaded', () => false)
  const introSeen = useState('english-quest-intro-seen', () => false)
  const recomendacion = useState('english-quest-graphics-recommendation', () => null)
  const preparacion = useState('english-quest-graphics-preparation', () => ({ etiqueta: '', loaded: 0, total: 0, failed: 0 }))
  const { t } = useLanguage()
  const { language } = useLanguage()
  const progreso = usePlayerProgress()
  const assets = useAssetManager(() => quality.value)

  function loadPreferences() {
    if (!import.meta.client || preferencesLoaded.value) return
    progreso.cargar()
    const a = progreso.estado.ajustes
    quality.value = PROFILES.includes(a.calidad) ? a.calidad : 'lite'
    introSeen.value = a.introVista
    language.value = a.idioma
    preferencesLoaded.value = true
    watch(language, (valor) => progreso.ajustar({ idioma: valor }))
  }

  // Cambiar de perfil invalida las precargas pendientes y libera las imágenes del perfil anterior
  // (las del nuevo se preparan al necesitarlas). El progreso educativo no se toca.
  function setQuality(valor, ...conservar) {
    if (!PROFILES.includes(valor)) return
    const antes = quality.value
    quality.value = valor
    recomendacion.value = null
    progreso.ajustar({ calidad: valor })
    if (antes !== valor) assets.liberarTodoExcepto(...conservar)
  }

  // Recomendación de un perfil inferior (llega desde useFramePacing): solo se ofrece, nunca se aplica sola.
  function recomendar(perfil) {
    if (PROFILES.includes(perfil) && PROFILES.indexOf(perfil) > PROFILES.indexOf(quality.value)) recomendacion.value = perfil
  }
  function aplicarRecomendacion() {
    const perfil = recomendacion.value
    if (!perfil) return
    recomendacion.value = null
    setQuality(perfil)
  }
  function descartarRecomendacion() { recomendacion.value = null }

  function finishIntro() { introSeen.value = true; progreso.ajustar({ introVista: true }) }

  function imageUrl(src, profile = quality.value) { return assets.resolver(src, profile) }
  function decodeImage(src, ambito, prioridad) { return import.meta.client ? assets.decodificar(imageUrl(src), ambito, prioridad) : Promise.resolve() }
  function prepareImages(sources, opciones = {}) {
    const { onProgress, ...resto } = opciones
    return assets.preparar(sources, { ...resto, onProgress: (p) => { preparacion.value = { ...preparacion.value, ...p }; onProgress?.(p) } })
  }
  function levelEssentials(level, profile = quality.value) { return recursosEsenciales(level, profile) }
  function levelPriorities(level, profile = quality.value) { return recursosPorPrioridad(level, profile) }
  function levelBackground(level, profile = quality.value) { return fondoNivel(level, profile) }
  function releaseScope(nombre) { assets.liberarAmbito(nombre) }
  function releaseLevelsExcept(numero) { for (let i = 1; i <= 5; i++) if (i !== numero) assets.liberarAmbito(`nivel-${i}`) }

  return {
    quality, qualityMode: quality, modoCalidad: quality, introSeen, preferencesLoaded, recomendacion, preparacion, assets, t,
    loadPreferences, setQuality, setQualityMode: setQuality, recomendar, aplicarRecomendacion, descartarRecomendacion,
    finishIntro, imageUrl, decodeImage, prepareImages, levelEssentials, levelPriorities, levelBackground, releaseScope, releaseLevelsExcept,
    perfilInferior
  }
}
