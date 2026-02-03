<template>
  <!-- Overlay de bloqueo durante la carga de plantilla Excel -->
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
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center transition-colors duration-300">
        <div class="flex flex-col items-center gap-4">
          <svg class="animate-spin h-12 w-12 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Cargando Plantilla Excel</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Por favor espera mientras se procesa el archivo...</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6" :class="{ 'pointer-events-none opacity-75': uploading }">
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
        :hide-confirm-and-download="true"
        :show-crear-pedido="false"
        :hide-cargar-plantillas="!pedido"
        @cargar-plantillas="goToCargarPlantillas"
        @generar-oc="handleGenerarOCDesdePedido"
        @confirmar="handleConfirmar"
        @go-to-pedido="goToPedidoWrapper"
        @search-blur="handleSearchBlur"
        @descargar-plano-mba="handleDescargarPlanoMba"
        @crear-pedido="handleCrearPedido"
      />

      <!-- Enviar / Descartar (solo cuando hay pedido cargado) -->
      <div v-if="pedido && !loading" class="flex items-center justify-end gap-3">
        <button
          type="button"
          @click="handleDescartar"
          :disabled="descartando || !(pedido?.puede_descartar ?? false)"
          class="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ descartando ? 'Descartando...' : 'Descartar' }}
        </button>
        <button
          v-if="esPedidoBorrador"
          type="button"
          @click="handleEnviar"
          :disabled="enviando"
          class="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ enviando ? 'Enviando...' : 'Enviar' }}
        </button>
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

      <!-- Estado inicial: cuando no hay pedido, no está cargando y no hay error -->
      <div v-if="!pedido && !loading && !error" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
          <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Busca o carga un pedido</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Usa el campo de búsqueda en el header para buscar un pedido por número, o carga una plantilla Excel.
        </p>
        <div class="flex items-center justify-center gap-3">
          <button
            @click="goToCargarPlantillas"
            :disabled="uploading"
            class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            title="Cargar plantilla Excel"
          >
            <svg v-if="!uploading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ uploading ? 'Cargando...' : 'Cargar Plantillas Excel' }}
          </button>
        </div>
      </div>

      <!-- Contenido del pedido -->
      <div v-if="pedido && !loading">
        <!-- Información de la cabecera -->
        <PedidoCabecera
          :pedido="pedido"
          :copy-feedback="copyFeedback"
          :editable="!esModoMabelTrading"
          :editable-estado="false"
          :default-expanded="!esModoMabelTrading"
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
                      // ⭐ En Cargar Plantilla, los campos costo_doc_sin_iva, total y comentario NO son editables
                      column.key === 'total' ? 'font-medium text-gray-900 dark:text-white' :
                      column.key === 'descripcion_sap' ? 'text-gray-900 dark:text-white' :
                      column.key === 'costo_doc_sin_iva' ? '' :
                      column.key === 'comentario' ? '' :
                      'text-gray-500 dark:text-gray-400 whitespace-nowrap'
                    ]"
                    :data-column-key="column.key"
                    :data-detalle-id="detalle.pedido_detalle_id"
                    @dblclick="false"
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
    <UploadErrorModal
      v-model="showErrorModal"
      :upload-error-info="uploadErrorInfo"
      :show-data-protection-message="true"
      @apply-corrections="aplicarCorreccionesYContinuar"
    />

    <!-- HU-08: Modal para exportar pedido a formato MBA -->
    <ExportarMBAModal
      ref="exportarMBAModalRef"
      :is-open="showExportarMBAModal"
      :numero-pedido="numeroPedido || ''"
      :bodega-default="pedido?.cabecera?.origen_traslado || ''"
      :odc-default="pedido?.cabecera?.odc || ''"
      @close="showExportarMBAModal = false"
      @exportar="handleExportarMBA"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted, watch, nextTick, Teleport, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { mba3ConsultasService, extractErrorMessage } from '../services/mba3ConsultasApi'
