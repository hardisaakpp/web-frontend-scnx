<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupervisorStore } from '../../stores/supervisorStore'
import VolverButton from '@/components/VolverButton.vue'

const store = useSupervisorStore()
onMounted(() => store.cargarEnroladores())

const tiendaFiltro = ref('todas')

const tiendas = computed(() => {
  const nombres = store.enroladores.map(e => e.tienda).filter(Boolean) as string[]
  return ['todas', ...new Set(nombres)]
})

const enroladoresFiltrados = computed(() => {
  const lista = tiendaFiltro.value === 'todas'
    ? store.enroladores
    : store.enroladores.filter(e => e.tienda === tiendaFiltro.value)
  return [...lista].sort((a, b) => b.afiliaciones - a.afiliaciones)
})

const maxGiros = computed(() => store.maxGiros)
const animatedBars = ref(false)
import { watch } from 'vue'
watch(() => enroladoresFiltrados.value, () => {
  animatedBars.value = false
  setTimeout(() => { animatedBars.value = true }, 50)
}, { immediate: true, deep: true })

function barColor(estado: string): string {
  if (estado === 'alerta')   return 'bg-gradient-to-r from-amber-400 to-amber-500'
  if (estado === 'inactivo') return 'bg-slate-300 dark:bg-slate-600'
  return 'bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600'
}

function dotClass(estado: string): string {
  if (estado === 'alerta')   return 'bg-amber-400'
  if (estado === 'inactivo') return 'bg-slate-300 dark:bg-slate-500'
  return 'bg-emerald-500'
}
</script>

<template>
  <div class="space-y-5">

    <VolverButton to="/ruleta" label="Ruleta One Card" />

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Enroladores y ranking</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Desempeño global de todos los promotores por tienda.</p>
      </div>
      <!-- Filtro tienda -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-sm text-gray-500 dark:text-gray-400">Tienda:</span>
        <select v-model="tiendaFiltro"
          class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors">
          <option v-for="t in tiendas" :key="t" :value="t">{{ t === 'todas' ? 'Todas las tiendas' : t }}</option>
        </select>
      </div>
    </div>

    <!-- Skeleton / error -->
    <div v-if="store.loading" class="flex justify-center py-8">
      <div class="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"/>
    </div>
    <div v-else-if="store.error" class="text-sm text-red-500 dark:text-red-400 text-center py-6">{{ store.error }}</div>

    <!-- KPI mini -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
        <p class="text-xs text-gray-400">Total enroladores</p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ store.enroladores.length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
        <p class="text-xs text-gray-400">Total giros</p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ store.enroladores.reduce((a,e) => a+e.giros,0) }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
        <p class="text-xs text-gray-400">Total afiliaciones</p>
        <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{{ store.enroladores.reduce((a,e) => a+e.afiliaciones,0) }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
        <p class="text-xs text-gray-400">Con alerta</p>
        <p class="mt-1 text-2xl font-bold text-amber-500">{{ store.totalAlertas }}</p>
      </div>
    </div>

    <!-- Paneles -->
    <div v-if="!store.loading && !store.error" class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Barras -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-white mb-5">Giros por enrolador</h3>
        <div class="space-y-3.5">
          <div v-for="e in enroladoresFiltrados" :key="e.id" class="flex items-center gap-3">
            <div class="w-32 flex-shrink-0">
              <p class="text-sm text-gray-700 dark:text-gray-200 truncate">{{ e.nombre }}</p>
              <p class="text-xs text-gray-400">{{ e.tienda }}</p>
            </div>
            <div class="flex-1 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div class="h-full rounded-lg transition-all duration-1000 ease-out"
                   :class="barColor(e.estado)"
                   :style="{ width: animatedBars ? `${(e.giros / maxGiros) * 100}%` : '0%' }"/>
            </div>
            <span class="w-7 flex-shrink-0 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">{{ e.giros }}</span>
          </div>
        </div>
      </div>

      <!-- Tabla ranking -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Ranking global</h3>
          <span class="text-xs text-gray-400">ordenado por afiliaciones</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Enrolador</th>
                <th class="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Afiliac.</th>
                <th class="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Conv.</th>
                <th class="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Est.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="(e, idx) in enroladoresFiltrados" :key="e.id"
                  :class="e.estado === 'alerta' ? 'bg-amber-50/60 dark:bg-amber-900/10 border-l-2 border-l-amber-400' : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/20'"
                  class="transition-colors">
                <td class="px-3 py-3 text-gray-400 text-xs font-semibold">{{ idx + 1 }}</td>
                <td class="px-3 py-3">
                  <p class="font-medium text-gray-800 dark:text-gray-200">{{ e.nombre }}</p>
                  <p class="text-xs text-gray-400">{{ e.tienda }}</p>
                </td>
                <td class="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">{{ e.afiliaciones }}</td>
                <td class="px-3 py-3 text-right font-semibold"
                    :class="e.estado === 'alerta' ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'">
                  {{ e.conversion.toFixed(1) }}%
                </td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-block w-3 h-3 rounded-full" :class="dotClass(e.estado)" :title="e.estado"/>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>
