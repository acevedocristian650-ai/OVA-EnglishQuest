<!-- Laboratorio 1 · «El río del tiempo». El estudiante MUEVE al caballero por una línea de tiempo: la señal de tiempo, el verbo
     y la regla cambian al instante. Entiende por qué «ago» y «last» miran atrás, y «in», «next» y «tomorrow» miran adelante.
     Reto del cronista: situar al caballero donde corresponde una expresión (sin ver la respuesta hasta comprobar). -->
<template>
  <div class="lab">
    <p class="intro">{{ t('Mueve al caballero por el río del tiempo y mira cómo cambian la señal de tiempo y el verbo.') }}</p>
    <div class="controles">
      <label>{{ t('Quién') }}
        <select v-model="sujeto"><option v-for="s in SUJETOS" :key="s.en" :value="s.en">{{ s.en }}</option></select>
      </label>
      <label>{{ t('Qué hace') }}
        <select v-model="accion"><option v-for="a in ACCIONES" :key="a.base" :value="a.base">{{ a.base }}</option></select>
      </label>
    </div>

    <div class="rio" :class="zona">
      <span class="orilla pasado">◀ {{ t('Pasado') }}</span><span class="orilla ahora">{{ t('Ahora') }}</span><span class="orilla futuro">{{ t('Futuro') }} ▶</span>
      <div class="cauce" aria-hidden="true">
        <i v-for="(p, i) in PASOS" :key="i" class="marca" :class="{ act: i === idx }" :style="{ left: pos(i) + '%' }" />
        <span class="caballero" :style="{ left: pos(idx) + '%' }">♞</span>
      </div>
    </div>
    <input v-model.number="idx" class="deslizador" type="range" min="0" :max="PASOS.length - 1" step="1"
      :aria-label="t('Momento en el tiempo')" :aria-valuetext="retoActivo && !comprobado ? t('oculto') : paso.en">
    <div class="pasos">
      <button type="button" :disabled="idx === 0" @click="idx--">◀ {{ t('Antes') }}</button>
      <button type="button" :disabled="idx === PASOS.length - 1" @click="idx++">{{ t('Después') }} ▶</button>
    </div>

    <div class="resultado" role="status" aria-live="polite">
      <template v-if="retoActivo && !comprobado">
        <p class="expr" lang="en">«{{ objetivo.en }}» <small>{{ t('¿Dónde va? Coloca al caballero y comprueba.') }}</small></p>
      </template>
      <template v-else>
        <p class="expr" lang="en"><mark>{{ paso.en }}</mark> <small>{{ t(paso.es) }}</small></p>
        <BibliotecaLabFichas v-if="fichas.length" :fichas="fichas" :etiqueta="t('Oración')" />
        <p class="regla" :class="zona">{{ regla }}</p>
      </template>
    </div>

    <div class="reto">
      <button v-if="!retoActivo" type="button" class="b-lab" @click="nuevoReto">🎯 {{ t('Reto del cronista') }}</button>
      <template v-else>
        <button type="button" class="b-lab" :disabled="comprobado" @click="comprobar">✔ {{ t('Comprobar') }}</button>
        <button type="button" class="b-lab sec" @click="nuevoReto">↻ {{ t('Otro reto') }}</button>
        <button type="button" class="b-lab sec" @click="retoActivo = false">{{ t('Salir del reto') }}</button>
        <p v-if="comprobado" class="veredicto" :class="acierto ? 'ok' : 'no'" role="status">
          {{ acierto ? t('¡Exacto! Esa señal apunta ahí.') : t('Casi: esa señal apunta a otro momento. Mira dónde quedó el caballero.') }}
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
const { t } = useLanguage()
const SUJETOS = [{ en: 'I', be: 'am' }, { en: 'you', be: 'are' }, { en: 'he', be: 'is' }, { en: 'she', be: 'is' }, { en: 'we', be: 'are' }, { en: 'they', be: 'are' }, { en: 'the knight', be: 'is' }]
const ACCIONES = [
  { base: 'visit the castle', pasado: 'visited the castle' }, { base: 'cook dinner', pasado: 'cooked dinner' },
  { base: 'cross the bridge', pasado: 'crossed the bridge' }, { base: 'open the gate', pasado: 'opened the gate' }
]
// d = distancia en días respecto a hoy; clave = la palabra que delata el tiempo
const PASOS = [
  { d: -30, en: 'last month', es: 'el mes pasado', clave: 'last' }, { d: -14, en: 'two weeks ago', es: 'hace dos semanas', clave: 'ago' },
  { d: -7, en: 'last week', es: 'la semana pasada', clave: 'last' }, { d: -3, en: 'three days ago', es: 'hace tres días', clave: 'ago' },
  { d: -2, en: 'two days ago', es: 'hace dos días', clave: 'ago' }, { d: -1, en: 'yesterday', es: 'ayer', clave: 'yesterday' },
  { d: 0, en: 'today', es: 'hoy', clave: '' }, { d: 0.5, en: 'tonight', es: 'esta noche', clave: 'tonight' },
  { d: 1, en: 'tomorrow', es: 'mañana', clave: 'tomorrow' }, { d: 2, en: 'in two days', es: 'dentro de dos días', clave: 'in' },
  { d: 3, en: 'in three days', es: 'dentro de tres días', clave: 'in' }, { d: 7, en: 'next week', es: 'la próxima semana', clave: 'next' },
  { d: 14, en: 'in two weeks', es: 'dentro de dos semanas', clave: 'in' }, { d: 30, en: 'next month', es: 'el próximo mes', clave: 'next' }
]
const sujeto = ref('she')
const accion = ref('visit the castle')
const idx = ref(8)
const retoActivo = ref(false); const comprobado = ref(false); const objetivoIdx = ref(8)
const objetivo = computed(() => PASOS[objetivoIdx.value])

