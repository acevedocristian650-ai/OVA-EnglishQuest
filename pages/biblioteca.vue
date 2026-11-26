<!--
  biblioteca.vue - «Grimorio del Reino» (apartado Contenidos). Una sola ruta para todo el OVA.
  Parámetros: ?tema=N (qué tomo abrir), ?desde=menu|mision|mapa y ?mision=N (para regresar al mismo punto).
  Reglas, ejemplos y vocabulario salen de data/lecciones.json; errores, actividades y recursos de data/contenidos.json.
  Cada temática es un TOMO del grimorio con su guardián: se estudia girando tarjetas, reparando trampas, escuchando conjuros
  y entrenando antes de la batalla. El contenido pedagógico es el mismo; cambia cómo se vive.
-->
<template>
  <div class="grimorio">
    <AudioMusicaHome ruta="/audio/Mapa.mp3" :volumen="0.35" />
    <header class="barra">
      <AudioSonidoBoton @click="regresar">
        <button type="button" class="volver">← {{ t(textoRegreso) }}</button>
      </AudioSonidoBoton>
      <h1><span aria-hidden="true">📖</span> {{ t('Grimorio del Reino') }}</h1>
      <UiOpcionesRapidas />
    </header>

    <div class="mesa">
      <!-- Estantería: un tomo por temática -->
      <nav class="estante" :aria-label="t('Temáticas')">
        <button v-for="tm in temas" :key="tm.nivel" type="button" class="tomo" :class="{ activo: actual === tm.nivel, leido: consultado(tm.nivel) }"
          :aria-current="actual === tm.nivel ? 'page' : undefined" @click="elegirTema(tm.nivel)">
          <span class="medallon"><img :src="`${guardianDe(tm.nivel)}/reposo-lite.webp`" alt="" loading="lazy" decoding="async" /></span>
          <span class="tomo-texto"><small>{{ t('Tomo') }} {{ tm.nivel }}</small><strong>{{ tm.titulo }}</strong></span>
          <span class="tomo-estado" :title="consultado(tm.nivel) ? t('Consultado') : ''">{{ estrellasDe(tm.nivel) ? '★'.repeat(estrellasDe(tm.nivel)) : consultado(tm.nivel) ? '✓' : '' }}</span>
        </button>
        <button type="button" class="tomo final" :class="{ activo: actual === 'final' }" @click="elegirTema('final')">
          <span class="medallon"><span aria-hidden="true">👑</span></span>
          <span class="tomo-texto"><small>{{ t('Tomo final') }}</small><strong>{{ t('La última prueba del reino') }}</strong></span>
          <span class="tomo-estado">{{ finalDesbloqueada ? '' : '🔒' }}</span>
        </button>
      </nav>

      <main ref="lectura" class="pagina" tabindex="-1">
        <template v-if="tema">
          <section class="portada" :style="{ backgroundImage: portada }">
            <img class="portada-guardian" :src="retrato" :alt="base ? `${t('Guardián')}: ${base.guardian}` : ''" decoding="async" />
            <div class="portada-texto">
              <p class="ceja">{{ t('Tomo') }} {{ tema.nivel }} · {{ tema.ambiente }}</p>
              <h2>{{ tema.titulo }}</h2>
              <div class="poder" role="progressbar" :aria-valuenow="poder" aria-valuemin="0" aria-valuemax="100" :aria-label="t('Poder del tomo')">
                <span class="poder-barra"><span :style="{ width: poder + '%' }" /></span>
                <span class="poder-num">⚡ {{ poder }} %</span>
              </div>
              <p class="avance">
                <span :class="{ si: consultado(tema.nivel) }">{{ consultado(tema.nivel) ? '✓ ' + t('Consultado') : t('Sin consultar') }}</span>
                <span>🎯 {{ superadas(tema.nivel) }} / {{ actividades.length }}</span>
                <span :class="{ si: estrellas > 0 }">{{ estrellas > 0 ? '⚔ ' + '★'.repeat(estrellas) : t('Aún sin evaluar en batalla') }}</span>
              </p>
            </div>
          </section>

          <div class="mentor">
            <img class="mentor-img" src="/images/personajes-mate/caballero/reposo-lite.webp" alt="" decoding="async" />
            <p class="burbuja"><em>{{ t(leccion.voz) }}</em> <b>{{ t(leccion.proposito) }}</b></p>
          </div>

          <div class="capitulos" role="tablist" :aria-label="t('Secciones de la temática')">
            <button v-for="s in secciones" :key="s.id" type="button" role="tab" class="capitulo" :class="{ activo: seccion === s.id }" :aria-selected="seccion === s.id" :aria-label="t(s.nombre)" :title="t(s.nombre)" @click="seccion = s.id">
              <span aria-hidden="true">{{ s.icono }}</span><span class="cap-nombre">{{ t(s.nombre) }}</span>
            </button>
          </div>

          <section v-if="seccion === 'intro'" :key="'intro' + actual" class="bloque" role="tabpanel">
            <div class="runa-grande">
              <span class="runa-sello" aria-hidden="true">✦</span>
              <div><h3>{{ t('En pocas palabras') }}</h3><p>{{ t(leccion.regla) }}</p></div>
            </div>
            <p v-if="leccion.guia" class="guia-batalla"><span aria-hidden="true">⚔</span> {{ t(leccion.guia) }}</p>
            <div class="vista-misiones">
              <h3>{{ t('Lo que dominarás') }}</h3>
              <ul><li v-for="(c, i) in tema.mision.conocimientos" :key="i" :style="{ '--i': i }"><span aria-hidden="true">◆</span>{{ t(c) }}</li></ul>
            </div>
          </section>

          <!-- Laboratorio: aprender probando. Cada temática tiene su propio experimento; no afecta a puntos ni estrellas. -->
          <section v-else-if="seccion === 'lab'" :key="'lab' + actual" class="bloque" role="tabpanel">
            <BibliotecaLabTiempo v-if="actual === 1" />
            <BibliotecaLabBeGoingTo v-else-if="actual === 2" />
            <BibliotecaLabWill v-else-if="actual === 3" />
            <BibliotecaLabCalle v-else-if="actual === 4" />
          </section>

          <section v-else-if="seccion === 'reglas'" :key="'reglas' + actual" class="bloque" role="tabpanel">
            <ol class="runas">
              <li v-for="(p, i) in leccion.puntos" :key="i" :style="{ '--i': i }"><b aria-hidden="true">{{ i + 1 }}</b><span>{{ t(p) }}</span></li>
            </ol>
            <div v-if="leccion.contraste" class="versus">
              <h3>{{ t(leccion.contraste.titulo) }}</h3>
              <div class="duelo">
                <div class="lado a"><strong lang="en">{{ leccion.contraste.a.en }}</strong><p>{{ t(leccion.contraste.a.nota) }}</p></div>
                <span class="vs" aria-hidden="true">VS</span>
                <div class="lado b"><strong lang="en">{{ leccion.contraste.b.en }}</strong><p>{{ t(leccion.contraste.b.nota) }}</p></div>
              </div>
            </div>
          </section>

          <section v-else-if="seccion === 'ejemplos'" :key="'ej' + actual" class="bloque" role="tabpanel">
            <p class="pista-bloque">{{ t('Toca un conjuro para ver su significado.') }}</p>
            <ul class="conjuros">
              <li v-for="(e, i) in leccion.ejemplos" :key="i" :style="{ '--i': i }">
                <button type="button" class="carta" :class="{ girada: volteadas['ej' + i] }" :aria-pressed="!!volteadas['ej' + i]" @click="girar('ej' + i)">
                  <span class="cara frente" lang="en"><template v-for="(z, k) in trozos(e.en)" :key="k"><mark v-if="z.clave">{{ z.texto }}</mark><template v-else>{{ z.texto }}</template></template></span>
                  <span class="cara dorso">{{ t(e.es) }}</span>
                </button>
                <button type="button" class="eco" :aria-label="`${t('Escuchar')}: ${e.en}`" @click="escuchar(e.en)">🔊</button>
              </li>
            </ul>
            <p v-if="avisoVoz" class="aviso" role="status">{{ t('Tu navegador no ofrece voz. Lee la frase en voz alta:') }} <em lang="en">{{ avisoVoz }}</em></p>
          </section>

          <section v-else-if="seccion === 'errores'" :key="'er' + actual" class="bloque" role="tabpanel">
            <p class="pista-bloque">{{ t('Cada trampa es un error muy común. Toca para repararla.') }}</p>
            <ul class="trampas">
              <li v-for="(e, i) in tema.errores" :key="i" :class="{ reparada: reparadas[i] }" :style="{ '--i': i }">
                <p class="mal" lang="en"><span aria-hidden="true">{{ reparadas[i] ? '✓' : '✗' }}</span> {{ reparadas[i] ? e.bien : e.mal }}</p>
                <p v-if="reparadas[i]" class="nota">💡 {{ t(e.nota) }}</p>
                <button type="button" class="reparar" @click="reparar(i)">{{ reparadas[i] ? '↺ ' + t('Volver a la trampa') : '🛠 ' + t('Reparar') }}</button>
              </li>
            </ul>
          </section>

          <section v-else-if="seccion === 'practica'" :key="'pr' + actual" class="bloque" role="tabpanel">
            <p class="aviso-practica">{{ t('Estas actividades no restan vida ni dan experiencia: son para practicar sin presión.') }}</p>
            <div class="puntitos" role="group" :aria-label="t('Actividades')">
              <button v-for="(a, i) in actividades" :key="a.id" type="button" class="punto" :class="{ activo: i === indiceAct, hecha: practicaDe(tema.nivel)[a.id]?.superada }" :aria-label="`${t('Actividad')} ${i + 1}`" :aria-current="i === indiceAct" @click="indiceAct = i">{{ practicaDe(tema.nivel)[a.id]?.superada ? '✓' : i + 1 }}</button>
            </div>
            <BibliotecaActividad :key="`${tema.nivel}-${actividades[indiceAct].id}`" :actividad="actividades[indiceAct]" @resuelta="(ok) => registrarPractica(tema.nivel, actividades[indiceAct].id, ok)" />
            <div class="pager">
              <button type="button" class="b-sec" :disabled="indiceAct === 0" @click="indiceAct--">{{ t('Anterior') }}</button>
              <span>{{ indiceAct + 1 }} / {{ actividades.length }}</span>
              <button type="button" class="b-sec" :disabled="indiceAct === actividades.length - 1" @click="indiceAct++">{{ t('Siguiente') }}</button>
            </div>
          </section>

          <section v-else-if="seccion === 'glosario'" :key="'gl' + actual" class="bloque" role="tabpanel">
            <p class="pista-bloque">{{ t('Toca una gema para descubrir su significado.') }}</p>
            <ul class="gemas">
              <li v-for="(v, i) in leccion.vocabulario" :key="i" :style="{ '--i': i }">
                <button type="button" class="gema" :class="{ abierta: volteadas['g' + i] }" :aria-pressed="!!volteadas['g' + i]" @click="girar('g' + i)">
                  <span class="gema-en" lang="en">{{ v.en }}</span>
                  <span class="gema-es">{{ volteadas['g' + i] ? t(v.es) : '✦ ✦ ✦' }}</span>
                </button>
                <button type="button" class="eco mini" :aria-label="`${t('Escuchar')}: ${v.en}`" @click="escuchar(v.en)">🔊</button>
              </li>
            </ul>
            <p v-if="avisoVoz" class="aviso" role="status">{{ t('Tu navegador no ofrece voz. Lee la palabra en voz alta:') }} <em lang="en">{{ avisoVoz }}</em></p>
          </section>

          <section class="aplicacion" :aria-label="t('Aplicación')">
            <div class="aplicacion-texto">
              <h3>{{ t('Ponlo a prueba') }}</h3>
              <p v-if="bloqueada">{{ t('Esta batalla aún no está desbloqueada. Completa la zona anterior en el mapa.') }}</p>
              <p v-else>{{ t('El guardián te espera.') }}</p>
            </div>
            <div class="acciones">
              <button type="button" class="b-pri" :disabled="bloqueada" @click="irMision(tema.nivel)">⚔ {{ t('Ir a la misión') }}: {{ tema.ambiente }}</button>
              <button type="button" class="b-sec" @click="irMapa">{{ t('Regresar al mapa') }}</button>
            </div>
          </section>
        </template>

        <!-- Evaluación final: es la MISMA misión del mapa (no se duplica la evaluación) -->
        <template v-else>
          <section class="portada final-portada" style="background-image: url(/images/arenas/static/puerta-real.webp)">
            <img class="portada-guardian" src="/images/personajes-mate/real/reposo-lite.webp" alt="" decoding="async" />
            <div class="portada-texto">
              <p class="ceja">{{ t('Evaluación integradora') }}</p>
              <h2>{{ t(final.titulo) }}</h2>
              <p class="avance"><span>{{ t('Fase') }} 1–4</span><span>12 {{ t('desafíos') }}</span></p>
            </div>
          </section>
          <p class="destacado">{{ t(final.descripcion) }}</p>
          <ol class="runas">
            <li v-for="tm in temas" :key="tm.nivel" :style="{ '--i': tm.nivel }"><b aria-hidden="true">{{ tm.nivel }}</b><span>{{ t('Fase') }} {{ tm.nivel }}: {{ tm.titulo }}</span></li>
          </ol>
          <p v-if="!finalDesbloqueada" class="aviso" role="status">{{ t('Se desbloquea al completar las cuatro batallas del mapa.') }} ({{ completadas }} / 4)</p>
          <p v-else-if="resultadoFinal?.aprobada" class="aviso" role="status">{{ t('Evaluación aprobada') }}: {{ Math.round((resultadoFinal.mejorPrecision ?? 0) * 100) }} %</p>
          <p v-else-if="resultadoFinal?.intentos" class="aviso" role="status">{{ t('Intentos') }}: {{ resultadoFinal.intentos }} · {{ t('Mejor precisión') }}: {{ Math.round((resultadoFinal.mejorPrecision ?? 0) * 100) }} %</p>
          <div class="acciones">
            <button type="button" class="b-pri" :disabled="!finalDesbloqueada" @click="irMision(5)">👑 {{ t('Ir a la evaluación final') }}</button>
            <button type="button" class="b-sec" @click="irMapa">{{ t('Regresar al mapa') }}</button>
          </div>
        </template>
      </main>

      <!-- Recursos externos: barra lateral en escritorio; panel desplegable en móvil. Nada se carga hasta elegir un recurso. -->
      <aside v-if="tema" class="recursos" :class="{ abierto: panelAbierto }" :aria-label="t('Recursos externos')">
        <button v-if="!escritorio" type="button" class="abrir-panel" :aria-expanded="panelAbierto" @click="panelAbierto = !panelAbierto">
          📜 {{ t('Recursos externos') }} ({{ tema.recursos.length }}) {{ panelAbierto ? '▾' : '▸' }}
        </button>
        <div v-if="escritorio || panelAbierto" class="panel-recursos">
          <h3 v-if="escritorio">📜 {{ t('Recursos externos') }}</h3>
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
import { bancoPreguntas } from '~/composables/useBancoPreguntas.js'
const nivelesBase = bancoPreguntas.niveles

