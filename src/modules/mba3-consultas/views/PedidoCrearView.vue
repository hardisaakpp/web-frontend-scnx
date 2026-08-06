<template>
  <!-- Overlay de bloqueo durante la carga de plantilla Excel con barra de progreso -->
  <Teleport to="body">
    <div 
      v-if="uploading"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
      @click.prevent
      @mousedown.prevent
      @mouseup.prevent
      @touchstart.prevent
      @touchmove.prevent
      @touchend.prevent
    >
      <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center transition-all duration-300 border border-white/30 dark:border-gray-600/30 relative overflow-hidden">
        <!-- Efecto de fondo animado -->
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-600/5 pointer-events-none"></div>
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
        
        <div class="relative z-10 flex flex-col items-center gap-5">
          <!-- Spinner con efecto de pulso -->
          <div class="relative">
            <svg class="animate-spin h-14 w-14 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="absolute inset-0 border-2 border-emerald-300/30 dark:border-emerald-500/30 rounded-full animate-ping"></div>
          </div>
          
          <div class="w-full">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Cargando Plantilla Excel</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">{{ uploadMessage || 'Preparando archivo...' }}</p>
            
            <!-- Barra de progreso -->
            <div class="w-full space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400 font-medium">
                  {{ uploadFase === 'upload' ? 'Subiendo archivo' : (uploadFase === 'processing' ? 'Procesando en servidor' : 'Preparando') }}
                </span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden shadow-inner">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                  :style="{ width: `${uploadProgress}%` }"
                >
                  <!-- Efecto shimmer sobre la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  <!-- Efecto de pulso en la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Indicadores de fase -->
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'upload' || uploadFase === 'processing' || uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Subir</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'processing' || uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Validar</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Guardar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6" :class="{ 'pointer-events-none opacity-75': uploading }">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Crear Pedido Manual</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">Crea un pedido manualmente ingresando los datos por pantalla</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToCargarPlantillas"
            :disabled="uploading"
            class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            title="Cargar plantilla Excel"
          >
            <svg v-if="!uploading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <LoadingSpinner v-else layout="inline" size="sm" color="current" aria-label="Cargando plantilla Excel" />
            {{ uploading ? 'Cargando...' : 'Cargar Plantilla Excel' }}
          </button>
          <button
            v-if="tieneDatosGuardados"
            @click="limpiarFormulario"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2"
            title="Limpiar datos guardados"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpiar
          </button>
        </div>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" autocomplete="on" class="space-y-6">
        <!-- Cabecera del Pedido -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información del Pedido</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Número de Pedido <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.cabecera.numero_pedido"
                type="text"
                name="numero_pedido"
                autocomplete="on"
                required
                maxlength="100"
                placeholder="Ej: P-12.48 - 12 - 2025"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Máx. 100 caracteres</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Proveedor
              </label>
              <input
                v-model="formData.cabecera.proveedor_nombre"
                type="text"
                name="proveedor_nombre"
                autocomplete="organization"
                placeholder="Nombre del proveedor"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Fecha de Pedido
              </label>
              <input
                v-model="formData.cabecera.fecha_pedido"
                type="date"
                name="fecha_pedido"
                autocomplete="on"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Fecha de Entrega
              </label>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="entrega-inmediato"
                    :checked="formData.cabecera.fecha_entrega === 'INMEDIATO'"
                    @change="handleInmediatoChange"
                    class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label for="entrega-inmediato" class="text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                    INMEDIATO
                  </label>
                </div>
                <input
                  v-if="formData.cabecera.fecha_entrega !== 'INMEDIATO'"
                  v-model="formData.cabecera.fecha_entrega"
                  type="date"
                  name="fecha_entrega"
                  autocomplete="on"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div
                  v-else
                  class="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-900 dark:text-indigo-100 font-medium"
                >
                  INMEDIATO
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Comprador (Nombre)
              </label>
              <input
                v-model="formData.cabecera.comprador_nombre"
                type="text"
                name="comprador_nombre"
                autocomplete="name"
                placeholder="Nombre del comprador"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Comprador (Código)
              </label>
              <input
                v-model="formData.cabecera.comprador_codigo"
                type="text"
                name="comprador_codigo"
                autocomplete="on"
                placeholder="Código del comprador"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Forma de Pago
              </label>
              <input
                v-model="formData.cabecera.forma_pago"
                type="text"
                name="forma_pago"
                autocomplete="on"
                placeholder="Forma de pago"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Origen de Traslado
              </label>
              <input
                v-model="formData.cabecera.origen_traslado"
                type="text"
                name="origen_traslado"
                autocomplete="on"
                placeholder="Origen de traslado"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Serie
              </label>
              <input
                v-model="formData.cabecera.serie"
                type="text"
                name="serie"
                autocomplete="on"
                placeholder="Serie del pedido"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Artículos -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Artículos del Pedido</h2>
            <button
              type="button"
              @click="agregarArticulo"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar Artículo
            </button>
          </div>

          <div v-if="formData.articulos.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No hay artículos agregados. Haz clic en "Agregar Artículo" para comenzar.</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(articulo, index) in formData.articulos"
              :key="index"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Artículo {{ Number(index) + 1 }}</h3>
                <button
                  type="button"
                  @click="eliminarArticulo(index)"
                  class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Código de Producto <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="articulo.codigo_producto"
                    type="text"
                    :name="`articulo_${index}_codigo_producto`"
                    autocomplete="on"
                    required
                    placeholder="Código del producto"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Costo Unitario <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="articulo.costo_unitario"
                    type="number"
                    :name="`articulo_${index}_costo_unitario`"
                    autocomplete="on"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Cantidad Total <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="articulo.cantidad_total"
                    type="number"
                    :name="`articulo_${index}_cantidad_total`"
                    autocomplete="on"
                    step="1"
                    min="1"
                    required
                    placeholder="0"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  v-model="articulo.comentario"
                  :name="`articulo_${index}_comentario`"
                  autocomplete="on"
                  rows="2"
                  placeholder="Comentario sobre el artículo"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                ></textarea>
              </div>

              <!-- Distribuciones por Tienda -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Distribución por Tiendas <span class="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    @click="agregarDistribucion(index)"
                    class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Tienda
                  </button>
                </div>

                <div v-if="articulo.distribuciones.length === 0" class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No hay distribuciones. Agrega al menos una tienda.
                </div>

                <div v-else class="space-y-2">
                  <div
                    v-for="(dist, distIndex) in articulo.distribuciones"
                    :key="distIndex"
                    class="flex items-center gap-2"
                  >
                    <div class="flex-1">
                      <input
                        v-model="dist.tienda_codigo"
                        type="text"
                        :name="`articulo_${index}_distribucion_${distIndex}_tienda_codigo`"
                        autocomplete="on"
                        required
                        placeholder="Código de tienda"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div class="w-32">
                      <input
                        v-model.number="dist.cantidad"
                        type="number"
                        :name="`articulo_${index}_distribucion_${distIndex}_cantidad`"
                        autocomplete="on"
                        step="1"
                        min="1"
                        required
                        placeholder="Cantidad"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      @click="eliminarDistribucion(index, distIndex)"
                      class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-2"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            @click="$router.push('/mba3-consultas/cargar-plantilla')"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="creating || !esFormularioValido"
            :class="[
              'px-4 py-2 rounded-lg transition-colors text-sm font-medium',
              creating || !esFormularioValido
                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            ]"
          >
            <span v-if="creating" class="flex items-center gap-2">
              <LoadingSpinner layout="inline" size="sm" color="current" aria-label="Creando pedido" />
              Creando...
            </span>
            <span v-else>Crear Pedido</span>
          </button>
        </div>
      </form>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Error al crear pedido</p>
            <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Modal para errores de validación del archivo -->
      <UploadErrorModal
        v-model="showErrorModal"
        :upload-error-info="uploadErrorInfo"
        :show-data-protection-message="true"
        @apply-corrections="aplicarCorreccionesYContinuar"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted, Teleport } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { CrearPedidoRequest, DistribucionTiendaRequest, ArticuloRequest, PedidoCompleto } from '../types'
