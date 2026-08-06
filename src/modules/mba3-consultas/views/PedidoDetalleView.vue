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
      <!-- Header con botones de acción (Volver + búsqueda y acciones) -->
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
        :descargando-pedido="descargandoPedido"
        :descargando-plano-mba="descargandoPlanoMba"
        :descargando-csv="descargandoCsv"
        :descargando-excel-original="descargandoExcelOriginal"
        :can-generar-o-c="canGenerarOC"
        :es-modo-mabel-trading="false"
        :pedido="pedido"
        :confirmar-deshabilitado="confirmarDeshabilitadoPorEstado"
        :es-inmediato-sin-fecha="esInmediatoSinFecha"
        :hide-confirm-and-download="false"
        :hide-cargar-plantillas="true"
        :show-despachar-y-facturar="true"
        :puede-descargar-pedido="puedeDescargarPedido"
        :puede-descargar-csv="puedeDescargarCsv"
        :puede-generar-txt-mba3="puedeGenerarTxtMba3"
        :tiene-archivo-original="false"
        @cargar-plantillas="goToCargarPlantillas"
        @generar-oc="handleGenerarOCDesdePedido"
        @confirmar="handleConfirmar"
        @update-estado="handleUpdateEstado"
        @go-to-pedido="goToPedido"
        @search-blur="handleSearchBlur"
        @descargar-plano-mba="handleDescargarPlanoMba"
        @descargar-pedido="handleDescargarPedido"
        @descargar-csv="handleDescargarCsv"
        @descargar-excel-original="handleDescargarExcelOriginal"
      />

      <!-- Loading state -->
      <div v-if="loading && !pedido" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <LoadingSpinner message="Cargando pedido..." />
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
          :editable="true"
          :default-expanded="true"
          :permitir-edicion-fechas-en-gestionar="true"
          :show-inmediato-option="false"
          :fecha-pedido-editable="false"
          @copy-to-clipboard="copyToClipboard"
          @update-fecha-pedido="handleUpdateFechaPedido"
          @update-fecha-entrega="handleUpdateFechaEntrega"
          @update-estado="handleUpdateEstado"
        />

        <!-- ⭐ FASE 4: Ajuste y Redistribución a Tiendas -->
        <RedistribucionTiendas
          :pedido="pedido"
          :es-modo-mabel-trading="false"
          :productos-redistribucion="redistribucion.productosRedistribucion"
          :productos-expandidos="redistribucion.productosExpandidos"
          :guardando-redistribucion="redistribucion.guardandoRedistribucion"
          :confirmando-redistribucion="redistribucion.confirmandoRedistribucion"
          :confirmar-deshabilitado-por-estado="confirmarRedistribucionDeshabilitadoPorEstado"
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
                    <LoadingSpinner layout="inline" size="xs" aria-label="Guardando preferencias" />
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
                    @dragstart="!column.fixed && handleDragStart($event, column.key)"
                    @dragover.prevent="!column.fixed && handleDragOver($event, column.key)"
                    @dragleave="!column.fixed && handleDragLeave()"
                    @drop.prevent="!column.fixed && handleDrop($event, column.key)"
                    @dragend="!column.fixed && handleDragEnd()"
                    :class="[
                      'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none',
                      column.fixed ? 'cursor-default' : 'cursor-move',
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                      draggedColumnKey === column.key ? 'opacity-50 bg-indigo-100 dark:bg-indigo-900' : '',
                      dragOverColumnKey === column.key && draggedColumnKey !== null ? 'border-l-4 border-indigo-500' : ''
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
                      column.key === 'total' ? (puedeEditarCostoTotalComentario ? 'font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors' : 'font-medium text-gray-900 dark:text-white') :
                      column.key === 'descripcion_sap' ? 'text-gray-900 dark:text-white' :
                      column.key === 'costo_doc_sin_iva' ? (puedeEditarCostoTotalComentario ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors' : '') :
                      column.key === 'comentario' ? (puedeEditarCostoTotalComentario ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors' : '') :
                      'text-gray-500 dark:text-gray-400 whitespace-nowrap'
                    ]"
                    :data-column-key="column.key"
                    :data-detalle-id="detalle.pedido_detalle_id"
                    @dblclick="puedeEditarCostoTotalComentario && (column.key === 'costo_doc_sin_iva' || column.key === 'total' || column.key === 'comentario') && iniciarEdicion(detalle, column.key === 'costo_doc_sin_iva' ? 'costo' : column.key === 'total' ? 'total' : 'comentario')"
                  >
                    <!-- Mostrar input si estamos editando esta celda (solo en estado GESTIONAR PEDIDO) -->
                    <template v-if="puedeEditarCostoTotalComentario && editingCell?.detalleId === detalle.pedido_detalle_id && ((column.key === 'costo_doc_sin_iva' && editingCell.fieldType === 'costo') || (column.key === 'total' && editingCell.fieldType === 'total') || (column.key === 'comentario' && editingCell.fieldType === 'comentario'))">
                      <input
                        v-if="column.key !== 'comentario'"
                        :data-editing-cell="detalle.pedido_detalle_id"
                        v-model="editingCell.value"
                        type="number"
                        :step="editingCell.fieldType === 'total' ? '0.5' : '0.01'"
                        :inputmode="editingCell.fieldType === 'total' ? 'numeric' : 'decimal'"
                        min="0"
                        @blur="guardarEdicion"
                        @keydown="manejarTeclasEdicion"
                        @click.stop
                        :title="editingCell.fieldType === 'total' ? 'Solo múltiplos de 0,5. Escriba números; use flechas para 0,5, 1,5…' : undefined"
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
                      {{ formatCurrencyWithDecimals(totalesCostoUnitario, 4) }}
                    </template>
                    <template v-else-if="column.key === 'subtotal'">
                      {{ formatNumber(totalesSubtotal) }}
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

        <!-- Botón Cancelar Pedido (parte inferior) - Estado GESTIONAR PEDIDO -->
        <div 
          v-if="puedeCancelarPorElRayo" 
          class="mt-6 pb-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6"
        >
          <div class="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
            <p class="font-medium">⚠️ Cancelar pedido</p>
            <p class="text-xs mt-1">El pedido cambiará a estado "Cancelado por EL RAYO". Úselo únicamente cuando sea solicitada expresamente por MABEL TRADING.</p>
          </div>
          <button
            type="button"
            @click="handleCancelarPorElRayo"
            :disabled="cancelandoPorElRayo"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 dark:bg-red-500 rounded-lg shadow-sm hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Cancelar este pedido"
          >
            <svg v-if="!cancelandoPorElRayo" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Cancelando pedido" />
            {{ cancelandoPorElRayo ? 'Cancelando...' : 'Cancelar Pedido' }}
          </button>
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

    <!-- Modal de confirmación: pedido confirmado (tras clic en Confirmar) -->
    <SimpleConfirmModal
      :is-open="showConfirmacionModal"
      title="Pedido confirmado"
      message="El pedido se ha confirmado correctamente."
      confirm-label="Aceptar"
      @close="handleCerrarModalConfirmacion"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Ref } from '@vue/reactivity'
