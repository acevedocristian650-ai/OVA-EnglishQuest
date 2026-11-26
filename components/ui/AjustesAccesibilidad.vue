<!-- AjustesAccesibilidad.vue - Preferencias de accesibilidad (independientes de la calidad gráfica). -->
<template>
  <div class="acc">
    <div class="ajuste">
      <label for="ajuste-texto">{{ t('Tamaño del texto') }}</label>
      <select id="ajuste-texto" :value="ajustes.textoEscala" @change="cambiar({ textoEscala: Number($event.target.value) })">
        <option :value="1">{{ t('Normal') }}</option><option :value="1.15">{{ t('Grande') }}</option><option :value="1.3">{{ t('Muy grande') }}</option>
      </select>
    </div>
    <div class="ajuste">
      <label for="ajuste-movimiento">{{ t('Movimiento') }}</label>
      <select id="ajuste-movimiento" :value="ajustes.movimiento" @change="cambiar({ movimiento: $event.target.value })">
        <option value="sistema">{{ t('Según el sistema') }}</option><option value="reducido">{{ t('Reducido') }}</option><option value="completo">{{ t('Completo') }}</option>
      </select>
    </div>
    <div class="ajuste">
      <label for="ajuste-tiempo">{{ t('Tiempo en las actividades') }}</label>
      <select id="ajuste-tiempo" :value="ajustes.tiempoExtra" :disabled="ajustes.practica" @change="cambiar({ tiempoExtra: Number($event.target.value) })">
        <option :value="1">{{ t('Normal') }}</option><option :value="1.5">{{ t('Ampliado ×1,5') }}</option><option :value="2">{{ t('Ampliado ×2') }}</option>
      </select>
    </div>
    <label class="marca"><input type="checkbox" :checked="ajustes.practica" @change="cambiar({ practica: $event.target.checked })"> {{ t('Modo de práctica: sin límite de tiempo (no suma estrellas ni experiencia)') }}</label>
    <label class="marca"><input type="checkbox" :checked="ajustes.altoContraste" @change="cambiar({ altoContraste: $event.target.checked })"> {{ t('Alto contraste') }}</label>
    <label class="marca"><input type="checkbox" :checked="ajustes.sinDestellos" @change="cambiar({ sinDestellos: $event.target.checked })"> {{ t('Reducir destellos intensos') }}</label>
    <label class="marca"><input type="checkbox" :checked="ajustes.sinCamara" @change="cambiar({ sinCamara: $event.target.checked })"> {{ t('Sin movimientos de cámara') }}</label>
  </div>
</template>

<script setup>
const { t } = useLanguage()
const store = usePlayerProgress()
const ajustes = computed(() => store.estado.ajustes)
const cambiar = (cambios) => store.ajustar(cambios)
</script>

<style scoped>
.ajuste { display: flex; align-items: center; justify-content: space-between; gap: .75rem; min-height: 44px; }
.ajuste select { min-height: 44px; padding: 0 .5rem; color: #fff; background: #2b1d14; border: 1px solid #b3955c; border-radius: 6px; }
.marca { display: flex; align-items: flex-start; gap: .6rem; min-height: 44px; padding: .35rem 0; cursor: pointer; line-height: 1.3; }
.marca input { width: 22px; height: 22px; margin-top: 1px; accent-color: #f2d28c; flex: none; }
</style>
