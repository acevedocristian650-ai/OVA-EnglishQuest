<!--
  HomeHowToPlay.vue - VENTANA "CÓMO JUGAR"

  Se abre y se cierra desde fuera con v-model:
    <HomeHowToPlay v-model="showHowToPlay" />
-->

<template>
  <v-dialog v-model="open" max-width="500">
    <v-card color="brown-darken-4" rounded="lg" border>
      <v-card-title class="text-amber-lighten-2">📖 Cómo jugar</v-card-title>

      <v-list bg-color="transparent">
        <v-list-item v-for="(step, index) in steps" :key="index">
          <template #prepend>
            <v-avatar color="amber-darken-3" size="28">{{ index + 1 }}</v-avatar>
          </template>
          <v-list-item-title class="text-wrap">{{ step }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-card-actions>
        <v-spacer />
        <v-btn color="amber" variant="flat" @click="open = false">Entendido</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// v-model del componente: true = ventana abierta
const open = defineModel({ type: Boolean, default: false });

// Pasos que se muestran (array de textos)
const steps = [
  "Elige a tu héroe.",
  "Explora el mapa del reino y escoge una zona.",
  "Responde preguntas de inglés para vencer a los enemigos.",
  "¡Gana batallas y salva el Reino del Conocimiento!"
];
</script>