import { useFileUpload } from '../composables/useFileUpload'
import type { CorreccionesPlantilla } from '../composables/useFileUpload'
import UploadErrorModal from '../components/UploadErrorModal.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const router = useRouter()
const toast = useToast()

const creating = ref(false)
const error = ref<string>('')

// ⭐ Inicializar composable de carga de archivos
const fileUploadComposable = useFileUpload({
  onUploadSuccess: async (numeroPedido) => {
    // Redirigir a la vista de detalle del pedido
    await router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
  }
})

const {
  uploading,
  showErrorModal,
  uploadErrorInfo,
  openFileSelector: goToCargarPlantillas,
  validateFile,
  reintentarConCorrecciones,
  archivoOriginal: archivoOriginalDelComposable,
  // ⭐ NUEVO: Variables de progreso de carga
  uploadProgress,
  uploadFase,
  uploadMessage
} = fileUploadComposable

/**
 * Aplica las correcciones seleccionadas (código y/o pack/pvp) y reintenta el flujo de carga
 */
async function aplicarCorreccionesYContinuar(correcciones: CorreccionesPlantilla): Promise<void> {
  const archivo = archivoOriginalDelComposable.value

  if (!archivo) {
    toast.error(
      'Error',
      'No se encontró el archivo original. Por favor, vuelve a subir el archivo.'
    )
    return
  }

  try {
    // Ocultar modal temporalmente mientras se procesa
    showErrorModal.value = false

    // Llamar a la función de reintento con correcciones
    await reintentarConCorrecciones(
      archivo,
      correcciones
    )
  } catch (error: any) {
    console.error('❌ Error al aplicar correcciones:', error)
    // Mostrar modal de nuevo con el nuevo error si existe
    if (uploadErrorInfo.value) {
      showErrorModal.value = true
    }
    toast.error(
      'Error al aplicar correcciones',
      error.message || 'No se pudo procesar el archivo con las correcciones aplicadas'
    )
  }
}

