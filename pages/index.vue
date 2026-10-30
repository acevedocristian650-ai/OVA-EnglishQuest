<template>
  <MusicaHome ruta="/audio/interfazentrada.mp3"></MusicaHome>
  <HomeHero>
    <template #top>
      <HomeTitle />
    </template>

    <template #bottom>
      <HomeMenu @start="startAdventure" />
    </template>
  </HomeHero>
</template>

<script setup>


// Al pulsar COMENZAR AVENTURA vamos al mapa del reino (pages/map.vue).
// Cuando exista la selección de héroe (pages/hero.vue), aquí se cambiará la ruta.
function startAdventure() {
  navigateTo('/map')
}
</script>
