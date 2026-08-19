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
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Liquidaciones aprobadas</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Solicitudes en estado APROBADO</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Listado</h2>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
              :disabled="filteredAprobadas.length === 0"
              @click="downloadPdf"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
              @click="loadAprobadas"
            >
              Refrescar
            </button>
          </div>
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
                  Tienda: {{ item.codAlmacen }} · Custodio: {{ item.nombreCustodio }} ({{ item.cedulaCustodio || '-' }}) · Fecha: {{ formatDate(item.fechaCreacion) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Inicial: {{ formatTotalDisplay(getInitialTotal(item.idLiquidacion)) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Contabilidad: {{ formatTotalDisplay(getContabilidadTotal(item.idLiquidacion)) }}
                </div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs flex items-center gap-1"
                    @click="downloadLiquidacionPdf(item.idLiquidacion)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    PDF
                  </button>
                  <button
                    type="button"
                    class="rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                    @click="toggleItem(item.idLiquidacion)"
                  >
                    {{ isItemOpen(item.idLiquidacion) ? 'Ocultar' : 'Ver' }}
                  </button>
                </div>
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
                    <th class="py-2 pr-3">Gasto</th>
                    <th class="py-2 pr-3">Concepto</th>
                    <th class="py-2 pr-3">Total</th>
                    <th class="py-2 pr-3">Monto contabilidad</th>
                    <th class="py-2 pr-3">Obs. contabilidad</th>
                    <th class="py-2 pr-3">Aprobado por</th>
                    <th class="py-2 pr-3">Fecha aprobación</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="detalle in detallesByLiquidacion[item.idLiquidacion]" :key="detalle.idDetalle">
                    <td class="py-2 pr-3 pl-4 text-gray-700 dark:text-gray-200">{{ detalle.nombreGasto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ detalle.concepto }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(detalle.total) }}</td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {{ formatAmount(getDetalleContabilidadMonto(detalle.idDetalle, detalle.total)) }}
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {{ getDetalleContabilidadObs(detalle.idDetalle) || '-' }}
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {{ getDetalleContabilidadAprobador(detalle.idDetalle) }}
                    </td>
                    <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">
                      {{ getContabilidadFecha(detalle.idDetalle) }}
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resolveUserNames } from '../utils/resolveUserNames'
import { cajaChicaApi } from '@/lib/http'
import { APP_LOCALE } from '@/plugins/locale'


const authStore = useAuthStore()

interface LiquidacionItem {
  idLiquidacion: number
  idUsuario: string
  estado: string
  codAlmacen: string
  nombreCustodio: string
  cedulaCustodio: string
  fechaCreacion: string
}

interface LiquidacionDetalleItem {
  idDetalle: number
  idLiquidacion: number
  nombreGasto: string
  concepto: string
  ruc: string
  nombreProveedor: string
  subtotalConIva: number
  subtotalSinIva: number
  iva: number
  total: number
}

interface AprobacionItem {
  idDetalle: number
  nivelAprobacion: number
  estado: string
  montoAprobado: number
  observacion: string
  fechaAprobacion?: string
  idUsuario?: string
  usuarioNombre?: string
}

const loading = ref(false)
const error = ref('')
const aprobadas = ref<LiquidacionItem[]>([])
const router = useRouter()
const _today = new Date()
const _toISODate = (d: Date) => d.toISOString().substring(0, 10)
const filterFrom = ref(_toISODate(new Date(_today.getFullYear(), _today.getMonth(), _today.getDate() - 3)))
const filterTo = ref(_toISODate(_today))
const openItems = ref<Record<number, boolean>>({})
const detallesByLiquidacion = ref<Record<number, LiquidacionDetalleItem[]>>({})
const detalleLoading = ref<Record<number, boolean>>({})
const detalleError = ref<Record<number, string>>({})
const contabilidadByDetalle = ref<Record<number, AprobacionItem>>({})
const aprobadorNombreById = ref<Record<string, string>>({})

const volver = () => {
  router.back()
}




const normalizeString = (value: any) => String(value ?? '').trim()

const getCurrentUserId = (): string => {
  if (authStore.userData?.id) return authStore.userData.id
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return ''
    const user = JSON.parse(userStr) as { id?: string }
    return user.id || ''
  } catch {
    return ''
  }
}

const normalizeLiquidacion = (item: any): LiquidacionItem => ({
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
  nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
  cedulaCustodio: normalizeString(item.cedulaCustodio ?? item.CedulaCustodio ?? ''),
  fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? '')
})

