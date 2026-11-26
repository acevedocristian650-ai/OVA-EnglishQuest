// Simula el flujo de combate (acierto, contraataque, parada con tiempo, Furia, enfurecimiento, remates) con el
// MÓDULO REAL que usa el juego: composables/useCombatEngine.js (y su reloj). No hay copia de la lógica aquí:
// si cambian las reglas de producción, esta prueba lo detecta. Solo se sustituye el tiempo por un reloj falso.
// Uso: node scripts/simular-combate.mjs
import { readFileSync } from 'node:fs'
import { nextTick } from 'vue'
import { useCombatEngine } from '../composables/useCombatEngine.js'
const niveles = JSON.parse(readFileSync(new URL('../data/niveles.json', import.meta.url), 'utf8'))

// --- tiempo falso (los temporizadores del motor se ejecutan al «avanzar»)
let timers = [], now = 0, idT = 0
const setTimeoutF = (fn, ms) => { const id = ++idT; timers.push({ id, at: now + ms, fn }); return id }
const clearTimeoutF = (id) => { timers = timers.filter(t => t.id !== id) }
const setIntervalF = () => 0, clearIntervalF = () => {}
const avanzar = (ms) => { const meta = now + ms; for (;;) { const due = timers.filter(t => t.at <= meta).sort((a, b) => a.at - b.at)[0]; if (!due) break; now = due.at; clearTimeoutF(due.id); due.fn() } now = meta }

const emitted = []
const nivel = niveles[0]
function crearCombate(nivel, eventos) {
  const juego = useCombatEngine({
    nivel, emit: evento => eventos.push(evento),
    entorno: { ahora: () => now, setTimeout: setTimeoutF, clearTimeout: clearTimeoutF, setInterval: setIntervalF, clearInterval: clearIntervalF, oculto: () => false }
  })
  juego.iniciar()
  return juego
}
const g = crearCombate(nivel, emitted)

let fallos = 0
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) fallos++ }
const resolverContra = () => { g.impactar(); g.terminarAtaque() }
const golpearYEsperarAviso = (i) => { g.atacar(g.ataques[i]); g.impactar(); g.terminarAtaque() }

