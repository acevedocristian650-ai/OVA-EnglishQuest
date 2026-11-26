<template>
  <span hidden aria-hidden="true" />
</template>

<script setup>
// Una sola música activa a la vez, con el volumen del canal «música» y recuperación ante el bloqueo
// de reproducción automática (se inicia con el primer toque, tecla o clic).
const props = defineProps({
  ruta: { type: String, required: true },
  volumen: { type: Number, default: 0.5 }
})
const progreso = usePlayerProgress()
const audio = shallowRef(null)
const audioEnPrimerPlano = useState('audio-en-primer-plano', () => false)
const eventosDesbloqueo = ['pointerdown', 'pointerup', 'click', 'keydown']
let intentoPendiente = false

function ponerDesbloqueo() {
  for (const tipo of eventosDesbloqueo) document.addEventListener(tipo, desbloquear, true)
}
function quitarDesbloqueo() {
  for (const tipo of eventosDesbloqueo) document.removeEventListener(tipo, desbloquear, true)
}
function desbloquear() { iniciarMusica() }
function iniciarMusica() {
  const pista = audio.value
  if (!pista || audioEnPrimerPlano.value || intentoPendiente) return
  if (!pista.paused) { quitarDesbloqueo(); return }
  intentoPendiente = true
  pista.play().then(() => {
    if (audio.value !== pista) return
    quitarDesbloqueo()
    if (audioEnPrimerPlano.value) pista.pause()
  }).catch((error) => {
    if (audio.value !== pista) return
    // Un primer toque no siempre cuenta como activación en móvil. Reintentar hasta que funcione.
    if (error?.name === 'NotAllowedError') ponerDesbloqueo()
    else if (error?.name !== 'AbortError') console.warn('[English Quest] No se pudo reproducir la música:', pista.src, error)
  }).finally(() => {
    intentoPendiente = false
    // Si se interrumpió una solicitud por una voz, el siguiente gesto podrá reanudarla.
    if (audio.value === pista && pista.paused && !audioEnPrimerPlano.value && !pista.error) ponerDesbloqueo()
  })
}

watch(audioEnPrimerPlano, (reproducirVoz) => {
  if (!audio.value) return
  if (reproducirVoz) audio.value.pause()
  else iniciarMusica()
})
watch(() => progreso.estado.ajustes.volumen.musica, aplicarVolumenMusica)

onMounted(() => {
  audio.value = new Audio(rutaAudio(props.ruta))
  audio.value.loop = true
  audio.value.onerror = () => console.warn('[English Quest] No se pudo cargar la música:', audio.value?.src)
  registrarMusica(audio.value, props.volumen)
  // Se arma antes del primer intento; se retira solamente al iniciar correctamente o desmontar.
  ponerDesbloqueo()
  iniciarMusica()
})

onUnmounted(() => {
  quitarDesbloqueo()
  if (audio.value) {
    const pista = audio.value
    audio.value = null
    pista.onerror = null
    pista.pause()
    pista.currentTime = 0
    liberarMusica(pista)
    pista.removeAttribute('src')
    pista.load()
  }
})
</script>
