<template>
  <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
    <!-- Header con búsqueda y acciones -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900">Despachos</h2>
          <span class="px-3 py-1 bg-violet-600 text-white rounded-full text-sm font-medium">
            {{ filteredDespachos.length }} de {{ totalDespachos || 0 }} despachos
          </span>
          <span v-if="selectedDespachos.length > 0" class="px-3 py-1 bg-violet-600 text-white rounded-full text-sm font-medium">
            {{ selectedDespachos.length }} seleccionados
          </span>
        </div>
        
        <!-- Acciones en lote -->
        <div v-if="selectedDespachos.length > 0" class="flex items-center gap-2">
          <button
            @click="handleGenerarODCMultiples"
            class="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            :disabled="loading || sendingMultiple"
          >
            <svg v-if="loading || sendingMultiple" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ sendingMultiple ? `Generando ODC (${selectedDespachos.length})...` : `Generar ODC (${selectedDespachos.length})` }}
          </button>
          <button
            @click="clearSelection"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Limpiar selección
          </button>
        </div>
      </div>
      
      <!-- Búsqueda y filtros -->
      <div class="mt-4 flex flex-col md:flex-row gap-3">
        <!-- Búsqueda -->
        <div class="flex-1">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por código factura, número factura, cliente, empresa, SKU..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="flex items-center gap-2">
          <select
            v-model="filtroEmpresa"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Todas las empresas</option>
            <option v-for="empresa in empresasUnicas" :key="empresa" :value="empresa">
              {{ empresa }}
            </option>
          </select>

          <select
            v-model="filtroTipoDocumento"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Todos los tipos</option>
            <option v-for="tipo in tiposDocumentoUnicos" :key="tipo" :value="tipo">
              {{ tipo }}
            </option>
          </select>
          
          <button
            @click="showAdvancedFilters = !showAdvancedFilters"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
          
          <button
            @click="showColumnSelector = !showColumnSelector"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2 relative"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Columnas
            <span v-if="visibleColumnsCount < availableColumns.length" class="ml-1 px-1.5 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full">
              {{ visibleColumnsCount }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Selector de Columnas -->
      <div v-if="showColumnSelector" class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">Seleccionar Columnas</h3>
          <div class="flex items-center gap-2">
            <button
              @click="selectAllColumns"
              class="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              Mostrar todas
            </button>
            <span class="text-gray-300">|</span>
            <button
              @click="resetColumns"
              class="text-xs text-gray-600 hover:text-gray-700 font-medium"
            >
              Restaurar predeterminadas
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <label
            v-for="column in availableColumns"
            :key="column.key"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              v-model="visibleColumns"
              :value="column.key"
              class="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <span class="text-sm text-gray-700">{{ column.label }}</span>
          </label>
        </div>
      </div>
      
      <!-- Filtros avanzados -->
      <div v-if="showAdvancedFilters" class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
            <input
              v-model="filtroFechaDesde"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
            <input
              v-model="filtroFechaHasta"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              v-model="filtroEstado"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">Todos</option>
              <option value="confirmado">Confirmados</option>
              <option value="pendiente">Pendientes</option>
              <option value="anulado">Anulados</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            @click="limpiarFiltros"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div v-if="!loading && filteredDespachos.length === 0" class="text-center py-12 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm">{{ searchQuery || filtroEmpresa ? 'No se encontraron despachos con los filtros aplicados' : 'No se encontraron despachos' }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
                class="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
              />
            </th>
            <th class="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            <th v-if="isColumnVisible('codigo_factura')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('codigo_factura')">
              <div class="flex items-center gap-1">
                Código Factura
                <svg v-if="sortField === 'codigo_factura'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('numero_factura')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('numero_factura')">
              <div class="flex items-center gap-1">
                Número Factura
                <svg v-if="sortField === 'numero_factura'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('empresa')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('empresa')">
              <div class="flex items-center gap-1">
                Empresa
                <svg v-if="sortField === 'empresa'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('codigo_cliente')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('codigo_cliente')">
              <div class="flex items-center gap-1">
                Cliente
                <svg v-if="sortField === 'codigo_cliente'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('fecha_despacho')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('fecha_despacho')">
              <div class="flex items-center gap-1">
                Fecha Despacho
                <svg v-if="sortField === 'fecha_despacho'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('tipo_documento')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('tipo_documento')">
              <div class="flex items-center gap-1">
                Tipo Doc.
                <svg v-if="sortField === 'tipo_documento'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('estado')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th v-if="isColumnVisible('orden_compra')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden Compra</th>
            <th v-if="isColumnVisible('numero_pedido_sistema')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido Sistema</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-for="despacho in sortedDespachos" :key="despacho.despacho_id">
            <!-- Fila principal del despacho (Cabecera - colores más intensos) -->
            <tr class="transition-colors" :class="getCabeceraRowClass()">
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  :checked="isSelected(despacho.despacho_id)"
                  @change="toggleSelect(despacho.despacho_id)"
                  class="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="toggleDetalles(despacho.despacho_id)"
                  class="text-violet-500 hover:text-violet-700 transition-colors"
                  :disabled="loadingDetalles[despacho.despacho_id]"
                >
                  <svg 
                    class="w-5 h-5 transform transition-transform"
                    :class="{ 'rotate-90': detallesExpandidos.has(despacho.despacho_id) }"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </td>
              <td v-if="isColumnVisible('codigo_factura')" class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                <span class="font-semibold">{{ despacho.codigo_factura }}</span>
              </td>
              <td v-if="isColumnVisible('numero_factura')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ despacho.numero_factura || '-' }}</td>
              <td v-if="isColumnVisible('empresa')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ despacho.empresa }}</td>
              <td v-if="isColumnVisible('codigo_cliente')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{{ despacho.codigo_cliente }}</td>
              <td v-if="isColumnVisible('fecha_despacho')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(despacho.fecha_despacho) }}</td>
              <td v-if="isColumnVisible('tipo_documento')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span class="px-2 py-1 text-xs font-medium rounded bg-violet-100 text-violet-800">
                  {{ despacho.tipo_documento }}
                </span>
              </td>
              <td v-if="isColumnVisible('estado')" class="px-6 py-4 whitespace-nowrap">
                <div class="relative group inline-block">
                  <span :class="getEstadoClass(despacho)" class="cursor-help transition-all duration-200 hover:scale-105">
                  {{ getEstadoText(despacho) }}
                </span>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out pointer-events-none whitespace-nowrap z-50">
                    {{ getEstadoTooltip(despacho) }}
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div class="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </td>
              <td v-if="isColumnVisible('orden_compra')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="despacho.orden_compra" class="font-mono">{{ despacho.orden_compra }}</span>
                <span v-else class="text-gray-400 italic">-</span>
              </td>
              <td v-if="isColumnVisible('numero_pedido_sistema')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="despacho.numero_pedido_sistema">{{ despacho.numero_pedido_sistema }}</span>
                <span v-else class="text-gray-400 italic">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  @click="handleGenerarODC(despacho.despacho_id)"
                  class="px-3 py-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1"
                  :disabled="sendingDespachoId === despacho.despacho_id || despacho.anulada || sendingMultiple"
                  :title="despacho.anulada ? 'No se puede generar ODC para despachos anulados' : 'Generar ODC para este despacho'"
                >
                  <svg v-if="sendingDespachoId === despacho.despacho_id" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ sendingDespachoId === despacho.despacho_id ? 'Generando...' : 'Generar ODC' }}
                </button>
              </td>
            </tr>
            
            <!-- Fila expandible con detalles (colores más claros) -->
            <tr v-if="detallesExpandidos.has(despacho.despacho_id)">
              <td :colspan="visibleColumnsCount + 3" class="px-6 py-4" :class="getDetallesContainerClass()">
                <div v-if="loadingDetalles[despacho.despacho_id]" class="flex items-center justify-center py-4">
                  <svg class="animate-spin h-5 w-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span class="ml-2 text-sm text-violet-600">Cargando detalles...</span>
                </div>
                <div v-else-if="detallesPorDespacho[despacho.despacho_id]?.length > 0" class="py-2">
                  <h4 class="text-sm font-semibold mb-3" :class="getDetallesTitleClass()">
                    Detalles del Despacho ({{ detallesPorDespacho[despacho.despacho_id]?.length }} {{ detallesPorDespacho[despacho.despacho_id]?.length === 1 ? 'ítem' : 'ítems' }})
                  </h4>
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 bg-white rounded-lg border" :class="getDetallesTableBorderClass()">
                      <thead :class="getDetallesHeaderClass()">
                        <tr>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">SKU</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Producto</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Cant. Docena MBA3</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Cant. Pack SAP</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Unidad SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Precio Unit. MBA3</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Precio Unit. SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Descuento</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Subtotal SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Total Línea MBA3</th>
                        </tr>
                      </thead>
                      <tbody :class="getDetallesTbodyClass()">
                        <tr v-for="(detalle, index) in detallesPorDespacho[despacho.despacho_id]" :key="detalle.detalle_id || index" :class="getDetallesRowClass()">
                          <td class="px-4 py-2 text-sm font-mono text-gray-900 font-semibold">{{ detalle.sku || '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900">
                            <div class="max-w-xs">
                              <div class="font-medium">{{ detalle.nombre_producto || '-' }}</div>
                            </div>
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center">{{ formatNumber(detalle.cantidad_docena_mba3) }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center">{{ detalle.cantidad_pack_sap !== null ? formatNumber(detalle.cantidad_pack_sap) : '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center font-mono">{{ detalle.unidad_sap || '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right">{{ formatCurrency(detalle.precio_unitario_mba3) }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right">{{ detalle.precio_unitario_sap !== null ? formatCurrency(detalle.precio_unitario_sap) : '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right">{{ formatCurrency(detalle.descuento) }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right font-medium">{{ formatCurrency(detalle.subtotal_sap) }}</td>
                          <td class="px-4 py-2 text-sm font-semibold text-gray-900 text-right">{{ formatCurrency(detalle.total_linea_mba3) }}</td>
                        </tr>
                      </tbody>
                      <tfoot v-if="detallesPorDespacho[despacho.despacho_id]?.length > 0" :class="getDetallesFooterClass()">
                        <tr>
                          <td colspan="8" class="px-4 py-2 text-sm font-semibold text-right" :class="getDetallesFooterTextClass()">Subtotal:</td>
                          <td class="px-4 py-2 text-sm font-bold text-right border-l" :class="[getDetallesFooterBorderClass(), getDetallesFooterTextClass()]">
                            {{ formatCurrency(getTotalSubtotalSAP(despacho.despacho_id)) }}
                          </td>
                          <td class="px-4 py-2 text-sm font-bold text-right" :class="getDetallesFooterTextClass()">
                            {{ formatCurrency(getTotalLineaMBA3(despacho.despacho_id)) }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div v-else class="py-4 text-center text-sm text-gray-500">
                  No hay detalles disponibles para este despacho
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Despacho, DespachoDetalle } from '../types'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  despachos: Despacho[]
  loading?: boolean
  totalDespachos?: number
  processing?: boolean
}>()

const emit = defineEmits<{
  'generar-odc': [despachoId: string]
  'generar-odc-multiples': [despachoIds: string[]]
}>()

const toast = useToast()

// Estado para detalles expandidos
const detallesExpandidos = ref<Set<string>>(new Set())
const detallesPorDespacho = ref<Record<string, DespachoDetalle[]>>({})
const loadingDetalles = ref<Record<string, boolean>>({})

// Búsqueda y filtros
const searchQuery = ref('')
const filtroEmpresa = ref('')
const filtroTipoDocumento = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const filtroEstado = ref('')
const showAdvancedFilters = ref(false)
const showColumnSelector = ref(false)

// Estado de selección
const selectedDespachos = ref<string[]>([])
// Usar el prop processing del padre o el estado local
const isProcessing = computed(() => props.processing || false)

// Estado para rastrear qué despacho individual se está procesando
const sendingDespachoId = ref<string | null>(null)

// Estado para rastrear cuando se están procesando múltiples despachos
const sendingMultiple = ref(false)

// Configuración de columnas
const STORAGE_KEY = 'despachos-table-columns'

// Columnas disponibles
const availableColumns = [
  { key: 'codigo_factura', label: 'Código Factura', default: true },
  { key: 'numero_factura', label: 'Número Factura', default: true },
  { key: 'empresa', label: 'Empresa', default: true },
  { key: 'codigo_cliente', label: 'Cliente', default: true },
  { key: 'fecha_despacho', label: 'Fecha Despacho', default: true },
  { key: 'tipo_documento', label: 'Tipo Documento', default: true },
  { key: 'estado', label: 'Estado', default: true },
  { key: 'orden_compra', label: 'Orden Compra', default: false },
  { key: 'numero_pedido_sistema', label: 'Pedido Sistema', default: false },
]

// Cargar columnas visibles desde localStorage o usar valores por defecto
function loadVisibleColumns(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Error al cargar preferencias de columnas:', error)
  }
  
  // Retornar columnas con default: true
  return availableColumns.filter(col => col.default).map(col => col.key)
}

const visibleColumns = ref<string[]>(loadVisibleColumns())

// Guardar preferencias cuando cambian
function saveVisibleColumns() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns.value))
  } catch (error) {
    console.error('Error al guardar preferencias de columnas:', error)
  }
}

