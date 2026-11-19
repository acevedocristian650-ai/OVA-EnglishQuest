// Valida el mismo banco de preguntas que carga el mapa.
import { readFileSync } from 'node:fs'

const niveles = JSON.parse(readFileSync(new URL('../data/niveles.json', import.meta.url), 'utf8'))

const errores = []
const norm = (t) => t.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.?!]+$/, '').replace(/\s+/g, ' ')
const mismasPalabras = (a, b) => [...a.split(' ')].sort().join('|') === [...b.split(' ')].sort().join('|')

function revisar(q, donde) {
  const falla = (m) => errores.push(`${donde} (${q.tipo}) «${q.texto}»: ${m}`)
  if (!q.correcta || !q.explicacion) falla('falta correcta o explicacion')
  if (q.tipo === 'cortar' && !(q.opciones?.length === 3 && q.opciones.includes(q.correcta))) falla('cortar necesita 3 opciones y la correcta entre ellas')
  if (q.tipo === 'zona' && !q.zonas?.some((z) => z.texto === q.correcta)) falla('la correcta no está entre las zonas')
  if (q.tipo === 'ordenar') {
    if (!mismasPalabras(q.fichas.join(' '), q.correcta)) falla('las fichas no forman la frase correcta')
    if (q.fichas.length > 6) falla('más de 6 fichas: difícil en 10 s')
  }
  if (q.tipo === 'errores') {
    const arreglada = q.frase.map((p, i) => (i === q.error ? null : p)).filter(Boolean)
    if (!(q.error >= 0 && q.error < q.frase.length)) falla('índice de error fuera de la frase')
    if (norm(q.frase.join(' ')) === norm(q.correcta)) falla('la frase ya es la correcta')
    if (arreglada.length !== q.frase.length - 1) falla('índice de error inválido')
  }
  if (q.tipo === 'parejas' && q.parejas?.length !== 3) falla('parejas necesita exactamente 3 pares')
  if (q.tipo === 'escuchar') {
    if (!q.audio) falla('falta audio')
    if (!q.opciones?.includes(q.correcta)) falla('la correcta no está entre las opciones')
    if (!norm(q.audio).includes(norm(q.correcta))) falla('el audio no contiene la frase correcta')
  }
  if (q.tipo === 'clasificar' && !(q.palabras?.some((p) => p.futuro) && q.palabras?.some((p) => !p.futuro))) falla('necesita palabras de futuro y de pasado')
}

let total = 0
for (const nivel of niveles) {
  nivel.preguntas.forEach((base, i) => {
    revisar(base, `Nivel ${nivel.numero} ronda ${i + 1}`)
    ;(base.variantes ?? []).forEach((v, j) => {
      total++
      if (v.tipo !== base.tipo) errores.push(`Nivel ${nivel.numero} ronda ${i + 1} variante ${j + 1}: el tipo cambia de ${base.tipo} a ${v.tipo}`)
      revisar(v, `Nivel ${nivel.numero} ronda ${i + 1} variante ${j + 1}`)
    })
  })
}
console.log(errores.length ? errores.join('\n') : `OK: ${niveles.length} niveles, ${total} variantes, sin errores.`)
process.exit(errores.length ? 1 : 0)
