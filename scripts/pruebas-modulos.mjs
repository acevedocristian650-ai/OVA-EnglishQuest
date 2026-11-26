// Pruebas de los módulos reales del juego (sin copias): motor de combate, progreso y almacenamiento, gestor de
// imágenes, perfiles gráficos y detección de fluidez. Uso: node scripts/pruebas-modulos.mjs
import { fileURLToPath } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'
import { nextTick } from 'vue'
import { useCombatEngine, ATAQUES } from '../composables/useCombatEngine.js'
import { crearProgreso, leerAlmacen, guardarAlmacen, validarDatos, migrarClavesAntiguas, datosIniciales, CLAVE, rangoDe, RANGOS, xpDe } from '../composables/usePlayerProgress.js'
import { resolverImagen, variantesDisponibles, crearGestorImagenes, recursosEsenciales, fondoNivel, medidasDe, PRESUPUESTO, PRIORIDAD, PERFILES } from '../composables/useAssetManager.js'
import { crearRelojCombate } from '../composables/useCombatClock.js'
import { resumirVentana, crearDetector, perfilInferior } from '../composables/useFramePacing.js'

const niveles = JSON.parse(readFileSync(new URL('../data/niveles.json', import.meta.url), 'utf8'))
const manifiesto = JSON.parse(readFileSync(new URL('../data/variantes-imagenes.json', import.meta.url), 'utf8'))
let fallos = 0
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) fallos++ }

// ── reloj falso
let timers = [], now = 0, idT = 0, oculto = false
const tm = (fn, ms) => { const id = ++idT; timers.push({ id, at: now + ms, fn, ms }); return id }
const ctm = (id) => { timers = timers.filter((t) => t.id !== id) }
const avanzar = (ms) => { const meta = now + ms; for (;;) { const d = timers.filter((t) => t.at <= meta).sort((a, b) => a.at - b.at)[0]; if (!d) break; now = d.at; ctm(d.id); d.fn() } now = meta }
let intervalo = null
const motor = (nivel, extra = {}) => {
  const eventos = [], sonidos = [], terminados = []
  const j = useCombatEngine({ nivel, emit: (e) => eventos.push(e), sonar: (c, k) => sonidos.push(`${c}:${k}`), alTerminar: (r) => terminados.push(r),
    ajustes: extra.ajustes, entorno: { ahora: () => now, setTimeout: tm, clearTimeout: ctm, setInterval: (fn) => { intervalo = fn; return 1 }, clearInterval: () => { intervalo = null }, oculto: () => oculto } })
  j.iniciar()
  return { j, eventos, sonidos, terminados }
}
const n1 = niveles[0]

