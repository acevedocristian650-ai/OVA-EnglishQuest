// Pruebas de la versión 3: identificadores permanentes, migración del progreso, selección y refuerzo, criterio de la
// evaluación final, evidencia auditiva y recursos originales. Uso: node scripts/pruebas-v3.mjs
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { crearBanco, bancoPreguntas } from '../composables/useBancoPreguntas.js'
import { crearProgreso, leerAlmacen, evaluarFinal, CLAVE, CLAVE_V2, VERSION } from '../composables/usePlayerProgress.js'
import { mezclarPregunta, bancoOrdenar, ordenFichas, normalizarFrase } from '../composables/useBarajar.js'

const leer = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'))
const niveles = leer('niveles.json'); const legado = leer('ids-legado.json').preguntas; const evaluacion = leer('evaluacion.json')
let fallos = 0
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) fallos++ }
const almacen = (o = {}) => { const d = { ...o }; return { d, getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v) } } }
const todas = niveles.flatMap((n) => n.preguntas.flatMap((b) => [b, ...(b.variantes ?? []), ...(b.legado ?? [])].map((q) => ({ q, nivel: n.numero, base: b }))))
const vivas = niveles.flatMap((n) => n.preguntas.flatMap((b) => [b, ...(b.variantes ?? [])].map((q) => ({ q, nivel: n.numero, base: b }))))

// ── 1 · Identificadores
const ids = todas.map((x) => x.q.id)
ok(ids.every((i) => /^n[1-5](-f[1-4])?-[a-z-]+(-\d)?\.L?\d{2}$/.test(i)), 'todas las preguntas y variantes (incluido el legado) tienen id con formato permanente')
ok(new Set(ids).size === ids.length, `los ${ids.length} ids son únicos`)
ok(bancoPreguntas.duplicados.length === 0, 'el banco indexado no detecta ids duplicados')
ok(vivas.every((x) => x.q.ronda === x.base.ronda && x.q.id.startsWith(x.base.ronda + '.')), 'cada variante declara su ronda y su id empieza por ella')
const porTexto = new Map(); for (const x of vivas) { const k = `${x.nivel}|${x.q.texto}`; porTexto.set(k, [...(porTexto.get(k) ?? []), x.q.id]) }
const repetidos = [...porTexto.values()].filter((l) => l.length > 1)
ok(repetidos.length > 0 && repetidos.every((l) => new Set(l).size === l.length), `${repetidos.length} enunciados repetidos entre variantes se distinguen por id (el criterio antiguo los confundía)`)
ok(legado.every((l) => bancoPreguntas.buscar(l.id)), `las ${legado.length} preguntas originales siguen recuperables por su id (en el banco vigente o en el legado)`)
ok(legado.length === 135 && new Set(legado.map((l) => l.id)).size === 135, 'la tabla de migración conserva las 135 preguntas originales')
// El id no cambia si se reordena el arreglo
const copia = structuredClone(niveles); copia[0].preguntas.reverse(); copia[2].preguntas[2].variantes.reverse()
const bancoReordenado = crearBanco(copia, legado)
ok(todas.filter((x) => x.nivel < 5).every((x) => bancoReordenado.buscar(x.q.id)?.texto === x.q.texto), 'reordenar los arreglos no cambia qué pregunta designa cada id')

