<template>
  <div class="pregunta">
    <h2 lang="en">{{ pregunta.texto }}</h2>
    <img v-if="pregunta.imagen" :src="pregunta.imagen" :alt="pregunta.alt" />

    <template v-if="pregunta.tipo === 'ordenar'">
      <p>Toca las fichas en el orden correcto.</p>
      <p class="frase" lang="en" aria-live="polite">{{ frase || '…' }}</p>
      <div class="fichas">
        <AudioSonidoBoton v-for="(palabra, indice) in pregunta.opciones" :key="indice" @click="agregar(indice)">
          <v-btn :disabled="orden.includes(indice)" color="amber-lighten-3" variant="tonal" lang="en">{{ palabra }}</v-btn>
        </AudioSonidoBoton>
      </div>
      <div class="fichas">
        <AudioSonidoBoton @click="orden = []">
          <v-btn :disabled="!orden.length" variant="text">Borrar</v-btn>
        </AudioSonidoBoton>
        <AudioSonidoBoton @click="confirmar">
          <v-btn :disabled="orden.length !== pregunta.opciones.length" color="amber-lighten-3">Confirmar</v-btn>
        </AudioSonidoBoton>
      </div>
    </template>

    <div v-else class="opciones">
      <AudioSonidoBoton v-for="opcion in pregunta.opciones" :key="opcion" @click="emit('responder', opcion)">
        <v-btn block color="amber-lighten-3" variant="tonal" lang="en">{{ opcion }}</v-btn>
      </AudioSonidoBoton>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['responder'])
const orden = ref([])
const frase = computed(() => orden.value.map((indice) => props.pregunta.opciones[indice]).join(' '))

function agregar(indice) {
  if (!orden.value.includes(indice)) orden.value.push(indice)
}

function confirmar() {
  if (orden.value.length === props.pregunta.opciones.length) emit('responder', frase.value)
}
</script>

<style scoped>
h2 { margin: 0.2rem 0 0.4rem; color: #fff0cc; font-family: Georgia, serif; font-size: clamp(1rem, 2.5vw, 1.3rem); }
p { font-size: 0.82rem; }
img { display: block; width: clamp(44px, 15dvh, 78px); margin: 0 auto 0.55rem; }
.opciones, .fichas { display: grid; gap: 0.35rem; }
.fichas { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 0.35rem; }
.frase { padding: 0.35rem; margin-block: 0.35rem; border: 1px dashed #8299b2; border-radius: 5px; }
.pregunta :deep(.v-btn) { min-height: 44px; height: auto; padding: 0.4rem; text-transform: none; letter-spacing: normal; }
.pregunta :deep(.v-btn__content) { white-space: normal; }

@media (min-width: 530px) {
  .opciones { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .fichas { display: flex; flex-wrap: wrap; }
}
</style>
