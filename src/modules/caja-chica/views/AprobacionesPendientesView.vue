<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Aprobaciones pendientes</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Pendientes por aprobar para tu usuario</p>
        </div>
        <router-link
          class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
          to="/caja-chica"
        >
          Volver
        </router-link>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Listado</h2>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
            @click="loadPendientes"
          >
            Refrescar
          </button>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando aprobaciones...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="pendientes.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones pendientes.
        </div>
        <div v-else class="space-y-6">
          <div
            v-for="group in groupedPendientes"
            :key="group.idLiquidacion"
            class="rounded border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-4 py-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Liquidacion #{{ group.idLiquidacion }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ group.totalItems }} detalles pendientes · Tienda: {{ group.codAlmacen }} · Custodio: {{ group.nombreCustodio }} · Fecha: {{ formatDate(group.fechaCreacion) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">Total: {{ formatAmount(group.totalMonto) }}</div>
                <button
                  type="button"
                  class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                  @click="toggleGroup(group.idLiquidacion)"
                >
                  {{ isGroupOpen(group.idLiquidacion) ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>
            <div v-if="isGroupOpen(group.idLiquidacion)" class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-900">
                  <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th
                      v-for="column in orderedVisibleColumns"
                      :key="column.key"
                      :draggable="!column.fixed"
                      :class="[
                        'py-2 pr-3 select-none',
                        column.key === 'id' ? 'pl-4' : '',
                        column.fixed ? 'cursor-default' : 'cursor-move',
                        draggedColumnKey === column.key ? 'opacity-50 bg-indigo-100 dark:bg-indigo-900' : '',
                        dragOverColumnKey === column.key && draggedColumnKey !== null ? 'border-l-4 border-indigo-500' : ''
                      ]"
                      @dragstart="!column.fixed && handleDragStart($event, column.key)"
                      @dragover.prevent="!column.fixed && handleDragOver($event, column.key)"
                      @dragleave="!column.fixed && handleDragLeave()"
                      @drop.prevent="!column.fixed && handleDrop($event, column.key)"
                      @dragend="!column.fixed && handleDragEnd()"
                    >
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="item in group.items" :key="item.idAprobacion">
                    <td
                      v-for="column in orderedVisibleColumns"
                      :key="column.key"
                      :class="[
                        'py-2 pr-3 text-gray-700 dark:text-gray-200',
                        column.key === 'id' ? 'pl-4' : ''
                      ]"
                    >
                      <template v-if="column.key === 'montoAprobado'">
                        <input
                          v-model="decisions[item.idAprobacion].montoAprobado"
                          type="number"
                          step="0.01"
                          class="w-28 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white"
                        />
                      </template>
                      <template v-else-if="column.key === 'comentario'">
                        <input
                          v-model="decisions[item.idAprobacion].observacion"
                          type="text"
                          placeholder="Comentario de aprobacion o negacion"
                          class="w-48 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white"
                        />
                      </template>
                      <template v-else-if="column.key === 'acciones'">
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            class="text-emerald-600 hover:text-emerald-700 text-xs font-medium disabled:opacity-50"
                            :disabled="actionLoadingId === item.idAprobacion"
                            @click="approve(item)"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            class="text-red-600 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                            :disabled="actionLoadingId === item.idAprobacion"
                            @click="reject(item)"
                          >
                            Negar
                          </button>
                        </div>
                      </template>
                      <template v-else>
                        {{ getCellValue(group, item, column.key) }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="actionError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ actionError }}</div>
        <div v-else-if="actionSuccess" class="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{{ actionSuccess }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useTablePreferences } from '@/composables/useTablePreferences'

interface ColumnConfig {
  key: string
  label: string
  fixed: boolean
}

interface AprobacionItem {
  idAprobacion: number
  idDetalle: number
  idLiquidacion: number
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
  nombreGasto: string
  concepto: string
  total: number
  nivelAprobacion: number
  estado: string
}

interface DetalleItem {
  idDetalle: number
  fechaConsumo: string
  ruc: string
  nombreProveedor: string
  numeroComprobante: string
  tipoDocumento: string
  concepto: string
  subtotalConIva: number
  subtotalSinIva: number
  iva: number
}

interface DecisionState {
  montoAprobado: string
  observacion: string
}

const loading = ref(false)
const error = ref('')
const actionError = ref('')
const actionSuccess = ref('')
const actionLoadingId = ref<number | null>(null)
const pendientes = ref<AprobacionItem[]>([])
const decisions = ref<Record<number, DecisionState>>({})
const openGroups = ref<Record<number, boolean>>({})
const detallesByLiquidacion = ref<Record<number, DetalleItem[]>>({})
const adjuntosByDetalle = ref<Record<number, number>>({})

const availableColumns: ColumnConfig[] = [
  { key: 'id', label: 'Id', fixed: false },
  { key: 'detalle', label: 'Detalle', fixed: false },
  { key: 'gasto', label: 'Gasto', fixed: false },
  { key: 'fechaConsumo', label: 'Fecha consumo', fixed: false },
  { key: 'ruc', label: 'RUC', fixed: false },
  { key: 'proveedor', label: 'Proveedor', fixed: false },
  { key: 'numeroComprobante', label: 'N° Comprobante', fixed: false },
  { key: 'tipoDocumento', label: 'Tipo Documento', fixed: false },
  { key: 'concepto', label: 'Concepto', fixed: false },
  { key: 'subtotalConIva', label: 'Subtotal con IVA', fixed: false },
  { key: 'subtotalSinIva', label: 'Subtotal sin IVA', fixed: false },
  { key: 'iva', label: 'IVA', fixed: false },
  { key: 'total', label: 'Total', fixed: false },
  { key: 'adjuntos', label: 'Adjuntos', fixed: false },
  { key: 'montoAprobado', label: 'Monto aprobado', fixed: true },
  { key: 'comentario', label: 'Comentario', fixed: true },
  { key: 'nivel', label: 'Nivel', fixed: true },
  { key: 'acciones', label: 'Acciones', fixed: true }
]

const defaultVisibleColumns = availableColumns.map(col => col.key)
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns: orderedVisibleColumnKeys,
  savePreferences
} = useTablePreferences({
  tableId: 'caja-chica-aprobaciones-pendientes',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

const orderedVisibleColumns = computed(() => {
  const ordered = orderedVisibleColumnKeys.value
    .map(key => availableColumns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined)
  const fixedColumns = ordered.filter(col => col.fixed)
  const nonFixedColumns = ordered.filter(col => !col.fixed)
  return [...nonFixedColumns, ...fixedColumns]
})

const draggedColumnKey = ref<string | null>(null)
const dragOverColumnKey = ref<string | null>(null)

function handleDragStart(event: DragEvent, columnKey: string) {
  const column = availableColumns.find(col => col.key === columnKey)
  if (column?.fixed) return
  draggedColumnKey.value = columnKey
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', columnKey)
  }
}

function handleDragOver(event: DragEvent, columnKey: string) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  if (draggedColumnKey.value !== null && draggedColumnKey.value !== columnKey) {
    const target = availableColumns.find(col => col.key === columnKey)
    if (!target?.fixed) dragOverColumnKey.value = columnKey
  } else {
    dragOverColumnKey.value = null
  }
}

