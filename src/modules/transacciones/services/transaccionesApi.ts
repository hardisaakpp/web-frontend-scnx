import { transaccionesApi } from './config/axiosConfig'
import type { FiltrosCajero, FiltrosTesoreria, ReservarTransaccionRequest, RegistrarEventoCajeroRequest } from '../types'

const almacenes = {
  obtener: () => transaccionesApi.get('/api/v1/almacenes'),
}

const cuentas = {
  obtener: () => transaccionesApi.get('/api/v1/tesoreria/cuentas'),
}

const cuentasCajero = {
  obtener: () => transaccionesApi.get('/api/v1/cajero/cuentas'),
}

const cajero = {
  obtener: (filtros: FiltrosCajero) =>
    transaccionesApi.get('/api/v1/cajero/transacciones', { params: filtros }),

  reservar: (id: number, payload: ReservarTransaccionRequest) =>
    transaccionesApi.post(`/api/v1/cajero/transacciones/${id}/reservar`, payload),

  registrarEvento: (payload: RegistrarEventoCajeroRequest) =>
    transaccionesApi.post('/api/v1/cajero/eventos', payload),
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

const historialReserva = {
  obtener: (filtros: FiltrosTesoreria) =>
    transaccionesApi.get('/api/v1/cajero/historial', { params: filtros }),
}

export const transaccionesService = { almacenes, cuentas, cuentasCajero, cajero, tesoreria, historialReserva }
