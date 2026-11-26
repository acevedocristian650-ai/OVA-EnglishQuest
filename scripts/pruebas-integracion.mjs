import assert from 'node:assert/strict'
import { bancoPreguntas, limitarVistas } from '../composables/useBancoPreguntas.js'
import { evaluarFinal, esAyudaDeLectura } from '../lib/criterioEducativo.js'
import { readFileSync } from 'node:fs'
const leer = f => JSON.parse(readFileSync(new URL('../data/'+f,import.meta.url),'utf8'))
const niveles=leer('niveles.json'), legado=leer('ids-legado.json').preguntas, criterio=leer('evaluacion.json')
const activas=niveles.flatMap(n=>n.preguntas.flatMap(b=>[b,...(b.variantes??[])]))
const todas=niveles.flatMap(n=>n.preguntas.flatMap(b=>[b,...(b.variantes??[]),...(b.legado??[])]))
assert(todas.every(q=>q.id&&q.ronda)); assert.equal(new Set(todas.map(q=>q.id)).size,todas.length)
assert(legado.every(q=>bancoPreguntas.buscar(q.id))); assert.equal(bancoPreguntas.duplicados.length,0)
for(const ronda of bancoPreguntas.rondas.values()) {let vistas=[];for(let i=0;i<ronda.preguntas.length;i++){const q=bancoPreguntas.elegirVariante(ronda.ronda,vistas);assert(!vistas.includes(q.id));vistas=limitarVistas(vistas,q.id)}}
const examen = Array.from({length:12},(_,i)=>({tema:'Tema '+Math.floor(i/3),fase:Math.floor(i/3)+1,acierto:i%3!==2}))
assert(evaluarFinal(examen,criterio).aprobada)
assert(!evaluarFinal(examen.slice(0,11),criterio).aprobada)
assert(!evaluarFinal(examen.map((h,i)=>i<3?{...h,pistaUsada:true}:h),criterio).aprobada)
for(const marca of [{ayuda:'pista'},{sinAudio:true},{corregida:true},{ayuda:'transcripcion'}]){const h=examen.map((r,i)=>i===0?{...r,...marca}:r);assert.equal(evaluarFinal(h,criterio).porTema[0].conAyuda,1);assert(!evaluarFinal(h,criterio).aprobada)}
assert(esAyudaDeLectura({tipo:'escuchar',ayuda:'sin-voz'}));assert(!esAyudaDeLectura({tipo:'escuchar',ayuda:'pista'}))
console.log(`OK: ${activas.length} versiones activas; ${todas.length} IDs únicos incluyendo legado; ${legado.length} registros migrables; rotación completa; aprobación, ayudas y evaluación incompleta verificadas.`)
