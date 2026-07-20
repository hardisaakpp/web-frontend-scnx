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
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Liquidaciones pendientes</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Solicitudes en revision y contabilidad</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Listado</h2>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
              :disabled="pendientes.length === 0"
              @click="downloadPdf"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5 disabled:opacity-50"
              :disabled="excelLoading"
              @click="downloadExcel"
            >
              {{ excelLoading ? 'Generando...' : 'Descargar Excel' }}
            </button>
            <button
              type="button"
              class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
              @click="loadPendientes"
            >
              Refrescar
            </button>
          </div>
        </div>
        <div v-if="excelError" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ excelError }}</div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando liquidaciones...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="pendientes.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay liquidaciones pendientes.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th class="py-2 pr-3">Id</th>
                <th class="py-2 pr-3">Almacen</th>
                <th class="py-2 pr-3">Custodio</th>
                <th class="py-2 pr-3">Fecha</th>
                <th class="py-2 pr-3">Nivel</th>
                <th class="py-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in pendientes" :key="item.idLiquidacion">
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.idLiquidacion }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.codAlmacen }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreCustodio }} ({{ item.cedulaCustodio || '-' }})</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.fechaCreacion }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ getNivelAprobacion(item.estado) }}</td>
                <td class="py-2 pr-3">
                  <router-link
                    class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    :to="{ path: `/caja-chica/liquidaciones/${item.idLiquidacion}/detalle`, query: { readonly: '1' } }"
                  >
                    Detalles
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
  numeroComprobante: string
  fechaConsumo: string
  subtotalConIva: number
  subtotalSinIva: number
  iva: number
  total: number
}

const loading = ref(false)
const error = ref('')
const pendientes = ref<LiquidacionItem[]>([])
const excelLoading = ref(false)
const excelError = ref('')
const router = useRouter()

const volver = () => {
  router.back()
}

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || '/caja-chica-api',
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
  numeroComprobante: normalizeString(item.numeroComprobante ?? item.NumeroComprobante ?? ''),
  fechaConsumo: String(item.fechaConsumo ?? item.FechaConsumo ?? ''),
  subtotalConIva: Number(item.subtotal_Con_Iva ?? item.Subtotal_Con_Iva ?? item.subtotalConIva ?? 0),
  subtotalSinIva: Number(item.subtotal_Sin_Iva ?? item.Subtotal_Sin_Iva ?? item.subtotalSinIva ?? 0),
  iva: Number(item.iva ?? item.Iva ?? 0),
  total: Number(item.total ?? item.Total ?? 0)
})

const getNivelAprobacion = (estado: string) => {
  const normalized = normalizeString(estado).toUpperCase()
  if (normalized === 'SUPERVISION') return 'Supervision'
  if (normalized === 'CONTABILIDAD') return 'Contabilidad'
  return normalized || '-'
}

const loadPendientes = async () => {
  loading.value = true
  error.value = ''
  try {
    const currentUserId = getCurrentUserId()
    const response = await cajaChicaApi.get('/Liquidaciones')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    pendientes.value = items
      .map(normalizeLiquidacion)
      .filter((item: LiquidacionItem) => 
        ['SUPERVISION', 'CONTABILIDAD'].includes(item.estado.toUpperCase()) && 
        item.idUsuario === currentUserId
      )
  } catch {
    error.value = 'No se pudieron cargar las liquidaciones pendientes.'
  } finally {
    loading.value = false
  }
}

