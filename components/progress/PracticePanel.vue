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
          <template v-if="actual.pregunta.tipo === 'escuchar'">
            <button v-if="hayVoz" type="button" class="eq-btn sec" @click="hablar">🔊 {{ t('Escuchar la frase') }}</button>
            <button type="button" class="eq-btn sec" :aria-pressed="verTranscripcion || !hayVoz" @click="verTranscripcion = true">📝 {{ t('Mostrar transcripción') }}</button>
            <p v-if="verTranscripcion || !hayVoz" class="retro" lang="en" role="note"><b>{{ actual.pregunta.audio }}</b>
              <small class="aviso-lectura">{{ t('Con transcripción esta actividad cuenta como lectura con ayuda, no como comprensión auditiva.') }}</small></p>
          </template>
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
          <template v-if="!resultado && razon"><br><b>{{ t('Tu respuesta') }}:</b> <span lang="en">{{ ultimaRespuesta }}</span> — {{ razon }}</template>
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
import { mezclarPregunta, ordenFichas, barajar, bancoOrdenar } from '~/composables/useBarajar.js'
import { bancoPreguntas } from '~/composables/useBancoPreguntas.js'
import lecciones from '~/data/lecciones.json'
const emit = defineEmits(['cerrar'])
const { t } = useLanguage()
const progreso = usePlayerProgress()
const SOPORTADAS = ['cortar', 'escuchar', 'esquiva-frase', 'zona', 'errores', 'ordenar', 'proteger-aliado', 'romper-hechizo', 'parejas', 'clasificar']
const cola = ref(Object.entries(progreso.estado.progreso.refuerzo).filter(([, r]) => SOPORTADAS.includes(r.tipo)).map(([clave]) => clave))
const posicion = ref(0)
const resultado = ref(null)
const superada = ref(false)
const hayVoz = ref(true); const verTranscripcion = ref(false); const ultimaRespuesta = ref('')
const usadas = ref([]); const elegidas = ref([]); const izq = ref(null); const hechas = ref([]); const hechasDer = ref([]); const clasificadas = ref([])

// La práctica usa OTRA variante de la misma ronda (identificada por id permanente), rotando por todas antes de repetir:
// así se comprueba que el estudiante entiende la regla y no solo recuerda una respuesta.
const tarea = computed(() => {
  const clave = cola.value[posicion.value]
  const item = clave && progreso.estado.progreso.refuerzo[clave]
  if (!item) return null
  const sel = bancoPreguntas.elegirParaRefuerzo(item)
  return sel ? { clave, item, pregunta: mezclarPregunta(sel.pregunta) } : null
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
  if (q.tipo === 'ordenar') return bancoOrdenar(q).map((p) => p.texto) // incluye las fichas falsas, como en el combate
  if (q.nodos) return barajar(q.nodos)
  if (q.fichas) return q.fichas
  const palabras = q.correcta.replace(/[.!?]$/, '').split(' ') // romper-hechizo: nunca empieza resuelta
  return ordenFichas(palabras, q.correcta).map((i) => palabras[i])
})
const izquierda = computed(() => actual.value.pregunta.parejas?.map((p) => p.izq) ?? [])
const derecha = computed(() => barajar(actual.value.pregunta.parejas?.map((p) => p.der) ?? []))
const norm = (x) => String(x).trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.?!]+$/, '').replace(/\s+/g, ' ')
const esRespuestaValida = (r, q) => [q.correcta, ...(q.alternativas ?? [])].some(x => norm(r) === norm(x))

// Una actividad de escucha resuelta con transcripción (o sin voz) es lectura con ayuda: no cuenta como evidencia independiente.
const conAyuda = computed(() => actual.value?.pregunta.tipo === 'escuchar' && (verTranscripcion.value || !hayVoz.value))
function cerrar(acierto, respuesta = '') {
  if (resultado.value !== null) return
  resultado.value = acierto
  ultimaRespuesta.value = respuesta
  superada.value = progreso.registrarRefuerzo(actual.value.clave, acierto, actual.value.pregunta.id, conAyuda.value)
}
// Por qué una opción concreta es incorrecta (campo porQue del banco), si existe.
const razon = computed(() => actual.value?.pregunta.porQue?.[ultimaRespuesta.value] ?? '')
const claseOpcion = (o) => (resultado.value === null ? {} : { bien: norm(o) === norm(actual.value.pregunta.correcta), mal: false })
function resolver(r) { if (resultado.value === null) cerrar(esRespuestaValida(r, actual.value.pregunta), r) }
function resolverFichas() {
  const q = actual.value.pregunta
  const frase = norm(elegidas.value.join(' '))
  cerrar(esRespuestaValida(frase, q), elegidas.value.join(' '))
}
function unir(derechaPulsada) {
  if (!izq.value) return
  const par = actual.value.pregunta.parejas.find((p) => p.izq === izq.value)
  if (par.der === derechaPulsada) { hechas.value.push(izq.value); hechasDer.value.push(derechaPulsada); izq.value = null; if (hechas.value.length === actual.value.pregunta.parejas.length) cerrar(true) } else cerrar(false, `${izq.value} = ${derechaPulsada}`)
}
function resolverClasificar() { cerrar(actual.value.pregunta.palabras.every((w, i) => clasificadas.value[i] === w.futuro)) }
function hablar() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') { hayVoz.value = false; return }
  window.speechSynthesis.cancel()
  const voz = new SpeechSynthesisUtterance(actual.value.pregunta.audio)
  voz.lang = 'en-US'
  const id = actual.value?.pregunta.id
  voz.onerror = () => { if (actual.value?.pregunta.id === id) hayVoz.value = false }
  try { window.speechSynthesis.speak(voz) } catch { hayVoz.value = false }
}
function siguiente() {
  resultado.value = null; superada.value = false; verTranscripcion.value = false; ultimaRespuesta.value = ''; usadas.value = []; elegidas.value = []; izq.value = null; hechas.value = []; hechasDer.value = []; clasificadas.value = []
  fija.value = null
  const restantes = cola.value.filter((k) => progreso.estado.progreso.refuerzo[k])
  cola.value = restantes
  posicion.value = restantes.length ? (posicion.value + 1) % restantes.length : 0
  fija.value = tarea.value
}
onMounted(() => { hayVoz.value = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined' })
onBeforeUnmount(() => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() })
</script>

<style scoped>
.tema { color: #c4c7cd; font-size: .85rem; }
.armada { min-height: 2rem; padding: .4rem; border-bottom: 2px solid #b3955c; font-size: 1.1rem; }
.parejas { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.clasif { margin: .25rem 0; }
.clasif .activo { background: #f2d28c; color: #2b1d0e; }
.retro { margin-top: .6rem; }
.aviso-lectura { display: block; color: #e6c98a; margin-top: .2rem; }
.acciones { margin-top: 1rem; justify-content: flex-end; }
</style>