// ── Motor: daño una sola vez, vigilancia, temporizadores, pausa, práctica
{
  const { j } = motor(n1)
  j.responder(n1.preguntas[0].correcta)
  const a = j.ataques[0]
  j.atacar(a)
  const antes = j.vidaRival.value
  j.impactar(); j.impactar(); j.impactar()
  ok(antes - j.vidaRival.value === Math.min(j.fuerza(a), antes), 'el daño se aplica exactamente una vez aunque impactar() se repita')
  ok(j.estadisticas.golpesAplicados === 1, 'el contador de golpes aplicados es 1')
}
{
  timers = []
  const { j } = motor(n1)
  j.responder(n1.preguntas[0].correcta)
  const esperado = Math.min(j.danoDisponible(), j.fuerza(j.ataques[1]))
  j.atacar(j.ataques[1])
  const v = j.vidaRival.value
  avanzar(5000) // la escena nunca avisa (animación interrumpida o desactivada)
  ok(v - j.vidaRival.value === esperado && j.fase.value === 'aviso-contra', 'sin eventos de la escena, la vigilancia aplica el golpe una vez y avanza al contraataque')
  j.destruir()
  ok(timers.length === 0, 'destruir() limpia todos los temporizadores del combate (' + timers.length + ' pendientes)')
}
{
  timers = []
  const { j } = motor(n1)
  j.pausar()
  const r0 = j.tiempoRestante.value
  oculto = false; intervalo(); now += 1000; intervalo()
  ok(j.tiempoRestante.value === r0, 'con el desafío en pausa el reloj no avanza')
  j.reanudar(); for (let i = 0; i < 20; i++) { now += 100; intervalo() }
  ok(Math.abs(j.tiempoRestante.value - (r0 - 2)) < 0.01, 'tras reanudar el reloj cuenta tiempo real (2 s)')
  oculto = true; now += 5000; intervalo(); oculto = false
  ok(Math.abs(j.tiempoRestante.value - (r0 - 2)) < 0.01, 'con la pestaña oculta el tiempo no corre y la actividad no termina')
  j.destruir()
}
{
  timers = []
  const { j } = motor(n1, { ajustes: { tiempoExtra: () => 2, practica: () => true } })
  ok(j.tiempoTotal.value === 52, 'tiempo ampliado ×2: la actividad de 26 s pasa a 52 s')
  now += 500000; intervalo()
  ok(j.fase.value === 'pregunta' && j.tiempoRestante.value === 52, 'modo de práctica: sin límite de tiempo, el reloj no agota')
  j.destruir()
}
// bloqueo y contraataque: ventanas de tiempo
{
  timers = []
  const { j } = motor(n1)
  j.responder(n1.preguntas[0].correcta); j.atacar(j.ataques[0]); j.impactar(); j.terminarAtaque()
  ok(j.fase.value === 'aviso-contra', 'tras un golpe acertado empieza la ventana del contraataque')
  avanzar(700 + 1404 - 100)
  j.parar()
  ok(j.bloqueo.value === 'perfecto', 'parada a 100 ms del impacto = perfecta')
  j.impactar()
  ok(j.vidaCaballero.value === 100 && j.estadisticas.paradasPerfectas === 1, 'la parada perfecta no hace daño y se registra')
}
// curación y furia
{
  timers = []
  const { j } = motor(n1)
  j.vidaCaballero.value = 60
  j.responder(n1.preguntas[0].correcta)
  const fenix = ATAQUES.find((x) => x.id === 'fenix')
  j.atacar(fenix); j.impactar()
  ok(j.vidaCaballero.value === 72, 'la Llama del Fénix cura 12')
  j.terminarAtaque(); j.parar(); avanzar(5000)
  ok(j.furia.value === 1, 'acertar suma una carga de furia')
}
// remates (transformaciones): duración y finalización
for (const [i, remate, ms] of [[1, 'cruzado', 5600], [2, 'solar', 14000], [3, 'sombras', 5600]]) {
  timers = []
  const { j, terminados } = motor(niveles[i])
  j.vidaRival.value = 5
  j.indice.value = niveles[i].preguntas.length - 1
  j.fase.value = 'elegir'
  j.atacar(j.ataques[0])
  ok(j.ataque.value.final && j.ataque.value.remate === remate && j.ataque.value.duracion === ms, `remate «${remate}» dura ${ms} ms`)
  j.impactar(); j.terminarAtaque()
  ok(j.vidaRival.value === 0 && j.fase.value === 'resultado', `remate «${remate}»: el guardián cae y el combate termina`)
  await nextTick()
  ok(terminados.length === 1 && terminados[0].resultado === 'victoria', `remate «${remate}»: el resultado se entrega una sola vez (victoria)`)
}
// derrota
{
  timers = []
  const { j, terminados } = motor(n1)
  j.vidaCaballero.value = 10
  j.responder('mal')
  j.impactar(); j.terminarAtaque()
  await nextTick()
  ok(j.vidaCaballero.value === 0 && j.fase.value === 'resultado' && terminados[0]?.resultado === 'derrota', 'sin vida: derrota registrada una vez')
  ok(terminados[0].historial[0].tipo === 'clasificar' && terminados[0].historial[0].acierto === false && 'segundos' in terminados[0].historial[0], 'el historial guarda tipo, acierto y tiempo de la ronda')
}
// contadores de combate (hacha, esquiva)
{
  timers = []
  const { j } = motor(niveles[1])
  j.indice.value = 1 // esquivar
  j.fase.value = 'pregunta'
  j.esquivar(niveles[1].preguntas[1].lado === 'izquierda' ? 'derecha' : 'izquierda')
  ok(j.estadisticas.esquivasLogradas === 1, 'esquivar al lado correcto se cuenta como esquiva lograda')
  const h = motor(n1)
  h.j.indice.value = 3
  h.j.cortarAtaque()
  ok(h.j.estadisticas.proyectilesCortados === 3, 'cortar el hacha cuenta 3 proyectiles (habilidad motriz, no inglés)')
}

