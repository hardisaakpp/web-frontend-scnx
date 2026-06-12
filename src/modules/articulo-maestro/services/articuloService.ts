import { maestroHttp as apiMaestro } from '@/lib/http'
import type { Articulo, ArticuloFilters } from '../types'

// ─── Normalización de respuestas ─────────────────────────────────────────────
// Esta función mapea el objeto de respuesta a las claves camelCase que espera el front.

function normalizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj

    const normalized: any = { ...obj }

    // Mapeo manual de campos críticos conocidos por ser inconsistentes
    const criticalMappings: Record<string, string[]> = {
        uPrArq: ['U_PR_ARQ', 'u_pr_arq', 'u_Pr_Arq', 'UPrArq'],
        uGen: ['U_GEN', 'u_gen', 'u_Gen'],
        uCodColor: ['U_COD_COLOR', 'u_cod_color'],
        uCodColSecu: ['U_COD_COL_SECU', 'u_cod_col_secu'],
        uIxxColores: ['U_IXX_COLORES', 'u_ixx_colores'],
        uIxxMaterial: ['U_IXX_MATERIAL', 'u_ixx_material'],
        uIxxComposicion: ['U_IXX_COMPOSICION', 'u_ixx_composicion'],
        uIxxTalla: ['U_IXX_TALLA', 'u_ixx_talla'],
        uSxxSkuSinTalla: ['U_SXX_SKU_SIN_TALLA', 'u_sxx_sku_sin_talla'],
        uDescEcomm: ['U_DESC_ECOMM', 'u_desc_ecomm'],
        uNv1: ['U_NV1', 'u_nv1', 'UNv1'],
        uNv2: ['U_NV2', 'u_nv2', 'UNv2'],
        uNv3: ['U_NV3', 'u_nv3', 'UNv3'],
        uAtrMed: ['U_ATR_MED', 'u_atr_med'],
        uAtrUni: ['U_ATR_UNI', 'u_atr_uni'],
        uIxxPack: ['U_IXX_PACK', 'u_ixx_pack'],
        uCodPvr: ['U_COD_PVR', 'u_cod_pvr'],
        uMarca: ['U_MARCA', 'u_marca'],
        uNomColeccion: ['U_NOM_COLECCION', 'u_nom_coleccion'],
        uReposicion: ['U_REPOSICION', 'u_reposicion'],
        uOrigen: ['U_ORIGEN', 'u_origen'],
        uPOri: ['U_P_ORI', 'u_p_ori', 'uPOri'],
        uTipAbs: ['U_TIP_ABS', 'u_tip_abs'],
        uUnidadDespacho: ['U_UNIDAD_DESPACHO', 'u_unidad_despacho'],
        uDespIn: ['U_DESP_IN', 'u_desp_in'],
        uCanalVenta: ['U_CANAL_VENTA', 'u_canal_venta'],
        uRegion: ['U_REGION', 'u_region'],
        uLiq: ['U_LIQ', 'u_liq'],
    }

    Object.entries(criticalMappings).forEach(([camelKey, variations]) => {
        // Solo si la clave camelCase no tiene valor (o es null)
        if (normalized[camelKey] === undefined || normalized[camelKey] === null) {
            for (const v of variations) {
                // Probar variación exacta y también con posibles espacios al final (caso raro visto en logs)
                const val = obj[v] ?? obj[`${v} `]
                if (val !== undefined && val !== null) {
                    normalized[camelKey] = val
                    break
                }
            }
        }
    })

    return normalized
}

apiMaestro.interceptors.response.use((response) => {
    // Si la respuesta es un Blob (archivo), no normalizamos
    if (response.data instanceof Blob) {
        return response
    }

    const data: any = response.data
    if (data) {
        if (Array.isArray(data)) {
            response.data = data.map(normalizeObject)
        } else if (data.items && Array.isArray(data.items)) {
            // Nueva estructura: { total: number, items: Articulo[] }
            data.items = data.items.map(normalizeObject)
            response.data = normalizeObject(data)
        } else {
            response.data = normalizeObject(data)
        }
    }
    return response
})



