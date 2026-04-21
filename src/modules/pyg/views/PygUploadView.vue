<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Importador PYG</h1>
        <p class="text-sm text-gray-600 dark:text-gray-300">Carga plantilla y revisa el historial de importación.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="canManagePeriodLock"
          type="button"
          class="shrink-0 rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
          :class="
            skipWritePeriodValidation
              ? 'border-amber-600 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/60'
              : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60'
          "
          :disabled="loadingPeriodValidationSetting || !periodValidationAvailable"
          @click="togglePeriodValidation"
        >
          {{
            loadingPeriodValidationSetting
              ? 'Actualizando...'
              : !periodValidationAvailable
                ? 'Bloqueo de periodo: No disponible'
                : skipWritePeriodValidation
                ? 'Bloqueo de periodo: Desactivado'
                : 'Bloqueo de periodo: Activado'
          }}
        </button>
        <button
          type="button"
          class="shrink-0 rounded-md border border-sky-600 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 shadow-sm hover:bg-sky-100 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-900/60"
          @click="handleDownloadTemplate"
        >
          Descargar plantilla
        </button>
      </div>
    </header>

    <div class="space-y-3">
      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        class="sr-only"
        :disabled="loadingUpload || !canUploadExcel"
        @change="onFileChange"
      />
      <div
        class="rounded-lg border-2 border-dashed border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 to-white p-8 text-center transition-colors hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-gray-900/50 dark:hover:border-emerald-600"
        :class="[
          uploadDragActive ? 'border-emerald-500 bg-emerald-50 shadow-inner dark:border-emerald-400 dark:bg-emerald-950/70' : '',
          loadingUpload ? 'cursor-wait opacity-70' : canUploadExcel ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
        ]"
        role="button"
        :tabindex="loadingUpload ? -1 : 0"
        :aria-busy="loadingUpload"
        :aria-disabled="!canUploadExcel"
        aria-label="Subir archivo Excel: arrastra un .xlsx o haz clic para elegir"
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
        @dragover.prevent="onUploadDragOver"
        @dragleave.prevent="onUploadDragLeave"
        @drop.prevent="onUploadDrop"
      >
        <div class="pointer-events-none flex flex-col items-center gap-3">
          <div class="relative">
            <div
              class="rounded-2xl bg-emerald-100 p-4 shadow-sm ring-1 ring-emerald-200/80 dark:bg-emerald-900/50 dark:ring-emerald-700/60"
            >
              <TableCellsIcon class="h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <span
              class="absolute -bottom-1 -right-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-emerald-500"
            >
              xlsx
            </span>
          </div>
          <div class="space-y-1.5">
            <h2 class="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Subir hoja de cálculo Excel</h2>
            <p class="text-sm text-emerald-800/90 dark:text-emerald-200/90">
              {{ loadingUpload ? 'Procesando…' : 'Arrastra tu archivo .xlsx aquí o haz clic para elegir' }}
            </p>
            <p class="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">
              Formato requerido: libro Excel <span class="tabular-nums">(.xlsx)</span>
            </p>
          </div>
        </div>
      </div>
      <p v-if="selectedFile" class="text-xs text-gray-500 dark:text-gray-400">
        Archivo seleccionado: {{ selectedFile.name }}
      </p>
      <p
        v-if="!canUploadExcel && !loadingPeriodValidationSetting && periodValidationAvailable"
        class="text-xs text-amber-700 dark:text-amber-300"
      >
        Carga bloqueada: el periodo actual no es valido mientras el bloqueo de periodo este activado.
      </p>
      <p
        v-if="skipWritePeriodValidation && periodValidationUntilLabel"
        class="text-xs text-sky-700 dark:text-sky-300"
      >
        Bloqueo de periodo desactivado temporalmente hasta: {{ periodValidationUntilLabel }}.
      </p>
      <p v-if="uploadMessage" class="text-sm" :class="uploadOk ? 'text-green-600' : 'text-red-600'">{{ uploadMessage }}</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
      <button
        type="button"
        class="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-xl"
        :aria-expanded="historyExpanded"
        @click="historyExpanded = !historyExpanded"
      >
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Historial de cargas</h2>
        <svg
          class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200"
          :class="{ 'rotate-180': historyExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div v-show="historyExpanded" class="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <div class="mb-4 mt-4 flex flex-wrap items-end justify-between gap-3">
          <div class="flex flex-wrap items-end gap-3">
            <label class="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
              Desde
              <input
                v-model="uploadsDateFilter.from"
                type="date"
                class="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100"
                :disabled="loadingUploads"
              />
            </label>
            <label class="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
              Hasta
              <input
                v-model="uploadsDateFilter.to"
                type="date"
                class="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100"
                :disabled="loadingUploads"
              />
            </label>
            <button
              type="button"
              class="rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100"
              :disabled="loadingUploads"
              @click="applyUploadsDateFilter"
            >
              Aplicar
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 dark:hover:bg-gray-700"
              :disabled="loadingUploads || (!uploadsDateFilter.from && !uploadsDateFilter.to)"
              @click="clearUploadsDateFilter"
            >
              Limpiar
            </button>
          </div>
          <button
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            :disabled="loadingUploads"
            @click="loadUploads"
          >
            Refrescar
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead>
              <tr class="text-left text-gray-600 dark:text-gray-300">
                <th class="w-10 px-2 py-2 text-right tabular-nums">#</th>
                <th class="px-3 py-2">Archivo</th>
                <th class="px-3 py-2">Periodo</th>
                <th class="px-3 py-2">Estado</th>
                <th class="px-3 py-2">Filas</th>
                <th class="px-3 py-2 whitespace-nowrap">Fecha ingreso</th>
                <th class="px-3 py-2 whitespace-nowrap">Última actualización</th>
                <th class="px-3 py-2">Usuario últ. act.</th>
                <th class="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="(item, index) in paginatedUploads" :key="item.id" class="text-gray-800 dark:text-gray-200">
                <td class="px-2 py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">{{ uploadsHistoryOffset + index + 1 }}</td>
                <td class="px-3 py-2">{{ item.fileName }}</td>
                <td class="px-3 py-2">{{ item.year }}-{{ String(item.month).padStart(2, '0') }}</td>
                <td class="px-3 py-2" :class="uploadStatusClass(item.status)">{{ item.status }}</td>
                <td class="px-3 py-2">{{ item.validRows }}/{{ item.totalRows }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ formatAuditDate(item.uploadedAt) }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">—</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ item.uploadedBy?.trim() || '—' }}</td>
                <td class="px-3 py-2">
                  <button
                    type="button"
                    class="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                    :disabled="loadingRows && selectedBatchId === item.id"
                    @click="openBatchDetail(item.id)"
                  >
                    {{ selectedBatchId === item.id ? 'Detalle abierto' : 'Ver detalle' }}
                  </button>
                </td>
              </tr>
              <tr v-if="uploads.length === 0 && !loadingUploads">
                <td colspan="9" class="px-3 py-3 text-center text-gray-500">Sin cargas registradas.</td>
              </tr>
              <tr v-if="loadingUploads && uploads.length === 0">
                <td colspan="9" class="px-3 py-3 text-center text-gray-500">Cargando historial…</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="uploads.length > 0 && !loadingUploads" class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {{ uploadsHistoryOffset + 1 }} - {{ uploadsHistoryRangeEnd }} de {{ uploads.length }} resultados
            </div>
            <QuickTablePagination
              v-model="uploadsHistoryCurrentPage"
              :total-pages="uploadsHistoryTotalPages"
              :disabled="loadingUploads"
              aria-label="Paginación del historial de cargas PYG"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedBatchDetail" class="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm p-4 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
            Detalle lote #{{ selectedBatchDetail.id }} · {{ selectedBatchDetail.fileName }}
          </h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Periodo {{ selectedBatchDetail.year }}-{{ String(selectedBatchDetail.month).padStart(2, '0') }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="clearInlineDetail"
        >
          Ocultar detalle
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="text-xs font-semibold text-gray-700 dark:text-gray-200">MATRIZ</div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr class="text-left font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300 text-[10px]">
                  <th class="px-2 py-2">Periodo</th>
                  <th class="px-2 py-2">Empresa</th>
                  <th class="px-2 py-2">Marca</th>
                  <th class="px-2 py-2">% Matriz</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                <tr v-for="row in selectedRowsBySheet.matriz.items" :key="`m-${row.id}`" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                  <td class="px-2 py-1.5">{{ row.year && row.month ? `${row.year}-${String(row.month).padStart(2, '0')}` : '—' }}</td>
                  <td class="px-2 py-1.5">{{ resolveRowEmpresa(row) }}</td>
                  <td class="px-2 py-1.5">{{ row.marca || '—' }}</td>
                  <td class="px-2 py-1.5">{{ row.percentMatriz ?? '—' }}</td>
                </tr>
                <tr v-if="selectedRowsBySheet.matriz.total > 0" class="bg-gray-100/70 font-semibold dark:bg-gray-700/40">
                  <td class="px-2 py-1.5 text-right" colspan="3">Total</td>
                  <td class="px-2 py-1.5">{{ sheetTotal('matriz', 'matriz') }}</td>
                </tr>
                <tr v-if="!loadingRows && selectedRowsBySheet.matriz.items.length === 0">
                  <td colspan="4" class="px-2 py-3 text-center text-gray-500">Sin filas MATRIZ para este lote.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="selectedRowsBySheet.matriz.total > 0" class="flex flex-wrap items-center justify-between gap-3">
            <div class="text-xs text-gray-600 dark:text-gray-300">
              Mostrando {{ selectedRowsRangeStart('matriz') }} - {{ selectedRowsRangeEnd('matriz') }} de {{ selectedRowsBySheet.matriz.total }} filas
            </div>
            <QuickTablePagination
              v-model="selectedRowsCurrentPageMatriz"
              :total-pages="selectedRowsTotalPages('matriz')"
              :disabled="loadingRows"
              aria-label="Paginación filas MATRIZ"
            />
          </div>
        </div>

        <div class="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="text-xs font-semibold text-gray-700 dark:text-gray-200">TIENDAS</div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr class="text-left font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300 text-[10px]">
                  <th class="px-2 py-2">Periodo</th>
                  <th class="px-2 py-2">Empresa</th>
                  <th class="px-2 py-2">Marca</th>
                  <th class="px-2 py-2">Bodega</th>
                  <th class="px-2 py-2">% General</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                <tr v-for="row in selectedRowsBySheet.tiendas.items" :key="`t-${row.id}`" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                  <td class="px-2 py-1.5">{{ row.year && row.month ? `${row.year}-${String(row.month).padStart(2, '0')}` : '—' }}</td>
                  <td class="px-2 py-1.5">{{ resolveRowEmpresa(row) }}</td>
                  <td class="px-2 py-1.5">{{ row.marca || '—' }}</td>
                  <td class="px-2 py-1.5">{{ row.codigoBodega || '—' }}</td>
                  <td class="px-2 py-1.5">{{ row.percentGeneral ?? '—' }}</td>
                </tr>
                <tr v-if="selectedRowsBySheet.tiendas.total > 0" class="bg-gray-100/70 font-semibold dark:bg-gray-700/40">
                  <td class="px-2 py-1.5 text-right" colspan="4">Total</td>
                  <td class="px-2 py-1.5">{{ sheetTotal('tiendas', 'tiendas') }}</td>
                </tr>
                <tr v-if="!loadingRows && selectedRowsBySheet.tiendas.items.length === 0">
                  <td colspan="5" class="px-2 py-3 text-center text-gray-500">Sin filas TIENDAS para este lote.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="selectedRowsBySheet.tiendas.total > 0" class="flex flex-wrap items-center justify-between gap-3">
            <div class="text-xs text-gray-600 dark:text-gray-300">
              Mostrando {{ selectedRowsRangeStart('tiendas') }} - {{ selectedRowsRangeEnd('tiendas') }} de {{ selectedRowsBySheet.tiendas.total }} filas
            </div>
            <QuickTablePagination
              v-model="selectedRowsCurrentPageTiendas"
              :total-pages="selectedRowsTotalPages('tiendas')"
              :disabled="loadingRows"
              aria-label="Paginación filas TIENDAS"
            />
          </div>
        </div>
      </div>

      <div v-if="loadingRows" class="text-xs text-gray-500">Cargando filas…</div>
    </div>

    <p v-if="queryMessage" class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {{ queryMessage }}
    </p>

    <div
      v-if="showAdPasswordModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-password-title"
    >
      <div class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <h3 id="ad-password-title" class="text-sm font-semibold text-gray-900 dark:text-white">
          Confirmar desactivacion de bloqueo
        </h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Para desactivar el bloqueo de periodo, ingresa tu contrasena de Active Directory.
        </p>
        <label class="mt-3 flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300">
          Contrasena AD
          <input
            v-model="adPasswordInput"
            type="password"
            class="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100"
            :disabled="loadingPeriodValidationSetting"
            @keydown.enter.prevent="confirmDisablePeriodLock"
          />
        </label>
        <p v-if="adPasswordError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ adPasswordError }}</p>
        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            :disabled="loadingPeriodValidationSetting"
            @click="cancelDisablePeriodLock"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="rounded-md border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100"
            :disabled="loadingPeriodValidationSetting"
            @click="confirmDisablePeriodLock"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>

  </section>

</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { lastNotification } from '@/composables/useNotificaciones'
import { useModuleNotifications } from '@/composables/useModuleNotifications'
import { useAuthStore } from '@/stores/auth'
import QuickTablePagination from '@/modules/mba3-consultas/components/QuickTablePagination.vue'
import { TableCellsIcon } from '@heroicons/vue/24/outline'
import {
  downloadOriginalFile,
  downloadTemplate,
  getPeriodValidationSettings,
  getUploadRows,
  getUploads,
  updatePeriodValidationSettings,
  uploadExcel,
  type UploadBatchDetailDto,
  type UploadBatchSummary,
  type UploadRowHistoryItemDto,
  type UploadRowHistoryPageDto
} from '../services/pygApi'

const authStore = useAuthStore()
const notifier = useModuleNotifications('PYG')
const canManagePeriodLock = computed(() => authStore.hasPermission('pyg.edit'))

const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const historyExpanded = ref(true)
const loadingUpload = ref(false)
const uploadDragActive = ref(false)
const uploadMessage = ref('')
const uploadOk = ref(false)
const skipWritePeriodValidation = ref(false)
const skipWritePeriodValidationUntilUtc = ref<string | null>(null)
const loadingPeriodValidationSetting = ref(false)
const periodValidationAvailable = ref(true)
const isWithinValidPeriod = ref(false)
const showAdPasswordModal = ref(false)
const adPasswordInput = ref('')
const adPasswordError = ref('')

const uploads = ref<UploadBatchSummary[]>([])
const loadingUploads = ref(false)
const pendingRefreshAfterLoad = ref(false)
const loadingRows = ref(false)
const downloadingOriginal = ref(false)
const selectedBatchId = ref<number | null>(null)
const selectedBatchDetail = ref<UploadBatchDetailDto | null>(null)
const EMPTY_UPLOAD_ROWS_PAGE: UploadRowHistoryPageDto = { batchId: 0, total: 0, page: 1, pageSize: 50, items: [] }
type UploadSheetKey = 'matriz' | 'tiendas'
const SHEET_NAME_BY_KEY: Record<UploadSheetKey, string> = {
  matriz: 'Matriz',
  tiendas: 'Tiendas'
}
const selectedRowsBySheet = ref<{ matriz: UploadRowHistoryPageDto; tiendas: UploadRowHistoryPageDto }>({
  matriz: { ...EMPTY_UPLOAD_ROWS_PAGE },
  tiendas: { ...EMPTY_UPLOAD_ROWS_PAGE }
})
const rowsFilters = ref<{ isValid: '' | 'true' | 'false' }>({ isValid: '' })
const uploadsDateFilter = ref<{ from: string; to: string }>({ from: '', to: '' })

/** Misma lógica que Cargar plantilla (MBA3): 10 filas por página. */
const UPLOADS_PAGE_SIZE = 10
const uploadsHistoryPage = ref(1)

const uploadsHistoryTotalPages = computed(() => {
  const total = uploads.value.length
  return total > 0 ? Math.max(1, Math.ceil(total / UPLOADS_PAGE_SIZE)) : 1
})

const uploadsHistoryOffset = computed(() => (uploadsHistoryPage.value - 1) * UPLOADS_PAGE_SIZE)

const paginatedUploads = computed(() => {
  const start = uploadsHistoryOffset.value
  return uploads.value.slice(start, start + UPLOADS_PAGE_SIZE)
})

const uploadsHistoryRangeEnd = computed(() =>
  uploads.value.length === 0 ? 0 : Math.min(uploadsHistoryOffset.value + UPLOADS_PAGE_SIZE, uploads.value.length)
)

const canUploadExcel = computed(() => {
  if (!canManagePeriodLock.value) return true
  if (loadingPeriodValidationSetting.value) return false
  if (!periodValidationAvailable.value) return false
  return skipWritePeriodValidation.value || isWithinValidPeriod.value
})

const periodValidationUntilLabel = computed(() => {
  const raw = skipWritePeriodValidationUntilUtc.value?.trim()
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
})

function selectedRowsTotalPages(key: UploadSheetKey): number {
  const rows = selectedRowsBySheet.value[key]
  const total = rows.total
  const size = rows.pageSize || 1
  return total > 0 ? Math.max(1, Math.ceil(total / size)) : 1
}

function normalizeUploadsDateFilter():
  | { from?: string; to?: string }
  | null {
  const from = uploadsDateFilter.value.from?.trim() || ''
  const to = uploadsDateFilter.value.to?.trim() || ''
  if (from && to && from > to) return null
  return {
    from: from || undefined,
    to: to || undefined
  }
}

function selectedRowsRangeStart(key: UploadSheetKey): number {
  const rows = selectedRowsBySheet.value[key]
  if (rows.total === 0) return 0
  return (rows.page - 1) * rows.pageSize + 1
}

function selectedRowsRangeEnd(key: UploadSheetKey): number {
  const rows = selectedRowsBySheet.value[key]
  if (rows.total === 0) return 0
  return Math.min(selectedRowsRangeStart(key) + rows.pageSize - 1, rows.total)
}

const uploadsHistoryCurrentPage = computed({
  get() {
    return uploadsHistoryPage.value
  },
  set(p: number) {
    const max = uploadsHistoryTotalPages.value
    uploadsHistoryPage.value = Math.min(max, Math.max(1, Math.round(p)))
  }
})

const selectedRowsCurrentPageMatriz = computed({
  get() {
    return selectedRowsBySheet.value.matriz.page
  },
  set(p: number) {
    const max = selectedRowsTotalPages('matriz')
    selectedRowsBySheet.value.matriz.page = Math.min(max, Math.max(1, Math.round(p)))
  }
})

const selectedRowsCurrentPageTiendas = computed({
  get() {
    return selectedRowsBySheet.value.tiendas.page
  },
  set(p: number) {
    const max = selectedRowsTotalPages('tiendas')
    selectedRowsBySheet.value.tiendas.page = Math.min(max, Math.max(1, Math.round(p)))
  }
})

watch(uploadsHistoryTotalPages, (max) => {
  if (uploadsHistoryPage.value > max) uploadsHistoryPage.value = max
})
const queryMessage = ref('')
const ACTIVE_UPLOAD_STATUS_KEYWORDS = ['processing', 'proces', 'pend', 'queue', 'en cola', 'running']
const isPygViewMounted = ref(false)

function uploadStatusClass(status: string | undefined): string {
  const s = String(status || '').toUpperCase()
  if (s === 'PROCESSED') return 'font-medium text-green-600 dark:text-green-400'
  if (s === 'REJECTED') return 'font-medium text-red-600 dark:text-red-400'
  if (s === 'PROCESSING' || s.includes('PROCESSING')) {
    return 'font-medium text-sky-600 dark:text-sky-400'
  }
  const lower = String(status || '').toLowerCase()
  if (
    ACTIVE_UPLOAD_STATUS_KEYWORDS.some((k) => lower.includes(k)) &&
    !lower.includes('processed') &&
    !lower.includes('procesado')
  ) {
    return 'font-medium text-sky-600 dark:text-sky-400'
  }
  return ''
}

/** Misma convención que otros módulos (p. ej. gestión de usuarios). */
function formatAuditDate(value: string | undefined): string {
  const s = (value || '').trim()
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: unknown; status?: number } })?.response
  const data = response?.data
  const status = response?.status

  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (typeof o.message === 'string' && o.message.trim()) return o.message
    if (typeof o.detail === 'string' && o.detail.trim()) return o.detail
    if (typeof o.title === 'string' && o.title.trim()) return o.title
    const errors = o.errors
    if (errors && typeof errors === 'object') {
      for (const value of Object.values(errors as Record<string, unknown>)) {
        if (Array.isArray(value) && value.length > 0) {
          const first = value[0]
          if (typeof first === 'string' && first.trim()) return first
        }
      }
    }
  }

  if (status === 403) {
    return (
      'El API PYG respondió 403 (prohibido): el microservicio no autoriza esta petición con tu token. ' +
      'Revisa políticas y permisos en el backend Docker, que el JWT sea el que PYG valida (mismo issuer/firma), ' +
      'y en desarrollo que no estés entrando al módulo sin permisos (VITE_ALLOW_UNAUTHENTICATED=false alinea router y API).'
    )
  }

  return fallback
}

