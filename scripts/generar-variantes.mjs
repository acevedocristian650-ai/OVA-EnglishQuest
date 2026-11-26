// Genera y verifica las variantes gráficas de public/images.
//
//   node scripts/generar-variantes.mjs              genera las -lite.webp que falten y reescribe el manifiesto
//   node scripts/generar-variantes.mjs --verificar  solo comprueba (sin escribir): archivos, proporciones, alfa y referencias
//
// Requiere ImageMagick (convert / identify). Es solo una herramienta de desarrollo: el juego no la usa en ejecución.
//
// Reglas de variantes (por «tallo» de archivo, es decir, la ruta sin extensión ni sufijo -lite):
//   alta → el original (png si existe, si no webp), sin ninguna conversión destructiva
//   lite → «-lite.webp» a 60 % del tamaño del original (misma proporción, alfa conservado)
// Solo existen estos dos perfiles. Los .webp de tamaño completo que acompañaban a un .png eran exclusivos del antiguo
// perfil Equilibrada: --eliminar-obsoletos los borra si no hay ninguna referencia literal a ellos.
// El manifiesto data/variantes-imagenes.json lista únicamente variantes que existen: el juego nunca pide otra.
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const publico = join(raiz, 'public')
const salida = join(raiz, 'data/variantes-imagenes.json')
const soloVerificar = process.argv.includes('--verificar')
const eliminarObsoletos = process.argv.includes('--eliminar-obsoletos')
if (soloVerificar && eliminarObsoletos) {
  console.error('Elige --verificar o --eliminar-obsoletos por separado.')
  process.exit(1)
}
const ESCALA_LITE = 0.6
const MIN_ANCHO_PARA_LITE = 300

const recorrer = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? recorrer(join(dir, e.name)) : [join(dir, e.name)]))
const url = (archivo) => '/' + relative(publico, archivo).split('\\').join('/')

function medir(archivo) {
  const [w, h, canales] = execFileSync('identify', ['-format', '%w %h %[channels]', archivo + '[0]'], { encoding: 'utf8' }).trim().split(' ')
  return { ancho: Number(w), alto: Number(h), alfa: /a/i.test(canales.replace('srgb', '')) , bytes: statSync(archivo).size }
}

const archivos = recorrer(join(publico, 'images')).filter((f) => /\.(png|webp)$/.test(f))
const tallos = new Map()
for (const f of archivos) {
  const esLite = f.endsWith('-lite.webp')
  const tallo = f.replace(/-lite\.webp$/, '').replace(/\.(png|webp)$/, '')
  const t = tallos.get(tallo) ?? {}
  if (esLite) t.lite = f
  else if (f.endsWith('.png')) t.png = f
  else t.webp = f
  tallos.set(tallo, t)
}

// --- Obsoletos: archivos sin ninguna referencia directa, dinámica o indirecta en el código.
const fuentes = ['components', 'composables', 'pages', 'data', 'assets', 'plugins', 'layouts']
  .flatMap((d) => recorrer(join(raiz, d))).concat(join(raiz, 'app.vue'))
  .filter((f) => /\.(vue|js|json|css|mjs)$/.test(f) && !f.endsWith('variantes-imagenes.json'))
  .map((f) => readFileSync(f, 'utf8')).join('\n')
const nombreBase = (tallo) => url(tallo).split('/').pop()
function referenciado(tallo) {
  const base = nombreBase(tallo)
  // Directa: la ruta completa aparece; dinámica: el nombre de pose aparece como literal de una lista ('reposo', "carga-1"...).
  // Los fondos estáticos se derivan por sustitución de texto (levelBackground), no por ruta literal.
  if (url(tallo).includes('/arenas/static/')) return true
  return fuentes.includes(url(tallo)) || new RegExp(`['"\`/]${base.replace(/[-]/g, '[-]')}(['"\`.]|-lite)`).test(fuentes)
}
// .webp completos con .png hermano: exclusivos del antiguo perfil Equilibrada (Alta usa el png, Lite su -lite.webp)
const paresEquilibrada = [...tallos.values()].filter((t) => t.png && t.webp && !fuentes.includes(url(t.webp)) && !fuentes.includes(url(t.webp).split('/').pop()))
if (paresEquilibrada.length) {
  console.log(`WebP exclusivos de Equilibrada (${paresEquilibrada.length})`)
  if (eliminarObsoletos) { for (const t of paresEquilibrada) { rmSync(t.webp); delete t.webp } console.log('Eliminados.') }
}
const obsoletos = [...tallos.keys()].filter((t) => !referenciado(t))
if (obsoletos.length) {
  console.log(`Sin referencias (${obsoletos.length}): ${obsoletos.map((t) => url(t)).join(', ')}`)
  if (eliminarObsoletos) {
    for (const t of obsoletos) for (const f of Object.values(tallos.get(t))) rmSync(f)
    obsoletos.forEach((t) => tallos.delete(t))
    console.log('Eliminados.')
  }
}

