<!--
  HomeTitle.vue - TÍTULO DE LA PORTADA

  Nombre del juego en dorado, una línea de adorno y el subtítulo.
  No recibe nada de fuera: es una pieza fija de la portada.

  Animación:
    · cada palabra entra con desenfoque y subida, una tras otra
    · un destello de luz cruza el oro cada pocos segundos
    · el resplandor del título respira despacio
    · el adorno se abre desde el rombo y el subtítulo se "asienta"
  Todo respeta prefers-reduced-motion.
-->

<template>
  <header class="home-title">
    <h1 class="home-title__nombre">
      <span class="palabra" style="--y: 0%; --retraso: 0.2s">English</span>
      <span class="palabra" style="--y: 100%; --retraso: 0.45s">Quest</span>
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
  /* Sombra y resplandor (con filter porque el texto es transparente) */
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 12px rgba(240, 180, 60, 0.16));
  animation: resplandor 4.5s ease-in-out 1.6s infinite alternate;
}

/* Cada palabra lleva su propio degradado: --y reparte el mismo oro entre las dos líneas
   (la primera usa la mitad de arriba y la segunda la de abajo), más una franja de brillo. */
.palabra {
  align-self: flex-start;
  background-image:
    linear-gradient(105deg, transparent 42%, rgba(255, 251, 224, 0.85) 50%, transparent 58%),
    linear-gradient(#fff3b8, #f0b43c 55%, #b9741a);
  background-size: 300% 100%, 100% 200%;
  background-position: 80% 0, 0 var(--y);
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation:
    aparecer 1s cubic-bezier(0.2, 0.8, 0.2, 1) var(--retraso) both,
    destello 7s ease-in-out calc(var(--retraso) + 2.2s) infinite;
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
  transform-origin: right center;
  animation: abrir 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.95s both;
}

.linea:first-child {
  background: linear-gradient(to left, #f0b43c, rgba(240, 180, 60, 0));
  transform-origin: left center;
}

.rombo {
  animation:
    brotar 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) 0.85s both,
    brillar 2.8s ease-in-out 1.6s infinite alternate;
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
  animation: asentar 1.3s cubic-bezier(0.2, 0.8, 0.2, 1) 1.2s both;
}

@keyframes aparecer {
  from { opacity: 0; transform: translateY(26px) scale(0.96); filter: blur(10px); }
  to   { opacity: 1; transform: none; filter: blur(0); }
}
/* Franja de luz que cruza el título de derecha a izquierda del degradado (de izquierda a derecha en pantalla) */
@keyframes destello {
  0%, 12%   { background-position: 80% 0, 0 var(--y); }
  42%, 100% { background-position: 20% 0, 0 var(--y); }
}
@keyframes resplandor {
  from { filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 8px rgba(240, 180, 60, 0.1)); }
  to   { filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 22px rgba(240, 180, 60, 0.38)); }
}
@keyframes abrir {
  from { transform: scaleX(0); opacity: 0; }
  to   { transform: scaleX(1); opacity: 1; }
}
@keyframes brotar {
  from { opacity: 0; transform: scale(0) rotate(-90deg); }
  to   { opacity: 1; transform: none; }
}
@keyframes brillar {
  from { text-shadow: 0 0 0 transparent; transform: scale(1); }
  to   { text-shadow: 0 0 10px #ffc247; transform: scale(1.25); }
}
@keyframes asentar {
  from { opacity: 0; letter-spacing: 0.5em; }
  to   { opacity: 1; letter-spacing: 0.26em; }
}

@media (prefers-reduced-motion: reduce) {
  .home-title__nombre, .palabra, .linea, .rombo, .home-title__subtitulo { animation: none; }
}
</style>
