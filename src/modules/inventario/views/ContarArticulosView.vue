<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="router.back()">
            <ChevronLeftIcon class="w-5 h-5" />
          </button>
          <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Conteo de Artículos</h1>
        <p v-if="sessionInfo" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {{ sessionInfo.warehouseCode }} · {{ sessionInfo.status === 'Recount' ? 'Reconteo' : 'Conteo inicial' }}
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ lines.length }}</div>
        <div class="text-xs text-gray-500 mt-0.5">Total Artículos</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ submittedCount }}</div>
        <div class="text-xs text-gray-500 mt-0.5">Confirmados</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
        <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ selectedCodes.size }}</div>
        <div class="text-xs text-gray-500 mt-0.5">Seleccionados</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
        <div class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ pendingCount }}</div>
        <div class="text-xs text-gray-500 mt-0.5">Por confirmar</div>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="mb-4">
      <div class="flex justify-between text-xs text-gray-500 mb-1">
        <span>{{ submittedCount }} confirmados</span>
        <span>{{ progressPct }}%</span>
      </div>
      <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div class="h-full rounded-full bg-green-500 transition-all" :style="{ width: progressPct + '%' }" />
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-[160px]">
        <label for="filterLevel2" class="block text-xs font-medium text-gray-500 mb-1">Filtrar por Nivel 2</label>
        <select id="filterLevel2" v-model="filterLevel2" class="select-input w-full">
          <option value="">TODOS</option>
          <option v-for="nv2 in nivel2Options" :key="nv2" :value="nv2">{{ nv2 }}</option>
        </select>
      </div>
      <div class="flex-[2] min-w-[220px]">
        <label for="search" class="block text-xs font-medium text-gray-500 mb-1">Buscar artículo</label>
        <input id="search" v-model="search" type="text" placeholder="Código o nombre..." class="text-input w-full" />
      </div>
      <div class="flex gap-1">
        <button type="button" class="btn-sm-secondary" @click="selectAll">Todos</button>
        <button type="button" class="btn-sm-secondary" @click="selectNone">Ninguno</button>
        <button type="button" class="btn-sm-secondary" @click="selectWithQuantity">Con cantidad</button>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex flex-wrap gap-2 mb-4 items-center">
      <button
        type="button"
        class="btn-primary"
        :disabled="selectedCodes.size === 0 || saving"
        @click="guardarSeleccionados"
      >
        <svg v-if="saving" class="animate-spin w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <CheckIcon v-else class="w-4 h-4 mr-1.5" />
        Guardar Seleccionados ({{ selectedCodes.size }})
      </button>
      <button
        type="button"
        class="btn-success"
        :disabled="selectedCodes.size === 0 || confirming"
        @click="confirmarSeleccionados"
      >
        <svg v-if="confirming" class="animate-spin w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <CloudArrowUpIcon v-else class="w-4 h-4 mr-1.5" />
        Confirmar Seleccionados ({{ selectedCodes.size }})
      </button>
      <span v-if="actionMsg" :class="['text-xs font-medium', actionMsgError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400']">
        {{ actionMsg }}
      </span>
    </div>

    <!-- Submit result summary -->
    <div v-if="submitResult" class="mb-4 rounded-xl border p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <p class="font-semibold text-blue-800 dark:text-blue-300 mb-2">
        Resultado: {{ submitResult.submitted }} artículos confirmados
      </p>
      <div class="flex gap-4 text-sm">
        <span class="text-green-700 dark:text-green-400">✓ {{ submitResult.balanced }} cuadraron</span>
        <span class="text-red-700 dark:text-red-400">✗ {{ submitResult.differences }} con diferencia</span>
      </div>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>
    <div v-if="loading && lines.length === 0" class="py-20 text-center text-sm text-gray-400">Cargando artículos...</div>

    <!-- Table -->
    <div v-if="lines.length > 0" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="th w-10">
                <input type="checkbox" :checked="allFilteredSelected" @change="toggleAllFiltered" class="rounded" />
              </th>
              <th class="th w-10 text-right">#</th>
              <th class="th">Código</th>
              <th class="th">Cód. Barras</th>
              <th class="th">Nombre</th>
              <th class="th">Nivel 2</th>
              <th class="th text-right">Escaneados</th>
              <th class="th text-right w-36">Cant. Manual</th>
              <th class="th text-right font-semibold">Total</th>
              <th v-if="!isTienda" class="th text-right">Stock SAP</th>
              <th class="th w-28">Estado</th>
              <th class="th w-36">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <tr
              v-for="(line, idx) in filteredLines"
              :key="line.itemCode"
              :class="[
                'hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors',
                line.isSubmitted ? 'opacity-60' : '',
                selectedCodes.has(line.itemCode) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              ]"
            >
              <td class="td">
                <input
                  type="checkbox"
                  :checked="selectedCodes.has(line.itemCode)"
                  :disabled="line.isSubmitted"
                  @change="toggleSelect(line.itemCode)"
                  class="rounded"
                />
              </td>
              <td class="td text-right text-xs text-gray-400">{{ idx + 1 }}</td>
              <td class="td font-mono font-medium text-sm">{{ line.itemCode }}</td>
              <td class="td text-xs text-gray-500 font-mono">{{ line.barcode ?? '—' }}</td>
              <td class="td text-sm">{{ line.itemDescription ?? '—' }}</td>
              <td class="td text-xs text-gray-500">{{ line.level2 ?? '—' }}</td>
              <td class="td text-right">
                <span v-if="line.scannedQuantity > 0" class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  {{ line.scannedQuantity }}
                </span>
                <span v-else class="text-gray-300 dark:text-gray-600 text-xs">0</span>
              </td>
              <td class="td">
                <input
                  v-if="!line.isSubmitted"
                  type="number"
                  min="0"
                  step="1"
                  :value="manualInputs[line.itemCode] ?? line.manualQuantity"
                  @input="onManualInput(line.itemCode, $event)"
                  class="qty-input"
                  :class="{ 'border-amber-400 dark:border-amber-500': pendingManual.has(line.itemCode) }"
                />
                <span v-else class="text-right block text-sm text-gray-500">{{ line.manualQuantity }}</span>
              </td>
              <td class="td text-right font-semibold">
                <span :class="totalClass(line)">
                  {{ computedTotal(line) }}
                </span>
              </td>
              <td v-if="!isTienda" class="td text-right text-sm text-gray-500">{{ line.systemQuantity }}</td>
              <td class="td">
                <span v-if="line.isSubmitted" class="badge badge-green">Confirmado</span>
                <span v-else-if="computedTotal(line) > 0" class="badge badge-blue">Con conteo</span>
                <span v-else class="badge badge-gray">Pendiente</span>
              </td>
              <td class="td">
                <div v-if="!line.isSubmitted" class="flex gap-1">
                  <button
                    type="button"
                    class="btn-xs-secondary"
                    :disabled="!pendingManual.has(line.itemCode)"
                    @click="guardarLinea(line.itemCode)"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    class="btn-xs-success"
                    @click="confirmarLinea(line.itemCode)"
                  >
                    Confirmar
                  </button>
                </div>
                <span v-else class="text-xs text-green-600 dark:text-green-400">✓ Enviado</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ChevronLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  CloudArrowUpIcon
} from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { ArticleCountLineDto, SubmitItemsResultDto } from '../services/inventarioSesionesApi'
import { useWarehouseAccessType } from '../composables/useWarehouseAccessType'

