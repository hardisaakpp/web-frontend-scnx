<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
    <!-- Header con acciones -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Órdenes de Compra</h2>
        </div>
      </div>
      
      <!-- Acciones (Columnas) -->
      <div class="mt-4 flex flex-col md:flex-row gap-3">
        <div class="flex items-center gap-2">
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
    </div>

    <!-- Tabla -->
    <div v-if="filteredOrdenes.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400 transition-colors duration-300">
      <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm">No se encontraron órdenes de compra</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700/50 transition-colors duration-300">
          <tr>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300 w-12">#</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300 w-12">
              Detalles
            </th>
            <th
              v-for="columnKey in effectiveVisibleColumns"
              :key="columnKey"
              :draggable="true"
              @dragstart="handleDragStart($event, columnKey)"
              @dragover="handleDragOver($event, columnKey)"
              @dragleave="handleDragLeave"
              @drop="handleDrop($event, columnKey)"
              @dragend="handleDragEnd"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-grab transition-colors duration-300',
                columnKey === 'numero_oc_sap' ? 'min-w-[10rem] w-40' : '',
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
            <th v-if="!props.readOnly" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
          <template v-for="(oc, ocIndex) in sortedOrdenes" :key="oc.oc_id">
          <tr 
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300"
            :class="[
              { 'bg-emerald-50 dark:bg-emerald-900/20': isSelected(oc.oc_id) },
              getRowWarningClass(oc)
            ]"
            :title="hasRowIssues(oc).issues.length > 0 ? 'Problemas: ' + hasRowIssues(oc).issues.join(', ') : ''"
          >
            <td class="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
              {{ ((props.currentPage || 1) - 1) * (props.pageSize || 10) + Number(ocIndex) + 1 }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center align-middle">
              <button
                @click="toggleDetalles(oc.oc_id)"
                class="text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors inline-flex items-center justify-center"
                :disabled="loadingDetalles[oc.oc_id]"
                title="Ver detalles de la orden de compra"
              >
                <svg 
                  class="w-5 h-5 transform transition-transform"
                  :class="{ 'rotate-90': detallesExpandidos.has(oc.oc_id) }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </td>
            <template v-for="columnKey in effectiveVisibleColumns" :key="columnKey">
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
                <div v-if="oc.referencia_despacho" class="inline-flex items-center gap-2">
                  <span
                    class="font-mono px-2 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200"
                    :title="oc.referencia_despacho"
                  >
                    {{ oc.referencia_despacho }}
                  </span>
                  <button
                    @click="copyToClipboard(oc.referencia_despacho)"
                    class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                    title="Copiar referencia"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <span v-else class="text-gray-400 dark:text-gray-500 italic transition-colors duration-300">-</span>
              </td>
              <!-- Fecha Generación -->
              <td v-else-if="columnKey === 'fecha_generacion'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <div>{{ formatDate(oc.fecha_generacion) }}</div>
              </td>
              <!-- Fecha Creación (con hora) -->
              <td v-else-if="columnKey === 'created_at'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300">
                <div v-if="oc.created_at" class="space-y-0.5">
                  <div>{{ formatDateTime(oc.created_at) }}</div>
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
                  <span
                    v-if="oc.estado === 'ENVIADA' || oc.estado === 'ERROR'"
                    :class="getEstadoClass(oc.estado)"
                    class="relative z-10"
                    :title="oc.estado"
                  >
                    {{ oc.estado }}
                  </span>
                  <span
                    v-else
                    :class="getEstadoClass(oc.estado)"
                    class="cursor-help transition-all duration-200 hover:scale-105"
                  >
                    {{ oc.estado }}
                  </span>
                  <!-- Tooltip detrás del botón (z-0) para no interceptar clics; pointer-events-none por si acaso -->
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out pointer-events-none whitespace-nowrap z-0">
                    {{ oc.estado === 'ENVIADA' || oc.estado === 'ERROR' ? `Ver detalles en historial: ${oc.oc_id}` : getEstadoTooltip(oc) }}
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div class="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </td>
              <!-- Número ODC SAP -->
              <td v-else-if="columnKey === 'numero_oc_sap'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 transition-colors duration-300 min-w-[10rem] w-40">
                <div v-if="oc.numero_oc_sap" class="flex items-center gap-2">
                  <button
                    type="button"
                    class="font-mono text-blue-700 dark:text-blue-300 underline underline-offset-2 decoration-dotted hover:text-blue-900 dark:hover:text-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
                    @click.stop="emit('ver-detalle-sap', oc)"
                    title="Ver detalle de integración SAP"
                  >
                    {{ oc.numero_oc_sap }}
                  </button>
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
                <div v-if="oc.respuesta_sap" class="max-w-xs text-xs font-medium text-gray-700 dark:text-gray-300 break-words transition-colors duration-300">
                  {{ oc.respuesta_sap }}
                </div>
                <span v-else class="text-gray-400 dark:text-gray-500 italic transition-colors duration-300">-</span>
              </td>
            </template>
            <td v-if="!props.readOnly" class="px-6 py-4 whitespace-nowrap text-sm">
              <div class="flex items-center gap-2 flex-wrap">
                <button
                  v-if="shouldShowRetryAction(oc)"
                  @click="handleIntegrar(oc.referencia_despacho, oc.oc_id)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="sendingOcId === oc.oc_id || props.loading"
                  title="Reintentar envío a SAP"
                >
                  <LoadingSpinner v-if="sendingOcId === oc.oc_id" layout="inline" size="sm" color="current" aria-label="Reintentando envío a SAP" />
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {{ sendingOcId === oc.oc_id ? 'Reintentando...' : 'Reintentar' }}
                </button>
                <button
                  v-else-if="shouldShowPdfAction(oc)"
                  @click="handleDescargarPDF(oc)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="downloadingPdfOcId === oc.oc_id"
                  title="Descargar PDF de la ODC"
                >
                  <LoadingSpinner v-if="downloadingPdfOcId === oc.oc_id" layout="inline" size="sm" color="current" aria-label="Descargando PDF" />
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ downloadingPdfOcId === oc.oc_id ? 'Descargando...' : 'Descargar PDF' }}
                </button>
                <button
                  v-if="shouldShowRetryStAction(oc)"
                  @click="handleReintentarST(oc)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="retryingStOcId === oc.oc_id || props.loading"
                  :title="`Reintentar Solicitudes de Transferencia pendientes (${oc.st_pendientes_reintento ?? 0}${oc.st_total_tiendas ? ' de ' + oc.st_total_tiendas : ''})`"
                >
                  <LoadingSpinner v-if="retryingStOcId === oc.oc_id" layout="inline" size="sm" color="current" aria-label="Reintentando solicitudes de transferencia" />
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {{ retryingStOcId === oc.oc_id ? 'Reintentando ST...' : 'Reintentar ST' }}
                  <span
                    v-if="(oc.st_pendientes_reintento ?? 0) > 0"
                    class="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-200 dark:bg-blue-800/70 text-blue-900 dark:text-blue-100"
                  >
                    {{ oc.st_pendientes_reintento }}{{ oc.st_total_tiendas ? '/' + oc.st_total_tiendas : '' }}
                  </span>
                </button>
              </div>
            </td>
          </tr>
          
          <!-- Fila expandible con detalles -->
          <tr v-if="detallesExpandidos.has(oc.oc_id)">
            <td :colspan="visibleColumnsCount + (props.readOnly ? 2 : 3)" class="px-6 py-4 bg-gray-50/80 dark:bg-gray-900/50 border-l-4 border-emerald-500 dark:border-emerald-400">
              <LoadingSpinner
                v-if="loadingDetalles[oc.oc_id]"
                layout="center"
                size="md"
                color="emerald"
                message="Cargando detalles..."
              />
              <div v-else-if="detallesPorOC[oc.oc_id]?.length > 0" class="py-2">
                <h4 class="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
                  Detalles de la Orden de Compra ({{ detallesPorOC[oc.oc_id]?.length }} {{ detallesPorOC[oc.oc_id]?.length === 1 ? 'ítem' : 'ítems' }})
                </h4>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <thead class="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">SKU SAP</th>
                        <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                        <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Unidad</th>
                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Precio Unit.</th>
                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Total Línea</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr 
                        v-for="(detalle, index) in detallesPorOC[oc.oc_id]" 
                        :key="detalle.oc_detalle_id || index"
                        class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td class="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                          {{ detalle.sku_sap }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                          {{ formatNumber(detalle.cantidad_sap) }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                          {{ detalle.unidad_sap }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          {{ formatCurrencyWithDecimals(detalle.precio_unitario, 4) }}
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                          {{ formatCurrencyWithDecimals(detalle.total_linea, 4) }}
                        </td>
                      </tr>
                      <!-- Fila de totales -->
                      <tr class="bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                        <td colspan="4" class="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                          Total:
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          {{ formatCurrencyWithDecimals(getTotalDetalles(oc.oc_id), 4) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No se encontraron detalles para esta orden de compra
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
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted, onUnmounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import type { OrdenCompra, DetalleOC } from '../types'
import { useToast } from '@/composables/useToast'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { isTransientClientError } from '../utils/httpErrors'
import { formatNumber, formatCurrencyWithDecimals } from '../utils/formatters'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps<{
  ordenesCompra: OrdenCompra[]
  loading?: boolean
  totalOrdenes?: number
  allowDelete?: boolean // Permite mostrar el botón de eliminar
  readOnly?: boolean // Modo solo lectura (oculta acciones de integración)
  currentPage?: number
  pageSize?: number
  /** Si true, `ordenesCompra` ya viene paginado del servidor (no aplicar slice). */
  serverPaginated?: boolean
}>()

const emit = defineEmits<{
  integrar: [referenciaDespacho: string, almacenDestino?: string]
  integrarMultiples: [referenciasDespacho: string[]]
  eliminar: [ocIds: string[]]
  'filtered-count-changed': [count: number]
  'ver-detalle-sap': [oc: OrdenCompra]
  /** Reintento de ITR/ST exitoso o parcial: el padre debería refrescar la lista. */
  'st-reintentado': [payload: { oc: OrdenCompra; result: any }]
}>()

const toast = useToast()
const router = useRouter()

// Estado de selección
const selectedOrdenes = ref<string[]>([])
const deleting = ref(false)

// Estado para rastrear qué ODC individual se está enviando
const sendingOcId = ref<string | null>(null)

// Estado para rastrear qué ODC se está descargando como PDF
const downloadingPdfOcId = ref<string | null>(null)

// Estado para rastrear qué ODC está reintentando solo ITR/ST (no la ODC)
const retryingStOcId = ref<string | null>(null)

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

// Estado para detalles expandibles
const detallesExpandidos = ref<Set<string>>(new Set())
const detallesPorOC = ref<Record<string, DetalleOC[]>>({})
const loadingDetalles = ref<Record<string, boolean>>({})

// Filtros
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const filtroNumeroOC = ref('')
const showColumnSelector = ref(false)

// Columnas disponibles. Por defecto: #, DETALLES, NÚMERO PEDIDO, FECHA CREACIÓN, ESTADO, NÚMERO ODC SAP, RESPUESTA SAP, ACCIONES
const availableColumns = [
  { key: 'oc_id', label: 'ODC ID', default: false },
  { key: 'origen', label: 'Origen', default: false },
  { key: 'referencia_despacho', label: 'Número Pedido', default: true },
  { key: 'fecha_generacion', label: 'Fecha Generación', default: false },
  { key: 'created_at', label: 'Fecha Creación', default: true },
  { key: 'fecha_procesado', label: 'Fecha Procesado', default: false },
  { key: 'estado', label: 'Estado', default: true },
  { key: 'numero_oc_sap', label: 'Número ODC SAP', default: true },
  { key: 'doc_entry', label: 'DocEntry SAP', default: false },
  { key: 'respuesta_sap', label: 'Respuesta SAP', default: true },
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
    const oc = newOrdenes.find((o: OrdenCompra) => o.oc_id === ocId)
    return oc && oc.estado === 'PENDIENTE'
  })
  
  // IMPORTANTE: Limpiar sendingOcId si la orden cambió de estado
  // Esto fuerza que el botón se actualice visualmente cuando el estado cambia de PENDIENTE a ENVIADA/ERROR
  if (sendingOcId.value) {
    const ordenEnviada = newOrdenes.find((o: OrdenCompra) => o.oc_id === sendingOcId.value)
    
    if (ordenEnviada && ordenEnviada.estado !== 'PENDIENTE') {
      // La orden ya no está pendiente, limpiar el estado de envío para que el botón desaparezca
      if (import.meta.env.DEV) console.log(`[OrdenCompraTable] ✅ Botón deshabilitado: ${sendingOcId.value} cambió a ${ordenEnviada.estado}`)
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

// Solo mostrar columnas que siguen definidas en availableColumns (evita encabezados huérfanos si se eliminó una columna)
const availableColumnKeys = computed(() => availableColumns.map(col => col.key))
const effectiveVisibleColumns = computed(() => {
  const list = orderedVisibleColumns.value ?? []
  return list.filter((key: string) => availableColumnKeys.value.includes(key))
})

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

function shouldShowRetryAction(oc: OrdenCompra): boolean {
  if (typeof oc.mostrar_reintentar === 'boolean') return oc.mostrar_reintentar
  const estado = (oc.estado || '').toUpperCase()
  return estado === 'PENDIENTE' || estado === 'ERROR'
}

function shouldShowPdfAction(oc: OrdenCompra): boolean {
  if (typeof oc.mostrar_descargar_pdf === 'boolean') return oc.mostrar_descargar_pdf
  return !shouldShowRetryAction(oc)
}

/**
 * Reintento de ITR/ST: backend marca `mostrar_reintentar_st` cuando la OC está ENVIADA
 * y existen tiendas con ITR fallido (st_pendientes_reintento > 0).
 *
 * Fallback (por si el backend aún no enriquece): ENVIADA + st_pendientes_reintento > 0.
 */
function shouldShowRetryStAction(oc: OrdenCompra): boolean {
  if (typeof oc.mostrar_reintentar_st === 'boolean') return oc.mostrar_reintentar_st
  const estado = (oc.estado || '').toUpperCase()
  return estado === 'ENVIADA' && (oc.st_pendientes_reintento ?? 0) > 0
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
  
  // Servidor paginado: mostrar como máximo pageSize filas (por si el API devuelve de más)
  if (props.serverPaginated && props.pageSize && props.pageSize > 0) {
    return sorted.slice(0, props.pageSize)
  }

  // Paginación en cliente
  if (
    props.currentPage !== undefined &&
    props.pageSize !== undefined &&
    props.currentPage > 0 &&
    props.pageSize > 0
  ) {
    const start = (props.currentPage - 1) * props.pageSize
    const end = start + props.pageSize
    return sorted.slice(start, end)
  }

  return sorted
})

// Watch para emitir el conteo de órdenes filtradas cuando cambie
// Debe estar después de la definición de filteredOrdenes
watch(() => filteredOrdenes.value, (newFiltered) => {
  if (props.serverPaginated) return
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
    const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === id)
    return oc && oc.estado === 'PENDIENTE' && (oc.doc_entry === null || oc.doc_entry === undefined)
  })
})

