<template>
  <aside class="diag" aria-hidden="true">
    <button type="button" class="diag-t" @click="visible = !visible">{{ visible ? '▾' : '▸' }} {{ fps }} fps</button>
    <dl v-if="visible">
      <dt>Fotograma</dt><dd>{{ medio }} ms (máx {{ maximo }})</dd>
      <dt>Lentos &gt;50 ms</dt><dd>{{ lentos }}</dd>
      <dt>Tareas largas</dt><dd>{{ largas === null ? 'no disponible' : largas + ' (' + largasMs + ' ms)' }}</dd>
      <dt>Perfil</dt><dd>{{ quality }}</dd>
      <dt>Recursos en caché</dt><dd>{{ stats.entradas }} · {{ mb(stats.memoriaTeorica) }} MB teóricos</dd>
      <dt>Presupuesto / visibles</dt><dd>{{ mb(stats.presupuesto) }} MB · {{ stats.visibles }} visibles · excesos {{ stats.excesos }} · omitidas {{ stats.omitidas }}</dd>
      <dt>Descartadas/canceladas</dt><dd>{{ stats.descartadas }}/{{ stats.canceladas }}</dd>
      <dt>Descargas/fallos/liberadas</dt><dd>{{ stats.descargas }}/{{ stats.fallos }}/{{ stats.liberadas }}</dd>
      <dt>Precarga</dt><dd>{{ preparacion.loaded }}/{{ preparacion.total }} (fallos {{ preparacion.failed }}) {{ stats.pendientes ? '· en curso' : '' }}</dd>
      <dt>Memoria JS</dt><dd>{{ memoria }}</dd>
      <dt>Recomendación</dt><dd>{{ recomendacion ?? 'ninguna' }}</dd>
    </dl>
  </aside>
</template>

<script setup>
// Solo en desarrollo. Un único bucle de fotogramas acumula contadores; la pantalla se actualiza una vez por segundo.
const { quality, qualityMode, assets, preparacion, recomendacion } = useGameGraphics()
const visible = ref(false)
const fps = ref(0); const medio = ref(0); const maximo = ref(0); const lentos = ref(0)
const largas = ref(typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask') ? 0 : null)
const largasMs = ref(0)
const memoria = ref('no disponible')
const stats = ref(assets.instantanea())
const mb = (n) => (n / 1048576).toFixed(1)
let cuadro = 0, previo = 0, n = 0, suma = 0, max = 0, lento = 0, temporizador = 0, observador = null

function bucle(t) {
  cuadro = requestAnimationFrame(bucle)
  if (previo) { const d = t - previo; n++; suma += d; if (d > max) max = d; if (d > 50) lento++ }
  previo = t
}
onMounted(() => {
  cuadro = requestAnimationFrame(bucle)
  try {
    observador = new PerformanceObserver((l) => { for (const e of l.getEntries()) { largas.value++; largasMs.value += Math.round(e.duration) } })
    observador.observe({ type: 'longtask' })
  } catch { /* no soportado */ }
  temporizador = setInterval(() => {
    if (n) { fps.value = Math.round(1000 / (suma / n)); medio.value = (suma / n).toFixed(1); maximo.value = Math.round(max); lentos.value += lento }
    n = suma = max = lento = 0
    stats.value = assets.instantanea()
    const m = performance.memory
    memoria.value = m ? `${(m.usedJSHeapSize / 1048576).toFixed(0)} / ${(m.jsHeapSizeLimit / 1048576).toFixed(0)} MB` : 'no disponible'
  }, 1000)
})
onBeforeUnmount(() => { cancelAnimationFrame(cuadro); clearInterval(temporizador); observador?.disconnect() })
</script>

<style scoped>
.diag { position: fixed; z-index: 99999; left: 4px; bottom: 4px; font: 11px/1.3 monospace; color: #cfe; background: #000c; border-radius: 4px; padding: 2px 6px; max-width: 290px; pointer-events: none; }
.diag-t { pointer-events: auto; color: inherit; font: inherit; background: none; border: 0; cursor: pointer; }
dl { margin: 2px 0 0; display: grid; grid-template-columns: auto 1fr; gap: 0 8px; }
dt { color: #8ab; } dd { margin: 0; }
</style>
