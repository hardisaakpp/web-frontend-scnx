import { createApiClient } from '@/plugins/axiosFactory'

const rawBaseUrl = import.meta.env.VITE_PROMOCION_SOBRES_API_URL || '/promocion-sobres-api'

/** Rutas reales del backend: `/api/promocion-sobres/v1/...` */
export const promocionSobresApiPrefix = '/api/promocion-sobres/v1'

export const promocionSobresApi = createApiClient(rawBaseUrl, {
  correlationId: true,
  userHeader: true,
  sessionStorageFallback: true,
})

export { rawBaseUrl as API_BASE_URL }
