<!--
  Actividad.vue - Una actividad complementaria de la biblioteca. Tipos: opcion, ordenar, relacionar, clasificar, corregir.
  Retroalimentación inmediata, se puede repetir, y NO afecta a la vida, la experiencia ni las estrellas del juego.
  Las fichas y columnas se barajan con semilla (nunca en el orden correcto); al repetir, el orden cambia.
-->
<template>
  <article class="act" :aria-labelledby="`act-t-${actividad.id}`">
    <div class="cab-act">
      <p class="insignia" aria-hidden="true"><span>{{ ICONOS[actividad.tipo] ?? '📜' }}</span></p>
      <h3 :id="`act-t-${actividad.id}`">{{ t(actividad.titulo) }}</h3>
    </div>
    <p class="instr" lang="es">{{ instruccionVisible }}</p>

    <!-- OPCIÓN / COMPLETAR -->
    <div v-if="actividad.tipo === 'opcion'">
      <img v-if="actividad.imagen" class="senal" :src="actividad.imagen" :alt="actividad.alt || ''" />
      <div class="opciones">
        <button v-for="i in ordenOpciones" :key="i" type="button" class="op" lang="en" :disabled="resuelta"
          :class="{ ok: resuelta && i === actividad.correcta, mal: resuelta && sel === i && i !== actividad.correcta }" @click="elegirOpcion(i)">{{ actividad.opciones[i] }}</button>
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
import { semillaDe, ordenFichas, barajarSemilla } from '~/composables/useBarajar.js'

const props = defineProps({ actividad: { type: Object, required: true } })
const emit = defineEmits(['resuelta'])
const { t } = useLanguage()
const a = props.actividad

const ICONOS = { opcion: '🎯', ordenar: '🧩', relacionar: '🔗', clasificar: '⚖️', corregir: '🔍' }

const temporizadores = []
const resuelta = ref(false)
const acierto = ref(false)
const sel = ref(null)
const armado = ref([])
const selIzq = ref(null)
const falloDer = ref(null)
const hechas = ref([])
const errores = ref(0)
const asignado = ref((a.items ?? []).map(() => null))

// Barajado con semilla de la actividad: estable entre servidor y cliente, distinto
// en cada actividad, y al repetir (`vuelta`) el orden cambia. Nunca el orden correcto.
const vuelta = ref(0)
const semillaAct = () => (semillaDe(`${a.id}|${a.titulo}`) + vuelta.value * 7919) >>> 0

function barajarColumna(n, desplazamiento) {
  return barajarSemilla(Array.from({ length: n }, (_, i) => i), (semillaAct() + desplazamiento) >>> 0)
}
function barajarTexto(lista) {
  return ordenFichas(lista, a.correcta ?? '', semillaAct()).map((i) => lista[i])
}

const ordenOpciones = computed(() => barajarColumna((a.opciones ?? []).length, 53))
const fichas = reactive([...(a.fichas ?? [])])
const izq = ref(barajarColumna((a.parejas ?? []).length, 13))
const der = ref(barajarColumna((a.parejas ?? []).length, 29))
// Para ordenar se muestran barajadas las fichas: se reordena la lista en el montaje
if (a.tipo === 'ordenar') fichas.splice(0, fichas.length, ...barajarTexto(a.fichas))

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
  } else { errores.value++; falloDer.value = i; temporizadores.push(setTimeout(() => { falloDer.value = null }, 600)) }
}
function comprobarClasificar() { cerrar(a.items.every((it, i) => asignado.value[i] === it.grupo)) }
function elegirPalabra(i) { if (resuelta.value) return; sel.value = i; cerrar(i === a.error) }

function reiniciar() {
  resuelta.value = false; acierto.value = false; sel.value = null; armado.value = []; selIzq.value = null; falloDer.value = null
  hechas.value = []; errores.value = 0; asignado.value = (a.items ?? []).map(() => null)
  vuelta.value++
  if (a.tipo === 'relacionar') {
    izq.value = barajarColumna(a.parejas.length, 13)
    der.value = barajarColumna(a.parejas.length, 29)
  }
  if (a.tipo === 'ordenar') fichas.splice(0, fichas.length, ...barajarTexto(a.fichas))
}
onBeforeUnmount(() => { temporizadores.forEach(clearTimeout); temporizadores.length = 0 })
</script>