// Clave para guardar los datos del formulario en localStorage
const STORAGE_KEY = 'pedido-crear-form-data'

// Ref para rastrear si hay datos guardados (para reactividad)
const datosGuardadosExisten = ref(false)

const formData = ref<CrearPedidoRequest>({
  cabecera: {
    numero_pedido: '',
    fecha_pedido: null,
    fecha_entrega: null,
    proveedor_nombre: null,
    comprador_nombre: null,
    comprador_codigo: null,
    forma_pago: null,
    origen_traslado: null,
    serie: null,
    estado: null
  },
  articulos: []
})

// Función para verificar si hay datos guardados
function verificarDatosGuardados() {
  try {
    const datosGuardados = localStorage.getItem(STORAGE_KEY)
    if (datosGuardados) {
      const datos = JSON.parse(datosGuardados)
      datosGuardadosExisten.value = !!(datos.cabecera && Object.values(datos.cabecera).some(v => v !== null && v !== '')) ||
                                     (datos.articulos && datos.articulos.length > 0)
    } else {
      datosGuardadosExisten.value = false
    }
  } catch {
    datosGuardadosExisten.value = false
  }
}

// Función para guardar los datos del formulario en localStorage
function guardarDatosFormulario() {
  try {
    const datosParaGuardar = {
      cabecera: { ...formData.value.cabecera },
      articulos: formData.value.articulos.map(articulo => ({
        codigo_producto: articulo.codigo_producto,
        costo_unitario: articulo.costo_unitario,
        cantidad_total: articulo.cantidad_total,
        comentario: articulo.comentario,
        distribuciones: articulo.distribuciones.map(dist => ({
          tienda_codigo: dist.tienda_codigo,
          cantidad: dist.cantidad
        }))
      }))
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datosParaGuardar))
    verificarDatosGuardados()
  } catch (error) {
    console.warn('Error al guardar datos del formulario:', error)
  }
}

