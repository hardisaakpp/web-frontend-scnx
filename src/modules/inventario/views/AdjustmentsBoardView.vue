<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Bandeja de Ajustes / Revisión / SAP</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Crear ajustes desde sesión cerrada, editar líneas y ejecutar flujo Draft → InReview → Approved → SentToSap.
      </p>

      <div v-if="error" class="mt-4 alert-error">{{ error }}</div>
      <div v-if="success" class="mt-4 alert-success">{{ success }}</div>

      <form v-if="canEditarAjuste" class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3" @submit.prevent="createAdjustment">
        <label class="block md:col-span-2">
          <span class="label">SessionId cerrado</span>
          <input v-model="createForm.sessionId" class="input font-mono text-xs" required />
        </label>
        <label class="block md:col-span-2">
          <span class="label">Notas</span>
          <input v-model="createForm.notes" class="input" placeholder="Ajuste inicial auditoría" />
        </label>
        <div class="md:col-span-4">
          <button class="btn-primary" type="submit" :disabled="creating">{{ creating ? 'Creando...' : 'Crear Ajuste' }}</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Listado de Ajustes</h2>
        <button class="btn-secondary" type="button" @click="loadAdjustments">Refrescar</button>
      </div>

      <div class="mt-4 flex flex-wrap items-end gap-3">
        <label class="block">
          <span class="label">Desde</span>
          <input v-model="dateFrom" class="input" type="date" />
        </label>
        <label class="block">
          <span class="label">Hasta</span>
          <input v-model="dateTo" class="input" type="date" />
        </label>
        <button class="btn-secondary" type="button" @click="resetDateFilter">Últimos 15 días</button>
        <span class="text-xs text-gray-400">
          Mostrando {{ filteredAdjustments.length }} de {{ adjustments.length }} ajustes
        </span>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th">Fecha</th>
              <th class="th">AdjustmentId</th>
              <th class="th">SessionId</th>
              <th class="th">Bodega</th>
              <th class="th">Estado</th>
              <th class="th text-right">Líneas</th>
              <th class="th text-right">Valorizado</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in filteredAdjustments" :key="item.adjustmentId">
              <td class="td whitespace-nowrap">{{ fmtDate(item.createdAt) }}</td>
              <td class="td font-mono text-xs">{{ item.adjustmentId }}</td>
              <td class="td font-mono text-xs">{{ item.sessionId }}</td>
              <td class="td">{{ item.warehouseCode }}</td>
              <td class="td">{{ item.status }}</td>
              <td class="td text-right">{{ item.totalLines }} / {{ item.differenceLines }}</td>
              <td class="td text-right">{{ fmtCurrency(item.totalValorizedAmount) }} <span class="text-xs text-gray-400">({{ valuationLabel(item.valuationMode) }})</span></td>
              <td class="td text-right">
                <button class="link" type="button" @click="openAdjustment(item.adjustmentId)">Detalle</button>
              </td>
            </tr>
            <tr v-if="filteredAdjustments.length === 0">
              <td class="td text-center" colspan="8">
                {{ adjustments.length === 0 ? 'Sin ajustes.' : 'Sin ajustes en el rango de fechas seleccionado.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="current" class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Detalle Ajuste</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ current.adjustmentId }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-if="canRevisarAjuste" class="btn-secondary" type="button" @click="submitReview" :disabled="current.status !== 'Draft'">Submit</button>
          <button v-if="canRevisarAjuste" class="btn-secondary" type="button" @click="approve" :disabled="current.status !== 'InReview'">Approve</button>
          <button
            v-if="canIntegrarSap"
            class="btn-secondary"
            type="button"
            @click="descargarInforme"
            :disabled="!['Approved', 'SentToSap'].includes(String(current.status)) || downloadingReport"
          >{{ downloadingReport ? 'Descargando...' : 'Descargar informe final' }}</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div class="card-mini"><span class="muted">SessionId</span><strong class="font-mono text-xs">{{ current.sessionId }}</strong></div>
        <div class="card-mini"><span class="muted">Bodega</span><strong>{{ current.warehouseCode }}</strong></div>
        <div class="card-mini"><span class="muted">Estado</span><strong>{{ current.status }}</strong></div>
        <div class="card-mini"><span class="muted">Líneas</span><strong>{{ current.lines.length }}</strong></div>
        <div class="card-mini"><span class="muted">Valorizado ({{ valuationLabel(current.valuationMode) }})</span><strong>{{ fmtCurrency(current.totalValorizedAmount) }}</strong></div>
      </div>

      <!-- Valorización: cómo se cobra el ajuste en el reporte final -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Valorización del reporte final</h3>
        <div class="flex flex-wrap items-end gap-3">
          <label class="block">
            <span class="label">Modo</span>
            <select v-model="valuationForm.mode" class="input" :disabled="!canEditarAjuste || isValuationLocked">
              <option value="Cost">Costo</option>
              <option value="Pvp">PVP</option>
              <option value="PvpWithDiscount">PVP menos descuento</option>
            </select>
          </label>
          <label v-if="valuationForm.mode === 'PvpWithDiscount'" class="block">
            <span class="label">Descuento %</span>
            <input v-model.number="valuationForm.discountPercentage" class="input" type="number" min="0" max="100" step="0.01" :disabled="!canEditarAjuste || isValuationLocked" />
          </label>
          <button
            class="btn-secondary"
            type="button"
            :disabled="!canEditarAjuste || isValuationLocked || savingValuation"
            @click="saveValuation"
          >{{ savingValuation ? 'Guardando...' : 'Guardar valorización' }}</button>
          <span v-if="isValuationLocked" class="text-xs text-gray-400">Ya no se puede cambiar: el informe final ya fue generado.</span>
        </div>
      </div>

      <!-- Las líneas solo se pueden ajustar en Draft: Submit (→InReview) y Approve las congelan
           para que el informe final no cambie después de aprobado. -->
      <div v-if="current.status !== 'Draft'" class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
        Este ajuste está en estado <strong>{{ current.status }}</strong> — las diferencias ya no se pueden editar.
        Solo se puede ajustar el valor mientras el ajuste está en <strong>Draft</strong> (antes de enviarlo a revisión y de aprobarlo).
      </div>

      <div class="flex items-center justify-between gap-3">
        <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input v-model="showOnlyDifferences" type="checkbox" class="rounded border-gray-300 dark:border-gray-600" />
          Ver solo diferencias
        </label>
        <span v-if="showOnlyDifferences && hiddenBalancedCount > 0" class="text-xs text-gray-400">
          {{ hiddenBalancedCount }} línea(s) balanceada(s) ocultas (no suman al valorizado)
        </span>
      </div>

      <div class="overflow-x-auto max-h-[380px]">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60 sticky top-0">
            <tr>
              <th class="th">Item</th>
              <th class="th text-right">Raw Diff</th>
              <th class="th text-right">Adjusted Diff</th>
              <th class="th text-right">Costo</th>
              <th class="th text-right">PVP</th>
              <th class="th text-right">Valorizado</th>
              <th class="th">Notas</th>
              <th class="th text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="line in visibleLines" :key="line.lineId">
              <td class="td">
                <div class="font-medium">{{ line.itemCode }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ line.itemDescription || '-' }}</div>
              </td>
              <td class="td text-right">{{ fmt(line.rawDifference) }}</td>
              <td class="td text-right">
                <input
                  v-model.number="lineEdit[line.lineId].adjustedDifference"
                  class="input text-right"
                  type="number"
                  step="0.0001"
                  :disabled="!canEditarAjuste || current.status !== 'Draft'"
                />
              </td>
              <td class="td text-right text-xs text-gray-500 dark:text-gray-400">{{ line.unitCost != null ? fmtCurrency(line.unitCost) : '—' }}</td>
              <td class="td text-right text-xs text-gray-500 dark:text-gray-400">{{ line.unitPvp != null ? fmtCurrency(line.unitPvp) : '—' }}</td>
              <td class="td text-right font-medium">{{ line.valorizedAmount != null ? fmtCurrency(line.valorizedAmount) : '—' }}</td>
              <td class="td">
                <input
                  v-model="lineEdit[line.lineId].auditorNotes"
                  class="input"
                  :disabled="!canEditarAjuste || current.status !== 'Draft'"
                  placeholder="Nota auditor"
                />
              </td>
              <td class="td text-right">
                <button class="link" type="button" :disabled="!canEditarAjuste || current.status !== 'Draft' || savingLine" @click="saveLine(line.lineId)">Guardar</button>
              </td>
            </tr>
            <tr v-if="visibleLines.length === 0">
              <td class="td text-center" colspan="8">Sin líneas con diferencias.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  type AdjustmentDetailDto,
  type AdjustmentSummaryDto,
  scnexusInventoryApi
} from '../services/scnexusInventoryApi'
import { useInventarioModulePermissions } from '../composables/useInventarioModulePermissions'

