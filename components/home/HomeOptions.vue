<!--
  HomeOptions.vue - VENTANA "OPCIONES"

  Se abre y se cierra desde fuera con v-model:
    <HomeOptions v-model="showOptions" />
-->

<template>
  <v-dialog v-model="open" max-width="500">
    <v-card color="brown-darken-4" rounded="lg" border>
      <v-card-title class="text-amber-lighten-2">⚙️ Opciones</v-card-title>

      <v-card-text>
        <v-alert :icon="false" variant="tonal" color="amber" text="🛠️ Aquí irán las opciones del juego. ¡Próximamente!" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="amber" variant="flat" @click="open = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// v-model del componente: true = ventana abierta
const open = defineModel({ type: Boolean, default: false });
</script>