// Función para cargar los datos guardados desde localStorage
function cargarDatosGuardados() {
  try {
    const datosGuardados = localStorage.getItem(STORAGE_KEY)
    if (datosGuardados) {
      const datos = JSON.parse(datosGuardados)
      
      // Restaurar cabecera
      if (datos.cabecera) {
        formData.value.cabecera = {
          ...formData.value.cabecera,
          ...datos.cabecera
        }
      }
      
      // Restaurar artículos
      if (datos.articulos && Array.isArray(datos.articulos)) {
        formData.value.articulos = datos.articulos.map((articulo: any) => ({
          codigo_producto: articulo.codigo_producto || '',
          costo_unitario: articulo.costo_unitario || 0,
          cantidad_total: articulo.cantidad_total || 0,
          comentario: articulo.comentario || null,
          distribuciones: (articulo.distribuciones || []).map((dist: any) => ({
            tienda_codigo: dist.tienda_codigo || '',
            cantidad: dist.cantidad || 0
          }))
        }))
      }
      
      // Mostrar notificación si se cargaron datos
      if (datos.cabecera || (datos.articulos && datos.articulos.length > 0)) {
        toast.info('Datos restaurados', 'Se han cargado los últimos datos ingresados')
        verificarDatosGuardados()
      }
    }
  } catch (error) {
    console.warn('Error al cargar datos guardados del formulario:', error)
  }
}

// Función para limpiar los datos guardados
function limpiarDatosGuardados() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    datosGuardadosExisten.value = false
  } catch (error) {
    console.warn('Error al limpiar datos guardados:', error)
  }
}

// Computed para verificar si hay datos guardados (usa el ref reactivo)
const tieneDatosGuardados = computed(() => datosGuardadosExisten.value)

// Función para limpiar el formulario y los datos guardados
function limpiarFormulario() {
  formData.value = {
    cabecera: {
      numero_pedido: '',
      fecha_pedido: null,
      fecha_entrega: null,
      proveedor_nombre: null,
      comprador_nombre: null,
      comprador_codigo: null,
      forma_pago: null,
      origen_traslado: null,
      serie: null,
      estado: null
    },
    articulos: []
  }
  limpiarDatosGuardados()
  toast.success('Formulario limpiado', 'Los datos guardados han sido eliminados')
}

// Watcher para guardar automáticamente cuando cambien los datos
// Usamos un debounce simple para no guardar en cada tecla
let saveTimeout: ReturnType<typeof setTimeout> | null = null
watch(
  formData,
  () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      guardarDatosFormulario()
    }, 1000) // Guardar después de 1 segundo de inactividad
  },
  { deep: true }
)

// Función para cargar el último pedido y prellenar el formulario
async function cargarUltimoPedido() {
  try {
    const ultimoPedido: PedidoCompleto | null = await mba3ConsultasService.getUltimoPedido(false)
    
    if (!ultimoPedido || !ultimoPedido.cabecera) {
      return false
    }

    const cabecera = ultimoPedido.cabecera
    
    // Prellenar cabecera (solo campos que no sean null/undefined)
    if (cabecera.numero_pedido) {
      // No prellenar numero_pedido ya que debe ser único
    }
    if (cabecera.fecha_pedido) {
      formData.value.cabecera.fecha_pedido = cabecera.fecha_pedido
    }
    if (cabecera.fecha_entrega) {
      formData.value.cabecera.fecha_entrega = cabecera.fecha_entrega
    }
    if (cabecera.proveedor_nombre) {
      formData.value.cabecera.proveedor_nombre = cabecera.proveedor_nombre
    }
    if (cabecera.comprador_nombre) {
      formData.value.cabecera.comprador_nombre = cabecera.comprador_nombre
    }
    if (cabecera.comprador_codigo) {
      formData.value.cabecera.comprador_codigo = cabecera.comprador_codigo
    }
    if (cabecera.forma_pago) {
      formData.value.cabecera.forma_pago = cabecera.forma_pago
    }
    if (cabecera.origen_traslado) {
      formData.value.cabecera.origen_traslado = cabecera.origen_traslado
    }
    if (cabecera.serie) {
      formData.value.cabecera.serie = cabecera.serie
    }

    // Prellenar artículos
    if (ultimoPedido.detalles && ultimoPedido.detalles.length > 0) {
      formData.value.articulos = ultimoPedido.detalles.map(detalle => {
        // Calcular cantidad_total sumando todas las distribuciones
        const cantidadTotal = detalle.tiendas?.reduce((sum, tienda) => sum + (tienda.cantidad || 0), 0) || 0

        return {
          codigo_producto: detalle.codigo_interno || '',
          costo_unitario: detalle.costo_doc_sin_iva || 0,
          cantidad_total: cantidadTotal,
          comentario: detalle.comentario || null,
          distribuciones: (detalle.tiendas || []).map(tienda => ({
            tienda_codigo: tienda.codigo || '',
            cantidad: tienda.cantidad || 0
          }))
        }
      })
    }

    // Guardar los datos cargados en localStorage para persistencia
    guardarDatosFormulario()

    toast.success(
      'Último pedido cargado',
      `Se han precargado los datos del último pedido: ${cabecera.numero_pedido || 'N/A'}`
    )

    return true
  } catch (error: any) {
    // Si es 404 o no hay pedidos, no es un error crítico
    if (error.response?.status === 404 || error.message?.includes('404')) {
      return false
    }
    console.warn('Error al cargar último pedido:', error)
    return false
  }
}