import type { PedidoCompleto, ReporteDiferenciasResponse, UploadPlantillaResponse, ExportarMBAParams } from '../types'
// Utilidades extraídas
import {
  formatDate,
  formatNumber,
  formatCurrency,
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
import { useColumnManagement } from '../composables/useColumnManagement'
import { usePedidoDetalle } from '../composables/usePedidoDetalle'
import { useRedistribucion } from '../composables/useRedistribucion'
// Componentes
import PedidoHeaderActions from '../components/PedidoHeaderActions.vue'
import PedidoCabecera from '../components/PedidoCabecera.vue'
import RedistribucionTiendas from '../components/RedistribucionTiendas.vue'
import UploadErrorModal from '../components/UploadErrorModal.vue'
import ExportarMBAModal from '../components/ExportarMBAModal.vue'

// Constantes de configuración
const SCROLL_DELAY_MS = 100
const ROUTE_REDIRECT_DELAY_MS = 1500
const SEARCH_HELP_BLUR_DELAY_MS = 200
const COPY_FEEDBACK_DURATION_MS = 2000

const route = useRoute()
const router = useRouter()
const toast = useToast()

// ⭐ Función para manejar el click en "Crear Pedido Manual"
function handleCrearPedido() {
  router.push('/mba3-consultas/pedidos/crear')
}

const enviando = ref(false)
async function handleEnviar() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) {
    toast.warning('Sin pedido', 'No hay pedido cargado para enviar')
    return
  }
  if (!confirm('¿Deseas enviar este pedido a EL RAYO?')) return
  enviando.value = true
  try {
    const data = await mba3ConsultasService.enviarPedido(pedidoId)
    if (pedido.value?.cabecera) {
      pedido.value.cabecera.estado = data.estado_nombre
    }
    toast.success('Pedido enviado', data.message || 'El pedido se ha enviado correctamente')
  } catch (e: any) {
    toast.error('Error al enviar', extractErrorMessage(e))
  } finally {
    enviando.value = false
  }
}

const descartando = ref(false)
async function handleDescartar() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) {
    toast.warning('Sin pedido', 'No hay pedido cargado para descartar')
    return
  }
  descartando.value = true
  try {
    await mba3ConsultasService.descartarPedido(pedidoId)
    pedido.value = null
    error.value = null
    router.push('/mba3-consultas/cargar-plantilla')
    toast.success('Pedido descartado', 'El pedido se ha eliminado correctamente')
  } catch (e: any) {
    toast.error('Error al descartar', extractErrorMessage(e))
  } finally {
    descartando.value = false
  }
}

const pedido = ref<PedidoCompleto | null>(null)

// ⭐ HU-08: Estado del modal de exportación MBA
const showExportarMBAModal = ref(false)
const exportarMBAModalRef = ref<InstanceType<typeof ExportarMBAModal> | null>(null)

// ⭐ Set para rastrear columnas modificadas (formato: "detalleId:columnKey")
const columnasModificadas = ref<Set<string>>(new Set())

// Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)
const confirmando = ref(false)
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
  return 'Cargar Plantilla - MABEL TRADING'
})

/** Mostrar botón Enviar solo cuando el pedido está en BORRADOR (estado_id 1 / estado "BORRADOR") */
const esPedidoBorrador = computed(() => pedido.value?.cabecera?.estado === 'BORRADOR')

// ⭐ Variables para controlar la carga automática del último pedido
const cargandoUltimoPedido = ref(false)
const busquedaManualRealizada = ref(false)

/**
 * Carga automáticamente el último pedido del usuario cuando no hay :id en la ruta
 * Se ejecuta cada vez que el usuario entra a "Cargar Plantilla" sin un número de pedido
 */
async function cargarUltimoPedido() {
  // Si ya hay un número de pedido en la ruta, no hacer nada
  if (numeroPedido.value) {
    return
  }

  // Evitar múltiples llamadas simultáneas
  if (cargandoUltimoPedido.value) {
    return
  }

  // Si el usuario hizo una búsqueda manual, no redirigir automáticamente
  if (busquedaManualRealizada.value) {
    return
  }

  cargandoUltimoPedido.value = true
  
  try {
    const ultimoPedido = await mba3ConsultasService.getUltimoPedido(false)
    
    if (ultimoPedido && ultimoPedido.cabecera.numero_pedido) {
      // Mostrar badge informativo
      toast.info(
        'Último pedido cargado',
        `Mostrando último pedido: ${ultimoPedido.cabecera.numero_pedido}`
      )
      
      // Redirigir a la misma ruta pero con el número de pedido
      if (!busquedaManualRealizada.value) {
        router.push(`/mba3-consultas/cargar-plantilla/${encodeURIComponent(ultimoPedido.cabecera.numero_pedido)}`)
      }
    }
  } catch (error: any) {
    // Si es un error que no sea 404, loguearlo pero no mostrar error al usuario
    // (el 404 ya se maneja en el servicio retornando null)
    if (error.response?.status !== 404 && error.message && !error.message.includes('404')) {
      console.error('Error al cargar último pedido:', error)
    }
    // No mostrar error al usuario, simplemente no redirigir
  } finally {
    cargandoUltimoPedido.value = false
  }
}

