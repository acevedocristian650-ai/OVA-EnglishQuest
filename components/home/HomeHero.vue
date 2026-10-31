<!--
  HomeHero.vue - MARCO DE LA PORTADA

  Pone la ilustración de fondo y reparte el contenido en dos zonas:
    IZQUIERDA -> título (slot #title) y menú (slot #menu), uno debajo del otro
    CENTRO    -> el héroe, de pie en el camino, mirando hacia el castillo

  El fondo se oscurece de izquierda a derecha para que el texto se lea bien.
-->

<template>
  <v-img src="/images/home-background.svg" alt="Reino medieval de fantasía de noche" height="100vh" position="75% 50%"
    cover gradient="to right, rgba(5, 10, 23, 0.9), rgba(5, 10, 23, 0.5) 38%, rgba(5, 10, 23, 0) 68%">
    <v-container fluid class="fill-height px-6 px-md-12">
      <v-row class="fill-height" align="center">
        <!-- Izquierda: título + menú -->
        <v-col cols="12" md="4" align-self="center">
          <slot name="title" />
          <div class="mt-8 mt-md-12">
            <slot name="menu" />
          </div>
        </v-col>

        <!-- Centro: héroe (pegado abajo) -->
        <v-col cols="12" md="3" align-self="end" class="d-none d-md-block">
          <v-img src="/images/hero.svg" alt="Héroe medieval" height="58vh" />
        </v-col>
      </v-row>
    </v-container>
  </v-img>
</template>
