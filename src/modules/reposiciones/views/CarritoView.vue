<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { APP_LOCALE } from '@/plugins/locale'
import { useReposicionStore } from '../stores/reposicionStore'
import { storeToRefs } from 'pinia'
import { 
  ArrowLeftIcon, 
  CheckCircleIcon,
  ShoppingCartIcon,
  DocumentArrowDownIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import reposicionApi from '../services/reposicionApi'

const store = useReposicionStore()
const { carrito, filters, carritoInfo, isOpen, startHour, endHour } = storeToRefs(store)

const currentWarehouseName = computed(() => store.etiquetaAlmacen(filters.value.whsCode))

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

onMounted(async () => {
  await store.fetchCarrito()
})

const downloadPdf = () => {
  if (!filters.value.whsCode) return
  const url = reposicionApi.getCarritoPdfUrl(filters.value.whsCode)
  window.open(url, '_blank')
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div class="flex items-center gap-4">
        <router-link to="/reposiciones/catalogo" class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all bg-white dark:bg-gray-900 shadow-sm">
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Tu Carrito de Reposición</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Revisa y ajusta los artículos para <strong class="text-blue-600 dark:text-blue-400 font-bold uppercase">{{ currentWarehouseName }}</strong>.</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button 
          @click="downloadPdf"
          :disabled="carrito.length === 0"
          class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 text-sm font-medium"
        >
          <DocumentArrowDownIcon class="w-4 h-4 text-gray-500" />
          <span>Generar PDF</span>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="carrito.length === 0" class="bg-white dark:bg-gray-800 rounded-xl p-16 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="bg-gray-50 dark:bg-gray-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-gray-800">
        <ShoppingCartIcon class="w-10 h-10 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Tu carrito está vacío</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Aún no has agregado ningún artículo a la solicitud para este almacén.</p>
      <router-link to="/reposiciones/catalogo" class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm text-sm">
        Volver al catálogo
      </router-link>
    </div>

    <!-- Cart Content -->
    <div v-else>
      <!-- Info Header -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <BuildingOfficeIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origen</p>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ store.etiquetaAlmacen(carritoInfo.fromWhs) || '---' }}</p>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div class="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <CheckCircleIcon class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destino</p>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ store.etiquetaAlmacen(carritoInfo.toWhs) || '---' }}</p>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <CalendarIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha Generación</p>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatDate(carritoInfo.fecha) || '---' }}</p>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <div class="p-2 rounded-lg" :class="isOpen ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'">
            <InformationCircleIcon class="w-6 h-6" :class="isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'" />
          </div>
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="w-2 h-2 rounded-full" :class="isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"></span>
              <span class="text-sm font-bold" :class="isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'">
                {{ isOpen ? 'Abierto' : `Cerrado (${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00)` }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Table Container -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
        <table class="w-full text-left border-collapse table-auto min-w-full">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th class="sticky top-0 z-20 px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Artículo</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Emb.</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Stock</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Tránsito</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Comp.</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Solicitado</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Disp. Tienda</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Disp. Bodega</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Venta 30d</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Sugerido</th>
              <th class="sticky top-0 z-20 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Días Inv.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in carrito" :key="item.itemCode" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
              <td class="px-4 py-3">
                <div class="flex flex-col">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {{ item.itemName }}
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{{ item.itemCode }}</span>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{{ item.codeBars }}</span>
                  </div>
                </div>
              </td>
              <td class="px-2 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">{{ item.embalaje }}</td>
              <td class="px-2 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">{{ item.onHand }}</td>
              <td class="px-2 py-3 text-center text-sm text-blue-600 dark:text-blue-400 font-medium">{{ item.totalTransitoria }}</td>
              <td class="px-2 py-3 text-center text-sm text-orange-600 dark:text-orange-400 font-medium">{{ item.totalSolicitud }}</td>
              <td class="px-2 py-3 text-center">
                <span class="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
                  {{ item.quantity }}
                </span>
              </td>
              <td class="px-2 py-3 text-center text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/10 dark:bg-emerald-900/10">{{ item.totalDisponibleTienda }}</td>
              <td class="px-2 py-3 text-center">
                <span :class="[item.disponibleBodega > 0 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-red-400 dark:text-red-500/70', 'text-sm']">
                  {{ item.disponibleBodega }}
                </span>
              </td>
              <td class="px-2 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">{{ item.venta30Dias }}</td>
              <td class="px-2 py-3 text-center">
                <span :class="[item.sugerido > 0 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-500', 'text-sm']">
                  {{ item.sugerido }}
                </span>
              </td>
              <td class="px-2 py-3 text-center font-mono text-xs" :class="item.diasInventario < 5 ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'">
                {{ item.diasInventario?.toFixed(1) || '0.0' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Summary -->
      <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Total de artículos en carrito: <span class="font-bold text-gray-900 dark:text-white">{{ carrito.length }}</span>
        </div>
        <div class="text-sm font-bold text-gray-900 dark:text-white">
          Total Unidades Solicitadas: <span class="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full ml-2">{{ store.totalSolicitado }}</span>
        </div>
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
