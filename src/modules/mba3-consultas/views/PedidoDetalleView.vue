<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header con botones de acción -->
      <PedidoHeaderActions
        v-model:pedido-id-input="pedidoIdInput"
        v-model:show-search-help="showSearchHelp"
        :titulo-interfaz="tituloInterfaz"
        :pedido-input-ref="pedidoInputRef as any"
        :is-valid-pedido="isValidPedido"
        :uploading="uploading"
        :loading="loading"
        :generando-o-c="generandoOC"
        :confirmando="confirmando"
        :can-generar-o-c="canGenerarOC"
        :es-modo-mabel-trading="esModoMabelTrading"
        :pedido="pedido"
        @cargar-plantillas="goToCargarPlantillas"
        @generar-oc="handleGenerarOCDesdePedido"
        @confirmar="handleConfirmar"
        @go-to-pedido="goToPedido"
        @search-blur="handleSearchBlur"
        @descargar-plano-mba="handleDescargarPlanoMba"
      />

      <!-- Loading state -->
      <div v-if="loading && !pedido" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando pedido...</p>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 transition-colors duration-300">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-900 dark:text-red-200">Error al cargar el pedido</p>
            <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Contenido del pedido -->
      <div v-if="pedido && !loading">
        <!-- Información de la cabecera -->
        <PedidoCabecera
          :pedido="pedido"
          :copy-feedback="copyFeedback"
          :editable="!esModoMabelTrading"
          @copy-to-clipboard="copyToClipboard"
          @update-fecha-pedido="handleUpdateFechaPedido"
          @update-fecha-entrega="handleUpdateFechaEntrega"
          @update-estado="handleUpdateEstado"
        />

        <!-- ⭐ FASE 4: Ajuste y Redistribución a Tiendas -->
        <RedistribucionTiendas
          :pedido="pedido"
          :es-modo-mabel-trading="esModoMabelTrading"
          :productos-redistribucion="redistribucion.productosRedistribucion"
          :productos-expandidos="redistribucion.productosExpandidos"
          :guardando-redistribucion="redistribucion.guardandoRedistribucion"
          :confirmando-redistribucion="redistribucion.confirmandoRedistribucion"
          :columnas-modificadas="columnasModificadas as unknown as Ref<Set<string>>"
          @toggle-expandir-producto="toggleExpandirProducto"
          @actualizar-cantidad-tienda="actualizarCantidadTienda"
          @validar-y-corregir-cantidad="validarYCorregirCantidad"
          @distribuir-proporcionalmente="distribuirProporcionalmente"
          @copiar-distribucion-original="copiarDistribucionOriginal"
          @resetear-distribucion="resetearDistribucion"
          @guardar-borrador="guardarBorradorRedistribucion"
          @confirmar-redistribucion="confirmarRedistribucion"
        />

        <!-- Detalles del pedido (tabla de productos) -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Productos del Pedido</h2>
            <div class="relative">
              <button
                @click="showColumnSelector = !showColumnSelector"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Columnas
              </button>
              
              <!-- Dropdown de selección de columnas -->
              <div
                v-if="showColumnSelector"
                @click.stop
                class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3"
              >
                <div class="flex items-center justify-between mb-2 px-2">
                  <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Seleccionar columnas</div>
                  <div v-if="isSyncing" class="flex items-center gap-1">
                    <svg class="animate-spin w-3 h-3 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-xs text-indigo-600 dark:text-indigo-400">Guardando...</span>
                  </div>
                </div>
                <div class="space-y-1 max-h-80 overflow-y-auto">
                  <label
                    v-for="column in availableColumnsWithVisibility"
                    :key="column.key"
                    :class="[
                      'flex items-center gap-2 px-2 py-2 rounded transition-colors',
                      column.fixed 
                        ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                    ]"
                  >
                    <input
                      type="checkbox"
                      :checked="column.visible"
                      :disabled="column.fixed"
                      @change="!column.fixed && toggleColumnVisibility(column.key)"
                      class="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ column.label }}
                      <span v-if="column.fixed" class="text-xs text-gray-500 dark:text-gray-500 ml-1">(fija)</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    v-for="(column, index) in orderedVisibleColumns"
                    :key="column.key"
                    :draggable="!column.fixed"
                    @dragstart="!column.fixed && handleDragStart(index)"
                    @dragover.prevent="!column.fixed && handleDragOver(index)"
                    @drop.prevent="!column.fixed && handleDrop(index)"
                    @dragend="!column.fixed && handleDragEnd()"
                    :class="[
                      'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none',
                      column.fixed ? 'cursor-default' : 'cursor-move',
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                      draggedColumnIndex === index ? 'opacity-50 bg-indigo-100 dark:bg-indigo-900' : '',
                      dragOverColumnIndex === index && draggedColumnIndex !== null ? 'border-l-4 border-indigo-500' : ''
                    ]"
                  >
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr 
                  v-for="(detalle, detalleIndex) in pedido.detalles" 
                  :key="detalle.pedido_detalle_id"
                >
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-4 text-sm',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : column.align === 'center' ? 'text-center whitespace-nowrap' : '',
                      // ⭐ Resaltado persistente para columnas modificadas (no aplicar a columna numero)
                      isColumnaModificada(detalle.pedido_detalle_id, column.key) && column.key !== 'numero'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500 dark:border-amber-400' 
                        : '',
                      column.key === 'numero' ? 'font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50' :
                      column.key === 'codigo_interno' ? 'font-medium text-gray-900 dark:text-white whitespace-nowrap' :
                      column.key === 'total' ? 'font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors' :
                      column.key === 'descripcion_sap' ? 'text-gray-900 dark:text-white' :
                      column.key === 'costo_doc_sin_iva' ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors' :
                      column.key === 'comentario' ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors' :
                      'text-gray-500 dark:text-gray-400 whitespace-nowrap'
                    ]"
                    :data-column-key="column.key"
                    :data-detalle-id="detalle.pedido_detalle_id"
                    @dblclick="(column.key === 'costo_doc_sin_iva' || column.key === 'total' || column.key === 'comentario') && iniciarEdicion(detalle, column.key === 'costo_doc_sin_iva' ? 'costo' : column.key === 'total' ? 'total' : 'comentario')"
                  >
                    <!-- Mostrar input si estamos editando esta celda -->
                    <template v-if="editingCell?.detalleId === detalle.pedido_detalle_id && ((column.key === 'costo_doc_sin_iva' && editingCell.fieldType === 'costo') || (column.key === 'total' && editingCell.fieldType === 'total') || (column.key === 'comentario' && editingCell.fieldType === 'comentario'))">
                      <input
                        v-if="column.key !== 'comentario'"
                        :data-editing-cell="detalle.pedido_detalle_id"
                        v-model="editingCell.value"
                        type="number"
                        :step="editingCell.fieldType === 'total' ? '1' : '0.01'"
                        min="0"
                        @blur="guardarEdicion"
                        @keydown="manejarTeclasEdicion"
                        @click.stop
                        class="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <textarea
                        v-else
                        :data-editing-cell="detalle.pedido_detalle_id"
                        v-model="editingCell.value"
                        @blur="guardarEdicion"
                        @keydown="manejarTeclasEdicion"
                        @click.stop
                        rows="2"
                        placeholder="Ingrese un comentario..."
                        class="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                      />
                    </template>
                    <!-- Mostrar valor normal si no estamos editando -->
                    <template v-else>
                      <span v-if="column.key === 'comentario' && detalle.comentario" class="text-gray-700 dark:text-gray-300">{{ detalle.comentario }}</span>
                      <span v-else-if="column.key === 'comentario' && !detalle.comentario" class="text-gray-400 dark:text-gray-500 italic text-xs">Sin comentario</span>
                      <template v-else>{{ formatColumnValue(detalle, column, detalleIndex) }}</template>
                    </template>
                  </td>
                </tr>
                <!-- Fila de totales -->
                <tr v-if="pedido && pedido.detalles && pedido.detalles.length > 0" class="bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-3 text-sm',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : column.align === 'center' ? 'text-center whitespace-nowrap' : 'text-left',
                      'text-gray-900 dark:text-white'
                    ]"
                  >
                    <template v-if="column.key === 'numero'">
                      <!-- Dejar vacío para la columna de numeración -->
                    </template>
                    <template v-else-if="column.key === 'costo_doc_sin_iva'">
                      {{ formatCurrency(totalesCostoUnitario) }}
                    </template>
                    <template v-else-if="column.key === 'subtotal'">
                      {{ formatNumber(totalesSubtotal) }}
                    </template>
                    <template v-else-if="column.key === 'bodega'">
                      {{ formatNumber(totalesBodega) }}
                    </template>
                    <template v-else-if="column.key === 'total'">
                      {{ formatNumber(totalesTotal) }}
                    </template>
                    <template v-else-if="column.key === 'codigo_interno'">
                      <span class="text-gray-600 dark:text-gray-400 font-medium">TOTALES</span>
                    </template>
                    <template v-else>
                      <!-- Dejar vacío para otras columnas -->
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para errores de validación del archivo -->
    <div v-if="showErrorModal" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4" @click.self="showErrorModal = false">
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
            <!-- Mensaje de protección de datos -->
            <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-300">
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted, watch, nextTick, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { PedidoCompleto, ReporteDiferenciasResponse, UploadPlantillaResponse, SugerenciaSkuSap } from '../types'
// Utilidades extraídas
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPorcentaje,
  formatEstadoPedido,
  formatError,
  formatColumnValue,
  getTotalCantidad,
  type ColumnConfig
} from '../utils/formatters'
import {
  getEstadoBadgeClass,
  getEstadoPedidoBadgeClass,
  getCantidadClass,
  getPrecioClass,
  getDiferenciaClass,
  getPorcentajeClass,
  getPorcentajeDiferenciaClass
} from '../utils/styleHelpers'
import {
  getProgresoPorcentaje,
  getProgresoBarClass,
  getProgresoTextClass,
  getMensajeValidacionRedistribucion,
  type ProductoRedistribucion,
  type DistribucionTiendaEditada
} from '../utils/redistribucionHelpers'
// Composables
import { useFileUpload } from '../composables/useFileUpload'
import { useColumnManagement } from '../composables/useColumnManagement'
import { usePedidoDetalle } from '../composables/usePedidoDetalle'
import { useRedistribucion } from '../composables/useRedistribucion'
// Componentes
import PedidoHeaderActions from '../components/PedidoHeaderActions.vue'
import PedidoCabecera from '../components/PedidoCabecera.vue'
import RedistribucionTiendas from '../components/RedistribucionTiendas.vue'

