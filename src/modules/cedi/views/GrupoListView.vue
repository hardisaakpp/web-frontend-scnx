<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { useGrupoStore } from '../stores/grupoStore'
import QuickTablePagination from '@/components/paginacion/QuickTablePagination.vue'
import type { GrupoEstado } from '../types'

const store = useGrupoStore()
const router = useRouter()

const totalPages = computed(() => Math.max(1, Math.ceil(store.totalCount / store.pageSize)))

const estadoBadge: Record<GrupoEstado, string> = {
  Nuevo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Recolectando: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Empaquetando: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Despachado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

onMounted(() => store.fetchGrupos())
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-10">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      @click="router.push('/cedi/distribucion')"
    >
      <ArrowLeftIcon class="w-4 h-4" /> Volver a solicitudes
    </button>

    <div class="flex items-center justify-between mb-1">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Grupos de Distribución</h1>
      <router-link to="/cedi/distribucion/kanban" class="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
        Ver como tablero
      </router-link>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Listas de picking/crossdocking creadas a partir de solicitudes de transferencia.</p>

    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="px-4 py-3">Nombre</th>
              <th class="px-4 py-3">Almacén</th>
              <th class="px-4 py-3">Tipo</th>
              <th class="px-4 py-3">Solicitudes</th>
              <th class="px-4 py-3">Ítems</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="store.loading">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Cargando...</td>
            </tr>
            <tr v-else-if="store.items.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Todavía no hay grupos creados.</td>
            </tr>
            <tr
              v-for="grupo in store.items"
              :key="grupo.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              @click="router.push(`/cedi/distribucion/grupos/${grupo.id}`)"
            >
              <td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">{{ grupo.nombre }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ grupo.almacen }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ grupo.tipo }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ grupo.cantidadSolicitudes }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ grupo.cantidadArticulos }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ new Date(grupo.fechaCreacion).toLocaleDateString() }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="estadoBadge[grupo.estado]">
                  {{ grupo.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end p-4 border-t border-gray-100 dark:border-gray-700">
        <QuickTablePagination
          :model-value="store.page"
          :total-pages="totalPages"
          :disabled="store.loading"
          @update:model-value="store.setPage"
        />
      </div>
    </div>
  </div>
</template>
