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
        <p class="desc">{{ t(info.descripcion) }}</p>
        <h3>{{ t('Conocimientos necesarios') }}</h3>
        <ul><li v-for="(c, i) in info.conocimientos" :key="i">{{ t(c) }}</li></ul>
        <p v-if="!esFinal" class="sugerencia">{{ t('Recomendación: si tienes dudas, repasa el contenido antes del combate. Es opcional.') }}</p>
        <p v-if="bloqueada" class="bloqueo" role="status">{{ esFinal ? t('Para desbloquearla completa las cuatro batallas del reino.') : t('Esta misión se desbloquea al completar la zona anterior.') }}</p>
      </v-card-text>
      <v-card-actions class="acciones">
        <v-btn variant="tonal" color="amber-lighten-2" @click="emit('repasar')">{{ esFinal ? t('Repasar todas las temáticas') : t('Repasar contenidos') }}</v-btn>
        <v-spacer />
        <v-btn color="amber" variant="flat" :disabled="bloqueada" autofocus @click="emit('iniciar')">{{ t('Iniciar batalla') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({ nivel: { type: Object, required: true }, info: { type: Object, required: true }, bloqueada: Boolean })
const emit = defineEmits(['cerrar', 'repasar', 'iniciar'])
const { t } = useLanguage()
const { imageUrl, levelBackground } = useGameGraphics()
const esFinal = computed(() => props.nivel.numero === 5)
const arte = computed(() => (props.nivel.arte ? imageUrl(`${props.nivel.arte}/reposo.png`) : ''))
const fondo = computed(() => levelBackground(props.nivel))
</script>

<style scoped>
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
</style>
