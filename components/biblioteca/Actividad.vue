<!--
  Actividad.vue - Una actividad complementaria de la biblioteca. Tipos: opcion, ordenar, relacionar, clasificar, corregir.
  Retroalimentación inmediata, se puede repetir, y NO afecta a la vida, la experiencia ni las estrellas del juego.
-->
<template>
  <article class="act" :aria-labelledby="`act-t-${actividad.id}`">
    <h3 :id="`act-t-${actividad.id}`">{{ t(actividad.titulo) }}</h3>
    <p class="instr" lang="es">{{ instruccionVisible }}</p>

    <!-- OPCIÓN / COMPLETAR -->
    <div v-if="actividad.tipo === 'opcion'">
      <img v-if="actividad.imagen" class="senal" :src="actividad.imagen" :alt="actividad.alt || ''" />
      <div class="opciones">
        <button v-for="(o, i) in actividad.opciones" :key="i" type="button" class="op" lang="en" :disabled="resuelta"
          :class="{ ok: resuelta && i === actividad.correcta, mal: resuelta && sel === i && i !== actividad.correcta }" @click="elegirOpcion(i)">{{ o }}</button>
      </div>
    </div>

    <!-- ORDENAR -->
    <div v-else-if="actividad.tipo === 'ordenar'">
      <p class="armado" lang="en" aria-live="polite">
        <button v-for="(k, pos) in armado" :key="`a${pos}`" type="button" class="ficha puesta" :disabled="resuelta" @click="quitar(pos)">{{ fichas[k] }}</button>
        <span v-if="!armado.length" class="vacio">{{ t('Toca las fichas para armar la oración') }}</span>
      </p>
      <p class="banco" lang="en">
        <button v-for="(f, k) in fichas" :key="k" type="button" class="ficha" :disabled="resuelta || armado.includes(k)" @click="armado.push(k)">{{ f }}</button>
      </p>
      <div class="acciones">
        <button type="button" class="b-pri" :disabled="resuelta || armado.length !== fichas.length" @click="comprobarOrden">{{ t('Comprobar') }}</button>
        <button type="button" class="b-sec" :disabled="resuelta || !armado.length" @click="armado = []">{{ t('Borrar') }}</button>
      </div>
    </div>

    <!-- RELACIONAR -->
    <div v-else-if="actividad.tipo === 'relacionar'" class="rel">
      <div class="col">
        <button v-for="i in izq" :key="`i${i}`" type="button" class="op" lang="en" :disabled="hechas.includes(i)" :aria-pressed="selIzq === i"
          :class="{ ok: hechas.includes(i), activo: selIzq === i }" @click="selIzq = i">{{ actividad.parejas[i].izq }}</button>
      </div>
      <div class="col">
        <button v-for="i in der" :key="`d${i}`" type="button" class="op" :disabled="hechas.includes(i) || selIzq === null" :class="{ ok: hechas.includes(i), mal: falloDer === i }" @click="unir(i)">{{ actividad.parejas[i].der }}</button>
      </div>
    </div>

    <!-- CLASIFICAR -->
    <div v-else-if="actividad.tipo === 'clasificar'">
      <ul class="lista-clas">
        <li v-for="(it, i) in actividad.items" :key="i" :class="{ ok: resuelta && asignado[i] === it.grupo, mal: resuelta && asignado[i] !== it.grupo }">
          <span class="txt" lang="en">{{ it.texto }}</span>
          <span class="grupos" role="group" :aria-label="it.texto">
            <button v-for="(g, gi) in actividad.grupos" :key="gi" type="button" class="g" :disabled="resuelta" :aria-pressed="asignado[i] === gi"
              :class="{ activo: asignado[i] === gi }" @click="asignado[i] = gi">{{ t(g) }}</button>
          </span>
        </li>
      </ul>
      <div class="acciones">
        <button type="button" class="b-pri" :disabled="resuelta || asignado.some((a) => a === null)" @click="comprobarClasificar">{{ t('Comprobar') }}</button>
      </div>
    </div>

    <!-- CORREGIR -->
    <div v-else-if="actividad.tipo === 'corregir'">
      <p class="frase" lang="en">
        <button v-for="(w, i) in actividad.frase" :key="i" type="button" class="palabra" :disabled="resuelta"
          :class="{ ok: resuelta && i === actividad.error, mal: resuelta && sel === i && i !== actividad.error }" @click="elegirPalabra(i)">{{ w }}</button>
      </p>
    </div>

    <!-- Retroalimentación inmediata -->
    <div v-if="resuelta" class="retro" :class="acierto ? 'bien' : 'fallo'" role="status" aria-live="polite">
      <strong>{{ acierto ? t('¡Correcto!') : t('Casi: revisa la explicación') }}</strong>
      <span v-if="actividad.correcta !== undefined && actividad.tipo === 'ordenar' && !acierto" lang="en"> {{ actividad.correcta }}</span>
      <span v-if="actividad.correccion" lang="en"> {{ actividad.correccion }}</span>
      <span> {{ t(actividad.porque) }}</span>
      <button type="button" class="b-sec" @click="reiniciar">{{ t('Repetir') }}</button>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({ actividad: { type: Object, required: true } })
const emit = defineEmits(['resuelta'])
const { t } = useLanguage()
const a = props.actividad

const resuelta = ref(false)
const acierto = ref(false)
const sel = ref(null)
const armado = ref([])
const selIzq = ref(null)
const falloDer = ref(null)
const hechas = ref([])
const errores = ref(0)
const asignado = ref((a.items ?? []).map(() => null))

