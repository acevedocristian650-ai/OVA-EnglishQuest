<template>
  <div class="eq-modal" role="dialog" aria-modal="true" :aria-label="t('Estadísticas del caballero')" @keydown.esc="emit('cerrar')">
    <article class="eq-caja">
      <p class="eq-ceja">{{ t('Crónica del caballero') }}</p>
      <h2>{{ t(rango.nombre) }}</h2>
      <p>{{ xp }} {{ t('de experiencia') }}<template v-if="rango.siguiente"> · {{ t('Siguiente rango') }}: {{ t(rango.siguiente.nombre) }} ({{ rango.siguiente.min }})</template></p>
      <div class="eq-barra" role="progressbar" :aria-valuenow="Math.round(rango.progreso * 100)" aria-valuemin="0" aria-valuemax="100" :aria-label="t('Progreso hacia el siguiente rango')"><span :style="{ transform: `scaleX(${rango.progreso})` }" /></div>
      <p v-if="estado.progreso.ultimaSesion" class="nota">{{ t('Última sesión') }}: {{ new Date(estado.progreso.ultimaSesion).toLocaleString() }}</p>
      <p v-if="estado.almacenamiento !== 'ok'" class="aviso" role="status">{{ t(avisoAlmacen) }}</p>

      <h3>{{ t('Niveles') }}</h3>
      <table class="eq-tabla">
        <thead><tr><th>{{ t('Zona') }}</th><th>{{ t('Estrellas') }}</th><th>{{ t('Intentos') }}</th><th>{{ t('Victorias') }} / {{ t('Derrotas') }}</th><th>{{ t('Mejor precisión') }}</th></tr></thead>
        <tbody>
          <tr v-for="n in 4" :key="n">
            <td>{{ t(nombres[n]) }}<small v-if="estado.progreso.desbloqueado < n"> ({{ t('bloqueada') }})</small></td>
            <td class="eq-estrellas"><span v-for="e in 3" :key="e" :class="{ vacia: e > nivel(n).estrellas }" aria-hidden="true">★</span><span class="sr">{{ nivel(n).estrellas }}/3</span></td>
            <td>{{ nivel(n).intentos }}</td>
            <td>{{ nivel(n).victorias }} / {{ nivel(n).derrotas }}</td>
            <td>{{ nivel(n).intentos ? Math.round(nivel(n).mejorPrecision * 100) + ' %' : '—' }}</td>
          </tr>
        </tbody>
      </table>

      <h3>{{ t('Rendimiento educativo') }}</h3>
      <p class="nota">{{ t('Solo cuenta preguntas de inglés (vocabulario, gramática, comprensión).') }}</p>
      <table v-if="temas.length" class="eq-tabla">
        <tbody><tr v-for="x in temas" :key="x.tema"><td>{{ t(x.tema) }}</td><td>{{ x.correctas }} / {{ x.correctas + x.incorrectas }}</td><td>{{ Math.round(100 * x.correctas / (x.correctas + x.incorrectas)) }} %</td></tr></tbody>
      </table>
      <p v-else>{{ t('Aún no hay respuestas registradas.') }}</p>
      <p v-if="estado.progreso.tipos.escuchar" class="nota">{{ t('Comprensión auditiva') }}: {{ estado.progreso.tipos.escuchar.correctas }} / {{ estado.progreso.tipos.escuchar.correctas + estado.progreso.tipos.escuchar.incorrectas }}</p>
      <p class="nota">{{ t('Tiempo en actividades') }}: {{ Math.round(estado.progreso.segundosActividades / 60) }} min</p>

      <h3>{{ t('Rendimiento de combate') }}</h3>
      <p class="nota">{{ t('Destreza en el juego; no es evidencia de dominio del inglés.') }}</p>
      <ul>
        <li>{{ t('Proyectiles cortados') }}: {{ c.proyectilesCortados }}</li>
        <li>{{ t('Ataques esquivados') }}: {{ c.esquivasLogradas }} · {{ t('fallidos') }}: {{ c.esquivasFallidas }}</li>
        <li>{{ t('Paradas perfectas') }}: {{ c.paradasPerfectas }} · {{ t('parciales') }}: {{ c.paradasParciales }}</li>
        <li>{{ t('Golpes recibidos') }}: {{ c.golpesRecibidos }} · {{ t('Daño recibido') }}: {{ c.danoRecibido }}</li>
      </ul>

      <h3>{{ t('Actividades pendientes de refuerzo') }} ({{ pendientes.length }})</h3>
      <ul v-if="pendientes.length" class="pend">
        <li v-for="r in pendientes.slice(0, 8)" :key="r.texto"><span lang="en">{{ r.texto }}</span> <small>· {{ t(r.tema) }} · {{ r.fallos }}×</small></li>
      </ul>
      <p v-else>{{ t('No tienes preguntas por reforzar.') }}</p>
      <div class="eq-fila">
        <button type="button" class="eq-btn" :disabled="!pendientes.length" @click="emit('practicar')">{{ t('Practicar refuerzo') }}</button>
      </div>

      <h3>{{ t('Copia de seguridad') }}</h3>
      <div class="eq-fila">
        <button type="button" class="eq-btn sec" @click="exportar">{{ t('Exportar progreso') }}</button>
        <label class="eq-btn sec importar">{{ t('Importar progreso') }}<input type="file" accept="application/json,.json" @change="importar"></label>
        <button type="button" class="eq-btn sec" @click="confirmando = true">{{ t('Reiniciar progreso') }}</button>
      </div>
      <p v-if="mensaje" role="status" class="aviso">{{ mensaje }}</p>
      <div v-if="confirmando" class="aviso" role="alertdialog" :aria-label="t('Confirmar reinicio')">
        <p>{{ t('Se borrará todo tu progreso y tus estadísticas. Esta acción no se puede deshacer. Exporta una copia antes si quieres conservarla.') }}</p>
        <div class="eq-fila">
          <button type="button" class="eq-btn" @click="reiniciar">{{ t('Sí, reiniciar') }}</button>
          <button type="button" class="eq-btn sec" @click="confirmando = false">{{ t('Cancelar') }}</button>
        </div>
      </div>
      <div class="eq-fila acciones"><button type="button" class="eq-btn sec" @click="emit('cerrar')">{{ t('Cerrar') }}</button></div>
    </article>
  </div>
