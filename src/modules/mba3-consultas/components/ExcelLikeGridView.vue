<template>
  <div class="excel-grid-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <!-- Contenedor con scroll horizontal -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Header fijo -->
        <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-[4]">
          <tr>
            <!-- Columnas fijas -->
            <th class="sticky left-0 z-[4] bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
              Código
            </th>
            <th class="sticky left-[120px] z-[4] bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[200px]">
              Producto
            </th>
            <th class="sticky left-[320px] z-[4] bg-gray-50 dark:bg-gray-900 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[120px]">
              Total Confirmado
            </th>
            <th class="sticky left-[440px] z-[4] bg-gray-50 dark:bg-gray-900 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[120px]">
              Costo Unit.
            </th>
            
            <!-- Columnas de tiendas (dinámicas) -->
            <th
              v-for="tienda in tiendasUnicas"
              :key="tienda.codigo"
              class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] bg-gray-50 dark:bg-gray-900"
              :title="tienda.nombre"
            >
              <div class="flex flex-col">
                <span class="font-semibold">{{ tienda.codigo }}</span>
                <span class="text-xs font-normal text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[100px]" :title="tienda.nombre">
                  {{ tienda.nombre }}
                </span>
              </div>
            </th>
            
            <!-- Columnas calculadas -->
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 min-w-[120px] border-l-2 border-gray-300 dark:border-gray-600">
              Total Distribuido
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 min-w-[120px]">
              Diferencia
            </th>
          </tr>
        </thead>
        
        <!-- Body -->
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="producto in productosArray"
            :key="producto.codigo_producto"
            :class="[
              'transition-colors',
              producto.error ? 'bg-gray-100 dark:bg-gray-700/30' :
              tieneModificaciones(producto) ? 'bg-amber-100 dark:bg-amber-900/60 row-modified-amber' :
              producto.diferencia === 0 ? 'bg-green-50 dark:bg-gray-700/30' :
              producto.diferencia < 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' :
              'bg-red-50 dark:bg-red-900/10'
            ]"
          >
            <!-- Columnas fijas - fondo completamente opaco -->
            <td 
              class="sticky left-0 z-[4] px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-gray-700 fixed-column-bg"
              :class="producto.error ? 'fixed-bg-error' : tieneModificaciones(producto) ? 'fixed-bg-amber' : producto.diferencia === 0 ? 'fixed-bg-green' : producto.diferencia < 0 ? 'fixed-bg-yellow' : 'fixed-bg-red'"
            >
              {{ producto.codigo_producto }}
            </td>
            <td 
              class="sticky left-[120px] z-[4] px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 fixed-column-bg"
              :class="producto.error ? 'fixed-bg-error' : tieneModificaciones(producto) ? 'fixed-bg-amber' : producto.diferencia === 0 ? 'fixed-bg-green' : producto.diferencia < 0 ? 'fixed-bg-yellow' : 'fixed-bg-red'"
            >
              <div class="max-w-[200px] truncate" :title="producto.descripcion">
                {{ producto.descripcion }}
              </div>
            </td>
            <td 
              class="sticky left-[320px] z-[4] px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 text-right whitespace-nowrap border-r border-gray-200 dark:border-gray-700 fixed-column-bg"
              :class="producto.error ? 'fixed-bg-error' : tieneModificaciones(producto) ? 'fixed-bg-amber' : producto.diferencia === 0 ? 'fixed-bg-green' : producto.diferencia < 0 ? 'fixed-bg-yellow' : 'fixed-bg-red'"
            >
              {{ formatNumber(producto.cantidad_confirmada) }}
            </td>
            <td 
              class="sticky left-[440px] z-[4] px-4 py-3 text-sm font-medium text-right whitespace-nowrap border-r border-gray-200 dark:border-gray-700 fixed-column-bg"
              :class="[
                producto.error 
                  ? 'fixed-bg-error'
                  : tieneModificaciones(producto) 
                  ? 'fixed-bg-amber'
                  : tieneCostoModificado(producto) 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500 dark:border-amber-400 text-amber-900 dark:text-amber-200 font-semibold costo-modificado'
                  : producto.diferencia === 0 ? 'fixed-bg-green' : producto.diferencia < 0 ? 'fixed-bg-yellow' : 'fixed-bg-red',
                !producto.error && !tieneModificaciones(producto) && !tieneCostoModificado(producto) ? 'text-gray-900 dark:text-white' : ''
              ]"
            >
              {{ producto.costo_unitario ? formatCurrency(producto.costo_unitario) : '-' }}
            </td>
            
            <!-- Celdas de tiendas (editables) -->
            <td
              v-for="tienda in tiendasUnicas"
              :key="`${producto.codigo_producto}-${tienda.codigo}`"
              class="px-4 py-2 text-right"
            >
              <input
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
            </td>
            
            <!-- Columnas calculadas -->
            <td class="px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400 text-right whitespace-nowrap bg-gray-50 dark:bg-gray-900/50 border-l-2 border-gray-300 dark:border-gray-600">
              {{ formatNumber(producto.cantidad_distribuida) }}
            </td>
            <td class="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap bg-gray-50 dark:bg-gray-900/50" :class="getDiferenciaClass(producto.diferencia)">
              {{ producto.diferencia > 0 ? '+' : '' }}{{ formatNumber(producto.diferencia) }}
            </td>
          </tr>
        </tbody>
        
        <!-- Footer con totales (opcional) -->
        <tfoot v-if="showTotals" class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 sticky bottom-0 z-[4]">
          <tr>
            <td class="sticky left-0 z-[4] bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
              TOTALES
            </td>
            <td class="sticky left-[120px] z-[4] bg-gray-100 dark:bg-gray-900 px-4 py-3 border-r border-gray-200 dark:border-gray-700"></td>
            <td class="sticky left-[320px] z-[4] bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 text-right border-r border-gray-200 dark:border-gray-700">
              {{ formatNumber(totalesConfirmado) }}
            </td>
            <td class="sticky left-[440px] z-[4] bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right border-r border-gray-200 dark:border-gray-700">
              {{ formatCurrency(totalesCostoUnitario) }}
            </td>
            <td
              v-for="tienda in tiendasUnicas"
              :key="`total-${tienda.codigo}`"
              class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right"
            >
              {{ formatNumber(getTotalTienda(tienda.codigo)) }}
            </td>
            <td class="px-4 py-3 text-sm font-bold text-purple-600 dark:text-purple-400 text-right border-l-2 border-gray-300 dark:border-gray-600">
              {{ formatNumber(totalesDistribuido) }}
            </td>
            <td class="px-4 py-3 text-sm font-bold text-right" :class="getDiferenciaClass(totalesDiferencia)">
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
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import { formatNumber, formatCurrency } from '../utils/formatters'
import { getDiferenciaClass } from '../utils/styleHelpers'

