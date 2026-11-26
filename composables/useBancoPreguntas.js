// Banco de preguntas indexado por identificador PERMANENTE (campo `id` escrito en data/niveles.json).
//
// - `ronda`: familia de una actividad dentro de un nivel (p. ej. «n2-cortar»). Cada ronda tiene una pregunta base y variantes.
// - `id`: identifica una pregunta/variante concreta (p. ej. «n2-cortar.03»). No depende de su posición ni de su enunciado.
// - `legado`: preguntas retiradas (antiguo examen final). No se sortean en combate; solo se recuperan por id para el refuerzo.
// Módulo sin DOM: se usa igual en el navegador y en las pruebas de Node.
import nivelesBase from '../data/niveles.json' with { type: 'json' }
import tablaLegado from '../data/ids-legado.json' with { type: 'json' }

const MAX_VISTAS = 8

export function crearBanco(niveles = nivelesBase, legadoOriginal = tablaLegado.preguntas) {
  const porId = new Map()
  const rondas = new Map()
  const duplicados = []
  for (const nivel of niveles) {
    nivel.preguntas.forEach((base, indice) => {
      const pool = [base, ...(base.variantes ?? [])]
      const retiradas = base.legado ?? []
      rondas.set(base.ronda, { ronda: base.ronda, nivel: nivel.numero, indice, tipo: base.tipo, preguntas: pool, legado: retiradas })
      for (const q of [...pool, ...retiradas]) {
        if (!q.id) continue
        if (porId.has(q.id)) duplicados.push(q.id)
        porId.set(q.id, { ...q, nivelNumero: nivel.numero })
      }
    })
  }
  const buscar = (id) => porId.get(id) ?? null
  const ronda = (r) => rondas.get(r) ?? null
  const rondasDeNivel = (n) => [...rondas.values()].filter((r) => r.nivel === n)

  // Migración del criterio antiguo («nivel|texto» + posición) al id permanente.
  // 1) coincidencia exacta nivel+tipo+texto+correcta; 2) mismo nivel y texto; 3) la ronda por su posición (aproximada).
  function resolverLegado({ nivel, tipo, texto, correcta, indice }) {
    const exacta = legadoOriginal.find((l) => l.nivel === nivel && l.tipo === tipo && l.texto === texto && l.correcta === correcta)
    if (exacta) return { id: exacta.id, exacta: true }
    const porTexto = legadoOriginal.find((l) => l.nivel === nivel && l.texto === texto && (!tipo || l.tipo === tipo))
    if (porTexto) return { id: porTexto.id, exacta: false }
    const base = niveles.find((n) => n.numero === nivel)?.preguntas[indice]
    return base ? { id: base.id, exacta: false } : null
  }

  // Elige la variante de una ronda sin repetir la última y recorriendo primero las que el estudiante no ha visto.
  // `vistas` es el historial de ids de esa ronda (de más antiguo a más reciente).
  function elegirVariante(rondaId, vistas = [], azar = Math.random) {
    const r = rondas.get(rondaId)
    if (!r) return null
    if (r.preguntas.length === 1) return r.preguntas[0]
    const ultima = vistas[vistas.length - 1]
    const candidatas = r.preguntas.filter((q) => q.id !== ultima)
    const nuevas = candidatas.filter((q) => !vistas.includes(q.id))
    const grupo = nuevas.length ? nuevas : (() => {
      const antiguedad = (q) => vistas.lastIndexOf(q.id)
      const minimo = Math.min(...candidatas.map(antiguedad))
      return candidatas.filter((q) => antiguedad(q) === minimo)
    })()
    return grupo[Math.floor(azar() * grupo.length)]
  }

  // Refuerzo: una variante de la MISMA ronda distinta de la que falló; rota por todas antes de repetir.
  // Si la pregunta fallada es del legado (examen antiguo), se usan las variantes vigentes de su ronda.
  function elegirParaRefuerzo(item, azar = Math.random) {
    const r = rondas.get(item.ronda) ?? rondas.get(buscar(item.id)?.ronda)
    if (!r) { const q = buscar(item.id); return q ? { pregunta: q, esLaMisma: true } : null }
    const practicadas = item.practicadas ?? []
    const otras = r.preguntas.filter((q) => q.id !== item.id)
    if (!otras.length) return { pregunta: buscar(item.id) ?? r.preguntas[0], esLaMisma: true }
    const frescas = otras.filter((q) => !practicadas.includes(q.id))
    const grupo = frescas.length ? frescas : otras
    return { pregunta: grupo[Math.floor(azar() * grupo.length)], esLaMisma: false }
  }

  return { niveles, porId, rondas, duplicados, buscar, ronda, rondasDeNivel, resolverLegado, elegirVariante, elegirParaRefuerzo }
}

export const bancoPreguntas = crearBanco()
export const limitarVistas = (lista, id) => [...lista.filter((x) => x !== id), id].slice(-MAX_VISTAS)