/**
 * Resetea el flag de búsqueda manual cuando se monta/activa el componente
 * Esto permite que al regresar a "Cargar Plantilla", se vuelva a cargar el último pedido
 */
function resetearEstado() {
  busquedaManualRealizada.value = false
}

// ⭐ Wrapper para goToPedido que navega a la ruta correcta y marca búsqueda manual
async function goToPedidoWrapper() {
  const numeroPedidoBuscado = pedidoIdInput.value.trim()
  
  if (!numeroPedidoBuscado) {
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
  
  // Marcar que se hizo una búsqueda manual (evita redirección automática)
  busquedaManualRealizada.value = true
  
  // Navegar a la ruta de cargar plantilla con el número de pedido
  router.push(`/mba3-consultas/cargar-plantilla/${encodeURIComponent(numeroPedidoBuscado)}`)
  
  // Limpiar el input después de navegar
  pedidoIdInput.value = ''
}

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
  redirectToCargarPlantilla: true, // Tras subir plantilla, permanecer en /mba3-consultas/cargar-plantilla/:id
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

// ⭐ REMOVIDO: Refs de sugerencias movidas a UploadErrorModal.vue

// ⭐ REMOVIDO: Funciones de sugerencias movidas a UploadErrorModal.vue
// - extraerCodigosProductoNoEncontrados
// - getInfoMba3
// - buscarSugerenciasParaCodigo
// - buscarSugerenciasAutomaticas
// - limpiarSugerencias
// - todosCodigosTienenCorreccion (computed)

/**
 * Aplica las correcciones seleccionadas y reintenta el flujo de carga
 * ⭐ ACTUALIZADO: Ahora recibe las correcciones como parámetro desde UploadErrorModal
 */
async function aplicarCorreccionesYContinuar(correcciones: Record<string, string>): Promise<void> {
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

// ⭐ HU-08: Función para abrir el modal de exportación MBA
function handleDescargarPlanoMba() {
  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido seleccionado')
    return
  }
  showExportarMBAModal.value = true
}

// ⭐ HU-08: Función para ejecutar la exportación con los parámetros del modal
async function handleExportarMBA(params: ExportarMBAParams) {
  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido seleccionado')
    return
  }
  
  // Indicar al modal que está exportando
  exportarMBAModalRef.value?.setExportando(true)
  
  try {
    toast.info('Generando archivo...', 'Preparando descarga del pedido en formato MBA')
    
    const blob = await mba3ConsultasService.exportarPedidoPlanoMba(numeroPedido.value, params.formato || 'txt')
    
    // Crear URL del blob y descargar
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Nombre del archivo: pedido_mba_{numero_pedido}_{fecha}.txt
    const nombreArchivo = `pedido_mba_${numeroPedido.value.replace(/[^a-zA-Z0-9.-]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Descarga completada', 'El archivo se ha descargado correctamente')
    showExportarMBAModal.value = false
  } catch (e: any) {
    console.error('Error al descargar pedido plano:', e)
    toast.error('Error al descargar', e.message || 'No se pudo descargar el archivo')
  } finally {
    exportarMBAModalRef.value?.setExportando(false)
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
  resetearEstado()
  
  // Si no hay número de pedido en la ruta, cargar el último pedido automáticamente
  if (!numeroPedido.value) {
    cargarUltimoPedido()
  } else {
    // Si hay número de pedido, cargar ese pedido
    loadPedido()
  }
  
  // ⭐ Las columnas modificadas se cargan automáticamente en loadPedido()
  // Agregar listener para cerrar dropdown al hacer click fuera
  document.addEventListener('click', handleClickOutsideColumnSelector)
})

// ⭐ Si el componente está en un keep-alive, también cargar al activarse
onActivated(() => {
  resetearEstado()
  
  // Si no hay número de pedido en la ruta, cargar el último pedido automáticamente
  if (!numeroPedido.value) {
    cargarUltimoPedido()
  } else {
    // Si hay número de pedido, recargar ese pedido
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