// Constantes de configuración
const SCROLL_DELAY_MS = 100
const ROUTE_REDIRECT_DELAY_MS = 1500
const SEARCH_HELP_BLUR_DELAY_MS = 200
const COPY_FEEDBACK_DURATION_MS = 2000

const route = useRoute()
const router = useRouter()
const toast = useToast()

const pedido = ref<PedidoCompleto | null>(null)

// ⭐ Set para rastrear columnas modificadas (formato: "detalleId:columnKey")
const columnasModificadas = ref<Set<string>>(new Set())

// Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)
const confirmando = ref(false)
const draggedColumnIndex = ref<number | null>(null)
const dragOverColumnIndex = ref<number | null>(null)

// La interfaz EditingCell ahora está importada desde composables/useColumnManagement

// ⭐ Funciones para persistencia en sessionStorage (fallback/migración)
// ⚠️ NOTA: El backend es la fuente principal de verdad. sessionStorage solo se usa como fallback.
function getStorageKey(): string {
  return `pedido_columnas_modificadas_${numeroPedido.value}`
}

function guardarColumnasModificadasEnStorage() {
  if (!numeroPedido.value) return
  
  try {
    const storageKey = getStorageKey()
    const columnasArray = Array.from(columnasModificadas.value)
    sessionStorage.setItem(storageKey, JSON.stringify(columnasArray))
  } catch (e) {
    console.warn('Error al guardar columnas modificadas en sessionStorage (fallback):', e)
  }
}

