# English Quest — integración de versiones

## Base y decisiones
- Base: Lo_que_esta_en_main.zip. Se conservaron todos sus archivos, incluida la configuración y el bloqueo de dependencias de Nuxt.
- Sonnet (en Arena): mapa, desplazamiento del caballero, Grimorio, presentación de retos, distractores, banco de 36 preguntas base y 99 variantes.
- EnglishQuest-mejoras.zip: actividades de biblioteca y contenidos ampliados, diario vertical móvil y corrección de enunciado dinámico de esquiva. Se unieron las traducciones; Sonnet prevalece ante conflictos. No se mezclaron indiscriminadamente variantes de ambas versiones para evitar incoherencias y duplicados.
- Se unificó el barajado: todas las posiciones de selección y emparejamiento son posibles, sin dejar oraciones resueltas cuando existe una permutación diferente. Se conservan las fichas falsas. Se conectó también a la práctica de refuerzo; en la biblioteca el orden inicial es determinista para evitar diferencias de hidratación y se cambia la semilla al repetir.
- Se ajustaron instrucciones del casco y will, y el viaje del mapa respeta movimiento reducido.
- No se incorporaron Gemini, WhatER, Next.js, PostgreSQL ni archivos de plantilla Arena.

## Integridad
- 301 archivos originales presentes; 219 archivos de public/ idénticos byte por byte.
- useCombatEngine.js, package.json, package-lock.json y nuxt.config.js idénticos a la base.
- 17 archivos originales modificados; nuevos: composables/useBarajar.js, scripts/pruebas-barajado.mjs.

## Archivos modificados
- `components/biblioteca/Actividad.vue`
- `components/combat/CombatDesafio.vue`
- `components/combat/CombatEscuchar.vue`
- `components/combat/CombatEsquiva.vue`
- `components/combat/CombatParejas.vue`
- `components/combat/CombatPreguntaDuelo.vue`
- `components/map/MapBoard.vue`
- `components/map/MapListaZonas.vue`
- `components/map/MapZone.vue`
- `components/map/MisionFicha.vue`
- `components/progress/PracticePanel.vue`
- `data/contenidos.json`
- `data/ingles.json`
- `data/niveles.json`
- `pages/biblioteca.vue`
- `pages/map.vue`
- `scripts/validar-preguntas.mjs`

## Pruebas realizadas
- `node scripts/validar-preguntas.mjs`: OK, 5 niveles y 99 variantes.
- `node scripts/validar-traducciones.mjs`: OK.
- `node scripts/generar-variantes.mjs --verificar`: OK, 84 recursos; alta 18,51 MB y lite 1,55 MB (estimación de recursos, no medición de descarga real).
- `node scripts/pruebas-barajado.mjs`: OK, 26 versiones de ordenar × 100 intentos, todas las posiciones de selección y 6 permutaciones de tres parejas observadas.
- `node --check`: 48 bloques script de Vue comprobados, sin errores de sintaxis JavaScript (no equivale a compilar Vue).
- `npm test`: se detuvo en simular-combate.mjs al no disponer de Vue instalado. No se ejecutaron simulación, pruebas de módulos, compilación ni pruebas visuales/móviles.

## Pendientes
- Identificadores permanentes y recuperación exacta de variantes falladas; el refuerzo todavía usa el criterio de identificación original.
- Criterio del 70 % por temática (tres preguntas) continúa intacto: decidir con el docente el umbral global y por tema.
- Revisar transferencia en evaluación final, alternativas auditivas, ayudas, accesibilidad y fluidez mediante pruebas reales. El banco ampliado no fue auditado pedagógicamente en su totalidad.

## Ejecutar localmente
```bash
npm ci
npm test
node scripts/pruebas-barajado.mjs
npm run dev
```
Prueba antes de subir al repositorio.


# Segunda integración — Mainactualmainactual.zip

