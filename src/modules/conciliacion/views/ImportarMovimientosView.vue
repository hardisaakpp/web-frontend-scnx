<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conciliación</router-link>
            <span class="text-gray-400 dark:text-gray-500">/</span>
            <span class="text-sm text-gray-700 dark:text-gray-300">Importar</span>
          </div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Importar Movimientos Bancarios</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Suba un archivo Excel con los movimientos del banco</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Panel de Upload -->
        <div class="space-y-4">
          <!-- Upload Area: acepta soltar un archivo en cualquier estado (seleccionado, error o resultado), sin pasar primero por "Cambiar" -->
          <div
            class="rounded-lg border p-5 transition-colors"
            :class="isDragging
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/10'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'"
            @dragover.prevent="!uploading && (isDragging = true)"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              @change="handleFileSelect"
              accept=".xlsx,.xls"
              class="hidden"
              :disabled="uploading"
            />

            <!-- Drop zone: también sirve para cargar el siguiente archivo tras un resultado -->
            <div
              v-if="!selectedFile && !uploading"
              @click="fileInput?.click()"
              :class="[
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-blue-500'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
              ]"
            >
              <svg class="mx-auto h-12 w-12 text-green-500 dark:text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm text-gray-600 dark:text-gray-400">Arrastra tu archivo Excel aquí</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">o <span class="text-blue-600 dark:text-blue-400 font-medium">haz clic para seleccionar</span></p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">XLSX, XLS (máx. {{ MAX_EXCEL_UPLOAD_SIZE_MB }} MB)</p>
            </div>

            <!-- File selected -->
            <div v-if="selectedFile && !uploading && !uploadDone" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="flex items-center gap-3 min-w-0">
                <svg class="h-8 w-8 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ selectedFile.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-3">
                <button @click="clearFile" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1">Cambiar</button>
                <button
                  @click="handleUpload"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  Importar
                </button>
              </div>
            </div>

            <!-- Uploading -->
            <div v-if="uploading" class="flex items-center gap-3 p-4">
              <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span class="text-sm text-gray-700 dark:text-gray-300">Procesando archivo...</span>
            </div>

            <!-- Upload done -->
            <div v-if="uploadDone && store.lastImportResult" class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">{{ store.lastImportResult.message }}</p>
                  <p v-if="store.lastImportResult.data?.banco_detectado" class="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Banco: <span class="font-semibold">{{ store.lastImportResult.data.banco_detectado }}</span>
                  </p>
                  <div v-if="store.lastImportResult.data" class="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div class="bg-white dark:bg-gray-800 rounded p-2 text-center">
                      <p class="font-bold text-emerald-600 dark:text-emerald-400">{{ store.lastImportResult.data.registros_insertados }}</p>
                      <p class="text-gray-500 dark:text-gray-400">Insertados</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded p-2 text-center">
                      <p class="font-bold text-amber-600 dark:text-amber-400">{{ store.lastImportResult.data.registros_duplicados }}</p>
                      <p class="text-gray-500 dark:text-gray-400">Duplicados</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded p-2 text-center">
                      <p class="font-bold text-red-600 dark:text-red-400">{{ store.lastImportResult.data.registros_con_error }}</p>
                      <p class="text-gray-500 dark:text-gray-400">Errores</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Error -->
          <div v-if="uploadError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm text-red-700 dark:text-red-300">{{ uploadError }}</p>
                <button
                  v-if="detalleErrorColumnas"
                  @click="mostrarErrorColumnas = true"
                  class="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
                >
                  Ver detalle
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Historial de Cargas -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Historial de las últimas 10 cargas</h2>
          </div>
          <div v-if="store.cargas.length > 0" class="overflow-auto">
            <HistorialCargasTable :cargas="store.cargas" />
          </div>
          <div v-else class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>No hay cargas registradas</p>
          </div>
          <div class="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl text-center">
            <button
              @click="mostrarHistorialCompleto = true"
              class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
            >
              Ver todo el historial
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial completo, paginado -->
    <HistorialCargasModal v-if="mostrarHistorialCompleto" @close="mostrarHistorialCompleto = false" />

    <!-- Error de mapeo de columnas: ofrece ir a corregir el catálogo de bancos -->
    <ConfirmModal
      :open="mostrarErrorColumnas"
      title="No se pudo leer el archivo"
      :message="detalleErrorColumnas"
      confirm-label="Revisar catálogo de bancos"
      cancel-label="Cerrar"
      @confirm="irACatalogoBancos"
      @cancel="mostrarErrorColumnas = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { MAX_EXCEL_UPLOAD_SIZE_BYTES, MAX_EXCEL_UPLOAD_SIZE_MB } from '@/config/uploadLimits'
import ConfirmModal from '@/components/modales/ConfirmModal.vue'
import HistorialCargasModal from '../components/HistorialCargasModal.vue'
import HistorialCargasTable from '../components/HistorialCargasTable.vue'

const store = useConciliacionStore()
const authStore = useAuthStore()
const toast = useToast()
const router = useRouter()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const uploadDone = ref(false)
const uploadError = ref('')
const mostrarErrorColumnas = ref(false)
const detalleErrorColumnas = ref('')
const mostrarHistorialCompleto = ref(false)

onMounted(async () => {
  try {
    await store.fetchCargas()
  } catch {
    // handled by store
  }
})

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.[0]) validateAndSet(target.files[0])
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (uploading.value) return
  if (event.dataTransfer?.files?.[0]) validateAndSet(event.dataTransfer.files[0])
}

function validateAndSet(file: File) {
  uploadDone.value = false
  store.lastImportResult = null
  uploadError.value = ''
  detalleErrorColumnas.value = ''
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!['.xlsx', '.xls'].includes(ext)) {
    uploadError.value = 'Solo se permiten archivos Excel (.xlsx, .xls)'
    return
  }
  if (file.size > MAX_EXCEL_UPLOAD_SIZE_BYTES) {
    uploadError.value = `El tamaño máximo es ${MAX_EXCEL_UPLOAD_SIZE_MB} MB`
    return
  }
  selectedFile.value = file
}

function clearFile() {
  selectedFile.value = null
  uploadError.value = ''
  detalleErrorColumnas.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

async function handleUpload() {
  if (!selectedFile.value) return
  uploading.value = true
  uploadError.value = ''
  try {
    await store.importExcel(selectedFile.value, undefined, authStore.userName)
    uploadDone.value = true
    clearFile()
    toast.success('Importación exitosa', 'Los movimientos han sido procesados')
    // Refrescar historial
    await store.fetchCargas()
  } catch (e: any) {
    uploadError.value = e.response?.data?.message || e.message || 'Error al importar archivo'
    toast.error('Error', uploadError.value)

    const detalle = e.response?.data?.details
    detalleErrorColumnas.value = typeof detalle === 'string' && detalle.trim() ? detalle : ''

    // Limpiar el archivo (sin tocar el mensaje de error) para que reaparezca el cuadro de arrastrar
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
  } finally {
    uploading.value = false
  }
}

function irACatalogoBancos() {
  mostrarErrorColumnas.value = false
  router.push('/conciliacion/bancos')
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

</script>
