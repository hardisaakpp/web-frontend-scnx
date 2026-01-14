<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Cargar Plantillas</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">Sube plantillas de Excel para procesar</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="$router.push('/mba3-consultas/pedidos/crear')"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
            title="Crear pedido manualmente"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear Pedido Manual
          </button>
          <button
            @click="abrirModalBuscarPedido"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
            title="Buscar pedido por número"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Gestionar Pedidos
          </button>
        </div>
      </div>

      <!-- Área de carga de archivos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
                'border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30' 
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-indigo-400 dark:hover:bg-gray-800/60'
              ]"
            >
              <div class="flex items-center justify-center gap-3">
                <!-- Icono de Excel -->
                <svg class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span class="text-sm text-gray-600 dark:text-gray-300">Arrastra un archivo Excel o <span class="text-indigo-600 dark:text-indigo-300 font-medium">haz clic para seleccionar</span></span>
              </div>
            </div>
          </div>

          <!-- Archivo seleccionado -->
          <div v-if="selectedFile && !uploading && !archivoCargado" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 dark:bg-emerald-900/40 rounded flex items-center justify-center">
                  <svg class="h-4 w-4 text-green-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ selectedFile.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="clearFile"
                  type="button"
                  class="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  @click="handleUpload"
                  type="button"
                  class="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  Subir
                </button>
              </div>
            </div>
          </div>

          <!-- Estado de carga -->
          <div v-if="uploading" class="border border-indigo-200 dark:border-indigo-500/60 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
            <div class="flex items-center gap-3">
              <svg class="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p class="text-sm text-indigo-900 dark:text-indigo-100">Subiendo archivo...</p>
            </div>
          </div>

          <!-- Resultado: Success / Warning / Error -->
          <div v-if="archivoCargado && uploadedFileName" class="space-y-4">
            <!-- Success/Warning Banner -->
            <div :class="[
              'border rounded-lg p-4',
              uploadResponse?.status === 'success' 
                ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/30' 
                : 'border-yellow-200 bg-yellow-50 dark:border-amber-700 dark:bg-amber-900/30'
            ]">
              <div class="flex items-center gap-3">
                <svg 
                  v-if="uploadResponse?.status === 'success'"
                  class="h-5 w-5 text-green-600 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg 
                  v-else
                  class="h-5 w-5 text-yellow-600 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p :class="[
                    'text-sm font-medium truncate',
                    uploadResponse?.status === 'success' ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-amber-100'
                  ]">
                    {{ uploadedFileName }}
                  </p>
                  <p :class="[
                    'text-xs mt-1',
                    uploadResponse?.status === 'success' ? 'text-green-700 dark:text-green-200' : 'text-yellow-700 dark:text-amber-200'
                  ]">
                    {{ uploadResponse?.status === 'success' ? 'Cargado exitosamente' : 'Cargado con advertencias' }}
                  </p>
                </div>
                <button
                  @click="handleReset"
                  type="button"
                  :class="[
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    uploadResponse?.status === 'success' 
                      ? 'text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-200 dark:hover:text-green-50 dark:hover:bg-green-900/40' 
                      : 'text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 dark:text-amber-200 dark:hover:text-amber-50 dark:hover:bg-amber-900/40'
                  ]"
                >
                  Subir otro
                </button>
              </div>
            </div>

            <!-- Validación compacta (solo si hay warnings/errores) -->
            <div v-if="uploadResponse?.validacion && !esValidacionCompletaOk" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resultados de Validación</h3>
              <div class="space-y-2 text-sm">
                <div v-if="uploadResponse.validacion.productos" class="flex items-center gap-2">
                  <svg class="h-4 w-4" :class="uploadResponse.validacion.productos.todos_validos ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="uploadResponse.validacion.productos.todos_validos" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-gray-700 dark:text-gray-200">
                    Productos: 
                    <span class="font-medium">{{ uploadResponse.validacion.productos.validos?.length || 0 }} válidos</span>
                    <span v-if="uploadResponse.validacion.productos.no_encontrados?.length > 0" class="text-red-600 dark:text-red-400">
                      , {{ uploadResponse.validacion.productos.no_encontrados.length }} no encontrados
                    </span>
                  </span>
                </div>
                <div v-if="uploadResponse.validacion.tiendas" class="flex items-center gap-2">
                  <svg class="h-4 w-4" :class="uploadResponse.validacion.tiendas.todas_validas ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="uploadResponse.validacion.tiendas.todas_validas" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-gray-700 dark:text-gray-200">
                    Tiendas: 
                    <span class="font-medium">{{ uploadResponse.validacion.tiendas.validas?.length || 0 }} válidas</span>
                    <span v-if="uploadResponse.validacion.tiendas.no_encontradas?.length > 0" class="text-red-600 dark:text-red-400">
                      , {{ uploadResponse.validacion.tiendas.no_encontradas.length }} no encontradas
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Errores adicionales (si existen) -->
            <div v-if="uploadResponse?.errores && uploadResponse.errores.length > 0" class="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <h4 class="font-medium text-red-900 dark:text-red-100 mb-2">Errores adicionales</h4>
              <ul class="list-disc list-inside text-sm text-red-700 dark:text-red-200">
                <li v-for="(error, index) in uploadResponse.errores" :key="index">{{ error }}</li>
              </ul>
            </div>
          </div>

          <!-- Mensaje de validación del backend cuando hay validation_error -->
          <div v-if="uploadResponse && uploadResponse.status === 'validation_error' && uploadResponse.message" class="mt-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Error de validación</p>
                <div class="text-sm text-red-800 dark:text-red-200 mb-2">{{ uploadResponse.message }}</div>
                
                <!-- Detalle específico: Productos no válidos en SAP -->
                <div v-if="(uploadResponse.message.includes('No se puede persistir el pedido') || uploadResponse.message.includes('No se puede procesar la plantilla')) && (uploadResponse.message.includes('productos no válidos en SAP') || uploadResponse.message.includes('no encontrados en SAP'))" class="mt-3 p-3 bg-yellow-50 dark:bg-amber-950 border border-yellow-300 dark:border-amber-800 rounded">
                  <p class="text-xs font-medium text-yellow-900 dark:text-amber-100 mb-1">💡 Productos no válidos: <span class="font-mono">{{ extractProductosNoValidos(uploadResponse.message) }}</span></p>
                  <p class="text-xs font-medium text-yellow-900 dark:text-amber-100 mb-1 mt-2">Soluciones sugeridas:</p>
                  <ul class="text-xs text-yellow-800 dark:text-amber-200 ml-4 list-disc space-y-1">
                    <li>Verifica que los códigos de producto estén escritos correctamente</li>
                    <li>Confirma que los productos existen en el catálogo SAP</li>
                    <li>Revisa posibles errores de tipeo en el archivo Excel</li>
                    <li>Contacta al administrador si los productos deberían existir</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Error de carga -->
          <div v-if="uploadError" class="mt-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Error al procesar el archivo</p>
                <div class="text-sm text-red-800 dark:text-red-200 mb-3">{{ uploadError }}</div>
                
                <!-- Error específico: Productos no válidos en SAP -->
                <div v-if="(uploadError.includes('No se puede persistir el pedido') || uploadError.includes('No se puede procesar la plantilla')) && (uploadError.includes('productos no válidos en SAP') || uploadError.includes('no encontrados en SAP'))" class="mt-3 p-4 bg-red-100 dark:bg-red-950 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <div class="flex items-start gap-2 mb-2">
                    <svg class="h-5 w-5 text-red-700 dark:text-red-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="flex-1">
                      <p class="text-sm font-bold text-red-900 dark:text-red-100 mb-1">❌ Productos no encontrados en SAP</p>
                      <p class="text-xs text-red-800 dark:text-red-200">Los siguientes productos no existen en el sistema SAP y deben ser corregidos: <span class="font-mono">{{ extractProductosNoValidos(uploadError) }}</span></p>
                    </div>
                  </div>
                  <div class="mt-3 p-3 bg-yellow-50 dark:bg-amber-950 border border-yellow-300 dark:border-amber-800 rounded">
                    <p class="text-xs font-medium text-yellow-900 dark:text-amber-100 mb-1">💡 Soluciones sugeridas:</p>
                    <ul class="text-xs text-yellow-800 dark:text-amber-200 ml-4 list-disc space-y-1">
                      <li>Verifica que los códigos de producto estén escritos correctamente</li>
                      <li>Confirma que los productos existen en el catálogo SAP</li>
                      <li>Revisa posibles errores de tipeo en el archivo Excel</li>
                      <li>Contacta al administrador si los productos deberían existir</li>
                    </ul>
                  </div>
                </div>
                
                <!-- Sugerencias según el tipo de error -->
                <div v-if="uploadError.includes('Ya existe un pedido') || uploadError.includes('duplicado') || uploadError.includes('número de pedido') || uploadError.includes('numero de pedido')" class="mt-3 p-3 bg-yellow-50 dark:bg-amber-900/30 border border-yellow-200 dark:border-amber-800 rounded-lg">
                  <p class="text-xs font-medium text-yellow-900 dark:text-amber-100 mb-1">💡 Sugerencia:</p>
                  <p class="text-xs text-yellow-800 dark:text-amber-200">
                    El número de pedido que intentaste utilizar ya existe en el sistema. No es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido en el archivo Excel e intenta con un número diferente.
                  </p>
                </div>
                
                <div v-else-if="uploadError.includes('formato') || uploadError.includes('estructura') || uploadError.includes('No se pudo detectar') || uploadError.includes('hojas') || uploadError.includes('Hojas encontradas')" class="mt-3 p-3 bg-yellow-50 dark:bg-amber-900/30 border border-yellow-200 dark:border-amber-800 rounded-lg">
                  <p class="text-xs font-medium text-yellow-900 dark:text-amber-100 mb-1">💡 Sugerencia:</p>
                  <p class="text-xs text-yellow-800 dark:text-amber-200">
                    El archivo Excel debe tener una de las siguientes estructuras:
                  </p>
                  <ul class="text-xs text-yellow-800 dark:text-amber-200 mt-2 ml-4 list-disc space-y-1">
                    <li><strong>Formato de dos hojas:</strong> 'CABECERA_PEDIDO' y 'DETALLE_ARTICULO'</li>
                    <li><strong>Formato simple:</strong> una hoja con columnas CodigoProducto, IdTienda, Cantidad</li>
                    <li><strong>Formato complejo:</strong> estructura legacy con cabecera y columnas de tiendas</li>
                  </ul>
                  <p class="text-xs text-yellow-800 dark:text-amber-200 mt-2">
                    Verifica que las hojas tengan los nombres correctos y que las columnas estén en el formato esperado.
                  </p>
                </div>
                
                <div v-else-if="uploadError.includes('conectar') || uploadError.includes('servidor')" class="mt-3 p-3 bg-yellow-50 dark:bg-amber-900/30 border border-yellow-200 dark:border-amber-800 rounded-lg">
                  <p class="text-xs font-medium text-yellow-900 dark:text-amber-100 mb-1">💡 Sugerencia:</p>
                  <p class="text-xs text-yellow-800 dark:text-amber-200">
                    Verifica tu conexión a internet y que el servidor esté disponible. Intenta nuevamente en unos momentos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para buscar pedido por ID -->
    <div
      v-if="showBuscarPedidoModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showBuscarPedidoModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Acceder a Pedido</h3>
          <button
            @click="showBuscarPedidoModal = false"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Ingresa el número de pedido para acceder a su detalle y gestionar la respuesta del proveedor.
        </p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Número de Pedido
            </label>
            <input
              v-model="pedidoIdInput"
              @keyup.enter="goToPedido"
              type="text"
              :list="`pedido-history-list-${showBuscarPedidoModal}`"
              placeholder="Ej: P-12.48 - 12 - 2025"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autocomplete="off"
              autofocus
            />
            <datalist :id="`pedido-history-list-${showBuscarPedidoModal}`">
              <option v-for="pedido in historialPedidos" :key="pedido" :value="pedido" />
            </datalist>
          </div>
          
          <div class="flex items-center gap-3">
            <button
              @click="goToPedido"
              class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Abrir Pedido
            </button>
            <button
              @click="showBuscarPedidoModal = false"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
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
const showBuscarPedidoModal = ref(false)
const pedidoIdInput = ref('')
// Flag para evitar múltiples llamadas simultáneas, pero se resetea al montar/activar
const cargandoUltimoPedido = ref(false)
// Flag para evitar redirección automática si el usuario hizo una búsqueda manual
const busquedaManualRealizada = ref(false)