function cargarColumnasModificadasDesdeStorage() {
  if (!numeroPedido.value) return
  
  // Solo cargar desde sessionStorage si no hay modificaciones ya cargadas desde el backend
  // Esto permite migración gradual de datos
  if (columnasModificadas.value.size > 0) {
    console.log('ℹ️ [PedidoDetalleView] Modificaciones ya cargadas desde backend, omitiendo sessionStorage')
    return
  }
  
  try {
    const storageKey = getStorageKey()
    const stored = sessionStorage.getItem(storageKey)
    
    if (stored) {
      const columnasArray = JSON.parse(stored) as string[]
      // Limpiar antes de cargar desde storage
      columnasModificadas.value.clear()
      columnasModificadas.value = new Set(columnasArray)
      console.log(`ℹ️ [PedidoDetalleView] Cargadas ${columnasArray.length} modificaciones desde sessionStorage (fallback)`)
    }
  } catch (e) {
    console.warn('Error al cargar columnas modificadas desde sessionStorage (fallback):', e)
  }
}

function limpiarColumnasModificadasEnStorage() {
  if (!numeroPedido.value) return
  
  try {
    const storageKey = getStorageKey()
    sessionStorage.removeItem(storageKey)
    columnasModificadas.value.clear()
  } catch (e) {
    console.warn('Error al limpiar columnas modificadas en sessionStorage:', e)
  }
}

// ⭐ EXTENSIÓN DEL TIPO: Agregar comentario al tipo PedidoDetalle localmente
// La interfaz ColumnConfig ahora está importada desde utils/formatters

// ⭐ CAMBIO: Array estático en lugar de ref
const availableColumns: ColumnConfig[] = [
  { key: 'numero', label: '#', visible: true, align: 'center', format: 'number', fixed: true },
  { key: 'codigo_interno', label: 'Código', visible: true, align: 'left', format: 'text' },
  { key: 'descripcion_sap', label: 'Descripción', visible: true, align: 'left', format: 'text' },
  { key: 'marca', label: 'Marca', visible: true, align: 'left', format: 'text' },
  { key: 'codigo_barras', label: 'Código de Barras', visible: false, align: 'left', format: 'text' },
  { key: 'pack', label: 'Pack', visible: false, align: 'left', format: 'text' },
  { key: 'costo_doc_sin_iva', label: 'Costo Unit.', visible: true, align: 'right', format: 'currency' },
  { key: 'descuento_1', label: 'Descuento', visible: false, align: 'right', format: 'number' },
  { key: 'pvp', label: 'PVP', visible: false, align: 'right', format: 'currency' },
  { key: 'subtotal', label: 'Subtotal', visible: true, align: 'right', format: 'number' },
  { key: 'bodega', label: 'Bodega', visible: true, align: 'right', format: 'number' },
  { key: 'total', label: 'Total', visible: true, align: 'right', format: 'number' },
  { key: 'comentario', label: 'Comentario', visible: true, align: 'left', format: 'text' }
]

