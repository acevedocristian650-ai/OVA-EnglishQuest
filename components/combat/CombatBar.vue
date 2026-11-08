<!--
  CombatBar.vue - barra de vida con "daño fantasma"

  Mantiene las mismas props que antes (valor, maximo, color, etiqueta), así que
  CombatDesafio.vue no necesita cambios. Añade:
    · segmento claro que se queda un instante y se vacía despacio (muestra cuánto quitó el golpe)
    · sacudida + destello al perder vida, destello verde al curarse
    · la barra verde pasa a ámbar y a rojo según baja la vida
    · pulso de peligro por debajo del 25 %
    · brillo que cruza la barra de vez en cuando
-->
<template>
  <div class="barra" :class="{ baja: porcentaje <= 25 && porcentaje > 0, golpe: golpeando, cura: curando }">
    <v-progress-linear :model-value="porcentaje" :color="colorActual" :aria-label="etiqueta" rounded height="8" />
    <span class="fantasma" :style="{ left: `${porcentaje}%`, width: `${Math.max(0, fantasma - porcentaje)}%` }" />
    <span class="brillo" />
  </div>
</template>

<script setup>
const props = defineProps({
  valor: { type: Number, required: true },
  maximo: { type: Number, default: 100 },
  color: { type: String, required: true },
  etiqueta: { type: String, required: true }
})

const porcentaje = computed(() => props.valor / props.maximo * 100)
const fantasma = ref(porcentaje.value)
const golpeando = ref(false)
const curando = ref(false)

// La barra verde (caballero) cambia de color con la vida; la roja del rival se mantiene
const colorActual = computed(() => {
  if (!props.color.startsWith('green')) return props.color
  if (porcentaje.value > 50) return props.color
  return porcentaje.value > 25 ? 'amber-darken-2' : 'red-darken-2'
})

let temporizadores = []
const luego = (ms, fn) => temporizadores.push(setTimeout(fn, ms))

watch(porcentaje, (nuevo, anterior) => {
  temporizadores.forEach(clearTimeout)
  temporizadores = []
  if (nuevo < anterior) {
    golpeando.value = true
    luego(380, () => { golpeando.value = false })
    luego(600, () => { fantasma.value = nuevo })   // el segmento claro espera y luego se vacía
  } else {
    fantasma.value = nuevo
    curando.value = true
    luego(600, () => { curando.value = false })
  }
})

onBeforeUnmount(() => temporizadores.forEach(clearTimeout))
</script>

<style scoped>
.barra { position: relative; width: 100%; border-radius: 99px; }

.fantasma {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: 0 99px 99px 0;
  background: linear-gradient(180deg, #fff0c4, #f0b24a);
  transition: left 0.2s linear, width 0.5s ease-out;
}

/* Brillo que recorre la barra */
.brillo { position: absolute; inset: 0; z-index: 2; overflow: hidden; border-radius: 99px; pointer-events: none; }
.brillo::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  left: -40%;
  width: 30%;
  background: linear-gradient(100deg, transparent, #ffffff55, transparent);
  animation: brillo 5s ease-in-out 1s infinite;
}

.golpe { animation: golpe-barra 0.38s ease-out; }
.cura { animation: cura-barra 0.6s ease-out; }
.baja { animation: peligro 0.9s ease-in-out infinite alternate; }
.golpe.baja { animation: golpe-barra 0.38s ease-out; }

@keyframes brillo { 0%, 70% { left: -40%; } 100% { left: 130%; } }
@keyframes golpe-barra {
  0%   { filter: brightness(2.2) saturate(0.6); transform: translateX(-3px); }
  20%  { transform: translateX(3px); }
  40%  { transform: translateX(-2px); }
  60%  { transform: translateX(1px); }
  100% { filter: none; transform: none; }
}
@keyframes cura-barra {
  0%   { filter: brightness(1.7) saturate(1.3); box-shadow: 0 0 10px #a5e07a; }
  100% { filter: none; box-shadow: 0 0 0 transparent; }
}
@keyframes peligro {
  from { box-shadow: 0 0 0 transparent; }
  to   { box-shadow: 0 0 9px 1px #e5483a99; }
}

@media (prefers-reduced-motion: reduce) {
  .barra, .brillo::before { animation: none !important; }
  .fantasma { transition: none; }
}
</style>
