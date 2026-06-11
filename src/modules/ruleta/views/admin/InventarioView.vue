<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import VolverButton from '../../components/VolverButton.vue'

const store = useAdminStore()

const campanaSeleccionadaId = ref<string | null>(null)

onMounted(async () => {
  await store.cargarCampanas()
  if (store.campanaInventarioId) {
    campanaSeleccionadaId.value = store.campanaInventarioId
  } else if (store.campanas.length > 0) {
    campanaSeleccionadaId.value = store.campanas[0].id
    await store.cargarInventario(store.campanas[0].id)
  }
})

async function onCampanaChange(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  if (!id) return
  campanaSeleccionadaId.value = id
  await store.cargarInventario(id)
}

import { computed } from 'vue'

const stockTotal = computed(() => store.inventario.reduce((acc, p) => acc + p.stock_total, 0))
const stockAsignado = computed(() =>
  store.inventario.reduce((acc, p) => acc + store.totalAsignadoConEdits(p.premio_id), 0)
)
const stockDisponible = computed(() => stockTotal.value - stockAsignado.value)

function onCeldaChange(premioId: string, tiendaId: number, event: Event) {
  const val = parseInt((event.target as HTMLInputElement).value) || 0
  store.setCelda(premioId, tiendaId, val)
}

function totalPorTienda(tiendaId: number): number {
  return store.inventario.reduce((acc, p) => acc + store.valorCelda(p.premio_id, tiendaId), 0)
}
</script>

<template>
  <div class="space-y-5">

    <VolverButton to="/ruleta/admin" label="Administración" />

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Distribución de inventario</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Asigna el stock de premios por tienda.</p>
      </div>
      <!-- Selector campaña real -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">Campaña:</span>
        <select
          :value="campanaSeleccionadaId"
          @change="onCampanaChange"
          :disabled="store.loadingCampanas"
          class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60">
          <option value="" disabled>Selecciona una campaña</option>
          <option v-for="c in store.campanas" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
      </div>
    </div>

    <!-- Estado vacío: sin campañas -->
    <div v-if="!store.loadingCampanas && store.campanas.length === 0"
         class="py-16 text-center text-gray-400 dark:text-gray-500">
      No hay campañas disponibles.
    </div>

    <!-- Estado vacío: sin campaña seleccionada -->
    <div v-else-if="!campanaSeleccionadaId && !store.loadingInventario"
         class="py-16 text-center text-gray-400 dark:text-gray-500">
      Selecciona una campaña para ver el inventario.
    </div>

    <div v-else-if="store.loadingInventario" class="flex justify-center py-12">
      <div class="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>

    <template v-else-if="store.inventario.length > 0">

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">Stock total en bodega</p>
          <p class="mt-1 text-3xl font-bold text-gray-800 dark:text-white">{{ stockTotal.toLocaleString() }} <span class="text-base font-normal text-gray-400">unidades</span></p>
        </div>
        <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 p-5">
          <p class="text-sm text-indigo-600 dark:text-indigo-400">Stock ya asignado</p>
          <p class="mt-1 text-3xl font-bold text-indigo-700 dark:text-indigo-300">{{ stockAsignado.toLocaleString() }} <span class="text-base font-normal text-indigo-400">unidades</span></p>
        </div>
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 p-5">
          <p class="text-sm text-emerald-600 dark:text-emerald-400">Disponible por asignar</p>
          <p class="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{{ stockDisponible.toLocaleString() }} <span class="text-base font-normal text-emerald-400">unidades</span></p>
        </div>
      </div>

      <!-- Tabla editable -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[160px]">Premio / Tipo</th>
                <th class="px-3 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock total</th>
                <th v-for="t in store.tiendasInventario" :key="t.id"
                    class="px-3 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px]">
                  {{ t.nombre }}
                </th>
                <th class="px-3 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total asignado</th>
                <th class="px-3 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Restante bodega</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="item in store.inventario" :key="item.premio_id"
                  class="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                <td class="px-5 py-3.5">
                  <p class="font-medium text-gray-800 dark:text-gray-200">{{ item.nombre }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ item.tipo }}</p>
                </td>
                <td class="px-3 py-3.5 text-right text-gray-600 dark:text-gray-300">{{ item.stock_total }}</td>
                <td v-for="t in store.tiendasInventario" :key="t.id" class="px-3 py-3.5 text-center">
                  <input
                    type="number" min="0"
                    :value="store.valorCelda(item.premio_id, t.id)"
                    @change="onCeldaChange(item.premio_id, t.id, $event)"
                    class="w-16 text-center px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200
                           focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </td>
                <td class="px-3 py-3.5 text-right font-medium text-gray-700 dark:text-gray-200">
                  {{ store.totalAsignadoConEdits(item.premio_id) }}
                </td>
                <td class="px-3 py-3.5 text-right font-semibold">
                  <span v-if="item.stock_total - store.totalAsignadoConEdits(item.premio_id) <= item.stock_total * 0.1"
                        class="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    {{ item.stock_total - store.totalAsignadoConEdits(item.premio_id) }}
                  </span>
                  <span v-else class="text-emerald-600 dark:text-emerald-400">
                    {{ item.stock_total - store.totalAsignadoConEdits(item.premio_id) }}
                  </span>
                </td>
              </tr>
              <!-- Fila totales por tienda -->
              <tr class="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                <td class="px-5 py-3.5 text-gray-700 dark:text-gray-200">Total por tienda</td>
                <td class="px-3 py-3.5 text-right text-gray-400">—</td>
                <td v-for="t in store.tiendasInventario" :key="t.id"
                    class="px-3 py-3.5 text-center text-gray-700 dark:text-gray-200">
                  {{ totalPorTienda(t.id) }}
                </td>
                <td class="px-3 py-3.5 text-right text-gray-700 dark:text-gray-200">{{ stockAsignado }}</td>
                <td class="px-3 py-3.5 text-right text-gray-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer acciones -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <p class="text-xs text-gray-400 dark:text-gray-500">Los premios de relleno no consumen stock y no se muestran en esta tabla.</p>
          <p v-if="store.hayEdicionesPendientes" class="text-xs text-amber-600 dark:text-amber-400">Los cambios no se guardarán hasta presionar 'Guardar distribución'.</p>
        </div>
        <div class="flex gap-3 flex-shrink-0">
          <button
            @click="store.restablecerInventario()"
            :disabled="!store.hayEdicionesPendientes"
            class="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
            Restablecer
          </button>
          <button
            @click="store.guardarDistribucion()"
            :disabled="!store.hayEdicionesPendientes || store.guardando"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50">
            {{ store.guardando ? 'Guardando…' : 'Guardar distribución' }}
          </button>
        </div>
      </div>

    </template>

    <!-- Sin premios para la campaña seleccionada -->
    <div v-else-if="campanaSeleccionadaId && !store.loadingInventario"
         class="py-16 text-center text-gray-400 dark:text-gray-500">
      Esta campaña no tiene premios con control de stock por tienda.
    </div>

  </div>
</template>
