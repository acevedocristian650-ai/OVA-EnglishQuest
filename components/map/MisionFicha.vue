<!--
  MisionFicha.vue - Ficha de misión al elegir un nivel del mapa. Tres controles: X (cerrar, no inicia nada),
  «Repasar contenidos» (abre directamente la temática en la biblioteca) y «Iniciar batalla» (sin lecciones previas).
-->
<template>
  <v-dialog :model-value="true" max-width="560" scrollable @update:model-value="(v) => !v && emit('cerrar')">
    <v-card class="ficha" color="brown-darken-4" rounded="lg" border :aria-labelledby="'ficha-titulo'">
      <button type="button" class="x" :aria-label="t('Cerrar ficha de misión')" @click="emit('cerrar')">✕</button>
      <div class="portada" :style="{ backgroundImage: fondo ? `url(${fondo})` : 'none' }">
        <img v-if="arte" class="guardian" :src="arte" :alt="`${t('Guardián')}: ${nivel.guardian}`" decoding="async" />
      </div>
      <v-card-text class="cuerpo">
        <p class="ceja">{{ esFinal ? t('Evaluación final') : `${t('Misión')} ${nivel.numero}` }}</p>
        <h2 id="ficha-titulo">{{ nivel.nombre }}</h2>
        <p class="guard">{{ t('Guardián') }}: <strong>{{ nivel.guardian }}</strong> · <span>{{ nivel.tema }}</span></p>
        <!-- Estado de la misión de un vistazo -->
        <p class="estado-mision" :class="estadoMision.clase" role="status">
          <span aria-hidden="true">{{ estadoMision.icono }}</span> {{ estadoMision.texto }}
        </p>
        <ul v-if="esFinal && registro?.ultimoFinal" class="dominio" :aria-label="t('Resultados por temática')">
          <li v-for="g in registro.ultimoFinal.porTema" :key="g.tema" :class="g.estado"><span>{{ g.tema }}</span><b>{{ g.aciertos }}/{{ g.total }}</b></li>
        </ul>
        <!-- Descripción breve; el resto, a petición, para no abrumar en el teléfono -->
        <p class="desc">{{ breve.corta }}</p>
        <details v-if="breve.resto" class="conoc"><summary>{{ t('Más sobre la misión') }}</summary><p>{{ breve.resto }}</p></details>
        <details class="conoc">
          <summary>⚔ {{ t('Conocimientos necesarios') }} <span aria-hidden="true">({{ info.conocimientos.length }})</span></summary>
          <ul><li v-for="(c, i) in info.conocimientos" :key="i">{{ t(c) }}</li></ul>
        </details>
        <p v-if="!esFinal" class="sugerencia">{{ t('Recomendación: si tienes dudas, repasa el contenido antes del combate. Es opcional.') }}</p>
        <fieldset v-if="!bloqueada" class="dificultad" aria-describedby="dificultad-nota">
          <legend>{{ t('Elige la dificultad') }}</legend>
          <div class="modos-dificultad">
            <label class="modo" :class="{ elegido: dificultad === 'normal' }">
              <input v-model="dificultad" type="radio" name="dificultad-mision" value="normal" />
              <span><strong>{{ t('Normal') }}</strong><small>{{ t('Tiempo habitual por actividad') }}</small></span>
            </label>
            <label class="modo modo-dificil" :class="{ elegido: dificultad === 'dificil' }">
              <input v-model="dificultad" type="radio" name="dificultad-mision" value="dificil" />
              <span><strong>{{ t('Difícil') }}</strong><small>{{ t('10 s por pregunta') }}</small></span>
            </label>
          </div>
          <p id="dificultad-nota" class="nota-dificultad">
            {{ t('Prueba Difícil cuando domines la misión.') }}
            <span v-if="ajustes.practica">{{ t('Modo de práctica activo: sin límite de tiempo.') }}</span>
            <span v-else-if="ajustes.tiempoExtra !== 1">{{ t('Tiempo ampliado activo. Difícil:') }} {{ Math.round(10 * ajustes.tiempoExtra) }} s.</span>
          </p>
        </fieldset>
        <p v-if="bloqueada" class="bloqueo" role="status">{{ esFinal ? t('Para desbloquearla completa las cuatro batallas del reino.') : t('Esta misión se desbloquea al completar la zona anterior.') }}</p>
      </v-card-text>
      <v-card-actions class="acciones">
        <v-btn variant="tonal" color="amber-lighten-2" @click="emit('repasar')">{{ esFinal ? t('Repasar todas las temáticas') : t('Repasar contenidos') }}</v-btn>
        <v-spacer />
        <v-btn color="amber" variant="flat" :disabled="bloqueada" autofocus @click="emit('iniciar', dificultad)">{{ t('Iniciar batalla') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({ nivel: { type: Object, required: true }, info: { type: Object, required: true }, bloqueada: Boolean, registro: { type: Object, default: null } })
const emit = defineEmits(['cerrar', 'repasar', 'iniciar'])
const { t } = useLanguage()
const dificultad = ref('normal')
const progreso = usePlayerProgress()
const ajustes = computed(() => progreso.estado.ajustes)
const { imageUrl, levelBackground } = useGameGraphics()
const esFinal = computed(() => props.nivel.numero === 5)
const breve = computed(() => {
  const texto = String(t(props.info.descripcion) ?? '').trim()
  const corte = texto.search(/[.!?]\s+(?=\S)/)
  return corte === -1 || texto.length < 140 ? { corta: texto, resto: '' } : { corta: texto.slice(0, corte + 1), resto: texto.slice(corte + 1).trim() }
})
const estadoMision = computed(() => {
  const r = props.registro
  if (props.bloqueada) return { clase: 'bloqueada', icono: '🔒', texto: esFinal.value ? t('Completa las cuatro batallas para abrirla') : t('Se abre al completar la zona anterior') }
  if (esFinal.value && r?.aprobada) return { clase: 'completada', icono: '✓', texto: t('Aprendizaje demostrado') }
  if (r?.completado) return { clase: 'completada', icono: '✓', texto: `${t('Completada')} · ${'★'.repeat(r.estrellas)}${'☆'.repeat(Math.max(0, 3 - r.estrellas))}` }
  if (r?.intentos) return { clase: 'disponible', icono: '⚔', texto: `${t('Intentos')}: ${r.intentos}` }
  return { clase: 'disponible', icono: '🧭', texto: t('Lista para jugar') }
})
const arte = computed(() => (props.nivel.arte ? imageUrl(`${props.nivel.arte}/reposo.png`) : ''))
const fondo = computed(() => levelBackground(props.nivel))
</script>

<style scoped>
.estado-mision { display: flex; gap: .4rem; align-items: center; margin: .35rem 0; padding: .3rem .6rem; border-radius: 8px; font-size: .9rem; background: #ffffff12; }
.estado-mision.completada { background: #17301f; color: #bdf0cf; }
.estado-mision.bloqueada { background: #3a2a1a; color: #f3d9a8; }
.dominio { display: flex; flex-wrap: wrap; gap: .3rem; margin: .2rem 0 .4rem; padding: 0; list-style: none; font-size: .78rem; }
.dominio li { display: flex; gap: .4rem; padding: .15rem .5rem; border-radius: 999px; background: #ffffff14; }
.dominio li.dominado, .dominio li.logrado { background: #17301f; } .dominio li.refuerzo { background: #3a1b1b; }
.ficha { position: relative; }
.x { position: absolute; top: 8px; right: 8px; z-index: 3; width: 44px; height: 44px; color: #ffe09a; background: #0b1325cc; border: 1px solid #b3955c; border-radius: 50%; font-size: 1.1rem; cursor: pointer; }
.x:focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }
.portada { position: relative; height: clamp(120px, 24dvh, 190px); background-size: cover; background-position: center; background-color: #101c32; border-bottom: 1px solid #b68a48; flex: none; }
.portada::after { content: ''; position: absolute; inset: 0; background: linear-gradient(transparent 35%, #2a1a12); }
.guardian { position: absolute; z-index: 1; right: 8%; bottom: 0; height: 92%; width: auto; object-fit: contain; filter: drop-shadow(0 4px 6px #000a); }
.cuerpo { padding-top: .8rem; }
.ceja { margin: 0; color: #e8bd71; font: 800 .75rem system-ui, sans-serif; letter-spacing: .16em; text-transform: uppercase; }
h2 { margin: .1rem 0 .2rem; color: #ffe09a; font: 800 1.6rem Georgia, serif; }
h3 { margin: .7rem 0 .2rem; color: #ffe09a; font: 700 1rem Georgia, serif; }
.guard { margin: 0 0 .5rem; color: #d3cbbb; }
.desc { margin: 0; line-height: 1.5; font-style: italic; }
ul { margin: 0; padding-left: 1.2rem; display: grid; gap: .25rem; }
.sugerencia { margin: .7rem 0 0; color: #cde5ee; font-size: .9rem; }
.bloqueo { margin: .7rem 0 0; padding: .5rem .7rem; border: 1px solid #b3955c; border-radius: 6px; background: #1b2635; color: #ffe09a; }
.acciones { flex-wrap: wrap; gap: .4rem; padding: .6rem 1rem 1rem; }

.conoc { margin: .5rem 0; border: 1px solid #b3955c66; border-radius: 10px; background: #1a120d; }
.conoc summary { min-height: 44px; display: flex; align-items: center; padding: 0 12px; color: #ffe09a; font-weight: 700; cursor: pointer; }
.conoc ul { margin: 0; padding: 0 14px 10px 30px; }
.conoc[open] { box-shadow: 0 0 12px #ffd98a22; }
.dificultad { min-width: 0; margin: .65rem 0 0; padding: .5rem; border: 1px solid #b3955c66; border-radius: 10px; }
.dificultad legend { padding: 0 .35rem; font-weight: 700; color: #ffe09a; }
.modos-dificultad { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }
.modo { display: flex; align-items: center; gap: .45rem; min-height: 52px; padding: .45rem .55rem; border: 1px solid #b3955c66; border-radius: 8px; background: #1a120d; cursor: pointer; }
.modo.elegido { border-color: #ffe09a; box-shadow: inset 0 0 0 1px #ffe09a; background: #392b19; }
.modo-dificil.elegido { border-color: #f4af88; box-shadow: inset 0 0 0 1px #f4af88; background: #42251c; }
.modo input { flex: none; width: 18px; height: 18px; accent-color: #ffe09a; }
.modo:focus-within { outline: 2px solid #ffe09a; outline-offset: 2px; }
.modo strong, .modo small { display: block; }
.modo small { color: #e0d5c3; font-size: .78rem; line-height: 1.25; }
.nota-dificultad { color: #d3cbbb; font-size: .8rem; line-height: 1.35; margin: .45rem .1rem 0; }
.nota-dificultad span { display: block; }
@media (max-width: 340px) { .modos-dificultad { grid-template-columns: 1fr; } }
</style>
