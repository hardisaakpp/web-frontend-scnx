<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { APP_LOCALE } from '@/plugins/locale'
import { useSupervisorStore } from '../stores/supervisorStore'
import type { EstadoEnrolador } from '../types'
import VolverButton from '@/components/navegacion/VolverButton.vue'

const store = useSupervisorStore()

onMounted(() => store.cargarDashboard())

const fechaHoy = computed(() => {
  if (!store.metricas) return 'Hoy'
  return new Date(store.metricas.fecha + 'T00:00:00').toLocaleDateString(APP_LOCALE, {
    weekday: 'long', day: 'numeric', month: 'long'
  })
})

const subtitulo = computed(() =>
  store.metricas
    ? `Actividad acumulada histórica — Tienda ${store.metricas.tienda_ciudad} ${store.metricas.tienda_nombre}`
    : 'Cargando…'
)

const animatedBars = ref(false)
watch(() => store.enroladoresOrdenados, () => {
  animatedBars.value = false
  setTimeout(() => { animatedBars.value = true }, 50)
}, { immediate: true, deep: true })

function barColor(estado: EstadoEnrolador): string {
  if (estado === 'alerta') return 'bg-gradient-to-r from-amber-400 to-amber-500'
  if (estado === 'inactivo') return 'bg-slate-300 dark:bg-slate-600'
  return 'bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600'
}

function dotClass(estado: EstadoEnrolador): string {
  if (estado === 'alerta') return 'bg-amber-400'
  if (estado === 'inactivo') return 'bg-slate-300 dark:bg-slate-500'
  return 'bg-emerald-500'
}

function dotTitle(estado: EstadoEnrolador): string {
  if (estado === 'alerta') return 'Pocos ganadores'
  if (estado === 'inactivo') return 'Inactivo'
  return 'Activo'
}
</script>

