import { createModuleApi } from '@/lib/http'
import { ENV } from '@/config/env'

export const recepcionProveedoresApi = createModuleApi(ENV.RECEPCION_PROVEEDORES_URL)