interface Props {
  productos: Ref<ProductoRedistribucion[]>
  showTotals?: boolean
  columnasModificadas?: Ref<Set<string>>
  pedido?: any
}

interface Emits {
  (e: 'actualizar-cantidad-tienda', codigoProducto: string, tiendaCodigo: string, event: Event): void
  (e: 'validar-y-corregir-cantidad', producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada): void
}

const props = withDefaults(defineProps<Props>(), {
  showTotals: true
})

const emit = defineEmits<Emits>()

// Computed para obtener productos como array (ya que viene como Ref)
const productosArray = computed(() => props.productos.value || [])

/**
 * Verifica si un producto tiene modificaciones en COSTO UNIT o TOTAL (columnas modificadas por EL RAYO)
 * Solo se resaltan las filas cuando hay modificaciones en estas columnas específicas
 * 
 * Prioridad:
 * 1. Usar campos del backend (costo_modificado_manual, total_modificado_manual) si están disponibles
 * 2. Fallback a columnasModificadas si los campos del backend no están disponibles
 */
function tieneModificaciones(producto: ProductoRedistribucion): boolean {
  // ⭐ PRIORIDAD 1: Usar campos del backend si están disponibles
  if (producto.costo_modificado_manual === true || producto.total_modificado_manual === true) {
    return true
  }
  
  // ⭐ PRIORIDAD 2: Fallback a columnasModificadas (compatibilidad con sistema anterior)
  if (!props.columnasModificadas?.value || !props.pedido?.detalles) return false
  
  // Buscar el detalle del pedido que corresponde a este producto
  const detallePedido = props.pedido.detalles.find(
    d => d.codigo_interno === producto.codigo_producto
  )
  
  if (!detallePedido?.pedido_detalle_id) return false
  
  // ⭐ Solo verificar columnas COSTO UNIT y TOTAL (no comentario)
  // Estas son las columnas que se resaltan en color ámbar en la interfaz de EL RAYO
  const columnasParaResaltar = ['costo_doc_sin_iva', 'total']
  
  // Verificar si hay una modificación en cualquiera de estas columnas
  return columnasParaResaltar.some(columnaKey => {
    const key = `${detallePedido.pedido_detalle_id}:${columnaKey}`
    return props.columnasModificadas!.value.has(key)
  })
}

/**
 * Verifica si un producto tiene modificaciones en costo unitario
 * 
 * Prioridad:
 * 1. Usar campo del backend (costo_modificado_manual) si está disponible
 * 2. Fallback a columnasModificadas si el campo del backend no está disponible
 */
function tieneCostoModificado(producto: ProductoRedistribucion): boolean {
  // ⭐ PRIORIDAD 1: Usar campo del backend si está disponible
  if (producto.costo_modificado_manual === true) {
    return true
  }
  
  // ⭐ PRIORIDAD 2: Fallback a columnasModificadas (compatibilidad con sistema anterior)
  if (!props.columnasModificadas?.value || !props.pedido?.detalles) return false
  
  // Buscar el detalle del pedido que corresponde a este producto
  const detallePedido = props.pedido.detalles.find(
    d => d.codigo_interno === producto.codigo_producto
  )
  
  if (!detallePedido?.pedido_detalle_id) return false
  
  // Verificar si hay una modificación para costo_doc_sin_iva
  const key = `${detallePedido.pedido_detalle_id}:costo_doc_sin_iva`
  return props.columnasModificadas.value.has(key)
}

// Obtener todas las tiendas únicas de todos los productos
const tiendasUnicas = computed(() => {
  const tiendasMap = new Map<string, { codigo: string; nombre: string }>()
  
  productosArray.value.forEach(producto => {
    producto.distribucion_tiendas.forEach(tienda => {
      if (!tiendasMap.has(tienda.tienda_codigo)) {
        tiendasMap.set(tienda.tienda_codigo, {
          codigo: tienda.tienda_codigo,
          nombre: tienda.tienda_nombre
        })
      }
    })
  })
  
  // Ordenar por código de tienda
  return Array.from(tiendasMap.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))
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
  
  // Validación básica: no puede ser negativo y la suma no debe exceder cantidad_confirmada
  const esValido = tienda.cantidad_asignada >= 0 && producto.cantidad_distribuida <= producto.cantidad_confirmada
  
  if (esValido) {
    return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 dark:focus:ring-purple-400'
  } else {
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
  background-color: rgb(55 65 81) !important; /* gray-700 completamente opaco - filas completas en modo oscuro */
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