function buildDetailFallbackFromSummary(batchId: number): UploadBatchDetailDto | null {
  const summary = uploads.value.find((item) => item.id === batchId)
  if (!summary) return null
  return {
    ...summary,
    // Some backends do not expose /uploads/:id detail and only return list + rows.
    // Allow downloads to attempt and let endpoint-level errors be handled gracefully.
    originalFileAvailable: true,
    errorLogAvailable: summary.errorRows > 0
  }
}

function resolveRowEmpresa(row: UploadRowHistoryItemDto): string {
  return row.nombreEmpresa || row.empresa || row.codigoEmpresa || '—'
}

function sheetTotal(sheet: UploadSheetKey, type: 'matriz' | 'tiendas'): number {
  const page = selectedRowsBySheet.value[sheet] as UploadRowHistoryPageDto & {
    TotalPercentMatriz?: number
    TotalPercentGeneral?: number
  }
  if (type === 'matriz') {
    return page.totalPercentMatriz ?? page.TotalPercentMatriz ?? 0
  }
  return page.totalPercentGeneral ?? page.TotalPercentGeneral ?? 0
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
  if (!selectedFile.value) return
  if (!canUploadExcel.value) {
    uploadOk.value = false
    uploadMessage.value = 'Carga bloqueada: periodo no valido con bloqueo de periodo activado.'
    notifier.warning({ title: 'Carga bloqueada', message: uploadMessage.value })
    return
  }
  void handleUpload()
}