// 1) acierto -> golpe -> aviso de contraataque
g.responder(nivel.preguntas[0].correcta)
ok(g.fase.value==='elegir','acertar lleva a elegir ataque')
golpearYEsperarAviso(0)
ok(g.fase.value==='aviso-contra' && g.paradaActiva.value===true,'tras el golpe aparece el aviso y la parada está activa')
ok(g.furia.value===1,'acertar da 1 de furia')
ok(g.carga.value===0.9,'durante el aviso el guardián se ve cargado')
ok(g.duracionAnillo.value===700+1404,'el anillo dura 700 + 1404 ms (aviso + hasta el impacto)')
// 2) demasiado pronto: no cuenta y se puede reintentar
g.parar()
ok(g.bloqueo.value==='' && g.paradaPronto.value===true,'tocar demasiado pronto no bloquea (sacude el escudo)')
avanzar(300)
ok(g.paradaPronto.value===false,'el aviso de «pronto» se apaga')
avanzar(400)
ok(g.fase.value==='ataque' && g.ataque.value.contra===true,'a los 700 ms ataca el guardián (contraataque)')
ok(g.ataque.value.dano===12,'daño base del contraataque = mitad (12)')
// 3) parada perfecta
avanzar(1404)
g.parar()
ok(g.bloqueo.value==='perfecto','tocar en el impacto = parada perfecta')
ok(g.furia.value===1,'bloquear NO da furia')
const vidaRivalAntes = g.vidaRival.value
resolverContra()
ok(g.vidaCaballero.value===100,'parada perfecta: sin daño')
ok(g.vidaRival.value===vidaRivalAntes,'bloquear no daña al guardián')
ok(g.fase.value==='revision' && g.historial.value.length===1,'pasa a revisión sin duplicar el historial')
ok(g.bloqueo.value==='' && g.paradaActiva.value===false,'la parada se reinicia y desaparece')
g.siguiente()
// 4) parada parcial (400 ms antes del impacto)
g.responder(nivel.preguntas[1].correcta); golpearYEsperarAviso(1)
ok(g.furia.value===2,'segundo acierto: 2 de furia')
avanzar(700); avanzar(1404-400)
g.parar()
ok(g.bloqueo.value==='parcial','400 ms antes del impacto = parada parcial')
resolverContra()
ok(g.vidaCaballero.value===94,'parada parcial: recibe la mitad (6)')
g.siguiente()
// 5) sin tocar: golpe completo; y tocar tras el impacto no cuenta
g.vidaRival.value = nivel.vida // evita que el guardián se enfurezca en este caso
g.responder(nivel.preguntas[2].correcta); golpearYEsperarAviso(1)
ok(g.furia.value===3,'tercer acierto llena la furia')
avanzar(700); avanzar(1404)
resolverContra()
ok(g.vidaCaballero.value===82,'sin parada: recibe 12')
g.parar()
ok(g.bloqueo.value==='','tocar cuando ya terminó no hace nada')
g.siguiente()
// 6) Furia ×1,5 (debilidad del nivel 1: hachazo +4)
const plano = () => g.planDano().find((x) => x.indice === g.indice.value).dano
ok(g.fuerza(g.ataques[0]) === Math.round(Math.round(plano() * 1.15) * 1.5), 'con furia llena el hachazo hace el daño planificado de la ronda ×1,15 (debilidad) ×1,5')
ok(g.planDano().every((x, i, a) => i === 0 || x.dano >= a[i - 1].dano) && g.planDano().at(-1).dano > g.planDano()[0].dano * 2, 'el daño planificado crece ronda a ronda y el último golpe es el mayor')
g.vidaRival.value = 100
g.responder(nivel.preguntas[3].correcta)
const antes = g.vidaRival.value
g.atacar(g.ataques[0]); g.impactar()
ok(antes - g.vidaRival.value === Math.round(Math.round(plano() * 1.15) * 1.5) && g.furia.value === 0, 'el ataque con furia quita el daño con bono y gasta la furia')
g.terminarAtaque()
// ronda 4 es de hacha: sin contraataque
ok(g.rondaHacha.value===true && g.fase.value==='revision','en la ronda del hacha no hay contraataque')
g.siguiente()
// 7) fallar reinicia furia
g.furia.value = 2; g.vidaRival.value = 100
g.responder('respuesta equivocada'); g.impactar(); g.terminarAtaque()
ok(g.furia.value===0 && (g.fase.value==='revision'||g.fase.value==='resultado'),'fallar reinicia la furia y no activa contraataque')
// 8) el contraataque nunca remata
g.vidaCaballero.value = 5; g.vidaRival.value = 100; g.fase.value='elegir'; g.indice.value=1
golpearYEsperarAviso(1)
avanzar(700); avanzar(1404); resolverContra()
ok(g.vidaCaballero.value===1,'el contraataque deja mínimo 1 PV')
// 9) enfurecimiento
g.vidaRival.value = 58; await nextTick()
ok(g.enfurecido.value===false && g.avisoFase.value===false,'con 58 PV (>50 %) no está enfurecido')
g.vidaRival.value = Math.floor(nivel.vida/2); await nextTick()
ok(g.enfurecido.value===true && g.avisoFase.value===true,'a la mitad de vida se enfurece y sale el aviso')
ok(g.danoContra.value===Math.round(nivel.dano*0.75),'enfurecido: contraataque 75 %')
avanzar(2300); ok(g.avisoFase.value===false,'el aviso desaparece a los 2,2 s')
g.vidaCaballero.value=100; g.fase.value='elegir'; g.indice.value=1
golpearYEsperarAviso(1)
ok(g.duracionAnillo.value===450+1404,'enfurecido: el anillo se cierra más rápido (450 + 1404 ms)')
// 10) rematar no dispara contraataque
g.vidaCaballero.value=100; g.vidaRival.value=10; g.indice.value=nivel.preguntas.length - 1; g.fase.value='elegir'; g.furia.value=0
g.atacar(g.ataques[0]); g.impactar(); g.terminarAtaque()
ok(g.vidaRival.value===0 && g.fase.value!=='aviso-contra','el golpe final no tiene contraataque')
// Recorrido normal con los eventos que emite cada actividad y el ataque más fuerte disponible.
for (const zona of niveles) {
  const eventos = []
  const juego = crearCombate(zona, eventos)
  let usoRayo = false
  for (const [i, q] of zona.preguntas.entries()) {
    if (q.invocacion) avanzar(1200)
    if (q.tipo === 'clasificar') {
      for (const palabra of q.palabras) juego.aplicarPalabra(palabra.futuro ? 'heroe' : 'monstruo')
      juego.completarPalabras()
    } else if (q.tipo === 'hacha') {
      juego.cortarAtaque()
      avanzar(500)
    } else if (['romper-hechizo', 'proteger-aliado'].includes(q.tipo)) {
      juego.resolverConjuro(q.correcta)
      avanzar(850)
    } else if (['esquivar', 'esquiva-frase'].includes(q.tipo)) {
      if (q.tipo === 'esquivar') juego.esquivar(q.lado === 'izquierda' ? 'derecha' : 'izquierda')
      else juego.completarAviso(q.correcta)
      juego.terminarAtaque()
    } else {
      juego.responder(q.correcta)
    }
    if (juego.fase.value === 'elegir') {
      const disponibles = juego.ataques.filter(a => a.id !== 'rayo' || !usoRayo)
      const mejor = disponibles.sort((a, b) => juego.fuerza(b) - juego.fuerza(a))[0]
      if (mejor.id === 'rayo') usoRayo = true
      juego.atacar(mejor)
      if (zona.remate === 'solar' && i === zona.preguntas.length - 1) {
        ok(juego.ataque.value?.duracion === 14000, 'el remate solar recupera su secuencia completa')
      }
      juego.terminarAtaque()
      if (juego.fase.value === 'aviso-contra') {
        avanzar(700)
        juego.terminarAtaque()
      }
    }
    const ultima = i === zona.preguntas.length - 1
    ok(juego.historial.value.length === i + 1 && juego.historial.value[i].acierto &&
      (ultima ? eventos.filter(e => e === 'victoria').length === 1 :
        juego.vidaRival.value > 0 && juego.fase.value === 'revision' && !eventos.includes('victoria')),
      zona.nombre + ' · ronda ' + (i + 1))
    if (!ultima) juego.siguiente()
  }
}
const eventosTiempo = []
const sinRespuesta = crearCombate(niveles[1], eventosTiempo)
ok(sinRespuesta.tiempoTotal.value === 35, 'la frase cuenta con 35 segundos')
sinRespuesta.agotar()
sinRespuesta.terminarAtaque()
ok(sinRespuesta.vidaCaballero.value < 100 && sinRespuesta.historial.value[0].agotado &&
  !eventosTiempo.includes('victoria'), 'agotar el reloj cuesta vida y registra la ronda')
console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo correcto'); process.exit(fallos?1:0)
