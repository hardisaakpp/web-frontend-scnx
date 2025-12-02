import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'

export const useProcesoStore = defineStore('mba3Proceso', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentStep = ref<string | null>(null)
  const resultados = ref<any>(null)
  const progress = ref(0)

  async function migrar() {
    loading.value = true
    error.value = null
    currentStep.value = 'migrar'
    progress.value = 50
    try {
      const data = await mba3ConsultasService.migrar()
      resultados.value = { ...resultados.value, migrar: data }
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al migrar'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function procesarOC() {
    loading.value = true
    error.value = null
    currentStep.value = 'procesar-oc'
    progress.value = 75
    try {
      const data = await mba3ConsultasService.procesarOC()
      resultados.value = { ...resultados.value, procesarOC: data }
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al procesar OC'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function integrarSAP(referenciaDespacho?: string) {
    loading.value = true
    error.value = null
    currentStep.value = 'integrar-sap'
    progress.value = 100
    try {
      const data = await mba3ConsultasService.integrarSAP(referenciaDespacho)
      resultados.value = { ...resultados.value, integrarSAP: data }
      return data
    } catch (err: any) {
      error.value = err.message || 'Error al integrar con SAP'
      throw err
    } finally {
      loading.value = false
      currentStep.value = null
    }
  }

  async function procesoCompleto() {
    loading.value = true
    error.value = null
    progress.value = 0
    currentStep.value = 'migrar'
    
    // Simular progreso paso a paso
    const progressSteps = [
      { step: 'migrar', progress: 33 },
      { step: 'procesar-oc', progress: 66 }
    ]
    
    let currentStepIndex = 0
    
    // Actualizar progreso cada segundo
    const progressInterval = setInterval(() => {
      if (currentStepIndex < progressSteps.length) {
        const stepInfo = progressSteps[currentStepIndex]
        currentStep.value = stepInfo.step
        progress.value = stepInfo.progress
        currentStepIndex++
      }
    }, 2000) // Cambiar de paso cada 2 segundos
    
    try {
      const data = await mba3ConsultasService.pruebas()
      clearInterval(progressInterval)
      resultados.value = data
      currentStep.value = 'procesar-oc'
      progress.value = 100
      
      // Pequeño delay para mostrar el último paso completado
      setTimeout(() => {
        currentStep.value = null
      }, 500)
      
      return data
    } catch (err: any) {
      clearInterval(progressInterval)
      error.value = err.message || 'Error en proceso completo'
      currentStep.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  function reset() {
    resultados.value = null
    error.value = null
    currentStep.value = null
    progress.value = 0
  }

  return {
    loading,
    error,
    currentStep,
    resultados,
    progress,
    migrar,
    procesarOC,
    integrarSAP,
    procesoCompleto,
    reset,
  }
})

