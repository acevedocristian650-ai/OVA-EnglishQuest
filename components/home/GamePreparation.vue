<!--
  GamePreparation.vue - «Prepara tu aventura». Selección gráfica obligatoria tras el recorrido inicial.
  Solo dos perfiles. «Gráficos altos» llega marcado en la primera visita, pero NO se descarga nada hasta pulsar
  Continuar: entonces se preparan únicamente los recursos esenciales del perfil elegido.
-->
<template>
  <div class="preparacion" role="dialog" aria-modal="true" aria-labelledby="titulo-preparacion">
    <section class="tarjeta">
      <p class="ceja">ENGLISH QUEST</p>
      <h1 id="titulo-preparacion">{{ t('Prepara tu aventura') }}</h1>
      <p>{{ t('Este juego incluye animaciones y efectos visuales que pueden exigir recursos de tu dispositivo. Selecciona la calidad gráfica que prefieras. Podrás cambiarla posteriormente.') }}</p>

      <fieldset :disabled="cargando">
        <legend>{{ t('Calidad gráfica') }}</legend>
        <label v-for="perfil in perfiles" :key="perfil.id" class="perfil" :class="{ activo: seleccion === perfil.id }">
          <input v-model="seleccion" type="radio" name="calidad-grafica" :value="perfil.id" />
          <span><strong>{{ t(perfil.nombre) }}</strong><small>{{ t(perfil.detalle) }}</small></span>
        </label>
      </fieldset>

      <p class="carga" role="status" aria-live="polite">
        <template v-if="cargando">{{ t('Preparando recursos esenciales') }}: {{ progreso.loaded }} / {{ progreso.total }}</template>
        <template v-else-if="progreso.failed">{{ t('Algunos recursos no se pudieron preparar; se intentarán cargar al necesitarlos.') }}</template>
      </p>
      <progress v-if="cargando" :value="progreso.loaded" :max="Math.max(progreso.total, 1)" :aria-label="t('Progreso de carga')" />
      <div class="acciones">
        <v-btn ref="botonContinuar" color="amber-lighten-2" variant="flat" size="large" :disabled="cargando" autofocus @click="continuar">{{ t('Continuar') }}</v-btn>
      </div>
    </section>
  </div>
</template>

<script setup>
const { quality, introSeen, setQuality, finishIntro, prepareImages, releaseScope } = useGameGraphics()
const { language, t } = useLanguage()
const cargando = ref(false)
const progreso = ref({ loaded: 0, total: 3, failed: 0 })
// Primera visita: «Gráficos altos» marcado por defecto. Con una preferencia válida previa se respeta (nunca se sobrescribe sola).
const seleccion = ref(introSeen.value ? quality.value : 'alta')
let controlador = null
const perfiles = [
  { id: 'alta', nombre: 'Gráficos altos', detalle: 'Experiencia visual completa con los escenarios, animaciones, efectos y transformaciones originales.' },
  { id: 'lite', nombre: 'Modo Lite', detalle: 'Experiencia optimizada para dispositivos móviles y equipos de bajos recursos.' }
]

async function continuar() {
  if (cargando.value) return
  const perfil = seleccion.value
  controlador = new AbortController()
  cargando.value = true
  progreso.value = { loaded: 0, total: 3, failed: 0 }
  setQuality(perfil)
  releaseScope('menu')
  const base = [
    '/images/personajes-mate/caballero/reposo.png',
    language.value === 'en' ? '/images/mapa-del-reino-en.svg' : '/images/mapa-del-reino.svg',
    perfil === 'lite' ? '/images/arenas/static/puerta-real.webp' : '/images/arenas/puerta-real-animado.svg'
  ]
  try {
    const r = await prepareImages(base, { signal: controlador.signal, profile: perfil, ambito: 'menu', onProgress: (v) => { progreso.value = v } })
    if (r) progreso.value = r
  } catch { /* si falla la preparación, el juego sigue: los recursos se piden al necesitarlos */ }
  finishIntro()
}
onBeforeUnmount(() => controlador?.abort())
</script>

<style scoped>
.preparacion { position: fixed; inset: 0; z-index: 100000; display: grid; place-items: center; padding: 1rem; background: #07101df2; overflow-y: auto; }
.tarjeta { max-height: 100%; overflow-y: auto; width: min(100%, 560px); padding: clamp(1.1rem, 4vw, 2rem); border: 1px solid #b68a48; border-radius: 14px; background: linear-gradient(145deg, #30271f, #121a29 75%); color: #f7edda; box-shadow: 0 18px 60px #000a; }
.ceja { margin: 0; color: #e8bd71; font-weight: 800; letter-spacing: .16em; }
h1 { margin: .3rem 0 .65rem; color: #ffe09a; font: 800 clamp(1.5rem, 5vw, 2.2rem) Georgia, serif; }
.tarjeta > p:not(.ceja) { line-height: 1.5; }
fieldset { display: grid; gap: .55rem; margin: 1.1rem 0; padding: 0; border: 0; min-width: 0; }
legend { margin-bottom: .55rem; color: #ffe09a; font-weight: 800; }
.perfil { display: flex; gap: .7rem; align-items: flex-start; min-height: 48px; padding: .75rem; border: 1px solid #8f7959; border-radius: 8px; background: #ffffff0a; cursor: pointer; }
.perfil.activo { border-color: #f2c267; background: #f2c26720; }
.perfil:focus-within { outline: 3px solid #ffe09a; outline-offset: 2px; }
.perfil input { margin-top: .25rem; width: 20px; height: 20px; accent-color: #f2c267; flex: none; }
.perfil span { display: grid; gap: .15rem; }
.perfil small { color: #d3cbbb; line-height: 1.35; }
.carga { min-height: 1.5em; margin-bottom: .3rem; color: #cde5ee; font-size: .9rem; }
progress { display: block; width: 100%; height: 9px; accent-color: #e5b75f; }
.acciones { display: flex; justify-content: flex-end; margin-top: .85rem; }
</style>
