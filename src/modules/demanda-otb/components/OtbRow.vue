<template>
  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <td class="pl-3">
      <button
        v-if="row.nivel1 && row.nivel2 && row.nivel3"
        type="button"
        class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        @click="toggleExpand"
      >
        <ChevronDownIcon v-if="expanded" class="w-4 h-4" />
        <ChevronRightIcon v-else class="w-4 h-4" />
      </button>
    </td>
    <td class="px-3 py-2 text-gray-900 dark:text-white">{{ row.nivel1 ?? '—' }}</td>
    <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ row.nivel2 ?? '—' }}</td>
    <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ row.nivel3 ?? '—' }}</td>
    <td class="px-3 py-2 text-gray-500 dark:text-gray-400">{{ row.genero ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-900 dark:text-white font-medium">{{ row.skus ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.stockInicial ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.stockDia ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.transito ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.min80 ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.ventasPlanificada ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.max80 ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.catNuevo ?? '—' }}</td>
    <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{{ row.ventasTotal ?? '—' }}</td>
    <td class="px-3 py-2 text-right">
      <input
        type="number"
        min="0"
        class="w-16 text-right rounded border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-sm py-1 px-1.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border"
        :value="calc.coberturaDeseadaValue(row)"
        @change="calc.setCoberturaDeseada(row, Number(($event.target as HTMLInputElement).value))"
      />
    </td>
    <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{{ calc.invFinalPlanificado(row).toFixed(1) }}</td>
    <td class="px-3 py-2">
      <span class="flex items-center gap-1.5 font-medium" :class="semaforoColor(row.semaforo)">
        <span class="w-2 h-2 rounded-full flex-shrink-0" :class="semaforoDot(row.semaforo)"></span>
        {{ row.semaforo || '—' }}
      </span>
    </td>
    <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.coberturaDias ?? '—' }}</td>
    <td class="px-3 py-2">
      <span v-if="row.tendencia" class="flex items-center gap-1" :class="tendenciaColor(row.tendencia)">
        <ArrowTrendingUpIcon v-if="row.tendencia.toUpperCase() === 'ACELERANDO'" class="w-3.5 h-3.5" />
        <ArrowTrendingDownIcon v-else-if="row.tendencia.toUpperCase() === 'DESACELERANDO'" class="w-3.5 h-3.5" />
        <MinusIcon v-else class="w-3.5 h-3.5" />
        {{ row.tendencia }}
      </span>
      <span v-else class="text-gray-400">—</span>
    </td>
    <td class="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-[220px] truncate" :title="row.decisionOtb ?? ''">{{ row.decisionOtb || '—' }}</td>
    <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{{ calc.otbUnidades(row).toFixed(1) }}</td>
    <td class="px-3 py-2 text-right">
      <input
        type="number"
        min="0"
        class="w-16 text-right rounded border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-sm py-1 px-1.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border"
        :value="calc.pedidoValue(row)"
        @change="calc.setPedido(row, Number(($event.target as HTMLInputElement).value))"
      />
    </td>
    <td class="px-3 py-2 text-center">
      <input
        v-if="row.nivel3"
        type="checkbox"
        :checked="calc.exportSelectedRows.has(rowKey(row))"
        @change="calc.toggleExportRow(row)"
      />
    </td>
  </tr>

  <tr v-if="expanded && loadingSkus">
    <td></td>
    <td colspan="22" class="px-4 py-2 text-xs text-gray-400">Cargando SKUs...</td>
  </tr>
  <tr v-if="expanded && errorSkus">
    <td></td>
    <td colspan="22" class="px-4 py-2 text-xs text-red-600 dark:text-red-400">{{ errorSkus }}</td>
  </tr>
  <tr
    v-for="sku in (expanded ? skus ?? [] : [])"
    :key="sku.codigo"
    class="bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-colors"
  >
    <td></td>
    <td colspan="4" class="px-3 py-2 text-blue-700 dark:text-blue-400 font-medium">
      {{ sku.codigo }} — {{ sku.nombre }} <span class="text-gray-400 dark:text-gray-500 font-normal">[{{ negocio }}]</span>
    </td>
    <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">1</td>
    <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{{ sku.stockInicial ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
    <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
    <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
    <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{{ sku.predUnidades ?? '—' }}</td>
    <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
    <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
    <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
    <td class="px-3 py-2 text-right">
      <input
        type="number"
        min="0"
        class="w-16 text-right rounded border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-sm py-1 px-1.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border"
        :value="calc.coberturaDeseadaSkuValue(sku)"
        @change="calc.setCoberturaDeseadaSku(sku, Number(($event.target as HTMLInputElement).value))"
      />
    </td>
    <td class="px-3 py-2 text-right font-medium text-blue-700 dark:text-blue-400" title="Estimado sin Tránsito por SKU">{{ calc.invFinalPlanificadoSku(sku).toFixed(1) }}</td>
    <td class="px-3 py-2">
      <span class="flex items-center gap-1.5" :class="semaforoColor(sku.semaforo)">
        <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="semaforoDot(sku.semaforo)"></span>
        {{ sku.semaforo ?? '—' }}
      </span>
    </td>
    <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{{ sku.coberturaDias ?? '—' }}</td>
    <td class="px-3 py-2 text-gray-400">—</td>
    <td class="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-[220px] truncate" :title="sku.decisionOtb ?? ''">{{ sku.decisionOtb || '—' }}</td>
    <td class="px-3 py-2 text-right font-medium text-blue-700 dark:text-blue-400" title="Estimado sin Tránsito por SKU">{{ calc.otbUnidadesSku(sku).toFixed(1) }}</td>
    <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{{ sku.pedido ?? '—' }}</td>
    <td></td>
  </tr>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRightIcon, ChevronDownIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/vue/24/outline'
import { getOtbSkus } from '../services/demandaOtbApi'
import { rowKey, semaforoColor, semaforoDot, tendenciaColor, type OtbCalculations } from '../composables/useOtbCalculations'
import type { NodoFila, OtbSkuItem } from '../types'

const props = defineProps<{
  row: NodoFila
  negocio: string
  fecha: string
  calc: OtbCalculations
}>()

// Expandir/colapsar + caché de SKUs del drill-down — 100% local a la fila (nada fuera de
// acá necesita saber si está expandida), a diferencia de Cobertura Deseada/Pedido/selección
// para Excel que sí son compartidos (ver props.calc). El :key de OtbView.vue cambia en cada
// recarga de datos, así que esta instancia (y este estado local) se recrea desde cero — no
// hace falta limpiarlo a mano como antes con los Maps globales.
const expanded = ref(false)
const skus = ref<OtbSkuItem[] | null>(null)
const loadingSkus = ref(false)
const errorSkus = ref<string | null>(null)

async function toggleExpand() {
  if (expanded.value) {
    expanded.value = false
    return
  }
  expanded.value = true
  if (skus.value !== null || loadingSkus.value) return

  loadingSkus.value = true
  errorSkus.value = null
  try {
    const resultado = await getOtbSkus(props.negocio, props.row.nivel1 ?? '', props.row.nivel2 ?? '', props.row.nivel3 ?? '', props.fecha)
    skus.value = resultado.skus
  } catch (e) {
    errorSkus.value = e instanceof Error ? e.message : 'Error consultando los SKUs de este nodo.'
  } finally {
    loadingSkus.value = false
  }
}
</script>
