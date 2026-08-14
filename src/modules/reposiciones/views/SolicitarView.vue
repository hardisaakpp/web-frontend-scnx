<script setup lang="ts">
import { onMounted, onUnmounted, nextTick, ref, computed, watch } from 'vue'
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
  ClockIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import reposicionApi from '../services/reposicionApi'
import type { CatalogoItemDetail, Almacen } from '../types'

import { useAuthStore } from '../../../stores/auth'

const authStore = useAuthStore()
const canAdmin = computed(() => authStore.hasPermission('reposiciones.administrador'))

const store = useReposicionStore()
const { 
  catalogo, 
  loading, 
  filters, 
  listasFiltros, 
  almacenes, 
  totalItems,
  currentPage,
  isOpen,
  startHour,
  endHour
} = storeToRefs(store)

const showFilters = ref(false)
const selectedItem = ref<CatalogoItemDetail | null>(null)
const isDetailOpen = ref(false)
const loadingDetail = ref(false)

const isErrorModalOpen = ref(false)
const errorMessage = ref('')

const showError = (msg: string) => {
  errorMessage.value = msg
  isErrorModalOpen.value = true
}

const isConfirmModalOpen = ref(false)
const confirmMessage = ref('')
let confirmResolve: ((value: boolean) => void) | null = null

const showConfirm = (msg: string): Promise<boolean> => {
  confirmMessage.value = msg
  isConfirmModalOpen.value = true
  return new Promise((resolve) => {
    confirmResolve = resolve
  })
}

const handleConfirm = (result: boolean) => {
  isConfirmModalOpen.value = false
  if (confirmResolve) {
    confirmResolve(result)
    confirmResolve = null
  }
}

const getApiErrorMessage = (err: any, fallback: string): string => err?.response?.data?.message || fallback

const handleUpdateComment = async (itemCode: string, comment: string) => {
  try {
    await store.updateItemComment(itemCode, comment)
  } catch (err: any) {
    showError(getApiErrorMessage(err, 'Error al guardar comentario'))
  }
}

const almacenesTodos = ref<Almacen[]>([])
const bodegasParaSeleccionar = computed(() => canAdmin.value ? almacenesTodos.value : almacenes.value)

const formatAlmacen = (a: Almacen) => a.name && a.name !== a.code ? `${a.code} — ${a.name}` : a.code

// Dos cuadros de scroll INDEPENDIENTES, no uno compartido: header+filtros queda sticky
// contra la ventana (top: altura real de la barra de la app), y la tabla tiene su PROPIO
// cuadro con alto fijo + scroll interno, con su encabezado de columnas sticky DENTRO de
// ESE cuadro (top:0, sin necesidad de sumar nada). Al no compartir un mismo contenedor,
// los dos sticky no interfieren entre sí (evita un glitch de renderizado del navegador
// que aparece cuando dos sticky anidados comparten el mismo scroll).
const appBarHeight = ref(72)
const headerFiltersRef = ref<HTMLElement | null>(null)
const headerFiltersTopStyle = computed(() => ({ top: `${appBarHeight.value}px` }))
const tableWrapperRef = ref<HTMLElement | null>(null)
const tableWrapperHeight = ref(400)
const tableWrapperStyle = computed(() => ({ height: `${tableWrapperHeight.value}px` }))
const paginationRef = ref<HTMLElement | null>(null)
const paginationHeight = ref(0)
// Alto total de la tarjeta de la tabla (área con scroll + pie de paginación), para que
// el panel de filtros alcance exactamente el mismo borde inferior que la tabla.
const filterPanelStyle = computed(() => ({ maxHeight: `${tableWrapperHeight.value + paginationHeight.value}px` }))
let appBarResizeObserver: ResizeObserver | null = null
let tableWrapperResizeObserver: ResizeObserver | null = null
let paginationResizeObserver: ResizeObserver | null = null

function measureTableWrapperHeight() {
  if (!tableWrapperRef.value) return
  const documentTop = tableWrapperRef.value.getBoundingClientRect().top + window.scrollY
  paginationHeight.value = paginationRef.value?.offsetHeight ?? 0
  tableWrapperHeight.value = Math.max(200, window.innerHeight - documentTop - paginationHeight.value - 24)
}

