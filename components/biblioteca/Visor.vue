<!--
  Visor.vue - Visor de UN recurso externo. Solo existe mientras el estudiante lo tiene abierto (el padre lo monta con
  v-if): al cerrarlo se desmonta el iframe, lo que detiene la reproducción, y se limpian el temporizador y los eventos.
  Si el sitio no se puede incrustar (o tarda demasiado, o no hay conexión) se ofrece el enlace original.
  No se intenta evadir X-Frame-Options ni CSP.
-->
<template>
  <section class="visor" :aria-label="recurso.titulo">
    <div class="barra">
      <strong>{{ recurso.titulo }}</strong>
      <button type="button" class="cerrar" :aria-label="t('Cerrar recurso')" @click="emit('cerrar')">✕ {{ t('Cerrar') }}</button>
    </div>
    <div v-if="sinConexion" class="aviso" role="alert">{{ t('No hay conexión a internet. El contenido propio del OVA y las batallas siguen funcionando.') }}</div>
    <div v-else class="marco" :class="{ video: Boolean(recurso.youtube) }">
      <iframe v-if="src" :src="src" :title="recurso.titulo" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
        :allow="recurso.youtube ? 'encrypted-media; picture-in-picture; fullscreen' : ''" :allowfullscreen="Boolean(recurso.youtube)"
        :sandbox="recurso.youtube ? undefined : 'allow-scripts allow-same-origin allow-popups allow-forms'" @load="cargado = true" />
      <p v-if="!cargado && !lento" class="estado" role="status">{{ t('Cargando recurso…') }}</p>
      <p v-if="!cargado && lento" class="estado" role="alert">{{ t('El recurso tarda en cargar o su sitio no permite mostrarlo aquí. Ábrelo en una pestaña nueva.') }}</p>
    </div>
    <a class="enlace" :href="recurso.url" target="_blank" rel="noopener noreferrer">{{ t('Abrir el recurso original (pestaña nueva)') }} ↗</a>
  </section>
</template>

<script setup>
const props = defineProps({ recurso: { type: Object, required: true } })
const emit = defineEmits(['cerrar'])
const { t } = useLanguage()
const cargado = ref(false)
const lento = ref(false)
const sinConexion = ref(false)
let temporizador = 0
const src = computed(() => props.recurso.youtube
  ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(props.recurso.youtube)}?rel=0&playsinline=1`
  : props.recurso.url)

onMounted(() => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { sinConexion.value = true; return }
  temporizador = window.setTimeout(() => { if (!cargado.value) lento.value = true }, 12000)
})
onBeforeUnmount(() => { clearTimeout(temporizador) })
</script>

<style scoped>
.visor { display: grid; gap: .5rem; padding: .6rem; border: 1px solid #b3955c; border-radius: 10px; background: #0f1623; }
.barra { display: flex; align-items: center; justify-content: space-between; gap: .5rem; color: #ffe09a; font-size: .95rem; }
.cerrar { min-height: 44px; padding: 0 .8rem; color: #ffe09a; background: transparent; border: 1px solid #b3955c; border-radius: 8px; cursor: pointer; flex: none; }
.cerrar:focus-visible, .enlace:focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }
.marco { position: relative; min-height: 220px; background: #05080f; border-radius: 6px; overflow: hidden; }
.marco.video { aspect-ratio: 16 / 9; min-height: 0; }
iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #fff; }
.marco:not(.video) iframe { position: static; height: 360px; }
.estado, .aviso { margin: 0; padding: .6rem; color: #f1e8d3; font-size: .9rem; }
.estado { position: absolute; left: 0; right: 0; bottom: 0; background: #0f1623ee; }
.enlace { color: #9fd0ff; font-size: .9rem; min-height: 44px; display: inline-flex; align-items: center; }
</style>
