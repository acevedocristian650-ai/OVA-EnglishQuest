<template>
  <div class="errores">
    <h2 lang="en">{{ pregunta.texto }}</h2>
    <p v-if="pregunta.contexto" class="contexto" lang="en">{{ pregunta.contexto }}</p>
    <div class="frase" role="group" :aria-label="t('Frase con un error')" lang="en">
      <AudioSonidoBoton v-for="(palabra, posicion) in pregunta.frase" :key="posicion" @click="elegir(posicion)">
        <button type="button" class="palabra" :class="{ elegida: elegida === posicion }"
          :disabled="elegida !== null">{{ palabra }}</button>
      </AudioSonidoBoton>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Datos: { frase: ['She', 'will', 'goes'], error: 2, correcta: 'She will go.' }
const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['responder'])
const { t } = useLanguage()
const elegida = ref(null)

function elegir(posicion) {
  if (elegida.value !== null) return
  elegida.value = posicion
  if (posicion === props.pregunta.error) {
    emit('responder', props.pregunta.correcta)
    return
  }
  // Respuesta incorrecta: se muestra la frase con la palabra que tocó el jugador entre corchetes.
  emit('responder', props.pregunta.frase.map((palabra, i) => (i === posicion ? `[${palabra}]` : palabra)).join(' '))
}
</script>

<style scoped>
h2 { margin: 0.2rem 0 0.4rem; color: #fff0cc; font: 600 clamp(1rem, 2.5vw, 1.3rem) Georgia, serif; }
.contexto { color: #e3d4bd; }
.frase {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding: 0.6rem;
  border: 1px solid #b3955c80;
  border-radius: 6px;
  background: #151a22;
}
.palabra {
  min-height: 48px;
  min-width: 48px;
  padding: 0.3rem 0.7rem;
  border: 1px solid #c19a63;
  border-radius: 8px;
  background: linear-gradient(135deg, #392d24, #151c2b);
  color: #fff1ce;
  font: 600 clamp(0.95rem, 2.4vw, 1.15rem) Georgia, serif;
  cursor: pointer;
}
.palabra:hover:not(:disabled) { border-color: #ffe09a; }
.palabra { transition: scale 120ms, border-color 120ms; }
.palabra:not(:disabled):active { scale: 0.93; }
.palabra.elegida { border: 2px solid #ffdc96; background: #5b462b; animation: elegir 260ms ease-out; }
@keyframes elegir { 50% { scale: 1.12; } }
@media (prefers-reduced-motion: reduce) {
  .palabra { transition: none; }
  .palabra.elegida { animation: none; }
}
.palabra:focus-visible { outline: 2px solid #ffe09a; outline-offset: 2px; }
</style>