function openFilePicker() {
  if (loadingUpload.value || !canUploadExcel.value) return
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  fileInputRef.value.click()
}

function onUploadDragOver(event: DragEvent) {
  event.preventDefault()
  if (loadingUpload.value || !canUploadExcel.value) return
  uploadDragActive.value = true
}

function onUploadDragLeave() {
  uploadDragActive.value = false
}

function onUploadDrop(event: DragEvent) {
  event.preventDefault()
  uploadDragActive.value = false
  if (loadingUpload.value || !canUploadExcel.value) return
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  const nameOk = file.name.toLowerCase().endsWith('.xlsx')
  const typeOk =
    file.type === '' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (!nameOk && !typeOk) {
    uploadOk.value = false
    uploadMessage.value = 'Solo se admiten archivos Excel (.xlsx).'
    notifier.warning({ title: 'Archivo inválido', message: uploadMessage.value })
    return
  }
  selectedFile.value = file
  void handleUpload()
}

function saveBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function resolveServerFileName(fallback: string, detail?: UploadBatchDetailDto | null): string {
  if (detail?.fileName?.trim()) return detail.fileName
  return fallback
}

async function handleDownloadTemplate() {
  try {
    const blob = await downloadTemplate()
    saveBlob(blob, 'Plantilla porcentajes.xlsx')
    notifier.success({ title: 'Plantilla descargada', message: 'La plantilla de porcentajes se descargó correctamente.' })
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'No se pudo descargar la plantilla.')
    queryMessage.value = message
    notifier.error({ title: 'Error al descargar plantilla', message })
  }
}

