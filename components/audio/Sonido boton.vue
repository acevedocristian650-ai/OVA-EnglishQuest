<template>
  <div>
  
  </div>
</template>

<script setup>
const props = defineProps({
  rutaSonido: {
    type: String,
    default: 'public/audio/boton.mp3' // Sonido por defecto si no le pasas otro
  }
})

// Emitir el evento de clic para que el botón siga funcionando normalmente
const emit = defineEmits(['click'])

const reproducirYAvisar = (evento) => {
  // 1. Crea y reproduce el sonido al instante
  const audioClic = new Audio(props.rutaSonido)
  audioClic.volume = 0.8
  audioClic.play().catch(() => {})

  // 2. Ejecuta la acción original del botón
  emit('click', evento)
}

</script>

<style>

</style>