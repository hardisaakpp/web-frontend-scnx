<template>
  <!-- ⭐ FASE 4: Ajuste y Redistribución a Tiendas -->
  <!-- Se muestra siempre en modo MABEL TRADING -->
  <div v-if="esModoMabelTradingValue" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
    <!-- Header Sticky con Indicadores Globales -->
    <div class="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ajuste y Redistribución a Tiendas</h2>
      
      <!-- Estado cuando no hay respuesta del proveedor -->
      <div v-if="!pedidoValue?.respuesta_proveedor" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Esperando respuesta del proveedor</p>
            <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              La sección de redistribución estará disponible una vez que EL RAYO cargue la respuesta del proveedor con las cantidades confirmadas.
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

    <!-- Contenido Principal: Tabla de Productos y Panel Lateral -->
    <div v-if="pedidoValue?.respuesta_proveedor" class="p-6 flex flex-col lg:flex-row gap-6">
      <!-- Tabla Principal -->
      <div class="flex-1 overflow-x-auto min-w-0">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"></th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Confirmado</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Distribuido</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diferencia</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[140px]">Progreso</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <template v-for="producto in productosRedistribucion" :key="producto.codigo_producto">
              <!-- Fila Principal del Producto -->
              <tr 
                :class="[
                  'transition-colors',
                  producto.diferencia === 0 ? 'bg-green-50 dark:bg-green-900/10' :
                  producto.diferencia < 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                  'bg-red-50 dark:bg-red-900/10'
                ]"
              >
                <td class="px-4 py-4 whitespace-nowrap">
                  <button
                    @click="toggleExpandirProducto(producto.codigo_producto)"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg 
                      class="w-5 h-5 transform transition-transform"
                      :class="{ 'rotate-90': productosExpandidos.has(producto.codigo_producto) }"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ producto.codigo_producto }}</div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-gray-900 dark:text-white">{{ producto.descripcion }}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-right">
                  <div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {{ formatNumber(producto.cantidad_confirmada) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    ajustado por EL RAYO
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-right">
                  <div class="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {{ formatNumber(producto.cantidad_distribuida) }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-right">
                  <div class="text-sm font-semibold" :class="getDiferenciaClass(producto.diferencia)">
                    {{ producto.diferencia > 0 ? '+' : '' }}{{ formatNumber(producto.diferencia) }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
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
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-center">
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
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-center">
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
                </td>
              </tr>
              
              <!-- Fila Expandida: Distribución a Tiendas -->
              <tr v-if="productosExpandidos.has(producto.codigo_producto)">
                <td colspan="9" class="px-0 py-0 bg-gray-50 dark:bg-gray-900/50">
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
                                step="1"
                                class="w-full max-w-[120px] ml-auto px-3 py-2 text-sm text-right border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                                :class="validarCantidadTiendaLocal(producto, tienda) 
                                  ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 dark:focus:ring-purple-400' 
                                  : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 focus:ring-red-500 dark:focus:ring-red-400'"
                                placeholder="0"
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
      
      <!-- Panel Lateral de Impacto Económico (Sticky) -->
      <div class="w-full lg:w-80 flex-shrink-0">
        <div class="sticky top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Impacto Económico</h3>
          
          <div class="space-y-3">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo Unit. Promedio</label>
              <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(impactoEconomico.costo_unitario_promedio) }}
              </p>
            </div>
            
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <label class="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Subtotal Original</label>
              <p class="mt-1 text-sm font-semibold text-blue-900 dark:text-blue-200">
                {{ formatCurrency(impactoEconomico.subtotal_original) }}
              </p>
            </div>
            
            <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <label class="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">Subtotal Ajustado</label>
              <p class="mt-1 text-sm font-semibold text-purple-900 dark:text-purple-200">
                {{ formatCurrency(impactoEconomico.subtotal_ajustado) }}
              </p>
            </div>
            
            <div 
              class="rounded-lg p-3 border-2"
              :class="impactoEconomico.diferencia_economica >= 0 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'"
            >
              <label 
                class="text-xs font-medium uppercase"
                :class="impactoEconomico.diferencia_economica >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'"
              >
                {{ impactoEconomico.diferencia_economica >= 0 ? 'Ahorro' : 'Incremento' }}
              </label>
              <p 
                class="mt-1 text-lg font-semibold"
                :class="impactoEconomico.diferencia_economica >= 0 
                  ? 'text-green-900 dark:text-green-200' 
                  : 'text-red-900 dark:text-red-200'"
              >
                {{ formatCurrency(Math.abs(impactoEconomico.diferencia_economica)) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Barra de Acciones Sticky Bottom -->
    <div v-if="pedidoValue?.respuesta_proveedor" class="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 shadow-lg">
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
                {{ getMensajeValidacionRedistribucion(productosRedistribucion) }}
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
            :disabled="guardandoRedistribucion || productosRedistribucion.length === 0"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <svg v-if="!guardandoRedistribucion" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ guardandoRedistribucion ? 'Guardando...' : 'Guardar Borrador' }}
          </button>
          
          <button
            @click="$emit('confirmar-redistribucion')"
            :disabled="!puedeConfirmarRedistribucion || confirmandoRedistribucion"
            class="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <svg v-if="!confirmandoRedistribucion" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ confirmandoRedistribucion ? 'Confirmando...' : 'Confirmar Redistribución' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Ref } from 'vue'
import type { PedidoCompleto } from '../types'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import { formatNumber, formatCurrency } from '../utils/formatters'
import { getDiferenciaClass } from '../utils/styleHelpers'
import { 
  getProgresoPorcentaje, 
  getProgresoBarClass, 
  getProgresoTextClass,
  getMensajeValidacionRedistribucion
} from '../utils/redistribucionHelpers'

interface Props {
  pedido: PedidoCompleto | null
  esModoMabelTrading: boolean
  productosRedistribucion: Ref<ProductoRedistribucion[]>
  productosExpandidos: Ref<Set<string>>
  guardandoRedistribucion: Ref<boolean>
  confirmandoRedistribucion: Ref<boolean>
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

// Alias para pedido para consistencia con el template
const pedidoValue = computed(() => props.pedido)
const esModoMabelTradingValue = computed(() => props.esModoMabelTrading)

// Computed para resumen de redistribución
const resumenRedistribucion = computed(() => {
  if (props.productosRedistribucion.value.length === 0) {
    return {
      total_solicitado: 0,
      total_confirmado: 0,
      total_distribuido: 0,
      diferencia_pendiente: 0
    }
  }
  
  const total_solicitado = props.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_solicitada, 0)
  const total_confirmado = props.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_confirmada, 0)
  const total_distribuido = props.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_distribuida, 0)
  const diferencia_pendiente = total_confirmado - total_distribuido
  
  return {
    total_solicitado,
    total_confirmado,
    total_distribuido,
    diferencia_pendiente
  }
})

