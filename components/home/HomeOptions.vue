<!--
  HomeOptions.vue - VENTANA "OPCIONES"

  Se abre y se cierra desde fuera con v-model:
    <HomeOptions v-model="showOptions" />
-->

<template>
  <v-dialog v-model="open" max-width="500">
    <v-card color="brown-darken-4" rounded="lg" border>
      <v-card-title class="text-amber-lighten-2">⚙️ {{ t('Opciones') }}</v-card-title>

      <v-card-text>
        <p class="text-subtitle-1 mb-3">{{ t('Idioma') }}</p>
        <v-btn-toggle v-model="language" mandatory color="amber-lighten-2" divided :aria-label="t('Selector de idioma')">
          <v-btn value="es" :aria-pressed="language === 'es'">{{ t('Español') }}</v-btn>
          <v-btn value="en" :aria-pressed="language === 'en'">{{ t('Inglés') }}</v-btn>
        </v-btn-toggle>
        <p class="text-subtitle-1 mt-5 mb-3">{{ t('Calidad gráfica') }}</p>
        <v-btn-toggle :model-value="quality" mandatory color="amber-lighten-2" divided
          :aria-label="t('Selector de calidad gráfica')" @update:model-value="setQuality">
          <v-btn value="alta">{{ t('Alta') }}</v-btn>
          <v-btn value="equilibrada">{{ t('Equilibrada') }}</v-btn>
          <v-btn value="lite">Lite</v-btn>
        </v-btn-toggle>
        <p class="text-caption mt-2">{{ t('Los cambios se aplican de inmediato y sus efectos se actualizan de forma segura entre acciones.') }}</p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="amber" variant="flat" @click="open = false">{{ t('Cerrar') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// v-model del componente: true = ventana abierta
const open = defineModel({ type: Boolean, default: false });
const { language, t } = useLanguage()
const { quality, setQuality } = useGameGraphics()
</script>
