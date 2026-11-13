<template>
  <form class="pregunta" @submit.prevent="confirmar">
    <h2 lang="en">{{ pregunta.texto }}</h2>
    <p v-if="pregunta.contexto" class="contexto" lang="en">{{ pregunta.contexto }}</p>

    <template v-if="pregunta.tipo === 'ordenar'">
      <p class="ayuda">Toca las fichas para colocarlas o quitarlas.</p>
      <div class="frase fichas" role="group" aria-label="Tu frase" lang="en">
        <span v-if="!orden.length" class="ayuda">Tu frase aparecerá aquí.</span>
        <AudioSonidoBoton v-for="(indice, posicion) in orden" :key="indice" @click="orden.splice(posicion, 1)">
          <v-btn type="button" variant="tonal" color="amber-lighten-3"
            :aria-label="'Quitar ' + pregunta.fichas[indice]">{{ pregunta.fichas[indice] }}</v-btn>
        </AudioSonidoBoton>
      </div>
      <div class="fichas" role="group" aria-label="Fichas disponibles" lang="en">
        <AudioSonidoBoton v-for="(palabra, indice) in pregunta.fichas" :key="indice" @click="orden.push(indice)">
          <v-btn type="button" :disabled="orden.includes(indice)" color="amber-lighten-3"
            variant="outlined">{{ palabra }}</v-btn>
        </AudioSonidoBoton>
      </div>
    </template>

    <template v-else>
      <p class="ayuda">Toca una zona del tablero y confirma.</p>
      <div class="tablero" :class="pregunta.tablero" role="group" :aria-label="pregunta.texto">
        <div v-if="pregunta.señal" class="señal">
          <img v-if="pregunta.señal.imagen" :src="pregunta.señal.imagen" :alt="pregunta.señal.alt" />
          <span v-else class="semáforo" role="img" :aria-label="pregunta.señal.alt"><i /><i /><i /></span>
        </div>
        <div class="zonas" lang="en">
          <AudioSonidoBoton v-for="zona in pregunta.zonas" :key="zona.texto" @click="seleccion = zona.texto">
            <button type="button" class="zona" :aria-pressed="seleccion === zona.texto">
              <img v-if="zona.imagen" class="señal-zona" :src="zona.imagen" :alt="zona.alt" />
              <span v-else aria-hidden="true" class="icono">{{ zona.icono }}</span>
              {{ zona.texto }}
              <small v-if="zona.detalle">{{ zona.detalle }}</small>
              <span v-if="seleccion === zona.texto" class="marcador-zona" aria-hidden="true">♞</span>
            </button>
          </AudioSonidoBoton>
        </div>
      </div>
    </template>

    <AudioSonidoBoton>
      <v-btn class="confirmar" type="submit" :disabled="!listo" color="amber-lighten-3">Confirmar</v-btn>
    </AudioSonidoBoton>
  </form>
</template>

<script setup>
const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['responder'])
const orden = ref([])
const seleccion = ref('')
const respuesta = computed(() => {
  if (props.pregunta.tipo === 'ordenar') return orden.value.map((indice) => props.pregunta.fichas[indice]).join(' ')
  if (props.pregunta.tipo === 'zona') return seleccion.value
  return ''
})
const listo = computed(() => props.pregunta.tipo === 'ordenar'
  ? orden.value.length === props.pregunta.fichas.length
  : respuesta.value.length > 0)

function confirmar() {
  if (listo.value) emit('responder', respuesta.value)
}
</script>

<style scoped>
h2 { margin: 0.2rem 0 0.4rem; color: #fff0cc; font: 600 clamp(1rem, 2.5vw, 1.3rem) Georgia, serif; }
.contexto { color: #e3d4bd; }
.ayuda { color: #c8c0b3; font-size: 0.8rem; }
.frase, .editor {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-height: 44px;
  padding: 0.35rem 0.55rem;
  border: 1px solid #b3955c80;
  border-radius: 6px;
  background: #151a22;
  color: #fff0cc;
}
.frase input {
  min-height: 40px;
  width: min(100%, 11rem);
  padding: 0.25rem 0.4rem;
  border-bottom: 2px solid #e6b96e;
  background: #262722;
}
.editor { width: 100%; }
.modelo { color: #e3d4bd; }
.fichas { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; margin-top: 0.35rem; }
.tablero { padding: 0.5rem; border: 1px solid #74634d; border-radius: 6px; background: #151a22; }
.señal { display: grid; place-items: center; margin-bottom: 0.45rem; }
.señal img { width: clamp(38px, 13dvh, 65px); }
.semáforo { display: grid; gap: 3px; padding: 4px; border-radius: 5px; background: #080c11; }
.semáforo i { width: 10px; height: 10px; border-radius: 50%; background: #414750; }
.semáforo i:first-child { background: #ff6358; }
.zonas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.35rem; }
.zona {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 56px;
  padding: 0.25rem;
  border: 1px solid #958165;
  border-radius: 5px;
  background: #303740;
  color: #fff0cc;
  font-size: 0.78rem;
  line-height: 1.15;
}
.calle .zona { border-style: dashed; }
.señal-zona { width: 1.3rem; }
.zona small { color: #e3d4bd; }
.icono { font-size: 1.15rem; }
.zona[aria-pressed="true"] { border: 2px solid #ffdc96; background: #5b462b; }
.marcador-zona { position: absolute; inset-block-start: 0; inset-inline-end: 0.25rem; color: #ffdc96; font-size: 1rem; }
.confirmar { margin-top: 0.45rem; }
.pregunta :is(button, input):focus-visible { outline: 2px solid #ffe09a; outline-offset: 2px; }
</style>
