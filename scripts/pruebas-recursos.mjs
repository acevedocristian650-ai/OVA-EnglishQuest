// Comprueba que los recursos originales (public/: imágenes, audios, SVG) siguen idénticos byte por byte.
// El manifiesto con las huellas SHA-256 se generó a partir del repositorio original antes de cualquier cambio.
//   node scripts/pruebas-recursos.mjs            → verifica
//   node scripts/pruebas-recursos.mjs --generar [carpeta-public]  → crea/actualiza el manifiesto (solo con recursos aprobados)
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const rutaManifiesto = join(raiz, 'scripts/manifiesto-recursos.json')
const listar = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listar(join(d, e.name)) : [join(d, e.name)]))
const huellas = (carpeta) => Object.fromEntries(listar(carpeta).sort().map((f) => [relative(carpeta, f).split('\\').join('/'), createHash('sha256').update(readFileSync(f)).digest('hex')]))

if (process.argv.includes('--generar')) {
  const carpeta = process.argv[process.argv.indexOf('--generar') + 1]?.startsWith('--') || !process.argv[process.argv.indexOf('--generar') + 1] ? join(raiz, 'public') : process.argv[process.argv.indexOf('--generar') + 1]
  const m = huellas(carpeta)
  writeFileSync(rutaManifiesto, JSON.stringify(m, null, 0) + '\n')
  console.log(`Manifiesto creado: ${Object.keys(m).length} archivos`)
  process.exit(0)
}
if (!existsSync(rutaManifiesto)) { console.error('Falta scripts/manifiesto-recursos.json'); process.exit(1) }
const esperado = JSON.parse(readFileSync(rutaManifiesto, 'utf8'))
const actual = huellas(join(raiz, 'public'))
const errores = []
for (const [f, h] of Object.entries(esperado)) { if (!(f in actual)) errores.push(`falta ${f}`); else if (actual[f] !== h) errores.push(`modificado ${f}`) }
for (const f of Object.keys(actual)) if (!(f in esperado)) errores.push(`archivo nuevo en public/: ${f}`)
if (errores.length) { console.error(errores.join('\n')); process.exit(1) }
console.log(`OK    ${Object.keys(esperado).length} recursos de public/ idénticos a los originales (SHA-256)`)