// ⭐ CAMBIO: Usar composable useTablePreferences
// Asegurar que la columna 'numero' esté siempre visible y al inicio
const defaultVisibleColumns = availableColumns.filter(col => col.visible || col.fixed).map(col => col.key)
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns: orderedVisibleColumnKeys,
  savePreferences,
  resetPreferences: resetTablePreferences,
  selectAllColumns: selectAllTableColumns,
  isSyncing
} = useTablePreferences({
  tableId: 'productos-pedido',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// ⭐ NUEVO: Computed para obtener objetos ColumnConfig ordenados
// Asegurar que la columna 'numero' siempre esté al inicio
const orderedVisibleColumns = computed(() => {
  const ordered = orderedVisibleColumnKeys.value
    .map(key => availableColumns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined)
  
  // Separar columnas fijas y no fijas
  const fixedColumns = ordered.filter(col => col.fixed)
  const nonFixedColumns = ordered.filter(col => !col.fixed)
  
  // Asegurar que 'numero' esté al inicio si existe
  const numeroColumn = fixedColumns.find(col => col.key === 'numero')
  const otherFixedColumns = fixedColumns.filter(col => col.key !== 'numero')
  
  // Reconstruir el orden: primero 'numero', luego otras fijas, luego no fijas
  return [
    ...(numeroColumn ? [numeroColumn] : []),
    ...otherFixedColumns,
    ...nonFixedColumns
  ]
})

// ⭐ NUEVO: Computed para obtener todas las columnas con su estado de visibilidad
const availableColumnsWithVisibility = computed(() => {
  return availableColumns.map(col => ({
    ...col,
    visible: col.fixed ? true : visibleColumns.value.includes(col.key)
  }))
})

// ⭐ Asegurar que la columna 'numero' siempre esté visible
watch(
  () => visibleColumns.value,
  (newVisible) => {
    if (!newVisible.includes('numero')) {
      visibleColumns.value = ['numero', ...newVisible.filter(key => key !== 'numero')]
      savePreferences()
    }
  },
  { immediate: true }
)

// ⭐ NUEVO: Computed para calcular totales de la tabla
const totalesCostoUnitario = computed(() => {
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => {
    return sum + (detalle.costo_doc_sin_iva || 0)
  }, 0)
})

const totalesSubtotal = computed(() => {
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => {
    return sum + (detalle.subtotal || 0)
  }, 0)
})

const totalesBodega = computed(() => {
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => {
    return sum + (detalle.bodega || 0)
  }, 0)
})

const totalesTotal = computed(() => {
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => {
    return sum + (detalle.total || 0)
  }, 0)
})

// El parámetro de ruta ahora es numero_pedido
const numeroPedido = computed(() => {
  const id = route.params.id as string
  return id ? decodeURIComponent(id) : ''
})

// ⭐ Detectar el modo de interfaz según query params
const esModoMabelTrading = computed(() => {
  return route.query.usuario === 'mabel-trading' || route.query.modo === 'confirmacion'
})

// Inicializar composable de pedido detalle primero
const pedidoDetalle = usePedidoDetalle({
  pedido,
  numeroPedido,
  esModoMabelTrading,
  columnasModificadas,
  limpiarColumnasModificadasEnStorage: () => {
    if (!numeroPedido.value) return
    try {
      const storageKey = `pedido_columnas_modificadas_${numeroPedido.value}`
      sessionStorage.removeItem(storageKey)
      columnasModificadas.value.clear()
    } catch (e) {
      console.warn('Error al limpiar columnas modificadas en sessionStorage:', e)
    }
  },
  cargarColumnasModificadasDesdeStorage: () => {
    if (!numeroPedido.value) return
    try {
      const storageKey = `pedido_columnas_modificadas_${numeroPedido.value}`
      const stored = sessionStorage.getItem(storageKey)
      if (stored) {
        const columnasArray = JSON.parse(stored) as string[]
        columnasModificadas.value = new Set(columnasArray)
      }
    } catch (e) {
      console.warn('Error al cargar columnas modificadas desde sessionStorage:', e)
    }
  }
})

// Inicializar composable de redistribución después de pedidoDetalle
const redistribucion = useRedistribucion({
  pedido,
  numeroPedido,
  esModoMabelTrading,
  getReporteDiferencias: () => pedidoDetalle.reporteDiferencias,
  loadPedido: () => pedidoDetalle.loadPedido(),
  loadReporteDiferencias: () => pedidoDetalle.loadReporteDiferencias()
})

// Extraer variables del composable de pedido detalle
const {
  loading,
  error,
  pedidoIdInput,
  pedidoInputRef,
  showSearchHelp,
  copyFeedback,
  generandoOC,
  isValidPedido,
  loadPedido,
  handleGenerarOCDesdePedido,
  goToPedido,
  handleSearchBlur,
  copyToClipboard
} = pedidoDetalle

// Extraer variables del composable de redistribución
// Ahora se acceden directamente desde redistribucion.productosRedistribucion, etc.

// ⭐ Título de la interfaz según el modo
const tituloInterfaz = computed(() => {
  return esModoMabelTrading.value 
    ? 'Detalle del Pedido - MABEL TRADING'
    : 'Detalle del Pedido - EL RAYO'
})


// ⭐ FASE 4: Computed para resumen de redistribución
const resumenRedistribucion = computed(() => {
  if (redistribucion.productosRedistribucion.value.length === 0) {
    return {
      total_solicitado: 0,
      total_confirmado: 0,
      total_distribuido: 0,
      diferencia_pendiente: 0
    }
  }
  
  const total_solicitado = redistribucion.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_solicitada, 0)
  const total_confirmado = redistribucion.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_confirmada, 0)
  const total_distribuido = redistribucion.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_distribuida, 0)
  const diferencia_pendiente = total_confirmado - total_distribuido
  
  return {
    total_solicitado,
    total_confirmado,
    total_distribuido,
    diferencia_pendiente
  }
})

