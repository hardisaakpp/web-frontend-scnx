<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAdminStore } from '../../stores/adminStore'
import { ruletaService } from '../../services/ruletaApi'
import VolverButton from '@/components/VolverButton.vue'
import type { EstadoPremioFiltro, GiroFilters, SegmentoCliente } from '../../types'

const store = useAdminStore()
const TODOS = 'todos'
const campanaSeleccionadaId = ref<string>(TODOS)
const esTodos = computed(() => campanaSeleccionadaId.value === TODOS)

// ── Filtros del Historial de Giros ─────────────────────────────────────────────
const SEGMENTOS: SegmentoCliente[] = [
  'GRUPO_1', 'GRUPO_2', 'GRUPO_3', 'GRUPO_4', 'GRUPO_5', 'GRUPO_6'
]

const filtros = reactive({
  premioNombre: '',
  segmento: '' as SegmentoCliente | '',
  estado: '' as EstadoPremioFiltro | '',
  fechaInicio: '',
  fechaFin: ''
})

const filtrosAplicados = ref<Omit<GiroFilters, 'campanaId'>>({})

const fechaInvalida = computed(() =>
  Boolean(filtros.fechaInicio && filtros.fechaFin && filtros.fechaInicio > filtros.fechaFin)
)

const cantidadFiltrosActivos = computed(() => [
  filtrosAplicados.value.premioNombre,
  filtrosAplicados.value.segmento,
  filtrosAplicados.value.estado,
  filtrosAplicados.value.fechaInicio,
  filtrosAplicados.value.fechaFin
].filter(Boolean).length)

function etiquetaSegmento(segmento: string): string {
  return segmento.replace('_', ' ')
}

function construirFiltrosHistorial(): Omit<GiroFilters, 'campanaId'> {
  return {
    premioNombre: filtros.premioNombre.trim() || undefined,
    segmento: filtros.segmento || undefined,
    estado: filtros.estado || undefined,
    fechaInicio: filtros.fechaInicio || undefined,
    fechaFin: filtros.fechaFin || undefined
  }
}

function idCampanaActual() {
  return esTodos.value ? undefined : campanaSeleccionadaId.value
}

// Auto-aplicar: los select/fechas disparan de inmediato (@change); el texto
// usa debounce para no lanzar una petición por cada tecla mientras se escribe.
const DEBOUNCE_MS = 450
let debounceTimer: ReturnType<typeof setTimeout> | undefined

async function aplicarFiltros() {
  clearTimeout(debounceTimer)
  if (fechaInvalida.value) return
  filtrosAplicados.value = construirFiltrosHistorial()
  await store.cargarHistorialDashboard(idCampanaActual(), 1, filtrosAplicados.value)
}

watch(() => filtros.premioNombre, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(aplicarFiltros, DEBOUNCE_MS)
})

onBeforeUnmount(() => clearTimeout(debounceTimer))

async function limpiarFiltros() {
  filtros.premioNombre = ''
  filtros.segmento = ''
  filtros.estado = ''
  filtros.fechaInicio = ''
  filtros.fechaFin = ''
  await aplicarFiltros()
  // Vaciar premioNombre también dispara el watcher de debounce; se cancela
  // para no lanzar una segunda petición redundante ~450ms después.
  clearTimeout(debounceTimer)
}

async function cargarDashboard(id: string) {
  const campanaId = id === TODOS ? undefined : id
  if (id === TODOS) {
    store.metricasCampana = null
    store.stockDashboard   = []
    await Promise.all([
      store.cargarEnroladoresDashboard(),
      store.cargarHistorialDashboard(campanaId, 1, filtrosAplicados.value),
    ])
  } else {
    await Promise.all([
      store.cargarMetricasCampana(id),
      store.cargarEnroladoresDashboard(id),
      store.cargarStockDashboard(id),
      store.cargarHistorialDashboard(campanaId, 1, filtrosAplicados.value),
    ])
  }
}

onMounted(async () => {
  await store.cargarCampanas()
  campanaSeleccionadaId.value = TODOS
  await cargarDashboard(TODOS)
})

async function onCampanaChange(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  if (!id) return
  campanaSeleccionadaId.value = id
  await cargarDashboard(id)
}

async function onRefresh() {
  await cargarDashboard(campanaSeleccionadaId.value)
}

// ── Enroladores bar chart ──────────────────────────────────────────────────────
const maxGiros = computed(() => Math.max(...store.enroladores.map(e => e.giros), 1))

