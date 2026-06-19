import { createModuleApi } from '@/lib/http'

const rawBaseUrl = import.meta.env.VITE_PROMOCION_SOBRES_API_URL || '/promocion-sobres-api'
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')

/** Rutas reales del backend: `/api/promocion-sobres/v1/...` */
export const promocionSobresApiPrefix = '/api/promocion-sobres/v1'

export const promocionSobresApi = createModuleApi(normalizedBaseUrl, {
  auditHeaders: true,
  correlationId: true
})

export { normalizedBaseUrl as API_BASE_URL }