// ⭐ FASE 4: Computed para impacto económico
const impactoEconomico = computed(() => {
  let costo_unitario_total = 0
  let subtotal_original = 0
  let subtotal_ajustado = 0
  let diferencia_economica = 0
  
  redistribucion.productosRedistribucion.value.forEach(producto => {
    const costo = producto.costo_unitario || 0
    costo_unitario_total += costo
    subtotal_original += producto.cantidad_solicitada * costo
    subtotal_ajustado += producto.cantidad_distribuida * costo
  })
  
  diferencia_economica = subtotal_ajustado - subtotal_original
  
  return {
    costo_unitario_promedio: redistribucion.productosRedistribucion.value.length > 0 
      ? costo_unitario_total / redistribucion.productosRedistribucion.value.length 
      : 0,
    subtotal_original,
    subtotal_ajustado,
    diferencia_economica
  }
})

// ⭐ FASE 4: Validar si se puede confirmar
const puedeConfirmarRedistribucion = computed(() => {
  return resumenRedistribucion.value.diferencia_pendiente === 0 &&
         redistribucion.productosRedistribucion.value.every(p => p.diferencia === 0) &&
         redistribucion.productosRedistribucion.value.every(p => !p.error)
})

const canGenerarOC = computed(() => {
  // Permitir generar OC si el pedido está confirmado por proveedor
  const estado = pedido.value?.cabecera.estado
  return estado === 'CONFIRMADO_PROVEEDOR'
})

// Funciones de carga y gestión del pedido ahora están en el composable usePedidoDetalle

// Inicializar composable de carga de archivos
const fileUploadComposable = useFileUpload({
  pedido,
  loadPedido: () => pedidoDetalle.loadPedido(),
  onUploadSuccess: async (numeroPedido) => {
    if (numeroPedido && numeroPedido !== pedido.value?.cabecera.numero_pedido) {
      await pedidoDetalle.loadPedido()
    }
  }
})

const {
  uploading,
  showErrorModal,
  uploadErrorInfo,
  openFileSelector: goToCargarPlantillas,
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
      inicializarLimiteSugerencias(codigo) // Inicializar límite cuando se cargan sugerencias
      console.log(`✅ [PedidoDetalleView] Sugerencias encontradas para ${codigo}:`, resultado.sugerencias.length)
    } else {
      sugerenciasPorCodigo.value[codigo] = []
      sugerenciasEstado.value[codigo] = 'completado'
      console.log(`ℹ️ [PedidoDetalleView] No se encontraron sugerencias para ${codigo}`)
    }
  } catch (error: any) {
    console.error(`❌ [PedidoDetalleView] Error al buscar sugerencias para ${codigo}:`, error)
    // Manejar timeout o errores de forma no bloqueante
    if (error.response?.status === 504 || error.message?.includes('timeout')) {
      // Timeout - marcar como error pero no bloquear el modal
      sugerenciasEstado.value[codigo] = 'error'
    } else {
      // Otro error - marcar como completado sin sugerencias
      sugerenciasPorCodigo.value[codigo] = []
      sugerenciasEstado.value[codigo] = 'completado'
    }
  }
}

/**
 * Busca sugerencias automáticamente para todos los códigos no encontrados
 */
async function buscarSugerenciasAutomaticas(): Promise<void> {
  // Solo buscar si el modal es de códigos de producto no encontrados en SAP
  if (!uploadErrorInfo.value || (!uploadErrorInfo.value.title?.includes('producto') && !uploadErrorInfo.value.title?.includes('SAP'))) {
    return
  }
  
  const codigos = extraerCodigosProductoNoEncontrados()
  
  if (codigos.length === 0) {
    return
  }
  
  console.log(`🔍 [PedidoDetalleView] Iniciando búsqueda automática de sugerencias para ${codigos.length} código(s):`, codigos)
  
  // Buscar sugerencias para cada código en paralelo (pero con control de estado)
  // Usar Promise.allSettled para que un error no detenga las otras búsquedas
  const promesas = codigos
    .filter(codigo => !sugerenciasPorCodigo.value[codigo]) // Solo buscar si no se ha buscado antes
    .map(codigo => buscarSugerenciasParaCodigo(codigo))
  
  await Promise.allSettled(promesas)
  
  console.log(`✅ [PedidoDetalleView] Búsqueda automática completada para ${codigos.length} código(s)`)
}

/**
 * Limpia las sugerencias cuando se cierra el modal
 */
function limpiarSugerencias(): void {
  sugerenciasPorCodigo.value = {}
  sugerenciasEstado.value = {}
  correccionesSeleccionadas.value = {}
  limiteSugerenciasMostradas.value = {}
  // Restaurar tamaño del modal cuando se cierra
  isModalMaximized.value = false
}

/**
 * Computed: Verifica si todos los códigos inválidos tienen una corrección seleccionada
 */
const todosCodigosTienenCorreccion = computed(() => {
  const codigosInvalidos = extraerCodigosProductoNoEncontrados()
  
  if (codigosInvalidos.length === 0) {
    return false // No hay códigos inválidos, no se puede aplicar
  }
  
  // Verificar que todos los códigos tengan una corrección seleccionada
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
  
  // Obtener archivo original desde el composable
  // El composable lo guarda cuando hay error SAP
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
    // Ocultar modal temporalmente mientras se procesa
    showErrorModal.value = false
    
    // Llamar a la función de reintento con correcciones
    await reintentarConCorrecciones(
      archivo,
      correccionesSeleccionadas.value
    )
    
    // Limpiar estado después del éxito
    limpiarSugerencias()
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
  } finally {
    aplicandoCorrecciones.value = false
  }
}

