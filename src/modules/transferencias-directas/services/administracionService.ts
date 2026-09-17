import { transferenciasDirectasApi } from "@/lib/http"

interface SincronizarAlmacenesResponse {
  mensaje: string
}

const administracionService = {
  sincronizarAlmacenesSap: async (): Promise<SincronizarAlmacenesResponse> => {
    const { data } = await transferenciasDirectasApi.post<SincronizarAlmacenesResponse>(
      'administracion/sincronizar-almacenes-sap',
      undefined,
      { timeout: 130_000 }
    )
    return data
  },
}

export default administracionService