function handleDragLeave() {}

function handleDrop(event: DragEvent, targetColumnKey: string) {
  event.preventDefault()
  if (!draggedColumnKey.value || draggedColumnKey.value === targetColumnKey) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  const draggedColumn = availableColumns.find(col => col.key === draggedColumnKey.value)
  const targetColumn = availableColumns.find(col => col.key === targetColumnKey)
  if (draggedColumn?.fixed || targetColumn?.fixed) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  const fullOrder = [...columnOrder.value]
  const draggedIndexInFull = fullOrder.indexOf(draggedColumnKey.value)
  const targetIndexInFull = fullOrder.indexOf(targetColumnKey)
  if (draggedIndexInFull === -1 || targetIndexInFull === -1) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  fullOrder.splice(draggedIndexInFull, 1)
  const adjustedTarget = targetIndexInFull > draggedIndexInFull ? targetIndexInFull - 1 : targetIndexInFull
  fullOrder.splice(adjustedTarget, 0, draggedColumnKey.value)
  columnOrder.value = fullOrder
  savePreferences()
  draggedColumnKey.value = null
  dragOverColumnKey.value = null
}

function handleDragEnd() {
  draggedColumnKey.value = null
  dragOverColumnKey.value = null
}

function getCellValue(group: { idLiquidacion: number }, item: AprobacionItem, columnKey: string): string | number {
  const d = getDetalle(group.idLiquidacion, item.idDetalle)
  switch (columnKey) {
    case 'id': return item.idAprobacion
    case 'detalle': return item.idDetalle
    case 'gasto': return item.nombreGasto
    case 'fechaConsumo': return formatDate(d?.fechaConsumo ?? '')
    case 'ruc': return d?.ruc ?? '-'
    case 'proveedor': return d?.nombreProveedor ?? '-'
    case 'numeroComprobante': return d?.numeroComprobante ?? '-'
    case 'tipoDocumento': return d?.tipoDocumento || '-'
    case 'concepto': return d?.concepto ?? item.concepto ?? '-'
    case 'subtotalConIva': return d != null ? formatAmount(d.subtotalConIva) : '-'
    case 'subtotalSinIva': return d != null ? formatAmount(d.subtotalSinIva) : '-'
    case 'iva': return d != null ? formatAmount(d.iva) : '-'
    case 'total': return formatAmount(item.total)
    case 'adjuntos': return adjuntosByDetalle.value[item.idDetalle] ?? 0
    case 'nivel': return item.nivelAprobacion
    default: return ''
  }
}