const downloadPdf = async () => {
  if (pendientes.value.length === 0) return
  const esc = (s: string | number | undefined | null) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fmt = (v: string) => v ? v.substring(0, 10) : '-'
  const fmtAmt = (v: number) => v != null ? v.toFixed(2) : '0.00'

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:20px}
    .liquidacion{border:1px solid #d1d5db;border-radius:6px;margin-bottom:28px;overflow:hidden;page-break-inside:avoid}
    .cabecera{background:#1e3a5f;color:#fff;padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
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
    .no-data{padding:10px 14px;font-size:10px;color:#9ca3af;font-style:italic}
    .footer-bar{background:#f9fafb;padding:8px 14px;display:flex;justify-content:flex-end;gap:24px;border-top:1px solid #e5e7eb}
    .footer-bar span{font-size:10px;color:#6b7280}
    .footer-bar strong{font-size:11px;color:#111}
    @media print{body{padding:8mm}@page{size:A4;margin:10mm}.liquidacion{margin-bottom:16px}}
  `

  let sectionsHtml = ''
  for (const item of pendientes.value) {
    let detallesHtml = ''
    try {
      const res = await cajaChicaApi.get('/LiquidacionesDetalle')
      const payload = res.data as any
      const detalles: any[] = (Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [])
        .map(normalizeDetalle)
        .filter((d: LiquidacionDetalleItem) => d.idLiquidacion === item.idLiquidacion)
      if (detalles.length > 0) {
        const filas = detalles.map(d => {
          const nombreGasto = esc(d.nombreGasto ?? '-')
          const concepto = esc(d.concepto ?? '-')
          const proveedor = esc(d.nombreProveedor ?? '-')
          const ruc = esc(d.ruc ?? '-')
          const comprobante = esc(d.numeroComprobante ?? '-')
          const fechaCons = fmt(String(d.fechaConsumo ?? ''))
          const subConIva = fmtAmt(Number(d.subtotalConIva ?? 0))
          const subSinIva = fmtAmt(Number(d.subtotalSinIva ?? 0))
          const iva = fmtAmt(Number(d.iva ?? 0))
          const total = fmtAmt(Number(d.total ?? 0))
          return `<tr><td>${nombreGasto}</td><td>${concepto}</td><td>${proveedor}</td><td>${ruc}</td><td>${comprobante}</td><td>${fechaCons}</td><td class="amount">${subConIva}</td><td class="amount">${subSinIva}</td><td class="amount">${iva}</td><td class="amount">${total}</td></tr>`
        }).join('')
        const totalLiq = detalles.reduce((a, d) => a + Number(d.total ?? 0), 0)
        detallesHtml = `
          <div class="section-title">Detalle de gastos</div>
          <table><thead><tr><th>Gasto</th><th>Concepto</th><th>Proveedor</th><th>RUC</th><th>Comprobante</th><th>Fecha</th><th>Base 15%</th><th>Base 0%</th><th>IVA</th><th>Total</th></tr></thead><tbody>${filas}</tbody></table>
          <div class="footer-bar"><span>Total gastos&nbsp;<strong>$${fmtAmt(totalLiq)}</strong></span></div>`
      } else {
        detallesHtml = `<div class="section-title">Detalle de gastos</div><div class="no-data">Sin detalles registrados.</div>`
      }
    } catch {
      detallesHtml = `<div class="section-title">Detalle de gastos</div><div class="no-data">No se pudieron cargar los detalles.</div>`
    }
    sectionsHtml += `
      <div class="liquidacion">
        <div class="cabecera">
          <div><div class="sub">Liquidación de caja chica</div><h2>Liquidación #${esc(item.idLiquidacion)}</h2></div>
          <div class="badge">${esc(getNivelAprobacion(item.estado))}</div>
        </div>
        <div class="meta">
          <div class="meta-item"><div class="meta-label">Almacén / Tienda</div><div class="meta-value">${esc(item.codAlmacen || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Custodio</div><div class="meta-value">${esc(item.nombreCustodio || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Cédula custodio</div><div class="meta-value">${esc(item.cedulaCustodio || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Fecha creación</div><div class="meta-value">${fmt(item.fechaCreacion)}</div></div>
          <div class="meta-item"><div class="meta-label">Estado</div><div class="meta-value">${esc(item.estado)}</div></div>
        </div>
        ${detallesHtml}
      </div>`
  }

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Liquidaciones Pendientes</title><style>${CSS}</style></head><body>
    <div style="margin-bottom:16px;border-bottom:2px solid #1e3a5f;padding-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end">
      <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Reporte</div><div style="font-size:16px;font-weight:700;color:#1e3a5f">Liquidaciones Pendientes</div></div>
      <div style="text-align:right;font-size:10px;color:#6b7280">Generado: ${new Date().toLocaleString('es-ES')}<br>${pendientes.value.length} liquidación(es)</div>
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

const downloadExcel = async () => {
  excelError.value = ''
  excelLoading.value = true
  try {
    const response = await cajaChicaApi.get('/Liquidaciones/exportar-excel', {
      responseType: 'blob'
    })
    const blob = new Blob([response.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'liquidaciones_pendientes.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    excelError.value = 'No se pudo descargar el archivo Excel.'
  } finally {
    excelLoading.value = false
  }
}

onMounted(() => {
  loadPendientes()
})
</script>
