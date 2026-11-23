// Compara ventanas de dos segundos con la cadencia observada en esta sesión.
export function useFramePacing(enabled) {
  const sugerir = ref(false)
  const descartado = ref(false)
  onMounted(() => {
    let frame = 0
    let previo = 0
    let inicio = 0
    let muestras = []
    let referencia = Infinity
    let lentas = 0
    function medir(ahora) {
      if (previo) muestras.push(ahora - previo)
      previo = ahora
      if (!inicio) inicio = ahora
      if (ahora - inicio >= 2000 && muestras.length) {
        muestras.sort((a, b) => a - b)
        referencia = Math.min(referencia, muestras[Math.floor(muestras.length * .2)])
        const mediana = muestras[Math.floor(muestras.length / 2)]
        lentas = mediana > Math.max(25, referencia * 1.65) ? lentas + 1 : 0
        muestras = []
        inicio = ahora
        if (lentas >= 3) { sugerir.value = true; return }
      }
      frame = requestAnimationFrame(medir)
    }
    function reiniciar() {
      cancelAnimationFrame(frame)
      previo = inicio = lentas = 0
      muestras = []
      if (!document.hidden && enabled.value && !descartado.value && !sugerir.value)
        frame = requestAnimationFrame(medir)
    }
    const stop = watch([enabled, descartado], reiniciar, { immediate: true })
    document.addEventListener('visibilitychange', reiniciar)
    onBeforeUnmount(() => {
      stop()
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', reiniciar)
    })
  })
  return { sugerir, descartado }
}
