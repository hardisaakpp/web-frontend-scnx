<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()

const negocioId = computed(() => route.params.negocio as string)

const TABS = [
  { name: 'demanda-otb-catalogo', label: 'Catálogo' },
  { name: 'demanda-otb-niveles', label: 'Niveles' },
  // Oculta hasta que BI confirme si esta vista sigue en alcance (ver conversación 2026-09-01).
  // { name: 'demanda-otb-promociones', label: 'Promociones' },
  { name: 'demanda-otb-otb', label: 'OTB' },
]
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex items-center gap-4 mb-4">
      <router-link to="/demanda-otb" class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all bg-white dark:bg-gray-900 shadow-sm">
        <ArrowLeftIcon class="w-5 h-5" />
      </router-link>
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Proyección de demanda negocio  <span class="text-xs text-gray-500 dark:text-gray-400"> {{ negocioId }}</span>
        </h1>
      </div>
    </div>

    <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
      <nav class="-mb-px flex gap-6">
        <router-link
          v-for="tab in TABS"
          :key="tab.name"
          :to="{ name: tab.name, params: { negocio: negocioId } }"
          class="border-b-2 px-1 py-3 text-sm font-medium transition-colors"
          :class="$route.name === tab.name
            ? 'border-blue-600 text-blue-600 dark:border-sky-400 dark:text-sky-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'"
        >
          {{ tab.label }}
        </router-link>
      </nav>
    </div>

    <router-view />
  </div>
</template>