// Watch para guardar cuando cambian las columnas
watch(visibleColumns, () => {
  saveVisibleColumns()
}, { deep: true })

// Computed para contar columnas visibles
const visibleColumnsCount = computed(() => visibleColumns.value.length)

// Funciones de utilidad
function isColumnVisible(key: string): boolean {
  return visibleColumns.value.includes(key)
}

function selectAllColumns() {
  visibleColumns.value = availableColumns.map(col => col.key)
}

function resetColumns() {
  visibleColumns.value = availableColumns.filter(col => col.default).map(col => col.key)
}

// Ordenamiento
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Computed
const empresasUnicas = computed(() => {
  const empresas = new Set(props.despachos.map(d => d.empresa))
  return Array.from(empresas).sort()
})

const tiposDocumentoUnicos = computed(() => {
  const tipos = new Set(props.despachos.map(d => d.tipo_documento))
  return Array.from(tipos).sort()
})

const filteredDespachos = computed(() => {
  let filtered = [...props.despachos]
  
  // Búsqueda por texto
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(d => {
      // Búsqueda en campos del despacho principal
      const matchDespacho = 
        (d.codigo_factura && d.codigo_factura.toLowerCase().includes(query)) ||
        (d.numero_factura && String(d.numero_factura).includes(query)) ||
        (d.codigo_cliente && d.codigo_cliente.toLowerCase().includes(query)) ||
        (d.empresa && d.empresa.toLowerCase().includes(query)) ||
        (d.orden_compra && d.orden_compra.toLowerCase().includes(query)) ||
        (d.numero_pedido_sistema && String(d.numero_pedido_sistema).includes(query))
      
      // Búsqueda en detalles (despacho_detalles)
      let matchDetalles = false
      if (d.despacho_detalles && d.despacho_detalles.length > 0) {
        matchDetalles = d.despacho_detalles.some(detalle =>
          (detalle.sku && detalle.sku.toLowerCase().includes(query)) ||
          (detalle.nombre_producto && detalle.nombre_producto.toLowerCase().includes(query)) ||
          (detalle.tipo_linea && detalle.tipo_linea.toLowerCase().includes(query))
        )
      }
      
      return matchDespacho || matchDetalles
    })
  }
  
  // Filtro por empresa
  if (filtroEmpresa.value) {
    filtered = filtered.filter(d => d.empresa === filtroEmpresa.value)
  }
  
  // Filtro por tipo de documento
  if (filtroTipoDocumento.value) {
    filtered = filtered.filter(d => d.tipo_documento === filtroTipoDocumento.value)
  }
  
  // Filtro por fecha
  if (filtroFechaDesde.value) {
    const fechaDesde = new Date(filtroFechaDesde.value)
    filtered = filtered.filter(d => new Date(d.fecha_despacho) >= fechaDesde)
  }
  
  if (filtroFechaHasta.value) {
    const fechaHasta = new Date(filtroFechaHasta.value)
    fechaHasta.setHours(23, 59, 59, 999)
    filtered = filtered.filter(d => new Date(d.fecha_despacho) <= fechaHasta)
  }
  
  // Filtro por estado
  if (filtroEstado.value) {
    if (filtroEstado.value === 'anulado') {
      filtered = filtered.filter(d => d.anulada === true)
    } else if (filtroEstado.value === 'confirmado') {
      filtered = filtered.filter(d => d.confirmado === true && d.anulada === false)
    } else if (filtroEstado.value === 'pendiente') {
      filtered = filtered.filter(d => d.confirmado === false && d.anulada === false)
    }
  }
  
  return filtered
})

