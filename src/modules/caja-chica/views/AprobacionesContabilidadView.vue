<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Aprobaciones contabilidad</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Revisar novedades de supervisores y aprobar el valor final</p>
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
          No hay aprobaciones pendientes de contabilidad.
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
                <router-link
                  class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                  :to="`/caja-chica/liquidaciones/${group.idLiquidacion}/detalle`"
                >
                  Ver liquidacion
                </router-link>
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
                <thead>
                  <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                    <th class="py-2 pr-3 pl-4">Id</th>
                    <th class="py-2 pr-3">Detalle</th>
                    <th class="py-2 pr-3">Gasto</th>
                    <th class="py-2 pr-3">Total</th>
                    <th class="py-2 pr-3">Supervisor</th>
                    <th class="py-2 pr-3">Monto supervisor</th>
                    <th class="py-2 pr-3">Obs. supervisor</th>
                    <th class="py-2 pr-3">Novedad</th>
                    <th class="py-2 pr-3">Monto final</th>
                    <th class="py-2 pr-3">Comentario</th>
                    <th class="py-2 pr-3">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="item in group.items" :key="item.idAprobacion">
                    <td class="py-2 pr-3 pl-4 text-gray-700 dark:text-gray-200">{{ item.idAprobacion }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.idDetalle }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreGasto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.total) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      <div class="space-y-1">
                        <div v-if="getSupervisorDecisions(item.idDetalle).length === 0">-</div>
                        <div
                          v-for="(decision, index) in getSupervisorDecisions(item.idDetalle)"
                          :key="`${item.idDetalle}-estado-${index}`"
                          class="text-xs"
                        >
                          {{ decision.estado || '-' }}
                        </div>
                      </div>
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      <div class="space-y-1">
                        <div v-if="getSupervisorDecisions(item.idDetalle).length === 0">-</div>
                        <div
                          v-for="(decision, index) in getSupervisorDecisions(item.idDetalle)"
                          :key="`${item.idDetalle}-monto-${index}`"
                          class="text-xs"
                        >
                          {{ formatAmount(decision.montoAprobado) }}
                        </div>
                      </div>
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      <div class="space-y-1">
                        <div v-if="getSupervisorDecisions(item.idDetalle).length === 0">-</div>
                        <div
                          v-for="(decision, index) in getSupervisorDecisions(item.idDetalle)"
                          :key="`${item.idDetalle}-obs-${index}`"
                          class="text-xs"
                        >
                          {{ decision.observacion || '-' }}
                        </div>
                      </div>
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {{ hasSupervisorNovedad(item) ? 'Si' : 'No' }}
                    </td>
                    <td class="py-2 pr-3">
                      <input
                        v-model="decisions[item.idAprobacion].montoAprobado"
                        type="number"
                        step="0.01"
                        class="w-28 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white"
                      />
                    </td>
                    <td class="py-2 pr-3">
                      <input
                        v-model="decisions[item.idAprobacion].observacion"
                        type="text"
                        placeholder="Comentario contabilidad"
                        class="w-48 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white"
                      />
                    </td>
                    <td class="py-2 pr-3">
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

interface SupervisorDecision {
  montoAprobado: number
  observacion: string
  estado: string
  fechaAprobacion?: string
  idUsuario?: string
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
const supervisorByDetalle = ref<Record<number, SupervisorDecision[]>>({})

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

const normalizeSupervisorDecision = (item: any): SupervisorDecision => ({
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  fechaAprobacion: item.fechaAprobacion ?? item.FechaAprobacion,
  idUsuario: item.idUsuario ?? item.IdUsuario
})

const ensureDecision = (item: AprobacionItem) => {
  if (!decisions.value[item.idAprobacion]) {
    const supervisorDecisions = supervisorByDetalle.value[item.idDetalle] || []
    const lastDecision = supervisorDecisions[supervisorDecisions.length - 1]
    const montoBase = lastDecision?.montoAprobado && lastDecision.montoAprobado > 0
      ? lastDecision.montoAprobado
      : item.total
    decisions.value[item.idAprobacion] = {
      montoAprobado: montoBase.toFixed(2),
      observacion: ''
    }
  }
}

const loadSupervisorDecisions = async (detalleIds: number[]) => {
  if (!detalleIds.length) {
    supervisorByDetalle.value = {}
    return
  }

  const response = await cajaChicaApi.get('/Aprobaciones')
  const payload = response.data as any
  const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []

  const result: Record<number, SupervisorDecision[]> = {}
  items.forEach((item: any) => {
    const idDetalle = Number(item.idDetalle ?? item.IdDetalle ?? 0)
    const nivel = Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0)
    if (!detalleIds.includes(idDetalle) || nivel !== 1) return

    const decision = normalizeSupervisorDecision(item)
    if (!result[idDetalle]) {
      result[idDetalle] = []
    }
    result[idDetalle].push(decision)
  })

  Object.keys(result).forEach(key => {
    const id = Number(key)
    result[id].sort((a, b) => {
      const aTime = a.fechaAprobacion ? new Date(a.fechaAprobacion).getTime() : 0
      const bTime = b.fechaAprobacion ? new Date(b.fechaAprobacion).getTime() : 0
      return aTime - bTime
    })
  })

  supervisorByDetalle.value = result
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
      .filter((item: AprobacionItem) => item.nivelAprobacion === 2)

    pendientes.value = normalized
    const detalleIds = normalized.map(item => item.idDetalle)
    await loadSupervisorDecisions(detalleIds)

    normalized.forEach(ensureDecision)
    openGroups.value = normalized.reduce<Record<number, boolean>>((acc, item) => {
      if (acc[item.idLiquidacion] === undefined) {
        acc[item.idLiquidacion] = true
      }
      return acc
    }, {})
  } catch {
    error.value = 'No se pudieron cargar las aprobaciones de contabilidad.'
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

const getSupervisorDecisions = (idDetalle: number) => supervisorByDetalle.value[idDetalle] || []

const hasSupervisorNovedad = (item: AprobacionItem) => {
  const decisionsList = supervisorByDetalle.value[item.idDetalle] || []
  if (!decisionsList.length) return false
  return decisionsList.some(decision => {
    const changedMonto = decision.montoAprobado > 0 && decision.montoAprobado !== item.total
    const hasObs = Boolean(decision.observacion?.trim())
    return changedMonto || hasObs
  })
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')

onMounted(() => {
  loadPendientes()
})
</script>
