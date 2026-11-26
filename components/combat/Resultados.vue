<!--
  Resultados.vue - Pantalla de resultados superpuesta. Aparece cuando termina la secuencia final del combate, de modo
  que el escenario conserva su tamaño durante la animación de victoria. Muestra lo esencial de forma compacta y deja
  el detalle bajo demanda: informe de aprendizaje, revisión de respuestas y (si se aprobó la evaluación) el cierre.
  Si el detalle es largo, se desplaza dentro de su propio panel; los botones principales quedan siempre visibles.
-->
<template>
  <div class="velo" role="dialog" aria-modal="true" :aria-labelledby="'res-titulo'">
    <section class="caja">
      <header class="cab">
        <p class="ceja">{{ esFinal ? t('La última prueba del reino') : nivel.nombre }}</p>
        <h2 id="res-titulo" :class="victoria ? 'gana' : 'pierde'">{{ titulo }}</h2>
      </header>

      <div ref="zona" class="zona" tabindex="-1">
        <!-- CIERRE de la aventura (solo con la evaluación final aprobada) -->
        <template v-if="vista === 'cierre'">
          <div class="epilogo" role="status">
            <span class="sello" aria-hidden="true">{{ t('✦ Victoria del Reino ✦') }}</span>
            <p class="gracias">{{ t(datosCreditos.mensajeFinal) }}</p>
            <p>{{ t('Lo has logrado, regresaste al castillo del rey; serás recordado hasta el fin de los tiempos.') }}</p>
          </div>
          <CreditosPanel />
        </template>

        <!-- RESUMEN compacto -->
        <template v-else-if="vista === 'resumen'">
          <p v-if="pruebaRemate" class="nota">{{ t('Prueba de remate completada') }}</p>
          <template v-if="informe">
            <p class="estrellas" :aria-label="`${informe.recompensas.estrellas} ${t('de 3 estrellas')}`">
              <span v-for="n in 3" :key="n" :class="{ vacia: n > informe.recompensas.estrellas }" aria-hidden="true">★</span>
            </p>
            <ul class="fichas">
              <li><span>{{ t('Aciertos lingüísticos') }}</span><strong>{{ informe.aciertos }} / {{ informe.totalLinguistico }}</strong><small>{{ Math.round(informe.precision * 100) }} %</small></li>
              <li><span>{{ t('Experiencia') }}</span><strong>{{ practica ? '—' : '+' + informe.recompensas.xp }}</strong><small>{{ practica ? t('Modo práctica') : t('obtenida') }}</small></li>
              <li><span>{{ t('Vida restante') }}</span><strong>{{ Math.round(informe.vidaCaballero) }} / 100</strong><small>{{ t('Caballero') }}</small></li>
              <li><span>{{ t('Rango') }}</span><strong class="rango">{{ (informe.recompensas.rangoNuevo ?? rango).nombre }}</strong><small>{{ informe.recompensas.rangoNuevo ? t('¡Nuevo rango!') : t('actual') }}</small></li>
            </ul>
            <!-- Evaluación final: victoria de combate y resultado educativo van por separado -->
            <div v-if="informe.final" class="final" :class="informe.final.aprobada ? 'apr' : 'noapr'" role="status">
              <p><strong>{{ t('Combate') }}:</strong> {{ victoria ? t('guardián derrotado') : t('derrota') }} · <strong>{{ t('Educativo') }}:</strong>
                {{ informe.final.aprobada ? t('aprobado') : informe.final.completo ? t('necesitas reforzar tus conocimientos') : t('evaluación incompleta') }}
                ({{ Math.round(informe.precision * 100) }} % · {{ t('mínimo') }} {{ Math.round(informe.final.umbral * 100) }} %)</p>
              <p v-if="!informe.final.aprobada && informe.final.reforzar.length" class="repasar">{{ t('Repasa') }}: {{ informe.final.reforzar.map((g) => g.tema).join(' · ') }}</p>
            </div>
            <p v-else-if="victoria && nivel.numero === 4" class="nota">{{ t('Se abrió «La última prueba del reino» en el mapa.') }}</p>
          </template>
          <p v-else class="nota">{{ t('Aciertos') }} {{ aciertos }} {{ t(' de ') }}{{ historial.length }}.</p>
        </template>

        <!-- INFORME de aprendizaje bajo demanda -->
        <template v-else-if="vista === 'informe' && informe">
          <section v-if="informe.final" class="por-tema" :aria-label="t('Resultados por temática')">
            <h3>{{ t('Resultados por temática') }}</h3>
            <ul>
              <li v-for="g in informe.final.porTema" :key="g.tema" :class="g.aprobado ? 'ok' : 'no'">
                <span>{{ t('Fase') }} {{ g.fase }} · {{ g.tema }}</span>
                <strong>{{ g.aciertos }} / {{ g.total }} ({{ Math.round(g.precision * 100) }} %)</strong>
                <small>{{ g.aprobado ? t('Superada') : t('Necesita refuerzo') }}</small>
              </li>
            </ul>
            <p v-if="!informe.final.completo" class="nota">{{ t('La evaluación terminó antes de completar todos los desafíos; la aprobación exige todos los desafíos lingüísticos.') }}</p>
          </section>
          <CombatInforme :informe="informe" :nivel="nivel" />
        </template>

        <!-- REVISIÓN de respuestas -->
        <template v-else-if="vista === 'repaso' && registro">
          <h3 lang="en">{{ registro.texto }}</h3>
          <p>{{ t('Tu respuesta') }}: <span lang="en">{{ registro.respuesta || t('Sin respuesta') }}</span> · <strong :class="registro.acierto ? 'si' : 'no-t'">{{ registro.acierto ? t('Correcta') : t('Incorrecta') }}</strong></p>
          <p>{{ t('Respuesta correcta') }}: <strong lang="en">{{ registro.correcta }}</strong></p>
          <p>{{ registro.explicacion }}</p>
          <div class="pag">
            <button type="button" class="b-sec" :disabled="indiceRepaso === 0" @click="indiceRepaso--">{{ t('Anterior') }}</button>
            <span>{{ indiceRepaso + 1 }} / {{ historial.length }}</span>
            <button type="button" class="b-sec" :disabled="indiceRepaso + 1 === historial.length" @click="indiceRepaso++">{{ t('Siguiente') }}</button>
          </div>
        </template>
      </div>

      <footer class="pie">
        <template v-if="vista === 'resumen'">
          <button v-if="informe" type="button" class="b-sec" @click="ir('informe')">{{ t('Ver informe de aprendizaje') }}</button>
          <button v-if="historial.length" type="button" class="b-sec" @click="indiceRepaso = 0; ir('repaso')">{{ t('Revisar respuestas') }}</button>
          <button v-if="refuerzo !== null" type="button" class="b-sec" @click="emit('reforzar', refuerzo)">{{ t('Reforzar contenido') }}</button>
          <button v-if="informe?.final?.aprobada" type="button" class="b-sec" @click="ir('cierre')">{{ t('Ver cierre del reino') }}</button>
        </template>
        <button v-else type="button" class="b-sec" @click="ir('resumen')">{{ t('Volver al resultado') }}</button>
        <span class="espacio" />
        <template v-if="vista === 'cierre'">
          <button type="button" class="b-sec" @click="emit('menu')">{{ t('Continuar al menú') }}</button>
        </template>
        <button type="button" class="b-pri" @click="emit('volver')">{{ t('Regresar al mapa') }}</button>
        <button type="button" class="b-sec" @click="emit('reintentar')">{{ esFinal ? t('Repetir evaluación') : t('Reintentar') }}</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import datosCreditos from '~/data/creditos.json'
