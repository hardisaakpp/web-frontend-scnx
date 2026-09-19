<template>
  <DrawerPanel
    :open="isOpen"
    title-id="drawer-cuentas-title"
    max-width-class="sm:max-w-3xl md:max-w-4xl"
    @close="cerrar"
  >
    <template #header>
      <h2 id="drawer-cuentas-title" class="text-lg font-bold text-gray-900 dark:text-white truncate">
        Cuentas Financieras — Mabel Trading
      </h2>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Active o desactive cuentas para tiendas sin afectar el histórico
      </p>
    </template>

    <template #top>
      <!-- Barra de herramientas: buscador + filtro rápido -->
      <div class="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-800 px-5 py-3 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <input
            v-model="busqueda"
            type="search"
            placeholder="Buscar por nombre, código SAP o formato…"
            aria-label="Buscar cuenta financiera"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <fieldset class="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/60 p-1">
          <legend class="sr-only">Filtro por estado</legend>
          <label
            v-for="opcion in FILTROS_ESTADO"
            :key="opcion.value"
            :class="filtroEstado === opcion.value ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            class="flex items-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <input
              v-model="filtroEstado"
              type="radio"
              name="filtroEstadoCuenta"
              :value="opcion.value"
              class="peer sr-only"
            />
            <span class="rounded peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500">
              {{ opcion.label }}
            </span>
          </label>
        </fieldset>
      </div>
    </template>

    <div v-if="cargando" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-10 rounded-lg bg-gray-100 dark:bg-gray-800/60 animate-pulse"></div>
    </div>

    <div v-else-if="cuentasFiltradas.length === 0" class="flex flex-col items-center justify-center gap-2 py-12 text-center text-gray-500 dark:text-gray-400">
      <BuildingLibraryIcon class="h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden="true" />
      <p class="font-medium">No hay cuentas que coincidan con la búsqueda o el filtro.</p>
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
        <caption class="sr-only">Cuentas financieras de Mabel Trading</caption>
        <thead class="bg-gray-50 dark:bg-gray-800/60">
          <tr>
            <th scope="col" class="px-3 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">AcctCode</th>
            <th scope="col" class="px-3 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">AcctName</th>
            <th scope="col" class="px-3 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">FormatCode</th>
            <th scope="col" class="px-3 py-2.5 text-center font-semibold text-gray-600 dark:text-gray-300">Para depósitos</th>
            <th scope="col" class="px-3 py-2.5 text-center font-semibold text-gray-600 dark:text-gray-300">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
          <tr v-for="cuenta in cuentasFiltradas" :key="cuenta.id">
            <td class="px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-300">{{ cuenta.codigoCuentaSAP }}</td>
            <td class="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{{ cuenta.nombreCuenta }}</td>
            <td class="px-3 py-2.5 text-gray-600 dark:text-gray-300">{{ cuenta.codigoFormateado }}</td>
            <td class="px-3 py-2.5">
              <label class="flex items-center justify-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="cuenta.habilitadaParaTiendas"
                  :disabled="actualizandoIds.has(cuenta.id)"
                  aria-label="Habilitada para depósitos de tiendas"
                  class="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  @change="actualizarEstado(cuenta, { activa: cuenta.activa, habilitadaParaTiendas: ($event.target as HTMLInputElement).checked })"
                />
                <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ cuenta.habilitadaParaTiendas ? 'Visible' : 'Oculta' }}</span>
              </label>
            </td>
            <td class="px-3 py-2.5">
              <label class="flex items-center justify-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="cuenta.activa"
                  :disabled="actualizandoIds.has(cuenta.id)"
                  aria-label="Cuenta activa"
                  class="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                  @change="actualizarEstado(cuenta, { habilitadaParaTiendas: cuenta.habilitadaParaTiendas, activa: ($event.target as HTMLInputElement).checked })"
                />
                <span class="text-xs font-semibold" :class="cuenta.activa ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'">
                  {{ cuenta.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        <strong class="text-gray-800 dark:text-gray-200">{{ cuentasFiltradas.length }}</strong> de {{ cuentas.length }} cuenta(s) mostrada(s)
      </p>
      <button
        type="button"
        class="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        @click="cerrar"
      >
        Cerrar <span class="text-gray-400 dark:text-gray-500">(Esc)</span>
      </button>
    </template>
  </DrawerPanel>
</template>

<script setup lang="ts">
import { BuildingLibraryIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import DrawerPanel from '@/components/modales/DrawerPanel.vue'
import { useCuentasFinancieras, type FiltroEstadoCuenta } from '../composables/useCuentasFinancieras'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<(e: 'close') => void>()

const {
  cuentas, cuentasFiltradas, cargando, actualizandoIds, busqueda, filtroEstado, actualizarEstado
} = useCuentasFinancieras()

const FILTROS_ESTADO: Array<{ value: FiltroEstadoCuenta; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'activas', label: 'Solo activas' },
  { value: 'paraTiendas', label: 'Solo para tiendas' }
]

function cerrar(): void {
  emit('close')
}
</script>
