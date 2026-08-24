<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePickingStore } from '../stores/pickingStore'
import { useAuthStore } from '@/stores/auth'
import { APP_LOCALE } from '@/plugins/locale'
import { PencilIcon, DocumentArrowDownIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
import type { ReceptionLine } from '../types'
import { triggerBlobDownload } from '../utils/downloadBlob'
import { statusMeta } from '../utils/statusMeta'
import ErrorDialog from '../components/ErrorDialog.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

function buildScanFeedback(result: { matchedLine: ReceptionLine | null; fillAmount: number; excess: number }): string {
  if (!result.matchedLine) {
    return `Código no reconocido — registrado como diferencia (${result.excess}).`
  }
  if (result.excess > 0) {
    return `${result.fillAmount} escaneado(s) para ${result.matchedLine.itemCode}, ${result.excess} excedente(s) registrados como diferencia.`
  }
  return `${result.fillAmount} escaneado(s) para ${result.matchedLine.itemCode}.`
}

// Backend datetime2 columns don't preserve DateTimeKind.Utc on read (confirmed backend-side —
// EF Core returns Unspecified, so System.Text.Json serializes without a trailing 'Z'). A *Utc
// field can therefore arrive as a naive string ("2026-08-13T19:31:53"), which `new Date()` would
// otherwise parse as LOCAL time instead of UTC. Append 'Z' when no zone marker is present so this
// keeps working once the backend fix ships too (a real offset/'Z' short-circuits the append).
function parseUtc(dateStr: string): Date {
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(dateStr) ? dateStr : `${dateStr}Z`)
}