// ── Historial: paginación ─────────────────────────────────────────────────────
const paginasVisibles = computed(() => {
  const total   = store.historialTotalPaginas
  const current = store.historialPaginaActual
  const pages: number[] = []
  for (let p = Math.max(1, current - 2); p <= Math.min(total, current + 2); p++) pages.push(p)
  return pages
})

async function irPagina(page: number) {
  await store.cargarHistorialDashboard(idCampanaActual(), page, filtrosAplicados.value)
}

// ── Exportar ──────────────────────────────────────────────────────────────────
async function exportar(tipo: 'csv' | 'excel') {
  const filtrosExport: GiroFilters = { campanaId: idCampanaActual(), ...filtrosAplicados.value }
  if (tipo === 'excel') await ruletaService.exportarGirosExcel(filtrosExport)
  else await ruletaService.exportarGirosCsv(filtrosExport)
}

// ── Helpers stock ─────────────────────────────────────────────────────────────
function stockPct(disponible: number, total: number) {
  return total > 0 ? Math.round((disponible / total) * 100) : 0
}
function stockNumCls(disponible: number, total: number) {
  if (disponible === 0)              return 'text-red-600 dark:text-red-400'
  if (stockPct(disponible, total) <= 20) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

// ── Fecha format ──────────────────────────────────────────────────────────────
function fmtFecha(iso: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-EC', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  } catch { return iso }
}
</script>

<template>
  <div class="space-y-5 pb-6">

    <VolverButton to="/ruleta/admin" label="Administración" />

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Dashboard global</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Métricas de campaña en tiempo real.</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-gray-500 dark:text-gray-400">Campaña:</span>
        <select
          :value="campanaSeleccionadaId"
          @change="onCampanaChange"
          :disabled="store.loadingCampanas"
          class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500
                 transition-colors disabled:opacity-60">
          <option value="todos">Todas las campañas</option>
          <option v-for="c in store.campanas" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
        <button
          v-if="campanaSeleccionadaId"
          @click="onRefresh"
          :disabled="store.loadingMetricasCampana"
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800
                 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                 disabled:opacity-50 transition-colors">
          <svg class="w-4 h-4" :class="{ 'animate-spin': store.loadingMetricasCampana }"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Actualizar
        </button>
      </div>
    </div>

    <!-- ── KPI Cards (solo campaña específica) ─────────────────────────── -->
    <template v-if="!esTodos">
      <div v-if="store.loadingMetricasCampana && !store.metricasCampana"
           class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div v-for="i in 5" :key="i" class="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"/>
      </div>

      <div v-else-if="store.metricasCampana" class="grid grid-cols-2 lg:grid-cols-5 gap-4">

        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total giros</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {{ store.metricasCampana.totalGiros.toLocaleString() }}
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Ganadores</p>
          <p class="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {{ store.metricasCampana.totalGanadores.toLocaleString() }}
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Tasa ganadores</p>
          <p class="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {{ store.metricasCampana.porcentajeGanadores.toFixed(1) }}%
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Premios entregados</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {{ store.metricasCampana.premiosEntregados.toLocaleString() }}
          </p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Stock restante</p>
          <p class="mt-2 text-3xl font-bold"
             :class="store.metricasCampana.stockRestanteGlobal < 10
               ? 'text-red-600 dark:text-red-400'
               : 'text-gray-900 dark:text-white'">
            {{ store.metricasCampana.stockRestanteGlobal.toLocaleString() }}
          </p>
        </div>

      </div>

    </template><!-- /solo campaña específica -->

    <!-- ── Top Enroladores + Stock (Stock solo con campaña) ──────────────── -->
    <div :class="esTodos ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'">

      <!-- Top Enroladores -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Top Enroladores</h3>
          <span v-if="store.enroladores.length"
                class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {{ store.enroladores.length }} enroladores
          </span>
        </div>
        <div class="p-5">
          <div v-if="store.loadingEnroladores" class="space-y-3">
            <div v-for="i in 4" :key="i" class="h-7 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse"/>
          </div>
          <div v-else-if="store.enroladores.length">
            <div class="flex items-center gap-3 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
              <span class="w-28 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Enrolador</span>
              <span class="flex-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Giros</span>
              <span class="w-16 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Ganadores</span>
            </div>
            <div class="space-y-2.5">
              <div v-for="e in store.enroladores.slice(0, 8)" :key="e.id" class="flex items-center gap-3">
                <span class="text-sm text-gray-700 dark:text-gray-300 w-28 truncate flex-shrink-0"
                      :title="e.nombre">{{ e.nombre }}</span>
                <div class="flex-1 flex items-center gap-2">
                  <div class="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-700"
                         :style="{ width: `${(e.giros / maxGiros) * 100}%` }"/>
                  </div>
                  <span class="text-sm font-bold text-gray-800 dark:text-gray-200 w-8 text-right">{{ e.giros }}</span>
                </div>
                <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-8 text-right flex-shrink-0">
                  {{ e.afiliaciones }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            Sin datos de enroladores.
          </p>
        </div>
      </div>

      <!-- Stock de Premios: solo campaña específica -->
      <div v-if="!esTodos"
           class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Stock de Premios</h3>
          <span v-if="store.stockDashboard.some(s => s.alertaBajoStock)"
                class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
                       text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
            </svg>
            Stock bajo
          </span>
        </div>
        <div v-if="store.loadingStockDashboard" class="p-5 space-y-2">
          <div v-for="i in 4" :key="i" class="h-8 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse"/>
        </div>
        <div v-else-if="store.stockDashboard.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Premio</th>
                <th class="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th class="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Disponible</th>
                <th class="px-3 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="s in store.stockDashboard" :key="s.id"
                  class="hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors"
                  :class="s.stockDisponible === 0 ? 'bg-red-50/40 dark:bg-red-900/10' : s.alertaBajoStock ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''">
                <td class="px-4 py-2.5">
                  <span class="font-medium text-gray-800 dark:text-gray-200 truncate block max-w-[150px]"
                        :title="s.nombre">{{ s.nombre }}</span>
                </td>
                <td class="px-3 py-2.5 text-right text-gray-500 dark:text-gray-400">{{ s.stockTotal }}</td>
                <td class="px-3 py-2.5 text-right font-bold" :class="stockNumCls(s.stockDisponible, s.stockTotal)">
                  {{ s.stockDisponible }}
                </td>
                <td class="px-3 py-2.5 text-right">
                  <span v-if="s.stockDisponible === 0"
                        class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Agotado
                  </span>
                  <span v-else-if="s.alertaBajoStock"
                        class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {{ stockPct(s.stockDisponible, s.stockTotal) }}%
                  </span>
                  <span v-else
                        class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {{ stockPct(s.stockDisponible, s.stockTotal) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
          Sin premios con stock para esta campaña.
        </p>
      </div>

    </div>

      <!-- ── Filtros del Historial de Giros ─────────────────────────────────── -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Filtros del historial</h3>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Se aplican automáticamente a la tabla y a la exportación.</p>
          </div>
          <div class="flex items-center gap-2">
            <output v-if="store.loadingHistorial" aria-live="polite"
                  class="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Buscando…
            </output>
            <span v-if="cantidadFiltrosActivos" class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {{ cantidadFiltrosActivos }} activos
            </span>
          </div>
        </div>

        <form class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5" @submit.prevent="aplicarFiltros">
          <div class="xl:col-span-2">
            <label for="dash-premio-nombre" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Nombre del premio</label>
            <input
              id="dash-premio-nombre"
              v-model="filtros.premioNombre"
              type="search"
              maxlength="150"
              autocomplete="off"
              placeholder="Ej. Smartwatch"
              class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
          </div>

          <div>
            <label for="dash-segmento" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Grupo</label>
            <select id="dash-segmento" v-model="filtros.segmento" @change="aplicarFiltros" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
              <option value="">Todos los grupos</option>
              <option v-for="s in SEGMENTOS" :key="s" :value="s">{{ etiquetaSegmento(s) }}</option>
            </select>
          </div>

          <div>
            <label for="dash-estado" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Estado del premio</label>
            <select id="dash-estado" v-model="filtros.estado" @change="aplicarFiltros" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
              <option value="">Todos los resultados</option>
              <option value="Ganador">Ganó premio</option>
              <option value="SinPremio">Sigue intentando</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2 xl:col-span-1">
            <div>
              <label for="dash-fecha-inicio" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Desde</label>
              <input id="dash-fecha-inicio" v-model="filtros.fechaInicio" type="date" :max="filtros.fechaFin || undefined" @change="aplicarFiltros" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
            </div>
            <div>
              <label for="dash-fecha-fin" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Hasta</label>
              <input id="dash-fecha-fin" v-model="filtros.fechaFin" type="date" :min="filtros.fechaInicio || undefined" @change="aplicarFiltros" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
            </div>
          </div>

          <p v-if="fechaInvalida" class="text-xs text-red-600 md:col-span-2 xl:col-span-5" role="alert">
            La fecha inicial no puede ser posterior a la fecha final.
          </p>

          <div class="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-5">
            <button type="submit" :disabled="store.loadingHistorial || fechaInvalida" title="Aplica de inmediato, sin esperar la búsqueda automática" class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800">
              Aplicar ahora
            </button>
            <button type="button" :disabled="store.loadingHistorial || cantidadFiltrosActivos === 0" class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700" @click="limpiarFiltros">
              Limpiar
            </button>
          </div>
        </form>
      </div>

      <!-- ── Historial de Giros ────────────────────────────────────────────── -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

        <!-- Header historial -->
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Historial de Giros</h3>
            <span v-if="store.historialTotalRegistros > 0"
                  class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {{ store.historialTotalRegistros.toLocaleString() }} registros
            </span>
          </div>
          <!-- Botones exportar -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-gray-400 hidden sm:inline">Exportar:</span>
            <button @click="exportar('excel')"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                     bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40
                     text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Excel
            </button>
            <button @click="exportar('csv')"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                     bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40
                     text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              CSV
            </button>
          </div>
        </div>

        <!-- Skeleton historial -->
        <div v-if="store.loadingHistorial && !store.historialGiros.length" class="p-5 space-y-2">
          <div v-for="i in 5" :key="i" class="h-10 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse"/>
        </div>

        <!-- Tabla -->
        <div v-else-if="store.historialGiros.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cédula</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Grupo</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Enrolador</th>
                <th class="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Premio</th>
                <th class="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">¿Ganó?</th>
                <th class="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Código</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="g in store.historialGiros" :key="g.id"
                  class="hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors">
                <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ fmtFecha(g.fecha) }}
                </td>
                <td class="px-3 py-3 font-mono text-xs text-gray-700 dark:text-gray-200">
                  {{ g.identificacion || '—' }}
                </td>
                <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                  {{ g.grupo || '—' }}
                </td>
                <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 hidden md:table-cell">
                  {{ g.enroladorNombre || '—' }}
                </td>
                <td class="px-3 py-3 text-xs text-gray-700 dark:text-gray-200">
                  {{ g.premioNombre || '—' }}
                </td>
                <td class="px-3 py-3 text-center">
                  <span v-if="g.esGanador"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                               bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    Sí
                  </span>
                  <span v-else class="text-xs text-gray-400 dark:text-gray-500">No</span>
                </td>
                <td class="px-3 py-3 text-right font-mono text-xs text-gray-400 dark:text-gray-500 hidden sm:table-cell">
                  {{ g.codigoRedencion || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
          Sin giros registrados para esta campaña.
        </p>

        <!-- Paginación -->
        <div v-if="store.historialTotalPaginas > 1"
             class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-700">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            Página {{ store.historialPaginaActual }} de {{ store.historialTotalPaginas }}
            · {{ store.historialTotalRegistros.toLocaleString() }} registros
          </span>
          <div class="flex items-center gap-1">
            <!-- Primera -->
            <button @click="irPagina(1)"
              :disabled="store.historialPaginaActual === 1 || store.loadingHistorial"
              class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                     hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              </svg>
            </button>
            <!-- Anterior -->
            <button @click="irPagina(store.historialPaginaActual - 1)"
              :disabled="store.historialPaginaActual === 1 || store.loadingHistorial"
              class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                     hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <!-- Números de página -->
            <button v-for="p in paginasVisibles" :key="p"
              @click="irPagina(p)"
              :disabled="store.loadingHistorial"
              class="min-w-[2rem] h-8 px-1.5 rounded-lg text-xs font-medium transition-colors
                     disabled:opacity-50"
              :class="p === store.historialPaginaActual
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'">
              {{ p }}
            </button>

            <!-- Siguiente -->
            <button @click="irPagina(store.historialPaginaActual + 1)"
              :disabled="store.historialPaginaActual >= store.historialTotalPaginas || store.loadingHistorial"
              class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                     hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <!-- Última -->
            <button @click="irPagina(store.historialTotalPaginas)"
              :disabled="store.historialPaginaActual >= store.historialTotalPaginas || store.loadingHistorial"
              class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                     hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

      </div>

  </div>
</template>
