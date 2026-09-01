<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Ajuste Final</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Resultado final de la auditoría de esta toma física, ya aprobado.
        </p>
      </div>
      <button type="button" class="btn-secondary flex-shrink-0" @click="router.back()">Volver</button>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>

    <div v-if="loading" class="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <template v-else-if="adjustment">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="card-mini"><span class="muted">Bodega</span><strong>{{ adjustment.warehouseCode }}</strong></div>
        <div class="card-mini"><span class="muted">Aprobado</span><strong>{{ fmtDate(adjustment.approvedAt) }}</strong></div>
        <div class="card-mini"><span class="muted">Líneas con diferencia</span><strong>{{ diffLines.length }}</strong></div>
        <div class="card-mini"><span class="muted">Valor final</span><strong>{{ fmtCurrency(adjustment.totalValorizedAmount) }}</strong></div>
      </div>

      <div class="flex items-center justify-between gap-3 mb-3">
        <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input v-model="showOnlyDifferences" type="checkbox" class="rounded border-gray-300 dark:border-gray-600" />
          Ver solo diferencias
        </label>
        <button type="button" class="btn-secondary" @click="descargarExcel">Descargar Excel</button>
      </div>

      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th">Item</th>
              <th class="th">Descripción</th>
              <th class="th text-right">Diferencia final</th>
              <th class="th text-right">Valor final</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="line in visibleLines" :key="line.lineId">
              <td class="td font-medium">{{ line.itemCode }}</td>
              <td class="td">{{ line.itemDescription || '-' }}</td>
              <td class="td text-right" :class="diffClass(line.adjustedDifference)">{{ fmt(line.adjustedDifference) }}</td>
              <td class="td text-right font-medium">{{ line.valorizedAmount != null ? fmtCurrency(line.valorizedAmount) : '—' }}</td>
            </tr>
            <tr v-if="visibleLines.length === 0">
              <td class="td text-center" colspan="4">Sin líneas con diferencias.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as XLSX from 'xlsx'
import { type AdjustmentDetailDto, scnexusInventoryApi } from '../services/scnexusInventoryApi'

const router = useRouter()
const route = useRoute()
const sessionId = route.params.sessionId as string

const adjustment = ref<AdjustmentDetailDto | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showOnlyDifferences = ref(true)

const numberFmt = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 })
const currencyFmt = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })
const dateFmt = new Intl.DateTimeFormat('es-EC', { dateStyle: 'short', timeStyle: 'short' })

function fmt(value: number) {
  return numberFmt.format(value || 0)
}

function fmtCurrency(value: number) {
  return currencyFmt.format(value || 0)
}

function fmtDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date)
}

function diffClass(value: number) {
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return ''
}

const diffLines = computed(() => (adjustment.value?.lines ?? []).filter(l => String(l.lineType) !== 'Balanced'))

const visibleLines = computed(() => {
  if (!adjustment.value) return []
  return showOnlyDifferences.value ? diffLines.value : adjustment.value.lines
})

async function cargar() {
  loading.value = true
  error.value = null
  try {
    adjustment.value = await scnexusInventoryApi.getAdjustmentBySession(sessionId)
  } catch (e: any) {
    error.value = e.response?.status === 404
      ? 'Esta toma todavía no tiene un ajuste final aprobado.'
      : (e.message ?? 'No se pudo cargar el ajuste.')
  } finally {
    loading.value = false
  }
}

function descargarExcel() {
  if (!adjustment.value) return
  const header = ['Item', 'Descripción', 'Diferencia final', 'Valor final']
  const rows = visibleLines.value.map(line => [
    line.itemCode,
    line.itemDescription || '',
    line.adjustedDifference,
    line.valorizedAmount ?? ''
  ])
  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Ajuste Final')
  XLSX.writeFile(workbook, `ajuste_final_${adjustment.value.warehouseCode}_${sessionId.slice(0, 8)}.xlsx`)
}

onMounted(cargar)
</script>

<style scoped>
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.card-mini { @apply rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3; }
.muted { @apply block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5; }
.th { @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
</style>
