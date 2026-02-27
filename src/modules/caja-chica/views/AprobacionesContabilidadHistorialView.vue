<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial contabilidad</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Aprobaciones y negaciones realizadas por contabilidad</p>
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
            @click="loadHistorial"
          >
            Refrescar
          </button>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="historial.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones o negaciones registradas.
        </div>
        <div v-else class="space-y-6">
          <div
            v-for="group in groupedHistorial"
            :key="group.idLiquidacion"
            class="rounded border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-900 px-4 py-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Liquidacion #{{ group.idLiquidacion }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ group.totalItems }} detalles · Tienda: {{ group.codAlmacen }} · Custodio: {{ group.nombreCustodio }} · Fecha: {{ formatDate(group.fechaCreacion) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Integracion: {{ getIntegracionEstado(group.idLiquidacion) }}
                </div>
                <div v-if="getIntegracionReferencia(group.idLiquidacion)" class="text-xs text-gray-500 dark:text-gray-400">
                  Ref: {{ getIntegracionReferencia(group.idLiquidacion) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Total: {{ formatAmount(group.totalMonto) }}</div>
                <button
                  type="button"
                  class="rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300 disabled:opacity-50"
                  :disabled="integrationLoading[group.idLiquidacion] || isIntegrado(group.idLiquidacion)"
                  @click="integrarLiquidacion(group.idLiquidacion)"
                >
                  {{ integrationLoading[group.idLiquidacion] ? 'Integrando...' : 'Integrar' }}
                </button>
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
                <thead>
                  <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th class="py-2 pr-3 pl-4">Detalle</th>
                    <th class="py-2 pr-3">Gasto</th>
                    <th class="py-2 pr-3">Concepto</th>
                    <th class="py-2 pr-3">Total</th>
                    <th class="py-2 pr-3">Estado</th>
                    <th class="py-2 pr-3">Monto</th>
                    <th class="py-2 pr-3">Comentario</th>
                    <th class="py-2 pr-3">Fecha</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="item in group.items" :key="item.idAprobacion">
                    <td class="py-2 pr-3 pl-4 text-gray-700 dark:text-gray-200">{{ item.idDetalle }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreGasto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.concepto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.total) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      <span
                        :class="item.estado === 'RECHAZADO' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'"
                      >
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.montoAprobado) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.observacion || '-' }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatDate(item.fechaAprobacion) }}</td>
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
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
  cedulaCustodio: string
  estado: string
}

interface LiquidacionDetalleItem {
  idDetalle: number
  idLiquidacion: number
  idGasto: string
  nombreGasto: string
  concepto: string
  total: number
  subtotalConIva: number
  subtotalSinIva: number
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
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
}

interface IntegracionEstadoItem {
  estado: string
  docEntry?: string | number
  docNum?: string | number
  mensaje?: string
}

/** Respuesta de Slayer al integrar liquidación */
interface SlayerIntegracionResponse {
  docEntry?: number
  docNum?: number
  message?: string
}

const loading = ref(false)
const error = ref('')
const historial = ref<HistorialItem[]>([])
const openGroups = ref<Record<number, boolean>>({})
const detallesByLiquidacion = ref<Record<number, LiquidacionDetalleItem[]>>({})
const integraciones = ref<Record<number, IntegracionEstadoItem>>({})
const integrationLoading = ref<Record<number, boolean>>({})

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const slayerApi = axios.create({
  baseURL: import.meta.env.VITE_SLAYER_API_URL || 'http://localhost:5001/api',
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

const normalizeLiquidacion = (item: any): LiquidacionItem => ({
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
  nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
  fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? ''),
  cedulaCustodio: normalizeString(item.cedulaCustodio ?? item.CedulaCustodio ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? '')
})

const normalizeDetalle = (item: any): LiquidacionDetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  idGasto: normalizeString(item.idGasto ?? item.IdGasto ?? ''),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  total: Number(item.total ?? item.Total ?? 0),
  subtotalConIva: Number(item.subtotal_Con_Iva ?? item.Subtotal_Con_Iva ?? item.subtotalConIva ?? 0),
  subtotalSinIva: Number(item.subtotal_Sin_Iva ?? item.Subtotal_Sin_Iva ?? item.subtotalSinIva ?? 0)
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
    const base = items[0]
    return {
      idLiquidacion,
      items,
      totalMonto,
      totalItems: items.length,
      codAlmacen: base?.codAlmacen || '-',
      nombreCustodio: base?.nombreCustodio || '-',
      fechaCreacion: base?.fechaCreacion || ''
    }
  })
})