// ⭐ Watcher para detectar cuando se muestra el modal y buscar sugerencias automáticamente
watch(
  () => showErrorModal.value,
  async (isVisible) => {
    if (isVisible) {
      // Esperar un pequeño delay para asegurar que el DOM se haya actualizado
      await nextTick()
      
      // Buscar sugerencias automáticamente solo para códigos de producto no encontrados en SAP
      const esErrorSap = uploadErrorInfo.value?.title?.includes('SAP') || 
                         uploadErrorInfo.value?.title?.includes('no encontrados')
      
      if (esErrorSap && uploadErrorInfo.value?.errors) {
        await buscarSugerenciasAutomaticas()
      }
    } else {
      // Limpiar sugerencias cuando se cierra el modal (pero NO limpiar archivoOriginal si se va a reintentar)
      // Solo limpiar si no se está aplicando correcciones
      if (!aplicandoCorrecciones.value) {
        limpiarSugerencias()
      }
    }
  },
  { immediate: false }
)

// ⭐ Función auxiliar para obtener clase CSS del badge de score (reutilizada de BuscarSkuModal)
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
  // Asegurar que el límite esté entre 1 y el máximo disponible
  const limiteAjustado = Math.max(1, Math.min(limite, maximo))
  limiteSugerenciasMostradas.value[codigo] = limiteAjustado
}

/**
 * Inicializa el límite de sugerencias cuando se cargan nuevas sugerencias
 */
function inicializarLimiteSugerencias(codigo: string): void {
  const todasLasSugerencias = sugerenciasPorCodigo.value[codigo] || []
  // Si no hay límite establecido, usar 5 por defecto (o el total si hay menos de 5)
  if (!limiteSugerenciasMostradas.value[codigo]) {
    limiteSugerenciasMostradas.value[codigo] = Math.min(5, todasLasSugerencias.length)
  }
}

const columnManagement = useColumnManagement(pedido, numeroPedido, columnasModificadas)

// Extraer funciones del composable para uso directo
const { editingCell, iniciarEdicion, cancelarEdicion, manejarTeclasEdicion, isColumnaModificada, getColumnaModificadaKey } = columnManagement

// Wrapper para guardarEdicion que incluye guardar en storage (fallback)
// ⚠️ NOTA: El backend se actualiza automáticamente en useColumnManagement
async function guardarEdicion() {
  await columnManagement.guardarEdicion(() => {
    // Guardar en sessionStorage como fallback (migración)
    guardarColumnasModificadasEnStorage()
  })
}

// ⭐ ELIMINADO: loadTablePreferences, saveTablePreferences, debouncedSavePreferences
// El composable useTablePreferences maneja esto automáticamente

// Funciones de gestión del pedido ahora están en el composable usePedidoDetalle

// ⭐ HU-06: Funciones para actualizar cabecera del pedido
async function handleUpdateFechaPedido(fecha: string | null) {
  if (!pedido.value?.cabecera?.pedido_id) return
  
  try {
    await mba3ConsultasService.actualizarCabeceraPedido(pedido.value.cabecera.pedido_id, {
      fecha_pedido: fecha
    })
    
    // Actualizar el valor localmente
    if (pedido.value.cabecera) {
      pedido.value.cabecera.fecha_pedido = fecha
    }
    
    toast.success('Fecha actualizada', 'La fecha de pedido se ha actualizado correctamente')
    
    // Recargar el pedido para asegurar sincronización
    await loadPedido()
  } catch (e: any) {
    console.error('Error al actualizar fecha de pedido:', e)
    toast.error('Error al actualizar', e.message || 'No se pudo actualizar la fecha de pedido')
    // Recargar para restaurar valor original
    await loadPedido()
  }
}

async function handleUpdateFechaEntrega(fecha: string | null) {
  if (!pedido.value?.cabecera?.pedido_id) return
  
  try {
    await mba3ConsultasService.actualizarCabeceraPedido(pedido.value.cabecera.pedido_id, {
      fecha_entrega: fecha
    })
    
    // Actualizar el valor localmente
    if (pedido.value.cabecera) {
      pedido.value.cabecera.fecha_entrega = fecha
    }
    
    toast.success('Fecha actualizada', 'La fecha de entrega se ha actualizado correctamente')
    
    // Recargar el pedido para asegurar sincronización
    await loadPedido()
  } catch (e: any) {
    console.error('Error al actualizar fecha de entrega:', e)
    toast.error('Error al actualizar', e.message || 'No se pudo actualizar la fecha de entrega')
    // Recargar para restaurar valor original
    await loadPedido()
  }
}

async function handleUpdateEstado(estado: string | null) {
  if (!pedido.value?.cabecera?.pedido_id) return
  
  try {
    await mba3ConsultasService.actualizarCabeceraPedido(pedido.value.cabecera.pedido_id, {
      estado: estado || undefined
    })
    
    // Actualizar el valor localmente
    if (pedido.value.cabecera) {
      pedido.value.cabecera.estado = estado || undefined
    }
    
    toast.success('Estado actualizado', 'El estado del pedido se ha actualizado correctamente')
    
    // Recargar el pedido para asegurar sincronización
    await loadPedido()
  } catch (e: any) {
    console.error('Error al actualizar estado:', e)
    toast.error('Error al actualizar', e.message || 'No se pudo actualizar el estado del pedido')
    // Recargar para restaurar valor original
    await loadPedido()
  }
}

