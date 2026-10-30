<template>
  <v-img src="/images/home-background.svg" alt="Reino medieval de fantasía de noche" height="100vh" position="75% 50%"
    cover gradient="to bottom, rgba(5, 10, 23, 0.7), rgba(5, 10, 23, 0) 40%, rgba(5, 10, 23, 0.55)">
    <v-container fluid class="fill-height">
      <v-row class="fill-height" align-content="space-between">
        <!-- Arriba: título -->
        <v-col cols="12">
          <slot name="top" />
        </v-col>

        <!-- Abajo: héroe + menú -->
        <v-col cols="12">
          <v-row align="end">
            <v-col cols="12" md="3">
              <v-img src="/images/hero.svg" alt="Héroe medieval" height="40vh" />
            </v-col>
            <v-col cols="12" md="6">
              <slot name="bottom" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-img>
</template>
