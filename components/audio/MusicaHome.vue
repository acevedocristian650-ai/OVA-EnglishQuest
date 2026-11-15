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
  },
  volumen: {
    type: Number,
    default: 0.5
  }
})

const audio = ref(null)
const audioEnPrimerPlano = useState('audio-en-primer-plano', () => false)

const iniciarMusica = () => {
  if (audio.value && audio.value.paused && !audioEnPrimerPlano.value) {
    audio.value.play().catch(() => {})
  }
}

watch(audioEnPrimerPlano, (reproducirVoz) => {
  if (!audio.value) return
  if (reproducirVoz) audio.value.pause()
  else iniciarMusica()
})

onMounted(() => {
  // 2. Usar la propiedad dinámica en lugar de la ruta estática
  audio.value = new Audio(props.ruta)
  audio.value.loop = true
  audio.value.volume = props.volumen

  if (!audioEnPrimerPlano.value) {
    audio.value.play().catch(() => {
      document.addEventListener('click', iniciarMusica, { once: true })
    })
  }
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
