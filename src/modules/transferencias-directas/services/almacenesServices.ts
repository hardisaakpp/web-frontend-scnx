import { transferenciasDirectasApi } from "@/lib/http"
import type { TiendaDestino } from "../types"

const almacenesService = {

  // GET /api/almacenes-locales?tipo=Origen|Destino[&marca] back resuelve el alcance
  listar: async (tipo: 'Origen' | 'Destino', marca?: string): Promise<TiendaDestino[]> => {
    const { data } = await transferenciasDirectasApi.get<TiendaDestino[]>('almacenes-locales', {
      params: { tipo, ...(marca ? { marca } : {}) },
    })
    return data
  },

}

export default almacenesService