// Bloqueamos el scroll de la página externa: así todo el scroll queda forzado a
// ocurrir dentro de la tabla (su único cuadro con overflow real). Esto evita que el
// encabezado de columnas se quede "huérfano" cuando la página se mueve un poco por
// fuera de la tabla (el sticky de la tabla solo reacciona a su propio scroll interno).
let previousBodyOverflow = ''
let previousHtmlOverflow = ''

onMounted(async () => {
  previousBodyOverflow = document.body.style.overflow
  previousHtmlOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'

  await store.initialize()
  if (canAdmin.value) {
    try {
      almacenesTodos.value = await reposicionApi.getAlmacenes()
    } catch (err) {
      console.error('Error al cargar todas las bodegas para admin', err)
    }
  }

  const appHeaders = Array.from(document.querySelectorAll('header'))
  if (appHeaders.length) {
    appBarResizeObserver = new ResizeObserver(() => {
      const visibleHeight = Math.max(...appHeaders.map(h => h.offsetHeight))
      if (visibleHeight > 0) appBarHeight.value = visibleHeight
    })
    appHeaders.forEach(h => appBarResizeObserver?.observe(h))
  }

  if (headerFiltersRef.value) {
    tableWrapperResizeObserver = new ResizeObserver(measureTableWrapperHeight)
    tableWrapperResizeObserver.observe(headerFiltersRef.value)
  }

  // El pie de paginación aparece/desaparece según totalItems (v-if): observarlo en
  // cuanto exista para que su alto también se reste del espacio de la tabla.
  watch(paginationRef, (el) => {
    paginationResizeObserver?.disconnect()
    if (el) {
      paginationResizeObserver = new ResizeObserver(measureTableWrapperHeight)
      paginationResizeObserver.observe(el)
    }
    measureTableWrapperHeight()
  })

  await nextTick()
  measureTableWrapperHeight()
  window.addEventListener('resize', measureTableWrapperHeight)
})

onUnmounted(() => {
  appBarResizeObserver?.disconnect()
  tableWrapperResizeObserver?.disconnect()
  paginationResizeObserver?.disconnect()
  window.removeEventListener('resize', measureTableWrapperHeight)
  document.body.style.overflow = previousBodyOverflow
  document.documentElement.style.overflow = previousHtmlOverflow
})

const handleSearch = () => {
  store.fetchCatalogo(true)
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => [
    filters.value.descripcion,
    filters.value.itemCode,
    filters.value.codeBars,
    filters.value.marca,
    filters.value.categoria,
    filters.value.linea,
    filters.value.unidad
  ],
  () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(handleSearch, 400)
  }
)

onUnmounted(() => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  // Filtros de búsqueda se limpian al salir de la vista, para que no queden
  // aplicados de una visita anterior si el usuario vuelve al catálogo.
  store.resetFilters()
})