const { canEditarAjuste, canRevisarAjuste, canIntegrarSap } = useInventarioModulePermissions()

const numberFmt = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 })
const currencyFmt = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })
const dateFmt = new Intl.DateTimeFormat('es-EC', { dateStyle: 'short', timeStyle: 'short' })
const VALUATION_LABELS: Record<string, string> = { Cost: 'Costo', Pvp: 'PVP', PvpWithDiscount: 'PVP - desc.' }

const DEFAULT_RANGE_DAYS = 15

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultDateFrom(): string {
  const date = new Date()
  date.setDate(date.getDate() - DEFAULT_RANGE_DAYS)
  return toDateInputValue(date)
}

// El listado va a crecer indefinidamente (un ajuste por sesión cerrada) — se filtra por fecha de
// creación en el cliente para no tener que scrollear años de historial; por defecto los últimos
// 15 días, ajustable a cualquier rango.
const dateFrom = ref(defaultDateFrom())
const dateTo = ref(toDateInputValue(new Date()))

function resetDateFilter() {
  dateFrom.value = defaultDateFrom()
  dateTo.value = toDateInputValue(new Date())
}

const adjustments = ref<AdjustmentSummaryDto[]>([])
const current = ref<AdjustmentDetailDto | null>(null)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const creating = ref(false)
const savingLine = ref(false)
const downloadingReport = ref(false)
const savingValuation = ref(false)

