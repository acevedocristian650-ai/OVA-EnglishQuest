<!-- Laboratorio 2 · «La forja de planes» (be going to).
     1) Forja: cambia sujeto, forma (afirmativa / negativa / pregunta), verbo y tiempo; las fichas se reordenan a la vista.
     2) Trampas: provoca un error típico, míralo marcado y arréglalo.
     3) ¿Plan o evidencia?: situaciones que explican DOS usos reales de be going to. -->
<template>
  <div class="lab">
    <div class="modos" role="tablist" :aria-label="t('Experimentos')">
      <button v-for="m in MODOS" :key="m.id" type="button" role="tab" :aria-selected="modo === m.id" :class="{ act: modo === m.id }" @click="modo = m.id">{{ m.icono }} {{ t(m.nombre) }}</button>
    </div>

    <template v-if="modo !== 'situaciones'">
      <div class="grupo" role="group" :aria-label="t('Sujeto')">
        <button v-for="s in SUJETOS" :key="s.en" type="button" class="chip" :aria-pressed="sujeto === s.en" @click="sujeto = s.en">{{ s.en }}</button>
      </div>
      <div class="grupo" role="group" :aria-label="t('Forma')" v-if="modo === 'forja'">
        <button v-for="f in FORMAS" :key="f.id" type="button" class="chip forma" :aria-pressed="forma === f.id" @click="forma = f.id">{{ t(f.nombre) }}</button>
        <button type="button" class="chip forma" :aria-pressed="corta" :disabled="forma === 'pregunta' || !s.corto" @click="corta = !corta">{{ t('Forma corta') }}</button>
      </div>
      <div class="controles">
        <label>{{ t('Verbo') }}<select v-model="verbo"><option v-for="v in VERBOS" :key="v.base" :value="v.base">{{ v.base }} {{ v.resto }}</option></select></label>
        <label>{{ t('Cuándo') }}<select v-model="cuando"><option v-for="c in CUANDO" :key="c" :value="c">{{ c }}</option></select></label>
      </div>

      <BibliotecaLabFichas :fichas="modo === 'trampas' && error ? fichasError : fichas" :etiqueta="t('Oración')" />
      <p class="receta" lang="en">{{ receta }}</p>

      <div v-if="modo === 'trampas'" class="trampas">
        <p>{{ t('Provoca un error común y descubre por qué falla:') }}</p>
        <div class="grupo">
          <button v-for="e in ERRORES" :key="e.id" type="button" class="chip mal" :aria-pressed="error === e.id" @click="error = error === e.id ? '' : e.id">{{ t(e.nombre) }}</button>
        </div>
        <p v-if="error" class="porque" role="status">⚠ {{ t(porQueError) }} <button type="button" class="chip" @click="error = ''">🛠 {{ t('Arreglar') }}</button></p>
      </div>
      <p v-else class="porque" role="status">{{ nota }}</p>
    </template>

    <ul v-else class="situaciones">
      <li v-for="(x, i) in SITUACIONES" :key="i">
        <button type="button" class="situacion" :aria-expanded="abierta === i" @click="abierta = abierta === i ? -1 : i">
          <span class="emoji" aria-hidden="true">{{ x.emoji }}</span>
          <span class="que" lang="en">{{ x.contexto }}</span>
          <span class="tipo">{{ t(x.tipo) }}</span>
        </button>
        <div v-if="abierta === i" class="solucion" role="status">
          <BibliotecaLabFichas :fichas="x.fichas" :etiqueta="t('Oración')" />
          <p>{{ t(x.porque) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
const { t } = useLanguage()
const MODOS = [{ id: 'forja', nombre: 'Forja', icono: '🔨' }, { id: 'trampas', nombre: 'Trampas', icono: '🪤' }, { id: 'situaciones', nombre: '¿Plan o evidencia?', icono: '🔎' }]
const SUJETOS = [
  { en: 'I', be: 'am', corto: "I'm" }, { en: 'you', be: 'are', corto: "you're" }, { en: 'he', be: 'is', corto: "he's" }, { en: 'she', be: 'is', corto: "she's" },
  { en: 'it', be: 'is', corto: "it's" }, { en: 'we', be: 'are', corto: "we're" }, { en: 'they', be: 'are', corto: "they're" },
  { en: 'the knight', be: 'is', corto: '' }, { en: 'the knights', be: 'are', corto: '' }
]
const FORMAS = [{ id: 'afirmativa', nombre: 'Afirmativa' }, { id: 'negativa', nombre: 'Negativa' }, { id: 'pregunta', nombre: 'Pregunta' }]
const VERBOS = [
  { base: 'cross', resto: 'the bridge', s: 'crosses', ing: 'crossing' }, { base: 'open', resto: 'the gate', s: 'opens', ing: 'opening' },
  { base: 'visit', resto: 'the castle', s: 'visits', ing: 'visiting' }, { base: 'cook', resto: 'dinner', s: 'cooks', ing: 'cooking' }
]
const CUANDO = ['tomorrow', 'tonight', 'next week', 'soon']
const ERRORES = [{ id: 'be', nombre: 'Be equivocado' }, { id: 'verbo', nombre: 'Verbo con -s' }, { id: 'sinbe', nombre: 'Sin am / is / are' }, { id: 'ing', nombre: 'Verbo con -ing' }]
const SITUACIONES = [
  { emoji: '🌧️', contexto: 'Black clouds are over the castle.', tipo: 'Evidencia que ves ahora', porque: 'Ves señales en este momento (nubes negras): predices con be going to.',
    fichas: [{ k: 'a', rol: 'suj', txt: 'It' }, { k: 'b', rol: 'be', txt: 'is' }, { k: 'c', rol: 'nucleo', txt: 'going to' }, { k: 'd', rol: 'verbo', txt: 'rain.' }] },
  { emoji: '🎫', contexto: 'Tom bought the tickets yesterday.', tipo: 'Plan ya decidido', porque: 'La decisión se tomó antes de hablar: es un plan, y se dice con be going to.',
    fichas: [{ k: 'a', rol: 'suj', txt: 'He' }, { k: 'b', rol: 'be', txt: 'is' }, { k: 'c', rol: 'nucleo', txt: 'going to' }, { k: 'd', rol: 'verbo', txt: 'travel' }, { k: 'e', rol: 'tiempo', txt: 'tomorrow.' }] },
  { emoji: '🥛', contexto: 'The glass is at the edge of the table!', tipo: 'Algo a punto de pasar', porque: 'Lo ves venir ahora mismo: se usa be going to para avisar.',
    fichas: [{ k: 'a', rol: 'suj', txt: 'It' }, { k: 'b', rol: 'be', txt: 'is' }, { k: 'c', rol: 'nucleo', txt: 'going to' }, { k: 'd', rol: 'verbo', txt: 'fall!' }] },
  { emoji: '🗓️', contexto: 'We decided: next week we visit the lake.', tipo: 'Plan ya decidido', porque: 'Un plan acordado: sujeto + am / is / are + going to + verbo base.',
    fichas: [{ k: 'a', rol: 'suj', txt: 'We' }, { k: 'b', rol: 'be', txt: 'are' }, { k: 'c', rol: 'nucleo', txt: 'going to' }, { k: 'd', rol: 'verbo', txt: 'visit the lake' }, { k: 'e', rol: 'tiempo', txt: 'next week.' }] }
]
const modo = ref('forja'); const sujeto = ref('she'); const forma = ref('afirmativa'); const corta = ref(false)
const verbo = ref('cross'); const cuando = ref('tomorrow'); const error = ref(''); const abierta = ref(-1)

const s = computed(() => SUJETOS.find((x) => x.en === sujeto.value))
const v = computed(() => VERBOS.find((x) => x.base === verbo.value))
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1)
const verboTxt = computed(() => `${v.value.base} ${v.value.resto}`)
const fichas = computed(() => {
  const suj = s.value.en, be = s.value.be
  if (forma.value === 'pregunta') return [
    { k: 'be', rol: 'be', txt: cap(be) }, { k: 'suj', rol: 'suj', txt: suj }, { k: 'nucleo', rol: 'nucleo', txt: 'going to' },
    { k: 'verbo', rol: 'verbo', txt: verboTxt.value }, { k: 'tiempo', rol: 'tiempo', txt: cuando.value + '?' }]
  const usaCorta = corta.value && s.value.corto
  const base = [{ k: 'suj', rol: 'suj', txt: cap(usaCorta && forma.value === 'afirmativa' ? s.value.corto : suj) }]
  if (forma.value === 'afirmativa') { if (!usaCorta) base.push({ k: 'be', rol: 'be', txt: be }) }
  else if (usaCorta && be !== 'am') base.push({ k: 'be', rol: 'be', txt: be === 'is' ? "isn't" : "aren't" })
  else { if (usaCorta && be === 'am') base[0].txt = "I'm"; else base.push({ k: 'be', rol: 'be', txt: be }); base.push({ k: 'not', rol: 'neg', txt: 'not' }) }
  base.push({ k: 'nucleo', rol: 'nucleo', txt: 'going to' }, { k: 'verbo', rol: 'verbo', txt: verboTxt.value }, { k: 'tiempo', rol: 'tiempo', txt: cuando.value + '.' })
  return base
})
const receta = computed(() => forma.value === 'pregunta' ? 'am / is / are + sujeto + going to + verbo base ?' : forma.value === 'negativa' ? 'sujeto + am / is / are + not + going to + verbo base' : 'sujeto + am / is / are + going to + verbo base')
const nota = computed(() => {
  const be = s.value.be
  const porSujeto = be === 'am' ? t('Con I siempre va am.') : be === 'is' ? t('Con he, she, it y un sustantivo singular va is.') : t('Con you, we, they y un sustantivo plural va are.')
  return porSujeto + ' ' + t('Lo que NO cambia: going to + verbo base (sin -s ni -ing).')
})
const fichasError = computed(() => {
  const suj = cap(s.value.en), be = s.value.be, malBe = be === 'are' ? 'is' : 'are'
  const fin = { k: 'tiempo', rol: 'tiempo', txt: cuando.value + '.' }
  const sujeto0 = { k: 'suj', rol: 'suj', txt: suj }, nuc = { k: 'nucleo', rol: 'nucleo', txt: 'going to' }
  if (error.value === 'be') return [sujeto0, { k: 'be', rol: 'be', txt: malBe, mal: true }, nuc, { k: 'verbo', rol: 'verbo', txt: verboTxt.value }, fin]
  if (error.value === 'sinbe') return [sujeto0, { k: 'be', rol: 'be', txt: '___', mal: true }, nuc, { k: 'verbo', rol: 'verbo', txt: verboTxt.value }, fin]
  if (error.value === 'verbo') return [sujeto0, { k: 'be', rol: 'be', txt: be }, nuc, { k: 'verbo', rol: 'verbo', txt: `${v.value.s} ${v.value.resto}`, mal: true }, fin]
  return [sujeto0, { k: 'be', rol: 'be', txt: be }, nuc, { k: 'verbo', rol: 'verbo', txt: `${v.value.ing} ${v.value.resto}`, mal: true }, fin]
})
const porQueError = computed(() => ({
  be: 'Am, is y are dependen del sujeto: aquí no concuerda.', sinbe: 'Falta el verbo be: be going to necesita am, is o are.',
  verbo: 'Después de going to el verbo va en forma base: no se le añade -s.', ing: 'Going to ya lleva el -ing: el verbo que sigue va en forma base.'
}[error.value] ?? ''))
</script>

<style scoped>
.lab { display: grid; gap: 10px; }
.modos { display: flex; flex-wrap: wrap; gap: 6px; }
.modos button, .chip, .situacion, select { min-height: 44px; border-radius: 10px; border: 1px solid #b68a48; background: #1a2232; color: #fff0cc; font-size: 0.95rem; cursor: pointer; }
.modos button { padding: 6px 12px; font-weight: 700; }
.modos button.act, .chip[aria-pressed='true'] { background: #5a3d12; border-color: #ffe09a; box-shadow: 0 0 0 2px #ffe09a55; }
.grupo { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { padding: 4px 12px; font-family: Georgia, serif; }
.chip.forma { font-family: inherit; font-weight: 700; }
.chip.mal[aria-pressed='true'] { background: #4a1818; border-color: #ff6b5e; }
.chip:disabled { opacity: 0.4; cursor: default; }
.controles { display: flex; flex-wrap: wrap; gap: 8px 14px; }
.controles label { display: grid; gap: 2px; font-size: 0.85rem; color: #e3d4bd; }
select { padding: 4px 8px; }
.receta { margin: 0; font-size: 0.8rem; color: #c9c1ae; font-style: italic; }
.porque { margin: 0; padding: 8px 10px; border-left: 4px solid #6fd6d6; background: #121a28; border-radius: 6px; font-size: 0.95rem; }
.trampas p { margin: 0 0 6px; }
.situaciones { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.situacion { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; width: 100%; padding: 8px 10px; text-align: left; align-items: center; }
.emoji { grid-row: span 2; font-size: 1.8rem; }
.que { font-family: Georgia, serif; font-weight: 700; }
.tipo { font-size: 0.8rem; color: #ffe09a; }
.solucion { padding: 6px 2px; display: grid; gap: 6px; }
.solucion p { margin: 0; }
</style>
