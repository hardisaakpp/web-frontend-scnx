<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header con título y botones de acción -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Procesamiento SAP del Pedido</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Información procesada después de confirmar la redistribución
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- ⭐ MEJORA: Botón con tooltip y mejor progreso -->
          <div class="relative group">
            <button
              v-if="canGenerarOC"
              @click="handleGenerarOC"
              :disabled="loading || generandoOC"
              class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm relative"
            >
              <svg v-if="!generandoOC" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ generandoOC ? `Generando... ${progressStep}` : 'Generar ODC' }}
            </button>
            <!-- ⭐ Tooltip explicativo -->
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              <div class="font-semibold mb-1">Generar Orden de Compra y Solicitudes de Transferencia</div>
              <div class="text-gray-300">
                Este proceso generará la Orden de Compra en SAP, creará las Solicitudes de Transferencia por tienda, realizará validaciones y conversiones de unidades, y enviará notificaciones al personal de El Rayo.
              </div>
              <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                <div class="border-4 border-transparent border-b-gray-900 dark:border-b-gray-800"></div>
              </div>
            </div>
          </div>
          <button
            @click="goBack"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando procesamiento SAP...</p>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 transition-colors duration-300">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-900 dark:text-red-200">Error al cargar el procesamiento SAP</p>
            <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- ⭐ MEJORA: Indicador de progreso mejorado -->
      <div v-if="generandoOC" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Generando Orden de Compra</h3>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ progressPercentage }}%</span>
          </div>
          
          <!-- Barra de progreso animada -->
          <div class="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transition-all duration-500 ease-out relative"
              :style="{ width: `${progressPercentage}%` }"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>

          <!-- Pasos del proceso -->
          <div class="space-y-2">
            <div
              v-for="(step, index) in progressSteps"
              :key="index"
              class="flex items-center gap-3 text-sm"
              :class="step.status === 'completed' ? 'text-green-600 dark:text-green-400' : step.status === 'active' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'"
            >
              <div class="flex-shrink-0">
                <svg v-if="step.status === 'completed'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="step.status === 'active'" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span :class="step.status === 'active' ? 'font-semibold' : ''">{{ step.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido del procesamiento -->
      <div v-if="procesamiento && !loading">
        <!-- Información de la cabecera del pedido -->
        <PedidoCabecera
          v-if="pedidoCompleto"
          :pedido="pedidoCompleto"
          :copy-feedback="copyFeedback"
          :default-expanded="true"
          @copy-to-clipboard="copyToClipboard"
        />

        <!-- Tabla de productos procesados -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Productos Procesados</h2>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Filtrar:</label>
              <select
                v-model="filtroEstado"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              >
                <option value="todos">Todos</option>
                <option value="homologados">Homologados</option>
                <option value="no-homologados">No Homologados</option>
                <option value="con-error">Con Errores</option>
              </select>
              
              <!-- Selector de columnas -->
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
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                    ]"
                  >
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(producto, index) in productosFiltrados"
                  :key="producto.pedido_detalle_id"
                  :class="[
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                    !producto.esta_homologado ? 'bg-yellow-50 dark:bg-yellow-900/20' : '',
                    producto.tiene_error ? 'bg-red-50 dark:bg-red-900/20' : ''
                  ]"
                >
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-4 text-sm',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : column.align === 'center' ? 'text-center' : '',
                      column.key === 'numero' ? 'text-gray-900 dark:text-white' :
                      column.key === 'codigo' ? 'font-medium text-gray-900 dark:text-white' :
                      column.key === 'producto' ? 'text-gray-700 dark:text-gray-300' :
                      'text-gray-900 dark:text-white'
                    ]"
                  >
                    <!-- Columna Número -->
                    <template v-if="column.key === 'numero'">
                      {{ index + 1 }}
                    </template>
                    
                    <!-- Columna Código -->
                    <template v-else-if="column.key === 'codigo'">
                      {{ producto.codigo_interno || 'N/A' }}
                    </template>
                    
                    <!-- Columna Producto -->
                    <template v-else-if="column.key === 'producto'">
                      {{ producto.descripcion_producto || producto.descripcion_sap || producto.descripcion_original || 'N/A' }}
                    </template>
                    
                    <!-- Columna Cantidad Original -->
                    <template v-else-if="column.key === 'cantidad_original'">
                      {{ formatNumber(producto.cantidad_original) }}
                    </template>
                    
                    <!-- Columna Precio Unitario Original -->
                    <template v-else-if="column.key === 'precio_unitario_original'">
                      {{ producto.precio_unitario_original ? formatCurrency(producto.precio_unitario_original) : 'N/A' }}
                    </template>
                    
                    <!-- Columna Subtotal Pedido -->
                    <template v-else-if="column.key === 'subtotal_pedido'">
                      {{ (producto.total_linea_original ?? producto.subtotal_original) !== null ? formatCurrency(producto.total_linea_original ?? producto.subtotal_original ?? 0) : 'N/A' }}
                    </template>
                    
                    <!-- Columna Unidad -->
                    <template v-else-if="column.key === 'unidad'">
                      <div class="flex flex-col items-center gap-1">
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ producto.unidad_original || 'N/A' }}</span>
                        <span class="text-xs">→</span>
                        <span class="text-xs font-medium">{{ producto.unidad_sap || 'N/A' }}</span>
                      </div>
                    </template>
                    
                    <!-- Columna Cantidad Pack SAP -->
                    <template v-else-if="column.key === 'cantidad_pack_sap'">
                      {{ (producto.cantidad_sap ?? producto.cantidad_pack_sap) !== null ? formatNumber(producto.cantidad_sap ?? producto.cantidad_pack_sap ?? 0) : 'N/A' }}
                    </template>
                    
                    <!-- Columna Precio Unitario SAP -->
                    <template v-else-if="column.key === 'precio_unitario_sap'">
                      {{ producto.precio_unitario_sap ? formatCurrency(producto.precio_unitario_sap) : 'N/A' }}
                    </template>
                    
                    <!-- Columna Subtotal SAP -->
                    <template v-else-if="column.key === 'subtotal_sap'">
                      {{ (producto.total_linea_sap ?? producto.subtotal_sap) !== null ? formatCurrency(producto.total_linea_sap ?? producto.subtotal_sap ?? 0) : 'N/A' }}
                    </template>
                  </td>
                </tr>
              </tbody>
              
              <!-- Fila de totales -->
              <tfoot v-if="productosFiltrados.length > 0" class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-3 text-sm font-semibold',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : column.align === 'center' ? 'text-center' : 'text-left',
                      'text-gray-900 dark:text-white'
                    ]"
                  >
                    <!-- Columna Número -->
                    <template v-if="column.key === 'numero'">
                      TOTALES
                    </template>
                    
                    <!-- Columna Subtotal Pedido -->
                    <template v-else-if="column.key === 'subtotal_pedido'">
                      {{ formatCurrency(totalesSubtotalPedido) }}
                    </template>
                    
                    <!-- Columna Subtotal SAP -->
                    <template v-else-if="column.key === 'subtotal_sap'">
                      {{ formatCurrency(totalesSubtotalSAP) }}
                    </template>
                    
                    <!-- Todas las demás columnas vacías -->
                    <template v-else>
                      <!-- Dejar vacío -->
                    </template>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Mensaje si no hay productos filtrados -->
          <div v-if="productosFiltrados.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay productos que coincidan con el filtro seleccionado.
          </div>
        </div>

        <!-- Sección de Solicitudes de Transferencia -->
        <div v-if="solicitudesTransferencia" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mt-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Solicitudes de Transferencia</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Generadas automáticamente después de crear la Orden de Compra
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  solicitudesTransferencia.transferencias_errores === 0
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                ]"
              >
                {{ solicitudesTransferencia.transferencias_creadas }} / {{ solicitudesTransferencia.total_tiendas }} creadas
              </span>
            </div>
          </div>

          <!-- Alerta si hay errores -->
          <div
            v-if="solicitudesTransferencia.transferencias_errores > 0"
            class="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <svg class="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                  Advertencia: {{ solicitudesTransferencia.transferencias_errores }} solicitud(es) de transferencia fallaron
                </p>
                <p class="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  Algunas tiendas no pudieron recibir su Solicitud de Transferencia. Revise los detalles a continuación.
                </p>
              </div>
            </div>
          </div>

          <!-- Tabla de Solicitudes de Transferencia -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tienda
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    DocNum
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="resultado in solicitudesTransferencia.resultados"
                  :key="resultado.tienda_id"
                  :class="[
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                    !resultado.success ? 'bg-red-50 dark:bg-red-900/20' : ''
                  ]"
                >
                  <td class="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {{ resultado.tienda_codigo }}
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {{ resultado.tienda_codigo }}
                  </td>
                  <td class="px-4 py-4 text-sm text-center">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        resultado.success
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      ]"
                    >
                      <svg
                        v-if="resultado.success"
                        class="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg
                        v-else
                        class="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {{ resultado.success ? 'Creada' : 'Error' }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-sm text-right text-gray-900 dark:text-white">
                    {{ resultado.doc_num || '-' }}
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <span v-if="resultado.error" class="text-red-600 dark:text-red-400">
                      {{ resultado.error }}
                    </span>
                    <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mensaje si no hay resultados -->
          <div v-if="solicitudesTransferencia.resultados.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            No se crearon Solicitudes de Transferencia.
          </div>
        </div>
      </div>

      <!-- ⭐ MEJORA: Modal de error detallado -->
      <SapErrorDetailModal
        v-if="showErrorModal && errorData"
        :error-data="errorData"
        @close="showErrorModal = false"
        @retry="handleRetryGenerarOC"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { ProcesamientoSAPResponse, PedidoCompleto, SolicitudesTransferencia } from '../types'
