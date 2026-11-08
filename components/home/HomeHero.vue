<!--
  HomeHero.vue - MARCO DE LA PORTADA (v2: héroe integrado en la escena)

  IZQUIERDA -> título (slot #title) y menú (slot #menu)
  CENTRO    -> el héroe

  Cambios frente a la v1:
    · sin filtro de pintura/posterizado (era lo que lo hacía ver manchado y pixelado)
    · iluminación recortada a su silueta: sombra fría a la izquierda, luz de farol cálida
      a la derecha y oclusión oscura hacia los pies, para que "pertenezca" a la escena
    · corrección de color de atardecer (menos brillante y saturado)
    · neblina baja que cruza por delante de sus pies + sombra de contacto en el suelo
    · algo más pequeño, para dar profundidad frente a la puerta
    · se conserva: respiración, destello en el hacha, brasas y entrada con fundido
-->

<template>
  <v-img src="/images/arenas/puerta-real-animado.svg" alt="Puerta del reino al atardecer" height="100vh" position="50% 60%"
    cover gradient="to right, rgba(8, 10, 18, 0.88), rgba(8, 10, 18, 0.5) 38%, rgba(8, 10, 18, 0.08) 68%">
    <v-container fluid class="fill-height px-6 px-md-12">
      <v-row class="fill-height" align="center">
        <v-col cols="12" md="4" align-self="center">
          <slot name="title" />
          <div class="mt-8 mt-md-12">
            <slot name="menu" />
          </div>
        </v-col>

        <v-col cols="12" md="3" align-self="end" class="d-none d-md-block">
          <div class="escena-heroe">
            <span class="aura" />
            <span class="sombra" />

            <div class="cuerpo">
              <img class="heroe" src="/images/personajes-mate/caballero/reposo.png" alt="Caballero del sol" />
              <!-- Luces recortadas a la silueta del héroe -->
              <span class="luz fria" />
              <span class="luz calida" />
              <span class="luz suelo" />
              <span class="destello" />
            </div>

            <span class="niebla uno" />
            <span class="niebla dos" />

            <span v-for="b in brasas" :key="b.id" class="brasa"
              :style="{ '--x': `${b.x}%`, '--t': `${b.t}s`, '--d': `${b.d}s`, '--dx': `${b.dx}px`, '--s': b.s }" />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-img>
</template>

<script setup>
// Posiciones fijas (no aleatorias en render) para evitar desajustes de hidratación en Nuxt
const brasas = [
  { id: 1, x: 8,  t: 7,   d: 0,   dx: 18,  s: 1 },
  { id: 2, x: 24, t: 9,   d: 2.2, dx: -14, s: 0.7 },
  { id: 3, x: 42, t: 8,   d: 4.1, dx: 22,  s: 1.1 },
  { id: 4, x: 60, t: 10,  d: 1.1, dx: -20, s: 0.8 },
  { id: 5, x: 76, t: 7.5, d: 5.3, dx: 12,  s: 1 },
  { id: 6, x: 90, t: 9.5, d: 3.2, dx: -10, s: 0.6 },
  { id: 7, x: 52, t: 11,  d: 6.4, dx: 16,  s: 0.9 }
]
</script>

<style scoped>
/* Cuadrado del mismo tamaño que la imagen (512x512) para que los % coincidan con el arte */
.escena-heroe {
  position: relative;
  height: 64vh;
  aspect-ratio: 1;
  margin-bottom: 6vh;
  animation: entrada 1.1s cubic-bezier(.2, .8, .2, 1) both;
}

.cuerpo {
  position: absolute;
  inset: 0;
  transform-origin: 50% 96%;
  animation: respirar 4.2s ease-in-out infinite;
}
.heroe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Corrección de color: atardecer apagado, menos brillo y saturación */
  filter: brightness(0.94) saturate(0.92) contrast(1.05) sepia(0.1);
}

