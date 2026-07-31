import { createModuleApi } from '@/lib/http'
import { STORE_EMPLOYEE_CARGOS, type StoreEmployeeCargo } from '../types/cargo'

export interface StoreEmployee {
  id: number
  cedula_identidad: string
  correo: string
  nombre: string
  /** Valor almacenado; puede ser legado hasta que se edite y guarde con un cargo válido. */
  cargo: string
  codigo_tienda: string
  estado: number
  /** 0 = No, 1 = Sí (columna BIT en SQL Server). */
  encargado: number
  fecha_ingreso?: string
  fecha_ultima_actualizacion?: string
  usuario_ultima_actualizacion?: string
}

export interface StoreEmployeesFilters {
  page: number
  page_size: number
  q: string
  codigo_tienda: string
  cargo: string
  estado: string
  /** Filtro opcional: '' | '0' | '1' */
  encargado: string
}

export interface StoreEmployeeWrite {
  cedula_identidad?: string
  correo?: string
  nombre?: string
  cargo?: string
  codigo_tienda?: string
  estado?: number
  encargado?: number
  usuario_actual?: string
}

interface ApiListResult {
  items: StoreEmployee[]
  total: number
}

interface MetaListResponse<T> {
  ok?: boolean
  data?: T[]
  meta?: Record<string, unknown>
}

interface HealthResponse {
  ok?: boolean
}

const endpointUrl =
  import.meta.env.VITE_STORE_EMPLOYEES_API_URL ||
  '/employees-api/api/v1/store-employees'

const employeesApi = createModuleApi(endpointUrl.replace(/\/$/, ''), { auditHeaders: true })

function toItems(payload: any): StoreEmployee[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.rows)) return payload.rows
  return []
}

/** Normaliza BIT / boolean / número desde SQL Server o JSON. */
export function normalizeEncargado(value: unknown): 0 | 1 {
  if (value === true || value === 1 || value === '1') return 1
  return 0
}

