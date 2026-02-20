<template>
  <div class="excel-grid-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <!-- Header con selector de columnas -->
    <div class="flex items-center justify-between mb-4 px-4 pt-4">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Vista Excel - Redistribución</h3>
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
    
    <!-- Contenedor con scroll horizontal -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Header -->
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <!-- Columnas fijas -->
            <th
              v-if="isColumnVisible('numero')"
              class="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 w-12 min-w-[48px] shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.2)]"
            >
              #
            </th>
            <th
              v-if="isColumnVisible('codigo')"
              class="sticky left-[48px] z-10 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[120px] shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.2)]"
            >
              Código
            </th>
            <th
              v-if="isColumnVisible('producto')"
              class="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[200px]"
            >
              Producto
            </th>
            <th
              v-if="isColumnVisible('total_confirmado')"
              class="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[120px]"
            >
              Total Confirmado
            </th>
            <th
              v-if="isColumnVisible('costo_unitario')"
              class="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[120px]"
            >
              Precio
            </th>
            
            <!-- Columnas de tiendas/bodegas (dinámicas) - siempre visibles -->
            <!-- ⭐ ACTUALIZADO: Muestra código y nombre según formato de dos filas de encabezado del backend -->
            <th
              v-for="tienda in tiendasUnicas"
              :key="tienda.codigo"
              class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] bg-gray-50 dark:bg-gray-900"
              :title="`${tienda.codigo} - ${tienda.nombre}`"
            >
              <div class="flex flex-col items-end gap-0.5">
                <!-- Código (de la fila 2 del Excel) -->
                <span class="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight whitespace-nowrap">
                  {{ tienda.codigo }}
                </span>
                <!-- Nombre (de la fila 1 del Excel) -->
                <span 
                  class="text-[10px] font-normal text-gray-600 dark:text-gray-400 leading-tight break-words max-w-[120px] text-right"
                  :title="tienda.nombre"
                >
                  {{ tienda.nombre || tienda.codigo }}
                </span>
              </div>
            </th>
            
            <!-- Columnas calculadas -->
            <th
              v-if="isColumnVisible('total_distribuido')"
              class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 min-w-[120px] border-l-2 border-gray-300 dark:border-gray-600"
            >
              Total Distribuido
            </th>
            <th
              v-if="isColumnVisible('diferencia')"
              class="sticky right-0 z-[5] px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 min-w-[120px] border-l border-gray-200 dark:border-gray-700 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.25)]"
            >
              Diferencia
            </th>
          </tr>
        </thead>
        
        <!-- Body -->
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <!-- Filas de productos - los colores se aplican solo a las columnas dinámicas (tiendas) -->
          <tr
            v-for="(producto, index) in productosArray"
            :key="producto.codigo_producto"
            class="transition-colors"
          >
            <!-- Columnas fijas - fondo neutro sin colores de estado -->
            <td
              v-if="isColumnVisible('numero')"
              class="sticky left-0 z-[5] px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-center whitespace-nowrap border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {{ index + 1 }}
            </td>
            <td
              v-if="isColumnVisible('codigo')"
              class="sticky z-[5] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              :class="getStickyLeftClass('codigo')"
            >
              {{ producto.codigo_producto }}
            </td>
            <td
              v-if="isColumnVisible('producto')"
              :class="[
                'sticky z-[5] px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
                getStickyLeftClass('producto')
              ]"
            >
              <div class="max-w-[200px] truncate" :title="producto.descripcion">
                {{ producto.descripcion }}
              </div>
            </td>
            <!-- Total Confirmado: resaltar en ámbar si fue modificado en el flujo de EL RAYO -->
            <td
              v-if="isColumnVisible('total_confirmado')"
              :class="[
                'sticky z-[5] px-4 py-3 text-sm font-semibold text-right whitespace-nowrap border-r border-gray-200 dark:border-gray-700',
                getStickyLeftClass('total_confirmado'),
                tieneTotalConfirmadoModificado(producto) 
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-l-2 border-amber-500 dark:border-amber-400' 
                  : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
              ]"
            >
              {{ formatNumber(producto.cantidad_confirmada) }}
            </td>
            <!-- Precio: resaltar en ámbar si fue modificado en el flujo de EL RAYO -->
            <td
              v-if="isColumnVisible('costo_unitario')"
              :class="[
                'sticky z-[5] px-4 py-3 text-sm font-medium text-right whitespace-nowrap border-r border-gray-200 dark:border-gray-700',
                getStickyLeftClass('costo_unitario'),
                tienePrecioModificado(producto) 
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-l-2 border-amber-500 dark:border-amber-400' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              ]"
            >
              {{ producto.costo_unitario ? formatCurrency(producto.costo_unitario) : '-' }}
            </td>
            
            <!-- Celdas de tiendas (editables): resaltar según diferencia del producto -->
            <td
              v-for="tienda in tiendasUnicas"
              :key="`${producto.codigo_producto}-${tienda.codigo}`"
              class="px-4 py-2 text-right transition-colors"
              :class="producto.diferencia === 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'"
            >
              <input
                v-if="!soloLectura"
                type="number"
                :value="getCantidadTienda(producto, tienda.codigo)"
                @input="handleCantidadChange(producto, tienda.codigo, $event)"
                @blur="handleBlur(producto, tienda.codigo)"
                min="0"
                step="1"
                class="w-full max-w-[100px] ml-auto px-2 py-1.5 text-sm text-right border rounded focus:outline-none focus:ring-2 transition-colors"
                :class="getInputClass(producto, tienda.codigo)"
                placeholder="0"
              />
              <span v-else class="block w-full max-w-[100px] ml-auto px-2 py-1.5 text-sm text-right text-gray-900 dark:text-white">
                {{ formatNumber(getCantidadTienda(producto, tienda.codigo)) }}
              </span>
            </td>
            
            <!-- Columnas calculadas -->
            <td
              v-if="isColumnVisible('total_distribuido')"
              class="px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400 text-right whitespace-nowrap bg-gray-50 dark:bg-gray-900/50 border-l-2 border-gray-300 dark:border-gray-600"
            >
              {{ formatNumber(producto.cantidad_distribuida) }}
            </td>
            <td
              v-if="isColumnVisible('diferencia')"
              class="sticky right-0 z-[5] px-4 py-3 text-sm font-semibold text-right whitespace-nowrap min-w-[120px] bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]"
              :class="getDiferenciaClass(producto.diferencia)"
            >
              {{ producto.diferencia > 0 ? '+' : '' }}{{ formatNumber(producto.diferencia) }}
            </td>
          </tr>
        </tbody>
        
        <!-- Footer con totales (opcional) -->
        <tfoot v-if="showTotals" class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600">
          <tr>
            <td
              v-if="isColumnVisible('numero')"
              class="sticky left-0 z-[5] bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 text-center"
            >
              -
            </td>
            <td
              v-if="isColumnVisible('codigo')"
              class="sticky z-[5] bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
              :class="getStickyLeftClass('codigo')"
            >
              TOTALES
            </td>
            <td
              v-if="isColumnVisible('producto')"
              :class="[
                'sticky z-[5] bg-gray-100 dark:bg-gray-900 px-4 py-3 border-r border-gray-200 dark:border-gray-700',
                getStickyLeftClass('producto')
              ]"
            ></td>
            <td
              v-if="isColumnVisible('total_confirmado')"
              :class="[
                'sticky z-[5] bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 text-right border-r border-gray-200 dark:border-gray-700',
                getStickyLeftClass('total_confirmado')
              ]"
            >
              {{ formatNumber(totalesConfirmado) }}
            </td>
            <td
              v-if="isColumnVisible('costo_unitario')"
              :class="[
                'sticky z-[5] bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right border-r border-gray-200 dark:border-gray-700',
                getStickyLeftClass('costo_unitario')
              ]"
            >
              {{ formatCurrency(totalesCostoUnitario) }}
            </td>
            <td
              v-for="tienda in tiendasUnicas"
              :key="`total-${tienda.codigo}`"
              class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right"
            >
              {{ formatNumber(getTotalTienda(tienda.codigo)) }}
            </td>
            <td
              v-if="isColumnVisible('total_distribuido')"
              class="px-4 py-3 text-sm font-bold text-purple-600 dark:text-purple-400 text-right border-l-2 border-gray-300 dark:border-gray-600"
            >
              {{ formatNumber(totalesDistribuido) }}
            </td>
            <td
              v-if="isColumnVisible('diferencia')"
              class="sticky right-0 z-[5] px-4 py-3 text-sm font-bold text-right min-w-[120px] bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.25)]"
              :class="getDiferenciaClass(totalesDiferencia)"
            >
              {{ totalesDiferencia > 0 ? '+' : '' }}{{ formatNumber(totalesDiferencia) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <!-- Mensaje de error global si existe -->
    <div v-if="productosConError.length > 0" class="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
      <div class="flex items-start gap-2">
        <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-red-800 dark:text-red-200">
            {{ productosConError.length }} producto(s) con errores
          </p>
          <ul class="text-xs text-red-700 dark:text-red-300 mt-1 list-disc list-inside">
            <li v-for="producto in productosConError" :key="producto.codigo_producto">
              {{ producto.codigo_producto }}: {{ producto.error }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import { formatNumber, formatCurrency, type ColumnConfig } from '../utils/formatters'
import { getDiferenciaClass } from '../utils/styleHelpers'
import { useTablePreferences } from '@/composables/useTablePreferences'

interface Props {
  productos: Ref<ProductoRedistribucion[]>
  showTotals?: boolean
  /** Si true, las celdas de cantidad son solo lectura */
  soloLectura?: boolean
  columnasModificadas?: Ref<Set<string>>
  pedido?: any
}

interface Emits {
  (e: 'actualizar-cantidad-tienda', codigoProducto: string, tiendaCodigo: string, event: Event): void
  (e: 'validar-y-corregir-cantidad', producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada): void
}

const props = withDefaults(defineProps<Props>(), {
  showTotals: true,
  soloLectura: false
})

const emit = defineEmits<Emits>()

// Computed para obtener productos como array (ya que viene como Ref)
const productosArray = computed(() => props.productos.value || [])

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
      (d: any) => d.codigo_interno === producto.codigo_producto
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
  
  // Log para depuración (solo en desarrollo)
  if (import.meta.env.DEV) {
    const productosConMod = Array.from(map.entries()).filter(([_, tieneMod]) => tieneMod)
    if (productosConMod.length > 0) {
      if (import.meta.env.DEV) console.log(`🎨 [ExcelLikeGridView] ${productosConMod.length} productos con modificaciones heredadas:`, productosConMod.map(([codigo]) => codigo))
    }
  }
  
  return map
})

// ⭐ Watch para forzar reactividad cuando cambien las columnas modificadas
// Esto asegura que el resaltado se actualice inmediatamente cuando se carguen las columnas
watch(
  () => props.columnasModificadas?.value,
  (newValue) => {
    if (newValue) {
      if (import.meta.env.DEV) console.log(`🔄 [ExcelLikeGridView] Columnas modificadas actualizadas: ${newValue.size} modificaciones`)
      // Acceder al computed para forzar su recálculo
      const _ = productosConModificaciones.value
    }
  },
  { deep: true, immediate: true }
)

// ⭐ Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)

// Definir columnas disponibles para la vista Excel (solo fijas y calculadas, no tiendas)
const availableColumns: ColumnConfig[] = [
  { key: 'numero', label: '#', visible: true, align: 'center', format: 'text', fixed: true },
  { key: 'codigo', label: 'Código', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'producto', label: 'Producto', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'total_confirmado', label: 'Total Confirmado', visible: true, align: 'right', format: 'number', fixed: true },
  { key: 'costo_unitario', label: 'Precio', visible: true, align: 'right', format: 'currency', fixed: true },
  { key: 'total_distribuido', label: 'Total Distribuido', visible: true, align: 'right', format: 'number' },
  { key: 'diferencia', label: 'Diferencia', visible: true, align: 'right', format: 'number' }
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
  tableId: 'excel-grid-redistribucion',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// Computed para obtener todas las columnas con su estado de visibilidad
const availableColumnsWithVisibility = computed(() => {
  return availableColumns.map(col => ({
    ...col,
    visible: col.fixed ? true : visibleColumns.value.includes(col.key)
  }))
})

// Función para verificar si una columna está visible
function isColumnVisible(columnKey: string): boolean {
  const column = availableColumns.find(col => col.key === columnKey)
  if (!column) return false
  return column.fixed ? true : visibleColumns.value.includes(columnKey)
}

// Función para obtener la clase sticky-left según las columnas visibles
function getStickyLeftClass(columnKey: string): string {
  const columnIndex = availableColumns.findIndex(col => col.key === columnKey)
  if (columnIndex === -1) return ''
  
  let leftPosition = 0
  const widths: Record<string, number> = {
    numero: 48,
    codigo: 120,
    producto: 200,
    total_confirmado: 120,
    costo_unitario: 120
  }
  
  for (let i = 0; i < columnIndex; i++) {
    const col = availableColumns[i]
    if (isColumnVisible(col.key)) {
      leftPosition += widths[col.key] || 120
    }
  }
  
  return leftPosition > 0 ? `left-[${leftPosition}px]` : ''
}

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

/**
 * Verifica si un producto tiene modificaciones en COSTO UNIT o TOTAL (columnas modificadas por EL RAYO)
 * ⭐ MEJORADO: Ahora usa el computed reactivo para asegurar que el resaltado se aplique inmediatamente
 * 
 * IMPORTANTE: Esta función debe ser reactiva a cambios en columnasModificadas
 * para heredar correctamente el resaltado del flujo anterior (Detalle del Pedido - EL RAYO)
 * El resaltado debe aparecer SIEMPRE, no solo cuando se sincroniza la cantidad de productos
 */
function tieneModificaciones(producto: ProductoRedistribucion): boolean {
  // Usar el computed reactivo que ya tiene toda la lógica
  // Esto asegura que el resaltado se aplique inmediatamente al cargar la página
  return productosConModificaciones.value.get(producto.codigo_producto) || false
}

/**
 * Verifica si un producto tiene modificaciones en costo unitario (columna "Precio")
 * ⭐ MEJORADO: Usa el computed reactivo para asegurar que el resaltado se aplique siempre
 * 
 * Mapping: costo_doc_sin_iva (EL RAYO) → costo_unitario / "Precio" (Redistribución)
 */
function tienePrecioModificado(producto: ProductoRedistribucion): boolean {
  // ⭐ PRIORIDAD 1: Usar campo del backend si está disponible
  if (producto.costo_modificado_manual === true) {
    return true
  }
  
  // ⭐ PRIORIDAD 2: Usar el computed reactivo para verificar columnasModificadas
  const columnasModificadasValue = props.columnasModificadas?.value
  if (!columnasModificadasValue || !props.pedido?.detalles) return false
  
  // Buscar el detalle del pedido que corresponde a este producto
  const detallePedido = props.pedido.detalles.find(
    (d: any) => d.codigo_interno === producto.codigo_producto
  )
  
  if (!detallePedido?.pedido_detalle_id) return false
  
  // Verificar si hay una modificación para costo_doc_sin_iva
  const key = `${detallePedido.pedido_detalle_id}:costo_doc_sin_iva`
  return columnasModificadasValue.has(key)
}

/**
 * Verifica si un producto tiene modificaciones en total (columna "Total Confirmado")
 * ⭐ NUEVO: Resaltado específico para la columna Total Confirmado
 * 
 * Mapping: total (EL RAYO) → total_confirmado / "Total Confirmado" (Redistribución)
 */
function tieneTotalConfirmadoModificado(producto: ProductoRedistribucion): boolean {
  // ⭐ PRIORIDAD 1: Usar campo del backend si está disponible
  if (producto.total_modificado_manual === true) {
    return true
  }
  
  // ⭐ PRIORIDAD 2: Usar el computed reactivo para verificar columnasModificadas
  const columnasModificadasValue = props.columnasModificadas?.value
  if (!columnasModificadasValue || !props.pedido?.detalles) return false
  
  // Buscar el detalle del pedido que corresponde a este producto
  const detallePedido = props.pedido.detalles.find(
    (d: any) => d.codigo_interno === producto.codigo_producto
  )
  
  if (!detallePedido?.pedido_detalle_id) return false
  
  // Verificar si hay una modificación para total
  const key = `${detallePedido.pedido_detalle_id}:total`
  return columnasModificadasValue.has(key)
}

// ⭐ Obtener todas las tiendas/bodegas únicas de todos los productos
// El backend ahora parsea dos filas de encabezado:
// - Fila 1: nombres (ej: "Roland", "Descuentón", "Región")
// - Fila 2: códigos (ej: "RL-CD", "OUT-CD", "REG-CD")
// Esto aplica tanto para bodegas (K, L, M) como para tiendas (N+)
const tiendasUnicas = computed(() => {
  const tiendasMap = new Map<string, { codigo: string; nombre: string }>()
  
  productosArray.value.forEach(producto => {
    producto.distribucion_tiendas.forEach(tienda => {
      if (!tiendasMap.has(tienda.tienda_codigo)) {
        // ⭐ El código viene de la fila 2 del Excel (ej: "RL-CD", "OUT-CD", "REG-CD", códigos de tiendas)
        // ⭐ El nombre viene de la fila 1 del Excel (ej: "Roland", "Descuentón", "Región", nombres de tiendas)
        const nombre = tienda.tienda_nombre || tienda.tienda_codigo
        tiendasMap.set(tienda.tienda_codigo, {
          codigo: tienda.tienda_codigo,
          nombre: nombre
        })
      }
    })
  })
  
  // Ordenar por código de tienda/bodega
  const tiendasOrdenadas = Array.from(tiendasMap.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))
  
  // Log para depuración: verificar que los nombres se están recibiendo (solo en desarrollo)
  if (import.meta.env.DEV && tiendasOrdenadas.length > 0) {
    if (import.meta.env.DEV) console.log('📊 [ExcelLikeGridView] Tiendas detectadas:', tiendasOrdenadas.map(t => ({ codigo: t.codigo, nombre: t.nombre })))
  }
  
  return tiendasOrdenadas
})

// Obtener cantidad de una tienda específica para un producto
function getCantidadTienda(producto: ProductoRedistribucion, tiendaCodigo: string): number {
  const tienda = producto.distribucion_tiendas.find(t => t.tienda_codigo === tiendaCodigo)
  return tienda?.cantidad_asignada || 0
}

// Obtener total por tienda
function getTotalTienda(tiendaCodigo: string): number {
  return productosArray.value.reduce((sum, producto) => {
    return sum + getCantidadTienda(producto, tiendaCodigo)
  }, 0)
}

// Totales generales
const totalesConfirmado = computed(() => {
  return productosArray.value.reduce((sum, p) => sum + p.cantidad_confirmada, 0)
})

const totalesCostoUnitario = computed(() => {
  return productosArray.value.reduce((sum, p) => sum + (p.costo_unitario || 0), 0)
})

const totalesDistribuido = computed(() => {
  return productosArray.value.reduce((sum, p) => sum + p.cantidad_distribuida, 0)
})

const totalesDiferencia = computed(() => {
  return totalesDistribuido.value - totalesConfirmado.value
})

// Productos con error
const productosConError = computed(() => {
  return productosArray.value.filter(p => p.error)
})

// Clases para input según validación
function getInputClass(producto: ProductoRedistribucion, tiendaCodigo: string): string {
  const tienda = producto.distribucion_tiendas.find(t => t.tienda_codigo === tiendaCodigo)
  if (!tienda) {
    return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 dark:focus:ring-purple-400'
  }
  
  // Validación básica: no puede ser negativo
  if (tienda.cantidad_asignada < 0) {
    return 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 focus:ring-red-500 dark:focus:ring-red-400'
  }
  
  // ⭐ VALIDACIÓN VISUAL: Resaltar en rojo cuando el total exceda la cantidad confirmada
  // Esto indica al usuario que debe corregir (ajustar bodegas o tiendas manualmente)
  // Ya que las bodegas no se ajustan automáticamente, el usuario puede aumentar tiendas
  // sin que se reste de las bodegas, lo que puede hacer que el total exceda lo confirmado
  const esValido = producto.cantidad_distribuida <= producto.cantidad_confirmada
  
  if (esValido) {
    return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 dark:focus:ring-purple-400'
  } else {
    // Resaltar en rojo para indicar que necesita corrección
    return 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 focus:ring-red-500 dark:focus:ring-red-400'
  }
}

// Handler para cambio de cantidad
function handleCantidadChange(producto: ProductoRedistribucion, tiendaCodigo: string, event: Event) {
  emit('actualizar-cantidad-tienda', producto.codigo_producto, tiendaCodigo, event)
}

// Handler para blur (validar y corregir)
function handleBlur(producto: ProductoRedistribucion, tiendaCodigo: string) {
  const tienda = producto.distribucion_tiendas.find(t => t.tienda_codigo === tiendaCodigo)
  if (tienda) {
    emit('validar-y-corregir-cantidad', producto, tienda)
  }
}

// Agregar listener para cerrar dropdown al hacer click fuera
onMounted(() => {
  document.addEventListener('click', handleClickOutsideColumnSelector)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideColumnSelector)
})
</script>

