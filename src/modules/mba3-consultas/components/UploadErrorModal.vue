<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
    @click.self="closeModal"
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
            @click="closeModal"
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
          <!-- Mensaje de protección de datos (opcional) -->
          <div v-if="showDataProtectionMessage" class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-300">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-semibold text-blue-900 dark:text-blue-200">Los datos actuales no han sido modificados</p>
                <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">La información del pedido que ves en pantalla sigue siendo válida y no se ha alterado.</p>
              </div>
            </div>
          </div>

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
                      
                      <!-- ⭐ Información de MBA3 (si está disponible del backend) -->
                      <div v-if="error.campo === 'Producto SAP' && error.producto && getInfoMba3(error.producto)" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <h6 class="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Resultado en MBA3
                        </h6>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span class="font-medium text-gray-600 dark:text-gray-300">Código:</span>
                            <p class="text-gray-900 dark:text-gray-100 font-mono">{{ getInfoMba3(error.producto)?.codigo || '-' }}</p>
                          </div>
                          <div>
                            <span class="font-medium text-gray-600 dark:text-gray-300">Nombre:</span>
                            <p class="text-gray-900 dark:text-gray-100">{{ getInfoMba3(error.producto)?.nombre || '-' }}</p>
                          </div>
                          <div v-if="getInfoMba3(error.producto)?.corp">
                            <span class="font-medium text-gray-600 dark:text-gray-300">Corp:</span>
                            <p class="text-gray-900 dark:text-gray-100">{{ getInfoMba3(error.producto)?.corp }}</p>
                          </div>
                          <div v-if="getInfoMba3(error.producto)?.grupo_prenda">
                            <span class="font-medium text-gray-600 dark:text-gray-300">Grupo:</span>
                            <p class="text-gray-900 dark:text-gray-100">{{ getInfoMba3(error.producto)?.grupo_prenda }}</p>
                          </div>
                          <div v-if="getInfoMba3(error.producto)?.descontinuado !== undefined">
                            <span class="font-medium text-gray-600 dark:text-gray-300">Descontinuado:</span>
                            <span
                              :class="getInfoMba3(error.producto)?.descontinuado ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
                              class="px-2 py-0.5 rounded-full text-xs font-semibold"
                            >
                              {{ getInfoMba3(error.producto)?.descontinuado ? 'Sí' : 'No' }}
                            </span>
                          </div>
                          <div v-if="getInfoMba3(error.producto)?.inactive !== undefined">
                            <span class="font-medium text-gray-600 dark:text-gray-300">Inactivo:</span>
                            <span
                              :class="getInfoMba3(error.producto)?.inactive ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
                              class="px-2 py-0.5 rounded-full text-xs font-semibold"
                            >
                              {{ getInfoMba3(error.producto)?.inactive ? 'Sí' : 'No' }}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Sugerencias SAP automáticas (solo para códigos de producto no encontrados) -->
                      <div v-if="error.campo === 'Producto SAP' && error.producto" class="mt-4">
                        <!-- Estado de carga o sin estado (inicial) -->
                        <div v-if="!sugerenciasEstado[error.producto] || sugerenciasEstado[error.producto] === 'buscando' || sugerenciasEstado[error.producto] === 'idle'" class="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
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
                              Sugerencias similares en SAP ({{ sugerenciasPorCodigo[error.producto].length }})
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
                                    {{ sugerencia.score_porcentaje }}% de coincidencia
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
                                    Motivos de la sugerencia ({{ sugerencia.motivos.length }})
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
                @click="handleApplyCorrections"
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
                @click="closeModal"
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
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { SugerenciaSkuSap, SugerenciasSkuResponse } from '../types'
import { formatError } from '../utils/formatters'
import type { UploadErrorInfo } from '../composables/useFileUpload'

interface Props {
  modelValue: boolean
  uploadErrorInfo: UploadErrorInfo | null
  showDataProtectionMessage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDataProtectionMessage: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply-corrections': [correcciones: Record<string, string>]
}>()

// Estado interno del modal
const isModalMaximized = ref(false)

// ⭐ Funcionalidad de sugerencias SAP
const sugerenciasPorCodigo = ref<Record<string, SugerenciaSkuSap[]>>({})
const sugerenciasEstado = ref<Record<string, 'idle' | 'buscando' | 'completado' | 'error'>>({})
const correccionesSeleccionadas = ref<Record<string, string>>({})
const limiteSugerenciasMostradas = ref<Record<string, number>>({})
const aplicandoCorrecciones = ref(false)

/**
 * Cierra el modal
 */
function closeModal(): void {
  emit('update:modelValue', false)
  limpiarSugerencias()
}

/**
 * Extrae códigos de producto no encontrados en SAP del modal de error
 */
