<!--
  MapListaZonas.vue - DIARIO DE VIAJE PARA CELULAR EN VERTICAL

  En vertical el tablero queda pequeño y los rótulos se pisan; esta lista repite
  las cinco zonas como entradas del diario del caballero, con retrato del guardián,
  estrellas ganadas y línea de camino entre entradas. Solo se muestra en vertical.
-->
<template>
  <ol class="lista" :aria-label="t('Zonas del reino')">
    <li v-for="(nivel, i) in niveles" :key="nivel.numero" class="entrada">
      <span v-if="i < niveles.length - 1" class="camino" aria-hidden="true" />
      <AudioSonidoBoton @click="emit('elegir', nivel.numero)">
        <button type="button" class="fila" :class="estadoDe(nivel.numero)">
          <span class="medallon" aria-hidden="true">
            <img v-if="arteDe(nivel)" class="retrato" :src="arteDe(nivel)" alt="" decoding="async" />
            <span v-else class="numero">{{ nivel.numero }}</span>
            <span v-if="estadoDe(nivel.numero) === 'bloqueada'" class="candado">🔒</span>
            <span v-else-if="estadoDe(nivel.numero) === 'completada'" class="sello">✓</span>
          </span>
          <span class="texto">
            <strong>{{ t('Misión') }} {{ nivel.numero }} · {{ nivel.nombre }}</strong>
            <small>{{ nivel.tema }} · {{ t('Guardián') }}: {{ nivel.guardian }}</small>
            <span v-if="estrellasDe(nivel.numero) > 0" class="estrellas" aria-hidden="true">{{ '★'.repeat(estrellasDe(nivel.numero)) }}</span>
          </span>
          <span class="estado">{{ t(etiquetas[estadoDe(nivel.numero)]) }}</span>
        </button>
      </AudioSonidoBoton>
    </li>
  </ol>
</template>

<script setup>
const props = defineProps({
  niveles: { type: Array, required: true },
  nivelDesbloqueado: { type: Number, required: true },
  nivelesProgreso: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['elegir'])
const { t } = useLanguage()
const { imageUrl } = useGameGraphics()

const etiquetas = { completada: 'Superada', disponible: 'Entrar', bloqueada: 'Bloqueada' }

function estadoDe(numero) {
  if (numero < props.nivelDesbloqueado) return 'completada'
  if (numero === props.nivelDesbloqueado) return 'disponible'
  return 'bloqueada'
}

function estrellasDe(numero) {
  return props.nivelesProgreso?.[numero]?.estrellas ?? 0
}

function arteDe(nivel) {
  return nivel.arte ? imageUrl(`${nivel.arte}/reposo.png`) : ''
}
</script>

<style scoped>
.lista {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.entrada { position: relative; }
/* Camino entre entradas del diario */
.camino {
  position: absolute;
  left: 34px;
  top: calc(100% - 2px);
  width: 0;
  height: 10px;
  border-left: 3px dotted #ffd17d88;
}

.fila {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 64px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #be934880;
  border-radius: 12px;
  background: linear-gradient(160deg, #16223a, #101928f5);
  color: #fff2cf;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms, background-color 140ms, transform 140ms;
}

.fila:not(:disabled):is(:hover, :focus-visible) { border-color: #ffe09a; background: #182338; transform: translateX(2px); }
.fila:not(:disabled):active { background: #1f2c45; }
.fila:focus-visible { outline: 2px solid #ffe09a; outline-offset: 2px; }

.medallon {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 2px solid #ffe6a6;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #2a3a52, #101928);
  overflow: hidden;
}
.retrato { width: 100%; height: 100%; object-fit: contain; padding: 3px; }
.numero { font: 800 1.2rem Georgia, serif; color: #171e2d; }
.medallon:has(.numero) { background: #ffd17d; }
.candado, .sello {
  position: absolute;
  right: -2px;
  bottom: -2px;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.65rem;
  border: 1px solid #192333;
}
.candado { background: #29394d; }
.sello { background: #89d6ad; color: #123524; font-weight: 800; }

.texto { flex: 1; min-width: 0; display: grid; line-height: 1.25; }
.texto strong { font-size: 0.95rem; }
.texto small { color: #e1bf82; font-size: 0.78rem; }
.estrellas { color: #ffd54f; font-size: 0.8rem; letter-spacing: 0.1em; }

.estado {
  flex: none;
  color: #ffe09a;
  font: 700 0.72rem 'Cinzel', Georgia, serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.disponible { border-color: #ffd17d; box-shadow: 0 0 0 1px #ffd17d55, 0 0 14px #ffd17d33; }
.completada .medallon { border-color: #ccf8dc; }
.completada .estado { color: #a9e8c3; }
.bloqueada { cursor: default; opacity: 0.75; }
.bloqueada .medallon { background: #29394d; border-color: #a5b4c4; }
.bloqueada .retrato { filter: grayscale(1) brightness(0.55); }
.bloqueada .estado { color: #a5b4c4; }

@media (prefers-reduced-motion: reduce) {
  .fila { transition: none; }
}
</style>