<style scoped>
/* Estilos para el scroll horizontal suave */
.excel-grid-container {
  position: relative;
}

/* Sombra para indicar scroll horizontal disponible */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* Asegurar que las columnas fijas tengan fondo completamente opaco */
tbody tr td.fixed-column-bg {
  opacity: 1 !important;
}

/* Clases específicas para cada estado - Modo claro */
td.fixed-bg-green {
  background-color: rgb(240 253 244) !important; /* green-50 completamente opaco */
}

td.fixed-bg-yellow {
  background-color: rgb(254 252 232) !important; /* yellow-50 completamente opaco */
}

td.fixed-bg-red {
  background-color: rgb(254 242 242) !important; /* red-50 completamente opaco */
}

td.fixed-bg-error {
  background-color: rgb(243 244 246) !important; /* gray-100 completamente opaco - más tenue para errores */
}

td.fixed-bg-amber {
  background-color: rgb(254 243 199) !important; /* amber-100 completamente opaco - más visible que amber-50 - productos modificados por EL RAYO */
  border-left: 3px solid rgb(245 158 11) !important; /* borde izquierdo ámbar más grueso para destacar en modo claro */
}

/* Resaltado para costos modificados - sobrescribe el fondo del estado */
/* Modo claro */
td.fixed-column-bg.costo-modificado {
  background-color: rgb(254 243 199) !important; /* amber-100 completamente opaco - más visible */
  border-left-width: 3px !important;
  border-left-color: rgb(245 158 11) !important; /* amber-500 */
}