// ── Banco de preguntas y variantes: cada variante conserva el tipo y la corrección
{
  const falta = niveles.flatMap((n) => n.preguntas.flatMap((q) => [q, ...(q.variantes ?? [])])).filter((q) => !q.correcta || !q.explicacion)
  ok(falta.length === 0, 'todas las preguntas y variantes tienen respuesta y explicación')
}

// ── Almacenamiento y progreso
const memoriaAlmacen = (inicial = {}, { falla } = {}) => {
  const d = { ...inicial }
  return { d, getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { if (falla) throw Object.assign(new Error('x'), { name: falla }); d[k] = String(v) } }
}
{
  const s = memoriaAlmacen({ 'english-quest-graphics-v1': JSON.stringify({ quality: 'lite', introSeen: true }), 'english-quest-unlocked-level': '3' })
  const r = leerAlmacen(s)
  ok(r.origen === 'migrado' && r.datos.ajustes.calidad === 'lite' && r.datos.ajustes.introVista && r.datos.progreso.desbloqueado === 3 && r.datos.progreso.niveles[1].completado && r.datos.progreso.niveles[2].completado, 'migración desde las claves antiguas (calidad, intro, nivel desbloqueado)')
  ok('english-quest-unlocked-level' in s.d, 'las claves antiguas no se borran al migrar')
}
{
  const r = leerAlmacen(memoriaAlmacen({ [CLAVE]: '{esto no es json' }))
  ok(r.origen === 'recuperado' && r.datos.progreso.desbloqueado === 1, 'datos corruptos: se recupera con valores limpios')
  const raros = validarDatos({ app: 'english-quest', version: 2, ajustes: { calidad: 'ultra', volumen: { musica: 9, efectos: -2 }, textoEscala: 7 }, progreso: { desbloqueado: 99, niveles: { 9: {}, 1: { estrellas: 77, mejorPrecision: 3 } } } }).datos
  ok(raros.ajustes.calidad === 'lite' && raros.ajustes.volumen.musica === 1 && raros.ajustes.volumen.efectos === 0 && raros.ajustes.textoEscala === 1 && raros.progreso.desbloqueado === 6 && !raros.progreso.niveles[9] && raros.progreso.niveles[1].estrellas === 3 && raros.progreso.niveles[1].mejorPrecision === 1, 'validación: valores fuera de rango o desconocidos se corrigen')
  ok(leerAlmacen(memoriaAlmacen({ [CLAVE]: JSON.stringify({ app: 'english-quest', version: 99 }) })).origen === 'recuperado', 'una versión futura desconocida no se interpreta')
}
{
  ok(guardarAlmacen(memoriaAlmacen({}, { falla: 'QuotaExceededError' }), datosIniciales()) === 'lleno', 'almacenamiento lleno detectado')
  ok(guardarAlmacen(memoriaAlmacen({}, { falla: 'SecurityError' }), datosIniciales()) === 'bloqueado', 'almacenamiento bloqueado detectado')
  const p = crearProgreso(null)
  p.cargar(); p.ajustar({ calidad: 'lite' })
  ok(p.estado.almacenamiento === 'memoria' && p.estado.ajustes.calidad === 'lite', 'sin almacenamiento el juego sigue funcionando durante la sesión')
}
const partida = (extra = {}) => ({ nivel: 1, tema: 'Introducción al futuro', resultado: 'victoria', vidaCaballero: 80, segundos: 120, totalRondas: 6, combate: { proyectilesCortados: 3, esquivasLogradas: 0, danoRecibido: 20 },
  historial: [
    { tipo: 'clasificar', texto: 'A', correcta: 'a', explicacion: 'e', acierto: true, segundos: 5, indice: 0 },
    { tipo: 'errores', texto: 'B', correcta: 'b', explicacion: 'e', acierto: false, segundos: 6, indice: 1 },
    { tipo: 'cortar', texto: 'C', correcta: 'c', explicacion: 'e', acierto: true, segundos: 4, indice: 2 },
    { tipo: 'hacha', texto: 'D', correcta: 'd', explicacion: 'e', acierto: true, segundos: 9, indice: 3 },
    { tipo: 'parejas', texto: 'E', correcta: 'e', explicacion: 'e', acierto: true, segundos: 9, indice: 4 },
    { tipo: 'ordenar', texto: 'F', correcta: 'f', explicacion: 'e', acierto: true, segundos: 9, indice: 5 }], ...extra })
{
  const s = memoriaAlmacen()
  const p = crearProgreso(s); p.cargar()
  const i = p.registrarPartida(partida())
  ok(i.totalLinguistico === 5 && i.aciertos === 4, 'el hacha (habilidad motriz) no cuenta como evidencia lingüística (4 de 5)')
  ok(i.recompensas.estrellas === 2 && p.estado.progreso.desbloqueado === 2 && p.estado.progreso.niveles[1].victorias === 1, 'victoria: 2 estrellas (80 % de precisión) y siguiente nivel desbloqueado')
  const xp1 = p.xp.value
  const i2 = p.registrarPartida(partida())
  ok(p.xp.value === xp1 && i2.recompensas.xp === 0, 'repetir el mismo resultado no suma experiencia (sin recompensas por repetición)')
  ok(Object.keys(p.estado.progreso.refuerzo).length === 1 && p.estado.progreso.temas['Introducción al futuro'].correctas === 8, 'la pregunta fallada queda en refuerzo y la precisión se acumula por temática')
  const clave = Object.keys(p.estado.progreso.refuerzo)[0]
  const xp = p.xp.value, intentos = p.estado.progreso.niveles[1].intentos
  p.registrarRefuerzo(clave, true); const sup = p.registrarRefuerzo(clave, true)
  ok(sup && !Object.keys(p.estado.progreso.refuerzo).length && p.xp.value === xp && p.estado.progreso.niveles[1].intentos === intentos, 'el refuerzo se supera con 2 aciertos y no altera XP, intentos ni derrotas')
  const mejor = p.registrarPartida(partida({ historial: partida().historial.map((h) => ({ ...h, acierto: true })), vidaCaballero: 90 }))
  ok(mejor.recompensas.xp > 0 && mejor.recompensas.estrellas === 3, 'superar el mejor resultado sí da recompensa (3 estrellas)')
  const exp = p.exportar()
  const q = crearProgreso(memoriaAlmacen()); q.cargar()
  ok(q.importar(exp).ok && q.xp.value === p.xp.value, 'exportar → importar conserva el progreso')
  ok(!q.importar('{"x":1}').ok && !q.importar('no json').ok && !q.importar(JSON.stringify({ app: 'english-quest', version: 99 })).ok, 'importar rechaza archivos inválidos o de versión futura')
  q.reiniciar()
  ok(q.xp.value === 0 && q.estado.progreso.desbloqueado === 1, 'reiniciar deja el progreso en cero')
  p.guardarYa()
  ok(JSON.parse(s.d[CLAVE]).version === 2, 'se guarda con formato versionado (v2)')
  const d = crearProgreso(memoriaAlmacen()); d.cargar()
  d.registrarPartida(partida({ resultado: 'derrota', vidaCaballero: 0 }))
  ok(d.estado.progreso.niveles[1].derrotas === 1 && d.estado.progreso.desbloqueado === 1 && !d.estado.progreso.niveles[1].completado, 'derrota: se cuenta, no desbloquea ni da estrellas')
  ok(rangoDe(0).id === 'aprendiz' && rangoDe(RANGOS[3].min).id === 'capitan' && rangoDe(9999).siguiente === null, 'rangos medievales por experiencia')
}