// Computed para impacto económico
const impactoEconomico = computed(() => {
  let costo_unitario_total = 0
  let subtotal_original = 0
  let subtotal_ajustado = 0
  let diferencia_economica = 0
  
  props.productosRedistribucion.value.forEach(producto => {
    const costo = producto.costo_unitario || 0
    costo_unitario_total += costo
    subtotal_original += producto.cantidad_solicitada * costo
    subtotal_ajustado += producto.cantidad_distribuida * costo
  })
  
  diferencia_economica = subtotal_ajustado - subtotal_original
  
  return {
    costo_unitario_promedio: props.productosRedistribucion.value.length > 0 
      ? costo_unitario_total / props.productosRedistribucion.value.length 
      : 0,
    subtotal_original,
    subtotal_ajustado,
    diferencia_economica
  }
})

// Validar si se puede confirmar
const puedeConfirmarRedistribucion = computed(() => {
  return resumenRedistribucion.value.diferencia_pendiente === 0 &&
         props.productosRedistribucion.value.every(p => p.diferencia === 0) &&
         props.productosRedistribucion.value.every(p => !p.error)
})

// Funciones que emiten eventos
function toggleExpandirProducto(codigoProducto: string) {
  emit('toggle-expandir-producto', codigoProducto)
}

function actualizarCantidadTienda(codigoProducto: string, tiendaCodigo: string, event: Event) {
  emit('actualizar-cantidad-tienda', codigoProducto, tiendaCodigo, event)
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
</script>