const normalizeDetalle = (item: any): LiquidacionDetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  ruc: normalizeString(item.ruc ?? item.Ruc ?? ''),
  nombreProveedor: normalizeString(item.nombreProveedor ?? item.NombreProveedor ?? ''),
  subtotalConIva: Number(item.subtotal_Con_Iva ?? item.Subtotal_Con_Iva ?? item.subtotalConIva ?? 0),
  subtotalSinIva: Number(item.subtotal_Sin_Iva ?? item.Subtotal_Sin_Iva ?? item.subtotalSinIva ?? 0),
  iva: Number(item.iva ?? item.Iva ?? 0),
  total: Number(item.total ?? item.Total ?? 0)
})

const normalizeAprobacion = (item: any): AprobacionItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  nivelAprobacion: Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
  fechaAprobacion: item.fechaAprobacion ?? item.FechaAprobacion,
  idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? item.usuarioAprobador ?? item.UsuarioAprobador ?? ''),
  usuarioNombre: normalizeString(
    item.usuarioNombre ??
    item.UsuarioNombre ??
    item.nombreUsuario ??
    item.NombreUsuario ??
    item.nombreAprobador ??
    item.NombreAprobador ??
    ''
  )
})

const filteredAprobadas = computed(() => {
  const currentUserId = getCurrentUserId()
  const from = filterFrom.value ? new Date(filterFrom.value).getTime() : null
  const to = filterTo.value ? new Date(filterTo.value).getTime() : null
  return aprobadas.value.filter(item => {
    const isCurrentUser = item.idUsuario === currentUserId
    const time = item.fechaCreacion ? new Date(item.fechaCreacion).getTime() : null
    if (from && time && time < from) return false
    if (to && time && time > to + 24 * 60 * 60 * 1000 - 1) return false
    return isCurrentUser
  })
})

const clearFilters = () => {
  filterFrom.value = ''
  filterTo.value = ''
}

watch([filterFrom, filterTo], () => {
  loadAprobadas()
})

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
    const response = await cajaChicaApi.get('/LiquidacionesDetalle')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    detallesByLiquidacion.value[idLiquidacion] = items
      .map(normalizeDetalle)
      .filter((d: LiquidacionDetalleItem) => d.idLiquidacion === idLiquidacion)
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

  const namesMap = { ...aprobadorNombreById.value }
  aprobaciones.forEach((item: AprobacionItem) => {
    const id = normalizeString(item.idUsuario)
    const nombre = normalizeString(item.usuarioNombre)
    if (id && nombre) {
      namesMap[id] = nombre
    }
  })
  aprobadorNombreById.value = namesMap

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

  const idsPendientes: string[] = Array.from(
    new Set(
      aprobaciones
        .map((item: AprobacionItem) => normalizeString(item.idUsuario))
        .filter((id: string): id is string => !!id && !aprobadorNombreById.value[id])
    )
  )

  if (idsPendientes.length > 0) {
    const resolved = await resolveUserNames(idsPendientes)
    aprobadorNombreById.value = { ...aprobadorNombreById.value, ...resolved }
  }
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

