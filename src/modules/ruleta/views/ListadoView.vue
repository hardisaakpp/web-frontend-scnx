<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRuletaStore } from '../stores/ruletaStore'
import VolverButton from '@/components/VolverButton.vue'

const store = useRuletaStore()
const searchInput = ref('')

function onSearch() {
  store.setSearchFilter(searchInput.value)
}

function onPageChange(page: number) {
  store.setPage(page)
}

onMounted(() => {
  store.fetchRuletas()
})
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <VolverButton to="/ruleta" label="Ruleta One Card" class="mb-5" />

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Listado</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Gestión de registros de ruleta
      </p>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div class="flex gap-3">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Buscar..."
          class="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="onSearch"
        />
        <button
          @click="onSearch"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Buscar
        </button>
      </div>
    </div>

    <!-- Estado de error -->
    <div
      v-if="store.error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 mb-4 text-sm"
    >
      {{ store.error }}
    </div>

    <!-- Tabla -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="store.loading" class="flex items-center justify-center py-16">
        <svg class="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <template v-else>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha creación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="store.ruletas.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                No hay registros disponibles
              </td>
            </tr>
            <tr
              v-for="item in store.ruletas"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">{{ item.id }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{{ item.nombre }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ item.descripcion ?? '—' }}</td>
              <td class="px-6 py-4">
                <span
                  :class="item.activo
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                >
                  {{ item.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ item.fechaCreacion }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Paginación -->
        <div
          v-if="store.pagination.totalPages > 1"
          class="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700"
        >
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ store.pagination.total }} registros en total
          </span>
          <div class="flex gap-1">
            <button
              v-for="page in store.pagination.totalPages"
              :key="page"
              @click="onPageChange(page)"
              :class="page === store.pagination.page
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
              class="w-8 h-8 rounded text-sm font-medium border border-gray-200 dark:border-gray-600 transition-colors"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
