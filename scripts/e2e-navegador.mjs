// Prueba real en navegador (Chromium sin interfaz con emulación móvil) sobre la compilación de producción (dist/).
// No es parte de «npm test»: necesita playwright-core y un Chromium instalado aparte:
//   npm i --no-save playwright-core && npx playwright-core install chromium && node scripts/e2e-navegador.mjs
// Uso: node scripts/e2e-navegador.mjs [alta,lite]
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const dist = fileURLToPath(new URL('../dist', import.meta.url))
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp3': 'audio/mpeg' }
const servidor = createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split('?')[0])
  let f = join(dist, ruta)
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html')
  if (!existsSync(f)) { res.writeHead(404); res.end('no'); return }
  res.writeHead(200, { 'content-type': tipos[extname(f)] ?? 'application/octet-stream' }); res.end(readFileSync(f))
}).listen(4173)
const perfiles = (process.argv[2] ?? 'alta,lite').split(',')
const resumen = {}
const navegador = await chromium.launch()
for (const perfil of perfiles) {
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.addInitScript((p) => {
    if (!localStorage.getItem('english-quest-v2')) localStorage.setItem('english-quest-v2', JSON.stringify({ app: 'english-quest', version: 2, ajustes: { calidad: p, introVista: true }, progreso: { desbloqueado: 4 } }))
  }, perfil)
  const pagina = await ctx.newPage()
  const errores = [], malas = [], imagenes = [], scripts = []
  pagina.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errores.push(m.type() + ': ' + m.text().slice(0, 200)) })
  pagina.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
  pagina.on('response', (r) => { if (r.status() >= 400) malas.push(r.status() + ' ' + r.url()); const u = r.url(); if (/\/images\//.test(u)) imagenes.push(u.replace('http://localhost:4173', '')); if (/\/_nuxt\/.*\.js/.test(u)) scripts.push(u.split('/').pop()) })
  await pagina.goto('http://localhost:4173/map', { waitUntil: 'networkidle' })
  await pagina.waitForSelector('button.zona', { timeout: 15000 })
  const r = { perfil }
  r.atributo = await pagina.getAttribute('[data-graphics]', 'data-graphics')
  await pagina.screenshot({ path: join(tmpdir(), `e2e-${perfil}-mapa.png`) })
  await pagina.locator('button.zona').first().click()
  await pagina.waitForSelector('.pergamino', { timeout: 5000 })
  r.leccion = (await pagina.locator('.pergamino h2').first().innerText())
  await pagina.screenshot({ path: join(tmpdir(), `e2e-${perfil}-leccion.png`) })
  await pagina.getByRole('button', { name: /Omitir lección/ }).click()
  await pagina.waitForSelector('.desafio', { timeout: 30000 })
  await pagina.waitForSelector('.escenario', { timeout: 15000 })
  await pagina.waitForTimeout(2500)
  r.escena = await pagina.evaluate(() => ({ imgs: document.querySelectorAll('.escenario img').length, nodos: document.querySelectorAll('.escenario *').length, lite: !!document.querySelector('.escenario .aura-lite, .escenario .secuencia') }))
  r.escenaCompleta = scripts.some((s) => /CombatEscena\./.test(s)) || (await pagina.evaluate(() => performance.getEntriesByType('resource').map((x) => x.name).some((n) => /CombatEscena\.[\w-]+\.js/.test(n))))
  r.escenaLiteCargada = await pagina.evaluate(() => performance.getEntriesByType('resource').map((x) => x.name).some((n) => /CombatEscenaLite/.test(n)))
  r.escenaPesadaCargada = await pagina.evaluate(() => performance.getEntriesByType('resource').map((x) => x.name).some((n) => /CombatEscena\.[\w-]+\.(js|css)/.test(n)))
  await pagina.screenshot({ path: join(tmpdir(), `e2e-${perfil}-combate.png`) })
  // Pausa segura y reanudación
  await pagina.getByRole('button', { name: /Pausar/ }).click()
  r.pausa = await pagina.locator('.pausa').count()
  await pagina.getByRole('button', { name: /^Continuar$/ }).click()
  // Deja que el tiempo se agote: el guardián ataca (prueba el golpe completo con la escena del perfil)
  const t0 = Date.now()
  await pagina.waitForSelector('.panel h2:has-text("El guardián te alcanzó"), .panel h2:has-text("Se acabó el tiempo")', { timeout: 60000 })
  r.segundosHastaGolpe = Math.round((Date.now() - t0) / 1000)
  await pagina.screenshot({ path: join(tmpdir(), `e2e-${perfil}-revision.png`) })
  r.vida = await pagina.locator('.marcador .identidad span').first().innerText()
  r.retro = (await pagina.locator('.panel .retro').count())
  await pagina.getByRole('button', { name: /Siguiente pregunta/ }).click()
  await pagina.waitForTimeout(1500)
  r.siguienteFase = await pagina.locator('.banda-ronda .etiqueta').innerText()
  // Volver al mapa y comprobar progreso guardado
  await pagina.getByRole('button', { name: /Volver al mapa/ }).first().click()
  await pagina.waitForSelector('button.zona')
  r.guardado = await pagina.evaluate(() => { const d = JSON.parse(localStorage.getItem('english-quest-v2')); return { version: d.version, ajustes: d.ajustes.calidad } })
  r.pedidas404 = malas
  r.errores = [...new Set(errores)].slice(0, 8)
  r.imagenesLiteVsPesadas = { png: imagenes.filter((u) => u.endsWith('.png')).length, lite: imagenes.filter((u) => u.endsWith('-lite.webp')).length, webp: imagenes.filter((u) => u.endsWith('.webp') && !u.endsWith('-lite.webp')).length, svgAnimado: imagenes.filter((u) => u.includes('-animado.svg')).length, total: imagenes.length }
  resumen[perfil] = r
  await ctx.close()
}
await navegador.close(); servidor.close()
writeFileSync(join(tmpdir(), 'e2e-resumen.json'), JSON.stringify(resumen, null, 1))
console.log(JSON.stringify(resumen, null, 1))
