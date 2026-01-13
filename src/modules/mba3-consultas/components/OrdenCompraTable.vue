<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
    <!-- Header con búsqueda y acciones -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Órdenes de Compra</h2>
          <span class="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium">
            {{ (props.currentPage !== undefined && props.pageSize !== undefined && props.currentPage > 0 && props.pageSize > 0)
              ? `${sortedOrdenes.length} de ${filteredOrdenes.length} (${totalOrdenes || 0} total)` 
              : `${filteredOrdenes.length} de ${totalOrdenes || 0} órdenes` }}
          </span>
          <span v-if="selectedOrdenes.length > 0" class="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium">
            {{ selectedOrdenes.length }} seleccionadas
          </span>
        </div>
        
        <!-- Acciones en lote -->
        <div v-if="ordenesSeleccionables.length > 0 && !readOnly" class="flex items-center gap-2">
          <button
            @click="handleIntegrarSeleccionadas"
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            :disabled="props.loading || sendingMultiple || !hasPendientesSeleccionadas"
          >
            <svg v-if="sendingMultiple" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ sendingMultiple ? `Enviando ${ordenesSeleccionables.length}...` : `Enviar ${ordenesSeleccionables.length} a SAP` }}
          </button>
          <button
            v-if="allowDelete"
            @click="handleEliminarSeleccionadas"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            :disabled="loading || deleting || ordenesEliminables.length === 0"
            :title="ordenesNoEliminables.length > 0 ? `${ordenesNoEliminables.length} ODC creada(s) no se pueden eliminar` : ''"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {{ deleting ? 'Eliminando...' : ordenesEliminables.length > 0 ? `Eliminar ${ordenesEliminables.length}` : `Eliminar (${ordenesNoEliminables.length} bloqueadas)` }}
          </button>
          <button
            @click="clearSelection"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Limpiar selección
          </button>
        </div>
        <div v-else-if="selectedOrdenes.length > 0 && readOnly" class="flex items-center gap-2">
          <span class="text-sm text-gray-500">{{ selectedOrdenes.length }} seleccionada(s)</span>
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
              placeholder="Buscar en todos los campos..."
              class="block w-full pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
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
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
          
          <button
            @click="showColumnSelector = !showColumnSelector"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 relative bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Columnas
            <span v-if="visibleColumnsCount < availableColumns.length" class="ml-1 px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
              {{ visibleColumnsCount }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Selector de Columnas -->
      <div v-if="showColumnSelector" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors duration-300">Seleccionar Columnas</h3>
          <div class="flex items-center gap-2">
            <button
              @click="selectAllColumns"
              class="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              v-model="visibleColumns"
              :value="column.key"
              class="w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-200 transition-colors duration-300">{{ column.label }}</span>
          </label>
        </div>
      </div>
      
      <!-- Filtros avanzados -->
      <div v-if="showAdvancedFilters" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors duration-300">Fecha desde</label>
            <input
              v-model="filtroFechaDesde"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors duration-300">Fecha hasta</label>
            <input
              v-model="filtroFechaHasta"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 transition-colors duration-300">Número ODC SAP</label>
            <input
              v-model="filtroNumeroOC"
              type="text"
              placeholder="Buscar por número ODC SAP"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            @click="limpiarFiltros"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div v-if="filteredOrdenes.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400 transition-colors duration-300">
      <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm">{{ searchQuery ? 'No se encontraron órdenes con los filtros aplicados' : 'No se encontraron órdenes de compra' }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700/50 transition-colors duration-300">
          <tr>
            <th class="px-6 py-3 text-left">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
                :disabled="!hasSelectableOrdenes"
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :title="!hasSelectableOrdenes ? 'No hay ODCs seleccionables (todas están enviadas o tienen error)' : 'Seleccionar todas las ODCs pendientes'"
              />
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
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-grab transition-colors duration-300',
                isColumnSortable(columnKey) ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                draggedColumn === columnKey ? 'opacity-50 cursor-grabbing' : '',
                dragOverColumn === columnKey && draggedColumn !== columnKey ? 'bg-emerald-100 dark:bg-emerald-900/30 border-l-4 border-emerald-500 dark:border-emerald-400' : ''
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
            <th v-if="!readOnly" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
          <tr 
            v-for="oc in sortedOrdenes" 
            :key="oc.oc_id" 
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300"
            :class="[
              { 'bg-emerald-50 dark:bg-emerald-900/20': isSelected(oc.oc_id) },
              getRowWarningClass(oc)
            ]"
            :title="hasRowIssues(oc).issues.length > 0 ? 'Problemas: ' + hasRowIssues(oc).issues.join(', ') : ''"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                :checked="isSelected(oc.oc_id)"
                @change="toggleSelect(oc.oc_id)"
                :disabled="oc.estado !== 'PENDIENTE'"
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                :title="oc.estado === 'ENVIADA' ? 'Esta ODC ya fue enviada a SAP' : oc.estado === 'ERROR' ? 'Esta ODC tiene un error y no se puede enviar' : ''"
              />
            </td>
            <template v-for="columnKey in orderedVisibleColumns" :key="columnKey">
              <!-- ODC ID -->
              <td v-if="columnKey === 'oc_id'" class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <span class="font-semibold">{{ oc.oc_id.substring(0, 8) }}...</span>
                <button
                  @click="copyToClipboard(oc.oc_id)"
                  class="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                  title="Copiar ID completo"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </td>
              <!-- Origen (Pedido vs Despacho) -->
              <td v-else-if="columnKey === 'origen'" class="px-6 py-4 whitespace-nowrap text-sm">
                <span 
                  v-if="oc.pedido_id"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                  title="OC generada desde un pedido confirmado"
                >
                  📦 Pedido
                </span>
                <span 
                  v-else
                  class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                  title="OC generada desde despacho (legacy)"
                >
                  🚚 Despacho
                </span>
              </td>
              <!-- Referencia Despacho -->
              <td v-else-if="columnKey === 'referencia_despacho'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <button
                  v-if="oc.referencia_despacho"
                  @click="handleVerEnDespachos(oc.referencia_despacho)"
                  class="font-mono px-2 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-violet-200 dark:hover:bg-violet-900/70"
                  :title="`Ver despacho: ${oc.referencia_despacho}`"
                >
                  {{ oc.referencia_despacho }}
                </button>
                <span v-else class="text-gray-400 dark:text-gray-500 italic transition-colors duration-300">-</span>
              </td>
              <!-- Fecha Generación -->
              <td v-else-if="columnKey === 'fecha_generacion'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <div>{{ formatDate(oc.fecha_generacion) }}</div>
              </td>
              <!-- Fecha Creación -->
              <td v-else-if="columnKey === 'created_at'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <div v-if="oc.created_at" class="space-y-0.5">
                  <div>{{ formatDate(oc.created_at) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">{{ getTimeAgo(oc.created_at) }}</div>
                </div>
                <span v-else class="text-gray-400 dark:text-gray-500 italic transition-colors duration-300">-</span>
              </td>
              <!-- Fecha Procesado -->
              <td v-else-if="columnKey === 'fecha_procesado'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <div v-if="oc.fecha_procesado" class="space-y-0.5">
                  <div>{{ formatDate(oc.fecha_procesado) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">{{ getTimeAgo(oc.fecha_procesado) }}</div>
                </div>
                <span v-else class="text-gray-400 dark:text-gray-500 italic transition-colors duration-300">-</span>
              </td>
              <!-- Estado -->
              <td v-else-if="columnKey === 'estado'" class="px-6 py-4 whitespace-nowrap">
                <div class="relative group inline-block">
                  <button
                    v-if="oc.estado === 'ENVIADA' || oc.estado === 'ERROR'"
                    @click="handleVerEnHistorial(oc.oc_id)"
                    :class="getEstadoClass(oc.estado)"
                    class="cursor-pointer transition-all duration-200 hover:scale-105"
                    :title="'Ver en historial: ' + oc.oc_id"
                  >
                    {{ oc.estado }}
                  </button>
                  <span
                    v-else
                    :class="getEstadoClass(oc.estado)"
                    class="cursor-help transition-all duration-200 hover:scale-105"
                  >
                    {{ oc.estado }}
                  </span>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out pointer-events-none whitespace-nowrap z-[9999]">
                    {{ oc.estado === 'ENVIADA' || oc.estado === 'ERROR' ? `Ver detalles en historial: ${oc.oc_id}` : getEstadoTooltip(oc) }}
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div class="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </td>
              <!-- Número ODC SAP -->
              <td v-else-if="columnKey === 'numero_oc_sap'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <div v-if="oc.numero_oc_sap" class="flex items-center gap-2">
                  <span class="font-mono">{{ oc.numero_oc_sap }}</span>
                  <span v-if="oc.doc_entry" class="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">(Entry: {{ oc.doc_entry }})</span>
                </div>
                <span v-else class="text-gray-400 dark:text-gray-500 italic transition-colors duration-300">-</span>
              </td>
              <!-- DocEntry SAP -->
              <td v-else-if="columnKey === 'doc_entry'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <div v-if="oc.doc_entry" class="flex items-center gap-2">
                  <span class="font-mono font-semibold text-emerald-700 dark:text-emerald-400 transition-colors duration-300">{{ oc.doc_entry }}</span>
                  <span class="px-1.5 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded transition-colors duration-300" title="OC ya enviada a SAP">✓</span>
                </div>
                <span v-else class="text-gray-400 dark:text-gray-500 italic transition-colors duration-300">-</span>
              </td>
              <!-- Respuesta SAP -->
              <td v-else-if="columnKey === 'respuesta_sap'" class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <div v-if="oc.respuesta_sap" class="max-w-xs">
                  <div class="flex items-start gap-2">
                    <div class="flex-1">
                      <div class="text-xs font-medium text-gray-700 dark:text-gray-300 break-words transition-colors duration-300">{{ oc.respuesta_sap }}</div>
                    </div>
                    <button
                      @click="copyToClipboard(oc.respuesta_sap || '')"
                      class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 transition-colors duration-300"
                      title="Copiar respuesta"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span v-else class="text-gray-400 dark:text-gray-500 italic transition-colors duration-300">-</span>
              </td>
            </template>
            <td v-if="!readOnly" class="px-6 py-4 whitespace-nowrap text-sm">
              <!-- Si tiene doc_entry, ya fue enviada - mostrar mensaje -->
              <div v-if="oc.doc_entry !== null && oc.doc_entry !== undefined" class="flex flex-col gap-1">
                <div class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors duration-300">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Ya enviada (Entry: {{ oc.doc_entry }})</span>
                </div>
                <button
                  v-if="oc.numero_oc_sap"
                  @click="copyToClipboard(`DocEntry: ${oc.doc_entry}, DocNum: ${oc.numero_oc_sap}`)"
                  class="text-xs text-gray-500 hover:text-gray-700 underline"
                  title="Copiar información de SAP"
                >
                  Copiar info SAP
                </button>
              </div>
              <!-- Si está pendiente y no tiene doc_entry, mostrar botones de acción -->
              <div v-else-if="oc.estado === 'PENDIENTE'">
                <!-- Botón Enviar -->
                <button 
                  @click="handleIntegrar(oc.referencia_despacho, oc.oc_id)" 
                  class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  :disabled="loading || sendingOcId === oc.oc_id"
                  title="Enviar a SAP"
                >
                  {{ sendingOcId === oc.oc_id ? 'Enviando...' : 'Enviar' }}
                </button>
              </div>
              <span v-else class="text-gray-400 italic">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { OrdenCompra } from '../types'
import { useToast } from '@/composables/useToast'
import { useTablePreferences } from '@/composables/useTablePreferences'

const props = defineProps<{
  ordenesCompra: OrdenCompra[]
  loading?: boolean
  totalOrdenes?: number
  allowDelete?: boolean // Permite mostrar el botón de eliminar
  readOnly?: boolean // Modo solo lectura (oculta acciones de integración)
  currentPage?: number
  pageSize?: number
}>()

const emit = defineEmits<{
  integrar: [referenciaDespacho: string, almacenDestino?: string]
  integrarMultiples: [referenciasDespacho: string[]]
  eliminar: [ocIds: string[]]
  'filtered-count-changed': [count: number]
}>()

const toast = useToast()
const router = useRouter()

// Estado de selección
const selectedOrdenes = ref<string[]>([])
const deleting = ref(false)

// Estado para rastrear qué ODC individual se está enviando
const sendingOcId = ref<string | null>(null)

// Estado para rastrear cuando se están enviando múltiples ODC
const sendingMultiple = ref(false)

// Estado para almacén destino (opcional, ya no se muestra en UI pero se mantiene para compatibilidad)
const selectedAlmacen = ref<Record<string, string>>({}) // Almacén seleccionado por cada ODC (no se usa en UI)

// Lista de almacenes disponibles
const almacenesDisponibles = [
  { codigo: 'RL-CD', nombre: 'Roland' },
  { codigo: 'RG-CD', nombre: 'Regions' },
  { codigo: 'OUT-CD', nombre: 'Descuentón' }
]

// Búsqueda y filtros
const searchQuery = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const filtroNumeroOC = ref('')
const showAdvancedFilters = ref(false)
const showColumnSelector = ref(false)

// Columnas disponibles
const availableColumns = [
  { key: 'oc_id', label: 'ODC ID', default: true },
  { key: 'origen', label: 'Origen', default: true },  // ⭐ NUEVO - Pedido vs Despacho
  { key: 'referencia_despacho', label: 'Referencia Despacho', default: true },
  { key: 'fecha_generacion', label: 'Fecha Generación', default: true },
  { key: 'created_at', label: 'Fecha Creación', default: props.readOnly || false },
  { key: 'fecha_procesado', label: 'Fecha Procesado', default: props.readOnly || false },
  { key: 'estado', label: 'Estado', default: true },
  { key: 'numero_oc_sap', label: 'Número ODC SAP', default: false },
  { key: 'doc_entry', label: 'DocEntry SAP', default: false },  // ⭐ NUEVO - Para trazabilidad
  { key: 'respuesta_sap', label: 'Respuesta SAP', default: props.readOnly || false },
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
  tableId: 'ordenes-compra',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// Watch para limpiar la selección de ODCs que ya no son seleccionables (no pendientes)
watch(() => props.ordenesCompra, (newOrdenes) => {
  // Remover de la selección las ODCs que no están pendientes
  selectedOrdenes.value = selectedOrdenes.value.filter(ocId => {
    const oc = newOrdenes.find(o => o.oc_id === ocId)
    return oc && oc.estado === 'PENDIENTE'
  })
  
  // IMPORTANTE: Limpiar sendingOcId si la orden cambió de estado
  // Esto fuerza que el botón se actualice visualmente cuando el estado cambia de PENDIENTE a ENVIADA/ERROR
  if (sendingOcId.value) {
    const ordenEnviada = newOrdenes.find(o => o.oc_id === sendingOcId.value)
    
    if (ordenEnviada && ordenEnviada.estado !== 'PENDIENTE') {
      // La orden ya no está pendiente, limpiar el estado de envío para que el botón desaparezca
      console.log(`[OrdenCompraTable] ✅ Botón deshabilitado: ${sendingOcId.value} cambió a ${ordenEnviada.estado}`)
      sendingOcId.value = null
    }
  }
}, { deep: true, immediate: true })

// Watch para actualizar el orden cuando se agregan nuevas columnas visibles
watch(visibleColumns, () => {
  const availableKeys = availableColumns.map(col => col.key)
  const currentOrder = columnOrder.value.filter(key => availableKeys.includes(key))
  const missingInOrder = visibleColumns.value.filter(key => 
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
  return !['estado', 'numero_oc_sap', 'doc_entry', 'respuesta_sap', 'origen'].includes(key)
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

const filteredOrdenes = computed(() => {
  if (!props.ordenesCompra || !Array.isArray(props.ordenesCompra)) {
    return []
  }
  let filtered = [...props.ordenesCompra]
  
  // Búsqueda por texto en todos los campos
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(oc => {
      // Función auxiliar para convertir valores a string y buscar
      const searchInField = (value: any): boolean => {
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(query)
      }
      
      // Función auxiliar para formatear fechas y buscar
      const searchInDate = (dateString: string | null | undefined): boolean => {
        if (!dateString) return false
        try {
          const date = new Date(dateString)
          const formattedDate = formatDate(dateString).toLowerCase()
          const timeAgo = getTimeAgo(dateString).toLowerCase()
          return formattedDate.includes(query) || timeAgo.includes(query) || dateString.toLowerCase().includes(query)
        } catch {
          return dateString.toLowerCase().includes(query)
        }
      }
      
      return (
        searchInField(oc.oc_id) ||
        searchInField(oc.referencia_despacho) ||
        searchInField(oc.numero_oc_sap) ||
        searchInField(oc.respuesta_sap) ||
        searchInField(oc.estado) ||
        searchInField(oc.proveedor) ||
        searchInField(oc.despacho_id) ||
        searchInDate(oc.fecha_generacion) ||
        searchInDate(oc.fecha_procesado) ||
        searchInDate(oc.created_at) ||
        searchInField(oc.error_message) ||
        searchInField(oc.error_code) ||
        searchInField(oc.error_source)
      )
    })
  }
  
  // Filtro por fecha
  if (filtroFechaDesde.value) {
    const fechaDesde = new Date(filtroFechaDesde.value)
    filtered = filtered.filter(oc => new Date(oc.fecha_generacion) >= fechaDesde)
  }
  
  if (filtroFechaHasta.value) {
    const fechaHasta = new Date(filtroFechaHasta.value)
    fechaHasta.setHours(23, 59, 59, 999)
    filtered = filtered.filter(oc => new Date(oc.fecha_generacion) <= fechaHasta)
  }
  
  // Filtro por número ODC SAP
  if (filtroNumeroOC.value) {
    filtered = filtered.filter(oc => 
      oc.numero_oc_sap && oc.numero_oc_sap.toLowerCase().includes(filtroNumeroOC.value.toLowerCase())
    )
  }
  
  return filtered
})

const sortedOrdenes = computed(() => {
  let sorted: OrdenCompra[]
  
  if (!sortField.value) {
    sorted = [...filteredOrdenes.value]
  } else {
    sorted = [...filteredOrdenes.value]
    sorted.sort((a, b) => {
      const aValue = a[sortField.value as keyof OrdenCompra]
      const bValue = b[sortField.value as keyof OrdenCompra]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection.value === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortDirection.value === 'asc' 
        ? (aValue as any) - (bValue as any)
        : (bValue as any) - (aValue as any)
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

// Watch para emitir el conteo de órdenes filtradas cuando cambie
// Debe estar después de la definición de filteredOrdenes
watch(() => filteredOrdenes.value, (newFiltered) => {
  try {
    if (newFiltered && Array.isArray(newFiltered)) {
      emit('filtered-count-changed', newFiltered.length)
    } else {
      emit('filtered-count-changed', 0)
    }
  } catch (error) {
    console.warn('Error al emitir conteo de órdenes filtradas:', error)
  }
}, { immediate: true })

// Computed para obtener ODCs seleccionables (solo pendientes y sin doc_entry)
const selectableOrdenes = computed(() => {
  return filteredOrdenes.value.filter(oc => 
    oc.estado === 'PENDIENTE' && 
    (oc.doc_entry === null || oc.doc_entry === undefined)
  )
})

// Computed para verificar si hay ODCs seleccionables
const hasSelectableOrdenes = computed(() => {
  return selectableOrdenes.value.length > 0
})

// Computed para obtener ODCs seleccionadas que están pendientes (seleccionables)
// Excluir las que ya tienen doc_entry (ya fueron enviadas)
const ordenesSeleccionables = computed(() => {
  return selectedOrdenes.value.filter(id => {
    const oc = props.ordenesCompra.find(o => o.oc_id === id)
    return oc && oc.estado === 'PENDIENTE' && (oc.doc_entry === null || oc.doc_entry === undefined)
  })
})

const allSelected = computed(() => {
  return hasSelectableOrdenes.value && 
         selectableOrdenes.value.every(oc => selectedOrdenes.value.includes(oc.oc_id))
})

const someSelected = computed(() => {
  return selectableOrdenes.value.some(oc => selectedOrdenes.value.includes(oc.oc_id)) && !allSelected.value
})

const hasPendientesSeleccionadas = computed(() => {
  return ordenesSeleccionables.value.some(id => {
    const oc = props.ordenesCompra.find(o => o.oc_id === id)
    return oc && oc.estado === 'PENDIENTE'
  })
})

// Computed para verificar si todas las órdenes seleccionables tienen almacén asignado
const todasSeleccionadasTienenAlmacen = computed(() => {
  if (ordenesSeleccionables.value.length === 0) return false
  
  return ordenesSeleccionables.value.every(id => {
    return selectedAlmacen.value[id] !== undefined && selectedAlmacen.value[id] !== ''
  })
})

// Computed para obtener las ODC seleccionadas que se pueden eliminar (sin created_at)
const ordenesEliminables = computed(() => {
  if (!props.allowDelete) return []
  return selectedOrdenes.value.filter(ocId => {
    const oc = props.ordenesCompra.find(o => o.oc_id === ocId)
    return oc && !oc.created_at
  })
})

// Computed para obtener las ODC seleccionadas que NO se pueden eliminar (con created_at)
const ordenesNoEliminables = computed(() => {
  if (!props.allowDelete) return []
  return selectedOrdenes.value.filter(ocId => {
    const oc = props.ordenesCompra.find(o => o.oc_id === ocId)
    return oc && oc.created_at
  })
})

// Funciones
function isSelected(ocId: string): boolean {
  return selectedOrdenes.value.includes(ocId)
}

function toggleSelect(ocId: string) {
  const oc = props.ordenesCompra.find(o => o.oc_id === ocId)
  
  // Solo permitir seleccionar ODCs con estado PENDIENTE
  if (!oc || oc.estado !== 'PENDIENTE') {
    return
  }
  
  const index = selectedOrdenes.value.indexOf(ocId)
  if (index > -1) {
    selectedOrdenes.value.splice(index, 1)
  } else {
    selectedOrdenes.value.push(ocId)
  }
}

function toggleSelectAll() {
  if (!hasSelectableOrdenes.value) {
    return // No hacer nada si no hay ODCs seleccionables
  }
  
  if (allSelected.value) {
    // Deseleccionar todas las seleccionables
    selectableOrdenes.value.forEach(oc => {
      const index = selectedOrdenes.value.indexOf(oc.oc_id)
      if (index > -1) {
        selectedOrdenes.value.splice(index, 1)
      }
    })
  } else {
    // Seleccionar todas las seleccionables (no enviadas)
    selectableOrdenes.value.forEach(oc => {
      if (!selectedOrdenes.value.includes(oc.oc_id)) {
        selectedOrdenes.value.push(oc.oc_id)
      }
    })
  }
}

function clearSelection() {
  selectedOrdenes.value = []
}

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
  filtroNumeroOC.value = ''
  showAdvancedFilters.value = false
}


async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('ID copiado al portapapeles')
  } catch (err) {
    toast.error('Error al copiar', 'No se pudo copiar el ID')
  }
}

async function handleIntegrar(referenciaDespacho: string, ocId: string) {
  // Prevenir múltiples clics
  if (sendingOcId.value === ocId || props.loading) {
    return
  }
  
  // Encontrar la OC para validar
  const oc = props.ordenesCompra.find(o => o.oc_id === ocId)
  
  // ⚠️ Validar que no tenga doc_entry (ya fue enviada)
  if (oc && oc.doc_entry !== null && oc.doc_entry !== undefined) {
    toast.warning(
      'OC ya enviada', 
      `Esta OC ya fue enviada a SAP (DocEntry: ${oc.doc_entry}${oc.numero_oc_sap ? `, DocNum: ${oc.numero_oc_sap}` : ''}). No se puede reenviar.`
    )
    return
  }
  
  // Obtener almacén seleccionado (opcional)
  const almacen = selectedAlmacen.value[ocId]
  
  try {
    sendingOcId.value = ocId
    // Pasar el almacén destino seleccionado (opcional, si existe)
    emit('integrar', referenciaDespacho, almacen || undefined)
    // El estado se limpiará cuando el componente padre termine la operación
    // Pero como no podemos saber cuándo termina directamente, lo hacemos después de un pequeño delay
    // El componente padre debería manejar la actualización del estado
  } catch (error) {
    sendingOcId.value = null
  }
}


function handleIntegrarSeleccionadas() {
  if (sendingMultiple.value || props.loading) {
    return
  }
  
  // Usar solo las ODCs seleccionables (no enviadas y sin doc_entry)
  if (ordenesSeleccionables.value.length === 0) {
    toast.warning('No hay órdenes seleccionadas', 'Las órdenes seleccionadas ya fueron enviadas o tienen doc_entry asignado')
    return
  }
  
  // Obtener datos de las órdenes seleccionadas
  const ordenesSeleccionadasData = ordenesSeleccionables.value
    .map(id => {
      const oc = props.ordenesCompra.find(o => o.oc_id === id)
      const almacen = selectedAlmacen.value[id]
      return { oc, almacen, id }
    })
  
  // Validar que no tengan doc_entry (doble validación)
  const ordenesConDocEntry = ordenesSeleccionadasData.filter(({ oc }) => 
    oc && oc.doc_entry !== null && oc.doc_entry !== undefined
  )
  
  if (ordenesConDocEntry.length > 0) {
    toast.warning(
      'OC ya enviada', 
      `${ordenesConDocEntry.length} orden(es) seleccionada(s) ya tienen DocEntry asignado (ya fueron enviadas). Se excluirán del envío.`
    )
    // Continuar con las que no tienen doc_entry
  }
  
  const referencias = ordenesSeleccionadasData
    .filter(({ oc }) => 
      oc && 
      oc.estado === 'PENDIENTE' && 
      (oc.doc_entry === null || oc.doc_entry === undefined)
    )
    .map(({ oc }) => oc!.referencia_despacho)
  
  if (referencias.length === 0) {
    toast.warning('No hay órdenes pendientes seleccionadas', 'Todas las órdenes seleccionadas ya fueron enviadas')
    return
  }
  
  sendingMultiple.value = true
  emit('integrarMultiples', referencias)
}

function handleEliminarSeleccionadas() {
  if (selectedOrdenes.value.length === 0) {
    toast.warning('No hay órdenes seleccionadas')
    return
  }
  
  // Filtrar las ODC que tienen created_at (no se pueden eliminar)
  const ordenesAEliminar = selectedOrdenes.value.filter(ocId => {
    const oc = props.ordenesCompra.find(o => o.oc_id === ocId)
    return oc && !oc.created_at
  })
  
  const ordenesConCreatedAt = selectedOrdenes.value.filter(ocId => {
    const oc = props.ordenesCompra.find(o => o.oc_id === ocId)
    return oc && oc.created_at
  })
  
  if (ordenesConCreatedAt.length > 0) {
    toast.warning(
      'Algunas ODC no se pueden eliminar', 
      `${ordenesConCreatedAt.length} orden(es) creada(s) no pueden ser eliminada(s)`
    )
  }
  
  if (ordenesAEliminar.length === 0) {
    toast.warning('No hay órdenes eliminables', 'Todas las órdenes seleccionadas ya fueron creadas')
    return
  }
  
  emit('eliminar', ordenesAEliminar)
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return dateString
    }
    
    // Obtener componentes de fecha en la zona horaria local (sin hora)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

function getTimeAgo(dateString: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return ''
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
    
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `Hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`
    
    const diffYears = Math.floor(diffDays / 365)
    return `Hace ${diffYears} año${diffYears > 1 ? 's' : ''}`
  } catch {
    return ''
  }
}

// Función para detectar problemas en una fila de orden de compra
function hasRowIssues(oc: OrdenCompra): { hasErrors: boolean; hasWarnings: boolean; issues: string[] } {
  const issues: string[] = []
  let hasErrors = false
  let hasWarnings = false

  // Errores críticos (rojo)
  if (oc.estado === 'ERROR') {
    issues.push('Estado: ERROR')
    hasErrors = true
  }
  if (!oc.proveedor || oc.proveedor.trim() === '') {
    issues.push('Falta proveedor')
    hasErrors = true
  }
  if (!oc.referencia_despacho || oc.referencia_despacho.trim() === '') {
    issues.push('Falta referencia de despacho')
    hasErrors = true
  }
  if (!oc.fecha_generacion) {
    issues.push('Falta fecha de generación')
    hasErrors = true
  }
  if (oc.error_message) {
    issues.push(`Error: ${oc.error_message}`)
    hasErrors = true
  }

  // Advertencias (amarillo/naranja)
  if (oc.estado === 'ENVIADA' && !oc.numero_oc_sap) {
    issues.push('Enviada pero sin número ODC SAP')
    hasWarnings = true
  }
  if (!oc.created_at) {
    issues.push('Falta fecha de creación')
    hasWarnings = true
  }
  if (oc.estado === 'ENVIADA' && !oc.fecha_procesado) {
    issues.push('Enviada pero sin fecha de procesado')
    hasWarnings = true
  }
  if (oc.error_code && !oc.error_message) {
    issues.push(`Código de error: ${oc.error_code}`)
    hasWarnings = true
  }
  if (oc.error_source && oc.estado !== 'ERROR') {
    issues.push(`Fuente de error: ${oc.error_source}`)
    hasWarnings = true
  }

  return { hasErrors, hasWarnings, issues }
}

// Función para obtener clases CSS según problemas detectados
function getRowWarningClass(oc: OrdenCompra): string {
  const { hasErrors, hasWarnings } = hasRowIssues(oc)
  
  if (hasErrors) {
    // Fondo rojo claro con borde rojo para errores críticos
    return 'bg-red-50/80 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 hover:bg-red-100/80 dark:hover:bg-red-900/30'
  } else if (hasWarnings) {
    // Fondo amarillo/naranja claro con borde amarillo para advertencias
    return 'bg-yellow-50/80 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-600 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/30'
  }
  
  return ''
}

function getEstadoClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE': 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 transition-colors duration-300',
    'ENVIADA': 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 transition-colors duration-300',
    'ERROR': 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 transition-colors duration-300',
  }
  return classes[estado] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors duration-300'
}

function getEstadoTooltip(oc: OrdenCompra): string {
  if (oc.estado === 'PENDIENTE') {
    return 'Lista para enviar a SAP'
  }
  if (oc.estado === 'ENVIADA') {
    return 'Enviada exitosamente a SAP'
  }
  if (oc.estado === 'ERROR') {
    if (oc.error_source?.toUpperCase() === 'SAP' && oc.error_code) {
      // Mensaje específico para errores de SAP
      const errorMessages: Record<string, string> = {
        '401': 'Error de autenticación',
        '403': 'Sin permisos',
        'VALIDATION_ERROR': 'Error de validación',
        'INVALID_CARDCODE': 'Proveedor no existe',
        'INVALID_ITEMCODE': 'Artículo no existe',
        'CONNECTION_ERROR': 'Error de conexión',
        'TIMEOUT': 'Tiempo de espera agotado',
      }
      const friendlyMessage = errorMessages[oc.error_code.toUpperCase()] || `Error ${oc.error_code}`
      return friendlyMessage
    }
    return oc.error_message || 'Error al enviar a SAP'
  }
  return 'Estado desconocido'
}

function handleVerEnHistorial(ocId: string) {
  router.push({
    path: '/mba3-consultas/ordenes-compra',
    query: { oc_id: ocId }
  })
}

function handleVerEnDespachos(referenciaDespacho: string) {
  router.push({
    path: '/mba3-consultas/proceso',
    query: { 
      tab: 'migrar',
      despacho_id: referenciaDespacho 
    }
  })
}

// Exponer función para limpiar el estado de envío (llamada por el componente padre después de completar)
function clearSendingState() {
  sendingOcId.value = null
}

// Función para limpiar el estado de envío múltiple (llamada por el componente padre después de completar)
function clearSendingMultipleState() {
  sendingMultiple.value = false
}

onMounted(() => {
  // Listeners removidos - ya no hay dropdown de almacén
})

onUnmounted(() => {
  // Cleanup removido - ya no hay listeners
})

// Exponer funciones para que el componente padre pueda llamarlas
defineExpose({
  clearSendingState,
  clearSelection,
  clearSendingMultipleState
})
</script>
