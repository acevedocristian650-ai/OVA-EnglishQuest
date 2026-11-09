<template>
  <div v-if="activo" class="portal-transicion" aria-live="polite" aria-label="Entrando al reino">
    <!-- Telón de fondo cinemático -->
    <div class="telon-base" />

    <!-- Barras cinemáticas letterbox estilo película -->
    <div class="letterbox barra-superior" />
    <div class="letterbox barra-inferior" />

    <!-- Onda expansiva inicial -->
    <div class="onda-choque" />

    <!-- Túnel de velocidad 3D (GPU puro: solo transform3d) -->
    <div class="lineas-warp">
      <span v-for="n in 18" :key="`rayo-${n}`" class="rayo" :style="estiloRayo(n)" />
    </div>

    <!-- Vórtice Dimensional Principal -->
    <div class="vortice-camara">
      <!-- Resplandor central pre-renderizado (sin blur dinámico) -->
      <div class="disco-aura disco-cyan" />
      <div class="disco-aura disco-oro" />

      <!-- Espiral y Anillos Rúnicos en SVG puro acelerado -->
      <svg class="sello-vortice" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="gradOro" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff5c0" />
            <stop offset="50%" stop-color="#f5a623" />
            <stop offset="100%" stop-color="#40a9ff" />
          </linearGradient>
          <radialGradient id="gradNucleo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="45%" stop-color="#70d6ff" />
            <stop offset="85%" stop-color="#f5a623" />
            <stop offset="100%" stop-color="#0b1325" />
          </radialGradient>
        </defs>

        <!-- Anillo exterior con muescas -->
        <circle cx="200" cy="200" r="175" fill="none" stroke="url(#gradOro)" stroke-width="2.5" stroke-dasharray="14 10" opacity="0.8" />
        
        <!-- Brazos de espiral / vórtice -->
        <g class="espiral-brazos">
          <path d="M 200,200 Q 240,140 320,150 Q 250,220 200,200 Z" fill="url(#gradOro)" opacity="0.35" />
          <path d="M 200,200 Q 160,260 80,250 Q 150,180 200,200 Z" fill="url(#gradOro)" opacity="0.35" />
          <path d="M 200,200 Q 260,240 250,320 Q 180,250 200,200 Z" fill="url(#gradOro)" opacity="0.35" />
          <path d="M 200,200 Q 140,160 150,80 Q 220,150 200,200 Z" fill="url(#gradOro)" opacity="0.35" />
        </g>

        <!-- Estrella octagrama mística -->
        <g class="octagrama">
          <polygon points="200,50 245,155 350,200 245,245 200,350 155,245 50,200 155,155"
            fill="none" stroke="#ffe082" stroke-width="2" opacity="0.75" />
          <polygon points="200,75 290,110 325,200 290,290 200,325 110,290 75,200 110,110"
            fill="none" stroke="#80d8ff" stroke-width="1.5" opacity="0.55" />
        </g>

        <!-- Núcleo central -->
        <circle cx="200" cy="200" r="72" fill="url(#gradNucleo)" />
        <circle cx="200" cy="200" r="40" fill="#ffffff" opacity="0.9" />
      </svg>

      <!-- Héroe saltando/sumergiéndose hacia el vórtice (como en The Hunt) -->
      <div class="heroe-inmersion">
        <img src="/images/personajes-mate/caballero/anticipacion.webp" alt="Caballero entrando al portal" class="caballero-salto" />
      </div>
    </div>

    <!-- Título cinemático centrado -->
    <div class="mensaje-cinematico">
      <p class="subtitulo">English Quest</p>
      <h2 class="titulo-viaje">Entrando al Reino</h2>
    </div>

    <!-- Flash blanco-dorado de transición final -->
    <div class="flash-final" />
  </div>
</template>

