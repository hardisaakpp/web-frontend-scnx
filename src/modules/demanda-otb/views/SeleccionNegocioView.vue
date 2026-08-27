<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { BuildingStorefrontIcon } from '@heroicons/vue/24/outline'
import { getNegocios } from '../services/demandaOtbApi'

const COLORS = [
  'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
]

const negociosRaw = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    negociosRaw.value = await getNegocios()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error consultando el backend de Demanda OTB.'
  } finally {
    loading.value = false
  }
})

const negocios = computed(() =>
  negociosRaw.value.map((nombre, i) => ({
    nombre,
    link: `/demanda-otb/${encodeURIComponent(nombre)}`,
    color: COLORS[i % COLORS.length],
  }))
)
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Demanda OTB</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Selecciona el negocio para ver su proyección de demanda.</p>
    </div>

    <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3 mb-4">
      {{ error }}
    </div>

    <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando negocios...</div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <router-link
        v-for="negocio in negocios"
        :key="negocio.nombre"
        :to="negocio.link"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div :class="[negocio.color, 'w-8 h-8 rounded flex items-center justify-center flex-shrink-0']">
            <BuildingStorefrontIcon class="w-4 h-4" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">{{ negocio.nombre }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ver proyección de demanda</div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
