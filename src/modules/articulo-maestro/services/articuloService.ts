import axios from 'axios'
import type { Articulo, ArticuloFilters } from '../types'

// Instancia separada para el API del Maestro (puerto 8001 vía proxy)
const apiMaestro = axios.create({
    baseURL: '/maestro-api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
})

// Inyectar token de sesión + headers de auditoría en cada request
apiMaestro.interceptors.request.use((config) => {
    config.headers = config.headers ?? {}

    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    // Intentar obtener el usuario logueado desde localStorage
    try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            config.headers['X-User'] = user.userName || 'desconocido'
        } else {
            config.headers['X-User'] = 'desconocido'
        }
    } catch {
        config.headers['X-User'] = 'desconocido'
    }

    // Origen fijo para operaciones desde la aplicación web
    config.headers['X-Origin'] = 'WEB_APP'

    return config
})

export const articuloService = {
    // Listado completo (el backend devuelve un array directo)
    getArticulos: async (filters: ArticuloFilters) => {
        const response = await apiMaestro.get<Articulo[]>('/api/v1/articulos/', {
            params: filters
        })
        return {
            data: response.data,
            pagination: {
                total: response.data.length,
                page: filters.page || 1,
                pageSize: filters.pageSize || 10,
                totalPages: Math.ceil(response.data.length / (filters.pageSize || 10))
            }
        }
    },

    // Obtener un artículo por ItemCode (sin trailing slash para evitar redireccionamiento 307)
    getArticuloByCode: async (itemCode: string) => {
        const response = await apiMaestro.get<Articulo>(`/api/v1/articulos/${itemCode}`)
        return response.data
    },

    // Crear nuevo artículo (POST)
    createArticulo: async (data: Record<string, unknown>) => {
        const response = await apiMaestro.post<Articulo>('/api/v1/articulos/', data)
        return response.data
    },

    // Modificar artículo existente (PATCH — sin trailing slash para evitar 307)
    updateArticulo: async (itemCode: string, data: Record<string, unknown>) => {
        const response = await apiMaestro.patch<Articulo>(`/api/v1/articulos/${itemCode}`, data)
        return response.data
    },

    // Eliminar artículo (DELETE — sin trailing slash para evitar 307)
    deleteArticulo: async (itemCode: string) => {
        const response = await apiMaestro.delete(`/api/v1/articulos/${itemCode}`)
        return response.data
    },

    // Sincronizar con SAP (sin trailing slash)
    sincronizarConSap: async (itemCode: string) => {
        const response = await apiMaestro.post<{ status: string, message: string }>(`/api/v1/articulos/${itemCode}/sincronizar`)
        return response.data
    },

    // Obtener artículos filtrados por estado (para migración)
    getArticulosByEstado: async (estados: string[], limit: number = 100) => {
        const params = new URLSearchParams()
        params.append('skip', '0')
        params.append('limit', limit.toString())
        estados.forEach(e => params.append('estado', e))

        const response = await apiMaestro.get<Articulo[]>('/api/v1/articulos/', { params })
        return response.data
    },

    // Descargar plantilla Excel para carga masiva
    downloadTemplate: async () => {
        const response = await apiMaestro.get('/api/v1/articulos/template/download', {
            responseType: 'blob'
        })
        // Crear enlace de descarga temporal
        const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'plantilla_articulos.xlsx')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    // Carga masiva de artículos desde archivo Excel
    cargaMasiva: async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        const response = await apiMaestro.post<CargaMasivaResponse>('/api/v1/articulos/carga-masiva', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    }
}

export interface CargaMasivaResult {
    item_code: string
    success: boolean
    message: string | null
    id: number | null
}

export interface CargaMasivaResponse {
    total: number
    success_count: number
    error_count: number
    results: CargaMasivaResult[]
}

// ─── Servicio de Catálogos ───────────────────────────────────────────────────

export interface CatalogoItem {
    id: number
    codigo: string
    nombre: string
    activo: boolean
}

export interface JerarquiaResponse {
    campo: string
    valores: string[]
}

export const catalogoService = {
    // Catálogos generales: TALLA, GENERO, COLOR, NEGOCIO, etc.
    getGenerales: async (nombre: string): Promise<CatalogoItem[]> => {
        const response = await apiMaestro.get<CatalogoItem[]>('/api/v1/catalogos/generales', {
            params: { nombre }
        })
        return response.data
    },

    // Secciones (nivel 1)
    getSecciones: async (): Promise<string[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/jerarquias')
        return response.data.valores
    },

    // Categorias filtradas por sección
    getCategorias: async (seccion: string): Promise<string[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/jerarquias', {
            params: { seccion }
        })
        return response.data.valores
    },

    // Líneas filtradas por categoría
    getLineas: async (categoria: string): Promise<string[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/jerarquias', {
            params: { categoria }
        })
        return response.data.valores
    },

    // Líneas de atributos únicos (nivel 1 de cascada atributos)
    getLineasAtributo: async (): Promise<string[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/atributos-unicos')
        return response.data.valores
    },

    // Atributos únicos filtrados por línea (nivel 2 de cascada atributos)
    getAtributos: async (linea: string): Promise<string[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/atributos-unicos', {
            params: { linea }
        })
        return response.data.valores
    }
}

