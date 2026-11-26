<template>
  <div class="efectos-lite" :class="[ataque.id, { rival: esRival }]" aria-hidden="true">
    <!-- Proyectil / señal de ataque: un solo elemento animado con transform y opacity -->
    <img v-if="ataque.magia" class="proyectil" :src="`/images/magia/${ataque.id}.svg`" alt="" draggable="false" />
    <img v-else-if="esRival && nivel === 3" class="relampago" :src="imageUrl('/images/jefes/viento/relampago-tormenta.png')" alt="" draggable="false" />
    <span v-else-if="esRival && nivel === 1" class="bola-lite" />
    <img v-else-if="estela" class="estela" :src="estela" alt="" draggable="false" />
    <span class="onda-lite" />
    <span v-if="dano !== null" class="cantidad dano">−{{ dano }}</span>
    <span v-if="curacion" class="cantidad curacion">+{{ curacion }}</span>
  </div>
</template>

<script setup>
const { imageUrl } = useGameGraphics()
const props = defineProps({
  ataque: { type: Object, required: true },
  estela: String,
  nivel: { type: Number, default: 0 },
  dano: { type: Number, default: null },
  curacion: { type: Number, default: 0 }
})
const esRival = computed(() => props.ataque.id === 'rival')
</script>

<style scoped>
.efectos-lite { position: absolute; inset: 0; z-index: 3; pointer-events: none; container-type: size; --desde: 27%; --recorrido: 46; --alto-efecto: 52%; }
.efectos-lite.rival { --desde: 73%; --recorrido: -46; }
.proyectil, .bola-lite, .estela, .relampago, .onda-lite { position: absolute; top: var(--alto-efecto); left: var(--desde); translate: -50% -50%; opacity: 0; will-change: transform, opacity; }
.proyectil { width: 16%; animation: lite-recorrido var(--momento-impacto) ease-in both; }
.bola-lite { width: 9%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff 6%, #ffb347 48%, #c2410c 90%); animation: lite-recorrido var(--momento-impacto) ease-in both; }
.estela { width: 38%; top: 50%; left: 62%; animation: lite-corte calc(var(--duracion) * 0.4) ease-out calc(var(--momento-impacto) - var(--duracion) * 0.12) both; }
.relampago { width: 22%; top: 40%; left: 27%; animation: lite-corte calc(var(--duracion) * 0.3) ease-out calc(var(--momento-impacto) - 120ms) both; }
.onda-lite { left: 62%; width: 14%; aspect-ratio: 1; border: 4px solid #fff3cf; border-radius: 50%; animation: lite-onda 420ms ease-out var(--momento-impacto) both; }
.rival .onda-lite { left: 28%; border-color: #ffc7b0; }
.rival .estela { left: 28%; }
.cantidad { position: absolute; top: 40%; left: 62%; translate: -50% -50%; color: #ffe6b5; font-size: clamp(1.3rem, 5vw, 2.6rem); font-weight: 900; font-variant-numeric: tabular-nums; -webkit-text-stroke: 4px #1a0a08; paint-order: stroke fill; animation: lite-cifra 1000ms ease-out both; }
.rival .cantidad { left: 28%; color: #ffb09e; }
.cantidad.curacion { color: #a8ffcf; left: 28%; top: 28%; }
@keyframes lite-recorrido {
  0% { opacity: 0; transform: translateX(0); }
  15% { opacity: 1; }
  100% { opacity: 1; transform: translateX(calc(var(--recorrido) * 1cqw)); }
}
@keyframes lite-corte { 0% { opacity: 0; scale: .7; } 30% { opacity: 1; scale: 1; } 100% { opacity: 0; scale: 1.05; } }
@keyframes lite-onda { 0% { opacity: .9; scale: .3; } 100% { opacity: 0; scale: 2.2; } }
@keyframes lite-cifra { 0% { opacity: 0; transform: translateY(8px); } 15% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-34px); } }
</style>