import { formatDate, formatNumber, formatCurrency, type ColumnConfig } from '../utils/formatters'
import PedidoCabecera from '../components/PedidoCabecera.vue'
import SapErrorDetailModal from '../components/SapErrorDetailModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const procesamiento = ref<ProcesamientoSAPResponse | null>(null)
const pedidoCompleto = ref<PedidoCompleto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const copyFeedback = ref(false)
const filtroEstado = ref<'todos' | 'homologados' | 'no-homologados' | 'con-error'>('todos')
const generandoOC = ref(false)
const solicitudesTransferencia = ref<SolicitudesTransferencia | null>(null)

// ⭐ NUEVO: Variables para manejo mejorado de errores y progreso
const showErrorModal = ref(false)
const errorData = ref<{
  errorCode?: string | null
  errorSource?: string | null
  errorMessage?: string | null
} | null>(null)

const progressPercentage = ref(0)
const progressStep = ref('')
const progressSteps = ref([
  { label: 'Validando datos del pedido', status: 'pending' as 'pending' | 'active' | 'completed' },
  { label: 'Creando Orden de Compra en SAP', status: 'pending' as 'pending' | 'active' | 'completed' },
  { label: 'Generando Solicitudes de Transferencia', status: 'pending' as 'pending' | 'active' | 'completed' },
  { label: 'Enviando notificaciones', status: 'pending' as 'pending' | 'active' | 'completed' }
])

