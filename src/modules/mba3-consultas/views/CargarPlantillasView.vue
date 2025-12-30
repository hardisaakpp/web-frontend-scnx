<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Cargar Plantillas</h1>
        <p class="mt-1 text-sm text-gray-500">Sube plantillas de Excel para procesar</p>
      </div>

      <!-- Área de carga de archivos -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div>
          <input
            ref="fileInput"
            type="file"
            @change="handleFileSelect"
            accept=".xlsx,.xls"
            class="hidden"
            :disabled="uploading"
          />

          <!-- Estado inicial: Upload simple -->
          <div v-if="!selectedFile && !uploading && !archivoCargado">
            <div 
              @click="triggerFileInput"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              :class="[
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
              ]"
            >
              <!-- Icono de Excel -->
              <div class="flex justify-center mb-4">
                <svg class="h-16 w-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p class="text-gray-600 mb-2 font-medium">Arrastra tu archivo Excel aquí</p>
              <p class="text-sm text-gray-400">o <span class="text-indigo-600 font-medium">haz clic para seleccionar</span></p>
              <p class="text-xs text-gray-400 mt-2">Formatos: XLSX, XLS (máx. 10 MB)</p>
            </div>
          </div>

          <!-- Archivo seleccionado -->
          <div v-if="selectedFile && !uploading && !archivoCargado" class="border border-gray-200 rounded-lg p-6">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ selectedFile.name }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="clearFile"
                  type="button"
                  class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  @click="handleUpload"
                  type="button"
                  class="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Subir
                </button>
              </div>
            </div>
          </div>

          <!-- Estado de carga -->
          <div v-if="uploading" class="border border-indigo-200 bg-indigo-50 rounded-lg p-6">
            <div class="flex items-center gap-4">
              <svg class="animate-spin h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-indigo-900">Subiendo archivo...</p>
                <p class="text-xs text-indigo-700 mt-1">Por favor espera mientras se procesa el archivo</p>
              </div>
            </div>
          </div>

          <!-- Archivo cargado exitosamente -->
          <div v-if="archivoCargado && uploadedFileName" class="space-y-4">
            <div class="border border-green-200 bg-green-50 rounded-lg p-6">
              <div class="flex items-center gap-4">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-green-900 truncate">{{ uploadedFileName }}</p>
                  <p class="text-xs text-green-700 mt-1">Cargado exitosamente</p>
                </div>
                <button
                  @click="handleReset"
                  type="button"
                  class="px-3 py-1.5 text-sm text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
                >
                  Subir otro
                </button>
              </div>
            </div>

            <!-- Información de validación (si existe) -->
            <div v-if="uploadResponse?.validacion" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Resultados de Validación</h3>
              
              <!-- Validación de Productos -->
              <div class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="h-5 w-5" :class="uploadResponse.validacion.productos.todos_validos ? 'text-green-600' : 'text-red-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="uploadResponse.validacion.productos.todos_validos" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-medium text-gray-900">Productos</span>
                </div>
                <div class="text-sm text-gray-600 ml-7">
                  <p v-if="uploadResponse.validacion.productos.todos_validos" class="text-green-700">
                    ✅ Todos los productos son válidos ({{ uploadResponse.validacion.productos.validos.length }})
                  </p>
                  <div v-else>
                    <p class="text-green-700 mb-1">
                      ✅ Válidos: {{ uploadResponse.validacion.productos.validos.length }}
                    </p>
                    <p class="text-red-700 mb-1">
                      ❌ No encontrados: {{ uploadResponse.validacion.productos.no_encontrados.length }}
                    </p>
                    <ul v-if="uploadResponse.validacion.productos.no_encontrados.length > 0" class="list-disc list-inside text-xs text-red-600 mt-1 ml-2">
                      <li v-for="codigo in uploadResponse.validacion.productos.no_encontrados" :key="codigo">
                        {{ codigo }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Validación de Tiendas -->
              <div class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="h-5 w-5" :class="uploadResponse.validacion.tiendas.todas_validas ? 'text-green-600' : 'text-red-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="uploadResponse.validacion.tiendas.todas_validas" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-medium text-gray-900">Tiendas</span>
                </div>
                <div class="text-sm text-gray-600 ml-7">
                  <p v-if="uploadResponse.validacion.tiendas.todas_validas" class="text-green-700">
                    ✅ Todas las tiendas son válidas ({{ uploadResponse.validacion.tiendas.validas.length }})
                  </p>
                  <div v-else>
                    <p class="text-green-700 mb-1">
                      ✅ Válidas: {{ uploadResponse.validacion.tiendas.validas.length }}
                    </p>
                    <p v-if="uploadResponse.validacion.tiendas.no_encontradas.length > 0" class="text-red-700 mb-1">
                      ❌ No encontradas: {{ uploadResponse.validacion.tiendas.no_encontradas.length }}
                    </p>
                    <p v-if="uploadResponse.validacion.tiendas.inactivas.length > 0" class="text-orange-700 mb-1">
                      ⚠️ Inactivas: {{ uploadResponse.validacion.tiendas.inactivas.length }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Validación de Cantidades -->
              <div class="mb-4">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="h-5 w-5" :class="uploadResponse.validacion.cantidades.valid ? 'text-green-600' : 'text-red-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="uploadResponse.validacion.cantidades.valid" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-medium text-gray-900">Cantidades</span>
                </div>
                <div class="text-sm text-gray-600 ml-7">
                  <p v-if="uploadResponse.validacion.cantidades.valid" class="text-green-700">
                    ✅ Todas las cantidades son válidas
                  </p>
                  <div v-else>
                    <p class="text-red-700 mb-1">
                      ❌ Errores: {{ uploadResponse.validacion.cantidades.errors }}
                    </p>
                    <p v-if="uploadResponse.validacion.cantidades.warnings > 0" class="text-orange-700">
                      ⚠️ Advertencias: {{ uploadResponse.validacion.cantidades.warnings }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información de Consolidación (si existe) -->
            <div v-if="uploadResponse?.consolidacion" class="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 class="font-medium text-blue-900 mb-2">Consolidación</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-blue-700">Productos únicos:</span>
                  <span class="font-semibold text-blue-900 ml-2">{{ uploadResponse.consolidacion.total_productos }}</span>
                </div>
                <div>
                  <span class="text-blue-700">Cantidad total:</span>
                  <span class="font-semibold text-blue-900 ml-2">{{ uploadResponse.consolidacion.cantidad_total }}</span>
                </div>
              </div>
            </div>

            <!-- Estado del pedido -->
            <div v-if="uploadResponse?.estado" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-700">Estado:</span>
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {{ uploadResponse.estado }}
                  </span>
                </div>
                <button
                  v-if="uploadResponse?.pedido_id"
                  @click="goToPedidoDetalle(uploadResponse.pedido_id)"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Ver Detalle del Pedido
                </button>
              </div>
            </div>

            <!-- Errores adicionales (si existen) -->
            <div v-if="uploadResponse?.errores && uploadResponse.errores.length > 0" class="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 class="font-medium text-red-900 mb-2">Errores adicionales</h4>
              <ul class="list-disc list-inside text-sm text-red-700">
                <li v-for="(error, index) in uploadResponse.errores" :key="index">{{ error }}</li>
              </ul>
            </div>
          </div>

          <!-- Error -->
          <div v-if="uploadError" class="mt-4 border border-red-200 bg-red-50 rounded-lg p-6">
            <div class="flex items-start gap-3">
              <svg class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-semibold text-red-900 mb-2">Error al procesar el archivo</p>
                <p class="text-sm text-red-800 mb-3">{{ uploadError }}</p>
                
                <!-- Sugerencias según el tipo de error -->
                <div v-if="uploadError.includes('Ya existe un pedido') || uploadError.includes('duplicado')" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p class="text-xs font-medium text-yellow-900 mb-1">💡 Sugerencia:</p>
                  <p class="text-xs text-yellow-800">
                    Este pedido ya fue cargado anteriormente. Si necesitas cargarlo nuevamente, verifica que el número de pedido sea diferente o contacta al administrador.
                  </p>
                </div>
                
                <div v-else-if="uploadError.includes('formato') || uploadError.includes('estructura')" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p class="text-xs font-medium text-yellow-900 mb-1">💡 Sugerencia:</p>
                  <p class="text-xs text-yellow-800">
                    Verifica que el archivo Excel tenga las hojas correctas ("Cabecera Pedido" y "Detalle Articulos") y que las columnas estén en el formato esperado.
                  </p>
                </div>
                
                <div v-else-if="uploadError.includes('conectar') || uploadError.includes('servidor')" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p class="text-xs font-medium text-yellow-900 mb-1">💡 Sugerencia:</p>
                  <p class="text-xs text-yellow-800">
                    Verifica tu conexión a internet y que el servidor esté disponible. Intenta nuevamente en unos momentos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { UploadPlantillaResponse } from '../types'

const router = useRouter()
const toast = useToast()

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const archivoCargado = ref(false)
const uploadedFileName = ref<string>('')
const uploadError = ref<string>('')
const uploadResponse = ref<UploadPlantillaResponse | null>(null)

const triggerFileInput = () => {
  if (!uploading.value && !archivoCargado.value && fileInput.value) {
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
  if (uploading.value || archivoCargado.value) return
  
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
  uploadResponse.value = null
  
  try {
    const response: UploadPlantillaResponse = await mba3ConsultasService.uploadPlantilla(selectedFile.value)
    
    uploadResponse.value = response
    archivoCargado.value = true
    uploadedFileName.value = selectedFile.value.name
    
    // Mensaje de éxito adaptado según el status
    if (response.status === 'success') {
      toast.success(
        'Plantilla procesada exitosamente', 
        `Pedido ID: ${response.pedido_id}\nArtículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`
      )
    } else if (response.status === 'validation_error') {
      toast.warning(
        'Plantilla procesada con advertencias',
        'Revisa los resultados de validación'
      )
    }
    
    // Opcional: Redirigir a vista de detalle del pedido
    // router.push(`/mba3-consultas/pedidos/${response.pedido_id}`)
  } catch (e: any) {
    const errorMessage = e.message || 'Error al subir plantilla'
    uploadError.value = errorMessage
    toast.error('Error al cargar plantilla', errorMessage)
  } finally {
    uploading.value = false
  }
}

const handleReset = () => {
  archivoCargado.value = false
  uploadedFileName.value = ''
  uploadResponse.value = null
  clearFile()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const goToPedidoDetalle = (pedidoId: string) => {
  router.push(`/mba3-consultas/pedidos/${pedidoId}`)
}
</script>

