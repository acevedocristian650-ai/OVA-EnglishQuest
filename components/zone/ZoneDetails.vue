<!--
  ZoneDetails.vue - PANEL DE INFORMACIÓN DE LA ZONA

  Muestra los datos de la zona seleccionada. Si no hay ninguna, invita a elegir una.
  No navega por sí mismo: solo avisa a la página con el evento "start".

  Props:  zone (o null), number
  Evento: start -> con el id de la zona
-->

<template>
  <v-sheet
    color="rgba(47, 29, 14, 0.92)"
    rounded="xl"
    border="md"
    elevation="10"
    class="pa-4 pa-md-6"
  >
    <!-- Con zona seleccionada -->
    <div v-if="zone">
      <p class="text-overline text-grey-lighten-1">Zona {{ number }}</p>
      <h2 class="fantasy-title text-h5 text-md-h4 font-weight-black text-amber-lighten-2 mb-3">
        {{ zone.name }}
      </h2>

      <p class="text-body-1 mb-4">{{ zone.description }}</p>

      <v-list bg-color="transparent" density="compact" class="pa-0 mb-4">
        <v-list-item class="px-0">
          <template #prepend><span class="mr-3">📘</span></template>
          <v-list-item-title class="text-wrap">
            <strong>Tema de inglés:</strong> {{ zone.topic }}
          </v-list-item-title>
        </v-list-item>

        <v-list-item class="px-0">
          <template #prepend><span class="mr-3">⭐</span></template>
          <v-list-item-title class="text-wrap">
            <strong>Dificultad:</strong> {{ stars }} {{ difficultyName }}
          </v-list-item-title>
        </v-list-item>

        <v-list-item class="px-0">
          <template #prepend><span class="mr-3">{{ statusInfo.icon }}</span></template>
          <v-list-item-title class="text-wrap">
            <strong>Estado:</strong>
            <v-chip size="small" :color="statusInfo.color" class="ml-2">{{ statusInfo.label }}</v-chip>
          </v-list-item-title>
        </v-list-item>

        <v-list-item class="px-0">
          <template #prepend><span class="mr-3">{{ zone.enemy.emoji }}</span></template>
          <v-list-item-title class="text-wrap">
            <strong>Guardián:</strong> {{ zone.enemy.name }}
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-btn
        block
        size="x-large"
        color="amber-darken-3"
        rounded="lg"
        elevation="8"
        class="font-weight-bold"
        :disabled="zone.status === 'locked'"
        @click="emit('start', zone.id)"
      >
        {{ zone.status === 'completed' ? '🔁 Repetir misión' : '⚔️ Comenzar misión' }}
      </v-btn>
    </div>

    <!-- Sin zona seleccionada -->
    <div v-else class="text-center py-4">
      <v-img src="/images/hero.svg" alt="Héroe medieval" height="160" class="mb-3" />
      <h2 class="fantasy-title text-h5 font-weight-black text-amber-lighten-2 mb-2">
        Elige tu destino
      </h2>
      <p class="text-body-1 text-grey-lighten-2">
        Toca una zona disponible del mapa para ver su información y comenzar la misión.
      </p>
    </div>
  </v-sheet>
</template>

<script setup>
import { computed } from 'vue'
import { difficultyNames, zoneStatuses } from '~/data/zones'

const props = defineProps({
  zone: { type: Object, default: null },
  number: { type: Number, default: 0 }
})

const emit = defineEmits(['start'])

// Valores derivados de la zona (se recalculan cuando cambia la zona)
const statusInfo = computed(() => (props.zone ? zoneStatuses[props.zone.status] : null))
const stars = computed(() => (props.zone ? '⭐'.repeat(props.zone.difficulty) : ''))
const difficultyName = computed(() => (props.zone ? difficultyNames[props.zone.difficulty - 1] : ''))
</script>