const sortedDespachos = computed(() => {
  if (!sortField.value) return filteredDespachos.value
  
  const sorted = [...filteredDespachos.value]
  sorted.sort((a, b) => {
    const aValue = a[sortField.value as keyof Despacho]
    const bValue = b[sortField.value as keyof Despacho]
    
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection.value === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection.value === 'asc' 
        ? aValue - bValue
        : bValue - aValue
    }
    
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortDirection.value === 'asc' 
        ? (aValue === bValue ? 0 : aValue ? 1 : -1)
        : (aValue === bValue ? 0 : aValue ? -1 : 1)
    }
    
    return 0
  })
  
  return sorted
})

// Funciones
function sortBy(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function limpiarFiltros() {
  searchQuery.value = ''
  filtroEmpresa.value = ''
  filtroTipoDocumento.value = ''
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
  filtroEstado.value = ''
  showAdvancedFilters.value = false
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  } catch {
    return dateString
  }
}

function getEstadoClass(despacho: Despacho): string {
  if (despacho.anulada) {
    return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
  }
  if (despacho.confirmado) {
    return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
  }
  return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'
}

function getEstadoText(despacho: Despacho): string {
  if (despacho.anulada) {
    return 'Anulado'
  }
  if (despacho.confirmado) {
    return 'Confirmado'
  }
  return 'Pendiente'
}

