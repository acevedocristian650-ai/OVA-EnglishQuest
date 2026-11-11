<template>
  <div class="escenario" :class="[`nivel-${nivel.numero}`, { urgente }]" :style="{ '--fondo': `url('${nivel.fondo}')`, '--carga': carga ?? 0 }">
    <div class="secuencia" :class="[ataque?.id, { activa: ataque, magia: ataque?.magia, final: ataque?.final, urgente, congelado }]" :style="tiempos"
      @animationend.self="emit('terminar')">
      <span class="ambiente" aria-hidden="true">
        <span v-for="(m, i) in motas" :key="i" class="mota" :style="m" />
      </span>
      <div class="accion">
        <span v-if="ataque?.final" class="penumbra" aria-hidden="true" />
        <div class="luchador caballero" :class="[caballero, { esperando, 'en-guardia': enGuardia, victoria, tenso: urgente }]" role="img" aria-label="Caballero con hacha y escudo solar">
          <img v-for="pose in [...posesCaballero, ...posesNuevasCaballero]" :key="pose" class="pose"
            :class="[pose, { amp: medidas[`caballero/${pose}`] }]" :style="estiloAmp('caballero', pose)"
            :src="`/images/personajes-mate/caballero/${pose}.${extension(pose)}`" alt="" draggable="false" />
        </div>
        <div class="luchador guardian" :class="[guardian, { esperando, 'con-derrota': nivel.derrota, c1: faseCarga === 1, c2: faseCarga === 2, 'desde-carga': cargaPrevia > 0 }]"
          :style="{ '--carga': carga ?? 0 }" role="img" :aria-label="nivel.guardian">
          <img v-for="pose in [...posesGuardian, ...posesNuevasGuardian]" :key="pose" class="pose"
            :class="[pose, { amp: medidas[`${carpetaGuardian}/${pose}`] }]" :style="estiloAmp(carpetaGuardian, pose)"
            :src="`${nivel.arte}/${pose}.${extension(pose)}`" alt="" draggable="false" />
          <!-- Chorro (veneno / aliento): nace en la boca del sprite «ataque» y viaja con el jefe, sin depender del tamaño de la escena -->
          <img v-if="ataqueRival && chorro" class="chorro" :class="`chorro-${nivel.numero}`" :src="chorro" alt="" draggable="false" />
          <span class="onda-suelo" aria-hidden="true" />
          <span class="particulas-carga" aria-hidden="true">
            <span v-for="(p, i) in particulasCarga" :key="i" class="p" :style="p" />
          </span>
        </div>
        <template v-if="ataque?.final">
          <span class="rotulo-final" aria-hidden="true">¡Golpe final!</span>
          <template v-if="nivel.derrota">
            <span v-for="(estilo, i) in chispasFinal" :key="i" class="chispa-final" :style="estilo" aria-hidden="true" />
          </template>
        </template>
        <template v-if="ataque">
          <span class="pulso-impacto" aria-hidden="true" @animationstart.self="alImpactar" />
          <CombatEfectos :class="`nivel-${nivel.numero}`" :nivel="nivel.numero" :ataque="ataque" :estela="efecto"
            :dano="danoAplicado" :curacion="curacion" />
        </template>
      </div>
    </div>
    <span class="peligro" aria-hidden="true" />
    <div class="indicadores">
      <slot name="hud" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  nivel: { type: Object, required: true },
  ataque: { type: Object, default: null },
  danoAplicado: { type: Number, default: null },
  curacion: { type: Number, default: 0 },
  vidaCaballero: { type: Number, required: true },
  vidaRival: { type: Number, required: true },
  // Progreso de la carga del enemigo mientras el estudiante piensa (0 a 1). null cuando no hay pregunta en curso.
  carga: { type: Number, default: null }
})
const emit = defineEmits(['impactar', 'terminar'])
const posesReaccion = ['retroceso', 'dolor', 'tambaleo', 'recuperacion', 'caida']
const posesCaballero = [
  'reposo', 'preparacion-hachazo', 'impacto-hachazo',
  'preparacion-barrido', 'impacto-barrido', 'preparacion-escudo', 'impacto-escudo',
  'preparacion-rayo', 'impacto-rayo', 'preparacion-fenix', 'impacto-fenix',
  'salida-hachazo', 'salida-barrido', 'salida-escudo', 'salida-magia', ...posesReaccion
]
// Los cuadros intermedios «tw-*» (mezclas translúcidas de dos poses) ya no se usan: al verse a la vez dos siluetas
// el golpe parecía superpuesto. Ahora solo hay una pose visible en cada instante y el movimiento lo da el desplazamiento.
const posesGuardian = ['reposo', 'preparacion', 'impacto', ...posesReaccion]
// Poses nuevas: vienen recortadas a su tamaño real, no en el lienzo fijo de las poses de reposo.
const posesNuevasCaballero = ['guardia', 'final-1', 'final-2', 'final-3', 'golpeado', 'anticipacion', 'esquiva']
const posesNuevasGuardian = computed(() => ['carga-1', 'carga-2', 'ataque', ...(props.nivel.derrota ? ['derrota-1', 'derrota-2'] : [])])
const nuevas = new Set([...posesNuevasCaballero, 'carga-1', 'carga-2', 'ataque', 'derrota-1', 'derrota-2'])
const extension = (pose) => (nuevas.has(pose) ? 'webp' : 'png')
const carpetaGuardian = computed(() => props.nivel.arte.split('/').pop())
// Los jefes 2 y 4 lanzan un chorro desde la boca; el 1 lanza una bola (se dibuja en CombatEfectos) y el 3 invoca un rayo.
const chorros = { 2: '/images/jefes/rio/ola-venenosa.png', 4: '/images/jefes/real/aliento-fuego.png' }
const chorro = computed(() => chorros[props.nivel.numero])
// Medidas en unidades del lienzo de referencia (512 de alto): ancho, alto, desvío horizontal y distancia al suelo.
const medidas = {"caballero/golpeado": {"w": 0.7617, "h": 0.6738, "dx": 0.0, "by": 0.0279}, "caballero/anticipacion": {"w": 0.6758, "h": 0.5781, "dx": 0.0, "by": 0.0279}, "caballero/esquiva": {"w": 0.6504, "h": 0.6406, "dx": 0.0, "by": 0.0279}, "caballero/guardia": {"w": 0.625, "h": 0.5898, "dx": -0.001, "by": 0.0279}, "caballero/final-1": {"w": 0.5879, "h": 0.7168, "dx": -0.001, "by": 0.0279}, "caballero/final-2": {"w": 0.7676, "h": 0.7148, "dx": -0.001, "by": 0.0279}, "caballero/final-3": {"w": 0.7051, "h": 0.5469, "dx": -0.001, "by": 0.0279}, "grifo/carga-1": {"w": 0.6855, "h": 0.5352, "dx": -0.001, "by": 0.1669}, "grifo/carga-2": {"w": 0.9199, "h": 0.8926, "dx": -0.001, "by": 0.1669}, "grifo/ataque": {"w": 0.9629, "h": 0.5293, "dx": -0.001, "by": 0.1669}, "grifo/derrota-1": {"w": 0.8945, "h": 0.7012, "dx": -0.001, "by": 0.1669}, "grifo/derrota-2": {"w": 0.8359, "h": 0.4805, "dx": -0.001, "by": 0.1669}}
function estiloAmp(carpeta, pose) {
  const m = medidas[`${carpeta}/${pose}`]
  return m ? { '--w': m.w, '--h': m.h, '--dx': m.dx, '--by': m.by } : undefined
}
// Chispas del enemigo al deshacerse (valores fijos para que servidor y cliente pinten lo mismo)
const chispasFinal = Array.from({ length: 14 }, (_, i) => ({
  left: `${60 + ((i * 37) % 28)}%`,
  top: `${36 + ((i * 23) % 26)}%`,
  '--d': (i * 131) % 500,
  '--s': `${5 + ((i * 7) % 7)}px`
}))
// Partículas de energía que el enemigo absorbe mientras carga, y motas de ambiente (valores fijos: servidor y cliente pintan lo mismo)
const particulasCarga = Array.from({ length: 14 }, (_, i) => {
  const ang = (i * 137) % 360
  return {
    '--ax': Math.round(Math.cos((ang * Math.PI) / 180) * 70),
    '--ay': Math.round(Math.sin((ang * Math.PI) / 180) * 48),
    '--r': `${-((i * 0.29) % 1.6).toFixed(2)}s`
  }
})
const motas = Array.from({ length: 12 }, (_, i) => ({
  '--x': `${(i * 53 + 7) % 100}%`,
  '--s': `${2 + ((i * 5) % 4)}px`,
  '--t': `${9 + ((i * 7) % 8)}s`,
  '--d': (i * 1.7).toFixed(1),
  '--v': `${((i * 29) % 44) - 22}px`
}))
const esperando = computed(() => props.carga !== null && !props.ataque)
const faseCarga = computed(() => (!esperando.value ? 0 : props.carga >= 0.66 ? 2 : props.carga >= 0.33 ? 1 : 0))
const enGuardia = computed(() => esperando.value && props.carga > 0.06)
const urgente = computed(() => esperando.value && props.carga >= 0.7)
const victoria = computed(() => props.vidaRival === 0 && props.vidaCaballero > 0 && !props.ataque)
const ataqueRival = computed(() => props.ataque?.id === 'rival')

