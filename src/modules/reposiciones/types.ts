export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface CatalogoItem {
  itemCode: string;
  itemName: string;
  codeBars: string;
  onHand: number;
  totalBodega: number;
  disponibleBodega: number;
  sugerido: number;
  embalaje: number;
  marca: string;
  venta30Dias: number;
  diasInventario: number;
  clasificacionABC: string;
}

export interface CatalogoItemDetail extends CatalogoItem {
  unidad: string;
  categoria: string;
  linea: string;
  promedioVenta30Dias: number;
  promedioVenta90Dias: number;
  fechaUltimaVenta: string;
  ultimaFechaIngreso: string;
  diasUltimaFechaIngreso: number;
  totalTransitoria: number;
  totalSolicitud: number;
}

export interface CatalogoFilters {
  whsCode: string;
  pageNumber: number;
  pageSize: number;
  descripcion?: string;
  itemCode?: string;
  codeBars?: string;
  marca?: string;
  unidad?: string;
  categoria?: string;
  linea?: string;
}

export interface ListasFiltros {
  marcas: string[];
  categorias: string[];
  lineas: string[];
  unidades: string[];
}

export interface Almacen {
  whsCode: string;
  whsName: string;
}


export interface SaveItemRequest {
  toWhs: string;
  fromWhs: string;
  idUser: number;
  itemCode: string;
  quantity: number;
}

export interface UpdateCommentRequest {
  toWhs: string;
  idUser: number;
  itemCode: string;
  comment: string;
}

export interface SolicitudDetalle {
  itemCode: string;
  quantity: number;
  comment: string;
}

export interface HistorialCabecera {
  id: number;
  fromWhs: string;
  toWhs: string;
  fecha: string;
  integrado: boolean;
  cantidadArticulos: number;
}

export interface RepLog {
  bodyJson: string;
  respApi: string;
  fecha: string;
}