<script setup>
const props = defineProps({
  activo: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['completo'])

// Rayos de velocidad optimizados: transform puro acelerado por GPU
function estiloRayo(i) {
  const angulo = (i / 18) * 360
  const retraso = (i % 6) * 0.08
  return {
    '--ang': `${angulo}deg`,
    '--ret': `${retraso}s`
  }
}

let timer = null
watch(
  () => props.activo,
  (val) => {
    if (val) {
      if (timer) clearTimeout(timer)
      // Duración: 2 segundos exactos y fluidos
      timer = setTimeout(() => {
        emit('completo')
      }, 2000)
    }
  }
)

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.portal-transicion {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: all;
  user-select: none;
  contain: strict;
}

/* Telón de fondo con fundido suave */
.telon-base {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(14, 21, 40, 0.85) 0%, #060913 80%);
  animation: fundir-telon 0.5s ease-out forwards;
}

@keyframes fundir-telon {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Barras cinemáticas letterbox */
.letterbox {
  position: absolute;
  left: 0;
  right: 0;
  height: 9vh;
  background: #000;
  z-index: 20;
  will-change: transform;
}

.barra-superior {
  top: 0;
  transform: translateY(-100%);
  animation: entrar-barra-sup 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.barra-inferior {
  bottom: 0;
  transform: translateY(100%);
  animation: entrar-barra-inf 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes entrar-barra-sup {
  to { transform: translateY(0); }
}

@keyframes entrar-barra-inf {
  to { transform: translateY(0); }
}

/* Onda de choque rápida que expande desde el centro */
.onda-choque {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #ffe57f;
  box-shadow: 0 0 25px #ffd700;
  opacity: 0;
  will-change: transform, opacity;
  animation: expandir-choque 1.1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
  animation-delay: 0.15s;
}

@keyframes expandir-choque {
  0% {
    opacity: 1;
    transform: scale(0.2);
  }
  70% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: scale(14);
  }
}

/* Rayos warp radiales */
.lineas-warp {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.rayo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 48vh;
  background: linear-gradient(to top, transparent, #ffe082 40%, #ffffff 100%);
  transform-origin: center top;
  will-change: transform, opacity;
  opacity: 0;
  animation: viaje-rayo 1.3s cubic-bezier(0.1, 0.85, 0.2, 1) forwards;
  animation-delay: var(--ret);
}

@keyframes viaje-rayo {
  0% {
    opacity: 0;
    transform: rotate(var(--ang)) translateY(30px) scaleY(0.2);
  }
  30% {
    opacity: 0.95;
  }
  85% {
    opacity: 1;
    transform: rotate(var(--ang)) translateY(180px) scaleY(2.2);
  }
  100% {
    opacity: 0;
    transform: rotate(var(--ang)) translateY(360px) scaleY(3.2);
  }
}

/* Vórtice Central con Cámara acelerando suavemente hacia adelante */
.vortice-camara {
  position: relative;
  width: min(75vw, 460px);
  height: min(75vw, 460px);
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform, opacity;
  animation: inmersion-camara 2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes inmersion-camara {
  0% {
    transform: scale(0.3) rotate(-20deg);
    opacity: 0;
  }
  20% {
    transform: scale(0.85) rotate(10deg);
    opacity: 1;
  }
  65% {
    transform: scale(1.15) rotate(70deg);
    opacity: 1;
  }
  85% {
    transform: scale(2.4) rotate(135deg);
    opacity: 0.95;
  }
  100% {
    transform: scale(5) rotate(200deg);
    opacity: 0.9;
  }
}

/* Auras pre-renderizadas con gradientes sin filtros pesados */
.disco-aura {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.disco-cyan {
  width: 140%;
  height: 140%;
  background: radial-gradient(circle, rgba(112, 214, 255, 0.4) 0%, rgba(14, 21, 40, 0) 65%);
}

.disco-oro {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, rgba(245, 166, 35, 0.15) 50%, rgba(0, 0, 0, 0) 70%);
}

/* Sello vectorial */
.sello-vortice {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.espiral-brazos {
  transform-origin: 200px 200px;
  animation: girar-vortice 4s linear infinite;
}

.octagrama {
  transform-origin: 200px 200px;
  animation: girar-vortice 6s linear infinite reverse;
}

@keyframes girar-vortice {
  to { transform: rotate(360deg); }
}

/* El héroe cayendo / saltando al vórtice estilo The Hunt */
.heroe-inmersion {
  position: absolute;
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
  will-change: transform, opacity;
  animation: salto-heroe-vortice 1.9s cubic-bezier(0.2, 0.7, 0.15, 1) forwards;
}

.caballero-salto {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.9));
}

@keyframes salto-heroe-vortice {
  0% {
    transform: translate(-130px, 80px) scale(1.5) rotate(-12deg);
    opacity: 0;
  }
  22% {
    transform: translate(-60px, 35px) scale(1.25) rotate(-4deg);
    opacity: 1;
  }
  55% {
    transform: translate(0px, 5px) scale(0.9) rotate(20deg);
    opacity: 1;
  }
  80% {
    transform: translate(0px, 0px) scale(0.35) rotate(75deg);
    opacity: 0.9;
  }
  95% {
    transform: translate(0px, 0px) scale(0.08) rotate(140deg);
    opacity: 0.3;
  }
  100% {
    transform: translate(0px, 0px) scale(0.01) rotate(180deg);
    opacity: 0;
  }
}

/* Texto Cinemático */
.mensaje-cinematico {
  position: absolute;
  bottom: 12vh;
  text-align: center;
  z-index: 25;
  pointer-events: none;
  animation: aparicion-texto 2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.subtitulo {
  font-family: 'Cinzel', Georgia, serif;
  font-size: 0.85rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #80d8ff;
  margin-bottom: 4px;
}

.titulo-viaje {
  font-family: 'Cinzel', Georgia, serif;
  font-size: clamp(1.4rem, 3.5vw, 2.3rem);
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #fff8e1;
  text-shadow: 0 0 16px rgba(255, 215, 0, 0.7);
  margin: 0;
}

@keyframes aparicion-texto {
  0% { opacity: 0; transform: translateY(14px) scale(0.97); }
  22% { opacity: 1; transform: translateY(0) scale(1); }
  72% { opacity: 1; transform: translateY(0) scale(1); }
  92% { opacity: 0.4; transform: translateY(-4px) scale(1.02); }
  100% { opacity: 0; transform: translateY(-8px) scale(1.04); }
}

/* Flash de impacto final: fundido sutil y envolvente */
.flash-final {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, #ffffff 25%, #ffe082 70%, #f5a623 100%);
  opacity: 0;
  pointer-events: none;
  z-index: 30;
  will-change: opacity;
  animation: flash-blanco 2s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

@keyframes flash-blanco {
  0%, 62% { opacity: 0; }
  78% { opacity: 0.25; }
  88% { opacity: 0.7; }
  96% { opacity: 0.95; }
  100% { opacity: 1; }
}
</style>