// ── 2 · Calidad del banco (auditoría automatizada)
const vistoEnNiveles = new Set(vivas.filter((x) => x.nivel < 5).map((x) => normalizarFrase(x.q.texto + '|' + x.q.correcta)))
const finalRepetido = vivas.filter((x) => x.nivel === 5 && (vistoEnNiveles.has(normalizarFrase(x.q.texto + '|' + x.q.correcta)) || legado.some((l) => l.nivel < 5 && x.q.tipo !== 'esquiva-frase' && normalizarFrase(l.correcta) === normalizarFrase(x.q.correcta) && l.tipo === x.q.tipo)))
ok(finalRepetido.length === 0, 'ninguna variante de la evaluación final repite una pregunta de los niveles 1–4 (transferencia)')
ok(vivas.filter((x) => x.nivel === 5).every((x) => x.q.tema && x.q.fase), 'toda pregunta de la evaluación final declara tema y fase')
const incoherentes = vivas.filter(({ q }) => {
  // «Promise to X» debe llevar a una respuesta que contenga la acción X (no una acción distinta)
  const m = /^Promise to (\w+)/i.exec(q.contexto ?? q.texto ?? '')
  return q.tipo === 'proteger-aliado' || (q.tipo === 'ordenar' && /^Promise to/i.test(q.contexto ?? '')) ? m && !normalizarFrase(q.correcta).includes(m[1].toLowerCase()) && !/^Promise you will (\w+)/i.test(q.contexto) : false
})
ok(incoherentes.length === 0, 'las promesas piden la misma acción que contiene la respuesta correcta')
const promesa = vivas.filter(({ q }) => q.tipo === 'proteger-aliado').every(({ q }) => { const v = /will (\w+)/i.exec(q.contexto)?.[1]; return v && q.correcta.toLowerCase().includes(v) })
ok(promesa, 'proteger-aliado: el verbo prometido en el contexto aparece en la frase correcta')
ok(vivas.filter(({ q }) => q.porQue).every(({ q }) => Object.keys(q.porQue).every((k) => (q.opciones ?? q.zonas?.map((z) => z.texto) ?? []).includes(k) && k !== q.correcta)), 'cada explicación «porQue» corresponde a una opción incorrecta real')
ok(vivas.filter(({ q }) => ['cortar', 'escuchar', 'zona'].includes(q.tipo) && q.nivel !== 5).length > 0 && vivas.filter(({ q, nivel }) => nivel === 5 && ['cortar', 'escuchar', 'zona'].includes(q.tipo)).every(({ q }) => q.porQue && Object.keys(q.porQue).length === 2), 'toda opción incorrecta de la evaluación final explica su error')
const absurdos = vivas.filter(({ q }) => ['cortar', 'escuchar'].includes(q.tipo)).filter(({ q }) => q.opciones.some((o) => /^(go faster|park here|turn off the engine)$/i.test(o)))
ok(absurdos.length === 0, 'no quedan distractores absurdos conocidos (Go faster / Park here / Turn off the engine)')
ok(vivas.every(({ q }) => !('antes' in q) && !('despues' in q)), 'no quedan campos obsoletos antes/despues')

// ── 3 · Selección sin repetición y refuerzo
const B = bancoPreguntas
let sinRepetir = true; let recorre = true
for (const r of B.rondas.values()) {
  if (r.preguntas.length < 2) continue
  let vistas = []; const orden = []
  for (let i = 0; i < r.preguntas.length * 3; i++) { const q = B.elegirVariante(r.ronda, vistas); if (vistas.at(-1) === q.id) sinRepetir = false; vistas = [...vistas, q.id].slice(-8); orden.push(q.id) }
  if (new Set(orden.slice(0, r.preguntas.length)).size !== r.preguntas.length) recorre = false
}
ok(sinRepetir, 'la selección nunca repite la variante inmediatamente anterior')
ok(recorre, 'la selección recorre todas las variantes de una ronda antes de repetir')
let refuerzoOk = true
for (const r of B.rondas.values()) {
  if (r.tipo === 'hacha') continue
  for (const q of r.preguntas) {
    const item = { id: q.id, ronda: r.ronda, practicadas: [] }; const usadas = new Set()
    for (let i = 0; i < r.preguntas.length - 1; i++) { const s = B.elegirParaRefuerzo(item); if (s.pregunta.id === q.id || s.pregunta.ronda !== r.ronda) refuerzoOk = false; usadas.add(s.pregunta.id); item.practicadas.push(s.pregunta.id) }
    if (r.preguntas.length > 1 && usadas.size !== r.preguntas.length - 1) refuerzoOk = false
  }
}
ok(refuerzoOk, 'el refuerzo ofrece variantes distintas de la fallada, de la misma ronda, rotando por todas')
const l5 = niveles[4].preguntas[0].legado[0]
const sel = B.elegirParaRefuerzo({ id: l5.id, ronda: niveles[4].preguntas[0].ronda, practicadas: [] })
ok(sel && sel.pregunta.id.startsWith('n5-f1-cortar.') && !sel.pregunta.id.includes('.L'), 'una pregunta retirada del examen se refuerza con variantes vigentes de su ronda')
ok(B.buscar(l5.id)?.texto === l5.texto, 'una pregunta retirada sigue recuperable por id')