const barajar = (n) => {
  const base = [...Array(n).keys()]
  let m
  do { m = [...base].sort(() => Math.random() - 0.5) } while (n > 1 && m.every((v, i) => v === i))
  return m
}
const fichas = reactive([...(a.fichas ?? [])])
const izq = ref(barajar((a.parejas ?? []).length))
const der = ref(barajar((a.parejas ?? []).length))
// Para ordenar se muestran barajadas las fichas: se reordena la lista en el montaje
if (a.tipo === 'ordenar') fichas.splice(0, fichas.length, ...barajarTexto(a.fichas))
function barajarTexto(lista) { const copia = [...lista]; let m; do { m = [...copia].sort(() => Math.random() - 0.5) } while (m.join(' ') === a.correcta.replace(/\s+/g, ' ')); return m }

const instruccionVisible = computed(() => t(a.instruccion))
const norm = (s) => s.replace(/\s+/g, ' ').trim()

function cerrar(ok) { resuelta.value = true; acierto.value = ok; emit('resuelta', ok) }
function elegirOpcion(i) { if (resuelta.value) return; sel.value = i; cerrar(i === a.correcta) }
function quitar(pos) { armado.value.splice(pos, 1) }
function comprobarOrden() { cerrar(norm(armado.value.map((k) => fichas[k]).join(' ')) === norm(a.correcta)) }
function unir(i) {
  if (selIzq.value === null) return
  if (selIzq.value === i) {
    hechas.value.push(i); selIzq.value = null; falloDer.value = null
    if (hechas.value.length === a.parejas.length) cerrar(errores.value === 0)
  } else { errores.value++; falloDer.value = i; setTimeout(() => { falloDer.value = null }, 600) }
}
function comprobarClasificar() { cerrar(a.items.every((it, i) => asignado.value[i] === it.grupo)) }
function elegirPalabra(i) { if (resuelta.value) return; sel.value = i; cerrar(i === a.error) }

let temporizadores = []
function reiniciar() {
  resuelta.value = false; acierto.value = false; sel.value = null; armado.value = []; selIzq.value = null; falloDer.value = null
  hechas.value = []; errores.value = 0; asignado.value = (a.items ?? []).map(() => null)
  if (a.tipo === 'relacionar') { izq.value = barajar(a.parejas.length); der.value = barajar(a.parejas.length) }
  if (a.tipo === 'ordenar') fichas.splice(0, fichas.length, ...barajarTexto(a.fichas))
}
onBeforeUnmount(() => { temporizadores.forEach(clearTimeout); temporizadores = [] })
</script>

<style scoped>
.act { padding: 1rem; border: 1px solid #8f7959; border-radius: 10px; background: #141c2a; color: #f1e8d3; }
h3 { margin: 0 0 .25rem; color: #ffe09a; font: 700 1.1rem Georgia, serif; }
.instr { margin: 0 0 .8rem; line-height: 1.45; }
.senal { display: block; width: 110px; height: 110px; margin: 0 auto .8rem; object-fit: contain; }
.opciones { display: grid; gap: .5rem; }
button { font: inherit; }
.op, .ficha, .palabra, .g { min-height: 44px; padding: .4rem .8rem; color: #f7edda; background: #243247; border: 1px solid #8f7959; border-radius: 8px; cursor: pointer; text-align: left; }
.op:hover:not(:disabled), .ficha:hover:not(:disabled), .g:hover:not(:disabled), .palabra:hover:not(:disabled) { background: #31445f; }
button:focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }
button:disabled { cursor: default; }
.op.ok, .palabra.ok, li.ok { border-color: #6fcf97; background: #1f4a33; }
.op.mal, .palabra.mal, li.mal { border-color: #eb7b6d; background: #5a2620; }
.op.activo, .g.activo { border-color: #ffe09a; background: #4b3d1e; }
.ficha { text-align: center; }
.ficha.puesta { background: #3a2f1c; }
.armado, .banco, .frase { display: flex; flex-wrap: wrap; gap: .45rem; margin: .4rem 0; }
.armado { min-height: 56px; padding: .5rem; border: 1px dashed #8f7959; border-radius: 8px; align-items: center; }
.vacio { color: #b9b2a3; font-size: .9rem; }
.rel { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.col { display: grid; gap: .5rem; align-content: start; }
.lista-clas { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
.lista-clas li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .4rem; padding: .5rem; border: 1px solid #5a6b85; border-radius: 8px; }
.txt { font-weight: 600; }
.grupos { display: flex; flex-wrap: wrap; gap: .35rem; }
.g { text-align: center; min-height: 40px; font-size: .9rem; }
.acciones { display: flex; gap: .5rem; margin-top: .6rem; }
.b-pri, .b-sec { min-height: 44px; padding: 0 1rem; border-radius: 8px; cursor: pointer; font-weight: 700; }
.b-pri { color: #2a1d08; background: #ffe09a; border: 1px solid #ffe09a; }
.b-pri:disabled { opacity: .45; }
.b-sec { color: #ffe09a; background: transparent; border: 1px solid #b3955c; }
.retro { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem .5rem; margin-top: .8rem; padding: .6rem .75rem; border-radius: 8px; line-height: 1.4; }
.retro.bien { background: #1f4a33; border: 1px solid #6fcf97; }
.retro.fallo { background: #4a3417; border: 1px solid #e8bd71; }
.retro .b-sec { margin-left: auto; }
</style>
