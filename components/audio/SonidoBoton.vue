<template>
  <div class="sonido-boton" @click="reproducirYAvisar">
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  rutaSonido: {
    type: String,
    default: '/audio/boton.mp3'
  },
  volumen: {
    type: Number,
    default: 0.4,
    validator: (valor) => valor >= 0 && valor <= 1
  }
})

const emit = defineEmits(['click'])

const reproducirYAvisar = (evento) => {
  const audioClic = new Audio(props.rutaSonido)
  audioClic.volume = props.volumen
  audioClic.play().catch((error) => {
    console.error('No se pudo reproducir el sonido del botón.', error)
  })
  emit('click', evento)
}
</script>

<style scoped>
.sonido-boton {
  display: contents;
}
</style>