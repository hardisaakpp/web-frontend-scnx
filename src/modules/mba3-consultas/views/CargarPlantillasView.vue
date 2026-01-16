<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  @click="handleUploadFile"
                  type="button"
                  :disabled="uploading"
                  class="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        </div>
      </div>
    </div>

    <!-- Modal para errores de validación del archivo -->
    <div
      v-if="showErrorModal"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      @click.self="showErrorModal = false"
    >
      <div :class="[
        'bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300',
        isModalMaximized ? 'w-full h-full max-w-none max-h-none m-0 rounded-none' : 'max-w-2xl w-full max-h-[90vh]'
      ]">
        <!-- Encabezado del modal con color según tipo de error -->
        <div :class="[
          'px-6 py-4 border-b flex items-center justify-between transition-colors duration-300',
          uploadErrorInfo?.title?.includes('SAP') ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' :
          uploadErrorInfo?.title?.includes('duplicado') ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' :
          uploadErrorInfo?.title?.includes('formato') ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' :
          'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
        ]">
          <div class="flex items-center gap-3">
            <div :class="[
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              uploadErrorInfo?.title?.includes('SAP') ? 'bg-red-100 dark:bg-red-900' :
              uploadErrorInfo?.title?.includes('duplicado') ? 'bg-orange-100 dark:bg-orange-900' :
              uploadErrorInfo?.title?.includes('formato') ? 'bg-yellow-100 dark:bg-yellow-900' :
              'bg-red-100 dark:bg-red-900'
            ]">
              <svg :class="[
                'w-6 h-6',
                uploadErrorInfo?.title?.includes('SAP') ? 'text-red-600 dark:text-red-400' :
                uploadErrorInfo?.title?.includes('duplicado') ? 'text-orange-600 dark:text-orange-400' :
                uploadErrorInfo?.title?.includes('formato') ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 :class="[
                'text-lg font-semibold',
                uploadErrorInfo?.title?.includes('SAP') ? 'text-red-900 dark:text-red-200' :
                uploadErrorInfo?.title?.includes('duplicado') ? 'text-orange-900 dark:text-orange-200' :
                uploadErrorInfo?.title?.includes('formato') ? 'text-yellow-900 dark:text-yellow-200' :
                'text-red-900 dark:text-red-200'
              ]">{{ uploadErrorInfo?.title || 'Error al cargar archivo Excel' }}</h3>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">El archivo no pudo ser procesado</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Botón de maximizar/restaurar -->
            <button
              @click="isModalMaximized = !isModalMaximized"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              :title="isModalMaximized ? 'Restaurar' : 'Maximizar'"
            >
              <svg v-if="!isModalMaximized" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5 5m5-5v4m0-4h-4" />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            </button>
            <!-- Botón de cerrar -->
            <button
              @click="showErrorModal = false"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Contenido del modal con scroll -->
        <div class="overflow-y-auto flex-1 p-6">
          <div class="space-y-4">
            <!-- Información del archivo -->
            <div v-if="uploadErrorInfo?.fileName" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                <span class="font-semibold text-gray-900 dark:text-white">Archivo rechazado:</span>
                <span class="ml-2 font-mono text-gray-600 dark:text-gray-400">{{ uploadErrorInfo.fileName }}</span>
              </p>
            </div>

            <!-- Mensaje de error principal -->
            <div class="bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Descripción del problema</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{{ uploadErrorInfo?.message }}</p>
                </div>
              </div>
            </div>

            <!-- Lista de errores detallados (si existen) -->
            <div v-if="uploadErrorInfo?.errors && uploadErrorInfo.errors.length > 0" class="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden bg-red-50 dark:bg-red-900/30 transition-colors duration-300">
              <div class="bg-red-100 dark:bg-red-900/50 px-4 py-3 border-b border-red-200 dark:border-red-800">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold text-red-900 dark:text-red-200">
                    Detalles del error ({{ uploadErrorInfo.errors.length }} problema{{ uploadErrorInfo.errors.length !== 1 ? 's' : '' }})
                  </p>
                  <span class="text-xs text-red-700 dark:text-red-300 font-medium">
                    {{ (uploadErrorInfo.title?.includes('SAP') || uploadErrorInfo.title?.includes('no encontrados')) ? 'Códigos inválidos' : 'Revisar y corregir' }}
                  </span>
                </div>
              </div>
              <div class="max-h-80 overflow-y-auto bg-white dark:bg-gray-800">
                <ul class="divide-y divide-gray-200 dark:divide-gray-700">
                  <li v-for="(error, index) in uploadErrorInfo.errors" :key="index" class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div v-if="typeof error !== 'string' && error.producto" class="flex items-start gap-3">
                      <div class="flex-shrink-0 mt-0.5">
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-bold">
                          ✕
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                          <p class="text-sm font-semibold text-gray-900 dark:text-white font-mono">{{ error.producto }}</p>
                          <span v-if="error.campo" class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {{ error.campo }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300">{{ error.mensaje }}</p>
                        
                        <!-- Sugerencias SAP automáticas (solo para códigos de producto no encontrados) -->
                        <div v-if="error.campo === 'Producto SAP' && error.producto" class="mt-4">
                          <!-- Estado de carga -->
                          <div v-if="sugerenciasEstado[error.producto] === 'buscando'" class="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                            <div class="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span class="text-xs font-medium">Buscando sugerencias similares en SAP...</span>
                            </div>
                          </div>
                          
                          <!-- Sugerencias encontradas -->
                          <div v-else-if="sugerenciasEstado[error.producto] === 'completado' && sugerenciasPorCodigo[error.producto]?.length > 0" class="mt-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                            <div class="flex items-center justify-between mb-2">
                              <h5 class="text-xs font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Sugerencias similares en SAP ({{ getSugerenciasLimitadas(error.producto).length }} de {{ sugerenciasPorCodigo[error.producto].length }}) - Selecciona una:
                              </h5>
                              <!-- Control de cantidad de sugerencias a mostrar -->
                              <div class="flex items-center gap-2 flex-wrap">
                                <label class="text-xs text-purple-700 dark:text-purple-300 whitespace-nowrap">
                                  Mostrar:
                                </label>
                                <input
                                  type="number"
                                  :value="getLimiteSugerencias(error.producto)"
                                  @input="setLimiteSugerencias(error.producto, parseInt(($event.target as HTMLInputElement).value) || 5)"
                                  :min="1"
                                  :max="sugerenciasPorCodigo[error.producto].length"
                                  class="w-16 px-2 py-1 text-xs border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                />
                                <span class="text-xs text-purple-600 dark:text-purple-400">
                                  / {{ sugerenciasPorCodigo[error.producto].length }}
                                </span>
                                <!-- Botones rápidos -->
                                <div class="flex items-center gap-1 ml-1">
                                  <button
                                    v-if="getLimiteSugerencias(error.producto) < sugerenciasPorCodigo[error.producto].length"
                                    @click="setLimiteSugerencias(error.producto, Math.min(getLimiteSugerencias(error.producto) + 5, sugerenciasPorCodigo[error.producto].length))"
                                    class="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                    title="Mostrar 5 más"
                                  >
                                    +5
                                  </button>
                                  <button
                                    v-if="getLimiteSugerencias(error.producto) < sugerenciasPorCodigo[error.producto].length"
                                    @click="setLimiteSugerencias(error.producto, sugerenciasPorCodigo[error.producto].length)"
                                    class="px-2 py-0.5 text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-300 dark:hover:bg-purple-700 transition-colors font-semibold"
                                    title="Mostrar todas"
                                  >
                                    Todas
                                  </button>
                                  <button
                                    v-if="getLimiteSugerencias(error.producto) > 5"
                                    @click="setLimiteSugerencias(error.producto, 5)"
                                    class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Mostrar solo 5"
                                  >
                                    Menos
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div class="space-y-2">
                              <label
                                v-for="sugerencia in getSugerenciasLimitadas(error.producto)"
                                :key="sugerencia.codigo"
                                class="flex items-start gap-2 cursor-pointer bg-white dark:bg-gray-800 border-l-4 rounded-lg p-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                :class="{
                                  'border-green-500': sugerencia.score_porcentaje >= 80,
                                  'border-yellow-500': sugerencia.score_porcentaje >= 50 && sugerencia.score_porcentaje < 80,
                                  'border-red-500': sugerencia.score_porcentaje < 50,
                                  'ring-2 ring-purple-500': correccionesSeleccionadas[error.producto] === sugerencia.codigo
                                }"
                              >
                                <input
                                  type="radio"
                                  :name="`correccion-${error.producto}`"
                                  :value="sugerencia.codigo"
                                  v-model="correccionesSeleccionadas[error.producto]"
                                  class="mt-0.5 w-3 h-3 text-purple-600 border-gray-300 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-purple-600"
                                />
                                <div class="flex-1 min-w-0">
                                  <div class="flex items-center gap-2 mb-1">
                                    <span class="text-xs font-semibold text-gray-900 dark:text-gray-100 font-mono">{{ sugerencia.codigo }}</span>
                                    <span
                                      class="px-2 py-0.5 rounded-full text-xs font-semibold"
                                      :class="getScoreBadgeClass(sugerencia.score_porcentaje)"
                                    >
                                      {{ sugerencia.score_porcentaje }}%
                                    </span>
                                  </div>
                                  <p class="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">{{ sugerencia.nombre }}</p>
                                  
                                  <div class="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                                    <span v-if="sugerencia.pack">Pack: <span class="font-semibold">{{ sugerencia.pack }}</span></span>
                                    <span v-if="sugerencia.group_name">Grupo: <span class="font-semibold">{{ sugerencia.group_name }}</span></span>
                                    <span
                                      :class="sugerencia.estado === 'activo' ? 'text-green-700 dark:text-green-300 font-semibold' : 'text-red-700 dark:text-red-300 font-semibold'"
                                    >
                                      {{ sugerencia.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                                    </span>
                                  </div>
                                  
                                  <!-- Motivos expandibles -->
                                  <details v-if="sugerencia.motivos && sugerencia.motivos.length > 0" class="mt-2">
                                    <summary class="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200">
                                      Motivos ({{ sugerencia.motivos.length }})
                                    </summary>
                                    <ul class="mt-1 ml-3 space-y-0.5">
                                      <li
                                        v-for="(motivo, motivoIndex) in sugerencia.motivos"
                                        :key="motivoIndex"
                                        class="text-xs text-gray-600 dark:text-gray-400 list-disc"
                                      >
                                        {{ motivo }}
                                      </li>
                                    </ul>
                                  </details>
                                </div>
                              </label>
                            </div>
                          </div>
                          
                          <!-- Sin sugerencias -->
                          <div v-else-if="sugerenciasEstado[error.producto] === 'completado' && (!sugerenciasPorCodigo[error.producto] || sugerenciasPorCodigo[error.producto].length === 0)" class="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                            <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span class="text-xs font-medium">No se encontraron sugerencias similares en SAP para este código.</span>
                            </div>
                          </div>
                          
                          <!-- Error en búsqueda de sugerencias -->
                          <div v-else-if="sugerenciasEstado[error.producto] === 'error'" class="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                            <div class="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span class="text-xs font-medium">No se pudieron obtener sugerencias (puede ser timeout).</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="flex items-start gap-3">
                      <div class="flex-shrink-0 mt-0.5">
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-bold">
                          !
                        </span>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-gray-900 dark:text-white">{{ formatError(error) }}</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div v-if="uploadErrorInfo.title && (uploadErrorInfo.title.includes('SAP') || uploadErrorInfo.title.includes('no encontrados'))" class="bg-amber-50 dark:bg-amber-900/30 border-t border-amber-200 dark:border-amber-800 px-4 py-3 transition-colors duration-300">
                <div class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="flex-1">
                    <p class="text-xs font-medium text-amber-900 dark:text-amber-200">⚠️ Acciones recomendadas:</p>
                    <ul class="text-xs text-amber-800 dark:text-amber-300 mt-1 space-y-1 ml-2">
                      <li>• Verifica que los códigos estén escritos correctamente en el Excel</li>
                      <li>• Confirma que los códigos estén registrados en SAP</li>
                      <li>• Revisa posibles errores de tipeo (mayúsculas/minúsculas, espacios, guiones)</li>
                      <li>• Contacta al área de maestros si los códigos deberían existir</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <!-- Mensaje de validación de correcciones -->
              <div v-if="uploadErrorInfo?.title?.includes('producto') || uploadErrorInfo?.title?.includes('SAP')" class="flex items-center gap-2 text-sm">
                <span 
                  v-if="!todosCodigosTienenCorreccion"
                  class="text-amber-600 dark:text-amber-400 font-medium"
                >
                  ⚠️ Debes seleccionar una sugerencia para cada código inválido
                </span>
                <span 
                  v-else
                  class="text-green-600 dark:text-green-400 font-medium"
                >
                  ✅ Todas las correcciones seleccionadas
                </span>
              </div>
              <div class="flex items-center gap-3">
                <!-- Botón aplicar correcciones (solo si hay códigos de producto no encontrados) -->
                <button
                  v-if="(uploadErrorInfo?.title?.includes('producto') || uploadErrorInfo?.title?.includes('SAP')) && todosCodigosTienenCorreccion"
                  @click="aplicarCorreccionesYContinuar"
                  :disabled="aplicandoCorrecciones"
                  class="px-4 py-2.5 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg v-if="aplicandoCorrecciones" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ aplicandoCorrecciones ? 'Aplicando correcciones...' : 'Aplicar correcciones y continuar' }}
                </button>
                <button
                  @click="showErrorModal = false"
                  class="px-4 py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium shadow-sm"
                >
                  Entendido
                </button>
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
import { ref, computed, onMounted, onActivated, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useFileUpload } from '../composables/useFileUpload'
import type { UploadPlantillaResponse, SugerenciaSkuSap } from '../types'
import { formatError } from '../utils/formatters'

const router = useRouter()
const toast = useToast()

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const archivoCargado = ref(false)
const uploadedFileName = ref<string>('')
const uploadResponse = ref<UploadPlantillaResponse | null>(null)
const showBuscarPedidoModal = ref(false)
const pedidoIdInput = ref('')
// Flag para evitar múltiples llamadas simultáneas, pero se resetea al montar/activar
const cargandoUltimoPedido = ref(false)
// Flag para evitar redirección automática si el usuario hizo una búsqueda manual
const busquedaManualRealizada = ref(false)

// ⭐ Usar composable useFileUpload que muestra modal de error
const fileUploadComposable = useFileUpload({
  onUploadSuccess: async (numeroPedido) => {
    // Redirigir a la vista de detalle del pedido
    router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
  }
})

const {
  uploading,
  showErrorModal,
  uploadErrorInfo,
  uploadFile,
  validateFile,
  reintentarConCorrecciones,
  archivoOriginal: archivoOriginalDelComposable
} = fileUploadComposable

// ⭐ NUEVA FUNCIONALIDAD: Sugerencias SAP automáticas en modal de error
// Almacenar sugerencias por código de producto
const sugerenciasPorCodigo = ref<Record<string, SugerenciaSkuSap[]>>({})
// Estado de búsqueda por código: 'idle' | 'buscando' | 'completado' | 'error'
const sugerenciasEstado = ref<Record<string, 'idle' | 'buscando' | 'completado' | 'error'>>({})
// ⭐ NUEVA FUNCIONALIDAD: Correcciones seleccionadas por código
const correccionesSeleccionadas = ref<Record<string, string>>({})
// ⭐ NUEVA FUNCIONALIDAD: Límite de sugerencias a mostrar por código (por defecto 5)
const limiteSugerenciasMostradas = ref<Record<string, number>>({})
// Estado de aplicación de correcciones
const aplicandoCorrecciones = ref(false)
// Estado de maximización del modal
const isModalMaximized = ref(false)

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

/**
 * Extrae códigos de producto no encontrados en SAP del modal de error
 */
function extraerCodigosProductoNoEncontrados(): string[] {
  if (!uploadErrorInfo.value?.errors) return []
  
  const codigos: string[] = []
  
  for (const error of uploadErrorInfo.value.errors) {
    if (typeof error !== 'string' && error.producto && error.campo === 'Producto SAP') {
      const codigo = error.producto.trim()
      if (codigo && !codigos.includes(codigo)) {
        codigos.push(codigo)
      }
    }
  }
  
  return codigos
}

/**
 * Busca sugerencias SAP automáticamente para un código de producto
 */
async function buscarSugerenciasParaCodigo(codigo: string): Promise<void> {
  if (!codigo || sugerenciasEstado.value[codigo] === 'buscando') {
    return
  }
  
  sugerenciasEstado.value[codigo] = 'buscando'
  
  try {
    const resultado = await mba3ConsultasService.buscarSugerenciasSku(codigo, 100)
    
    if (resultado.status === 'success' && resultado.sugerencias && resultado.sugerencias.length > 0) {
      sugerenciasPorCodigo.value[codigo] = resultado.sugerencias
      sugerenciasEstado.value[codigo] = 'completado'
      inicializarLimiteSugerencias(codigo)
      console.log(`✅ [CargarPlantillasView] Sugerencias encontradas para ${codigo}:`, resultado.sugerencias.length)
    } else {
      sugerenciasPorCodigo.value[codigo] = []
      sugerenciasEstado.value[codigo] = 'completado'
      console.log(`ℹ️ [CargarPlantillasView] No se encontraron sugerencias para ${codigo}`)
    }
  } catch (error: any) {
    console.error(`❌ [CargarPlantillasView] Error al buscar sugerencias para ${codigo}:`, error)
    if (error.response?.status === 504 || error.message?.includes('timeout')) {
      sugerenciasEstado.value[codigo] = 'error'
    } else {
      sugerenciasPorCodigo.value[codigo] = []
      sugerenciasEstado.value[codigo] = 'completado'
    }
  }
}

/**
 * Busca sugerencias automáticamente para todos los códigos no encontrados
 */
async function buscarSugerenciasAutomaticas(): Promise<void> {
  if (!uploadErrorInfo.value || (!uploadErrorInfo.value.title?.includes('producto') && !uploadErrorInfo.value.title?.includes('SAP'))) {
    return
  }
  
  const codigos = extraerCodigosProductoNoEncontrados()
  
  if (codigos.length === 0) {
    return
  }
  
  console.log(`🔍 [CargarPlantillasView] Iniciando búsqueda automática de sugerencias para ${codigos.length} código(s):`, codigos)
  
  const promesas = codigos
    .filter(codigo => !sugerenciasPorCodigo.value[codigo])
    .map(codigo => buscarSugerenciasParaCodigo(codigo))
  
  await Promise.allSettled(promesas)
  
  console.log(`✅ [CargarPlantillasView] Búsqueda automática completada para ${codigos.length} código(s)`)
}

/**
 * Limpia las sugerencias cuando se cierra el modal
 */
function limpiarSugerencias(): void {
  sugerenciasPorCodigo.value = {}
  sugerenciasEstado.value = {}
  correccionesSeleccionadas.value = {}
  limiteSugerenciasMostradas.value = {}
  isModalMaximized.value = false
}

/**
 * Computed: Verifica si todos los códigos inválidos tienen una corrección seleccionada
 */
const todosCodigosTienenCorreccion = computed(() => {
  const codigosInvalidos = extraerCodigosProductoNoEncontrados()
  
  if (codigosInvalidos.length === 0) {
    return false
  }
  
  return codigosInvalidos.every(codigo => {
    const correccion = correccionesSeleccionadas.value[codigo]
    return correccion && correccion.trim().length > 0
  })
})

/**
 * Aplica las correcciones seleccionadas y reintenta el flujo de carga
 */
async function aplicarCorreccionesYContinuar(): Promise<void> {
  if (!todosCodigosTienenCorreccion.value) {
    toast.warning(
      'Correcciones incompletas',
      'Debes seleccionar una sugerencia para cada código inválido'
    )
    return
  }
  
  const archivo = archivoOriginalDelComposable.value
  
  if (!archivo) {
    toast.error(
      'Error',
      'No se encontró el archivo original. Por favor, vuelve a subir el archivo.'
    )
    return
  }
  
  aplicandoCorrecciones.value = true
  
  try {
    showErrorModal.value = false
    
    await reintentarConCorrecciones(
      archivo,
      correccionesSeleccionadas.value
    )
    
    limpiarSugerencias()
  } catch (error: any) {
    console.error('❌ Error al aplicar correcciones:', error)
    if (uploadErrorInfo.value) {
      showErrorModal.value = true
    }
    toast.error(
      'Error al aplicar correcciones',
      error.message || 'No se pudo procesar el archivo con las correcciones aplicadas'
    )
  } finally {
    aplicandoCorrecciones.value = false
  }
}

// ⭐ Función auxiliar para obtener clase CSS del badge de score
function getScoreBadgeClass(porcentaje: number): string {
  if (porcentaje >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (porcentaje >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

/**
 * Obtiene las sugerencias limitadas para un código específico
 */
function getSugerenciasLimitadas(codigo: string): SugerenciaSkuSap[] {
  const todasLasSugerencias = sugerenciasPorCodigo.value[codigo] || []
  const limite = limiteSugerenciasMostradas.value[codigo] || 5
  return todasLasSugerencias.slice(0, limite)
}

/**
 * Obtiene el límite actual de sugerencias para un código
 */
function getLimiteSugerencias(codigo: string): number {
  return limiteSugerenciasMostradas.value[codigo] || 5
}

/**
 * Establece el límite de sugerencias para un código
 */
function setLimiteSugerencias(codigo: string, limite: number): void {
  const todasLasSugerencias = sugerenciasPorCodigo.value[codigo] || []
  const maximo = todasLasSugerencias.length
  const limiteAjustado = Math.max(1, Math.min(limite, maximo))
  limiteSugerenciasMostradas.value[codigo] = limiteAjustado
}

/**
 * Inicializa el límite de sugerencias cuando se cargan nuevas sugerencias
 */
function inicializarLimiteSugerencias(codigo: string): void {
  const todasLasSugerencias = sugerenciasPorCodigo.value[codigo] || []
  if (!limiteSugerenciasMostradas.value[codigo]) {
    limiteSugerenciasMostradas.value[codigo] = Math.min(5, todasLasSugerencias.length)
  }
}

// ⭐ Watcher para detectar cuando se muestra el modal y buscar sugerencias automáticamente
watch(
  () => showErrorModal.value,
  async (isVisible) => {
    if (isVisible) {
      await nextTick()
      
      const esErrorSap = uploadErrorInfo.value?.title?.includes('SAP') || 
                         uploadErrorInfo.value?.title?.includes('no encontrados')
      
      if (esErrorSap && uploadErrorInfo.value?.errors) {
        await buscarSugerenciasAutomaticas()
      }
    } else {
      if (!aplicandoCorrecciones.value) {
        limpiarSugerencias()
      }
    }
  },
  { immediate: false }
)

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
  // Usar la validación del composable
  const validation = validateFile(file)
  if (!validation.valid) {
    toast.error('Error de validación', validation.error || 'Archivo no válido')
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

// ⭐ Usar uploadFile del composable que muestra modal de error
const handleUploadFile = async () => {
  if (!selectedFile.value) return
  
  try {
    await uploadFile(selectedFile.value)
    // Si fue exitoso, el composable maneja la redirección
    // Si hubo error, el composable muestra el modal automáticamente
    selectedFile.value = null
  } catch (e: any) {
    // El error ya fue manejado por el composable (modal de error)
    console.error('Error en handleUploadFile:', e)
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