// Cuánta carga llevaba el enemigo cuando empezó su ataque: si ya estaba cargado, no «retrocede» a una pose anterior.
let ultimaCarga = 0
const cargaPrevia = ref(0)
watch(() => props.carga, (valor) => { if (valor !== null) ultimaCarga = valor }, { immediate: true })
watch(() => props.ataque, (nuevo) => {
  if (nuevo?.id === 'rival') cargaPrevia.value = ultimaCarga >= 0.66 ? 2 : ultimaCarga >= 0.33 ? 1 : 0
})

// Pausa de impacto: en el contacto la imagen se congela una fracción de segundo, como en los juegos de pelea
const congelado = ref(false)
let temporizadorPausa = null
function alImpactar() {
  emit('impactar')
  congelado.value = true
  clearTimeout(temporizadorPausa)
  temporizadorPausa = setTimeout(() => (congelado.value = false), props.ataque?.final ? 150 : 95)
}

onBeforeUnmount(() => { clearTimeout(temporizadorPausa) })
const caballero = computed(() => estadoLuchador(props.vidaCaballero, 100, ataqueRival.value))
const guardian = computed(() => estadoLuchador(props.vidaRival, props.nivel.vida, !ataqueRival.value))

function estadoLuchador(vida, maxima, recibe) {
  return {
    receptor: Boolean(props.ataque) && recibe,
    emisor: Boolean(props.ataque) && !recibe,
    herido: vida > 0 && vida / maxima <= 0.34,
    tendido: vida === 0
  }
}

const tiempos = computed(() => {
  if (!props.ataque) return null
  const duracion = props.ataque.duracion
  // El 54 % es el contacto en las animaciones de avance y de proyectil (el golpe final lo adelanta al 46 %).
  const impacto = Math.round(duracion * (props.ataque.final ? 0.46 : 0.54))
  return {
    '--duracion': `${duracion}ms`,
    '--momento-impacto': `${impacto}ms`,
    '--duracion-reaccion': `${duracion - impacto}ms`
  }
})

