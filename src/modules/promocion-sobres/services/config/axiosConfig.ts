import { createModuleApi } from '@/lib/http'

const rawBaseUrl = import.meta.env.VITE_PROMOCION_SOBRES_API_URL || '/promocion-sobres-api'

/** Rutas reales del backend: `/api/promocion-sobres/v1/...` */
export const promocionSobresApiPrefix = '/api/promocion-sobres/v1'

export const promocionSobresApi = createModuleApi(rawBaseUrl, {
  auditHeaders: true,
  correlationId: true
})

export { rawBaseUrl as API_BASE_URL }
