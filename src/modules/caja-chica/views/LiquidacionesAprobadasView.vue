<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Liquidaciones aprobadas</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Solicitudes en estado APROBADO</p>
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
            @click="loadAprobadas"
          >
            Refrescar
          </button>
        </div>
        <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Desde</label>
            <input
              v-model="filterFrom"
              type="date"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Hasta</label>
            <input
              v-model="filterTo"
              type="date"
              class="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div class="flex items-end">
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-2"
              @click="clearFilters"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando liquidaciones...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="aprobadas.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay liquidaciones aprobadas.
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="item in filteredAprobadas"
            :key="item.idLiquidacion"
            class="rounded border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-4 py-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Liquidacion #{{ item.idLiquidacion }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Tienda: {{ item.codAlmacen }} · Custodio: {{ item.nombreCustodio }} · Fecha: {{ formatDate(item.fechaCreacion) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Inicial: {{ formatTotalDisplay(getInitialTotal(item.idLiquidacion)) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Contabilidad: {{ formatTotalDisplay(getContabilidadTotal(item.idLiquidacion)) }}
                </div>
                <button
                  type="button"
                  class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                  @click="toggleItem(item.idLiquidacion)"
                >
                  {{ isItemOpen(item.idLiquidacion) ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>
            <div v-if="isItemOpen(item.idLiquidacion)" class="overflow-x-auto">
              <div v-if="detalleLoading[item.idLiquidacion]" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Cargando detalles...
              </div>
              <div v-else-if="detalleError[item.idLiquidacion]" class="px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {{ detalleError[item.idLiquidacion] }}
              </div>
              <table v-else class="min-w-full text-sm">
                <thead>
                  <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th class="py-2 pr-3 pl-4">Detalle</th>
                    <th class="py-2 pr-3">Gasto</th>
                    <th class="py-2 pr-3">Concepto</th>
                    <th class="py-2 pr-3">Total</th>
                    <th class="py-2 pr-3">Monto contabilidad</th>
                    <th class="py-2 pr-3">Obs. contabilidad</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="detalle in detallesByLiquidacion[item.idLiquidacion]" :key="detalle.idDetalle">
                    <td class="py-2 pr-3 pl-4 text-gray-700 dark:text-gray-200">{{ detalle.idDetalle }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ detalle.nombreGasto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ detalle.concepto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(detalle.total) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {{ formatAmount(getDetalleContabilidadMonto(detalle.idDetalle, detalle.total)) }}
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {{ getDetalleContabilidadObs(detalle.idDetalle) || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

interface LiquidacionItem {
  idLiquidacion: number
  estado: string
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
}

interface LiquidacionDetalleItem {
  idDetalle: number
  idLiquidacion: number
  nombreGasto: string
  concepto: string
  total: number
}

interface AprobacionItem {
  idDetalle: number
  nivelAprobacion: number
  estado: string
  montoAprobado: number
  observacion: string
  fechaAprobacion?: string
}

const loading = ref(false)
const error = ref('')
const aprobadas = ref<LiquidacionItem[]>([])
const filterFrom = ref('')
const filterTo = ref('')
const openItems = ref<Record<number, boolean>>({})
const detallesByLiquidacion = ref<Record<number, LiquidacionDetalleItem[]>>({})
const detalleLoading = ref<Record<number, boolean>>({})
const detalleError = ref<Record<number, string>>({})
const contabilidadByDetalle = ref<Record<number, AprobacionItem>>({})

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

const normalizeString = (value: any) => String(value ?? '').trim()

const normalizeLiquidacion = (item: any): LiquidacionItem => ({
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
  nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
  fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? '')
})

const normalizeDetalle = (item: any): LiquidacionDetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  total: Number(item.total ?? item.Total ?? 0)
})

const normalizeAprobacion = (item: any): AprobacionItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  nivelAprobacion: Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
  fechaAprobacion: item.fechaAprobacion ?? item.FechaAprobacion
})

