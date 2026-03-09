<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <button
      type="button"
      class="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
      @click="volver"
    >
      <span aria-hidden="true">←</span> Volver
    </button>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial de aprobaciones</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Reporte de aprobaciones y rechazos realizados</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Listado</h2>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            @click="loadHistorial"
          >
            Refrescar
          </button>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="historial.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones o rechazos registrados.
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="group in groupedHistorial"
            :key="group.idLiquidacion"
            class="rounded border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-4 py-3">
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Liquidacion #{{ group.idLiquidacion }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ group.items.length }} detalles · Monto total: {{ formatAmount(group.totalMonto) }}
                </p>
              </div>
              <button
                type="button"
                class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                @click="toggleGroup(group.idLiquidacion)"
              >
                {{ isGroupOpen(group.idLiquidacion) ? 'Ocultar' : 'Ver' }}
              </button>
            </div>
            <div v-if="isGroupOpen(group.idLiquidacion)" class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
                    <th class="py-2 pr-3 pl-4">Detalle</th>
                    <th class="py-2 pr-3">Gasto</th>
                    <th class="py-2 pr-3">Concepto</th>
                    <th class="py-2 pr-3">Monto Total</th>
                    <th class="py-2 pr-3">Monto Aprobado</th>
                    <th class="py-2 pr-3">Estado</th>
                    <th class="py-2 pr-3">Comentario</th>
                    <th class="py-2 pr-3">Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="item in group.items" :key="item.idAprobacion" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td class="py-2 pr-3 pl-4 text-gray-700 dark:text-gray-200">{{ item.idDetalle }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreGasto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.concepto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.total) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200 font-semibold">{{ formatAmount(item.montoAprobado) }}</td>
                    <td class="py-2 pr-3">
                      <span
                        :class="[
                          'px-2 py-1 rounded-full text-xs font-medium inline-block',
                          item.estado === 'RECHAZADO'
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        ]"
                      >
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200 text-xs">{{ item.observacion || '-' }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200 text-xs whitespace-nowrap">{{ formatDateTime(item.fechaAprobacion) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="!loading && historial.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Total registros</div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ historial.length }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Aprobados</div>
              <div class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{{ aprobadasCount }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Rechazados</div>
              <div class="text-lg font-semibold text-red-600 dark:text-red-400">{{ rechazadasCount }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Monto total aprobado</div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatAmount(totalMontoAprobado) }}</div>
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
import { useRouter } from 'vue-router'

interface LiquidacionDetalleItem {
  idDetalle: number
  idLiquidacion: number
  idGasto: string
  nombreGasto: string
  concepto: string
  total: number
}

interface AprobacionItem {
  idAprobacion: number
  idDetalle: number
  idUsuario: string
  nivelAprobacion: number
  estado: string
  montoAprobado: number
  observacion: string
  fechaAprobacion?: string
}

interface HistorialItem {
  idAprobacion: number
  idDetalle: number
  idLiquidacion: number
  nombreGasto: string
  concepto: string
  total: number
  estado: string
  montoAprobado: number
  observacion: string
  fechaAprobacion: string
}

const router = useRouter()

const volver = () => {
  router.back()
}

const loading = ref(false)
const error = ref('')
const historial = ref<HistorialItem[]>([])
const openGroups = ref<Record<number, boolean>>({})

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

const normalizeDetalle = (item: any): LiquidacionDetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  idGasto: normalizeString(item.idGasto ?? item.IdGasto ?? ''),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  total: Number(item.total ?? item.Total ?? 0)
})

const normalizeAprobacion = (item: any): AprobacionItem => ({
  idAprobacion: Number(item.idAprobacion ?? item.IdAprobacion ?? 0),
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? ''),
  nivelAprobacion: Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
  fechaAprobacion: String(item.fechaAprobacion ?? item.FechaAprobacion ?? '')
})

const aprobadasCount = computed(() => 
  historial.value.filter(item => item.estado === 'APROBADO').length
)