// ⭐ Historial de números de pedido (similar al autocompletado del navegador)
const STORAGE_KEY_PEDIDOS = 'mba3_pedidos_historial'
const MAX_HISTORIAL_SIZE = 10 // Máximo de 10 números de pedido en el historial

/**
 * Guarda un número de pedido en el historial
 */
function guardarEnHistorial(numeroPedido: string) {
  if (!numeroPedido || !numeroPedido.trim()) return
  
  try {
    const historial = obtenerHistorial()
    const numeroPedidoTrimmed = numeroPedido.trim()
    
    // Remover si ya existe (para moverlo al principio)
    const index = historial.indexOf(numeroPedidoTrimmed)
    if (index > -1) {
      historial.splice(index, 1)
    }
    
    // Agregar al principio
    historial.unshift(numeroPedidoTrimmed)
    
    // Limitar el tamaño del historial
    if (historial.length > MAX_HISTORIAL_SIZE) {
      historial.splice(MAX_HISTORIAL_SIZE)
    }
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(historial))
  } catch (e) {
    console.warn('Error al guardar en historial de pedidos:', e)
  }
}

/**
 * Obtiene el historial de números de pedido
 */
function obtenerHistorial(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PEDIDOS)
    if (stored) {
      const historial = JSON.parse(stored) as string[]
      // Validar que sea un array y filtrar valores vacíos
      if (Array.isArray(historial)) {
        return historial.filter(p => p && p.trim().length > 0)
      }
    }
  } catch (e) {
    console.warn('Error al obtener historial de pedidos:', e)
  }
  return []
}

