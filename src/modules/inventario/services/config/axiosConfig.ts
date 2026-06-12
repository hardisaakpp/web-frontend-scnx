import { inventarioHttp as inventarioApi } from '@/lib/http'

const rawInventarioBaseUrl = import.meta.env.VITE_INVENTARIO_API_URL || '/inventario-api'
const normalizedInventarioBaseUrl = rawInventarioBaseUrl.replace(/\/+$/, '')
const inventoryApiPrefix = /\/api$/i.test(normalizedInventarioBaseUrl) ? '/v1' : '/api/v1'

export {
  inventarioApi,
  normalizedInventarioBaseUrl as API_BASE_URL,
  inventoryApiPrefix
}
