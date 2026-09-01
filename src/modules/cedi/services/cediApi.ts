import { cediApi } from '@/lib/http'
import type { CediHealth } from '../types'

const cediApiService = {
  // Health check no requiere auth en el backend (ver HealthController.cs) —
  // sirve para que el Dashboard muestre "backend caído/arriba" apenas entra el usuario.
  getHealth: async () => {
    const response = await cediApi.get<CediHealth>('Health')
    return response.data
  },
}

export default cediApiService
