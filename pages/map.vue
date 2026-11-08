<template>
  <AudioMusicaHome ruta="/audio/Mapa.mp3" />
  <section v-if="pantalla === 'mapa'" class="reino">
    <v-container class="contenido">
      <AudioSonidoBoton>
        <v-btn to="/" variant="text" color="amber-lighten-3">Volver al inicio</v-btn>
      </AudioSonidoBoton>

      <h1>Mapa del Reino</h1>
      <p>Sigue el camino dorado. Toca un marcador para entrar en la zona.</p>
      <p v-if="nivelDesbloqueado > niveles.length" class="conquista">Completaste las cuatro zonas del reino.</p>
      <MapBoard :niveles="niveles" :nivel-desbloqueado="nivelDesbloqueado" @elegir="entrar" />
    </v-container>
  </section>
  <CombatDesafio
    v-else-if="nivelActual"
    :key="intento"
    :nivel="nivelActual"
    @victoria="desbloquear"
    @volver="volverAlMapa"
    @reintentar="intento++"
  />
</template>

<script setup>
const pantalla = ref('mapa')
const nivelActual = ref(null)
const nivelDesbloqueado = ref(1)
const intento = ref(0)

const niveles = [
  {
    numero: 1, nombre: 'Bosque del Alba', tema: 'Introducción al futuro', guardian: 'Grifo del Alba',
    fondo: '/images/arenas/bosque-del-alba-animado.svg',
    arte: '/images/personajes-mate/grifo', golpe: 'Zarpazo del Alba', efecto: '/images/bosque-del-alba/zarpazo.svg',
    vida: 114, dano: 23, debilidad: 'hachazo', corte: true, derrota: true,
    preguntas: [
      { texto: 'Which word refers to the future?', opciones: ['Yesterday', 'Tomorrow', 'Last week'], correcta: 'Tomorrow', explicacion: 'Tomorrow significa «mañana» y sitúa una acción en el futuro.' },
      { texto: 'Which sentence talks about the future?', opciones: ['We played on Monday.', 'We play every day.', 'We are going to play next week.'], correcta: 'We are going to play next week.', explicacion: 'Next week significa «la próxima semana» y be going to expresa un plan.' },
      { texto: 'Complete: The festival starts ___ Saturday.', opciones: ['next', 'last', 'ago'], correcta: 'next', explicacion: 'Next Saturday indica el sábado que viene.' },
      { texto: 'Put the words in order.', tipo: 'ordenar', opciones: ['tomorrow.', 'will', 'We', 'study'], correcta: 'We will study tomorrow.', explicacion: 'Usa sujeto, will, verbo base y la expresión de tiempo.' },
      { texto: 'Which expression means «dentro de dos días»?', opciones: ['Two days ago', 'In two days', 'For two days'], correcta: 'In two days', explicacion: 'In + un período indica cuánto falta para que algo ocurra.' },
      { texto: 'Which sentence describes a future plan?', opciones: ['I am going to visit my cousin.', 'I visited my cousin.', 'I visit my cousin every month.'], correcta: 'I am going to visit my cousin.', explicacion: 'Am going to visit expresa una intención para el futuro.' }
    ]
  },
  {
    numero: 2, nombre: 'Puente del Río', tema: 'Be going to', guardian: 'Basilisco del Río',
    fondo: '/images/arenas/puente-del-rio-animado.svg',
    arte: '/images/personajes-mate/rio', golpe: 'Coletazo del Río', efecto: '/images/jefes/rio/coletazo.svg',
    vida: 117, dano: 25, debilidad: 'escudo',
    preguntas: [
      { texto: 'Complete the plan: We ___ going to visit the castle.', opciones: ['am', 'is', 'are'], correcta: 'are', explicacion: 'Con we usamos are going to.' },
      { texto: 'Complete: She is going to ___ a book.', opciones: ['reads', 'read', 'reading'], correcta: 'read', explicacion: 'Después de going to va el verbo base.' },
      { texto: 'Make it negative: He is going to run.', opciones: ['He is not going to run.', 'He not is going to run.', 'He is going to not runs.'], correcta: 'He is not going to run.', explicacion: 'Coloca not después de is para formar la negativa.' },
      { texto: 'Make a question: They are going to swim.', opciones: ['They are going to swim?', 'Do they going to swim?', 'Are they going to swim?'], correcta: 'Are they going to swim?', explicacion: 'Para preguntar, coloca are antes del sujeto.' },
      { texto: 'Put the words in order.', tipo: 'ordenar', opciones: ['going to', 'I', 'practice.', 'am'], correcta: 'I am going to practice.', explicacion: 'Orden: sujeto, am, going to y verbo base.' },
      { texto: 'Look at those dark clouds. It ___ rain.', opciones: ['is going to', 'are going to', 'am going to'], correcta: 'is going to', explicacion: 'Con it usamos is going to. Las nubes son evidencia de lo que puede ocurrir.' }
    ]
  },
  {
    numero: 3, nombre: 'Torre del Viento', tema: 'Will', guardian: 'Águila de la Tormenta',
    fondo: '/images/arenas/torre-del-viento-animado.svg',
    arte: '/images/personajes-mate/viento', golpe: 'Picado de la Tormenta', efecto: '/images/jefes/viento/picado.svg',
    vida: 120, dano: 27, debilidad: 'barrido', corte: true,
    preguntas: [
      { texto: 'Complete the prediction: I think it will ___ tomorrow.', opciones: ['rain', 'rains', 'raining'], correcta: 'rain', explicacion: 'Después de will va el verbo base, sin -s ni -ing.' },
      { texto: 'Make it negative: We will arrive early.', opciones: ['We not will arrive early.', 'We will not arrive early.', 'We do not will arrive early.'], correcta: 'We will not arrive early.', explicacion: 'La negativa se forma con will not o su contracción, won’t.' },
      { texto: 'Make a question: You will help us.', opciones: ['Do you will help us?', 'You will help us?', 'Will you help us?'], correcta: 'Will you help us?', explicacion: 'Para preguntar, escribe will antes del sujeto.' },
      { texto: 'Put the words in order.', tipo: 'ordenar', opciones: ['win', 'The team', 'tomorrow.', 'will'], correcta: 'The team will win tomorrow.', explicacion: 'Orden: sujeto, will, verbo base y expresión de tiempo.' },
      { texto: 'The phone is ringing. What is a decision you can make now?', opciones: ['I answered it yesterday.', 'I will answer it.', 'I answer it every day.'], correcta: 'I will answer it.', explicacion: 'Puedes usar will para expresar una decisión tomada en el momento.' },
      { texto: 'Which sentence makes a promise?', opciones: ['I will return your book tomorrow.', 'I returned your book yesterday.', 'I return books on Fridays.'], correcta: 'I will return your book tomorrow.', explicacion: 'Will sirve para expresar un compromiso sobre una acción futura.' }
    ]
  },
  {
    numero: 4, nombre: 'Puerta Real', tema: 'Traffic signs and rules', guardian: 'Dragón de la Puerta Real',
    fondo: '/images/arenas/puerta-real-animado.svg',
    arte: '/images/personajes-mate/real', golpe: 'Aliento Escarlata', efecto: '/images/jefes/real/aliento.svg',
    vida: 126, dano: 31, debilidad: 'escudo',
    preguntas: [
      { texto: 'What must a driver do at this sign?', imagen: '/images/signs/stop.svg', alt: 'Octágono rojo con la palabra STOP', opciones: ['Speed up', 'Come to a complete stop', 'Keep going'], correcta: 'Come to a complete stop', explicacion: 'Una señal STOP indica que debes detenerte por completo.' },
      { texto: 'What does this sign mean?', imagen: '/images/signs/yield.svg', alt: 'Triángulo blanco invertido con borde rojo', opciones: ['No entry', 'Parking area', 'Give way'], correcta: 'Give way', explicacion: 'Give way significa «ceder el paso» al tránsito que tiene prioridad.' },
      { texto: 'Which rule matches this sign?', imagen: '/images/signs/no-entry.svg', alt: 'Círculo rojo con una franja horizontal blanca', opciones: ['Do not enter.', 'Turn left.', 'Stop here to park.'], correcta: 'Do not enter.', explicacion: 'La franja blanca sobre el círculo rojo indica que la entrada está prohibida.' },
      { texto: 'Where should you cross the street?', opciones: ['At a pedestrian crossing', 'Between parked cars', 'In the middle of any block'], correcta: 'At a pedestrian crossing', explicacion: 'Pedestrian crossing significa «paso peatonal».' },
      { texto: 'What should you wear when riding a bike?', opciones: ['A scarf', 'A helmet', 'Headphones'], correcta: 'A helmet', explicacion: 'Helmet significa «casco» y protege la cabeza.' },
      { texto: 'A traffic light is red. What does it tell a driver to do?', opciones: ['Drive faster', 'Change lanes', 'Stop'], correcta: 'Stop', explicacion: 'La luz roja indica que debes detenerte.' }
    ]
  }
]

function entrar(numero) {
  if (numero > nivelDesbloqueado.value) return
  const nivel = niveles.find((zona) => zona.numero === numero)
  if (!nivel) return

  nivelActual.value = nivel
  pantalla.value = 'combate'
}

function desbloquear() {
  if (nivelActual.value.numero === nivelDesbloqueado.value) {
    nivelDesbloqueado.value++
  }
}

function volverAlMapa() {
  pantalla.value = 'mapa'
  nivelActual.value = null
}
</script>

<style scoped>
.reino {
  min-height: 100dvh;
  background: #0b1325;
}

.contenido {
  max-width: 950px;
}

h1 {
  margin-top: 0.75rem;
  color: #ffe09a;
  font-family: 'Cinzel', Georgia, serif;
}

p {
  margin: 0.25rem 0 1rem;
}

.conquista { color: #a9e8c3; }
</style>
