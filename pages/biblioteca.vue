<!--
  biblioteca.vue - «Biblioteca del reino» (apartado Contenidos). Una sola ruta para todo el OVA.
  Parámetros: ?tema=N (qué temática abrir), ?desde=menu|mision|mapa y ?mision=N (para regresar al mismo punto).
  Reglas, ejemplos y vocabulario salen de data/lecciones.json (las lecciones que antes se mostraban antes de cada
  batalla); lo nuevo (errores, actividades, recursos) sale de data/contenidos.json.
-->
<template>
  <div class="biblioteca">
    <AudioMusicaHome ruta="/audio/Mapa.mp3" :volumen="0.35" />
    <header class="cabecera">
      <AudioSonidoBoton @click="regresar">
        <button type="button" class="volver">← {{ t(textoRegreso) }}</button>
      </AudioSonidoBoton>
      <h1>{{ t('Biblioteca del reino') }}</h1>
      <UiOpcionesRapidas />
    </header>

    <nav class="temas" :aria-label="t('Temáticas')">
      <button v-for="tm in temas" :key="tm.nivel" type="button" class="tema" :class="{ activo: actual === tm.nivel }" :aria-current="actual === tm.nivel ? 'page' : undefined" @click="elegirTema(tm.nivel)">
        <span class="num">{{ tm.nivel }}</span>
        <span class="nom">{{ tm.titulo }}</span>
        <span v-if="consultado(tm.nivel)" class="sello" :title="t('Consultado')">✓</span>
      </button>
      <button type="button" class="tema final" :class="{ activo: actual === 'final' }" @click="elegirTema('final')">
        <span class="num">★</span><span class="nom">{{ t('La última prueba del reino') }}</span>
      </button>
    </nav>

    <div class="cuerpo">
      <main ref="lectura" class="lectura" tabindex="-1">
        <template v-if="tema">
          <h2>{{ tema.titulo }} <small>{{ tema.ambiente }}</small></h2>
          <p class="avance">
            <span :class="{ si: consultado(tema.nivel) }">{{ consultado(tema.nivel) ? '✓ ' + t('Consultado') : t('Sin consultar') }}</span>
            · <span>{{ t('Práctica') }}: {{ superadas(tema.nivel) }} / {{ actividades.length }}</span>
            · <span :class="{ si: estrellas > 0 }">{{ estrellas > 0 ? t('Evaluado en batalla') + ': ' + '★'.repeat(estrellas) : t('Aún sin evaluar en batalla') }}</span>
          </p>

          <div class="secciones" role="tablist" :aria-label="t('Secciones de la temática')">
            <button v-for="s in secciones" :key="s.id" type="button" role="tab" class="seccion" :class="{ activo: seccion === s.id }" :aria-selected="seccion === s.id" @click="seccion = s.id">{{ t(s.nombre) }}</button>
          </div>

          <section v-if="seccion === 'intro'" class="bloque" role="tabpanel">
            <p class="voz">{{ t(leccion.voz) }}</p>
            <p class="destacado">{{ t(leccion.proposito) }}</p>
            <h3>{{ t('En pocas palabras') }}</h3>
            <p>{{ t(leccion.regla) }}</p>
          </section>

          <section v-else-if="seccion === 'reglas'" class="bloque" role="tabpanel">
            <ul class="puntos"><li v-for="(p, i) in leccion.puntos" :key="i">{{ t(p) }}</li></ul>
            <div v-if="leccion.contraste" class="contraste">
              <h3>{{ t(leccion.contraste.titulo) }}</h3>
              <div class="dos">
                <div><strong lang="en">{{ leccion.contraste.a.en }}</strong><p>{{ t(leccion.contraste.a.nota) }}</p></div>
                <div><strong lang="en">{{ leccion.contraste.b.en }}</strong><p>{{ t(leccion.contraste.b.nota) }}</p></div>
              </div>
            </div>
          </section>

          <section v-else-if="seccion === 'ejemplos'" class="bloque" role="tabpanel">
            <ul class="ejemplos">
              <li v-for="(e, i) in leccion.ejemplos" :key="i">
                <div><strong lang="en">{{ e.en }}</strong><span>{{ t(e.es) }}</span></div>
                <button type="button" class="voz-btn" :aria-label="`${t('Escuchar')}: ${e.en}`" @click="escuchar(e.en)">🔊 {{ t('Escuchar') }}</button>
              </li>
            </ul>
            <p v-if="avisoVoz" class="aviso" role="status">{{ t('Tu navegador no ofrece voz. Lee la frase en voz alta:') }} <em lang="en">{{ avisoVoz }}</em></p>
          </section>

          <section v-else-if="seccion === 'errores'" class="bloque" role="tabpanel">
            <ul class="errores">
              <li v-for="(e, i) in tema.errores" :key="i">
                <p class="mal" lang="en"><span aria-hidden="true">✗</span> {{ e.mal }}</p>
                <p class="bien" lang="en"><span aria-hidden="true">✓</span> {{ e.bien }}</p>
                <p class="nota">{{ t(e.nota) }}</p>
              </li>
            </ul>
          </section>

          <section v-else-if="seccion === 'practica'" class="bloque" role="tabpanel">
            <p class="aviso-practica">{{ t('Estas actividades no restan vida ni dan experiencia: son para practicar sin presión.') }}</p>
            <div class="puntitos" role="group" :aria-label="t('Actividades')">
              <button v-for="(a, i) in actividades" :key="a.id" type="button" class="punto" :class="{ activo: i === indiceAct, hecha: practicaDe(tema.nivel)[a.id]?.superada }" :aria-label="`${t('Actividad')} ${i + 1}`" :aria-current="i === indiceAct" @click="indiceAct = i">{{ i + 1 }}</button>
            </div>
            <BibliotecaActividad :key="`${tema.nivel}-${actividades[indiceAct].id}`" :actividad="actividades[indiceAct]" @resuelta="(ok) => registrarPractica(tema.nivel, actividades[indiceAct].id, ok)" />
            <div class="pager">
              <button type="button" class="b-sec" :disabled="indiceAct === 0" @click="indiceAct--">{{ t('Anterior') }}</button>
              <span>{{ indiceAct + 1 }} / {{ actividades.length }}</span>
              <button type="button" class="b-sec" :disabled="indiceAct === actividades.length - 1" @click="indiceAct++">{{ t('Siguiente') }}</button>
            </div>
          </section>

          <section v-else-if="seccion === 'glosario'" class="bloque" role="tabpanel">
            <dl class="glosario">
              <div v-for="(v, i) in leccion.vocabulario" :key="i">
                <dt lang="en">{{ v.en }} <button type="button" class="voz-mini" :aria-label="`${t('Escuchar')}: ${v.en}`" @click="escuchar(v.en)">🔊</button></dt>
                <dd>{{ t(v.es) }}</dd>
              </div>
            </dl>
            <p v-if="avisoVoz" class="aviso" role="status">{{ t('Tu navegador no ofrece voz. Lee la palabra en voz alta:') }} <em lang="en">{{ avisoVoz }}</em></p>
          </section>

          <section class="aplicacion" :aria-label="t('Aplicación')">
            <h3>{{ t('Ponlo a prueba') }}</h3>
            <p v-if="bloqueada">{{ t('Esta batalla aún no está desbloqueada. Completa la zona anterior en el mapa.') }}</p>
            <div class="acciones">
              <button type="button" class="b-pri" :disabled="bloqueada" @click="irMision(tema.nivel)">{{ t('Ir a la misión') }}: {{ tema.ambiente }}</button>
              <button type="button" class="b-sec" @click="irMapa">{{ t('Regresar al mapa') }}</button>
            </div>
          </section>
        </template>

        <!-- Evaluación final: es la MISMA misión del mapa (no se duplica la evaluación) -->
        <template v-else>
          <h2>{{ final.titulo }} <small>{{ t('Evaluación integradora') }}</small></h2>
          <p class="destacado">{{ t(final.descripcion) }}</p>
          <ul class="puntos">
            <li v-for="tm in temas" :key="tm.nivel">{{ t('Fase') }} {{ tm.nivel }}: {{ tm.titulo }}</li>
          </ul>
          <p v-if="!finalDesbloqueada" class="aviso" role="status">{{ t('Se desbloquea al completar las cuatro batallas del mapa.') }} ({{ completadas }} / 4)</p>
          <p v-else-if="resultadoFinal?.aprobada" class="aviso" role="status">{{ t('Evaluación aprobada') }}: {{ Math.round((resultadoFinal.mejorPrecision ?? 0) * 100) }} %</p>
          <p v-else-if="resultadoFinal?.intentos" class="aviso" role="status">{{ t('Intentos') }}: {{ resultadoFinal.intentos }} · {{ t('Mejor precisión') }}: {{ Math.round((resultadoFinal.mejorPrecision ?? 0) * 100) }} %</p>
          <div class="acciones">
            <button type="button" class="b-pri" :disabled="!finalDesbloqueada" @click="irMision(5)">{{ t('Ir a la evaluación final') }}</button>
            <button type="button" class="b-sec" @click="irMapa">{{ t('Regresar al mapa') }}</button>
          </div>
        </template>
      </main>

      <!-- Recursos externos: barra lateral en escritorio; panel desplegable en móvil. Nada se carga hasta elegir un recurso. -->
      <aside v-if="tema" class="recursos" :class="{ abierto: panelAbierto }" :aria-label="t('Recursos externos')">
        <button v-if="!escritorio" type="button" class="abrir-panel" :aria-expanded="panelAbierto" @click="panelAbierto = !panelAbierto">
          {{ t('Recursos externos') }} ({{ tema.recursos.length }}) {{ panelAbierto ? '▾' : '▸' }}
        </button>
        <div v-if="escritorio || panelAbierto" class="panel-recursos">
          <h3 v-if="escritorio">{{ t('Recursos externos') }}</h3>
          <p class="nota-red">{{ t('Se abren aquí solo cuando los eliges. Puedes seguir estudiando sin ellos.') }}</p>
          <ul>
            <li v-for="r in tema.recursos" :key="r.id" :class="{ abierto: abierto?.id === r.id }">
              <p class="tipo">{{ t(r.tipo === 'video' ? 'Video' : 'Lectura') }} · {{ r.fuente }}</p>
              <strong lang="en">{{ r.titulo }}</strong>
              <p class="desc">{{ t(r.descripcion) }}</p>
              <div class="acciones">
                <button v-if="r.youtube || r.incrustar" type="button" class="b-pri" @click="abrir(r)">{{ abierto?.id === r.id ? t('Abierto') : t('Abrir aquí') }}</button>
                <a class="b-sec enl" :href="r.url" target="_blank" rel="noopener noreferrer">{{ t('Abrir en pestaña nueva') }} ↗</a>
              </div>
              <BibliotecaVisor v-if="abierto?.id === r.id" :key="r.id" :recurso="r" @cerrar="abierto = null" />
            </li>
          </ul>
          <p class="nota-red">{{ t('Actividades de Educaplay: pendientes de incorporar (ver data/contenidos.json).') }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import contenidos from '~/data/contenidos.json'
import lecciones from '~/data/lecciones.json'

const route = useRoute()
const { t } = useLanguage()
const { loadPreferences } = useGameGraphics()
const store = usePlayerProgress()
const { marcarConsultado, registrarPractica, practicaDe, superadas, consultado } = useBiblioteca()

const temas = contenidos.temas
const final = { titulo: 'La última prueba del reino', descripcion: 'Evaluación integradora: 12 desafíos de inglés repartidos en cuatro fases, una por cada temática. Se juega en el mapa, igual que las demás batallas.' }
const desde = computed(() => String(route.query.desde ?? 'menu'))
const origenMision = computed(() => Number(route.query.mision) || null)
const actual = ref(route.query.tema === 'final' ? 'final' : (Number(route.query.tema) || 1))
const seccion = ref('intro')
const indiceAct = ref(0)
const abierto = ref(null)
const panelAbierto = ref(false)
const escritorio = ref(true)
const lectura = ref(null)
const avisoVoz = ref('')
const secciones = [
  { id: 'intro', nombre: 'Introducción' }, { id: 'reglas', nombre: 'Reglas principales' }, { id: 'ejemplos', nombre: 'Ejemplos' },
  { id: 'errores', nombre: 'Errores frecuentes' }, { id: 'practica', nombre: 'Práctica' }, { id: 'glosario', nombre: 'Glosario' }
]

const tema = computed(() => (actual.value === 'final' ? null : temas.find((x) => x.nivel === actual.value)))
const leccion = computed(() => lecciones.niveles[actual.value])
// Actividades nuevas + el repaso rápido que antes aparecía como pergamino antes de la batalla (se reutiliza, no se duplica).
const actividades = computed(() => !tema.value ? [] : [
  ...tema.value.actividades,
  ...(leccion.value.practica ?? []).map((p, i) => ({ id: `lp${tema.value.nivel}-${i}`, tipo: 'opcion', titulo: 'Repaso del pergamino', instruccion: p.enunciado, opciones: p.opciones, correcta: p.correcta, porque: p.porque }))
])
const progresoNiveles = computed(() => store.estado.progreso.niveles)
const estrellas = computed(() => progresoNiveles.value[actual.value]?.estrellas ?? 0)
const desbloqueado = computed(() => store.estado.progreso.desbloqueado)
const bloqueada = computed(() => tema.value ? tema.value.nivel > desbloqueado.value : true)
const completadas = computed(() => [1, 2, 3, 4].filter((n) => progresoNiveles.value[n]?.completado).length)
const finalDesbloqueada = computed(() => completadas.value >= 4)
const resultadoFinal = computed(() => progresoNiveles.value[5])
const textoRegreso = computed(() => desde.value === 'mision' ? 'Regresar a la misión' : desde.value === 'mapa' ? 'Regresar al mapa' : 'Regresar al menú')

function elegirTema(n) {
  abierto.value = null; panelAbierto.value = false; seccion.value = 'intro'; indiceAct.value = 0; avisoVoz.value = ''
  callar(); actual.value = n
  nextTick(() => lectura.value?.focus?.({ preventScroll: true }))
}
watch(actual, (n) => { if (typeof n === 'number') marcarConsultado(n) }, { immediate: false })
// Si se cambia de sección, también se detiene cualquier recurso abierto y la voz.
watch(seccion, () => { callar(); avisoVoz.value = '' })

function escuchar(texto) { avisoVoz.value = hablar(texto, store.estado.ajustes.volumen.voces) ? '' : texto }
function abrir(r) { abierto.value = r }

function regresar() {
  abierto.value = null
  if (desde.value === 'mision' && origenMision.value) navigateTo(`/map?mision=${origenMision.value}`)
  else if (desde.value === 'mapa') navigateTo('/map')
  else navigateTo('/')
}
function irMision(n) { navigateTo(`/map?mision=${n}`) }
function irMapa() { navigateTo('/map') }

let consulta
function actualizarEscritorio() { escritorio.value = consulta.matches }
onMounted(() => {
  loadPreferences()
  consulta = window.matchMedia('(min-width: 1000px)')
  actualizarEscritorio()
  consulta.addEventListener('change', actualizarEscritorio)
  if (typeof actual.value === 'number') marcarConsultado(actual.value)
})
onBeforeUnmount(() => {
  consulta?.removeEventListener('change', actualizarEscritorio)
  abierto.value = null // desmonta cualquier iframe activo
  callar()
})
useHead({ title: computed(() => `${t('Biblioteca del reino')} · English Quest`) })
</script>

<style scoped>
.biblioteca { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; color: #f1e8d3; background: radial-gradient(ellipse at top, #2a3140, #0f1521 70%); padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); }
.cabecera { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; max-width: 1280px; width: 100%; margin: 0 auto .5rem; }
.cabecera h1 { flex: 1; min-width: 0; margin: 0; color: #ffe09a; font: 700 clamp(1.15rem, 3.5vw, 1.8rem) Georgia, serif; }
.volver { min-height: 44px; padding: 0 .9rem; color: #ffe09a; background: #1b2635cc; border: 1px solid #b3955c; border-radius: 8px; cursor: pointer; font-weight: 600; }
.volver:focus-visible, .tema:focus-visible, .seccion:focus-visible, .punto:focus-visible, .abrir-panel:focus-visible, .voz-btn:focus-visible, .voz-mini:focus-visible, .b-pri:focus-visible, .b-sec:focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }
.temas { display: flex; gap: .45rem; overflow-x: auto; max-width: 1280px; width: 100%; margin: 0 auto .6rem; padding-bottom: 4px; }
.tema { flex: none; display: inline-flex; align-items: center; gap: .45rem; min-height: 44px; padding: 0 .8rem; color: #f1e8d3; background: #1b2635; border: 1px solid #5a6b85; border-radius: 999px; cursor: pointer; font-size: .95rem; }
.tema.activo { border-color: #ffe09a; background: #3a2f1c; color: #ffe09a; }
.tema .num { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #b68a48; color: #1b1308; font-weight: 800; }
.tema .sello { color: #6fcf97; font-weight: 800; }
.cuerpo { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr); gap: .8rem; max-width: 1280px; width: 100%; margin: 0 auto; align-items: start; }
.lectura { min-width: 0; padding: clamp(.8rem, 2.5vw, 1.4rem); border: 1px solid #8f7959; border-radius: 12px; background: #121a28ee; outline: none; font-size: calc(1rem * var(--eq-texto, 1)); }
h2 { margin: 0 0 .3rem; color: #ffe09a; font: 700 clamp(1.3rem, 4vw, 1.9rem) Georgia, serif; }
h2 small { display: block; color: #c4c7cd; font: 500 .8rem system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; }
h3 { margin: .8rem 0 .3rem; color: #ffe09a; font: 700 1.05rem Georgia, serif; }
.avance { margin: .3rem 0 .8rem; color: #c4c7cd; font-size: .88rem; }
.avance .si { color: #8fe0b0; }
.secciones { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .9rem; }
.seccion { min-height: 44px; padding: 0 .85rem; color: #f1e8d3; background: transparent; border: 1px solid #5a6b85; border-radius: 8px; cursor: pointer; }
.seccion.activo { background: #3a2f1c; border-color: #ffe09a; color: #ffe09a; font-weight: 700; }
.bloque { line-height: 1.55; }
.voz { margin: 0 0 .5rem; color: #c4c7cd; font-style: italic; }
.destacado { margin: 0 0 .5rem; padding: .7rem .9rem; border-left: 4px solid #e8bd71; background: #ffffff0d; font-size: 1.08em; }
.puntos { margin: 0 0 .8rem; padding-left: 1.2rem; display: grid; gap: .45rem; }
.contraste { padding: .7rem; border: 1px solid #5a6b85; border-radius: 8px; }
.contraste h3 { margin-top: 0; }
.dos { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.dos p { margin: .2rem 0 0; font-size: .92em; }
.ejemplos { display: grid; gap: .6rem; margin: 0; padding: 0; list-style: none; }
.ejemplos li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; padding: .7rem .8rem; border: 1px solid #5a6b85; border-radius: 8px; background: #ffffff08; }
.ejemplos li div { display: grid; gap: .15rem; }
.ejemplos span { color: #c4c7cd; }
.voz-btn { min-height: 44px; padding: 0 .8rem; color: #ffe09a; background: transparent; border: 1px solid #b3955c; border-radius: 8px; cursor: pointer; }
.voz-mini { min-width: 44px; min-height: 44px; margin-left: .3rem; background: transparent; border: 1px solid #b3955c; border-radius: 8px; color: #ffe09a; cursor: pointer; }
.aviso { padding: .5rem .7rem; border: 1px solid #b3955c; border-radius: 6px; background: #1b2635; }
.errores { display: grid; gap: .7rem; margin: 0; padding: 0; list-style: none; }
.errores li { padding: .7rem .8rem; border: 1px solid #5a6b85; border-radius: 8px; }
.errores p { margin: .15rem 0; }
.mal { color: #ff9d90; } .bien { color: #8fe0b0; } .nota { color: #e5dcc7; font-size: .95em; }
.aviso-practica { margin: 0 0 .6rem; color: #c4c7cd; font-size: .9rem; }
.puntitos { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .7rem; }
.punto { width: 44px; height: 44px; color: #f1e8d3; background: #1b2635; border: 1px solid #5a6b85; border-radius: 50%; cursor: pointer; font-weight: 700; }
.punto.hecha { border-color: #6fcf97; color: #8fe0b0; }
.punto.activo { background: #3a2f1c; border-color: #ffe09a; color: #ffe09a; }
.pager { display: flex; align-items: center; justify-content: space-between; margin-top: .7rem; }
.glosario { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: .5rem; margin: 0; }
.glosario > div { padding: .6rem .8rem; border: 1px solid #5a6b85; border-radius: 8px; }
.glosario dt { color: #ffe09a; font-weight: 700; }
.glosario dd { margin: .15rem 0 0; color: #e5dcc7; }
.aplicacion { margin-top: 1.2rem; padding-top: .6rem; border-top: 1px dashed #8f7959; }
.acciones { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .5rem; }
.b-pri, .b-sec { min-height: 44px; padding: 0 1rem; border-radius: 8px; cursor: pointer; font-weight: 700; font: inherit; font-weight: 700; display: inline-flex; align-items: center; text-decoration: none; }
.b-pri { color: #2a1d08; background: #ffe09a; border: 1px solid #ffe09a; }
.b-pri:disabled { opacity: .45; cursor: default; }
.b-sec { color: #ffe09a; background: transparent; border: 1px solid #b3955c; }
.b-sec:disabled { opacity: .4; cursor: default; }
/* Recursos externos */
.recursos { min-width: 0; }
.abrir-panel { width: 100%; min-height: 48px; padding: 0 1rem; color: #ffe09a; background: #1b2635; border: 1px solid #b3955c; border-radius: 10px; cursor: pointer; font-weight: 700; text-align: left; }
.panel-recursos { margin-top: .5rem; padding: .8rem; border: 1px solid #8f7959; border-radius: 12px; background: #121a28ee; }
.panel-recursos h3 { margin-top: 0; }
.panel-recursos ul { display: grid; gap: .8rem; margin: 0; padding: 0; list-style: none; }
.panel-recursos li { display: grid; gap: .3rem; padding: .6rem; border: 1px solid #5a6b85; border-radius: 8px; }
.tipo { margin: 0; color: #e8bd71; font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; }
.desc { margin: 0; color: #c4c7cd; font-size: .88rem; }
.nota-red { margin: .3rem 0; color: #b9b2a3; font-size: .82rem; }
.enl { font-size: .88rem; }
@media (min-width: 1000px) {
  .cuerpo { grid-template-columns: minmax(0, 1fr) 360px; }
  .recursos { position: sticky; top: 8px; max-height: calc(100dvh - 24px); overflow-y: auto; }
  .panel-recursos { margin-top: 0; }
}
/* Móvil: el panel de recursos se abre como una hoja inferior que no reduce el espacio de lectura */
@media (max-width: 999px) {
  .recursos.abierto .panel-recursos { position: fixed; left: 8px; right: 8px; bottom: max(8px, env(safe-area-inset-bottom)); z-index: 30; max-height: 72dvh; overflow-y: auto; margin: 0; box-shadow: 0 -8px 30px #000c; }
  .recursos { position: sticky; bottom: 4px; z-index: 31; }
  .recursos.abierto .abrir-panel { position: fixed; left: 8px; right: 8px; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 72dvh + 4px); width: auto; z-index: 32; }
}
@media (max-width: 520px) { .dos { grid-template-columns: 1fr; } .rel { grid-template-columns: 1fr 1fr; } }
</style>
