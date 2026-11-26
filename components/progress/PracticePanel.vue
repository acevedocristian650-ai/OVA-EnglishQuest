<template>
  <div class="eq-modal" role="dialog" aria-modal="true" :aria-label="t('Práctica de refuerzo')" @keydown.esc="emit('cerrar')">
    <article class="eq-caja">
      <p class="eq-ceja">{{ t('Práctica de refuerzo') }} · {{ t('sin consecuencias para tu progreso') }}</p>
      <template v-if="!actual">
        <h2>{{ t('Sin actividades pendientes') }}</h2>
        <p>{{ t('No tienes preguntas por reforzar. Sigue jugando para seguir mejorando.') }}</p>
      </template>
      <template v-else>
        <h2 lang="en">{{ actual.pregunta.texto }}</h2>
        <p class="tema">{{ t(actual.item.tema) }} · {{ t('acertar dos veces seguidas la marca como superada') }} ({{ actual.item.aciertosSeguidos }} / 2)</p>

        <!-- Opciones: cortar, escuchar, esquiva-frase, zona -->
        <div v-if="modo === 'opciones'">
          <button v-if="actual.pregunta.tipo === 'escuchar'" type="button" class="eq-btn sec" @click="hablar">{{ t('Escuchar la frase') }}</button>
          <button v-for="o in opciones" :key="o" type="button" class="eq-opcion" lang="en" :disabled="resultado !== null" :class="claseOpcion(o)" @click="resolver(o)">{{ o }}</button>
        </div>

        <!-- Errores: tocar la palabra incorrecta -->
        <div v-else-if="modo === 'errores'" class="eq-fila" lang="en">
          <button v-for="(p, i) in actual.pregunta.frase" :key="i" type="button" class="eq-btn sec" :disabled="resultado !== null"
            @click="resolver(i === actual.pregunta.error ? actual.pregunta.correcta : p)">{{ p }}</button>
        </div>

        <!-- Fichas: ordenar una frase tocando las fichas en orden -->
        <div v-else-if="modo === 'fichas'" lang="en">
          <p class="armada">{{ elegidas.join(' ') || '…' }}</p>
          <div class="eq-fila">
            <button v-for="(f, i) in fichas" :key="i" type="button" class="eq-btn sec" :disabled="usadas.includes(i) || resultado !== null" @click="usadas.push(i); elegidas.push(f)">{{ f }}</button>
          </div>
          <div class="eq-fila" style="margin-top:.5rem">
            <button type="button" class="eq-btn" :disabled="!elegidas.length || resultado !== null" @click="resolverFichas">{{ t('Comprobar') }}</button>
            <button type="button" class="eq-btn sec" :disabled="!elegidas.length || resultado !== null" @click="usadas = []; elegidas = []">{{ t('Borrar') }}</button>
          </div>
        </div>

        <!-- Parejas: tocar una carta de cada columna -->
        <div v-else-if="modo === 'parejas'" class="parejas">
          <div>
            <button v-for="p in izquierda" :key="p" type="button" class="eq-opcion" lang="en" :class="{ bien: hechas.includes(p) }" :disabled="hechas.includes(p) || resultado !== null" @click="izq = p">{{ p }}</button>
          </div>
          <div>
            <button v-for="p in derecha" :key="p" type="button" class="eq-opcion" :class="{ bien: hechasDer.includes(p) }" :disabled="hechasDer.includes(p) || resultado !== null" @click="unir(p)">{{ p }}</button>
          </div>
        </div>

        <!-- Clasificar: cada palabra va al futuro o al pasado -->
        <div v-else-if="modo === 'clasificar'">
          <div v-for="(w, i) in actual.pregunta.palabras" :key="w.texto" class="eq-fila clasif">
            <strong lang="en">{{ w.texto }}</strong>
            <button type="button" class="eq-btn sec" :disabled="resultado !== null" :class="{ activo: clasificadas[i] === true }" @click="clasificadas[i] = true">{{ t('Futuro') }}</button>
            <button type="button" class="eq-btn sec" :disabled="resultado !== null" :class="{ activo: clasificadas[i] === false }" @click="clasificadas[i] = false">{{ t('Pasado') }}</button>
          </div>
          <button type="button" class="eq-btn" style="margin-top:.5rem" :disabled="resultado !== null || clasificadas.some((x) => x === undefined) || clasificadas.length < actual.pregunta.palabras.length" @click="resolverClasificar">{{ t('Comprobar') }}</button>
        </div>

        <p v-if="resultado !== null" role="status" class="retro">
          <strong>{{ resultado ? t('¡Correcto!') : t('Todavía no.') }}</strong>
          {{ t('Respuesta correcta') }}: <span lang="en">{{ actual.pregunta.correcta }}</span>. {{ actual.pregunta.explicacion }}
          <template v-if="superada"><br><b>{{ t('¡Actividad superada! Sale de tu lista de refuerzo.') }}</b></template>
        </p>
        <p v-if="resultado !== null && !resultado && leccion" class="retro"><b>{{ t('Regla para repasar') }}</b> {{ t(leccion.regla) }}</p>
      </template>

      <div class="eq-fila acciones">
        <button v-if="resultado !== null && actual" type="button" class="eq-btn" @click="siguiente">{{ t('Siguiente actividad') }}</button>
        <button type="button" class="eq-btn sec" @click="emit('cerrar')">{{ t('Cerrar') }}</button>
      </div>
    </article>
  </div>
