<template>
  <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Caja Chica</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Listado General de Liquidaciones</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Todas las liquidaciones con su estado actual, aprobadores e integración SAP — incluidas rechazadas y eliminadas.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" class="btn-secondary" :disabled="loading || filasFiltradas.length === 0" @click="descargarExcel">
          Descargar Excel
        </button>
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>

    <div class="mb-4 flex items-center gap-3 flex-wrap">
      <label class="text-sm text-gray-600 dark:text-gray-400" for="lg-desde">Desde</label>
      <input id="lg-desde" v-model="fechaDesde" type="date" class="date-input" />
      <label class="text-sm text-gray-600 dark:text-gray-400" for="lg-hasta">Hasta</label>
      <input id="lg-hasta" v-model="fechaHasta" type="date" class="date-input" />
      <span class="text-xs text-gray-400">Por defecto, últimos 15 días.</span>
      <input
        v-model="search"
        type="search"
        placeholder="Buscar #, almacén, custodio..."
        class="search-input w-64"
      />
      <select v-model="fEstado" class="select-input">
        <option value="">Estado (todos)</option>
        <option v-for="e in estadosDisponibles" :key="e" :value="e">{{ e }}</option>
      </select>
      <select v-model="fIntegracion" class="select-input">
        <option value="">Integración (todas)</option>
        <option value="INTEGRADO">Integradas</option>
        <option value="PENDIENTE">Sin integrar</option>
      </select>
      <label class="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
        <input v-model="verEliminadas" type="checkbox" class="rounded" />
        Incluir eliminadas
      </label>
      <span class="text-xs text-gray-500 dark:text-gray-400">{{ filasFiltradas.length }} liquidaciones</span>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="loading && filas.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
      <div v-else-if="filasFiltradas.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay liquidaciones para los filtros seleccionados.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th w-8"></th>
              <th class="th cursor-pointer select-none" @click="toggleSort('idLiquidacion')">#{{ sortIndicator('idLiquidacion') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('codAlmacen')">Almacén{{ sortIndicator('codAlmacen') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('nombreCustodio')">Custodio{{ sortIndicator('nombreCustodio') }}</th>
              <th class="th text-right cursor-pointer select-none" @click="toggleSort('valorTotal')">Valor{{ sortIndicator('valorTotal') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('fechaCreacion')">Creada{{ sortIndicator('fechaCreacion') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('estado')">Estado{{ sortIndicator('estado') }}</th>
              <th class="th">Supervisor</th>
              <th class="th">Contador</th>
              <th class="th">Integración</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <template v-for="row in filasOrdenadas" :key="rowKey(row)">
              <tr :class="row.eliminada ? 'bg-red-50/60 dark:bg-red-950/20' : ''">
                <td class="td">
                  <button
                    v-if="!row.eliminada"
                    type="button"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    :title="expanded[row.idLiquidacion] ? 'Ocultar historial' : 'Ver historial de estados'"
                    @click="toggleHistorial(row.idLiquidacion)"
                  >
                    {{ expanded[row.idLiquidacion] ? '▾' : '▸' }}
                  </button>
                </td>
                <td class="td font-mono text-xs">
                  {{ row.idLiquidacion }}<span v-if="row.numeroLiquidacion" class="text-gray-400"> · {{ row.numeroLiquidacion }}</span>
                </td>
                <td class="td font-mono text-xs" :title="row.almacenNombre || ''">{{ row.codAlmacen || '—' }}</td>
                <td class="td">{{ row.nombreCustodio || '—' }}</td>
                <td class="td text-right">{{ row.eliminada ? '—' : formatMonto(row.valorTotal) }}</td>
                <td class="td whitespace-nowrap text-xs">{{ formatDate(row.fechaCreacion) }}</td>
                <td class="td whitespace-nowrap">
                  <span :class="['badge', badgeClass(row)]">{{ row.eliminada ? 'ELIMINADA' : row.estado }}</span>
                  <span v-if="row.fueDevuelta" class="badge badge-amber ml-1" title="Fue devuelta al menos una vez">Devuelta</span>
                </td>
                <td class="td text-xs">{{ aprobadorResumen(row.supervisor) }}</td>
                <td class="td text-xs">{{ aprobadorResumen(row.contador) }}</td>
                <td class="td whitespace-nowrap text-xs">
                  <template v-if="row.eliminada">
                    <span class="text-gray-400" :title="'Eliminada por ' + (row.eliminadaPor || '?')">
                      {{ formatDate(row.fechaEliminacion) }}
                    </span>
                  </template>
                  <template v-else>
                    <span :class="row.estadoIntegracion === 'INTEGRADO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'">
                      {{ row.estadoIntegracion || 'PENDIENTE' }}<span v-if="row.docNum"> · Doc {{ row.docNum }}</span>
                    </span>
                  </template>
                </td>
              </tr>
              <tr v-if="expanded[row.idLiquidacion]">
                <td class="td bg-gray-50 dark:bg-gray-900/40" colspan="10">
                  <div v-if="historialLoading[row.idLiquidacion]" class="text-xs text-gray-500 py-2">Cargando historial...</div>
                  <div v-else-if="!(historiales[row.idLiquidacion] || []).length" class="text-xs text-gray-500 py-2">
                    Sin cambios de estado registrados.
                  </div>
                  <ul v-else class="py-1 space-y-1">
                    <li v-for="(h, i) in historiales[row.idLiquidacion]" :key="i" class="text-xs text-gray-600 dark:text-gray-400">
                      <span class="font-mono">{{ formatDateTime(h.fecha) }}</span> —
                      <strong>{{ h.estadoAnterior || '?' }}</strong> → <strong>{{ h.estadoNuevo }}</strong>
                      <span v-if="h.tipoAccion"> ({{ h.tipoAccion }})</span>
                      <span v-if="h.observacion" class="italic"> · {{ h.observacion }}</span>
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { cajaChicaApi } from '../services/cajaChicaApi'
import { resolveUserNames } from '@/utils/resolveUserNames'

interface AprobadorEntry {
  idUsuario: string
  nombreUsuario?: string | null
  estado: string
}

interface FilaListado {
  idLiquidacion: number
  numeroLiquidacion?: string | null
  codAlmacen?: string | null
  almacenNombre?: string | null
  nombreCustodio?: string | null
  estado: string
  fechaCreacion?: string | null
  fueDevuelta: boolean
  estadoIntegracion?: string | null
  docNum?: string | null
  valorTotal: number
  supervisor: AprobadorEntry[]
  contador: AprobadorEntry[]
  eliminada: boolean
  eliminadaPor?: string | null
  fechaEliminacion?: string | null
}

interface HistorialEstadoItem {
  estadoAnterior?: string | null
  estadoNuevo: string
  tipoAccion?: string | null
  observacion?: string | null
  fecha: string
}

const filas = ref<FilaListado[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const fEstado = ref('')
const fIntegracion = ref('')
const verEliminadas = ref(true)

function defaultDesde(): string {
  const d = new Date()
  d.setDate(d.getDate() - 15)
  return d.toISOString().slice(0, 10)
}

const fechaDesde = ref(defaultDesde())
const fechaHasta = ref(new Date().toISOString().slice(0, 10))
const nombreById = ref<Record<string, string>>({})

const expanded = ref<Record<number, boolean>>({})
const historiales = ref<Record<number, HistorialEstadoItem[]>>({})
const historialLoading = ref<Record<number, boolean>>({})

type SortKey = 'idLiquidacion' | 'codAlmacen' | 'nombreCustodio' | 'valorTotal' | 'fechaCreacion' | 'estado'
const sortKey = ref<SortKey>('idLiquidacion')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key: SortKey) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

const str = (v: unknown) => String(v ?? '').trim()

function normalizeAprobadores(value: any): AprobadorEntry[] {
  if (!Array.isArray(value)) return []
  return value.map((a: any) => ({
    idUsuario: str(a.idUsuario ?? a.IdUsuario),
    nombreUsuario: str(a.nombreUsuario ?? a.NombreUsuario) || null,
    estado: str(a.estado ?? a.Estado)
  }))
}

const estadosDisponibles = computed(() =>
  [...new Set(filas.value.map(f => (f.eliminada ? 'ELIMINADA' : f.estado)).filter(Boolean))].sort((a, b) => a.localeCompare(b))
)

// Fecha de referencia para el filtro Desde/Hasta: la de creación; en eliminadas sin
// snapshot legible (fechaCreacion nula) se usa la fecha de eliminación para no ocultarlas.
function fechaFiltro(f: FilaListado): string {
  return (f.fechaCreacion || f.fechaEliminacion || '').slice(0, 10)
}

function pasaFiltroFecha(f: FilaListado): boolean {
  const fecha = fechaFiltro(f)
  if (!fecha) return true
  if (fechaDesde.value && fecha < fechaDesde.value) return false
  return !(fechaHasta.value && fecha > fechaHasta.value)
}

function pasaFiltroEstado(f: FilaListado): boolean {
  if (!fEstado.value) return true
  return (f.eliminada ? 'ELIMINADA' : f.estado) === fEstado.value
}

function pasaFiltroIntegracion(f: FilaListado): boolean {
  if (!fIntegracion.value) return true
  if (f.eliminada) return false
  const integrada = (f.estadoIntegracion || 'PENDIENTE').toUpperCase() === 'INTEGRADO'
  return fIntegracion.value === 'INTEGRADO' ? integrada : !integrada
}

function pasaBusqueda(f: FilaListado, q: string): boolean {
  if (!q) return true
  return [String(f.idLiquidacion), f.numeroLiquidacion, f.codAlmacen, f.almacenNombre, f.nombreCustodio]
    .some(v => (v ?? '').toLowerCase().includes(q))
}

const filasFiltradas = computed(() => {
  const q = search.value.trim().toLowerCase()
  return filas.value.filter(f =>
    (verEliminadas.value || !f.eliminada)
    && pasaFiltroFecha(f)
    && pasaFiltroEstado(f)
    && pasaFiltroIntegracion(f)
    && pasaBusqueda(f, q))
})

const filasOrdenadas = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filasFiltradas.value].sort((a, b) => {
    if (key === 'idLiquidacion' || key === 'valorTotal') return ((a[key] as number) - (b[key] as number)) * dir
    return String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir
  })
})

