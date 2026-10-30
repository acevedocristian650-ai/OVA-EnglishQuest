// ============================================================
// DATOS DEL MAPA (data/zones.js)
// Aquí viven TODAS las zonas del reino. Para agregar una zona nueva,
// copia uno de los objetos de `zonesData` y cambia sus datos.
// ============================================================

// Tamaño del mapa dibujado (en "unidades" SVG). Las coordenadas x / y de
// cada zona se miden dentro de este rectángulo: x de 0 a 1200, y de 0 a 900.
export const mapSize = { width: 1200, height: 900 }

// Nombres de la dificultad: difficulty 1 = 'Muy fácil' ... difficulty 5 = 'Jefe final'
export const difficultyNames = ['Muy fácil', 'Fácil', 'Media', 'Difícil', 'Jefe final']

// Cómo se muestra cada estado de una zona (texto, color de Vuetify e icono)
export const zoneStatuses = {
  unlocked: { label: 'Disponible', color: 'amber-darken-3', icon: '⚔️' },
  locked: { label: 'Bloqueada', color: 'grey-darken-2', icon: '🔒' },
  completed: { label: 'Completada', color: 'green-darken-1', icon: '✔️' }
}

// Lista de zonas, en el orden en que se van desbloqueando.
//   id        -> identificador único (también es la ruta: /zone/<id>)
//   landmark  -> dibujo que se usa en el mapa: forest, bridge, canyon, cave, valley, tower o castle
//   x, y      -> posición de la zona dentro del mapa
//   difficulty-> número de 1 a 5
//   status    -> estado inicial: 'unlocked', 'locked' o 'completed'
export const zonesData = [
  {
    id: 'bosque-vocabulario',
    name: 'Bosque del Vocabulario',
    topic: 'Vocabulary',
    description: 'Un bosque encantado donde cada árbol guarda una palabra. Aprende el vocabulario básico para sobrevivir en el reino.',
    landmark: 'forest',
    x: 150,
    y: 730,
    difficulty: 1,
    status: 'unlocked',
    enemy: { name: 'Goblin Glosario', emoji: '👺' },
    contents: [
      'School objects, family and food',
      'Clothes and places in the city',
      'Adjectives to describe people and things'
    ]
  },
  {
    id: 'puente-presente',
    name: 'Puente del Presente',
    topic: 'Present Simple',
    description: 'Un viejo puente de madera sobre el río. Solo cruzan quienes dominan las rutinas del presente.',
    landmark: 'bridge',
    x: 360,
    y: 600,
    difficulty: 2,
    status: 'locked',
    enemy: { name: 'Troll del Puente', emoji: '🧌' },
    contents: [
      'Affirmative, negative and questions (do / does)',
      'Third person: he works, she watches',
      'Adverbs of frequency: always, usually, never'
    ]
  },
  {
    id: 'canon-pasado',
    name: 'Cañón del Pasado',
    topic: 'Past Simple',
    description: 'Entre paredes de roca roja resuenan los ecos de lo que ya ocurrió. Cuenta historias en pasado para avanzar.',
    landmark: 'canyon',
    x: 600,
    y: 730,
    difficulty: 3,
    status: 'locked',
    enemy: { name: 'Espectro del Ayer', emoji: '👻' },
    contents: [
      'Regular verbs: played, studied, worked',
      'Was / were',
      'Did / didn’t and time expressions: yesterday, last week'
    ]
  },
  {
    id: 'cueva-irregulares',
    name: 'Cueva de los Irregulares',
    topic: 'Irregular Verbs',
    description: 'Una cueva oscura donde los verbos no siguen las reglas. Memoriza sus formas para no perderte.',
    landmark: 'cave',
    x: 880,
    y: 700,
    difficulty: 3,
    status: 'locked',
    enemy: { name: 'Murciélago Rebelde', emoji: '🦇' },
    contents: [
      'Common irregular verbs: go - went, have - had, see - saw',
      'Eat - ate, write - wrote, buy - bought',
      'Irregular verbs inside sentences and questions'
    ]
  },
  {
    id: 'valle-preposiciones',
    name: 'Valle de las Preposiciones',
    topic: 'Prepositions',
    description: 'Un valle lleno de letreros que señalan dónde y cuándo. Aprende a ubicar todo con las preposiciones correctas.',
    landmark: 'valley',
    x: 900,
    y: 470,
    difficulty: 4,
    status: 'locked',
    enemy: { name: 'Gárgola Perdida', emoji: '🗿' },
    contents: [
      'Place: in, on, at',
      'Next to, between, behind, in front of',
      'Time: at 5:00, on Monday, in July'
    ]
  },
  {
    id: 'torre-reading',
    name: 'Torre de Reading',
    topic: 'Reading Comprehension',
    description: 'Una alta torre llena de libros antiguos. Lee con atención para descubrir las respuestas ocultas.',
    landmark: 'tower',
    x: 600,
    y: 300,
    difficulty: 4,
    status: 'locked',
    enemy: { name: 'Mago Lector', emoji: '🧙' },
    contents: [
      'Main idea of a short text',
      'Finding specific information',
      'Guessing the meaning of words from context'
    ]
  },
  {
    id: 'castillo-conocimiento',
    name: 'Castillo del Conocimiento',
    topic: 'Final Challenge',
    description: 'La fortaleza final del reino. Aquí se mezclan todos los temas aprendidos para enfrentar al guardián supremo.',
    landmark: 'castle',
    x: 1000,
    y: 170,
    difficulty: 5,
    status: 'locked',
    enemy: { name: 'Dragón del Olvido', emoji: '🐉' },
    contents: [
      'Vocabulary, present and past',
      'Irregular verbs and prepositions',
      'Reading comprehension'
    ]
  }
]