const groupedPendientes = computed(() => {
  const groups = new Map<number, AprobacionItem[]>()
  pendientes.value.forEach(item => {
    if (!groups.has(item.idLiquidacion)) {
      groups.set(item.idLiquidacion, [])
    }
    groups.get(item.idLiquidacion)?.push(item)
  })

  return Array.from(groups.entries()).map(([idLiquidacion, items]) => {
    const totalMonto = items.reduce((acc, item) => acc + item.total, 0)
    const base = items[0]
    return {
      idLiquidacion,
      items,
      totalMonto,
      totalItems: items.length,
      codAlmacen: base?.codAlmacen || '',
      nombreCustodio: base?.nombreCustodio || '',
      fechaCreacion: base?.fechaCreacion || ''
    }
  })
})

const isGroupOpen = (idLiquidacion: number) => openGroups.value[idLiquidacion] !== false

const toggleGroup = (idLiquidacion: number) => {
  openGroups.value[idLiquidacion] = !isGroupOpen(idLiquidacion)
}

const getDetalle = (idLiquidacion: number, idDetalle: number): DetalleItem | undefined =>
  detallesByLiquidacion.value[idLiquidacion]?.find(d => d.idDetalle === idDetalle)

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const getCurrentUserId = (): string => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return ''
    const user = JSON.parse(userStr) as { id?: string }
    return user.id || ''
  } catch {
    return ''
  }
}

const normalizeString = (value: any) => String(value ?? '').trim()

const normalizeDetalle = (item: any): DetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  fechaConsumo: String(item.fechaConsumo ?? item.FechaConsumo ?? ''),
  ruc: normalizeString(item.ruc ?? item.Ruc ?? ''),
  nombreProveedor: normalizeString(item.nombreProveedor ?? item.NombreProveedor ?? ''),
  numeroComprobante: normalizeString(item.numeroComprobante ?? item.NumeroComprobante ?? ''),
  tipoDocumento: normalizeString(item.numeroAutorizacion ?? item.NumeroAutorizacion ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  subtotalConIva: Number(item.subtotal_Con_Iva ?? item.Subtotal_Con_Iva ?? item.subtotalConIva ?? 0),
  subtotalSinIva: Number(item.subtotal_Sin_Iva ?? item.Subtotal_Sin_Iva ?? item.subtotalSinIva ?? 0),
  iva: Number(item.iva ?? item.Iva ?? 0)
})