const allSelected = computed(() => {
  return hasSelectableOrdenes.value && 
         selectableOrdenes.value.every((oc: OrdenCompra) => selectedOrdenes.value.includes(oc.oc_id))
})

const someSelected = computed(() => {
  return selectableOrdenes.value.some((oc: OrdenCompra) => selectedOrdenes.value.includes(oc.oc_id)) && !allSelected.value
})

const hasPendientesSeleccionadas = computed(() => {
  return ordenesSeleccionables.value.some(id => {
    const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === id)
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
    const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === ocId)
    return oc && !oc.created_at
  })
})

// Computed para obtener las ODC seleccionadas que NO se pueden eliminar (con created_at)
const ordenesNoEliminables = computed(() => {
  if (!props.allowDelete) return []
  return selectedOrdenes.value.filter(ocId => {
    const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === ocId)
    return oc && oc.created_at
  })
})

// Funciones
function isSelected(ocId: string): boolean {
  return selectedOrdenes.value.includes(ocId)
}

function toggleSelect(ocId: string) {
  const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === ocId)
  
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
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
  filtroNumeroOC.value = ''
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
  const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === ocId)
  
  // ⚠️ Validar que no tenga doc_entry (ya fue enviada)
  if (oc && oc.doc_entry !== null && oc.doc_entry !== undefined) {
    toast.warning(
      'OC ya enviada', 
      `Esta OC ya fue enviada a SAP (DocEntry: ${oc.doc_entry}${oc.numero_oc_sap ? `, Num ODC: ${oc.numero_oc_sap}` : ''}). No se puede reenviar.`
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


async function handleDescargarPDF(oc: OrdenCompra) {
  if (downloadingPdfOcId.value === oc.oc_id) return

  try {
    downloadingPdfOcId.value = oc.oc_id
    const blob = await mba3ConsultasService.descargarODCPDF(oc.oc_id)
    
    // Crear URL temporal y disparar descarga
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ODC_${oc.numero_oc_sap || oc.oc_id.substring(0, 8)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('PDF descargado exitosamente')
  } catch (error: any) {
    console.error('Error al descargar PDF:', error)
    toast.error('Error al descargar PDF', error.message || 'No se pudo generar el PDF de la orden de compra')
  } finally {
    downloadingPdfOcId.value = null
  }
}

async function handleReintentarST(oc: OrdenCompra) {
  if (retryingStOcId.value === oc.oc_id) return

  try {
    retryingStOcId.value = oc.oc_id
    const result: any = await mba3ConsultasService.reintentarSolicitudesTransferencia(oc.oc_id)

    const status = (result?.status || '').toLowerCase()
    const creadas = result?.resultado_st?.transferencias_creadas ?? 0
    const errores = result?.resultado_st?.transferencias_errores ?? 0
    const objetivo = result?.tiendas_count ?? 0

    if (status === 'success' && objetivo === 0) {
      toast.info('Sin pendientes', result?.message || 'No hay solicitudes de transferencia pendientes para reintentar.')
    } else if (status === 'en_cola') {
      toast.info(
        'Sigue en proceso en SAP',
        result?.message || 'SAP está saturado y la solicitud sigue en cola. Intenta de nuevo en unos minutos.'
      )
    } else if (status === 'success') {
      toast.success(
        'Reintento ST exitoso',
        `Se reintentaron ${objetivo} tienda(s). Creadas: ${creadas}.`
      )
    } else if (status === 'partial') {
      toast.warning(
        'Reintento ST parcial',
        `Creadas: ${creadas} | Errores: ${errores} de ${objetivo} tienda(s).`
      )
    } else {
      toast.error('Reintento ST falló', result?.message || 'No se pudo completar el reintento de ST.')
    }

    emit('st-reintentado', { oc, result })
  } catch (error: any) {
    console.error('Error al reintentar ST:', error)
    const status = error?.response?.status
    if (status === 409) {
      toast.warning('Reintento en curso', 'Otro reintento de ST ya está en curso para esta OC. Intenta en unos segundos.')
    } else if (status === 400) {
      toast.warning(
        'Estado no válido',
        error?.response?.data?.message || 'Solo se puede reintentar ST cuando la ODC está ENVIADA.'
      )
    } else if (isTransientClientError(error)) {
      toast.warning(
        'Tiempo de espera agotado',
        'El reintento de transferencias (ITR) puede seguir en el servidor. Actualice la lista en unos minutos para ver el estado real.'
      )
      emit('st-reintentado', { oc, result: null })
    } else {
      toast.error('Error al reintentar ST', error.message || 'No se pudo reintentar Solicitudes de Transferencia')
    }
  } finally {
    retryingStOcId.value = null
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
      const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === id)
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
    const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === ocId)
    return oc && !oc.created_at
  })
  
  const ordenesConCreatedAt = selectedOrdenes.value.filter(ocId => {
    const oc = props.ordenesCompra.find((o: OrdenCompra) => o.oc_id === ocId)
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

function formatDateTime(dateString: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
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

// Funciones para manejar detalles expandibles
async function toggleDetalles(ocId: string) {
  if (detallesExpandidos.value.has(ocId)) {
    // Colapsar
    detallesExpandidos.value.delete(ocId)
  } else {
    // Expandir y cargar detalles si no están cargados
    detallesExpandidos.value.add(ocId)
    
    if (!detallesPorOC.value[ocId]) {
      await cargarDetalles(ocId)
    }
  }
}

async function cargarDetalles(ocId: string) {
  loadingDetalles.value[ocId] = true
  try {
    const response = await mba3ConsultasService.obtenerDetallesOC(ocId)
    detallesPorOC.value[ocId] = response.detalles || []
  } catch (error: any) {
    console.error('Error al cargar detalles de ODC:', error)
    toast.error('Error al cargar detalles', error.message || 'No se pudieron cargar los detalles de la orden de compra')
    detallesPorOC.value[ocId] = []
  } finally {
    loadingDetalles.value[ocId] = false
  }
}

function getTotalDetalles(ocId: string): number {
  const detalles = detallesPorOC.value[ocId] || []
  return detalles.reduce((total, detalle) => total + (detalle.total_linea || 0), 0)
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