const createForm = reactive({
  sessionId: '',
  notes: ''
})

const valuationForm = reactive<{ mode: 'Cost' | 'Pvp' | 'PvpWithDiscount'; discountPercentage: number }>({
  mode: 'Cost',
  discountPercentage: 0
})

// El informe final es inmutable una vez generado (Approve lo dispara) — el backend rechaza el
// cambio de valorización a partir de ahí, así que el selector se bloquea igual en la UI.
const isValuationLocked = computed(() => !current.value || ['Approved', 'SentToSap'].includes(String(current.value.status)))

const lineEdit = reactive<Record<string, { adjustedDifference: number; auditorNotes: string }>>({})

// "Balanced" = línea sin diferencia (adjustedDifference 0), no aporta al Valorizado (el backend
// la excluye de la hoja de diferencias del informe final). El toggle solo oculta esas líneas de
// la tabla; el total ya viene sumado desde el backend y no cambia con el filtro.
const showOnlyDifferences = ref(true)

const visibleLines = computed(() => {
  if (!current.value) return []
  if (!showOnlyDifferences.value) return current.value.lines
  return current.value.lines.filter((line) => String(line.lineType) !== 'Balanced')
})

const hiddenBalancedCount = computed(() => {
  if (!current.value) return 0
  return current.value.lines.filter((line) => String(line.lineType) === 'Balanced').length
})

function fmt(value: number) {
  return numberFmt.format(value || 0)
}

function fmtCurrency(value: number) {
  return currencyFmt.format(value || 0)
}

function valuationLabel(mode: string | number) {
  return VALUATION_LABELS[String(mode)] ?? String(mode)
}

function fmtDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date)
}

const filteredAdjustments = computed(() => {
  // dateTo se interpreta como "hasta el final de ese día" para que incluya ajustes creados
  // en cualquier hora de la fecha límite, no solo hasta medianoche.
  const from = dateFrom.value ? new Date(`${dateFrom.value}T00:00:00`) : null
  const to = dateTo.value ? new Date(`${dateTo.value}T23:59:59.999`) : null

  return adjustments.value.filter((item) => {
    const createdAt = new Date(item.createdAt)
    if (Number.isNaN(createdAt.getTime())) return true
    if (from && createdAt < from) return false
    if (to && createdAt > to) return false
    return true
  })
})