const efecto = computed(() => {
  if (!props.ataque || props.ataque.magia) return undefined
  const id = props.ataque?.id
  if (id === 'rival') return props.nivel.efecto
  return id === 'hachazo' ? '/images/bosque-del-alba/hachazo.svg' : `/images/caballero/${id}.svg`
})
</script>

<style scoped>
.escenario {
  --alto: clamp(175px, 60dvh, 610px);
  position: relative;
  height: var(--alto);
  overflow: hidden;
  isolation: isolate;
  border: 1px solid #938060;
  border-radius: 10px;
  background: #293335;
  box-shadow: 0 12px 34px #0008;
}

.secuencia {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #1012179e, transparent 24%, transparent 78%, #0c111945), var(--fondo) center 66% / cover;
}
.secuencia::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 clamp(20px, 8vw, 100px) #0a0c135e;
}
.indicadores { position: absolute; z-index: 1; inset: 0.55rem clamp(0.8rem, 2.4vw, 2rem) auto; pointer-events: none; }
.secuencia.activa { transform-origin: 60% 62%; animation: camara var(--duracion) ease-out both; }
.secuencia.rival { transform-origin: 38% 62%; }
/* Intensidad y color del impacto según el ataque */
.secuencia { --sacudida: 6px; --tinte: #fff3cf; --fx: 62%; --fy: 57%; }
.secuencia.hachazo { --sacudida: 9px; --fy: 69%; }
.secuencia.barrido { --sacudida: 7px; --tinte: #d6f1ff; }
.secuencia.escudo { --sacudida: 10px; --fx: 61%; }
.secuencia.rayo { --sacudida: 6px; --tinte: #cfeaff; --fx: 64%; --fy: 53%; }
.secuencia.fenix { --sacudida: 8px; --tinte: #ffd89a; --fx: 64%; --fy: 55%; }
.secuencia.rival { --sacudida: 9px; --tinte: #ffc7b0; --fx: 34%; --fy: 55%; }
/* Destello de pantalla en el momento exacto del contacto */
.secuencia.activa .accion::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
  background: radial-gradient(circle at var(--fx) var(--fy), var(--tinte) 0, #ffffff2e 26%, transparent 58%);
  animation: destello-golpe 280ms ease-out var(--momento-impacto) forwards;
}
.emisor { transform-origin: center bottom; }
.accion { position: relative; width: min(100%, calc(var(--alto) * 3.2)); height: 100%; margin-inline: auto; }
.luchador { position: absolute; width: 45%; height: 103%; container-type: size; }
.caballero { left: 3%; bottom: 10%; }
.guardian { left: 51%; bottom: -4%; width: 46%; height: 99%; }
.escenario:not(.nivel-1) .guardian { left: 49%; width: 50%; }
.luchador::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -0.5%;
  width: min(72%, calc(var(--alto) * 0.87));
  height: 9%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, #101112bd 5%, #10111262 44%, transparent 74%);
}
.guardian::before { bottom: 13%; }
.escenario.nivel-1 { --aura: #ffd54f; }
.escenario.nivel-2 { --aura: #00e676; }
.escenario.nivel-3 { --aura: #00e5ff; }
.escenario.nivel-4 { --aura: #ff5722; }
.pose {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom;
  transform-origin: center bottom;
  opacity: 0;
  filter: drop-shadow(0 2px 3px #15141660);
}
.pose.reposo { opacity: 1; }
/* Respiración en espera: los luchadores ya no se quedan congelados entre ataques */
.luchador:not(.emisor, .receptor, .tendido) { transform-origin: center bottom; animation: respirar 3.2s ease-in-out infinite, mecer 5.3s ease-in-out infinite; }
.guardian:not(.emisor, .receptor, .tendido) { animation-duration: 3.8s, 6.1s; animation-delay: -1.4s, -2.2s; }
.luchador:is(.herido, .tendido):not(.emisor, .receptor) .reposo { opacity: 0; }
.herido:not(.emisor, .receptor) .dolor { opacity: 1; animation: respiracion 1.9s ease-in-out infinite; }
.tendido:not(.receptor) .caida { opacity: 1; }

.hachazo .caballero { animation: avance-hachazo var(--duracion) ease-in-out both, deformar var(--duracion) ease-in-out both; }
.barrido .caballero { animation: avance-barrido var(--duracion) ease-in-out both, deformar var(--duracion) ease-in-out both; }
.escudo .caballero {
  --alcance-escudo: clamp(19%, calc(107% - var(--alto) * 0.96), 50%);
  animation: avance-escudo var(--duracion) ease-in-out both, deformar var(--duracion) ease-in-out both;
}
.nivel-1 .escudo .caballero { --alcance-escudo: clamp(26%, calc(112% - var(--alto) * 0.83), 53%); }
.magia .caballero { animation: conjurar var(--duracion) ease-out both, deformar-magia var(--duracion) ease-in-out both; }
.rival .guardian { --avance: -13%; animation: avance-rival var(--duracion) ease-out both, deformar-rival var(--duracion) ease-in-out both; }
.nivel-2 .rival .guardian { --avance: -20%; }
.nivel-3 .rival .guardian { --avance: -40%; --altura: -18%; }
.nivel-4 .rival .guardian { --avance: -5%; }
.receptor {
  --retroceso: 13%;
  --inclinacion: 5deg;
  animation: recibir var(--duracion-reaccion) ease-out var(--momento-impacto) both, impacto-recibido 420ms ease-out var(--momento-impacto) forwards;
  transform-origin: center 87%;
}
.caballero.receptor {
  --retroceso: -17%;
  --inclinacion: -6deg;
  animation: recibir var(--duracion-reaccion) ease-out var(--momento-impacto) both, impacto-rojo 760ms ease-out var(--momento-impacto) forwards;
}
.caballero.receptor :is(.retroceso, .dolor) { display: none; }
.receptor .golpeado { animation-name: golpeado-rx; }
@keyframes golpeado-rx { 0% { opacity: 1; } 42%, 100% { opacity: 0; } }
@keyframes impacto-rojo {
  0%   { filter: brightness(2.4) saturate(0.2); scale: 0.92 1.06; }
  14%  { filter: brightness(1.35) sepia(1) saturate(6) hue-rotate(-50deg); scale: 1.05 0.96; }
  32%  { filter: brightness(1.05); scale: 0.99 1.01; }
  46%  { filter: brightness(1.2) sepia(1) saturate(4) hue-rotate(-50deg); scale: 1 1; }
  62%  { filter: none; }
  100% { filter: none; scale: 1 1; }
}

.emisor .reposo { animation: reposo-atacante var(--duracion) step-end both; }
.rival .emisor .reposo { animation-name: reposo-guardian; }
.receptor .reposo { animation: reposo-rival 1ms step-start var(--momento-impacto) forwards; }
.hachazo .preparacion-hachazo, .barrido .preparacion-barrido, .escudo .preparacion-escudo { animation: preparar var(--duracion) step-end both; }
.hachazo .anticipacion, .barrido .anticipacion { animation: anticipar var(--duracion) step-end both; }
.hachazo .preparacion-hachazo, .barrido .preparacion-barrido { animation-name: preparar-tarde; }
/* El golpe entra con una pose limpia y un breve «trazo» (inclinación + desenfoque) en lugar de mezclar dos poses */
.hachazo .impacto-hachazo, .barrido .impacto-barrido, .escudo .impacto-escudo { animation: golpear var(--duracion) step-end both, trazo-golpe var(--duracion) ease-out both; }
.rayo .preparacion-rayo, .fenix .preparacion-fenix { animation: cargar-conjuro var(--duracion) step-end both; }
.rayo .impacto-rayo, .fenix .impacto-fenix { animation: lanzar-conjuro var(--duracion) step-end both, trazo-conjuro var(--duracion) ease-out both; }
.hachazo .salida-hachazo, .barrido .salida-barrido, .escudo .salida-escudo, .magia .salida-magia { animation: recoger-golpe var(--duracion) step-end both; }
.receptor .pose:not(.reposo) {
  animation-duration: var(--duracion-reaccion);
  animation-delay: var(--momento-impacto);
  animation-timing-function: var(--ritmo-reaccion, step-end);
  animation-fill-mode: forwards;
}
.receptor .retroceso { animation-name: sacudida; }
.receptor .dolor { animation-name: dolor; }
.receptor .tambaleo { animation-name: tambalear; }
.receptor .recuperacion { animation-name: recomponerse; }
.receptor .caida { --ritmo-reaccion: ease-out; visibility: hidden; animation-name: desplomarse; }
.receptor.tendido .recuperacion { visibility: hidden; }
.receptor.tendido .caida { visibility: visible; }

.pulso-impacto { position: absolute; visibility: hidden; animation: pulso 1ms linear var(--momento-impacto); }

/* ---------- Poses nuevas (recortadas a su tamaño, a la misma escala que el reposo) ---------- */
.pose.amp {
  inset: auto;
  left: 50%;
  bottom: calc(100cqh * var(--by));
  width: calc(100cqh * var(--w));
  height: calc(100cqh * var(--h));
  translate: calc(-50% + 100cqh * var(--dx)) 0;
  object-fit: fill;
}

/* ---------- Espera de la pregunta: el enemigo carga su ataque ---------- */
.esperando .pose { transition: opacity 220ms cubic-bezier(0.25, 0.8, 0.25, 1); }
.guardian::after {
  content: '';
  position: absolute;
  z-index: -1;
  left: 50%;
  bottom: 12%;
  width: 90%;
  height: 78%;
  translate: -50% 0;
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--aura, #ffd85a) 0, transparent 68%);
  opacity: 0;
  pointer-events: none;
}
.guardian.esperando::after { opacity: calc(var(--carga, 0) * 0.5); animation: aura 0.9s ease-in-out infinite; }
.guardian.esperando:is(.c1, .c2) :is(.reposo, .dolor) { opacity: 0; }
.guardian.esperando.c1 .carga-1 { opacity: 1; }
.guardian.esperando.c2 .carga-2 { opacity: 1; }
.guardian.c2:not(.emisor, .receptor, .tendido) { animation: temblar 0.16s linear infinite; }
.luchador.caballero.en-guardia :is(.reposo, .dolor) { opacity: 0; }
.luchador.caballero.en-guardia .guardia { opacity: 1; }
@keyframes aura { 50% { scale: 1.12; } }

/* Energía que el enemigo absorbe: más partículas y ondas más rápidas a medida que se acaba el tiempo */
.particulas-carga { position: absolute; inset: 0; pointer-events: none; }
.particulas-carga .p { position: absolute; left: 50%; top: 52%; width: 7px; height: 7px; margin: -3px; border-radius: 50%; display: none; opacity: 0;
  background: radial-gradient(circle, #fff 0, var(--aura, #ffd85a) 55%, transparent 75%); }
.guardian.esperando:is(.c1, .c2) .particulas-carga .p:nth-child(odd), .guardian.esperando.c2 .particulas-carga .p { display: block; animation: absorber 1.3s ease-in infinite; animation-delay: var(--r); }
@keyframes absorber {
  0% { translate: calc(var(--ax) * 1cqw) calc(var(--ay) * 1cqh); opacity: 0; scale: 1.3; }
  20% { opacity: 1; }
  100% { translate: 0 0; opacity: 0; scale: 0.3; }
}
.onda-suelo { position: absolute; left: 50%; bottom: 13%; width: 80%; height: 10%; translate: -50% 0; border-radius: 50%; border: 2px solid var(--aura, #ffd85a); opacity: 0; pointer-events: none; }
.guardian.esperando:is(.c1, .c2) .onda-suelo { animation: onda calc(1.7s - var(--carga, 0) * 1.1s) ease-out infinite; }
@keyframes onda { 0% { opacity: 0.75; scale: 0.3; } 100% { opacity: 0; scale: 1.3; } }
.peligro { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at center, transparent 52%, #c4121f 135%); }
.escenario.urgente .peligro { animation: latido-peligro calc(1.15s - var(--carga, 0) * 0.55s) ease-in-out infinite; }
@keyframes latido-peligro { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }
.secuencia.urgente { transform-origin: 60% 62%; animation: latido-camara calc(1.15s - var(--carga, 0) * 0.55s) ease-in-out infinite; }
@keyframes latido-camara { 0%, 100% { transform: scale(1); } 14% { transform: scale(1.014); } 28% { transform: scale(1); } 40% { transform: scale(1.008); } 54% { transform: scale(1); } }
.luchador.caballero.tenso:not(.emisor, .receptor, .tendido) { animation: tensar 0.5s ease-in-out infinite; }
@keyframes tensar { 0%, 100% { transform: translateX(-2%) scale(1.02, 0.97); } 50% { transform: translateX(-3.4%) scale(1.035, 0.95); } }

/* Ambiente: motas flotando para que el fondo no se sienta como una imagen quieta */
.ambiente { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.mota { position: absolute; left: var(--x); bottom: -4%; width: var(--s); height: var(--s); border-radius: 50%; background: var(--aura, #ffd85a); opacity: 0; animation: flotar-mota var(--t) linear infinite; animation-delay: calc(var(--d) * -1s); }
@keyframes flotar-mota { 0% { opacity: 0; translate: 0 0; } 15% { opacity: 0.55; } 85% { opacity: 0.25; } 100% { opacity: 0; translate: var(--v) calc(var(--alto) * -1.05); } }

/* Pausa de impacto */
.secuencia.congelado, .secuencia.congelado * { animation-play-state: paused !important; }
@keyframes temblar { 25% { translate: -2px 1px; } 50% { translate: 2px -1px; } 75% { translate: -1px -1px; } }

/* El enemigo ataca desde su carga: carga-1 → carga-2 → «ataque» (se suelta el golpe en el 36 %) → reposo.
   Solo hay una pose visible a la vez (se quitaron los «ecos» translúcidos que dejaban al jefe con aspecto fantasmal). */
.rival .guardian :is(.preparacion, .impacto) { display: none; }
.rival .guardian .carga-1 { animation: rival-carga-1 var(--duracion) step-end both; }
.rival .guardian .carga-2 { animation: rival-carga-2 var(--duracion) step-end both; }
.rival .guardian.desde-carga .carga-1 { animation: none; }
.rival .guardian.desde-carga .carga-2 { animation-name: rival-carga-2-directa; }
.rival .guardian .ataque { animation: golpear-rival var(--duracion) step-end both, trazo-rival var(--duracion) ease-out both; }
.rival .guardian::after { opacity: 0.6; animation: aura-ataque var(--duracion) ease-out both; }
@keyframes aura-ataque { 0% { opacity: 0.55; scale: 1; } 35% { opacity: 1; scale: 1.28; } 42% { opacity: 0.9; scale: 1.15; } 62%, 100% { opacity: 0; scale: 1; } }
@keyframes rival-carga-1 { 0% { opacity: 1; } 12%, 100% { opacity: 0; } }
@keyframes rival-carga-2 { 0%, 100% { opacity: 0; } 12% { opacity: 1; } 36% { opacity: 0; } }
@keyframes rival-carga-2-directa { 0% { opacity: 1; } 36%, 100% { opacity: 0; } }
@keyframes golpear-rival { 0%, 88%, 100% { opacity: 0; } 36% { opacity: 1; } }
/* Entrada del «ataque»: el jefe llega ya inclinado hacia delante y se asienta en su pose */
@keyframes trazo-rival {
  0%, 35.9% { transform: translateX(4%) skewX(7deg) scaleX(1.05); filter: drop-shadow(0 2px 3px #15141660) blur(1.2px); }
  41%, 100% { transform: none; filter: drop-shadow(0 2px 3px #15141660); }
}

/* Chorro de veneno (nivel 2) y aliento (nivel 4). Medidas en cqh del jefe (1 px del sprite = 100/512 cqh):
   la punta de cada imagen se coloca sobre la boca del sprite «ataque», así siempre sale de donde toca. */
.chorro {
  position: absolute;
  z-index: 3;
  max-width: none;
  opacity: 0;
  pointer-events: none;
  object-fit: fill;
}
.chorro-4 {
  height: 36cqh; width: 108cqh;           /* misma proporción que aliento-fuego.png (3:1) */
  left: calc(50cqw - 152.9cqh);           /* borde derecho = boca: 50cqw - 44.9cqh */
  bottom: 35.7cqh;                         /* la punta de la llama está al 61,5 % de la altura de la imagen */
  transform-origin: 99.8% 61.5%;
  filter: drop-shadow(0 0 10px #ff5722cc) drop-shadow(0 0 22px #ffc107a6);
  animation: chorro-fuego var(--duracion) linear both;
}
.chorro-2 {
  height: 40cqh; width: 120cqh;           /* ola-venenosa.png (3:1) */
  left: calc(50cqw - 164.9cqh);
  bottom: 21.9cqh;                         /* la cola de la ola está al 79 % de la altura de la imagen */
  transform-origin: 99.4% 79%;
  filter: drop-shadow(0 0 14px #00e676cc);
  animation: chorro-ola var(--duracion) linear both;
}
@keyframes chorro-fuego {
  0%, 35% { opacity: 0; transform: scale(0.05, 0.3); }
  37%     { opacity: 1; transform: scale(0.14, 0.45); }
  46%     { opacity: 1; transform: scale(0.72, 0.9); }
  54%, 68% { opacity: 1; transform: scale(1, 1); }
  80%     { opacity: 0.75; transform: scale(1.02, 0.82); }
  92%, 100% { opacity: 0; transform: scale(1.04, 0.5); }
}
@keyframes chorro-ola {
  0%, 35% { opacity: 0; transform: scale(0.05, 0.25); }
  37%     { opacity: 1; transform: scale(0.12, 0.35); }
  47%     { opacity: 1; transform: scale(0.7, 0.85); }
  55%, 70% { opacity: 1; transform: scale(1, 1); }
  82%     { opacity: 0.7; transform: scale(1.02, 0.8); }
  94%, 100% { opacity: 0; transform: scale(1.04, 0.55); }
}

/* ---------- Golpe final: el caballero salta, remata y el enemigo cae ---------- */
.secuencia.final.activa { transform-origin: 62% 62%; animation-name: camara-final; animation-timing-function: ease-in-out; }
.penumbra {
  position: absolute;
  inset: -2%;
  pointer-events: none;
  background: radial-gradient(ellipse at 60% 62%, transparent 22%, #04050c 100%);
  opacity: 0;
  animation: oscurecer var(--duracion) ease-in-out both;
}
.secuencia.final .accion::before {
  content: '';
  position: absolute;
  inset: -10%;
  pointer-events: none;
  opacity: 0;
  background: repeating-conic-gradient(from 0deg at var(--fx) var(--fy), #0000 0 5deg, #ffffffa6 5deg 5.7deg, #0000 5.7deg 11deg);
  -webkit-mask: radial-gradient(circle at var(--fx) var(--fy), transparent 14%, #000 62%);
  mask: radial-gradient(circle at var(--fx) var(--fy), transparent 14%, #000 62%);
  animation: lineas var(--duracion) linear both;
}
.secuencia.final.activa .accion::after {
  background: radial-gradient(circle at var(--fx) var(--fy), #fffffff2 0, #ffffff70 28%, transparent 66%);
  animation-name: destello-final;
  animation-duration: 560ms;
}
.secuencia.final .luchador.caballero { animation: heroe-final var(--duracion) ease-in-out both, deformar var(--duracion) ease-in-out both; }
.secuencia.final .luchador.caballero .pose:not(.reposo, .anticipacion, .final-1, .final-2, .final-3) { display: none; }
.secuencia.final .luchador.caballero .reposo { animation: final-reposo var(--duracion) step-end both; }
.secuencia.final .luchador.caballero .anticipacion { animation: final-guardia var(--duracion) step-end both; }
.secuencia.final .luchador.caballero .final-1 { animation: final-pose-1 var(--duracion) step-end both; }
.secuencia.final .luchador.caballero .final-2 { animation: final-pose-2 var(--duracion) step-end both; }
.secuencia.final .luchador.caballero .final-3 { animation: final-pose-3 var(--duracion) step-end both; }
/* Después del golpe, el caballero se queda en su pose de victoria */
.luchador.caballero.victoria :is(.reposo, .dolor) { opacity: 0; }
.luchador.caballero.victoria .final-3 { opacity: 1; }

/* Enemigo con secuencia de derrota propia: queda herido, cae de rodillas y se deshace en luz */
.secuencia.final .receptor.con-derrota :is(.retroceso, .dolor, .tambaleo, .recuperacion, .caida) { display: none; }
/* Solo en el golpe final: antes se disparaba también con golpes normales y se sumaba a la reacción habitual */
.secuencia.final .receptor.con-derrota .derrota-1 { animation: derrota-1 var(--duracion-reaccion) step-end var(--momento-impacto) forwards; }
.secuencia.final .receptor.con-derrota .derrota-2 { animation: derrota-2 var(--duracion-reaccion) ease-in var(--momento-impacto) forwards; }
.guardian.con-derrota.tendido:not(.receptor) .caida { opacity: 0; }

.rotulo-final {
  position: absolute;
  top: 17%;
  left: 50%;
  translate: -50% 0;
  color: #fff3c9;
  font: 800 clamp(1.1rem, 4.4dvh, 2.6rem) / 1 Georgia, serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow: 0 0 14px var(--aura, #ffd85a), 0 2px 0 #3a2200, 0 0 30px #000;
  opacity: 0;
  pointer-events: none;
  animation: rotulo var(--duracion) ease-out both;
}
.chispa-final {
  position: absolute;
  width: var(--s);
  height: var(--s);
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0, var(--aura, #ffd85a) 45%, transparent 72%);
  opacity: 0;
  pointer-events: none;
  animation: chispa-final 1300ms ease-out calc(var(--momento-impacto) + 900ms + var(--d) * 1ms) both;
}

/* Ritmo de cada golpe (en % de la duración):
   anticipación → preparación → impacto (cambio de pose en el 34 %, cuando el cuerpo empieza a lanzarse) → salida → reposo */
@keyframes preparar { 0% { opacity: 1; } 34%, 100% { opacity: 0; } }
@keyframes anticipar { 0% { opacity: 1; } 17%, 100% { opacity: 0; } }
@keyframes preparar-tarde { 0%, 16.9% { opacity: 0; } 17% { opacity: 1; } 34%, 100% { opacity: 0; } }
@keyframes golpear { 0%, 70%, 100% { opacity: 0; } 34% { opacity: 1; } }
/* Magia: el conjuro se carga antes, así que su pose de lanzamiento llega antes */
@keyframes cargar-conjuro { 0% { opacity: 1; } 32%, 100% { opacity: 0; } }
@keyframes lanzar-conjuro { 0%, 70%, 100% { opacity: 0; } 32% { opacity: 1; } }
/* «Trazo»: al cambiar de pose la figura va inclinada hacia delante y algo desenfocada, y se asienta en pocos cuadros */
@keyframes trazo-golpe {
  0%, 33.9% { transform: translateX(-4%) skewX(-8deg) scaleX(1.05); filter: drop-shadow(0 2px 3px #15141660) blur(1.3px); }
  39%, 100% { transform: none; filter: drop-shadow(0 2px 3px #15141660); }
}
@keyframes trazo-conjuro {
  0%, 31.9% { transform: translateY(2%) scale(0.97, 1.03); }
  37%, 100% { transform: none; }
}
@keyframes recoger-golpe { 0% { opacity: 0; } 70% { opacity: 1; } 88%, 100% { opacity: 0; } }
@keyframes reposo-atacante { 0% { opacity: 0; } 88%, 100% { opacity: 1; } }
@keyframes reposo-guardian { 0% { opacity: 0; } 88%, 100% { opacity: 1; } }
@keyframes reposo-rival { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes sacudida { 0% { opacity: 1; } 18%, 100% { opacity: 0; } }
@keyframes dolor { 0%, 42%, 100% { opacity: 0; } 18% { opacity: 1; } }
@keyframes tambalear { 0%, 66%, 100% { opacity: 0; } 42% { opacity: 1; } }
@keyframes recomponerse { 0% { opacity: 0; } 66%, 100% { opacity: 1; } }
@keyframes desplomarse { 0%, 65.9% { opacity: 0; } 66% { opacity: 1; transform: translateY(-7%); } 94%, 100% { opacity: 1; transform: none; } }
@keyframes respirar { 50% { transform: scale(1.018, 1.03); } }
@keyframes mecer { 25% { translate: 0.6% -0.8%; } 75% { translate: -0.6% 0.3%; } }
@keyframes respiracion { 50% { transform: scaleY(0.985); } }

@keyframes avance-hachazo {
  15% { transform: translateX(-3%); }
  34% { transform: translate(-8%, -2%) rotate(-4deg); }
  43% { transform: translate(12%, -4%) rotate(-2deg); }
  54%, 58% { transform: translate(39%, 1%); }
  69% { transform: translate(28%, 2%) rotate(3deg); }
  84% { transform: translateX(6%); }
  94% { transform: translateX(1.5%); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@keyframes avance-barrido {
  20% { transform: translate(-7%, 1%) rotate(-5deg); }
  36% { transform: translate(1%, 2%); }
  45% { transform: translate(18%, 1%) rotate(2deg); }
  54%, 57% { transform: translate(37%, 1%) rotate(4deg); }
  69% { transform: translate(22%, 3%) rotate(2deg); }
  84% { transform: translateX(5%); }
  94% { transform: translateX(1.2%); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@keyframes avance-escudo {
  19% { transform: translate(-5%, 3%); }
  36% { transform: translate(6%, 1%) rotate(2deg); }
  45% { transform: translate(23%, 2%) rotate(3deg); }
  54%, 58% { transform: translateX(var(--alcance-escudo)); }
  69% { transform: translate(25%, 3%) rotate(-4deg); }
  84% { transform: translateX(6%); }
  94% { transform: translateX(1.5%); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
/* Se agacha mientras carga, queda en su sitio al soltar el golpe (36 %), se lanza y regresa */
@keyframes avance-rival {
  0%   { transform: translate(0, 0); }
  18%  { transform: translateY(1.8%); }
  30%  { transform: translateY(1%); }
  36%  { transform: translate(0, var(--altura, 0%)); }
  46%  { transform: translateX(calc(var(--avance) * 0.55)); }
  54%, 58% { transform: translateX(var(--avance)); }
  70%  { transform: translate(calc(var(--avance) * 0.6), 1%); }
  83%  { transform: translateX(calc(var(--avance) * 0.22)); }
  94%  { transform: translateX(calc(var(--avance) * 0.05)); }
  100% { transform: translate(0, 0); }
}
@keyframes recibir {
  0%, 7% { transform: none; }
  18% { transform: translateX(var(--retroceso)) rotate(var(--inclinacion)); }
  38% { transform: translate(calc(var(--retroceso) * 0.75), 1%) rotate(calc(var(--inclinacion) * -0.45)); }
  58% { transform: translate(calc(var(--retroceso) * 0.45), 2%); }
  75% { transform: translateX(calc(var(--retroceso) * 0.2)); }
  90% { transform: translateX(calc(var(--retroceso) * 0.05)); }
  100% { transform: none; }
}
@keyframes conjurar {
  16% { transform: translate(-3%, 1%); }
  30% { transform: translateY(-3%); }
  42%, 57% { transform: translateX(5%); }
  72% { transform: translate(2%, 2%); }
  88% { transform: translate(0.5%, 0.5%); }
  100% { transform: translate(0, 0); }
}
/* Cámara: se acerca despacio mientras el atacante se carga, golpea con zoom + sacudida y vuelve */
@keyframes camara {
  0%   { transform: scale(1) translate(0, 0); }
  30%  { transform: scale(1.015) translate(0, 0); }
  53%  { transform: scale(1.03) translate(0, 0); }
  55%  { transform: scale(1.055) translate(calc(var(--sacudida) * -1.2), calc(var(--sacudida) * 0.3)); }
  58%  { transform: scale(1.045) translate(var(--sacudida), calc(var(--sacudida) * -0.3)); }
  61%  { transform: scale(1.04) translate(calc(var(--sacudida) * -0.6), 0); }
  64%  { transform: scale(1.03) translate(calc(var(--sacudida) * 0.35), 0); }
  68%  { transform: scale(1.02) translate(calc(var(--sacudida) * -0.15), 0); }
  80%  { transform: scale(1.008) translate(0, 0); }
  100% { transform: scale(1) translate(0, 0); }
}
@keyframes pulso { to { opacity: 0; } }
@keyframes camara-final {
  0%   { transform: scale(1) translate(0, 0); }
  10%  { transform: scale(1.02) translate(0, 0); }
  30%  { transform: scale(1.07) translate(-1%, 1%); }
  45%  { transform: scale(1.12) translate(0, 0); }
  47%  { transform: scale(1.19) translate(calc(var(--sacudida) * -1.4), calc(var(--sacudida) * 0.4)); }
  50%  { transform: scale(1.15) translate(calc(var(--sacudida) * 1.1), calc(var(--sacudida) * -0.4)); }
  53%  { transform: scale(1.13) translate(calc(var(--sacudida) * -0.7), 0); }
  56%  { transform: scale(1.12) translate(calc(var(--sacudida) * 0.35), 0); }
  66%  { transform: scale(1.09) translate(0, 0); }
  100% { transform: scale(1) translate(0, 0); }
}
@keyframes oscurecer { 0% { opacity: 0; } 12%, 42% { opacity: 0.85; } 46% { opacity: 0.3; } 58%, 80% { opacity: 0.55; } 100% { opacity: 0; } }
@keyframes lineas { 0%, 24% { opacity: 0; } 30%, 45% { opacity: 0.7; } 47%, 100% { opacity: 0; } }
@keyframes destello-final { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes heroe-final {
  0%, 5% { transform: none; }
  14% { transform: translate(-5%, 3%); }
  23% { transform: translate(7%, -21%) rotate(-4deg); }
  33% { transform: translate(22%, -17%) rotate(-2deg); }
  42% { transform: translate(34%, -6%) rotate(5deg); }
  46%, 52% { transform: translate(40%, 1%); }
  62% { transform: translate(32%, 3%); }
  80% { transform: translate(15%, 3%); }
  100% { transform: translate(9%, 0); }
}
@keyframes final-reposo { 0% { opacity: 1; } 5%, 100% { opacity: 0; } }
@keyframes final-guardia { 0%, 16%, 100% { opacity: 0; } 5% { opacity: 1; } }
@keyframes final-pose-1 { 0%, 30%, 100% { opacity: 0; } 16% { opacity: 1; } }
@keyframes final-pose-2 { 0%, 56%, 100% { opacity: 0; } 30% { opacity: 1; } }
@keyframes final-pose-3 { 0% { opacity: 0; } 56%, 100% { opacity: 1; } }
@keyframes derrota-1 { 0% { opacity: 1; } 40%, 100% { opacity: 0; } }
@keyframes derrota-2 {
  0%, 39.9% { opacity: 0; }
  40% { opacity: 1; filter: brightness(1); transform: none; }
  70% { opacity: 1; filter: brightness(1.3); transform: none; }
  100% { opacity: 0; filter: brightness(2.6) blur(2px); transform: translateY(-8%) scale(1.03); }
}
@keyframes rotulo {
  0%, 24% { opacity: 0; scale: 1.7; }
  30% { opacity: 1; scale: 1; }
  43% { opacity: 1; scale: 1.04; }
  48%, 100% { opacity: 0; scale: 1.1; }
}
@keyframes chispa-final {
  0% { opacity: 0; transform: translateY(0) scale(0.6); }
  15% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-90px) scale(1.3); }
}
/* Squash & stretch del atacante: se encoge al cargar, se estira al lanzarse, se aplasta al contacto */
@keyframes deformar {
  0%, 100% { scale: 1 1; }
  30% { scale: 1.04 0.94; }
  43% { scale: 0.95 1.06; }
  54% { scale: 1.07 0.94; }
  63% { scale: 0.99 1.02; }
  76% { scale: 1 1; }
}
@keyframes deformar-rival {
  0%, 100% { scale: 1 1; }
  20% { scale: 1.03 0.97; }
  36% { scale: 1 1; }
  46% { scale: 0.97 1.04; }
  54% { scale: 1.04 0.97; }
  66% { scale: 1 1; }
}
@keyframes deformar-magia {
  0%, 100% { scale: 1 1; }
  24% { scale: 1.03 0.95; }
  32% { scale: 0.97 1.05; }
  44% { scale: 1.04 0.97; }
  60% { scale: 1 1; }
}
/* El que recibe: flash blanco y aplastamiento */
@keyframes impacto-recibido {
  0%   { filter: brightness(2.6) saturate(0.25); scale: 0.92 1.06; }
  22%  { filter: brightness(1.5) saturate(0.7); scale: 1.04 0.97; }
  50%  { filter: brightness(1.1); scale: 0.99 1.01; }
  100% { filter: none; scale: 1 1; }
}
@keyframes destello-golpe { 0% { opacity: 0.6; } 100% { opacity: 0; } }

@media (orientation: landscape) and (max-height: 510px) {
  .secuencia { background-size: auto, 100% 132%; background-position: center, center 48%; }
}

@media (orientation: portrait) and (pointer: coarse) {
  .secuencia { --reproduccion: paused; }
  .secuencia, .secuencia * { animation-play-state: paused !important; }
}

@media (prefers-reduced-motion: reduce) {
  .secuencia.activa { animation-name: reloj; }
  .secuencia .luchador, .herido:not(.emisor, .receptor) .dolor { animation-name: none !important; }
  .secuencia.activa .accion::after { display: none; }
  .secuencia.final.activa { animation-name: reloj; }
  .penumbra, .secuencia.final .accion::before, .chispa-final, .rotulo-final { display: none; }
  .guardian.esperando::after { animation: none; }
  .ambiente, .particulas-carga, .onda-suelo, .descarga, .peligro, .chorro { display: none; }
  .secuencia.urgente { animation: none; }
  .receptor .caida { animation-name: quedar-tendido; }
  @keyframes reloj { to { opacity: 1; } }
  @keyframes quedar-tendido { 0%, 65.9% { opacity: 0; } 66%, 100% { opacity: 1; } }
}
</style>
