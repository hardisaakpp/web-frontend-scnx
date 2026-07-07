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

      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th">AdjustmentId</th>
              <th class="th">SessionId</th>
              <th class="th">Bodega</th>
              <th class="th">Estado</th>
              <th class="th text-right">Líneas</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in adjustments" :key="item.adjustmentId">
              <td class="td font-mono text-xs">{{ item.adjustmentId }}</td>
              <td class="td font-mono text-xs">{{ item.sessionId }}</td>
              <td class="td">{{ item.warehouseCode }}</td>
              <td class="td">{{ item.status }}</td>
              <td class="td text-right">{{ item.totalLines }} / {{ item.differenceLines }}</td>
              <td class="td text-right">
                <button class="link" type="button" @click="openAdjustment(item.adjustmentId)">Detalle</button>
              </td>
            </tr>
            <tr v-if="adjustments.length === 0">
              <td class="td text-center" colspan="6">Sin ajustes.</td>
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
          <button v-if="canIntegrarSap" class="btn-secondary" type="button" @click="sendToSap" :disabled="current.status !== 'Approved'">SendToSap</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="card-mini"><span class="muted">SessionId</span><strong class="font-mono text-xs">{{ current.sessionId }}</strong></div>
        <div class="card-mini"><span class="muted">Bodega</span><strong>{{ current.warehouseCode }}</strong></div>
        <div class="card-mini"><span class="muted">Estado</span><strong>{{ current.status }}</strong></div>
        <div class="card-mini"><span class="muted">Líneas</span><strong>{{ current.lines.length }}</strong></div>
      </div>

      <div class="overflow-x-auto max-h-[380px]">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60 sticky top-0">
            <tr>
              <th class="th">Item</th>
              <th class="th text-right">Raw Diff</th>
              <th class="th text-right">Adjusted Diff</th>
              <th class="th">Notas</th>
              <th class="th text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="line in current.lines" :key="line.lineId">
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
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  type AdjustmentDetailDto,
  type AdjustmentSummaryDto,
  scnexusInventoryApi
} from '../services/scnexusInventoryApi'
import { useInventarioModulePermissions } from '../composables/useInventarioModulePermissions'

const { canEditarAjuste, canRevisarAjuste, canIntegrarSap } = useInventarioModulePermissions()

const numberFmt = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 })

const adjustments = ref<AdjustmentSummaryDto[]>([])
const current = ref<AdjustmentDetailDto | null>(null)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const creating = ref(false)
const savingLine = ref(false)

const createForm = reactive({
  sessionId: '',
  notes: ''
})

const lineEdit = reactive<Record<string, { adjustedDifference: number; auditorNotes: string }>>({})

function fmt(value: number) {
  return numberFmt.format(value || 0)
}

function hydrateLineEdit(detail: AdjustmentDetailDto) {
  for (const line of detail.lines) {
    lineEdit[line.lineId] = {
      adjustedDifference: line.adjustedDifference,
      auditorNotes: line.auditorNotes || ''
    }
  }
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

async function sendToSap() {
  if (!current.value) return
  const sapDocumentNumber = window.prompt('Ingrese número de documento SAP:')
  if (!sapDocumentNumber) return

  error.value = null
  success.value = null
  try {
    current.value = await scnexusInventoryApi.sendToSap(current.value.adjustmentId, sapDocumentNumber)
    hydrateLineEdit(current.value)
    success.value = 'Ajuste marcado como enviado a SAP.'
    await loadAdjustments()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo marcar envío SAP.'
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