function formatDateTime(dateStr: string): string {
  return parseUtc(dateStr).toLocaleDateString(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const route = useRoute()
const router = useRouter()
const store = usePickingStore()
const authStore = useAuthStore()

const transferId = computed(() => Number(route.params.id))

const canScan = computed(() => authStore.hasPermission('recepcion.picking.scan'))
const canConfirm = computed(() => authStore.hasPermission('recepcion.reception.confirm'))
const canConfirmPartial = computed(() => authStore.hasPermission('recepcion.reception.confirm.partial'))
const canManageDifferences = computed(() => authStore.hasPermission('recepcion.diferencias.gestionar'))

onMounted(() => {
  store.fetchTransfer(transferId.value)
})

// Vue Router reuses this component instance across navigations matching the same route record
// (/recepcion-mercaderia/en-curso/:id) with only :id changing, so onMounted alone won't re-fire —
// watch transferId to re-fetch when the user navigates between two transfer detail pages.
watch(transferId, (id) => {
  store.fetchTransfer(id)
})

// A confirmed transfer belongs in Historial, not this picking detail — covers both the normal
// confirm() success path and confirm()'s own refetch-after-error recovery (a request that failed
// client-side while the backend confirmation actually went through), so either way the user gets
// moved out instead of staying on a page for a transfer that's no longer pending confirmation.
watch(
  () => store.currentTransfer?.status,
  (transferStatus) => {
    if (transferStatus === 'confirmed') {
      router.push({ name: 'recepcion-historial' })
    }
  }
)

// Scan: real backend model is "pick an existing line, enter its (absolute) scanned total" —
// not a free-typed item code. scanQuantities holds one editable draft per line, seeded from the
// line's current `scanned` value whenever the transfer (re)loads, so unedited lines submit their
// unchanged total rather than an accidental 0.
//
// Two coexisting input paths per legacy recP.php parity:
// - Lines WITH a barcode: driven exclusively by the barcode-scanner input below (handleBarcodeScan).
//   Their "Escaneados" cell is a read-only display of line.scanned, not an editable draft.
// - Lines WITHOUT a barcode (barcode === null): no scanner input can address them, so they keep
//   the manual editable quantity input (scanQuantities) as a fallback, submitted via the
//   "Guardar escaneo" batch button (handleScan) exactly as before.
const scanQuantities = ref<Record<number, number>>({})
const scanResponsibleName = ref('')
const scanCourierWaybill = ref('')
// Line ids reset to 0 by the forced-recount gate below, for the "needs recount" row highlight.
const recountLineIds = ref<Set<number>>(new Set())

// Barcode-scanner-gun input: legacy recP.php's real UI (quantity input + barcode input + Enter),
// not a free-typed item code either — it matches against each line's barcode.
const scanBarcodeInput = ref('')
const scanBarcodeQuantity = ref(1)
const scanFeedback = ref<string | null>(null)
const barcodeInputEl = ref<HTMLInputElement | null>(null)

function resetBarcodeInputs(): void {
  scanBarcodeInput.value = ''
  scanBarcodeQuantity.value = 1
  barcodeInputEl.value?.focus()
}

// Barcode matching / fill-vs-excess computation lives in pickingStore.scanBarcode (SRP) — this
// just feeds the input, then turns the returned result into the same scanFeedback message that
// used to be built inline here.
async function handleBarcodeScan(): Promise<void> {
  if (!store.currentTransfer) return
  const barcode = scanBarcodeInput.value.trim()
  if (!barcode) return
  const enteredQty = Math.max(1, scanBarcodeQuantity.value || 1)

  const result = await store.scanBarcode(barcode, enteredQty, {
    responsibleName: scanResponsibleName.value || null,
    courierWaybillNumber: scanCourierWaybill.value || null,
  })
  if (!result) return

  scanFeedback.value = buildScanFeedback(result)
  resetBarcodeInputs()
}

watch(
  () => store.currentTransfer?.lines,
  (lines) => {
    if (!lines) return
    scanQuantities.value = Object.fromEntries(lines.map((l) => [l.lineId, l.scanned]))
    recountLineIds.value = new Set()
  },
  { immediate: true }
)

async function handleScan(): Promise<void> {
  if (!store.currentTransfer) return
  const scans = store.currentTransfer.lines
    .filter((l) => scanQuantities.value[l.lineId] !== l.scanned)
    .map((l) => ({ lineId: l.lineId, scannedQuantity: scanQuantities.value[l.lineId] }))
  if (scans.length === 0) return
  await store.scan({
    scans,
    responsibleName: scanResponsibleName.value || null,
    courierWaybillNumber: scanCourierWaybill.value || null,
  })
}

// Confirm
async function handleConfirm(): Promise<void> {
  await store.confirm({})
}

// Confirm/scan/recordDifference failures shown as a dismissible modal instead of an inline banner
// above the table — same request as legacy's receive-confirmation pattern (ConfirmDialog), just
// for errors instead of a yes/no prompt. sapErrorMessage takes precedence (it's the more specific
// "known SAP integration failure" case); actionError covers everything else (validation, SAP
// rejection detail already translated by the backend, etc.) - never the fetch-load error, which has
// its own inline banner below since it means there's no transfer to even show a modal over.
const pickingErrorMessage = computed(() => store.sapErrorMessage ?? store.actionError)

// Forced-recount gate (parity with legacy recP.php's crearTransferencia()): the first "Confirmar
// parcial" attempt on a transfer with any line still short of its requested quantity blocks,
// resets that line's scan input to 0, and opens a modal so the user can either go back and
// re-scan or confirm the partial reception right from there. A second attempt — from the modal or
// from the "Confirmar parcial" button itself — proceeds regardless of whether the user actually
// re-scanned anything — that's the legacy behavior being replicated, not a shortcut taken here.
const showRecountDialog = ref(false)

async function handleConfirmPartial(): Promise<void> {
  if (!store.currentTransfer) return
  const incompleteLines = store.currentTransfer.lines.filter((l) => l.scanned < l.quantity)
  if (incompleteLines.length > 0 && !store.hasRecounted) {
    store.hasRecounted = true
    recountLineIds.value = new Set(incompleteLines.map((l) => l.lineId))
    for (const line of incompleteLines) {
      scanQuantities.value[line.lineId] = 0
    }
    showRecountDialog.value = true
    return
  }
  await store.confirm({ allowPartial: true })
}

async function confirmPartialFromRecountDialog(): Promise<void> {
  showRecountDialog.value = false
  await store.confirm({ allowPartial: true })
}

interface DifferenceGroup {
  barcode: string
  productDescription: string | null
  count: number
  scannedAtUtc: string
  differenceIds: number[]
}

// Display-only grouping: the backend still persists one difference row per scanned unit (see
// scanBarcode in pickingStore.ts) so no audit granularity is lost — this just collapses repeat
// scans of the same barcode into one row with a count, instead of one row per unit.
const groupedDifferences = computed<DifferenceGroup[]>(() => {
  const groups = new Map<string, DifferenceGroup>()
  for (const d of store.differences) {
    const group = groups.get(d.barcode)
    if (group) {
      group.count += 1
      group.differenceIds.push(d.differenceId)
      if (d.scannedAtUtc > group.scannedAtUtc) group.scannedAtUtc = d.scannedAtUtc
    } else {
      groups.set(d.barcode, {
        barcode: d.barcode,
        productDescription: d.productDescription,
        count: 1,
        scannedAtUtc: d.scannedAtUtc,
        differenceIds: [d.differenceId],
      })
    }
  }
  return Array.from(groups.values())
})

// Deletes every unit in the group — the user is discarding the whole item's differences, not one
// unit at a time. Loops the existing single-delete action (same idiom as scanBarcode's per-unit
// recordDifference loop above) rather than adding a new batch endpoint/store action.
//
// deleteDifference() resets actionError to null at the START of every call (store-wide convention
// for mutating actions), so if unit N fails and unit N+1 then succeeds, the loop would otherwise
// end with actionError cleared — silently hiding the failed unit's still-present difference. Stop
// at the first failure instead (detected via the id still being in store.differences) so the error
// from that call survives to the ErrorDialog and the remaining units aren't deleted out from under it.
async function handleDeleteDifferenceGroup(differenceIds: number[]): Promise<void> {
  for (const differenceId of differenceIds) {
    await store.deleteDifference(differenceId)
    const failed = store.differences.some((d) => d.differenceId === differenceId)
    if (failed) return
  }
}

// GLPI inline edit
const editingGlpi = ref(false)
const glpiInput = ref('')

function startEditGlpi(): void {
  glpiInput.value = store.currentTransfer?.glpiTicket ?? ''
  editingGlpi.value = true
}

async function saveGlpi(): Promise<void> {
  await store.updateGlpiTicket(glpiInput.value)
  editingGlpi.value = false
}

// Differences report download
async function handleDownloadReport(): Promise<void> {
  // Capture the transfer id at click time (not the live reactive transferId.value read after the
  // await) so a navigation to another transfer while the download is in flight doesn't cause the
  // resolved blob to be saved under the WRONG transfer's filename.
  const downloadedTransferId = transferId.value
  const blob = await store.downloadDifferencesReport()
  if (!blob) return
  triggerBlobDownload(blob, `diferencias-${downloadedTransferId}.xlsx`)
}

// Picking report download
async function handleDownloadPickingReport(): Promise<void> {
  // Capture the transfer id at click time (not the live reactive transferId.value read after the
  // await) so a navigation to another transfer while the download is in flight doesn't cause the
  // resolved blob to be saved under the WRONG transfer's filename.
  const downloadedTransferId = transferId.value
  const blob = await store.downloadPickingReport()
  if (!blob) return
  triggerBlobDownload(blob, `picking-${downloadedTransferId}.xlsx`)
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div v-if="store.status === 'loading' && !store.currentTransfer" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      Cargando...
    </div>

    <div
      v-else-if="store.status === 'error' && !store.currentTransfer"
      role="alert"
      class="py-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 border border-red-200 dark:border-red-800"
    >
      {{ store.fetchError }}
    </div>

    <template v-else-if="store.currentTransfer">
      <div class="space-y-4">
        <ErrorDialog
          :open="!!pickingErrorMessage"
          title="No se pudo completar la operación"
          :message="pickingErrorMessage ?? ''"
          @close="store.clearConfirmError()"
        />

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <RouterLink
              data-testid="back-btn"
              to="/recepcion-mercaderia/en-curso"
              class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
              aria-label="Volver a Transferencias en Curso"
            >
              <ArrowLeftIcon class="w-5 h-5" />
            </RouterLink>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Recepción</h1>
                <span :class="[statusMeta(store.currentTransfer.status).classes, 'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider']">
                  {{ statusMeta(store.currentTransfer.status).label }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Basado en transferencia {{ store.currentTransfer.documentNumber }}. {{ store.currentTransfer.originWarehouseCode }} a {{ store.currentTransfer.destinationWarehouseCode }}
              </p>
            </div>
          </div>

          <!-- GLPI inline edit -->
          <div class="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <span class="text-xs font-bold text-gray-400 uppercase">GLPI:</span>
            <template v-if="editingGlpi">
              <label for="glpi-input" class="sr-only">Ticket GLPI</label>
              <input
                id="glpi-input"
                data-testid="glpi-input"
                v-model="glpiInput"
                type="text"
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-white outline-none transition-all"
              />
              <button
                type="button"
                data-testid="glpi-save-btn"
                :disabled="store.isSubmitting"
                class="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="saveGlpi"
              >
                Guardar
              </button>
            </template>
            <template v-else>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ store.currentTransfer.glpiTicket || 'Sin ticket' }}</span>
              <button type="button" data-testid="glpi-edit-btn" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" @click="startEditGlpi">
                <PencilIcon class="w-4 h-4" />
              </button>
            </template>
          </div>
        </div>

        <!-- Forced-recount dialog: opened after a blocked partial-confirm attempt. Lets the user
             either close it to re-scan the marked lines, or confirm the partial reception directly
             from here. -->
        <ConfirmDialog
          :open="showRecountDialog"
          title="Confirmación parcial"
          message="Es necesario volver a contar los ítems con diferencias antes de confirmar parcialmente. Vuelva a escanear las líneas marcadas o confirme la recepción directamente desde aquí."
          confirm-label="Confirmar parcial"
          cancel-label="Volver a escanear"
          @confirm="confirmPartialFromRecountDialog"
          @cancel="showRecountDialog = false"
        />

        <!-- Lines table: real backend model is "pick an existing line, submit its new absolute
             scanned total" (ScanLineRequest/ApplyScan) — no free-typed item code. When the user
             can scan, the "Escaneados" column becomes an editable input per line instead of a
             read-only number. -->
        <form
          data-testid="scan-form"
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          @submit.prevent="handleScan"
        >
          <!-- Barcode-scanner-gun input: legacy recP.php parity. Not a <form> of its own (avoids
               nested-form/Enter conflicts with the batch "Guardar escaneo" form below) — Enter on
               the barcode input or the Agregar button both trigger handleBarcodeScan directly. -->
          <div v-if="canScan" class="flex flex-wrap gap-2 items-end mb-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <div class="flex flex-col gap-0.5">
              <label for="barcode-scan-input" class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Código de barras</label>
              <input
                id="barcode-scan-input"
                ref="barcodeInputEl"
                data-testid="barcode-scan-input"
                v-model="scanBarcodeInput"
                type="text"
                autofocus
                placeholder="Escanee o ingrese el código"
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                @keyup.enter.prevent="handleBarcodeScan"
              />
            </div>
            <div class="flex flex-col gap-0.5">
              <label for="barcode-scan-quantity-input" class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cantidad</label>
              <input
                id="barcode-scan-quantity-input"
                data-testid="barcode-scan-quantity-input"
                v-model.number="scanBarcodeQuantity"
                type="number"
                min="1"
                class="w-16 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <button
              type="button"
              data-testid="barcode-scan-add-btn"
              :disabled="store.isSubmitting || !scanBarcodeInput"
              class="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleBarcodeScan"
            >
              Agregar
            </button>
            <p v-if="scanFeedback" data-testid="scan-feedback" class="text-sm text-gray-600 dark:text-gray-300">{{ scanFeedback }}</p>
          </div>

          <div class="overflow-auto max-h-[28rem] rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N.°</th>
                  <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código de barras</th>
                  <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Artículo</th>
                  <th class="px-3 py-1.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                  <th class="px-3 py-1.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Escaneados</th>
                  <th class="px-3 py-1.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diferencia</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <tr
                  v-for="(line, index) in store.currentTransfer.lines"
                  :key="line.lineId"
                  data-testid="line-row"
                  :class="[recountLineIds.has(line.lineId) ? 'bg-amber-50 dark:bg-amber-900/10' : '', 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group']"
                >
                  <td class="px-3 py-1 text-xs text-gray-400 dark:text-gray-500">{{ index + 1 }}</td>
                  <td
                    data-testid="barcode-cell"
                    class="px-3 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 truncate"
                    :title="line.barcode || 'Sin código de barras'"
                  >
                    {{ line.barcode || 'Sin código de barras' }}
                  </td>
                  <td class="px-3 py-1 max-w-xs truncate" :title="`${line.itemCode} — ${line.itemName}`">
                    <span class="text-xs font-medium text-gray-900 dark:text-gray-300">{{ line.itemCode }} - {{ line.itemName }}</span>
                  </td>
                  <td class="px-3 py-1 text-center text-sm font-semibold text-gray-900 dark:text-white">{{ line.quantity }}</td>
                  <td class="px-3 py-1 text-center text-sm">
                    <!-- Manual fallback: only for lines with NO barcode — the scanner input above
                         can't address them. Lines that DO have a barcode are read-only here; their
                         scanned total comes exclusively from handleBarcodeScan. -->
                    <div v-if="canScan && line.barcode === null" class="flex flex-col items-center gap-0.5">
                      <label :for="`scan-quantity-input-${line.lineId}`" class="sr-only">Cantidad escaneada</label>
                      <input
                        :id="`scan-quantity-input-${line.lineId}`"
                        :data-testid="`scan-quantity-input-${line.lineId}`"
                        v-model.number="scanQuantities[line.lineId]"
                        type="number"
                        min="0"
                        :max="line.quantity"
                        class="w-16 text-center rounded-md border border-amber-300 dark:border-amber-800 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 text-sm font-semibold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                      <span class="text-[9px] text-amber-600 dark:text-amber-400">Sin código — carga manual</span>
                    </div>
                    <span v-else class="font-semibold text-blue-600 dark:text-blue-400">{{ line.scanned }}</span>
                  </td>
                  <td
                    class="px-3 py-1 text-center text-sm font-semibold"
                    :class="store.lineDiferencia(line) !== 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'"
                  >
                    {{ store.lineDiferencia(line) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="canScan" class="flex flex-wrap gap-4 items-end mt-4">
            <div class="flex flex-col gap-1.5">
              <label for="scan-responsible-input" class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Responsable (opcional)</label>
              <input
                id="scan-responsible-input"
                data-testid="scan-responsible-input"
                v-model="scanResponsibleName"
                type="text"
                placeholder="Usuario actual"
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="scan-courier-input" class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Guía courier</label>
              <input
                id="scan-courier-input"
                data-testid="scan-courier-input"
                v-model="scanCourierWaybill"
                type="text"
                placeholder="Requerida para tiendas LP-/YHD-"
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              data-testid="scan-submit-btn"
              :disabled="store.isSubmitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar escaneo
            </button>
          </div>
        </form>

        <div v-if="groupedDifferences.length > 0" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <h2 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Diferencias registradas</h2>
          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table data-testid="differences-table" class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código de barras</th>
                  <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                  <th class="px-3 py-1.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                  <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha / Hora</th>
                  <th class="px-3 py-1.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <tr v-for="group in groupedDifferences" :key="group.barcode" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-3 py-1 text-sm font-medium text-gray-900 dark:text-white">{{ group.barcode }}</td>
                  <td class="px-3 py-1 text-xs text-gray-600 dark:text-gray-300">{{ group.productDescription ?? '—' }}</td>
                  <td class="px-3 py-1 text-center text-sm font-semibold text-gray-900 dark:text-white">{{ group.count }}</td>
                  <td class="px-3 py-1 text-xs text-gray-600 dark:text-gray-300">{{ formatDateTime(group.scannedAtUtc) }}</td>
                  <td class="px-3 py-1 text-right">
                    <button
                      v-if="canManageDifferences"
                      type="button"
                      :disabled="store.isSubmitting"
                      class="ml-auto flex items-center gap-1 text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-medium transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      @click="handleDeleteDifferenceGroup(group.differenceIds)"
                    >
                      <TrashIcon class="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="canConfirm"
            type="button"
            data-testid="confirm-btn"
            :disabled="store.isSubmitting"
            class="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleConfirm"
          >
            Confirmar
          </button>
          <button
            v-if="canConfirmPartial"
            type="button"
            data-testid="confirm-partial-btn"
            :disabled="store.isSubmitting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleConfirmPartial"
          >
            Confirmar parcial
          </button>
          <button
            type="button"
            data-testid="download-report-btn"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
            @click="handleDownloadReport"
          >
            <DocumentArrowDownIcon class="w-4 h-4" />
            Descargar reporte de diferencias
          </button>
          <button
            type="button"
            data-testid="download-picking-report-btn"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
            @click="handleDownloadPickingReport"
          >
            <DocumentArrowDownIcon class="w-4 h-4" />
            Exportar Picking
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
