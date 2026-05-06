import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { articuloScanService } from '../services/articuloScanApi'
import { mapScanApiError } from '../utils/apiErrorMapper'
import type { ArticleDetailDto, ScanStatus, UiError, WarehouseDto } from '../types'

export const useArticuloScanStore = defineStore('articuloScan', () => {
  const warehouses = ref<WarehouseDto[]>([])
  const selectedWarehouse = ref<string | null>(null)
  const scanCode = ref('')
  const article = ref<ArticleDetailDto | null>(null)
  const loading = ref(false)
  const status = ref<ScanStatus>('idle')
  const error = ref<UiError | null>(null)
  /** Último X-Correlation-Id de una respuesta exitosa (útil para soporte / debug). */
  const lastCorrelationId = ref<string | null>(null)
  const lastScans = ref<Array<{ code: string; at: string; source: 'manual' | 'scanner' }>>([])
  /** Última vía usada al consultar (éxito o no); sirve para UX p. ej. reabrir cámara tras not-found. */
  const lastResolveSource = ref<'manual' | 'scanner' | null>(null)

  const canResolve = computed(() => !!selectedWarehouse.value && scanCode.value.trim().length > 0 && !loading.value)

  async function loadWarehouses() {
    status.value = 'loading-warehouses'
    error.value = null
    lastCorrelationId.value = null
    try {
      warehouses.value = await articuloScanService.getWarehouses()
      status.value = 'ready'
    } catch (err) {
      error.value = mapScanApiError(err)
      status.value = 'error'
    }
  }

  function setWarehouse(code: string | null) {
    selectedWarehouse.value = code
  }

  function setScanCode(code: string) {
    scanCode.value = code.trim()
  }

  function clearResult() {
    article.value = null
    lastCorrelationId.value = null
    lastResolveSource.value = null
    if (status.value !== 'loading-warehouses') {
      status.value = 'ready'
    }
  }

  function resetError() {
    error.value = null
    if (status.value === 'error') {
      status.value = 'ready'
    }
  }

  async function resolveScan(source: 'manual' | 'scanner') {
    if (!selectedWarehouse.value || !scanCode.value.trim()) return

    lastResolveSource.value = source
    loading.value = true
    error.value = null
    lastCorrelationId.value = null
    status.value = 'scanning'
    article.value = null

    try {
      const response = await articuloScanService.resolveScan({
        warehouseCode: selectedWarehouse.value,
        code: scanCode.value.trim(),
        source
      })

      if (response.correlationId) {
        lastCorrelationId.value = response.correlationId
      }

      if (!response.success) {
        const apiError = response.error
        const contractError: UiError = {
          code: apiError?.code || 'UNKNOWN',
          message: apiError?.message || 'No se pudo completar la consulta de artículo.',
          details: apiError?.details,
          correlationId: response.correlationId || undefined
        }
        error.value = contractError
        status.value = contractError.code === 'NOT_FOUND' ? 'not-found' : 'error'
        return
      }

      const result = response.article
      article.value = result
      if (result) {
        status.value = 'detected'
      } else {
        status.value = 'not-found'
      }
      lastScans.value.unshift({
        code: scanCode.value.trim(),
        at: new Date().toISOString(),
        source
      })
      lastScans.value = lastScans.value.slice(0, 10)
    } catch (err) {
      const uiError = mapScanApiError(err)
      error.value = uiError
      const nf =
        uiError.code === 'NOT_FOUND' ||
        (err as { response?: { status?: number } }).response?.status === 404
      status.value = nf ? 'not-found' : 'error'
    } finally {
      loading.value = false
    }
  }

  return {
    warehouses,
    selectedWarehouse,
    scanCode,
    article,
    loading,
    status,
    error,
    lastCorrelationId,
    lastScans,
    lastResolveSource,
    canResolve,
    loadWarehouses,
    setWarehouse,
    setScanCode,
    clearResult,
    resetError,
    resolveScan
  }
})
