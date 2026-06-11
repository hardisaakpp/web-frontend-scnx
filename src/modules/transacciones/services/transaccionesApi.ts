import { transaccionesApi } from './config/axiosConfig'
import type { FiltrosCajero, FiltrosTesoreria, ReservarTransaccionRequest } from '../types'

const cajero = {
  obtener: (filtros: FiltrosCajero) =>
    transaccionesApi.get('/api/v1/cajero/transacciones', { params: filtros }),

  reservar: (id: number, payload: ReservarTransaccionRequest) =>
    transaccionesApi.post(`/api/v1/cajero/transacciones/${id}/reservar`, payload),
}

const tesoreria = {
  obtener: (filtros: FiltrosTesoreria) =>
    transaccionesApi.get('/api/v1/tesoreria/reporte', { params: filtros }),

  exportarExcel: (filtros: FiltrosTesoreria) =>
    transaccionesApi.get('/api/v1/tesoreria/reporte/excel', {
      params: filtros,
      responseType: 'blob',
    }),
}

export const transaccionesService = { cajero, tesoreria }
