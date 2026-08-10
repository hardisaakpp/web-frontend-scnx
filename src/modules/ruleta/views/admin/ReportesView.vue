<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import VolverButton from '@/components/VolverButton.vue'
import { ruletaService } from '../../services/ruletaApi'
import { useAdminStore } from '../../stores/adminStore'
import type {
  DistribucionSegmentos,
  EstadoPremioFiltro,
  GiroFilters,
  HistorialGiroItem,
  SegmentoCliente
} from '../../types'

const store = useAdminStore()
const PAGE_SIZE = 15
const RADIO_DONA = 42
const CIRCUNFERENCIA_DONA = 2 * Math.PI * RADIO_DONA

const SEGMENTOS: SegmentoCliente[] = [
  'GRUPO_1', 'GRUPO_2', 'GRUPO_3', 'GRUPO_4', 'GRUPO_5', 'GRUPO_6'
]

const COLORES_SEGMENTO: Record<SegmentoCliente, string> = {
  GRUPO_1: '#4f46e5',
  GRUPO_2: '#0d9488',
  GRUPO_3: '#f59e0b',
  GRUPO_4: '#64748b',
  GRUPO_5: '#a855f7',
  GRUPO_6: '#e11d48'
}

const filtros = reactive({
  campanaId: '',
  premioNombre: '',
  segmento: '' as SegmentoCliente | '',
  fechaInicio: '',
  fechaFin: '',
  estado: '' as EstadoPremioFiltro | ''
})

const filtrosAplicados = ref<GiroFilters>({})
const registros = ref<HistorialGiroItem[]>([])
const distribucion = ref<DistribucionSegmentos>({ labels: [...SEGMENTOS], data: SEGMENTOS.map(() => 0) })
const totalRegistros = ref(0)
const totalPaginas = ref(0)
const paginaActual = ref(1)
const loading = ref(false)
const exporting = ref(false)
const errorMsg = ref<string | null>(null)
let ultimaSolicitud = 0

const fechaInvalida = computed(() =>
  Boolean(filtros.fechaInicio && filtros.fechaFin && filtros.fechaInicio > filtros.fechaFin)
)

const cantidadFiltrosActivos = computed(() => [
  filtrosAplicados.value.premioNombre,
  filtrosAplicados.value.segmento,
  filtrosAplicados.value.fechaInicio,
  filtrosAplicados.value.fechaFin,
  filtrosAplicados.value.estado
].filter(Boolean).length)

const totalDistribucion = computed(() => distribucion.value.data.reduce((total, valor) => total + valor, 0))
const totalZonaCaliente = computed(() => distribucion.value.data.slice(0, 3).reduce((total, valor) => total + valor, 0))
const totalZonaCero = computed(() => distribucion.value.data.slice(3, 6).reduce((total, valor) => total + valor, 0))

const segmentosGrafico = computed(() => {
  let acumulado = 0
  return SEGMENTOS.map((segmento, index) => {
    const cantidad = distribucion.value.data[index] ?? 0
    const proporcion = totalDistribucion.value > 0 ? cantidad / totalDistribucion.value : 0
    const longitud = proporcion * CIRCUNFERENCIA_DONA
    const item = {
      segmento,
      cantidad,
      porcentaje: proporcion * 100,
      color: COLORES_SEGMENTO[segmento],
      longitud,
      desplazamiento: -acumulado
    }
    acumulado += longitud
    return item
  })
})

onMounted(async () => {
  await store.cargarCampanas()
  if (store.campanas.length > 0) {
    filtros.campanaId = store.campanas[0].id
    await aplicarFiltros()
  }
})

function construirFiltros(): GiroFilters {
  return {
    campanaId: filtros.campanaId || undefined,
    premioNombre: filtros.premioNombre.trim() || undefined,
    segmento: filtros.segmento || undefined,
    fechaInicio: filtros.fechaInicio || undefined,
    fechaFin: filtros.fechaFin || undefined,
    estado: filtros.estado || undefined
  }
}

