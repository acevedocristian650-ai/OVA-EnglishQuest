// Simula el flujo de combate (acierto, contraataque, parada con tiempo, Furia, enfurecimiento) con el <script> real de CombatDesafio.vue.
// Uso: node scripts/simular-combate.mjs
import { readFileSync } from 'node:fs'
const vue = readFileSync(new URL('../components/combat/CombatDesafio.vue', import.meta.url),'utf8').replace(/\r\n/g,'\n')
let code = /<script setup>([\s\S]*?)<\/script>/.exec(vue)[1].replace(/^import .*$/gm,'').replace(/import\.meta\.dev/g,'true')
const map = readFileSync(new URL('../pages/map.vue', import.meta.url),'utf8')
const niveles = new Function(map.slice(map.indexOf('const niveles = ['), map.indexOf('const ultimaVariante')).replace('const niveles','var niveles')+';return niveles')()

// --- mini Vue
const ref = (v) => ({ value: v })
const computed = (fn) => ({ get value() { return fn() } })
const reactive = (o) => o
const watchers = []
const watch = (src, cb) => { const get = Array.isArray(src) ? () => src.map(s=>s.value) : () => src.value; watchers.push({ get, cb, old: JSON.stringify(get()) }) }
const flush = () => watchers.forEach(w => { const n = JSON.stringify(w.get()); if (n !== w.old) { const prev = w.old; w.old = n; w.cb(JSON.parse(n), JSON.parse(prev)) } })
const onMounted = () => {}, onBeforeUnmount = () => {}
// --- tiempo falso
let timers = [], now = 0, idT = 0
const setTimeoutF = (fn, ms) => { const id = ++idT; timers.push({ id, at: now + ms, fn }); return id }
const clearTimeoutF = (id) => { timers = timers.filter(t => t.id !== id) }
const setIntervalF = () => 0, clearIntervalF = () => {}
const avanzar = (ms) => { now += ms; timers.filter(t => t.at <= now).forEach(t => { clearTimeoutF(t.id); t.fn() }) }

const emitted = []
const nivel = niveles[0]
const props = { nivel }
const exportar = `return { fase, indice, furia, bloqueo, avisoFase, vidaCaballero, vidaRival, ataque, danoAplicado, historial, escudoPreparado, enfurecido, danoContra,
 responder, atacar, ataques, impactar, terminarAtaque, parar, paradaActiva, paradaPronto, duracionAnillo, siguiente, fuerza, textoAtaque, carga, completarPalabras, aplicarPalabra, probarRemate, rondaHacha, rondaEsquiva, FURIA_MAXIMA }`
const f = new Function('ref','computed','reactive','watch','onMounted','onBeforeUnmount','defineProps','defineEmits','document','window','performance','setTimeout','clearTimeout','setInterval','clearInterval',
  code + exportar)
const g = f(ref,computed,reactive,watch,onMounted,onBeforeUnmount,()=>props,()=> (e,...a)=>emitted.push(e),{hidden:false},{matchMedia:()=>({matches:false})},{now:()=>now},setTimeoutF,clearTimeoutF,setIntervalF,clearIntervalF)

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
ok(g.fuerza(g.ataques[0])===42,'con furia llena el hachazo hace 42 ((24+4)×1,5)')
g.vidaRival.value = 100
g.responder(nivel.preguntas[3].correcta)
const antes = g.vidaRival.value
g.atacar(g.ataques[0]); g.impactar()
ok(antes - g.vidaRival.value===42 && g.furia.value===0,'el ataque con furia quita 42 y gasta la furia')
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
g.vidaRival.value = 58; flush()
ok(g.enfurecido.value===false && g.avisoFase.value===false,'con 58 PV (>50 %) no está enfurecido')
g.vidaRival.value = Math.floor(nivel.vida/2); flush()
ok(g.enfurecido.value===true && g.avisoFase.value===true,'a la mitad de vida se enfurece y sale el aviso')
ok(g.danoContra.value===Math.round(nivel.dano*0.75),'enfurecido: contraataque 75 %')
avanzar(2300); ok(g.avisoFase.value===false,'el aviso desaparece a los 2,2 s')
g.vidaCaballero.value=100; g.fase.value='elegir'; g.indice.value=1
golpearYEsperarAviso(1)
ok(g.duracionAnillo.value===450+1404,'enfurecido: el anillo se cierra más rápido (450 + 1404 ms)')
// 10) rematar no dispara contraataque
g.vidaCaballero.value=100; g.vidaRival.value=10; g.indice.value=1; g.fase.value='elegir'; g.furia.value=0
g.atacar(g.ataques[0]); g.impactar(); g.terminarAtaque()
ok(g.vidaRival.value===0 && g.fase.value!=='aviso-contra','el golpe final no tiene contraataque')
console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo correcto'); process.exit(fallos?1:0)
