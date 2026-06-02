<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useReposicionStore } from '../stores/reposicionStore'
import { storeToRefs } from 'pinia'
import { 
  FunnelIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import reposicionApi from '../services/reposicionApi'
import type { CatalogoItemDetail } from '../types'

const store = useReposicionStore()
const { 
  catalogo, 
  loading, 
  filters, 
  listasFiltros, 
  almacenes, 
  totalItems,
  currentPage,
  isOpen
} = storeToRefs(store)

const showFilters = ref(false)
const selectedItem = ref<CatalogoItemDetail | null>(null)
const isDetailOpen = ref(false)
const loadingDetail = ref(false)

onMounted(async () => {
  await store.initialize()
})

const handleSearch = () => {
  store.fetchCatalogo(true)
}

const handleClearFilters = () => {
  store.setFilters({
    descripcion: '',
    itemCode: '',
    codeBars: '',
    marca: '',
    unidad: '',
    categoria: '',
    linea: ''
  })
}

const openDetail = async (itemCode: string) => {
  if (!filters.value.whsCode) return
  loadingDetail.value = true
  isDetailOpen.value = true
  try {
    selectedItem.value = await reposicionApi.getItemDetalle(itemCode, filters.value.whsCode)
  } catch (err) {
    console.error('Error al cargar detalle', err)
    isDetailOpen.value = false
  } finally {
    loadingDetail.value = false
  }
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Sin datos'
  return dateStr.split('T')[0]
}

const diasDesdeUltimaVenta = computed(() => {
  if (!selectedItem.value?.fechaUltimaVenta) return 0
  const fecha = new Date(selectedItem.value.fechaUltimaVenta)
  const hoy = new Date()
  return Math.abs(Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)))
})

const updateQuantity = async (item: any, quantity: number) => {
  try {
    if (quantity > 0 && item.embalaje > 0 && quantity % item.embalaje !== 0) {
      const suggested = Math.ceil(quantity / item.embalaje) * item.embalaje
      if (confirm(`La cantidad debe ser múltiplo de ${item.embalaje}. ¿Desea ajustar a ${suggested}?`)) {
        quantity = suggested
      } else {
        return
      }
    }
    if (quantity > item.disponibleBodega) {
      alert(`No hay suficiente stock en bodega. Disponible: ${item.disponibleBodega}`)
      return
    }
    if (quantity > item.sugerido && item.sugerido > 0) {
      if (!confirm(`La cantidad es mayor al sugerido (${item.sugerido}). ¿Desea continuar?`)) {
        return
      }
    }
    await store.updateItemQuantity(item.itemCode, quantity)
  } catch (err) {
    alert('Error al actualizar cantidad')
  }
}

const getQuantityColor = (item: any) => {
  const qty = store.cantidadPorCodigo(item.itemCode)
  if (qty === 0) return 'text-gray-400'
  if (qty > item.disponibleBodega) return 'text-red-600 font-bold'
  if (qty > item.sugerido && item.sugerido > 0) return 'text-yellow-600 font-bold'
  return 'text-green-600 font-bold'
}

</script>

