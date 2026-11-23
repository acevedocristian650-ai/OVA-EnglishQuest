<template>
  <v-app :data-graphics="quality">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<script setup>
const { language } = useLanguage()
const { quality, loadPreferences } = useGameGraphics()

onMounted(loadPreferences)

useHead({
  htmlAttrs: {
    lang: computed(() => language.value)
  }
})
</script>
