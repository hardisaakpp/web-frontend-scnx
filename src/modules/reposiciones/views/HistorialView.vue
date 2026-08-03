<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useReposicionStore } from '../stores/reposicionStore'
import reposicionApi from '../services/reposicionApi'
import type { HistorialCabecera, HistorialDetalleItem, HistorialSolicitudSap } from '../types'
import { 
  ArrowLeftIcon, 
  CalendarIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  ClockIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  QueueListIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

const store = useReposicionStore()
const historial = ref<HistorialCabecera[]>([])
const loading = ref(false)

const fechaDesde = ref(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
const fechaHasta = ref(new Date().toISOString().split('T')[0])

const currentWarehouseName = computed(() => store.etiquetaAlmacen(store.filters.whsCode))

const fetchHistorial = async () => {
  if (!store.filters.whsCode) return
  loading.value = true
  try {
    historial.value = await reposicionApi.getHistorial(store.filters.whsCode, fechaDesde.value, fechaHasta.value)
  } catch (err) {
    console.error('Error al cargar historial', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (store.almacenes.length === 0) {
    await store.initialize()
  }
  if (store.filters.whsCode) {
    fetchHistorial()
  }
})

watch(() => store.filters.whsCode, (newVal) => {
  if (newVal) fetchHistorial()
})

const getStatusClass = (integrado: boolean) => {
  return integrado 
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    : 'bg-amber-100 text-amber-700 border-amber-200'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Modal handling logic
const isDetailOpen = ref(false)
const selectedItems = ref<HistorialDetalleItem[]>([])
const loadingDetail = ref(false)

const openDetail = async (id: number) => {
  loadingDetail.value = true
  isDetailOpen.value = true
  try {
    selectedItems.value = await reposicionApi.getDetalles(id)
  } catch (err) {
    console.error('Error al cargar detalle', err)
    selectedItems.value = []
  } finally {
    loadingDetail.value = false
  }
}

const downloadPdf = (id: number) => {
  const url = reposicionApi.getPdfUrl(id)
  window.open(url, '_blank')
}

const isSapModalOpen = ref(false)
const sapRequests = ref<HistorialSolicitudSap[]>([])
const loadingSap = ref(false)

const viewSolicitudes = async (whsCode: string, fecha: string) => {
  const dateOnly = fecha.split('T')[0]
  loadingSap.value = true
  isSapModalOpen.value = true
  try {
    sapRequests.value = await reposicionApi.getSolicitudesSap(whsCode, dateOnly)
  } catch (err) {
    console.error('Error al cargar solicitudes SAP', err)
    sapRequests.value = []
  } finally {
    loadingSap.value = false
  }
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
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Reposiciones</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Consulta tus solicitudes basadas en <strong class="text-blue-600 dark:text-blue-400 uppercase font-bold">{{ currentWarehouseName || 'una bodega' }}</strong></p>
        </div>
      </div>

      <div class="flex flex-wrap items-center bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm gap-2">
        <div v-if="!store.filters.whsCode" class="text-xs text-red-500 dark:text-red-400 font-bold px-2">Seleccione una bodega</div>
        <div class="flex items-center px-4 py-2 border-r border-gray-100 dark:border-gray-700 gap-2">
          <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input type="date" v-model="fechaDesde" class="border-none focus:ring-0 p-0 text-sm font-bold text-gray-900 dark:text-white bg-transparent cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
        </div>
        <div class="flex items-center px-4 py-2 border-r border-gray-100 dark:border-gray-700 gap-2">
          <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input type="date" v-model="fechaHasta" class="border-none focus:ring-0 p-0 text-sm font-bold text-gray-900 dark:text-white bg-transparent cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
        </div>
        <button 
          @click="fetchHistorial"
          class="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all text-sm ml-2 disabled:opacity-50"
          :disabled="!store.filters.whsCode"
        >
          Filtrar
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
        <table class="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Fecha de Solicitud</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">ID</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Origen</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900"></th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Destino</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Usuario Solicita</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Artículos</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Estado</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right bg-gray-50 dark:bg-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td v-for="j in 6" :key="j" class="px-6 py-4"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
            </tr>
            <tr v-else-if="!store.filters.whsCode">
              <td colspan="6" class="px-8 py-20 text-center text-gray-400 dark:text-gray-500">
                <DocumentTextIcon class="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p class="text-lg font-medium">Seleccione una bodega para ver su historial.</p>
              </td>
            </tr>
            <tr v-else-if="historial.length === 0">
              <td colspan="6" class="px-8 py-20 text-center text-gray-400 dark:text-gray-500">
                <DocumentTextIcon class="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p class="text-lg font-medium">No se encontraron registros en este periodo.</p>
              </td>
            </tr>
            <tr v-for="item in historial" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <DocumentTextIcon class="w-4 h-4" />
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(item.fecha) }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">#{{ item.id }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ store.etiquetaAlmacen(item.fromWhs) }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-gray-300">→</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ store.etiquetaAlmacen(item.toWhs) }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ currentWarehouseName || 'una bodega' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-bold text-gray-900 dark:text-white">{{ item.cantidadArticulos }}</span>
              </td>
              <td class="px-6 py-4">
                <div :class="[getStatusClass(item.integrado), 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-opacity-10']">
                  <CheckBadgeIcon v-if="item.integrado" class="w-3 h-3" />
                  <ClockIcon v-else class="w-3 h-3" />
                  {{ item.integrado ? 'Integrado' : 'Pendiente' }}
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button @click="openDetail(item.id)" title="Ver Detalle" class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <EyeIcon class="w-5 h-5" />
                  </button>
                  <button @click="downloadPdf(item.id)" title="Descargar PDF" class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <DocumentArrowDownIcon class="w-5 h-5" />
                  </button>
                  <button @click="viewSolicitudes(item.toWhs, item.fecha)" title="Ver Solicitudes en SAP" class="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                    <QueueListIcon class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Detalle -->
    <TransitionRoot appear :show="isDetailOpen" as="template">
      <Dialog as="div" @close="isDetailOpen = false" class="relative z-50">
        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
              <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-8 text-left align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                <div v-if="loadingDetail" class="flex flex-col items-center py-12">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p class="text-gray-500 dark:text-gray-400 font-medium">Cargando detalles...</p>
                </div>
                
                <div v-else>
                  <div class="flex justify-between items-start mb-6">
                    <div>
                      <DialogTitle as="h3" class="text-xl font-bold text-gray-900 dark:text-white pr-8 leading-tight">
                        Detalle de Solicitud
                      </DialogTitle>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Artículos seleccionados para esta transacción.</p>
                    </div>
                    <button @click="isDetailOpen = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                      <XMarkIcon class="w-6 h-6" />
                    </button>
                  </div>

                  <div v-if="selectedItems.length > 0" class="max-h-[60vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table class="w-full text-left border-collapse bg-white dark:bg-gray-800 relative">
                      <thead class="sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur z-10 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th class="px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Artículo</th>
                          <th class="px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase text-center w-24">Cant.</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                        <tr v-for="line in selectedItems" :key="line.itemCode" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td class="px-4 py-3">
                            <div class="font-bold text-gray-900 dark:text-white text-sm">{{ line.itemCode }}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ line.itemName }}</div>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <span class="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold px-3 py-1 rounded-lg min-w-[3rem] text-sm">
                              {{ line.quantity }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="py-12 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron artículos en esta solicitud.
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Modal Solicitudes SAP -->
    <TransitionRoot appear :show="isSapModalOpen" as="template">
      <Dialog as="div" @close="isSapModalOpen = false" class="relative z-50">
        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
              <DialogPanel class="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-8 text-left align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                <div v-if="loadingSap" class="flex flex-col items-center py-12">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                  <p class="text-gray-500 dark:text-gray-400 font-medium">Consultando SAP...</p>
                </div>
                
                <div v-else>
                  <div class="flex justify-between items-start mb-6">
                    <div>
                      <DialogTitle as="h3" class="text-xl font-bold text-gray-900 dark:text-white pr-8 leading-tight">
                        Documentos en SAP
                      </DialogTitle>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Solicitudes de traslado generadas automáticamente.</p>
                    </div>
                    <button @click="isSapModalOpen = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                      <XMarkIcon class="w-6 h-6" />
                    </button>
                  </div>

                  <div v-if="sapRequests.length > 0" class="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div v-for="req in sapRequests" :key="req.docNum" class="bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div class="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                          <div class="bg-emerald-100 dark:bg-emerald-900/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <DocumentTextIcon class="w-5 h-5" />
                          </div>
                          <div>
                            <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Documento SAP</span>
                            <h4 class="text-lg font-bold text-gray-900 dark:text-white">#{{ req.docNum }}</h4>
                          </div>
                        </div>
                        <div class="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-700">
                           <div class="text-center">
                             <div class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Origen</div>
                             <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ req.fromWhs }}</div>
                           </div>
                           <div class="text-gray-300 dark:text-gray-600 leading-none">→</div>
                           <div class="text-center">
                             <div class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Destino</div>
                             <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ req.toWhs }}</div>
                           </div>
                        </div>
                      </div>
                      
                      <div class="p-6">
                        <div v-if="req.comments" class="mb-5 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/20 flex items-start gap-2">
                          <ClockIcon class="w-4 h-4 text-amber-500 mt-0.5" />
                          <p class="text-xs text-amber-700 dark:text-amber-500 font-medium italic">"{{ req.comments }}"</p>
                        </div>

                        <table class="w-full text-left border-collapse">
                          <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                              <th class="py-2 text-[10px] font-bold text-gray-400 uppercase">Código</th>
                              <th class="py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Cantidad</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr v-for="line in req.lines" :key="line.itemCode">
                              <td class="py-2 text-sm font-medium text-gray-600 dark:text-gray-400">{{ line.itemCode }}</td>
                              <td class="py-2 text-sm font-bold text-gray-900 dark:text-white text-right">{{ line.quantity }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div v-else class="py-20 text-center bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <XMarkIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p class="text-xl font-bold text-gray-400 dark:text-gray-500">Sin registros en SAP</p>
                    <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Este registro aún no ha sido sincronizado.</p>
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
