export enum EstadoSincronizacion {
    BORRADOR = 'BORRADOR',
    PENDIENTE = 'PENDIENTE',
    EN_COLA = 'EN_COLA',
    SINCRONIZADO = 'SINCRONIZADO',
    ERROR = 'ERROR'
}

export enum AccionHistorial {
    INSERT = 'INSERT',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE'
}

export interface ImagenArticuloReferencia {
    id?: number
    codigoBase?: string
    posicion: 1 | 2 | 3
    esPrincipal: boolean
    nombreOriginal?: string | null
    urlFinal?: string | null
    nombreFinal?: string | null
    estado?: 'COMPLETADA' | 'ERROR'
    mensajeError?: string | null
    intentos?: number
}

export interface Articulo {
    id: number
    itemCode: string
    barCode: string | null
    uSxxSkuSinTalla: string | null
    uIxxTalla: string | null

    // Descripciones
    itemName: string
    foreignName: string | null
    uDescEcomm: string | null

    // Atributos de Producto
    uGen: string | null
    uCodColor: number | null
    uIxxColores: string | null
    uCodColSecu: number | null
    uColorSecu: string | null
    uIxxMaterial: string | null
    uIxxComposicion: string | null

    // Categorización
    uNv3: string | null
    uNv2: string | null
    uNv1: string | null
    uMarca: string | null
    uNomColeccion: string | null

    // Atributos Especiales
    uAtrMed: string | null
    uAtrUni: string | null
    uIxxPack: string | null

    // Logística y Origen
    uCodPvr: string | null
    uReposicion: string | null
    uOrigen: string | null
    uPOri: string | null
    leadTime: number | null
    minOrderQuantity: number | null
    uTipAbs: string | null
    uUnidadDespacho: number | null
    uDespIn: number | null

    // Venta y Geografía
    uCanalVenta: string | null
    uRegion: string | null

    // Precios y Costos
    uPrArq: number | null
    price: number | null
    uLiq: string | null

    // Configuración Técnica SAP
    itemsGroupCode: number | null
    uIxxMarca: string | null
    itemType: string | null
    costAccountingMethod: string | null
    glMethod: string | null
    manageStockByWarehouse: string | null
    purchaseItem: string | null
    salesItem: string | null
    inventoryItem: string | null

    // Impuestos
    vatLiable: string | null
    wtLiable: string | null
    indirectTax: string | null
    arTaxCode: string | null
    apTaxCode: string | null

    // Otros SAP
    manufacturer: number | null
    shipType: number | null
    planningSystem: string | null
    procurementMethod: string | null

    // Unidades
    inventoryUom: string | null
    purchaseUnit: string | null
    purchaseItemsPerUnit: number | null
    salesUnit: string | null
    salesItemsPerUnit: number | null

    // Campos Finales Extras
    uTipoBien: string | null

    // Nuevos campos (SIS-CCPYTD-00014)
    codigoAlterno?: string | null
    tieneCodigoProveedor?: boolean
    estadoProducto?: boolean
    aplicaEcommerce?: boolean
    aplicaPrecioMinorista?: boolean
    aplicaPrecioInternacional?: boolean
    manageBatchNumbers?: string | null
    imagenes?: ImagenArticuloReferencia[]

    // Estado y UI
    activo: boolean
    controlSap?: ArticuloControlSap
    isStructuralLocked?: boolean
}

// Nota: ArticuloControlSapResponse (backend) NO tiene alias_generator=to_camel
// en su model_config, a diferencia de ArticuloBase. Sus campos viajan tal cual
// están declarados en Python (snake_case): camelizarlos aquí desalinearía el
// tipo del payload real que entrega la API.
export interface ArticuloControlSap {
    id: number
    id_articulo: number
    estado: EstadoSincronizacion
    item_code_sap: string | null
    mensaje_sap: string | null
    mensaje_validacion: string | null
    fecha_sincronizacion: string | null
    intentos: number
    usuario_sincroniza: string | null
    fecha_ultimo_intento: string | null
    // Traducción de negocio de mensaje_sap (ver app.core.sap_error_catalog
    // en el backend): solo presente cuando estado === 'ERROR'. El usuario
    // de negocio no tiene acceso a SAP, así que mensaje_sap por sí solo
    // (a veces texto crudo del Service Layer, incluso en inglés) no le
    // dice qué hacer — mensaje_sap_amigable/accion_sugerida sí.
    mensaje_sap_amigable?: string | null
    accion_sugerida?: string | null
    // true cuando estado === 'ERROR' pero NO fue un rechazo de negocio de
    // SAP, sino que la operación no confirmó a tiempo (SAP tardó en
    // responder). Distingue "no hay nada que corregir, solo espera" de "hay
    // un dato que corregir" — ver app.core.sap_error_catalog.es_timeout.
    es_timeout_sap?: boolean
}

export interface ArticuloFilters {
    search?: string
    estado?: EstadoSincronizacion
    page?: number
    pageSize?: number
}

export interface ArticuloPagination {
    total: number
    page: number
    pageSize: number
    totalPages: number
}

// Campos que el backend bloquea en PATCH /articulos/{itemCode}:
// - Estructurales de por vida (ArticuloUpdate.bloquear_campos_estructurales,
//   ver CAMPOS_ESTRUCTURALES_BLOQUEADOS en app/schemas/articulo.py): rechaza
//   la petición completa con 422 si CUALQUIERA de estas claves está presente
//   en el body, sin importar si el valor enviado es igual al actual.
// - Campos que ni siquiera existen en ArticuloUpdate/ArticuloBase (id, activo,
//   imagenes, controlSap, isStructuralLocked): con extra="forbid" cualquiera
//   de estos también provoca un 422.
export type ArticuloPatchPayload = Partial<
    Omit<
        Articulo,
        | 'id'
        | 'itemCode'
        | 'codigoAlterno'
        | 'uMarca'
        | 'uIxxMarca'
        | 'uNv1'
        | 'uGen'
        | 'uIxxTalla'
        | 'itemsGroupCode'
        | 'itemType'
        | 'purchaseItem'
        | 'salesItem'
        | 'inventoryItem'
        | 'isStructuralLocked'
        | 'controlSap'
        | 'activo'
        | 'imagenes'
    >
>

