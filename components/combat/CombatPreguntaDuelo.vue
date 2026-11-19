<template>
  <form class="pregunta" @submit.prevent="confirmar">
    <div class="consigna">
      <h2 lang="en">{{ pregunta.texto }}</h2>
      <p v-if="pregunta.contexto" class="contexto" lang="en">{{ pregunta.contexto }}</p>
      <p v-if="pregunta.tipo === 'ordenar' && pregunta.modelo" class="modelo" lang="en">
        <small>{{ pregunta.modelo.endsWith('…') ? t('Empieza así') : t('Frase base') }}</small>
        <strong>{{ pregunta.modelo }}</strong>
      </p>
    </div>
    <template v-if="pregunta.tipo === 'ordenar'">
      <div class="frase fichas" role="group" :aria-label="t('Tu frase')" lang="en">
        <template v-for="posicion in pregunta.fichas.length" :key="posicion">
          <AudioSonidoBoton v-if="orden[posicion - 1] !== undefined" @click="orden.splice(posicion - 1, 1)">
            <v-btn type="button" variant="tonal" color="amber-lighten-3"
              :aria-label="t('Quitar ') + pregunta.fichas[orden[posicion - 1]]">{{ pregunta.fichas[orden[posicion - 1]] }}</v-btn>
          </AudioSonidoBoton>
          <span v-else class="hueco" aria-hidden="true" />
        </template>
      </div>
      <div class="fichas" role="group" :aria-label="t('Fichas disponibles')" lang="en">
        <AudioSonidoBoton v-for="(palabra, indice) in pregunta.fichas" :key="indice" @click="orden.push(indice)">
          <v-btn type="button" v-show="!orden.includes(indice)" :disabled="orden.includes(indice)" color="amber-lighten-3"
            variant="outlined">{{ palabra }}</v-btn>
        </AudioSonidoBoton>
      </div>
      <div class="barra-orden">
        <p class="ayuda">{{ t('Toca fichas ·') }} <span class="contador-fichas" aria-live="polite">{{ orden.length }}/{{ pregunta.fichas.length }}</span></p>
        <span class="acciones-orden">
          <AudioSonidoBoton @click="orden.pop()">
            <v-btn type="button" size="x-small" variant="text" color="amber-lighten-3" :disabled="!orden.length">↶ {{ t('Deshacer') }}</v-btn>
          </AudioSonidoBoton>
          <AudioSonidoBoton @click="orden.splice(0)">
            <v-btn type="button" size="x-small" variant="text" color="amber-lighten-3" :disabled="!orden.length">{{ t('Borrar todo') }}</v-btn>
          </AudioSonidoBoton>
        </span>
      </div>
    </template>

    <template v-else>
      <p class="ayuda">{{ t('Elige zona y confirma.') }}</p>
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
      <v-btn class="confirmar" type="submit" :disabled="!listo" color="amber-lighten-3">{{ t('Confirmar') }}</v-btn>
    </AudioSonidoBoton>
  </form>
</template>

<script setup>
const props = defineProps({ pregunta: { type: Object, required: true } })
const emit = defineEmits(['responder'])
const { t } = useLanguage()
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
.modelo {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin: 0.15rem 0 0.35rem;
  padding: 0.3rem 0.6rem;
  border-left: 3px solid #e6b96e;
  background: #1c2330;
  color: #e3d4bd;
}
.modelo small { color: #c8c0b3; font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; }
.modelo strong { color: #fff0cc; font: 600 clamp(0.95rem, 2.3vw, 1.1rem) Georgia, serif; }
.barra-orden { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0 0.5rem; }
.barra-orden .ayuda { margin: 0.1rem 0; }
.acciones-orden { display: inline-flex; gap: 0.1rem; }
.contador-fichas { color: #ffe09a; font-weight: 700; font-variant-numeric: tabular-nums; }
.hueco { display: inline-block; min-width: 44px; height: 36px; border: 2px dashed #b3955c66; border-radius: 6px; }
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
.confirmar:not(.v-btn--disabled) { animation: llamar 1.6s ease-in-out infinite; }
.frase :deep(.v-btn) { animation: colocar 220ms cubic-bezier(.2, 1.5, .4, 1) backwards; }
.zona { transition: scale 120ms, border-color 120ms; }
.zona:active { scale: 0.96; }
.zona[aria-pressed="true"] { animation: elegir-zona 260ms ease-out; }
@keyframes colocar { from { opacity: 0; scale: 0.7; translate: 0 8px; } }
@keyframes elegir-zona { 50% { scale: 1.07; } }
@keyframes llamar {
  0% { box-shadow: 0 0 0 0 #ffe09a66; }
  70%, 100% { box-shadow: 0 0 0 9px #ffe09a00; }
}
@media (prefers-reduced-motion: reduce) {
  .confirmar:not(.v-btn--disabled), .frase :deep(.v-btn), .zona[aria-pressed="true"] { animation: none; }
  .zona { transition: none; }
}
.pregunta :is(button, input):focus-visible { outline: 2px solid #ffe09a; outline-offset: 2px; }

/* La mesa comparte el campo con los luchadores. Las fichas se ajustan al espacio disponible. */
.mesa-frase { display: grid; align-content: center; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 8px; }
.mesa-frase > :is(.consigna, .frase, .fichas) { grid-column: 1 / -1; }
.mesa-frase h2, .mesa-frase .modelo, .mesa-frase .fichas, .mesa-frase .contexto { margin: 0; }
.mesa-frase .barra-orden { grid-column: 1; grid-row: auto; }
.mesa-frase .confirmar { grid-column: 2; margin: 0; }
.mesa-frase :deep(.v-btn) { min-width: 0; height: auto; min-height: 34px; padding: 3px 9px; white-space: normal; letter-spacing: normal; text-transform: none; line-height: 1.15; }
.mesa-frase :deep(.v-btn__content) { white-space: normal; }
.mesa-frase .frase { min-height: 36px; }
.mesa-frase .hueco { min-width: 24px; height: 21px; }
.mesa-frase .fichas { gap: 4px; }
.mesa-frase .modelo { flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: 4px; }
@media (max-height: 520px), (max-width: 650px) {
  .mesa-frase { font-size: clamp(13px, 3.4dvh, 16px); padding: 6px 8px; }
  .mesa-frase h2 { font-size: clamp(15px, 4dvh, 18px); line-height: 1.16; }
  .mesa-frase .modelo strong { font-size: 14px; }
  .mesa-frase :deep(.v-btn) { font-size: clamp(12px, 3.4dvh, 15px); }
}
@media (orientation: landscape) and (max-height: 600px) {
  .mesa-frase { align-content: start; }
  .mesa-frase :deep(.v-btn) { min-height: 32px; padding-inline: 6px; }
}
</style>
