import axios from 'axios'
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
  fecha_actual?: string
  usuario_actual?: string
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

interface ApiListResult {
  items: StoreEmployee[]
  total: number
}

const endpoint =
  import.meta.env.VITE_STORE_EMPLOYEES_API_URL ||
  '/employees-api/store_employees.php'

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

  const { data } = await axios.get(endpoint, { params })
  const raw = toItems(data)
  const items = raw.map((row) => ({
    ...row,
    encargado: normalizeEncargado((row as Record<string, unknown>).encargado),
    estado: Number((row as Record<string, unknown>).estado ?? 0)
  })) as StoreEmployee[]
  const total = toTotal(data, items.length)
  return { items, total }
}

export async function createStoreEmployee(
  payload: Omit<StoreEmployee, 'id' | 'fecha_actual'>
): Promise<void> {
  await axios.post(endpoint, payload, {
    headers: { 'Content-Type': 'application/json', 'X-User': payload.usuario_actual || '' }
  })
}

export async function updateStoreEmployee(
  id: number,
  payload: Partial<Omit<StoreEmployee, 'id' | 'fecha_actual'>>
): Promise<void> {
  await axios.patch(
    endpoint,
    { id, ...payload },
    { headers: { 'Content-Type': 'application/json', 'X-User': payload.usuario_actual || '' } }
  )
}

export async function inactivateStoreEmployee(id: number, user: string): Promise<void> {
  await axios.delete(endpoint, {
    params: { id },
    headers: { 'X-User': user || '' }
  })
}

/**
 * Catálogo de cargos desde el backend: GET store_employees.php?meta=cargos
 * Respuesta esperada: { ok: true, data: string[] }
 */
export async function fetchStoreEmployeeCargos(): Promise<StoreEmployeeCargo[]> {
  try {
    const { data } = await axios.get(endpoint, { params: { meta: 'cargos' } })
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
 * Catálogo de tiendas/almacenes: GET store_employees.php?meta=almacenes
 * Usa meta.value_field / meta.label_field si vienen en la respuesta.
 */
export async function fetchStoreAlmacenes(): Promise<AlmacenOption[]> {
  const { data } = await axios.get(endpoint, { params: { meta: 'almacenes' } })
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
 * Health opcional: GET store_employees.php?health=1
 * Devuelve true si el servicio responde usable (ok no false).
 */
export async function checkStoreEmployeesHealth(): Promise<boolean> {
  try {
    const { data } = await axios.get(endpoint, {
      params: { health: '1' },
      timeout: 10_000
    })
    if (data && typeof data === 'object' && data.ok === false) {
      return false
    }
    return true
  } catch {
    return false
  }
}