// ⭐ Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)

// Definir columnas disponibles para la tabla de productos procesados
const availableColumns: ColumnConfig[] = [
  { key: 'numero', label: '#', visible: true, align: 'left', format: 'number', fixed: true },
  { key: 'codigo', label: 'Código', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'producto', label: 'Producto', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'cantidad_original', label: 'Cant. Original', visible: true, align: 'right', format: 'number' },
  { key: 'precio_unitario_original', label: 'Precio Unit.', visible: true, align: 'right', format: 'currency' },
  { key: 'subtotal_pedido', label: 'Subtotal Pedido', visible: true, align: 'right', format: 'currency' },
  { key: 'unidad', label: 'Unidad', visible: true, align: 'center', format: 'text' },
  { key: 'cantidad_pack_sap', label: 'Cant. Pack', visible: true, align: 'right', format: 'number' },
  { key: 'precio_unitario_sap', label: 'Precio Unit.', visible: true, align: 'right', format: 'currency' },
  { key: 'subtotal_sap', label: 'Subtotal', visible: true, align: 'right', format: 'currency' }
]

// Configuración de columnas usando composable
const defaultVisibleColumns = availableColumns.filter(col => col.visible || col.fixed).map(col => col.key)
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns: orderedVisibleColumnKeys,
  savePreferences,
  isSyncing
} = useTablePreferences({
  tableId: 'productos-procesados',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// Computed para obtener objetos ColumnConfig ordenados
const orderedVisibleColumns = computed(() => {
  const ordered = orderedVisibleColumnKeys.value
    .map(key => availableColumns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined)
  
  // Separar columnas fijas y no fijas
  const fixedColumns = ordered.filter(col => col.fixed)
  const nonFixedColumns = ordered.filter(col => !col.fixed)
  
  // Asegurar que las columnas fijas estén al inicio
  return [...fixedColumns, ...nonFixedColumns]
})

// Computed para obtener todas las columnas con su estado de visibilidad
const availableColumnsWithVisibility = computed(() => {
  return availableColumns.map(col => ({
    ...col,
    visible: col.fixed ? true : visibleColumns.value.includes(col.key)
  }))
})

// Función para toggle de visibilidad de columnas
function toggleColumnVisibility(columnKey: string) {
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
    currentVisible.splice(index, 1)
  } else {
    currentVisible.push(columnKey)
  }
  
  visibleColumns.value = currentVisible
  savePreferences()
}

// Cerrar dropdown al hacer click fuera
function handleClickOutsideColumnSelector(event: MouseEvent) {
  if (!showColumnSelector.value) return
  
  const target = event.target as HTMLElement
  if (target.closest('.relative')) {
    return
  }
  
  showColumnSelector.value = false
}

// Obtener ID del pedido desde la ruta
const pedidoId = computed(() => {
  const id = route.params.id as string
  return id ? decodeURIComponent(id) : ''
})

// Filtrar productos según el estado seleccionado
const productosFiltrados = computed(() => {
  if (!procesamiento.value) return []
  
  const productos = procesamiento.value.productos
  
  switch (filtroEstado.value) {
    case 'homologados':
      return productos.filter(p => p.esta_homologado && !p.tiene_error)
    case 'no-homologados':
      return productos.filter(p => !p.esta_homologado)
    case 'con-error':
      return productos.filter(p => p.tiene_error)
    default:
      return productos
  }
})

// ⭐ Computed para calcular totales de la tabla (solo subtotales)
const totalesSubtotalPedido = computed(() => {
  return productosFiltrados.value.reduce((sum, producto) => {
    const subtotal = producto.total_linea_original ?? producto.subtotal_original ?? 0
    return sum + (subtotal || 0)
  }, 0)
})

const totalesSubtotalSAP = computed(() => {
  return productosFiltrados.value.reduce((sum, producto) => {
    const subtotal = producto.total_linea_sap ?? producto.subtotal_sap ?? 0
    return sum + (subtotal || 0)
  }, 0)
})

// Cargar procesamiento SAP
async function loadProcesamientoSAP() {
  if (!pedidoId.value) {
    error.value = 'No se proporcionó un ID de pedido válido'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Cargar procesamiento SAP
    const procesamientoData = await mba3ConsultasService.getProcesamientoSAP(pedidoId.value)
    procesamiento.value = procesamientoData

    // Cargar también el pedido completo para mostrar la cabecera
    try {
      const pedido = await mba3ConsultasService.getPedido(procesamientoData.numero_pedido)
      pedidoCompleto.value = pedido as PedidoCompleto
    } catch (e: any) {
      console.warn('No se pudo cargar el pedido completo:', e)
      // Si no se puede cargar el pedido, crear un objeto mínimo para la cabecera
      pedidoCompleto.value = {
        cabecera: {
          pedido_id: procesamientoData.pedido_id,
          numero_pedido: procesamientoData.numero_pedido,
          fecha_pedido: null,
          fecha_entrega: null,
          forma_pago: null,
          odc: null,
          proveedor_nombre: null,
          comprador_nombre: null,
          comprador_codigo: null,
          origen_traslado: null,
          serie: null,
          archivo_nombre: '',
          creado_por: null,
          creado_en: null,
          estado: undefined
        },
        detalles: []
      } as PedidoCompleto
    }
  } catch (e: any) {
    console.error('Error al cargar procesamiento SAP:', e)
    error.value = e.message || 'No se pudo cargar el procesamiento SAP'
    toast.error('Error', error.value || 'No se pudo cargar el procesamiento SAP')
  } finally {
    loading.value = false
  }
}

// Copiar al portapapeles
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    copyFeedback.value = true
    setTimeout(() => {
      copyFeedback.value = false
    }, 2000)
  }).catch(err => {
    console.error('Error al copiar:', err)
  })
}

