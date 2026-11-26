import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { bancoOrdenar, barajar, mezclarPregunta, normalizarFrase, ordenFichas } from '../composables/useBarajar.js'
const niveles = JSON.parse(readFileSync(new URL('../data/niveles.json', import.meta.url)))
const preguntas = niveles.flatMap(n => n.preguntas.flatMap(q => [q, ...(q.variantes ?? [])]))
const ordenar = preguntas.filter(q => q.tipo === 'ordenar')
for (const q of ordenar) {
  const original = JSON.stringify(q)
  for (let i = 0; i < 100; i++) {
    const banco = bancoOrdenar(q)
    const reales = banco.filter(p => !p.sobra).map(p => p.texto)
    assert.deepEqual([...reales].sort(), [...q.fichas].sort())
    assert.notEqual(normalizarFrase(reales.join(' ')), normalizarFrase(q.correcta))
    assert.deepEqual(banco.filter(p => p.sobra).map(p => p.texto).sort(), [...(q.sobran ?? [])].sort())
    assert.deepEqual(ordenFichas(q.fichas, q.correcta, i), ordenFichas(q.fichas, q.correcta, i))
  }
  assert.equal(JSON.stringify(q), original)
}
for (const q of preguntas.filter(q => ['cortar','escuchar'].includes(q.tipo))) {
  const posiciones = new Set()
  for (let i = 0; i < 1000; i++) {
    const mezcla = mezclarPregunta(q)
    assert.deepEqual([...mezcla.opciones].sort(), [...q.opciones].sort())
    posiciones.add(mezcla.opciones.indexOf(q.correcta))
  }
  assert.equal(posiciones.size, q.opciones.length)
}
const perms = new Set(Array.from({length:1000}, () => barajar([0,1,2]).join(',')))
assert.equal(perms.size, 6)
console.log(`OK: ${ordenar.length} preguntas de ordenar × 100 intentos; todas las posiciones de selección y 6 permutaciones de parejas alcanzables.`)
