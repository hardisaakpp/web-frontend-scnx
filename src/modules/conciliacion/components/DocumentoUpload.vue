<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      @change="handleFileSelect"
      accept=".xlsx,.xls"
      class="hidden"
      :disabled="uploading || documentoCargado"
    />

    <!-- Estado inicial: Upload simple -->
    <div v-if="!selectedFile && !uploading && !documentoCargado">
      <div 
        @click="triggerFileInput"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        :class="[
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
        ]"
      >
        <!-- Icono de Excel usando Heroicons -->
        <div class="flex justify-center mb-4">
          <DocumentArrowUpIcon class="h-16 w-16 text-green-600" />
        </div>
        <p class="text-gray-600 mb-2">Arrastra tu archivo Excel aquí</p>
        <p class="text-sm text-gray-400">o <span class="text-indigo-600 font-medium">haz clic para seleccionar</span></p>
        <p class="text-xs text-gray-400 mt-2">Formatos: XLSX, XLS (máx. 10 MB)</p>
      </div>
    </div>

    <!-- Archivo seleccionado -->
    <div v-if="selectedFile && !uploading && !documentoCargado" class="border rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <svg class="h-6 w-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ selectedFile.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-3 ml-4">
          <button
            @click="clearFile"
            type="button"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Cambiar
          </button>
          <button
            @click="handleUpload"
            type="button"
            class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            Subir
          </button>
        </div>
      </div>
    </div>

    <!-- Subiendo -->
    <div v-if="uploading" class="border rounded-lg p-4">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
        <span class="text-sm text-gray-700">Subiendo archivo...</span>
      </div>
    </div>

    <!-- Documento cargado -->
    <div v-if="documentoCargado && uploadedFileName" class="border border-green-200 bg-green-50 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-green-900 truncate">{{ uploadedFileName }}</p>
          <p class="text-xs text-green-700">Cargado exitosamente</p>
        </div>
        <button
          @click="handleReset"
          type="button"
          class="text-sm text-green-700 hover:text-green-900 ml-4"
        >
          Cambiar
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="uploadError" class="mt-3 text-sm text-red-600">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DocumentArrowUpIcon } from '@heroicons/vue/24/outline'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'

const emit = defineEmits<{
  uploaded: [documentoId: string]
  reset: []
}>()

const store = useConciliacionStore()
const toast = useToast()

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const documentoCargado = ref(false)
const uploadedFileName = ref<string>('')
const uploadError = ref<string>('')

const triggerFileInput = () => {
  if (!uploading.value && !documentoCargado.value && fileInput.value) {
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
  if (uploading.value || documentoCargado.value) return
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    validateAndSetFile(files[0])
  }
}

const validateAndSetFile = (file: File, inputElement?: HTMLInputElement) => {
  uploadError.value = ''
  
  // Validar tipo - solo archivos Excel
  const allowedExtensions = ['.xlsx', '.xls']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  
  if (!allowedExtensions.includes(fileExtension)) {
    const errorMsg = `Solo se permiten archivos Excel (.xlsx, .xls)`
    uploadError.value = errorMsg
    toast.error('Tipo de archivo no permitido', errorMsg)
    if (inputElement) inputElement.value = ''
    return
  }
  
  // Validar tamaño (10 MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    const errorMsg = 'El tamaño máximo es 10 MB'
    uploadError.value = errorMsg
    toast.error('Archivo muy grande', errorMsg)
    if (inputElement) inputElement.value = ''
    return
  }
  
  selectedFile.value = file
  toast.success('Archivo seleccionado', `Listo para cargar: ${file.name}`)
}

const clearFile = () => {
  selectedFile.value = null
  uploadError.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) return
  
  uploading.value = true
  uploadError.value = ''
  store.clearError()
  
  try {
    const result = await store.uploadDocumento(selectedFile.value)
    
    // El backend devuelve file_id que usamos como documento_id
    const documentoId = result.file_id
    if (!documentoId) {
      throw new Error('El servidor no devolvió un ID de documento')
    }
    
    documentoCargado.value = true
    uploadedFileName.value = selectedFile.value.name
    
    toast.success('Documento cargado exitosamente', 'El documento está listo para usar')
    
    // Emitir evento con el documento_id
    emit('uploaded', documentoId)
  } catch (e: any) {
    const errorMessage = e.message || 'Error al subir documento'
    uploadError.value = errorMessage
    toast.error('Error al cargar documento', errorMessage)
  } finally {
    uploading.value = false
  }
}

const handleReset = () => {
  documentoCargado.value = false
  uploadedFileName.value = ''
  clearFile()
  emit('reset')
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