async function onCampanaChange(event: Event) {
  filtros.campanaId = (event.target as HTMLSelectElement).value
  await aplicarFiltros()
}

async function aplicarFiltros() {
  if (!filtros.campanaId || fechaInvalida.value) return
  filtrosAplicados.value = construirFiltros()
  await cargarPagina(1)
}

async function limpiarFiltros() {
  filtros.premioNombre = ''
  filtros.segmento = ''
  filtros.fechaInicio = ''
  filtros.fechaFin = ''
  filtros.estado = ''
  await aplicarFiltros()
}

async function cargarPagina(pagina: number) {
  if (!filtrosAplicados.value.campanaId) return

  const solicitudActual = ++ultimaSolicitud
  loading.value = true
  errorMsg.value = null

  try {
    const [historial, segmentos] = await Promise.all([
      ruletaService.getHistorialGiros(filtrosAplicados.value, pagina, PAGE_SIZE),
      ruletaService.getDistribucionSegmentos(filtrosAplicados.value)
    ])

    if (solicitudActual !== ultimaSolicitud) return

    registros.value = historial.items
    totalRegistros.value = historial.totalRegistros
    totalPaginas.value = historial.totalPaginas
    paginaActual.value = historial.paginaActual
    distribucion.value = segmentos
  } catch {
    if (solicitudActual !== ultimaSolicitud) return
    errorMsg.value = 'No pudimos cargar el historial. Intenta nuevamente.'
    registros.value = []
    totalRegistros.value = 0
    totalPaginas.value = 0
    distribucion.value = { labels: [...SEGMENTOS], data: SEGMENTOS.map(() => 0) }
  } finally {
    if (solicitudActual === ultimaSolicitud) loading.value = false
  }
}