function rowKey(row: FilaListado) {
  return (row.eliminada ? 'del-' : 'liq-') + row.idLiquidacion + '-' + (row.fechaEliminacion ?? '')
}

function badgeClass(row: FilaListado): string {
  if (row.eliminada) return 'badge-red'
  switch ((row.estado || '').toUpperCase()) {
    case 'APROBADO': return 'badge-green'
    case 'CONTABILIDAD': return 'badge-blue'
    case 'SUPERVISION': return 'badge-indigo'
    case 'RECHAZADA': return 'badge-red'
    case 'BORRADOR': return 'badge-gray'
    default: return 'badge-gray'
  }
}

// "Nombre (estado)" del primer aprobador + cuántos más; el estado agrupado prima:
// si alguno está PENDIENTE se muestra PENDIENTE, si no el estado común.
function aprobadorResumen(entries: AprobadorEntry[]): string {
  if (!entries.length) return '—'
  const unicos = [...new Map(entries.map(e => [e.idUsuario, e])).values()]
  const principal = unicos[0]
  const nombre = principal.nombreUsuario || nombreById.value[principal.idUsuario] || principal.idUsuario.slice(0, 8) + '…'
  const pendientes = entries.filter(e => e.estado === 'PENDIENTE').length
  const estado = pendientes > 0 ? `${pendientes} pend.` : (entries[0]?.estado || '').toLowerCase()
  const extra = unicos.length > 1 ? ` +${unicos.length - 1}` : ''
  return `${nombre}${extra} (${estado})`
}