import CombatInforme from './CombatInforme.vue'

const props = defineProps({
  informe: { type: Object, default: null }, nivel: { type: Object, required: true }, historial: { type: Array, default: () => [] },
  victoria: Boolean, pruebaRemate: Boolean, practica: Boolean, aciertos: { type: Number, default: 0 }
})
const emit = defineEmits(['volver', 'reintentar', 'reforzar', 'menu'])
const { t } = useLanguage()
const store = usePlayerProgress()
const esFinal = computed(() => props.nivel.numero === 5)
const rango = computed(() => store.rango.value)
// Aprobada la evaluación final: se abre directamente la secuencia de cierre (se puede saltar con «Ver resultados»).
const vista = ref(props.informe?.final?.aprobada ? 'cierre' : 'resumen')
const indiceRepaso = ref(0)
const zona = ref(null)
const registro = computed(() => props.historial[indiceRepaso.value])
const titulo = computed(() => props.pruebaRemate ? t('Prueba de remate completada') : props.victoria ? (esFinal.value ? t('Guardián final derrotado') : t('¡Victoria!')) : t('Derrota'))
// Contenido de refuerzo: la temática (nivel de la biblioteca) con más fallos de esta partida, si los hubo.
const refuerzo = computed(() => {
  const f = props.informe?.falladas ?? []
  if (!f.length) return null
  if (props.nivel.numero !== 5) return props.nivel.numero
  const peor = props.informe.final?.reforzar?.[0]
  return peor?.fase ?? f[0]?.fase ?? 1
})
function ir(v) { vista.value = v; nextTick(() => { zona.value?.scrollTo?.({ top: 0 }); zona.value?.focus?.({ preventScroll: true }) }) }
</script>

