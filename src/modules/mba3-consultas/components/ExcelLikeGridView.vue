<template>
  <div class="excel-grid-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <!-- Header con selector de columnas (px-6 alineado con la barra de totales del padre) -->
    <div class="flex items-center justify-between mb-0 px-6 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Vista Excel - Redistribución</h3>
      <div class="flex items-center gap-2">
        <!-- Agregar tienda: solo en pedidos hijo (redistribución hacia tiendas fuera del Excel original) -->
        <div v-if="esPedidoHijo && !soloLectura" class="relative">
          <button
            v-if="!mostrarBuscadorTienda"
            type="button"
            @click="mostrarBuscadorTienda = true"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
            title="Agregar tienda a la redistribución"
          >
            <PlusIcon class="w-4 h-4" aria-hidden="true" />
            Tienda
          </button>
          <div v-else class="absolute right-0 top-0 z-40" @keydown.escape="mostrarBuscadorTienda = false">
            <TiendaSearchCombobox :excluir-codigos="tiendasUnicas.map(t => t.codigo)" @select="onAgregarTienda" />
          </div>
        </div>
        <ColumnSelectorDropdown
          :columns="availableColumnsWithVisibility"
          :is-open="columnVisibility.isOpen.value"
          :selector-id="columnVisibility.selectorId"
          :is-syncing="isSyncing"
          @toggle-open="columnVisibility.toggleOpen"
          @toggle-column="columnVisibility.toggleColumnVisibility"
        />
      </div>
    </div>

    <!-- Mensaje de error global: va ANTES del scroller a propósito (no después). El cromo
         por ENCIMA del scroller se cancela algebraicamente en la fórmula de max-height (ver
         comentario en <style scoped>), así que aquí su alto variable (1 línea por producto
         con error) no desalinea el thead congelado contra la barra de indicadores. Estuvo
         debajo hasta que con varios errores simultáneos el bloque creció lo suficiente para
         empujar el "reposo" del scroller detrás de esa barra, tapando el encabezado por
         completo. Además es mejor UX: se ve el motivo del error sin tener que bajar. -->
    <div v-if="productosConError.length > 0" class="p-4 bg-red-50 dark:bg-red-900/20 border-t border-b border-red-200 dark:border-red-800">
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

    <!-- Requerimiento 1.1.1: scroller único y acotado en altura.
         El thead se congela contra el borde superior de ESTE contenedor (no del viewport),
         porque un ancestro con overflow-x:auto ya es el scrollport del sticky
         (overflow-x:auto + overflow-y:visible ⇒ overflow-y computa a auto).
         Mismo patrón usado en CargarPlantillaView.vue:207 y conciliacion/ReporteMaestroView.vue. -->
    <!-- Sin tabindex: los navegadores modernos hacen enfocable un contenedor con scroll
         por sí solos, y Sonar (Web:S6845) rechaza tabindex en elementos no interactivos. -->
    <section
      ref="scrollerRef"
      class="grid-scroller"
      aria-label="Matriz de redistribución por tienda"
    >
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr ref="headerRowRef">
            <!-- Columnas fijas: congeladas en vertical (top-0) y horizontal (left medido en runtime) -->
            <th
              v-if="isColumnVisible('numero')"
              data-col="numero"
              :style="stickyLeftStyle('numero')"
              class="sticky top-0 z-[16] header-shadow bg-gray-50 dark:bg-gray-900 px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider frozen-divider w-10 min-w-[40px]"
            >
              #
            </th>
            <th
              v-if="isColumnVisible('codigo')"
              data-col="codigo"
              :style="stickyLeftStyle('codigo')"
              class="sticky top-0 z-[16] header-shadow bg-gray-50 dark:bg-gray-900 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider frozen-divider whitespace-nowrap"
            >
              Código
            </th>
            <th
              v-if="isColumnVisible('producto')"
              data-col="producto"
              :style="stickyLeftStyle('producto')"
              class="sticky top-0 z-[16] header-shadow bg-gray-50 dark:bg-gray-900 px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider frozen-divider min-w-[200px]"
            >
              Producto
            </th>
            <!-- Etiqueta en dos líneas: el ancho de la columna lo manda el número, no el título -->
            <th
              v-if="isColumnVisible('total_confirmado')"
              data-col="total_confirmado"
              :style="stickyLeftStyle('total_confirmado')"
              class="sticky top-0 z-[16] header-shadow bg-gray-50 dark:bg-gray-900 px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider frozen-divider"
            >
              <span class="flex flex-col items-end leading-tight">
                <span>Total</span>
                <span>Confirmado</span>
              </span>
            </th>
            <th
              v-if="isColumnVisible('costo_unitario')"
              data-col="costo_unitario"
              :style="stickyLeftStyle('costo_unitario')"
              class="sticky top-0 z-[16] frozen-edge bg-gray-50 dark:bg-gray-900 px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
            >
              Precio
            </th>

            <!-- Columnas de tiendas/bodegas (dinámicas) - siempre visibles.
                 Solo se muestra el código; el nombre completo (variable en longitud, algunos
                 envuelven a 2-3 líneas y estiraban el alto del thead) queda en el :title,
                 visible al pasar el mouse sobre toda la celda. -->
            <th
              v-for="tienda in tiendasUnicas"
              :key="tienda.codigo"
              :class="[
                'sticky top-0 z-[15] header-shadow px-6 py-2 text-right text-xs font-medium uppercase tracking-wider min-w-[120px]',
                tienda.agregadaManualmente
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400'
              ]"
              :title="`${tienda.codigo} - ${tienda.nombre}`"
            >
              <span
                :class="[
                  'font-semibold text-sm leading-tight whitespace-nowrap',
                  tienda.agregadaManualmente ? 'text-indigo-700 dark:text-indigo-200' : 'text-gray-900 dark:text-gray-100'
                ]"
              >
                {{ tienda.codigo }}
              </span>
            </th>

            <!-- Columnas calculadas -->
            <th
              v-if="isColumnVisible('total_distribuido')"
              class="sticky top-0 z-[15] header-shadow frozen-divider-thick px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800"
            >
              <span class="flex flex-col items-end leading-tight">
                <span>Total</span>
                <span>Distribuido</span>
              </span>
            </th>
            <th
              v-if="isColumnVisible('diferencia')"
              class="sticky top-0 right-0 z-[16] frozen-edge-right px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 whitespace-nowrap"
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
              :style="stickyLeftStyle('numero')"
              class="sticky z-[5] px-2 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-center whitespace-nowrap frozen-divider bg-white dark:bg-gray-800"
            >
              {{ Number(index) + 1 }}
            </td>
            <td
              v-if="isColumnVisible('codigo')"
              :style="stickyLeftStyle('codigo')"
              class="sticky z-[5] px-3 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap frozen-divider bg-white dark:bg-gray-800"
            >
              {{ producto.codigo_producto }}
            </td>
            <td
              v-if="isColumnVisible('producto')"
              :style="stickyLeftStyle('producto')"
              class="sticky z-[5] px-6 py-3 text-sm text-gray-900 dark:text-white frozen-divider bg-white dark:bg-gray-800"
            >
              <div class="max-w-[200px] truncate" :title="producto.descripcion">
                {{ producto.descripcion }}
              </div>
            </td>
            <!-- Total Confirmado: resaltar si fue modificado heredado del flujo anterior -->
            <td
              v-if="isColumnVisible('total_confirmado')"
              :style="stickyLeftStyle('total_confirmado')"
              :class="[
                'sticky z-[5] px-3 py-3 text-sm font-semibold text-right whitespace-nowrap',
                totalConfirmadoModificado(producto)
                  ? 'bg-cyan-100 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-200 frozen-divider-modified'
                  : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 frozen-divider'
              ]"
            >
              {{ formatNumberWithDecimals(producto.cantidad_confirmada, decimalPlaces) }}
            </td>
            <!-- Precio: resaltar si fue modificado heredado del flujo anterior -->
            <td
              v-if="isColumnVisible('costo_unitario')"
              :style="stickyLeftStyle('costo_unitario')"
              :class="[
                'sticky z-[5] px-3 py-3 text-sm font-medium text-right whitespace-nowrap',
                precioModificado(producto)
                  ? 'bg-cyan-100 dark:bg-cyan-800 text-cyan-900 dark:text-cyan-200 frozen-edge-modified'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white frozen-edge'
              ]"
            >
              {{ producto.costo_unitario != null ? formatCurrencyWithDecimals(producto.costo_unitario, 4) : '-' }}
            </td>
            
            <!-- Celdas de tiendas (editables): resaltar según diferencia del producto -->
            <td
              v-for="tienda in tiendasUnicas"
              :key="`${producto.codigo_producto}-${tienda.codigo}`"
              class="px-4 py-2 text-right transition-colors"
              :class="cercaDeCeroDiferencia(producto.diferencia) ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'"
            >
              <input
                v-if="!soloLectura"
                type="number"
                :value="getCantidadTienda(producto, tienda.codigo)"
                @input="handleCantidadChange(producto, tienda.codigo, $event)"
                @blur="handleBlur(producto, tienda.codigo, $event)"
                @keydown="bloquearTeclasNoNumerosCantidad($event)"
                min="0"
                step="0.5"
                inputmode="numeric"
                class="w-full max-w-[100px] ml-auto px-2 py-1.5 text-sm text-right border rounded focus:outline-none focus:ring-2 transition-colors"
                :class="getInputClass(producto, tienda.codigo)"
                placeholder="0"
                title="Solo múltiplos de 0,5. Escriba números; use flechas para 0,5, 1,5…"
              />
              <span v-else class="block w-full max-w-[100px] ml-auto px-2 py-1.5 text-sm text-right text-gray-900 dark:text-white">
                {{ formatNumberWithDecimals(getCantidadTienda(producto, tienda.codigo), decimalPlaces) }}
              </span>
            </td>
            
            <!-- Columnas calculadas -->
            <td
              v-if="isColumnVisible('total_distribuido')"
              class="px-3 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400 text-right whitespace-nowrap bg-gray-50 dark:bg-gray-900/50 border-l-2 border-gray-300 dark:border-gray-600"
            >
              {{ formatNumberWithDecimals(producto.cantidad_distribuida, decimalPlaces) }}
            </td>
            <td
              v-if="isColumnVisible('diferencia')"
              class="sticky right-0 z-[5] px-3 py-3 text-sm font-semibold text-right whitespace-nowrap bg-gray-50 dark:bg-gray-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]"
              :class="getDiferenciaClass(producto.diferencia)"
            >
              {{ producto.diferencia > 0 ? '+' : '' }}{{ formatNumberWithDecimals(producto.diferencia, decimalPlaces) }}
            </td>
          </tr>
        </tbody>
        
        <!-- Footer con totales (opcional) -->
        <tfoot v-if="showTotals" class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600">
          <tr>
            <td
              v-if="isColumnVisible('numero')"
              :style="stickyLeftStyle('numero')"
              class="sticky z-[5] bg-gray-100 dark:bg-gray-900 px-2 py-3 text-sm font-semibold text-gray-900 dark:text-white frozen-divider text-center"
            >
              -
            </td>
            <td
              v-if="isColumnVisible('codigo')"
              :style="stickyLeftStyle('codigo')"
              class="sticky z-[5] bg-gray-100 dark:bg-gray-900 px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white frozen-divider whitespace-nowrap"
            >
              TOTALES
            </td>
            <td
              v-if="isColumnVisible('producto')"
              :style="stickyLeftStyle('producto')"
              class="sticky z-[5] bg-gray-100 dark:bg-gray-900 px-6 py-3 frozen-divider"
            ></td>
            <td
              v-if="isColumnVisible('total_confirmado')"
              :style="stickyLeftStyle('total_confirmado')"
              class="sticky z-[5] bg-gray-100 dark:bg-gray-900 px-3 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 text-right frozen-divider"
            >
              {{ formatNumberWithDecimals(totalesConfirmado, decimalPlaces) }}
            </td>
            <td
              v-if="isColumnVisible('costo_unitario')"
              :style="stickyLeftStyle('costo_unitario')"
              class="sticky z-[5] frozen-edge bg-gray-100 dark:bg-gray-900 px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right frozen-divider"
            >
              {{ formatCurrencyWithDecimals(totalesCostoUnitario, 4) }}
            </td>
            <td
              v-for="tienda in tiendasUnicas"
              :key="`total-${tienda.codigo}`"
              class="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right"
            >
              {{ formatNumberWithDecimals(getTotalTienda(tienda.codigo), decimalPlaces) }}
            </td>
            <td
              v-if="isColumnVisible('total_distribuido')"
              class="px-3 py-3 text-sm font-bold text-purple-600 dark:text-purple-400 text-right border-l-2 border-gray-300 dark:border-gray-600"
            >
              {{ formatNumberWithDecimals(totalesDistribuido, decimalPlaces) }}
            </td>
            <td
              v-if="isColumnVisible('diferencia')"
              class="sticky right-0 z-[5] px-3 py-3 text-sm font-bold text-right bg-gray-100 dark:bg-gray-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.25)]"
              :class="getDiferenciaClass(totalesDiferencia)"
            >
              {{ totalesDiferencia > 0 ? '+' : '' }}{{ formatNumberWithDecimals(totalesDiferencia, decimalPlaces) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Ref } from '@vue/reactivity'
import { onMounted, onUnmounted, nextTick } from '@vue/runtime-core'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import { formatNumberWithDecimals, formatCurrencyWithDecimals, type ColumnConfig } from '../utils/formatters'
import { getDiferenciaClass } from '../utils/styleHelpers'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { useColumnVisibilityToggle } from '../composables/useColumnVisibilityToggle'
import { PlusIcon } from '@heroicons/vue/20/solid'
import ColumnSelectorDropdown from './ColumnSelectorDropdown.vue'
import TiendaSearchCombobox from './TiendaSearchCombobox.vue'

interface Props {
  productos: Ref<ProductoRedistribucion[]>
  showTotals?: boolean
  /** Si true, las celdas de cantidad son solo lectura */
  soloLectura?: boolean
  /** Número de decimales a mostrar en cantidades (0 o 1). Por defecto 1. No aplica a la columna Precio (siempre formato moneda). */
  decimalPlaces?: number
  columnasModificadas?: Ref<Set<string>>
  /** Rol (ODCSAP/PRODUCCION_ELRAYO) de quien hizo cada modificación en columnasModificadas,
   * para pintar el resaltado heredado con el mismo color de marca que Cargar Plantilla /
   * Detalle del Pedido (púrpura ODCSAP, ámbar PRODUCCION_ELRAYO). */
  rolesModificacion?: Ref<Map<string, string | null>>
  pedido?: any
}

interface Emits {
  (e: 'actualizar-cantidad-tienda', codigoProducto: string, tiendaCodigo: string, event: Event): void
  (e: 'validar-y-corregir-cantidad', producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada, event?: Event): void
  (e: 'agregar-tienda', tienda: { codigo: string; nombre: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  showTotals: true,
  soloLectura: false,
  decimalPlaces: 1
})

const emit = defineEmits<Emits>()

// Computed para obtener productos como array (ya que viene como Ref)
const productosArray = computed(() => props.productos.value || [])

// Agregar tienda (solo pedidos hijo): botón + buscador en el header de la matriz
const esPedidoHijo = computed(() => !!props.pedido?.cabecera?.pedido_padre_id)
const mostrarBuscadorTienda = ref(false)

function onAgregarTienda(tienda: { codigo: string; nombre: string }) {
  emit('agregar-tienda', tienda)
  mostrarBuscadorTienda.value = false
}

/** Para cantidades decimales: considerar "completo" cuando la diferencia es redondeo (tolerancia 1e-6) */
function cercaDeCeroDiferencia(val: number): boolean {
  return Math.abs(val) < 1e-6
}

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
  
  productosArray.value.forEach((producto: ProductoRedistribucion) => {
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
  (newValue: Set<string> | undefined) => {
    if (newValue) {
      if (import.meta.env.DEV) console.log(`🔄 [ExcelLikeGridView] Columnas modificadas actualizadas: ${newValue.size} modificaciones`)
      // Acceder al computed para forzar su recálculo
      const _ = productosConModificaciones.value
    }
  },
  { deep: true, immediate: true }
)

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

// ⭐ Gestión de columnas visibles en la tabla (selector de columnas: abrir/cerrar, click-outside, toggle)
const columnVisibility = useColumnVisibilityToggle({
  columns: availableColumns,
  visibleColumns,
  persist: savePreferences
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

// ── Requerimiento 1.1.1: inmovilización horizontal de "#" hasta "Precio" ──
// Los offsets se MIDEN en runtime en lugar de derivarse de anchos hardcodeados.
// Motivo doble:
//   1) La versión anterior construía la clase en runtime (`left-[${n}px]`). El JIT de
//      Tailwind sólo escanea clases estáticas, así que left-[168px]/[368px]/[488px]
//      nunca se compilaban y producto/total_confirmado/costo_unitario no se pegaban.
//   2) Las columnas ahora dimensionan según su contenido (sin min-w fijo), así que
//      cualquier ancho asumido quedaría desalineado.
const FROZEN_COLUMN_KEYS = ['numero', 'codigo', 'producto', 'total_confirmado', 'costo_unitario'] as const

const scrollerRef = ref<HTMLElement | null>(null)
const headerRowRef = ref<HTMLTableRowElement | null>(null)
const stickyLeftOffsets = ref<Record<string, number>>({})

/** Estilo `left` para las celdas congeladas. undefined mientras no se haya medido. */
function stickyLeftStyle(columnKey: string): { left: string } | undefined {
  const offset = stickyLeftOffsets.value[columnKey]
  return offset === undefined ? undefined : { left: `${offset}px` }
}

/** Acumula el ancho real de cada columna congelada visible para obtener su offset izquierdo. */
function measureStickyOffsets(): void {
  const row = headerRowRef.value
  if (!row) return

  let accumulated = 0
  const offsets: Record<string, number> = {}

  for (const key of FROZEN_COLUMN_KEYS) {
    if (!isColumnVisible(key)) continue
    offsets[key] = accumulated
    const cell = row.querySelector<HTMLElement>(`[data-col="${key}"]`)
    // getBoundingClientRect en lugar de offsetWidth: conserva subpíxeles y evita
    // que el redondeo se acumule y desalinee las últimas columnas.
    if (cell) accumulated += cell.getBoundingClientRect().width
  }

  stickyLeftOffsets.value = offsets
}

let headerResizeObserver: ResizeObserver | null = null

/** (Re)observa las celdas del encabezado; se llama de nuevo si cambian las columnas visibles. */
function observeHeaderCells(): void {
  const row = headerRowRef.value
  if (!row || typeof ResizeObserver === 'undefined') return

  headerResizeObserver?.disconnect()
  headerResizeObserver = new ResizeObserver(() => measureStickyOffsets())

  for (const key of FROZEN_COLUMN_KEYS) {
    const cell = row.querySelector<HTMLElement>(`[data-col="${key}"]`)
    if (cell) headerResizeObserver.observe(cell)
  }

  measureStickyOffsets()
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

/** Busca si `columnaKey` fue modificada para `producto` (heredado del flujo anterior:
 * Cargar Plantilla / Detalle del Pedido), sin importar qué rol la modificó -- distinguir
 * ODCSAP/PRODUCCION_ELRAYO por color (púrpura/ámbar) resultó poco fiable en la práctica
 * (dependía de que columnasModificadas/rolesModificacion llegaran ya hidratados desde el
 * backend en el momento exacto del render), así que esta vista solo indica "fue
 * modificado", con un único color (cian) que no se confunde con ningún estado existente. */
function columnaFueModificada(producto: ProductoRedistribucion, columnaKey: string): boolean {
  const columnasModificadasValue = props.columnasModificadas?.value
  if (!columnasModificadasValue || !props.pedido?.detalles) return false

  const detallePedido = props.pedido.detalles.find(
    (d: any) => d.codigo_interno === producto.codigo_producto
  )
  if (!detallePedido?.pedido_detalle_id) return false

  const key = `${detallePedido.pedido_detalle_id}:${columnaKey}`
  return columnasModificadasValue.has(key)
}

/**
 * Resaltado en costo unitario (columna "Precio")
 *
 * Mapping: costo_doc_sin_iva → costo_unitario / "Precio" (Redistribución)
 */
function precioModificado(producto: ProductoRedistribucion): boolean {
  // PRIORIDAD 1: columnasModificadas (heredado del flujo anterior)
  if (columnaFueModificada(producto, 'costo_doc_sin_iva')) return true
  // PRIORIDAD 2 (fallback): flag legacy (edición previa al tracking granular, o ajuste
  // manual del comprador en la respuesta del proveedor)
  return producto.costo_modificado_manual === true
}

/**
 * Resaltado en total (columna "Total Confirmado")
 *
 * Mapping: total → total_confirmado / "Total Confirmado" (Redistribución)
 */
function totalConfirmadoModificado(producto: ProductoRedistribucion): boolean {
  // PRIORIDAD 1: columnasModificadas (heredado del flujo anterior)
  if (columnaFueModificada(producto, 'total')) return true
  // PRIORIDAD 2 (fallback): flag legacy (edición previa al tracking granular, o ajuste
  // manual del comprador en la respuesta del proveedor)
  return producto.total_modificado_manual === true
}

// ⭐ Obtener todas las tiendas/bodegas únicas de todos los productos
// El backend ahora parsea dos filas de encabezado:
// - Fila 1: nombres (ej: "Roland", "Descuentón", "Región")
// - Fila 2: códigos (ej: "RL-CD", "OUT-CD", "REG-CD")
// Esto aplica tanto para bodegas (K, L, M) como para tiendas (N+)
const tiendasUnicas = computed(() => {
  const tiendasMap = new Map<string, { codigo: string; nombre: string; agregadaManualmente: boolean }>()

  productosArray.value.forEach((producto: ProductoRedistribucion) => {
    producto.distribucion_tiendas.forEach((tienda: DistribucionTiendaEditada) => {
      const existente = tiendasMap.get(tienda.tienda_codigo)
      if (!existente) {
        // ⭐ El código viene de la fila 2 del Excel (ej: "RL-CD", "OUT-CD", "REG-CD", códigos de tiendas)
        // ⭐ El nombre viene de la fila 1 del Excel (ej: "Roland", "Descuentón", "Región", nombres de tiendas)
        const nombre = tienda.tienda_nombre || tienda.tienda_codigo
        tiendasMap.set(tienda.tienda_codigo, {
          codigo: tienda.tienda_codigo,
          nombre: nombre,
          agregadaManualmente: tienda.agregada_manualmente ?? false
        })
      } else if (tienda.agregada_manualmente) {
        // Persiste como "agregada manualmente" si CUALQUIER producto tiene ese flag
        // en esta tienda (ej. se agregó a todos los productos, pero solo se verificó uno).
        existente.agregadaManualmente = true
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

// Obtener cantidad de una tienda específica para un producto (preserva decimales, p. ej. 0.5)
function getCantidadTienda(producto: ProductoRedistribucion, tiendaCodigo: string): number {
  const tienda = producto.distribucion_tiendas.find(t => t.tienda_codigo === tiendaCodigo)
  const v = tienda?.cantidad_asignada
  if (v === null || v === undefined) return 0
  const num = Number(v)
  return Number.isNaN(num) ? 0 : num
}

// Obtener total por tienda
function getTotalTienda(tiendaCodigo: string): number {
  return productosArray.value.reduce((sum: number, producto: ProductoRedistribucion) => {
    return sum + getCantidadTienda(producto, tiendaCodigo)
  }, 0)
}

// Totales generales
const totalesConfirmado = computed(() => {
  return productosArray.value.reduce((sum: number, p: ProductoRedistribucion) => sum + p.cantidad_confirmada, 0)
})

const totalesCostoUnitario = computed(() => {
  return productosArray.value.reduce((sum: number, p: ProductoRedistribucion) => sum + (p.costo_unitario || 0), 0)
})

const totalesDistribuido = computed(() => {
  return productosArray.value.reduce((sum: number, p: ProductoRedistribucion) => sum + p.cantidad_distribuida, 0)
})

const totalesDiferencia = computed(() => {
  return totalesDistribuido.value - totalesConfirmado.value
})

// Productos con error
const productosConError = computed(() => {
  return productosArray.value.filter((p: ProductoRedistribucion) => p.error)
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
  
  // ⭐ VALIDACIÓN VISUAL: Resaltar en rojo cuando el total exceda la cantidad confirmada (tolerancia 1e-6 por redondeo float)
  const TOLERANCIA = 1e-6
  const esValido = producto.cantidad_distribuida <= producto.cantidad_confirmada + TOLERANCIA
  
  if (esValido) {
    return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 dark:focus:ring-purple-400'
  } else {
    // Resaltar en rojo para indicar que necesita corrección
    return 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 focus:ring-red-500 dark:focus:ring-red-400'
  }
}

/** Bloquea punto, coma, e, E, - y + en inputs de cantidad (solo múltiplos de 0,5; decimales con flechas). */
function bloquearTeclasNoNumerosCantidad(event: KeyboardEvent) {
  const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (allowed.includes(event.key)) return
  if (/^[0-9]$/.test(event.key)) return
  event.preventDefault()
}

// Handler para cambio de cantidad
function handleCantidadChange(producto: ProductoRedistribucion, tiendaCodigo: string, event: Event) {
  emit('actualizar-cantidad-tienda', producto.codigo_producto, tiendaCodigo, event)
}

// Handler para blur (validar y corregir)
function handleBlur(producto: ProductoRedistribucion, tiendaCodigo: string, event?: Event) {
  const tienda = producto.distribucion_tiendas.find(t => t.tienda_codigo === tiendaCodigo)
  if (tienda) {
    emit('validar-y-corregir-cantidad', producto, tienda, event)
  }
}

// Re-medir cuando cambia algo que puede alterar el ancho de las columnas congeladas.
// El ResizeObserver cubre los cambios de ancho, pero al añadir/quitar columnas hay que
// volver a observar porque los <th> se destruyen y se recrean (v-if).
watch(
  () => [visibleColumns.value.join('|'), tiendasUnicas.value.length, props.decimalPlaces],
  () => {
    nextTick(observeHeaderCells)
  }
)

onMounted(() => {
  nextTick(observeHeaderCells)

  // Las fuentes web (Inter) cambian el ancho del texto al cargar: re-medir cuando estén listas.
  if (typeof document !== 'undefined' && 'fonts' in document) {
    document.fonts.ready.then(() => measureStickyOffsets()).catch(() => { /* sin impacto: los offsets ya están medidos */ })
  }
})

onUnmounted(() => {
  headerResizeObserver?.disconnect()
  headerResizeObserver = null
})
</script>

<style scoped>
/* Estilos para el scroll horizontal suave */
.excel-grid-container {
  position: relative;
}

/* ── Requerimiento 1.1.1: scroller único y acotado en altura ──
   La posición de reposo del panel al hacer scroll de página NO depende del cromo
   por ENCIMA del scroller (header, barra de indicadores, etc.) — se cancela
   algebraicamente contra el propio alto del scroller. Solo depende de:
     K (esta constante)  −  B (cromo por DEBAJO del scroller, en esta vista)
   Objetivo: que el reposo coincida con el borde inferior de la barra de indicadores.
     borde inferior de la barra = 64 (ancla `top-16`) + 47 (alto medido, escritorio) = 111px
     B en MabelTradingRedistribucionView (con pb-6 en RedistribucionTiendas.vue y el
     padding de MainLayout.vue reducido a la mitad, p-2/md:p-3/lg:p-4):
       1 (borde .excel-grid-container) + 24 (pb-6) + 75 (barra de acciones sticky)
       + 1 (borde card) + 24 (py-6 de la vista) + 16 (lg:p-4 del <main>, antes 32 con lg:p-8) = 141
     K = 111 + 141 = 252 → se usa 256 (margen de 4px para soloLectura y subpíxel)
   Si se toca la barra de indicadores, la barra de acciones, o el padding de
   RedistribucionTiendas.vue/MabelTradingRedistribucionView.vue/MainLayout.vue, recalcular
   con esta misma fórmula (K = borde_inferior_barra_indicadores + B). Medido con Playwright
   contra el CSS compilado real tras fusionar las 3 métricas en "pills" de color: la
   altura de escritorio NO cambió (sigue en 47px, porque el pill de Diferencia ya
   marcaba el alto máximo de la fila); ver constante <768px para el caso que sí cambió. */
.grid-scroller {
  overflow: auto;
  max-height: calc(100dvh - 256px);
  min-height: 280px;
  /* alto del thead (fila con nombre de tienda en 2 líneas): evita que Tab deje
     una celda enfocada oculta debajo del encabezado congelado */
  scroll-padding-top: 72px;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

@media (max-width: 767px) {
  .grid-scroller {
    /* la barra de indicadores se parte en 2 filas por flex-wrap: 89px medidos a 420px
       (3 pills de color, no 83px de la versión sin pills) y <main> usa p-2 (8px, antes p-4=16px).
       PERO la barra de acciones (RedistribucionTiendas.vue) es un `flex justify-between` con
       texto de estado a la izquierda y botones a la derecha, SIN manejo responsive — a 420px
       probablemente envuelve a más de los 75px que asume el cálculo de escritorio (medido ~99px
       en una réplica simplificada sin el texto de estado real, así que el alto real en
       producción podría ser mayor todavía). No se pudo medir con precisión sin la app corriendo.
       Por eso esta constante prioriza seguridad (margen amplio) sobre exactitud: mejor sobrar
       espacio muerto que repetir el bug de encabezado tapado en pantallas angostas.
       target = 64 + 89 = 153 ; K conservador = 330 (en vez de los 286 "exactos" de la fórmula) */
    max-height: calc(100dvh - 330px);
  }
}

@media print {
  .grid-scroller {
    max-height: none;
    overflow: visible;
  }
  .grid-scroller thead th {
    position: static;
  }
}

.grid-scroller::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.grid-scroller::-webkit-scrollbar-track {
  background: transparent;
}

.grid-scroller::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

.grid-scroller::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* ── Requerimiento 1.1.1: sombras de los bordes congelados ──
   Tailwind preflight aplica `border-collapse: collapse`, con lo que los border-* de una
   celda sticky desaparecen al despegarse. Por eso el borde se simula con box-shadow.
   La sombra vertical va SÓLO en la última columna congelada (Precio) para no apilar
   cinco sombras, una por columna. */
.frozen-edge {
  box-shadow: 4px 0 6px -2px rgba(0, 0, 0, 0.06);
}

.dark .frozen-edge {
  box-shadow: 4px 0 6px -2px rgba(0, 0, 0, 0.2);
}

/* Sombra inferior del encabezado congelado, para separarlo de las filas al hacer scroll */
thead th.header-shadow {
  box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.1);
}

.dark thead th.header-shadow {
  box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.3);
}

/* Esquina superior izquierda: necesita las dos sombras a la vez */
thead th.frozen-edge {
  box-shadow: 4px 0 6px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.1);
}

.dark thead th.frozen-edge {
  box-shadow: 4px 0 6px -2px rgba(0, 0, 0, 0.2), 0 2px 6px -2px rgba(0, 0, 0, 0.3);
}

/* Esquina superior derecha (columna Diferencia): sombra izquierda + inferior */
thead th.frozen-edge-right {
  box-shadow: -4px 0 6px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.1);
}

.dark thead th.frozen-edge-right {
  box-shadow: -4px 0 6px -2px rgba(0, 0, 0, 0.25), 0 2px 6px -2px rgba(0, 0, 0, 0.3);
}

/* ── Separadores entre columnas congeladas (reemplazan border-r/border-l) ──
   Mismo problema que header-shadow/frozen-edge: border-collapse:collapse (preflight de
   Tailwind) hace que el border-* de una celda position:sticky no se pinte NUNCA, ni
   siquiera en reposo (confirmado muestreando píxeles reales: fondo uniforme, cero línea
   divisoria) — no solo "durante el scroll" como parecía a simple vista. Sin ese borde
   opaco tapando el límite exacto entre celdas, cualquier costura de subpíxel del
   compositor queda expuesta y se nota como una línea transparente al scrollear
   horizontalmente. El box-shadow no participa del modelo de bordes de la tabla, así que
   no lo afecta el colapso y sí queda pintado de forma estable. */
.frozen-divider {
  box-shadow: inset -1px 0 0 0 #e2e8f0; /* gray-200 (paleta remapeada en tailwind.config.js) */
}

.dark .frozen-divider {
  box-shadow: inset -1px 0 0 0 #334155; /* gray-700 */
}

/* thead: el separador convive con la sombra inferior (header-shadow) en la misma celda */
thead th.frozen-divider {
  box-shadow: inset -1px 0 0 0 #e2e8f0, 0 2px 6px -2px rgba(0, 0, 0, 0.1);
}

.dark thead th.frozen-divider {
  box-shadow: inset -1px 0 0 0 #334155, 0 2px 6px -2px rgba(0, 0, 0, 0.3);
}

/* Separador más grueso (equivalente al border-l-2 original) entre la última columna de
   tienda y "Total Distribuido"; solo existe en thead (sticky top-0), tbody/tfoot no son
   sticky ahí y su border-l-2 normal renderiza sin problema. */
thead th.frozen-divider-thick {
  box-shadow: inset 2px 0 0 0 #cbd5e1, 0 2px 6px -2px rgba(0, 0, 0, 0.1); /* gray-300 */
}

.dark thead th.frozen-divider-thick {
  box-shadow: inset 2px 0 0 0 #475569, 0 2px 6px -2px rgba(0, 0, 0, 0.3); /* gray-600 */
}

/* Acento de "modificado, heredado del flujo anterior" en celdas congeladas (Total
   Confirmado / Precio). Antes distinguía púrpura (ODCSAP) de ámbar (PRODUCCION_ELRAYO),
   pero esa distinción por rol resultó poco fiable en esta vista (dependía de que
   columnasModificadas/rolesModificacion llegaran ya hidratados desde el backend en el
   momento exacto del render) y terminaba mostrando ámbar aun cuando el último editor
   había sido ODCSAP. Se reemplaza por un único color (cian) que solo indica "modificado",
   sin intentar distinguir el rol. Antes era border-l-2 (un border-left real) además del
   border-r/frozen-edge del lado derecho — mismo bug: sobre celdas sticky con
   border-collapse:collapse, el border-left tampoco se pintaba de forma fiable (se veía
   bien en reposo y desaparecía al hacer scroll horizontal). Sustituido por box-shadow
   combinando AMBOS lados en una sola declaración, ya que box-shadow es una única
   propiedad y no se puede alternar por clase sin pisar el valor existente. */
.frozen-divider-modified {
  box-shadow: inset 2px 0 0 0 #06b6d4, inset -1px 0 0 0 #e2e8f0; /* cyan-500 izq, gray-200 der */
}

.dark .frozen-divider-modified {
  box-shadow: inset 2px 0 0 0 #22d3ee, inset -1px 0 0 0 #334155; /* cyan-400 izq, gray-700 der */
}

.frozen-edge-modified {
  box-shadow: inset 2px 0 0 0 #06b6d4, 4px 0 6px -2px rgba(0, 0, 0, 0.06);
}

.dark .frozen-edge-modified {
  box-shadow: inset 2px 0 0 0 #22d3ee, 4px 0 6px -2px rgba(0, 0, 0, 0.2);
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