const rechazadasCount = computed(() =>
  historial.value.filter(item => item.estado === 'RECHAZADO').length
)

const totalMontoAprobado = computed(() =>
  historial.value.reduce((acc, item) => acc + item.montoAprobado, 0)
)

const groupedHistorial = computed(() => {
  const groups = new Map<number, HistorialItem[]>()
  historial.value.forEach(item => {
    if (!groups.has(item.idLiquidacion)) {
      groups.set(item.idLiquidacion, [])
    }
    groups.get(item.idLiquidacion)?.push(item)
  })

  return Array.from(groups.entries()).map(([idLiquidacion, items]) => {
    const totalMonto = items.reduce((acc, item) => acc + item.montoAprobado, 0)
    return {
      idLiquidacion,
      items,
      totalMonto
    }
  }).sort((a, b) => b.idLiquidacion - a.idLiquidacion)
})

const isGroupOpen = (idLiquidacion: number) => openGroups.value[idLiquidacion] !== false

const toggleGroup = (idLiquidacion: number) => {
  openGroups.value[idLiquidacion] = !isGroupOpen(idLiquidacion)
}

const loadHistorial = async () => {
  loading.value = true
  error.value = ''
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'No se encontro el usuario logeado.'
      return
    }

    const [aprobacionesRes, detallesRes] = await Promise.all([
      cajaChicaApi.get('/Aprobaciones'),
      cajaChicaApi.get('/LiquidacionesDetalle')
    ])

    const aprobacionesPayload = aprobacionesRes.data as any
    const detallesPayload = detallesRes.data as any

    const aprobaciones = (Array.isArray(aprobacionesPayload) ? aprobacionesPayload : aprobacionesPayload?.data || [])
      .map(normalizeAprobacion)
      .filter((item: AprobacionItem) => item.idUsuario === userId)
      .filter((item: AprobacionItem) => item.nivelAprobacion === 1)
      .filter((item: AprobacionItem) => ['APROBADO', 'RECHAZADO'].includes(item.estado.toUpperCase()))

    const detalles: LiquidacionDetalleItem[] = (Array.isArray(detallesPayload) ? detallesPayload : detallesPayload?.data || [])
      .map(normalizeDetalle)

    const detalleMap = new Map<number, LiquidacionDetalleItem>()
    detalles.forEach((detalle: LiquidacionDetalleItem) => {
      detalleMap.set(detalle.idDetalle, detalle)
    })

    historial.value = aprobaciones.map((aprobacion: AprobacionItem) => {
      const detalle = detalleMap.get(aprobacion.idDetalle)
      return {
        idAprobacion: aprobacion.idAprobacion,
        idDetalle: aprobacion.idDetalle,
        idLiquidacion: detalle?.idLiquidacion || 0,
        nombreGasto: detalle?.nombreGasto || '-',
        concepto: detalle?.concepto || '-',
        total: detalle?.total || 0,
        estado: aprobacion.estado,
        montoAprobado: aprobacion.montoAprobado,
        observacion: aprobacion.observacion,
        fechaAprobacion: aprobacion.fechaAprobacion || ''
      }
    }).sort((a, b) => {
      const dateA = new Date(a.fechaAprobacion).getTime()
      const dateB = new Date(b.fechaAprobacion).getTime()
      return dateB - dateA
    })

    openGroups.value = historial.value.reduce<Record<number, boolean>>((acc, item) => {
      if (item.idLiquidacion && acc[item.idLiquidacion] === undefined) {
        acc[item.idLiquidacion] = true
      }
      return acc
    }, {})
  } catch {
    error.value = 'No se pudo cargar el historial de aprobaciones.'
  } finally {
    loading.value = false
  }
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')
const formatDateTime = (value: string) => {
  if (!value) return '-'
  try {
    const date = new Date(value)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return value.substring(0, 16)
  }
}

onMounted(() => {
  loadHistorial()
})
</script>