function extraerCodigosProductoNoEncontrados(): string[] {
  if (!props.uploadErrorInfo?.errors) return []
  
  const codigos: string[] = []
  
  for (const error of props.uploadErrorInfo.errors) {
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
 * Obtiene información de MBA3 para un código desde el backend
 */
function getInfoMba3(codigo: string) {
  if (!props.uploadErrorInfo?.validacion_sap?.detalle_validacion) {
    return null
  }
  
  const detalle = props.uploadErrorInfo.validacion_sap.detalle_validacion[codigo]
  return detalle?.mba3 || null
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
    const resultado: SugerenciasSkuResponse = await mba3ConsultasService.buscarSugerenciasSku(codigo, 100)
    
    if (resultado.status === 'success' && resultado.sugerencias && resultado.sugerencias.length > 0) {
      sugerenciasPorCodigo.value[codigo] = resultado.sugerencias
      sugerenciasEstado.value[codigo] = 'completado'
      inicializarLimiteSugerencias(codigo)
    } else {
      sugerenciasPorCodigo.value[codigo] = []
      sugerenciasEstado.value[codigo] = 'completado'
    }
  } catch (error: any) {
    console.error(`❌ [UploadErrorModal] Error al buscar sugerencias para ${codigo}:`, error)
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
 * ⭐ MEJORADO: Primero intenta usar información del backend (MBA3 + sugerencias)
 */
async function buscarSugerenciasAutomaticas(): Promise<void> {
  if (!props.uploadErrorInfo || (!props.uploadErrorInfo.title?.includes('producto') && !props.uploadErrorInfo.title?.includes('SAP'))) {
    return
  }
  
  const codigos = extraerCodigosProductoNoEncontrados()
  
  if (codigos.length === 0) {
    return
  }
  
  // ⭐ NUEVO: Primero intentar usar información del backend
  const validacionSap = props.uploadErrorInfo.validacion_sap
  const detalleValidacion = validacionSap?.detalle_validacion || {}
  
  let codigosSinInfoBackend: string[] = []
  
  // Procesar información del backend para cada código
  for (const codigo of codigos) {
    const detalle = detalleValidacion[codigo]
    
    // ⭐ Inicializar estado como 'buscando' primero para mostrar indicador de carga
    if (!sugerenciasEstado.value[codigo] || sugerenciasEstado.value[codigo] === 'idle') {
      sugerenciasEstado.value[codigo] = 'buscando'
    }
    
    // Verificar si hay sugerencias del backend
    if (detalle && 'sugerencias_sap' in detalle) {
      if (Array.isArray(detalle.sugerencias_sap) && detalle.sugerencias_sap.length > 0) {
        // ⭐ Usar sugerencias del backend (ya están formateadas)
        sugerenciasPorCodigo.value[codigo] = detalle.sugerencias_sap.map(s => ({
          codigo: s.codigo,
          nombre: s.nombre,
          pack: s.pack || '',
          group_code: s.group_code,
          group_name: s.group_name || '',
          estado: (s.estado === 'activo' || s.estado === 'inactivo') ? s.estado : 'inactivo' as 'activo' | 'inactivo',
          score: s.score,
          score_porcentaje: s.score_porcentaje,
          motivos: s.motivos || []
        }))
        sugerenciasEstado.value[codigo] = 'completado'
        inicializarLimiteSugerencias(codigo)
      } else if (Array.isArray(detalle.sugerencias_sap) && detalle.sugerencias_sap.length === 0) {
        // Backend retornó array vacío - no hay sugerencias
        sugerenciasPorCodigo.value[codigo] = []
        sugerenciasEstado.value[codigo] = 'completado'
      } else {
        // Campo sugerencias_sap existe pero no es un array válido
        codigosSinInfoBackend.push(codigo)
      }
    } else {
      // No hay campo sugerencias_sap en el detalle, agregar a lista para búsqueda
      codigosSinInfoBackend.push(codigo)
    }
  }
  
  // Solo buscar sugerencias para códigos que no tienen información del backend
  if (codigosSinInfoBackend.length > 0) {
    const promesas = codigosSinInfoBackend
      .filter(codigo => !sugerenciasPorCodigo.value[codigo])
      .map(codigo => buscarSugerenciasParaCodigo(codigo))
    
    await Promise.allSettled(promesas)
  }
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
 * Maneja la aplicación de correcciones
 */
async function handleApplyCorrections(): Promise<void> {
  if (!todosCodigosTienenCorreccion.value) {
    return
  }
  
  aplicandoCorrecciones.value = true
  
  try {
    emit('apply-corrections', { ...correccionesSeleccionadas.value })
  } finally {
    aplicandoCorrecciones.value = false
  }
}

/**
 * Función auxiliar para obtener clase CSS del badge de score
 */
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
  () => props.modelValue,
  async (isVisible) => {
    if (isVisible) {
      // Esperar a que el DOM se actualice y el modal esté completamente renderizado
      await nextTick()
      // Pequeño delay adicional para asegurar que el modal esté completamente visible
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const esErrorSap = props.uploadErrorInfo?.title?.includes('SAP') || 
                         props.uploadErrorInfo?.title?.includes('no encontrados') ||
                         props.uploadErrorInfo?.title?.includes('producto')
      
      if (esErrorSap && props.uploadErrorInfo?.errors) {
        console.log('🔍 [UploadErrorModal] Modal de error abierto, iniciando búsqueda automática de sugerencias...')
        console.log('📋 [UploadErrorModal] uploadErrorInfo:', {
          title: props.uploadErrorInfo.title,
          tieneValidacionSap: !!props.uploadErrorInfo.validacion_sap,
          detalleValidacion: props.uploadErrorInfo.validacion_sap?.detalle_validacion,
          codigosEnDetalle: props.uploadErrorInfo.validacion_sap?.detalle_validacion ? Object.keys(props.uploadErrorInfo.validacion_sap.detalle_validacion) : []
        })
        await buscarSugerenciasAutomaticas()
      }
    } else {
      limpiarSugerencias()
    }
  }
)

// ⭐ Watcher adicional para cuando cambia uploadErrorInfo (por si el modal ya está abierto)
watch(
  () => props.uploadErrorInfo,
  async (newErrorInfo) => {
    if (props.modelValue && newErrorInfo) {
      const esErrorSap = newErrorInfo.title?.includes('SAP') || 
                         newErrorInfo.title?.includes('no encontrados') ||
                         newErrorInfo.title?.includes('producto')
      
      if (esErrorSap && newErrorInfo.errors) {
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))
        await buscarSugerenciasAutomaticas()
      }
    }
  },
  { deep: true }
)

// Limpiar al desmontar
onUnmounted(() => {
  limpiarSugerencias()
})
</script>
