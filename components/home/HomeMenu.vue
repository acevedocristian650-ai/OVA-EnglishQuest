<template>
  <div>
    <v-sheet color="rgba(47, 29, 14, 0.85)" rounded="xl" border="md" elevation="10" class="pa-4">
      <!-- Botón principal -->
      <v-btn block size="x-large" color="amber-darken-3" rounded="lg" elevation="8" class="font-weight-bold mb-3" @click="emit('start')"> ⚔️ Comenzar aventura </v-btn>

      <!-- Botones secundarios -->
      <v-row dense>
        <v-col cols="6">
          <v-btn block variant="tonal" color="amber-lighten-3" @click="showHowToPlay = true"> 📖 Cómo jugar </v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn block variant="tonal" color="amber-lighten-3" @click="showOptions = true"> ⚙️ Opciones </v-btn>
        </v-col>
      </v-row>
    </v-sheet>

    <!-- Ventana: Cómo jugar -->
    <v-dialog v-model="showHowToPlay" max-width="500">
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
          <v-btn color="amber" variant="flat" @click="showHowToPlay = false">Entendido</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Ventana: Opciones -->
    <v-dialog v-model="showOptions" max-width="500">
      <v-card color="brown-darken-4" rounded="lg" border>
        <v-card-title class="text-amber-lighten-2">⚙️ Opciones</v-card-title>

        <v-card-text>
          <v-alert :icon="false" variant="tonal" color="amber" text="🛠️ Aquí irán las opciones del juego. ¡Próximamente!" />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="amber" variant="flat" @click="showOptions = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
// Aviso que este componente envía a la página
const emit = defineEmits(["start"]);

// ¿Qué ventana está abierta?
const showHowToPlay = ref(false);
const showOptions = ref(false);

// Pasos que se muestran en "Cómo jugar" (array de textos)
const steps = ["Elige a tu héroe.", "Explora el mapa del reino y escoge una zona.", "Responde preguntas de inglés para vencer a los enemigos.", "¡Gana batallas y salva el Reino del Conocimiento!"];
</script>
