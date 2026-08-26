<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeftIcon, BuildingOfficeIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import ConfiguracionAlmacenesPanel from '../components/ConfiguracionAlmacenesPanel.vue'

// Cada tipo de configuración es una sección desplegable dentro de la misma
// vista (no rutas separadas). Todas comparten el mismo color (tronco → ramas):
// título, ícono y descripción son los que diferencian cada una, no el color.
const secciones = [
  {
    key: 'almacenes',
    title: 'Almacenes y Centros de Distribución',
    description: 'Marca qué almacenes son Centro de Distribución y asigna qué tiendas dependen de cada uno.',
    icon: BuildingOfficeIcon
  }
]

const expandido = ref<string | null>('almacenes')

const toggleSeccion = (key: string) => {
  expandido.value = expandido.value === key ? null : key
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex items-center gap-4 mb-6">
      <router-link to="/reposiciones" class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 bg-white dark:bg-gray-900 shadow-sm">
        <ArrowLeftIcon class="w-5 h-5" />
      </router-link>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Configuración</h1>
          <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">Administrador</span>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Administración general del módulo de reposiciones.</p>
      </div>
    </div>

    <div class="space-y-3">
      <div
        v-for="seccion in secciones"
        :key="seccion.key"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <button
          type="button"
          @click="toggleSeccion(seccion.key)"
          :class="['w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors', expandido === seccion.key ? 'rounded-t-xl' : 'rounded-xl']"
        >
          <div class="w-8 h-8 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
            <component :is="seccion.icon" class="w-4 h-4" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">{{ seccion.title }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ seccion.description }}</div>
          </div>
          <ChevronDownIcon
            :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform', expandido === seccion.key && 'rotate-180']"
          />
        </button>

        <div v-if="expandido === seccion.key" class="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-700">
          <ConfiguracionAlmacenesPanel v-if="seccion.key === 'almacenes'" />
        </div>
      </div>
    </div>
  </div>
</template>