// ── 4 · Migración del progreso v2 → v3
const ambigua = legado.filter((l) => l.nivel === 2 && l.texto === 'Listen to the warning.')
ok(ambigua.length >= 4, 'hay variantes de escucha con enunciado idéntico en el banco original')
const v2 = (refuerzo) => JSON.stringify({ app: 'english-quest', version: 2, ajustes: { calidad: 'alta', introVista: true, tourVisto: true }, progreso: { desbloqueado: 4, niveles: { 1: { intentos: 3, victorias: 2, completado: true, estrellas: 3 }, 2: { intentos: 2, victorias: 1, completado: true, estrellas: 2 } }, refuerzo } })
const a = ambigua[1], b = ambigua[3]
const raw = { [`2|${a.texto}`]: { nivel: 2, indice: 5, tipo: 'escuchar', tema: 'Be going to', texto: a.texto, correcta: a.correcta, explicacion: 'x', fallos: 2, aciertosSeguidos: 1 } }
const alm = almacen({ [CLAVE_V2]: v2(raw) })
const m = leerAlmacen(alm)
ok(m.origen === 'migrado' && m.datos.progreso.desbloqueado === 4 && m.datos.progreso.niveles[1].estrellas === 3 && m.datos.progreso.niveles[2].completado, 'el avance, las estrellas y los desbloqueos de la v2 se conservan')
ok(m.datos.ajustes.calidad === 'alta', 'los ajustes (perfil gráfico) de la v2 se conservan')
ok(m.datos.progreso.refuerzo[a.id]?.id === a.id && Object.keys(m.datos.progreso.refuerzo).length === 1, 'un error antiguo se migra a la variante EXACTA (mismo texto en varias variantes, distinto id)')
ok(m.datos.progreso.refuerzo[a.id].fallos === 2 && m.datos.progreso.refuerzo[a.id].aciertosSeguidos === 1 && a.id !== b.id, 'la migración conserva fallos y aciertos seguidos')
const p = crearProgreso(alm); p.cargar(); p.guardarYa()
ok(JSON.parse(alm.d[CLAVE]).version === VERSION && alm.d[CLAVE_V2] === v2(raw), 'se guarda como v3 y la copia v2 original queda intacta')
const libre = leerAlmacen(almacen({ [CLAVE_V2]: v2({ 'x|y': { nivel: 4, indice: 2, tipo: 'cortar', texto: 'Texto que ya no existe', correcta: 'z', fallos: 1 } }) }))
ok(Object.values(libre.datos.progreso.refuerzo)[0]?.id === 'n4-cortar.01' && Object.values(libre.datos.progreso.refuerzo)[0].migradaAprox === true, 'si el enunciado antiguo ya no existe se conserva por la posición de la ronda (aproximada)')
const viejoL5 = leerAlmacen(almacen({ [CLAVE_V2]: v2({ 'k': { nivel: 5, indice: 3, tipo: 'errores', texto: legado.find((l) => l.nivel === 5 && l.tipo === 'errores').texto, correcta: legado.find((l) => l.nivel === 5 && l.tipo === 'errores').correcta, fallos: 1 } }) }))
ok(Object.keys(viejoL5.datos.progreso.refuerzo)[0].includes('.L'), 'un fallo del examen antiguo conserva su id del legado')
ok(leerAlmacen(almacen({ [CLAVE_V2]: '{no es json' })).origen === 'nuevo', 'una copia v2 dañada no rompe el arranque')

