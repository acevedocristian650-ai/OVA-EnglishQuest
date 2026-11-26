import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { aplicarDificultad, SEGUNDOS_DIFICIL } from '../lib/dificultad.js'
const leer = ruta => readFileSync(new URL('../' + ruta, import.meta.url), 'utf8')
const niveles = JSON.parse(leer('data/niveles.json'))
const original = JSON.stringify(niveles)
let cantidad = 0
for (const nivel of niveles) {
  const normal = aplicarDificultad(nivel)
  const dificil = aplicarDificultad(nivel, 'dificil')
  assert.equal(normal.dificultad, 'normal')
  assert.equal(dificil.dificultad, 'dificil')
  assert.deepEqual(normal.preguntas, nivel.preguntas)
  assert.deepEqual(aplicarDificultad(nivel, 'desconocido'), normal)
  for (let i = 0; i < nivel.preguntas.length; i++) {
    const base = nivel.preguntas[i]
    assert.deepEqual(dificil.preguntas[i], { ...base, tiempo: 10 })
    for (const pregunta of base.variantes ?? []) {
      // Simula la selección de una variante antes de aplicar la dificultad.
      const intento = { ...nivel, preguntas: [pregunta] }
      assert.deepEqual(aplicarDificultad(intento, 'normal').preguntas[0], pregunta)
      assert.deepEqual(aplicarDificultad(intento, 'dificil').preguntas[0], { ...pregunta, tiempo: 10 })
      cantidad++
    }
    cantidad++
  }
}
assert.equal(JSON.stringify(niveles), original)
assert.equal(SEGUNDOS_DIFICIL, 10)
const caso = { numero: 1, tiempo: 42, preguntas: [{ tipo: 'ordenar', tiempo: 31 }] }
assert.equal(aplicarDificultad(caso, 'normal').preguntas[0].tiempo, 31)
assert.equal(aplicarDificultad(caso, 'dificil').preguntas[0].tiempo, 10)
// El reloj existente prioriza pregunta.tiempo. Verificación estática de los puntos de integración.
const mapa = leer('pages/map.vue')
assert(mapa.includes('aplicarDificultad({ ...nivel, preguntas }, dificultad)'))
assert(mapa.includes('nivelActual.value.dificultad)'))
assert(mapa.includes('prepararNivel(nivelSeleccionado.value, dificultadSeleccionada.value)'))
assert(leer('components/map/MisionFicha.vue').includes("emit('iniciar', dificultad)"))
assert(leer('composables/useCombatEngine.js').includes('pregunta.value.tiempo ?? nivel().tiempo'))
console.log(`OK: ${cantidad} versiones activas; Normal conserva tiempos, Difícil aplica 10 s; banco intacto e integración estática verificada.`)
