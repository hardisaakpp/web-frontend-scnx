<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header con botones de acción -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Detalle del Pedido</h1>
        </div>
        <div class="flex items-center gap-3">
          <!-- Búsqueda directa de pedidos -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref="pedidoInputRef"
              v-model="pedidoIdInput"
              @keyup.enter="goToPedido"
              @focus="showSearchHelp = true"
              @blur="handleSearchBlur"
              type="text"
              placeholder="Buscar por N° de pedido (ej: P-12.48 - 12 - 2025)"
              :class="[
                'w-80 pl-10 pr-10 py-2 border rounded-lg text-sm transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                pedidoIdInput && !isValidPedido
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'
              ]"
            />
            <button
              v-if="pedidoIdInput"
              @click="pedidoIdInput = ''"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Limpiar búsqueda"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <!-- Texto de ayuda contextual -->
            <div
              v-if="showSearchHelp && pedidoIdInput && !isValidPedido"
              class="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-2 z-10"
            >
              <p class="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Formato inválido</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Ejemplo válido: <span class="font-mono text-purple-600 dark:text-purple-400">P-12.48 - 12 - 2025</span></p>
            </div>
          </div>
          <button
            @click="goToCargarPlantillas"
            :disabled="uploading"
            class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <svg v-if="!uploading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ uploading ? 'Cargando...' : 'Cargar Plantillas Excel' }}
          </button>
          <button
            v-if="canViewReporteDiferencias"
            @click="handleViewReporteDiferencias"
            :disabled="loading"
            class="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ver Reporte de Diferencias
          </button>
          <button
            v-if="canProcesarConfirmacion"
            @click="showProcesarModal = true"
            :disabled="loading || procesandoConfirmacion"
            class="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <svg v-if="!procesandoConfirmacion" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ procesandoConfirmacion ? 'Procesando...' : 'Procesar Confirmación' }}
          </button>
          <button
            v-if="canExportForProvider"
            @click="handleExportForProvider"
            :disabled="loading"
            class="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar para Proveedor
          </button>
          <button
            v-if="canGenerarOC"
            @click="handleGenerarOCDesdePedido"
            :disabled="loading || generandoOC"
            class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <svg v-if="!generandoOC" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ generandoOC ? 'Generando...' : 'Generar Orden de Compra' }}
          </button>
        </div>
      </div>

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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información del Pedido</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número de Pedido</label>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.numero_pedido || 'N/A' }}</p>
                <button
                  v-if="pedido.cabecera.numero_pedido"
                  @click="copyToClipboard(pedido.cabecera.numero_pedido)"
                  :title="copyFeedback ? 'Copiado!' : 'Copiar número de pedido'"
                  class="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200"
                  :class="{ 'text-green-600 dark:text-green-400': copyFeedback }"
                >
                  <svg v-if="!copyFeedback" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Pedido</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.cabecera.fecha_pedido) }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Entrega</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.cabecera.fecha_entrega) }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.proveedor_nombre || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comprador</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.comprador_nombre || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Forma de Pago</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.forma_pago || 'N/A' }}</p>
            </div>
            <div v-if="pedido.cabecera.estado">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado del Pedido</label>
              <p class="mt-1">
                <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getEstadoPedidoBadgeClass(pedido.cabecera.estado)">
                  {{ formatEstadoPedido(pedido.cabecera.estado) }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Sección de Respuesta del Proveedor -->
        <div v-if="pedido.respuesta_proveedor" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Respuesta del Proveedor</h2>
            <span class="px-3 py-1 text-xs font-medium rounded-full" :class="getEstadoBadgeClass(pedido.respuesta_proveedor.cabecera.estado)">
              {{ pedido.respuesta_proveedor.cabecera.estado }}
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Versión</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.respuesta_proveedor.cabecera.version }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Respuesta</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.respuesta_proveedor.cabecera.fecha_respuesta) }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creado por</label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.respuesta_proveedor.cabecera.creado_por }}</p>
            </div>
          </div>

          <!-- Tabla comparativa: Solicitado vs Confirmado -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitado</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confirmado</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio Original</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio Ajustado</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Observaciones</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="detalle in pedido.respuesta_proveedor.detalles" :key="detalle.codigo_producto">
                  <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ detalle.codigo_producto }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ detalle.descripcion }}</div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {{ formatNumber(detalle.cantidad_solicitada_total) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="getCantidadClass(detalle.cantidad_solicitada_total, detalle.cantidad_confirmada_total)">
                    {{ formatNumber(detalle.cantidad_confirmada_total) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {{ formatCurrency(detalle.costo_doc_sin_iva_original) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="getPrecioClass(detalle.costo_doc_sin_iva_original, detalle.costo_doc_sin_iva_ajustado)">
                    {{ formatCurrency(detalle.costo_doc_sin_iva_ajustado) }}
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {{ detalle.observaciones || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Reporte de Diferencias -->
        <div v-if="reporteDiferencias" data-reporte-diferencias class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Reporte de Diferencias</h2>
            <button
              @click="handleExportReporteDiferencias"
              class="px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border border-purple-300 dark:border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
            </button>
          </div>

          <!-- Resumen -->
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 transition-colors duration-300">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Productos</label>
                <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ reporteDiferencias.resumen.total_productos }}</p>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Solicitado</label>
                <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(reporteDiferencias.resumen.total_solicitado) }}</p>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Confirmado</label>
                <p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(reporteDiferencias.resumen.total_confirmado) }}</p>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Diferencia</label>
                <p class="mt-1 text-lg font-semibold" :class="getDiferenciaClass(reporteDiferencias.resumen.total_diferencia)">
                  {{ formatNumber(reporteDiferencias.resumen.total_diferencia) }}
                </p>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% Confirmación</label>
                <p class="mt-1 text-lg font-semibold" :class="getPorcentajeClass(reporteDiferencias.resumen.porcentaje_confirmacion)">
                  {{ formatPorcentaje(reporteDiferencias.resumen.porcentaje_confirmacion) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tabla de diferencias -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitado</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confirmado</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Diferencia</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Diferencia</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Costo Original</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Costo Ajustado</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cambio Precio</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="item in reporteDiferencias.detalle" :key="item.codigo_producto" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ item.codigo_producto }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.descripcion }}</div>
                    <div v-if="item.observaciones" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <span class="italic">{{ item.observaciones }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {{ formatNumber(item.cantidad_solicitada) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {{ formatNumber(item.cantidad_confirmada) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" :class="getDiferenciaClass(item.diferencia)">
                    {{ formatNumber(item.diferencia) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="getPorcentajeDiferenciaClass(item.porcentaje_diferencia)">
                    {{ formatPorcentaje(item.porcentaje_diferencia) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {{ formatCurrency(item.costo_original) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="item.cambio_precio ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-900 dark:text-white'">
                    {{ formatCurrency(item.costo_ajustado) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-center">
                    <span v-if="item.cambio_precio" class="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full">
                      Sí
                    </span>
                    <span v-else class="text-xs text-gray-400 dark:text-gray-500">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Distribución por tienda (expandible) -->
          <div v-if="reporteDiferencias.detalle.some(item => item.distribucion_tiendas && item.distribucion_tiendas.length > 0)" class="mt-6">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Distribución por Tienda</h3>
            <div class="space-y-4">
              <details v-for="item in reporteDiferencias.detalle.filter(i => i.distribucion_tiendas && i.distribucion_tiendas.length > 0)" :key="item.codigo_producto" class="border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
                <summary class="px-4 py-3 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white transition-colors">
                  {{ item.codigo_producto }} - {{ item.descripcion }}
                </summary>
                <div class="p-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div v-for="tienda in item.distribucion_tiendas" :key="tienda.tienda_codigo" class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3 transition-colors duration-300">
                      <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{{ tienda.tienda_codigo }}</div>
                      <div class="text-sm text-gray-600 dark:text-gray-300 mt-1">{{ tienda.tienda_nombre }}</div>
                      <div class="text-lg font-semibold text-gray-900 dark:text-white mt-2">{{ formatNumber(tienda.cantidad) }}</div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

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
                    class="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      :checked="column.visible"
                      @change="toggleColumnVisibility(column.key)"
                      class="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ column.label }}</span>
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
                    draggable="true"
                    @dragstart="handleDragStart(index)"
                    @dragover.prevent="handleDragOver(index)"
                    @drop.prevent="handleDrop(index)"
                    @dragend="handleDragEnd"
                    :class="[
                      'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-move select-none',
                      column.align === 'right' ? 'text-right' : 'text-left',
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
                  v-for="detalle in pedido.detalles" 
                  :key="detalle.pedido_detalle_id"
                  :class="{
                    'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400': filasModificadas.has(detalle.pedido_detalle_id)
                  }"
                >
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-4 text-sm',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : '',
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
                        step="0.01"
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
                      <template v-else>{{ formatColumnValue(detalle, column) }}</template>
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
                      column.align === 'right' ? 'text-right whitespace-nowrap' : 'text-left',
                      'text-gray-900 dark:text-white'
                    ]"
                  >
                    <template v-if="column.key === 'costo_doc_sin_iva'">
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
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
          <button
            @click="showErrorModal = false"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
                  {{ uploadErrorInfo.title === 'Productos no encontrados en SAP' ? 'Códigos inválidos' : 'Revisar y corregir' }}
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
            <div v-if="uploadErrorInfo.title === 'Productos no encontrados en SAP'" class="bg-amber-50 dark:bg-amber-900/30 border-t border-amber-200 dark:border-amber-800 px-4 py-3 transition-colors duration-300">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-xs font-medium text-amber-900 dark:text-amber-200">Acciones recomendadas:</p>
                  <ul class="text-xs text-amber-800 dark:text-amber-300 mt-1 space-y-1 ml-2">
                    <li>• Verifica que los códigos de producto estén escritos correctamente</li>
                    <li>• Confirma que los productos estén registrados en SAP</li>
                    <li>• Contacta al área de maestros si el producto es nuevo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

            <!-- Botones de acción -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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

    <!-- Modal para procesar confirmación -->
    <div v-if="showProcesarModal" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4" @click.self="showProcesarModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Procesar Confirmación del Proveedor</h3>
          <button
            @click="showProcesarModal = false"
            :disabled="procesandoConfirmacion"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Al procesar la confirmación, el sistema:
          </p>
          <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-2">
            <li>Ajustará las cantidades por tienda para que coincidan con el total confirmado</li>
            <li>Recalculará los costos si hubo cambios de precio</li>
            <li>Generará un reporte de diferencias</li>
          </ul>

          <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 transition-colors duration-300">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-yellow-900 dark:text-yellow-200">Esta acción no se puede deshacer</p>
                <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Una vez procesada, la respuesta será marcada como aprobada y el pedido será ajustado.</p>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              id="forzarRedistribucion"
              v-model="forzarRedistribucion"
              :disabled="procesandoConfirmacion"
              class="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            />
            <label for="forzarRedistribucion" class="text-sm text-gray-700 dark:text-gray-300">
              <span class="font-medium">Forzar redistribución proporcional</span>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Si está marcado, siempre redistribuirá proporcionalmente, ignorando cualquier distribución específica del proveedor.
              </p>
            </label>
          </div>

          <div class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="handleProcesarConfirmacion"
              :disabled="procesandoConfirmacion"
              class="flex-1 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg v-if="!procesandoConfirmacion" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ procesandoConfirmacion ? 'Procesando...' : 'Procesar Confirmación' }}
            </button>
            <button
              @click="showProcesarModal = false"
              :disabled="procesandoConfirmacion"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { PedidoCompleto, ProcesarConfirmacionResponse, ReporteDiferenciasResponse, UploadPlantillaResponse } from '../types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const pedido = ref<PedidoCompleto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Búsqueda directa de pedidos
const pedidoIdInput = ref('')
const pedidoInputRef = ref<HTMLInputElement | null>(null)
const showSearchHelp = ref(false)

// Copiar número de pedido al portapapeles
const copyFeedback = ref(false)

// Cargar plantillas (sin modal - selector directo)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

// Fase 4: Procesar confirmación
const showProcesarModal = ref(false)
const procesandoConfirmacion = ref(false)
const forzarRedistribucion = ref(false)
const procesarConfirmacionResult = ref<ProcesarConfirmacionResponse | null>(null)
const reporteDiferencias = ref<ReporteDiferenciasResponse | null>(null)
const loadingReporte = ref(false)
const generandoOC = ref(false)

// Modal de errores de carga de archivo
const showErrorModal = ref(false)
const uploadErrorInfo = ref<{
  title?: string
  message: string
  fileName?: string
  errors?: Array<string | { tipo?: string; campo?: string; mensaje: string; producto?: string }>
} | null>(null)

// Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)
const draggedColumnIndex = ref<number | null>(null)
const dragOverColumnIndex = ref<number | null>(null)

// Gestión de edición inline de costo unitario, total y comentario
interface EditingCell {
  detalleId: string
  value: string
  originalValue: number | string | null
  fieldType: 'costo' | 'total' | 'comentario' // ⭐ NUEVO: Tipo de campo que se está editando
}
const editingCell = ref<EditingCell | null>(null)
let editingInputElement: HTMLInputElement | null = null

// ⭐ Set para rastrear filas modificadas
const filasModificadas = ref<Set<string>>(new Set())

// ⭐ EXTENSIÓN DEL TIPO: Agregar comentario al tipo PedidoDetalle localmente
interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  align?: 'left' | 'right'
  format?: 'text' | 'number' | 'currency'
}

// ⭐ CAMBIO: Array estático en lugar de ref
const availableColumns: ColumnConfig[] = [
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
const defaultVisibleColumns = availableColumns.filter(col => col.visible).map(col => col.key)
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
const orderedVisibleColumns = computed(() => {
  return orderedVisibleColumnKeys.value
    .map(key => availableColumns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined)
})

// ⭐ NUEVO: Computed para obtener todas las columnas con su estado de visibilidad
const availableColumnsWithVisibility = computed(() => {
  return availableColumns.map(col => ({
    ...col,
    visible: visibleColumns.value.includes(col.key)
  }))
})

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

const canExportForProvider = computed(() => {
  // Permitir exportar si no hay respuesta aún o si el estado lo permite
  return !pedido.value?.respuesta_proveedor
})


const canProcesarConfirmacion = computed(() => {
  // Permitir procesar si hay respuesta y está en estado PENDIENTE_REVISION
  return pedido.value?.respuesta_proveedor?.cabecera.estado === 'PENDIENTE_REVISION' ||
         pedido.value?.cabecera.estado === 'RESPUESTA_PROVEEDOR_CARGADA'
})

const canViewReporteDiferencias = computed(() => {
  // Permitir ver reporte si hay respuesta aprobada o si ya se procesó la confirmación
  return pedido.value?.respuesta_proveedor?.cabecera.estado === 'APROBADA' ||
         pedido.value?.cabecera.estado === 'CONFIRMADO_PROVEEDOR' ||
         pedido.value?.cabecera.estado === 'CONFIRMADO_ENVIADO' ||
         reporteDiferencias.value !== null
})

const canGenerarOC = computed(() => {
  // Permitir generar OC si el pedido está confirmado por proveedor
  const estado = pedido.value?.cabecera.estado
  return estado === 'CONFIRMADO_PROVEEDOR'
})

// Validación de número de pedido en tiempo real
const isValidPedido = computed(() => {
  const trimmed = pedidoIdInput.value.trim()
  if (!trimmed) return true // Vacio es válido (no muestra error hasta que escriba)
  
  // Permitir letras, números, guiones, puntos, espacios
  // Longitud mínima: 5 caracteres
  // Formato flexible: P-12.48 - 12 - 2025, ODC-12345, etc.
  return /^[A-Za-z0-9.\-\s]{5,}$/.test(trimmed)
})

async function loadPedido() {
  loading.value = true
  error.value = null
  
  try {
    // Cargar pedido usando numero_pedido del parámetro de ruta
    if (!numeroPedido.value) {
      error.value = 'Número de pedido no válido'
      return
    }
    
    pedido.value = await mba3ConsultasService.getPedido(numeroPedido.value, true)
    
    // Si hay respuesta aprobada, cargar el reporte de diferencias
    if (pedido.value?.respuesta_proveedor?.cabecera.estado === 'APROBADA' ||
        pedido.value?.cabecera.estado === 'CONFIRMADO_PROVEEDOR' ||
        pedido.value?.cabecera.estado === 'CONFIRMADO_ENVIADO') {
      await loadReporteDiferencias()
    }
  } catch (e: any) {
    const errorMessage = e.message || 'Error al cargar el pedido'
    error.value = errorMessage
    toast.error('Error', errorMessage)
  } finally {
    loading.value = false
  }
}

async function loadReporteDiferencias() {
  // Usar numero_pedido para obtener el reporte
  if (!numeroPedido.value) return
  
  loadingReporte.value = true
  try {
    reporteDiferencias.value = await mba3ConsultasService.getReporteDiferencias(numeroPedido.value, 'json') as ReporteDiferenciasResponse
  } catch (e: any) {
    // Si es 404, simplemente no mostrar el reporte (aún no procesado)
    if (e.message?.includes('404') || e.message?.includes('No existe reporte')) {
      reporteDiferencias.value = null
    } else {
      console.error('Error al cargar reporte de diferencias:', e)
      // No mostrar error al usuario si no existe aún
    }
  } finally {
    loadingReporte.value = false
  }
}

// ⭐ ELIMINADO: loadTablePreferences, saveTablePreferences, debouncedSavePreferences
// El composable useTablePreferences maneja esto automáticamente

async function handleProcesarConfirmacion() {
  if (!pedido.value || !numeroPedido.value) return
  
  procesandoConfirmacion.value = true
  
  try {
    const result = await mba3ConsultasService.procesarConfirmacionProveedor(
      numeroPedido.value,
      forzarRedistribucion.value
    )
    
    procesarConfirmacionResult.value = result
    reporteDiferencias.value = {
      pedido_id: result.pedido_id,
      numero_pedido: pedido.value.cabecera.numero_pedido,
      resumen: result.resumen,
      detalle: result.reporte_diferencias
    }
    
    toast.success('Confirmación procesada', result.message)
    showProcesarModal.value = false
    
    // Recargar el pedido para actualizar estados
    await loadPedido()
  } catch (e: any) {
    // Manejar error 409 (ya procesado)
    if ((e as any).isConflict || (e as any).statusCode === 409) {
      toast.info('Ya procesado', e.message || 'Esta respuesta ya fue procesada anteriormente')
      showProcesarModal.value = false
      // Cargar el reporte existente
      await loadReporteDiferencias()
    } else {
      toast.error('Error al procesar', e.message || 'No se pudo procesar la confirmación')
    }
  } finally {
    procesandoConfirmacion.value = false
  }
}

async function handleGenerarOCDesdePedido() {
  if (!pedido.value || !numeroPedido.value) return
  
  generandoOC.value = true
  
  try {
    toast.info('Generando orden de compra...', 'Creando orden de compra desde el pedido confirmado')
    
    const result = await mba3ConsultasService.crearOrdenCompraDesdePedido(numeroPedido.value)
    
    if (result.status === 'success') {
      toast.success(
        'Orden de compra generada',
        result.message || 'La orden de compra se ha generado exitosamente'
      )
      
      // Recargar el pedido para actualizar estados
      await loadPedido()
      
      // Redirigir a la vista de órdenes de compra después de un breve delay
      setTimeout(() => {
        router.push('/mba3-consultas/proceso-completo?tab=procesar-oc')
      }, 1500)
    } else {
      toast.error('Error al generar orden', result.message || 'No se pudo generar la orden de compra')
    }
  } catch (e: any) {
    console.error('Error al generar orden de compra:', e)
    toast.error('Error al generar orden', e.message || 'No se pudo generar la orden de compra')
  } finally {
    generandoOC.value = false
  }
}

async function handleViewReporteDiferencias() {
  if (!reporteDiferencias.value) {
    await loadReporteDiferencias()
  }
  
  // Scroll al reporte
  if (reporteDiferencias.value) {
    setTimeout(() => {
      const reporteElement = document.querySelector('[data-reporte-diferencias]')
      if (reporteElement) {
        reporteElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }
}

async function handleExportReporteDiferencias() {
  if (!pedido.value || !numeroPedido.value) return
  
  try {
    const blob = await mba3ConsultasService.getReporteDiferencias(numeroPedido.value, 'excel') as Blob
    
    // Crear URL del blob y descargar
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const numeroPedidoParaDescarga = pedido.value.cabecera.numero_pedido || numeroPedido.value
    a.download = `Reporte_Diferencias_${numeroPedidoParaDescarga}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Reporte exportado', 'El reporte de diferencias se ha descargado correctamente')
  } catch (e: any) {
    toast.error('Error al exportar', e.message || 'No se pudo exportar el reporte')
  }
}

async function handleExportForProvider() {
  if (!pedido.value || !numeroPedido.value) return
  
  try {
    const blob = await mba3ConsultasService.exportarPedidoParaProveedor(numeroPedido.value)
    
    // Crear URL del blob y descargar
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Pedido_${pedido.value.cabecera.numero_pedido || numeroPedido.value}_Proveedor.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Archivo exportado', 'El archivo Excel se ha descargado correctamente')
  } catch (e: any) {
    toast.error('Error al exportar', e.message || 'No se pudo exportar el archivo')
  }
}

// Función para validar archivo
function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedExtensions = ['.xlsx', '.xls']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  
  if (!allowedExtensions.includes(fileExtension)) {
    return { valid: false, error: 'Solo se permiten archivos Excel (.xlsx, .xls)' }
  }
  
  const maxSize = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxSize) {
    return { valid: false, error: 'El tamaño máximo es 10 MB' }
  }
  
  return { valid: true }
}

// Función para abrir selector de archivos directamente
function goToCargarPlantillas() {
  // Bloquear doble subida accidental
  if (uploading.value) return
  
  // Crear input de archivo dinámico si no existe
  if (!fileInput.value) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.style.display = 'none'
    input.addEventListener('change', handleFileSelect)
    document.body.appendChild(input)
    fileInput.value = input as any
  }
  
  // Abrir selector directamente
  if (fileInput.value) {
    fileInput.value.click()
  }
}

// Manejar selección de archivo - validar y subir automáticamente
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  
  const file = target.files[0]
  
  // Validar archivo
  const validation = validateFile(file)
  if (!validation.valid) {
    toast.error('Error de validación', validation.error || 'Archivo no válido')
    // Limpiar input
    if (target) target.value = ''
    return
  }
  
  // Mostrar confirmación rápida
  toast.info(
    `Archivo seleccionado: ${file.name}`,
    'Subiendo archivo...',
    2000
  )
  
  // Subir automáticamente
  await handleUploadFile(file)
  
  // Limpiar input después de procesar
  if (target) target.value = ''
}

// Función para subir el archivo
async function handleUploadFile(file: File) {
  uploading.value = true
  
  try {
    const response: UploadPlantillaResponse = await mba3ConsultasService.uploadPlantilla(file)
    
    // Obtener numero_pedido de la respuesta
    let numeroPedido = response.numero_pedido
    
    // Si no viene en la respuesta, intentar obtenerlo del pedido cargado usando pedido_id
    if (!numeroPedido && response.pedido_id) {
      try {
        const pedidoCompleto = await mba3ConsultasService.getPedido(response.pedido_id, false)
        numeroPedido = pedidoCompleto.cabecera.numero_pedido || undefined
      } catch (e) {
        console.warn('No se pudo obtener el numero_pedido del pedido cargado:', e)
      }
    }
    
    // Mostrar resultado con información de validación SAP si existe
    let mensajeDetalle = `Número de pedido: ${numeroPedido || 'N/A'}\nArtículos: ${response.articulos_cargados}\nDistribuciones: ${response.distribuciones_cargadas}`
    
    // Agregar información de validación SAP si está disponible
    if (response.validacion_sap) {
      const sap = response.validacion_sap
      mensajeDetalle += `\n\nValidación SAP:`
      mensajeDetalle += `\n  • Códigos válidos: ${sap.validos}/${sap.total_codigos}`
      if (sap.no_encontrados > 0) {
        mensajeDetalle += `\n  • No encontrados en SAP: ${sap.no_encontrados}`
      }
      if (sap.errores > 0) {
        mensajeDetalle += `\n  • Errores: ${sap.errores}`
      }
      if (sap.warnings > 0) {
        mensajeDetalle += `\n  • Advertencias: ${sap.warnings}`
      }
    }
    
    // Mostrar errores SAP específicos si existen
    const erroresSAP = response.errores?.filter((e: any) => {
      if (typeof e === 'string') {
        return e.toLowerCase().includes('sap') || e.toLowerCase().includes('no existe')
      }
      return e.campo === 'CodigoProducto' || (e.mensaje && (e.mensaje.toLowerCase().includes('sap') || e.mensaje.toLowerCase().includes('no existe')))
    }) || []
    
    if (response.status === 'success') {
      if (erroresSAP.length > 0 || (response.validacion_sap && !response.validacion_sap.todos_validos)) {
        toast.warning(
          'Plantilla procesada con advertencias SAP',
          mensajeDetalle
        )
      } else {
        toast.success(
          'Plantilla procesada exitosamente',
          mensajeDetalle
        )
      }
    } else if (response.status === 'validation_error') {
      toast.warning(
        'Plantilla procesada con advertencias',
        mensajeDetalle
      )
    }
    
    // Redirigir o recargar según corresponda
    if (numeroPedido && numeroPedido !== pedido.value?.cabecera.numero_pedido) {
      // Si el pedido cargado es diferente al actual, redirigir
      router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
    } else {
      // Recargar el pedido actual
      await loadPedido()
    }
  } catch (e: any) {
    // Preparar información del error para el modal
    let errorTitle = 'Error al cargar plantilla'
    let errorMessage = e.message || 'Error desconocido al subir plantilla'
    const errorErrors: Array<string | { tipo?: string; campo?: string; mensaje: string; producto?: string }> = []
    let productosNoEncontradosSAP: string[] = []

    // Primero, buscar productos no encontrados en SAP en el mensaje de error
    const errorMessageStr = e.message || ''
    
    // Detectar errores de validación SAP del mensaje
    const sapErrorPatterns = [
      /Productos no encontrados en SAP:\s*([A-Za-z0-9,.\s-]+)/i,
      /no válidos en SAP[^:]*:\s*([A-Za-z0-9,.\s-]+)/i,
      /No se encontró información en SAP para SKU:\s*([A-Za-z0-9,.\s-]+)/i
    ]
    
    for (const pattern of sapErrorPatterns) {
      const match = errorMessageStr.match(pattern)
      if (match && match[1]) {
        // Extraer códigos separados por comas
        const codigos = match[1].split(',').map(c => c.trim()).filter(c => c)
        productosNoEncontradosSAP.push(...codigos)
      }
    }

    // Intentar extraer información detallada del error response
    if (e.response?.data) {
      const errorData = e.response.data
      
      // Si hay errores estructurados en la respuesta
      if (errorData.errores && Array.isArray(errorData.errores)) {
        errorErrors.push(...errorData.errores)
      }
      
      // Si hay información de validación
      if (errorData.validacion) {
        const validacion = errorData.validacion
        
        // Agregar errores de productos no encontrados
        if (validacion.productos?.no_encontrados?.length > 0) {
          validacion.productos.no_encontrados.forEach((codigo: string) => {
            errorErrors.push({
              tipo: 'ERROR',
              campo: 'Producto SAP',
              mensaje: `No existe en SAP`,
              producto: codigo
            })
            if (!productosNoEncontradosSAP.includes(codigo)) {
              productosNoEncontradosSAP.push(codigo)
            }
          })
        }
        
        // Agregar errores de tiendas no encontradas
        if (validacion.tiendas?.no_encontradas?.length > 0) {
          validacion.tiendas.no_encontradas.forEach((codigo: string) => {
            errorErrors.push({
              tipo: 'ERROR',
              campo: 'CodigoTienda',
              mensaje: `Tienda no encontrada en el sistema`,
              producto: undefined
            })
          })
        }
        
        // Agregar información de errores de validación de cantidades
        if (validacion.cantidades && (!validacion.cantidades.valid || validacion.cantidades.errors > 0)) {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'Cantidad',
            mensaje: `Errores de validación en cantidades (${validacion.cantidades.errors} error(es), ${validacion.cantidades.warnings} advertencia(s))`,
            producto: undefined
          })
        }
      }
      
      // Si hay información de validación SAP
      if (errorData.validacion_sap) {
        const sap = errorData.validacion_sap
        if (sap.no_encontrados > 0 || sap.errores > 0) {
          errorErrors.push({
            tipo: 'ERROR',
            campo: 'ValidacionSAP',
            mensaje: `${sap.no_encontrados} código(s) no encontrado(s) en SAP, ${sap.errores} error(es)`,
            producto: undefined
          })
        }
      }
      
    }

    // Si hay errores estructurados en el objeto de error directamente, agregarlos
    if ((e as any).errors && Array.isArray((e as any).errors)) {
      errorErrors.push(...(e as any).errors)
    }

    // Identificar el tipo de error y ajustar título y mensaje
    const isSAPError = productosNoEncontradosSAP.length > 0 || 
                       errorMessageStr.toLowerCase().includes('sap') ||
                       errorMessageStr.toLowerCase().includes('no válidos en sap') ||
                       errorMessageStr.toLowerCase().includes('no se encontró')
    
    // Detectar duplicado con palabras clave más específicas
    const isDuplicateError = (errorMessageStr.toLowerCase().includes('duplicado') ||
                             errorMessageStr.toLowerCase().includes('ya existe en el sistema') ||
                             errorMessageStr.toLowerCase().includes('pedido ya existe')) &&
                             !isSAPError  // No es error de SAP
    
    const isFormatError = errorMessageStr.toLowerCase().includes('formato') ||
                          errorMessageStr.toLowerCase().includes('estructura')

    // Ajustar título según tipo de error (orden de prioridad)
    if (isSAPError) {
      errorTitle = 'Productos no encontrados en SAP'
      if (productosNoEncontradosSAP.length > 0) {
        // Crear errores específicos para cada producto no encontrado
        productosNoEncontradosSAP.forEach(codigo => {
          const exists = errorErrors.some(err => 
            (typeof err !== 'string') && err.producto === codigo
          )
          if (!exists) {
            errorErrors.push({
              tipo: 'ERROR',
              campo: 'Producto SAP',
              mensaje: `El código no existe en la base de datos SAP`,
              producto: codigo
            })
          }
        })
        errorMessage = `El archivo contiene ${productosNoEncontradosSAP.length} producto(s) que no existen en SAP.\n\nVerifica que los códigos sean correctos y estén registrados en el sistema SAP antes de cargar el archivo.`
      } else {
        errorMessage = `Uno o más productos del archivo no fueron encontrados en SAP.\n\nVerifica que todos los códigos de producto estén correctamente registrados en SAP.`
      }
    } else if (isDuplicateError) {
      errorTitle = 'Pedido duplicado'
      errorMessage = `Este pedido ya existe en el sistema.\n\nVerifica el número de pedido o contacta al administrador si necesitas modificar un pedido existente.`
    } else if (isFormatError) {
      errorTitle = 'Error de formato'
      errorMessage = `El archivo Excel no tiene el formato correcto o está incompleto.\n\nAsegúrate de usar la plantilla oficial y completar todos los campos requeridos.`
    } else if ((e as any).isBusinessException) {
      errorTitle = 'No se puede procesar el archivo'
      errorMessage = errorMessageStr || 'Ocurrió un error de validación de negocio que impide procesar el archivo.'
    }
    
    uploadErrorInfo.value = {
      title: errorTitle,
      message: errorMessage,
      fileName: file.name,
      errors: errorErrors.length > 0 ? errorErrors : undefined
    }

    // Mostrar el modal
    showErrorModal.value = true

    // Mostrar toast con el título del error
    toast.error(errorTitle, productosNoEncontradosSAP.length > 0 
      ? `Productos no encontrados: ${productosNoEncontradosSAP.join(', ')}`
      : errorMessage.split('\n')[0])
  } finally {
    uploading.value = false
  }
}

function goToPedido() {
  const numeroPedido = pedidoIdInput.value.trim()
  
  // Validar que no esté vacío
  if (!numeroPedido) {
    toast.warning('Campo vacío', 'Por favor ingresa un número de pedido')
    pedidoInputRef.value?.focus()
    return
  }
  
  // Validar formato antes de navegar
  if (!isValidPedido.value) {
    toast.warning(
      'Formato inválido',
      'Usa el número de pedido tal como aparece en el Excel. Ejemplo: P-12.48 - 12 - 2025'
    )
    pedidoInputRef.value?.focus()
    return
  }
  
  // Navegar al pedido
  router.push(`/mba3-consultas/pedidos/${encodeURIComponent(numeroPedido)}`)
  // No limpiar el input - el usuario puede querer buscar otro después
}

function handleSearchBlur() {
  // Delay para permitir que el click en el texto de ayuda funcione
  setTimeout(() => {
    showSearchHelp.value = false
  }, 200)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  
  // Manejar valores especiales que no son fechas (ej: "INMEDIATO", "INMEDIATA", etc.)
  const trimmedValue = dateString.trim()
  const upperValue = trimmedValue.toUpperCase()
  const valoresEspeciales = ['INMEDIATO', 'INMEDIATA', 'IMMEDIATE', 'URGENTE', 'URGENT', 'ASAP']
  
  if (valoresEspeciales.includes(upperValue)) {
    // Retornar el valor original preservando mayúsculas/minúsculas del backend
    return trimmedValue
  }
  
  // Intentar parsear como fecha
  try {
    const date = new Date(dateString)
    
    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) {
      // No es una fecha válida, retornar el valor original
      return trimmedValue
    }
    
    // Es una fecha válida, formatearla
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    // Si falla el parseo, retornar el valor original
    return trimmedValue
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copyFeedback.value = true
    setTimeout(() => {
      copyFeedback.value = false
    }, 2000)
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err)
    toast.error('Error', 'No se pudo copiar al portapapeles')
  }
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('es-ES').format(value)
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

function getTotalCantidad(tiendas: any[]): number {
  return tiendas.reduce((sum, t) => sum + (t.cantidad || 0), 0)
}

function formatColumnValue(detalle: any, column: ColumnConfig): string {
  const value = detalle[column.key]
  
  // Manejar valores null/undefined
  if (value === null || value === undefined) {
    return column.key === 'bodega' ? '-' : 'N/A'
  }
  
  // Formatear descuentos como porcentaje
  if (column.key === 'descuento_1' || column.key.includes('descuento')) {
    return formatPorcentaje(value)
  }
  
  // Formatear según el tipo
  switch (column.format) {
    case 'currency':
      return formatCurrency(value)
    case 'number':
      return formatNumber(value)
    case 'text':
    default:
      return value.toString()
  }
}

function getEstadoBadgeClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE_REVISION': 'bg-yellow-100 text-yellow-800',
    'APROBADA': 'bg-green-100 text-green-800',
    'RECHAZADA': 'bg-red-100 text-red-800'
  }
  return classes[estado] || 'bg-gray-100 text-gray-800'
}

function getCantidadClass(solicitada: number, confirmada: number): string {
  const porcentaje = solicitada > 0 ? (confirmada / solicitada) * 100 : 0
  if (porcentaje < 80) return 'text-red-600 font-medium'
  if (porcentaje < 100) return 'text-yellow-600'
  return 'text-green-600'
}

function getPrecioClass(original: number | null, ajustado: number | null): string {
  if (!original || !ajustado) return 'text-gray-900'
  const aumento = ((ajustado - original) / original) * 100
  if (aumento > 10) return 'text-red-600 font-medium'
  if (aumento > 0) return 'text-yellow-600'
  if (aumento < 0) return 'text-green-600'
  return 'text-gray-900'
}

function formatPorcentaje(value: number): string {
  // Convert decimal (0.2) to percentage (20%)
  const percentageValue = value * 100
  return `${percentageValue.toFixed(2)}%`
}

function getDiferenciaClass(diferencia: number): string {
  if (diferencia < 0) return 'text-red-600 font-medium'
  if (diferencia > 0) return 'text-green-600'
  return 'text-gray-900'
}

function getPorcentajeClass(porcentaje: number): string {
  if (porcentaje < 80) return 'text-red-600 font-medium'
  if (porcentaje < 100) return 'text-yellow-600'
  return 'text-green-600'
}

function getPorcentajeDiferenciaClass(porcentaje: number): string {
  if (porcentaje < -10) return 'text-red-600 font-medium'
  if (porcentaje < 0) return 'text-orange-600'
  if (porcentaje > 0) return 'text-green-600'
  return 'text-gray-900'
}

function formatEstadoPedido(estado: string): string {
  const estados: Record<string, string> = {
    'PENDIENTE_CONFIRMACION_PROVEEDOR': 'Pendiente Confirmación',
    'RESPUESTA_PROVEEDOR_CARGADA': 'Respuesta Cargada',
    'CONFIRMADO_PROVEEDOR': 'Confirmado por Proveedor',
    'CONFIRMADO_ENVIADO': 'Confirmado y Enviado'  // ⭐ NUEVO (Fase 6)
  }
  return estados[estado] || estado
}

function formatError(error: string | { tipo?: string; campo?: string; mensaje: string; producto?: string }): string {
  if (typeof error === 'string') {
    return error
  }
  
  let formatted = error.mensaje
  if (error.producto) {
    formatted = `[${error.producto}] ${formatted}`
  }
  if (error.campo) {
    formatted = `${error.campo}: ${formatted}`
  }
  if (error.tipo) {
    formatted = `${error.tipo === 'ERROR' ? '❌' : '⚠️'} ${formatted}`
  }
  return formatted
}

function getEstadoPedidoBadgeClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE_CONFIRMACION_PROVEEDOR': 'bg-yellow-100 text-yellow-800',
    'RESPUESTA_PROVEEDOR_CARGADA': 'bg-blue-100 text-blue-800',
    'CONFIRMADO_PROVEEDOR': 'bg-green-100 text-green-800',
    'CONFIRMADO_ENVIADO': 'bg-emerald-100 text-emerald-800'  // ⭐ NUEVO (Fase 6) - Verde más intenso para estado final
  }
  return classes[estado] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  // El composable carga las preferencias automáticamente
  loadPedido()
  // Autofocus opcional: descomentar si quieres que el input tenga foco al cargar
  // pedidoInputRef.value?.focus()
  
  // Agregar listener para cerrar dropdown al hacer click fuera
  document.addEventListener('click', handleClickOutsideColumnSelector)
})

// Watch para reaccionar a cambios en el parámetro de ruta
watch(
  () => route.params.id,
  async (newId, oldId) => {
    // Solo recargar si el parámetro realmente cambió y no es la carga inicial
    if (newId && newId !== oldId) {
      await loadPedido()
      // Limpiar el input de búsqueda después de navegar
      pedidoIdInput.value = ''
    }
  }
)

// ⭐ ELIMINADO: Watchers antiguos (el composable maneja esto automáticamente)

// Cleanup: eliminar input de archivo cuando el componente se destruye
onUnmounted(() => {
  if (fileInput.value) {
    fileInput.value.remove()
    fileInput.value = null
  }
  
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
  
  // Reordenar usando el composable
  const currentOrder = [...orderedVisibleColumnKeys.value]
  const draggedKey = currentOrder[draggedColumnIndex.value]
  
  // Remover columna arrastrada
  currentOrder.splice(draggedColumnIndex.value, 1)
  
  // Insertar en nueva posición
  currentOrder.splice(dropIndex, 0, draggedKey)
  
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
  const currentVisible = [...visibleColumns.value]
  const index = currentVisible.indexOf(columnKey)
  
  // Validación: Asegurar que hay al menos una columna visible
  if (index > -1 && currentVisible.length === 1) {
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

// ⭐ NUEVO: Funciones para edición de costo unitario, total y comentario
function iniciarEdicion(detalle: any, fieldType: 'costo' | 'total' | 'comentario' = 'costo') {
  if (!pedido.value) return
  
  let value: string
  let originalValue: number | string | null
  
  if (fieldType === 'costo') {
    value = detalle.costo_doc_sin_iva?.toString() || '0'
    originalValue = detalle.costo_doc_sin_iva
  } else if (fieldType === 'total') {
    value = detalle.total?.toString() || '0'
    originalValue = detalle.total
  } else {
    // comentario
    value = detalle.comentario || ''
    originalValue = detalle.comentario
  }
  
  editingCell.value = {
    detalleId: detalle.pedido_detalle_id,
    value: value,
    originalValue: originalValue,
    fieldType: fieldType
  }
  
  // Esperar a que el input se monte en el DOM y darle focus
  nextTick(() => {
    // Buscar el input o textarea por atributo data específico
    const input = document.querySelector(
      `input[data-editing-cell="${detalle.pedido_detalle_id}"], textarea[data-editing-cell="${detalle.pedido_detalle_id}"]`
    ) as HTMLInputElement | HTMLTextAreaElement
    
    if (input) {
      editingInputElement = input as HTMLInputElement
      input.focus()
      if (input instanceof HTMLInputElement) {
        input.select()
      }
    }
  })
}

async function guardarEdicion() {
  if (!editingCell.value || !pedido.value) return
  
  const fieldType = editingCell.value.fieldType
  // Convertir a string antes de trim (v-model con type="number" puede devolver un número)
  const newValueStr = String(editingCell.value.value || '').trim()
  
  // Validación específica según el tipo de campo
  if (fieldType === 'comentario') {
    // Para comentario, no hay validación numérica, solo verificar si cambió
    if (newValueStr === (editingCell.value.originalValue || '')) {
      editingCell.value = null
      return
    }
  } else {
    // Para costo y total, validar que sea un número válido
    const newValue = parseFloat(newValueStr)
    
    if (isNaN(newValue) || newValue < 0) {
      toast.warning('Valor inválido', 'Por favor ingresa un número válido mayor o igual a 0')
      return
    }
    
    // No cambió nada
    if (newValue === editingCell.value.originalValue) {
      editingCell.value = null
      return
    }
  }
  
  // Encontrar el detalle a actualizar
  const detalle = pedido.value.detalles.find(d => d.pedido_detalle_id === editingCell.value!.detalleId)
  if (!detalle) return
  
  // ⭐ Guardar detalleId antes de cerrar el editor
  const detalleId = editingCell.value.detalleId
  
  // ⭐ ACTUALIZACIÓN OPTIMISTA: Guardar valores anteriores para poder revertir
  const oldCosto = detalle.costo_doc_sin_iva
  const oldSubtotal = detalle.subtotal
  const oldTotal = detalle.total
  const oldComentario = detalle.comentario
  
  // ⭐ ACTUALIZAR UI INMEDIATAMENTE (optimistic update)
  if (fieldType === 'costo') {
    const newValue = parseFloat(newValueStr)
    // ⭐ COSTO UNIT. es completamente independiente - solo actualizar el costo mismo
    // NO hacer ningún cálculo sobre él (no recalcular subtotal ni ningún otro campo)
    detalle.costo_doc_sin_iva = newValue
  } else if (fieldType === 'total') {
    const newValue = parseFloat(newValueStr)
    // ⭐ FASE 2: Solo actualizar el TOTAL, NO tocar COSTO UNIT. ni subtotal
    // El TOTAL es independiente y puede ser cualquier valor que el usuario ingrese
    detalle.total = newValue
    // ⭐ NO recalcular nada - el TOTAL es independiente
  } else if (fieldType === 'comentario') {
    // Actualizar comentario inmediatamente
    detalle.comentario = newValueStr || null
  }
  
  // Cerrar el editor inmediatamente para mejor UX
  editingCell.value = null
  
  // Mostrar feedback inmediato (sin esperar al backend)
  if (fieldType === 'comentario') {
    toast.info('Actualizando...', 'Guardando comentario...')
  } else {
    const fieldLabel = fieldType === 'costo' ? 'costo' : 'total'
    const newValue = parseFloat(newValueStr)
    toast.info('Actualizando...', `Actualizando ${fieldLabel} a ${fieldType === 'costo' ? formatCurrency(newValue) : formatNumber(newValue)}`)
  }
  
  try {
    let response
    if (fieldType === 'costo') {
      const newValue = parseFloat(newValueStr)
      // Actualizar costo en el backend
      response = await mba3ConsultasService.actualizarCostoPedido(
        numeroPedido.value,
        detalleId,
        newValue
      )
      
      // ⭐ Backend confirmó el cambio - actualizar con datos del servidor si vienen
      if (response.costo_nuevo !== undefined) {
        detalle.costo_doc_sin_iva = response.costo_nuevo
      }
      // ⭐ COSTO UNIT. es completamente independiente - NO hacer ningún cálculo
      // NO actualizar subtotal, NO actualizar TOTAL - todos son independientes
      
      // ⭐ Marcar fila como modificada
      filasModificadas.value.add(detalleId)
      
      toast.success('Costo actualizado', `Costo unitario actualizado a ${formatCurrency(parseFloat(newValueStr))}`)
    } else if (fieldType === 'total') {
      const newValue = parseFloat(newValueStr)
      // Actualizar total en el backend
      response = await mba3ConsultasService.actualizarTotalPedido(
        numeroPedido.value,
        detalleId,
        newValue
      )
      
      // ⭐ Backend confirmó el cambio - actualizar con datos del servidor si vienen
      if (response.total_nuevo !== undefined) {
        detalle.total = response.total_nuevo
      }
      // ⭐ FASE 2: Solo actualizar el TOTAL, NO tocar COSTO UNIT. ni subtotal
      // El TOTAL es independiente y puede ser cualquier valor que el usuario ingrese
      // ⭐ NO actualizar subtotal ni costo - son independientes del TOTAL
      
      // ⭐ Marcar fila como modificada
      filasModificadas.value.add(detalleId)
      
      toast.success('Total actualizado', `Total actualizado a ${formatNumber(parseFloat(newValueStr))}`)
    } else if (fieldType === 'comentario') {
      // Actualizar comentario en el backend
      response = await mba3ConsultasService.actualizarComentarioPedido(
        numeroPedido.value,
        detalleId,
        newValueStr || null
      )
      
      // ⭐ Backend confirmó el cambio - actualizar con datos del servidor si vienen
      // El backend puede devolver comentario_nuevo o podemos usar el valor que enviamos
      if (response.comentario_nuevo !== undefined) {
        detalle.comentario = response.comentario_nuevo
      } else {
        // Si el backend no devuelve el comentario, usar el valor que enviamos
        detalle.comentario = newValueStr || null
      }
      
      // ⭐ Marcar fila como modificada
      filasModificadas.value.add(detalleId)
      
      toast.success('Comentario guardado', 'El comentario se ha guardado correctamente')
    }
  } catch (e: any) {
    // ⭐ REVERTIR CAMBIOS si el backend falla
    detalle.costo_doc_sin_iva = oldCosto
    detalle.subtotal = oldSubtotal
    detalle.total = oldTotal
    detalle.comentario = oldComentario
    
    // Mensaje de error más amigable
    const fieldLabel = fieldType === 'costo' ? 'costo' : fieldType === 'total' ? 'total' : 'comentario'
    const errorMessage = e.message || `No se pudo actualizar el ${fieldLabel}`
    const isBackendError = errorMessage.includes('JSON serializable') || 
                          errorMessage.includes('internal_error') ||
                          errorMessage.includes('500')
    
    if (isBackendError) {
      toast.error(
        'Error del servidor', 
        'El cambio se aplicó localmente pero no se pudo guardar en el servidor. Por favor, recarga la página.'
      )
    } else {
      toast.error('Error al actualizar', errorMessage)
    }
    
    // Restaurar el editor para que el usuario pueda intentar de nuevo (solo si el detalle aún existe)
    const detalleActualizado = pedido.value.detalles.find(d => d.pedido_detalle_id === detalleId)
    if (detalleActualizado) {
      let originalValue: number | string | null
      if (fieldType === 'costo') {
        originalValue = oldCosto
      } else if (fieldType === 'total') {
        originalValue = oldTotal
      } else {
        originalValue = oldComentario ?? null
      }
      
      editingCell.value = {
        detalleId: detalleActualizado.pedido_detalle_id,
        value: originalValue?.toString() || (fieldType === 'comentario' ? '' : '0'),
        originalValue: originalValue,
        fieldType: fieldType
      }
    }
  }
}

function cancelarEdicion() {
  editingCell.value = null
}

function manejarTeclasEdicion(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    guardarEdicion()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelarEdicion()
  }
}
</script>