async function loadPeriodValidationSetting() {
  try {
    const data = await getPeriodValidationSettings()
    periodValidationAvailable.value = true
    skipWritePeriodValidation.value = Boolean(data.skipWritePeriodValidation)
    skipWritePeriodValidationUntilUtc.value = data.skipWritePeriodValidationUntilUtc ?? null
    const payload = data as unknown as Record<string, unknown>
    const maybeIsWithinValidPeriod =
      payload.isWithinValidPeriod ??
      payload.withinValidPeriod ??
      payload.isValidPeriod ??
      payload.periodValid
    isWithinValidPeriod.value = typeof maybeIsWithinValidPeriod === 'boolean' ? maybeIsWithinValidPeriod : false
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      periodValidationAvailable.value = false
      isWithinValidPeriod.value = false
      skipWritePeriodValidationUntilUtc.value = null
      return
    }
    queryMessage.value = getApiErrorMessage(error, 'No se pudo consultar la configuración de bloqueo por periodo.')
    notifier.error({ title: 'Error de configuración', message: queryMessage.value })
  }
}

async function togglePeriodValidation() {
  if (!periodValidationAvailable.value) return
  if (!skipWritePeriodValidation.value) {
    showAdPasswordModal.value = true
    adPasswordInput.value = ''
    adPasswordError.value = ''
    return
  }
  await updatePeriodLock(false)
}

