<template>
  <!-- Una pista por pantalla: el key obliga a desmontar una y montar la otra al cambiar. -->
  <AudioMusicaHome v-if="pantalla === 'mapa'" key="musica-mapa" ruta="/audio/Mapa.mp3" />
  <AudioMusicaHome v-else :key="`musica-combate-${nivelActual?.numero}`"
    :ruta="`/audio/combate/batalla-${nivelActual?.numero ?? 1}.mp3`" :volumen="0.4" />
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

  <!-- Transición Cinemática de Encuentro / Versus al entrar al nivel -->
  <MapEncuentroTransicion
    :activo="enTransicion"
    :nivel="nivelSeleccionado"
    @listo="iniciarCombate"
  />
</template>

<script setup>
const pantalla = ref('mapa')
const nivelActual = ref(null)
const nivelSeleccionado = ref(null)
const enTransicion = ref(false)
const nivelDesbloqueado = ref(1)
const intento = ref(0)

const niveles = [
  {
    "numero": 1,
    "nombre": "Bosque del Alba",
    "tema": "Introducción al futuro",
    "guardian": "Grifo del Alba",
    "fondo": "/images/arenas/bosque-del-alba-animado.svg",
    "arte": "/images/personajes-mate/grifo",
    "golpe": "Zarpazo del Alba",
    "efecto": "/images/bosque-del-alba/zarpazo.svg",
    "vida": 114,
    "dano": 23,
    "debilidad": "hachazo",
    "corte": true,
    "derrota": true,
    "preguntas": [
      {
        "tipo": "clasificar",
        "texto": "Arrastra futuro al héroe y pasado al monstruo.",
        "palabras": [
          {
            "texto": "tomorrow",
            "futuro": true
          },
          {
            "texto": "yesterday",
            "futuro": false
          },
          {
            "texto": "next week",
            "futuro": true
          },
          {
            "texto": "last night",
            "futuro": false
          }
        ],
        "correcta": "Héroe: tomorrow, next week · Monstruo: yesterday, last night",
        "explicacion": "Tomorrow y next week indican futuro. Yesterday y last night indican pasado."
      },
      {
        "tipo": "ordenar",
        "texto": "Put the expedition plan in order.",
        "fichas": [
          "next week.",
          "going to",
          "We",
          "explore the forest",
          "are"
        ],
        "correcta": "We are going to explore the forest next week.",
        "explicacion": "Next week ubica la expedición en la semana siguiente."
      },
      {
        "tipo": "cortar",
        "texto": "Which phrase refers to the future?",
        "opciones": [
          "Yesterday",
          "Next week",
          "Last night"
        ],
        "correcta": "Next week",
        "explicacion": "Next week significa la próxima semana."
      },
      {
        "tipo": "hacha",
        "texto": "The griffin will strike!",
        "correcta": "Cut all three energy balls.",
        "explicacion": "Arrastra el hacha para cortar las tres bolas de energía."
      },
      {
        "tipo": "ordenar",
        "texto": "Write the time expression for the next patrol.",
        "contexto": "The patrol leaves 48 hours from now. Use the word days.",
        "antes": "The patrol leaves",
        "despues": ".",
        "correcta": "The patrol leaves in two days.",
        "explicacion": "In two days significa «dentro de dos días».",
        "fichas": [
          "patrol",
          "in",
          "days.",
          "The",
          "leaves",
          "two"
        ]
      },
      {
        "tipo": "ordenar",
        "texto": "Assemble the knight's plan for this evening.",
        "fichas": [
          "tonight.",
          "am",
          "check the gate",
          "I",
          "going to"
        ],
        "correcta": "I am going to check the gate tonight.",
        "explicacion": "Am going to expresa un plan que el caballero ya tiene."
      }
    ]
  },
  {
    "numero": 2,
    "remate": "cruzado",
    "nombre": "Puente del Río",
    "tema": "Be going to",
    "guardian": "Basilisco del Río",
    "fondo": "/images/arenas/puente-del-rio-animado.svg",
    "arte": "/images/personajes-mate/rio",
    "golpe": "Coletazo del Río",
    "efecto": "/images/jefes/rio/coletazo.svg",
    "vida": 117,
    "dano": 25,
    "debilidad": "escudo",
    "preguntas": [
      {
        "tipo": "ordenar",
        "texto": "Cancel the crossing. Make the sentence negative.",
        "modelo": "He is going to cross the bridge.",
        "correcta": "He is not going to cross the bridge.",
        "explicacion": "Coloca not después de is para formar la negativa.",
        "fichas": [
          "is",
          "going",
          "cross",
          "bridge.",
          "He",
          "not",
          "to",
          "the"
        ]
      },
      {
        "tipo": "esquivar",
        "texto": "The basilisk is going to attack on the left!",
        "lado": "izquierda",
        "correcta": "Move right.",
        "explicacion": "On the left indica que el ataque viene por la izquierda. Mueve al héroe al lado derecho."
      },
      {
        "tipo": "cortar",
        "texto": "We ___ going to cross the river.",
        "opciones": [
          "are",
          "am",
          "is"
        ],
        "correcta": "are",
        "explicacion": "Con we se usa are going to."
      },
      {
        "tipo": "hacha",
        "texto": "The basilisk is going to attack!",
        "correcta": "Cut all three energy balls.",
        "explicacion": "Arrastra el hacha para cortar las tres bolas de energía."
      },
      {
        "tipo": "esquiva-frase",
        "texto": "It ___ attack!",
        "fichas": [
          "are going to",
          "is going to",
          "am going to"
        ],
        "correcta": "is going to",
        "explicacion": "Con it usamos is going to seguido del verbo base: It is going to attack!"
      },
      {
        "tipo": "ordenar",
        "texto": "Warn the knight using be going to.",
        "contexto": "Look! A loose stone is sliding off the bridge.",
        "antes": "It",
        "despues": "fall.",
        "correcta": "It is going to fall.",
        "explicacion": "La piedra ya se está moviendo. Usamos is going to para predecir lo que puede pasar a partir de esa pista.",
        "fichas": [
          "is",
          "to",
          "It",
          "going",
          "fall."
        ]
      }
    ]
  },
  {
    "numero": 3,
    "remate": "solar",
    "nombre": "Torre del Viento",
    "tema": "Will",
    "guardian": "Águila de la Tormenta",
    "fondo": "/images/arenas/torre-del-viento-animado.svg",
    "arte": "/images/personajes-mate/viento",
    "golpe": "Picado de la Tormenta",
    "efecto": "/images/jefes/viento/picado.svg",
    "vida": 120,
    "dano": 27,
    "debilidad": "barrido",
    "corte": true,
    "preguntas": [
      {
        "tipo": "ordenar",
        "texto": "Complete the prediction about the storm.",
        "contexto": "Use the verb reach.",
        "antes": "I think the storm will",
        "despues": "the tower tonight.",
        "correcta": "I think the storm will reach the tower tonight.",
        "explicacion": "Después de will usamos el verbo base, reach.",
        "fichas": [
          "think",
          "storm",
          "reach",
          "tower",
          "I",
          "the",
          "will",
          "the",
          "tonight."
        ]
      },
      {
        "tipo": "romper-hechizo",
        "texto": "Make the spell negative.",
        "invocacion": true,
        "huecos": [
          2,
          3
        ],
        "frase": [
          "The",
          "hero",
          "will",
          "fall!"
        ],
        "correcta": "The hero will not fall.",
        "explicacion": "Coloca not después de will para negar lo que anuncia el hechizo: The hero will not fall."
      },
      {
        "tipo": "cortar",
        "texto": "I will ___ you.",
        "opciones": [
          "helped",
          "helps",
          "help"
        ],
        "correcta": "help",
        "explicacion": "Después de will va el verbo en su forma base: help."
      },
      {
        "tipo": "hacha",
        "texto": "The eagle will strike!",
        "correcta": "Cut all three energy balls.",
        "explicacion": "Arrastra el hacha para cortar las tres bolas de energía."
      },
      {
        "tipo": "proteger-aliado",
        "texto": "Promise to protect the ally.",
        "contexto": "Promise you will protect me!",
        "nodos": [
          "I",
          "will",
          "did",
          "protect you."
        ],
        "correcta": "I will protect you.",
        "explicacion": "I will protect you expresa una promesa. Will va seguido del verbo base protect."
      },
      {
        "tipo": "ordenar",
        "texto": "Complete the knight's promise. Use will or 'll.",
        "contexto": "Promise to return the key tomorrow.",
        "modelo": "I promise…",
        "correcta": "I promise I will return the key tomorrow.",
        "explicacion": "Will sirve para expresar un compromiso futuro. I'll es la contracción de I will.",
        "fichas": [
          "promise",
          "will",
          "the",
          "tomorrow.",
          "I",
          "I",
          "return",
          "key"
        ]
      }
    ]
  },
  {
    "numero": 4,
    "remate": "sombras",
    "nombre": "Puerta Real",
    "tema": "Traffic signs and rules",
    "guardian": "Dragón de la Puerta Real",
    "fondo": "/images/arenas/puerta-real-animado.svg",
    "arte": "/images/personajes-mate/real",
    "golpe": "Aliento Escarlata",
    "efecto": "/images/jefes/real/aliento.svg",
    "vida": 126,
    "dano": 31,
    "debilidad": "escudo",
    "preguntas": [
      {
        "tipo": "zona",
        "texto": "Bring the rider to a complete stop.",
        "tablero": "calle",
        "señal": {
          "imagen": "/images/signs/stop.svg",
          "alt": "Octágono rojo con la palabra STOP"
        },
        "zonas": [
          {
            "texto": "Go past the line",
            "icono": "↑"
          },
          {
            "texto": "Stop at the line",
            "icono": "▬"
          },
          {
            "texto": "Go through the crossing",
            "icono": "↑"
          }
        ],
        "correcta": "Stop at the line",
        "explicacion": "Ante STOP, detente por completo en la línea."
      },
      {
        "tipo": "zona",
        "texto": "Let the other rider go first.",
        "tablero": "calle",
        "señal": {
          "imagen": "/images/signs/yield.svg",
          "alt": "Triángulo invertido con borde rojo"
        },
        "zonas": [
          {
            "texto": "Enter first",
            "icono": "↗"
          },
          {
            "texto": "Overtake",
            "icono": "↑"
          },
          {
            "texto": "Wait and give way",
            "icono": "◷"
          }
        ],
        "correcta": "Wait and give way",
        "explicacion": "Give way significa «ceder el paso»."
      },
      {
        "tipo": "cortar",
        "texto": "What does a STOP sign mean?",
        "opciones": [
          "Go faster",
          "Come to a full stop",
          "Keep going"
        ],
        "correcta": "Come to a full stop",
        "explicacion": "STOP indica que debes detenerte por completo."
      },
      {
        "tipo": "hacha",
        "texto": "The dragon will breathe fire!",
        "correcta": "Cut all three energy balls.",
        "explicacion": "Arrastra el hacha para cortar las tres bolas de energía."
      },
      {
        "tipo": "ordenar",
        "texto": "Equip the rider before the ride.",
        "contexto": "Write the name of the item that protects the rider's head.",
        "antes": "Put on your",
        "despues": ".",
        "correcta": "Put on your helmet.",
        "explicacion": "Helmet significa «casco».",
        "fichas": [
          "on",
          "helmet.",
          "Put",
          "your"
        ]
      },
      {
        "tipo": "zona",
        "texto": "Move the rider according to the traffic light.",
        "tablero": "calle",
        "señal": {
          "alt": "Semáforo con la luz roja encendida"
        },
        "zonas": [
          {
            "texto": "Move forward",
            "icono": "↑"
          },
          {
            "texto": "Stop before the crossing",
            "icono": "▬"
          },
          {
            "texto": "Change lanes",
            "icono": "↔"
          }
        ],
        "correcta": "Stop before the crossing",
        "explicacion": "La luz roja indica que debes detenerte antes de entrar al cruce."
      }
    ]
  }
]

function entrar(numero) {
  if (numero > nivelDesbloqueado.value || enTransicion.value) return
  const nivel = niveles.find((zona) => zona.numero === numero)
  if (!nivel) return

  nivelSeleccionado.value = nivel
  enTransicion.value = true
}

function iniciarCombate() {
  nivelActual.value = nivelSeleccionado.value
  pantalla.value = 'combate'
  enTransicion.value = false
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
  animation: aparicion-mapa 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes aparicion-mapa {
  0% {
    opacity: 0;
    transform: scale(1.03);
  }
  40% {
    opacity: 0.85;
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
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