<style scoped>
/* Tarjeta de entrenamiento sobre el pergamino */
.act {
  padding: 1rem;
  border: 1px solid #b68a48;
  border-radius: 12px;
  background: linear-gradient(170deg, #fff8e6, #f3e9cf);
  color: #2b1d0e;
  box-shadow: 0 6px 18px #4a2f1422;
}
.cab-act { display: flex; align-items: center; gap: .55rem; }
.insignia { margin: 0; }
.insignia span {
  display: inline-grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border: 1px solid #b68a48;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffe09a, #e3cf9f);
  font-size: 1.1rem;
  box-shadow: 0 2px 8px #4a2f1433;
}
h3 { margin: 0; color: #4a2f14; font: 700 1.1rem Georgia, serif; }
.instr { margin: .4rem 0 .8rem; line-height: 1.45; color: #5a4632; }
.senal { display: block; width: 110px; height: 110px; margin: 0 auto .8rem; object-fit: contain; }
.opciones { display: grid; gap: .5rem; }
button { font: inherit; }
.op, .ficha, .palabra, .g {
  min-height: 44px; padding: .4rem .8rem;
  color: #2b1d0e; background: #fffdf6;
  border: 1px solid #b68a48; border-radius: 8px;
  cursor: pointer; text-align: left;
  transition: background 120ms, transform 120ms, border-color 120ms;
}
.op:hover:not(:disabled), .ficha:hover:not(:disabled), .g:hover:not(:disabled), .palabra:hover:not(:disabled) { background: #ffeec2; transform: translateY(-1px); }
button:focus-visible { outline: 3px solid #b68a48; outline-offset: 2px; }
button:disabled { cursor: default; }
.op.ok, .palabra.ok, li.ok { border-color: #2e7d4f; background: #dff0e2; }
.op.mal, .palabra.mal, li.mal { border-color: #a83226; background: #f6dcd6; }
.op.activo, .g.activo { border-color: #4a2f14; background: #ffe09a; }
.ficha { text-align: center; }
.ficha.puesta { background: #ffe09a; border-color: #4a2f14; }
.armado, .banco, .frase { display: flex; flex-wrap: wrap; gap: .45rem; margin: .4rem 0; }
.armado { min-height: 56px; padding: .5rem; border: 1px dashed #b68a48; border-radius: 8px; align-items: center; background: #fff8e6; }
.vacio { color: #6b543a; font-size: .9rem; }
.rel { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.col { display: grid; gap: .5rem; align-content: start; }
.lista-clas { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
.lista-clas li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .4rem; padding: .5rem; border: 1px solid #b68a48; border-radius: 8px; background: #fffdf6; }
.txt { font-weight: 600; }
.grupos { display: flex; flex-wrap: wrap; gap: .35rem; }
.g { text-align: center; min-height: 40px; font-size: .9rem; }
.acciones { display: flex; gap: .5rem; margin-top: .6rem; }
.b-pri, .b-sec { min-height: 44px; padding: 0 1rem; border-radius: 8px; cursor: pointer; font-weight: 700; }
.b-pri { color: #2a1d08; background: #ffe09a; border: 1px solid #b68a48; }
.b-pri:disabled { opacity: .45; }
.b-sec { color: #4a2f14; background: transparent; border: 1px solid #b68a48; }
.retro { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem .5rem; margin-top: .8rem; padding: .6rem .75rem; border-radius: 8px; line-height: 1.4; animation: entrar-retro 280ms cubic-bezier(.2, 1.3, .4, 1) backwards; }
@keyframes entrar-retro { from { opacity: 0; translate: 0 8px; } }
.retro.bien { background: #dff0e2; border: 1px solid #2e7d4f; }
.retro.fallo { background: #f6e8c8; border: 1px solid #b68a48; }
.retro .b-sec { margin-left: auto; }
@media (prefers-reduced-motion: reduce) {
  .op, .ficha, .palabra, .g, .retro { transition: none; animation: none; }
}
</style>