async function updatePeriodLock(nextSkipWritePeriodValidation: boolean, adPassword?: string): Promise<boolean> {
  loadingPeriodValidationSetting.value = true
  queryMessage.value = ''
  try {
    const data = await updatePeriodValidationSettings(nextSkipWritePeriodValidation, adPassword)
    periodValidationAvailable.value = true
    skipWritePeriodValidation.value = Boolean(data.skipWritePeriodValidation)
    skipWritePeriodValidationUntilUtc.value = data.skipWritePeriodValidationUntilUtc ?? null
    const payload = data as unknown as Record<string, unknown>
    const maybeIsWithinValidPeriod =
      payload.isWithinValidPeriod ??
      payload.withinValidPeriod ??
      payload.isValidPeriod ??
      payload.periodValid
    isWithinValidPeriod.value = typeof maybeIsWithinValidPeriod === 'boolean' ? maybeIsWithinValidPeriod : false
    return true
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      periodValidationAvailable.value = false
      isWithinValidPeriod.value = false
      skipWritePeriodValidationUntilUtc.value = null
      return false
    }
    if ((status === 400 || status === 401) && nextSkipWritePeriodValidation) {
      adPasswordError.value = getApiErrorMessage(error, 'Contrasena AD invalida. Verifica e intenta nuevamente.')
      notifier.error({ title: 'Credenciales AD inválidas', message: adPasswordError.value })
      return false
    }
    queryMessage.value = getApiErrorMessage(error, 'No se pudo actualizar la configuración de bloqueo por periodo.')
    notifier.error({ title: 'Error al actualizar bloqueo', message: queryMessage.value })
    return false
  } finally {
    loadingPeriodValidationSetting.value = false
  }
}

