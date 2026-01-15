<template>
  <!-- ⭐ FASE 4: Ajuste y Redistribución a Tiendas -->
  <!-- Se muestra siempre en modo MABEL TRADING -->
  <div v-if="esModoMabelTradingValue" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
    <!-- Header Sticky con Indicadores Globales -->
    <div class="sticky top-0 z-[5] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Ajuste y Redistribución a Tiendas</h2>
        
        <!-- Toggle de Vista (solo cuando hay respuesta del proveedor) -->
        <div v-if="pedidoValue?.respuesta_proveedor" class="flex items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Vista:</span>
          <div class="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-1">
            <button
              @click="modoVista = 'compacta'"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                modoVista === 'compacta'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              ]"
            >
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Compacta
              </span>
            </button>
            <button
              @click="modoVista = 'excel'"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                modoVista === 'excel'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              ]"
            >
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Excel
              </span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Estado cuando no hay respuesta del proveedor -->
      <div v-if="!pedidoValue?.respuesta_proveedor" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-blue-800 dark:text-blue-200">Preparando datos para redistribución</p>
            <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
              El sistema está generando la confirmación del proveedor a partir de los ajustes realizados por EL RAYO. Esto puede tomar unos segundos...
            </p>
          </div>
        </div>
      </div>
      
      <!-- Indicadores cuando hay respuesta del proveedor -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <label class="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Total Confirmado</label>
          <p class="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-200">
            {{ formatNumber(resumenRedistribucion.total_confirmado) }}
          </p>
          <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Ajustado por EL RAYO
          </p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <label class="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">Total Distribuido</label>
          <p class="mt-1 text-2xl font-bold text-purple-900 dark:text-purple-200">
            {{ formatNumber(resumenRedistribucion.total_distribuido) }}
          </p>
          <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">
            Repartido entre tiendas
          </p>
        </div>
        <div 
          class="rounded-lg p-4 border-2"
          :class="resumenRedistribucion.diferencia_pendiente === 0 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
            : resumenRedistribucion.diferencia_pendiente < 0
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'"
        >
          <label 
            class="text-xs font-medium uppercase"
            :class="resumenRedistribucion.diferencia_pendiente === 0 
              ? 'text-green-600 dark:text-green-400' 
              : resumenRedistribucion.diferencia_pendiente < 0
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'"
          >
            {{ resumenRedistribucion.diferencia_pendiente === 0 ? '✓ Completo' : resumenRedistribucion.diferencia_pendiente < 0 ? '⚠ Falta' : '✗ Excede' }}
          </label>
          <p 
            class="mt-1 text-2xl font-bold"
            :class="resumenRedistribucion.diferencia_pendiente === 0 
              ? 'text-green-900 dark:text-green-200' 
              : resumenRedistribucion.diferencia_pendiente < 0
              ? 'text-yellow-900 dark:text-yellow-200'
              : 'text-red-900 dark:text-red-200'"
          >
            {{ resumenRedistribucion.diferencia_pendiente > 0 ? '+' : '' }}{{ formatNumber(resumenRedistribucion.diferencia_pendiente) }}
          </p>
          <p class="text-xs mt-1" :class="resumenRedistribucion.diferencia_pendiente === 0 
            ? 'text-green-700 dark:text-green-300' 
            : resumenRedistribucion.diferencia_pendiente < 0
            ? 'text-yellow-700 dark:text-yellow-300'
            : 'text-red-700 dark:text-red-300'">
            {{ resumenRedistribucion.diferencia_pendiente === 0 ? 'Listo para confirmar' : resumenRedistribucion.diferencia_pendiente < 0 ? 'Faltan por distribuir' : 'Excede el total' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Contenido Principal: Tabla de Productos -->
    <div v-if="pedidoValue?.respuesta_proveedor" class="p-6 pb-24">
      <!-- Header de la tabla con selector de columnas (solo vista compacta) -->
      <div v-if="modoVista === 'compacta'" class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Tabla de Redistribución</h3>
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
      
      <!-- Tabla Principal -->
      <div class="overflow-x-auto min-w-0">
        <!-- Vista Excel -->
        <ExcelLikeGridView
          v-if="modoVista === 'excel'"
          :productos="productosRedistribucion"
          :show-totals="true"
          :columnas-modificadas="columnasModificadas"
          :pedido="pedidoValue"
          @actualizar-cantidad-tienda="handleActualizarCantidadTienda"
          @validar-y-corregir-cantidad="handleValidarYCorregirCantidad"
        />
        
        <!-- Vista Compacta (tabla original) -->
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                v-for="column in orderedVisibleColumns"
                :key="column.key"
                :class="[
                  'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                  column.key === 'expand' ? 'w-8 text-left' :
                  column.key === 'codigo' ? 'text-left' :
                  column.key === 'producto' ? 'text-left' :
                  column.key === 'progreso' ? 'text-center min-w-[140px]' :
                  column.key === 'estado' ? 'text-center' :
                  column.key === 'acciones' ? 'text-center' :
                  'text-right'
                ]"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <template v-for="producto in productosArray" :key="producto.codigo_producto">
              <!-- Fila Principal del Producto -->
              <!-- Fila Principal: Resalta primero modificaciones (ámbar), luego diferencia (verde/amarillo/rojo) -->
              <!-- ⭐ IMPORTANTE: El resaltado ámbar debe aparecer inmediatamente si el producto tiene modificaciones del flujo anterior (EL RAYO) -->
              <tr 
                :class="[
                  'transition-colors',
                  producto.error ? 'bg-gray-100 dark:bg-gray-700/30' :
                  // ⭐ PRIORIDAD 1: Resaltar productos con modificaciones del flujo anterior (EL RAYO)
                  // Esto debe aparecer inmediatamente al cargar la página, no solo después de distribuir
                  tieneModificaciones(producto) ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400' :
                  // ⭐ PRIORIDAD 2: Resaltar según el estado de la distribución
                  producto.diferencia === 0 ? 'bg-green-50 dark:bg-gray-700/30' :
                  producto.diferencia < 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                  'bg-red-50 dark:bg-red-900/10'
                ]"
              >
                <td
                  v-for="column in orderedVisibleColumns"
                  :key="column.key"
                  :class="[
                    'px-4 py-4',
                    column.key === 'expand' ? 'whitespace-nowrap' :
                    column.key === 'codigo' ? 'whitespace-nowrap' :
                    column.key === 'producto' ? '' :
                    column.key === 'total_confirmado' ? 'whitespace-nowrap text-right' :
                    column.key === 'distribuido' ? 'whitespace-nowrap text-right' :
                    column.key === 'diferencia' ? 'whitespace-nowrap text-right' :
                    column.key === 'progreso' ? 'whitespace-nowrap' :
                    column.key === 'estado' ? 'whitespace-nowrap text-center' :
                    column.key === 'acciones' ? 'whitespace-nowrap text-center' :
                    ''
                  ]"
                >
                  <!-- Columna Expand -->
                  <template v-if="column.key === 'expand'">
                    <button
                      @click="toggleExpandirProducto(producto.codigo_producto)"
                      class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg 
                        class="w-5 h-5 transform transition-transform"
                        :class="{ 'rotate-90': productosExpandidosSet.has(producto.codigo_producto) }"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </template>
                  
                  <!-- Columna Código -->
                  <template v-else-if="column.key === 'codigo'">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ producto.codigo_producto }}</div>
                  </template>
                  
                  <!-- Columna Producto -->
                  <template v-else-if="column.key === 'producto'">
                    <div class="text-sm text-gray-900 dark:text-white">{{ producto.descripcion }}</div>
                  </template>
                  
                  <!-- Columna Total Confirmado -->
                  <template v-else-if="column.key === 'total_confirmado'">
                    <div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {{ formatNumber(producto.cantidad_confirmada) }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      ajustado por EL RAYO
                    </div>
                  </template>
                  
                  <!-- Columna Distribuido -->
                  <template v-else-if="column.key === 'distribuido'">
                    <div class="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {{ formatNumber(producto.cantidad_distribuida) }}
                    </div>
                  </template>
                  
                  <!-- Columna Diferencia -->
                  <template v-else-if="column.key === 'diferencia'">
                    <div class="text-sm font-semibold" :class="getDiferenciaClass(producto.diferencia)">
                      {{ producto.diferencia > 0 ? '+' : '' }}{{ formatNumber(producto.diferencia) }}
                    </div>
                  </template>
                  
                  <!-- Columna Progreso -->
                  <template v-else-if="column.key === 'progreso'">
                    <div class="flex flex-col items-center gap-1.5 min-w-[140px]">
                      <!-- Barra de progreso visual -->
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-300"
                          :class="getProgresoBarClass(producto)"
                          :style="{ width: getProgresoPorcentaje(producto) + '%' }"
                        ></div>
                      </div>
                      <!-- Texto de progreso -->
                      <div class="text-xs font-medium" :class="getProgresoTextClass(producto)">
                        {{ formatNumber(producto.cantidad_distribuida) }} / {{ formatNumber(producto.cantidad_confirmada) }}
                      </div>
                    </div>
                  </template>
                  
                  <!-- Columna Estado -->
                  <template v-else-if="column.key === 'estado'">
                    <span 
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="producto.diferencia === 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : producto.diferencia < 0 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'"
                    >
                      {{ producto.diferencia === 0 ? '✓ Completo' : producto.diferencia < 0 ? '⚠ Falta' : '✗ Excede' }}
                    </span>
                  </template>
                  
                  <!-- Columna Acciones -->
                  <template v-else-if="column.key === 'acciones'">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        @click="distribuirProporcionalmente(producto.codigo_producto)"
                        class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Distribuir proporcionalmente"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        @click="copiarDistribucionOriginal(producto.codigo_producto)"
                        class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Copiar distribución original"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        @click="resetearDistribucion(producto.codigo_producto)"
                        class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Resetear distribución"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </template>
                </td>
              </tr>
              
              <!-- Fila Expandida: Distribución a Tiendas -->
              <tr v-if="productosExpandidosSet.has(producto.codigo_producto)">
                <td :colspan="orderedVisibleColumns.length" class="px-0 py-0 bg-gray-50 dark:bg-gray-900/50">
                  <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <!-- Header de la sub-tabla con información del producto -->
                    <div class="mb-4 flex items-start justify-between">
                      <div>
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                          Repartir {{ formatNumber(producto.cantidad_confirmada) }} unidades entre tiendas
                        </h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {{ producto.codigo_producto }} - {{ producto.descripcion }}
                        </p>
                      </div>
                      <div class="text-right">
                        <div class="text-xs text-gray-500 dark:text-gray-400">Regla:</div>
                        <div class="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Suma = {{ formatNumber(producto.cantidad_confirmada) }}
                        </div>
                      </div>
                    </div>
                    
                    <!-- Mensaje de error si existe -->
                    <div v-if="producto.error" class="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 rounded">
                      <div class="flex items-start gap-2">
                        <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p class="text-sm font-medium text-red-800 dark:text-red-200">Error de validación</p>
                          <p class="text-xs text-red-700 dark:text-red-300 mt-0.5">{{ producto.error }}</p>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Advertencia si falta distribuir -->
                    <div v-if="producto.diferencia < 0" class="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded">
                      <div class="flex items-start gap-2">
                        <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Faltan {{ formatNumber(Math.abs(producto.diferencia)) }} unidades por distribuir</p>
                          <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">Debe distribuir exactamente {{ formatNumber(producto.cantidad_confirmada) }} unidades en total</p>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Error si excede -->
                    <div v-if="producto.diferencia > 0" class="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 rounded">
                      <div class="flex items-start gap-2">
                        <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p class="text-sm font-medium text-red-800 dark:text-red-200">Excede por {{ formatNumber(producto.diferencia) }} unidades</p>
                          <p class="text-xs text-red-700 dark:text-red-300 mt-0.5">La suma no puede superar {{ formatNumber(producto.cantidad_confirmada) }} unidades</p>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Tabla simplificada de tiendas -->
                    <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-100 dark:bg-gray-900">
                          <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tienda</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock Base</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad Asignada</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          <tr v-for="tienda in producto.distribucion_tiendas" :key="tienda.tienda_codigo" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td class="px-4 py-3">
                              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ tienda.tienda_codigo }}</div>
                              <div class="text-xs text-gray-500 dark:text-gray-400">{{ tienda.tienda_nombre }}</div>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap text-right">
                              <div class="text-sm text-gray-500 dark:text-gray-400">
                                {{ formatNumber(tienda.cantidad_original) }}
                              </div>
                            </td>
                            <td class="px-4 py-3 whitespace-nowrap">
                              <input
                                type="number"
                                :value="tienda.cantidad_asignada"
                                @input="actualizarCantidadTienda(producto.codigo_producto, tienda.tienda_codigo, $event)"
                                @blur="validarYCorregirCantidad(producto, tienda)"
                                min="0"
                                max="1000000"
                                step="1"
                                class="w-full max-w-[120px] ml-auto px-3 py-2 text-sm text-right border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                                :class="validarCantidadTiendaLocal(producto, tienda) 
                                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 dark:focus:ring-purple-400' 
                                  : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 focus:ring-red-500 dark:focus:ring-red-400'"
                                placeholder="0"
                                :title="validarCantidadTiendaLocal(producto, tienda) 
                                  ? `Cantidad válida (máximo: ${formatNumber(producto.cantidad_confirmada)})` 
                                  : 'Cantidad inválida: excede el total confirmado o límite máximo'"
                              />
                            </td>
                          </tr>
                        </tbody>
                        <tfoot class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600">
                          <tr>
                            <td class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                              Total Distribuido:
                            </td>
                            <td class="px-4 py-3"></td>
                            <td class="px-4 py-3 whitespace-nowrap text-right">
                              <div class="text-sm font-bold" :class="producto.diferencia === 0 ? 'text-green-600 dark:text-green-400' : producto.diferencia < 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'">
                                {{ formatNumber(producto.cantidad_distribuida) }}
                              </div>
                              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                de {{ formatNumber(producto.cantidad_confirmada) }} requeridas
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Barra de Acciones Sticky Bottom -->
    <div v-if="pedidoValue?.respuesta_proveedor" class="sticky bottom-0 z-[5] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex flex-col">
            <span v-if="!puedeConfirmarRedistribucion" class="font-medium text-yellow-600 dark:text-yellow-400">
              ⚠️ Redistribución incompleta
            </span>
            <span v-else class="font-medium text-green-600 dark:text-green-400">
              ✓ Redistribución completa y válida
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <template v-if="!puedeConfirmarRedistribucion">
                {{ getMensajeValidacionRedistribucion(productosArray) }}
              </template>
              <template v-else>
                Todos los productos están correctamente distribuidos
              </template>
            </span>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button
            @click="$emit('guardar-borrador')"
            :disabled="guardandoRedistribucionValue || productosArray.length === 0"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <svg v-if="!guardandoRedistribucionValue" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ guardandoRedistribucionValue ? 'Guardando...' : 'Guardar Borrador' }}
          </button>
          
          <button
            @click="$emit('confirmar-redistribucion')"
            :disabled="!puedeConfirmarRedistribucion || confirmandoRedistribucionValue"
            class="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <svg v-if="!confirmandoRedistribucionValue" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ confirmandoRedistribucionValue ? 'Confirmando redistribución...' : 'Confirmar Redistribución' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import type { PedidoCompleto } from '../types'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import { formatNumber, formatCurrency, type ColumnConfig } from '../utils/formatters'