const route = useRoute()
const { t } = useLanguage()
const { loadPreferences } = useGameGraphics()
const store = usePlayerProgress()
const { marcarConsultado, registrarPractica, practicaDe, superadas, consultado } = useBiblioteca()

const temas = contenidos.temas
const final = { titulo: 'La última prueba del reino', descripcion: 'Evaluación integradora: 12 desafíos de inglés repartidos en cuatro fases, una por cada temática. Se juega en el mapa, igual que las demás batallas.' }
const desde = computed(() => String(route.query.desde ?? 'menu'))
const origenMision = computed(() => Number(route.query.mision) || null)
// El HTML prerrenderizado no conoce la URL: se parte de 1 y se aplica ?tema=N al montar (un enlace directo o recargar abre el tomo pedido).
const actual = ref(1)
const temaPedido = () => (route.query.tema === 'final' ? 'final' : (Number(route.query.tema) || 1))
const seccion = ref('intro')
const indiceAct = ref(0)
const abierto = ref(null)
const panelAbierto = ref(false)
const escritorio = ref(true)
const lectura = ref(null)
const avisoVoz = ref('')
const secciones = [
  { id: 'intro', nombre: 'Misión', icono: '📜' }, { id: 'lab', nombre: 'Laboratorio', icono: '⚗️' }, { id: 'reglas', nombre: 'Runas del tomo', icono: '🗝️' }, { id: 'ejemplos', nombre: 'Conjuros', icono: '🔊' },
  { id: 'errores', nombre: 'Trampas', icono: '🪤' }, { id: 'practica', nombre: 'Entrenamiento', icono: '🎯' }, { id: 'glosario', nombre: 'Tesoro de palabras', icono: '💎' }
]
// Estado de las tarjetas interactivas (se reinicia al cambiar de tomo)
const volteadas = reactive({})
const reparadas = reactive({})
const girar = (clave) => { volteadas[clave] = !volteadas[clave] }
const reparar = (i) => { reparadas[i] = !reparadas[i] }
const reiniciarTarjetas = () => { for (const k of Object.keys(volteadas)) delete volteadas[k]; for (const k of Object.keys(reparadas)) delete reparadas[k] }
// Resalta las palabras clave de la gramática dentro de una frase en inglés
const CLAVES = /(\b(?:am|is|are|going to|will|not|won't|do not|don't)\b|'ll)/gi
const trozos = (en) => String(en).split(CLAVES).map((texto, i) => ({ texto, clave: i % 2 === 1 })).filter((x) => x.texto)
const base = computed(() => nivelesBase.find((n) => n.numero === actual.value))
const retrato = computed(() => (base.value ? `${base.value.arte}/reposo-lite.webp` : '/images/personajes-mate/real/reposo-lite.webp'))
const portada = computed(() => {
  const f = base.value?.fondo ?? '/images/arenas/puerta-real-animado.svg'
  return `url(${f.replace('/arenas/', '/arenas/static/').replace('-animado.svg', '.webp')})`
})
const poder = computed(() => {
  if (!tema.value) return 0
  const total = 1 + actividades.value.length
  return Math.round(((consultado(tema.value.nivel) ? 1 : 0) + superadas(tema.value.nivel)) / total * 100)
})

const tema = computed(() => (actual.value === 'final' ? null : temas.find((x) => x.nivel === actual.value)))
const leccion = computed(() => lecciones.niveles[actual.value])
// Actividades nuevas + el repaso rápido que antes aparecía como pergamino antes de la batalla (se reutiliza, no se duplica).
const actividades = computed(() => !tema.value ? [] : [
  ...tema.value.actividades,
  ...(leccion.value.practica ?? []).map((p, i) => ({ id: `lp${tema.value.nivel}-${i}`, tipo: 'opcion', titulo: 'Repaso del pergamino', instruccion: p.enunciado, opciones: p.opciones, correcta: p.correcta, porque: p.porque }))
])
const guardianDe = (n) => nivelesBase.find((x) => x.numero === n)?.arte ?? ''
const estrellasDe = (n) => store.estado.progreso.niveles[n]?.estrellas ?? 0
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
  callar(); reiniciarTarjetas(); actual.value = n
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
  actual.value = temaPedido()
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
useHead({ title: computed(() => `${t('Grimorio del Reino')} · English Quest`) })
</script>

<style scoped>
.grimorio { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; color: #f1e8d3; padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  background: radial-gradient(ellipse at 50% -10%, #2b3a63 0%, #121a2e 45%, #0a0f1c 100%); }
.barra { display: flex; align-items: center; gap: 10px; max-width: 1380px; width: 100%; margin: 0 auto 10px; }
.barra h1 { flex: 1; margin: 0; color: #ffe09a; font: 800 clamp(1.1rem, 3.4vw, 1.9rem) 'Cinzel', Georgia, serif; text-shadow: 0 0 18px #ffb84d55; }
.volver { min-height: 44px; padding: 0 14px; border: 1px solid #b3955c; border-radius: 999px; background: #101928cc; color: #ffe09a; font: 700 .9rem system-ui, sans-serif; cursor: pointer; }
.volver:hover { background: #1a2740; }
:is(.volver, .tomo, .capitulo, .carta, .gema, .eco, .reparar, .punto, .abrir-panel, .b-pri, .b-sec):focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }

.mesa { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; max-width: 1380px; width: 100%; margin: 0 auto; }
@media (min-width: 1000px) { .mesa { grid-template-columns: 250px minmax(0, 1fr) 310px; align-items: start; } }

/* Estantería de tomos */
.estante { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
@media (min-width: 1000px) { .estante { flex-direction: column; overflow: visible; position: sticky; top: 8px; } }
.tomo { flex: none; display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 6px 10px; text-align: left; color: #f1e8d3; cursor: pointer;
  border: 1px solid #b3955c55; border-left: 6px solid #6b4a2a; border-radius: 6px 12px 12px 6px; background: linear-gradient(135deg, #2a2016, #151c2d); transition: transform 160ms, border-color 160ms; }
.tomo:hover { transform: translateX(4px); border-color: #ffe09a; }
.tomo.leido { border-left-color: #6fcf97; }
.tomo.activo { border-color: #ffe09a; border-left-color: #ffd98a; background: linear-gradient(135deg, #4a3818, #1b2640); box-shadow: 0 0 16px #ffd98a44; transform: translateX(6px); }
.medallon { flex: none; display: grid; place-items: center; width: 46px; height: 46px; overflow: hidden; border: 2px solid #ffe6a6; border-radius: 50%; background: radial-gradient(circle at 50% 35%, #3b4e72, #141d33 75%); font-size: 22px; }
.medallon img { width: 120%; height: 120%; object-fit: contain; object-position: 50% 58%; }
.tomo-texto { display: grid; min-width: 0; line-height: 1.2; }
.tomo-texto small { color: #e1bf82; font: 800 .62rem system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; }
.tomo-texto strong { font: 700 .92rem Georgia, serif; }
.tomo-estado { margin-inline-start: auto; color: #ffd98a; font-size: .8rem; letter-spacing: 1px; }
.tomo.final { border-left-color: #b8423a; }
@media (max-width: 999px) { .tomo { min-width: 190px; } }

/* Página del tomo */
.pagina { min-width: 0; outline: none; padding: 0 0 20px; }
.portada { position: relative; display: flex; align-items: flex-end; min-height: clamp(150px, 26vw, 230px); overflow: hidden; border: 1px solid #b68a48; border-radius: 16px; background-size: cover; background-position: center; background-color: #101c32; box-shadow: 0 10px 28px #0009; }
.portada::before { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #0a1020ee 8%, #0a102099 55%, #0a102033); }
.portada-guardian { position: absolute; right: 4%; bottom: -4%; height: 112%; width: auto; max-width: 48%; object-fit: contain; filter: drop-shadow(0 8px 10px #000b); animation: flota 4.5s ease-in-out infinite; }
@keyframes flota { 50% { translate: 0 -6px; } }
.portada-texto { position: relative; z-index: 1; padding: 16px clamp(14px, 3vw, 28px); max-width: 62%; }
.ceja { margin: 0; color: #e8bd71; font: 800 .72rem system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; }
.portada h2 { margin: .15rem 0 .5rem; color: #fff0cc; font: 800 clamp(1.3rem, 3.6vw, 2.2rem) 'Cinzel', Georgia, serif; line-height: 1.1; text-shadow: 0 2px 0 #000a; }
.poder { display: flex; align-items: center; gap: 8px; max-width: 320px; }
.poder-barra { flex: 1; height: 10px; overflow: hidden; border: 1px solid #b68a48; border-radius: 999px; background: #0008; }
.poder-barra span { display: block; height: 100%; background: linear-gradient(90deg, #e6b96e, #fff0b8); box-shadow: 0 0 10px #ffd98a; transition: width 600ms cubic-bezier(.2, 1, .3, 1); }
.poder-num { color: #ffe09a; font: 800 .8rem system-ui, sans-serif; }
.avance { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: .5rem 0 0; font-size: .82rem; color: #d8cdb8; }
.avance .si { color: #8fe0b0; }
@media (max-width: 640px) { .portada-texto { max-width: 100%; } .portada-guardian { opacity: .35; max-width: 70%; } }

/* El mentor habla */
.mentor { display: flex; align-items: flex-end; gap: 10px; margin: 12px 0; }
.mentor-img { flex: none; width: clamp(54px, 9vw, 84px); height: auto; filter: drop-shadow(0 4px 5px #000a); }
.burbuja { position: relative; margin: 0; padding: 10px 14px; border: 1px solid #b68a48; border-radius: 14px 14px 14px 2px; background: #f1e3c0; color: #2a1d10; font-size: clamp(.9rem, 2vw, 1rem); line-height: 1.4; }
.burbuja em { display: block; color: #6b4a2a; }
.burbuja b { display: block; margin-top: 2px; }

/* Capítulos */
.capitulos { display: flex; gap: 6px; overflow-x: auto; padding: 2px 0 8px; scrollbar-width: none; }
.capitulo { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border: 1px solid #b3955c66; border-radius: 999px; background: #151c2d; color: #e8dcc2; font: 700 .85rem system-ui, sans-serif; cursor: pointer; transition: background 140ms, transform 140ms; }
.capitulo:hover { background: #1f2a44; transform: translateY(-2px); }
.capitulo.activo { border-color: #ffe09a; background: linear-gradient(135deg, #5a421a, #2a2216); color: #ffe09a; box-shadow: 0 0 14px #ffd98a44; }
@media (max-width: 520px) { .cap-nombre { display: none; } .capitulo.activo .cap-nombre { display: inline; } }

.bloque { padding: 14px; border: 1px solid #b3955c44; border-radius: 14px; background: linear-gradient(180deg, #151c2dcc, #0f1524cc); animation: aparece 380ms ease-out both; }
@keyframes aparece { from { opacity: 0; translate: 0 10px; } }
.bloque h3 { margin: 0 0 .3rem; color: #ffe09a; font: 700 1.05rem 'Cinzel', Georgia, serif; }
.pista-bloque { margin: 0 0 10px; color: #c8c0b3; font-size: .85rem; }

/* Misión */
.runa-grande { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: 12px; background: linear-gradient(135deg, #3a2c14, #1a2238); border: 1px solid #b68a48; }
.runa-grande p { margin: 0; line-height: 1.45; }
.runa-sello { flex: none; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: #0b1325; border: 2px solid #ffd98a; color: #ffd98a; font-size: 22px; box-shadow: 0 0 14px #ffd98a66; }
.guia-batalla { margin: 10px 0 0; padding: 8px 12px; border-left: 4px solid #e0786b; border-radius: 4px; background: #2a1618; font-size: .92rem; }
.vista-misiones { margin-top: 12px; }
.vista-misiones ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.vista-misiones li { display: flex; gap: 8px; padding: 6px 10px; border-radius: 8px; background: #ffffff0a; animation: aparece 400ms calc(var(--i) * 90ms) ease-out both; }
.vista-misiones li span { color: #ffd98a; }

/* Runas y duelo */
.runas { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.runas li { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid #b3955c55; border-radius: 12px; background: #1b2236; animation: aparece 420ms calc(var(--i) * 110ms) ease-out both; line-height: 1.4; }
.runas b { flex: none; display: grid; place-items: center; width: 42px; height: 42px; clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); background: linear-gradient(135deg, #ffe09a, #c58b2e); color: #2a1d08; font: 800 1rem Georgia, serif; }
.versus { margin-top: 14px; }
.duelo { display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch; gap: 8px; }
.lado { padding: 10px 12px; border-radius: 12px; border: 1px solid; }
.lado.a { border-color: #6fcf97; background: linear-gradient(135deg, #12301f, #151c2d); }
.lado.b { border-color: #e0a45b; background: linear-gradient(135deg, #3a2610, #151c2d); }
.lado strong { display: block; font: 700 1.02rem Georgia, serif; color: #fff0cc; }
.lado p { margin: 4px 0 0; font-size: .86rem; color: #d8cdb8; }
.vs { align-self: center; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #b8423a; color: #fff; font: 900 .8rem system-ui, sans-serif; box-shadow: 0 0 14px #b8423a99; }
@media (max-width: 560px) { .duelo { grid-template-columns: 1fr; } .vs { justify-self: center; } }

/* Conjuros: tarjetas que giran */
.conjuros, .gemas, .trampas { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.conjuros li { position: relative; animation: aparece 420ms calc(var(--i) * 100ms) ease-out both; perspective: 900px; }
.carta { position: relative; display: grid; width: 100%; min-height: 78px; padding: 0; border: 0; background: none; cursor: pointer; transform-style: preserve-3d; transition: transform 520ms cubic-bezier(.3, 1.2, .4, 1); text-align: left; }
.carta.girada { transform: rotateX(180deg); }
.cara { grid-area: 1 / 1; display: flex; align-items: center; padding: 10px 56px 10px 16px; border: 1px solid #b68a48; border-radius: 14px; backface-visibility: hidden; font: 700 clamp(.98rem, 2.4vw, 1.2rem) Georgia, serif; line-height: 1.3; }
.frente { background: linear-gradient(135deg, #2a2016, #1a2238); color: #fff0cc; }
.frente mark { padding: 0 3px; border-radius: 4px; background: #ffd98a; color: #2a1d08; }
.dorso { transform: rotateX(180deg); background: linear-gradient(135deg, #1c3a2c, #17202f); color: #d6f5e2; font-style: italic; border-color: #6fcf97; }
.eco { position: absolute; top: 50%; right: 10px; translate: 0 -50%; display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid #ffd98a; border-radius: 50%; background: #0b1325; font-size: 18px; cursor: pointer; z-index: 2; }
.eco:hover { background: #3a2c14; box-shadow: 0 0 12px #ffd98a88; }

/* Trampas */
.trampas li { padding: 12px 14px; border: 1px solid #e0786b; border-radius: 14px; background: linear-gradient(135deg, #34181a, #151c2d); animation: aparece 420ms calc(var(--i) * 110ms) ease-out both; }
.trampas li.reparada { border-color: #6fcf97; background: linear-gradient(135deg, #12301f, #151c2d); }
.trampas .mal { margin: 0; font: 700 1.05rem Georgia, serif; color: #ffb4a8; }
.trampas .reparada .mal { color: #a9e8c3; }
.trampas .nota { margin: 6px 0 0; font-size: .9rem; color: #e8dcc2; }
.reparar { margin-top: 8px; min-height: 40px; padding: 0 14px; border: 1px solid #ffd98a; border-radius: 999px; background: #0b1325; color: #ffe09a; font: 700 .85rem system-ui, sans-serif; cursor: pointer; }
.reparar:hover { background: #3a2c14; }

/* Gemas */
.gemas { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
.gemas li { position: relative; animation: aparece 380ms calc(var(--i) * 70ms) ease-out both; }
.gema { display: grid; gap: 2px; width: 100%; min-height: 76px; padding: 10px 52px 10px 14px; text-align: left; cursor: pointer; border: 1px solid #7fb4e8; border-radius: 14px 4px 14px 4px; background: linear-gradient(135deg, #16335a, #121a2e); color: #e6f2ff; transition: transform 160ms, box-shadow 160ms; }
.gema:hover { transform: translateY(-3px); box-shadow: 0 6px 16px #5aa7ff44; }
.gema.abierta { border-color: #ffd98a; background: linear-gradient(135deg, #4a3818, #1a2238); }
.gema-en { font: 800 1.1rem Georgia, serif; }
.gema-es { color: #b8d8ff; font-size: .9rem; }
.gema.abierta .gema-es { color: #ffe09a; }
.eco.mini { right: 8px; width: 38px; height: 38px; font-size: 15px; }

/* Práctica */
.aviso-practica, .aviso, .destacado { margin: 0 0 10px; padding: 8px 12px; border-radius: 8px; background: #ffffff0d; font-size: .9rem; line-height: 1.4; }
.destacado { margin: 12px 0; border-left: 4px solid #ffd98a; }
.puntitos { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.punto { width: 44px; height: 44px; border: 1px solid #b3955c; border-radius: 50%; background: #151c2d; color: #f1e8d3; font: 800 .95rem Georgia, serif; cursor: pointer; }
.punto.activo { border-color: #ffe09a; background: #4a3818; color: #ffe09a; box-shadow: 0 0 12px #ffd98a66; }
.punto.hecha { background: #1c3a2c; border-color: #6fcf97; color: #a9e8c3; }
.pager { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.b-pri, .b-sec { min-height: 44px; padding: 0 1rem; border-radius: 999px; cursor: pointer; font: 700 .9rem system-ui, sans-serif; display: inline-flex; align-items: center; text-decoration: none; }
.b-pri { color: #2a1d08; background: linear-gradient(#ffe9a8, #e6b45a); border: 1px solid #ffe09a; box-shadow: 0 3px 0 #7a5420; }
.b-pri:hover:not(:disabled) { filter: brightness(1.08); }
.b-pri:disabled { opacity: .45; cursor: default; box-shadow: none; }
.b-sec { color: #ffe09a; background: transparent; border: 1px solid #b3955c; }
.b-sec:disabled { opacity: .4; cursor: default; }

/* Aplicación */
.aplicacion { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-top: 14px; padding: 14px; border: 1px solid #b68a48; border-radius: 14px; background: linear-gradient(135deg, #3a2410, #17203a); }
.aplicacion h3 { margin: 0; color: #ffe09a; font: 700 1.05rem 'Cinzel', Georgia, serif; }
.aplicacion p { margin: 2px 0 0; font-size: .88rem; color: #e1d3b6; }
.acciones { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.aplicacion .acciones { margin: 0; }

/* Recursos */
.recursos { min-width: 0; }
@media (min-width: 1000px) { .recursos { position: sticky; top: 8px; max-height: calc(100dvh - 24px); overflow-y: auto; } }
.abrir-panel { width: 100%; min-height: 44px; padding: 0 14px; border: 1px solid #b3955c; border-radius: 12px; background: #151c2d; color: #ffe09a; font: 700 .9rem system-ui, sans-serif; text-align: left; cursor: pointer; }
.panel-recursos { padding: 12px; border: 1px solid #b3955c55; border-radius: 14px; background: #121a2ecc; }
.panel-recursos h3 { margin: 0 0 6px; color: #ffe09a; font: 700 1rem 'Cinzel', Georgia, serif; }
.panel-recursos ul { display: grid; gap: 10px; margin: 8px 0; padding: 0; list-style: none; }
.panel-recursos li { padding: 10px; border: 1px solid #b3955c44; border-radius: 10px; background: #ffffff08; }
.panel-recursos li.abierto { border-color: #ffd98a; }
.panel-recursos .tipo { margin: 0; color: #e1bf82; font-size: .72rem; letter-spacing: .06em; text-transform: uppercase; }
.panel-recursos .desc { margin: 2px 0 0; font-size: .85rem; color: #d8cdb8; }
.nota-red { margin: 4px 0; color: #a9a396; font-size: .78rem; }

@media (prefers-reduced-motion: reduce) {
  .portada-guardian, .bloque, .runas li, .conjuros li, .trampas li, .gemas li, .vista-misiones li { animation: none; }
  .carta, .tomo, .gema, .capitulo, .poder-barra span { transition: none; }
}
</style>