const paso = computed(() => PASOS[idx.value])
const zona = computed(() => (paso.value.d < 0 ? 'pasado' : paso.value.d > 0 ? 'futuro' : 'ahora'))
const pos = (i) => (i / (PASOS.length - 1)) * 100
const fichas = computed(() => {
  const s = SUJETOS.find((x) => x.en === sujeto.value)
  const a = ACCIONES.find((x) => x.base === accion.value)
  const nombre = s.en === 'I' ? 'I' : s.en
  const cap = nombre.charAt(0).toUpperCase() + nombre.slice(1)
  if (paso.value.d === 0) return []
  if (paso.value.d > 0) return [{ k: 'suj', rol: 'suj', txt: cap }, { k: 'be', rol: 'be', txt: s.be }, { k: 'nucleo', rol: 'nucleo', txt: 'going to' }, { k: 'verbo', rol: 'verbo', txt: a.base }, { k: 'tiempo', rol: 'tiempo', txt: paso.value.en + '.' }]
  return [{ k: 'suj', rol: 'suj', txt: cap }, { k: 'verbo', rol: 'verbo', txt: a.pasado }, { k: 'tiempo', rol: 'tiempo', txt: paso.value.en + '.' }]
})
const regla = computed(() => {
  const c = paso.value.clave
  if (zona.value === 'ahora') return t('Hoy es el punto de partida. Mueve al caballero a la izquierda (pasado) o a la derecha (futuro).')
  if (zona.value === 'futuro') return t('Futuro: la señal mira adelante y el plan se dice con am / is / are + going to + verbo.') + (c === 'in' ? ' ' + t('«In» + tiempo = dentro de…') : '')
  return t('Pasado: la señal mira atrás y el verbo va en pasado. Aquí no se usa going to.') + (c === 'ago' ? ' ' + t('«Ago» va al final: hace…') : '')
})
const acierto = computed(() => idx.value === objetivoIdx.value)
function nuevoReto() {
  const otros = PASOS.map((p, i) => i).filter((i) => i !== objetivoIdx.value && PASOS[i].d !== 0)
  objetivoIdx.value = otros[Math.floor(Math.random() * otros.length)]
  retoActivo.value = true; comprobado.value = false
  idx.value = PASOS.findIndex((p) => p.d === 0)
}
function comprobar() { comprobado.value = true }
</script>

<style scoped>
.lab { display: grid; gap: 10px; }
.intro { margin: 0; }
.controles { display: flex; flex-wrap: wrap; gap: 8px 14px; }
.controles label { display: grid; gap: 2px; font-size: 0.85rem; color: #e3d4bd; }
select { min-height: 44px; padding: 4px 8px; border-radius: 8px; background: #1a2232; color: #fff0cc; border: 1px solid #b68a48; font-size: 1rem; }
.rio { position: relative; padding: 6px 4px 2px; border-radius: 12px; background: linear-gradient(90deg, #3a2430, #1b2a4a 50%, #1f3a35); }
.rio.pasado .pasado, .rio.futuro .futuro, .rio.ahora .ahora { color: #ffe09a; font-weight: 800; }
.orilla { display: inline-block; width: 33%; font-size: 0.8rem; color: #c9c1ae; }
.orilla.ahora { text-align: center; } .orilla.futuro { text-align: right; }
.cauce { position: relative; height: 54px; margin: 4px 18px 6px; border-bottom: 3px solid #b68a48; }
.marca { position: absolute; bottom: -6px; width: 2px; height: 12px; background: #8c7a55; transform: translateX(-50%); }
.marca.act { background: #ffe09a; height: 18px; }
.caballero { position: absolute; bottom: 4px; transform: translateX(-50%); font-size: 2.2rem; line-height: 1; color: #ffe09a; transition: left 0.45s cubic-bezier(0.3, 1.2, 0.5, 1); filter: drop-shadow(0 2px 4px #000); }
.deslizador { width: 100%; min-height: 44px; accent-color: #e6b96e; }
.pasos { display: flex; gap: 8px; justify-content: space-between; }
button { min-height: 44px; padding: 6px 14px; border-radius: 10px; border: 1px solid #b68a48; background: #1a2232; color: #fff0cc; font-weight: 700; cursor: pointer; }
button:disabled { opacity: 0.45; cursor: default; }
.resultado { display: grid; gap: 8px; padding: 10px; border-radius: 12px; background: #121a28; border: 1px solid #3d3322; }
.expr { margin: 0; font: 700 clamp(1.1rem, 4.4vw, 1.5rem) Georgia, serif; }
.expr mark { padding: 0 6px; border-radius: 6px; background: #ffe09a; color: #1a1408; }
.expr small { font: 400 0.85rem system-ui, sans-serif; color: #c9c1ae; margin-left: 6px; }
.regla { margin: 0; padding: 6px 10px; border-left: 4px solid #8c7a55; font-size: 0.95rem; }
.regla.futuro { border-color: #6fd6d6; } .regla.pasado { border-color: #ff9b8a; }
.reto { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.b-lab { background: #5a3d12; }
.b-lab.sec { background: #1a2232; }
.veredicto { flex-basis: 100%; margin: 0; padding: 6px 10px; border-radius: 8px; }
.veredicto.ok { background: #14351f; color: #bff0cf; } .veredicto.no { background: #3a2a12; color: #ffe3b0; }
@media (prefers-reduced-motion: reduce) { .caballero { transition: none; } }
</style>