function formatMonto(v: number): string {
  return '$' + v.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

async function toggleHistorial(idLiquidacion: number) {
  expanded.value[idLiquidacion] = !expanded.value[idLiquidacion]
  if (!expanded.value[idLiquidacion] || historiales.value[idLiquidacion]) return
  historialLoading.value[idLiquidacion] = true
  try {
    const { data } = await cajaChicaApi.get(`/Liquidaciones/${idLiquidacion}/historial-estado`)
    historiales.value[idLiquidacion] = Array.isArray(data) ? data : []
  } catch {
    historiales.value[idLiquidacion] = []
  } finally {
    historialLoading.value[idLiquidacion] = false
  }
}

// Exporta lo visible en pantalla (respeta fechas, búsqueda y filtros), en el mismo orden.
function descargarExcel() {
  const header = ['#', 'Número', 'Almacén', 'Nombre almacén', 'Custodio', 'Valor', 'Creada',
    'Estado', 'Devuelta', 'Supervisor', 'Contador', 'Integración', 'DocNum', 'Eliminada por', 'Fecha eliminación']
  const rows = filasOrdenadas.value.map(f => [
    f.idLiquidacion,
    f.numeroLiquidacion || '',
    f.codAlmacen || '',
    f.almacenNombre || '',
    f.nombreCustodio || '',
    f.eliminada ? '' : f.valorTotal,
    formatDate(f.fechaCreacion),
    f.eliminada ? 'ELIMINADA' : f.estado,
    f.fueDevuelta ? 'Sí' : '',
    aprobadorResumen(f.supervisor).replace('—', ''),
    aprobadorResumen(f.contador).replace('—', ''),
    f.eliminada ? '' : (f.estadoIntegracion || 'PENDIENTE'),
    f.docNum || '',
    f.eliminadaPor || '',
    f.eliminada ? formatDateTime(f.fechaEliminacion) : ''
  ])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([header, ...rows]), 'Liquidaciones')
  XLSX.writeFile(workbook, `liquidaciones_${fechaDesde.value || 'inicio'}_${fechaHasta.value || 'hoy'}.xlsx`)
}

