<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4 mb-6">
      <VolverButton
        to="/inventario"
        title="Volver al módulo Inventario"
        class="shrink-0 self-start"
      />
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Inventarios Generados</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Consulta los inventarios generados desde planificación.</p>
      </div>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <button class="btn-secondary" type="button" @click="load">Refrescar</button>
      </div>
    </div>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
      {{ error }}
    </div>

    <div class="mb-4 flex items-center gap-2">
      <input
        v-model="search"
        type="search"
        placeholder="Buscar código, almacén..."
        class="search-input w-56"
      />
    </div>

    <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="loading" class="p-6 text-gray-600 dark:text-gray-300">Cargando inventarios...</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th cursor-pointer select-none" @click="toggleSort('inventory_code')">Código{{ sortIndicator('inventory_code') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('warehouse')">Almacén{{ sortIndicator('warehouse') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('inventory_type')">Tipo{{ sortIndicator('inventory_type') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('classification')">Clasificación{{ sortIndicator('classification') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('status')">Estado{{ sortIndicator('status') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('progress')">Avance{{ sortIndicator('progress') }}</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="inventory in sortedInventories" :key="inventory.id">
              <td class="td">
                <div class="font-medium text-gray-900 dark:text-white">{{ inventory.inventory_code }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(inventory.created_at) }}</div>
              </td>
              <td class="td">{{ inventory.warehouse || '-' }}</td>
              <td class="td">{{ inventoryTypeLabel(inventory.inventory_type) }}</td>
              <td class="td">{{ [inventory.level1, inventory.level2].filter(Boolean).join(' / ') || '-' }}</td>
              <td class="td">{{ inventory.status }}</td>
              <td class="td">
                <div class="w-36 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full" :style="{ width: `${progress(inventory)}%` }"></div>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ inventory.counted_items }}/{{ inventory.total_items }}</span>
              </td>
              <td class="td text-right">
                <button class="link" type="button" @click="router.push(`/inventario/generados/${inventory.id}`)">Ver detalle</button>
              </td>
            </tr>
            <tr v-if="sortedInventories.length === 0">
              <td class="td text-center" colspan="7">No hay inventarios generados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import VolverButton from '@/components/navegacion/VolverButton.vue'
import { inventarioService } from '../services/inventarioApi'
import type { GeneratedInventoryDto } from '../types'
import { inventoryTypeLabel } from '../utils/planningRules'

const router = useRouter()
const inventories = ref<GeneratedInventoryDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

type InventorySortKey = 'inventory_code' | 'warehouse' | 'inventory_type' | 'classification' | 'status' | 'progress'
const sortKey = ref<InventorySortKey>('inventory_code')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: InventorySortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key: InventorySortKey) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    inventories.value = await inventarioService.getInventories()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudieron cargar los inventarios.'
  } finally {
    loading.value = false
  }
}

function progress(inventory: GeneratedInventoryDto) {
  if (!inventory.total_items) return 0
  return Math.min(100, Math.round((inventory.counted_items / inventory.total_items) * 100))
}

function classificationLabel(inventory: GeneratedInventoryDto) {
  return [inventory.level1, inventory.level2].filter(Boolean).join(' / ')
}

function sortValue(inventory: GeneratedInventoryDto, key: InventorySortKey): string | number {
  switch (key) {
    case 'inventory_type':
      return inventoryTypeLabel(inventory.inventory_type)
    case 'classification':
      return classificationLabel(inventory)
    case 'progress':
      return progress(inventory)
    default:
      return inventory[key] ?? ''
  }
}

const filteredInventories = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return inventories.value
  return inventories.value.filter(inventory =>
    inventory.inventory_code.toLowerCase().includes(q) ||
    (inventory.warehouse ?? '').toLowerCase().includes(q) ||
    inventoryTypeLabel(inventory.inventory_type).toLowerCase().includes(q) ||
    classificationLabel(inventory).toLowerCase().includes(q)
  )
})

const sortedInventories = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredInventories.value].sort((a, b) => {
    const av = sortValue(a, key)
    const bv = sortValue(b, key)
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv)) * dir
    }
    return ((av as number) - (bv as number)) * dir
  })
})

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

onMounted(load)
</script>

<style scoped>
.btn-secondary {
  @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700;
}
.th {
  @apply px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400;
}
.td {
  @apply px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-top;
}
.link {
  @apply text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300;
}
.search-input {
  @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
}
</style>