export const articuloService = {
    // Listado paginado (el backend devuelve { total, items })
    getArticulos: async (filters: ArticuloFilters) => {
        const pageSize = filters.pageSize || 10
        const page = filters.page || 1
        const skip = (page - 1) * pageSize

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { page: _p, pageSize: _ps, ...otherFilters } = filters

        const response = await apiMaestro.get<{ total: number, items: Articulo[] }>('/api/v1/articulos/', {
            params: {
                ...otherFilters,
                skip,
                limit: pageSize
            }
        })

        const { items, total } = response.data

        return {
            data: items,
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
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
    getArticulosByEstado: async (estados: string[], limit: number = 500) => {
        const params = new URLSearchParams()
        params.append('skip', '0')
        params.append('limit', limit.toString())
        estados.forEach(e => params.append('estado', e))

        const response = await apiMaestro.get<{ total: number, items: Articulo[] }>('/api/v1/articulos/', { params })
        return response.data.items
    },

    // Descargar plantilla Excel para carga masiva
    downloadTemplate: async () => {
        const response = await apiMaestro.get('/api/v1/articulos/template/download', {
            responseType: 'blob',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*'
            }
        })

        // El interceptor ya asegura que si es un Blob lo deja pasar tal cual
        const blob = new Blob([response.data as BlobPart], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'plantilla_articulos.xlsx')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    // Carga masiva de artículos desde archivo Excel
    // El backend responde con éxito (200) o con error de validación (422)
    // En ambos casos normalizamos la respuesta para la vista.
    cargaMasiva: async (file: File): Promise<CargaMasivaResponse> => {
        const formData = new FormData()
        formData.append('file', file)
        try {
            const response = await apiMaestro.post<CargaMasivaResponse>('/api/v1/articulos/carga-masiva', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return response.data
        } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number, data?: any } }
            const data = axiosErr?.response?.data

            // FastAPI puede envolver la respuesta en { detail: { mensaje, errores } }
            // o el backend puede retornarla directamente como { mensaje, errores }
            const errorPayload = data?.errores ? data : data?.detail

            // Si el backend respondió con la estructura de validación "todo o nada"
            if (errorPayload && errorPayload.errores && Array.isArray(errorPayload.errores)) {
                return {
                    success: false,
                    mensaje: errorPayload.mensaje || 'Errores de validación en el archivo.',
                    total: errorPayload.errores.length,
                    success_count: 0,
                    error_count: errorPayload.errores.length,
                    errores: errorPayload.errores
                }
            }

            // Otro tipo de error (red, servidor, etc.)
            throw err
        }
    }
}

// ─── Tipos de Carga Masiva ──────────────────────────────────────────────────

export interface CargaMasivaErrorItem {
    fila: number
    item_code: string
    error: string
}

export interface CargaMasivaErrorResponse {
    mensaje: string
    errores: CargaMasivaErrorItem[]
}

export interface CargaMasivaResult {
    item_code: string
    success: boolean
    message: string | null
    id: number | null
}

export interface CargaMasivaResponse {
    success?: boolean
    mensaje?: string
    total: number
    success_count: number
    error_count: number
    results?: CargaMasivaResult[]
    errores?: CargaMasivaErrorItem[]
}

// ─── Servicio de Catálogos ───────────────────────────────────────────────────

export interface CatalogoItem {
    id: number
    codigo: string
    nombre: string
    activo?: boolean
}

export interface JerarquiaItem {
    id?: number
    nombre: string
}

export interface JerarquiaResponse {
    campo: string
    valores: JerarquiaItem[]
}

export interface CreateJerarquiaDto {
    seccion: string
    categoria: string
    linea: string
}

export interface UpdateJerarquiaDto {
    seccion?: string
    categoria?: string
    linea?: string
}

export interface CreateAtributoDto {
    linea: string
    atributo: string
}

