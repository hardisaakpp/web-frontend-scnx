/**
 * Servicios de migración de datos desde MBA3
 */

import { mba3Api } from '../config/axiosConfig'
import type { ProcesoResponse } from '../../types'

export const migracionService = {
  /**
   * Migrar datos desde MBA3 con reintentos automáticos
   * 
   * Incluye lógica de retry para manejar errores 500 del backend
   * que pueden ocurrir durante la inicialización.
   * 
   * @param retries Número de reintentos adicionales (default: 2, total 3 intentos)
   * @returns Resultado del proceso de migración
   */
  async migrar(retries: number = 2): Promise<ProcesoResponse> {
    let lastError: any = null

    // Intentar hasta (retries + 1) veces (retries = número de reintentos adicionales)
    // Por defecto: 3 intentos totales (intento 0, 1, 2)
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Si no es el primer intento, agregar un delay progresivo para dar tiempo al backend
        if (attempt > 0) {
          const delay = attempt * 2000 // Delay progresivo: 2s, 4s, 6s...
          console.warn(`[migrar] Reintentando migración (intento ${attempt + 1}/${retries + 1}) después de ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        // Timeout extendido a 120 segundos para operaciones de migración largas
        // que incluyen consultas a MBA3, SAP y guardado en base de datos
        const response = await mba3Api.get<ProcesoResponse>('/migrar/completo', {
          timeout: 120000 // 2 minutos
        })
        return response.data
      } catch (error: any) {
        lastError = error

        // Solo reintentar si es un error 500 y no es el último intento
        const is500Error = error.response?.status === 500
        const isLastAttempt = attempt === retries

        if (is500Error && !isLastAttempt) {
          console.warn(`[migrar] Error 500 en intento ${attempt + 1}/${retries + 1}. El backend puede necesitar inicialización. Reintentando...`)
          continue // Continuar al siguiente intento
        }

        // Si no es un 500 o es el último intento, lanzar el error
        throw error
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw lastError
  },
}
