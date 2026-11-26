<!-- Laboratorio 4 · «La calle viva» (señales y normas).
     1) Calle: el estudiante elige una señal, lee su norma en inglés y DECIDE qué hace el jinete. Si se equivoca, el jinete lo paga
        en la escena (se choca) y se explica por qué; si acierta, cruza o se detiene como corresponde.
     2) Taller de normas: convierte una orden en prohibición con Do not (y viceversa) y observa qué ficha cambia. -->
<template>
  <div class="lab">
    <div class="modos" role="tablist" :aria-label="t('Experimentos')">
      <button v-for="m in MODOS" :key="m.id" type="button" role="tab" :aria-selected="modo === m.id" :class="{ act: modo === m.id }" @click="modo = m.id">{{ m.icono }} {{ t(m.nombre) }}</button>
    </div>

    <template v-if="modo === 'calle'">
      <div class="grupo" role="group" :aria-label="t('Señales')">
        <button v-for="x in SENALES" :key="x.id" type="button" class="senal" :aria-pressed="senal === x.id" :aria-label="x.alt" @click="elegirSenal(x.id)">
          <img v-if="x.img" :src="x.img" alt="" width="34" height="34" />
          <span v-else-if="x.luz" class="luz" :class="x.luz" aria-hidden="true" />
          <span v-else aria-hidden="true">{{ x.emoji }}</span>
          <small lang="en">{{ x.nombre }}</small>
        </button>
      </div>

      <div class="calle" :class="estado" role="img" :aria-label="t(descripcionEscena)">
        <span class="linea-parada" aria-hidden="true" />
        <span class="obstaculo" aria-hidden="true">{{ cur.obstaculo }}</span>
        <span class="jinete" :style="{ left: posicion + '%' }" aria-hidden="true">🏇</span>
      </div>

      <div class="norma" role="status">
        <p class="regla" lang="en">“{{ cur.regla }}” <small>{{ t(cur.es) }}</small></p>
        <p class="pregunta">{{ t('¿Qué hace el jinete?') }}</p>
        <div class="grupo">
          <button v-for="a in ACCIONES" :key="a.id" type="button" class="chip" :disabled="!!estado && estado !== 'espera'" @click="actuar(a.id)">{{ a.icono }} {{ t(a.nombre) }}</button>
          <button v-if="estado && estado !== 'espera'" type="button" class="chip" @click="reiniciar">↺ {{ t('Probar otra vez') }}</button>
        </div>
        <p v-if="veredicto" class="veredicto" :class="estado" role="status">{{ veredicto }}</p>
      </div>
    </template>

    <template v-else>
      <div class="grupo" role="group" :aria-label="t('Tipo de norma')">
        <button type="button" class="chip forma" :aria-pressed="!prohibe" @click="prohibe = false">{{ t('Orden') }}</button>
        <button type="button" class="chip forma" :aria-pressed="prohibe" @click="prohibe = true">⛔ {{ t('Prohibición') }}</button>
      </div>
      <div class="controles">
        <label>{{ t('Acción') }}<select v-model="accionTaller"><option v-for="x in TALLER" :key="x.v" :value="x.v">{{ x.v }} {{ x.resto }}</option></select></label>
      </div>
      <BibliotecaLabFichas :fichas="fichasTaller" :etiqueta="t('Norma')" />
      <p class="porque" role="status">{{ prohibe ? t('Prohibición: Do not + verbo base. La orden normal empieza directamente con el verbo.') : t('Orden: empieza con el verbo base, sin sujeto. Prueba con «Prohibición».') }}</p>
      <p class="porque" role="status">{{ t(tallerNota) }}</p>
    </template>
  </div>
</template>