// Computed para el historial (reactivo)
const historialPedidos = computed(() => obtenerHistorial())

// Función para extraer productos no válidos del mensaje de error
const extractProductosNoValidos = (errorMsg: string): string => {
  // Buscar varios patrones posibles
  // Patrón 1: "Productos no encontrados en SAP: XXX"
  let match = errorMsg.match(/Productos no encontrados en SAP:\s*(.+?)(?:\.|$)/i)
  if (match && match[1]) {
    return match[1].trim()
  }
  
  // Patrón 2: "Productos (Movimiento) no encontrados en SAP: XXX"
  match = errorMsg.match(/Productos \([^)]+\) no encontrados en SAP:\s*(.+?)(?:\.|$)/i)
  if (match && match[1]) {
    return match[1].trim()
  }
  
  return 'No especificados'
}

// Computed: validación completa OK
const esValidacionCompletaOk = computed(() => {
  if (!uploadResponse.value?.validacion) return true
  const v = uploadResponse.value.validacion
  return v?.productos?.todos_validos && 
         v?.tiendas?.todas_validas && 
         v?.cantidades?.valid
})

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
    uploadedFileName.value = selectedFile.value.name
    
    // Si es un error de validación, marcar como archivo cargado para mostrar resultados
    if (response.status === 'validation_error') {
      archivoCargado.value = true
      toast.error(
        'Error de validación',
        response.message || 'La plantilla tiene errores que deben corregirse'
      )
      return // Salir aquí para mostrar el panel de error
    }
    
    // Solo marcar como cargado exitoso si no es error
    archivoCargado.value = true
    
    // Obtener numero_pedido de la respuesta
    let numeroPedido = response.numero_pedido
    
    // Si no viene en la respuesta, intentar obtenerlo del pedido cargado usando pedido_id
    if (!numeroPedido && response.pedido_id) {
      try {
        // El backend acepta tanto UUID como numero_pedido, así que podemos usar pedido_id temporalmente
        // para obtener el pedido y extraer su numero_pedido
        const pedidoCompleto = await mba3ConsultasService.getPedido(response.pedido_id, false)
        numeroPedido = pedidoCompleto.cabecera.numero_pedido || undefined
      } catch (e) {
        console.warn('No se pudo obtener el numero_pedido del pedido cargado:', e)
      }
    }
    
    // Redirigir directamente a la vista de detalle del pedido si tenemos numero_pedido
    if (numeroPedido) {
      if (response.status === 'success') {
        toast.success(
          'Plantilla procesada exitosamente', 
          `Número de pedido: ${numeroPedido}\nArtículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`
        )
      }
      
      // Redirigir a la vista de detalle del pedido (misma interfaz que "Gestionar Pedidos")
      router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
      return
    }
    
    // Si no tenemos numero_pedido, mostrar mensaje pero no redirigir
    if (response.status === 'success') {
      toast.success(
        'Plantilla procesada exitosamente', 
        `Artículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`
      )
    }
  } catch (e: any) {
    // Cuando hay un error de catch (error de red, timeout, etc), resetear el estado
    const errorMessage = e.message || 'Error al subir plantilla'
    uploadError.value = errorMessage
    
    // Resetear archivo seleccionado para permitir reintentar
    selectedFile.value = null
    archivoCargado.value = false
    
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

/**
 * Abre el modal de búsqueda de pedido y precarga el último número de pedido usado
 */
function abrirModalBuscarPedido() {
  showBuscarPedidoModal.value = true
  // Precargar el último número de pedido del historial
  const historial = obtenerHistorial()
  if (historial.length > 0) {
    pedidoIdInput.value = historial[0]
  }
}

function goToPedido() {
  const numeroPedido = pedidoIdInput.value.trim()
  if (!numeroPedido) {
    toast.error('Error', 'Por favor ingresa un número de pedido válido')
    return
  }
  
  // ⭐ Guardar en el historial antes de navegar
  guardarEnHistorial(numeroPedido)
  
  // Marcar que se hizo una búsqueda manual (evita redirección automática)
  busquedaManualRealizada.value = true
  showBuscarPedidoModal.value = false
  pedidoIdInput.value = ''
  router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
}

/**
 * Carga automáticamente el último pedido del usuario al montar/activar el componente
 * Se ejecuta cada vez que el usuario entra a "Cargar Plantillas"
 */
async function cargarUltimoPedido() {
  // Evitar múltiples llamadas simultáneas
  if (cargandoUltimoPedido.value) {
    return
  }

  // Si el usuario hizo una búsqueda manual, no redirigir automáticamente
  if (busquedaManualRealizada.value) {
    return
  }

  cargandoUltimoPedido.value = true
  
  try {
    const pedido = await mba3ConsultasService.getUltimoPedido(false)
    
    if (pedido && pedido.cabecera.numero_pedido) {
      // Mostrar badge informativo
      toast.info(
        'Último pedido cargado',
        `Mostrando último pedido: ${pedido.cabecera.numero_pedido}`
      )
      
      // Redirigir a la vista de detalle del pedido solo si no hay búsqueda manual
      if (!busquedaManualRealizada.value) {
        router.push(`/mba3-consultas/pedidos/${encodeURIComponent(pedido.cabecera.numero_pedido)}`)
      }
    }
  } catch (error: any) {
    // Si es un error que no sea 404, loguearlo pero no mostrar error al usuario
    // (el 404 ya se maneja en el servicio retornando null)
    if (error.response?.status !== 404 && error.message && !error.message.includes('404')) {
      console.error('Error al cargar último pedido:', error)
    }
    // No mostrar error al usuario, simplemente no redirigir
  } finally {
    cargandoUltimoPedido.value = false
  }
}

// Función para resetear el flag de búsqueda manual cuando se monta/activa el componente
function resetearEstado() {
  // Resetear el flag de búsqueda manual para permitir carga automática
  // Esto permite que al regresar a "Cargar Plantillas", se vuelva a cargar el último pedido
  busquedaManualRealizada.value = false
}

// Cargar último pedido al montar el componente
onMounted(() => {
  resetearEstado()
  cargarUltimoPedido()
})

// Si el componente está en un keep-alive, también cargar al activarse
onActivated(() => {
  resetearEstado()
  cargarUltimoPedido()
})

</script>

