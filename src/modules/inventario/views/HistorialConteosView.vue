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
            </div>
            <h2 class="mt-2 text-base font-semibold text-gray-900 dark:text-white">{{ s.warehouseName }}</h2>
            <p v-if="s.description" class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{{ s.description }}</p>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Apertura: {{ formatDate(s.openedAt) }}</span>
              <span v-if="s.closedAt">Cierre: {{ formatDate(s.closedAt) }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-2 flex-shrink-0">
            <button type="button" class="btn-secondary" @click="imprimir(s)">Imprimir</button>
            <button type="button" class="btn-secondary" @click="descargarCSV(s)">Descargar CSV</button>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-4">
          <div class="flex items-center gap-3">
            <span class="stat"><strong>{{ s.totalQuantity }}</strong> cantidad total</span>
            <span class="stat"><strong>{{ s.skuCount }}</strong> SKUs</span>
          </div>
          <button type="button" class="link" @click="toggleDetalle(s.sessionId)">
            {{ expandidos.has(s.sessionId) ? 'Ocultar detalle' : 'Ver detalle' }}
          </button>
        </div>

        <div v-if="expandidos.has(s.sessionId)" class="mt-3 overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th class="th">Ítem</th>
                <th class="th">Descripción</th>
                <th class="th text-right">Cantidad</th>
                <th class="th text-right">Ronda</th>
                <th class="th">Último envío</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60">
              <tr v-for="line in s.lines" :key="`${line.itemCode}-${line.round}`">
                <td class="td font-mono text-xs">{{ line.itemCode }}</td>
                <td class="td">{{ line.itemDescription || '-' }}</td>
                <td class="td text-right">{{ line.quantity }}</td>
                <td class="td text-right">{{ line.round === 2 ? 'Reconteo' : 'Conteo' }}</td>
                <td class="td">{{ formatDate(line.lastCountedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Área exclusiva de impresión: solo se muestra en @media print para la sesión seleccionada -->
    <div v-if="printing" class="print-only">
      <h1>Historial de Conteo — {{ printing.warehouseName }} ({{ printing.warehouseCode }})</h1>
      <p>Estado: {{ statusLabel(printing.status) }} · Apertura: {{ formatDate(printing.openedAt) }}<span v-if="printing.closedAt"> · Cierre: {{ formatDate(printing.closedAt) }}</span></p>
      <p v-if="printing.description">{{ printing.description }}</p>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowPathIcon, ArchiveBoxXMarkIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { MyCountHistorySessionDto, InventorySessionStatus } from '../types'
import { APP_LOCALE } from '@/plugins/locale'

const router = useRouter()
const sesiones = ref<MyCountHistorySessionDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const printing = ref<MyCountHistorySessionDto | null>(null)
const expandidos = ref<Set<string>>(new Set())

function defaultDesde(): string {
  const d = new Date()
  d.setDate(d.getDate() - 15)
  return d.toISOString().slice(0, 10)
}

const desde = ref(defaultDesde())

function toggleDetalle(sessionId: string) {
  if (expandidos.value.has(sessionId)) {
    expandidos.value.delete(sessionId)
  } else {
    expandidos.value.add(sessionId)
  }
  expandidos.value = new Set(expandidos.value)
}

function statusLabel(status: InventorySessionStatus): string {
  return { Open: 'Abierta', Recount: 'Reconteo', Closed: 'Cerrada' }[status] ?? status
}

function badgeClass(status: InventorySessionStatus): string {
  return {
    Open: 'badge-blue',
    Recount: 'badge-amber',
    Closed: 'badge-gray'
  }[status] ?? 'badge-gray'
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString(APP_LOCALE, { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString(APP_LOCALE, { hour: '2-digit', minute: '2-digit' })
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

async function imprimir(session: MyCountHistorySessionDto) {
  printing.value = session
  await nextTick()
  window.print()
  printing.value = null
}

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (value: string) => `"${(value ?? '').replace(/"/g, '""')}"`
  return [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))].join('\n')
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function descargarCSV(session: MyCountHistorySessionDto) {
  const headers = ['ItemCode', 'Descripcion', 'Cantidad', 'Ronda', 'UltimoEnvio']
  const rows = session.lines.map(line => [
    line.itemCode,
    line.itemDescription || '',
    String(line.quantity),
    line.round === 2 ? 'Reconteo' : 'Conteo',
    formatDate(line.lastCountedAt)
  ])
  const csv = toCSV(headers, rows)
  downloadCSV(`historial_${session.sessionId.slice(0, 8)}.csv`, csv)
}

onMounted(cargar)
</script>

<style scoped>
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.badge-amber { @apply bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.th { @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300; }
.date-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.stat { @apply text-sm text-gray-600 dark:text-gray-400; }
.link { @apply text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300; }

.print-only { display: none; }

@media print {
  .no-print { display: none !important; }
  .print-only { display: block; }
  .print-only table { width: 100%; border-collapse: collapse; }
  .print-only th, .print-only td { border: 1px solid #333; padding: 4px 8px; text-align: left; font-size: 12px; }
}
</style>
