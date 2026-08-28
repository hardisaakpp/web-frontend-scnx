<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DemandChart from '../components/DemandChart.vue'
import { getSkuDetail } from '../services/demandaOtbApi'
import type { SkuDetail } from '../types'

const negocio = ref('ROLAND')
const sku = ref('CAFR21600.M')

const articulo = ref<SkuDetail | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function buscar() {
  loading.value = true
  error.value = null
  try {
    articulo.value = await getSkuDetail(negocio.value, sku.value)
  } catch (e) {
    articulo.value = null
    error.value = e instanceof Error ? e.message : 'Error consultando el backend de Demanda OTB.'
  } finally {
    loading.value = false
  }
}

onMounted(buscar)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-4">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Demanda OTB — Ejemplo de gráfico</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Consulta directa a <code class="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">GET /catalogo/{negocio}/sku/{sku}</code>, no forma parte del flujo real todavía.
      </p>
    </div>

    <form class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent="buscar">
      <div>
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Negocio</label>
        <input v-model="negocio" type="text" class="w-40 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-2 py-1.5 text-gray-900 dark:text-white" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SKU</label>
        <input v-model="sku" type="text" class="w-48 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-2 py-1.5 text-gray-900 dark:text-white" />
      </div>
      <button type="submit" class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium" :disabled="loading">
        {{ loading ? 'Buscando...' : 'Buscar' }}
      </button>
    </form>

    <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3 mb-4">
      {{ error }}
    </div>

    <div v-if="articulo" class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
      <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {{ articulo.codigo }} — {{ articulo.nombre }}
      </h2>
      <p v-if="!articulo.tieneProyeccion" class="text-xs text-amber-600 dark:text-amber-400 mb-2">
        {{ articulo.mensaje }}
      </p>
      <DemandChart :serie="articulo.serie" />
    </div>
  </div>
</template>
