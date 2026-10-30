<template>
  <div>
   <div style="display: none;"></div>
  </div>
</template>

<script setup>
const audio = ref(null)

const iniciarMusica = () => {
  if (audio.value && audio.value.paused) {
    audio.value.play().catch(() => {})
  }
}

onMounted(() => {
  // En Nuxt, los archivos de la carpeta public se acceden desde la raíz '/'
  audio.value = new Audio('/audio/interfazentrada.mp3')
  audio.value.loop = true
  audio.value.volume = 0.5 // Ajusta de 0.0 a 1.0

  // Intenta reproducir automáticamente al cargar la página
  audio.value.play().catch(() => {
    // Si el navegador bloquea el autoplay, se iniciará con el primer clic que el usuario haga en la pantalla
    document.addEventListener('click', iniciarMusica, { once: true })
  })
})

// Cuando cambies de página, el componente se destruye y la música se apaga
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