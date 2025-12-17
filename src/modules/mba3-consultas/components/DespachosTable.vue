<template>
  <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
    <!-- Header con búsqueda y acciones -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900">Despachos</h2>
          <span class="px-3 py-1 bg-violet-600 text-white rounded-full text-sm font-medium">
            {{ (props.currentPage !== undefined && props.pageSize !== undefined && props.currentPage > 0 && props.pageSize > 0)
              ? `${sortedDespachos.length} de ${filteredDespachos.length} (${totalDespachos || 0} total)` 
              : `${filteredDespachos.length} de ${totalDespachos || 0} despachos` }}
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
              placeholder="Buscar por número factura, SKU..."
              class="block w-full pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              :class="searchQuery ? 'pr-10' : 'pr-3'"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              title="Limpiar búsqueda"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="flex items-center gap-2">
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
      <p class="mt-2 text-sm">{{ searchQuery ? 'No se encontraron despachos con los filtros aplicados' : 'No se encontraron despachos' }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="w-12 px-6 py-3 text-center align-middle">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
                :disabled="!hasSelectableDespachos"
                class="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :title="!hasSelectableDespachos ? 'No hay despachos seleccionables (todos tienen ODC, están anulados, o tienen advertencias/errores)' : 'Seleccionar todos los despachos disponibles'"
              />
            </th>
            <th class="w-12 px-6 py-3 text-center align-middle"></th>
            <th class="w-8 px-2 py-3 text-center align-middle" title="Indicador de problemas">
              <svg class="w-4 h-4 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </th>
            <th
              v-for="columnKey in orderedVisibleColumns"
              :key="columnKey"
              :draggable="true"
              @dragstart="handleDragStart($event, columnKey)"
              @dragover="handleDragOver($event, columnKey)"
              @dragleave="handleDragLeave"
              @drop="handleDrop($event, columnKey)"
              @dragend="handleDragEnd"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-grab',
                isColumnSortable(columnKey) ? 'hover:bg-gray-100' : 'hover:bg-gray-50',
                draggedColumn === columnKey ? 'opacity-50 cursor-grabbing' : '',
                dragOverColumn === columnKey && draggedColumn !== columnKey ? 'bg-violet-100 border-l-4 border-violet-500' : ''
              ]"
              @click="isColumnSortable(columnKey) && sortBy(columnKey)"
            >
              <div class="flex items-center gap-1">
                <span>{{ getColumnLabel(columnKey) }}</span>
                <svg v-if="isColumnSortable(columnKey) && sortField === columnKey" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
                <svg v-else class="w-4 h-4 text-gray-300 opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Arrastra para reordenar">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-for="despacho in sortedDespachos" :key="despacho.despacho_id">
            <!-- Fila principal del despacho (Cabecera - colores más intensos) -->
            <tr 
              class="transition-colors" 
              :class="[getCabeceraRowClass(), getRowWarningClass(despacho)]"
              :title="getRowTooltip(despacho)"
              :data-despacho-id="despacho.despacho_id"
            >
              <td class="px-6 py-4 whitespace-nowrap text-center align-middle">
                <input
                  type="checkbox"
                  :checked="isSelected(despacho.despacho_id)"
                  @change="toggleSelect(despacho.despacho_id)"
                  :disabled="despacho.anulada || tieneODC(despacho) || hasRowIssues(despacho).hasWarnings || hasRowIssues(despacho).hasErrors"
                  :title="getCheckboxTooltip(despacho)"
                  class="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center align-middle">
                <button
                  @click="toggleDetalles(despacho.despacho_id)"
                  class="text-violet-500 hover:text-violet-700 transition-colors inline-flex items-center justify-center"
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
              <!-- Indicador visual de problemas (icono) - Siempre presente para mantener alineación -->
              <td class="px-2 py-4 whitespace-nowrap w-8 text-center align-middle">
                <div 
                  class="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  @click.stop="navegarAHomologaciones(despacho)"
                  :title="hasRowIssues(despacho).hasErrors ? 'Error crítico - Click para ver homologaciones' : hasRowIssues(despacho).hasWarnings ? 'Advertencia - Click para ver homologaciones' : ''"
                >
                  <svg 
                    v-if="hasRowIssues(despacho).hasErrors"
                    class="w-5 h-5 text-red-600" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <svg 
                    v-else-if="hasRowIssues(despacho).hasWarnings"
                    class="w-5 h-5 text-amber-600" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
              </td>
              <template v-for="columnKey in orderedVisibleColumns" :key="columnKey">
                <!-- Orden Compra Cliente -->
                <td v-if="columnKey === 'orden_compra_cliente'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span v-if="despacho.orden_compra_cliente" class="font-mono">{{ despacho.orden_compra_cliente }}</span>
                  <span v-else class="text-gray-400 italic">-</span>
                </td>
                <!-- Número Factura -->
                <td v-else-if="columnKey === 'numero_factura'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{{ despacho.numero_factura || '-' }}</td>
                <!-- Fecha Despacho -->
                <td v-else-if="columnKey === 'fecha_despacho'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(despacho.fecha_despacho) }}</td>
                <!-- Estado -->
                <td v-else-if="columnKey === 'estado'" class="px-6 py-4 whitespace-nowrap">
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
              </template>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  @click="handleGenerarODC(despacho.despacho_id)"
                  class="px-3 py-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1"
                  :class="{ 'bg-gray-400 hover:bg-gray-400': tieneODC(despacho) }"
                  :disabled="sendingDespachoId === despacho.despacho_id || despacho.anulada || sendingMultiple || tieneODC(despacho) || hasRowIssues(despacho).hasWarnings || hasRowIssues(despacho).hasErrors"
                  :title="getButtonTooltip(despacho)"
                >
                  <svg v-if="sendingDespachoId === despacho.despacho_id" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <svg v-else-if="tieneODC(despacho)" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ sendingDespachoId === despacho.despacho_id ? 'Generando...' : tieneODC(despacho) ? 'ODC Generada' : hasRowIssues(despacho).hasWarnings || hasRowIssues(despacho).hasErrors ? 'ODC no disponible' : 'Generar ODC' }}
                </button>
              </td>
            </tr>
            
            <!-- Fila expandible con detalles (colores más claros) -->
            <tr v-if="detallesExpandidos.has(despacho.despacho_id)">
              <td :colspan="visibleColumnsCount + 4" class="px-6 py-4" :class="getDetallesContainerClass()">
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
                          <th class="w-8 px-2 py-2 text-center align-middle text-xs font-medium text-gray-600 uppercase border-r border-gray-300" title="Indicador de problemas">
                            <svg class="w-3 h-3 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase bg-gray-50">SKU</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase bg-gray-50 border-r border-gray-300">Producto</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase bg-blue-50">Cant. MBA3</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase bg-blue-50">Cant. SAP</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase bg-blue-50 border-r border-gray-300">Unidad SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase bg-amber-50">Precio Unit. MBA3</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase bg-amber-50 border-r border-gray-300">Precio Unit. SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase bg-green-50">Subtotal SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase bg-blue-50">Total Línea MBA3</th>
                        </tr>
                      </thead>
                      <tbody :class="getDetallesTbodyClass()">
                        <tr 
                          v-for="(detalle, index) in detallesPorDespacho[despacho.despacho_id]" 
                          :key="detalle.detalle_id || index" 
                          :class="[getDetallesRowClass(), getDetalleWarningClass(detalle)]"
                          :title="getDetalleTooltip(detalle)"
                        >
                          <!-- Indicador visual de problemas en detalle (icono) - Siempre presente para mantener alineación -->
                          <td class="px-2 py-2 whitespace-nowrap w-8 text-center align-middle">
                            <div 
                              class="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              @click.stop="navegarAHomologacionesPorSKU(detalle.sku)"
                              :title="hasDetalleIssues(detalle).hasErrors ? `Error crítico - Click para editar SKU ${detalle.sku}` : hasDetalleIssues(detalle).hasWarnings ? `Advertencia - Click para editar SKU ${detalle.sku}` : ''"
                            >
                              <svg 
                                v-if="hasDetalleIssues(detalle).hasErrors"
                                class="w-4 h-4 text-red-600" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                              </svg>
                              <svg 
                                v-else-if="hasDetalleIssues(detalle).hasWarnings"
                                class="w-4 h-4 text-amber-600" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                              </svg>
                            </div>
                          </td>
                          <td class="px-4 py-2 text-sm font-mono text-gray-900 font-semibold bg-gray-50">
                            <div class="flex items-center gap-2">
                              <span>{{ detalle.sku || '-' }}</span>
                              <button
                                v-if="detalle.sku"
                                @click="copyToClipboard(detalle.sku)"
                                class="text-gray-400 hover:text-violet-600 transition-colors flex-shrink-0"
                                title="Copiar SKU"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-900 bg-gray-50 border-r border-gray-200">
                            <div class="max-w-xs">
                              <div class="font-medium">{{ detalle.nombre_producto || '-' }}</div>
                            </div>
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center font-medium bg-blue-50">{{ formatNumber(detalle.cantidad_docena_mba3) }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center font-medium bg-blue-50">{{ detalle.cantidad_pack_sap !== null ? formatNumber(detalle.cantidad_pack_sap) : '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center font-mono bg-blue-50 border-r border-gray-200">{{ detalle.unidad_sap || '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right bg-amber-50">{{ formatCurrency(detalle.precio_unitario_mba3) }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right bg-amber-50 border-r border-gray-200">{{ detalle.precio_unitario_sap !== null ? formatCurrency(detalle.precio_unitario_sap) : '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right font-semibold bg-green-50">{{ formatCurrency(detalle.subtotal_sap) }}</td>
                          <td class="px-4 py-2 text-sm font-bold text-gray-900 text-right bg-blue-50">{{ formatCurrency(detalle.total_linea_mba3) }}</td>
                        </tr>
                      </tbody>
                      <tfoot v-if="detallesPorDespacho[despacho.despacho_id]?.length > 0" :class="getDetallesFooterClass()">
                        <tr>
                          <td colspan="8" class="px-4 py-2 text-sm font-semibold text-right border-t-2 border-gray-300" :class="getDetallesFooterTextClass()">Total:</td>
                          <td class="px-4 py-2 text-sm font-bold text-right border-t-2 border-l-2 border-gray-300 bg-green-100" :class="[getDetallesFooterBorderClass(), getDetallesFooterTextClass()]">
                            {{ formatCurrency(getTotalSubtotalSAP(despacho.despacho_id)) }}
                          </td>
                          <td class="px-4 py-2 text-sm font-bold text-right border-t-2 border-gray-300 bg-blue-100" :class="getDetallesFooterTextClass()">
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

    <!-- Modal de edición de homologación -->
    <HomologacionModal
      :is-open="modalAbierto"
      :homologacion="homologacionSeleccionada"
      :loading="guardando"
      @close="cerrarModal"
      @submit="guardarHomologacion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Despacho, DespachoDetalle } from '../types'
import type { SkuHomologacion, SkuHomologacionUpdateRequest } from '../types'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useToast } from '@/composables/useToast'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { useHomologacionesStore } from '../stores/homologacionesStore'
import HomologacionModal from './HomologacionModal.vue'

const props = defineProps<{
  despachos: Despacho[]
  loading?: boolean
  totalDespachos?: number
  processing?: boolean
  ordenesCompra?: Array<{ despacho_id?: string; referencia_despacho?: string }>
  initialSearch?: string
  currentPage?: number
  pageSize?: number
}>()

const emit = defineEmits<{
  'generar-odc': [despachoId: string]
  'generar-odc-multiples': [despachoIds: string[]]
  'filtered-count-changed': [count: number]
}>()

const router = useRouter()
const toast = useToast()
const homologacionesStore = useHomologacionesStore()

// Estado para el modal de homologación
const modalAbierto = ref(false)
const homologacionSeleccionada = ref<SkuHomologacion | null>(null)
const guardando = ref(false)

// Estado para detalles expandidos
const detallesExpandidos = ref<Set<string>>(new Set())
const detallesPorDespacho = ref<Record<string, DespachoDetalle[]>>({})
const loadingDetalles = ref<Record<string, boolean>>({})

// Búsqueda y filtros
const searchQuery = ref('')
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

// Función para verificar si ya existe una ODC para un despacho
function tieneODC(despacho: Despacho): boolean {
  // Si el backend proporciona el campo tiene_odc, usarlo directamente (más eficiente y confiable)
  if (despacho.tiene_odc !== undefined) {
    return despacho.tiene_odc
  }
  
  // Fallback: verificar en las órdenes de compra cargadas en el frontend
  // (solo si el backend no proporciona el campo)
  if (!props.ordenesCompra || props.ordenesCompra.length === 0) {
    return false
  }
  
  // Verificar si existe una ODC con el mismo despacho_id o referencia_despacho que coincida con codigo_factura
  return props.ordenesCompra.some(oc => 
    oc.despacho_id === despacho.despacho_id || 
    oc.referencia_despacho === despacho.codigo_factura ||
    oc.referencia_despacho === despacho.despacho_id
  )
}

// Columnas disponibles (en el orden especificado: Orden Compra Cliente, Número Factura, Fecha Despacho, Estado)
const availableColumns = [
  { key: 'orden_compra_cliente', label: 'Orden Compra Cliente', default: true },
  { key: 'numero_factura', label: 'Número Factura', default: true },
  { key: 'fecha_despacho', label: 'Fecha Despacho', default: true },
  { key: 'estado', label: 'Estado', default: true },
]

// Configuración de columnas usando composable híbrido
const defaultVisibleColumns = availableColumns.filter(col => col.default).map(col => col.key)
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns,
  resetPreferences: resetTablePreferences,
  selectAllColumns: selectAllTableColumns
} = useTablePreferences({
  tableId: 'despachos',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// Filtrar columnas que ya no existen en availableColumns (limpiar preferencias obsoletas)
const availableColumnKeys = availableColumns.map(col => col.key)
// Limpiar columnas obsoletas inmediatamente al montar y cuando cambien las columnas
watch([visibleColumns, columnOrder], () => {
  // Limpiar columnas visibles que no existen
  const validVisibleColumns = visibleColumns.value.filter(key => availableColumnKeys.includes(key))
  if (validVisibleColumns.length !== visibleColumns.value.length) {
    visibleColumns.value = validVisibleColumns.length > 0 ? validVisibleColumns : defaultVisibleColumns
  }
  
  // Limpiar orden de columnas que no existen
  const validColumnOrder = columnOrder.value.filter(key => availableColumnKeys.includes(key))
  if (validColumnOrder.length !== columnOrder.value.length) {
    columnOrder.value = validColumnOrder.length > 0 ? validColumnOrder : defaultColumnOrder
  }
}, { immediate: true })

// Watch para limpiar la selección de despachos que ya no son seleccionables (tienen ODC, están anulados, o tienen advertencias/errores)
watch(() => props.despachos, () => {
  // Remover de la selección los despachos que ya no son seleccionables
  selectedDespachos.value = selectedDespachos.value.filter(despachoId => {
    const despacho = props.despachos.find(d => d.despacho_id === despachoId)
    if (!despacho || despacho.anulada || tieneODC(despacho)) {
      return false
    }
    const { hasErrors, hasWarnings } = hasRowIssues(despacho)
    return !hasErrors && !hasWarnings
  })
}, { deep: true })

// Watch para aplicar búsqueda inicial cuando se navega desde OrdenCompraTable
watch(() => props.initialSearch, async (newSearch) => {
  if (newSearch) {
    searchQuery.value = newSearch
    // Expandir automáticamente el despacho si se encuentra
    const despacho = props.despachos.find(d => 
      d.despacho_id === newSearch || 
      d.codigo_factura === newSearch
    )
    if (despacho) {
      await toggleDetalles(despacho.despacho_id)
      // Scroll suave hacia el despacho después de un pequeño delay
      setTimeout(() => {
        const despachoElement = document.querySelector(`[data-despacho-id="${despacho.despacho_id}"]`)
        if (despachoElement) {
          despachoElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
  }
}, { immediate: true })

// Watch para actualizar el orden cuando se agregan nuevas columnas visibles
watch(visibleColumns, () => {
  const availableKeys = availableColumnKeys
  // Filtrar solo columnas válidas
  const validVisibleColumns = visibleColumns.value.filter(key => availableKeys.includes(key))
  
  const currentOrder = columnOrder.value.filter(key => availableKeys.includes(key))
  const missingInOrder = validVisibleColumns.filter(key => 
    availableKeys.includes(key) && !currentOrder.includes(key)
  )
  if (missingInOrder.length > 0) {
    columnOrder.value = [...currentOrder, ...missingInOrder]
  }
}, { deep: true })

// Computed para contar columnas visibles
const visibleColumnsCount = computed(() => visibleColumns.value.length)

// Funciones de utilidad
function isColumnVisible(key: string): boolean {
  return visibleColumns.value.includes(key)
}

function getColumnLabel(key: string): string {
  const column = availableColumns.find(col => col.key === key)
  return column?.label || key
}

function isColumnSortable(key: string): boolean {
  // Columnas no ordenables
  return !['estado', 'orden_compra_cliente'].includes(key)
}

function selectAllColumns() {
  const allKeys = availableColumns.map(col => col.key)
  visibleColumns.value = [...allKeys]
  columnOrder.value = [...allKeys]
}

function resetColumns() {
  resetTablePreferences()
}

// Funciones para drag and drop
const draggedColumn = ref<string | null>(null)
const dragOverColumn = ref<string | null>(null)

function handleDragStart(event: DragEvent, columnKey: string) {
  draggedColumn.value = columnKey
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', columnKey)
  }
}

function handleDragOver(event: DragEvent, columnKey: string) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverColumn.value = columnKey
}

function handleDragLeave() {
  dragOverColumn.value = null
}

function handleDrop(event: DragEvent, targetColumnKey: string) {
  event.preventDefault()
  
  if (!draggedColumn.value || draggedColumn.value === targetColumnKey) {
    draggedColumn.value = null
    dragOverColumn.value = null
    return
  }
  
  // Reordenar columnas
  const currentOrder = [...columnOrder.value]
  const draggedIndex = currentOrder.indexOf(draggedColumn.value)
  const targetIndex = currentOrder.indexOf(targetColumnKey)
  
  if (draggedIndex !== -1 && targetIndex !== -1) {
    // Remover la columna arrastrada
    currentOrder.splice(draggedIndex, 1)
    // Insertar en la nueva posición
    currentOrder.splice(targetIndex, 0, draggedColumn.value)
    columnOrder.value = currentOrder
  }
  
  draggedColumn.value = null
  dragOverColumn.value = null
}

function handleDragEnd() {
  draggedColumn.value = null
  dragOverColumn.value = null
}

// Ordenamiento
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Computed

const filteredDespachos = computed(() => {
  if (!props.despachos || !Array.isArray(props.despachos)) {
    return []
  }
  let filtered = [...props.despachos]
  
  // Búsqueda por texto
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(d => {
      // Búsqueda en campos del despacho principal
      const matchDespacho = 
        (d.numero_factura && String(d.numero_factura).includes(query)) ||
        (d.orden_compra_cliente && d.orden_compra_cliente.toLowerCase().includes(query))
      
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
  let sorted: Despacho[]
  
  if (!sortField.value) {
    sorted = [...filteredDespachos.value]
  } else {
    sorted = [...filteredDespachos.value]
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
  }
  
  // Aplicar paginación si se proporcionan los parámetros
  if (props.currentPage !== undefined && props.pageSize !== undefined && props.currentPage > 0 && props.pageSize > 0) {
    const start = (props.currentPage - 1) * props.pageSize
    const end = start + props.pageSize
    return sorted.slice(start, end)
  }
  
  return sorted
})

// Watch para emitir el conteo de despachos filtrados cuando cambie
// Debe estar después de la definición de filteredDespachos
watch(() => filteredDespachos.value, (newFiltered) => {
  try {
    if (newFiltered && Array.isArray(newFiltered)) {
      emit('filtered-count-changed', newFiltered.length)
    } else {
      emit('filtered-count-changed', 0)
    }
  } catch (error) {
    console.warn('Error al emitir conteo de despachos filtrados:', error)
  }
}, { immediate: true })

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

// Función para copiar al portapapeles
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('SKU copiado al portapapeles')
  } catch (err) {
    toast.error('Error al copiar', 'No se pudo copiar el SKU')
  }
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
  const despacho = props.despachos.find(d => d.despacho_id === despachoId)
  
  // No permitir seleccionar despachos anulados, que ya tienen ODC, o que tienen advertencias/errores
  if (!despacho || despacho.anulada || tieneODC(despacho)) {
    return
  }
  
  const { hasErrors, hasWarnings } = hasRowIssues(despacho)
  if (hasErrors || hasWarnings) {
    return
  }
  
  const index = selectedDespachos.value.indexOf(despachoId)
  if (index > -1) {
    selectedDespachos.value.splice(index, 1)
  } else {
    selectedDespachos.value.push(despachoId)
  }
}

function toggleSelectAll() {
  if (!hasSelectableDespachos.value) {
    return // No hacer nada si no hay despachos seleccionables
  }
  
  if (allSelected.value) {
    // Deseleccionar todas las seleccionables
    selectableDespachos.value.forEach(d => {
      const index = selectedDespachos.value.indexOf(d.despacho_id)
      if (index > -1) {
        selectedDespachos.value.splice(index, 1)
      }
    })
  } else {
    // Seleccionar todas las seleccionables
    selectableDespachos.value.forEach(d => {
      if (!selectedDespachos.value.includes(d.despacho_id)) {
        selectedDespachos.value.push(d.despacho_id)
      }
    })
  }
}

function clearSelection() {
  selectedDespachos.value = []
}

// Computed para obtener despachos seleccionables (no anulados, sin ODC, y sin advertencias/errores)
const selectableDespachos = computed(() => {
  return filteredDespachos.value.filter(d => {
    if (d.anulada || tieneODC(d)) {
      return false
    }
    const { hasErrors, hasWarnings } = hasRowIssues(d)
    return !hasErrors && !hasWarnings
  })
})

// Computed para verificar si hay despachos seleccionables
const hasSelectableDespachos = computed(() => {
  return selectableDespachos.value.length > 0
})

const allSelected = computed(() => {
  return hasSelectableDespachos.value && 
         selectableDespachos.value.every(d => selectedDespachos.value.includes(d.despacho_id))
})

const someSelected = computed(() => {
  return selectableDespachos.value.some(d => selectedDespachos.value.includes(d.despacho_id)) && !allSelected.value
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
  
  // Filtrar despachos que ya tienen ODC
  const despachosSinODC = selectedDespachos.value.filter(despachoId => {
    const despacho = props.despachos.find(d => d.despacho_id === despachoId)
    return despacho && !tieneODC(despacho)
  })
  
  const despachosConODC = selectedDespachos.value.length - despachosSinODC.length
  
  if (despachosSinODC.length === 0) {
    toast.warning('No hay despachos válidos', 'Todos los despachos seleccionados ya tienen ODC generada')
    return
  }
  
  if (despachosConODC > 0) {
    toast.info(
      'Algunos despachos ya tienen ODC', 
      `Se generarán ODCs para ${despachosSinODC.length} despacho(s). ${despachosConODC} despacho(s) ya tienen ODC y serán omitidos.`
    )
  }
  
  sendingMultiple.value = true
  emit('generar-odc-multiples', despachosSinODC)
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

// Función para detectar problemas en una fila de despacho
// Incluye problemas de la cabecera Y de sus detalles
function hasRowIssues(despacho: Despacho): { hasErrors: boolean; hasWarnings: boolean; issues: string[] } {
  const issues: string[] = []
  let hasErrors = false
  let hasWarnings = false

  // Errores críticos en la cabecera (rojo)
  if (!despacho.codigo_factura || despacho.codigo_factura.trim() === '') {
    issues.push('Falta código de factura')
    hasErrors = true
  }
  if (!despacho.empresa || despacho.empresa.trim() === '') {
    issues.push('Falta empresa')
    hasErrors = true
  }
  if (!despacho.codigo_cliente || despacho.codigo_cliente.trim() === '') {
    issues.push('Falta código de cliente')
    hasErrors = true
  }
  if (!despacho.fecha_despacho) {
    issues.push('Falta fecha de despacho')
    hasErrors = true
  }
  if (despacho.anulada) {
    issues.push('Despacho anulado')
    hasErrors = true
  }

  // Advertencias en la cabecera (amarillo/naranja)
  // Solo campos críticos que impiden enviar a SAP
  // NOTA: orden_compra, numero_pedido_sistema, codigo_bodega NO son críticos
  // (despachos sin estos campos se pueden enviar a SAP exitosamente si tienen los campos básicos)

  // Revisar problemas en los detalles del despacho
  // Si algún detalle tiene problemas, también resaltar la cabecera
  const detalles = detallesPorDespacho.value[despacho.despacho_id] || despacho.despacho_detalles || []
  
  // Solo advertir si no hay detalles disponibles (esto sí es crítico)
  if (detalles.length === 0) {
    issues.push('Sin detalles de despacho')
    hasWarnings = true
  }
  
  if (detalles.length > 0) {
    let detallesConErrores = 0
    let detallesConAdvertencias = 0
    const detallesIssuesList: string[] = []

    detalles.forEach((detalle, index) => {
      const detalleIssues = hasDetalleIssues(detalle)
      
      if (detalleIssues.hasErrors) {
        detallesConErrores++
        // Agregar solo el primer issue de cada detalle para no saturar
        if (detalleIssues.issues.length > 0) {
          detallesIssuesList.push(`Detalle ${index + 1}: ${detalleIssues.issues[0]}`)
        }
      } else if (detalleIssues.hasWarnings) {
        detallesConAdvertencias++
        // Agregar solo el primer issue de cada detalle para no saturar
        if (detalleIssues.issues.length > 0) {
          detallesIssuesList.push(`Detalle ${index + 1}: ${detalleIssues.issues[0]}`)
        }
      }
    })

    // Si hay errores en detalles, agregar a errores de cabecera
    if (detallesConErrores > 0) {
      hasErrors = true
      issues.push(`${detallesConErrores} detalle(s) con errores críticos`)
      // Agregar los primeros 2 issues de detalles
      issues.push(...detallesIssuesList.slice(0, 2))
    }
    
    // Si hay advertencias en detalles (y no hay errores), agregar a advertencias de cabecera
    if (detallesConAdvertencias > 0 && detallesConErrores === 0) {
      hasWarnings = true
      issues.push(`${detallesConAdvertencias} detalle(s) con advertencias`)
      // Agregar los primeros 2 issues de detalles
      issues.push(...detallesIssuesList.slice(0, 2))
    }
  }

  return { hasErrors, hasWarnings, issues }
}

// Función para obtener tooltip informativo
function getRowTooltip(despacho: Despacho): string {
  const { hasErrors, hasWarnings, issues } = hasRowIssues(despacho)
  
  if (hasErrors) {
    const errorCount = issues.filter(i => i.includes('Falta') || i.includes('anulado') || i.includes('errores críticos')).length
    return `⚠️ ERRORES CRÍTICOS (${errorCount}): ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? '...' : ''}`
  } else if (hasWarnings) {
    const warningCount = issues.filter(i => !i.includes('errores críticos')).length
    return `⚠️ ADVERTENCIAS (${warningCount}): ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? '...' : ''}`
  }
  
  return ''
}

// Función para obtener tooltip del botón "Generar ODC"
function getButtonTooltip(despacho: Despacho): string {
  if (despacho.anulada) {
    return 'No se puede generar ODC para despachos anulados'
  }
  
  if (tieneODC(despacho)) {
    return 'Ya existe una ODC para este despacho'
  }
  
  const { hasErrors, hasWarnings, issues } = hasRowIssues(despacho)
  
  if (hasErrors) {
    const errorCount = issues.length
    return `No se puede generar ODC: ${issues.slice(0, 2).join('; ')}${issues.length > 2 ? '...' : ''}`
  }
  
  if (hasWarnings) {
    const warningCount = issues.length
    return `No se puede generar ODC: ${issues.slice(0, 2).join('; ')}${issues.length > 2 ? '...' : ''}`
  }
  
  return 'Generar ODC para este despacho'
}

// Función para obtener tooltip del checkbox de selección
function getCheckboxTooltip(despacho: Despacho): string {
  if (despacho.anulada) {
    return 'No se puede seleccionar: despacho anulado'
  }
  
  if (tieneODC(despacho)) {
    return 'No se puede seleccionar: ya tiene ODC'
  }
  
  const { hasErrors, hasWarnings, issues } = hasRowIssues(despacho)
  
  if (hasErrors) {
    return `No se puede seleccionar: ${issues.slice(0, 2).join('; ')}${issues.length > 2 ? '...' : ''}`
  }
  
  if (hasWarnings) {
    return `No se puede seleccionar: ${issues.slice(0, 2).join('; ')}${issues.length > 2 ? '...' : ''}`
  }
  
  return 'Seleccionar este despacho'
}

// Función para obtener clases CSS según problemas detectados
// Mejora: Diferenciación más clara entre errores y advertencias
function getRowWarningClass(despacho: Despacho): string {
  const { hasErrors, hasWarnings } = hasRowIssues(despacho)
  
  if (hasErrors) {
    // ERRORES CRÍTICOS: Rojo más intenso y visible
    // Fondo rojo más intenso, borde rojo grueso, sombra sutil
    return 'bg-red-100/90 !border-l-4 !border-red-600 hover:bg-red-200/90 shadow-sm shadow-red-200/50'
  } else if (hasWarnings) {
    // ADVERTENCIAS: Amarillo/naranja más visible pero menos intenso que errores
    // Fondo amarillo claro, borde amarillo/naranja, sin sombra
    return 'bg-amber-50/90 !border-l-4 !border-amber-500 hover:bg-amber-100/90'
  }
  
  return ''
}

// Funciones para colores temáticos de cabecera y detalles
// Los despachos pertenecen al proceso "migrar" (violeta)
function getCabeceraRowClass(): string {
  // Colores más intensos para la cabecera (proceso migrar - violeta)
  // Borde izquierdo por defecto, pero puede ser sobrescrito por getRowWarningClass
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

// Función para detectar problemas en un detalle
function hasDetalleIssues(detalle: DespachoDetalle): { hasErrors: boolean; hasWarnings: boolean; issues: string[] } {
  const issues: string[] = []
  let hasErrors = false
  let hasWarnings = false

  // Errores críticos (rojo)
  if (!detalle.sku || detalle.sku.trim() === '') {
    issues.push('Falta SKU')
    hasErrors = true
  }
  if (!detalle.nombre_producto || detalle.nombre_producto.trim() === '') {
    issues.push('Falta nombre de producto')
    hasErrors = true
  }
  if (!detalle.detalle_id || detalle.detalle_id.trim() === '') {
    issues.push('Falta ID de detalle')
    hasErrors = true
  }
  if (detalle.cantidad_docena_mba3 === null || detalle.cantidad_docena_mba3 === undefined || detalle.cantidad_docena_mba3 === 0) {
    issues.push('Cantidad docena MBA3 nula o cero')
    hasErrors = true
  }
  if (detalle.precio_unitario_mba3 === null || detalle.precio_unitario_mba3 === undefined || detalle.precio_unitario_mba3 === 0) {
    issues.push('Precio unitario MBA3 nulo o cero')
    hasErrors = true
  }
  if (detalle.total_linea_mba3 === null || detalle.total_linea_mba3 === undefined || detalle.total_linea_mba3 === 0) {
    issues.push('Total línea MBA3 nulo o cero')
    hasErrors = true
  }

  // Advertencias (amarillo/naranja)
  if (detalle.cantidad_pack_sap === null || detalle.cantidad_pack_sap === undefined) {
    issues.push('Falta cantidad pack SAP')
    hasWarnings = true
  }
  if (!detalle.unidad_sap || detalle.unidad_sap.trim() === '') {
    issues.push('Falta unidad SAP')
    hasWarnings = true
  }
  if (detalle.precio_unitario_sap === null || detalle.precio_unitario_sap === undefined) {
    issues.push('Falta precio unitario SAP')
    hasWarnings = true
  }
  if (detalle.subtotal_sap === null || detalle.subtotal_sap === undefined || detalle.subtotal_sap === 0) {
    issues.push('Subtotal SAP nulo o cero')
    hasWarnings = true
  }
  if (!detalle.tipo_linea || detalle.tipo_linea.trim() === '') {
    issues.push('Falta tipo de línea')
    hasWarnings = true
  }
  if (detalle.descuento === null || detalle.descuento === undefined) {
    issues.push('Descuento no especificado')
    hasWarnings = true
  }

  return { hasErrors, hasWarnings, issues }
}

// Función para obtener clases CSS de advertencia para detalles
// Mejora: Diferenciación más clara entre errores y advertencias
function getDetalleWarningClass(detalle: DespachoDetalle): string {
  const { hasErrors, hasWarnings } = hasDetalleIssues(detalle)
  
  if (hasErrors) {
    // ERRORES CRÍTICOS: Rojo más intenso y visible
    // Fondo rojo más intenso, borde rojo grueso
    return 'bg-red-100/80 !border-l-4 !border-red-600 hover:bg-red-200/80'
  } else if (hasWarnings) {
    // ADVERTENCIAS: Amarillo/naranja más visible pero menos intenso que errores
    // Fondo amarillo claro, borde amarillo/naranja
    return 'bg-amber-50/80 !border-l-4 !border-amber-500 hover:bg-amber-100/80'
  }
  
  return ''
}

function getDetallesRowClass(): string {
  // Filas de detalles con hover temático
  return 'hover:bg-violet-50/40 transition-colors'
}

// Función para obtener tooltip informativo de detalles
function getDetalleTooltip(detalle: DespachoDetalle): string {
  const { hasErrors, hasWarnings, issues } = hasDetalleIssues(detalle)
  
  if (hasErrors) {
    return `❌ ERRORES CRÍTICOS: ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? '...' : ''}`
  } else if (hasWarnings) {
    return `⚠️ ADVERTENCIAS: ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? '...' : ''}`
  }
  
  return ''
}

// Función para abrir modal de homologación desde el despacho
async function navegarAHomologaciones(despacho: Despacho) {
  // Buscar si hay detalles con problemas de SKU en este despacho
  const detalles = detallesPorDespacho.value[despacho.despacho_id] || despacho.despacho_detalles || []
  const detalleConProblemas = detalles.find((d: DespachoDetalle) => {
    const issues = hasDetalleIssues(d)
    return issues.hasErrors || issues.hasWarnings
  })
  
  if (detalleConProblemas && detalleConProblemas.sku) {
    await abrirModalPorSKU(detalleConProblemas.sku, detalleConProblemas, despacho.despacho_id)
  } else {
    toast.info('Sin problemas de SKU', 'Este despacho no tiene detalles con problemas de SKU para homologar')
  }
}

// Función para abrir modal de homologación por SKU específico
async function navegarAHomologacionesPorSKU(sku: string | null | undefined) {
  if (!sku || sku.trim() === '') {
    toast.warning('SKU no disponible', 'Este detalle no tiene SKU para buscar en homologaciones')
    return
  }
  
  // Buscar el detalle que corresponde a este SKU
  const detalle = Object.values(detallesPorDespacho.value)
    .flat()
    .find((d: DespachoDetalle) => d.sku === sku.trim())
  
  await abrirModalPorSKU(sku.trim(), detalle || null, detalle?.despacho_id)
}

// Función auxiliar para abrir el modal con la homologación
async function abrirModalPorSKU(sku: string, detalle: DespachoDetalle | null, despachoId?: string) {
  try {
    // Buscar la homologación existente por SKU
    const response = await mba3ConsultasService.getSkuHomologaciones(1, 1, { sku })
    
    if (response.data && response.data.length > 0) {
      // Si existe, usar esa homologación
      homologacionSeleccionada.value = response.data[0]
      modalAbierto.value = true
    } else if (detalle) {
      // Si no existe, crear una homologación temporal con los datos del detalle
      homologacionSeleccionada.value = {
        sku_mba3: detalle.sku,
        nombre_producto_mba3: detalle.nombre_producto || '',
        precio_unitario_mba3: detalle.precio_unitario_mba3,
        cantidad_docena_mba3: detalle.cantidad_docena_mba3,
        total_linea_mba3: detalle.total_linea_mba3,
        sku_sap: detalle.sku || null,
        nombre_producto_sap: detalle.nombre_producto || null,
        precio_unitario_sap: detalle.precio_unitario_sap,
        cantidad_pack_sap: detalle.cantidad_pack_sap,
        unidad_sap: detalle.unidad_sap,
        subtotal_sap: detalle.subtotal_sap,
        estado: 'PENDIENTE',
        tiene_diferencias: false,
        tiene_datos_sap: detalle.precio_unitario_sap !== null || detalle.cantidad_pack_sap !== null || detalle.subtotal_sap !== null,
        detalle_id: detalle.detalle_id,
        despacho_id: despachoId || detalle.despacho_id,
      }
      modalAbierto.value = true
    } else {
      toast.warning('No se pudo crear la homologación', 'Faltan datos del detalle para crear la homologación')
    }
  } catch (error: any) {
    console.error('Error al buscar homologación:', error)
    toast.error('Error', 'No se pudo cargar la información de homologación')
  }
}

// Función para cerrar el modal
function cerrarModal() {
  modalAbierto.value = false
  homologacionSeleccionada.value = null
}

// Función para guardar la homologación
async function guardarHomologacion(data: SkuHomologacionUpdateRequest) {
  if (!homologacionSeleccionada.value) {
    toast.error('Error', 'No se pudo identificar la homologación')
    return
  }

  guardando.value = true
  try {
    // Si tiene homologacion_id, actualizar existente
    if (homologacionSeleccionada.value.homologacion_id) {
      await homologacionesStore.updateHomologacion(
        homologacionSeleccionada.value.homologacion_id,
        data
      )
      toast.success('Homologación actualizada', 'Los cambios se han guardado correctamente')
    } else {
      // Si no tiene ID, es una nueva homologación - necesitaríamos crear un endpoint para esto
      // Por ahora, mostramos un mensaje informativo
      toast.info('Homologación nueva', 'Esta es una nueva homologación. Por favor, sincroniza desde la pantalla de homologaciones para crearla.')
    }
    cerrarModal()
  } catch (error: any) {
    toast.error('Error al guardar', error.message)
  } finally {
    guardando.value = false
  }
}
</script>