const filteredAprobadas = computed(() => {
  const from = filterFrom.value ? new Date(filterFrom.value).getTime() : null
  const to = filterTo.value ? new Date(filterTo.value).getTime() : null
  return aprobadas.value.filter(item => {
    const time = item.fechaCreacion ? new Date(item.fechaCreacion).getTime() : null
    if (from && time && time < from) return false
    if (to && time && time > to + 24 * 60 * 60 * 1000 - 1) return false
    return true
  })
})

const clearFilters = () => {
  filterFrom.value = ''
  filterTo.value = ''
}

const isItemOpen = (idLiquidacion: number) => openItems.value[idLiquidacion] === true

const toggleItem = async (idLiquidacion: number) => {
  openItems.value[idLiquidacion] = !isItemOpen(idLiquidacion)
  if (openItems.value[idLiquidacion] && !detallesByLiquidacion.value[idLiquidacion]) {
    await loadDetalles(idLiquidacion)
  }
}

const loadDetalles = async (idLiquidacion: number) => {
  detalleLoading.value[idLiquidacion] = true
  detalleError.value[idLiquidacion] = ''
  try {
    const response = await cajaChicaApi.get(`/Liquidaciones/${idLiquidacion}/detalle`)
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    detallesByLiquidacion.value[idLiquidacion] = items.map(normalizeDetalle)
  } catch {
    detalleError.value[idLiquidacion] = 'No se pudo cargar el detalle de la liquidacion.'
  } finally {
    detalleLoading.value[idLiquidacion] = false
  }
}

const loadAprobacionesContabilidad = async () => {
  const response = await cajaChicaApi.get('/Aprobaciones')
  const payload = response.data as any
  const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  const aprobaciones = items.map(normalizeAprobacion)
    .filter((item: AprobacionItem) => item.nivelAprobacion === 2 && item.estado.toUpperCase() === 'APROBADO')

  const map: Record<number, AprobacionItem> = {}
  aprobaciones.forEach((item: AprobacionItem) => {
    const current = map[item.idDetalle]
    if (!current) {
      map[item.idDetalle] = item
      return
    }
    const currentTime = current.fechaAprobacion ? new Date(current.fechaAprobacion).getTime() : 0
    const candidateTime = item.fechaAprobacion ? new Date(item.fechaAprobacion).getTime() : 0
    if (candidateTime >= currentTime) {
      map[item.idDetalle] = item
    }
  })
  contabilidadByDetalle.value = map
}

const getDetalleContabilidadMonto = (idDetalle: number, fallback: number) => {
  const decision = contabilidadByDetalle.value[idDetalle]
  if (!decision) return fallback
  return decision.montoAprobado > 0 ? decision.montoAprobado : fallback
}

const getDetalleContabilidadObs = (idDetalle: number) => {
  const decision = contabilidadByDetalle.value[idDetalle]
  return decision?.observacion || ''
}

const getInitialTotal = (idLiquidacion: number) => {
  const detalles = detallesByLiquidacion.value[idLiquidacion]
  if (!detalles) return null
  return detalles.reduce((acc, item) => acc + item.total, 0)
}

const getContabilidadTotal = (idLiquidacion: number) => {
  const detalles = detallesByLiquidacion.value[idLiquidacion]
  if (!detalles) return null
  return detalles.reduce((acc, item) => {
    const monto = getDetalleContabilidadMonto(item.idDetalle, item.total)
    return acc + monto
  }, 0)
}

const loadAprobadas = async () => {
  loading.value = true
  error.value = ''
  try {
    await loadAprobacionesContabilidad()
    const response = await cajaChicaApi.get('/Liquidaciones')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    aprobadas.value = items
      .map(normalizeLiquidacion)
      .filter((item: LiquidacionItem) => item.estado.toUpperCase() === 'APROBADO')
    openItems.value = {}
    detallesByLiquidacion.value = {}
    detalleLoading.value = {}
    detalleError.value = {}
  } catch {
    error.value = 'No se pudieron cargar las liquidaciones aprobadas.'
  } finally {
    loading.value = false
  }
}

const formatAmount = (value: number) => value.toFixed(2)
const formatTotalDisplay = (value: number | null) => (value === null ? '-' : formatAmount(value))
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')

onMounted(() => {
  loadAprobadas()
})
</script>