<style scoped>
.velo { position: absolute; inset: 0; z-index: 55; display: grid; place-items: center; padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left)); background: radial-gradient(ellipse at center, #0b1018b8, #05080ff0); animation: aparecer .35s ease-out both; }
@keyframes aparecer { from { opacity: 0; } }
.caja { display: flex; flex-direction: column; width: min(100%, 720px); max-height: 100%; border: 1px solid #b68a48; border-radius: 14px; background: linear-gradient(145deg, #30271f, #121a29 78%); color: #f7edda; box-shadow: 0 18px 60px #000a; overflow: hidden; }
.cab { flex: none; padding: .8rem 1rem .2rem; text-align: center; }
.ceja { margin: 0; color: #e8bd71; font: 800 .75rem system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; }
h2 { margin: .1rem 0 0; font: 800 clamp(1.5rem, 5vw, 2.2rem) Georgia, serif; }
h2.gana { color: #ffe09a; } h2.pierde { color: #ff9d90; }
.zona { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: .4rem 1rem .8rem; outline: none; line-height: 1.45; }
.estrellas { margin: 0 0 .5rem; text-align: center; color: #ffd66b; font-size: 2rem; letter-spacing: .2em; }
.estrellas .vacia { color: #4b4a47; }
.fichas { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .5rem; margin: 0; padding: 0; list-style: none; }
.fichas li { display: grid; gap: .1rem; padding: .55rem .5rem; text-align: center; border: 1px solid #8f7959; border-radius: 10px; background: #ffffff0a; }
.fichas span { color: #d3cbbb; font-size: .78rem; }
.fichas strong { color: #ffe09a; font: 700 1.15rem Georgia, serif; }
.fichas .rango { font-size: .95rem; }
.fichas small { color: #b9b2a3; font-size: .75rem; }
.final { margin-top: .7rem; padding: .6rem .8rem; border-radius: 8px; }
.final p { margin: .15rem 0; }
.final.apr { border: 1px solid #6fcf97; background: #1f4a33; }
.final.noapr { border: 1px solid #e8bd71; background: #4a3417; }
.nota { margin: .5rem 0; color: #cde5ee; font-size: .92rem; }
.epilogo { margin-bottom: 1rem; padding: .8rem; text-align: center; border: 1px solid #e8bd71; border-radius: 10px; background: #2a1d0f; }
.sello { color: #ffe09a; font: 800 1.1rem Georgia, serif; letter-spacing: .1em; }
.gracias { margin: .4rem 0; color: #ffe09a; font: 700 1.3rem Georgia, serif; }
.por-tema h3, h3 { margin: .6rem 0 .3rem; color: #ffe09a; font: 700 1.05rem Georgia, serif; }
.por-tema ul { display: grid; gap: .4rem; margin: 0 0 .6rem; padding: 0; list-style: none; }
.por-tema li { display: grid; grid-template-columns: 1fr auto; gap: 0 .6rem; padding: .5rem .7rem; border-radius: 8px; border: 1px solid #5a6b85; }
.por-tema li.ok { border-color: #6fcf97; } .por-tema li.no { border-color: #e8bd71; }
.por-tema small { grid-column: 1 / -1; color: #b9b2a3; }
.si { color: #8fe0b0; } .no-t { color: #ff9d90; }
.pag { display: flex; align-items: center; justify-content: space-between; margin-top: .6rem; }
.pie { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; padding: .6rem 1rem max(.7rem, env(safe-area-inset-bottom)); border-top: 1px solid #5a4a30; background: #0f1623; }
.espacio { flex: 1 1 0; }
.b-pri, .b-sec { min-height: 44px; padding: 0 .9rem; border-radius: 8px; cursor: pointer; font: 700 .92rem system-ui, sans-serif; }
.b-pri { color: #2a1d08; background: #ffe09a; border: 1px solid #ffe09a; }
.b-sec { color: #ffe09a; background: transparent; border: 1px solid #b3955c; }
.b-sec:disabled { opacity: .4; cursor: default; }
button:focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }
@media (max-width: 560px) { .fichas { grid-template-columns: repeat(2, minmax(0, 1fr)); } .pie .espacio { display: none; } .pie button { flex: 1 1 45%; } }
@media (orientation: landscape) and (max-height: 520px) { .estrellas { font-size: 1.4rem; margin-bottom: .2rem; } .cab { padding-top: .4rem; } .fichas li { padding: .35rem; } }
@media (prefers-reduced-motion: reduce) { .velo { animation: none; } }
</style>