function hydrateLineEdit(detail: AdjustmentDetailDto) {
  for (const line of detail.lines) {
    lineEdit[line.lineId] = {
      adjustedDifference: line.adjustedDifference,
      auditorNotes: line.auditorNotes || ''
    }
  }
  valuationForm.mode = (String(detail.valuationMode) as typeof valuationForm.mode) || 'Cost'
  valuationForm.discountPercentage = detail.discountPercentage ?? 0
}

async function loadAdjustments() {
  error.value = null
  try {
    adjustments.value = await scnexusInventoryApi.getAdjustments()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar ajustes.'
  }
}

async function createAdjustment() {
  creating.value = true
  error.value = null
  success.value = null
  try {
    const detail = await scnexusInventoryApi.createAdjustment(createForm.sessionId, createForm.notes)
    current.value = detail
    hydrateLineEdit(detail)
    success.value = `Ajuste creado: ${detail.adjustmentId}`
    await loadAdjustments()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo crear ajuste.'
  } finally {
    creating.value = false
  }
}

async function openAdjustment(adjustmentId: string) {
  error.value = null
  try {
    const detail = await scnexusInventoryApi.getAdjustment(adjustmentId)
    current.value = detail
    hydrateLineEdit(detail)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo abrir el ajuste.'
  }
}

async function saveLine(lineId: string) {
  if (!current.value) return
  savingLine.value = true
  error.value = null
  success.value = null
  try {
    const edited = lineEdit[lineId]
    await scnexusInventoryApi.updateAdjustmentLine(current.value.adjustmentId, lineId, {
      adjustedDifference: edited.adjustedDifference,
      auditorNotes: edited.auditorNotes || null,
      equivalenceGroupId: null
    })
    success.value = `Línea ${lineId} actualizada.`
    await openAdjustment(current.value.adjustmentId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar la línea.'
  } finally {
    savingLine.value = false
  }
}

async function saveValuation() {
  if (!current.value) return
  savingValuation.value = true
  error.value = null
  success.value = null
  try {
    current.value = await scnexusInventoryApi.setAdjustmentValuation(
      current.value.adjustmentId,
      valuationForm.mode,
      valuationForm.mode === 'PvpWithDiscount' ? valuationForm.discountPercentage : null
    )
    hydrateLineEdit(current.value)
    success.value = 'Valorización actualizada.'
    await loadAdjustments()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar la valorización.'
  } finally {
    savingValuation.value = false
  }
}

async function submitReview() {
  if (!current.value) return
  error.value = null
  success.value = null
  try {
    current.value = await scnexusInventoryApi.submitAdjustment(current.value.adjustmentId)
    hydrateLineEdit(current.value)
    success.value = 'Ajuste enviado a revisión.'
    await loadAdjustments()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo enviar a revisión.'
  }
}

async function approve() {
  if (!current.value) return
  error.value = null
  success.value = null
  try {
    current.value = await scnexusInventoryApi.approveAdjustment(current.value.adjustmentId)
    hydrateLineEdit(current.value)
    success.value = 'Ajuste aprobado.'
    await loadAdjustments()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo aprobar.'
  }
}

async function descargarInforme() {
  if (!current.value) return
  downloadingReport.value = true
  error.value = null
  success.value = null
  try {
    const { blob, fileName } = await scnexusInventoryApi.downloadAdjustmentReport(current.value.adjustmentId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    success.value = 'Informe final descargado.'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo descargar el informe final.'
  } finally {
    downloadingReport.value = false
  }
}

loadAdjustments()
</script>

<style scoped>
.label {
  @apply text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400;
}
.input {
  @apply mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100;
}
.btn-primary {
  @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50;
}
.btn-secondary {
  @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50;
}
.card-mini {
  @apply rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3;
}
.muted {
  @apply block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400;
}
.th {
  @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400;
}
.td {
  @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300 align-top;
}
.link {
  @apply text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50;
}
.alert-error {
  @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300;
}
.alert-success {
  @apply rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300;
}
</style>