// ── 5 · Criterio de la evaluación final
const h = (tema, fase, acierto, extra = {}) => ({ tipo: 'cortar', tema, fase, acierto, agotado: false, ...extra })
const TEMAS = [['Introducción al futuro', 1], ['Be going to', 2], ['Will', 3], ['Traffic signs and rules', 4]]
const examen = (plan) => TEMAS.flatMap(([t, f], i) => plan[i].map((r) => h(t, f, r !== 'x' && r !== 't', { ayuda: r === 'a' ? 'transcripcion' : '', agotado: r === 't' })))
const crit = { aprobacion: evaluacion.aprobacion, minimoPorTema: evaluacion.minimoPorTema, pesoAyuda: evaluacion.pesoAyuda, totalRondas: 12 }
ok(evaluacion.aprobacion < 2 / 3 + 0.01 && evaluacion.aprobacion >= 0.66, 'el umbral por temática equivale a 2 de 3 desafíos (ya no exige 100 % encubierto)')
ok(evaluarFinal(examen([['s', 's', 'x'], ['s', 's', 'x'], ['s', 's', 'x'], ['s', 's', 'x']]), crit).aprobada, 'dos de tres aciertos independientes en cada temática (66,7 %) aprueban')
ok(!evaluarFinal(examen([['s', 'x', 'x'], ['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's']]), crit).aprobada, 'una temática con solo 1 de 3 no se aprueba aunque el resto sea perfecto')
ok(evaluarFinal(examen([['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's']]), crit).porTema.every((g) => g.estado === 'dominado'), 'tres de tres sin ayuda se muestra como «dominado»')
ok(!evaluarFinal(examen([['a', 'a', 'a'], ['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's']]), crit).aprobada, 'tres aciertos TODOS con ayuda (1,5 puntos) no demuestran dominio')
ok(evaluarFinal(examen([['s', 's', 'a'], ['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's']]), crit).aprobada, 'dos aciertos independientes + uno con ayuda aprueban')
ok(!evaluarFinal(examen([['s', 'a', 'x'], ['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's']]), crit).aprobada, 'un acierto independiente + uno con ayuda (1,5) no aprueba la temática')
const ft = evaluarFinal(examen([['s', 'x', 't'], ['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's']]), crit)
ok(ft.global.falladas === 1 && ft.global.sinResponder === 1, 'se distinguen respuestas falladas y desafíos sin responder (tiempo agotado)')
ok(!evaluarFinal(examen([['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's'], ['s', 's', 's']]).slice(0, 8), crit).aprobada, 'una evaluación incompleta no se aprueba')
// Resultado de combate ≠ aprendizaje: ganar el combate sin demostrar inglés no aprueba la prueba
const prog = crearProgreso(null)
const fallido = examen([['x', 'x', 's'], ['x', 'x', 's'], ['x', 'x', 's'], ['x', 'x', 's']]).map((x, i) => ({ ...x, texto: `t${i}`, correcta: 'c', explicacion: '', indice: i, id: `n5-f${x.fase}-cortar.0${(i % 3) + 1}`, ronda: `n5-f${x.fase}-cortar` }))
const inf = prog.registrarPartida({ nivel: 5, tema: 'Evaluación integradora', resultado: 'victoria', historial: fallido, vidaCaballero: 90, totalRondas: 12, ...crit })
ok(inf.resultado === 'victoria' && inf.final.aprobada === false && inf.final.aprendizaje !== 'demostrado' && prog.estado.progreso.niveles[5].aprobada === false, 'victoria de combate y aprendizaje demostrado se calculan por separado')
ok(prog.estado.progreso.niveles[5].ultimoFinal?.porTema.length === 4, 'se guarda el detalle por temática del último intento completo')

// ── 6 · Evidencia auditiva
const pe = crearProgreso(null)
pe.registrarPartida({ nivel: 2, tema: 'Be going to', resultado: 'victoria', totalRondas: 6, vidaCaballero: 80, historial: [
  { tipo: 'escuchar', tema: 'Be going to', acierto: true, ayuda: 'sin-voz', texto: 'a', correcta: 'a', id: 'n2-escuchar.01', ronda: 'n2-escuchar' },
  { tipo: 'escuchar', tema: 'Be going to', acierto: true, ayuda: '', texto: 'b', correcta: 'b', id: 'n2-escuchar.02', ronda: 'n2-escuchar' }] })
const tp = pe.estado.progreso.tipos
ok(tp['escuchar-lectura']?.correctas === 1 && tp.escuchar?.correctas === 1, 'escuchar con transcripción o sin voz se registra como lectura, no como comprensión auditiva')
const pr = crearProgreso(null)
pr.estado.progreso.refuerzo['n2-escuchar.01'] = { id: 'n2-escuchar.01', ronda: 'n2-escuchar', nivel: 2, tipo: 'escuchar', texto: 'x', correcta: 'y', fallos: 1, aciertosSeguidos: 0, practicadas: [] }
pr.registrarRefuerzo('n2-escuchar.01', true, 'n2-escuchar.02', true); pr.registrarRefuerzo('n2-escuchar.01', true, 'n2-escuchar.03', true)
ok(pr.estado.progreso.refuerzo['n2-escuchar.01']?.aciertosSeguidos === 0, 'en el refuerzo, acertar con transcripción no cuenta como evidencia para superar la actividad')
pr.registrarRefuerzo('n2-escuchar.01', true, 'n2-escuchar.02'); const sup = pr.registrarRefuerzo('n2-escuchar.01', true, 'n2-escuchar.03')
ok(sup && !pr.estado.progreso.refuerzo['n2-escuchar.01'] && pr.estado.progreso.corregidas === 1, 'dos aciertos independientes seguidos superan la actividad y cuentan como respuesta corregida')
// Éxito en otra variante de la misma ronda también es evidencia
const pv = crearProgreso(null)
pv.estado.progreso.refuerzo['n3-cortar.01'] = { id: 'n3-cortar.01', ronda: 'n3-cortar', nivel: 3, tipo: 'cortar', texto: 'x', correcta: 'y', fallos: 1, aciertosSeguidos: 1, practicadas: [] }
pv.registrarPartida({ nivel: 3, tema: 'Will', resultado: 'victoria', totalRondas: 6, vidaCaballero: 80, historial: [{ tipo: 'cortar', tema: 'Will', acierto: true, texto: 'z', correcta: 'z', id: 'n3-cortar.03', ronda: 'n3-cortar' }] })
ok(!pv.estado.progreso.refuerzo['n3-cortar.01'], 'acertar otra variante de la misma ronda en combate también supera el refuerzo pendiente')
ok(JSON.stringify(pv.estado.progreso.vistas['n3-cortar']) === '["n3-cortar.03"]', 'el historial de variantes vistas se guarda por ronda')

// ── 7 · Barajado en todas las modalidades (incluido refuerzo)
const campos = { cortar: 'opciones', escuchar: 'opciones', zona: 'zonas', 'esquiva-frase': 'fichas', 'proteger-aliado': 'nodos' }
let posicionesOk = true
for (const { q } of vivas.filter((x) => campos[x.q.tipo])) {
  const campo = campos[q.tipo]; const pos = new Set()
  for (let i = 0; i < 600; i++) { const mz = mezclarPregunta(q); const clave = campo === 'zonas' ? (z) => z.texto : (z) => z; pos.add(mz[campo].map(clave).indexOf(q.tipo === 'proteger-aliado' ? q.nodos[0] : q.tipo === 'zona' ? q.correcta : q.correcta)) }
  if (pos.size < Math.min(3, q[campo].length)) posicionesOk = false
}
ok(posicionesOk, 'la respuesta correcta puede aparecer en todas las posiciones (cortar, escuchar, zona, esquiva-frase, nodos)')
let nunca = true
for (const { q } of vivas.filter((x) => x.q.tipo === 'ordenar')) for (let i = 0; i < 100; i++) if (normalizarFrase(bancoOrdenar(q).filter((p) => !p.sobra).map((p) => p.texto).join(' ')) === normalizarFrase(q.correcta)) nunca = false
for (const { q } of vivas.filter((x) => x.q.tipo === 'romper-hechizo')) { const w = q.correcta.replace(/[.!?]$/, '').split(' '); for (let i = 0; i < 100; i++) if (ordenFichas(w, q.correcta).map((k) => w[k]).join(' ') === w.join(' ')) nunca = false }
ok(nunca, 'ninguna oración (ordenar, romper-hechizo, refuerzo) comienza resuelta')

// ── 8 · Recursos originales intactos
try {
  const sucio = execSync('git status --porcelain -- public', { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' }).trim()
  ok(sucio === '', 'los recursos de public/ (imágenes, audio, SVG) no tienen ninguna modificación respecto al repositorio original')
} catch { console.log('OMITIDA comprobación de public/: no hay repositorio git disponible') }

console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo correcto (v3)')
process.exit(fallos ? 1 : 0)
