<template>
  <div class="efectos" :class="ataque.id" aria-hidden="true">
    <template v-if="ataque.magia">
      <img class="sello" src="/images/magia/sello.svg" alt="" />
      <img class="proyectil" :src="`/images/magia/${ataque.id}.svg`" alt="" />
      <img class="residuo" :src="`/images/magia/${ataque.id}.svg`" alt="" />
    </template>
    <template v-else>
      <span class="amago" />
      <img class="estela" :src="estela" alt="" />
    </template>

    <span class="luz" />
    <span class="onda" />
    <span class="onda eco" />
    <span class="polvo" />
    <span class="arrastre" />
    <span v-for="(angulo, indice) in chispas" :key="angulo" class="chispa"
      :style="{ '--angulo': `${angulo}deg`, '--distancia': `${30 + (indice % 3) * 16}px` }" />
    <span v-for="angulo in sangre" :key="angulo" class="gota" :style="{ '--angulo': `${angulo}deg` }" />
    <span v-if="dano !== null" class="cantidad dano">−{{ dano }}</span>
    <template v-if="curacion">
      <span class="restauracion" />
      <span class="cantidad curacion">+{{ curacion }}</span>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  ataque: { type: Object, required: true },
  estela: String,
  dano: { type: Number, default: null },
  curacion: { type: Number, default: 0 }
})

const chispas = [-165, -132, -104, -76, -45, -15, 18, 46, 138, 166]
const sangre = computed(() => props.ataque.sangre ? [-154, -119, -82, -53, -24, 12] : [])
</script>

