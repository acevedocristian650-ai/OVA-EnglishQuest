<!-- Fila de fichas de una oración. Al cambiar sujeto, forma o tiempo las fichas se mueven, aparecen o desaparecen,
     de modo que se VE qué parte de la oración cambia. El movimiento lo anula el ajuste global de movimiento reducido. -->
<template>
  <TransitionGroup tag="p" name="ficha" class="fichas" lang="en" :aria-label="etiqueta" aria-live="polite">
    <span v-for="f in fichas" :key="f.k" class="ficha" :class="[f.rol, { mal: f.mal }]">{{ f.txt }}</span>
  </TransitionGroup>
</template>

<script setup>
defineProps({ fichas: { type: Array, required: true }, etiqueta: { type: String, default: '' } })
</script>

<style scoped>
.fichas { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 48px; margin: 0; padding: 8px; border-radius: 10px; background: #0d1320; border: 1px dashed #5b4a2e; }
.ficha { display: inline-block; padding: 6px 10px; border-radius: 8px; border: 1px solid; font: 700 clamp(0.95rem, 3.6vw, 1.2rem)/1.2 Georgia, serif; background: #1a2232; color: #fff0cc; }
.suj { border-color: #6fa8ff; color: #cfe3ff; }
.be { border-color: #ffd36b; color: #ffe9a8; }
.nucleo { border-color: #c79bff; color: #ecd9ff; }
.neg { border-color: #ff7a6b; color: #ffd2cc; }
.verbo { border-color: #7fe0a6; color: #d3f7e2; }
.tiempo { border-color: #6fd6d6; color: #d0f4f4; }
.mal { background: #3a1616; border-color: #ff5a4d; color: #ffd2cc; text-decoration: underline wavy #ff5a4d; }
.ficha-move, .ficha-enter-active, .ficha-leave-active { transition: all 0.35s ease; }
.ficha-enter-from, .ficha-leave-to { opacity: 0; transform: translateY(-10px) scale(0.9); }
.ficha-leave-active { position: absolute; }
</style>