import { onMounted, onActivated, onUnmounted, nextTick, Teleport } from '@vue/runtime-core'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { lastNotification } from '@/composables/useNotificaciones'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { PedidoCompleto, ReporteDiferenciasResponse, UploadPlantillaResponse, InfoArchivoPlantillaResponse } from '../types'
// Utilidades extraídas
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatCurrencyWithDecimals,
  formatPorcentaje,
  formatEstadoPedido,
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
import type { CorreccionesPlantilla } from '../composables/useFileUpload'
import { useColumnManagement } from '../composables/useColumnManagement'
import { usePedidoDetalle } from '../composables/usePedidoDetalle'
import { useRedistribucion } from '../composables/useRedistribucion'
// Componentes
import PedidoHeaderActions from '../components/PedidoHeaderActions.vue'
import PedidoCabecera from '../components/PedidoCabecera.vue'
import RedistribucionTiendas from '../components/RedistribucionTiendas.vue'
import UploadErrorModal from '../components/UploadErrorModal.vue'
import SimpleConfirmModal from '../components/SimpleConfirmModal.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

// Constantes de configuración
const SCROLL_DELAY_MS = 100
const ROUTE_REDIRECT_DELAY_MS = 1500
const SEARCH_HELP_BLUR_DELAY_MS = 200
const COPY_FEEDBACK_DURATION_MS = 2000

const route = useRoute()
const router = useRouter()
const toast = useToast()

const pedido = ref<PedidoCompleto | null>(null)

// ⭐ HU-08: Descarga directa del archivo plano MBA (sin modal)
const descargandoPlanoMba = ref(false)

// Modal de confirmación tras "Confirmar" (pedido confirmado)
const showConfirmacionModal = ref(false)

// ⭐ Set para rastrear columnas modificadas (formato: "detalleId:columnKey")
const columnasModificadas = ref<Set<string>>(new Set())

// Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)
const confirmando = ref(false)
const cancelandoPorElRayo = ref(false)
const descargandoPedido = ref(false)
const descargandoCsv = ref(false)
const descargandoExcelOriginal = ref(false)
const tieneArchivoOriginal = ref(false)
const infoArchivoOriginal = ref<InfoArchivoPlantillaResponse | null>(null)
const draggedColumnKey = ref<string | null>(null)
const dragOverColumnKey = ref<string | null>(null)

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
    if (import.meta.env.DEV) console.log('ℹ️ [PedidoDetalleView] Modificaciones ya cargadas desde backend, omitiendo sessionStorage')
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
      if (import.meta.env.DEV) console.log(`ℹ️ [PedidoDetalleView] Cargadas ${columnasArray.length} modificaciones desde sessionStorage (fallback)`)
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

// Por defecto: #, CÓDIGO, DESCRIPCIÓN, COSTO UNIT., TOTAL, COMENTARIO (dev y prod)
const availableColumns: ColumnConfig[] = [
  { key: 'numero', label: '#', visible: true, align: 'center', format: 'number', fixed: true },
  { key: 'codigo_interno', label: 'Código', visible: true, align: 'left', format: 'text' },
  { key: 'descripcion_sap', label: 'Descripción', visible: true, align: 'left', format: 'text' },
  { key: 'codigo_barras', label: 'Código de Barras', visible: false, align: 'left', format: 'text' },
  { key: 'pack', label: 'Pack', visible: false, align: 'left', format: 'text' },
  { key: 'costo_doc_sin_iva', label: 'Costo Unit.', visible: true, align: 'right', format: 'currency' },
  { key: 'descuento_1', label: 'Descuento', visible: false, align: 'right', format: 'number' },
  { key: 'pvp', label: 'PVP', visible: false, align: 'right', format: 'currency' },
  { key: 'subtotal', label: 'Subtotal', visible: false, align: 'right', format: 'number' },
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
      visibleColumns.value = ['numero', ...newVisible.filter((key: string) => key !== 'numero')]
      savePreferences()
    }
  },
  { immediate: true }
)

// ⭐ Totales: usar pedido.totales del backend cuando exista; si no, recalcular desde detalles (fallback)
const totalesCostoUnitario = computed(() => {
  const t = pedido.value?.totales
  if (t != null && typeof t.total_costo_unitario === 'number') return t.total_costo_unitario
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.costo_doc_sin_iva || 0), 0)
})

const totalesSubtotal = computed(() => {
  const t = pedido.value?.totales
  if (t != null && typeof t.total_subtotal === 'number') return t.total_subtotal
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.subtotal || 0), 0)
})

const totalesTotal = computed(() => {
  const t = pedido.value?.totales
  if (t != null && typeof t.total_total === 'number') return t.total_total
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.total || 0), 0)
})

// El parámetro de ruta ahora es numero_pedido
const numeroPedido = computed(() => {
  const id = route.params.id as string
  return id ? decodeURIComponent(id) : ''
})

