import { defineStore } from 'pinia'
import { ref } from 'vue'
import odcApi from '../services/odcApi'
import type { OdcDetailDto, OdcDto, OdcFilterDto, SyncOdcResult } from '../types'

export const useOdcStore = defineStore('cediOdc', () => {
  const items = ref<OdcDto[]>([])
  const totalCount = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const filters = ref<OdcFilterDto>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const current = ref<OdcDetailDto | null>(null)
  const loadingCurrent = ref(false)

  const syncing = ref(false)
  const lastSync = ref<SyncOdcResult | null>(null)

  async function fetchOdcs() {
    loading.value = true
    error.value = null
    try {
      const result = await odcApi.getOdcs(filters.value, page.value, pageSize.value)
      items.value = result.data
      totalCount.value = result.totalCount
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al cargar ODCs'
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters: Partial<OdcFilterDto>) {
    filters.value = { ...filters.value, ...newFilters }
    page.value = 1
    fetchOdcs()
  }

  function setPage(newPage: number) {
    page.value = newPage
    fetchOdcs()
  }

  async function fetchOdc(numDoc: string) {
    loadingCurrent.value = true
    error.value = null
    current.value = null
    try {
      current.value = await odcApi.getOdc(numDoc)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al cargar la ODC'
      throw e
    } finally {
      loadingCurrent.value = false
    }
  }

  async function refreshCurrent(numDoc: string) {
    current.value = await odcApi.refreshOdc(numDoc)
    return current.value
  }

  async function sync(maxPages = 5) {
    syncing.value = true
    error.value = null
    try {
      lastSync.value = await odcApi.syncOdcs(maxPages)
      await fetchOdcs()
      return lastSync.value
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Error al sincronizar con SAP'
      throw e
    } finally {
      syncing.value = false
    }
  }

  return {
    items, totalCount, page, pageSize, filters, loading, error,
    current, loadingCurrent,
    syncing, lastSync,
    fetchOdcs, setFilters, setPage, fetchOdc, refreshCurrent, sync,
  }
})
