<template>
  <div class="map-zone" :style="positionStyle">
    <v-btn icon variant="flat" :color="statusInfo.color" class="zone-button" :class="{
      'zone-selected': selected,
      'zone-locked': zone.status === 'locked',
      'zone-available': zone.status === 'unlocked' && !selected,
    }" :aria-label="`${zone.name}: ${statusInfo.label}`" :aria-pressed="selected" @click="emit('select', zone.id)">
      <span class="zone-icon">{{ icon }}</span>
    </v-btn>

    <!-- El nombre se oculta en pantallas muy pequeñas; allí se lee en el panel -->
    <span class="zone-label d-none d-sm-block" :class="{ 'zone-label-selected': selected }">
      {{ zone.name }}
    </span>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { mapSize, zoneStatuses } from "~/data/zones";

const props = defineProps({
  zone: { type: Object, required: true },
  number: { type: Number, required: true },
  selected: { type: Boolean, default: false },
});

const emit = defineEmits(["select"]);

// Datos del estado actual (texto, color e icono)
const statusInfo = computed(() => zoneStatuses[props.zone.status]);

// Qué se escribe dentro del botón según el estado
const icon = computed(() => {
  if (props.zone.status === "locked") return "🔒";
  if (props.zone.status === "completed") return "✔️";
  return props.number;
});

// Convierte x / y del mapa a porcentajes para que el punto escale con el dibujo
const positionStyle = computed(() => ({
  left: `${(props.zone.x / mapSize.width) * 100}%`,
  top: `${(props.zone.y / mapSize.height) * 100}%`,
}));
</script>

<style scoped>
.map-zone {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.zone-button {
  width: 36px;
  height: 36px;
  border: 3px solid #2f1d0e;
  font-weight: 900;
  font-size: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
  transition: transform 0.15s;
}

.zone-icon {
  line-height: 1;
}

.zone-locked {
  opacity: 0.85;
  cursor: not-allowed;
}

.zone-selected {
  transform: scale(1.2);
  border-color: #fff4c8;
  box-shadow:
    0 0 0 4px rgba(255, 244, 200, 0.5),
    0 0 24px 8px rgba(255, 178, 60, 0.85);
}

/* Latido suave en las zonas que ya se pueden jugar */
.zone-available {
  animation: pulse 2.2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    box-shadow:
      0 4px 10px rgba(0, 0, 0, 0.6),
      0 0 0 0 rgba(255, 178, 60, 0.7);
  }

  50% {
    box-shadow:
      0 4px 10px rgba(0, 0, 0, 0.6),
      0 0 0 10px rgba(255, 178, 60, 0);
  }
}

.zone-label {
  margin-top: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(47, 29, 14, 0.9);
  border: 1px solid #b08a52;
  color: #f5e6c0;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.zone-label-selected {
  background: #c27a14;
  color: #fff;
  border-color: #fff4c8;
}

@media (min-width: 600px) {
  .zone-button {
    width: 56px;
    height: 56px;
    font-size: 1.3rem;
  }
}

@media (min-width: 960px) {
  .zone-label {
    font-size: 0.85rem;
  }
}

/* Respeta a quien prefiere pocas animaciones */
@media (prefers-reduced-motion: reduce) {
  .zone-available {
    animation: none;
  }
}
</style>
