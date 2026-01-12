<template>
  <div class="excel-grid-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <!-- Contenedor con scroll horizontal -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Header fijo -->
        <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-20">
          <tr>
            <!-- Columnas fijas -->
            <th class="sticky left-0 z-30 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
              Código
            </th>
            <th class="sticky left-[120px] z-30 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[200px]">
              Producto
            </th>
            <th class="sticky left-[320px] z-30 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 min-w-[120px]">
              Total Confirmado
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
              producto.diferencia === 0 ? 'bg-green-50 dark:bg-green-900/10' :
              producto.diferencia < 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' :
              'bg-red-50 dark:bg-red-900/10'
            ]"
          >
            <!-- Columnas fijas -->
            <td class="sticky left-0 z-10 bg-inherit px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              {{ producto.codigo_producto }}
            </td>
            <td class="sticky left-[120px] z-10 bg-inherit px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
              <div class="max-w-[200px] truncate" :title="producto.descripcion">
                {{ producto.descripcion }}
              </div>
            </td>
            <td class="sticky left-[320px] z-10 bg-inherit px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 text-right whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
              {{ formatNumber(producto.cantidad_confirmada) }}
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
        <tfoot v-if="showTotals" class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 sticky bottom-0">
          <tr>
            <td class="sticky left-0 z-10 bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
              TOTALES
            </td>
            <td class="sticky left-[120px] z-10 bg-gray-100 dark:bg-gray-900 px-4 py-3 border-r border-gray-200 dark:border-gray-700"></td>
            <td class="sticky left-[320px] z-10 bg-gray-100 dark:bg-gray-900 px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 text-right border-r border-gray-200 dark:border-gray-700">
              {{ formatNumber(totalesConfirmado) }}
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
import { formatNumber } from '../utils/formatters'
import { getDiferenciaClass } from '../utils/styleHelpers'

interface Props {
  productos: Ref<ProductoRedistribucion[]>
  showTotals?: boolean
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

/* Asegurar que las columnas fijas tengan el fondo correcto en hover */
tbody tr:hover td.sticky {
  background-color: inherit;
}
</style>