function getEstadoTooltip(despacho: Despacho): string {
  if (despacho.anulada) {
    return 'Este despacho ha sido anulado y no se puede generar una orden de compra para él.'
  }
  if (despacho.confirmado) {
    return 'Este despacho está confirmado y listo para generar una orden de compra.'
  }
  return 'Este despacho está pendiente de confirmación. Una vez confirmado, podrás generar una orden de compra.'
}

// Funciones para manejar detalles
async function toggleDetalles(despachoId: string) {
  if (detallesExpandidos.value.has(despachoId)) {
    // Colapsar
    detallesExpandidos.value.delete(despachoId)
  } else {
    // Expandir y cargar detalles si no están cargados
    detallesExpandidos.value.add(despachoId)
    
    if (!detallesPorDespacho.value[despachoId]) {
      await cargarDetalles(despachoId)
    }
  }
}

async function cargarDetalles(despachoId: string) {
  loadingDetalles.value[despachoId] = true
  try {
    // Primero verificar si los detalles ya vienen en el despacho (campo despacho_detalles)
    const despacho = props.despachos.find(d => d.despacho_id === despachoId)
    if (despacho?.despacho_detalles && despacho.despacho_detalles.length > 0) {
      console.log(`✅ [cargarDetalles] Detalles encontrados en despacho ${despachoId}:`, despacho.despacho_detalles.length)
      detallesPorDespacho.value[despachoId] = despacho.despacho_detalles
      loadingDetalles.value[despachoId] = false
      return
    }
    
    // Si no hay detalles incluidos, intentar cargarlos desde el endpoint (por si acaso)
    try {
      const detalles = await mba3ConsultasService.getDespachoDetalles(despachoId)
      detallesPorDespacho.value[despachoId] = detalles
    } catch (endpointError: any) {
      // Si el endpoint no existe o falla, usar los detalles vacíos del despacho
      console.warn('No se pudieron cargar detalles desde endpoint, usando detalles incluidos (pueden estar vacíos)')
      detallesPorDespacho.value[despachoId] = despacho?.despacho_detalles || []
    }
  } catch (error: any) {
    console.error('Error al cargar detalles:', error)
    detallesPorDespacho.value[despachoId] = []
  } finally {
    loadingDetalles.value[despachoId] = false
  }
}