// Cargar datos guardados al montar el componente
onMounted(async () => {
  verificarDatosGuardados()
  
  // Primero intentar cargar datos guardados en localStorage
  const hayDatosGuardados = datosGuardadosExisten.value
  cargarDatosGuardados()
  
  // Si no hay datos guardados, intentar cargar el último pedido
  if (!hayDatosGuardados) {
    await cargarUltimoPedido()
  }
})

// Validación del formulario
const esFormularioValido = computed(() => {
  // Validar cabecera
  if (!formData.value.cabecera.numero_pedido?.trim()) {
    return false
  }

  // Validar que haya al menos un artículo
  if (formData.value.articulos.length === 0) {
    return false
  }

  // Validar cada artículo
  for (const articulo of formData.value.articulos) {
    if (!articulo.codigo_producto?.trim()) return false
    if (!articulo.costo_unitario || articulo.costo_unitario <= 0) return false
    if (!articulo.cantidad_total || articulo.cantidad_total <= 0) return false
    if (articulo.distribuciones.length === 0) return false
    
    // Validar cada distribución
    for (const dist of articulo.distribuciones) {
      if (!dist.tienda_codigo?.trim()) return false
      if (!dist.cantidad || dist.cantidad <= 0) return false
    }
  }

  return true
})

function agregarArticulo() {
  formData.value.articulos.push({
    codigo_producto: '',
    costo_unitario: 0,
    cantidad_total: 0,
    distribuciones: [],
    comentario: null
  })
}

function eliminarArticulo(index: number) {
  formData.value.articulos.splice(index, 1)
}

function agregarDistribucion(articuloIndex: number) {
  formData.value.articulos[articuloIndex].distribuciones.push({
    tienda_codigo: '',
    cantidad: 0
  })
}

function eliminarDistribucion(articuloIndex: number, distribucionIndex: number) {
  formData.value.articulos[articuloIndex].distribuciones.splice(distribucionIndex, 1)
}

function handleInmediatoChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    formData.value.cabecera.fecha_entrega = 'INMEDIATO'
  } else {
    formData.value.cabecera.fecha_entrega = null
  }
}

