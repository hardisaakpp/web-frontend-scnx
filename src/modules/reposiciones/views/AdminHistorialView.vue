<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useReposicionStore } from '../stores/reposicionStore'
import { useAuthStore } from '@/stores/auth'
import reposicionApi from '../services/reposicionApi'
import type { HistorialCabecera, HistorialDetalleItem, HistorialSolicitudSap, Almacen } from '../types'
import {
  CalendarIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  ClockIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  QueueListIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  TableCellsIcon
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

const authStore = useAuthStore()
const store = useReposicionStore()
const historial = ref<HistorialCabecera[]>([])
const almacenesTodos = ref<Almacen[]>([])
const loading = ref(false)

const formatAlmacen = (a: Almacen) => a.name && a.name !== a.code ? `${a.code} — ${a.name}` : a.code
const etiquetaAlmacen = (code: string | null | undefined) => {
  if (!code) return ''
  const info = almacenesTodos.value.find(a => a.code === code)
  return info ? formatAlmacen(info) : code
}

const fechaDesde = ref(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
const fechaHasta = ref(new Date().toISOString().split('T')[0])
const whsFilter = ref('')

const canRequest = computed(() => authStore.hasPermission('reposiciones.tienda'))

const kpis = computed(() => [
  { name: 'Total Solicitudes', value: historial.value.length, icon: DocumentTextIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Integradas', value: historial.value.filter(h => h.integrado).length, icon: CheckBadgeIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Pendientes', value: historial.value.filter(h => !h.integrado).length, icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
])

const fetchHistorial = async () => {
  loading.value = true
  try {
    historial.value = await reposicionApi.getHistorial(whsFilter.value || undefined, fechaDesde.value, fechaHasta.value)
  } catch (err) {
    console.error('Error al cargar historial admin', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Para Admin, cargamos todos los almacenes disponibles en la base de datos
  try {
    almacenesTodos.value = await reposicionApi.getAlmacenes()
  } catch (err) {
    console.error('Error al cargar almacenes para admin', err)
  }
  fetchHistorial()
})

watch([fechaDesde, fechaHasta, whsFilter], () => fetchHistorial())

const getStatusClass = (integrado: boolean) => {
  return integrado 
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    : 'bg-amber-100 text-amber-700 border-amber-200'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Detalle Modal Logic (Reutilizada)
const isDetailOpen = ref(false)
const selectedItems = ref<HistorialDetalleItem[]>([])
const loadingDetail = ref(false)

const openDetail = async (id: number) => {
  loadingDetail.value = true; isDetailOpen.value = true
  try { selectedItems.value = await reposicionApi.getDetalles(id) } 
  catch { selectedItems.value = [] } 
  finally { loadingDetail.value = false }
}

const downloadPdf = (id: number) => window.open(reposicionApi.getPdfUrl(id), '_blank')

// cdCode se omite a propósito: el reporte general incluye todos los Centros de
// Distribución. whsFilter filtra por tienda (destino), no aplica aquí.
const reporteGeneralParams = () => ({
  desde: fechaDesde.value,
  hasta: fechaHasta.value
})

const downloadPdfGeneral = () => window.open(reposicionApi.getHistorialPdfGeneralUrl(reporteGeneralParams()), '_blank')
const downloadExcelGeneral = () => window.open(reposicionApi.getHistorialExcelGeneralUrl(reporteGeneralParams()), '_blank')

const isSapModalOpen = ref(false)
const sapRequests = ref<HistorialSolicitudSap[]>([])
const loadingSap = ref(false)

const viewSolicitudes = async (whsCode: string, fecha: string) => {
  loadingSap.value = true; isSapModalOpen.value = true
  try { sapRequests.value = await reposicionApi.getSolicitudesSap(whsCode, fecha.split('T')[0]) } 
  catch { sapRequests.value = [] } 
  finally { loadingSap.value = false }
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div class="flex items-center gap-4">
        <router-link v-if="canRequest" to="/reposiciones" class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 bg-white dark:bg-gray-900 shadow-sm">
          <ArrowLeftIcon class="w-5 h-5" />
        </router-link>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Panel de Control Global</h1>
            <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">Administrador</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Supervisión general de reposiciones en todas las bodegas.</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm gap-2">
        <!-- Warehouse Filter para Administradores -->
        <div class="flex items-center px-4 py-2 border-r border-gray-100 dark:border-gray-700 gap-2">
          <BuildingOfficeIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <select v-model="whsFilter" class="border-none focus:ring-0 p-0 text-sm font-bold text-gray-700 dark:text-white bg-transparent min-w-[120px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <option value="" class="bg-white dark:bg-gray-800">Todas las bodegas</option>
            <option v-for="alm in almacenesTodos" :key="alm.code" :value="alm.code" class="bg-white dark:bg-gray-800">
              {{ formatAlmacen(alm) }}
            </option>
          </select>
        </div>
        <div class="flex items-center px-4 py-2 border-r border-gray-100 dark:border-gray-700 gap-2">
          <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input type="date" v-model="fechaDesde" class="border-none focus:ring-0 p-0 text-sm font-bold text-gray-900 dark:text-white bg-transparent cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
        </div>
        <div class="flex items-center px-4 py-2 gap-2">
          <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input type="date" v-model="fechaHasta" class="border-none focus:ring-0 p-0 text-sm font-bold text-gray-900 dark:text-white bg-transparent cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
        </div>
      </div>
    </div>

    <!-- Reportes Generales (todas las bodegas, agrupado por Centro de Distribución) -->
    <div class="flex flex-wrap items-center justify-end gap-2 mb-6">
      <button
        @click="downloadExcelGeneral"
        class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium"
      >
        <TableCellsIcon class="w-4 h-4 text-emerald-600" />
        <span>Excel General</span>
      </button>
      <button
        @click="downloadPdfGeneral"
        class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium"
      >
        <DocumentArrowDownIcon class="w-4 h-4 text-red-600" />
        <span>PDF General</span>
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div v-for="kpi in kpis" :key="kpi.name" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{{ kpi.name }}</p>
            <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-1">{{ kpi.value }}</h3>
          </div>
          <div :class="[kpi.bg, kpi.color, 'p-3 rounded-xl shadow-inner']">
            <component :is="kpi.icon" class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla Historial Global -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
        <table class="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Fecha</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">ID</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Origen</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">→</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Destino</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Artículos</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Estado</th>
              <th class="sticky top-0 z-20 px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right bg-gray-50 dark:bg-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td v-for="j in 8" :key="j" class="px-6 py-4"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
            </tr>
            <tr v-else-if="historial.length === 0">
              <td colspan="8" class="px-8 py-20 text-center text-gray-400 dark:text-gray-500">
                <DocumentTextIcon class="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p class="text-lg font-medium">No se encontraron registros en este periodo.</p>
              </td>
            </tr>
            <tr v-for="item in historial" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group">
              <td class="px-6 py-4 font-semibold text-gray-900 dark:text-white text-sm">{{ formatDate(item.fecha) }}</td>
              <td class="px-6 py-4 text-center">
                <span class="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded">#{{ item.id }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ etiquetaAlmacen(item.fromWhs) }}</td>
              <td class="px-6 py-4 text-center text-gray-300">→</td>
              <td class="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 text-sm">{{ etiquetaAlmacen(item.toWhs) }}</td>
              <td class="px-6 py-4 text-center font-bold text-gray-900 dark:text-white text-sm">{{ item.cantidadArticulos }}</td>
              <td class="px-6 py-4">
                <div :class="[getStatusClass(item.integrado), 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-opacity-10']">
                  <CheckBadgeIcon v-if="item.integrado" class="w-3 h-3" />
                  <ClockIcon v-else class="w-3 h-3" />
                  {{ item.integrado ? 'Integrado' : 'Pendiente' }}
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button @click="openDetail(item.id)" title="Ver Detalle" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><EyeIcon class="w-5 h-5" /></button>
                  <button @click="downloadPdf(item.id)" title="Descargar PDF" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><DocumentArrowDownIcon class="w-5 h-5" /></button>
                  <button @click="viewSolicitudes(item.toWhs, item.fecha)" title="Ver SAP" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><QueueListIcon class="w-5 h-5" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modales (Copiados de HistorialView para consistencia) -->
    <TransitionRoot appear :show="isDetailOpen" as="template">
      <Dialog as="div" @close="isDetailOpen = false" class="relative z-50">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
               <div v-if="loadingDetail" class="flex flex-col items-center py-12">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p class="text-gray-500 font-medium font-inter">Cargando detalles...</p>
                </div>
                <div v-else>
                  <div class="flex justify-between items-start mb-6">
                    <DialogTitle as="h3" class="text-xl font-bold text-gray-900 dark:text-white">Detalle de Solicitud</DialogTitle>
                    <button @click="isDetailOpen = false" class="text-gray-400 hover:text-gray-600"><XMarkIcon class="w-6 h-6" /></button>
                  </div>
                  <div class="max-h-[60vh] overflow-y-auto border rounded-lg overflow-hidden">
                    <table class="w-full text-left border-collapse bg-white dark:bg-gray-800">
                      <thead class="bg-gray-50 dark:bg-gray-900 border-b">
                        <tr>
                          <th class="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Artículo</th>
                          <th class="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase text-center w-24">Cant.</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y">
                        <tr v-for="line in selectedItems" :key="line.itemCode" class="hover:bg-gray-50">
                          <td class="px-4 py-3">
                            <div class="font-bold text-gray-900 dark:text-white text-sm">{{ line.itemCode }}</div>
                            <div class="text-xs text-gray-500">{{ line.itemName }}</div>
                          </td>
                          <td class="px-4 py-3 text-center">
                            <span class="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm">{{ line.quantity }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
            </DialogPanel>
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
                             <div class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ etiquetaAlmacen(req.fromWhs) }}</div>
                           </div>
                           <div class="text-gray-300 dark:text-gray-600 leading-none">→</div>
                           <div class="text-center">
                             <div class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Destino</div>
                             <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ etiquetaAlmacen(req.toWhs) }}</div>
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
