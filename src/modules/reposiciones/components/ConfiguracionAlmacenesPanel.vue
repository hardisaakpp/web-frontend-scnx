<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import reposicionApi from '../services/reposicionApi'
import type { Almacen } from '../types'
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ArrowUturnLeftIcon
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useModuleNotifications } from '@/composables/useModuleNotifications'

const notify = useModuleNotifications('Reposiciones')

const almacenes = ref<Almacen[]>([])
const loading = ref(false)
const search = ref('')

const fetchAlmacenes = async () => {
  loading.value = true
  try {
    almacenes.value = await reposicionApi.getAlmacenes()
  } catch (err) {
    console.error('Error al cargar almacenes', err)
    notify.error({ title: 'No se pudo cargar el listado de almacenes' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchAlmacenes)

const term = computed(() => search.value.trim().toLowerCase())
const matches = (a: Almacen) => !term.value || a.code.toLowerCase().includes(term.value) || a.name?.toLowerCase().includes(term.value)

const centros = computed(() =>
  almacenes.value.filter(a => a.esCentroDistribucion).sort((a, b) => a.code.localeCompare(b.code))
)
const tiendasDe = (cd: Almacen) => almacenes.value.filter(a => !a.esCentroDistribucion && a.centroDistribucionId === cd.id)
const sinAsignar = computed(() => almacenes.value.filter(a => !a.esCentroDistribucion && !a.centroDistribucionId))

const centrosFiltrados = computed(() => {
  if (!term.value) return centros.value
  return centros.value.filter(cd => matches(cd) || tiendasDe(cd).some(matches))
})
const tiendasFiltradas = (cd: Almacen) => tiendasDe(cd).filter(matches)
const sinAsignarFiltrado = computed(() => sinAsignar.value.filter(matches))
const sinResultados = computed(() => !!term.value && centrosFiltrados.value.length === 0 && sinAsignarFiltrado.value.length === 0)

// --- Dropdown "agregar/asignar": un solo dropdown abierto a la vez, cierre al hacer click afuera ---
const openDropdown = ref<string | null>(null)
const dropdownSearch = ref('')

const toggleDropdown = (key: string) => {
  openDropdown.value = openDropdown.value === key ? null : key
  dropdownSearch.value = ''
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('[data-dropdown-root]')) openDropdown.value = null
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

const candidatosParaAgregar = computed(() => {
  const q = dropdownSearch.value.toLowerCase().trim()
  return sinAsignar.value.filter(t => !q || t.code.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q))
})
const centrosParaAsignar = computed(() => {
  const q = dropdownSearch.value.toLowerCase().trim()
  return centros.value.filter(cd => !q || cd.code.toLowerCase().includes(q) || cd.name?.toLowerCase().includes(q))
})

// --- Modal de confirmación genérico (mismo patrón que SolicitarView) ---
const isConfirmModalOpen = ref(false)
const confirmMessage = ref('')
let confirmResolve: ((value: boolean) => void) | null = null

const showConfirm = (msg: string): Promise<boolean> => {
  confirmMessage.value = msg
  isConfirmModalOpen.value = true
  return new Promise((resolve) => { confirmResolve = resolve })
}

const handleConfirm = (result: boolean) => {
  isConfirmModalOpen.value = false
  if (confirmResolve) { confirmResolve(result); confirmResolve = null }
}

// --- Sincronización manual: caso excepcional. La sincronización real ocurre
// de forma automática; esto es solo un respaldo por si algo falla y hace
// falta forzarla, por eso pide confirmación y avisa mientras se ejecuta.
const syncing = ref(false)

const handleSync = async () => {
  const confirmed = await showConfirm('La sincronización de almacenes ya se ejecuta automáticamente. Solo ejecútala manualmente si sospechas que faltan tiendas o Centros de Distribución nuevos. ¿Deseas continuar?')
  if (!confirmed) return

  syncing.value = true
  try {
    await reposicionApi.syncAlmacenes()
    await fetchAlmacenes()
    notify.success({ title: 'Sincronización completada', message: 'Se actualizó el listado de almacenes.' })
  } catch (err: any) {
    notify.error({ title: 'Error al sincronizar', message: err.response?.data?.message || 'Intenta nuevamente en unos minutos.' })
  } finally {
    syncing.value = false
  }
}

// --- Asignar / desasignar tienda a un CD ---
const assignTienda = async (tienda: Almacen, cd: Almacen) => {
  if (!tienda.id) return
  openDropdown.value = null
  try {
    await reposicionApi.configurarAlmacen(tienda.id, { esCentroDistribucion: false, centroDistribucionId: cd.id ?? null })
    await fetchAlmacenes()
    notify.success({ title: 'Tienda asignada', message: `${tienda.code} ahora pertenece a ${cd.code}.` })
  } catch (err: any) {
    notify.error({ title: 'No se pudo asignar la tienda', message: err.response?.data?.message })
  }
}

const unassignTienda = async (tienda: Almacen) => {
  if (!tienda.id) return
  try {
    await reposicionApi.configurarAlmacen(tienda.id, { esCentroDistribucion: false, centroDistribucionId: null })
    await fetchAlmacenes()
    notify.success({ title: 'Tienda desasignada' })
  } catch (err: any) {
    notify.error({ title: 'No se pudo quitar la asignación', message: err.response?.data?.message })
  }
}

// --- Convertir tipo (tienda <-> CD): solo cuando no hay dependientes ---
const convertirEnCd = async (tienda: Almacen) => {
  if (!tienda.id) return
  const confirmed = await showConfirm(`¿Convertir "${tienda.code} — ${tienda.name}" en Centro de Distribución?`)
  if (!confirmed) return
  try {
    await reposicionApi.configurarAlmacen(tienda.id, { esCentroDistribucion: true, centroDistribucionId: null })
    await fetchAlmacenes()
    notify.success({ title: 'Ahora es un Centro de Distribución' })
  } catch (err: any) {
    notify.error({ title: 'No se pudo convertir', message: err.response?.data?.message })
  }
}

const convertirEnTienda = async (cd: Almacen) => {
  if (!cd.id || tiendasDe(cd).length > 0) return
  const confirmed = await showConfirm(`¿Convertir "${cd.code} — ${cd.name}" en tienda? Dejará de ser Centro de Distribución.`)
  if (!confirmed) return
  try {
    await reposicionApi.configurarAlmacen(cd.id, { esCentroDistribucion: false, centroDistribucionId: null })
    await fetchAlmacenes()
    notify.success({ title: 'Ahora es una tienda' })
  } catch (err: any) {
    notify.error({ title: 'No se pudo convertir', message: err.response?.data?.message })
  }
}

// --- Eliminar almacén (DELETE) ---
const deletingId = ref<number | null>(null)

const handleDelete = async (alm: Almacen) => {
  if (!alm.id) return
  const confirmed = await showConfirm(`¿Eliminar "${alm.code} — ${alm.name}"? Esta acción no se puede deshacer.`)
  if (!confirmed) return

  deletingId.value = alm.id
  try {
    await reposicionApi.deleteAlmacen(alm.id)
    await fetchAlmacenes()
    notify.success({ title: 'Almacén eliminado' })
  } catch (err: any) {
    notify.error({
      title: 'No se pudo eliminar',
      message: err.response?.data?.message || 'Verifica que no esté referenciado como Centro de Distribución de otra tienda.'
    })
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <BuildingOfficeIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span>{{ centros.length }} Centro(s) de Distribución · {{ sinAsignar.length }} almacén(es) sin centro de distribución</span>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative">
          <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar almacén..."
            class="w-full sm:w-56 pl-9 pr-4 py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border transition-all text-sm"
          />
        </div>

        <!-- Sincronización manual: acción secundaria/de respaldo, no el flujo principal -->
        <button
          @click="handleSync"
          :disabled="syncing"
          title="La sincronización ocurre automáticamente. Usa esto solo como respaldo si falta una tienda o CD nuevo."
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-60"
        >
          <ArrowPathIcon :class="['w-3.5 h-3.5', syncing && 'animate-spin']" />
          <span>{{ syncing ? 'Sincronizando…' : 'Sincronización manual' }}</span>
        </button>
      </div>
    </div>

    <!-- Aviso mientras corre la sincronización manual -->
    <div v-if="syncing" class="mb-4 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-center gap-2">
      <ExclamationTriangleIcon class="w-4 h-4 text-amber-500 flex-shrink-0" />
      <p class="text-xs text-amber-700 dark:text-amber-500 font-medium">Sincronizando almacenes, esto puede tardar unos segundos. No cierres esta ventana.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
        <div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-48 mb-3"></div>
        <div class="h-6 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <!-- Sin resultados de búsqueda -->
      <div v-if="sinResultados" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center text-gray-400 dark:text-gray-500">
        <Squares2X2Icon class="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No se encontraron almacenes.</p>
      </div>

      <!-- Tarjetas por Centro de Distribución -->
      <div
        v-for="cd in centrosFiltrados"
        :key="cd.code"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
              Centro de Distribución
            </span>
            <div>
              <span class="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded mr-1.5">{{ cd.code }}</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ cd.name }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="convertirEnTienda(cd)"
              :disabled="tiendasDe(cd).length > 0"
              :title="tiendasDe(cd).length > 0 ? `Tiene ${tiendasDe(cd).length} tienda(s) asignada(s); reasígnalas primero` : 'Convertir en tienda'"
              class="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUturnLeftIcon class="w-3.5 h-3.5" />
              <span>Convertir en tienda</span>
            </button>
            <button
              @click="handleDelete(cd)"
              :disabled="tiendasDe(cd).length > 0 || deletingId === cd.id"
              :title="tiendasDe(cd).length > 0 ? `Tiene ${tiendasDe(cd).length} tienda(s) asignada(s); reasígnalas primero` : 'Eliminar'"
              class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            v-for="tienda in tiendasFiltradas(cd)"
            :key="tienda.code"
            :title="tienda.name"
            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-medium"
          >
            {{ tienda.code }}
            <button @click="unassignTienda(tienda)" title="Quitar de este CD" class="hover:text-emerald-900 dark:hover:text-white leading-none">
              <XMarkIcon class="w-3.5 h-3.5" />
            </button>
          </span>

          <!-- Dropdown: agregar tienda a este CD -->
          <div class="relative" data-dropdown-root>
            <button
              @click="toggleDropdown(`add-${cd.code}`)"
              class="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              <span>Agregar tienda</span>
            </button>
            <div
              v-if="openDropdown === `add-${cd.code}`"
              class="absolute z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
              <div class="p-2 border-b border-gray-100 dark:border-gray-800">
                <input
                  v-model.trim="dropdownSearch"
                  autofocus
                  type="text"
                  placeholder="Buscar tienda..."
                  class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div class="max-h-52 overflow-y-auto py-1">
                <div v-if="candidatosParaAgregar.length === 0" class="px-3 py-2 text-xs text-gray-400">No hay almacenes sin asignar.</div>
                <button
                  v-else
                  v-for="tienda in candidatosParaAgregar"
                  :key="tienda.code"
                  type="button"
                  class="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left"
                  @click="assignTienda(tienda, cd)"
                >
                  <span class="font-bold">{{ tienda.code }}</span>
                  <span class="text-gray-400 truncate">{{ tienda.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tarjeta: Almacenes sin asignar -->
      <div v-if="sinAsignarFiltrado.length > 0 || !term" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-dashed dark:border-gray-700 border-dashed p-5">
        <div class="flex items-center gap-2 mb-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
            Almacenes sin asignación
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">Almacenes pendientes de asignación</span>
        </div>

        <div v-if="sinAsignarFiltrado.length === 0" class="text-xs text-gray-400 dark:text-gray-500 py-2">
          Todos los almacenes se encuentran asignados.
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
          <div v-for="tienda in sinAsignarFiltrado" :key="tienda.code" class="flex flex-wrap items-center justify-between gap-2 py-2">
            <div>
              <span class="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded mr-1.5">{{ tienda.code }}</span>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ tienda.name }}</span>
            </div>

            <div class="flex items-center gap-1.5">
              <div class="relative" data-dropdown-root>
                <button
                  @click="toggleDropdown(`assign-${tienda.code}`)"
                  :disabled="centros.length === 0"
                  class="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
                >
                  <span>Asignar centro de distribución</span>
                </button>
                <div
                  v-if="openDropdown === `assign-${tienda.code}`"
                  class="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                >
                  <div class="p-2 border-b border-gray-100 dark:border-gray-800">
                    <input
                      v-model.trim="dropdownSearch"
                      autofocus
                      type="text"
                      placeholder="Buscar CD..."
                      class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div class="max-h-52 overflow-y-auto py-1">
                    <button
                      v-for="cd in centrosParaAsignar"
                      :key="cd.code"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left"
                      @click="assignTienda(tienda, cd)"
                    >
                      <span class="font-bold">{{ cd.code }}</span>
                      <span class="text-gray-400 truncate">{{ cd.name }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                @click="convertirEnCd(tienda)"
                class="px-2.5 py-1 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-200 dark:border-purple-800 transition-colors"
              >
                Convertir en centro de distribución
              </button>

              <button
                @click="handleDelete(tienda)"
                :disabled="deletingId === tienda.id"
                title="Eliminar"
                class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación genérico -->
    <TransitionRoot appear :show="isConfirmModalOpen" as="template">
      <Dialog as="div" @close="handleConfirm(false)" class="relative z-50">
        <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="duration-200 ease-in" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
              <DialogPanel class="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-center align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-700">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                  <QuestionMarkCircleIcon class="h-10 w-10 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>

                <DialogTitle as="h3" class="text-xl font-bold leading-6 text-gray-900 dark:text-white mb-2">
                  Confirmar acción
                </DialogTitle>

                <div class="mt-2">
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ confirmMessage }}</p>
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
