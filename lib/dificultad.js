// Configura el tiempo por intento sin modificar el banco ni el motor de combate.
export const SEGUNDOS_DIFICIL = 10

export function aplicarDificultad(nivel, dificultad = 'normal') {
  const dificil = dificultad === 'dificil'
  return {
    ...nivel,
    dificultad: dificil ? 'dificil' : 'normal',
    preguntas: dificil
      ? nivel.preguntas.map(pregunta => ({ ...pregunta, tiempo: SEGUNDOS_DIFICIL }))
      : nivel.preguntas
  }
}