// ── Imágenes por perfil
{
  ok(resolverImagen('/images/personajes-mate/caballero/reposo.png', 'alta').endsWith('reposo.png'), 'Alta conserva el PNG original')
  ok(resolverImagen('/images/personajes-mate/caballero/reposo.png', 'lite').endsWith('reposo-lite.webp'), 'Lite usa la variante reducida')
  ok(resolverImagen('/images/personajes-mate/caballero/guardia.webp', 'lite').endsWith('guardia-lite.webp'), 'un WebP original (sin PNG) también obtiene su variante Lite')
  ok(resolverImagen('/images/personajes-mate/caballero/guardia.webp', 'alta').endsWith('guardia.webp'), 'un WebP original conserva su calidad en Alta')
  ok(resolverImagen('/images/signs/stop.svg', 'lite') === '/images/signs/stop.svg' && resolverImagen('/images/no-existe.png', 'lite') === '/images/no-existe.png', 'SVG y rutas fuera del manifiesto no se transforman')
  ok(variantesDisponibles('/images/personajes-mate/caballero/reposo.png').join() === 'alta,lite', 'se listan las variantes disponibles')
  const raiz = fileURLToPath(new URL('../public', import.meta.url))
  let inexistentes = 0
  for (const perfil of ['alta', 'lite']) for (const n of niveles) for (const r of recursosEsenciales(n, perfil)) {
    const u = resolverImagen(r, perfil)
    if (!existsSync(raiz + u)) { inexistentes++; console.log('   falta', perfil, u) }
  }
  ok(inexistentes === 0, 'los recursos esenciales de todos los niveles existen en los 2 perfiles (sin solicitudes 404)')
  ok(fondoNivel(n1, 'lite').includes('/arenas/static/') && fondoNivel(n1, 'alta') === n1.fondo, 'Lite usa fondo estático; Alta, el animado')
  const peso = (perfil) => niveles.flatMap((n) => recursosEsenciales(n, perfil)).reduce((s, r) => s + (medidasDe(resolverImagen(r, perfil))?.bytes ?? 0), 0)
  ok(peso('lite') < peso('alta'), `peso de esenciales: alta ${(peso('alta') / 1e6).toFixed(2)} MB > lite ${(peso('lite') / 1e6).toFixed(2)} MB`)
  ok(!Object.values(manifiesto).some((e) => 'equilibrada' in e) && PERFILES.join() === 'alta,lite', 'el manifiesto y el gestor solo conocen Alta y Lite')
  // proporciones y transparencia entre variantes
  let mal = 0
  for (const e of Object.values(manifiesto)) { const [, w0, h0, , a0] = e.alta; for (const v of Object.values(e)) if (Math.abs(v[1] / v[2] - w0 / h0) / (w0 / h0) > 0.015 || v[4] !== a0) mal++ }
  ok(mal === 0, 'todas las variantes conservan proporción y transparencia')
}
// gestor de imágenes: dedupe, fallo con reintento, liberación por ámbito, presupuesto
{
  let creadas = 0, fallar = new Set()
  const crear = () => { creadas++; const im = { decode: async () => {}, set src(v) { this._s = v; if (v) setTimeout(() => (fallar.has(v) ? im.onerror() : im.onload()), 1) }, get src() { return this._s } }; return im }
  const g = crearGestorImagenes({ crearImagen: crear, perfil: () => 'lite' })
  const u = '/images/personajes-mate/caballero/reposo.png'
  await Promise.all([g.preparar([u, u], { ambito: 'nivel-1' }), g.preparar([u], { ambito: 'nivel-1' })])
  ok(creadas === 1 && g.instantanea().entradas === 1, 'solicitudes duplicadas comparten una sola descarga y una sola entrada de caché')
  await g.preparar([u], { ambito: 'nivel-1' })
  ok(creadas === 1, 'una imagen ya decodificada no se vuelve a descargar')
  g.liberarAmbito('nivel-1')
  ok(g.instantanea().entradas === 0 && g.instantanea().liberadas === 1, 'al cerrar el ámbito se sueltan las referencias que nadie necesita')
  const lite = resolverImagen(u, 'lite')
  fallar.add(lite)
  const r = await g.preparar([u], { ambito: 'nivel-2' })
  ok(r.failed === 0 && g.listo(u), 'si falla la variante del perfil se usa la siguiente de la cadena')
  g.liberarTodoExcepto()
  const g2 = crearGestorImagenes({ crearImagen: crear, perfil: () => 'lite' })
  fallar = new Set(['/images/no-existe.png'])
  const rf2 = await g2.preparar(['/images/no-existe.png'], { ambito: 'x' })
  ok(rf2.failed === 1 && g2.instantanea().entradas === 0, 'un fallo se informa y no queda guardado (el reintento vuelve a pedir)')
  // presupuesto de memoria: lo no fijado se expulsa primero
  const g3 = crearGestorImagenes({ crearImagen: crear, perfil: () => 'lite', memoriaPorDefecto: 10 * 1048576 })
  const lista = Array.from({ length: 4 }, (_, i) => `/images/x/${i}.png`)
  for (const [i, x] of lista.entries()) await g3.preparar([x], { ambito: i === 0 ? 'nivel-1' : undefined })
  ok(g3.instantanea().memoriaTeorica <= PRESUPUESTO.lite && g3.listo(lista[0]), 'el presupuesto de memoria de Lite se respeta y lo fijado al nivel actual se conserva')
}