// ─── Servicio SAP (Migración) ────────────────────────────────────────────────

export interface SapSyncDetail {
    item_code: string
    status: string
    message: string
}

export interface SapSyncResponse {
    total: number
    success: number
    error: number
    details: SapSyncDetail[]
    success_bool?: boolean
}

export const sapService = {
    // Enviar artículos a SAP (crear)
    syncSelection: async (itemCodes: string[]): Promise<SapSyncResponse> => {
        const response = await apiMaestro.post<SapSyncResponse>('/api/v1/sap/sync-selection', {
            item_codes: itemCodes
        })
        return response.data
    },

    // Importar artículos desde SAP al sistema local
    pullFromSap: async (itemCodes: string[]): Promise<SapSyncResponse> => {
        const response = await apiMaestro.post<SapSyncResponse>('/api/v1/sap/pull-from-sap', {
            item_codes: itemCodes
        })
        return response.data
    },

    // Actualizar artículos en SAP con datos locales
    updateInSap: async (itemCodes: string[]): Promise<SapSyncResponse> => {
        const response = await apiMaestro.patch<SapSyncResponse>('/api/v1/sap/update-in-sap', {
            item_codes: itemCodes
        })
        return response.data
    },

    // Eliminar artículos de SAP
    deleteFromSap: async (itemCodes: string[]): Promise<SapSyncResponse> => {
        const response = await apiMaestro.request<SapSyncResponse>({
            url: '/api/v1/sap/delete-from-sap',
            method: 'DELETE',
            data: { item_codes: itemCodes }
        } as any)
        return response.data
    },

    // Inteligente: intenta crear, si ya existe en SAP lo actualiza
    syncOrUpdate: async (itemCodes: string[]): Promise<SapSyncResponse> => {
        // Primero intentar crear
        const createResult = await apiMaestro.post<SapSyncResponse>('/api/v1/sap/sync-selection', {
            item_codes: itemCodes
        })
        const result = createResult.data

        // Recoger los que fallaron por "already exists" para actualizar
        const toUpdate = result.details
            .filter(d => d.status === 'Error' && d.message.toLowerCase().includes('already exists'))
            .map(d => d.item_code)

        if (toUpdate.length === 0) return result

        // Actualizar los que ya existen
        const updateResult = await apiMaestro.patch<SapSyncResponse>('/api/v1/sap/update-in-sap', {
            item_codes: toUpdate
        })

        // Combinar resultados
        const combined: SapSyncResponse = {
            total: result.total,
            success: 0,
            error: 0,
            details: result.details.map(d => {
                if (toUpdate.includes(d.item_code)) {
                    const updated = updateResult.data.details.find(u => u.item_code === d.item_code)
                    return updated || d
                }
                return d
            })
        }
        combined.success = combined.details.filter(d => d.status !== 'Error').length
        combined.error = combined.details.filter(d => d.status === 'Error').length
        return combined
    }
}

// ─── Servicio de Historial (Auditoría) ──────────────────────────────────────

export interface HistorialLocalRecord {
    id: number
    id_articulo: number
    accion: 'INSERT' | 'UPDATE' | 'DELETE'
    usuario: string
    fecha: string | null
    ip_origen: string | null
    origen: string
    item_code: string
}

export interface HistorialSapRecord {
    id: number
    intento_numero: number
    accion_sap: string
    estado_resultado: 'SUCCESS' | 'ERROR'
    mensaje_sap: string
    usuario_sincroniza: string
    fecha: string | null
    item_code: string
}

export interface HistorialResponse<T> {
    page: number
    limit: number
    total: number
    data: T[]
}

export const historialService = {
    // Obtener historial local (CRUD)
    getLocalHistory: async (page: number = 1, limit: number = 10, itemCode?: string) => {
        const params: any = { page, limit }
        if (itemCode) params.item_code = itemCode
        const response = await apiMaestro.get<HistorialResponse<HistorialLocalRecord>>('/api/v1/historial/local', { params })
        return response.data
    },

    // Obtener historial de sincronización SAP
    getSapHistory: async (page: number = 1, limit: number = 10, itemCode?: string) => {
        const params: any = { page, limit }
        if (itemCode) params.item_code = itemCode
        const response = await apiMaestro.get<HistorialResponse<HistorialSapRecord>>('/api/v1/historial/sap', { params })
        return response.data
    }
}

