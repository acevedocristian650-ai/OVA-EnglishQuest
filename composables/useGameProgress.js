// ============================================================
// PROGRESO DEL JUEGO (composables/useGameProgress.js)
// Guarda en MEMORIA el estado de las zonas y cuál está seleccionada.
// Usamos useState de Nuxt: es una variable reactiva COMPARTIDA, así la página
// del mapa y la página de zona ven los mismos datos.
// (No usa localStorage: si se recarga el navegador, el progreso se reinicia.)
//
// Nuxt importa este archivo automáticamente: solo hay que escribir
//   const { zones, selectZone } = useGameProgress()
// ============================================================

import { zonesData } from '~/data/zones'

export function useGameProgress() {
  // Copia de las zonas (así los datos originales no se modifican)
  const zones = useState('zones', () => zonesData.map((zone) => ({ ...zone })))

  // id de la zona seleccionada (null = ninguna)
  const selectedZoneId = useState('selectedZoneId', () => null)

  // ----- Valores calculados (se actualizan solos) -----
  const selectedZone = computed(() => {
    return zones.value.find((zone) => zone.id === selectedZoneId.value) || null
  })

  const completedCount = computed(() => {
    return zones.value.filter((zone) => zone.status === 'completed').length
  })

  const progressPercent = computed(() => {
    return Math.round((completedCount.value / zones.value.length) * 100)
  })

  // ----- Funciones -----
  function getZone(id) {
    return zones.value.find((zone) => zone.id === id) || null
  }

  // Selecciona una zona. Devuelve false si no existe o está bloqueada.
  function selectZone(id) {
    const zone = getZone(id)
    if (!zone || zone.status === 'locked') return false
    selectedZoneId.value = id
    return true
  }

  // Marca una zona como completada y desbloquea la siguiente.
  function completeZone(id) {
    const index = zones.value.findIndex((zone) => zone.id === id)
    if (index === -1 || zones.value[index].status === 'locked') return

    zones.value[index].status = 'completed'

    const nextZone = zones.value[index + 1]
    if (nextZone && nextZone.status === 'locked') {
      nextZone.status = 'unlocked'
    }
  }

  // Devuelve el juego al estado inicial
  function resetProgress() {
    zones.value = zonesData.map((zone) => ({ ...zone }))
    selectedZoneId.value = null
  }

  return {
    zones,
    selectedZoneId,
    selectedZone,
    completedCount,
    progressPercent,
    getZone,
    selectZone,
    completeZone,
    resetProgress
  }
}