async function exportarCsv() {
  if (!filtrosAplicados.value.campanaId || exporting.value) return
  exporting.value = true
  errorMsg.value = null
  try {
    await ruletaService.exportarGirosCsv(filtrosAplicados.value)
  } catch {
    errorMsg.value = 'No se pudo exportar el historial. Intenta nuevamente.'
  } finally {
    exporting.value = false
  }
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function etiquetaSegmento(segmento: string): string {
  return segmento.replace('_', ' ')
}

function getGrupoCls(grupo: string): string {
  switch (grupo) {
    case 'GRUPO_1': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'GRUPO_2': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'GRUPO_3': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'GRUPO_4': return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400'
    case 'GRUPO_5': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
    case 'GRUPO_6': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }
}
</script>

<template>
  <div class="space-y-5">
    <VolverButton to="/ruleta/admin" label="Administración" />

    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Historial de giros</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Audita premios, segmentos y resultados por campaña.
        </p>
      </div>
      <div class="w-full sm:w-72">
        <label for="campana-reporte" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Campaña
        </label>
        <select
          id="campana-reporte"
          :value="filtros.campanaId"
          :disabled="store.loadingCampanas"
          class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @change="onCampanaChange"
        >
          <option value="" disabled>Selecciona una campaña</option>
          <option v-for="campana in store.campanas" :key="campana.id" :value="campana.id">
            {{ campana.nombre }}
          </option>
        </select>
      </div>
    </header>

    <section class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-labelledby="filtros-title">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 id="filtros-title" class="text-sm font-semibold text-gray-900 dark:text-white">Filtros estratégicos</h3>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Los filtros también se aplican al gráfico y a la exportación.</p>
        </div>
        <span v-if="cantidadFiltrosActivos" class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          {{ cantidadFiltrosActivos }} activos
        </span>
      </div>

      <form class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5" @submit.prevent="aplicarFiltros">
        <div class="xl:col-span-2">
          <label for="premio-nombre" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Nombre del premio</label>
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
            </svg>
            <input
              id="premio-nombre"
              v-model="filtros.premioNombre"
              type="search"
              maxlength="150"
              autocomplete="off"
              placeholder="Ej. Smartwatch"
              class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
          </div>
        </div>

        <div>
          <label for="segmento" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Grupo</label>
          <select id="segmento" v-model="filtros.segmento" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
            <option value="">Todos los grupos</option>
            <option v-for="segmento in SEGMENTOS" :key="segmento" :value="segmento">{{ etiquetaSegmento(segmento) }}</option>
          </select>
        </div>

        <div>
          <label for="estado-premio" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Estado del premio</label>
          <select id="estado-premio" v-model="filtros.estado" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
            <option value="">Todos los resultados</option>
            <option value="Ganador">Ganó premio</option>
            <option value="SinPremio">Sigue intentando</option>
            <option value="Redimido">Redimido</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2 xl:col-span-1">
          <div>
            <label for="fecha-inicio" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Desde</label>
            <input id="fecha-inicio" v-model="filtros.fechaInicio" type="date" :max="filtros.fechaFin || undefined" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
          </div>
          <div>
            <label for="fecha-fin" class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Hasta</label>
            <input id="fecha-fin" v-model="filtros.fechaFin" type="date" :min="filtros.fechaInicio || undefined" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
          </div>
        </div>

        <p v-if="fechaInvalida" class="text-xs text-red-600 md:col-span-2 xl:col-span-5" role="alert">
          La fecha inicial no puede ser posterior a la fecha final.
        </p>

        <div class="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-5">
          <button type="submit" :disabled="loading || !filtros.campanaId || fechaInvalida" class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800">
            Aplicar filtros
          </button>
          <button type="button" :disabled="loading || cantidadFiltrosActivos === 0" class="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700" @click="limpiarFiltros">
            Limpiar
          </button>
        </div>
      </form>
    </section>

    <div v-if="errorMsg" class="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300" role="alert">
      <span>{{ errorMsg }}</span>
      <button type="button" class="font-semibold underline underline-offset-2" @click="cargarPagina(paginaActual)">Reintentar</button>
    </div>

    <section class="grid grid-cols-1 gap-5 xl:grid-cols-3" aria-labelledby="distribucion-title">
      <div class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 xl:col-span-2" :aria-busy="loading">
        <div class="mb-5">
          <h3 id="distribucion-title" class="text-sm font-semibold text-gray-900 dark:text-white">Distribución de giros por grupo</h3>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Datos nativos de OneCard; los seis grupos permanecen visibles.</p>
        </div>

        <div class="grid items-center gap-6 md:grid-cols-[220px_1fr]">
          <div class="relative mx-auto h-52 w-52">
            <svg viewBox="0 0 100 100" class="h-full w-full" role="img" aria-labelledby="dona-title dona-description">
              <title id="dona-title">Distribución de giros por grupo</title>
              <desc id="dona-description">{{ totalDistribucion }} giros distribuidos entre los grupos uno al seis.</desc>
              <circle cx="50" cy="50" :r="RADIO_DONA" fill="none" stroke="currentColor" stroke-width="14" class="text-gray-100 dark:text-gray-700" />
              <circle
                v-for="segmento in segmentosGrafico"
                :key="segmento.segmento"
                cx="50"
                cy="50"
                :r="RADIO_DONA"
                fill="none"
                :stroke="segmento.color"
                stroke-width="14"
                stroke-linecap="butt"
                :stroke-dasharray="`${segmento.longitud} ${CIRCUNFERENCIA_DONA}`"
                :stroke-dashoffset="segmento.desplazamiento"
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="48" text-anchor="middle" class="fill-gray-900 text-[11px] font-bold dark:fill-white">{{ totalDistribucion.toLocaleString() }}</text>
              <text x="50" y="58" text-anchor="middle" class="fill-gray-400 text-[5px] font-medium uppercase tracking-wide">giros</text>
            </svg>
          </div>

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div v-for="segmento in segmentosGrafico" :key="segmento.segmento" class="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-700">
              <div class="flex items-center gap-2.5">
                <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: segmento.color }" aria-hidden="true" />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ etiquetaSegmento(segmento.segmento) }}</span>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ segmento.cantidad.toLocaleString() }}</p>
                <p class="text-[11px] text-gray-400">{{ segmento.porcentaje.toFixed(1) }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <article class="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/50">
          <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Zona caliente</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ totalZonaCaliente.toLocaleString() }}</p>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">Giros de GRUPO 1, 2 y 3 que compiten por premios físicos.</p>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-500/10 hover:border-slate-300 dark:hover:border-slate-500/50">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Zona cero</p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ totalZonaCero.toLocaleString() }}</p>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">Giros de GRUPO 4, 5 y 6 con premio de consolación.</p>
        </article>
      </div>
    </section>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <strong class="font-semibold text-gray-800 dark:text-gray-200">{{ totalRegistros.toLocaleString() }}</strong> resultados con los filtros aplicados
      </p>
      <button type="button" :disabled="!filtrosAplicados.campanaId || loading || exporting" class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" @click="exportarCsv">
        <svg class="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />
        </svg>
        {{ exporting ? 'Exportando…' : 'Exportar resultados CSV' }}
      </button>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-white">Detalle de participaciones</h3>
        <span v-if="totalPaginas" class="text-xs text-gray-400">Página {{ paginaActual }} de {{ totalPaginas }}</span>
      </div>

      <div v-if="loading" class="flex justify-center py-14" role="status" aria-label="Cargando historial">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Fecha</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Identificación</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Grupo</th>
              <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Tienda</th>
              <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Enrolador</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Premio</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Resultado</th>
              <th class="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Código</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">Redimido</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="registro in registros" :key="registro.id" class="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-700/20">
              <td class="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatearFecha(registro.fecha) }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-200">{{ registro.identificacion }}</td>
              <td class="px-4 py-3">
                <span v-if="registro.segmento" :class="getGrupoCls(registro.segmento)" class="whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium">{{ etiquetaSegmento(registro.segmento) }}</span>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="hidden px-4 py-3 text-gray-600 dark:text-gray-300 md:table-cell">{{ registro.tiendaCodigo || '—' }}</td>
              <td class="hidden px-4 py-3 text-gray-600 dark:text-gray-300 lg:table-cell">{{ registro.enroladorNombre ?? '—' }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
                <p class="font-medium">{{ registro.premioNombre || 'Sin premio' }}</p>
                <p v-if="registro.premioTipo" class="text-xs text-gray-400">{{ registro.premioTipo }}</p>
              </td>
              <td class="px-4 py-3">
                <span v-if="registro.esGanador" class="whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Ganó</span>
                <span v-else class="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">Sigue intentando</span>
              </td>
              <td class="hidden px-4 py-3 sm:table-cell">
                <span v-if="registro.codigoRedencion" class="font-mono text-xs text-indigo-600 dark:text-indigo-400">{{ registro.codigoRedencion }}</span>
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="sr-only">{{ registro.redimido ? 'Sí' : 'No' }}</span>
                <span :class="registro.redimido ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'" class="inline-block h-2.5 w-2.5 rounded-full" aria-hidden="true" />
              </td>
            </tr>
            <tr v-if="registros.length === 0">
              <td colspan="9" class="px-4 py-12 text-center">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-300">No encontramos giros con estos filtros.</p>
                <button v-if="cantidadFiltrosActivos" type="button" class="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400" @click="limpiarFiltros">Limpiar filtros</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <nav v-if="totalPaginas > 1" class="flex items-center justify-center gap-2" aria-label="Paginación del historial">
      <button type="button" :disabled="paginaActual <= 1 || loading" class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" @click="cargarPagina(paginaActual - 1)">Anterior</button>
      <span class="px-2 text-sm text-gray-500 dark:text-gray-400">{{ paginaActual }} / {{ totalPaginas }}</span>
      <button type="button" :disabled="paginaActual >= totalPaginas || loading" class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" @click="cargarPagina(paginaActual + 1)">Siguiente</button>
    </nav>
  </div>
</template>
