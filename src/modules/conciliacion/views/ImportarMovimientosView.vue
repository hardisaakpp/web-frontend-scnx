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
          <!-- Selector de Banco -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Banco <span class="text-red-500">*</span>
            </label>
            <select
              v-model="selectedBanco"
              class="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              :disabled="uploading"
            >
              <option value="">Seleccione un banco</option>
              <option v-for="banco in store.bancos" :key="banco.id_banco" :value="banco.nombre_banco">
                {{ banco.nombre_banco }}
              </option>
            </select>
          </div>

          <!-- Upload Area -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <input
              ref="fileInput"
              type="file"
              @change="handleFileSelect"
              accept=".xlsx,.xls"
              class="hidden"
              :disabled="uploading"
            />

            <!-- Drop zone -->
            <div
              v-if="!selectedFile && !uploading && !uploadDone"
              @click="fileInput?.click()"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              :class="[
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
              ]"
            >
              <svg class="mx-auto h-12 w-12 text-green-500 dark:text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm text-gray-600 dark:text-gray-400">Arrastra tu archivo Excel aquí</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">o <span class="text-blue-600 dark:text-blue-400 font-medium">haz clic para seleccionar</span></p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">XLSX, XLS (máx. 10 MB)</p>
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
                  :disabled="!selectedBanco"
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
                  <button @click="resetUpload" class="mt-3 text-xs text-emerald-700 dark:text-emerald-300 hover:underline">Subir otro archivo</button>
                </div>
              </div>
            </div>

            <!-- Validation error -->
            <p v-if="!selectedBanco && selectedFile" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Seleccione un banco antes de importar
            </p>
          </div>

          <!-- Error -->
          <div v-if="uploadError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-red-700 dark:text-red-300">{{ uploadError }}</p>
            </div>
          </div>
        </div>

        <!-- Historial de Cargas -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Historial de cargas</h2>
          </div>
          <div class="overflow-x-auto">
            <table v-if="store.cargas.length > 0" class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Archivo</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Banco</th>
                  <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Registros</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr v-for="carga in store.cargas" :key="carga.id_carga" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-3 text-gray-900 dark:text-gray-200 truncate max-w-[200px]" :title="carga.nombre_archivo">{{ carga.nombre_archivo }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {{ carga.tipo_origen }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">{{ carga.registros_procesados }}</td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(carga.fecha_carga) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>No hay cargas registradas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const store = useConciliacionStore()
const authStore = useAuthStore()
const toast = useToast()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const selectedBanco = ref('')
const isDragging = ref(false)
const uploading = ref(false)
const uploadDone = ref(false)
const uploadError = ref('')

onMounted(async () => {
  try {
    await Promise.all([store.fetchBancos(), store.fetchCargas()])
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
  if (event.dataTransfer?.files?.[0]) validateAndSet(event.dataTransfer.files[0])
}

function validateAndSet(file: File) {
  uploadError.value = ''
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!['.xlsx', '.xls'].includes(ext)) {
    uploadError.value = 'Solo se permiten archivos Excel (.xlsx, .xls)'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'El tamaño máximo es 10 MB'
    return
  }
  selectedFile.value = file
}

function clearFile() {
  selectedFile.value = null
  uploadError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function resetUpload() {
  uploadDone.value = false
  store.lastImportResult = null
  clearFile()
}

async function handleUpload() {
  if (!selectedFile.value || !selectedBanco.value) return
  uploading.value = true
  uploadError.value = ''
  try {
    await store.importExcel(selectedFile.value, selectedBanco.value, authStore.userName)
    uploadDone.value = true
    toast.success('Importación exitosa', 'Los movimientos han sido procesados')
    // Refrescar historial
    await store.fetchCargas()
  } catch (e: any) {
    uploadError.value = e.response?.data?.message || e.message || 'Error al importar archivo'
    toast.error('Error', uploadError.value)
  } finally {
    uploading.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}
</script>
