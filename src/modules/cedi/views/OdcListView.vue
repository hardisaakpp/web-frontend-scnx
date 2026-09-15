<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useOdcStore } from '../stores/odcStore'
import { useToast } from '@/composables/useToast'
import QuickTablePagination from '@/components/paginacion/QuickTablePagination.vue'
import type { OdcEstado } from '../types'

const store = useOdcStore()
const toast = useToast()
const router = useRouter()

const totalPages = computed(() => Math.max(1, Math.ceil(store.totalCount / store.pageSize)))

const estadoBadge: Record<OdcEstado, string> = {
  Abierta: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cerrada: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  Cancelada: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

async function onSync() {
  try {
    const result = await store.sync(5)
    toast.success(
      'Sincronización completa',
      `${result.odcsNuevas} nuevas, ${result.odcsActualizadas} actualizadas (${result.paginasConsultadas} página(s) de SAP).`,
    )
  } catch {
    toast.error('No se pudo sincronizar', store.error ?? undefined)
  }
}

function verOdc(numDoc: string) {
  router.push(`/cedi/odc/${numDoc}`)
}

onMounted(() => store.fetchOdcs())
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Órdenes de Compra (ODC)</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Ingreso de mercadería — caché local sincronizada desde SAP vía middleware.
        </p>
      </div>
      <button
        type="button"
        :disabled="store.syncing"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
        @click="onSync"
      >
        <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': store.syncing }" />
        {{ store.syncing ? 'Sincronizando...' : 'Sincronizar desde SAP' }}
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="flex flex-wrap gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
        <div class="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            :value="store.filters.numDoc"
            type="text"
            placeholder="Buscar por N° de documento..."
            class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            @input="store.setFilters({ numDoc: ($event.target as HTMLInputElement).value || undefined })"
          />
        </div>
        <select
          :value="store.filters.estado ?? ''"
          class="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          @change="store.setFilters({ estado: (($event.target as HTMLSelectElement).value || undefined) as any })"
        >
          <option value="">Todos los estados</option>
          <option value="Abierta">Abierta</option>
          <option value="Cerrada">Cerrada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <input
          :value="store.filters.almacen"
          type="text"
          placeholder="Almacén"
          class="w-32 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          @input="store.setFilters({ almacen: ($event.target as HTMLInputElement).value || undefined })"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="px-4 py-3">N° Documento</th>
              <th class="px-4 py-3">Proveedor</th>
              <th class="px-4 py-3">Almacén</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Líneas</th>
              <th class="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="store.loading">
              <td colspan="6" class="px-4 py-8 text-center text-gray-400">Cargando...</td>
            </tr>
            <tr v-else-if="store.items.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-gray-400">
                Sin resultados — probá "Sincronizar desde SAP" si esperabas ver algo acá.
              </td>
            </tr>
            <tr
              v-for="odc in store.items"
              :key="odc.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              @click="verOdc(odc.numDoc)"
            >
              <td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">{{ odc.numDoc }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ odc.proveedor }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ odc.almacen }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ new Date(odc.fechaCreacion).toLocaleDateString() }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ odc.cantidadLineas }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="estadoBadge[odc.estado]">
                  {{ odc.estado }}
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
