<template>
  <div class="punto">
    <AudioSonidoBoton @click="emit('elegir', nivel.numero)">
      <button type="button" class="zona" :class="estado" :disabled="estado === 'bloqueada'"
        :aria-label="`${nivel.numero}. ${nivel.nombre} · ${nivel.tema} · ${estado}`">
        <span class="numero">
          <span v-if="estado === 'bloqueada'" aria-hidden="true">🔒</span>
          <span v-else-if="estado === 'completada'" aria-hidden="true">✓</span>
          <span v-else>{{ nivel.numero }}</span>
        </span>
        <span class="rotulo">
          <strong>{{ nivel.nombre }}</strong>
          <small>{{ nivel.tema }}</small>
        </span>
      </button>
    </AudioSonidoBoton>
  </div>
</template>

<script setup>
defineProps({
  nivel: { type: Object, required: true },
  estado: { type: String, required: true }
})

const emit = defineEmits(['elegir'])
</script>

<style scoped>
.punto {
  position: absolute;
  transform: translate(-50%, -22px);
}

.zona {
  display: grid;
  justify-items: center;
  min-width: 44px;
  color: #fff2cf;
  text-align: center;
  cursor: pointer;
}

.numero {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 2px solid #ffe6a6;
  border-radius: 50%;
  background: #ffd17d;
  color: #171e2d;
  font: 800 1.2rem Georgia, serif;
  box-shadow: 0 0 0 3px #192333, 0 4px 12px #0009;
}

.rotulo {
  display: grid;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 5px;
  background: #101928f5;
  font-size: clamp(0.625rem, 1.5vw, 0.9rem);
  line-height: 1.25;
  white-space: nowrap;
}

small {
  color: #e1bf82;
}

.zona:not(:disabled):is(:hover, :focus-visible) .numero {
  box-shadow: 0 0 0 3px #192333, 0 0 14px 4px #ffdb87;
}

.bloqueada { cursor: default; }
.bloqueada .numero { background: #29394d; border-color: #a5b4c4; }
.completada .numero { background: #89d6ad; border-color: #ccf8dc; }

@media (max-width: 480px) {
  .rotulo { padding-inline: 4px; }
  small { white-space: normal; max-width: 90px; }
}
</style>