const router = useRouter()
const route = useRoute()
const sessionId = route.params.sessionId as string

const { isTienda } = useWarehouseAccessType()

const lines = ref<ArticleCountLineDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const confirming = ref(false)
const actionMsg = ref<string | null>(null)
const actionMsgError = ref(false)
const submitResult = ref<SubmitItemsResultDto | null>(null)
const sessionInfo = ref<{ warehouseCode: string; status: string } | null>(null)

const selectedCodes = ref(new Set<string>())
const manualInputs = reactive<Record<string, number>>({})
const pendingManual = ref(new Set<string>())

const filterLevel2 = ref('')
const search = ref('')

const nivel2Options = computed(() =>
  [...new Set(lines.value.map(l => l.level2).filter(Boolean) as string[])].sort()
)

const filteredLines = computed(() => {
  let result = lines.value
  if (filterLevel2.value) result = result.filter(l => l.level2 === filterLevel2.value)
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    result = result.filter(l =>
      l.itemCode.toLowerCase().includes(q) ||
      (l.itemDescription ?? '').toLowerCase().includes(q) ||
      (l.barcode ?? '').toLowerCase().includes(q)
    )
  }
  return result
})

const submittedCount = computed(() => lines.value.filter(l => l.isSubmitted).length)
const pendingCount = computed(() => lines.value.filter(l => !l.isSubmitted).length)
const progressPct = computed(() =>
  lines.value.length === 0 ? 0 : Math.round((submittedCount.value / lines.value.length) * 100)
)

const allFilteredSelected = computed(() =>
  filteredLines.value.length > 0 &&
  filteredLines.value.filter(l => !l.isSubmitted).every(l => selectedCodes.value.has(l.itemCode))
)

function computedTotal(line: ArticleCountLineDto): number {
  const manual = manualInputs[line.itemCode] ?? line.manualQuantity
  return line.scannedQuantity + manual
}