// memoria por prioridades: pertenecer al nivel actual NO basta para quedarse; los obsoletos y de baja prioridad salen primero
{
  const crear = () => { const im = { decode: async () => {}, set src(v) { this._s = v; if (v) setTimeout(() => im.onload(), 1) }, get src() { return this._s } }; return im }
  const g = crearGestorImagenes({ crearImagen: crear, perfil: () => 'lite', memoriaPorDefecto: 8 * 1048576 })
  const x = (i) => `/images/x/${i}.png`
  await g.preparar([x(0)], { ambito: 'nivel-1', prioridad: PRIORIDAD.ESENCIAL })
  await g.preparar([x(1), x(2)], { ambito: 'nivel-1', prioridad: PRIORIDAD.SECUNDARIA })
  await g.preparar([x(3)], { ambito: 'nivel-1', prioridad: PRIORIDAD.BAJA })
  g.marcarVisible(g.resolver(x(0)))
  ok(!g.listo(x(3)) && g.instantanea().omitidas === 1, 'un recurso de baja prioridad no desaloja a uno de mayor prioridad: se omite')
  await g.preparar([x(4)], { ambito: 'nivel-1', prioridad: PRIORIDAD.ESENCIAL })
  const antes = g.instantanea()
  ok(antes.memoriaTeorica <= PRESUPUESTO.lite, 'todo del mismo nivel: aun así se respeta el presupuesto de Lite (se expulsa por prioridad)')
  ok(g.listo(x(0)) && g.listo(x(4)) && antes.liberadas >= 1, 'se conservan lo visible/esencial y se expulsan primero los secundarios')
  const g2 = crearGestorImagenes({ crearImagen: crear, perfil: () => 'lite', memoriaPorDefecto: 20 * 1048576 })
  await g2.preparar([x(0), x(1)], { ambito: 'nivel-1', prioridad: PRIORIDAD.ESENCIAL })
  ok(g2.listo(x(0)) && g2.listo(x(1)) && g2.instantanea().excesos >= 1, 'los esenciales nunca se expulsan: el exceso se registra en el diagnóstico')
  const r = await g2.preparar([{ src: x(5), prioridad: PRIORIDAD.SECUNDARIA }], { ambito: 'nivel-1' })
  ok(!g2.listo(x(5)) && g2.instantanea().omitidas === 1 && r.failed === 0, 'un recurso secundario que no cabe no se pide (evita ciclos de descarga y expulsión)')
}
// invalidación: un resultado que llega tras abandonar la batalla no se retiene
{
  const crear = () => { const im = { decode: async () => {}, set src(v) { this._s = v; if (v) setTimeout(() => im.onload && im.onload(), 20) }, get src() { return this._s } }; return im }
  const g = crearGestorImagenes({ crearImagen: crear, perfil: () => 'lite' })
  const u = '/images/personajes-mate/caballero/reposo.png'
  const enCurso = g.preparar([u], { ambito: 'nivel-3' })
  g.liberarAmbito('nivel-3')
  const res = await enCurso
  ok(res.cancelled && g.instantanea().entradas === 0 && !g.listo(u), 'una precarga que termina después de salir de la batalla no queda retenida por un ámbito inexistente')
  const dec = g.decodificar(resolverImagen(u, 'lite'), 'nivel-1')
  g.liberarTodoExcepto()
  ok((await dec) === false && g.instantanea().entradas === 0, 'el cambio de perfil invalida las precargas en curso')
  await g.preparar([u], { ambito: 'nivel-3' })
  ok(g.listo(u), 'tras cerrar un ámbito, volver a abrirlo (reintento) funciona con una generación nueva')
}
// reloj compartido: proyectiles y reloj educativo usan la misma referencia temporal
{
  let t = 0, oculto = false, pausa = false
  const r = crearRelojCombate({ ahora: () => t, programar: () => 1, cancelar: () => {}, detenido: () => oculto || pausa })
  r.arrancar(20)
  t = 300; const a = r.tiempoActivo()
  t = 400; r.tick()
  ok(Math.abs(a - 0.3) < 1e-9 && Math.abs(r.tiempoActivo() - 0.4) < 1e-9 && Math.abs(r.restante.value - 19.6) < 1e-9, 'tiempoActivo y reloj educativo avanzan lo mismo')
  pausa = true; t = 900; const p1 = r.tiempoActivo(); t = 5000; r.tick()
  ok(p1 === r.tiempoActivo() && Math.abs(r.restante.value - 19.6) < 1e-9, 'en pausa/ayuda/pestaña oculta no avanza ni el tiempo efectivo ni el reloj educativo')
  pausa = false; r.reiniciarReferencia(); t = 15000; r.tick()
  ok(Math.abs(r.tiempoActivo() - 0.9) < 1e-9 && Math.abs(r.restante.value - 19.1) < 1e-9, 'tras un bloqueo largo solo se cuentan 0,5 s por lectura, igual para el reloj y los proyectiles')
}
// migración de preferencias gráficas antiguas
{
  const viejo = (calidad) => validarDatos({ app: 'english-quest', version: 2, ajustes: { calidad, calidadAuto: 'equilibrada' }, progreso: { desbloqueado: 3 } }).datos
  ok(viejo('equilibrada').ajustes.calidad === 'lite' && viejo('auto').ajustes.calidad === 'lite' && viejo('alta').ajustes.calidad === 'alta' && viejo('lite').ajustes.calidad === 'lite', 'Equilibrada y Automático migran a Lite; Alta y Lite se respetan')
  ok(viejo('equilibrada').progreso.desbloqueado === 3 && !('calidadAuto' in viejo('auto').ajustes), 'la migración no reinicia el progreso y elimina el ajuste obsoleto')
}