async function handleConfirmar() {
  // Prevenir múltiples clics
  if (confirmando.value || !pedido.value || !numeroPedido.value) return
  
  // Establecer estado de confirmación
  confirmando.value = true
  
  // Mostrar indicador de carga
  toast.info('Guardando cambios...', 'Guardando los cambios realizados en la tabla')
  
  try {
    // ⭐ FASE 3: Solo guardar cambios y crear respuesta_proveedor
    // NO procesar confirmación - eso lo hace MABEL TRADING en Fase 4
    // Usar pedido_id si está disponible (más eficiente), sino usar numero_pedido
    const pedidoId = pedido.value?.cabecera?.pedido_id
    await mba3ConsultasService.crearRespuestaProveedorDesdePedido(numeroPedido.value, pedidoId)
    
    toast.success('Cambios guardados', 'Los cambios han sido guardados. Redirigiendo a redistribución...')
    
    // Recargar el pedido para obtener respuesta_proveedor actualizada
    await loadPedido()
    
    // Navegar a la interfaz específica de MABEL TRADING (Fase 4)
    router.push({
      name: 'mba3-consultas-pedido-redistribucion',
      params: { id: encodeURIComponent(numeroPedido.value) }
    })
  } catch (e: any) {
    console.error('Error al confirmar:', e)
    
    // Si la respuesta ya existe, navegar directamente
    if (e.message?.includes('ya existe') || (e as any).isConflict || (e as any).statusCode === 409) {
      toast.info('Redirigiendo', 'La respuesta ya está creada. Abriendo redistribución...')
      // Recargar pedido para asegurar que tenemos los datos actualizados
      await loadPedido()
      router.push({
        name: 'mba3-consultas-pedido-redistribucion',
        params: { id: encodeURIComponent(numeroPedido.value) }
      })
    } else {
      toast.error('Error al guardar', e.message || 'No se pudieron guardar los cambios')
      // Solo resetear el estado si hay un error real (no si es conflicto 409)
      confirmando.value = false
    }
  }
  // Nota: No resetear confirmando.value aquí porque se redirige a otra página
  // Si hay un error y no se redirige, ya se resetea en el catch
}

// ⭐ HU-08: Función para descargar pedido en formato plano para MBA
async function handleDescargarPlanoMba() {
  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido seleccionado')
    return
  }
  
  try {
    toast.info('Generando archivo...', 'Preparando descarga del pedido en formato plano')
    
    const blob = await mba3ConsultasService.exportarPedidoPlanoMba(numeroPedido.value, 'csv')
    
    // Crear URL del blob y descargar
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedido_mba_${numeroPedido.value.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Descarga completada', 'El archivo se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al descargar pedido plano:', e)
    toast.error('Error al descargar', e.message || 'No se pudo descargar el archivo')
  }
}

// Función formatDate ahora importada desde utils/formatters

// ⭐ REMOVIDO: Funciones de redistribución movidas al composable useRedistribucion.ts

// ⭐ FASE 4: Funciones de redistribución - ahora delegadas al composable useRedistribucion
// Las funciones se pasan al componente RedistribucionTiendas como eventos
function toggleExpandirProducto(codigoProducto: string) {
  redistribucion.toggleExpandirProducto(codigoProducto)
}

function actualizarCantidadTienda(codigoProducto: string, tiendaCodigo: string, event: Event) {
  redistribucion.actualizarCantidadTienda(codigoProducto, tiendaCodigo, event)
}

function validarYCorregirCantidad(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada) {
  redistribucion.validarYCorregirCantidad(producto, tienda)
}

function distribuirProporcionalmente(codigoProducto: string) {
  redistribucion.distribuirProporcionalmente(codigoProducto)
}

function copiarDistribucionOriginal(codigoProducto: string) {
  redistribucion.copiarDistribucionOriginal(codigoProducto)
}

function resetearDistribucion(codigoProducto: string) {
  redistribucion.resetearDistribucion(codigoProducto)
}

async function guardarBorradorRedistribucion() {
  await redistribucion.guardarBorradorRedistribucion()
}

async function confirmarRedistribucion() {
  await redistribucion.confirmarRedistribucion(puedeConfirmarRedistribucion)
}

// Función copyToClipboard ahora está en el composable usePedidoDetalle

// Funciones de formato ahora importadas desde utils/formatters y utils/styleHelpers

// Funciones de redistribución ahora importadas desde utils/redistribucionHelpers y utils/styleHelpers
// Función getMensajeValidacionRedistribucion ahora requiere pasar productosRedistribucion.value como parámetro

onMounted(() => {
  // El composable carga las preferencias automáticamente
  loadPedido()
  // ⭐ Las columnas modificadas se cargan automáticamente en loadPedido()
  // Autofocus opcional: descomentar si quieres que el input tenga foco al cargar
  // pedidoInputRef.value?.focus()
  
  // Agregar listener para cerrar dropdown al hacer click fuera
  document.addEventListener('click', handleClickOutsideColumnSelector)
})

