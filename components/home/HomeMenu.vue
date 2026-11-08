<!--
  HomeMenu.vue - MENÚ DE LA PORTADA (botones en vertical)

  Solo dibuja los tres botones (BaseBoton), sueltos sobre la escena, sin caja.
  Las ventanas ("Cómo jugar" y "Opciones") son componentes aparte:
  HomeHowToPlay y HomeOptions.

  Los botones entran uno tras otro deslizándose desde la izquierda.
  (AudioSonidoBoton usa display: contents, por eso cada uno va en su propio contenedor.)

  Evento: start -> el jugador pulsó "Comenzar aventura"
-->

<template>
  <div>
    <nav class="home-menu" aria-label="Menú principal">
      <div class="home-menu__item" style="--i: 0">
        <AudioSonidoBoton @click="emit('start')">
          <BaseBoton variante="principal">Comenzar aventura</BaseBoton>
        </AudioSonidoBoton>
      </div>
      <div class="home-menu__item" style="--i: 1">
        <AudioSonidoBoton @click="showHowToPlay = true">
          <BaseBoton>Cómo jugar</BaseBoton>
        </AudioSonidoBoton>
      </div>
      <div class="home-menu__item" style="--i: 2">
        <AudioSonidoBoton @click="showOptions = true">
          <BaseBoton>Opciones</BaseBoton>
        </AudioSonidoBoton>
      </div>
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

.home-menu__item {
  animation: entrar-item 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) calc(1.3s + var(--i) * 0.15s) both;
}

@keyframes entrar-item {
  from { opacity: 0; transform: translateX(-36px); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .home-menu__item { animation: none; }
}
</style>
