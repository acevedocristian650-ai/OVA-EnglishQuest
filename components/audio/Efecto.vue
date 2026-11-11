<template>
  <span hidden aria-hidden="true" />
</template>

<script setup>
// Reproduce un efecto de sonido cada vez que cambia «disparo».
// Cambiar «ruta» y aumentar «disparo» a la vez hace sonar el nuevo archivo.
const props = defineProps({
  ruta: { type: String, default: '' },
  disparo: { type: Number, default: 0 },
  volumen: { type: Number, default: 0.85, validator: (valor) => valor >= 0 && valor <= 1 }
})

const sonando = new Set()

watch(() => props.disparo, () => {
  if (!props.ruta) return
  const audio = new Audio(props.ruta)
  audio.volume = props.volumen
  sonando.add(audio)
  audio.addEventListener('ended', () => sonando.delete(audio), { once: true })
  audio.play().catch(() => sonando.delete(audio))
})

onBeforeUnmount(() => {
  sonando.forEach((audio) => audio.pause())
  sonando.clear()
})
</script>
