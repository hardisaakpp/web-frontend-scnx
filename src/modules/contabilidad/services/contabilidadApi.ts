import axios from 'axios'
import type { Transaccion, Balance } from '../types'

const API_URL = '/api/contabilidad'

export const contabilidadService = {
  // Obtener todas las transacciones
  async getTransacciones(): Promise<Transaccion[]> {
    const response = await axios.get<Transaccion[]>(`${API_URL}/transacciones`)
    return response.data
  },

  // Obtener una transacción por ID
  async getTransaccion(id: number): Promise<Transaccion> {
    const response = await axios.get<Transaccion>(`${API_URL}/transacciones/${id}`)
    return response.data
  },

  // Crear nueva transacción
  async createTransaccion(data: Omit<Transaccion, 'id'>): Promise<Transaccion> {
    const response = await axios.post<Transaccion>(`${API_URL}/transacciones`, data)
    return response.data
  },

  // Actualizar transacción
  async updateTransaccion(id: number, data: Partial<Transaccion>): Promise<Transaccion> {
    const response = await axios.put<Transaccion>(`${API_URL}/transacciones/${id}`, data)
    return response.data
  },

  // Eliminar transacción
  async deleteTransaccion(id: number): Promise<void> {
    await axios.delete(`${API_URL}/transacciones/${id}`)
  },

  // Obtener balance actual
  async getBalance(): Promise<Balance> {
    const response = await axios.get<Balance>(`${API_URL}/balance`)
    return response.data
  },

  // Exportar transacciones
  async exportTransacciones(formato: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    const response = await axios.get<Blob>(`${API_URL}/export`, {
      params: { formato },
      responseType: 'blob'
    })
    return response.data
  }
}