const handleClearFilters = () => {
  store.resetFilters()
  store.fetchCatalogo(true)
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

const resolveEmbalajeQuantity = async (item: any, quantity: number): Promise<number | null> => {
  if (quantity <= 0 || item.embalaje <= 0 || quantity % item.embalaje === 0) return quantity
  const suggested = Math.ceil(quantity / item.embalaje) * item.embalaje
  const confirmed = await showConfirm(`La cantidad debe ser múltiplo de ${item.embalaje}. ¿Desea ajustar a ${suggested}?`)
  return confirmed ? suggested : null
}

const confirmQuantityChange = async (item: any, quantity: number): Promise<boolean> => {
  if (quantity > item.disponibleBodega) {
    showError(`No hay suficiente stock en bodega. Disponible: ${item.disponibleBodega}`)
    return false
  }
  if (quantity > 0 && item.totalTransitoria > 0) {
    const confirmed = await showConfirm(`Este artículo ya tiene ${item.totalTransitoria} unidades en tránsito (solicitadas anteriormente y pendientes de llegar a tienda). Si continúas, esta cantidad se sumará a lo que ya está en camino. ¿Desea continuar?`)
    if (!confirmed) return false
  }
  if (quantity > item.sugerido && item.sugerido > 0) {
    const confirmed = await showConfirm(`La cantidad es mayor al sugerido (${item.sugerido}). ¿Desea continuar?`)
    if (!confirmed) return false
  }
  return true
}

const updateQuantity = async (item: any, quantity: number) => {
  if (store.cantidadPorCodigo(item.itemCode) === quantity) return
  try {
    const resolvedQuantity = await resolveEmbalajeQuantity(item, quantity)
    if (resolvedQuantity === null) return

    if (!(await confirmQuantityChange(item, resolvedQuantity))) return

    await store.updateItemQuantity(item.itemCode, resolvedQuantity)
  } catch (err: any) {
    showError(getApiErrorMessage(err, 'Error al actualizar cantidad'))
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
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header + Filtros como una sola unidad sticky (evita huecos no-sticky que causan solapamiento) -->
    <div ref="headerFiltersRef" :style="headerFiltersTopStyle" class="sticky z-20 bg-gray-100 dark:bg-gray-900 pb-4">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div class="flex items-center gap-4">
          <router-link v-if="canAdmin" to="/reposiciones" class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 bg-white dark:bg-gray-900 shadow-sm">
            <ArrowLeftIcon class="w-5 h-5" />
          </router-link>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Reposición de Artículos</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona el reabastecimiento de tu tienda de forma eficiente.</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div v-if="!isOpen" class="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-red-200 dark:border-red-800 shadow-sm">
          <InformationCircleIcon class="w-4 h-4" />
          <span class="text-xs font-medium">Fuera de horario ({{ String(startHour).padStart(2, '0') }}:00 - {{ String(endHour).padStart(2, '0') }}:00)</span>
        </div>
        
        <div v-if="!canAdmin && bodegasParaSeleccionar.length === 1"
             class="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm">
          <BuildingOfficeIcon class="w-5 h-5 flex-shrink-0" />
          <div class="flex flex-col">
            <span class="text-[10px] font-bold uppercase tracking-wider leading-none">Tienda</span>
            <span class="text-sm font-extrabold">{{ formatAlmacen(bodegasParaSeleccionar[0]) }}</span>
          </div>
        </div>

        <select
          v-else-if="bodegasParaSeleccionar.length > 0"
          v-model="filters.whsCode"
          @change="store.fetchDataByWarehouse()"
          class="block w-full sm:w-64 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 border"
        >
          <option value="" disabled>Seleccione una bodega...</option>
          <option v-for="alm in bodegasParaSeleccionar" :key="alm.code" :value="alm.code">
            {{ formatAlmacen(alm) }}
          </option>
        </select>

        <router-link 
          to="/reposiciones/historial"
          class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
        >
          <ClockIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span>Historial</span>
        </router-link>

        <router-link
          to="/reposiciones/carrito"
          class="bg-blue-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 shadow-sm hover:bg-blue-700 transition-all relative text-sm font-medium"
        >
          <ShoppingCartIcon class="w-4 h-4" />
          <span>Carrito</span>
          <span v-if="store.totalSolicitado > 0" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-gray-900">
            {{ store.carrito.length }}
          </span>
        </router-link>

        <button
          @click="showFilters = !showFilters"
          :class="showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-all text-sm font-medium"
        >
          <FunnelIcon class="w-4 h-4" />
          <span>Filtros</span>
        </button>
      </div>
    </div>


    </div>

    <!-- Fila: tabla (columna principal) + panel de filtros colapsable (ocupa espacio
    real, empuja la tabla, igual patrón que el sidebar izquierdo) -->
    <div class="flex gap-4 items-start">
    <div class="flex-1 min-w-0">
    <!-- Content Table Container -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div ref="tableWrapperRef" :style="tableWrapperStyle" class="overflow-auto">
        <table class="w-full text-left border-separate border-spacing-0 table-auto min-w-full">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th class="sticky top-0 z-10 px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 rounded-tl-xl">Artículo</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Emb.</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Stock</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Tránsito</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Comp.</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Disp. Tda.</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Disp. Bod.</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Venta 30d</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Sug.</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Días Inv.</th>
              <th class="sticky top-0 z-10 px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px] bg-gray-50 dark:bg-gray-900">Solicitado</th>
              <th class="sticky top-0 z-10 px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 rounded-tr-xl">Observación/ Responsable</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="!filters.whsCode">
              <td colspan="12" class="px-6 py-20 text-center text-gray-400 dark:text-gray-500">
                <div class="flex flex-col items-center">
                  <BuildingOfficeIcon class="w-12 h-12 mb-4 opacity-20" />
                  <p class="text-lg font-medium">Por favor, selecciona una bodega para ver el catálogo.</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td class="px-6 py-4"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-48"></div></td>
              <td colspan="11" class="px-6 py-4"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
            </tr>
            <tr v-else-if="catalogo.length === 0">
              <td colspan="12" class="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                <MagnifyingGlassIcon class="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No se encontraron artículos con los filtros aplicados.</p>
              </td>
            </tr>
            <tr v-else v-for="item in catalogo" :key="item.itemCode" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
              <td class="px-4 py-3">
                <div class="flex flex-col">
                  <button 
                    @click="openDetail(item.itemCode)"
                    class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-left truncate hover:underline"
                  >
                    {{ item.itemName }}
                  </button>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{{ item.itemCode }}</span>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{{ item.codeBars }}</span>
                  </div>
                </div>
              </td>
              <td class="px-2 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">{{ item.embalaje }}</td>
              <td class="px-2 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300">{{ item.onHand }}</td>
              <td class="px-2 py-3 text-center text-sm text-blue-600 dark:text-blue-400 font-medium">{{ item.totalTransitoria }}</td>
              <td class="px-2 py-3 text-center text-sm text-orange-600 dark:text-orange-400 font-medium">{{ item.totalSolicitud }}</td>
              <td class="px-2 py-3 text-center text-sm text-emerald-600 dark:text-emerald-400 font-bold border-x border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">{{ item.totalDisponibleTienda }}</td>
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
                {{ item.diasInventario.toFixed(1) }}
              </td>
              <td class="px-4 py-3">
                <input 
                  type="number"
                  :value="store.cantidadPorCodigo(item.itemCode)"
                  @blur="e => updateQuantity(item, parseInt((e.target as HTMLInputElement).value || '0'))"
                  class="w-full h-9 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border text-center text-sm font-bold"
                  :class="getQuantityColor(item)"
                  min="0"
                />
              </td>
              <td class="px-4 py-3">
                <input
                  type="text"
                  :value="store.comentarioPorCodigo(item.itemCode)"
                  @blur="e => handleUpdateComment(item.itemCode, (e.target as HTMLInputElement).value)"
                  :disabled="store.cantidadPorCodigo(item.itemCode) === 0"
                  :title="store.cantidadPorCodigo(item.itemCode) === 0 ? 'Agrega una cantidad primero' : ''"
                  placeholder="..."
                  class="w-full h-9 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border text-xs px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  maxlength="50"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalItems > 0" ref="paginationRef" class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl">
        <div class="flex items-center gap-6">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Mostrando <span class="font-medium text-gray-900 dark:text-white">{{ catalogo.length }}</span> de <span class="font-medium text-gray-900 dark:text-white">{{ totalItems }}</span> artículos
          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cantidad por página:</span>
            <select 
              v-model="filters.pageSize" 
              @change="store.fetchCatalogo(true)"
              class="h-8 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs px-2 focus:ring-blue-500 focus:border-blue-500 border bg-white shadow-sm"
            >
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="250">250</option>
              <option :value="500">500</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="store.setPage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium"
          >
            Anterior
          </button>
          <div class="text-xs text-gray-600 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            Página {{ currentPage }}
          </div>
          <button 
            @click="store.setPage(currentPage + 1)" 
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm text-xs font-medium"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- Panel de filtros colapsable: se abre/cierra con el botón "Filtros" del header,
    ocupa espacio real y empuja la tabla en vez de tapar nada -->
    <div class="flex-shrink-0">
      <div class="overflow-hidden transition-all duration-300 ease-out" :class="showFilters ? 'w-80' : 'w-0'">
        <div :style="filterPanelStyle" class="w-80 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">

          <div class="space-y-1.5">
            <label for="filter-codebars" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Código Barras</label>
            <input
              id="filter-codebars"
              v-model="filters.codeBars"
              type="text"
              placeholder="Codigo de barras..."
              class="w-full px-4 py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border transition-all text-sm"
              @keydown.enter="handleSearch"
            />
          </div>
          
          <div class="space-y-1.5">
            <label for="filter-itemcode" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Código Art.</label>
            <input
              id="filter-itemcode"
              v-model="filters.itemCode"
              type="text"
              placeholder="ItemCode..."
              class="w-full px-4 py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border transition-all text-sm"
              @keydown.enter="handleSearch"
            />
          </div>

          <div class="space-y-1.5">
            <label for="filter-descripcion" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Descripción</label>
            <div class="relative">
              <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="filter-descripcion"
                v-model="filters.descripcion"
                type="text"
                placeholder="Nombre..."
                class="w-full pl-9 pr-4 py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border transition-all text-sm"
                @keydown.enter="handleSearch"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="filter-marca" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Marca</label>
            <select id="filter-marca" v-model="filters.marca" class="w-full py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border text-sm">
              <option value="">Todas</option>
              <option v-for="m in listasFiltros.marcas" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label for="filter-categoria" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Categoría</label>
            <select id="filter-categoria" v-model="filters.categoria" class="w-full py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border text-sm">
              <option value="">Todas</option>
              <option v-for="c in listasFiltros.categorias" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label for="filter-linea" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Línea</label>
            <select id="filter-linea" v-model="filters.linea" class="w-full py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border text-sm">
              <option value="">Todas</option>
              <option v-for="l in listasFiltros.lineas" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label for="filter-unidad" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Unidad</label>
            <select id="filter-unidad" v-model="filters.unidad" class="w-full py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border text-sm">
              <option value="">Todas</option>
              <option v-for="u in listasFiltros.unidades" :key="u" :value="u">{{ u }}</option>
            </select>
          </div>

        </div>

        <div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
          <button @click="handleClearFilters" class="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium">
            <ArrowPathIcon class="w-4 h-4" />
            <span>Limpiar</span>
          </button>
        </div>
        </div>
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
              <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 text-left align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                <div v-if="loadingDetail" class="flex flex-col items-center py-12">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p class="text-gray-500 dark:text-gray-400 font-medium">Cargando detalles...</p>
                </div>
                
                <div v-else-if="selectedItem">
                  <div class="flex justify-between items-start mb-6">
                    <div>
                      <DialogTitle as="h3" class="text-2xl font-bold text-gray-900 dark:text-white pr-8 leading-tight">
                        {{ selectedItem.itemName }}
                      </DialogTitle>
                      <div class="flex gap-2 mt-2">
                        <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold">Marca: {{ selectedItem.marca }}</span>
                      </div>
                    </div>
                    <button @click="isDetailOpen = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors">
                      <XMarkIcon class="w-6 h-6" />
                    </button>
                  </div>

                  <!-- DETALLE PRODUCTO -->
                  <div class="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 mb-4 border border-gray-100 dark:border-gray-700">
                    <h4 class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Detalle Producto</h4>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Referencia (ItemCode)</span>
                        <span class="font-bold text-blue-700 dark:text-blue-400">{{ selectedItem.itemCode }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Código de Barras</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ selectedItem.codeBars }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Clasificación ABC</span>
                        <span class="font-bold text-amber-700 dark:text-amber-500">{{ selectedItem.clasificacionABC }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Unidad</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ selectedItem.unidad }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Categoría</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ selectedItem.categoria }}</span>
                      </div>
                      <div class="flex justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Línea</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ selectedItem.linea }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- VENTAS -->
                  <div class="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-5 mb-4 border border-blue-100/60 dark:border-blue-800/60">
                    <h4 class="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-widest mb-3">Ventas</h4>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Venta 30 días</span>
                        <span class="font-bold text-gray-900 dark:text-white">{{ selectedItem.venta30Dias }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Venta 90 días</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ selectedItem.venta90Dias }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Prom. Venta 30 días</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ selectedItem.promedioVenta30Dias?.toFixed(2) ?? '0.00' }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Prom. Últ. 3 meses</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ selectedItem.promedioVenta90Dias?.toFixed(2) ?? '0.00' }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Última Fecha Venta</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ formatDate(selectedItem.fechaUltimaVenta) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Días desde Últ. Venta</span>
                        <span class="font-bold text-orange-600 dark:text-orange-400">{{ diasDesdeUltimaVenta }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Últ. Fecha Ingreso</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ formatDate(selectedItem.ultimaFechaIngreso) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-blue-200/40 dark:border-blue-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Días Últ. Fecha Ingreso</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ selectedItem.diasUltimaFechaIngreso ?? 0 }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- STOCK Y REP. -->
                  <div class="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl p-5 border border-emerald-100/60 dark:border-emerald-800/60">
                    <h4 class="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-3">Stock y Reposición</h4>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Stock Actual (Tienda)</span>
                        <span class="font-bold text-gray-900 dark:text-white">{{ Math.round(selectedItem.onHand) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Stock Bodega</span>
                        <span class="font-bold text-blue-600 dark:text-blue-400">{{ Math.round(selectedItem.totalBodega) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Stock Mínimo</span>
                        <span class="font-semibold text-rose-600 dark:text-rose-400">{{ Math.round(selectedItem.minStock) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Stock Máximo</span>
                        <span class="font-semibold text-blue-600 dark:text-blue-400">{{ Math.round(selectedItem.maxStock) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Lead Time (Días)</span>
                        <span class="font-bold text-gray-900 dark:text-white">{{ selectedItem.uLead }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Stock de Seguridad</span>
                        <span class="font-bold text-gray-900 dark:text-white">{{ selectedItem.uStkSeg }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Perfil Reposición</span>
                        <span class="font-bold text-gray-900 dark:text-white">{{ selectedItem.uPerRep }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Días de Inv.</span>
                        <span class="font-bold text-orange-600 dark:text-orange-400">{{ selectedItem.diasInventario.toFixed(1) }}</span>
                      </div>
                      <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Tránsito Bodega</span>
                        <span class="font-bold text-blue-500 dark:text-blue-400">{{ Math.round(selectedItem.totalTransitoriaBodega) }}</span>
                      </div>
                       <div class="flex justify-between border-b border-emerald-200/40 dark:border-emerald-800/40 pb-1.5">
                        <span class="text-gray-500 dark:text-gray-400">Total Disp. Tienda</span>
                        <span class="font-bold text-emerald-700 dark:text-emerald-400">{{ Math.round(selectedItem.totalDisponibleTienda) }}</span>
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

    <!-- Error Modal -->
    <TransitionRoot appear :show="isErrorModalOpen" as="template">
      <Dialog as="div" @close="isErrorModalOpen = false" class="relative z-50">
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
              <DialogPanel class="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-center align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <ExclamationTriangleIcon class="h-10 w-10 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                
                <DialogTitle as="h3" class="text-xl font-bold leading-6 text-gray-900 dark:text-white mb-2">
                  No se pudo completar la acción
                </DialogTitle>
                
                <div class="mt-2">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ errorMessage }}
                  </p>
                </div>

                <div class="mt-6 flex justify-center">
                  <button
                    type="button"
                    class="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-all shadow-sm"
                    @click="isErrorModalOpen = false"
                  >
                    Entendido
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Confirm Modal -->
    <TransitionRoot appear :show="isConfirmModalOpen" as="template">
      <Dialog as="div" @close="handleConfirm(false)" class="relative z-50">
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
              <DialogPanel class="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-center align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                  <QuestionMarkCircleIcon class="h-10 w-10 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                
                <DialogTitle as="h3" class="text-xl font-bold leading-6 text-gray-900 dark:text-white mb-2">
                  Confirmar acción
                </DialogTitle>
                
                <div class="mt-2">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ confirmMessage }}
                  </p>
                </div>

                <div class="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    class="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-all shadow-sm"
                    @click="handleConfirm(false)"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none transition-all shadow-sm"
                    @click="handleConfirm(true)"
                  >
                    Confirmar
                  </button>
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
