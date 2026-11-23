<template>
  <div :class="{ 'iniciando-viaje': viajando }">
    <HomeGamePreparation @skip-intro="navigateTo('/map')" />
    <AudioMusicaHome v-if="introSeen" ruta="/audio/interfazentrada.mp3" />
    <HomeHero v-if="introSeen">
      <template #title>
        <HomeTitle />
      </template>

      <template #menu>
        <HomeMenu @start="startAdventure" />
      </template>
    </HomeHero>

    <!-- Transición cinemática de inmersión / portal hacia el mapa -->
    <HomePortalTransicion :activo="viajando" @completo="llegarAlMapa" />
  </div>
</template>

<script setup>
const { introSeen } = useGameGraphics()
const viajando = ref(false)

// Al pulsar COMENZAR AVENTURA activamos la animación de inmersión / portal
function startAdventure() {
  if (viajando.value) return
  viajando.value = true
}

// Cuando la animación del portal culmina en el destello, navegamos al mapa
function llegarAlMapa() {
  navigateTo('/map')
}
</script>

<style scoped>
.iniciando-viaje {
  transition: transform 1.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 1.8s ease;
  transform: scale(1.06);
  opacity: 0.85;
  will-change: transform, opacity;
}
</style>
