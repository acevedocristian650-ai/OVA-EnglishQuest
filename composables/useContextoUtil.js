// Evita instrucciones redundantes en combate: si el «contexto» solo repite lo que ya dicen la insignia de la actividad
// y el botón «Cómo jugar» (p. ej. «Tap the wrong word.»), no se muestra. Los contextos que aportan información (la situación,
// la promesa pedida, la frase base…) sí se conservan.
const GENERICO = /^(Tap the wrong word|Une (la|cada|el) |Escucha y toca)/i
export const contextoUtil = (pregunta) => (pregunta?.contexto && !GENERICO.test(pregunta.contexto) ? pregunta.contexto : '')
