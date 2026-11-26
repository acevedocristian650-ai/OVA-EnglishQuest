// Detección de problemas SOSTENIDOS de fluidez. Un tirón aislado no cambia nada: hacen falta varias
// ventanas de observación seguidas (o la mayoría de las últimas) con fotogramas lentos.
// No usa la RAM, el modelo ni la resolución del dispositivo: solo lo que se observa en la sesión.
export const ORDEN_PERFILES = ['alta', 'lite']
export const perfilInferior = (perfil) => (ORDEN_PERFILES.includes(perfil) ? ORDEN_PERFILES[ORDEN_PERFILES.indexOf(perfil) + 1] ?? null : null)
export const VENTANA_MS = 2000

// Resume una ventana de duraciones de fotograma (ms). tareasLargasMs: suma de tareas largas medidas en la ventana.
export function resumirVentana(muestras, tareasLargasMs = 0) {
  const orden = [...muestras].sort((a, b) => a - b)
  const n = orden.length
  if (!n) return { n: 0, mediana: 0, p20: 0, p95: 0, fps: 0, lentos: 0, tareasLargasMs }
  const q = (p) => orden[Math.min(n - 1, Math.floor(n * p))]
  return { n, mediana: q(0.5), p20: q(0.2), p95: q(0.95), fps: 1000 / (orden.reduce((s, x) => s + x, 0) / n), lentos: orden.filter((x) => x > 50).length, tareasLargasMs }
}

export function crearDetector({ minimoMuestras = 20, seguidas = 3, ventanaHistorial = 7, enHistorial = 5 } = {}) {
  let referencia = Infinity
  let racha = 0
  let historial = []
  return {
    // Devuelve { lenta, sostenido }
    observar(r) {
      if (r.n < minimoMuestras) return { lenta: false, sostenido: false, ignorada: true } // pestaña limitada o sin actividad
      // La referencia nunca supera ~60 Hz: un dispositivo lento desde el inicio no se toma a sí mismo como patrón.
      referencia = Math.min(referencia, Math.min(17.5, Math.max(8, r.p20)))
      const lenta = r.mediana > Math.max(26, referencia * 1.65) || (r.p95 > 70 && r.lentos / r.n > 0.15) || r.tareasLargasMs > 500
      racha = lenta ? racha + 1 : 0
      historial = [...historial, lenta].slice(-ventanaHistorial)
      const sostenido = racha >= seguidas || (historial.length >= ventanaHistorial && historial.filter(Boolean).length >= enHistorial)
      return { lenta, sostenido }
    },
    reiniciar() { racha = 0; historial = [] },
    get referencia() { return referencia }
  }
}

// Medidor para componentes: un solo requestAnimationFrame que solo acumula números. La recomendación se publica
// mediante useGameGraphics().recomendar. Solo se ofrece cambiar de Alta a Lite: nunca se cambia sola la calidad.
export function useFramePacing(enabled) {
  const { quality, recomendar } = useGameGraphics()
  const sugerir = ref(false)
  const descartado = ref(false)
  onMounted(() => {
    const detector = crearDetector()
    let frame = 0
    let previo = 0
    let inicio = 0
    let muestras = []
    let largas = 0
    let observador = null
    let espera = 0
    try {
      observador = new PerformanceObserver((lista) => { for (const e of lista.getEntries()) largas += e.duration })
      observador.observe({ type: 'longtask', buffered: false })
    } catch { observador = null } // el navegador no mide tareas largas
    function medir(ahora) {
      if (previo) muestras.push(ahora - previo)
      previo = ahora
      if (!inicio) inicio = ahora
      if (ahora - inicio >= VENTANA_MS) {
        const { sostenido } = detector.observar(resumirVentana(muestras, largas))
        muestras = []; largas = 0; inicio = ahora
        if (sostenido && perfilInferior(quality.value)) { sugerir.value = true; recomendar(perfilInferior(quality.value))
          // Si se descarta, se vuelve a observar pasado un minuto; no se insiste antes.
          espera = setTimeout(() => { sugerir.value = false; reiniciar() }, 60000)
          return
        }
      }
      frame = requestAnimationFrame(medir)
    }
    function reiniciar() {
      cancelAnimationFrame(frame)
      previo = inicio = largas = 0
      muestras = []
      detector.reiniciar()
      if (!document.hidden && enabled.value && !descartado.value && !sugerir.value) frame = requestAnimationFrame(medir)
    }
    const stop = watch([enabled, descartado, quality], () => { sugerir.value = false; reiniciar() }, { immediate: true })
    document.addEventListener('visibilitychange', reiniciar)
    onBeforeUnmount(() => {
      stop()
      clearTimeout(espera)
      cancelAnimationFrame(frame)
      observador?.disconnect()
      document.removeEventListener('visibilitychange', reiniciar)
    })
  })
  return { sugerir, descartado }
}
