<template>
  <div class="game-page">
    <v-container v-if="zone" class="zone-container">
      <v-btn to="/map" variant="tonal" color="amber-lighten-3" rounded="lg" class="mb-4">
        🗺️ Volver al mapa
      </v-btn>

      <v-sheet
        color="rgba(47, 29, 14, 0.92)"
        rounded="xl"
        border="md"
        elevation="10"
        class="pa-4 pa-md-8"
      >
        <p class="text-overline text-grey-lighten-1">{{ zone.topic }}</p>
        <h1 class="fantasy-title text-h4 text-md-h3 font-weight-black text-amber-lighten-2 mb-3">
          {{ zone.name }}
        </h1>
        <p class="text-body-1 mb-6">{{ zone.description }}</p>

        <v-row>
          <!-- Qué se practica -->
          <v-col cols="12" md="7">
            <h2 class="text-h6 text-amber-lighten-3 mb-2">📘 Qué vas a practicar</h2>
            <v-list bg-color="transparent" density="compact">
              <v-list-item v-for="content in zone.contents" :key="content">
                <template #prepend><span class="mr-3">◆</span></template>
                <v-list-item-title class="text-wrap">{{ content }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>

          <!-- Guardián -->
          <v-col cols="12" md="5">
            <v-sheet color="rgba(0, 0, 0, 0.3)" rounded="lg" class="pa-4 text-center">
              <div class="enemy-emoji">{{ zone.enemy.emoji }}</div>
              <p class="text-overline">Guardián de la zona</p>
              <p class="text-h6 font-weight-bold">{{ zone.enemy.name }}</p>
            </v-sheet>
          </v-col>
        </v-row>

        <v-alert
          :icon="false"
          variant="tonal"
          color="amber"
          class="my-6"
          text="🛠️ Aquí irá el combate por turnos: preguntas, tres vidas, temporizador de 30 segundos y la vida del enemigo. ¡Próximamente!"
        />

        <!-- Botón temporal para probar el desbloqueo de zonas -->
        <v-btn color="green-darken-1" size="large" rounded="lg" block @click="simulateVictory">
          🏆 Simular victoria (temporal)
        </v-btn>
      </v-sheet>
    </v-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const route = useRoute()
const { getZone, completeZone, selectZone } = useGameProgress()

// Buscamos la zona que pide la ruta
const zone = computed(() => getZone(route.params.id))

// Si la zona no existe o sigue bloqueada, volvemos al mapa
if (!zone.value || zone.value.status === 'locked') {
  await navigateTo('/map')
}

// TEMPORAL: completa la zona, desbloquea la siguiente y regresa al mapa
function simulateVictory() {
  completeZone(zone.value.id)
  selectZone(zone.value.id)
  navigateTo('/map')
}
</script>

<style scoped>
.zone-container {
  max-width: 900px;
}

.enemy-emoji {
  font-size: 4rem;
  line-height: 1.2;
}
</style>