// El API puede devolver claves en camelCase o PascalCase según el serializador —
// raw() prueba ambas, strOrNull() además normaliza cadenas vacías a null.
const raw = (l: any, k: string) => l[k] ?? l[k.charAt(0).toUpperCase() + k.slice(1)]
const strOrNull = (l: any, k: string) => str(raw(l, k)) || null

function mapActiva(l: any): FilaListado {
  return {
    idLiquidacion: Number(raw(l, 'idLiquidacion') ?? 0),
    numeroLiquidacion: strOrNull(l, 'numeroLiquidacion'),
    codAlmacen: strOrNull(l, 'codAlmacen'),
    almacenNombre: strOrNull(l, 'almacenNombre'),
    nombreCustodio: strOrNull(l, 'nombreCustodio'),
    estado: str(raw(l, 'estado')),
    fechaCreacion: strOrNull(l, 'fechaCreacion'),
    fueDevuelta: Boolean(raw(l, 'fueDevuelta') ?? false),
    estadoIntegracion: strOrNull(l, 'estadoIntegracion'),
    docNum: strOrNull(l, 'docNum'),
    valorTotal: Number(raw(l, 'valorTotal') ?? 0),
    supervisor: normalizeAprobadores(raw(l, 'supervisor')),
    contador: normalizeAprobadores(raw(l, 'contador')),
    eliminada: false
  }
}

function mapEliminada(l: any): FilaListado {
  return {
    idLiquidacion: Number(raw(l, 'idLiquidacion') ?? 0),
    numeroLiquidacion: strOrNull(l, 'numeroLiquidacion'),
    codAlmacen: strOrNull(l, 'codAlmacen'),
    almacenNombre: null,
    nombreCustodio: strOrNull(l, 'nombreCustodio'),
    estado: str(raw(l, 'estadoAlEliminar')),
    fechaCreacion: strOrNull(l, 'fechaCreacion'),
    fueDevuelta: false,
    estadoIntegracion: null,
    docNum: null,
    valorTotal: 0,
    supervisor: [],
    contador: [],
    eliminada: true,
    eliminadaPor: strOrNull(l, 'eliminadaPor'),
    fechaEliminacion: strOrNull(l, 'fechaEliminacion')
  }
}

const asLista = (data: unknown): any[] => (Array.isArray(data) ? data : [])

// Resuelve nombres de aprobadores/eliminadores que el API devolvió solo como id.
async function resolverNombres() {
  const idsSinNombre = new Set<string>()
  for (const f of filas.value) {
    for (const a of [...f.supervisor, ...f.contador]) {
      if (a.idUsuario && !a.nombreUsuario) idsSinNombre.add(a.idUsuario)
    }
    if (f.eliminadaPor && f.eliminadaPor !== 'system') idsSinNombre.add(f.eliminadaPor)
  }
  if (!idsSinNombre.size) return
  nombreById.value = await resolveUserNames([...idsSinNombre])
  for (const f of filas.value) {
    if (f.eliminadaPor && nombreById.value[f.eliminadaPor]) f.eliminadaPor = nombreById.value[f.eliminadaPor]
  }
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    const [adminResp, elimResp] = await Promise.all([
      cajaChicaApi.get('/Liquidaciones/admin-list'),
      cajaChicaApi.get('/Liquidaciones/eliminadas').catch(() => ({ data: [] }))
    ])

    filas.value = [
      ...asLista(adminResp.data).map(mapActiva),
      ...asLista(elimResp.data).map(mapEliminada)
    ]

    await resolverNombres()
  } catch (e: any) {
    error.value = e.message ?? 'No se pudo cargar el listado de liquidaciones.'
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.th { @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300 align-middle; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-green { @apply bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.badge-indigo { @apply bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300; }
.badge-amber { @apply bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300; }
.badge-red { @apply bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.select-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.date-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.search-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