import { getDiferenciaClass } from '../utils/styleHelpers'
import { 
  getProgresoPorcentaje, 
  getProgresoBarClass, 
  getProgresoTextClass,
  getMensajeValidacionRedistribucion
} from '../utils/redistribucionHelpers'
import { useTablePreferences } from '@/composables/useTablePreferences'
import ExcelLikeGridView from './ExcelLikeGridView.vue'

interface Props {
  pedido: PedidoCompleto | null
  esModoMabelTrading: boolean
  productosRedistribucion: Ref<ProductoRedistribucion[]>
  productosExpandidos: Ref<Set<string>>
  guardandoRedistribucion: Ref<boolean>
  confirmandoRedistribucion: Ref<boolean>
  columnasModificadas?: Ref<Set<string>>
}

interface Emits {
  (e: 'toggle-expandir-producto', codigoProducto: string): void
  (e: 'actualizar-cantidad-tienda', codigoProducto: string, tiendaCodigo: string, event: Event): void
  (e: 'validar-y-corregir-cantidad', producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada): void
  (e: 'distribuir-proporcionalmente', codigoProducto: string): void
  (e: 'copiar-distribucion-original', codigoProducto: string): void
  (e: 'resetear-distribucion', codigoProducto: string): void
  (e: 'guardar-borrador'): void
  (e: 'confirmar-redistribucion'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Estado para el modo de vista
const modoVista = ref<'compacta' | 'excel'>('compacta')

// ⭐ Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)

// Definir columnas disponibles para la tabla de redistribución
const availableColumns: ColumnConfig[] = [
  { key: 'expand', label: '', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'codigo', label: 'Código', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'producto', label: 'Producto', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'total_confirmado', label: 'Total Confirmado', visible: true, align: 'right', format: 'number' },
  { key: 'distribuido', label: 'Distribuido', visible: true, align: 'right', format: 'number' },
  { key: 'diferencia', label: 'Diferencia', visible: true, align: 'right', format: 'number' },
  { key: 'progreso', label: 'Progreso', visible: true, align: 'center', format: 'text' },
  { key: 'estado', label: 'Estado', visible: true, align: 'center', format: 'text' },
  { key: 'acciones', label: 'Acciones', visible: true, align: 'center', format: 'text' }
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
  tableId: 'redistribucion-tiendas',
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

// Alias para pedido para consistencia con el template
const pedidoValue = computed(() => props.pedido)
const esModoMabelTradingValue = computed(() => props.esModoMabelTrading)

// Computed para productos (unwrap del Ref para TypeScript)
const productosArray = computed(() => props.productosRedistribucion.value || [])
const productosExpandidosSet = computed(() => props.productosExpandidos.value)

// Unwrap de refs booleanos para TypeScript
const guardandoRedistribucionValue = computed(() => props.guardandoRedistribucion.value)
const confirmandoRedistribucionValue = computed(() => props.confirmandoRedistribucion.value)

// Computed para resumen de redistribución
const resumenRedistribucion = computed(() => {
  if (productosArray.value.length === 0) {
    return {
      total_solicitado: 0,
      total_confirmado: 0,
      total_distribuido: 0,
      diferencia_pendiente: 0
    }
  }
  
  const total_solicitado = productosArray.value.reduce((sum, p) => sum + p.cantidad_solicitada, 0)
  const total_confirmado = productosArray.value.reduce((sum, p) => sum + p.cantidad_confirmada, 0)
  const total_distribuido = productosArray.value.reduce((sum, p) => sum + p.cantidad_distribuida, 0)
  const diferencia_pendiente = total_confirmado - total_distribuido
  
  return {
    total_solicitado,
    total_confirmado,
    total_distribuido,
    diferencia_pendiente
  }
})

// Validar si se puede confirmar
const puedeConfirmarRedistribucion = computed(() => {
  return resumenRedistribucion.value.diferencia_pendiente === 0 &&
         productosArray.value.every(p => p.diferencia === 0) &&
         productosArray.value.every(p => !p.error)
})

/**
 * ⭐ Computed que mapea cada producto a si tiene modificaciones
 * Esto asegura reactividad completa y que el resaltado se aplique inmediatamente
 * 
 * IMPORTANTE: Accede directamente a props.columnasModificadas?.value para que Vue rastree la dependencia
 */
const productosConModificaciones = computed(() => {
  const map = new Map<string, boolean>()
  
  // ⭐ Acceder directamente a las props para que Vue rastree las dependencias
  // Esto asegura que el computed se recalcule cuando cambien las columnas modificadas
  const columnasModificadasValue = props.columnasModificadas?.value
  const pedidoDetalles = props.pedido?.detalles
  
  if (!columnasModificadasValue || !pedidoDetalles || productosArray.value.length === 0) {
    return map
  }
  
  productosArray.value.forEach(producto => {
    // ⭐ PRIORIDAD 1: Usar campos del backend si están disponibles
    if (producto.costo_modificado_manual === true || producto.total_modificado_manual === true) {
      map.set(producto.codigo_producto, true)
      return
    }
    
    // ⭐ PRIORIDAD 2: Verificar columnasModificadas (heredar del flujo anterior - EL RAYO)
    // Esta es la fuente principal para heredar el resaltado del flujo anterior
    const detallePedido = pedidoDetalles.find(
      d => d.codigo_interno === producto.codigo_producto
    )
    
    if (!detallePedido?.pedido_detalle_id) {
      map.set(producto.codigo_producto, false)
      return
    }
    
    // ⭐ Solo verificar columnas COSTO UNIT y TOTAL (no comentario)
    // Estas son las columnas que se resaltan en color ámbar en la interfaz de EL RAYO
    const columnasParaResaltar = ['costo_doc_sin_iva', 'total']
    
    const tieneMod = columnasParaResaltar.some(columnaKey => {
      const key = `${detallePedido.pedido_detalle_id}:${columnaKey}`
      const existe = columnasModificadasValue.has(key)
      return existe
    })
    
    map.set(producto.codigo_producto, tieneMod)
  })
  
  // Log para depuración
  const productosConMod = Array.from(map.entries()).filter(([_, tieneMod]) => tieneMod)
  if (productosConMod.length > 0) {
    console.log(`🎨 [RedistribucionTiendas] ${productosConMod.length} productos con modificaciones heredadas:`, productosConMod.map(([codigo]) => codigo))
  }
  
  return map
})

// ⭐ Watch para forzar reactividad cuando cambien las columnas modificadas
// Esto asegura que el resaltado se actualice inmediatamente cuando se carguen las columnas
watch(
  () => props.columnasModificadas?.value,
  (newValue) => {
    if (newValue) {
      console.log(`🔄 [RedistribucionTiendas] Columnas modificadas actualizadas: ${newValue.size} modificaciones`)
      // Acceder al computed para forzar su recálculo
      const _ = productosConModificaciones.value
    }
  },
  { deep: true, immediate: true }
)

/**
 * Verifica si un producto tiene modificaciones en COSTO UNIT o TOTAL (columnas modificadas por EL RAYO)
 * ⭐ MEJORADO: Ahora usa el computed reactivo para asegurar que el resaltado se aplique inmediatamente
 */
function tieneModificaciones(producto: ProductoRedistribucion): boolean {
  // Usar el computed reactivo que ya tiene toda la lógica
  // Esto asegura que el resaltado se aplique inmediatamente al cargar la página
  return productosConModificaciones.value.get(producto.codigo_producto) || false
}

// Funciones que emiten eventos
function toggleExpandirProducto(codigoProducto: string) {
  emit('toggle-expandir-producto', codigoProducto)
}

function actualizarCantidadTienda(codigoProducto: string, tiendaCodigo: string, event: Event) {
  emit('actualizar-cantidad-tienda', codigoProducto, tiendaCodigo, event)
}

// Función wrapper para usar con ExcelLikeGridView (mismo comportamiento)
function handleActualizarCantidadTienda(codigoProducto: string, tiendaCodigo: string, event: Event) {
  actualizarCantidadTienda(codigoProducto, tiendaCodigo, event)
}

function handleValidarYCorregirCantidad(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada) {
  validarYCorregirCantidad(producto, tienda)
}

function validarYCorregirCantidad(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada) {
  emit('validar-y-corregir-cantidad', producto, tienda)
}

function validarCantidadTiendaLocal(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada): boolean {
  // No puede ser negativo
  if (tienda.cantidad_asignada < 0) return false
  
  // Calcular suma total actual (sumando todas las tiendas, incluyendo la que se está editando)
  const sumaActual = producto.distribucion_tiendas.reduce((sum, t) => {
    return sum + (t.cantidad_asignada || 0)
  }, 0)
  
  // La suma no puede exceder la cantidad confirmada
  return sumaActual <= producto.cantidad_confirmada
}

function distribuirProporcionalmente(codigoProducto: string) {
  emit('distribuir-proporcionalmente', codigoProducto)
}

function copiarDistribucionOriginal(codigoProducto: string) {
  emit('copiar-distribucion-original', codigoProducto)
}

function resetearDistribucion(codigoProducto: string) {
  emit('resetear-distribucion', codigoProducto)
}

// Agregar listener para cerrar dropdown al hacer click fuera
onMounted(() => {
  document.addEventListener('click', handleClickOutsideColumnSelector)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideColumnSelector)
})
</script>