</template>

<script setup>
const emit = defineEmits(['cerrar', 'practicar'])
const { t } = useLanguage()
const progreso = usePlayerProgress()
const { estado, xp, rango } = progreso
const nivel = (n) => estado.progreso.niveles[n] ?? { intentos: 0, victorias: 0, derrotas: 0, estrellas: 0, mejorPrecision: 0 }
const nombres = { 1: 'Bosque del Alba', 2: 'Puente del Río', 3: 'Torre del Viento', 4: 'Puerta Real' }
const c = computed(() => estado.progreso.combate)
const temas = computed(() => Object.entries(estado.progreso.temas).filter(([, x]) => x.correctas + x.incorrectas).map(([tema, x]) => ({ tema, ...x })))
const pendientes = computed(() => Object.values(estado.progreso.refuerzo))
const avisoAlmacen = computed(() => ({ bloqueado: 'El almacenamiento del navegador está bloqueado: el progreso solo durará esta sesión.', lleno: 'El almacenamiento está lleno: el progreso podría no guardarse.', memoria: 'Sin almacenamiento local: el progreso solo durará esta sesión.' }[estado.almacenamiento] ?? ''))
const mensaje = ref('')
const confirmando = ref(false)
function exportar() {
  const blob = new Blob([progreso.exportar()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'english-quest-progreso.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  mensaje.value = t('Copia de seguridad exportada.')
}
async function importar(e) {
  const archivo = e.target.files?.[0]
  e.target.value = ''
  if (!archivo) return
  const r = progreso.importar(await archivo.text())
  mensaje.value = r.ok ? t('Progreso importado correctamente.') : t(r.motivo === 'version' ? 'La copia es de una versión más reciente del juego.' : 'El archivo no es una copia de seguridad válida de English Quest.')
}
function reiniciar() { progreso.reiniciar(); confirmando.value = false; mensaje.value = t('El progreso se reinició.') }
</script>

<style scoped>
.nota { color: #c4c7cd; font-size: .85rem; margin: .1rem 0; }
.aviso { margin-top: .6rem; padding: .5rem; border: 1px solid #b3955c; border-radius: 6px; background: #2a2118; }
.eq-caja h3 { margin-top: 1rem; color: #ffd88a; font-size: 1rem; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.importar { display: inline-flex; align-items: center; cursor: pointer; }
.importar input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.importar:focus-within { outline: 3px solid #ffd27a; }
.pend { padding-left: 1.1rem; margin: 0; }
.acciones { margin-top: 1rem; justify-content: flex-end; }
</style>