// ── Fluidez y cambio de perfil
{
  const buenas = Array.from({ length: 120 }, () => 16.7), malas = Array.from({ length: 40 }, () => 55)
  const d = crearDetector()
  ok(!d.observar(resumirVentana(buenas)).lenta, 'ventana fluida: no es lenta')
  ok(d.observar(resumirVentana(malas)).lenta && !d.observar(resumirVentana(buenas)).sostenido, 'una caída momentánea no cuenta como problema sostenido')
  const e = crearDetector()
  const r = [1, 2, 3].map(() => e.observar(resumirVentana(malas)))
  ok(!r[0].sostenido && !r[1].sostenido && r[2].sostenido, 'tres ventanas lentas seguidas = problema sostenido')
  const f = crearDetector()
  ok(!f.observar(resumirVentana(Array.from({ length: 3 }, () => 400))).lenta, 'una ventana casi sin fotogramas (pestaña limitada) se ignora')
  ok(perfilInferior('alta') === 'lite' && perfilInferior('lite') === null && perfilInferior('equilibrada') === null, 'la recomendación solo propone Lite desde Alta')
}
// igualdad funcional entre perfiles: el motor no recibe el perfil gráfico
{
  const firma = useCombatEngine.toString()
  ok(!/quality|perfil|lite|useGameGraphics/i.test(firma), 'las reglas de combate no dependen del perfil gráfico')
}
console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo correcto')
process.exit(fallos ? 1 : 0)