// ⭐ Si el componente está en un keep-alive, también cargar al activarse
onActivated(() => {
  // Recargar el pedido cuando el componente se activa (útil para keep-alive)
  // Esto asegura que los datos estén actualizados después de navegar desde otras vistas
  if (numeroPedido.value) {
    loadPedido()
  }
})

// Watch para reaccionar a cambios en el parámetro de ruta
// ⭐ MEJORADO: Observar numeroPedido directamente (computed reactivo) para mayor robustez
watch(
  () => numeroPedido.value,
  async (newNumeroPedido, oldNumeroPedido) => {
    // Solo recargar si el número de pedido realmente cambió y no es la carga inicial
    if (newNumeroPedido && newNumeroPedido !== oldNumeroPedido) {
      console.log(`🔄 [PedidoDetalleView] Cambio de pedido detectado: ${oldNumeroPedido || '(ninguno)'} → ${newNumeroPedido}`)
      await loadPedido()
      // Limpiar el input de búsqueda después de navegar
      pedidoIdInput.value = ''
    }
  },
  { immediate: false }
)

// ⭐ FASE 4: Watch para inicializar redistribución cuando cambie el pedido o el modo
watch(
  [() => pedido.value?.respuesta_proveedor, () => esModoMabelTrading.value],
  () => {
    if (pedido.value?.respuesta_proveedor && esModoMabelTrading.value) {
      redistribucion.inicializarProductosRedistribucion()
    } else {
      redistribucion.productosRedistribucion.value = []
      redistribucion.productosExpandidos.value.clear()
    }
  },
  { immediate: true }
)

// ⭐ ELIMINADO: Watchers antiguos (el composable maneja esto automáticamente)

// Cleanup: eliminar listener del dropdown cuando el componente se destruye
// El composable useFileUpload maneja el cleanup del fileInput
onUnmounted(() => {
  // Remover listener del dropdown
  document.removeEventListener('click', handleClickOutsideColumnSelector)
})

function handleClickOutsideColumnSelector(event: MouseEvent) {
  if (!showColumnSelector.value) return
  
  const target = event.target as HTMLElement
  // Si el click es dentro del dropdown o del botón, no hacer nada
  if (target.closest('.relative')) {
    return
  }
  
  // Cerrar el dropdown
  showColumnSelector.value = false
}

function handleDragStart(index: number) {
  draggedColumnIndex.value = index
}

function handleDragOver(index: number) {
  if (draggedColumnIndex.value !== null) {
    dragOverColumnIndex.value = index
  }
}

// ⭐ ACTUALIZAR: handleDrop para usar el composable
function handleDrop(dropIndex: number) {
  if (draggedColumnIndex.value === null || draggedColumnIndex.value === dropIndex) {
    return
  }
  
  // No permitir arrastrar columnas fijas
  const draggedColumn = orderedVisibleColumns.value[draggedColumnIndex.value]
  if (draggedColumn?.fixed) {
    return
  }
  
  // No permitir colocar columnas antes de columnas fijas
  const dropColumn = orderedVisibleColumns.value[dropIndex]
  if (dropColumn?.fixed && dropIndex < draggedColumnIndex.value) {
    return
  }
  
  // Reordenar usando el composable
  const currentOrder = [...orderedVisibleColumnKeys.value]
  const draggedKey = currentOrder[draggedColumnIndex.value]
  
  // Remover columna arrastrada
  currentOrder.splice(draggedColumnIndex.value, 1)
  
  // Insertar en nueva posición (ajustar índice si hay columnas fijas antes)
  let adjustedDropIndex = dropIndex
  if (dropIndex > draggedColumnIndex.value) {
    adjustedDropIndex = dropIndex - 1
  }
  currentOrder.splice(adjustedDropIndex, 0, draggedKey)
  
  // Asegurar que 'numero' esté al inicio
  const numeroIndex = currentOrder.indexOf('numero')
  if (numeroIndex > 0) {
    currentOrder.splice(numeroIndex, 1)
    currentOrder.unshift('numero')
  }
  
  // Actualizar el orden usando el composable
  columnOrder.value = currentOrder
  
  // Guardar preferencias
  savePreferences()
}

function handleDragEnd() {
  draggedColumnIndex.value = null
  dragOverColumnIndex.value = null
}

// ⭐ NUEVO: Función para toggle de visibilidad de columnas
function toggleColumnVisibility(columnKey: string) {
  // No permitir ocultar columnas fijas
  const column = availableColumns.find(col => col.key === columnKey)
  if (column?.fixed) {
    return
  }
  
  const currentVisible = [...visibleColumns.value]
  const index = currentVisible.indexOf(columnKey)
  
  // Validación: Asegurar que hay al menos una columna visible (excluyendo fijas)
  const visibleNonFixed = currentVisible.filter(key => {
    const col = availableColumns.find(c => c.key === key)
    return !col?.fixed
  })
  
  if (index > -1 && visibleNonFixed.length === 1) {
    console.warn('⚠️ Debe haber al menos una columna visible. Operación cancelada.')
    return
  }
  
  if (index > -1) {
    // Ocultar columna
    currentVisible.splice(index, 1)
  } else {
    // Mostrar columna
    currentVisible.push(columnKey)
  }
  
  visibleColumns.value = currentVisible
  savePreferences()
}

// Funciones de edición ahora están en el composable useColumnManagement
</script>

