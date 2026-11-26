<template>
  <span hidden aria-hidden="true" />
</template>

<script setup>
// Reproduce un efecto de sonido cada vez que cambia «disparo».
// Cambiar «ruta» y aumentar «disparo» a la vez hace sonar el nuevo archivo.
// Los elementos de audio se reutilizan y el volumen respeta el canal elegido (efectos o voces).
const props = defineProps({
  ruta: { type: String, default: '' },
  disparo: { type: Number, default: 0 },
  volumen: { type: Number, default: 0.85, validator: (valor) => valor >= 0 && valor <= 1 },
  canal: { type: String, default: 'efectos' }
})
const propios = new Set()

watch(() => props.disparo, () => {
  if (!props.ruta) return
  const e = reproducirEfecto(props.ruta, { volumen: props.volumen, canal: props.canal })
  if (e) {
    propios.add(e)
    e.fin.then(() => propios.delete(e))
  }
})

onBeforeUnmount(() => {
  propios.forEach((e) => e.detener())
  propios.clear()
})
</script>