function toTotal(payload: any, fallbackCount: number): number {
  const candidates = [
    payload?.total,
    payload?.pagination?.total,
    payload?.meta?.total,
    payload?.count
  ]
  for (const value of candidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return fallbackCount
}

/** Normaliza una fila devuelta por el API (lista, GET uno o mutación PATCH/POST). */
export function mapStoreEmployeeRow(row: unknown): StoreEmployee {
  const r = row as unknown as Record<string, unknown>
  return {
    ...(row as object),
    encargado: normalizeEncargado(r.encargado),
    estado: Number(r.estado ?? 0),
    fecha_ingreso: (r.fecha_ingreso ?? r.fecha_actual) as string | undefined,
    fecha_ultima_actualizacion: (r.fecha_ultima_actualizacion ?? r.fecha_actual) as
      | string
      | undefined,
    usuario_ultima_actualizacion: (r.usuario_ultima_actualizacion ?? r.usuario_actual) as
      | string
      | undefined
  } as StoreEmployee
}

/**
 * Extrae el empleado actualizado del cuerpo JSON (p. ej. `{ ok, data }` tras PATCH).
 * Devuelve null si no se reconoce la forma (el caller puede hacer refetch).
 */
export function parseStoreEmployeeMutationResponse(data: unknown): StoreEmployee | null {
  if (data == null || typeof data !== 'object') return null
  let candidate: unknown = data
  const root = data as Record<string, unknown>
  if ('payload' in root && root.payload != null && typeof root.payload === 'object') {
    candidate = root.payload
  }
  const pl = candidate as Record<string, unknown>
  if ('data' in pl && pl.data != null && typeof pl.data === 'object') {
    candidate = pl.data
  }
  const row = candidate as Record<string, unknown>
  if (row.id == null) return null
  return mapStoreEmployeeRow(candidate)
}

export async function listStoreEmployees(filters: StoreEmployeesFilters): Promise<ApiListResult> {
  const params: Record<string, string | number> = {
    page: filters.page,
    page_size: filters.page_size
  }

  if (filters.q.trim()) params.q = filters.q.trim()
  if (filters.codigo_tienda.trim()) params.codigo_tienda = filters.codigo_tienda.trim()
  if (filters.cargo.trim()) params.cargo = filters.cargo.trim()
  if (filters.estado !== '') params.estado = filters.estado
  if (filters.encargado === '0' || filters.encargado === '1') params.encargado = filters.encargado

  const { data } = await employeesApi.get('', { params })
  const raw = toItems(data)
  const items = raw.map((row) => mapStoreEmployeeRow(row))
  const total = toTotal(data, items.length)
  return { items, total }
}

export async function createStoreEmployee(
  payload: StoreEmployeeWrite
): Promise<void> {
  await employeesApi.post('', payload)
}

export async function updateStoreEmployee(
  id: number,
  payload: StoreEmployeeWrite
): Promise<StoreEmployee | null> {
  const { data } = await employeesApi.patch(String(id), payload)
  return parseStoreEmployeeMutationResponse(data)
}

export async function inactivateStoreEmployee(id: number, user: string): Promise<void> {
  await employeesApi.delete(String(id), {
    data: { usuario_actual: user }
  })
}

/**
 * Catálogo de cargos desde el backend: GET /meta/cargos
 * Respuesta esperada: { ok: true, data: string[] }
 */
export async function fetchStoreEmployeeCargos(): Promise<StoreEmployeeCargo[]> {
  try {
    const { data } = await employeesApi.get<MetaListResponse<unknown>>('meta/cargos')
    if (data?.ok === true && Array.isArray(data?.data)) {
      const raw = data.data.filter((x: unknown) => typeof x === 'string') as string[]
      const valid = raw.filter((x) =>
        (STORE_EMPLOYEE_CARGOS as readonly string[]).includes(x)
      ) as StoreEmployeeCargo[]
      if (valid.length === STORE_EMPLOYEE_CARGOS.length) {
        return valid
      }
    }
  } catch {
    /* usar fallback */
  }
  return [...STORE_EMPLOYEE_CARGOS]
}

/** Ítem de combo tienda: valor guardado = cod_almacen → `codigo_tienda`. */
export interface AlmacenOption {
  cod_almacen: string
  label: string
}

/**
 * Catálogo de tiendas/almacenes: GET /meta/almacenes
 * Usa meta.value_field / meta.label_field si vienen en la respuesta.
 */
export async function fetchStoreAlmacenes(): Promise<AlmacenOption[]> {
  const { data } = await employeesApi.get<MetaListResponse<Record<string, unknown>>>('meta/almacenes')
  if (data?.ok !== true || !Array.isArray(data?.data)) {
    return []
  }
  const meta = (data.meta && typeof data.meta === 'object' ? data.meta : {}) as Record<string, unknown>
  const valueField = typeof meta.value_field === 'string' ? meta.value_field : 'cod_almacen'
  const labelField = typeof meta.label_field === 'string' ? meta.label_field : 'nombre'

  const rows: AlmacenOption[] = []
  for (const row of data.data as Record<string, unknown>[]) {
    const codRaw = row[valueField] ?? row.cod_almacen
    const cod = codRaw != null ? String(codRaw).trim() : ''
    if (!cod) continue
    const labelRaw = row[labelField] ?? row.label ?? row.nombre ?? cod
    const label = String(labelRaw).trim() || cod
    rows.push({ cod_almacen: cod, label })
  }
  return rows
}

/**
 * Health: GET /health
 * Devuelve true si el servicio responde usable (ok no false).
 */
export async function checkStoreEmployeesHealth(): Promise<boolean> {
  try {
    const { data } = await employeesApi.get<HealthResponse>('health', {
      timeout: 10_000
    })
    if (data?.ok === false) {
      return false
    }
    return true
  } catch {
    return false
  }
}
