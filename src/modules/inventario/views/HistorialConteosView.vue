<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4 no-print">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Mis Conteos</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Lo que enviaste como conteo o reconteo en cada toma física, incluidas las ya cerradas.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn-secondary flex-shrink-0" @click="router.back()">Volver</button>
        <button type="button" class="btn-secondary flex-shrink-0" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
      </div>
    </div>

    <div class="mb-4 flex items-center gap-2 no-print">
      <label class="text-sm text-gray-600 dark:text-gray-400" for="desde">Desde</label>
      <input id="desde" v-model="desde" type="date" class="date-input" @change="cargar" />
      <span class="text-xs text-gray-400">Por defecto, últimos 15 días.</span>
    </div>

    <div v-if="error" class="mb-4 alert-error no-print">{{ error }}</div>
    <div v-if="accionError" class="mb-4 alert-error no-print">{{ accionError }}</div>

    <div v-if="loading && sesiones.length === 0" class="py-20 text-center text-sm text-gray-500 dark:text-gray-400 no-print">
      Cargando...
    </div>

    <div v-else-if="sesiones.length === 0" class="py-20 text-center no-print">
      <ArchiveBoxXMarkIcon class="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Todavía no has enviado ningún conteo.</p>
    </div>

    <div v-else class="space-y-4 no-print">
      <div
        v-for="s in sesiones"
        :key="s.sessionId"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['badge', badgeClass(s.status)]">{{ statusLabel(s.status) }}</span>
              <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ s.warehouseCode }}</span>
              <span
                v-if="s.status === 'Closed' && s.hasApprovedAdjustment"
                class="inline-flex items-center gap-1 text-emerald-500"
                title="Cerrado con informe de ajuste aprobado"
              >
                <CheckBadgeIcon class="w-4 h-4" />
              </span>
              <span
                v-else-if="s.status === 'Closed' && s.adjustmentDiscarded"
                class="inline-flex items-center gap-1 text-gray-400"
                title="Cerrado — revisado sin ajuste"
              >
                <CheckBadgeIcon class="w-4 h-4" />
              </span>
            </div>
            <h2 class="mt-2 text-base font-semibold text-gray-900 dark:text-white">{{ s.warehouseName }}</h2>
            <p v-if="s.description" class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{{ s.description }}</p>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Apertura: {{ formatDate(s.openedAt) }}</span>
              <span v-if="s.closedAt">Cierre: {{ formatDate(s.closedAt) }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-2 flex-shrink-0">
            <button
              v-if="s.hasApprovedAdjustment"
              type="button"
              class="btn-secondary"
              @click="verAjuste(s)"
            >
              Ver ajuste final
            </button>
            <button type="button" class="btn-secondary" :disabled="accionEnCurso === s.sessionId" @click="imprimir(s)">
              {{ accionEnCurso === s.sessionId ? 'Generando...' : 'Imprimir' }}
            </button>
            <button type="button" class="btn-secondary" :disabled="accionEnCurso === s.sessionId" @click="descargarXLSX(s)">
              {{ accionEnCurso === s.sessionId ? 'Generando...' : 'Descargar Excel' }}
            </button>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <span class="stat"><strong>{{ s.totalQuantity }}</strong> cantidad total (tuya)</span>
          <span class="stat"><strong>{{ s.skuCount }}</strong> SKUs (tuyos)</span>
        </div>
        <p class="mt-1 text-xs text-gray-400">
          Imprimir / Descargar Excel incluyen el conteo total de la toma (todos los usuarios), no solo el tuyo.
        </p>
      </div>
    </div>

    <!-- Área exclusiva de impresión: solo se muestra en @media print. Muestra el conteo TOTAL de
         la toma (todos los usuarios), no solo el del usuario logueado. -->
    <div v-if="printing" class="print-only">
      <div class="print-header">
        <h1>Historial de Conteo — {{ printing.session.warehouseName }} ({{ printing.session.warehouseCode }})</h1>
        <p class="print-meta">
          Estado: {{ statusLabel(printing.session.status) }} · Apertura: {{ formatDate(printing.session.openedAt) }}<span v-if="printing.session.closedAt"> · Cierre: {{ formatDate(printing.session.closedAt) }}</span>
        </p>
        <p v-if="printing.session.description" class="print-meta">{{ printing.session.description }}</p>
      </div>

      <div class="print-totals">
        <span><strong>{{ printing.totalQuantity }}</strong> unidades totales</span>
        <span><strong>{{ printing.skuCount }}</strong> SKUs</span>
        <span><strong>{{ printing.summary.length }}</strong> usuario(s) participante(s)</span>
      </div>

      <h2>Por usuario</h2>
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Total escaneos</th>
            <th>Ítems únicos</th>
            <th>Primer envío</th>
            <th>Último envío</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in printing.summary" :key="u.userId">
            <td>{{ u.userName || u.userId }}</td>
            <td>{{ u.totalScans }}</td>
            <td>{{ u.uniqueItems }}</td>
            <td>{{ formatDate(u.firstScan) }}</td>
            <td>{{ formatDate(u.lastScan) }}</td>
          </tr>
        </tbody>
      </table>

      <h2>Detalle por ítem — toma completa</h2>
      <table>
        <thead>
          <tr>
            <th>Ítem</th>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Ronda</th>
            <th>Último envío</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in printing.lines" :key="`${line.itemCode}-${line.round}`">
            <td>{{ line.itemCode }}</td>
            <td>{{ line.itemDescription || '-' }}</td>
            <td>{{ line.quantity }}</td>
            <td>{{ line.round === 2 ? 'Reconteo' : 'Conteo' }}</td>
            <td>{{ formatDate(line.lastCountedAt) }}</td>
          </tr>
        </tbody>
      </table>

      <p class="print-footer">Generado el {{ formatDate(printing.generatedAt) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { ArrowPathIcon, ArchiveBoxXMarkIcon } from '@heroicons/vue/24/outline'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { MyCountHistorySessionDto, InventorySessionStatus, UserScanSummaryDto } from '../types'

const router = useRouter()
const sesiones = ref<MyCountHistorySessionDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const accionError = ref<string | null>(null)
const accionEnCurso = ref<string | null>(null)

interface TotalLine {
  itemCode: string
  itemDescription: string | null
  quantity: number
  round: number
  lastCountedAt: string
}

interface PrintData {
  session: MyCountHistorySessionDto
  lines: TotalLine[]
  summary: UserScanSummaryDto[]
  totalQuantity: number
  skuCount: number
  generatedAt: string
}

const printing = ref<PrintData | null>(null)

function defaultDesde(): string {
  const d = new Date()
  d.setDate(d.getDate() - 15)
  return d.toISOString().slice(0, 10)
}

const desde = ref(defaultDesde())

function statusLabel(status: InventorySessionStatus): string {
  return { Open: 'Abierta', Recount: 'Reconteo', Closed: 'Cerrada', Expired: 'No realizado' }[status] ?? status
}

function badgeClass(status: InventorySessionStatus): string {
  return {
    Open: 'badge-blue',
    Recount: 'badge-amber',
    Closed: 'badge-gray',
    Expired: 'badge-red'
  }[status] ?? 'badge-gray'
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function verAjuste(session: MyCountHistorySessionDto) {
  router.push({ name: 'inventario-ajuste-final-tienda', params: { sessionId: session.sessionId } })
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    sesiones.value = await inventarioSesionesService.getMiHistorial(desde.value)
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar el historial.'
  } finally {
    loading.value = false
  }
}

// Conteo TOTAL de la toma (todos los usuarios) para imprimir/exportar — a diferencia del listado
// en pantalla, que muestra "mis" conteos (getMiHistorial), acá agregamos scans-by-user (todos los
// usuarios) por ítem+ronda, sumando cantidades y quedándonos con el envío más reciente.
async function buildResumenTotal(sessionId: string): Promise<{ lines: TotalLine[]; summary: UserScanSummaryDto[] }> {
  const { summary, detail } = await inventarioSesionesService.getScansByUser(sessionId)

  const byKey = new Map<string, TotalLine>()
  for (const entry of detail) {
    const key = `${entry.itemCode}__${entry.round}`
    const existing = byKey.get(key)
    if (existing) {
      existing.quantity += entry.quantity
      if (entry.scannedAt > existing.lastCountedAt) existing.lastCountedAt = entry.scannedAt
    } else {
      byKey.set(key, {
        itemCode: entry.itemCode,
        itemDescription: entry.description ?? null,
        quantity: entry.quantity,
        round: entry.round,
        lastCountedAt: entry.scannedAt
      })
    }
  }

  const lines = [...byKey.values()].sort((a, b) =>
    a.itemCode === b.itemCode ? a.round - b.round : a.itemCode.localeCompare(b.itemCode)
  )
  return { lines, summary }
}

async function imprimir(session: MyCountHistorySessionDto) {
  accionEnCurso.value = session.sessionId
  accionError.value = null
  try {
    const { lines, summary } = await buildResumenTotal(session.sessionId)
    printing.value = {
      session,
      lines,
      summary,
      totalQuantity: lines.reduce((acc, l) => acc + l.quantity, 0),
      skuCount: new Set(lines.map(l => l.itemCode)).size,
      generatedAt: new Date().toISOString()
    }
    await nextTick()
    const previousTitle = document.title
    document.title = `Historial de Conteo - ${session.warehouseCode}`
    window.print()
    document.title = previousTitle
    printing.value = null
  } catch (e: any) {
    accionError.value = e.message ?? 'No se pudo generar el historial para imprimir.'
  } finally {
    accionEnCurso.value = null
  }
}

async function descargarXLSX(session: MyCountHistorySessionDto) {
  accionEnCurso.value = session.sessionId
  accionError.value = null
  try {
    const { lines, summary } = await buildResumenTotal(session.sessionId)

    const workbook = XLSX.utils.book_new()

    const detalleHeader = ['Ítem', 'Descripción', 'Cantidad', 'Ronda', 'Último envío']
    const detalleRows = lines.map(line => [
      line.itemCode,
      line.itemDescription || '',
      line.quantity,
      line.round === 2 ? 'Reconteo' : 'Conteo',
      formatDate(line.lastCountedAt)
    ])
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([detalleHeader, ...detalleRows]), 'Detalle')

    const usuarioHeader = ['Usuario', 'Total escaneos', 'Ítems únicos', 'Primer envío', 'Último envío']
    const usuarioRows = summary.map(u => [
      u.userName || u.userId,
      u.totalScans,
      u.uniqueItems,
      formatDate(u.firstScan),
      formatDate(u.lastScan)
    ])
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([usuarioHeader, ...usuarioRows]), 'Por Usuario')

    XLSX.writeFile(workbook, `historial_${session.warehouseCode}_${session.sessionId.slice(0, 8)}.xlsx`)
  } catch (e: any) {
    accionError.value = e.message ?? 'No se pudo generar el archivo Excel.'
  } finally {
    accionEnCurso.value = null
  }
}

onMounted(cargar)
</script>

<style scoped>
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.badge-amber { @apply bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.badge-red { @apply bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.th { @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300; }
.date-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.stat { @apply text-sm text-gray-600 dark:text-gray-400; }

.print-only { display: none; }

@media print {
  .no-print { display: none !important; }
  .print-only { display: block; color: #111; font-family: Arial, Helvetica, sans-serif; }

  .print-only .print-header {
    border-bottom: 2px solid #111;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .print-only .print-header h1 { font-size: 18px; margin: 0 0 4px; }
  .print-only .print-meta { font-size: 12px; margin: 2px 0; color: #333; }

  .print-only .print-totals {
    display: flex;
    gap: 24px;
    font-size: 13px;
    margin-bottom: 14px;
    padding: 6px 0;
    border-bottom: 1px solid #999;
  }

  .print-only h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin: 16px 0 6px;
  }

  .print-only table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .print-only th, .print-only td { border: 1px solid #333; padding: 4px 8px; text-align: left; font-size: 11px; }
  .print-only thead th { background: #eee; font-weight: 600; }
  .print-only tbody tr:nth-child(even) { background: #fafafa; }

  .print-only .print-footer {
    margin-top: 14px;
    font-size: 10px;
    color: #555;
    text-align: right;
  }

  @page { margin: 14mm; }
}
</style>
