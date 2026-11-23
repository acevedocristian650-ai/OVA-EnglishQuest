<template>
  <div v-if="open" class="preparacion" role="dialog" aria-modal="true" :aria-label="t('Preparación del juego')">
    <section class="tarjeta">
      <p class="ceja">ENGLISH QUEST</p>
      <h1>{{ t('Prepara tu aventura') }}</h1>
      <p>{{ t('El juego incluye animaciones y efectos visuales que pueden exigir recursos del dispositivo. Puedes cambiar esta opción después.') }}</p>

      <fieldset>
        <legend>{{ t('Calidad gráfica') }}</legend>
        <label v-for="perfil in perfiles" :key="perfil.id" class="perfil">
          <input v-model="seleccion" type="radio" name="calidad-grafica" :value="perfil.id" />
          <span><strong>{{ t(perfil.nombre) }}</strong><small>{{ t(perfil.detalle) }}</small></span>
        </label>
      </fieldset>

      <p class="carga" role="status" aria-live="polite">
        <template v-if="cargando">{{ t('Preparando recursos esenciales') }}: {{ progreso.loaded }} / {{ progreso.total }}</template>
        <template v-else-if="progreso.failed">{{ t('Algunos recursos no se pudieron preparar; se intentarán cargar al necesitarlos.') }}</template>
        <template v-else>{{ t('Recursos esenciales listos') }}</template>
      </p>
      <progress v-if="cargando" :value="progreso.loaded" :max="Math.max(progreso.total, 1)" :aria-label="t('Progreso de carga')" />
      <div class="acciones">
        <v-btn color="amber-lighten-2" variant="flat" :disabled="cargando" @click="continuar(false)">{{ t('Continuar') }}</v-btn>
        <v-btn color="amber-lighten-2" variant="text" @click="continuar(true)">{{ t('Saltar introducción') }}</v-btn>
      </div>
    </section>
  </div>
</template>

<script setup>
const emit = defineEmits(['skip-intro'])
const { quality, introSeen, loadPreferences, setQuality, finishIntro, prepareImages } = useGameGraphics()
const { language, t } = useLanguage()
const open = ref(false)
const cargando = ref(true)
const progreso = ref({ loaded: 0, total: 3, failed: 0 })
const seleccion = ref('equilibrada')
let controlador
const perfiles = [
  { id: 'alta', nombre: 'Gráficos altos', detalle: 'Animaciones, filtros y efectos visuales completos.' },
  { id: 'equilibrada', nombre: 'Gráficos equilibrados', detalle: 'Reduce efectos secundarios y conserva las animaciones principales.' },
  { id: 'lite', nombre: 'Modo Lite', detalle: 'Fondos estáticos y efectos simplificados para priorizar fluidez.' }
]

onMounted(() => {
  loadPreferences()
  seleccion.value = quality.value
  open.value = !introSeen.value
  if (!open.value) {
    cargando.value = false
    return
  }
})

watch([open, seleccion, language], async ([visible, profile], _, onCleanup) => {
  if (!visible) return
  const controller = new AbortController()
  controlador = controller
  onCleanup(() => controller.abort())
  cargando.value = true
  progreso.value = { loaded: 0, total: 3, failed: 0 }
  const base = [
    '/images/personajes-mate/caballero/reposo.png',
    language.value === 'en' ? '/images/mapa-del-reino-en.svg' : '/images/mapa-del-reino.svg',
    profile === 'lite' ? '/images/arenas/static/puerta-real.webp' : '/images/arenas/puerta-real-animado.svg'
  ]
  const resultado = await prepareImages(base, { signal: controller.signal, profile, onProgress: (value) => { progreso.value = value } })
  if (controller.signal.aborted) return
  progreso.value = resultado
  cargando.value = false
})

onBeforeUnmount(() => controlador?.abort())

function continuar(saltar) {
  controlador?.abort()
  setQuality(seleccion.value)
  finishIntro()
  open.value = false
  if (saltar) emit('skip-intro')
}
</script>

<style scoped>
.preparacion { position: fixed; inset: 0; z-index: 100000; display: grid; place-items: center; padding: 1rem; background: #07101deF; }
.tarjeta { max-height: 100%; overflow-y: auto; width: min(100%, 560px); padding: clamp(1.1rem, 4vw, 2rem); border: 1px solid #b68a48; border-radius: 14px; background: linear-gradient(145deg, #30271f, #121a29 75%); color: #f7edda; box-shadow: 0 18px 60px #000a; }
.ceja { margin: 0; color: #e8bd71; font-weight: 800; letter-spacing: .16em; }
h1 { margin: .3rem 0 .65rem; color: #ffe09a; font: 800 clamp(1.5rem, 5vw, 2.2rem) Georgia, serif; }
.tarjeta > p:not(.ceja) { line-height: 1.5; }
fieldset { display: grid; gap: .55rem; margin: 1.1rem 0; padding: 0; border: 0; }
legend { margin-bottom: .55rem; color: #ffe09a; font-weight: 800; }
.perfil { display: flex; gap: .7rem; align-items: flex-start; padding: .75rem; border: 1px solid #8f7959; border-radius: 8px; background: #ffffff0a; cursor: pointer; }
.perfil input { margin-top: .25rem; accent-color: #f2c267; }
.perfil span { display: grid; gap: .15rem; }
.perfil small { color: #d3cbbb; line-height: 1.35; }
.carga { min-height: 1.5em; margin-bottom: .3rem; color: #cde5ee; font-size: .9rem; }
progress { display: block; width: 100%; height: 9px; accent-color: #e5b75f; }
.acciones { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .4rem; margin-top: .85rem; }
</style>
