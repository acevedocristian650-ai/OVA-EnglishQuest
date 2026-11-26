<!--
  MapZone.vue - Un destino del mapa. Ya no es un simple número: es el medallón del guardián que protege la zona.
  · bloqueada: silueta del guardián envuelta en niebla y cadenas
  · disponible: medallón brillante con aro pulsante y bandera «¡Aquí!»
  · completada: guardián derrotado (en gris) con sello de victoria y estrellas ganadas
-->
<template>
  <div class="punto" :class="[estado, { aqui }]">
    <AudioSonidoBoton @click="emit('elegir', nivel.numero)">
      <button type="button" class="zona" :class="[estado, { aqui }]"
        :aria-label="`${nivel.numero}. ${nivel.nombre} · ${nivel.tema} · ${t(estado)}`">
        <span class="aro" aria-hidden="true" />
        <span class="medalla" aria-hidden="true">
          <img class="guardian" :src="retrato" alt="" decoding="async" loading="lazy" />
          <span v-if="estado === 'bloqueada'" class="candado">🔒</span>
        </span>
        <span class="sello" aria-hidden="true">{{ estado === 'completada' ? '✓' : nivel.numero }}</span>
        <span class="rotulo">
          <strong>{{ nivel.nombre }}</strong>
          <small>{{ estado === 'bloqueada' ? '???' : nivel.tema }}</small>
          <span v-if="estado === 'completada'" class="estrellas" aria-hidden="true">{{ '★'.repeat(estrellas) }}{{ '☆'.repeat(Math.max(0, 3 - estrellas)) }}</span>
        </span>
      </button>
    </AudioSonidoBoton>
    <span v-if="estado === 'disponible'" class="bandera" aria-hidden="true">{{ t('¡A la batalla!') }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  nivel: { type: Object, required: true },
  estado: { type: String, required: true },
  estrellas: { type: Number, default: 0 },
  aqui: Boolean
})

const { t } = useLanguage()
const emit = defineEmits(['elegir'])
const retrato = computed(() => `${props.nivel.arte}/reposo-lite.webp`)
</script>

<style scoped>
.punto { position: absolute; transform: translate(-50%, -50%); z-index: 3; }
.punto.aqui { z-index: 4; }

.zona { position: relative; display: grid; justify-items: center; color: #fff2cf; text-align: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }

.medalla {
  position: relative; display: grid; place-items: center; overflow: hidden;
  width: clamp(40px, 6.4cqw, 66px); aspect-ratio: 1; border-radius: 50%;
  border: 3px solid #ffe6a6; background: radial-gradient(circle at 50% 35%, #3b4e72, #141d33 75%);
  box-shadow: 0 0 0 3px #192333, 0 6px 14px #000a;
  transition: scale 160ms, box-shadow 160ms;
}
.guardian { width: 118%; height: 118%; object-fit: contain; object-position: 50% 58%; filter: drop-shadow(0 2px 3px #0008); transition: transform 300ms; }

/* Aro de energía: solo en la zona disponible */
.aro { position: absolute; inset: -9px; border-radius: 50%; border: 2px solid transparent; pointer-events: none; }
.disponible .aro { border-color: #ffd98a; animation: aro 1.8s ease-out infinite; }
@keyframes aro { 0% { scale: .85; opacity: .9; } 100% { scale: 1.45; opacity: 0; } }

.sello {
  position: absolute; top: -6px; right: -8px; display: grid; place-items: center;
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid #ffe6a6; background: #ffd17d; color: #171e2d;
  font: 800 .72rem Georgia, serif; box-shadow: 0 2px 5px #000a;
}

.rotulo {
  position: absolute; top: calc(100% + 6px); display: grid; padding: 2px 9px; border: 1px solid #be934866; border-radius: 6px;
  background: #101928ee; font-size: clamp(.6rem, 1.45vw, .85rem); line-height: 1.25; white-space: nowrap; pointer-events: none;
}
.rotulo small { color: #e1bf82; }
.estrellas { color: #ffd98a; letter-spacing: 2px; font-size: .9em; }

.zona:not(:disabled):is(:hover, :focus-visible) .medalla { scale: 1.12; box-shadow: 0 0 0 3px #192333, 0 0 18px 6px #ffdb87aa; }
.zona:is(:hover, :focus-visible) .guardian { transform: scale(1.06) translateY(-2px); }
.zona:active .medalla { scale: .94; }
.zona:focus-visible { outline: none; }

.disponible .medalla { border-color: #fff0b8; box-shadow: 0 0 0 3px #192333, 0 0 22px 4px #ffd98a99, 0 6px 14px #000a; }
.disponible .guardian { animation: respira 2.4s ease-in-out infinite; }
@keyframes respira { 50% { transform: translateY(-3px) scale(1.04); } }

.completada .medalla { border-color: #ccf8dc; }
.completada .guardian { filter: grayscale(.85) brightness(.8) drop-shadow(0 2px 3px #0008); }
.completada .sello { background: #89d6ad; border-color: #ccf8dc; animation: sellar 600ms cubic-bezier(.2, 1.6, .4, 1); }
@keyframes sellar { 0% { scale: .3; rotate: -40deg; } 60% { scale: 1.3; } }

.bloqueada { cursor: pointer; }
.bloqueada .medalla { border-color: #7f8da0; background: radial-gradient(circle at 50% 35%, #2b3548, #0d1220 80%); }
.bloqueada .guardian { filter: brightness(0) opacity(.55); }
.bloqueada .sello { background: #29394d; border-color: #a5b4c4; color: #cfd8e3; }
.bloqueada .rotulo { opacity: .75; }
.candado { position: absolute; font-size: clamp(14px, 2.4cqw, 24px); filter: drop-shadow(0 2px 3px #000); }
.bloqueada:active .medalla { animation: sacudir 280ms; }
@keyframes sacudir { 25% { translate: -4px 0; } 75% { translate: 4px 0; } }

.bandera {
  position: absolute; left: 50%; bottom: calc(100% + 14px); translate: -50% 0; padding: 2px 10px; border-radius: 999px;
  background: #ffd98a; color: #1a1408; font: 800 .68rem system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase;
  white-space: nowrap; pointer-events: none; animation: rebote 1.3s ease-in-out infinite;
}
.bandera::after { content: ''; position: absolute; left: 50%; top: 100%; translate: -50% 0; border: 5px solid transparent; border-top-color: #ffd98a; }
@keyframes rebote { 50% { transform: translateY(-5px); } }

@media (prefers-reduced-motion: reduce) {
  .disponible .aro, .disponible .guardian, .completada .sello, .bandera { animation: none; }
  .medalla, .guardian { transition: none; }
}
@media (max-width: 480px) { .bandera { display: none; } }
</style>
