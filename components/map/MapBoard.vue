<template>
  <div class="map-board" :style="{ aspectRatio: `${mapSize.width} / ${mapSize.height}` }">
    <MapScenery :zones="zones" />

    <MapZone
      v-for="(zone, index) in zones"
      :key="zone.id"
      :zone="zone"
      :number="index + 1"
      :selected="zone.id === selectedId"
      @select="emit('select-zone', $event)"
    />
  </div>
</template>

<script setup>
import { mapSize } from '~/data/zones'

defineProps({
  zones: { type: Array, required: true },
  selectedId: { type: String, default: null }
})

const emit = defineEmits(['select-zone'])
</script>

<style scoped>
.map-board {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 16px;
  border: 6px solid #2f1d0e;
  outline: 2px solid #b08a52;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  background: #1c3329;
}
</style>