<style scoped>
.efectos {
  --x: 62%;
  --y: 57%;
  --lumbre: #ffe2a0;
  --halo: #ed9c3c78;
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hachazo { --y: 69%; }
.barrido { --lumbre: #c2ecff; --halo: #62b9e680; }
.escudo { --x: 61%; --lumbre: #fff1bb; --halo: #dfa95383; }
.nivel-1.escudo { --x: 63%; }
.rayo { --x: 64%; --y: 53%; --lumbre: #d3f4ff; --halo: #4baafa92; }
.fenix { --x: 64%; --y: 55%; --lumbre: #ffdc94; --halo: #f476368b; }
.rival { --x: 34%; --y: 55%; --lumbre: #ffc3a6; --halo: #dd543b72; }
.nivel-2.rival { --y: 68%; --lumbre: #c1efd8; --halo: #68b29b88; }
.nivel-3.rival { --lumbre: #e0e0ff; --halo: #9d9dea8c; }
.nivel-4.rival { --lumbre: #ffd08e; --halo: #fa683f9a; }
/* Los efectos de contacto permanecen ocultos durante la espera. */
.estela, .residuo, .luz, .onda, .polvo, .chispa, .gota { opacity: 0; }
.estela { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; animation: corte 900ms cubic-bezier(.2, .8, .2, 1) var(--momento-impacto) both; }
.hachazo .estela { animation-name: corte-hachazo; }
.escudo .estela { animation-name: corte-escudo; }
.rival .estela { animation-name: corte-rival; }
.escudo .estela {
  inset: var(--y) auto auto var(--x);
  width: 31%;
  height: 43%;
  transform: translate(-50%, -50%);
}
.amago {
  position: absolute;
  left: 32%;
  top: 29%;
  width: 12%;
  height: 18%;
  background: radial-gradient(ellipse, var(--lumbre), var(--halo) 22%, transparent 67%);
  animation: amago var(--duracion) ease-out both;
}
.barrido .amago { top: 61%; left: 25%; }
.escudo .amago { top: auto; bottom: 8%; left: 23%; height: 8%; background: radial-gradient(ellipse, #c2ab858c, transparent 67%); }
.rival .amago { left: 59%; top: 38%; }
.sello {
  position: absolute;
  left: 14%;
  bottom: 4%;
  width: 24%;
  height: 37%;
  filter: drop-shadow(0 0 8px var(--lumbre));
  animation: invocar var(--duracion) ease-out both;
}
.fenix .sello { filter: sepia(0.7) saturate(2.5) drop-shadow(0 0 8px var(--lumbre)); }
.proyectil {
  position: absolute;
  left: 28%;
  top: 37%;
  width: 21%;
  height: 32%;
  object-fit: contain;
  filter: drop-shadow(0 0 9px var(--halo));
  animation: lanzar var(--duracion) linear both;
}
.fenix .proyectil { animation-name: volar; }
.residuo {
  position: absolute;
  left: calc(var(--x) - 11%);
  top: calc(var(--y) - 14%);
  width: 22%;
  height: 28%;
  object-fit: contain;
  animation: residuo 1.2s ease-out var(--momento-impacto) forwards;
}
.rayo .residuo { --giro-residuo: 66deg; }
.fenix .residuo { --giro-residuo: -26deg; }
.luz, .onda, .chispa, .gota, .cantidad { position: absolute; left: var(--x); top: var(--y); }
.luz {
  width: 34%;
  height: 61%;
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--lumbre) 0%, var(--halo) 31%, transparent 70%);
  animation: iluminar 560ms ease-out var(--momento-impacto) forwards;
}
.onda {
  width: clamp(35px, 9%, 90px);
  aspect-ratio: 1;
  border: 2px solid var(--lumbre);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--halo), inset 0 0 10px var(--halo);
  animation: expandir 770ms ease-out var(--momento-impacto) forwards;
}
.eco { border-width: 1px; animation-delay: calc(var(--momento-impacto) + 260ms); }
.polvo {
  position: absolute;
  left: calc(var(--x) - 14%);
  bottom: 7%;
  width: 28%;
  height: 17%;
  border-radius: 50%;
  background: radial-gradient(ellipse, #c9b38e96, transparent 68%);
  animation: polvo 850ms ease-out var(--momento-impacto) forwards;
}
.arrastre {
  position: absolute;
  left: calc(var(--x) - 8%);
  bottom: 7%;
  width: 24%;
  height: 12%;
  background: radial-gradient(ellipse, #c2ab858c, transparent 69%);
  animation: arrastre var(--duracion) ease-out both;
}
.rival .arrastre { left: calc(var(--x) - 20%); }
.chispa {
  width: 8px;
  height: 2px;
  border-radius: 50%;
  background: var(--lumbre);
  box-shadow: 0 0 7px var(--lumbre);
  animation: dispersar 670ms ease-out var(--momento-impacto) forwards;
}
.gota {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #a34245;
  animation: salpicar 650ms ease-out var(--momento-impacto) forwards;
}
.cantidad {
  color: var(--lumbre);
  font-size: clamp(1.3rem, 5vw, 2.6rem);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  paint-order: stroke fill;
  -webkit-text-stroke: 4px #1a0a08;
  text-shadow: 0 3px 8px #000;
  animation: elevar 1100ms cubic-bezier(.2, .8, .3, 1) both;
}
.curacion { left: 27%; top: 48%; color: #d5f4ae; }
.restauracion {
  position: absolute;
  inset: 22% auto 7% 12%;
  width: 24%;
  background: radial-gradient(ellipse at bottom, #def7a7a6, #95c76a3d 40%, transparent 72%);
  animation: restaurar 1s ease-out both;
}
.efectos * { animation-play-state: var(--reproduccion, running); }

@keyframes estela { from { opacity: 1; } to { opacity: 0; } }
/* La estela se "dibuja" siguiendo el movimiento del arma, se mantiene un instante y se disuelve */
@keyframes corte {
  0%   { opacity: 1; clip-path: inset(0 100% 0 0); scale: 0.94; filter: drop-shadow(0 0 0 transparent); }
  28%  { opacity: 1; clip-path: inset(0 0 0 0); scale: 1.03; filter: drop-shadow(0 0 12px var(--halo)); }
  55%  { opacity: 0.9; clip-path: inset(0 0 0 0); scale: 1.05; filter: drop-shadow(0 0 6px var(--halo)); }
  100% { opacity: 0; clip-path: inset(0 0 0 55%); scale: 1.1; translate: 3% -2%; filter: drop-shadow(0 0 0 transparent); }
}
@keyframes corte-hachazo {
  0%   { opacity: 1; clip-path: inset(0 0 100% 0); scale: 0.92; translate: 0 -4%; filter: drop-shadow(0 0 0 transparent); }
  26%  { opacity: 1; clip-path: inset(0 0 0 0); scale: 1.04; translate: 0 0; filter: drop-shadow(0 0 12px var(--halo)); }
  55%  { opacity: 0.9; clip-path: inset(0 0 0 0); scale: 1.05; filter: drop-shadow(0 0 6px var(--halo)); }
  100% { opacity: 0; clip-path: inset(55% 0 0 0); scale: 1.08; translate: 0 4%; filter: drop-shadow(0 0 0 transparent); }
}
@keyframes corte-rival {
  0%   { opacity: 1; clip-path: inset(0 0 0 100%); scale: 0.94; translate: 4% -3%; filter: drop-shadow(0 0 0 transparent); }
  26%  { opacity: 1; clip-path: inset(0 0 0 0); scale: 1.04; translate: 0 0; filter: drop-shadow(0 0 12px var(--halo)); }
  55%  { opacity: 0.9; clip-path: inset(0 0 0 0); scale: 1.05; filter: drop-shadow(0 0 6px var(--halo)); }
  100% { opacity: 0; clip-path: inset(0 55% 0 0); scale: 1.08; translate: -3% 3%; filter: drop-shadow(0 0 0 transparent); }
}
@keyframes corte-escudo {
  0%   { opacity: 1; clip-path: circle(0% at 50% 50%); scale: 0.7; filter: drop-shadow(0 0 0 transparent); }
  25%  { opacity: 1; clip-path: circle(75% at 50% 50%); scale: 1.08; filter: drop-shadow(0 0 14px var(--halo)); }
  45%  { scale: 0.98; }
  60%  { opacity: 0.9; scale: 1.03; }
  100% { opacity: 0; clip-path: circle(75% at 50% 50%); scale: 1.2; filter: drop-shadow(0 0 0 transparent); }
}
@keyframes amago { 0%, 21%, 40%, 100% { opacity: 0; transform: scale(0.5); } 34% { opacity: 0.6; transform: scale(1); } }
@keyframes invocar { 0%, 64%, 100% { opacity: 0; transform: scale(0.8); } 28%, 43% { opacity: 0.9; transform: scale(1); } }
@keyframes lanzar { 0%, 32%, 59%, 100% { opacity: 0; } 34% { opacity: 1; left: 28%; } 54% { opacity: 1; left: 53%; } 59%, 100% { left: 56%; } }
@keyframes volar { 0%, 32%, 61%, 100% { opacity: 0; } 34% { opacity: 1; left: 28%; top: 45%; } 42% { opacity: 1; top: 21%; } 54% { opacity: 1; left: 53%; top: 40%; } 61%, 100% { left: 57%; top: 43%; } }
@keyframes iluminar { from { opacity: 0.7; transform: translate(-50%, -50%) scale(0.58); } to { opacity: 0; transform: translate(-50%, -50%) scale(1.4); } }
@keyframes expandir { from { opacity: 0.72; transform: translate(-50%, -50%) scale(0.3); } to { opacity: 0; transform: translate(-50%, -50%) scale(2.2); } }
@keyframes polvo { from { opacity: 0.75; transform: scale(0.55); } to { opacity: 0; transform: scale(1.9) translateY(-15%); } }
@keyframes dispersar { from { opacity: 1; transform: rotate(var(--angulo)) translateX(4px); } to { opacity: 0; transform: rotate(var(--angulo)) translateX(var(--distancia)); } }
@keyframes salpicar { from { opacity: 0.82; transform: rotate(var(--angulo)) translateX(8px); } to { opacity: 0; transform: translateY(12px) rotate(var(--angulo)) translateX(34px); } }
@keyframes elevar {
  0%   { opacity: 0; scale: 0.3; rotate: 0deg; translate: -50% 0; }
  12%  { opacity: 1; scale: 1.6; rotate: -7deg; translate: -50% -12%; }
  26%  { scale: 1; rotate: 2deg; translate: -50% -24%; }
  72%  { opacity: 1; scale: 1; rotate: 0deg; translate: -50% -78%; }
  100% { opacity: 0; scale: 0.9; translate: -50% -115%; }
}
@keyframes restaurar { from { opacity: 0.8; transform: translateY(5%) scale(0.82); } to { opacity: 0; transform: translateY(-12%) scale(1.2); } }
@keyframes residuo { from { opacity: 0.66; transform: rotate(var(--giro-residuo)) scale(0.5); } to { opacity: 0; transform: translateY(-30%) rotate(var(--giro-residuo)) scale(1.35); } }
@keyframes arrastre { 0%, 64%, 98%, 100% { opacity: 0; transform: scale(0.65); } 75% { opacity: 0.6; transform: scale(1.2) translateY(-10%); } }

@media (prefers-reduced-motion: reduce) {
  .proyectil, .onda, .polvo, .chispa, .gota, .restauracion, .residuo, .arrastre, .luz, .amago { display: none; }
  .sello { animation-name: invocar-suave; }
  .cantidad { animation-name: estela; }
  .estela { animation-name: estela !important; clip-path: none; }
  @keyframes invocar-suave { 0%, 57%, 100% { opacity: 0; } 24%, 38% { opacity: 0.55; } }
}
</style>
