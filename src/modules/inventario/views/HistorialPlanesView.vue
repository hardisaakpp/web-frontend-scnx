<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Planes</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Planes ya ejecutados — el plan no se borra al ejecutarse, queda aquí junto a la toma física que generó.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <router-link to="/inventario/planes" class="btn-secondary">Volver a Planes Pendientes</router-link>
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
      </div>
    </div>

    <div class="mb-4 flex items-center gap-3 flex-wrap">
      <label class="text-sm text-gray-600 dark:text-gray-400" for="desde">Desde</label>
      <input id="desde" v-model="desde" type="date" class="date-input" @change="cargar" />
      <span class="text-xs text-gray-400">Por defecto, últimos 15 días.</span>
      <input
        v-model="search"
        type="search"
        placeholder="Buscar bodega, descripción..."
        class="search-input w-64"
      />
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="loading && planes.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
      <div v-else-if="planes.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay planes ejecutados en el rango de fechas seleccionado.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th cursor-pointer select-none" @click="toggleSort('warehouseCode')">Bodega{{ sortIndicator('warehouseCode') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('description')">Descripción{{ sortIndicator('description') }}</th>
              <th class="th">Filtros</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('createdAt')">Creado{{ sortIndicator('createdAt') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('executedAt')">Ejecutado{{ sortIndicator('executedAt') }}</th>
              <th class="th">Ejecutado por</th>
              <th class="th text-right">Toma física</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="plan in sortedPlanes" :key="plan.planId">
              <td class="td font-mono text-xs">{{ plan.warehouseCode }}</td>
              <td class="td">
                <span v-if="plan.description">{{ plan.description }}</span>
                <span v-else class="text-gray-400 dark:text-gray-600 italic">—</span>
              </td>
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
              <td class="td whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(plan.createdAt) }}</td>
              <td class="td whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(plan.executedAt) }}</td>
              <td class="td text-xs">{{ nombreUsuario(plan.executedByUserId) }}</td>
              <td class="td text-right whitespace-nowrap">
                <router-link
                  v-if="plan.inventorySessionId"
                  class="link"
                  :to="{ name: 'inventario-sesion-detalle', params: { sessionId: plan.inventorySessionId } }"
                >
                  Ver sesión
                </router-link>
                <span v-else class="text-gray-400 dark:text-gray-600 italic text-xs">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import { inventarioPlanesService } from '../services/inventarioPlanesApi'
import { resolveUserNames } from '@/utils/resolveUserNames'
import type { InventoryPlanDto } from '../types'

const planes = ref<InventoryPlanDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const usuarioNombreById = ref<Record<string, string>>({})

function defaultDesde(): string {
  const d = new Date()
  d.setDate(d.getDate() - 15)
  return d.toISOString().slice(0, 10)
}

const desde = ref(defaultDesde())

type PlanSortKey = 'warehouseCode' | 'description' | 'createdAt' | 'executedAt'
const sortKey = ref<PlanSortKey>('executedAt')
const sortDir = ref<'asc' | 'desc'>('desc')

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

function nombreUsuario(id?: string | null): string {
  if (!id) return '—'
  return usuarioNombreById.value[id] || id
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
    const since = desde.value ? new Date(desde.value).toISOString() : undefined
    planes.value = await inventarioPlanesService.getPlanes('Executed', since)

    const ids = [...new Set(planes.value.map(p => p.executedByUserId).filter((id): id is string => !!id))]
    usuarioNombreById.value = ids.length ? await resolveUserNames(ids) : {}
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar el historial de planes.'
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.link { @apply text-blue-600 dark:text-blue-400 hover:underline; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.th { @apply px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300; }
.date-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.search-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
