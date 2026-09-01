<script setup lang="ts">
import { onMounted } from 'vue'
import {
  ArchiveBoxIcon, ChevronRightIcon, MagnifyingGlassIcon, RectangleStackIcon, SignalIcon, SignalSlashIcon, TruckIcon,
} from '@heroicons/vue/24/outline'
import { useCediStore } from '../stores/cediStore'
import { useToast } from '@/composables/useToast'

// P-002 dejó esto como placeholder de conectividad; P-006 agrega el primer acceso real de
// negocio (ODC). Distribución/Reubicación llegan en prompts posteriores.
const cediStore = useCediStore()
const toast = useToast()

onMounted(async () => {
  await cediStore.checkHealth()
  if (cediStore.error) {
    toast.error('Backend CEDI no disponible', cediStore.error)
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-16">
    <div class="flex items-center gap-4 mb-10">
      <div class="p-4 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
        <ArchiveBoxIcon class="w-10 h-10" />
      </div>
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">CEDI</h1>
        <p class="text-gray-500 dark:text-gray-400">Control y Distribución de Inventario</p>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
        Estado del backend
      </h2>

      <div v-if="cediStore.loading" class="text-gray-500 dark:text-gray-400">Consultando...</div>

      <div v-else-if="cediStore.health" class="flex items-center gap-3">
        <SignalIcon class="w-6 h-6 text-emerald-500" />
        <div>
          <p class="font-semibold text-gray-900 dark:text-white">
            {{ cediStore.health.status === 'healthy' ? 'Operativo' : 'Degradado' }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            BD: {{ cediStore.health.database }} · v{{ cediStore.health.version }}
          </p>
        </div>
      </div>

      <div v-else class="flex items-center gap-3">
        <SignalSlashIcon class="w-6 h-6 text-red-500" />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ cediStore.error ?? 'Sin datos todavía' }}
        </p>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <router-link
        to="/cedi/odc"
        class="group flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <TruckIcon class="w-6 h-6" />
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">Órdenes de Compra (ODC)</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Ingreso de mercadería y picking</p>
          </div>
        </div>
        <ChevronRightIcon class="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
      </router-link>

      <router-link
        to="/cedi/distribucion"
        class="group flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <RectangleStackIcon class="w-6 h-6" />
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">Distribución / Crossdocking</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Solicitudes de transferencia, grupos y picking</p>
          </div>
        </div>
        <ChevronRightIcon class="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
      </router-link>

      <router-link
        to="/cedi/reubicacion/stock"
        class="group flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <MagnifyingGlassIcon class="w-6 h-6" />
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">Consulta de Stock</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Por código de artículo o de barras, con detalle por almacén</p>
          </div>
        </div>
        <ChevronRightIcon class="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
      </router-link>
    </div>

    <p class="mt-8 text-sm text-gray-400 dark:text-gray-500">
      Próximos pasos: Reubicación masiva/completa/manual (P-013 a P-015).
    </p>
  </div>
</template>
