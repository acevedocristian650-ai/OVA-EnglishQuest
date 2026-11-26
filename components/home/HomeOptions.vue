<!--
  HomeOptions.vue - VENTANA "OPCIONES" (menú principal y atajo desde el mapa)
  Reúne, con la estructura de siempre, idioma, gráficos, accesibilidad y volumen. Los bloques de gráficos y de
  accesibilidad son los mismos componentes que usan los botones independientes del mapa, las batallas y Contenidos.
-->
<template>
  <v-dialog v-model="open" max-width="560" scrollable>
    <v-card color="brown-darken-4" rounded="lg" border>
      <v-card-title class="text-amber-lighten-2">{{ t('Opciones') }}</v-card-title>

      <v-card-text class="opciones-cuerpo">
        <p class="text-subtitle-1 mb-2">{{ t('Idioma') }}</p>
        <v-btn-toggle v-model="language" mandatory color="amber-lighten-2" divided :aria-label="t('Selector de idioma')">
          <v-btn value="es" :aria-pressed="language === 'es'">{{ t('Español') }}</v-btn>
          <v-btn value="en" :aria-pressed="language === 'en'">{{ t('Inglés') }}</v-btn>
        </v-btn-toggle>

        <p class="text-subtitle-1 mt-5 mb-2">{{ t('Gráficos') }}</p>
        <UiAjustesGraficos />

        <p class="text-subtitle-1 mt-5 mb-2">{{ t('Accesibilidad') }}</p>
        <UiAjustesAccesibilidad />

        <p class="text-subtitle-1 mt-5 mb-2">{{ t('Volumen') }}</p>
        <div v-for="canal in canales" :key="canal.id" class="ajuste">
          <label :for="`vol-${canal.id}`">{{ t(canal.nombre) }}</label>
          <input :id="`vol-${canal.id}`" type="range" min="0" max="100" step="5" :value="Math.round(ajustes.volumen[canal.id] * 100)"
            :aria-valuetext="`${Math.round(ajustes.volumen[canal.id] * 100)} %`"
            @input="cambiar({ volumen: { ...ajustes.volumen, [canal.id]: $event.target.value / 100 } })">
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn v-if="progreso" variant="text" color="amber-lighten-2" @click="open = false; emit('estadisticas')">{{ t('Estadísticas') }}</v-btn>
        <v-spacer />
        <v-btn color="amber" variant="flat" @click="open = false">{{ t('Cerrar') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const open = defineModel({ type: Boolean, default: false })
defineProps({ progreso: { type: Boolean, default: false } })
const emit = defineEmits(['estadisticas'])
const { language, t } = useLanguage()
const store = usePlayerProgress()
const ajustes = computed(() => store.estado.ajustes)
const cambiar = (cambios) => store.ajustar(cambios)
const canales = [{ id: 'musica', nombre: 'Música' }, { id: 'efectos', nombre: 'Efectos' }, { id: 'voces', nombre: 'Voces' }]
</script>

<style scoped>
.opciones-cuerpo { max-height: 70vh; }
.ajuste { display: flex; align-items: center; justify-content: space-between; gap: .75rem; min-height: 44px; }
.ajuste input[type='range'] { flex: 1; max-width: 55%; min-height: 32px; accent-color: #f2d28c; }
</style>