</template>

<script setup>
import nivelesBase from '~/data/niveles.json'
import lecciones from '~/data/lecciones.json'
const emit = defineEmits(['cerrar'])
const { t } = useLanguage()
const progreso = usePlayerProgress()
const SOPORTADAS = ['cortar', 'escuchar', 'esquiva-frase', 'zona', 'errores', 'ordenar', 'proteger-aliado', 'romper-hechizo', 'parejas', 'clasificar']
const cola = ref(Object.entries(progreso.estado.progreso.refuerzo).filter(([, r]) => SOPORTADAS.includes(r.tipo)).map(([clave]) => clave))
const posicion = ref(0)
const resultado = ref(null)
const superada = ref(false)
const usadas = ref([]); const elegidas = ref([]); const izq = ref(null); const hechas = ref([]); const hechasDer = ref([]); const clasificadas = ref([])

// La pregunta de práctica es una variante distinta de la misma ronda (si existe), para no memorizar la respuesta.
const tarea = computed(() => {
  const clave = cola.value[posicion.value]
  const item = clave && progreso.estado.progreso.refuerzo[clave]
  if (!item) return null
  const base = nivelesBase.find((n) => n.numero === item.nivel)?.preguntas[item.indice]
  const familia = base ? [base, ...(base.variantes ?? [])] : []
  const otras = familia.filter((q) => q.texto !== item.texto)
  const pregunta = (otras.length ? otras[Math.floor(Math.random() * otras.length)] : familia.find((q) => q.texto === item.texto)) ?? null
  return pregunta ? { clave, item, pregunta } : null
})
// Congela la pregunta elegida mientras se resuelve (computed se reevalúa al cambiar el refuerzo).
const fija = ref(null)
watch(tarea, (v) => { if (!fija.value && v) fija.value = v }, { immediate: true })
const actual = computed(() => fija.value)
const leccion = computed(() => lecciones.niveles[actual.value?.item.nivel])
const modo = computed(() => {
  const tipo = actual.value?.pregunta.tipo
  if (['cortar', 'escuchar', 'esquiva-frase', 'zona'].includes(tipo)) return 'opciones'
  if (tipo === 'errores') return 'errores'
  if (['ordenar', 'proteger-aliado', 'romper-hechizo'].includes(tipo)) return 'fichas'
  return tipo
})
const opciones = computed(() => {
  const q = actual.value.pregunta
  return q.opciones ?? q.fichas ?? q.zonas?.map((z) => z.texto) ?? []
})
const fichas = computed(() => {
  const q = actual.value.pregunta
  return q.fichas ?? q.nodos ?? q.correcta.replace(/[.!?]$/, '').split(' ').sort(() => Math.random() - 0.5)
})
const izquierda = computed(() => actual.value.pregunta.parejas?.map((p) => p.izq) ?? [])
const derecha = computed(() => [...(actual.value.pregunta.parejas?.map((p) => p.der) ?? [])].sort())
const norm = (x) => x.trim().toLowerCase().replace(/[.?!]+$/, '').replace(/\s+/g, ' ')

function cerrar(acierto) {
  resultado.value = acierto
  superada.value = progreso.registrarRefuerzo(actual.value.clave, acierto)
}
const claseOpcion = (o) => (resultado.value === null ? {} : { bien: norm(o) === norm(actual.value.pregunta.correcta), mal: false })
function resolver(r) { if (resultado.value === null) cerrar(norm(r) === norm(actual.value.pregunta.correcta)) }
function resolverFichas() {
  const q = actual.value.pregunta
  const frase = norm(elegidas.value.join(' '))
  cerrar(frase === norm(q.correcta) || norm([q.antes, ...elegidas.value, q.despues].filter(Boolean).join(' ')) === norm(q.correcta))
}
function unir(derechaPulsada) {
  if (!izq.value) return
  const par = actual.value.pregunta.parejas.find((p) => p.izq === izq.value)
  if (par.der === derechaPulsada) { hechas.value.push(izq.value); hechasDer.value.push(derechaPulsada); izq.value = null; if (hechas.value.length === actual.value.pregunta.parejas.length) cerrar(true) } else cerrar(false)
}
function resolverClasificar() { cerrar(actual.value.pregunta.palabras.every((w, i) => clasificadas.value[i] === w.futuro)) }
function hablar() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const voz = new SpeechSynthesisUtterance(actual.value.pregunta.audio)
  voz.lang = 'en-US'
  window.speechSynthesis.speak(voz)
}
function siguiente() {
  resultado.value = null; superada.value = false; usadas.value = []; elegidas.value = []; izq.value = null; hechas.value = []; hechasDer.value = []; clasificadas.value = []
  fija.value = null
  const restantes = cola.value.filter((k) => progreso.estado.progreso.refuerzo[k])
  cola.value = restantes
  posicion.value = restantes.length ? (posicion.value + 1) % restantes.length : 0
  fija.value = tarea.value
}
onBeforeUnmount(() => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() })
</script>

<style scoped>
.tema { color: #c4c7cd; font-size: .85rem; }
.armada { min-height: 2rem; padding: .4rem; border-bottom: 2px solid #b3955c; font-size: 1.1rem; }
.parejas { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.clasif { margin: .25rem 0; }
.clasif .activo { background: #f2d28c; color: #2b1d0e; }
.retro { margin-top: .6rem; }
.acciones { margin-top: 1rem; justify-content: flex-end; }
</style>
