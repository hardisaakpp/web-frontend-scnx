<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4 mb-6">
      <OdcSapVolverButton
        to="/inventario/generados"
        title="Volver a inventarios generados"
        class="shrink-0 self-start"
      />
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Detalle de Inventario</h1>
      </div>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-gray-600 dark:text-gray-300">
      Cargando detalle...
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300">
      {{ error }}
    </div>

    <div v-else-if="detail" class="space-y-6">
      <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <InfoItem label="Código" :value="detail.header.inventory_code" />
          <InfoItem label="Almacén" :value="warehouseLabel" />
          <InfoItem label="Planificación" :value="detail.header.planning_name || '-'" />
          <InfoItem label="Estado" :value="detail.header.status" />
          <InfoItem label="Tipo" :value="inventoryTypeLabel(detail.header.inventory_type)" />
          <InfoItem label="Nivel 1" :value="detail.header.level1 || '-'" />
          <InfoItem label="Nivel 2" :value="detail.header.level2 || '-'" />
          <InfoItem label="Creado" :value="formatDate(detail.header.created_at)" />
        </div>
      </section>

      <section class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total" :value="detail.stats.total" hint="Agregado API" />
        <Stat label="Contados" :value="detail.stats.counted" hint="Agregado API" />
        <Stat label="Diferencias" :value="detail.stats.with_difference" hint="Agregado API" />
        <Stat label="Cuadrados" :value="detail.stats.balanced" hint="Agregado API" />
        <Stat label="Procesado" :value="`${detail.stats.processed_percent}%`" hint="Agregado API" />
      </section>

      <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Artículos</h2>
          <input
            v-model="search"
            type="search"
            placeholder="Buscar código, artículo..."
            class="search-input w-56"
          />
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th class="th cursor-pointer select-none" @click="toggleSort('item_code')">Código{{ sortIndicator('item_code') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('item_name')">Artículo{{ sortIndicator('item_name') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('stock_sap')">SAP{{ sortIndicator('stock_sap') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('stock_physical')">Físico{{ sortIndicator('stock_physical') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('recount')">Reconteo{{ sortIndicator('recount') }}</th>
                <th class="th cursor-pointer select-none" @click="toggleSort('difference')">Diferencia{{ sortIndicator('difference') }}</th>
                <th class="th">Conteo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in sortedItems" :key="item.id">
                <td class="td">
                  <div class="font-medium text-gray-900 dark:text-white">{{ item.item_code }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.barcode || '-' }}</div>
                </td>
                <td class="td">{{ item.item_name || '-' }}</td>
                <td class="td">{{ formatNumber(item.stock_sap) }}</td>
                <td class="td">{{ formatNumber(item.stock_physical) }}</td>
                <td class="td">{{ formatNumber(item.recount) }}</td>
                <td class="td" :class="item.difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ formatNumber(item.difference) }}
                </td>
                <td class="td">
                  <div>{{ item.counted_by || '-' }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(item.counted_at) }}</div>
                </td>
              </tr>
              <tr v-if="detail.items.length" class="bg-gray-50/80 dark:bg-gray-900/40 font-medium">
                <td class="td text-gray-900 dark:text-white" colspan="2">
                  Suma en pantalla (referencia)
                  <span class="block text-xs font-normal text-gray-500 dark:text-gray-400">No bloquea guardado; use las tarjetas superiores como fuente oficial.</span>
                </td>
                <td class="td">{{ formatNumber(rowSums.stockSap) }}</td>
                <td class="td">{{ formatNumber(rowSums.stockPhysical) }}</td>
                <td class="td">{{ formatNumber(rowSums.recount) }}</td>
                <td class="td" :class="rowSums.difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                  {{ formatNumber(rowSums.difference) }}
                </td>
                <td class="td">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import { inventarioService } from '../services/inventarioApi'
import type { InventoryDetailDto } from '../types'
import { inventoryTypeLabel } from '../utils/planningRules'

const route = useRoute()
const detail = ref<InventoryDetailDto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const search = ref('')

type InventoryItemSortKey = 'item_code' | 'item_name' | 'stock_sap' | 'stock_physical' | 'recount' | 'difference'
const sortKey = ref<InventoryItemSortKey>('item_code')
const sortDir = ref<'asc' | 'desc'>('asc')

function toggleSort(key: InventoryItemSortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key: InventoryItemSortKey) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

const filteredItems = computed(() => {
  const items = detail.value?.items ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return items
  return items.filter(item =>
    item.item_code.toLowerCase().includes(q) ||
    (item.item_name ?? '').toLowerCase().includes(q) ||
    (item.barcode ?? '').toLowerCase().includes(q)
  )
})

const sortedItems = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...filteredItems.value].sort((a, b) => {
    const av = a[key] ?? (typeof a[key] === 'number' ? 0 : '')
    const bv = b[key] ?? (typeof b[key] === 'number' ? 0 : '')
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv)) * dir
    }
    return ((av as number) - (bv as number)) * dir
  })
})

const warehouseLabel = computed(() => {
  const header = detail.value?.header
  if (!header) return '-'
  return [header.warehouse_code, header.warehouse_name].filter(Boolean).join(' - ') || '-'
})

/** Sumas locales informativas (stock SAP ya consolidado por ItemCode en ejecución). */
const rowSums = computed(() => {
  const items = detail.value?.items ?? []
  let stockSap = 0
  let stockPhysical = 0
  let recount = 0
  let difference = 0
  let hasPhysical = false
  let hasRecount = false

  for (const item of items) {
    stockSap += item.stock_sap ?? 0
    difference += item.difference ?? 0
    if (item.stock_physical != null) {
      hasPhysical = true
      stockPhysical += item.stock_physical
    }
    if (item.recount != null) {
      hasRecount = true
      recount += item.recount
    }
  }

  return {
    stockSap,
    stockPhysical: hasPhysical ? stockPhysical : null,
    recount: hasRecount ? recount : null,
    difference
  }
})

const InfoItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true }
  },
  setup(props) {
    return () => h('div', [
      h('div', { class: 'text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400' }, props.label),
      h('div', { class: 'mt-1 text-sm font-medium text-gray-900 dark:text-white' }, String(props.value))
    ])
  }
})

const Stat = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    hint: { type: String, default: '' }
  },
  setup(props) {
    return () => h('div', { class: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4' }, [
      h('div', { class: 'text-2xl font-semibold text-gray-900 dark:text-white' }, String(props.value)),
      h('div', { class: 'mt-1 text-xs text-gray-500 dark:text-gray-400' }, props.label),
      props.hint ? h('div', { class: 'mt-0.5 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500' }, props.hint) : null
    ])
  }
})

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await inventarioService.getInventoryDetail(Number(route.params.id))
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el detalle del inventario.'
  } finally {
    loading.value = false
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function formatNumber(value?: number | null) {
  return value === null || value === undefined ? '-' : new Intl.NumberFormat().format(value)
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
.search-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
