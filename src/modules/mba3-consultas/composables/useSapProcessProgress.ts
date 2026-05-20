/**
 * Barra de progreso del proceso completo SAP (redistribución → ODC → SAP).
 * Simulación acotada hasta el primer poll con `progress` real del worker.
 */
import { ref } from 'vue'

export type SapFase = 'idle' | 'redistribucion' | 'generando' | 'enviando' | 'complete'

const SIMULATION_CAP = 38
const SIMULATION_INTERVAL_MS = 500

export function useSapProcessProgress() {
  const sapProgress = ref(0)
  const sapFase = ref<SapFase>('idle')
  const sapMessage = ref('')

  let interval: ReturnType<typeof setInterval> | null = null
  let usingRealProgress = false

  function stopSimulation() {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  function resetSapProgress() {
    stopSimulation()
    usingRealProgress = false
    sapProgress.value = 0
    sapFase.value = 'idle'
    sapMessage.value = ''
  }

  function updateFaseFromProgress(progress: number) {
    if (progress >= 100) {
      sapFase.value = 'complete'
    } else if (progress < 33) {
      sapFase.value = 'redistribucion'
    } else if (progress < 66) {
      sapFase.value = 'generando'
    } else {
      sapFase.value = 'enviando'
    }
  }

  function startSapProgressSimulation() {
    stopSimulation()
    usingRealProgress = false
    sapProgress.value = 0
    sapFase.value = 'redistribucion'
    sapMessage.value = 'Iniciando proceso SAP...'

    let current = 0
    interval = setInterval(() => {
      if (usingRealProgress || current >= SIMULATION_CAP) return
      const increment = current < 15 ? 2 : current < 28 ? 1 : 0.5
      current = Math.min(SIMULATION_CAP, current + increment)
      sapProgress.value = Math.round(current)
      updateFaseFromProgress(current)
      if (current < 12) {
        sapMessage.value = 'Confirmando redistribución...'
      } else if (current < 28) {
        sapMessage.value = 'Generando orden de compra...'
      } else {
        sapMessage.value = 'Conectando con el worker SAP...'
      }
    }, SIMULATION_INTERVAL_MS)
  }

  /** Prioriza `progress` / `message` del polling sobre la simulación. */
  function applySapPollingUpdate(update: { message?: string; progress?: number }) {
    if (typeof update.progress === 'number') {
      usingRealProgress = true
      stopSimulation()
      sapProgress.value = Math.min(100, Math.max(sapProgress.value, update.progress))
      updateFaseFromProgress(sapProgress.value)
    }
    if (update.message?.trim()) {
      sapMessage.value = update.message.trim()
    }
  }

  function completeSapProgress() {
    stopSimulation()
    usingRealProgress = true
    sapProgress.value = 100
    sapFase.value = 'complete'
    sapMessage.value = 'Proceso completado'
  }

  return {
    sapProgress,
    sapFase,
    sapMessage,
    resetSapProgress,
    startSapProgressSimulation,
    applySapPollingUpdate,
    completeSapProgress,
    stopSimulation,
  }
}
