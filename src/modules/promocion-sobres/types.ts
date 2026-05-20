export interface ApiResponse<T> {
  success: boolean
  message?: string | null
  data?: T | null
  error_code?: string | null
  details?: unknown
  correlation_id?: string | null
}

export interface BeneficiarioDto {
  existe: boolean
  identificacion: string
  nombre: string
  cupoDisponible: number
  entregado: boolean
  puedeEscanear: boolean
  /** Texto que debe coincidir con lo que lee el lector (según BD). */
  codigoValidacion?: string | null
}

export interface RegistrarEntregaRequest {
  identificacion: string
  codigoEscaneado: string
}

export interface EntregaRegistradaDto {
  exitoso: boolean
  identificacion: string
  nombre: string
  cupoDisponible: number
  fechaEntrega?: string | null
  codigoValidacion?: string | null
  /** Si el API lo envía, tiene prioridad sobre deducir desde `exitoso`. */
  entregado?: boolean | null
  puedeEscanear?: boolean | null
}

export type PromocionSobresErrorCode =
  | 'NO_ENCONTRADO'
  | 'YA_ENTREGADO'
  | 'ESCANEO_DUPLICADO'
  | 'CODIGO_INVALIDO'
  | 'IDENTIFICACION_INVALIDA'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'

export interface UiError {
  code: PromocionSobresErrorCode | 'NETWORK' | 'TIMEOUT' | 'SERVER' | 'BAD_REQUEST' | 'FORBIDDEN'
  message: string
  correlationId?: string
}

export interface BeneficiarioEntregadoItemDto {
  identificacion: string
  nombre: string
  entregado: 0 | 1
  fechaModificacion?: string | null
  modificadoPor?: string | null
}

export interface DatabaseOrigenDto {
  dataSource: string
  database: string
  schema: string
  tablaBeneficiarios: string
}

export interface EntregadosMonitoreoDto {
  totalEntregados: number
  totalPendientes: number
  totalBeneficiarios: number
  consultadoEn: string
  origen?: DatabaseOrigenDto
  beneficiarios: BeneficiarioEntregadoItemDto[]
}
