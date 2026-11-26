<template>
  <div :class="{ 'iniciando-viaje': viajando }">
    <AudioMusicaHome v-if="introSeen" ruta="/audio/interfazentrada.mp3" />
    <HomeHero>
      <template #title>
        <HomeTitle />
      </template>

      <template #menu>
        <HomeMenu @start="startAdventure" />
      </template>
    </HomeHero>

    <!-- Primera visita: recorrido guiado sobre el menú y, al terminar, selección gráfica obligatoria -->
    <HomeTour v-if="listo && recorrido.activo.value" @fin="terminarRecorrido" />
    <HomeGamePreparation v-else-if="listo && !introSeen" />

    <!-- Transición cinemática de inmersión / portal hacia el mapa -->
    <HomePortalTransicion :activo="viajando" @completo="llegarAlMapa" />
  </div>
</template>

<script setup>
const { introSeen, loadPreferences } = useGameGraphics()
const progreso = usePlayerProgress()
const recorrido = useRecorrido()
const pantalla = usePantallaCompleta()
const viajando = ref(false)
const listo = ref(false)

onMounted(() => {
  loadPreferences()
  pantalla.iniciar()
  listo.value = true
  // El recorrido aparece solo en la primera visita (se guarda en localStorage); se puede repetir desde «Cómo jugar».
  if (!progreso.estado.ajustes.tourVisto && !introSeen.value) {
    // Con movimiento completo esperamos a que los botones terminen de entrar; el recorrido también los sigue si se mueven.
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => recorrido.iniciar(), reducido ? 0 : 2800)
  }
})

function terminarRecorrido() {
  recorrido.cerrar()
  progreso.ajustar({ tourVisto: true })
}

// Al pulsar COMENZAR AVENTURA: primero se pide la pantalla completa (dentro del gesto del usuario, de forma
// síncrona), y después se activa la animación de inmersión / portal.
function startAdventure() {
  if (viajando.value) return
  pantalla.solicitar()
  viajando.value = true
}

// Cuando la animación del portal culmina en el destello, navegamos al mapa
function llegarAlMapa() {
  navigateTo('/map')
}
</script>

<style scoped>
.iniciando-viaje {
  transition: transform 1.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 1.8s ease;
  transform: scale(1.06);
  opacity: 0.85;
  will-change: transform, opacity;
}
</style>
