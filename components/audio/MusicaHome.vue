<template>
  <div>
   <div style="display: none;"></div>
  </div>
</template>

<script setup>
// 1. Definir una propiedad que recibirá la ruta del audio
const props = defineProps({
  ruta: {
    type: String,
    required: true
  }
})

const audio = ref(null)

const iniciarMusica = () => {
  if (audio.value && audio.value.paused) {
    audio.value.play().catch(() => {})
  }
}

onMounted(() => {
  // 2. Usar la propiedad dinámica en lugar de la ruta estática
  audio.value = new Audio(props.ruta)
  audio.value.loop = true
  audio.value.volume = 0.5 

  audio.value.play().catch(() => {
    document.addEventListener('click', iniciarMusica, { once: true })
  })
})

onUnmounted(() => {
  if (audio.value) {
    audio.value.pause()
    audio.value.currentTime = 0
  }
  document.removeEventListener('click', iniciarMusica)
})
</script>

<style>

</style>