const getDetalleContabilidadAprobador = (idDetalle: number) => {
  const decision = contabilidadByDetalle.value[idDetalle]
  if (!decision) return '-'
  if (decision.usuarioNombre) return decision.usuarioNombre
  if (decision.idUsuario) return aprobadorNombreById.value[decision.idUsuario] || decision.idUsuario
  return '-'
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
    const currentUserId = getCurrentUserId()
    await loadAprobacionesContabilidad()
    const params: Record<string, string> = {}
    if (filterFrom.value) params.fechaDesde = filterFrom.value
    if (filterTo.value) params.fechaHasta = filterTo.value
    const response = await cajaChicaApi.get('/Liquidaciones', { params })
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    aprobadas.value = items
      .map(normalizeLiquidacion)
      .filter((item: LiquidacionItem) => item.estado.toUpperCase() === 'APROBADO' && item.idUsuario === currentUserId)
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

const getContabilidadFecha = (idDetalle: number): string => {
  const dec = contabilidadByDetalle.value[idDetalle]
  const fa = dec?.fechaAprobacion
  return fa ? String(fa).substring(0, 10) : '-'
}

const downloadLiquidacionPdf = async (idLiquidacion: number) => {
  const item = aprobadas.value.find(a => a.idLiquidacion === idLiquidacion)
  if (!item) return
  const esc = (s: string | number | undefined | null) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fmt = (v: string) => v ? v.substring(0, 10) : '-'
  const fmtAmt = (v: number) => v != null ? v.toFixed(2) : '0.00'

  if (!detallesByLiquidacion.value[idLiquidacion]) {
    try {
      const res = await cajaChicaApi.get('/LiquidacionesDetalle')
      const p = res.data as any
      const arr: any[] = Array.isArray(p) ? p : Array.isArray(p?.data) ? p.data : []
      detallesByLiquidacion.value[idLiquidacion] = arr
        .map(normalizeDetalle)
        .filter((d: LiquidacionDetalleItem) => d.idLiquidacion === idLiquidacion)
    } catch {
      detallesByLiquidacion.value[idLiquidacion] = []
    }
  }

  const detalles = detallesByLiquidacion.value[idLiquidacion] || []
  const initialTotal = detalles.reduce((a, d) => a + d.total, 0)
  const contabilidadTotal = detalles.reduce((a, d) => a + getDetalleContabilidadMonto(d.idDetalle, d.total), 0)

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:20px}
    .liquidacion{border:1px solid #d1d5db;border-radius:6px;overflow:hidden}
    .cabecera{background:#065f46;color:#fff;padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
    .cabecera h2{font-size:13px;font-weight:700;margin-bottom:2px}
    .cabecera .sub{font-size:10px;opacity:.8}
    .cabecera .badge{background:rgba(255,255,255,.18);border-radius:4px;padding:3px 8px;font-size:10px;font-weight:600;white-space:nowrap}
    .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid #e5e7eb}
    .meta-item{padding:8px 14px;border-right:1px solid #e5e7eb}
    .meta-item:last-child{border-right:none}
    .meta-label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:2px}
    .meta-value{font-size:11px;font-weight:600;color:#111}
    .section-title{background:#f9fafb;padding:6px 14px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#374151;border-bottom:1px solid #e5e7eb}
    table{width:100%;border-collapse:collapse}
    th{background:#f3f4f6;text-align:left;padding:6px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;border-bottom:1px solid #e5e7eb}
    td{padding:5px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:10px}
    tr:last-child td{border-bottom:none}
    .amount{text-align:right;font-variant-numeric:tabular-nums}
    .highlight{background:#f0fdf4}
    .no-data{padding:10px 14px;font-size:10px;color:#9ca3af;font-style:italic}
    .footer-bar{background:#f9fafb;padding:8px 14px;display:flex;justify-content:flex-end;gap:24px;border-top:1px solid #e5e7eb}
    .footer-bar span{font-size:10px;color:#6b7280}
    .footer-bar strong{font-size:11px;color:#111}
    @media print{body{padding:8mm}@page{size:A4;margin:10mm}}
  `

  let detallesHtml = ''
  if (detalles.length > 0) {
    const filas = detalles.map(d => {
      const monto = getDetalleContabilidadMonto(d.idDetalle, d.total)
      const obs = getDetalleContabilidadObs(d.idDetalle)
      const aprobadoPor = getDetalleContabilidadAprobador(d.idDetalle)
      const fechaAprob = getContabilidadFecha(d.idDetalle)
      const iva = d.iva > 0 ? d.iva : Math.max(0, d.total - d.subtotalConIva - d.subtotalSinIva)
      return `<tr>
        <td>${esc(d.nombreGasto)}</td>
        <td>${esc(d.concepto)}</td>
        <td>${esc(d.nombreProveedor || '-')}</td>
        <td>${esc(d.ruc || '-')}</td>
        <td class="amount">${fmtAmt(iva)}</td>
        <td class="amount">${fmtAmt(d.total)}</td>
        <td class="amount highlight">${fmtAmt(monto)}</td>
        <td>${esc(obs || '-')}</td>
        <td>${esc(aprobadoPor)}</td>
        <td>${esc(fechaAprob)}</td>
      </tr>`
    }).join('')
    detallesHtml = `
      <div class="section-title">Detalle de gastos</div>
      <table><thead><tr><th>Gasto</th><th>Concepto</th><th>Proveedor</th><th>RUC</th><th>IVA</th><th>Total inicial</th><th>Monto contabilidad</th><th>Obs. contabilidad</th><th>Aprobado por</th><th>Fecha aprobación</th></tr></thead><tbody>${filas}</tbody></table>
      <div class="footer-bar">
        <span>Total inicial&nbsp;<strong>$${fmtAmt(initialTotal)}</strong></span>
        <span>Total contabilidad&nbsp;<strong>$${fmtAmt(contabilidadTotal)}</strong></span>
      </div>`
  } else {
    detallesHtml = `<div class="section-title">Detalle de gastos</div><div class="no-data">Sin detalles registrados.</div>`
  }

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Liquidación #${item.idLiquidacion}</title><style>${CSS}</style></head><body>
    <div style="margin-bottom:16px;border-bottom:2px solid #065f46;padding-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end">
      <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Reporte</div><div style="font-size:16px;font-weight:700;color:#065f46">Liquidación Aprobada</div></div>
      <div style="text-align:right;font-size:10px;color:#6b7280">Generado: ${new Date().toLocaleString(APP_LOCALE)}</div>
    </div>
    <div class="liquidacion">
      <div class="cabecera">
        <div><div class="sub">Liquidación de caja chica — APROBADA</div><h2>Liquidación #${esc(item.idLiquidacion)}</h2></div>
        <div class="badge">APROBADO</div>
      </div>
      <div class="meta">
        <div class="meta-item"><div class="meta-label">Almacén / Tienda</div><div class="meta-value">${esc(item.codAlmacen || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">Custodio</div><div class="meta-value">${esc(item.nombreCustodio || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">Cédula custodio</div><div class="meta-value">${esc(item.cedulaCustodio || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">Fecha creación</div><div class="meta-value">${fmt(item.fechaCreacion)}</div></div>
        <div class="meta-item"><div class="meta-label">Estado</div><div class="meta-value">${esc(item.estado)}</div></div>
      </div>
      ${detallesHtml}
    </div>
  </body></html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Por favor permite ventanas emergentes para descargar el PDF.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}

const escPdf = (s: string | number | undefined | null) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fmtPdf = (v: string) => v ? v.substring(0, 10) : '-'
const fmtAmtPdf = (v: number) => v != null ? v.toFixed(2) : '0.00'

const ensureDetallesLoadedForPdf = async (idLiquidacion: number) => {
  if (detallesByLiquidacion.value[idLiquidacion]) return
  try {
    const res = await cajaChicaApi.get('/LiquidacionesDetalle')
    const payload = res.data as any
    let arr: any[]
    if (Array.isArray(payload)) {
      arr = payload
    } else if (Array.isArray(payload?.data)) {
      arr = payload.data
    } else {
      arr = []
    }
    detallesByLiquidacion.value[idLiquidacion] = arr
      .map(normalizeDetalle)
      .filter((d: LiquidacionDetalleItem) => d.idLiquidacion === idLiquidacion)
  } catch {
    detallesByLiquidacion.value[idLiquidacion] = []
  }
}

const buildDetalleRowHtml = (d: LiquidacionDetalleItem) => {
  const monto = getDetalleContabilidadMonto(d.idDetalle, d.total)
  const obs = getDetalleContabilidadObs(d.idDetalle)
  const aprobadoPor = getDetalleContabilidadAprobador(d.idDetalle)
  const fechaAprob = getContabilidadFecha(d.idDetalle)
  const iva = d.iva > 0 ? d.iva : Math.max(0, d.total - d.subtotalConIva - d.subtotalSinIva)
  return `<tr>
    <td>${escPdf(d.nombreGasto)}</td>
    <td>${escPdf(d.concepto)}</td>
    <td>${escPdf(d.nombreProveedor || '-')}</td>
    <td>${escPdf(d.ruc || '-')}</td>
    <td class="amount">${fmtAmtPdf(iva)}</td>
    <td class="amount">${fmtAmtPdf(d.total)}</td>
    <td class="amount highlight">${fmtAmtPdf(monto)}</td>
    <td>${escPdf(obs || '-')}</td>
    <td>${escPdf(aprobadoPor)}</td>
    <td>${escPdf(fechaAprob)}</td>
  </tr>`
}

const buildDetallesSectionHtml = (detalles: LiquidacionDetalleItem[]) => {
  if (detalles.length === 0) {
    return `<div class="section-title">Detalle de gastos</div><div class="no-data">Sin detalles registrados.</div>`
  }

  const initialTotal = detalles.reduce((a, d) => a + d.total, 0)
  const contabilidadTotal = detalles.reduce((a, d) => a + getDetalleContabilidadMonto(d.idDetalle, d.total), 0)
  const filas = detalles.map(buildDetalleRowHtml).join('')

  return `
    <div class="section-title">Detalle de gastos</div>
    <table><thead><tr><th>Gasto</th><th>Concepto</th><th>Proveedor</th><th>RUC</th><th>IVA</th><th>Total inicial</th><th>Monto contabilidad</th><th>Obs. contabilidad</th><th>Aprobado por</th><th>Fecha aprobación</th></tr></thead><tbody>${filas}</tbody></table>
    <div class="footer-bar">
      <span>Total inicial&nbsp;<strong>$${fmtAmtPdf(initialTotal)}</strong></span>
      <span>Total contabilidad&nbsp;<strong>$${fmtAmtPdf(contabilidadTotal)}</strong></span>
    </div>`
}

const buildLiquidacionSectionHtml = async (item: LiquidacionItem) => {
  await ensureDetallesLoadedForPdf(item.idLiquidacion)
  const detalles = detallesByLiquidacion.value[item.idLiquidacion] || []

  return `
    <div class="liquidacion">
      <div class="cabecera">
        <div><div class="sub">Liquidación de caja chica — APROBADA</div><h2>Liquidación #${escPdf(item.idLiquidacion)}</h2></div>
        <div class="badge">APROBADO</div>
      </div>
      <div class="meta">
        <div class="meta-item"><div class="meta-label">Almacén / Tienda</div><div class="meta-value">${escPdf(item.codAlmacen || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">Custodio</div><div class="meta-value">${escPdf(item.nombreCustodio || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">Cédula custodio</div><div class="meta-value">${escPdf(item.cedulaCustodio || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">Fecha creación</div><div class="meta-value">${fmtPdf(item.fechaCreacion)}</div></div>
        <div class="meta-item"><div class="meta-label">Estado</div><div class="meta-value">${escPdf(item.estado)}</div></div>
      </div>
      ${buildDetallesSectionHtml(detalles)}
    </div>`
}

const downloadPdf = async () => {
  const items = filteredAprobadas.value
  if (items.length === 0) return

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:20px}
    .liquidacion{border:1px solid #d1d5db;border-radius:6px;margin-bottom:28px;overflow:hidden;page-break-inside:avoid}
    .cabecera{background:#065f46;color:#fff;padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
    .cabecera h2{font-size:13px;font-weight:700;margin-bottom:2px}
    .cabecera .sub{font-size:10px;opacity:.8}
    .cabecera .badge{background:rgba(255,255,255,.18);border-radius:4px;padding:3px 8px;font-size:10px;font-weight:600;white-space:nowrap}
    .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid #e5e7eb}
    .meta-item{padding:8px 14px;border-right:1px solid #e5e7eb}
    .meta-item:last-child{border-right:none}
    .meta-label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:2px}
    .meta-value{font-size:11px;font-weight:600;color:#111}
    .section-title{background:#f9fafb;padding:6px 14px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#374151;border-bottom:1px solid #e5e7eb}
    table{width:100%;border-collapse:collapse}
    th{background:#f3f4f6;text-align:left;padding:6px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;border-bottom:1px solid #e5e7eb}
    td{padding:5px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:10px}
    tr:last-child td{border-bottom:none}
    .amount{text-align:right;font-variant-numeric:tabular-nums}
    .highlight{background:#f0fdf4}
    .no-data{padding:10px 14px;font-size:10px;color:#9ca3af;font-style:italic}
    .footer-bar{background:#f9fafb;padding:8px 14px;display:flex;justify-content:flex-end;gap:24px;border-top:1px solid #e5e7eb}
    .footer-bar span{font-size:10px;color:#6b7280}
    .footer-bar strong{font-size:11px;color:#111}
    @media print{body{padding:8mm}@page{size:A4;margin:10mm}.liquidacion{margin-bottom:16px}}
  `

  let sectionsHtml = ''
  for (const item of items) {
    sectionsHtml += await buildLiquidacionSectionHtml(item)
  }

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Liquidaciones Aprobadas</title><style>${CSS}</style></head><body>
    <div style="margin-bottom:16px;border-bottom:2px solid #065f46;padding-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end">
      <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Reporte</div><div style="font-size:16px;font-weight:700;color:#065f46">Liquidaciones Aprobadas</div></div>
      <div style="text-align:right;font-size:10px;color:#6b7280">Generado: ${new Date().toLocaleString(APP_LOCALE)}<br>${items.length} liquidación(es)</div>
    </div>
    ${sectionsHtml}
  </body></html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Por favor permite ventanas emergentes para descargar el PDF.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}

onMounted(() => {
  loadAprobadas()
})
</script>