/* Capas de luz: cada una usa la silueta del héroe como máscara y se mezcla solo con él */
.luz {
  position: absolute;
  inset: 0;
  pointer-events: none;
  -webkit-mask: url('/images/personajes-mate/caballero/reposo.png') center / contain no-repeat;
  mask: url('/images/personajes-mate/caballero/reposo.png') center / contain no-repeat;
}
.fria {
  background: linear-gradient(to right, #0b1030aa 0%, #1a1f4a55 36%, transparent 66%);
  mix-blend-mode: multiply;
}
.calida {
  background: linear-gradient(to left, #ffa84fcc 0%, #ff8a3c55 30%, transparent 62%);
  mix-blend-mode: soft-light;
}
.suelo {
  background: linear-gradient(to top, #120d14b3 0%, #120d1466 18%, transparent 42%);
  mix-blend-mode: multiply;
}

/* Aura sutil detrás del caballero */
.aura {
  position: absolute;
  left: 14%; top: 24%;
  width: 70%; height: 66%;
  border-radius: 50%;
  background: radial-gradient(ellipse, #ffb85a30 0%, #e0803428 40%, transparent 70%);
  mix-blend-mode: screen;
  animation: latir 4.2s ease-in-out infinite;
}

/* Sombra de contacto bajo los pies (los pies ocupan ~18%–74% del ancho) */
.sombra {
  position: absolute;
  left: 12%; bottom: 1%;
  width: 72%; height: 8%;
  border-radius: 50%;
  background: radial-gradient(ellipse, #07070af2 0%, #07070aa6 40%, transparent 72%);
  animation: sombra 4.2s ease-in-out infinite;
}

/* Neblina baja que pasa por delante de los pies */
.niebla {
  position: absolute;
  left: -25%;
  width: 150%;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 60%, #a49eae40 0%, #8f8a9a22 45%, transparent 72%);
  filter: blur(6px);
}
.niebla.uno { bottom: -3%; height: 14%; animation: deriva 14s ease-in-out infinite alternate; }
.niebla.dos { bottom: 1%; height: 10%; opacity: 0.55; animation: deriva 19s ease-in-out -6s infinite alternate-reverse; }

/* Brillo que barre la hoja del hacha (posición aprox. sobre el arte 512x512) */
.destello {
  position: absolute;
  left: 71%; top: 43%;
  width: 7%; aspect-ratio: 1;
  background:
    linear-gradient(90deg, transparent 40%, #fff7df 50%, transparent 60%),
    linear-gradient(0deg, transparent 40%, #fff7df 50%, transparent 60%);
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  filter: drop-shadow(0 0 6px #fff1bb);
  opacity: 0;
  animation: destello 6s ease-in-out 2s infinite;
}

/* Brasas que suben */
.brasa {
  position: absolute;
  left: var(--x);
  bottom: 12%;
  width: calc(5px * var(--s));
  height: calc(5px * var(--s));
  border-radius: 50%;
  background: radial-gradient(circle, #fff0b8, #ffa84a 55%, transparent 72%);
  box-shadow: 0 0 8px #ffa84acc;
  opacity: 0;
  animation: brasa var(--t) ease-out var(--d) infinite;
}

@keyframes entrada {
  from { opacity: 0; transform: translateY(18px) scale(.98); }
  to   { opacity: 1; transform: none; }
}
@keyframes respirar {
  0%, 100% { transform: translateY(0) scale(1, 1) rotate(0deg); }
  50%      { transform: translateY(-0.5%) scale(1.01, 1.016) rotate(-0.3deg); }
}
@keyframes latir {
  0%, 100% { opacity: .55; transform: scale(.97); }
  50%      { opacity: .95; transform: scale(1.04); }
}
@keyframes sombra {
  0%, 100% { transform: scaleX(1); opacity: .95; }
  50%      { transform: scaleX(.95); opacity: .78; }
}
@keyframes deriva {
  from { transform: translateX(-6%); }
  to   { transform: translateX(6%); }
}
@keyframes destello {
  0%, 62%, 100% { opacity: 0; transform: scale(.2) rotate(0deg); }
  70%           { opacity: 1; transform: scale(1.1) rotate(45deg); }
  80%           { opacity: 0; transform: scale(.4) rotate(90deg); }
}
@keyframes brasa {
  0%   { opacity: 0; transform: translate(0, 0) scale(1); }
  12%  { opacity: .95; }
  70%  { opacity: .6; }
  100% { opacity: 0; transform: translate(var(--dx), -42vh) scale(.3); }
}

@media (prefers-reduced-motion: reduce) {
  .escena-heroe, .cuerpo, .aura, .sombra, .niebla, .destello, .brasa { animation: none; }
  .brasa { display: none; }
}
</style>
