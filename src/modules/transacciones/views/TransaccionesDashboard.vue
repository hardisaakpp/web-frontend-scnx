<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Transacciones Produbanco</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Seleccione el módulo al que desea acceder.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">

      <!-- Cajero -->
      <router-link
        v-if="puedeVerCajero"
        to="/transacciones/cajero"
        class="group relative flex flex-col gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow hover:shadow-lg hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-200"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
            <BanknotesIcon class="w-6 h-6" />
          </div>
          <ArrowRightIcon class="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Cajero</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Consulte y reserve transacciones en tiempo real por monto y referencia.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Últimos 20 min
          </span>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Reserva online
          </span>
        </div>
      </router-link>

      <!-- Tesorería -->
      <router-link
        v-if="puedeVerTesoreria"
        to="/transacciones/tesoreria"
        class="group relative flex flex-col gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow hover:shadow-lg hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-200"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors">
            <ChartBarSquareIcon class="w-6 h-6" />
          </div>
          <ArrowRightIcon class="w-5 h-5 text-gray-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all duration-200" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tesorería</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Reporte histórico de transacciones por rango de fechas y tiendas. Exportación a Excel.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
            Hasta 31 días
          </span>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
            Exportar Excel
          </span>
        </div>
      </router-link>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity'
import { BanknotesIcon, ChartBarSquareIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const puedeVerCajero = computed(() =>
  authStore.userRoles?.includes('Admin') || authStore.hasAnyPermission(['cajero.view'])
)

const puedeVerTesoreria = computed(() =>
  authStore.userRoles?.includes('Admin') || authStore.hasAnyPermission(['tesoreria.view'])
)
</script>