// Navegación
function goBack() {
  router.back()
}

// Computed para determinar si se puede generar OC
const canGenerarOC = computed(() => {
  // Permitir generar OC si el pedido está en un estado válido después de procesar SAP
  const estado = pedidoCompleto.value?.cabecera.estado
  return estado === 'CONFIRMADO_PROVEEDOR' || 
         estado === 'PEDIDO_CONFIRMADO' || 
         estado === 'PROCESADO_SAP'
})

// ⭐ MEJORA: Función para generar orden de compra con mejor manejo de errores y progreso
async function handleGenerarOC() {
  if (!procesamiento.value?.numero_pedido) {
    toast.error('Error', 'No se encontró el número de pedido')
    return
  }

  generandoOC.value = true
  progressPercentage.value = 0
  progressStep.value = 'Validando datos...'
  
  // Resetear pasos
  progressSteps.value.forEach(step => {
    step.status = 'pending'
  })

  try {
    toast.info('Generando orden de compra...', 'Creando orden de compra desde el pedido confirmado')

    // Paso 1: Validación
    progressSteps.value[0].status = 'active'
    progressPercentage.value = 10
    progressStep.value = 'Validando datos del pedido...'
    await new Promise(resolve => setTimeout(resolve, 300))

    // Paso 2: Crear OC
    progressSteps.value[0].status = 'completed'
    progressSteps.value[1].status = 'active'
    progressPercentage.value = 30
    progressStep.value = 'Creando Orden de Compra en SAP...'

    const result = await mba3ConsultasService.crearOrdenCompraDesdePedido(procesamiento.value.numero_pedido)

    if (result.status === 'success') {
      // Paso 3: Solicitudes de Transferencia
      progressSteps.value[1].status = 'completed'
      progressSteps.value[2].status = 'active'
      progressPercentage.value = 70
      progressStep.value = 'Generando Solicitudes de Transferencia...'
      await new Promise(resolve => setTimeout(resolve, 500))

      // Guardar información de Solicitudes de Transferencia si está disponible
      if (result.solicitudes_transferencia) {
        solicitudesTransferencia.value = result.solicitudes_transferencia
      }

      // Paso 4: Notificaciones
      progressSteps.value[2].status = 'completed'
      progressSteps.value[3].status = 'active'
      progressPercentage.value = 90
      progressStep.value = 'Enviando notificaciones...'
      await new Promise(resolve => setTimeout(resolve, 300))

      progressSteps.value[3].status = 'completed'
      progressPercentage.value = 100
      progressStep.value = 'Completado'

      const mensaje = result.solicitudes_transferencia
        ? `Orden de compra generada. ${result.solicitudes_transferencia.transferencias_creadas} de ${result.solicitudes_transferencia.total_tiendas} Solicitudes de Transferencia creadas.`
        : (result.message || 'La orden de compra se ha generado exitosamente')

      toast.success('Orden de compra generada', mensaje)

      // Recargar el procesamiento para actualizar estados
      await loadProcesamientoSAP()

      // Redirigir a la vista de procesos después de un breve delay
      const delay = result.solicitudes_transferencia ? 3000 : 1500
      setTimeout(() => {
        router.push('/mba3-consultas/proceso')
      }, delay)
    } else {
      // ⭐ MEJORA: Mostrar modal de error detallado
      errorData.value = {
        errorCode: (result as any).error_code || null,
        errorSource: (result as any).error_source || null,
        errorMessage: result.message || 'No se pudo generar la orden de compra'
      }
      showErrorModal.value = true
      
      toast.error('Error al generar orden', result.message || 'No se pudo generar la orden de compra')
    }
  } catch (e: any) {
    console.error('Error al generar orden de compra:', e)
    
    // ⭐ MEJORA: Mostrar modal de error detallado
    errorData.value = {
      errorCode: e.response?.data?.error_code || null,
      errorSource: e.response?.data?.error_source || 'BACKEND',
      errorMessage: e.message || 'No se pudo generar la orden de compra'
    }
    showErrorModal.value = true
    
    toast.error('Error al generar orden', e.message || 'No se pudo generar la orden de compra')
  } finally {
    generandoOC.value = false
    setTimeout(() => {
      progressPercentage.value = 0
      progressStep.value = ''
      progressSteps.value.forEach(step => {
        step.status = 'pending'
      })
    }, 2000)
  }
}

// ⭐ NUEVO: Función para reintentar
function handleRetryGenerarOC() {
  showErrorModal.value = false
  errorData.value = null
  setTimeout(() => {
    handleGenerarOC()
  }, 500)
}

// Cargar datos al montar el componente
onMounted(() => {
  loadProcesamientoSAP()
  // Agregar listener para cerrar dropdown al hacer click fuera
  document.addEventListener('click', handleClickOutsideColumnSelector)
})

onUnmounted(() => {
  // Remover listener del dropdown
  document.removeEventListener('click', handleClickOutsideColumnSelector)
})

// Watch para recargar si cambia el parámetro de ruta
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      await loadProcesamientoSAP()
    }
  }
)
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
