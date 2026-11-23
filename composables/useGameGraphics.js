const STORAGE_KEY = 'english-quest-graphics-v1'
const PROFILES = ['alta', 'equilibrada', 'lite']

// Images are deduplicated for the lifetime of the page. Level changes cancel the
// caller's wait, while already decoded images remain reusable by the browser.
const imageCache = new Map()
const replacements = new Map()

export function useGameGraphics() {
  const quality = useState('english-quest-graphics-quality', () => 'equilibrada')
  const preferencesLoaded = useState('english-quest-graphics-loaded', () => false)
  const introSeen = useState('english-quest-intro-seen', () => false)
  const { t } = useLanguage()

  function loadPreferences() {
    if (!import.meta.client || preferencesLoaded.value) return
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (PROFILES.includes(saved.quality)) quality.value = saved.quality
      introSeen.value = saved.introSeen === true
    } catch {
      // A blocked or malformed localStorage entry should not stop the game.
    }
    preferencesLoaded.value = true
  }

  function savePreferences() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        quality: quality.value,
        introSeen: introSeen.value
      }))
    } catch {
      // The selected profile remains active for this session if storage is full.
    }
  }

  function setQuality(value) {
    if (!PROFILES.includes(value)) return
    quality.value = value
    savePreferences()
  }

  function finishIntro() {
    introSeen.value = true
    savePreferences()
  }

  // Every PNG has a WebP companion generated from the original. High mode
  // retains PNG; Balanced and Lite use the smaller companion where possible.
  function imageUrl(src, profile = quality.value) {
    if (typeof src !== 'string' || !src.endsWith('.png') || profile === 'alta') return src
    const variant = src.slice(0, -4) + (profile === 'lite' ? '-lite.webp' : '.webp')
    return replacements.get(variant) || variant
  }

  function decodeImage(src) {
    if (!import.meta.client || !src) return Promise.resolve()
    if (!imageCache.has(src)) {
      const image = new Image()
      const pending = new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), 12000)
        image.onload = async () => {
          try {
            await image.decode()
            resolve(image)
          } catch { resolve(false) }
          finally { clearTimeout(timer) }
        }
        image.onerror = () => { clearTimeout(timer); resolve(false) }
        image.src = src
      })
      imageCache.set(src, pending)
      if (imageCache.size > 48) imageCache.delete(imageCache.keys().next().value)
      pending.then(ok => { if (!ok && imageCache.get(src) === pending) imageCache.delete(src) })
    }
    return imageCache.get(src)
  }

  async function prepareImages(sources, { signal, onProgress, profile = quality.value } = {}) {
    const unique = [...new Set(sources.filter(Boolean))]
    let loaded = 0
    let failed = 0
    let cursor = 0
    const worker = async () => {
      while (cursor < unique.length && !signal?.aborted) {
        const original = unique[cursor++]
        const src = imageUrl(original, profile)
        let ok = await decodeImage(src)
        if (!ok && src !== original && !signal?.aborted) {
          ok = await decodeImage(original)
          if (ok) replacements.set(src, original)
        }
        if (!ok && original.startsWith('/images/arenas/static/')) {
          const animated = original.replace('/arenas/static/', '/arenas/').replace('.webp', '-animado.svg')
          ok = await decodeImage(animated)
          if (ok) replacements.set(original, animated)
        }
        if (signal?.aborted) return
        if (!ok) failed++
        loaded++
        onProgress?.({ loaded, total: unique.length, failed })
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, unique.length) }, worker))
    return { loaded, total: unique.length, failed, cancelled: Boolean(signal?.aborted) }
  }

  function levelEssentials(level) {
    const guardian = level.arte
    const hero = '/images/personajes-mate/caballero'
    return [
      levelBackground(level),
      `${hero}/reposo.png`, `${hero}/preparacion-hachazo.png`, `${hero}/impacto-hachazo.png`,
      `${hero}/guardia.webp`, `${guardian}/reposo.png`, `${guardian}/preparacion.png`,
      `${guardian}/impacto.png`, `${guardian}/carga-1.webp`, `${guardian}/carga-2.webp`,
      ...(level.preguntas.some(q => q.tipo === 'hacha') ? [`${hero}/sin-arma.webp`] : [])
    ]
  }

  function levelBackground(level) {
    if (quality.value !== 'lite') return level.fondo
    const background = level.fondo.replace('/arenas/', '/arenas/static/').replace(/-animado\.svg$/, '.webp')
    return replacements.get(background) || background
  }

  return {
    quality, introSeen, preferencesLoaded, t,
    loadPreferences, setQuality, finishIntro, imageUrl, decodeImage,
    prepareImages, levelEssentials, levelBackground
  }
}
