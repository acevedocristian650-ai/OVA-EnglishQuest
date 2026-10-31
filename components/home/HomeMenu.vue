<!--
  HomeMenu.vue - MENÚ DE LA PORTADA (botones en vertical)

  Solo dibuja los tres botones (BaseBoton), sueltos sobre la escena, sin caja.
  Las ventanas ("Cómo jugar" y "Opciones") son componentes aparte:
  HomeHowToPlay y HomeOptions.

  Evento: start -> el jugador pulsó "Comenzar aventura"
-->

<template>
  <div>
    <nav class="home-menu" aria-label="Menú principal">
      <BaseBoton variante="principal" @click="emit('start')">Comenzar aventura</BaseBoton>
      <BaseBoton @click="showHowToPlay = true">Cómo jugar</BaseBoton>
      <BaseBoton @click="showOptions = true">Opciones</BaseBoton>
    </nav>

    <!-- Las ventanas se abren o cierran con v-model -->
    <HomeHowToPlay v-model="showHowToPlay" />
    <HomeOptions v-model="showOptions" />
  </div>
</template>

<script setup>
// Aviso que este componente envía a la página
const emit = defineEmits(["start"]);

// ¿Qué ventana está abierta?
const showHowToPlay = ref(false);
const showOptions = ref(false);
</script>

<style scoped>
.home-menu {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 440px;
}
</style>