/* Modo oscuro */
.dark td.fixed-column-bg.costo-modificado {
  background-color: rgb(146 64 14) !important; /* amber-800 completamente opaco - más visible */
  border-left-width: 3px !important;
  border-left-color: rgb(251 191 36) !important; /* amber-400 */
}

/* Modo oscuro - fondos completamente opacos */
.dark td.fixed-bg-green {
  background-color: rgb(20 83 45) !important; /* green-900 completamente opaco - filas completas en modo oscuro */
}

.dark td.fixed-bg-yellow {
  background-color: rgb(113 63 18) !important; /* yellow-900 completamente opaco */
}

.dark td.fixed-bg-red {
  background-color: rgb(127 29 29) !important; /* red-900 completamente opaco */
}

.dark td.fixed-bg-error {
  background-color: rgb(55 65 81) !important; /* gray-700 completamente opaco - más tenue para errores */
}

.dark td.fixed-bg-amber {
  background-color: rgb(146 64 14) !important; /* amber-800 completamente opaco - más visible que amber-900 - productos modificados por EL RAYO */
}

/* Resaltado adicional para filas completas con modificaciones en modo oscuro */
.dark tbody tr.row-modified-amber {
  background-color: rgb(146 64 14 / 0.6) !important; /* amber-800 con 60% opacidad - más visible */
  border-left: 3px solid rgb(251 191 36) !important; /* borde izquierdo ámbar brillante para destacar */
}

.dark tbody tr.row-modified-amber td:not(.fixed-column-bg) {
  background-color: rgb(146 64 14 / 0.4) !important; /* celdas no fijas con fondo ámbar más tenue */
}

/* Modo claro - también mejorar visibilidad */
tbody tr.row-modified-amber {
  border-left: 3px solid rgb(245 158 11) !important; /* borde izquierdo ámbar para destacar en modo claro */
  background-color: rgb(254 243 199) !important; /* amber-100 para mayor visibilidad en modo claro */
}

/* Mantener fondo opaco en hover */
tbody tr:hover td.fixed-column-bg {
  opacity: 1 !important;
}
</style>
