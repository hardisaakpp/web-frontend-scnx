<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Detalle de Inventario</h1>
      </div>
      <button class="btn-secondary" type="button" @click="router.push('/inventario/generados')">Volver</button>
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
          <InfoItem label="Tipo" :value="detail.header.inventory_type" />
          <InfoItem label="Nivel 1" :value="detail.header.level1 || '-'" />
          <InfoItem label="Nivel 2" :value="detail.header.level2 || '-'" />
          <InfoItem label="Creado" :value="formatDate(detail.header.created_at)" />
        </div>
      </section>

      <section class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total" :value="detail.stats.total" />
        <Stat label="Contados" :value="detail.stats.counted" />
        <Stat label="Diferencias" :value="detail.stats.with_difference" />
        <Stat label="Cuadrados" :value="detail.stats.balanced" />
        <Stat label="Procesado" :value="`${detail.stats.processed_percent}%`" />
      </section>

      <section class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Artículos</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th class="th">Código</th>
                <th class="th">Artículo</th>
                <th class="th">SAP</th>
                <th class="th">Físico</th>
                <th class="th">Reconteo</th>
                <th class="th">Diferencia</th>
                <th class="th">Conteo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in detail.items" :key="item.id">
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
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inventarioService } from '../services/inventarioApi'
import type { InventoryDetailDto } from '../types'

const route = useRoute()
const router = useRouter()
const detail = ref<InventoryDetailDto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const warehouseLabel = computed(() => {
  const header = detail.value?.header
  if (!header) return '-'
  return [header.warehouse_code, header.warehouse_name].filter(Boolean).join(' - ') || '-'
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
    value: { type: [String, Number], required: true }
  },
  setup(props) {
    return () => h('div', { class: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4' }, [
      h('div', { class: 'text-2xl font-semibold text-gray-900 dark:text-white' }, String(props.value)),
      h('div', { class: 'mt-1 text-xs text-gray-500 dark:text-gray-400' }, props.label)
    ])
  }
})

async function load() {
  loading.value = true
  error.value = null
  try {
    detail.value = await inventarioService.getInventoryDetail(Number(route.params.id))
  } catch (err: any) {
    error.value = err?.message || 'No se pudo cargar el detalle del inventario.'
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
</style>
