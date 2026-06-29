import { pygHttp as pygApi } from '@/lib/http'

function shouldUseCompatApiFallback(): boolean {
  const baseUrl = String(import.meta.env.VITE_PYG_API_URL || '/pyg-api').trim()
  const proxyPrefix =
    'VITE_PYG_PROXY_PREFIX' in import.meta.env ? String(import.meta.env.VITE_PYG_PROXY_PREFIX ?? '').trim() : '/api'
  // If dev proxy rewrites /pyg-api -> /api (default), /uploads already reaches /api/uploads.
  // Compat fallback /api/uploads is only needed when proxy prefix is explicitly empty.
  return baseUrl === '/pyg-api' && proxyPrefix === ''
}

export interface UploadBatchSummary {
  id: number
  fileName: string
  uploadedBy: string
  uploadedAt: string
  year: number
  month: number
  status: string
  totalRows: number
  validRows: number
  errorRows: number
}

export interface UploadBatchDetailDto extends UploadBatchSummary {
  errorLogAvailable: boolean
  originalFileAvailable: boolean
}

export interface UploadRowHistoryItemDto {
  id: number
  uploadBatchId: number
  sheetName?: string
  rowNumber?: number
  year?: number
  month?: number
  empresa?: string
  codigoEmpresa?: string
  nombreEmpresa?: string
  marca?: string
  codigoBodega?: string
  percentMatriz?: number
  percentGeneral?: number
  isValid?: boolean
  errorMessage?: string
  createdAt?: string
}

export interface UploadRowHistoryPageDto {
  batchId: number
  total: number
  page: number
  pageSize: number
  totalPercentMatriz?: number
  totalPercentGeneral?: number
  items: UploadRowHistoryItemDto[]
}

export interface UploadRowsQueryParams {
  page?: number
  pageSize?: number
  sheetName?: string
  isValid?: boolean
}

export interface UploadResult {
  success: boolean
  message: string
  batchId: number
  year: number
  month: number
  totalRows: number
  validRows: number
  errorRows: number
  errors: string[]
}

export interface UploadsQueryParams {
  from?: string
  to?: string
}

export interface PeriodValidationSettingsDto {
  skipWritePeriodValidation: boolean
  skipWritePeriodValidationUntilUtc?: string | null
  adPassword?: string
}

function resolvePeriodValidationPath(): string {
  const raw = String(import.meta.env.VITE_PYG_PERIOD_VALIDATION_PATH || '/settings/period-validation').trim()
  if (!raw) return '/settings/period-validation'
  return raw.startsWith('/') ? raw : `/${raw}`
}

export interface MatrizRow {
  id: number
  year: number
  month: number
  empresa: string
  marca: string
  percentMatriz: number
  /** Auditoría (API camelCase); presentación UI: Fecha ingreso */
  createdAt?: string
  /** Presentación UI: Última actualización */
  updatedAt?: string
  /** Presentación UI: Usuario últ. act. */
  lastUpdatedBy?: string
}

export interface BodegaRow {
  id: number
  year: number
  month: number
  empresa: string
  marca: string
  codigoBodega: string
  percentGeneral: number
  createdAt?: string
  updatedAt?: string
  lastUpdatedBy?: string
}

export interface MatrizUpdatePayload {
  year: number
  month: number
  empresa: string
  marca: string
  percentMatriz: number
}

export interface BodegaUpdatePayload {
  year: number
  month: number
  empresa: string
  marca: string
  codigoBodega: string
  percentGeneral: number
}

export async function uploadExcel(file: File): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await pygApi.post<UploadResult>('/uploads/excel', form)
  return data
}

export async function getUploads(params?: UploadsQueryParams): Promise<UploadBatchSummary[]> {
  const { data } = await pygApi.get<UploadBatchSummary[]>('/uploads', { params })
  return data
}

export async function getUploadDetail(id: number): Promise<UploadBatchDetailDto> {
  const { data } = await pygApi.get<UploadBatchDetailDto>(`/uploads/${id}`)
  return data
}

export async function getUploadRows(id: number, params: UploadRowsQueryParams): Promise<UploadRowHistoryPageDto> {
  try {
    const { data } = await pygApi.get<UploadRowHistoryPageDto>(`/uploads/${id}/rows`, { params })
    return data
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status !== 404 || !shouldUseCompatApiFallback()) throw error
    // Compat path when Vite proxy forwards /pyg-api/* without /api prefix.
    const { data } = await pygApi.get<UploadRowHistoryPageDto>(`/api/uploads/${id}/rows`, { params })
    return data
  }
}

export async function downloadTemplate(): Promise<Blob> {
  const { data } = await pygApi.get('/uploads/template', { responseType: 'blob' })
  return data as Blob
}

export async function downloadOriginalFile(batchId: number): Promise<Blob> {
  const { data } = await pygApi.get(`/uploads/${batchId}/file`, { responseType: 'blob' })
  return data as Blob
}

export async function downloadErrors(batchId: number): Promise<Blob> {
  try {
    const { data } = await pygApi.get(`/uploads/${batchId}/errors`, { responseType: 'blob' })
    return data as Blob
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status !== 404 || !shouldUseCompatApiFallback()) throw error
    // Compat path when Vite proxy forwards /pyg-api/* without /api prefix.
    const { data } = await pygApi.get(`/api/uploads/${batchId}/errors`, { responseType: 'blob' })
    return data as Blob
  }
}

export async function getMatriz(filters: { year?: number; month?: number; empresa?: string; marca?: string }): Promise<MatrizRow[]> {
  const { data } = await pygApi.get<MatrizRow[]>('/percentages/matriz', { params: filters })
  return data
}

export async function getPeriodValidationSettings(): Promise<PeriodValidationSettingsDto> {
  const { data } = await pygApi.get<PeriodValidationSettingsDto>(resolvePeriodValidationPath())
  return data
}

export async function updatePeriodValidationSettings(
  skipWritePeriodValidation: boolean,
  adPassword?: string
): Promise<PeriodValidationSettingsDto> {
  const payload: PeriodValidationSettingsDto = { skipWritePeriodValidation }
  if (typeof adPassword === 'string' && adPassword.trim()) payload.adPassword = adPassword
  const { data } = await pygApi.put<PeriodValidationSettingsDto>(resolvePeriodValidationPath(), payload)
  return data
}

export async function getBodega(filters: { year?: number; month?: number; empresa?: string; marca?: string; codigoBodega?: string }): Promise<BodegaRow[]> {
  const { data } = await pygApi.get<BodegaRow[]>('/percentages/bodega', { params: filters })
  return data
}

export async function updateMatriz(id: number, payload: MatrizUpdatePayload): Promise<MatrizRow> {
  const { data } = await pygApi.put<MatrizRow>(`/percentages/matriz/${id}`, payload)
  return data
}

export async function updateBodega(id: number, payload: BodegaUpdatePayload): Promise<BodegaRow> {
  const { data } = await pygApi.put<BodegaRow>(`/percentages/bodega/${id}`, payload)
  return data
}
