<template>
  <div class="sonido-boton" @click="reproducirYAvisar">
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  rutaSonido: { type: String, default: '/audio/boton.mp3' },
  volumen: { type: Number, default: 0.4, validator: (valor) => valor >= 0 && valor <= 1 }
})
const emit = defineEmits(['click'])

// Reutiliza el mismo elemento de audio entre pulsaciones (no crea uno nuevo por cada botón).
const reproducirYAvisar = (evento) => {
  reproducirEfecto(props.rutaSonido, { volumen: props.volumen })
  emit('click', evento)
}
</script>

<style scoped>
.sonido-boton { display: contents; }
</style>
