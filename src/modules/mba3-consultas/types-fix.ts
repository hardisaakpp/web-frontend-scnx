// Agregar a types.ts

export interface PedidoDetalle {
  pedido_detalle_id: string
  codigo_interno: string | null
  descripcion_sap: string | null
  marca: string | null
  codigo_barras: string | null
  pack: string | null
  costo_doc_sin_iva: number | null
  descuento_1: number | null
  pvp: number | null
  subtotal: number | null
  total: number | null
  bodega: number | null
  comentario?: string | null  // ⭐ Nueva propiedad
  tiendas: {
    tienda_id: string
    codigo: string
    nombre: string | null
    cantidad: number
  }[]
}

export interface PedidoCompleto {
  cabecera: any // Define según necesites
  detalles: PedidoDetalle[]
  respuesta_proveedor?: any
}
