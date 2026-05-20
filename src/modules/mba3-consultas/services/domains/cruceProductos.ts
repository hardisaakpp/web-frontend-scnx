/**
 * Servicios de cruce de productos entre MBA3 y SAP
 */

import { mba3Api, API_BASE_URL } from '../config/axiosConfig'
import { createEnrichedError } from '../utils/errorHandler'
import type {
  IniciarCruceResponse,
  ProcesoEstadoSSE,
  ProcesoEstadoResponse,
  CruceProductosResponse,
  CruceResultadoPollResponse,
  SugerenciasResponse,
  EstadoSincronizacionResponse,
  SincronizarMaestrosResponse
} from '../../types'

export const cruceProductosService = {
  /**
   * Iniciar proceso de cruce de productos
   * 
   * @returns ID del proceso iniciado para seguimiento
   */
  async iniciarCruce(): Promise<IniciarCruceResponse> {
    try {
      const response = await mba3Api.post<IniciarCruceResponse>('/cruce-productos/iniciar')
      return response.data
    } catch (error: any) {
      console.error('❌ [iniciarCruce] Error al iniciar cruce:', error)
      throw createEnrichedError(error, 'No se pudo iniciar el cruce de productos')
    }
  },

  /**
   * Conectar al stream SSE para seguir el progreso en tiempo real
   * 
   * @param processId ID del proceso de cruce
   * @param onProgress Callback ejecutado en cada actualización de progreso
   * @param onError Callback ejecutado en caso de error
   * @param onComplete Callback ejecutado al finalizar
   * @param abortSignal Señal para cancelar la conexión
   * @returns Reader del stream o null si hay error
   */
  async seguirProgresoCruce(
    processId: string,
    onProgress: (data: ProcesoEstadoSSE) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    abortSignal?: AbortSignal
  ): Promise<ReadableStreamDefaultReader | null> {
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('No hay token de autenticación')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cruce-productos/stream/${processId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: abortSignal,
      })

      if (!response.ok) {
        throw new Error(`Error al conectar al stream: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No se pudo obtener el reader del stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      // Función para procesar el stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              if (onComplete) onComplete()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6)
                  const data: ProcesoEstadoSSE = JSON.parse(jsonStr)
                  onProgress(data)

                  // Si el proceso terminó, cerrar la conexión
                  if (data.status === 'completed' || data.status === 'error') {
                    reader.cancel()
                    if (onComplete) onComplete()
                    return reader
                  }
                } catch (parseError) {
                  console.warn('⚠️ [seguirProgresoCruce] Error al parsear evento SSE:', parseError, 'Line:', line)
                }
              } else if (line.startsWith('event: ')) {
                const eventType = line.slice(7)
                console.debug('📡 [SSE] Event type:', eventType)
              }
            }
          }
        } catch (streamError: any) {
          // Si es cancelación, no es un error real
          if (streamError.name === 'AbortError') {
            if (import.meta.env.DEV) {
              if (import.meta.env.DEV) console.log('📋 [seguirProgresoCruce] Stream cancelado por el usuario')
            }
            reader.cancel()
            return reader
          }
          throw streamError
        }

        return reader
      }

      await processStream()
      return reader
    } catch (error: any) {
      console.error('❌ [seguirProgresoCruce] Error en stream SSE:', error)
      if (onError) {
        onError(error instanceof Error ? error : new Error(error.message || 'Error desconocido'))
      } else {
        throw error
      }
      return null
    }
  },

  /**
   * Obtener resultado del cruce (polling alternativo al SSE)
   * 
   * @param processId ID del proceso
   * @returns Estado actual del proceso
   */
  async obtenerResultadoCruce(processId: string): Promise<CruceResultadoPollResponse> {
    try {
      const response = await mba3Api.get<CruceResultadoPollResponse>(
        `/cruce-productos/resultado/${processId}`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [obtenerResultadoCruce] Error al obtener resultado:', error)
      throw createEnrichedError(error, 'No se pudo obtener el resultado del cruce')
    }
  },

  /**
   * Realizar cruce de productos (método legacy - mantener para compatibilidad)
   * 
   * @returns Resultado del cruce
   */
  async realizarCruce(): Promise<CruceProductosResponse> {
    try {
      const response = await mba3Api.get<CruceProductosResponse>('/cruce-productos/realizar-cruce', {
        timeout: 120000 // 2 minutos
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [realizarCruce] Error al realizar cruce de productos:', error)
      throw createEnrichedError(error, 'No se pudo realizar el cruce de productos')
    }
  },

  /**
   * Obtener sugerencias de homologación
   * 
   * Calcula sugerencias para SKUs sin match.
   * Puede tardar varios minutos.
   * 
   * @returns Sugerencias de homologación
   */
  async obtenerSugerencias(): Promise<SugerenciasResponse> {
    try {
      const response = await mba3Api.get<SugerenciasResponse>('/cruce-productos/sugerencias', {
        timeout: 600000 // 10 minutos
      })
      return response.data
    } catch (error: any) {
      // Error 412: No hay cruce reciente
      if (error.response?.status === 412) {
        const errorData = error.response.data
        const message = errorData?.messsage || errorData?.message || 'No hay un cruce reciente disponible'
        const customError = new Error(message) as any
        customError.response = error.response
        throw customError
      }

      // Timeout específico
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⏱️ [obtenerSugerencias] Timeout - el proceso puede seguir ejecutándose en el servidor')
        const timeoutError = new Error('El cálculo de sugerencias está tardando más de lo esperado. El proceso puede seguir ejecutándose en el servidor. Intenta nuevamente en unos minutos.') as any
        timeoutError.isTimeout = true
        throw timeoutError
      }

      console.error('❌ [obtenerSugerencias] Error al obtener sugerencias:', error)
      throw createEnrichedError(error, 'No se pudieron obtener las sugerencias')
    }
  },

  /**
   * Obtener estado de sincronización de maestros
   * 
   * @returns Estado de sincronización
   */
  async obtenerEstadoSincronizacion(): Promise<EstadoSincronizacionResponse> {
    try {
      const response = await mba3Api.get<EstadoSincronizacionResponse>('/cruce-productos/estado-sincronizacion')
      return response.data
    } catch (error: any) {
      console.error('❌ [obtenerEstadoSincronizacion] Error al obtener estado:', error)
      throw createEnrichedError(error, 'No se pudo obtener el estado de sincronización')
    }
  },

  /**
   * Sincronizar maestros manualmente
   * 
   * Sincroniza datos maestros entre MBA3 y SAP.
   * Puede tardar varios minutos.
   * 
   * @returns Resultado de la sincronización
   */
  async sincronizarMaestros(): Promise<SincronizarMaestrosResponse> {
    try {
      const response = await mba3Api.post<SincronizarMaestrosResponse>('/cruce-productos/sincronizar-maestros', {}, {
        timeout: 600000 // 10 minutos
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [sincronizarMaestros] Error al sincronizar maestros:', error)
      throw createEnrichedError(error, 'No se pudo sincronizar los maestros')
    }
  },
}
