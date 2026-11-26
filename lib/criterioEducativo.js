// Criterio puro: se puede probar sin Vue ni navegador. No interviene en daño, ataques o desbloqueos.
export const APROBACION_INICIAL = 0.66
export const PESO_AYUDA_INICIAL = 0.5
export const tieneAyuda = (h) => Boolean(h?.ayuda || h?.sinAudio || h?.pistaUsada || h?.corregida)
export const esAyudaDeLectura = (h) => h?.tipo === 'escuchar' && (['transcripcion', 'sin-voz'].includes(h.ayuda) || h.sinAudio === true)

// ── Evaluación final: dominio por temática a partir de evidencias ─────────────────────────────────────────
// Evidencias por desafío: independiente (acierto sin ayuda), con ayuda (acierto con transcripción/lectura), fallado o sin responder.
// Dominio de una temática: puntos (independiente = 1, con ayuda = pesoAyuda) ≥ aprobacion × desafíos de la temática.
// Con 3 desafíos y aprobacion 0,66 el umbral es 1,98 puntos: bastan 2 aciertos independientes; 3 aciertos con ayuda (1,5) no.
export function evaluarFinal(lingu, { aprobacion = APROBACION_INICIAL, minimoPorTema = 3, pesoAyuda = PESO_AYUDA_INICIAL, totalRondas = 12 } = {}) {
  const grupos = new Map()
  for (const h of lingu) {
    const g = grupos.get(h.tema) ?? { tema: h.tema, fase: h.fase ?? 0, total: 0, aciertos: 0, primerIntento: 0, conAyuda: 0, falladas: 0, sinResponder: 0 }
    g.total++
    if (h.acierto) { g.aciertos++; tieneAyuda(h) ? g.conAyuda++ : g.primerIntento++ } else if (h.agotado) g.sinResponder++; else g.falladas++
    grupos.set(h.tema, g)
  }
  const porTema = [...grupos.values()].sort((a, b) => a.fase - b.fase).map((g) => {
    const puntos = g.primerIntento + g.conAyuda * pesoAyuda
    const aprobado = g.total >= minimoPorTema && puntos >= g.total * aprobacion - 1e-9
    return { ...g, puntos, precision: g.total ? g.aciertos / g.total : 0, aprobado, estado: g.primerIntento === g.total && g.total > 0 ? 'dominado' : aprobado ? 'logrado' : 'refuerzo' }
  })
  const total = lingu.length
  const sumar = (k) => porTema.reduce((t, g) => t + g[k], 0)
  const puntos = sumar('puntos')
  const completo = total === totalRondas && porTema.length === 4 && porTema.every(g => g.total >= minimoPorTema)
  const global = { total, aciertos: sumar('aciertos'), primerIntento: sumar('primerIntento'), conAyuda: sumar('conAyuda'), falladas: sumar('falladas'), sinResponder: sumar('sinResponder'), puntos, aprobado: total > 0 && puntos >= total * aprobacion - 1e-9 }
  const reforzar = porTema.filter((g) => !g.aprobado)
  const aprobada = completo && global.aprobado && reforzar.length === 0
  const aprendizaje = aprobada ? 'demostrado' : completo && porTema.filter((g) => g.aprobado).length >= Math.ceil(porTema.length / 2) ? 'parcial' : 'pendiente'
  return { completo, umbral: aprobacion, pesoAyuda, aprobada, aprendizaje, porTema, reforzar, global }
}