const isGroupOpen = (idLiquidacion: number) => openGroups.value[idLiquidacion] !== false

const toggleGroup = (idLiquidacion: number) => {
  openGroups.value[idLiquidacion] = !isGroupOpen(idLiquidacion)
}

const isIntegrado = (idLiquidacion: number) => integraciones.value[idLiquidacion]?.estado === 'INTEGRADO'

const getIntegracionEstado = (idLiquidacion: number) => {
  return integraciones.value[idLiquidacion]?.estado || 'PENDIENTE'
}

const getIntegracionReferencia = (idLiquidacion: number) => {
  const entry = integraciones.value[idLiquidacion]
  if (!entry) return ''
  if (entry.docNum) return entry.docNum
  if (entry.docEntry) return entry.docEntry
  return ''
}

const buildDocDate = () => {
  const now = new Date()
  return now.toISOString().substring(0, 10)
}

const buildDocumentLines = (detalles: LiquidacionDetalleItem[]) => {
  return detalles.map(detalle => {
    const taxCode = detalle.subtotalConIva > 0 ? 'IVA' : 'IVA0'
    return {
      AccountCode: detalle.idGasto,
      LineTotal: detalle.total,
      TaxCode: taxCode
    }
  })
}

const integrarLiquidacion = async (idLiquidacion: number) => {
  if (integrationLoading.value[idLiquidacion]) return

  const detalles = detallesByLiquidacion.value[idLiquidacion] || []
  if (!detalles.length) {
    error.value = 'No se encontraron detalles para integrar.'
    return
  }

  const liquidacion = liquidacionesMap.value[idLiquidacion]
  if (!liquidacion || !liquidacion.cedulaCustodio) {
    error.value = 'No se encontro la cedula del custodio.'
    return
  }

  integrationLoading.value[idLiquidacion] = true
  error.value = ''
  try {
    const docDate = buildDocDate()
    const payload = {
      CardCode: liquidacion.cedulaCustodio,
      DocType: 'dDocument_Service',
      DocDate: docDate,
      DocDueDate: docDate,
      TaxDate: docDate,
      Comments: `Liquidacion ${idLiquidacion} Caja Chica`,
      DocumentLines: buildDocumentLines(detalles)
    }

    const response = await slayerApi.post<SlayerIntegracionResponse>('/LiquidacionesCompras', payload)
    const data = response.data as SlayerIntegracionResponse
    const docEntry = data?.docEntry
    const docNum = data?.docNum
    const mensaje = data?.message || 'Integracion exitosa.'

    await cajaChicaApi.post('/Integraciones/Compras', {
      idLiquidacion,
      estado: 'INTEGRADO',
      docEntry,
      docNum,
      mensaje
    })

    integraciones.value[idLiquidacion] = {
      estado: 'INTEGRADO',
      docEntry,
      docNum,
      mensaje
    }
  } catch (err: any) {
    const mensaje = err?.response?.data?.message || err?.response?.data || 'No se pudo integrar la liquidacion.'
    error.value = mensaje
    await cajaChicaApi.post('/Integraciones/Compras', {
      idLiquidacion,
      estado: 'ERROR',
      mensaje
    })
    integraciones.value[idLiquidacion] = {
      estado: 'ERROR',
      mensaje
    }
  } finally {
    integrationLoading.value[idLiquidacion] = false
  }
}

const loadIntegraciones = async (idLiquidaciones: number[]) => {
  const entries: Record<number, IntegracionEstadoItem> = {}
  await Promise.all(idLiquidaciones.map(async id => {
    try {
      const response = await cajaChicaApi.get<IntegracionEstadoItem>(`/Integraciones/Compras/${id}`)
      const payload = (response.data || {}) as Partial<IntegracionEstadoItem>
      entries[id] = {
        estado: payload.estado || 'PENDIENTE',
        docEntry: payload.docEntry,
        docNum: payload.docNum,
        mensaje: payload.mensaje
      }
    } catch {
      entries[id] = {
        estado: 'PENDIENTE'
      }
    }
  }))
  integraciones.value = entries
}

