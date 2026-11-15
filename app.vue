<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<script setup>
const { language } = useLanguage()

useHead({
  htmlAttrs: {
    lang: computed(() => language.value)
  }
})
</script>