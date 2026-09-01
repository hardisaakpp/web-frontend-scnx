import { transferenciasDirectasApi } from '@/lib/http'
import type { ConfiguracionDiasTransitoria, ConfiguracionDiasTransitoriaRequest } from '../types'

const configuracionDiasTransitoriaService = {
  listar: async (): Promise<ConfiguracionDiasTransitoria[]> => {
    const { data } = await transferenciasDirectasApi.get<ConfiguracionDiasTransitoria[]>(
      'configuracion-dias-transitoria'
    )
    return data
  },
  crear: async (body: ConfiguracionDiasTransitoriaRequest): Promise<ConfiguracionDiasTransitoria> => {
    const { data } = await transferenciasDirectasApi.post<ConfiguracionDiasTransitoria>(
      'configuracion-dias-transitoria',
      body
    )
    return data
  },
  actualizar: async (
    id: number,
    body: ConfiguracionDiasTransitoriaRequest
  ): Promise<ConfiguracionDiasTransitoria> => {
    const { data } = await transferenciasDirectasApi.put<ConfiguracionDiasTransitoria>(
      `configuracion-dias-transitoria/${id}`,
      body
    )
    return data
  },
}

export default configuracionDiasTransitoriaService
