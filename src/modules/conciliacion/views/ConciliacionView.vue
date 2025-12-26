<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Conciliación</h1>
        <p class="mt-2 text-sm text-gray-600">Carga archivos Excel para procesar conciliaciones</p>
      </div>

      <!-- Error message -->
      <div v-if="error" class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div class="flex items-center justify-between">
          <p>{{ error }}</p>
          <button 
            @click="store.clearError()" 
            class="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Upload Card -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="text-center">
          <!-- Upload Area -->
          <div 
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            :class="[
              'border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer',
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50',
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            ]"
          >
            <input
              ref="fileInput"
              type="file"
              @change="handleFileSelect"
              accept=".xlsx,.xls,.csv,.pdf"
              class="hidden"
              :disabled="uploading"
            />
            
            <div v-if="!selectedFile && !uploading" class="space-y-4">
              <div class="flex justify-center">
                <svg class="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p class="text-lg font-medium text-gray-700">
                  Arrastra y suelta tu archivo Excel aquí
                </p>
                <p class="mt-2 text-sm text-gray-500">
                  o haz clic para seleccionar
                </p>
              </div>
              <p class="text-xs text-gray-400">
                Formatos soportados: .xlsx, .xls, .csv, .pdf (máx. 10 MB)
              </p>
            </div>

            <!-- Selected File -->
            <div v-if="selectedFile && !uploading" class="space-y-4">
              <div class="flex justify-center">
                <svg class="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-lg font-medium text-gray-700">{{ selectedFile.name }}</p>
                <p class="mt-1 text-sm text-gray-500">
                  Tamaño: {{ formatFileSize(selectedFile.size) }}
                </p>
              </div>
              <button
                @click.stop="clearFile"
                class="mt-4 text-sm text-red-600 hover:text-red-700"
              >
                Cambiar archivo
              </button>
            </div>

            <!-- Uploading -->
            <div v-if="uploading" class="space-y-4">
              <div class="flex justify-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
              </div>
              <p class="text-lg font-medium text-gray-700">Subiendo archivo...</p>
              <p class="text-sm text-gray-500">Por favor espera</p>
            </div>
          </div>

          <!-- Upload Button -->
          <div v-if="selectedFile && !uploading" class="mt-6">
            <button
              @click="handleUpload"
              class="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg shadow-md hover:shadow-lg"
            >
              Cargar Archivo
            </button>
          </div>
        </div>
      </div>

      <!-- Info Card -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">Información</h3>
            <div class="mt-2 text-sm text-blue-700">
              <p>• Formatos permitidos: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf)</p>
              <p>• El tamaño máximo permitido es de 10 MB</p>
              <p>• Una vez cargado, el archivo será procesado automáticamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'

const store = useConciliacionStore()
const toast = useToast()

const error = computed(() => store.error)
const uploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const triggerFileInput = () => {
  if (!uploading.value && fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    validateAndSetFile(target.files[0], target)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (uploading.value) return
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    validateAndSetFile(files[0])
  }
}

const validateAndSetFile = (file: File, inputElement?: HTMLInputElement) => {
  // Validar tipo - coincide con validación del backend
  const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  
  if (!allowedExtensions.includes(fileExtension)) {
    toast.error('Tipo de archivo no permitido', `Solo se permiten: ${allowedExtensions.join(', ')}`)
    if (inputElement) inputElement.value = ''
    return
  }
  
  // Validar tamaño (10 MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    toast.error('Archivo muy grande', 'El tamaño máximo es 10 MB')
    if (inputElement) inputElement.value = ''
    return
  }
  
  selectedFile.value = file
  toast.success('Archivo seleccionado', `Listo para cargar: ${file.name}`)
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return
  
  uploading.value = true
  store.clearError()
  
  try {
    await store.uploadDocumento(selectedFile.value)
    toast.success('Archivo cargado exitosamente', 'El archivo está siendo procesado')
    
    // Limpiar después de un breve delay
    setTimeout(() => {
      clearFile()
    }, 1500)
  } catch (e: any) {
    toast.error('Error al cargar archivo', e.message || 'Por favor intenta nuevamente')
  } finally {
    uploading.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>
