<template>
  <div class="game-page">
    <v-container>
      <!-- Barra superior: volver + título + progreso -->
      <v-row align="center" class="mb-2">
        <v-col cols="12" sm="auto">
          <v-btn to="/" variant="tonal" color="amber-lighten-3" rounded="lg">
            🏠 Volver al inicio
          </v-btn>
        </v-col>

        <v-col cols="12" sm>
          <h1 class="fantasy-title text-h4 text-md-h3 font-weight-black text-amber-lighten-2">
            Mapa del Reino
          </h1>
        </v-col>

        <v-col cols="12" md="4">
          <p class="text-body-2 mb-1">
            Progreso: {{ completedCount }} de {{ zones.length }} zonas completadas
          </p>
          <v-progress-linear
            :model-value="progressPercent"
            color="amber"
            bg-color="brown-darken-3"
            height="14"
            rounded
          />
        </v-col>
      </v-row>

      <v-row>
        <!-- Mapa -->
        <v-col cols="12" md="8">
          <MapBoard :zones="zones" :selected-id="selectedZoneId" @select-zone="onSelectZone" />
        </v-col>

        <!-- Panel de información -->
        <v-col id="zone-panel" cols="12" md="4">
          <ZoneDetails :zone="selectedZone" :number="selectedNumber" @start="onStartMission" />
        </v-col>
      </v-row>
    </v-container>

    <!-- Aviso cuando se toca una zona bloqueada -->
    <v-snackbar v-model="showLockedMessage" color="brown-darken-3" timeout="3000">
      {{ lockedMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const {
  zones,
  selectedZoneId,
  selectedZone,
  completedCount,
  progressPercent,
  getZone,
  selectZone
} = useGameProgress()

// Mensaje para zonas bloqueadas
const showLockedMessage = ref(false)
const lockedMessage = ref('')

// Número de la zona seleccionada (posición en la lista + 1)
const selectedNumber = computed(() => {
  return zones.value.findIndex((zone) => zone.id === selectedZoneId.value) + 1
})

// Se ejecuta cuando el jugador toca un punto del mapa
function onSelectZone(zoneId) {
  const selected = selectZone(zoneId)

  if (!selected) {
    // La zona está bloqueada: no se selecciona, solo se avisa qué falta
    const index = zones.value.findIndex((zone) => zone.id === zoneId)
    const previousZone = zones.value[index - 1]
    lockedMessage.value = `🔒 Zona bloqueada. Primero completa: ${previousZone.name}`
    showLockedMessage.value = true
    return
  }

  // En pantallas pequeñas el panel queda debajo del mapa: lo mostramos
  if (window.innerWidth < 960) {
    document.getElementById('zone-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Se ejecuta al pulsar "Comenzar misión" en el panel
function onStartMission(zoneId) {
  const zone = getZone(zoneId)
  if (!zone || zone.status === 'locked') return // doble protección
  navigateTo(`/zone/${zone.id}`)
}
</script>
