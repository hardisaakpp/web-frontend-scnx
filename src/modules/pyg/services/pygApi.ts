import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'

/**
 * En dev, por defecto `/pyg-api` pasa por el proxy de Vite (ver `vite.config.ts`).
 * Si defines `VITE_PYG_API_URL` apuntando al host Docker, incluye el prefijo de la API, p. ej.
 * `http://localhost:5171/api` (no solo `http://localhost:5171`, porque las rutas son `/uploads`, etc.).
 */
const pygApi = axios.create({
  baseURL: import.meta.env.VITE_PYG_API_URL || '/pyg-api',
  headers: {
    'Accept': 'application/json'
  }
})

pygApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

attachUnauthorizedRedirect(pygApi)

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

export async function getUploads(): Promise<UploadBatchSummary[]> {
  const { data } = await pygApi.get<UploadBatchSummary[]>('/uploads')
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
    if (status !== 404) throw error
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
  const { data } = await pygApi.get(`/uploads/${batchId}/errors`, { responseType: 'blob' })
  return data as Blob
}

export async function getMatriz(filters: { year?: number; month?: number; empresa?: string; marca?: string }): Promise<MatrizRow[]> {
  const { data } = await pygApi.get<MatrizRow[]>('/percentages/matriz', { params: filters })
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