function cancelDisablePeriodLock() {
  showAdPasswordModal.value = false
  adPasswordInput.value = ''
  adPasswordError.value = ''
}

async function confirmDisablePeriodLock() {
  const pass = adPasswordInput.value
  if (!pass || pass.trim().length === 0) {
    adPasswordError.value = 'La contrasena AD es obligatoria para desactivar el bloqueo.'
    return
  }
  adPasswordError.value = ''
  const ok = await updatePeriodLock(true, pass)
  if (ok) {
    showAdPasswordModal.value = false
    adPasswordInput.value = ''
    adPasswordError.value = ''
  }
}

async function handleDownloadOriginal(detail: UploadBatchDetailDto) {
  if (!detail.originalFileAvailable) return
  try {
    downloadingOriginal.value = true
    const blob = await downloadOriginalFile(detail.id)
    saveBlob(blob, resolveServerFileName(`upload-${detail.id}.xlsx`, detail))
    notifier.success({ title: 'Descarga completada', message: 'El archivo original se descargó correctamente.' })
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo descargar el archivo original.')
    notifier.error({ title: 'Error al descargar archivo', message: queryMessage.value })
  } finally {
    downloadingOriginal.value = false
  }
}

async function handleUpload() {
  if (!selectedFile.value) return
  if (!canUploadExcel.value) {
    uploadOk.value = false
    uploadMessage.value = 'Carga bloqueada: periodo no valido con bloqueo de periodo activado.'
    notifier.warning({ title: 'Carga bloqueada', message: uploadMessage.value })
    return
  }

  loadingUpload.value = true
  uploadMessage.value = ''
  try {
    const result = await uploadExcel(selectedFile.value)
    uploadOk.value = result.success
    uploadMessage.value = result.message || 'Carga procesada.'
    if (result.success) {
      notifier.success({ title: 'Carga completada', message: uploadMessage.value })
    } else {
      notifier.warning({ title: 'Carga rechazada', message: uploadMessage.value })
    }
    await loadUploads()
    // UX parity with mba3-consultas/cargar-plantilla:
    // if upload is valid/successful, show the imported sheet data immediately.
    if (result.success && result.batchId) {
      await openBatchDetail(result.batchId)
    }
  } catch (error: unknown) {
    uploadOk.value = false
    uploadMessage.value = getApiErrorMessage(error, 'Error al subir archivo.')
    notifier.error({ title: 'Error al subir archivo', message: uploadMessage.value })
  } finally {
    loadingUpload.value = false
  }
}

