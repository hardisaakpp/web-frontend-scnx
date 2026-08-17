import { maestroHttp as apiMaestro } from '@/lib/http'
import type {
    Articulo,
    ArticuloFilters,
    ImagenArticuloReferencia
} from '../types'
export type { ImagenArticuloReferencia } from '../types'

// ─── Normalización de respuestas ─────────────────────────────────────────────
// Esta función mapea el objeto de respuesta a las claves camelCase que espera el front.

function normalizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj

    const normalized: any = { ...obj }

    // Mapeo manual de campos críticos conocidos por ser inconsistentes
    const criticalMappings: Record<string, string[]> = {
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
        codigoAlterno: ['CODIGO_ALTERNO', 'codigo_alterno', 'CodigoAlterno'],
        tieneCodigoProveedor: ['HAS_SUPPLIER_BARCODE', 'has_supplier_barcode', 'TieneCodigoProveedor'],
        estadoProducto: ['PRODUCT_STATUS', 'product_status', 'EstadoProducto'],
        aplicaEcommerce: ['ECOMMERCE_APPLICABLE', 'ecommerce_applicable', 'AplicaEcommerce'],
        aplicaPrecioMinorista: ['APLICA_PRECIO_MINORISTA', 'aplica_precio_minorista', 'AplicaPrecioMinorista'],
        aplicaPrecioInternacional: ['APLICA_PRECIO_INTERNACIONAL', 'aplica_precio_internacional', 'AplicaPrecioInternacional'],
        manageBatchNumbers: [
            'MAN_BTCH_NUM',
            'man_btch_num',
            'ManBtchNum',
            'ManageBatchNumbers'
        ],
        isStructuralLocked: ['IS_STRUCTURAL_LOCKED', 'is_structural_locked'],
        uPrArq: [
            'U_PR_ARQ',
            'u_pr_arq',
            'u_Pr_Arq',
            'UPrArq',
            'CostoArranque',
            'costoArranque'
        ]
    }

    Object.entries(criticalMappings).forEach(([camelKey, variations]) => {
        // Solo si la clave camelCase no tiene valor (o es null)
        if (normalized[camelKey] == null) {
            for (const v of variations) {
                // Probar variación exacta y también con posibles espacios al final (caso raro visto en logs)
                const val = obj[v] ?? obj[`${v} `]
                if (val != null) {
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
        } else if (Array.isArray(data?.items)) {
            // Nueva estructura: { total: number, items: Articulo[] }
            data.items = data.items.map(normalizeObject)
            response.data = normalizeObject(data)
        } else {
            response.data = normalizeObject(data)
        }
    }
    return response
})

export type TipoCargaMasiva = 'crear' | 'actualizar'
export type EstadoImportacion =
    | 'ESPERANDO'
    | 'PROCESANDO'
    | 'COMPLETADO'
    | 'COMPLETADO_CON_ERRORES'
    | 'ERROR'

export interface ImportacionFila {
    id: number
    numeroFila: number
    itemCode?: string | null
    estado: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR'
    campoError?: string | null
    valorRecibido?: string | null
    codigoError?: string | null
    mensaje?: string | null
}

export interface ImportacionGrupo {
    id: number
    grupoProducto: string
    codigoBase?: string | null
    estado: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR'
    mensajeError?: string | null
    intentos: number
    filas: ImportacionFila[]
    imagenes: ImagenArticuloReferencia[]
}

export interface ImportacionAceptada {
    jobId: number
    estado: EstadoImportacion
    totalFilas: number
    totalGrupos: number
}

export interface ImportacionTrabajo {
    id: number
    nombreArchivo: string
    hashArchivo: string
    tipo: 'CREAR' | 'ACTUALIZAR'
    usuario: string
    estado: EstadoImportacion
    totalGrupos: number
    gruposProcesados: number
    totalFilas: number
    filasCorrectas: number
    filasError: number
    fechaInicio?: string | null
    fechaFin?: string | null
    grupos: ImportacionGrupo[]
}

export interface ImportacionError {
    tipo: 'FILA' | 'IMAGEN'
    grupoProducto: string
    numeroFila?: number | null
    itemCode?: string | null
    codigoBase?: string | null
    posicion?: number | null
    campoError?: string | null
    valorRecibido?: string | null
    codigoError?: string | null
    mensaje: string
}

// RF-002: respuesta de POST /articulos/{item_code}/promover-alterno.
// Snake_case a propósito: replica ArticuloPromoverAlternoResponse del backend
// (mismo criterio que SapSyncTareaResponse/SapTask, sin alias camelCase).
export interface PromoverAlternoResponse {
    success: boolean
    message: string
    item_code_anterior: string
    item_code_nuevo: string
    tarea_id: number
}

// RF-004: respuesta multi-estado de DELETE /articulos/borrado-masivo.
// Snake_case a propósito: el endpoint no usa alias_generator=to_camel (no es
// un ArticuloResponse), así que el body llega tal cual estas claves.
export interface ArticuloBulkDeleteError {
    item_code: string
    status_code: number
    detail: string
}

export interface ArticuloBulkDeleteResponse {
    success: boolean
    total: number
    success_count: number
    error_count: number
    eliminados: string[]
    errores: ArticuloBulkDeleteError[]
}

export const articuloService = {
    // Listado paginado (el backend devuelve { total, items }). Acepta un
    // AbortSignal para que el store pueda cancelar peticiones en vuelo cuando
    // el usuario dispara una búsqueda o paginación más reciente.
    getArticulos: async (filters: ArticuloFilters, signal?: AbortSignal) => {
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
            },
            signal
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

    // Eliminar (inactivar) múltiples artículos. Respuesta multi-estado: un
    // item_code bloqueado (ej. semáforo SAP en EN_COLA) no oculta ni detiene
    // el resultado de los demás (ver delete_articulos_bulk en el backend).
    eliminarArticulosBulk: async (itemCodes: string[]): Promise<ArticuloBulkDeleteResponse> => {
        const response = await apiMaestro.request<ArticuloBulkDeleteResponse>({
            url: '/api/v1/articulos/borrado-masivo',
            method: 'DELETE',
            data: { item_codes: itemCodes }
        })
        return response.data
    },

    // RF-002: Promover el Código Alterno del artículo a su ItemCode principal
    promoverCodigoAlterno: async (itemCode: string): Promise<PromoverAlternoResponse> => {
        const response = await apiMaestro.post<PromoverAlternoResponse>(
            `/api/v1/articulos/${itemCode}/promover-alterno`
        )
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
    downloadTemplate: async (tipo: TipoCargaMasiva) => {
        const response = await apiMaestro.get('/api/v1/articulos/template/download', {
            params: { tipo },
            responseType: 'blob',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*'
            }
        })

        // El interceptor ya asegura que si es un Blob lo deja pasar tal cual
        const blob = new Blob([response.data as BlobPart], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = globalThis.URL.createObjectURL(blob)
        const link = document.createElement('a')
        const contentDisposition = response.headers['content-disposition']
        const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/)
        const filename = filenameMatch?.[1] ?? `plantilla_articulos_${tipo}.xlsx`
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        globalThis.URL.revokeObjectURL(url)
    },

    crearImportacion: async (
        file: File,
        tipo: TipoCargaMasiva,
        zipImagenes?: File | null
    ): Promise<ImportacionAceptada> => {
        const formData = new FormData()
        formData.append('file', file)
        if (zipImagenes) {
            formData.append('zip_imagenes', zipImagenes)
        }
        const response = await apiMaestro.post<ImportacionAceptada>(
            '/api/v1/articulos/importaciones',
            formData,
            {
                params: { tipo },
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        )
        return response.data
    },

    getImportacion: async (jobId: number): Promise<ImportacionTrabajo> => {
        const response = await apiMaestro.get<ImportacionTrabajo>(
            `/api/v1/articulos/importaciones/${jobId}`
        )
        return response.data
    },

    getErroresImportacion: async (
        jobId: number
    ): Promise<ImportacionError[]> => {
        const response = await apiMaestro.get<{ items: ImportacionError[] }>(
            `/api/v1/articulos/importaciones/${jobId}/errores`
        )
        return response.data.items
    },

    reintentarImportacion: async (
        jobId: number
    ): Promise<ImportacionAceptada> => {
        const response = await apiMaestro.post<ImportacionAceptada>(
            `/api/v1/articulos/importaciones/${jobId}/reintentar`
        )
        return response.data
    },

    descargarErroresImportacion: async (jobId: number): Promise<void> => {
        const response = await apiMaestro.get(
            `/api/v1/articulos/importaciones/${jobId}/errores.xlsx`,
            { responseType: 'blob' }
        )
        const blob = new Blob([response.data as BlobPart], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = globalThis.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `errores_importacion_${jobId}.xlsx`
        document.body.appendChild(link)
        link.click()
        link.remove()
        globalThis.URL.revokeObjectURL(url)
    },

    // Copia corregible: mismas columnas de la plantilla original + columna
    // final "Mensaje de Error", solo con las filas que fallaron. Pensada
    // para corregir directamente sobre este archivo y volver a subirlo.
    descargarErroresPlantillaImportacion: async (jobId: number): Promise<void> => {
        const response = await apiMaestro.get(
            `/api/v1/articulos/importaciones/${jobId}/errores-plantilla.xlsx`,
            { responseType: 'blob' }
        )
        const blob = new Blob([response.data as BlobPart], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = globalThis.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `correcciones_importacion_${jobId}.xlsx`
        document.body.appendChild(link)
        link.click()
        link.remove()
        globalThis.URL.revokeObjectURL(url)
    },

    // Subir (o reemplazar) la imagen de una posición (1=Principal, 2/3=Secundarias).
    // Subida síncrona a MinIO: la respuesta ya trae la urlFinal pública.
    subirImagenArticulo: async (
        itemCode: string,
        posicion: 1 | 2 | 3,
        archivo: File
    ): Promise<ImagenArticuloReferencia> => {
        const formData = new FormData()
        formData.append('archivo', archivo)
        const response = await apiMaestro.post<ImagenArticuloReferencia>(
            `/api/v1/articulos/${itemCode}/imagenes/${posicion}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        return response.data
    },

    // Eliminar la imagen de una posición.
    eliminarImagenArticulo: async (
        itemCode: string,
        posicion: 1 | 2 | 3
    ): Promise<void> => {
        await apiMaestro.delete(
            `/api/v1/articulos/${itemCode}/imagenes/${posicion}`
        )
    },

    // Descargar reporte diario de artículos
    descargarReporteDiario: async (fecha?: string) => {
        const response = await apiMaestro.get('/api/v1/articulos/reporte-diario', {
            params: fecha ? { fecha } : {},
            responseType: 'blob',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*'
            }
        })

        const blob = new Blob([response.data as BlobPart], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = globalThis.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `reporte_diario_${fecha || new Date().toISOString().split('T')[0]}.xlsx`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        globalThis.URL.revokeObjectURL(url)
    },

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
    // Compatibilidad con estructura de estadísticas antigua
    total?: number
    success_count?: number
    error_count?: number
    error?: number
    details?: Array<{
        item_code: string
        status: 'Success' | 'Error'
        message: string
    }>
}

export interface SapTask {
    id: number
    nombre_tarea: string
    usuario: string
    estado: string
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
    },

    // Obtener catálogo de listas de precios
    getPriceLists: async (): Promise<Array<{ id: number; name: string; nombre: string }>> => {
        const response = await apiMaestro.get<Array<{ id: number; name: string }>>('/api/v1/sap/price-lists')
        return response.data.map(list => ({ ...list, nombre: list.name }))
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

