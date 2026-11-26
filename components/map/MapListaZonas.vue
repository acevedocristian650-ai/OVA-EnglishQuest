<!--
  MapListaZonas.vue - LISTA DE ZONAS PARA CELULAR EN VERTICAL

  En vertical el tablero queda pequeño y los rótulos se pisan; esta lista repite
  las cuatro zonas con botones grandes. Solo se muestra en vertical (lo decide map.vue).
-->
<template>
  <ol class="lista" :aria-label="t('Zonas del reino')">
    <li v-for="nivel in niveles" :key="nivel.numero">
      <AudioSonidoBoton @click="emit('elegir', nivel.numero)">
        <button type="button" class="fila" :class="estadoDe(nivel.numero)">
          <span class="numero" aria-hidden="true">
            <template v-if="estadoDe(nivel.numero) === 'bloqueada'">🔒</template>
            <template v-else-if="estadoDe(nivel.numero) === 'completada'">✓</template>
            <template v-else>{{ nivel.numero }}</template>
          </span>
          <span class="texto">
            <strong>{{ nivel.nombre }}</strong>
            <small>{{ nivel.tema }}</small>
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
  nivelDesbloqueado: { type: Number, required: true }
})

const emit = defineEmits(['elegir'])
const { t } = useLanguage()

const etiquetas = { completada: 'Superada', disponible: 'Entrar', bloqueada: 'Bloqueada' }

function estadoDe(numero) {
  if (numero < props.nivelDesbloqueado) return 'completada'
  if (numero === props.nivelDesbloqueado) return 'disponible'
  return 'bloqueada'
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

.fila {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 56px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #be934880;
  border-radius: 10px;
  background: #101928f5;
  color: #fff2cf;
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms, background-color 140ms;
}

.fila:not(:disabled):is(:hover, :focus-visible) { border-color: #ffe09a; background: #182338; }
.fila:not(:disabled):active { background: #1f2c45; }
.fila:focus-visible { outline: 2px solid #ffe09a; outline-offset: 2px; }

.numero {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 2px solid #ffe6a6;
  border-radius: 50%;
  background: #ffd17d;
  color: #171e2d;
  font: 800 1.05rem Georgia, serif;
}

.texto { flex: 1; min-width: 0; display: grid; line-height: 1.25; }
.texto strong { font-size: 0.95rem; }
.texto small { color: #e1bf82; font-size: 0.78rem; }

.estado {
  flex: none;
  color: #ffe09a;
  font: 700 0.72rem 'Cinzel', Georgia, serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.disponible { border-color: #ffd17d; box-shadow: 0 0 0 1px #ffd17d55, 0 0 14px #ffd17d33; }
.completada .numero { background: #89d6ad; border-color: #ccf8dc; }
.completada .estado { color: #a9e8c3; }
.bloqueada { cursor: default; opacity: 0.7; }
.bloqueada .numero { background: #29394d; border-color: #a5b4c4; }
.bloqueada .estado { color: #a5b4c4; }

@media (prefers-reduced-motion: reduce) {
  .fila { transition: none; }
}
</style>