<script setup>
const { t } = useLanguage()
const MODOS = [{ id: 'calle', nombre: 'Calle', icono: '🚦' }, { id: 'taller', nombre: 'Taller de normas', icono: '🛠️' }]
const SENALES = [
  { id: 'stop', nombre: 'STOP', img: '/images/signs/stop.svg', alt: 'Señal STOP', obstaculo: '🛑', regla: 'Stop at the line.', es: 'Detente en la línea.', ok: 'detener', porque: 'STOP exige detenerse por completo en la línea, aunque la calle parezca vacía.' },
  { id: 'yield', nombre: 'YIELD', img: '/images/signs/yield.svg', alt: 'Señal YIELD', obstaculo: '🚗', regla: 'Give way to the cars.', es: 'Cede el paso a los autos.', ok: 'ceder', porque: 'YIELD / give way significa ceder el paso: esperas a que pasen los demás y luego sigues.' },
  { id: 'noentry', nombre: 'NO ENTRY', img: '/images/signs/no-entry.svg', alt: 'Señal NO ENTRY', obstaculo: '⛔', regla: 'Do not enter.', es: 'No entres.', ok: 'vuelta', porque: 'NO ENTRY prohíbe entrar: no se espera ni se entra despacio; se busca otro camino.' },
  { id: 'rojo', nombre: 'red light', luz: 'rojo', alt: 'Luz roja', obstaculo: '🚶', regla: 'Stop at the red light.', es: 'Detente en la luz roja.', ok: 'detener', porque: 'Luz roja: detenerse antes del cruce.' },
  { id: 'verde', nombre: 'green light', luz: 'verde', alt: 'Luz verde', obstaculo: '🚶', regla: 'Look both ways, then go.', es: 'Mira a ambos lados y luego avanza.', ok: 'avanzar', porque: 'Luz verde permite avanzar, pero siempre se mira a ambos lados antes de cruzar.' },
  { id: 'cruce', nombre: 'crossing', emoji: '🚸', alt: 'Cruce peatonal', obstaculo: '🧒', regla: 'Give way to people on the crossing.', es: 'Cede el paso a las personas en el cruce.', ok: 'ceder', porque: 'En un cruce peatonal las personas que cruzan tienen prioridad.' }
]
const ACCIONES = [
  { id: 'avanzar', nombre: 'Avanzar', icono: '➡️' }, { id: 'detener', nombre: 'Detenerse', icono: '✋' },
  { id: 'ceder', nombre: 'Ceder el paso', icono: '⏳' }, { id: 'vuelta', nombre: 'Dar la vuelta', icono: '↩️' }
]
const TALLER = [
  { v: 'cross', resto: 'the street.', es: 'cruzar la calle', nota: 'Cross the street. = Cruza la calle. · Do not cross the street. = No cruces la calle.' },
  { v: 'park', resto: 'here.', es: 'estacionar aquí', nota: 'Park here. = Estaciona aquí. · Do not park here. = No estaciones aquí.' },
  { v: 'enter', resto: 'now.', es: 'entrar ahora', nota: 'Enter now. = Entra ahora. · Do not enter now. = No entres ahora.' },
  { v: 'run', resto: 'near the road.', es: 'correr cerca de la calle', nota: 'Run near the road. = Corre cerca de la calle. · Do not run near the road. = No corras cerca de la calle.' }
]
const modo = ref('calle'); const senal = ref('stop'); const estado = ref(''); const veredicto = ref(''); const posicion = ref(8)
const prohibe = ref(false); const accionTaller = ref('cross')

