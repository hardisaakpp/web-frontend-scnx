<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Planes Pendientes</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Planificaciones programadas que aún no han sido ejecutadas.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
        <router-link to="/inventario/consultar-stock" class="btn-secondary">
          <MagnifyingGlassIcon class="w-4 h-4 mr-1" />
          Consultar Stock
        </router-link>
        <router-link to="/inventario/planes/historial" class="btn-secondary">
          Ver historial
        </router-link>
        <button type="button" class="btn-primary" @click="mostrarModal = true">
          <PlusIcon class="w-4 h-4 mr-1" />
          Nuevo plan
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>
    <div v-if="exito" class="mb-4 alert-success">{{ exito }}</div>

    <div class="mb-4 flex items-center gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Buscar bodega, descripción..."
        class="search-input w-64"
      />
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="loading && planes.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
      <div v-else-if="planes.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay planes pendientes.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th cursor-pointer select-none" @click="toggleSort('warehouseCode')">Bodega{{ sortIndicator('warehouseCode') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('description')">Descripción{{ sortIndicator('description') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('plannedOpenDate')">Apertura{{ sortIndicator('plannedOpenDate') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('plannedCloseDate')">Cierre{{ sortIndicator('plannedCloseDate') }}</th>
              <th class="th">Filtros</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('createdAt')">Creado{{ sortIndicator('createdAt') }}</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="plan in sortedPlanes"
              :key="plan.planId"
              :class="estaVencido(plan) ? 'bg-red-50 dark:bg-red-950/30' : ''"
            >
              <td class="td font-mono text-xs">{{ plan.warehouseCode }}</td>
              <td class="td">
                <span v-if="plan.description">{{ plan.description }}</span>
                <span v-else class="text-gray-400 dark:text-gray-600 italic">—</span>
              </td>
              <td class="td whitespace-nowrap" :class="estaVencido(plan) ? 'text-red-700 dark:text-red-400 font-medium' : ''">
                {{ formatDate(plan.plannedOpenDate) }}
              </td>
              <td class="td whitespace-nowrap">{{ formatDate(plan.plannedCloseDate) }}</td>
              <td class="td">
                <div v-if="plan.filters.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="f in plan.filters.slice(0, 4)"
                    :key="f.filterType + f.filterValue"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {{ f.filterType }}:{{ f.filterValue }}
                  </span>
                  <span v-if="plan.filters.length > 4" class="text-xs text-gray-400 dark:text-gray-500">
                    +{{ plan.filters.length - 4 }}
                  </span>
                </div>
                <span v-else class="text-gray-400 dark:text-gray-600 italic text-xs">Sin filtros</span>
              </td>
              <td class="td whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                {{ formatDateTime(plan.createdAt) }}
              </td>
              <td class="td text-right whitespace-nowrap">
                <div class="flex justify-end gap-3">
                  <button
                    type="button"
                    class="link"
                    :disabled="ejecutando === plan.planId"
                    @click="ejecutar(plan)"
                  >
                    {{ ejecutando === plan.planId ? 'Ejecutando...' : 'Ejecutar ahora' }}
                  </button>
                  <button
                    type="button"
                    class="link-danger"
                    :disabled="eliminando === plan.planId"
                    @click="confirmarEliminar(plan)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CrearPlanModal
      :is-open="mostrarModal"
      @close="mostrarModal = false"
      @creado="onPlanCreado"
    />

    <!-- Confirm delete -->
    <TransitionRoot :show="!!planAEliminar" as="template">
      <Dialog as="div" class="relative z-50" @close="planAEliminar = null">
        <TransitionChild enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black bg-opacity-30" />
        </TransitionChild>
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
            <DialogPanel class="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
              <DialogTitle class="text-base font-semibold text-gray-900 dark:text-white mb-2">Eliminar plan</DialogTitle>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                ¿Eliminar el plan de bodega <strong>{{ planAEliminar?.warehouseCode }}</strong>? Esta acción no se puede deshacer.
              </p>
              <div class="flex justify-end gap-3">
                <button type="button" class="btn-secondary" @click="planAEliminar = null">Cancelar</button>
                <button type="button" class="btn-danger" :disabled="!!eliminando" @click="eliminar">
                  {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { ArrowPathIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { inventarioPlanesService } from '../services/inventarioPlanesApi'
import type { InventoryPlanDto } from '../types'
import CrearPlanModal from '../components/CrearPlanModal.vue'

const planes = ref<InventoryPlanDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const exito = ref<string | null>(null)
const mostrarModal = ref(false)
const ejecutando = ref<string | null>(null)
const eliminando = ref<string | null>(null)
const planAEliminar = ref<InventoryPlanDto | null>(null)
const search = ref('')

type PlanSortKey = 'warehouseCode' | 'description' | 'plannedOpenDate' | 'plannedCloseDate' | 'createdAt'
const sortKey = ref<PlanSortKey>('plannedOpenDate')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: PlanSortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key: PlanSortKey) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

const filteredPlanes = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return planes.value
  return planes.value.filter(p =>
    p.warehouseCode.toLowerCase().includes(q) ||
    (p.description ?? '').toLowerCase().includes(q)
  )
})

const sortedPlanes = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredPlanes.value].sort((a, b) => {
    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    return String(av).localeCompare(String(bv)) * dir
  })
})

const today = new Date().toISOString().slice(0, 10)

function estaVencido(plan: InventoryPlanDto): boolean {
  return plan.plannedOpenDate < today
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  return value.slice(0, 10)
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    planes.value = await inventarioPlanesService.getPlanes('Planned')
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar planes.'
  } finally {
    loading.value = false
  }
}

async function ejecutar(plan: InventoryPlanDto) {
  ejecutando.value = plan.planId
  error.value = null
  exito.value = null
  try {
    await inventarioPlanesService.executePlan(plan.planId)
    exito.value = `Plan de bodega ${plan.warehouseCode} ejecutado. Sesión de inventario creada.`
    await cargar()
  } catch (e: any) {
    error.value = e.message ?? 'Error al ejecutar el plan.'
  } finally {
    ejecutando.value = null
  }
}

function confirmarEliminar(plan: InventoryPlanDto) {
  planAEliminar.value = plan
}

async function eliminar() {
  if (!planAEliminar.value) return
  eliminando.value = planAEliminar.value.planId
  error.value = null
  try {
    await inventarioPlanesService.deletePlan(planAEliminar.value.planId)
    exito.value = `Plan eliminado.`
    planAEliminar.value = null
    await cargar()
  } catch (e: any) {
    error.value = e.message ?? 'Error al eliminar el plan.'
  } finally {
    eliminando.value = null
  }
}

function onPlanCreado(cantidad: number) {
  mostrarModal.value = false
  exito.value = `${cantidad} plan${cantidad !== 1 ? 'es' : ''} creado${cantidad !== 1 ? 's' : ''} correctamente.`
  cargar()
}

onMounted(cargar)
</script>

<style scoped>
.label { @apply text-sm font-medium text-gray-700 dark:text-gray-300; }
.th { @apply px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.search-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.td { @apply px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle; }
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-danger { @apply inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.link { @apply text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed; }
.link-danger { @apply text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.alert-success { @apply rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300; }
</style>
