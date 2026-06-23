import { createApiClient } from '@/plugins/axiosFactory'

const rawInventarioBaseUrl = import.meta.env.VITE_INVENTARIO_API_URL || '/inventario-api'
const normalizedInventarioBaseUrl = rawInventarioBaseUrl.replace(/\/+$/, '')
const inventoryApiPrefix = /\/api$/i.test(normalizedInventarioBaseUrl) ? '/v1' : '/api/v1'

export const inventarioApi = createApiClient(rawInventarioBaseUrl, {
  correlationId: true,
  sessionStorageFallback: true,
})

export { normalizedInventarioBaseUrl as API_BASE_URL, inventoryApiPrefix }
