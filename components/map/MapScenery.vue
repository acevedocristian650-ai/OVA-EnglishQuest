<template>
  <svg
    class="map-scenery"
    :viewBox="`0 0 ${mapSize.width} ${mapSize.height}`"
    preserveAspectRatio="xMidYMid slice"
    role="img"
    aria-label="Mapa ilustrado del Reino del Conocimiento"
  >
    <defs>
      <!-- Colores del terreno y del agua -->
      <radialGradient id="terreno" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stop-color="#3f6b4a" />
        <stop offset="0.7" stop-color="#2b4d3a" />
        <stop offset="1" stop-color="#1c3329" />
      </radialGradient>
      <radialGradient id="vineta" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.6" stop-color="#050a17" stop-opacity="0" />
        <stop offset="1" stop-color="#050a17" stop-opacity="0.6" />
      </radialGradient>
      <radialGradient id="resplandor" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffb347" stop-opacity="0.55" />
        <stop offset="1" stop-color="#ff8a1f" stop-opacity="0" />
      </radialGradient>

      <!-- ===== Piezas pequeñas que se repiten ===== -->

      <!-- Montaña (la base está abajo, en el centro) -->
      <symbol id="montana" viewBox="0 0 200 140">
        <polygon points="0,140 70,20 105,70 140,35 200,140" fill="#5a5470" />
        <polygon points="70,20 105,70 85,140 0,140" fill="#4a4560" />
        <polygon points="70,20 55,50 68,45 78,56 88,42" fill="#e8dfb8" />
        <polygon points="140,35 124,62 136,57 146,66 156,55" fill="#e8dfb8" />
      </symbol>

      <!-- Árbol: el punto (0,0) es el pie del tronco -->
      <g id="arbol">
        <rect x="-5" y="-14" width="10" height="16" fill="#3b2a14" />
        <polygon points="0,-88 26,-42 -26,-42" fill="#1f5a3a" />
        <polygon points="0,-68 32,-20 -32,-20" fill="#2c7a4b" />
        <polygon points="0,-48 38,-6 -38,-6" fill="#37955a" />
      </g>

      <!-- ===== Lugares de cada zona (cada uno mide 200 x 160) ===== -->

      <!-- Bosque -->
      <symbol id="lugar-forest" viewBox="0 0 200 160">
        <ellipse cx="100" cy="140" rx="92" ry="14" fill="#000" opacity="0.25" />
        <use href="#arbol" transform="translate(38 138) scale(0.8)" />
        <use href="#arbol" transform="translate(162 138) scale(0.8)" />
        <use href="#arbol" transform="translate(72 126) scale(1.1)" />
        <use href="#arbol" transform="translate(130 126) scale(1.15)" />
        <use href="#arbol" transform="translate(100 140) scale(1.0)" />
        <circle cx="52" cy="142" r="4" fill="#ffd77a" />
        <circle cx="150" cy="144" r="3" fill="#ffd77a" />
      </symbol>

      <!-- Puente de madera (cruza el río) -->
      <symbol id="lugar-bridge" viewBox="0 0 200 160">
        <rect x="0" y="118" width="26" height="38" rx="4" fill="#4a5265" />
        <rect x="174" y="118" width="26" height="38" rx="4" fill="#4a5265" />
        <rect x="10" y="132" width="180" height="20" fill="#8a5a2b" />
        <path d="M10 132 H190 M10 142 H190 M10 152 H190" stroke="#5a3a1a" stroke-width="2" />
        <path d="M30 112 V134 M70 112 V134 M130 112 V134 M170 112 V134" stroke="#5a3a1a" stroke-width="6" />
        <path d="M24 114 Q100 98 176 114" stroke="#b08a52" stroke-width="6" fill="none" />
      </symbol>

      <!-- Cañón de roca roja -->
      <symbol id="lugar-canyon" viewBox="0 0 200 160">
        <polygon points="0,152 8,40 52,22 82,48 74,152" fill="#a4573a" />
        <polygon points="200,152 192,34 148,18 120,50 128,152" fill="#b9663f" />
        <polygon points="74,152 82,48 100,70 100,152" fill="#7d3f2b" />
        <polygon points="128,152 120,50 100,70 100,152" fill="#8f4a30" />
        <path d="M8 70 H70 M10 96 H76 M6 122 H74 M130 66 H194 M126 94 H196 M128 122 H198" stroke="#6b3322" stroke-width="3" />
        <path d="M82 152 L100 100 L118 152 Z" fill="#d9b26f" opacity="0.8" />
      </symbol>

      <!-- Cueva dentro de una montaña -->
      <symbol id="lugar-cave" viewBox="0 0 200 160">
        <polygon points="0,152 60,30 100,70 140,22 200,152" fill="#5a5470" />
        <polygon points="60,30 100,70 80,152 0,152" fill="#4a4560" />
        <polygon points="140,22 124,50 136,46 146,56 156,44" fill="#e8dfb8" />
        <path d="M62 152 V108 Q100 60 138 108 V152 Z" fill="#0b0a12" />
        <path d="M70 100 L74 114 L78 100 M92 88 L96 104 L100 88 M120 96 L124 110 L128 96" fill="#4a4560" stroke="#4a4560" stroke-width="3" />
        <circle cx="90" cy="128" r="4" fill="#ff3b3b" />
        <circle cx="110" cy="128" r="4" fill="#ff3b3b" />
      </symbol>

      <!-- Valle con letreros (preposiciones) -->
      <symbol id="lugar-valley" viewBox="0 0 200 160">
        <ellipse cx="55" cy="150" rx="70" ry="34" fill="#4c8a4f" />
        <ellipse cx="150" cy="152" rx="70" ry="30" fill="#3f7a46" />
        <ellipse cx="100" cy="156" rx="60" ry="22" fill="#5da05a" />
        <rect x="96" y="82" width="8" height="64" fill="#5a3a1a" />
        <polygon points="104,88 150,88 160,98 150,108 104,108" fill="#d9b26f" />
        <polygon points="96,112 52,112 42,122 52,132 96,132" fill="#d9b26f" />
        <text x="110" y="102" font-size="12" font-weight="bold" fill="#3b2a14" font-family="Georgia, serif">ON</text>
        <text x="58" y="126" font-size="12" font-weight="bold" fill="#3b2a14" font-family="Georgia, serif">IN</text>
        <circle cx="30" cy="140" r="4" fill="#ffd77a" />
        <circle cx="168" cy="144" r="4" fill="#f4a3c1" />
        <circle cx="150" cy="150" r="3" fill="#ffffff" />
      </symbol>

      <!-- Torre de piedra con techo rojo -->
      <symbol id="lugar-tower" viewBox="0 0 200 160">
        <ellipse cx="100" cy="150" rx="60" ry="9" fill="#000" opacity="0.3" />
        <rect x="70" y="52" width="60" height="98" fill="#4a5265" />
        <path d="M70 70 H130 M70 90 H130 M70 110 H130 M70 130 H130 M90 52 V70 M110 70 V90 M90 90 V110 M110 110 V130 M90 130 V150" stroke="#2f3646" stroke-width="2" />
        <rect x="64" y="44" width="72" height="12" fill="#5d667b" />
        <polygon points="64,44 100,2 136,44" fill="#c2323a" />
        <polygon points="100,2 136,44 100,44" fill="#8f1d24" />
        <rect x="92" y="62" width="16" height="22" rx="8" fill="#ffb23c" />
        <rect x="92" y="104" width="16" height="22" rx="8" fill="#ffb23c" opacity="0.9" />
        <path d="M100 2 V-8" stroke="#3b2a14" stroke-width="2" />
      </symbol>

      <!-- Castillo final -->
      <symbol id="lugar-castle" viewBox="0 0 200 160">
        <circle cx="100" cy="80" r="90" fill="url(#resplandor)" />
        <ellipse cx="100" cy="150" rx="90" ry="9" fill="#000" opacity="0.3" />
        <rect x="58" y="62" width="84" height="88" fill="#4a5265" />
        <rect x="18" y="44" width="38" height="106" fill="#59627a" />
        <rect x="144" y="44" width="38" height="106" fill="#59627a" />
        <polygon points="14,44 37,2 60,44" fill="#c2323a" />
        <polygon points="140,44 163,2 186,44" fill="#c2323a" />
        <polygon points="86,62 100,26 114,62" fill="#8f1d24" />
        <path d="M58 82 H142 M58 104 H142 M58 126 H142" stroke="#2f3646" stroke-width="2" />
        <path d="M37 2 V-10 M163 2 V-10" stroke="#3b2a14" stroke-width="2" />
        <polygon points="37,-10 52,-5 37,0" fill="#ffd77a" />
        <polygon points="163,-10 178,-5 163,0" fill="#ffd77a" />
        <path d="M84 150 V118 Q100 98 116 118 V150 Z" fill="#2b1a0b" />
        <rect x="30" y="64" width="14" height="20" rx="7" fill="#ffb23c" />
        <rect x="156" y="64" width="14" height="20" rx="7" fill="#ffb23c" />
        <rect x="93" y="72" width="14" height="18" rx="7" fill="#ffb23c" />
      </symbol>
    </defs>

    <!-- 1. Terreno -->
    <rect width="1200" height="900" fill="url(#terreno)" />
    <ellipse cx="250" cy="300" rx="220" ry="110" fill="#4c7a52" opacity="0.35" />
    <ellipse cx="760" cy="560" rx="260" ry="120" fill="#4c7a52" opacity="0.3" />
    <ellipse cx="560" cy="120" rx="220" ry="80" fill="#355f43" opacity="0.5" />

    <!-- 2. Río (3 trazos: borde oscuro, agua, brillo) -->
    <path :d="riverPath" fill="none" stroke="#17455f" stroke-width="64" stroke-linecap="round" />
    <path :d="riverPath" fill="none" stroke="#2f7fad" stroke-width="50" stroke-linecap="round" />
    <path :d="riverPath" fill="none" stroke="#7cc4e6" stroke-width="3" stroke-dasharray="26 40" stroke-linecap="round" opacity="0.7" />

    <!-- 3. Montañas -->
    <use
      v-for="(m, index) in mountains"
      :key="'montana-' + index"
      href="#montana"
      :x="m.x - (200 * m.scale) / 2"
      :y="m.y - 140 * m.scale"
      :width="200 * m.scale"
      :height="140 * m.scale"
    />

    <!-- 4. Caminos: uno por cada tramo entre zonas.
         Si la zona de origen ya se completó, el camino se ve dorado y continuo. -->
    <g v-for="road in roads" :key="road.id" fill="none" stroke-linecap="round">
      <path :d="road.d" stroke="#2a1a0a" stroke-width="16" opacity="0.45" />
      <path
        :d="road.d"
        :stroke="road.done ? '#ffd77a' : '#d9b26f'"
        :stroke-width="road.done ? 9 : 7"
        :stroke-dasharray="road.done ? 'none' : '2 14'"
      />
    </g>

    <!-- 5. Árboles sueltos -->
    <use
      v-for="(t, index) in trees"
      :key="'arbol-' + index"
      href="#arbol"
      :transform="`translate(${t.x} ${t.y}) scale(${t.scale})`"
    />

    <!-- 6. Lugar de cada zona. Se dibuja sobre el punto (x, y) de la zona. -->
    <use
      v-for="zone in zones"
      :key="zone.id"
      :href="'#lugar-' + zone.landmark"
      :x="zone.x - 100"
      :y="zone.y - 160"
      width="200"
      height="160"
    />

    <!-- Adornos: brújula y luz -->
    <g transform="translate(1110 830)" opacity="0.9">
      <circle r="42" fill="#2f1d0e" stroke="#ffd77a" stroke-width="3" />
      <polygon points="0,-34 8,0 0,34 -8,0" fill="#e8dfb8" />
      <polygon points="-34,0 0,-8 34,0 0,8" fill="#b08a52" />
      <polygon points="0,-34 8,0 -8,0" fill="#c2323a" />
      <text y="-46" text-anchor="middle" font-size="16" font-weight="bold" fill="#ffd77a" font-family="Georgia, serif">N</text>
    </g>

    <!-- Sombra en los bordes para dar profundidad -->
    <rect width="1200" height="900" fill="url(#vineta)" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { mapSize } from '~/data/zones'