const cur = computed(() => SENALES.find((x) => x.id === senal.value))
const descripcionEscena = computed(() => (estado.value === 'choque' ? 'El jinete se chocó' : estado.value === 'bien' ? 'El jinete actuó bien' : 'El jinete espera frente a la señal'))
function reiniciar() { estado.value = ''; veredicto.value = ''; posicion.value = 8 }
function elegirSenal(id) { senal.value = id; reiniciar() }
function actuar(id) {
  const correcto = id === cur.value.ok
  estado.value = correcto ? 'bien' : 'choque'
  // Posiciones: la línea de parada está al 45 %. Avanzar cruza; detenerse/ceder se queda antes; la vuelta retrocede.
  posicion.value = id === 'avanzar' ? 88 : id === 'vuelta' ? 2 : 38
  veredicto.value = (correcto ? '✔ ' : '✖ ' + t('Esa acción no encaja con la norma.') + ' ') + t(cur.value.porque)
}
const tallerActual = computed(() => TALLER.find((x) => x.v === accionTaller.value))
const tallerNota = computed(() => tallerActual.value.nota)
const fichasTaller = computed(() => {
  const x = tallerActual.value
  const verbo = prohibe.value ? x.v : x.v.charAt(0).toUpperCase() + x.v.slice(1)
  return prohibe.value
    ? [{ k: 'do', rol: 'neg', txt: 'Do' }, { k: 'not', rol: 'neg', txt: 'not' }, { k: 'verbo', rol: 'verbo', txt: verbo }, { k: 'resto', rol: 'tiempo', txt: x.resto }]
    : [{ k: 'verbo', rol: 'verbo', txt: verbo }, { k: 'resto', rol: 'tiempo', txt: x.resto }]
})
</script>

<style scoped>
.lab { display: grid; gap: 10px; }
.modos, .grupo { display: flex; flex-wrap: wrap; gap: 6px; }
.modos button, .chip, .senal, select { min-height: 44px; border-radius: 10px; border: 1px solid #b68a48; background: #1a2232; color: #fff0cc; font-size: 0.95rem; cursor: pointer; }
.modos button { padding: 6px 12px; font-weight: 700; }
.modos button.act, .chip[aria-pressed='true'], .senal[aria-pressed='true'] { background: #5a3d12; border-color: #ffe09a; box-shadow: 0 0 0 2px #ffe09a55; }
.chip { padding: 4px 12px; font-weight: 700; }
.chip:disabled { opacity: 0.45; cursor: default; }
.senal { display: grid; justify-items: center; gap: 2px; min-width: 76px; padding: 4px 8px; }
.senal small { font-size: 0.7rem; }
.luz { width: 28px; height: 28px; border-radius: 50%; box-shadow: inset 0 0 6px #0008; }
.luz.rojo { background: #ff4b3e; } .luz.verde { background: #3ed16a; }
.calle { position: relative; height: 96px; border-radius: 12px; background: repeating-linear-gradient(90deg, #2a2f3a 0 40px, #262b35 40px 80px); border: 2px solid #5b4a2e; overflow: hidden; }
.calle::after { content: ''; position: absolute; inset: 50% 0 auto; border-top: 3px dashed #d8c27a66; }
.linea-parada { position: absolute; left: 45%; top: 0; bottom: 0; width: 6px; background: #f3f0e6; }
.obstaculo { position: absolute; left: 62%; top: 50%; transform: translateY(-50%); font-size: 2rem; }
.jinete { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 2.2rem; transition: left 0.7s ease; }
.calle.choque { border-color: #ff5a4d; animation: sacudir 0.4s 2; }
.calle.bien { border-color: #7fe0a6; }
@keyframes sacudir { 0%, 100% { translate: 0; } 25% { translate: -5px; } 75% { translate: 5px; } }
.norma { display: grid; gap: 6px; padding: 10px; border-radius: 12px; background: #121a28; border: 1px solid #3d3322; }
.regla { margin: 0; font: 700 clamp(1.05rem, 4.2vw, 1.35rem) Georgia, serif; }
.regla small { display: block; font: 400 0.85rem system-ui, sans-serif; color: #c9c1ae; }
.pregunta { margin: 0; font-size: 0.9rem; color: #e3d4bd; }
.veredicto { margin: 0; padding: 6px 10px; border-radius: 8px; }
.veredicto.bien { background: #14351f; color: #bff0cf; } .veredicto.choque { background: #3a1616; color: #ffd2cc; }
.controles label { display: grid; gap: 2px; font-size: 0.85rem; color: #e3d4bd; }
select { padding: 4px 8px; }
.porque { margin: 0; padding: 8px 10px; border-left: 4px solid #6fd6d6; background: #121a28; border-radius: 6px; font-size: 0.95rem; }
@media (prefers-reduced-motion: reduce) { .jinete { transition: none; } .calle.choque { animation: none; } }
</style>
