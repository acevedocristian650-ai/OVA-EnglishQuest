// Prueba real en navegador (Chromium sin interfaz) de las mejoras v3 sobre la compilación de producción (dist/).
// Necesita playwright-core y Chromium: npm i --no-save playwright-core && npx playwright-core install chromium
// Uso: node scripts/e2e-v3.mjs   (deja capturas en /tmp/eq-shots)
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const dist = fileURLToPath(new URL('../dist', import.meta.url)); const salida = '/tmp/eq-shots'; mkdirSync(salida, { recursive: true })
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' }
const servidor = createServer((req, res) => {
  let f = join(dist, decodeURIComponent(req.url.split('?')[0])); if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html')
  if (!existsSync(f)) f = join(dist, '200.html')
  res.writeHead(200, { 'content-type': tipos[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f))
}).listen(4174)
const VISTAS = { movil: { width: 390, height: 844 }, horizontal: { width: 844, height: 390 }, escritorio: { width: 1366, height: 768 } }
const v2 = (calidad) => JSON.stringify({ app: 'english-quest', version: 2, ajustes: { calidad, introVista: true, tourVisto: true }, progreso: { desbloqueado: 5, niveles: { 1: { intentos: 2, victorias: 1, completado: true, estrellas: 2 }, 2: { intentos: 1, victorias: 1, completado: true, estrellas: 3 }, 3: { intentos: 1, victorias: 1, completado: true, estrellas: 1 }, 4: { intentos: 1, victorias: 1, completado: true, estrellas: 2 } },
  refuerzo: { '2|Listen to the warning.': { nivel: 2, indice: 5, tipo: 'escuchar', tema: 'Be going to', texto: 'Listen to the warning.', correcta: 'The bridge is going to break!', explicacion: 'x', fallos: 1, aciertosSeguidos: 0 },
    '3|Find the mistake in the prediction.': { nivel: 3, indice: 0, tipo: 'errores', tema: 'Will', texto: 'Find the mistake in the prediction.', correcta: 'I think it will rain tomorrow.', explicacion: 'x', fallos: 2, aciertosSeguidos: 0 } } } })
const informe = []; const nota = (ok, m) => { const l = `${ok ? 'OK   ' : 'FALLA'} ${m}`; informe.push(l); console.log(l) }
let navegador = await chromium.launch()
const relanzar = async () => { await navegador.close().catch(() => {}); navegador = await chromium.launch() } // evita agotar la memoria del sandbox
const nuevo = async (vista, calidad = 'lite') => {
  const ctx = await navegador.newContext({ viewport: VISTAS[vista], deviceScaleFactor: 1, isMobile: vista !== 'escritorio', hasTouch: vista !== 'escritorio' })
  await ctx.addInitScript(([c, d]) => { if (!localStorage.getItem('english-quest-v3') && !localStorage.getItem('english-quest-v2')) localStorage.setItem('english-quest-v2', d) }, [calidad, v2(calidad)])
  const p = await ctx.newPage(); const errores = []
  p.on('pageerror', (e) => errores.push('pageerror: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 160)) })
  return { ctx, p, errores }
}
const desborda = (p) => p.evaluate(() => document.scrollingElement.scrollWidth > window.innerWidth + 2)

for (const vista of Object.keys(VISTAS)) {
  const { ctx, p, errores } = await nuevo(vista)
  await p.goto('http://localhost:4174/map', { waitUntil: 'networkidle' }); await p.waitForSelector('button.zona', { timeout: 15000 }); await p.waitForTimeout(1500)
  await p.screenshot({ path: `${salida}/${vista}-mapa.png` })
  nota(!(await desborda(p)), `[${vista}] mapa sin desbordamiento horizontal`)
  const guardado = await p.evaluate(() => JSON.parse(localStorage.getItem('english-quest-v3') || 'null'))
  nota(guardado?.version === 3 && guardado.progreso.desbloqueado === 5 && Object.keys(guardado.progreso.refuerzo).every((k) => /^n\d/.test(k)), `[${vista}] el progreso v2 se migró a v3 con ids (${Object.keys(guardado?.progreso.refuerzo ?? {}).join(', ')})`)
  // Ficha de misión
  await p.locator('button.zona').nth(4).click(); await p.waitForSelector('.ficha', { timeout: 5000 }); await p.waitForTimeout(400)
  await p.screenshot({ path: `${salida}/${vista}-ficha-final.png` })
  const alto = await p.evaluate(() => { const c = document.querySelector('.ficha'); return { h: c.getBoundingClientRect().height, vh: innerHeight, scroll: c.scrollHeight } })
  nota(alto.h <= alto.vh, `[${vista}] la ficha de misión cabe en pantalla (${Math.round(alto.h)} de ${alto.vh} px)`)
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  nota(errores.length === 0, `[${vista}] mapa sin errores de consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`)
  await ctx.close()
}

// Grimorio: Laboratorio de cada tomo
for (const vista of ['movil', 'escritorio']) {
  const { ctx, p, errores } = await nuevo(vista)
  for (const n of [1, 2, 3, 4]) {
    await p.goto(`http://localhost:4174/biblioteca?tema=${n}`, { waitUntil: 'networkidle' })
    await p.getByRole('tab', { name: /Laboratorio/ }).click(); await p.waitForSelector('.lab', { timeout: 5000 })
    nota(!(await desborda(p)), `[${vista}] Laboratorio ${n} sin desbordamiento horizontal`)
    if (n === 1) {
      await p.locator('.deslizador').focus(); await p.keyboard.press('Home')
      const texto = await p.locator('.resultado').innerText()
      nota(/last month/.test(texto) && /visited/.test(texto), `[${vista}] Lab 1: la línea de tiempo cambia expresión y verbo`)
    }
    if (n === 2) {
      const a = await p.locator('.fichas').innerText(); await p.getByRole('button', { name: 'Pregunta', exact: true }).click(); await p.waitForTimeout(500)
      const b = await p.locator('.fichas').innerText(); nota(a !== b && /\?$/.test(b.trim()), `[${vista}] Lab 2: la forma interrogativa cambia las fichas`)
    }
    if (n === 3) {
      await p.getByRole('button', { name: /Comparar con be going to/ }).click()
      nota(await p.locator('.fichas').count() === 2, `[${vista}] Lab 3: comparación de las dos estructuras`)
    }
    if (n === 4) {
      await p.getByRole('tab', { name: /Taller de normas/ }).click()
      await p.getByRole('button', { name: /Prohibición/ }).click()
      nota(/Do not/.test((await p.locator('.fichas').innerText()).replace(/\s+/g, ' ')), `[${vista}] Lab 4: la prohibición genera Do not`)
    }
    await p.screenshot({ path: `${salida}/${vista}-lab-${n}.png`, fullPage: false })
  }
  nota(errores.length === 0, `[${vista}] Grimorio sin errores de consola${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`)
  await ctx.close()
}

// Combate: primera ronda de cada nivel (un contexto por perfil/vista; una página por nivel)
for (const [vista, calidad, niveles] of [['horizontal', 'lite', [1, 2, 3, 4, 5]], ['movil', 'lite', [1, 2, 3, 4, 5]], ['escritorio', 'lite', [3, 5]]]) {
  await relanzar()
  const { ctx, errores } = await nuevo(vista, calidad)
  for (const n of niveles) {
    const p = await ctx.newPage(); errores.length = 0
    p.on('pageerror', (e) => errores.push('pageerror: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 160)) })
    try {
      await p.goto('http://localhost:4174/map', { waitUntil: 'networkidle' }); await p.waitForSelector('button.zona')
      await p.locator('button.zona').nth(n - 1).click(); await p.waitForSelector('.ficha'); await p.getByRole('button', { name: /Iniciar batalla/ }).click()
      await p.waitForSelector('.desafio', { timeout: 40000 }); await p.waitForTimeout(3000)
      await p.screenshot({ path: `${salida}/${vista}-${calidad}-combate-${n}.png` })
      const m = await p.evaluate(() => ({ desborda: document.scrollingElement.scrollWidth > innerWidth + 2, tipo: document.querySelector('.banda-ronda .insignia em')?.innerText ?? '' }))
      nota(!m.desborda, `[${vista}/${calidad}] combate nivel ${n} («${m.tipo}»): sin desbordamiento horizontal`)
      nota(errores.filter((e) => !/Failed to load resource|audio|play\(\)/i.test(e)).length === 0, `[${vista}/${calidad}] combate nivel ${n}: sin errores de consola`)
    } catch (e) { nota(false, `[${vista}/${calidad}] combate nivel ${n}: ${String(e.message).split('\n')[0]}`) }
    await p.close()
  }
  await ctx.close()
}
{
  await relanzar()
  const { ctx, p, errores } = await nuevo('movil')
  await p.goto('http://localhost:4174/map', { waitUntil: 'networkidle' }); await p.waitForSelector('button.zona')
  await p.getByRole('button', { name: /Estadísticas/ }).click(); await p.waitForTimeout(500); await p.screenshot({ path: `${salida}/movil-estadisticas.png` })
  await p.getByRole('button', { name: /Practicar|Refuerzo|refuerzo/ }).first().click(); await p.waitForSelector('.eq-caja h2[lang=en]', { timeout: 5000 })
  const pregunta = await p.locator('.eq-caja h2').innerText(); await p.screenshot({ path: `${salida}/movil-refuerzo.png` })
  nota(pregunta.length > 3 && !(await desborda(p)), `[refuerzo] se abre con un progreso migrado y muestra «${pregunta}»`)
  nota(await p.getByRole('button', { name: /Mostrar transcripción/ }).count() + await p.locator('.eq-opcion').count() > 0, '[refuerzo] actividad usable (opciones o transcripción alternativa)')
  await ctx.close()
}
await navegador.close(); servidor.close()
process.exitCode = informe.some(l => l.startsWith('FALLA')) ? 1 : 0
console.log(informe.join('\n')); console.log(`\n${informe.filter((l) => l.startsWith('FALLA')).length} fallos · capturas en ${salida}`)
