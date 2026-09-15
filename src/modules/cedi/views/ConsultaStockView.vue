<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownTrayIcon, MagnifyingGlassIcon, QrCodeIcon } from '@heroicons/vue/24/outline'
import { useConsultaStockStore } from '../stores/consultaStockStore'
import { useToast } from '@/composables/useToast'
import { downloadCsv } from '../utils/exportCsv'
import type { StockAlmacenDto } from '../types'

// P-012 — CEDI_MODULO_FLUJO.md §4 (articulo.php): búsqueda por código/EAN, stock por
// almacén, exportar a Excel. Sin nivel de bin/ubicación (gap real de SAP Service Layer,
// ver docs/PROGRESO.md) — a nivel almacén es lo que hoy expone SAP vía
// ItemWarehouseInfoCollection.

const store = useConsultaStockStore()
const toast = useToast()

const totalEnStock = computed(() =>
  (store.stock?.almacenes ?? []).reduce((acc, a) => acc + a.enStock, 0))

async function onBuscar() {
  await store.buscar()
  if (store.error) toast.error('No se pudo buscar', store.error)
  else if (store.resultados.length === 0) toast.warning('Sin resultados', `Nada coincide con "${store.query}".`)
}

async function onVerStock(item: Parameters<typeof store.verStock>[0]) {
  await store.verStock(item)
  if (store.error) toast.error('No se pudo consultar el stock', store.error)
}

function onExportar() {
  if (!store.stock) return
  downloadCsv<StockAlmacenDto>(
    `stock_${store.stock.itemCode}.csv`,
    [
      { header: 'Artículo', key: () => store.stock!.itemCode },
      { header: 'Almacén', key: 'almacen' },
      { header: 'En stock', key: 'enStock' },
      { header: 'Comprometido', key: 'comprometido' },
      { header: 'Bloqueado', key: a => (a.bloqueado ? 'Sí' : 'No') },
    ],
    store.stock.almacenes,
  )
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Consulta de Stock</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Buscá por código de artículo o código de barras — se consulta directo a SAP, sin caché local.
      </p>
    </div>

    <form class="flex gap-3 mb-6" @submit.prevent="onBuscar">
      <div class="relative flex-1">
        <QrCodeIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="store.query"
          type="text"
          autofocus
          placeholder="Código de artículo o de barras..."
          class="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        :disabled="store.buscando"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold shadow-sm"
      >
        <MagnifyingGlassIcon class="w-4 h-4" /> {{ store.buscando ? 'Buscando...' : 'Buscar' }}
      </button>
    </form>

    <div v-if="store.resultados.length > 0" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
      <ul class="divide-y divide-gray-100 dark:divide-gray-700">
        <li
          v-for="item in store.resultados"
          :key="item.itemCode"
          class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
          :class="{ 'bg-blue-50 dark:bg-blue-900/20': store.itemSeleccionado?.itemCode === item.itemCode }"
          @click="onVerStock(item)"
        >
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">{{ item.itemCode }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.descripcion }}</p>
          </div>
          <span v-if="item.codigoBarras" class="font-mono text-xs text-gray-400">{{ item.codigoBarras }}</span>
        </li>
      </ul>
    </div>

    <div v-if="store.itemSeleccionado" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-white">{{ store.itemSeleccionado.itemCode }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ store.itemSeleccionado.descripcion }}</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="store.filtroAlmacen"
            type="text"
            placeholder="Filtrar por almacén"
            class="w-40 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            @keyup.enter="store.refiltrarPorAlmacen()"
          />
          <button
            type="button"
            class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
            @click="store.refiltrarPorAlmacen()"
          >
            Filtrar
          </button>
          <button
            type="button"
            :disabled="!store.stock || store.stock.almacenes.length === 0"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium"
            @click="onExportar"
          >
            <ArrowDownTrayIcon class="w-4 h-4" /> Exportar a Excel
          </button>
        </div>
      </div>

      <div v-if="store.cargandoStock" class="p-8 text-center text-gray-400">Consultando...</div>
      <table v-else-if="store.stock" class="w-full text-sm">
        <thead class="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
          <tr>
            <th class="px-4 py-3">Almacén</th>
            <th class="px-4 py-3">En stock</th>
            <th class="px-4 py-3">Comprometido</th>
            <th class="px-4 py-3">Bloqueado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-if="store.stock.almacenes.length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-gray-400">
              Sin stock en ningún almacén{{ store.filtroAlmacen ? ` que coincida con "${store.filtroAlmacen}"` : '' }}.
            </td>
          </tr>
          <tr v-for="a in store.stock.almacenes" :key="a.almacen">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ a.almacen }}</td>
            <td class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{{ a.enStock }}</td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ a.comprometido }}</td>
            <td class="px-4 py-3">
              <span v-if="a.bloqueado" class="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Bloqueado</span>
              <span v-else class="text-gray-300 dark:text-gray-600">—</span>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="store.stock.almacenes.length > 0">
          <tr class="border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
            <td class="px-4 py-3">Total</td>
            <td class="px-4 py-3">{{ totalEnStock }}</td>
            <td class="px-4 py-3" colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
