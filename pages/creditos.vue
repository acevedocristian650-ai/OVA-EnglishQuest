<template>
  <div class="pagina">
    <AudioMusicaHome ruta="/audio/Mapa.mp3" :volumen="0.35" />
    <header class="cab">
      <AudioSonidoBoton @click="irAlMenu()"><button type="button" class="volver">← {{ t('Regresar al menú') }}</button></AudioSonidoBoton>
      <h1>{{ t('Créditos') }}</h1>
    </header>
    <main class="caja"><CreditosPanel /></main>
  </div>
</template>

<script setup>
const { t } = useLanguage()
const irAlMenu = () => navigateTo('/')
const { loadPreferences } = useGameGraphics()
onMounted(loadPreferences)
useHead({ title: computed(() => `${t('Créditos')} · English Quest`) })
</script>

<style scoped>
.pagina { min-height: 100dvh; padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); background: radial-gradient(ellipse at top, #2a3140, #0f1521 70%); }
.cab { display: flex; align-items: center; gap: .8rem; max-width: 1100px; margin: 0 auto .6rem; }
.cab h1 { margin: 0; color: #ffe09a; font: 700 clamp(1.2rem, 4vw, 1.8rem) Georgia, serif; }
.volver { min-height: 44px; padding: 0 .9rem; color: #ffe09a; background: #1b2635cc; border: 1px solid #b3955c; border-radius: 8px; cursor: pointer; font-weight: 600; }
.volver:focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }
.caja { max-width: 1100px; margin: 0 auto; padding: clamp(.9rem, 3vw, 1.6rem); border: 1px solid #8f7959; border-radius: 12px; background: #121a28ee; }
</style>
