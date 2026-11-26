<!--
  HomeHowToPlay.vue - VENTANA "CÓMO JUGAR"

  Se abre y se cierra desde fuera con v-model:
    <HomeHowToPlay v-model="showHowToPlay" />
-->

<template>
  <v-dialog v-model="open" max-width="500">
    <v-card color="brown-darken-4" rounded="lg" border>
      <v-card-title class="text-amber-lighten-2">📖 {{ t('Cómo jugar') }}</v-card-title>

      <v-list bg-color="transparent">
        <v-list-item v-for="(step, index) in localizedSteps" :key="index">
          <template #prepend>
            <v-avatar color="amber-darken-3" size="28">{{ index + 1 }}</v-avatar>
          </template>
          <v-list-item-title class="text-wrap">{{ step }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-card-actions>
        <v-btn variant="text" color="amber-lighten-2" @click="repetirRecorrido">{{ t('Repetir recorrido') }}</v-btn>
        <v-spacer />
        <v-btn color="amber" variant="flat" @click="open = false">{{ t('Entendido') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// v-model del componente: true = ventana abierta
const open = defineModel({ type: Boolean, default: false });
const { t } = useLanguage()

// Pasos que se muestran (array de textos)
const steps = [
  "Explora el mapa del reino y toca una zona para ver su ficha de misión. Desde la ficha puedes repasar el contenido o iniciar la batalla.",
  "Si juegas en celular, gira la pantalla para ver la arena en horizontal.",
  "Responde una pregunta de inglés. Si aciertas, elige un ataque con los botones en pantalla.",
  "Si fallas, el guardián te ataca. Después puedes revisar la respuesta correcta y su explicación.",
  "Completa las seis rondas para derrotar al guardián.",
  "Derrota al guardián para desbloquear la siguiente zona."
];

const recorrido = useRecorrido()
function repetirRecorrido() { open.value = false; recorrido.iniciar() }
const localizedSteps = computed(() => steps.map(t))
</script>
