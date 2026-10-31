<!--
  HomeTitle.vue - TÍTULO DE LA PORTADA

  Nombre del juego en dorado, una línea de adorno y el subtítulo.
  No recibe nada de fuera: es una pieza fija de la portada.
-->

<template>
  <header class="home-title">
    <h1 class="home-title__nombre">
      <span>English</span>
      <span>Quest</span>
    </h1>

    <!-- Adorno: línea - rombo - línea -->
    <div class="home-title__adorno" aria-hidden="true">
      <span class="linea" />
      <span class="rombo">◆</span>
      <span class="linea" />
    </div>

    <p class="home-title__subtitulo">The Kingdom of Knowledge</p>
  </header>
</template>

<style scoped>
.home-title__nombre {
  display: flex;
  flex-direction: column;
  font-family: 'Cinzel Decorative', 'Cinzel', 'Palatino Linotype', Georgia, serif;
  font-weight: 900;
  font-size: clamp(2.6rem, 4.6vw, 5.2rem);
  line-height: 0.95;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  /* Letras con degradado dorado */
  background: linear-gradient(#fff3b8, #f0b43c 55%, #b9741a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* Sombra (con filter porque el texto es transparente) */
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.85));
}

.home-title__adorno {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  margin: 16px 0 10px;
  color: #f0b43c;
}

.linea {
  flex: 1;
  height: 3px;
  background: linear-gradient(to right, #f0b43c, rgba(240, 180, 60, 0));
}

.linea:first-child {
  background: linear-gradient(to left, #f0b43c, rgba(240, 180, 60, 0));
}

.home-title__subtitulo {
  margin: 0;
  font-family: 'Cinzel', 'Palatino Linotype', Georgia, serif;
  font-weight: 700;
  font-size: clamp(0.8rem, 1.3vw, 1.1rem);
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: #e8dcc0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
}
</style>
