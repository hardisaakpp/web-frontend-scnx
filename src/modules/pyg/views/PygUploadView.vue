<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Importador PYG</h1>
        <p class="text-sm text-gray-600 dark:text-gray-300">Carga plantilla y revisa el historial de importación.</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-md border border-sky-600 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 shadow-sm hover:bg-sky-100 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-900/60"
        @click="handleDownloadTemplate"
      >
        Descargar plantilla
      </button>
    </header>

    <div class="space-y-3">
      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        class="sr-only"
        :disabled="loadingUpload"
        @change="onFileChange"
      />
      <div
        class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-colors hover:border-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-gray-600 dark:bg-gray-900/40 dark:hover:border-gray-500"
        :class="[
          uploadDragActive ? 'border-emerald-500 dark:border-emerald-400' : '',
          loadingUpload ? 'cursor-wait opacity-70' : 'cursor-pointer'
        ]"
        role="button"
        :tabindex="loadingUpload ? -1 : 0"
        :aria-busy="loadingUpload"
        aria-label="Subir archivo Excel: arrastra un .xlsx o haz clic para elegir"
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
        @dragover.prevent="onUploadDragOver"
        @dragleave.prevent="onUploadDragLeave"
        @drop.prevent="onUploadDrop"
      >
        <div class="pointer-events-none space-y-2">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Subir Excel</h2>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ loadingUpload ? 'Procesando…' : 'Arrastra un .xlsx aquí o haz clic para seleccionar' }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Solo archivos .xlsx</p>
        </div>
      </div>
      <p v-if="selectedFile" class="text-xs text-gray-500 dark:text-gray-400">
        Archivo seleccionado: {{ selectedFile.name }}
      </p>
      <p v-if="uploadMessage" class="text-sm" :class="uploadOk ? 'text-green-600' : 'text-red-600'">{{ uploadMessage }}</p>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="mb-3">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">Historial de cargas</h2>
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
            </tr>
            <tr v-if="uploads.length === 0 && !loadingUploads">
              <td colspan="8" class="px-3 py-3 text-center text-gray-500">Sin cargas registradas.</td>
            </tr>
            <tr v-if="loadingUploads && uploads.length === 0">
              <td colspan="8" class="px-3 py-3 text-center text-gray-500">Cargando historial…</td>
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

    <p v-if="queryMessage" class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {{ queryMessage }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { lastNotification } from '@/composables/useNotificaciones'
import QuickTablePagination from '@/modules/mba3-consultas/components/QuickTablePagination.vue'
import { downloadTemplate, getUploads, uploadExcel, type UploadBatchSummary } from '../services/pygApi'

const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const loadingUpload = ref(false)
const uploadDragActive = ref(false)
const uploadMessage = ref('')
const uploadOk = ref(false)

const uploads = ref<UploadBatchSummary[]>([])
const loadingUploads = ref(false)

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

const uploadsHistoryCurrentPage = computed({
  get() {
    return uploadsHistoryPage.value
  },
  set(p: number) {
    const max = uploadsHistoryTotalPages.value
    uploadsHistoryPage.value = Math.min(max, Math.max(1, Math.round(p)))
  }
})

watch(uploadsHistoryTotalPages, (max) => {
  if (uploadsHistoryPage.value > max) uploadsHistoryPage.value = max
})
const queryMessage = ref('')
const UPLOADS_REFRESH_FAST_MS = 5000
const UPLOADS_REFRESH_SLOW_MS = 60000
const UPLOADS_REFRESH_HIDDEN_MS = 120000
const ACTIVE_UPLOAD_STATUS_KEYWORDS = ['processing', 'proces', 'pend', 'queue', 'en cola', 'running']
let uploadsAutoRefreshTimer: ReturnType<typeof setTimeout> | null = null
const isPygViewMounted = ref(false)

function uploadStatusClass(status: string | undefined): string {
  const s = String(status || '').toUpperCase()
  if (s === 'PROCESSED') return 'font-medium text-green-600 dark:text-green-400'
  if (s === 'REJECTED') return 'font-medium text-red-600 dark:text-red-400'
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

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
  if (!selectedFile.value) return
  void handleUpload()
}

function openFilePicker() {
  if (loadingUpload.value) return
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  fileInputRef.value.click()
}

function onUploadDragOver(event: DragEvent) {
  event.preventDefault()
  if (loadingUpload.value) return
  uploadDragActive.value = true
}

function onUploadDragLeave() {
  uploadDragActive.value = false
}

function onUploadDrop(event: DragEvent) {
  event.preventDefault()
  uploadDragActive.value = false
  if (loadingUpload.value) return
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  const nameOk = file.name.toLowerCase().endsWith('.xlsx')
  const typeOk =
    file.type === '' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (!nameOk && !typeOk) {
    uploadOk.value = false
    uploadMessage.value = 'Solo se admiten archivos Excel (.xlsx).'
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

async function handleDownloadTemplate() {
  const blob = await downloadTemplate()
  saveBlob(blob, 'Plantilla porcentajes.xlsx')
}

async function handleUpload() {
  if (!selectedFile.value) return

  loadingUpload.value = true
  uploadMessage.value = ''
  try {
    const result = await uploadExcel(selectedFile.value)
    uploadOk.value = result.success
    uploadMessage.value = result.message || 'Carga procesada.'
    await loadUploads()
    scheduleUploadsAutoRefresh(true)
  } catch (error: unknown) {
    uploadOk.value = false
    uploadMessage.value = getApiErrorMessage(error, 'Error al subir archivo.')
  } finally {
    loadingUpload.value = false
  }
}

function clearUploadsAutoRefreshTimer() {
  if (!uploadsAutoRefreshTimer) return
  clearTimeout(uploadsAutoRefreshTimer)
  uploadsAutoRefreshTimer = null
}

function hasActiveUploadProcessing(rows: UploadBatchSummary[]): boolean {
  return rows.some((row) => {
    const status = String(row.status || '').toLowerCase()
    return ACTIVE_UPLOAD_STATUS_KEYWORDS.some((keyword) => status.includes(keyword))
  })
}

function scheduleUploadsAutoRefresh(forceFast = false) {
  clearUploadsAutoRefreshTimer()
  if (!isPygViewMounted.value) return

  const hasActiveProcessing = hasActiveUploadProcessing(uploads.value)
  let waitMs = hasActiveProcessing || forceFast ? UPLOADS_REFRESH_FAST_MS : UPLOADS_REFRESH_SLOW_MS
  if (typeof document !== 'undefined' && document.hidden) {
    waitMs = UPLOADS_REFRESH_HIDDEN_MS
  }

  uploadsAutoRefreshTimer = setTimeout(() => {
    uploadsAutoRefreshTimer = null
    void loadUploads()
  }, waitMs)
}

async function loadUploads() {
  if (loadingUploads.value) return
  loadingUploads.value = true
  queryMessage.value = ''
  try {
    uploads.value = await getUploads()
  } catch (error: unknown) {
    uploads.value = []
    queryMessage.value = getApiErrorMessage(
      error,
      'No se pudo cargar el historial de cargas PYG. Revisa proxy (VITE_PYG_PROXY_TARGET), permisos del contenedor y logs del backend.'
    )
  } finally {
    loadingUploads.value = false
    scheduleUploadsAutoRefresh()
  }
}

onMounted(async () => {
  isPygViewMounted.value = true
  await loadUploads()
})

watch(lastNotification, (notification) => {
  if (!notification) return
  if (notification.target_permission !== 'pyg.edit') return
  if (notification.metadata?.accion !== 'pyg_upload_completed') return
  void loadUploads()
})

onBeforeUnmount(() => {
  isPygViewMounted.value = false
  clearUploadsAutoRefreshTimer()
})
</script>
