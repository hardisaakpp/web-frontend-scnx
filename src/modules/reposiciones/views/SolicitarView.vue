<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useReposicionStore } from '../stores/reposicionStore'
import { storeToRefs } from 'pinia'
import { 
  FunnelIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  InformationCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/vue/24/outline'

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

const updateQuantity = async (item: any, quantity: number) => {
  try {
    // Validar embalaje
    if (quantity > 0 && item.embalaje > 0 && quantity % item.embalaje !== 0) {
      const suggested = Math.ceil(quantity / item.embalaje) * item.embalaje
      if (confirm(`La cantidad debe ser múltiplo de ${item.embalaje}. ¿Desea ajustar a ${suggested}?`)) {
        quantity = suggested
      } else {
        return
      }
    }

    // Validar stock bodega
    if (quantity > item.disponibleBodega) {
      alert(`No hay suficiente stock en bodega. Disponible: ${item.disponibleBodega}`)
      return
    }

    // Validar sugerido
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
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Reposición de Artículos</h1>
        <p class="text-gray-500 mt-1">Gestiona el reabastecimiento de tu tienda de forma eficiente.</p>
        
        <!-- DEBUG SECTION -->
        <div class="mt-4 p-4 bg-gray-900 rounded-xl text-xs font-mono text-green-400 border border-gray-700 shadow-2xl">
          <p class="mb-2 font-bold text-white border-b border-gray-700 pb-1 flex justify-between">
            <span>DEBUG CONSOLE</span>
            <button @click="store.fetchAlmacenes()" class="text-indigo-400 hover:text-white underline">Reintentar Carga</button>
          </p>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <p>Loading: <span :class="loading ? 'text-yellow-400' : 'text-green-400'">{{ loading }}</span></p>
            <p>Target: <span class="text-blue-400">/reposicion-api</span></p>
          </div>
          <p>WhsCode: "{{ filters.whsCode }}"</p>
          <p>Almacenes count: {{ almacenes.length }}</p>
          <pre class="mt-2 text-[10px] overflow-auto max-h-32 p-2 bg-black/50 rounded border border-gray-800">{{ JSON.stringify(almacenes, null, 2) }}</pre>
        </div>
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
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-100">
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Artículo</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Inv. Tienda</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Sugerido</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Disp. Bodega</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Días Inv.</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Solicitado</th>
              <th class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Obervación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!filters.whsCode">
              <td colspan="7" class="px-6 py-20 text-center text-gray-400">
                <div class="flex flex-col items-center">
                  <BuildingOfficeIcon class="w-12 h-12 mb-4 opacity-20" />
                  <p class="text-lg font-medium">Por favor, selecciona una bodega para ver el catálogo.</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-48"></div></td>
              <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-12 mx-auto"></div></td>
              <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-12 mx-auto"></div></td>
              <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-12 mx-auto"></div></td>
              <td class="px-6 py-4"><div class="h-4 bg-gray-100 rounded w-12 mx-auto"></div></td>
              <td class="px-6 py-4"><div class="h-8 bg-gray-100 rounded w-20"></div></td>
              <td class="px-6 py-4"><div class="h-8 bg-gray-100 rounded w-32"></div></td>
            </tr>
            <tr v-else-if="catalogo.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-400">
                <MagnifyingGlassIcon class="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No se encontraron artículos con los filtros aplicados.</p>
              </td>
            </tr>
            <tr v-for="item in catalogo" :key="item.itemCode" class="hover:bg-gray-50/50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{{ item.itemName }}</span>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ item.itemCode }}</span>
                    <span class="text-xs text-gray-400 font-medium">{{ item.codeBars }}</span>
                    <span class="text-[10px] text-indigo-500 font-bold ml-1">{{ item.marca }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex flex-col items-center">
                  <span class="text-sm font-medium text-gray-700">{{ item.onHand }}</span>
                  <span class="text-[10px] text-gray-400">Stock actual</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="[item.sugerido > 0 ? 'text-indigo-600 font-bold' : 'text-gray-400', 'text-sm']">
                  {{ item.sugerido }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="[item.disponibleBodega > 0 ? 'text-blue-600 font-semibold' : 'text-red-400', 'text-sm']">
                  {{ item.disponibleBodega }}
                </span>
              </td>
              <td class="px-6 py-4 text-center font-mono text-sm">
                {{ item.diasInventario.toFixed(1) }}
              </td>
              <td class="px-6 py-4">
                <input 
                  type="number"
                  :value="store.cantidadPorCodigo(item.itemCode)"
                  @blur="e => updateQuantity(item, parseInt((e.target as HTMLInputElement).value || '0'))"
                  class="w-24 h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 border text-center text-sm font-medium"
                  :class="getQuantityColor(item)"
                  min="0"
                />
              </td>
              <td class="px-6 py-4">
                <input 
                  type="text"
                  :value="store.comentarioPorCodigo(item.itemCode)"
                  @blur="e => store.updateItemComment(item.itemCode, (e.target as HTMLInputElement).value)"
                  placeholder="Observación..."
                  class="w-full h-9 rounded-lg border-gray-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 border text-sm px-3"
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
