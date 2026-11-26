<!--
  AjustesGraficos.vue - Selector de calidad gráfica (solo «Gráficos altos» y «Modo Lite»).
  No mezcla accesibilidad. Con la prop «diferido» (batalla) no aplica el cambio: lo emite para que el combate lo
  aplique en un momento seguro, y muestra el aviso de «cambio pendiente».
-->
<template>
  <fieldset class="graficos">
    <legend class="sr-only">{{ t('Calidad gráfica') }}</legend>
    <label v-for="perfil in perfiles" :key="perfil.id" class="perfil" :class="{ activo: elegido === perfil.id }">
      <input type="radio" name="calidad-grafica-ajustes" :value="perfil.id" :checked="elegido === perfil.id" @change="elegir(perfil.id)" />
      <span><strong>{{ t(perfil.nombre) }}</strong><small>{{ t(perfil.detalle) }}</small></span>
    </label>
    <p v-if="pendiente" class="pendiente" role="status">{{ t('Cambio pendiente: se aplicará en el próximo momento seguro del combate, sin perder tu progreso.') }}</p>
    <p v-else-if="preparando" class="pendiente" role="status">{{ t('Preparando los recursos del nuevo perfil…') }}</p>
    <p v-if="error" class="error" role="alert">{{ t('No se pudo preparar el nuevo perfil. Se conserva el anterior.') }}</p>
  </fieldset>
</template>

<script setup>
const props = defineProps({ diferido: Boolean, pendiente: { type: String, default: null }, preparando: Boolean, error: Boolean })
const emit = defineEmits(['elegir'])
const { t } = useLanguage()
const { quality, setQuality } = useGameGraphics()
const perfiles = [
  { id: 'alta', nombre: 'Gráficos altos', detalle: 'Experiencia visual completa con los escenarios, animaciones, efectos y transformaciones originales.' },
  { id: 'lite', nombre: 'Modo Lite', detalle: 'Experiencia optimizada para dispositivos móviles y equipos de bajos recursos.' }
]
// Mientras hay un cambio pendiente se marca el perfil solicitado; si no, el perfil activo.
const elegido = computed(() => props.pendiente ?? quality.value)
function elegir(id) {
  if (props.diferido) emit('elegir', id)
  else { setQuality(id); emit('elegir', id) }
}
</script>

<style scoped>
.graficos { display: grid; gap: .55rem; margin: 0; padding: 0; border: 0; min-width: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.perfil { display: flex; gap: .7rem; align-items: flex-start; min-height: 48px; padding: .75rem; border: 1px solid #8f7959; border-radius: 8px; background: #ffffff0a; cursor: pointer; }
.perfil.activo { border-color: #f2c267; background: #f2c26720; }
.perfil:focus-within { outline: 3px solid #ffe09a; outline-offset: 2px; }
.perfil input { margin-top: .25rem; width: 20px; height: 20px; accent-color: #f2c267; flex: none; }
.perfil span { display: grid; gap: .15rem; }
.perfil small { color: #d3cbbb; line-height: 1.35; font-size: .88rem; }
.pendiente { margin: 0; padding: .5rem .65rem; border: 1px solid #b3955c; border-radius: 6px; background: #1b2635; color: #ffe09a; font-size: .9rem; }
.error { margin: 0; color: #ffb4a8; font-size: .9rem; }
</style>