async function handleSubmit() {
  if (!esFormularioValido.value) {
    toast.error('Error de validación', 'Por favor completa todos los campos requeridos')
    return
  }

  const numeroPedidoVal = formData.value.cabecera.numero_pedido!.trim()
  if (numeroPedidoVal.length > 100) {
    toast.error(
      'Longitud de campo excedida',
      'El campo "Número de pedido" no puede superar los 100 caracteres. Por favor, acorte el texto e intente de nuevo.'
    )
    return
  }

  creating.value = true
  error.value = ''

  try {
    // Transformar estructura anidada del formulario a estructura plana que espera el backend
    // El backend espera campos de cabecera directamente en el body (no dentro de objeto "cabecera")
    // y usa codigo_interno y costo_doc_sin_iva en lugar de codigo_producto y costo_unitario
    const dataToSend: any = {
      // Campos de cabecera directamente en el body (estructura plana)
      numero_pedido: formData.value.cabecera.numero_pedido!.trim(),
      fecha_pedido: formData.value.cabecera.fecha_pedido || null,
      fecha_entrega: formData.value.cabecera.fecha_entrega || null,
      proveedor_nombre: formData.value.cabecera.proveedor_nombre?.trim() || null,
      comprador_nombre: formData.value.cabecera.comprador_nombre?.trim() || null,
      comprador_codigo: formData.value.cabecera.comprador_codigo?.trim() || null,
      forma_pago: formData.value.cabecera.forma_pago?.trim() || null,
      origen_traslado: formData.value.cabecera.origen_traslado?.trim() || null,
      serie: formData.value.cabecera.serie?.trim() || null,
      // Artículos con nombres de campo correctos para el backend
      articulos: formData.value.articulos.map(articulo => ({
        codigo_interno: articulo.codigo_producto.trim(),  // ✅ Backend espera codigo_interno
        costo_doc_sin_iva: articulo.costo_unitario,        // ✅ Backend espera costo_doc_sin_iva
        cantidad_total: articulo.cantidad_total,           // ✅ Incluir cantidad_total
        comentario: articulo.comentario?.trim() || null,   // ✅ Incluir comentario si existe
        distribuciones: articulo.distribuciones.map(dist => ({
          tienda_codigo: dist.tienda_codigo.trim(),
          cantidad: dist.cantidad
        }))
      }))
    }

    // Log para debugging - verificar qué se está enviando
    if (import.meta.env.DEV) console.log('📤 [handleSubmit] Datos enviados al backend:', JSON.stringify(dataToSend, null, 2))

    const response = await mba3ConsultasService.crearPedidoManual(dataToSend as CrearPedidoRequest)

    // Log para debugging
    if (import.meta.env.DEV) console.log('✅ [handleSubmit] Respuesta del backend:', response)

    // Manejar respuesta similar a la carga de plantillas Excel
    if (response.status === 'validation_error') {
      // Construir mensaje de error más descriptivo
      let errorMessage = response.message || 'Error de validación al crear el pedido'
      
      // Si hay errores específicos en el array, agregarlos al mensaje
      if (response.errores && Array.isArray(response.errores) && response.errores.length > 0) {
        errorMessage = response.errores.join('\n')
      }
      
      // Si hay información de validación SAP, agregar detalles
      const erroresSap: string[] = []
      
      if (response.validacion?.productos_sap) {
        const sapValidation = response.validacion.productos_sap
        if (sapValidation.no_encontrados && sapValidation.no_encontrados.length > 0) {
          erroresSap.push(`Productos no válidos en SAP: ${sapValidation.no_encontrados.join(', ')}`)
        }
      }
      
      if (response.validacion?.tiendas_sap) {
        const tiendasValidation = response.validacion.tiendas_sap
        if (tiendasValidation.no_encontradas && tiendasValidation.no_encontradas.length > 0) {
          erroresSap.push(`Tiendas no válidas en SAP: ${tiendasValidation.no_encontradas.join(', ')}`)
        }
      }
      
      if (response.validacion?.bodegas_sap) {
        const bodegasValidation = response.validacion.bodegas_sap
        if (bodegasValidation.no_encontradas && bodegasValidation.no_encontradas.length > 0) {
          erroresSap.push(`Bodegas no válidas en SAP: ${bodegasValidation.no_encontradas.join(', ')}`)
        }
      }
      
      if (erroresSap.length > 0) {
        errorMessage = erroresSap.join('\n') + '\n\nPor favor, verifica los códigos e intenta nuevamente.'
      }
      
      error.value = errorMessage
      toast.error('Error de validación', errorMessage)
      return
    }

    // Si la creación fue exitosa (cualquier respuesta que no sea validation_error)
    // Obtener numero_pedido de la respuesta
    let numeroPedido: string | undefined = response.numero_pedido

    // Si no viene en la respuesta, intentar obtenerlo del pedido creado usando pedido_id
    if (!numeroPedido && response.pedido_id) {
      try {
        const pedidoCompleto = await mba3ConsultasService.getPedido(response.pedido_id, false)
        numeroPedido = pedidoCompleto.cabecera.numero_pedido || undefined
      } catch (e) {
        console.warn('⚠️ [handleSubmit] No se pudo obtener el numero_pedido del pedido creado:', e)
      }
    }

    // Si tenemos numero_pedido, redirigir a la vista de detalle
    if (numeroPedido) {
      const mensajeDetalle = `Número de pedido: ${numeroPedido}${response.articulos_cargados ? `\nArtículos: ${response.articulos_cargados}` : ''}${response.distribuciones_cargadas ? `\nDistribuciones: ${response.distribuciones_cargadas}` : ''}`
      toast.success('Pedido creado exitosamente', mensajeDetalle)
      // Limpiar datos guardados después de crear exitosamente
      limpiarDatosGuardados()
      router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
      return
    }

    // Si no tenemos numero_pedido pero tenemos pedido_id, usar pedido_id
    if (response.pedido_id) {
      toast.success('Pedido creado exitosamente', 'El pedido ha sido creado correctamente')
      // Limpiar datos guardados después de crear exitosamente
      limpiarDatosGuardados()
      router.push(`/mba3-consultas/pedidos/${encodeURIComponent(response.pedido_id)}`)
      return
    }

    // Si llegamos aquí, no tenemos forma de identificar el pedido
    console.warn('⚠️ [handleSubmit] Respuesta exitosa pero sin numero_pedido ni pedido_id:', response)
    error.value = response.message || 'El pedido se creó pero no se pudo obtener su número'
    toast.warning('Pedido creado', 'El pedido se creó pero no se pudo obtener su información completa')
  } catch (e: any) {
    console.error('Error al crear pedido:', e)
    const errorMessage = e.message || e.response?.data?.message || e.response?.data?.error || e.response?.data?.detail || 'Error desconocido al crear el pedido'
    const errorStr = typeof errorMessage === 'string' ? errorMessage : String(errorMessage)
    const lowerErr = errorStr.toLowerCase()

    // Detectar error de longitud (numero_pedido o mensaje > 100 caracteres)
    const isLongitudError = (lowerErr.includes('100') && (lowerErr.includes('caracteres') || lowerErr.includes('carácter'))) &&
      (lowerErr.includes('numero_pedido') || lowerErr.includes('número de pedido') || lowerErr.includes('mensaje') || lowerErr.includes('campo'))
    const erroresArray = e.response?.data?.errores
    const hasErroresLongitud = Array.isArray(erroresArray) && erroresArray.some((err: any) => {
      const m = (err?.mensaje ?? err).toString().toLowerCase()
      const c = (err?.campo ?? '').toString().toLowerCase()
      return (m.includes('100') && m.includes('caracteres')) && (c.includes('numero_pedido') || c.includes('mensaje'))
    })

    if (isLongitudError || hasErroresLongitud) {
      error.value = 'El campo "Número de pedido" (y/o "Mensaje" si aplica) no puede superar los 100 caracteres. Por favor, acorte el texto e intente de nuevo.'
      toast.error('Longitud de campo excedida', error.value)
      return
    }

    // Detectar específicamente el error de número de pedido duplicado
    const isDuplicateError = lowerErr.includes('número de pedido') && lowerErr.includes('ya existe') ||
                           lowerErr.includes('numero de pedido') && lowerErr.includes('ya existe') ||
                           lowerErr.includes('duplicado') ||
                           e.response?.data?.error_tipo === 'numero_pedido_duplicado'
    
    if (isDuplicateError) {
      // Extraer el número de pedido del mensaje si está disponible
      const numeroPedidoMatch = errorStr.match(/['"]([^'"]+)['"]/)?.[1] || 
                                errorStr.match(/número de pedido ['"]([^'"]+)['"]/i)?.[1] ||
                                errorStr.match(/numero de pedido ['"]([^'"]+)['"]/i)?.[1]
      
      if (numeroPedidoMatch) {
        error.value = `El número de pedido "${numeroPedidoMatch}" ya existe en el sistema. No es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido e intenta con un número diferente.`
        toast.error('Número de pedido duplicado', error.value)
      } else {
        error.value = 'El número de pedido que intentaste utilizar ya existe en el sistema. No es posible cargar un pedido con un número de pedido duplicado. Por favor, verifica el número de pedido e intenta con un número diferente.'
        toast.error('Número de pedido duplicado', error.value)
      }
    } else {
      // Manejar otros errores normalmente
      error.value = errorStr
      toast.error('Error al crear pedido', error.value)
    }
  } finally {
    creating.value = false
  }
}
</script>