<template>
  <div class="p-6 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Reposición de Artículos</h1>
        <p class="text-gray-500 mt-1">Gestiona el reabastecimiento de tu tienda de forma eficiente.</p>
      </div>

      <div class="flex items-center gap-3">
        <div v-if="!isOpen" class="bg-red-100 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-red-200 shadow-sm">
          <InformationCircleIcon class="w-5 h-5" />
          <span class="text-sm font-medium">Fuera de horario</span>
        </div>
        
        <select 
          v-model="filters.whsCode" 
          @change="store.fetchDataByWarehouse()"
          class="block w-full rounded-xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11 px-4 border"
        >
          <option value="" disabled>Seleccione una bodega...</option>
          <option v-for="alm in almacenes" :key="alm.whsCode" :value="alm.whsCode">
            {{ alm.whsCode }} - {{ alm.whsName }}
          </option>
        </select>

        <button 
          @click="showFilters = !showFilters"
          :class="[showFilters ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-gray-200', 'flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-all hover:shadow-md']"
        >
          <FunnelIcon class="w-5 h-5" />
          <span class="font-medium">Filtros</span>
        </button>

        <router-link 
          to="/reposiciones/historial"
          class="bg-white text-gray-700 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md"
        >
          <ClockIcon class="w-5 h-5 text-gray-500" />
          <span class="font-medium">Historial</span>
        </router-link>

        <router-link 
          to="/reposiciones/carrito"
          class="bg-indigo-600 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl border shadow-sm hover:bg-indigo-700 transition-all hover:shadow-lg relative"
        >
          <ShoppingCartIcon class="w-5 h-5" />
          <span class="font-medium">Carrito</span>
          <span v-if="store.totalSolicitado > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
            {{ store.carrito.length }}
          </span>
        </router-link>
      </div>
    </div>

    <!-- Filters Panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="showFilters" class="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-5">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Descripción / ItemCode</label>
          <div class="relative">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              v-model="filters.descripcion" 
              type="text" 
              placeholder="Buscar por nombre..." 
              class="w-full pl-9 pr-4 py-2.5 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 border transition-all text-sm"
              @keydown.enter="handleSearch"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Marca</label>
          <select v-model="filters.marca" class="w-full py-2.5 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 border text-sm">
            <option value="">Todas</option>
            <option v-for="m in listasFiltros.marcas" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Línea</label>
          <select v-model="filters.linea" class="w-full py-2.5 rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 border text-sm">
            <option value="">Todas</option>
            <option v-for="l in listasFiltros.lineas" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>

        <div class="flex items-end gap-3">
          <button @click="handleSearch" class="flex-1 bg-gray-900 text-white h-11 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm">
            Aplicar
          </button>
          <button @click="handleClearFilters" class="px-3 h-11 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowPathIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Content Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse table-fixed min-w-[1400px]">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-100">
              <th class="px-4 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[280px]">Artículo</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[80px]">Embalaje</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[90px]">Stock Tienda</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[80px]">Tránsito</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[90px]">Comprometido</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[90px]">Total Disponible</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[90px]">Disponible Bodega</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[90px]">Total Venta 30 días</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[80px]">Sugerido</th>
              <th class="px-2 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center w-[90px]">Días de Inv.</th>
              <th class="px-4 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[120px]">Solicitado</th>
              <th class="px-4 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Observación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!filters.whsCode">
              <td colspan="12" class="px-6 py-20 text-center text-gray-400">
                <div class="flex flex-col items-center">
                  <BuildingOfficeIcon class="w-12 h-12 mb-4 opacity-20" />
                  <p class="text-lg font-medium">Por favor, selecciona una bodega para ver el catálogo.</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-48"></div></td>
              <td colspan="11" class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-full"></div></td>
            </tr>
            <tr v-else-if="catalogo.length === 0">
              <td colspan="12" class="px-6 py-12 text-center text-gray-400">
                <MagnifyingGlassIcon class="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No se encontraron artículos con los filtros aplicados.</p>
              </td>
            </tr>
            <tr v-for="item in catalogo" :key="item.itemCode" class="hover:bg-gray-50/50 transition-colors group">
              <td class="px-4 py-3">
                <div class="flex flex-col">
                  <button 
                    @click="openDetail(item.itemCode)"
                    class="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-left truncate hover:underline"
                  >
                    {{ item.itemName }}
                  </button>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ item.itemCode }}</span>
                    <span class="text-[10px] text-gray-400 font-medium">{{ item.codeBars }}</span>
                  </div>
                </div>
              </td>
              <td class="px-2 py-3 text-center text-sm font-medium text-gray-600">{{ item.embalaje }}</td>
              <td class="px-2 py-3 text-center text-sm font-bold text-gray-700">{{ item.onHand }}</td>
              <td class="px-2 py-3 text-center text-sm text-blue-600 font-medium">{{ item.totalTransitoria }}</td>
              <td class="px-2 py-3 text-center text-sm text-orange-600 font-medium">{{ item.totalSolicitud }}</td>
              <td class="px-2 py-3 text-center text-sm text-emerald-600 font-bold border-x border-gray-50 bg-gray-50/30">{{ item.totalDisponibleTienda }}</td>
              <td class="px-2 py-3 text-center">
                <span :class="[item.disponibleBodega > 0 ? 'text-blue-600 font-semibold' : 'text-red-400', 'text-sm']">
                  {{ item.disponibleBodega }}
                </span>
              </td>
              <td class="px-2 py-3 text-center text-sm font-medium text-gray-600">{{ item.venta30Dias }}</td>
              <td class="px-2 py-3 text-center">
                <span :class="[item.sugerido > 0 ? 'text-indigo-600 font-bold' : 'text-gray-400', 'text-sm']">
                  {{ item.sugerido }}
                </span>
              </td>
              <td class="px-2 py-3 text-center font-mono text-sm" :class="item.diasInventario < 5 ? 'text-red-500 font-bold' : 'text-gray-500'">
                {{ item.diasInventario.toFixed(1) }}
              </td>
              <td class="px-4 py-3">
                <input 
                  type="number"
                  :value="store.cantidadPorCodigo(item.itemCode)"
                  @blur="e => updateQuantity(item, parseInt((e.target as HTMLInputElement).value || '0'))"
                  class="w-full h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 border text-center text-sm font-bold"
                  :class="getQuantityColor(item)"
                  min="0"
                />
              </td>
              <td class="px-4 py-3">
                <input 
                  type="text"
                  :value="store.comentarioPorCodigo(item.itemCode)"
                  @blur="e => store.updateItemComment(item.itemCode, (e.target as HTMLInputElement).value)"
                  placeholder="..."
                  class="w-full h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 border text-xs px-2"
                  maxlength="50"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalItems > 0" class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Mostrando <span class="font-semibold">{{ catalogo.length }}</span> de <span class="font-semibold">{{ totalItems }}</span> artículos
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="store.setPage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
          >
            Anterior
          </button>
          <span class="text-sm font-medium px-4">Página {{ currentPage }}</span>
          <button 
            @click="store.setPage(currentPage + 1)" 
            class="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-all shadow-sm"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Product Detail Modal -->
    <TransitionRoot appear :show="isDetailOpen" as="template">
      <Dialog as="div" @close="isDetailOpen = false" class="relative z-50">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                <div v-if="loadingDetail" class="flex flex-col items-center py-12">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                  <p class="text-gray-500 font-medium">Cargando detalles...</p>
                </div>
                
                <div v-else-if="selectedItem">
                  <div class="flex justify-between items-start mb-6">
                    <div>
                      <DialogTitle as="h3" class="text-2xl font-bold text-gray-900 pr-8 leading-tight">
                        {{ selectedItem.itemName }}
                      </DialogTitle>
                      <div class="flex gap-2 mt-2">
                        <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">Marca: {{ selectedItem.marca }}</span>
                      </div>
                    </div>
                    <button @click="isDetailOpen = false" class="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                      <XMarkIcon class="w-6 h-6" />
                    </button>
                  </div>

                  <!-- DETALLE PRODUCTO -->
                  <div class="bg-gray-50 rounded-xl p-5 mb-4 border border-gray-100">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Detalle Producto</h4>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div class="flex justify-between border-b border-gray-200/60 pb-1.5">
                        <span class="text-gray-500">Referencia (ItemCode)</span>
                        <span class="font-bold text-indigo-700">{{ selectedItem.itemCode }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 pb-1.5">
                        <span class="text-gray-500">Código de Barras</span>
                        <span class="font-semibold text-gray-900">{{ selectedItem.codeBars }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 pb-1.5">
                        <span class="text-gray-500">Clasificación ABC</span>
                        <span class="font-bold text-amber-700">{{ selectedItem.clasificacionABC }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 pb-1.5">
                        <span class="text-gray-500">Unidad</span>
                        <span class="font-semibold text-gray-900">{{ selectedItem.unidad }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 pb-1.5">
                        <span class="text-gray-500">Categoría</span>
                        <span class="font-semibold text-gray-900">{{ selectedItem.categoria }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 pb-1.5">
                        <span class="text-gray-500">Línea</span>
                        <span class="font-semibold text-gray-900">{{ selectedItem.linea }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- VENTAS -->
                  <div class="bg-blue-50/50 rounded-xl p-5 mb-4 border border-blue-100/60">
                    <h4 class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Ventas</h4>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div class="flex justify-between border-b border-blue-200/40 pb-1.5">
                        <span class="text-gray-500">Venta 30 días</span>
                        <span class="font-bold text-gray-900">{{ selectedItem.venta30Dias }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 pb-1.5">
                        <span class="text-gray-500">Venta 90 días</span>
                        <span class="font-semibold text-gray-900">{{ selectedItem.venta90Dias }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 pb-1.5">
                        <span class="text-gray-500">Prom. Venta 30 días</span>
                        <span class="font-semibold text-gray-900">{{ selectedItem.promedioVenta30Dias?.toFixed(2) ?? '0.00' }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 pb-1.5">
                        <span class="text-gray-500">Prom. Últ. 3 meses</span>
                        <span class="font-semibold text-gray-900">{{ selectedItem.promedioVenta90Dias?.toFixed(2) ?? '0.00' }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 pb-1.5">
                        <span class="text-gray-500">Última Fecha Venta</span>
                        <span class="font-semibold text-gray-900">{{ formatDate(selectedItem.fechaUltimaVenta) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 pb-1.5">
                        <span class="text-gray-500">Días desde Últ. Venta</span>
                        <span class="font-bold text-orange-600">{{ diasDesdeUltimaVenta }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 pb-1.5">
                        <span class="text-gray-500">Últ. Fecha Ingreso</span>
                        <span class="font-semibold text-gray-900">{{ formatDate(selectedItem.ultimaFechaIngreso) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 pb-1.5">
                        <span class="text-gray-500">Días Últ. Fecha Ingreso</span>
                        <span class="font-semibold text-gray-900">{{ selectedItem.diasUltimaFechaIngreso ?? 0 }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- STOCK Y REP. -->
                  <div class="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100/60">
                    <h4 class="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">Stock y Reposición</h4>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Stock Actual (Tienda)</span>
                        <span class="font-bold text-gray-900">{{ Math.round(selectedItem.onHand) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Stock Bodega</span>
                        <span class="font-bold text-blue-600">{{ Math.round(selectedItem.totalBodega) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Stock Mínimo</span>
                        <span class="font-semibold text-red-600">{{ Math.round(selectedItem.minStock) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Stock Máximo</span>
                        <span class="font-semibold text-indigo-600">{{ Math.round(selectedItem.maxStock) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Lead Time (Días)</span>
                        <span class="font-bold text-gray-900">{{ selectedItem.uLead }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Stock de Seguridad</span>
                        <span class="font-bold text-gray-900">{{ selectedItem.uStkSeg }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Perfil Reposición</span>
                        <span class="font-bold text-gray-900">{{ selectedItem.uPerRep }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Días de Inv.</span>
                        <span class="font-bold text-orange-600">{{ selectedItem.diasInventario.toFixed(1) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Tránsito Bodega</span>
                        <span class="font-bold text-blue-500">{{ Math.round(selectedItem.totalTransitoriaBodega) }}</span>
                      </div>
                       <div class="flex justify-between border-b border-emerald-200/40 pb-1.5">
                        <span class="text-gray-500">Total Disp. Tienda</span>
                        <span class="font-bold text-emerald-700">{{ Math.round(selectedItem.totalDisponibleTienda) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<style scoped>
/* Eliminar flechas de input number */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>
