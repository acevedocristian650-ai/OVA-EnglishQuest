// Barajado por intento, sin alterar el banco original.
export function barajar(lista, azar = Math.random) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1)); [copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
export function semillaDe(texto) {
  let h = 2166136261
  for (const c of String(texto ?? '')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function barajarSemilla(lista, semilla) {
  let estado = semilla >>> 0
  return barajar(lista, () => { estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0; return estado / 4294967296 })
}
export const normalizarFrase = (s) => String(s).trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.?!]+$/, '').replace(/\s+/g, ' ')
// Evita únicamente una frase ya resuelta. Si el azar insiste, usa una permutación garantizada.
export function ordenFichas(fichas, correcta, semilla) {
  const ids = fichas.map((_, i) => i)
  const resuelta = (orden) => normalizarFrase(orden.map(i => fichas[i]).join(' ')) === normalizarFrase(correcta)
  let orden = semilla === undefined ? barajar(ids) : barajarSemilla(ids, semilla)
  if (!resuelta(orden)) return orden
  for (let i = 0; i < orden.length; i++) for (let j = i + 1; j < orden.length; j++) {
    const candidato = [...orden]; [candidato[i], candidato[j]] = [candidato[j], candidato[i]]
    if (!resuelta(candidato)) return candidato
  }
  return orden // Solo si las fichas no admiten ninguna permutación textual diferente.
}
export function bancoOrdenar(q) {
  const reales = ordenFichas(q.fichas, q.correcta).map(i => ({ texto: q.fichas[i], sobra: false }))
  for (const texto of q.sobran ?? []) reales.splice(Math.floor(Math.random() * (reales.length + 1)), 0, { texto, sobra: true })
  return reales
}
export function mezclarPregunta(q) {
  const c = { ...q }
  const campos = { cortar: 'opciones', escuchar: 'opciones', zona: 'zonas', 'esquiva-frase': 'fichas', clasificar: 'palabras', parejas: 'parejas', 'proteger-aliado': 'nodos' }
  const campo = campos[q.tipo]
  if (campo && Array.isArray(q[campo])) c[campo] = barajar(q[campo])
  return c
}