function getTotalSubtotalSAP(despachoId: string): number {
  const detalles = detallesPorDespacho.value[despachoId] || []
  return detalles.reduce((total, detalle) => {
    return total + (detalle.subtotal_sap || 0)
  }, 0)
}

function getTotalLineaMBA3(despachoId: string): number {
  const detalles = detallesPorDespacho.value[despachoId] || []
  return detalles.reduce((total, detalle) => {
    return total + (detalle.total_linea_mba3 || 0)
  }, 0)
}

function formatCurrency(value: number | undefined | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number | undefined | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// Funciones de selección
function isSelected(despachoId: string): boolean {
  return selectedDespachos.value.includes(despachoId)
}

function toggleSelect(despachoId: string) {
  const index = selectedDespachos.value.indexOf(despachoId)
  if (index > -1) {
    selectedDespachos.value.splice(index, 1)
  } else {
    selectedDespachos.value.push(despachoId)
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    // Deseleccionar todas las visibles
    filteredDespachos.value.forEach(d => {
      const index = selectedDespachos.value.indexOf(d.despacho_id)
      if (index > -1) {
        selectedDespachos.value.splice(index, 1)
      }
    })
  } else {
    // Seleccionar todas las visibles (solo las no anuladas)
    filteredDespachos.value.forEach(d => {
      if (!d.anulada && !selectedDespachos.value.includes(d.despacho_id)) {
        selectedDespachos.value.push(d.despacho_id)
      }
    })
  }
}

function clearSelection() {
  selectedDespachos.value = []
}

const allSelected = computed(() => {
  const selectableDespachos = filteredDespachos.value.filter(d => !d.anulada)
  return selectableDespachos.length > 0 && 
         selectableDespachos.every(d => selectedDespachos.value.includes(d.despacho_id))
})

const someSelected = computed(() => {
  return filteredDespachos.value.some(d => selectedDespachos.value.includes(d.despacho_id)) && !allSelected.value
})

// Funciones de acción
function handleGenerarODC(despachoId: string) {
  // Prevenir múltiples clics
  if (sendingDespachoId.value === despachoId || sendingMultiple.value) {
    return
  }
  
  try {
    sendingDespachoId.value = despachoId
    emit('generar-odc', despachoId)
    // El estado se limpiará cuando el componente padre termine la operación
    // Pero como no podemos saber cuándo termina directamente, lo hacemos después de un pequeño delay
    // El componente padre debería manejar la actualización del estado
  } catch (error) {
    sendingDespachoId.value = null
  }
}

function handleGenerarODCMultiples() {
  if (sendingMultiple.value || props.loading) {
    return
  }
  
  if (selectedDespachos.value.length === 0) {
    toast.warning('No hay despachos seleccionados')
    return
  }
  
  sendingMultiple.value = true
  emit('generar-odc-multiples', [...selectedDespachos.value])
}

// Exponer funciones para limpiar el estado de envío (llamada por el componente padre después de completar)
function clearSendingState() {
  sendingDespachoId.value = null
}

// Función para limpiar el estado de envío múltiple (llamada por el componente padre después de completar)
function clearSendingMultipleState() {
  sendingMultiple.value = false
}

// Exponer funciones para que el componente padre pueda llamarlas
defineExpose({
  clearSendingState,
  clearSelection,
  clearSendingMultipleState
})

// Funciones para colores temáticos de cabecera y detalles
// Los despachos pertenecen al proceso "migrar" (violeta)
function getCabeceraRowClass(): string {
  // Colores más intensos para la cabecera (proceso migrar - violeta)
  return 'bg-violet-50/40 hover:bg-violet-50/60 border-l-4 border-violet-300'
}

function getDetallesContainerClass(): string {
  // Colores más claros para el contenedor de detalles (proceso migrar - violeta)
  return 'bg-violet-50/20'
}

function getDetallesTitleClass(): string {
  // Título de detalles con color temático
  return 'text-violet-700'
}

function getDetallesHeaderClass(): string {
  // Header de la tabla de detalles (más claro que la cabecera)
  return 'bg-violet-100/50'
}

function getDetallesTableBorderClass(): string {
  // Borde de la tabla de detalles
  return 'border-violet-200'
}

function getDetallesFooterClass(): string {
  // Footer de la tabla de detalles
  return 'bg-violet-100/40 border-t-2 border-violet-200'
}

function getDetallesFooterTextClass(): string {
  // Texto del footer
  return 'text-violet-800'
}

function getDetallesFooterBorderClass(): string {
  // Borde del footer
  return 'border-violet-200'
}

function getDetallesTbodyClass(): string {
  // Tbody de detalles con divisores temáticos
  return 'divide-y divide-violet-100'
}

function getDetallesRowClass(): string {
  // Filas de detalles con hover temático
  return 'hover:bg-violet-50/40 transition-colors'
}
</script>
