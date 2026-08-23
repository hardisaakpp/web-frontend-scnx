import { defineStore } from 'pinia'
import { ref } from 'vue'
import cediApiService from '../services/cediApi'
import type { CediHealth } from '../types'

export const useCediStore = defineStore('cedi', () => {
  const health = ref<CediHealth | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function checkHealth() {
    loading.value = true
    error.value = null
    try {
      health.value = await cediApiService.getHealth()
    } catch (e: any) {
      health.value = null
      error.value = e?.message ?? 'No se pudo contactar al backend de CEDI'
    } finally {
      loading.value = false
    }
  }

  return { health, loading, error, checkHealth }
})
