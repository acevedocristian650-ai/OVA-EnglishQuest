<template>
  <div v-if="activo && nivel" class="encuentro-pantalla" aria-live="assertive" :aria-label="`Enfrentamiento contra ${nivel.guardian}`">
    <!-- Barras cinemáticas letterbox -->
    <div class="letterbox barra-superior" />
    <div class="letterbox barra-inferior" />

    <!-- Fondo de duelo medieval auténtico generado -->
    <div class="fondo-versus-arte">
      <div class="vignette-sombra" />
      <div class="particulas-brasas">
        <span v-for="b in brasas" :key="b.id" class="brasa" :style="b.estilo" />
      </div>
    </div>

    <!-- Escena central de luchadores -->
    <div class="duelo-escena">
      <!-- Lado del Caballero -->
      <div class="luchador-bloque bloque-caballero">
        <div class="avatar-wrap">
          <img src="/images/personajes-mate/caballero/reposo.png" alt="Caballero del Sol" class="avatar-luchador avatar-caballero" />
        </div>
        <div class="cinta-contenedor">
          <img src="/images/transiciones/cinta-nombre.png" alt="" class="cinta-bg" draggable="false" />
          <div class="cinta-texto">
            <span class="sub-rol">Héroe</span>
            <h3 class="nombre-luchador">Caballero del Sol</h3>
          </div>
        </div>
      </div>

      <!-- Emblema VS central auténtico -->
      <div class="emblema-vs-wrap">
        <div class="aura-dorada" />
        <img src="/images/transiciones/emblema-vs.png" alt="Versus" class="emblema-vs-img" draggable="false" />
      </div>

      <!-- Lado del Guardián -->
      <div class="luchador-bloque bloque-guardian">
        <div class="avatar-wrap">
          <img :src="`${nivel.arte}/reposo.png`" :alt="nivel.guardian" class="avatar-luchador avatar-guardian" />
        </div>
        <div class="cinta-contenedor">
          <img src="/images/transiciones/cinta-nombre.png" alt="" class="cinta-bg" draggable="false" />
          <div class="cinta-texto">
            <span class="sub-rol">Guardián de la Zona</span>
            <h3 class="nombre-luchador">{{ nivel.guardian }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Banner inferior: Zona y Desafío -->
    <div class="banner-zona">
      <span class="etiqueta-zona">ZONA {{ nivel.numero }}</span>
      <h2 class="titulo-zona">{{ nivel.nombre }}</h2>
      <p class="tema-desafio">Misión: <strong lang="en">{{ nivel.tema }}</strong></p>
    </div>

    <!-- Flash final de choque de combate -->
    <div class="flash-corte" />
  </div>
</template>

<script setup>
const props = defineProps({
  activo: {
    type: Boolean,
    default: false
  },
  nivel: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['listo'])

// Brasas flotantes ambientales para el fondo de duelo
const brasas = Array.from({ length: 16 }, (_, i) => {
  const left = 5 + ((i * 37) % 90)
  const dur = 2.4 + ((i % 4) * 0.4)
  const delay = (i * 0.06).toFixed(2)
  const size = 3 + (i % 4)
  return {
    id: i,
    estilo: {
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      '--dur': `${dur}s`,
      '--delay': `${delay}s`
    }
  }
})

let timer = null
watch(
  () => props.activo,
  (val) => {
    if (val) {
      if (timer) clearTimeout(timer)
      // Duración: 2 segundos cinemáticos
      timer = setTimeout(() => {
        emit('listo')
      }, 2000)
    }
  }
)

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.encuentro-pantalla {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  contain: strict;
}

/* Barras cinemáticas letterbox */
.letterbox {
  position: absolute;
  left: 0;
  right: 0;
  height: 8vh;
  background: #000;
  z-index: 30;
  will-change: transform;
}
.barra-superior {
  top: 0;
  animation: entrar-barra-sup 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.barra-inferior {
  bottom: 0;
  animation: entrar-barra-inf 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes entrar-barra-sup {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
@keyframes entrar-barra-inf {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Fondo con imagen de duelo real */
.fondo-versus-arte {
  position: absolute;
  inset: 0;
  background-image: url('/images/transiciones/fondo-versus.jpg');
  background-size: cover;
  background-position: center;
  z-index: 1;
  will-change: transform, opacity;
  animation: zoom-fondo 2.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes zoom-fondo {
  0% { transform: scale(1.06); opacity: 0.75; }
  35% { opacity: 0.95; }
  100% { transform: scale(1); opacity: 0.9; }
}

.vignette-sombra {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(10, 14, 25, 0.2) 20%, rgba(6, 9, 18, 0.85) 90%);
}

/* Brasas flotantes */
.particulas-brasas {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.brasa {
  position: absolute;
  bottom: 10%;
  border-radius: 50%;
  background: radial-gradient(circle, #fff3b0 20%, #ff9800 80%, transparent 100%);
  box-shadow: 0 0 8px #ff9800;
  opacity: 0;
  animation: flotar-brasa var(--dur) ease-out infinite;
  animation-delay: var(--delay);
}

@keyframes flotar-brasa {
  0% { opacity: 0; transform: translateY(0) scale(0.6); }
  25% { opacity: 0.9; }
  85% { opacity: 0.7; }
  100% { opacity: 0; transform: translateY(-40vh) scale(1.2); }
}

/* Escena de los dos luchadores */
.duelo-escena {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1200px;
  height: 65vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 3vw;
}

.luchador-bloque {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 38%;
  will-change: transform, opacity;
}

.bloque-caballero {
  animation: entrar-caballero 0.75s cubic-bezier(0.2, 0.85, 0.3, 1) forwards;
}

.bloque-guardian {
  animation: entrar-guardian 0.75s cubic-bezier(0.2, 0.85, 0.3, 1) 0.08s forwards;
  opacity: 0;
}

@keyframes entrar-caballero {
  0% {
    opacity: 0;
    transform: translateX(-150px) scale(0.88);
  }
  60% {
    opacity: 1;
    transform: translateX(8px) scale(1.02);
  }
  82% {
    transform: translateX(-3px) scale(0.99);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes entrar-guardian {
  0% {
    opacity: 0;
    transform: translateX(150px) scale(0.88);
  }
  60% {
    opacity: 1;
    transform: translateX(-8px) scale(1.02);
  }
  82% {
    transform: translateX(3px) scale(0.99);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.avatar-wrap {
  position: relative;
  width: min(280px, 34vw);
  height: min(280px, 34vw);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-luchador {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.avatar-caballero {
  filter: drop-shadow(0 0 16px rgba(112, 214, 255, 0.5));
}

.avatar-guardian {
  filter: drop-shadow(0 0 16px rgba(255, 140, 50, 0.55));
}

/* Cinta de pergamino para el nombre */
.cinta-contenedor {
  position: relative;
  width: min(290px, 36vw);
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -12px;
}

.cinta-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));
}

.cinta-texto {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 16px;
  transform: translateY(-2px);
}

.sub-rol {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #5c3a1e;
  font-weight: 700;
  margin-bottom: -2px;
}

.nombre-luchador {
  margin: 0;
  font-family: 'Cinzel', Georgia, serif;
  font-size: clamp(0.9rem, 1.8vw, 1.25rem);
  color: #2b180d;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

/* Emblema VS central */
.emblema-vs-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(200px, 24vw);
  height: min(200px, 24vw);
  z-index: 15;
  animation: impacto-emblema 0.8s cubic-bezier(0.2, 0.85, 0.32, 1.2) forwards;
}

@keyframes impacto-emblema {
  0% {
    opacity: 0;
    transform: scale(2.8) rotate(-16deg);
  }
  50% {
    opacity: 1;
    transform: scale(0.9) rotate(4deg);
  }
  70% {
    transform: scale(1.06) rotate(-2deg);
  }
  85% {
    transform: scale(0.98) rotate(1deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.aura-dorada {
  position: absolute;
  width: 130%;
  height: 130%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.45) 0%, rgba(245, 166, 35, 0.2) 40%, transparent 70%);
  animation: pulso-vs 1.1s ease-in-out infinite alternate;
}

@keyframes pulso-vs {
  from { transform: scale(0.9); opacity: 0.6; }
  to { transform: scale(1.15); opacity: 0.95; }
}

.emblema-vs-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.75));
}

/* Banner inferior: Zona y Tema */
.banner-zona {
  position: absolute;
  bottom: 9vh;
  z-index: 25;
  text-align: center;
  animation: subir-banner 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

@keyframes subir-banner {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.etiqueta-zona {
  font-family: 'Cinzel', Georgia, serif;
  font-size: 0.82rem;
  letter-spacing: 0.35em;
  color: #ffd54f;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
}

.titulo-zona {
  margin: 2px 0 4px;
  font-family: 'Cinzel', Georgia, serif;
  font-size: clamp(1.4rem, 3.2vw, 2.3rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(255, 215, 0, 0.6);
}

.tema-desafio {
  margin: 0;
  font-size: 0.92rem;
  color: #eceff1;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

.tema-desafio strong {
  color: #81d4fa;
}

/* Flash de corte hacia el combate: entrada y disolución suave */
.flash-corte {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, #ffffff 25%, #ffe082 65%, #e65100 100%);
  z-index: 40;
  opacity: 0;
  pointer-events: none;
  animation: corte-final 2s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

@keyframes corte-final {
  0%, 65% { opacity: 0; }
  78% { opacity: 0.2; }
  88% { opacity: 0.65; }
  96% { opacity: 0.95; }
  100% { opacity: 1; }
}

@media (max-width: 600px) {
  .duelo-escena {
    flex-direction: column;
    height: auto;
    gap: 8px;
  }
  .luchador-bloque {
    width: 85%;
  }
  .emblema-vs-wrap {
    width: 90px;
    height: 90px;
  }
  .cinta-contenedor {
    height: 52px;
  }
}
</style>