const normalizeAprobacion = (item: any): AprobacionItem => ({
  idAprobacion: Number(item.idAprobacion ?? item.IdAprobacion ?? 0),
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
  nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
  fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? ''),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  total: Number(item.total ?? item.Total ?? 0),
  nivelAprobacion: Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0),
  estado: normalizeString(item.estado ?? item.Estado ?? '')
})

const ensureDecision = (item: AprobacionItem) => {
  if (!decisions.value[item.idAprobacion]) {
    decisions.value[item.idAprobacion] = {
      montoAprobado: item.total.toFixed(2),
      observacion: ''
    }
  }
}

const loadPendientes = async () => {
  loading.value = true
  error.value = ''
  actionError.value = ''
  actionSuccess.value = ''
  decisions.value = {}
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'No se encontro el usuario logeado.'
      return
    }

    const response = await cajaChicaApi.get(`/Aprobaciones/pendientes/${userId}`)
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    const normalized: AprobacionItem[] = items
      .map(normalizeAprobacion)
      .filter((item: AprobacionItem) => item.estado.toUpperCase() === 'PENDIENTE')
    normalized.forEach(ensureDecision)
    pendientes.value = normalized
    openGroups.value = normalized.reduce<Record<number, boolean>>((acc, item) => {
      if (acc[item.idLiquidacion] === undefined) {
        acc[item.idLiquidacion] = true
      }
      return acc
    }, {})
    detallesByLiquidacion.value = {}
    adjuntosByDetalle.value = {}
    const liquidacionIds = [...new Set(normalized.map(p => p.idLiquidacion))]
    for (const idLiq of liquidacionIds) {
      try {
        const res = await cajaChicaApi.get(`/Liquidaciones/${idLiq}/detalle`)
        const payload = res.data as any
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
        detallesByLiquidacion.value[idLiq] = items.map(normalizeDetalle)
        for (const d of detallesByLiquidacion.value[idLiq]) {
          try {
            const adjRes = await cajaChicaApi.get(`/Adjuntos/por-detalle/${d.idDetalle}`)
            const adjPayload = adjRes.data as any
            const adjList = Array.isArray(adjPayload) ? adjPayload : Array.isArray(adjPayload?.data) ? adjPayload.data : []
            adjuntosByDetalle.value[d.idDetalle] = adjList.length
          } catch {
            adjuntosByDetalle.value[d.idDetalle] = 0
          }
        }
      } catch {
        detallesByLiquidacion.value[idLiq] = []
      }
    }
  } catch {
    error.value = 'No se pudieron cargar las aprobaciones pendientes.'
  } finally {
    loading.value = false
  }
}

const approve = async (item: AprobacionItem) => {
  actionError.value = ''
  actionSuccess.value = ''
  actionLoadingId.value = item.idAprobacion
  try {
    const decision = decisions.value[item.idAprobacion]
    const monto = Number(decision?.montoAprobado ?? item.total)
    await cajaChicaApi.post(`/Aprobaciones/${item.idAprobacion}/aprobar`, {
      MontoAprobado: Number.isNaN(monto) ? item.total : monto,
      Observacion: decision?.observacion || ''
    })
    actionSuccess.value = 'Aprobacion registrada.'
    await loadPendientes()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    actionError.value = message || 'No se pudo aprobar la solicitud.'
  } finally {
    actionLoadingId.value = null
  }
}

const reject = async (item: AprobacionItem) => {
  actionError.value = ''
  actionSuccess.value = ''
  actionLoadingId.value = item.idAprobacion
  try {
    const decision = decisions.value[item.idAprobacion]
    const monto = Number(decision?.montoAprobado ?? 0)
    await cajaChicaApi.post(`/Aprobaciones/${item.idAprobacion}/rechazar`, {
      MontoAprobado: Number.isNaN(monto) ? 0 : monto,
      Observacion: decision?.observacion || ''
    })
    actionSuccess.value = 'Aprobacion rechazada.'
    await loadPendientes()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    actionError.value = message || 'No se pudo rechazar la solicitud.'
  } finally {
    actionLoadingId.value = null
  }
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')

onMounted(() => {
  loadPendientes()
})
</script>