// Inicializar composable de pedido detalle primero (sin modo MABEL TRADING: cabecera siempre editable)
const pedidoDetalle = usePedidoDetalle({
  pedido,
  numeroPedido,
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

const tituloInterfaz = 'Detalle del Pedido - EL RAYO'


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

// ⭐ Deshabilitar "Confirmar" desde estado CONFIRMADO (id 4) en adelante (ver docs/FRONTEND.md §2)
const ESTADOS_YA_CONFIRMADOS = [
  'CONFIRMADO', // Backend devuelve este estado al confirmar (estado_id 4)
  'RESPUESTA_PROVEEDOR_CARGADA',
  'CONFIRMADO_PROVEEDOR',
  'CONFIRMADO REDISTRIBUCION',
  'PEDIDO_CONFIRMADO',
  'CONFIRMADO_ENVIADO',
  'PROCESADO_SAP',
  'REDISTRIBUCION',
  'CANCELADO POR EL RAYO',
  'CANCELADO_POR_EL_RAYO'
]
const confirmarDeshabilitadoPorEstado = computed(() => {
  const cabecera = pedido.value?.cabecera
  if (!cabecera) return false
  const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
  const estado = cabecera.estado ?? ''
  // Cancelado por EL RAYO (estado_id 20)
  if (estadoId === 20) return true
  if (estadoId === 4 || estado === 'CONFIRMADO') return true
  if (estadoId != null && estadoId >= 4) return true
  if (ESTADOS_YA_CONFIRMADOS.includes(estado)) return true

  // Si la fecha de entrega es "INMEDIATO", el usuario debe seleccionar una fecha real antes de confirmar
  const fechaEntrega = cabecera.fecha_entrega?.trim()?.toUpperCase()
  if (fechaEntrega === 'INMEDIATO') return true

  return false
})

// Indica si el botón está deshabilitado específicamente porque el pedido es INMEDIATO y falta seleccionar fecha de entrega
const esInmediatoSinFecha = computed(() => {
  const cabecera = pedido.value?.cabecera
  if (!cabecera) return false
  const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
  // Solo aplica si el pedido NO está ya confirmado (estado_id < 4)
  if (estadoId != null && estadoId >= 4) return false
  if (ESTADOS_YA_CONFIRMADOS.includes(cabecera.estado ?? '')) return false
  const fechaEntrega = cabecera.fecha_entrega?.trim()?.toUpperCase()
  return fechaEntrega === 'INMEDIATO'
})

// Deshabilitar "Confirmar Redistribución" usando el flag del backend (incluye CANCELADO y estados ya confirmados)
const confirmarRedistribucionDeshabilitadoPorEstado = computed(() =>
  pedido.value?.puede_confirmar_redistribucion === false
)

// Solo permitir editar COSTO UNIT., TOTAL y COMENTARIO en estado GESTIONAR PEDIDO (docs/FRONTEND.md §0.5.8.2)
const puedeEditarCostoTotalComentario = computed(() => {
  const cabecera = pedido.value?.cabecera
  if (!cabecera) return false
  const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
  const estado = String(cabecera.estado ?? '').trim().toUpperCase()
  if (estadoId === 3) return true
  if (estado === 'GESTIONAR_PEDIDO' || estado === 'GESTIONAR PEDIDO') return true
  return false
})

// Permitir cancelar pedido por EL RAYO solo en estado GESTIONAR PEDIDO (estado_id = 3)
const puedeCancelarPorElRayo = computed(() => {
  const cabecera = pedido.value?.cabecera
  if (!cabecera) return false
  const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
  return estadoId === 3
})

// Permitir descargar CSV solo en estado CONFIRMADO (estado_id = 4)
const puedeDescargarCsv = computed(() => {
  const cabecera = pedido.value?.cabecera
  if (!cabecera) return false
  const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
  return estadoId === 4
})

// Permitir generar TXT MBA3 solo en estado CONFIRMADO POR EL RAYO (estado_id = 4)
const puedeGenerarTxtMba3 = computed(() => {
  const cabecera = pedido.value?.cabecera
  if (!cabecera) return false
  const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
  return estadoId === 4
})

// Permitir descargar pedido desde estado GESTIONAR PEDIDO (estado_id >= 3) en adelante
const puedeDescargarPedido = computed(() => {
  const cabecera = pedido.value?.cabecera
  if (!cabecera) return false
  const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
  return estadoId !== null && estadoId >= 3
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
  archivoOriginal: archivoOriginalDelComposable,
  // ⭐ NUEVO: Variables de progreso de carga
  uploadProgress,
  uploadFase,
  uploadMessage
} = fileUploadComposable

// ⭐ REMOVIDO: Refs de sugerencias movidas a UploadErrorModal.vue

// ⭐ REMOVIDO: Funciones de sugerencias movidas a UploadErrorModal.vue
// - extraerCodigosProductoNoEncontrados
// - getInfoMba3
// - buscarSugerenciasParaCodigo
// - buscarSugerenciasAutomaticas
// - limpiarSugerencias
// - todosCodigosTienenCorreccion (computed)

/**
 * Aplica las correcciones seleccionadas (código y/o pack/pvp) y reintenta el flujo de carga
 * ⭐ ACTUALIZADO: Ahora recibe las correcciones como parámetro desde UploadErrorModal
 */
async function aplicarCorreccionesYContinuar(correcciones: CorreccionesPlantilla): Promise<void> {
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

// ⭐ REMOVIDO: Watchers y funciones auxiliares de sugerencias movidas a UploadErrorModal.vue
// - watch(showErrorModal)
// - watch(uploadErrorInfo)
// - getScoreBadgeClass
// - getSugerenciasLimitadas
// - getLimiteSugerencias
// - setLimiteSugerencias
// - inicializarLimiteSugerencias

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
  const pedidoId = pedido.value.cabecera.pedido_id
  const estadoNorm = estado?.trim() || null

  // Transición a "Despachar y Facturar" usa el endpoint específico (solo válido desde CONFIRMADO_ENVIADO)
  if (estadoNorm === 'DESPACHAR Y FACTURAR' || estadoNorm === 'DESPACHAR_Y_FACTURAR') {
    try {
      const pedidoActualizado = await mba3ConsultasService.marcarDespacharYFacturar(pedidoId)
      pedido.value = pedidoActualizado
      toast.success('Estado actualizado', 'El pedido se ha marcado para Despachar y Facturar.')
      await loadPedido()
    } catch (e: any) {
      const status = e.response?.status
      const data = e.response?.data
      const errorCode = data?.error
      const detail = data?.detail
      const msg = (typeof detail === 'object' && detail?.message) ? detail.message : (typeof detail === 'string' ? detail : null) ?? data?.message ?? e.message
      if (status === 400 && (errorCode === 'estado_no_confirmado_enviado' || msg?.includes('Confirmado y Enviado'))) {
        toast.error('Estado incorrecto', 'Solo se puede marcar "Despachar y Facturar" cuando el pedido está en estado Confirmado y Enviado.')
      } else {
        toast.error('Error', msg || 'No se pudo marcar para Despachar y Facturar.')
      }
      await loadPedido()
    }
    return
  }

  try {
    await mba3ConsultasService.actualizarCabeceraPedido(pedidoId, {
      estado: estadoNorm || undefined
    })
    if (pedido.value.cabecera) {
      pedido.value.cabecera.estado = estadoNorm || undefined
    }
    toast.success('Estado actualizado', 'El estado del pedido se ha actualizado correctamente')
    await loadPedido()
  } catch (e: any) {
    console.error('Error al actualizar estado:', e)
    toast.error('Error al actualizar', e.message || 'No se pudo actualizar el estado del pedido')
    await loadPedido()
  }
}

async function handleConfirmar() {
  // Prevenir múltiples clics
  if (confirmando.value || !pedido.value || !numeroPedido.value) return

  const pedidoId = pedido.value.cabecera?.pedido_id

  // Un solo flujo: POST crear-respuesta-desde-pedido (crea respuesta, guarda modificaciones,
  // registra confirmación de EL RAYO y envía email). Válido tanto desde GESTIONAR PEDIDO
  // como desde otros estados; el backend aplica la transición y el correo según corresponda.
  confirmando.value = true
  toast.info('Guardando cambios...', 'Guardando los cambios realizados en la tabla')

  try {
    await mba3ConsultasService.crearRespuestaProveedorDesdePedido(numeroPedido.value, pedidoId)

    // Actualizar pedido en memoria para deshabilitar el botón y la edición de costo/total/comentario (docs/FRONTEND.md §2, §0.5.8.2)
    if (pedido.value?.cabecera) {
      pedido.value.cabecera.estado = 'CONFIRMADO'
      pedido.value.cabecera.estado_id = 4
    }
    cancelarEdicion()
    await loadPedido()
    confirmando.value = false
    showConfirmacionModal.value = true
  } catch (e: any) {
    console.error('Error al confirmar:', e)

    if (e.message?.includes('ya existe') || (e as any).isConflict || (e as any).statusCode === 409) {
      if (pedido.value?.cabecera) {
        pedido.value.cabecera.estado = 'CONFIRMADO'
        pedido.value.cabecera.estado_id = 4
      }
      cancelarEdicion()
      await loadPedido()
      confirmando.value = false
      showConfirmacionModal.value = true
    } else {
      toast.error('Error al guardar', e.message || 'No se pudieron guardar los cambios')
      confirmando.value = false
    }
  }
}

function handleCerrarModalConfirmacion() {
  showConfirmacionModal.value = false
  // El usuario permanece en la misma página (Detalle del Pedido)
  // No se realiza redirección
}

// Función para descargar pedido ORIGINAL en formato Excel (valores antes de ediciones)
async function handleDescargarPedido() {
  if (!pedido.value?.cabecera?.pedido_id) {
    toast.error('Error', 'No hay pedido para descargar')
    return
  }

  // Prevenir múltiples clics
  if (descargandoPedido.value) return

  const pedidoId = pedido.value.cabecera.pedido_id

  descargandoPedido.value = true
  toast.info('Generando archivo...', 'Por favor espera')

  try {
    const blob = await mba3ConsultasService.descargarPedidoOriginal(pedidoId)

    // Crear URL del blob y descargar con el nombre fijo especificado
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Descargar Pedido Original.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Descarga completada', 'El archivo Excel se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al descargar pedido original:', e)

    // El blob de error necesita ser parseado como JSON
    let status = e.response?.status
    let errorCode = ''
    let message = ''

    try {
      if (e.response?.data instanceof Blob) {
        const text = await e.response.data.text()
        const parsed = JSON.parse(text)
        errorCode = parsed?.detail?.error || ''
        message = parsed?.detail?.message || parsed?.message || ''
      } else {
        const data = e.response?.data
        const detail = data?.detail
        errorCode = detail?.error || ''
        message = detail?.message || data?.message || e.message || ''
      }
    } catch {
      message = e.message || 'Error desconocido'
    }

    if (status === 404) {
      if (errorCode === 'sin_snapshot_original') {
        toast.warning(
          'Sin datos originales',
          'Este pedido fue creado antes de la activación de esta funcionalidad. No se dispone de los datos originales.'
        )
      } else {
        toast.error('Pedido no encontrado', 'El pedido no existe')
      }
    } else if (status === 400) {
      toast.error('Error al descargar', message || 'No se pudo descargar el archivo')
    } else {
      toast.error('Error al descargar', message || 'Ocurrió un error inesperado al descargar el archivo')
    }
  } finally {
    descargandoPedido.value = false
  }
}

// Función para descargar pedido en formato CSV (estado CONFIRMADO)
async function handleDescargarCsv() {
  if (!pedido.value?.cabecera?.pedido_id) {
    toast.error('Error', 'No hay pedido para descargar')
    return
  }

  // Prevenir múltiples clics
  if (descargandoCsv.value) return

  const pedidoId = pedido.value.cabecera.pedido_id
  const numeroPedidoDisplay = pedido.value.cabecera.numero_pedido ?? 'pedido'

  descargandoCsv.value = true
  toast.info('Generando archivo...', 'Por favor espera')

  try {
    const blob = await mba3ConsultasService.descargarPedidoCsv(pedidoId)
    
    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const nombreArchivo = `pedido_${numeroPedidoDisplay.replace(/[^a-zA-Z0-9.-]/g, '_')}_${timestamp}.csv`
    
    // Crear URL del blob y descargar
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Descarga completada', 'El archivo CSV se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al descargar CSV:', e)
    
    const status = e.response?.status
    const data = e.response?.data
    const detail = data?.detail
    const errorCode = detail?.error
    const message = detail?.message || data?.message || e.message
    
    if (status === 400) {
      // Estado no permitido
      if (errorCode === 'estado_no_confirmado' || message?.includes('CONFIRMADO')) {
        toast.error(
          'Estado no permitido',
          'El pedido debe estar en estado CONFIRMADO para descargar el archivo CSV.'
        )
      } else {
        toast.error('Error al descargar', message || 'No se pudo descargar el archivo CSV')
      }
    } else if (status === 404) {
      toast.error('Pedido no encontrado', 'El pedido no existe')
    } else {
      toast.error('Error al descargar', message || 'Ocurrió un error inesperado al descargar el archivo')
    }
  } finally {
    descargandoCsv.value = false
  }
}

// Función para verificar si existe el archivo Excel original en MinIO/S3
async function verificarArchivoOriginal() {
  if (!pedido.value?.cabecera?.pedido_id) {
    tieneArchivoOriginal.value = false
    infoArchivoOriginal.value = null
    return
  }

  try {
    const response = await mba3ConsultasService.getInfoArchivoPlantilla(pedido.value.cabecera.pedido_id)
    tieneArchivoOriginal.value = response.existe
    infoArchivoOriginal.value = response
    if (import.meta.env.DEV && response.existe) {
      console.log('📁 [PedidoDetalleView] Archivo original disponible:', response.archivo?.nombre_original)
    }
  } catch (e: any) {
    console.warn('⚠️ [PedidoDetalleView] Error al verificar archivo original:', e.message)
    tieneArchivoOriginal.value = false
    infoArchivoOriginal.value = null
  }
}

// Función para descargar el archivo Excel original desde MinIO/S3
async function handleDescargarExcelOriginal() {
  if (!pedido.value?.cabecera?.pedido_id) {
    toast.error('Error', 'No hay pedido para descargar')
    return
  }

  // Prevenir múltiples clics
  if (descargandoExcelOriginal.value) return

  const pedidoId = pedido.value.cabecera.pedido_id
  const nombreOriginal = infoArchivoOriginal.value?.archivo?.nombre_original

  descargandoExcelOriginal.value = true
  toast.info('Descargando archivo...', 'Por favor espera')

  try {
    const blob = await mba3ConsultasService.descargarExcelOriginal(pedidoId)
    
    // Usar el nombre original si está disponible, sino generar uno
    const nombreArchivo = nombreOriginal || `plantilla_original_${pedido.value.cabecera.numero_pedido?.replace(/[^a-zA-Z0-9.-]/g, '_') || pedidoId}.xlsx`
    
    // Crear URL del blob y descargar
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Descarga completada', 'El archivo Excel original se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al descargar Excel original:', e)
    
    const status = e.response?.status
    const data = e.response?.data
    const detail = data?.detail
    const message = detail?.message || data?.message || e.message
    
    if (status === 404) {
      toast.error('Archivo no encontrado', 'No existe archivo Excel original para este pedido')
    } else {
      toast.error('Error al descargar', message || 'Ocurrió un error inesperado al descargar el archivo')
    }
  } finally {
    descargandoExcelOriginal.value = false
  }
}

// Función para cancelar pedido por EL RAYO (desde Detalle del Pedido - estado GESTIONAR PEDIDO)
async function handleCancelarPorElRayo() {
  if (!pedido.value?.cabecera?.pedido_id) {
    toast.error('Error', 'No hay pedido para cancelar')
    return
  }

  // Prevenir múltiples clics
  if (cancelandoPorElRayo.value) return

  const pedidoId = pedido.value.cabecera.pedido_id
  const numeroPedidoDisplay = pedido.value.cabecera.numero_pedido
  const estadoNombre = pedido.value.cabecera.estado

  // Confirmación del usuario
  const confirmado = window.confirm(
    `¿Estás seguro de que deseas cancelar este pedido?\n\n` +
    `Pedido: ${numeroPedidoDisplay}\n` +
    `Estado: ${estadoNombre}\n\n` +
    `El pedido cambiará a estado "Cancelado por EL RAYO".`
  )

  if (!confirmado) return

  cancelandoPorElRayo.value = true
  toast.info('Cancelando pedido...', 'Por favor espera')

  try {
    await mba3ConsultasService.cancelarPedidoPorElRayo(pedidoId)
    
    toast.success('Pedido cancelado', 'El pedido ha sido cancelado por EL RAYO exitosamente')
    
    // Actualizar el estado en memoria para reflejar el cambio sin recargar
    if (pedido.value?.cabecera) {
      pedido.value.cabecera.estado = 'CANCELADO POR EL RAYO'
      pedido.value.cabecera.estado_id = 20
    }
  } catch (e: any) {
    console.error('Error al cancelar pedido:', e)
    
    const status = e.response?.status
    const data = e.response?.data
    const detail = data?.detail
    const errorCode = detail?.error
    const message = detail?.message || data?.message || e.message
    
    if (status === 400) {
      if (errorCode === 'estado_no_permitido' || message?.includes('estado')) {
        toast.error(
          'Estado no permitido',
          'No se puede cancelar el pedido. Solo se permite cancelar pedidos en estado Gestionar Pedido.'
        )
      } else {
        toast.error('Error al cancelar', message || 'No se pudo cancelar el pedido')
      }
    } else if (status === 404) {
      toast.error('Pedido no encontrado', 'El pedido no existe')
    } else {
      toast.error('Error al cancelar', message || 'Ocurrió un error inesperado al cancelar el pedido')
    }
  } finally {
    cancelandoPorElRayo.value = false
  }
}

// ⭐ HU-08: Descarga directa del archivo plano MBA (un clic, sin modal)
async function handleDescargarPlanoMba() {
  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido seleccionado')
    return
  }
  if (descargandoPlanoMba.value) return
  descargandoPlanoMba.value = true
  try {
    const blob = await mba3ConsultasService.exportarPedidoPlanoMba(numeroPedido.value, 'txt')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const nombreArchivo = `pedido_mba_${numeroPedido.value.replace(/[^a-zA-Z0-9.-]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Descarga completada', 'El archivo se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al descargar pedido plano:', e)
    toast.error('Error al descargar', e.message || 'No se pudo descargar el archivo')
  } finally {
    descargandoPlanoMba.value = false
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
      if (import.meta.env.DEV) console.log(`🔄 [PedidoDetalleView] Cambio de pedido detectado: ${oldNumeroPedido || '(ninguno)'} → ${newNumeroPedido}`)
      await loadPedido()
      // Limpiar el input de búsqueda después de navegar
      pedidoIdInput.value = ''
    }
  },
  { immediate: false }
)

// Watch para verificar si existe el archivo original cuando cambia el pedido
watch(
  () => pedido.value?.cabecera?.pedido_id,
  async (newPedidoId) => {
    if (newPedidoId) {
      await verificarArchivoOriginal()
    } else {
      tieneArchivoOriginal.value = false
      infoArchivoOriginal.value = null
    }
  },
  { immediate: true }
)

// Inicializar redistribución cuando el pedido tenga respuesta_proveedor (GET distribucion si existe, si no desde respuesta_proveedor)
watch(
  () => pedido.value?.respuesta_proveedor,
  async (respuesta) => {
    if (respuesta) {
      await redistribucion.cargarYInicializarRedistribucion()
    } else {
      redistribucion.productosRedistribucion.value = []
      redistribucion.productosExpandidos.value.clear()
    }
  },
  { immediate: true }
)

// ⭐ ELIMINADO: Watchers antiguos (el composable maneja esto automáticamente)

// ⭐ Watch para recargar pedido cuando llega una notificación SSE relevante
// (ej: otro usuario modifica el estado del pedido que tenemos abierto → recargar para sincronizar)
watch(lastNotification, async (notification) => {
  if (!notification || !pedido.value) return

  const pedidoActual = pedido.value.cabecera
  const meta = notification.metadata
  if (!meta.pedido_id && !meta.numero_pedido) return

  // Solo reaccionar si la notificación es sobre el pedido que tenemos abierto
  const coincide =
    (meta.pedido_id && meta.pedido_id === pedidoActual.pedido_id) ||
    (meta.numero_pedido && meta.numero_pedido === pedidoActual.numero_pedido)

  if (coincide) {
    if (import.meta.env.DEV) {
      console.log('🔄 [PedidoDetalleView] Notificación SSE recibida para pedido actual:', meta.accion)
    }

    // Si el pedido fue eliminado, redirigir a cargar-plantilla (el pedido ya no existe)
    if (meta.accion === 'pedido_eliminado' || meta.accion === 'pedido_descartado' || meta.accion === 'pedido_cancelado') {
      router.push('/mba3-consultas/cargar-plantilla')
      return
    }

    await loadPedido()
  }
})

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

function handleDragStart(event: DragEvent, columnKey: string) {
  const column = availableColumns.find(col => col.key === columnKey)
  if (column?.fixed) {
    return
  }
  
  draggedColumnKey.value = columnKey
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
  
  if (draggedColumnKey.value !== null && draggedColumnKey.value !== columnKey) {
    dragOverColumnKey.value = columnKey
  }
  else {
    dragOverColumnKey.value = null
  }
}

function handleDragLeave() {
  // No limpiar dragOverColumnKey aquí porque puede causar parpadeo
  // Se limpiará en handleDrop o handleDragEnd
}

// ⭐ ACTUALIZAR: handleDrop para usar columnKey en lugar de índices
function handleDrop(event: DragEvent, targetColumnKey: string) {
  event.preventDefault()
  
  if (!draggedColumnKey.value || draggedColumnKey.value === targetColumnKey) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // No permitir arrastrar columnas fijas
  const draggedColumn = availableColumns.find(col => col.key === draggedColumnKey.value)
  if (draggedColumn?.fixed) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // No permitir colocar columnas antes de columnas fijas
  const targetColumn = availableColumns.find(col => col.key === targetColumnKey)
  if (targetColumn?.fixed) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // Reordenar usando el composable
  // Preservar el orden completo (incluyendo columnas no visibles)
  const fullOrder = [...columnOrder.value]
  const visibleOrder = [...orderedVisibleColumnKeys.value]
  
  const draggedIndex = visibleOrder.indexOf(draggedColumnKey.value)
  const targetIndex = visibleOrder.indexOf(targetColumnKey)
  
  if (draggedIndex === -1 || targetIndex === -1) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // Obtener índices en el orden completo
  const draggedIndexInFull = fullOrder.indexOf(draggedColumnKey.value)
  const targetIndexInFull = fullOrder.indexOf(targetColumnKey)
  
  if (draggedIndexInFull === -1 || targetIndexInFull === -1) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // Remover columna arrastrada del orden completo
  fullOrder.splice(draggedIndexInFull, 1)
  
  // Insertar en nueva posición en el orden completo
  // Si el índice objetivo es mayor que el arrastrado, ajustar porque ya removimos un elemento
  const adjustedTargetIndex = targetIndexInFull > draggedIndexInFull ? targetIndexInFull - 1 : targetIndexInFull
  fullOrder.splice(adjustedTargetIndex, 0, draggedColumnKey.value)
  
  // Asegurar que 'numero' esté al inicio
  const numeroIndex = fullOrder.indexOf('numero')
  if (numeroIndex > 0) {
    fullOrder.splice(numeroIndex, 1)
    fullOrder.unshift('numero')
  }
  
  // Actualizar el orden usando el composable
  columnOrder.value = fullOrder
  
  // Guardar preferencias
  savePreferences()
  
  // Limpiar estados
  draggedColumnKey.value = null
  dragOverColumnKey.value = null
}

function handleDragEnd() {
  draggedColumnKey.value = null
  dragOverColumnKey.value = null
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