export const catalogoService = {
    // Catálogos generales: TALLA, GENERO, COLOR, NEGOCIO, etc.
    // Si no se envía 'nombre', retorna la lista de catálogos disponibles.
    getGenerales: async (nombre?: string): Promise<CatalogoItem[]> => {
        const response = await apiMaestro.get<CatalogoItem[]>('/api/v1/catalogos/generales', {
            params: nombre ? { nombre } : {}
        })
        return response.data
    },

    createCatalogoGeneral: async (nombre_lista: string, item: Partial<CatalogoItem>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, activo, ...payload } = item
        const response = await apiMaestro.post(`/api/v1/catalogos/generales/${nombre_lista}`, payload)
        return response.data
    },

    updateCatalogoGeneral: async (id: number, item: Partial<CatalogoItem>) => {
        const response = await apiMaestro.patch(`/api/v1/catalogos/generales/${id}`, item)
        return response.data
    },

    deleteCatalogoGeneral: async (id: number) => {
        const response = await apiMaestro.delete(`/api/v1/catalogos/generales/${id}`)
        return response.data
    },

    // Secciones (nivel 1)
    getSecciones: async (): Promise<JerarquiaItem[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/jerarquias')
        return response.data.valores
    },

    // Categorias filtradas por sección
    getCategorias: async (seccion: string): Promise<JerarquiaItem[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/jerarquias', {
            params: { seccion }
        })
        return response.data.valores
    },

    // Líneas filtradas por categoría
    getLineas: async (categoria: string): Promise<JerarquiaItem[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/jerarquias', {
            params: { categoria }
        })
        return response.data.valores
    },

    // Líneas de atributos únicos (nivel 1 de cascada atributos)
    getLineasAtributo: async (): Promise<JerarquiaItem[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/atributos-unicos')
        return response.data.valores
    },

    // Atributos únicos filtrados por línea (nivel 2 de cascada atributos)
    getAtributos: async (linea: string): Promise<JerarquiaItem[]> => {
        const response = await apiMaestro.get<JerarquiaResponse>('/api/v1/catalogos/atributos-unicos', {
            params: { linea }
        })
        return response.data.valores
    },

    // CRUD Jerarquias
    createJerarquia: async (data: CreateJerarquiaDto) => {
        const response = await apiMaestro.post('/api/v1/catalogos/jerarquicos', data)
        return response.data
    },
    updateJerarquia: async (id: number, data: UpdateJerarquiaDto) => {
        const response = await apiMaestro.patch(`/api/v1/catalogos/jerarquicos/${id}`, data)
        return response.data
    },
    deleteJerarquia: async (id: number) => {
        const response = await apiMaestro.delete(`/api/v1/catalogos/jerarquicos/${id}`)
        return response.data
    },

    // CRUD Atributos (opcional si funciona igual)
    createAtributo: async (data: CreateAtributoDto) => {
        const response = await apiMaestro.post('/api/v1/catalogos/atributos-unicos', data)
        return response.data
    },
    updateAtributo: async (id: number, data: Partial<CreateAtributoDto>) => {
        const response = await apiMaestro.patch(`/api/v1/catalogos/atributos-unicos/${id}`, data)
        return response.data
    },
    deleteAtributo: async (id: number) => {
        const response = await apiMaestro.delete(`/api/v1/catalogos/atributos-unicos/${id}`)
        return response.data
    }
}

// ─── Servicio SAP (Migración) ────────────────────────────────────────────────

export interface SapNovedad {
    item_code: string
    motivo: string
}

export interface SapSyncResponse {
    success: boolean
    message: string
    tarea_id?: number
    novedades?: SapNovedad[]
    // Mantener compatibilidad temporal si es necesario, o limpiar
    total?: number
    success_count?: number
    error_count?: number
}

export interface SapTask {
    id: number
    nombre_tarea: string
    usuario: string
    estado: 'PROCESANDO' | 'FINALIZADO' | 'ERROR' | string
    total_items: number
    items_procesados: number
    fecha_creacion: string
    fecha_fin: string | null
    progreso_porcentaje: number
}

export const sapService = {
    // Enviar artículos a SAP (crear/sincronizar fondo)
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

    // Inteligente: el backend ahora maneja la lógica de fondo
    syncOrUpdate: async (itemCodes: string[]): Promise<SapSyncResponse> => {
        return await sapService.syncSelection(itemCodes)
    },

    // Obtener lista de tareas recientes (últimas 3 según el backend)
    getTasks: async (): Promise<SapTask[]> => {
        const response = await apiMaestro.get<SapTask[]>('/api/v1/sap/tasks')
        return response.data
    },

    // Obtener detalle de una tarea específica
    getTaskById: async (id: number): Promise<SapTask> => {
        const response = await apiMaestro.get<SapTask>(`/api/v1/sap/tasks/${id}`)
        return response.data
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