const props = defineProps({
  zones: { type: Array, required: true }
})

// Camino del río (coordenadas SVG). Pasa justo por debajo del Puente del Presente.
const riverPath = 'M 300 -20 C 240 140, 470 260, 400 420 C 370 500, 360 560, 360 610 C 360 700, 310 800, 340 920'

// Montañas decorativas: posición (x, y de la base) y tamaño
const mountains = [
  { x: 150, y: 150, scale: 1.5 },
  { x: 60, y: 330, scale: 1.0 },
  { x: 800, y: 80, scale: 1.1 },
  { x: 1120, y: 560, scale: 1.3 },
  { x: 1070, y: 830, scale: 1.1 },
  { x: 1150, y: 760, scale: 0.9 }
]

// Árboles decorativos (ordenados de arriba hacia abajo para que se superpongan bien)
const trees = [
  { x: 430, y: 120, scale: 0.8 },
  { x: 560, y: 150, scale: 0.7 },
  { x: 780, y: 230, scale: 0.8 },
  { x: 1130, y: 260, scale: 0.8 },
  { x: 300, y: 330, scale: 0.7 },
  { x: 740, y: 370, scale: 0.8 },
  { x: 1050, y: 390, scale: 0.8 },
  { x: 250, y: 440, scale: 0.9 },
  { x: 1120, y: 440, scale: 0.9 },
  { x: 660, y: 480, scale: 0.7 },
  { x: 60, y: 520, scale: 0.8 },
  { x: 520, y: 540, scale: 0.8 },
  { x: 190, y: 570, scale: 0.9 },
  { x: 700, y: 580, scale: 0.9 },
  { x: 740, y: 840, scale: 0.8 },
  { x: 480, y: 850, scale: 0.7 },
  { x: 250, y: 860, scale: 0.8 },
  { x: 60, y: 870, scale: 0.9 }
]

// Un camino curvo entre cada zona y la siguiente.
// "Q" dibuja una curva: necesita un punto de control (cx, cy) y el punto final.
const roads = computed(() => {
  const list = []
  for (let i = 1; i < props.zones.length; i++) {
    const from = props.zones[i - 1]
    const to = props.zones[i]
    const side = i % 2 === 0 ? 1 : -1
    const cx = (from.x + to.x) / 2 + 40 * side
    const cy = (from.y + to.y) / 2 + 30 * side
    list.push({
      id: from.id + '-' + to.id,
      d: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`,
      done: from.status === 'completed'
    })
  }
  return list
})
</script>

<style scoped>
.map-scenery {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