// --- Generación de -lite.webp que falten (solo imágenes grandes con alfa de personajes y efectos)
let generadas = 0
const errores = []
if (!soloVerificar) {
  for (const [tallo, t] of tallos) {
    const origen = t.webp ?? t.png
    if (t.lite || !origen || url(tallo).includes('/arenas/')) continue // los fondos ya son estáticos y ligeros
    const m = medir(origen)
    if (m.ancho < MIN_ANCHO_PARA_LITE) continue
    const destino = tallo + '-lite.webp'
    execFileSync(process.platform === 'win32' ? 'magick' : 'convert', [origen, '-resize', `${Math.round(ESCALA_LITE * 100)}%`, '-define', 'webp:method=6', '-define', 'webp:alpha-quality=90', '-quality', '80', destino])
    t.lite = destino
    generadas++
  }
}

// --- Manifiesto
const manifiesto = {}
for (const [tallo, t] of [...tallos].sort(([a], [b]) => a.localeCompare(b))) {
  const alta = t.png ?? t.webp
  if (!alta) continue
  const variantes = { alta }
  if (t.lite) variantes.lite = t.lite
  const entrada = {}
  for (const [perfil, archivo] of Object.entries(variantes)) {
    const m = medir(archivo)
    entrada[perfil] = [url(archivo), m.ancho, m.alto, m.bytes, m.alfa ? 1 : 0]
  }
  // Coherencia: misma proporción y misma transparencia entre variantes de un mismo recurso
  const [, w0, h0, , a0] = entrada.alta
  for (const [perfil, [ruta, w, h, , a]] of Object.entries(entrada)) {
    if (Math.abs(w / h - w0 / h0) / (w0 / h0) > 0.015) errores.push(`${ruta}: proporción distinta de la original (${w}x${h} vs ${w0}x${h0})`)
    if (a !== a0) errores.push(`${ruta}: la transparencia no coincide con la original`)
    if (!existsSync(join(publico, ruta))) errores.push(`${ruta}: no existe`)
  }
  manifiesto[url(tallo)] = entrada
}

// --- Referencias literales del código a imágenes de public/images que no existen
const literales = [...new Set([...fuentes.matchAll(/\/images\/[A-Za-z0-9_./-]+\.(?:png|webp|jpg|svg)/g)].map((m) => m[0]))]
for (const l of literales) if (!existsSync(join(publico, l))) errores.push(`referencia a archivo inexistente: ${l}`)

if (!soloVerificar) writeFileSync(salida, JSON.stringify(manifiesto, null, 1) + '\n')
else if (!existsSync(salida) || JSON.stringify(JSON.parse(readFileSync(salida, 'utf8'))) !== JSON.stringify(manifiesto)) {
  errores.push('data/variantes-imagenes.json no coincide con public/images (ejecuta el script sin --verificar)')
}

const resumen = { alta: 0, lite: 0 }
const memoria = { alta: 0, lite: 0 }
for (const e of Object.values(manifiesto)) for (const [p, [, w, h, b]] of Object.entries(e)) { resumen[p] += b; memoria[p] += w * h * 4 }
const mb = (n) => (n / 1048576).toFixed(2) + ' MB'
console.log(`${Object.keys(manifiesto).length} recursos · ${generadas} variantes lite generadas`)
for (const p of Object.keys(resumen)) console.log(`  ${p.padEnd(12)} descarga ${mb(resumen[p]).padStart(9)}  ·  memoria decodificada teórica (RGBA) ${mb(memoria[p]).padStart(9)}`)
if (errores.length) { console.error('\nERRORES:\n' + errores.join('\n')); process.exit(1) }
console.log('Variantes verificadas.')