function hasActiveUploadProcessing(rows: UploadBatchSummary[]): boolean {
  return rows.some((row) => {
    const status = String(row.status || '').toLowerCase()
    return ACTIVE_UPLOAD_STATUS_KEYWORDS.some((keyword) => status.includes(keyword))
  })
}

async function loadUploads() {
  if (loadingUploads.value) return
  loadingUploads.value = true
  queryMessage.value = ''
  const dateFilter = normalizeUploadsDateFilter()
  if (dateFilter === null) {
    loadingUploads.value = false
    queryMessage.value = 'Rango de fechas inválido: "Desde" no puede ser mayor a "Hasta".'
    notifier.warning({ title: 'Rango de fechas inválido', message: queryMessage.value })
    return
  }
  try {
    uploads.value = await getUploads(dateFilter)
    uploadsHistoryPage.value = 1
  } catch (error: unknown) {
    uploads.value = []
    queryMessage.value = getApiErrorMessage(
      error,
      'No se pudo cargar el historial de cargas PYG. Revisa proxy (VITE_PYG_PROXY_TARGET), permisos del contenedor y logs del backend.'
    )
    notifier.error({ title: 'Error al cargar historial', message: queryMessage.value })
  } finally {
    loadingUploads.value = false
    // Si llegó un evento SSE mientras el historial estaba cargando, ejecutar
    // inmediatamente el mismo refresco manual al terminar esta carga.
    if (pendingRefreshAfterLoad.value) {
      pendingRefreshAfterLoad.value = false
      void loadUploads()
    }
  }
}

