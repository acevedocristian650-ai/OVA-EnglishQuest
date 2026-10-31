<!--
  BaseBoton.vue - BOTÓN BASE DEL JUEGO

  Componente de interfaz genérico: no sabe nada del juego, solo se ve bien.
  Se puede usar en cualquier pantalla para que todos los botones luzcan igual.

  Props:
    variante -> 'principal' (grande, con marco dorado) o
                'secundario' (solo texto con línea dorada)
  Slot:
    el texto del botón
  Eventos:
    @click llega solo al <button>, porque Vue pasa los atributos que no son
    props al elemento raíz (lección 05: "fallthrough attributes")
-->

<template>
  <button class="base-boton" :class="`base-boton--${variante}`" type="button">
    <span class="base-boton__marca" aria-hidden="true">◆</span>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variante: {
    type: String,
    default: "secundario",
    validator: (valor) => ["principal", "secundario"].includes(valor)
  }
});
</script>

<style scoped>
.base-boton {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  /* Quitamos el aspecto gris que trae un <button> por defecto */
  background: transparent;
  border: 0;
  font-family: 'Cinzel', 'Palatino Linotype', Georgia, serif;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f3e3bd;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95);
  cursor: pointer;
  transition: transform 0.2s, color 0.2s, background 0.2s, box-shadow 0.2s;
}

/* El rombo: oculto, aparece al pasar el mouse o enfocar */
.base-boton__marca {
  color: #ffc247;
  font-size: 0.7em;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.2s, transform 0.2s;
}

/* ---------- Principal: marco dorado grande ---------- */
.base-boton--principal {
  padding: 20px 24px;
  font-size: clamp(1.1rem, 1.8vw, 1.5rem);
  letter-spacing: 0.1em;
  color: #ffe9a8;
  background: linear-gradient(to right, rgba(20, 12, 6, 0.8), rgba(20, 12, 6, 0.35));
  border: 2px solid #e0a030;
  border-left-width: 6px;
  border-radius: 6px;
  box-shadow: 0 0 18px rgba(224, 160, 48, 0.35), inset 0 0 20px rgba(224, 160, 48, 0.12);
}

.base-boton--principal .base-boton__marca {
  opacity: 1;
  transform: none;
}

.base-boton--principal:hover {
  color: #fff;
  background: linear-gradient(to right, rgba(120, 70, 10, 0.85), rgba(20, 12, 6, 0.4));
  box-shadow: 0 0 30px rgba(255, 179, 71, 0.65), inset 0 0 24px rgba(255, 179, 71, 0.25);
  transform: translateX(8px);
}

/* ---------- Secundario: solo texto + línea ---------- */
.base-boton--secundario {
  padding: 10px 6px 12px;
  font-size: clamp(1.1rem, 1.8vw, 1.5rem);
  border-bottom: 2px solid rgba(240, 180, 60, 0.45);
}

.base-boton--secundario:hover {
  color: #ffd770;
  border-bottom-color: #ffc247;
  transform: translateX(8px);
}

.base-boton--secundario:hover .base-boton__marca,
.base-boton:focus-visible .base-boton__marca {
  opacity: 1;
  transform: none;
}

.base-boton:active {
  transform: translateX(8px) scale(0.98);
}

/* Se ve al navegar con teclado (accesibilidad, lección 13) */
.base-boton:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}
</style>
