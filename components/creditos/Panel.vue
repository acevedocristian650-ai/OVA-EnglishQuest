<!-- Panel.vue - Créditos del OVA. Lo usan la página /creditos y la secuencia final: los datos salen solo de data/creditos.json. -->
<template>
  <div class="creditos">
    <header class="titulo">
      <h2>{{ datos.ova.nombre }}</h2>
      <p>{{ t(datos.ova.descripcion) }}</p>
    </header>

    <section :aria-label="t('Equipo')">
      <h3>{{ t('Equipo de desarrollo') }}</h3>
      <ul class="equipo">
        <li v-for="(p, i) in datos.integrantes" :key="i" class="persona">
          <div class="foto" :class="{ vacia: !p.foto || fallo[i] }">
            <img v-if="p.foto && !fallo[i]" :src="p.foto" :alt="p.nombre ? `${t('Fotografía de')} ${p.nombre}` : ''" loading="lazy" decoding="async" @error="fallo[i] = true" />
            <span v-else aria-hidden="true">{{ t('Fotografía pendiente') }}</span>
          </div>
          <strong>{{ p.nombre || `${t('Integrante')} ${i + 1}: ${t('nombre pendiente')}` }}</strong>
          <small v-if="p.rol">{{ p.rol }}</small>
        </li>
      </ul>
    </section>

    <section :aria-label="t('Información académica')">
      <h3>{{ t('Información académica') }}</h3>
      <dl class="datos">
        <div v-for="c in campos" :key="c.id"><dt>{{ t(c.etq) }}</dt><dd :class="{ pendiente: !datos.institucion[c.id] }">{{ datos.institucion[c.id] || t('Pendiente') }}</dd></div>
      </dl>
    </section>

    <section :aria-label="t('Atribuciones')">
      <h3>{{ t('Atribuciones de recursos') }}</h3>
      <ul class="atribs">
        <li v-for="(a, i) in datos.atribuciones" :key="i"><strong>{{ t(a.recurso) }}</strong><span>{{ a.autor }}</span><small>{{ t(a.nota) }}</small></li>
      </ul>
    </section>

    <section v-if="datos.agradecimientos.length" :aria-label="t('Agradecimientos')">
      <h3>{{ t('Agradecimientos') }}</h3>
      <ul class="atribs"><li v-for="(g, i) in datos.agradecimientos" :key="i">{{ g }}</li></ul>
    </section>
  </div>
</template>

<script setup>
import datos from '~/data/creditos.json'
const { t } = useLanguage()
const fallo = reactive({})
const campos = [
  { id: 'universidad', etq: 'Universidad' }, { id: 'programa', etq: 'Programa académico' },
  { id: 'asignatura', etq: 'Asignatura' }, { id: 'docente', etq: 'Docente' }
]
</script>

<style scoped>
.creditos { display: grid; gap: 1.2rem; color: #f1e8d3; font-size: calc(1rem * var(--eq-texto, 1)); }
.titulo h2 { margin: 0; color: #ffe09a; font: 800 clamp(1.5rem, 5vw, 2.3rem) Georgia, serif; }
.titulo p { margin: .3rem 0 0; color: #d3cbbb; line-height: 1.5; max-width: 60ch; }
h3 { margin: 0 0 .5rem; color: #ffe09a; font: 700 1.1rem Georgia, serif; }
.equipo { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .8rem; margin: 0; padding: 0; list-style: none; }
.persona { display: grid; gap: .3rem; justify-items: center; text-align: center; padding: .7rem; border: 1px solid #8f7959; border-radius: 10px; background: #141c2a; }
.foto { width: 100%; aspect-ratio: 3 / 4; max-width: 190px; overflow: hidden; border: 2px solid #b68a48; border-radius: 8px; background: #0d131d; display: grid; place-items: center; }
.foto img { width: 100%; height: 100%; object-fit: cover; }
.foto.vacia span { padding: .5rem; color: #b9b2a3; font-size: .85rem; }
.persona small { color: #c4c7cd; }
.datos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; margin: 0; }
.datos > div { padding: .6rem .8rem; border: 1px solid #5a6b85; border-radius: 8px; }
.datos dt { color: #e8bd71; font-size: .8rem; letter-spacing: .06em; text-transform: uppercase; }
.datos dd { margin: .15rem 0 0; }
.datos dd.pendiente { color: #b9b2a3; font-style: italic; }
.atribs { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
.atribs li { display: grid; gap: .1rem; padding: .6rem .8rem; border: 1px solid #5a6b85; border-radius: 8px; }
.atribs small { color: #b9b2a3; }
@media (max-width: 900px) { .equipo { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 480px) { .datos { grid-template-columns: 1fr; } }
</style>
