<template>
  <MusicaHome></MusicaHome>
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
import MusicaHome from '../components/home/MusicaHome.vue';

// Al pulsar COMENZAR AVENTURA vamos al mapa del reino (pages/map.vue).
// Cuando exista la selección de héroe (pages/hero.vue), aquí se cambiará la ruta.
function startAdventure() {
  navigateTo('/map')
}
</script>