## Selección de cambios
- Base: main adjuntado por el usuario; no se sobrescribieron recursos de public ni el lockfile.
- V1 (refine-nuxt-project-features): banco con IDs explícitos, legado, migración v2→v3, selección de variantes por historial, nueva evaluación, mapa, transiciones, ficha, refuerzo y explicaciones. Se conserva el motor original salvo los campos de evidencia en el registro de rondas.
- V2 (implement-unique-question-identifiers): cuatro laboratorios modulares (tiempo, be going to, will y señales), componente común de fichas, consejos gramaticales, selección táctil/teclado de clasificación y conjuro, y verificación SHA-256. Se conserva el formato de IDs de V1, no se superpone el banco ni el sistema de progreso de V2.
- Se adaptaron los controles de conjuro para que el modo de pulsación sea explícito y una respuesta completa incorrecta se envíe a la validación original; la modalidad de arrastre sigue disponible. Se evita que el clic posterior a un arrastre en clasificación seleccione de nuevo la ficha.
- Se registran pistas, transcripción, falta/fallo de voz y correcciones en clasificación y parejas sin alterar las fórmulas de daño o las reglas del motor. Se registra la variante vista aun si se responde con ayuda. Se conserva la ponderación propuesta de V1: 0,66 por tema y global, acierto independiente = 1, asistido = 0,5. No es el umbral original del 70%; debe validarse con el docente. La evaluación exige cuatro temas y doce rondas. La alternativa textual no es evidencia auditiva independiente.
- Se añade criterio educativo puro en lib/criterioEducativo.js, pruebas de integración sin dependencias, ajustes en el refuerzo y traducciones de ambos conjuntos de cambios. Se adaptó el script E2E al nuevo Grimorio, pero no se ejecutó.
- No se incluyeron capturas antiguas ni carpetas generadas de Arena.ai.

## Verificación real en este entorno (Node 22.16.0)
- validar-preguntas.mjs: correcto (5 niveles, 86 variantes activas; 122 preguntas contando las bases).
- validar-traducciones.mjs: correcto.
- generar-variantes.mjs --verificar: correcto (84 recursos gráficos en perfiles; no se generaron archivos).
- pruebas-barajado.mjs: correcto (23 preguntas de ordenar × 100 intentos; posiciones y seis permutaciones de parejas).
- pruebas-recursos.mjs: correcto (219 archivos de public/ coinciden con SHA-256).
- pruebas-integracion.mjs: correcto (171 IDs únicos incluyendo legado; 135 registros originales recuperables; rotación, evaluación, ayudas e incompletitud).
- Verificación sintáctica de JavaScript mediante node --check: correcta. No equivale a compilar los templates Vue.
- Comparación contra main: sin archivos originales eliminados; package-lock.json, nuxt.config.js y public/ permanecen idénticos. El diff de useCombatEngine.js contiene únicamente el argumento datosRonda y los campos de historial; no cambia reglas del combate.

## Límites y pruebas pendientes
`npm ci --offline` falló porque faltan paquetes en caché; el registro npm no resuelve DNS en este entorno. Por ello no se ejecutaron `npm test` completo, `pruebas-v3.mjs`, `pruebas-modulos.mjs`, `simular-combate.mjs`, `npm run build` ni las pruebas de navegador. Tampoco se han medido FPS ni probado controles táctiles en dispositivos reales. La prueba pura verifica lógica e indexación del banco, no migración completa sobre Vue ni comportamiento visual. La auditoría gramatical exhaustiva de cada variante y la validación pedagógica con estudiantes siguen pendientes.

Para validar localmente: `npm ci`, `npm test`, `npm run build`, `npm run dev`. Prueba la migración desde un progreso real anterior, las pistas, las alternativas de arrastre, las transiciones, los cuatro laboratorios y las batallas completas en Alta y Lite antes de publicar. Se mantiene el script E2E opcional (requiere Playwright y Chromium) y se recomienda probar tanto orientación vertical como horizontal.


## V4 — dificultad seleccionable por misión
- En la ficha de todas las misiones desbloqueadas (incluida la prueba final), se puede elegir Normal o Difícil antes de iniciar. Normal es la opción inicial cada vez que se abre la ficha.
- Normal no cambia ningún tiempo existente. Difícil establece un tiempo base de 10 s por ronda mediante `lib/dificultad.js`, después de seleccionar y mezclar la variante. No modifica los datos originales ni `useCombatEngine.js`. Se conserva la dificultad al reintentar y se indica Difícil en la cabecera.
- Se mantienen pausas, ayuda, tiempo ampliado (15 o 20 s en Difícil) y práctica sin límite; el selector informa si están activos. La prueba final mantiene sus criterios de aprobación; no se crean puntuaciones o progresos separados por dificultad.
- Las actividades de hacha conservan su lógica original: su velocidad se ajusta automáticamente al tiempo total de ronda, por lo que Difícil acelera los proyectiles. No se cambian daños, colisiones, ataques ni animaciones.
- Archivos: `pages/map.vue`, `components/map/MisionFicha.vue`, `components/combat/CombatDesafio.vue`, `data/ingles.json`, `lib/dificultad.js`, `scripts/pruebas-dificultad.mjs`, `scripts/simular-combate.mjs`, `package.json` y este documento.
- Pruebas ejecutadas: validación de preguntas y traducciones, comprobación SHA-256 de los recursos, pruebas de dificultad (sin dependencias). La simulación real del reloj se añadió al script de combate pero requiere Vue instalado; compilación Nuxt y pruebas visuales siguen pendientes.