<template>
  <div class="space-y-6">

    <VolverButton to="/ruleta/admin" label="Administración" />

    <!-- ── Encabezado ────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          Monitoreo de Enroladores
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ subtitulo }}</p>
      </div>
      <button
        :disabled="store.loading"
        @click="store.cargarDashboard()"
        class="inline-flex items-center gap-2 self-start sm:self-auto
               px-4 py-2 rounded-xl text-sm font-medium
               border border-gray-200 dark:border-gray-700
               bg-white dark:bg-gray-800
               text-gray-600 dark:text-gray-300
               hover:bg-gray-50 dark:hover:bg-gray-700
               disabled:opacity-50 transition-colors"
      >
        <svg
          class="w-4 h-4"
          :class="{ 'animate-spin': store.loading }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Actualizar
      </button>
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div
      v-if="store.error"
      class="flex items-center gap-3 px-4 py-3 rounded-xl
             bg-red-50 dark:bg-red-900/20
             border border-red-200 dark:border-red-800
             text-sm text-red-700 dark:text-red-300"
    >
      <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      {{ store.error }}
    </div>

    <!-- ── Skeleton global ───────────────────────────────────────────────── -->
    <template v-if="store.loading && !store.metricas">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i"
             class="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="h-72 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div class="h-72 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    </template>

    <template v-else-if="store.metricas">

      <!-- ── KPI Cards ─────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Total giros -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total de giros</p>
          <p class="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
            {{ store.metricas.total_giros }}
          </p>
        </div>

        <!-- Clientes únicos -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
          <p class="text-sm text-gray-500 dark:text-gray-400">Clientes únicos atendidos</p>
          <p class="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
            {{ store.metricas.clientes_unicos }}
          </p>
        </div>

        <!-- Afiliaciones -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total de ganadores</p>
          <div class="mt-2 flex items-end gap-2">
            <p class="text-4xl font-bold text-gray-900 dark:text-white">
              {{ store.metricas.afiliaciones }}
            </p>
            <span
              v-if="store.metricas.afiliaciones_delta !== 0"
              class="mb-1 text-sm font-semibold"
              :class="store.metricas.afiliaciones_delta > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'"
            >
              {{ store.metricas.afiliaciones_delta > 0 ? '↑' : '↓' }}
              {{ Math.abs(store.metricas.afiliaciones_delta) > 0
                ? `+${store.metricas.afiliaciones_delta}`
                : store.metricas.afiliaciones_delta }} vs ayer
            </span>
          </div>
        </div>

        <!-- Tasa de conversión -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50">
          <p class="text-sm text-gray-500 dark:text-gray-400">Porcentaje de ganadores</p>
          <p class="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
            {{ store.metricas.tasa_conversion.toFixed(1) }}%
          </p>
        </div>
      </div>

      <!-- ── Alerta enroladores ─────────────────────────────────────────── -->
      <div
        v-if="store.totalAlertas > 0"
        class="flex items-center gap-3 px-4 py-3 rounded-xl
               bg-amber-50 dark:bg-amber-900/20
               border border-amber-200 dark:border-amber-700
               text-sm text-amber-800 dark:text-amber-300"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>
          <strong>{{ store.totalAlertas }} enrolador{{ store.totalAlertas > 1 ? 'es' : '' }}</strong>
          con porcentaje de ganadores por debajo del umbral ({{ store.umbralConversion }}%).
          Se recomienda atención inmediata.
        </span>
      </div>

      <!-- ── Paneles ────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Gráfica de barras horizontales -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-5">
            Giros por enrolador
          </h3>
          <div class="space-y-4">
            <div
              v-for="enrolador in store.enroladoresOrdenados"
              :key="enrolador.id"
              class="flex items-center gap-3"
            >
              <!-- Nombre -->
              <span class="w-28 flex-shrink-0 text-sm text-gray-600 dark:text-gray-300 truncate">
                {{ enrolador.nombre }}
              </span>
              <!-- Barra -->
              <div class="flex-1 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div
                  class="h-full rounded-lg transition-all duration-1000 ease-out"
                  :class="barColor(enrolador.estado)"
                  :style="{ width: animatedBars ? `${(enrolador.giros / store.maxGiros) * 100}%` : '0%' }"
                />
              </div>
              <!-- Valor -->
              <span class="w-7 flex-shrink-0 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                {{ enrolador.giros }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tabla detalle -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <!-- Header tabla -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              Detalle por enrolador
            </h3>
            <div class="flex items-center gap-2">
              <button
                @click="store.exportarCSV()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       border border-gray-200 dark:border-gray-600
                       bg-white dark:bg-gray-700
                       text-gray-600 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-600
                       transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Exportar CSV
              </button>
              <button
                :disabled="store.exportandoExcel"
                @click="store.exportarExcel()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       border border-emerald-600
                       bg-emerald-600
                       text-white
                       hover:bg-emerald-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
              >
                <svg
                  class="w-3.5 h-3.5"
                  :class="{ 'animate-spin': store.exportandoExcel }"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                >
                  <path v-if="store.exportandoExcel" stroke-linecap="round" stroke-linejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                {{ store.exportandoExcel ? 'Generando…' : 'Exportar Excel' }}
              </button>
            </div>
          </div>

          <!-- Tabla -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-700/50">
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Enrolador
                  </th>
                  <th class="px-3 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Giros
                  </th>
                  <th class="px-3 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Cl. únicos
                  </th>
                  <th class="px-3 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Ganadores
                  </th>
                  <th class="px-3 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    % Ganadores
                  </th>
                  <th class="px-3 py-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr
                  v-for="enrolador in store.enroladoresOrdenados"
                  :key="enrolador.id"
                  class="transition-colors"
                  :class="enrolador.estado === 'alerta'
                    ? 'bg-amber-50/60 dark:bg-amber-900/10 border-l-2 border-l-amber-400'
                    : 'hover:bg-gray-50/60 dark:hover:bg-gray-700/30'"
                >
                  <td class="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                    {{ enrolador.nombre }}
                  </td>
                  <td class="px-3 py-3.5 text-right text-gray-600 dark:text-gray-300">
                    {{ enrolador.giros }}
                  </td>
                  <td class="px-3 py-3.5 text-right text-gray-600 dark:text-gray-300">
                    {{ enrolador.clientes_unicos }}
                  </td>
                  <td class="px-3 py-3.5 text-right text-gray-600 dark:text-gray-300">
                    {{ enrolador.afiliaciones }}
                  </td>
                  <td
                    class="px-3 py-3.5 text-right font-semibold"
                    :class="enrolador.estado === 'alerta'
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-200'"
                  >
                    {{ enrolador.conversion.toFixed(1) }}%
                  </td>
                  <td class="px-3 py-3.5 text-center">
                    <span
                      class="inline-block w-3 h-3 rounded-full"
                      :class="dotClass(enrolador.estado)"
                      :title="dotTitle(enrolador.estado)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>
