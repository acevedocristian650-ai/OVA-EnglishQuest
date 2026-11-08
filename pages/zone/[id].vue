<template>
  <NuxtLink to="/map">Volver al mapa</NuxtLink>
</template>

<script setup>
await navigateTo('/map', { replace: true })
</script>
