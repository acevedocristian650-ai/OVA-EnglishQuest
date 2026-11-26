<!-- Laboratorio 3 · «El telar de will».
     1) Telar: will NO cambia con el sujeto; se niega con not / won't y se pregunta poniéndolo al inicio. Con «Comparar» se ve
        al lado la misma idea con be going to, para notar qué cambia y qué no.
     2) Trampas: errores típicos con will.
     3) Duelo de futuros: situaciones en las que conviene will, be going to o ambos. No hay una regla mágica: cuenta la intención
        (decisión en el momento, plan previo, evidencia presente u opinión) y a veces las dos formas son posibles. -->
<template>
  <div class="lab">
    <div class="modos" role="tablist" :aria-label="t('Experimentos')">
      <button v-for="m in MODOS" :key="m.id" type="button" role="tab" :aria-selected="modo === m.id" :class="{ act: modo === m.id }" @click="modo = m.id">{{ m.icono }} {{ t(m.nombre) }}</button>
    </div>

    <template v-if="modo !== 'duelo'">
      <div class="grupo" role="group" :aria-label="t('Sujeto')">
        <button v-for="x in SUJETOS" :key="x.en" type="button" class="chip" :aria-pressed="sujeto === x.en" @click="sujeto = x.en">{{ x.en }}</button>
      </div>
      <div v-if="modo === 'telar'" class="grupo" role="group" :aria-label="t('Forma')">
        <button v-for="f in FORMAS" :key="f.id" type="button" class="chip forma" :aria-pressed="forma === f.id" @click="forma = f.id">{{ t(f.nombre) }}</button>
        <button type="button" class="chip forma" :aria-pressed="comparar" @click="comparar = !comparar">⚖ {{ t('Comparar con be going to') }}</button>
      </div>
      <div class="controles">
        <label>{{ t('Verbo') }}<select v-model="verbo"><option v-for="x in VERBOS" :key="x.base" :value="x.base">{{ x.base }} {{ x.resto }}</option></select></label>
        <label>{{ t('Idea') }}<select v-model="idea"><option v-for="x in IDEAS" :key="x.id" :value="x.id">{{ t(x.nombre) }}</option></select></label>
      </div>

      <BibliotecaLabFichas :fichas="modo === 'trampas' && error ? fichasError : fichasWill" :etiqueta="t('Oración con will')" />
      <template v-if="modo === 'telar' && comparar">
        <p class="etq">{{ t('La misma idea con be going to:') }}</p>
        <BibliotecaLabFichas :fichas="fichasGoing" :etiqueta="t('Oración con be going to')" />
        <p class="porque" role="status">{{ t('Observa: am / is / are cambia con el sujeto; will no cambia nunca.') }}</p>
      </template>
      <p v-else-if="modo === 'telar'" class="porque" role="status">{{ t(IDEAS.find((x) => x.id === idea).porque) }}</p>

      <div v-if="modo === 'trampas'" class="trampas">
        <p>{{ t('Provoca un error común y descubre por qué falla:') }}</p>
        <div class="grupo">
          <button v-for="e in ERRORES" :key="e.id" type="button" class="chip mal" :aria-pressed="error === e.id" @click="error = error === e.id ? '' : e.id">{{ t(e.nombre) }}</button>
        </div>
        <p v-if="error" class="porque" role="status">⚠ {{ t(ERRORES.find((e) => e.id === error).porque) }} <button type="button" class="chip" @click="error = ''">🛠 {{ t('Arreglar') }}</button></p>
      </div>
    </template>

    <div v-else class="duelo">
      <p class="avance">{{ t('Escenario') }} {{ n + 1 }} / {{ ESCENARIOS.length }}</p>
      <p class="escena"><span aria-hidden="true">{{ esc.emoji }}</span> <span lang="en">{{ esc.contexto }}</span></p>
      <p class="hueco" lang="en">{{ esc.frase }}</p>
      <div class="grupo" role="group" :aria-label="t('¿Qué forma encaja?')">
        <button v-for="o in OPCIONES" :key="o.id" type="button" class="chip opcion" :class="{ ok: respondido && esc.mejor.includes(o.id), no: respondido && elegida === o.id && !esc.mejor.includes(o.id) }" :disabled="respondido" lang="en" @click="elegir(o.id)">{{ o.txt }}</button>
      </div>
      <div v-if="respondido" class="porque" role="status">
        <strong>{{ esc.mejor.includes(elegida) ? '✔' : '✎' }} {{ esc.mejor.length === 2 ? t('Aquí caben las dos formas, con matices distintos.') : t('Mejor opción:') + ' ' + OPCIONES.find((o) => o.id === esc.mejor[0]).txt }}</strong>
        <p>{{ t(esc.porque) }}</p>
        <button type="button" class="chip" @click="siguiente">{{ n + 1 < ESCENARIOS.length ? t('Siguiente') + ' ▶' : t('Empezar de nuevo') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const { t } = useLanguage()
const MODOS = [{ id: 'telar', nombre: 'Telar', icono: '🧵' }, { id: 'trampas', nombre: 'Trampas', icono: '🪤' }, { id: 'duelo', nombre: 'Duelo de futuros', icono: '⚖️' }]
const SUJETOS = [
  { en: 'I', be: 'am' }, { en: 'you', be: 'are' }, { en: 'he', be: 'is' }, { en: 'she', be: 'is' }, { en: 'it', be: 'is' },
  { en: 'we', be: 'are' }, { en: 'they', be: 'are' }, { en: 'the storm', be: 'is' }
]
const FORMAS = [{ id: 'afirmativa', nombre: 'Afirmativa' }, { id: 'negativa', nombre: 'Negativa' }, { id: 'corta', nombre: "Won't" }, { id: 'pregunta', nombre: 'Pregunta' }]
const VERBOS = [
  { base: 'help', resto: 'you', s: 'helps' }, { base: 'return', resto: 'tomorrow', s: 'returns' }, { base: 'protect', resto: 'the village', s: 'protects' }, { base: 'arrive', resto: 'soon', s: 'arrives' }
]
const IDEAS = [
  { id: 'libre', nombre: 'Libre', pre: '', porque: 'Will tiene la misma forma con todos los sujetos y el verbo siguiente va en forma base.' },
  { id: 'promesa', nombre: 'Promesa', pre: 'I promise', porque: 'Con una promesa te comprometes a hacer algo: will + verbo base.' },
  { id: 'opinion', nombre: 'Opinión sobre el futuro', pre: 'I think', porque: 'Con I think, will expresa lo que crees que pasará, aunque no tengas pruebas todavía.' }
]
const ERRORES = [
  { id: 'will-s', nombre: 'Will con -s', porque: 'Will no cambia con he, she o it: nunca lleva -s.' },
  { id: 'verbo-s', nombre: 'Verbo con -s', porque: 'Después de will el verbo va en forma base: no se le añade -s.' },
  { id: 'to', nombre: 'Will to', porque: 'Will no se usa con to: will + verbo base.' },
  { id: 'pasado', nombre: 'Verbo en pasado', porque: 'Después de will no se usa el pasado: el verbo va en forma base.' }
]
const OPCIONES = [{ id: 'will', txt: 'will' }, { id: 'going', txt: 'be going to' }]
const ESCENARIOS = [
  { emoji: '📞', contexto: 'The phone is ringing. You decide right now.', frase: '“I ___ answer it!”', mejor: ['will'], porque: 'Decides en este instante, sin plan previo: aquí se usa will. Be going to sonaría a un plan que ya tenías.' },
  { emoji: '🎫', contexto: 'Ana bought two tickets last week.', frase: '“She ___ travel on Friday.”', mejor: ['going'], porque: 'El plan ya estaba decidido y preparado: be going to lo muestra mejor. Will no es un error, pero pierde ese matiz de plan previo.' },
  { emoji: '🌧️', contexto: 'Black clouds are right above you.', frase: '“It ___ rain.”', mejor: ['going'], porque: 'Hay evidencia presente (las nubes): be going to es lo natural para predecir con pruebas.' },
  { emoji: '🤔', contexto: 'You have no proof, just your opinion.', frase: '“I think our team ___ win.”', mejor: ['will', 'going'], porque: 'Will es lo habitual cuando das una opinión. Be going to también es posible si te basas en lo que ves del partido.' },
  { emoji: '🤝', contexto: 'Your friend is worried. You offer help.', frase: '“Don’t worry. I ___ help you.”', mejor: ['will'], porque: 'Una promesa o una oferta en el momento pide will.' },
  { emoji: '🚗', contexto: 'A car is coming too fast. Look!', frase: '“Watch out! It ___ crash!”', mejor: ['going'], porque: 'Se ve venir ahora mismo: be going to avisa de lo inminente.' },
  { emoji: '🗺️', contexto: 'A general idea about your future life.', frase: '“Someday I ___ live by the sea.”', mejor: ['will', 'going'], porque: 'Para planes e ideas lejanas, ambas formas son posibles: going to suena más a intención; will, a algo que imaginas o esperas.' }
]
const modo = ref('telar'); const sujeto = ref('he'); const forma = ref('afirmativa'); const comparar = ref(false)
const verbo = ref('help'); const idea = ref('libre'); const error = ref('')
const n = ref(0); const elegida = ref(''); const respondido = ref(false)

const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1)
const s = computed(() => SUJETOS.find((x) => x.en === sujeto.value))
const v = computed(() => VERBOS.find((x) => x.base === verbo.value))
const pre = computed(() => IDEAS.find((x) => x.id === idea.value).pre)
const verboTxt = computed(() => `${v.value.base} ${v.value.resto}`)
const prefijo = (esPregunta) => (pre.value && !esPregunta ? [{ k: 'pre', rol: 'tiempo', txt: pre.value }] : [])
const fichasWill = computed(() => {
  const f = forma.value, suj = f === 'pregunta' || pre.value ? s.value.en : cap(s.value.en)
  if (f === 'pregunta') return [{ k: 'nucleo', rol: 'nucleo', txt: 'Will' }, { k: 'suj', rol: 'suj', txt: suj }, { k: 'verbo', rol: 'verbo', txt: verboTxt.value + '?' }]
  const base = [...prefijo(false), { k: 'suj', rol: 'suj', txt: suj }]
  if (f === 'corta') base.push({ k: 'nucleo', rol: 'nucleo', txt: "won't" })
  else { base.push({ k: 'nucleo', rol: 'nucleo', txt: 'will' }); if (f === 'negativa') base.push({ k: 'not', rol: 'neg', txt: 'not' }) }
  base.push({ k: 'verbo', rol: 'verbo', txt: verboTxt.value + '.' })
  return base
})
const fichasGoing = computed(() => {
  const f = forma.value, suj = f === 'pregunta' || pre.value ? s.value.en : cap(s.value.en), be = s.value.be
  const g = { k: 'nucleo', rol: 'nucleo', txt: 'going to' }, ve = { k: 'verbo', rol: 'verbo', txt: verboTxt.value + (f === 'pregunta' ? '?' : '.') }
  if (f === 'pregunta') return [{ k: 'be', rol: 'be', txt: cap(be) }, { k: 'suj', rol: 'suj', txt: suj }, g, ve]
  const base = [...prefijo(false), { k: 'suj', rol: 'suj', txt: suj }, { k: 'be', rol: 'be', txt: be }]
  if (f === 'negativa') base.push({ k: 'not', rol: 'neg', txt: 'not' })
  if (f === 'corta') base.push({ k: 'not', rol: 'neg', txt: 'not' })
  base.push(g, ve)
  return base
})
const fichasError = computed(() => {
  const suj = { k: 'suj', rol: 'suj', txt: cap(s.value.en) }, fin = '.'
  const r = v.value, resto = r.resto
  if (error.value === 'will-s') return [suj, { k: 'nucleo', rol: 'nucleo', txt: 'wills', mal: true }, { k: 'verbo', rol: 'verbo', txt: `${r.base} ${resto}${fin}` }]
  if (error.value === 'verbo-s') return [suj, { k: 'nucleo', rol: 'nucleo', txt: 'will' }, { k: 'verbo', rol: 'verbo', txt: `${r.s} ${resto}${fin}`, mal: true }]
  if (error.value === 'to') return [suj, { k: 'nucleo', rol: 'nucleo', txt: 'will' }, { k: 'x', rol: 'verbo', txt: 'to', mal: true }, { k: 'verbo', rol: 'verbo', txt: `${r.base} ${resto}${fin}` }]
  const pasado = { help: 'helped', return: 'returned', protect: 'protected', arrive: 'arrived' }[r.base]
  return [suj, { k: 'nucleo', rol: 'nucleo', txt: 'will' }, { k: 'verbo', rol: 'verbo', txt: `${pasado} ${resto}${fin}`, mal: true }]
})
const esc = computed(() => ESCENARIOS[n.value])
function elegir(id) { elegida.value = id; respondido.value = true }
function siguiente() { n.value = (n.value + 1) % ESCENARIOS.length; elegida.value = ''; respondido.value = false }
</script>

<style scoped>
.lab { display: grid; gap: 10px; }
.modos, .grupo { display: flex; flex-wrap: wrap; gap: 6px; }
.modos button, .chip, select { min-height: 44px; border-radius: 10px; border: 1px solid #b68a48; background: #1a2232; color: #fff0cc; font-size: 0.95rem; cursor: pointer; }
.modos button { padding: 6px 12px; font-weight: 700; }
.modos button.act, .chip[aria-pressed='true'] { background: #5a3d12; border-color: #ffe09a; box-shadow: 0 0 0 2px #ffe09a55; }
.chip { padding: 4px 12px; font-family: Georgia, serif; }
.chip.forma { font-family: inherit; font-weight: 700; }
.chip.mal[aria-pressed='true'] { background: #4a1818; border-color: #ff6b5e; }
.chip.opcion { min-width: 120px; font-size: 1.1rem; font-weight: 700; }
.chip.opcion.ok { background: #14351f; border-color: #7fe0a6; }
.chip.opcion.no { background: #3a1616; border-color: #ff6b5e; }
.chip:disabled { cursor: default; }
.controles { display: flex; flex-wrap: wrap; gap: 8px 14px; }
.controles label { display: grid; gap: 2px; font-size: 0.85rem; color: #e3d4bd; }
select { padding: 4px 8px; }
.etq { margin: 0; font-size: 0.85rem; color: #c9c1ae; }
.porque { margin: 0; padding: 8px 10px; border-left: 4px solid #6fd6d6; background: #121a28; border-radius: 6px; font-size: 0.95rem; display: grid; gap: 6px; }
.porque p { margin: 0; }
.trampas p { margin: 0 0 6px; }
.duelo { display: grid; gap: 8px; }
.avance { margin: 0; font-size: 0.8rem; color: #c9c1ae; }
.escena { margin: 0; padding: 8px 10px; border-radius: 10px; background: #121a28; font-weight: 700; }
.hueco { margin: 0; font: 700 clamp(1.1rem, 4.4vw, 1.4rem) Georgia, serif; }
</style>
