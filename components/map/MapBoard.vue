<template>
  <nav class="mapa" aria-label="Zonas del reino">
    <img class="ilustracion" src="/images/mapa-del-reino.svg" alt="" />
    <MapZone
      v-for="nivel in niveles"
      :key="nivel.numero"
      :class="`zona-${nivel.numero}`"
      :nivel="nivel"
      :estado="estadoDe(nivel.numero)"
      @elegir="emit('elegir', $event)"
    />
  </nav>
</template>

<script setup>
const props = defineProps({
  niveles: { type: Array, required: true },
  nivelDesbloqueado: { type: Number, required: true }
})

const emit = defineEmits(['elegir'])

function estadoDe(numero) {
  if (numero < props.nivelDesbloqueado) return 'completada'
  if (numero === props.nivelDesbloqueado) return 'disponible'
  return 'bloqueada'
}
</script>

<style scoped>
.mapa {
  position: relative;
  border: 1px solid #be9348;
  border-radius: 18px;
  overflow: hidden;
  background: #101c32;
  box-shadow: 0 12px 35px #0009;
}

.ilustracion {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1000 / 640;
}

.zona-1 { left: 21%; top: 72%; }
.zona-2 { left: 55%; top: 57%; }
.zona-3 { left: 81%; top: 63%; }
.zona-4 { left: 75%; top: 35%; }
</style>
