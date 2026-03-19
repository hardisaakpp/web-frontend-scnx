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

    // Unidades
    inventoryUom: string | null
    purchaseUnit: string | null
    purchaseItemsPerUnit: number | null
    salesUnit: string | null
    salesItemsPerUnit: number | null

    // Estado
    activo: boolean
    controlSap?: ArticuloControlSap
}

export interface ArticuloControlSap {
    id: number
    id_articulo: number
    estado: EstadoSincronizacion
    item_code_sap: string | null
    mensaje_sap: string | null
    fecha_sincronizacion: string | null
    intentos: number
    usuario_sincroniza: string | null
    fecha_ultimo_intento: string | null
}

export interface ArticuloFilters {
    search?: string
    estado?: EstadoSincronizacion
    linea?: string
    categoria?: string
    marca?: string
    page?: number
    pageSize?: number
}

export interface ArticuloPagination {
    total: number
    page: number
    pageSize: number
    totalPages: number
}
