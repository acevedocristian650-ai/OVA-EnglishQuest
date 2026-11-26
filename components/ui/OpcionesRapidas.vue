<!--
  OpcionesRapidas.vue - Tres botones compactos e independientes: Gráficos, Accesibilidad y Pantalla completa.
  Los dos diálogos solo existen en el DOM mientras están abiertos (v-if). En batalla se usa «diferido»: el combate
  se pausa al abrir cualquiera de los dos y el cambio de perfil lo aplica el combate en un momento seguro.
-->
<template>
  <div class="rapidas" role="group" :aria-label="t('Ajustes rápidos')">
    <button ref="botonGraficos" type="button" class="rapido" :aria-label="t('Gráficos')" :title="t('Gráficos')" @click="abrir('graficos')">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-6l1 2h2v1.5H8V19h2l1-2H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 1.5v8h14v-8H5Zm6.2 1.2.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7Z" /></svg>
      <span class="etq">{{ t('Gráficos') }}</span>
    </button>
    <button ref="botonAcc" type="button" class="rapido" :aria-label="t('Accesibilidad')" :title="t('Accesibilidad')" @click="abrir('accesibilidad')">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 1.6a8.4 8.4 0 1 1 0 16.8 8.4 8.4 0 0 1 0-16.8Zm0 2.1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm-4.6 3.5v1.5l3.3.6v2.1l-1.6 4.6 1.4.5 1.5-4.1 1.5 4.1 1.4-.5-1.6-4.6v-2.1l3.3-.6V9.2L12 10.1l-4.6-.9Z" /></svg>
      <span class="etq">{{ t('Accesibilidad') }}</span>
    </button>
    <button v-if="pantalla.disponible.value" type="button" class="rapido" :aria-pressed="pantalla.activa.value" :aria-label="t(pantalla.activa.value ? 'Salir de pantalla completa' : 'Pantalla completa')"
      :title="t(pantalla.activa.value ? 'Salir de pantalla completa' : 'Pantalla completa')" @click="pantalla.alternar()">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path v-if="!pantalla.activa.value" d="M4 4h6v1.6H5.6V10H4V4Zm10 0h6v6h-1.6V5.6H14V4ZM4 14h1.6v4.4H10V20H4v-6Zm14.4 0H20v6h-6v-1.6h4.4V14Z" /><path v-else d="M8 4h1.6v4.4H14V10H8V4Zm6.4 0H16v6h-6V8.4h4.4V4ZM8 14h6v6h-1.6v-4.4H8V14Zm8 0h1.6v1.6H20V17h-4v-3Z" /></svg>
      <span class="etq">{{ t(pantalla.activa.value ? 'Salir de pantalla completa' : 'Pantalla completa') }}</span>
    </button>

    <v-dialog v-if="montaG" v-model="verGraficos" max-width="520" scrollable @after-leave="cerrado('graficos')">
      <v-card color="brown-darken-4" rounded="lg" border>
        <v-card-title class="text-amber-lighten-2">{{ t('Gráficos') }}</v-card-title>
        <v-card-text>
          <UiAjustesGraficos :diferido="diferido" :pendiente="pendiente" :preparando="preparando" :error="errorPerfil" @elegir="(id) => emit('elegir-perfil', id)" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn color="amber" variant="flat" autofocus @click="verGraficos = false">{{ t('Cerrar') }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-if="montaA" v-model="verAcc" max-width="520" scrollable @after-leave="cerrado('accesibilidad')">
      <v-card color="brown-darken-4" rounded="lg" border>
        <v-card-title class="text-amber-lighten-2">{{ t('Accesibilidad') }}</v-card-title>
        <v-card-text><UiAjustesAccesibilidad /></v-card-text>
        <v-card-actions><v-spacer /><v-btn color="amber" variant="flat" autofocus @click="verAcc = false">{{ t('Cerrar') }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
defineProps({ diferido: Boolean, pendiente: { type: String, default: null }, preparando: Boolean, errorPerfil: Boolean })
const emit = defineEmits(['abrir', 'cerrar', 'elegir-perfil'])
const { t } = useLanguage()
const pantalla = usePantallaCompleta()
const verGraficos = ref(false)
const montaG = ref(false)
const montaA = ref(false)
const verAcc = ref(false)
const botonGraficos = ref(null)
const botonAcc = ref(null)

onMounted(() => pantalla.iniciar())

function abrir(cual) {
  // Un solo diálogo a la vez: evita modales superpuestos que bloqueen la navegación.
  if (montaG.value || montaA.value) return
  // Se monta el diálogo solo al abrirlo y se desmonta al terminar la animación de cierre.
  if (cual === 'graficos') { montaG.value = true; nextTick(() => { verGraficos.value = true }) } else { montaA.value = true; nextTick(() => { verAcc.value = true }) }
  emit('abrir', cual)
}
defineExpose({ abrir })
function cerrado(cual) {
  if (cual === 'graficos') montaG.value = false; else montaA.value = false
  emit('cerrar', cual)
  nextTick(() => (cual === 'graficos' ? botonGraficos : botonAcc).value?.focus?.({ preventScroll: true }))
}
</script>

<style scoped>
.rapidas { display: inline-flex; gap: 6px; align-items: center; }
.rapido {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-width: 44px; min-height: 44px; padding: 0 10px;
  color: #ffe09a; background: #1b2635cc; border: 1px solid #b3955c; border-radius: 8px; cursor: pointer;
  font: 600 .85rem system-ui, sans-serif;
}
.rapido svg { width: 22px; height: 22px; fill: currentColor; flex: none; }
.rapido:hover { background: #2a3a52; }
.rapido:focus-visible { outline: 3px solid #ffe09a; outline-offset: 2px; }
.rapido[aria-pressed='true'] { background: #3a2f1c; }
/* En pantallas estrechas solo se muestra el icono para no restar espacio al escenario */
.etq { display: none; }
@media (min-width: 1000px) and (min-height: 600px) { .etq { display: inline; } }
</style>
