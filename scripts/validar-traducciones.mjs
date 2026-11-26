// Comprueba que todo texto de interfaz pasado a t('…') tenga traducción al inglés en data/ingles.json.
import { fileURLToPath } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const raiz = fileURLToPath(new URL('..', import.meta.url))
const ingles = JSON.parse(readFileSync(join(raiz, 'data/ingles.json'), 'utf8'))
const recorrer = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (['node_modules', '.nuxt', '.output', 'dist', 'dev'].includes(e.name) ? [] : recorrer(join(d, e.name))) : [join(d, e.name)]))
const archivos = ['components', 'pages', 'composables', 'layouts'].flatMap((d) => recorrer(join(raiz, d))).filter((f) => /\.(vue|js)$/.test(f))
const faltan = new Set()
for (const f of archivos) {
  const texto = readFileSync(f, 'utf8')
  for (const m of texto.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) {
    const clave = m[1].replace(/\\'/g, "'")
    if (!/[a-záéíóúñ]/i.test(clave)) continue
    if (!(clave in ingles)) faltan.add(`${f.replace(raiz, '')}: ${clave}`)
  }
}
if (faltan.size) { console.error('Faltan traducciones:\n' + [...faltan].join('\n')); process.exit(1) }
console.log('Traducciones completas.')
