import axios from 'axios'

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
}

export interface BodegaRow {
  id: number
  year: number
  month: number
  empresa: string
  marca: string
  codigoBodega: string
  percentGeneral: number
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

export async function downloadTemplate(): Promise<Blob> {
  const { data } = await pygApi.get('/uploads/template', { responseType: 'blob' })
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