function triggerHistoryRefresh() {
  if (loadingUploads.value) {
    pendingRefreshAfterLoad.value = true
    return
  }
  void loadUploads()
}

function applyUploadsDateFilter() {
  uploadsHistoryPage.value = 1
  void loadUploads()
}

function clearUploadsDateFilter() {
  uploadsDateFilter.value = { from: '', to: '' }
  uploadsHistoryPage.value = 1
  void loadUploads()
}

async function loadSheetRows(sheet: UploadSheetKey, resetPage = false) {
  if (!selectedBatchId.value) return
  const current = selectedRowsBySheet.value[sheet]
  const page = resetPage ? 1 : current.page
  selectedRowsBySheet.value[sheet] = await getUploadRows(selectedBatchId.value, {
    page,
    pageSize: current.pageSize,
    sheetName: SHEET_NAME_BY_KEY[sheet],
    isValid:
      rowsFilters.value.isValid === ''
        ? undefined
        : rowsFilters.value.isValid === 'true'
  })
}

async function reloadSheetRows(resetPage = false) {
  if (!selectedBatchId.value) return
  loadingRows.value = true
  try {
    await Promise.all([loadSheetRows('matriz', resetPage), loadSheetRows('tiendas', resetPage)])
  } catch (error: unknown) {
    queryMessage.value = getApiErrorMessage(error, 'No se pudo cargar el historial de filas del lote.')
    notifier.error({ title: 'Error al cargar filas', message: queryMessage.value })
  } finally {
    loadingRows.value = false
  }
}

async function openBatchDetail(batchId: number) {
  selectedBatchId.value = batchId
  historyExpanded.value = false
  queryMessage.value = ''
  try {
    const fallbackDetail = buildDetailFallbackFromSummary(batchId)
    if (!fallbackDetail) throw new Error('No existe el lote seleccionado en el historial.')
    selectedBatchDetail.value = fallbackDetail
    selectedRowsBySheet.value = {
      matriz: { ...EMPTY_UPLOAD_ROWS_PAGE, batchId },
      tiendas: { ...EMPTY_UPLOAD_ROWS_PAGE, batchId }
    }
    await reloadSheetRows(true)
  } catch (error: unknown) {
    selectedBatchDetail.value = null
    queryMessage.value = getApiErrorMessage(error, 'No se pudo cargar el detalle de la carga.')
    notifier.error({ title: 'Error al cargar detalle', message: queryMessage.value })
  }
}

function clearInlineDetail() {
  historyExpanded.value = true
  selectedBatchId.value = null
  selectedBatchDetail.value = null
  selectedRowsBySheet.value = {
    matriz: { ...EMPTY_UPLOAD_ROWS_PAGE },
    tiendas: { ...EMPTY_UPLOAD_ROWS_PAGE }
  }
}

watch(
  () => selectedRowsBySheet.value.matriz.page,
  (next, prev) => {
    if (!selectedBatchId.value || next === prev) return
    void loadSheetRows('matriz', false)
  }
)

watch(
  () => selectedRowsBySheet.value.tiendas.page,
  (next, prev) => {
    if (!selectedBatchId.value || next === prev) return
    void loadSheetRows('tiendas', false)
  }
)

onMounted(async () => {
  isPygViewMounted.value = true
  if (canManagePeriodLock.value) {
    await Promise.all([loadUploads(), loadPeriodValidationSetting()])
    return
  }
  await loadUploads()
})

watch(lastNotification, (notification) => {
  if (!notification) return
  if (notification.metadata?.accion !== 'pyg_upload_completed') return
  notifier.info({
    title: notification.title || 'Carga PYG finalizada',
    message: notification.message || 'Se actualizó el historial de cargas.'
  })
  triggerHistoryRefresh()
})

onBeforeUnmount(() => {
  isPygViewMounted.value = false
})
</script>
