<template>
  <section class="informe" :aria-label="t('Informe de aprendizaje')">
    <p class="eq-ceja">{{ t('Informe de aprendizaje') }}</p>
    <p class="estrellas eq-estrellas" :aria-label="`${informe.recompensas.estrellas} ${t('de 3 estrellas')}`">
      <span v-for="n in 3" :key="n" :class="{ vacia: n > informe.recompensas.estrellas }" aria-hidden="true">★</span>
    </p>

    <h3>{{ t('Resultados educativos') }}</h3>
    <p v-if="informe.totalLinguistico">
      {{ t('Aciertos lingüísticos') }}: <strong>{{ informe.aciertos }} / {{ informe.totalLinguistico }}</strong>
      ({{ Math.round(informe.precision * 100) }} %)
    </p>
    <p>{{ t('Temática') }}: {{ t(informe.tema) }} —
      <strong>{{ informe.dominados.length ? t('Dominada') : t('Necesita refuerzo') }}</strong></p>

    <template v-if="informe.falladas.length">
      <h3>{{ t('Preguntas falladas') }}</h3>
      <ul class="falladas">
        <li v-for="f in informe.falladas" :key="f.texto">
          <span lang="en">{{ f.texto }}</span><br>
          <small>{{ t('Respuesta correcta') }}: <strong lang="en">{{ f.correcta }}</strong>. {{ f.explicacion }}</small>
        </li>
      </ul>
      <p class="refuerzo">{{ t('Estas preguntas quedaron guardadas en el refuerzo del mapa: allí puedes practicarlas sin consecuencias.') }}</p>
    </template>
    <p v-else-if="informe.totalLinguistico">{{ t('No fallaste ninguna pregunta de inglés. ¡Excelente!') }}</p>

    <h3>{{ t('Rendimiento de combate') }}</h3>
    <p class="nota">{{ t('Estas habilidades miden destreza en el juego; no son evidencia de dominio del inglés.') }}</p>
    <ul class="combate">
      <li v-if="informe.combate.proyectilesCortados">{{ t('Proyectiles cortados') }}: {{ informe.combate.proyectilesCortados }}</li>
      <li>{{ t('Ataques esquivados') }}: {{ informe.combate.esquivasLogradas || 0 }}</li>
      <li>{{ t('Paradas perfectas') }}: {{ informe.combate.paradasPerfectas || 0 }} · {{ t('parciales') }}: {{ informe.combate.paradasParciales || 0 }}</li>
      <li>{{ t('Daño recibido') }}: {{ informe.combate.danoRecibido || 0 }} · {{ t('Vida restante') }}: {{ informe.vidaCaballero }}/100</li>
    </ul>

    <h3>{{ t('Recompensas') }}</h3>
    <p v-if="practica">{{ t('Modo de práctica: este resultado no suma estrellas ni experiencia.') }}</p>
    <p v-else-if="informe.resultado === 'victoria'">
      +{{ informe.recompensas.xp }} {{ t('de experiencia') }}
      <template v-if="informe.recompensas.xp === 0"> · {{ t('Repetir sin mejorar no suma experiencia: supera tu mejor resultado.') }}</template>
    </p>
    <p v-else>{{ t('Vence al guardián para ganar experiencia y estrellas.') }}</p>
    <p v-if="informe.recompensas.rangoNuevo" class="rango" role="status">{{ t('Nuevo rango') }}: <strong>{{ t(informe.recompensas.rangoNuevo.nombre) }}</strong></p>

    <template v-if="final">
      <h3>{{ t('Informe general del reino') }}</h3>
      <p>{{ t('Completaste las cuatro zonas.') }} {{ t('Precisión total') }}: <strong>{{ Math.round(resumen.precision * 100) }} %</strong>
        ({{ resumen.correctas }} / {{ resumen.correctas + resumen.incorrectas }}). {{ t('Estrellas') }}: {{ resumen.estrellas }} / 12.</p>
      <ul>
        <li v-for="(c, tema) in estado.progreso.temas" :key="tema">{{ t(tema) }}: {{ c.correctas }} / {{ c.correctas + c.incorrectas }}</li>
      </ul>
    </template>
  </section>
</template>

<script setup>
const props = defineProps({ informe: { type: Object, required: true }, nivel: { type: Object, required: true } })
const { t } = useLanguage()
const progreso = usePlayerProgress()
const estado = progreso.estado
const practica = computed(() => estado.ajustes.practica)
const final = computed(() => props.informe.resultado === 'victoria' && Object.values(estado.progreso.niveles).filter((n) => n.completado).length === 4)
const resumen = computed(() => progreso.estadisticas())
</script>

<style scoped>
.informe { text-align: left; font-size: .95rem; }
.informe h3 { margin: .7rem 0 .2rem; color: #ffd88a; font-size: 1rem; }
.estrellas { margin: 0; font-size: 1.6rem; }
.falladas { padding-left: 1.1rem; margin: .2rem 0; }
.falladas li { margin-bottom: .45rem; }
.nota, .refuerzo { color: #c4c7cd; font-size: .85rem; }
.combate { padding-left: 1.1rem; margin: 0; }
.rango { padding: .4rem .6rem; border: 1px solid #f2d28c; border-radius: 6px; background: #2a2118; }
</style>