const liquidacionesMap = ref<Record<number, LiquidacionItem>>({})

const loadHistorial = async () => {
  loading.value = true
  error.value = ''
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'No se encontro el usuario logeado.'
      return
    }

    const [aprobacionesRes, detallesRes, liquidacionesRes] = await Promise.all([
      cajaChicaApi.get('/Aprobaciones'),
      cajaChicaApi.get('/LiquidacionesDetalle'),
      cajaChicaApi.get('/Liquidaciones')
    ])

    const aprobacionesPayload = aprobacionesRes.data as any
    const detallesPayload = detallesRes.data as any
    const liquidacionesPayload = liquidacionesRes.data as any

    const aprobaciones = (Array.isArray(aprobacionesPayload) ? aprobacionesPayload : aprobacionesPayload?.data || [])
      .map(normalizeAprobacion)
      .filter((item: AprobacionItem) => item.idUsuario === userId)
      .filter((item: AprobacionItem) => item.nivelAprobacion === 2)
      .filter((item: AprobacionItem) => ['APROBADO', 'RECHAZADO'].includes(item.estado.toUpperCase()))

    const detalles: LiquidacionDetalleItem[] = (Array.isArray(detallesPayload) ? detallesPayload : detallesPayload?.data || [])
      .map(normalizeDetalle)

    const liquidaciones: LiquidacionItem[] = (Array.isArray(liquidacionesPayload) ? liquidacionesPayload : liquidacionesPayload?.data || [])
      .map(normalizeLiquidacion)

    const detalleMap = new Map<number, LiquidacionDetalleItem>()
    detalles.forEach((detalle: LiquidacionDetalleItem) => {
      detalleMap.set(detalle.idDetalle, detalle)
    })

    const liquidacionMap = new Map<number, LiquidacionItem>()
    liquidaciones.forEach((liquidacion: LiquidacionItem) => {
      liquidacionMap.set(liquidacion.idLiquidacion, liquidacion)
    })

    liquidacionesMap.value = liquidaciones.reduce<Record<number, LiquidacionItem>>((acc: Record<number, LiquidacionItem>, liquidacion: LiquidacionItem) => {
      acc[liquidacion.idLiquidacion] = liquidacion
      return acc
    }, {})

    detallesByLiquidacion.value = detalles.reduce<Record<number, LiquidacionDetalleItem[]>>((acc: Record<number, LiquidacionDetalleItem[]>, detalle: LiquidacionDetalleItem) => {
      if (!acc[detalle.idLiquidacion]) {
        acc[detalle.idLiquidacion] = []
      }
      acc[detalle.idLiquidacion].push(detalle)
      return acc
    }, {})

    historial.value = aprobaciones.map((aprobacion: AprobacionItem) => {
      const detalle = detalleMap.get(aprobacion.idDetalle)
      const liquidacion = detalle ? liquidacionMap.get(detalle.idLiquidacion) : undefined
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
        fechaAprobacion: aprobacion.fechaAprobacion || '',
        codAlmacen: liquidacion?.codAlmacen || '-',
        nombreCustodio: liquidacion?.nombreCustodio || '-',
        fechaCreacion: liquidacion?.fechaCreacion || ''
      }
    })

    openGroups.value = historial.value.reduce<Record<number, boolean>>((acc, item) => {
      if (item.idLiquidacion && acc[item.idLiquidacion] === undefined) {
        acc[item.idLiquidacion] = true
      }
      return acc
    }, {})

    const ids = Array.from(new Set(historial.value.map(item => item.idLiquidacion))).filter(id => id > 0)
    await loadIntegraciones(ids)
  } catch {
    error.value = 'No se pudo cargar el historial de contabilidad.'
  } finally {
    loading.value = false
  }
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')

onMounted(() => {
  loadHistorial()
})
</script>