function totalClass(line: ArticleCountLineDto) {
  const total = computedTotal(line)
  if (total === 0) return 'text-gray-400 dark:text-gray-600'
  if (total > line.systemQuantity) return 'text-blue-600 dark:text-blue-400'
  if (total < line.systemQuantity) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}

function onManualInput(itemCode: string, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value) || 0
  manualInputs[itemCode] = val
  pendingManual.value.add(itemCode)
}

function toggleSelect(itemCode: string) {
  if (selectedCodes.value.has(itemCode)) selectedCodes.value.delete(itemCode)
  else selectedCodes.value.add(itemCode)
}

function toggleAllFiltered() {
  const pending = filteredLines.value.filter(l => !l.isSubmitted)
  if (allFilteredSelected.value) pending.forEach(l => selectedCodes.value.delete(l.itemCode))
  else pending.forEach(l => selectedCodes.value.add(l.itemCode))
}

function selectAll() {
  lines.value.filter(l => !l.isSubmitted).forEach(l => selectedCodes.value.add(l.itemCode))
}

function selectNone() {
  selectedCodes.value.clear()
}

function selectWithQuantity() {
  selectNone()
  lines.value.filter(l => !l.isSubmitted && computedTotal(l) > 0).forEach(l => selectedCodes.value.add(l.itemCode))
}

function showMsg(msg: string, isError = false) {
  actionMsg.value = msg
  actionMsgError.value = isError
  setTimeout(() => { actionMsg.value = null }, 4000)
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    const data = await inventarioSesionesService.getArticleCounts(sessionId)
    lines.value = data
    if (data.length > 0) {
      // Try to get session info from supervisor summary
      try {
        const summary = await inventarioSesionesService.getSupervisorSummary(sessionId)
        sessionInfo.value = { warehouseCode: summary.warehouseCode, status: summary.status }
      } catch { /* non-critical */ }
    }
    // Clear pending manual edits on reload
    pendingManual.value.clear()
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar los artículos.'
  } finally {
    loading.value = false
  }
}

async function guardarLinea(itemCode: string) {
  const qty = manualInputs[itemCode] ?? 0
  try {
    const updated = await inventarioSesionesService.setManualCount(sessionId, itemCode, qty)
    const idx = lines.value.findIndex(l => l.itemCode === itemCode)
    if (idx >= 0) lines.value[idx] = updated
    pendingManual.value.delete(itemCode)
    delete manualInputs[itemCode]
    showMsg(`✓ ${itemCode} guardado`)
  } catch (e: any) {
    showMsg(e.message ?? 'Error al guardar.', true)
  }
}

async function guardarSeleccionados() {
  const toSave = [...selectedCodes.value].filter(code => pendingManual.value.has(code))
  if (toSave.length === 0) { showMsg('Sin cambios pendientes en la selección.'); return }
  saving.value = true
  try {
    for (const code of toSave) await guardarLinea(code)
    showMsg(`✓ ${toSave.length} artículo(s) guardado(s)`)
  } finally {
    saving.value = false
  }
}

async function confirmarLinea(itemCode: string) {
  // Save pending manual first, then submit
  if (pendingManual.value.has(itemCode)) await guardarLinea(itemCode)
  confirming.value = true
  try {
    const result = await inventarioSesionesService.submitItems(sessionId, [itemCode])
    submitResult.value = result
    await cargar()
    selectedCodes.value.delete(itemCode)
    showMsg(`✓ ${itemCode} confirmado — ${result.balanced === 1 ? 'cuadra' : 'con diferencia'}`)
  } catch (e: any) {
    showMsg(e.message ?? 'Error al confirmar.', true)
  } finally {
    confirming.value = false
  }
}

async function confirmarSeleccionados() {
  if (selectedCodes.value.size === 0) return

  // Save all pending manual edits first
  const withPending = [...selectedCodes.value].filter(c => pendingManual.value.has(c))
  for (const code of withPending) await guardarLinea(code)

  confirming.value = true
  submitResult.value = null
  try {
    const codes = [...selectedCodes.value]
    const result = await inventarioSesionesService.submitItems(sessionId, codes)
    submitResult.value = result
    await cargar()
    selectedCodes.value.clear()
    showMsg(`✓ ${result.submitted} artículo(s) confirmados: ${result.balanced} cuadraron, ${result.differences} con diferencia`)
  } catch (e: any) {
    showMsg(e.message ?? 'Error al confirmar los artículos.', true)
  } finally {
    confirming.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.th { @apply px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300; }
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-success { @apply inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-sm-secondary { @apply inline-flex items-center rounded px-2.5 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700; }
.btn-xs-secondary { @apply inline-flex items-center rounded px-2 py-1 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed; }
.btn-xs-success { @apply inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-green { @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.qty-input { @apply w-28 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-right text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.text-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.select-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
