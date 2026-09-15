<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { MagnifyingGlassIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import FilterDropdown from '../components/FilterDropdown.vue'
import OtbRow from '../components/OtbRow.vue'
import { getOtb, exportOtb } from '../services/demandaOtbApi'
import { useOtbCalculations, rowKey, semaforoColor, semaforoDot } from '../composables/useOtbCalculations'
import type { NodoFila, OtbExportNivel3Item, OtbResponse } from '../types'

const route = useRoute()
const negocio = computed(() => route.params.negocio as string)

// ── Filtros de arriba (van al backend) ──────────────────────────────────────
const fecha = ref('')
const coleccion = ref('')
const marcaProveedor = ref('')
const origen = ref('')
const descontinuado = ref('')
const repocision = ref('')
const inactivo = ref('')
const skuBusqueda = ref('')

const otb = ref<OtbResponse | null>(null)
const loadingOtb = ref(false)
const errorOtb = ref<string | null>(null)

// ── Cobertura Deseada + Tipo de mes: ambas 100% cliente, no pegan al backend ──
// (mismo criterio que NEXUS_OTB_ENDPOINT_OTB.md §5: "Tipo de mes" solo re-pinta la tabla
// ya cargada con otra fórmula de Inventario Final, sin llamada nueva a la API).
const tipoMes = ref<'regular' | 'pico'>('regular')
const otbCalc = useOtbCalculations(otb, tipoMes)
const { coberturaDeseadaValue, pedidoValue, exportSelectedRows, toggleExportRow } = otbCalc

// Cambia en cada recarga de datos — forma parte del :key de cada OtbRow para forzar que Vue
// destruya/recree las filas (colapsa expand y limpia la caché de SKUs de golpe), igual que
// antes hacían los .clear() manuales de los Maps globales de drill-down.
const loadGen = ref(0)

async function cargarOtb() {
  loadingOtb.value = true
  errorOtb.value = null
  try {
    otb.value = await getOtb(negocio.value, {
      fecha: fecha.value || undefined,
      coleccion: coleccion.value || undefined,
      marcaProveedor: marcaProveedor.value || undefined,
      origen: origen.value || undefined,
      descontinuado: descontinuado.value || undefined,
      repocision: repocision.value || undefined,
      inactivo: inactivo.value || undefined,
      sku: skuBusqueda.value || undefined,
    })
    // El backend puede devolver otra fecha "más cercana" si no se pidió una explícita —
    // se sincroniza el selector con lo que realmente se está mostrando.
    fecha.value = otb.value.fecha
    loadGen.value++
  } catch (e) {
    otb.value = null
    errorOtb.value = e instanceof Error ? e.message : 'Error consultando el OTB.'
  } finally {
    loadingOtb.value = false
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch([coleccion, marcaProveedor, origen, descontinuado, repocision, inactivo, skuBusqueda], () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(cargarOtb, 400)
})
watch(fecha, (nuevo, anterior) => {
  if (anterior !== undefined && nuevo !== anterior) cargarOtb()
})

function handleClearFilters() {
  coleccion.value = ''
  marcaProveedor.value = ''
  origen.value = ''
  descontinuado.value = ''
  repocision.value = ''
  inactivo.value = ''
  skuBusqueda.value = ''
  colNivel1.value = ''
  colNivel2.value = ''
  colNivel3.value = ''
  colGenero.value = ''
  exportSelectedRows.clear()
  cargarOtb()
}

// ── Filtros de columna (Excel-style, en cascada sobre lo ya cargado) ────────
const colNivel1 = ref('')
const colNivel2 = ref('')
const colNivel3 = ref('')
const colGenero = ref('')

const rows = computed(() => otb.value?.rows ?? [])

const colNivel1Options = computed(() =>
  [...new Set(rows.value.map(r => r.nivel1).filter((v): v is string => !!v))].sort()
)
const colNivel2Options = computed(() => {
  const scope = colNivel1.value ? rows.value.filter(r => r.nivel1 === colNivel1.value) : rows.value
  return [...new Set(scope.map(r => r.nivel2).filter((v): v is string => !!v))].sort()
})
const colNivel3Options = computed(() => {
  let scope = rows.value
  if (colNivel1.value) scope = scope.filter(r => r.nivel1 === colNivel1.value)
  if (colNivel2.value) scope = scope.filter(r => r.nivel2 === colNivel2.value)
  return [...new Set(scope.map(r => r.nivel3).filter((v): v is string => !!v))].sort()
})
const colGeneroOptions = computed(() => {
  let scope = rows.value
  if (colNivel1.value) scope = scope.filter(r => r.nivel1 === colNivel1.value)
  if (colNivel2.value) scope = scope.filter(r => r.nivel2 === colNivel2.value)
  if (colNivel3.value) scope = scope.filter(r => r.nivel3 === colNivel3.value)
  return [...new Set(scope.map(r => r.genero).filter((v): v is string => !!v))].sort()
})

function buildNivel3MultipleForExport(): OtbExportNivel3Item[] | undefined {
  if (exportSelectedRows.size === 0) return undefined
  const items: OtbExportNivel3Item[] = []
  for (const row of rows.value) {
    if (!row.nivel3 || !exportSelectedRows.has(rowKey(row))) continue
    items.push({
      nivel3: row.nivel3,
      ...(row.genero ? { genero: row.genero } : {}),
      coberturaDeseada: coberturaDeseadaValue(row),
      pedido: pedidoValue(row),
    })
  }
  return items.length ? items : undefined
}

watch(colNivel1, () => { colNivel2.value = ''; colNivel3.value = '' })
watch(colNivel2, () => { colNivel3.value = '' })

// ── Orden por columna (clic en el encabezado, como el "▲" del dashboard original) ──
type SortField = 'nivel1' | 'nivel2' | 'nivel3' | 'genero' | 'skus' | 'stockInicial'
  | 'stockDia' | 'transito' | 'min80' | 'ventasPlanificada' | 'max80' | 'catNuevo'
  | 'ventasTotal' | 'coberturaDias'
const sortField = ref<SortField>('nivel1')
const sortDir = ref<'asc' | 'desc'>('asc')
function toggleSort(field: SortField) {
  if (sortField.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}
function sortIndicator(field: SortField) {
  if (sortField.value !== field) return ''
  return sortDir.value === 'asc' ? '▲' : '▼'
}

const filteredRows = computed(() => {
  const filtradas = rows.value.filter(r =>
    (!colNivel1.value || r.nivel1 === colNivel1.value)
    && (!colNivel2.value || r.nivel2 === colNivel2.value)
    && (!colNivel3.value || r.nivel3 === colNivel3.value)
    && (!colGenero.value || r.genero === colGenero.value)
  )
  const campo = sortField.value
  const signo = sortDir.value === 'asc' ? 1 : -1
  return [...filtradas].sort((a, b) => {
    const av = a[campo]
    const bv = b[campo]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv)) * signo
    return ((av as number) - (bv as number)) * signo
  })
})

// Pie de tabla: suma de lo que está filtrado ahora mismo (igual criterio que el "TOTAL (N
// nodos)" del dashboard original) — Tendencia/Decisión no se suman, no tiene sentido.
const SEMAFORO_ORDEN = ['CRITICO', 'BAJO', 'MARGINAL', 'OK', 'SOBRESTOCK', 'SIN DEMANDA']
const totales = computed(() => {
  const filas = filteredRows.value
  const sum = (f: (r: NodoFila) => number | null) => filas.reduce((acc, r) => acc + (f(r) ?? 0), 0)

  const conteoSemaforo = new Map<string, number>()
  for (const r of filas) {
    const key = r.semaforo ? r.semaforo.toUpperCase() : null
    if (!key) continue
    conteoSemaforo.set(key, (conteoSemaforo.get(key) ?? 0) + 1)
  }
  const semaforos = SEMAFORO_ORDEN
    .filter(s => conteoSemaforo.has(s))
    .map(s => ({ semaforo: s, cantidad: conteoSemaforo.get(s)! }))

  return {
    nodos: filas.length,
    skus: sum(r => r.skus),
    stockInicial: sum(r => r.stockInicial),
    stockDia: sum(r => r.stockDia),
    transito: sum(r => r.transito),
    // Mín/Máx 80% NO se suman fila por fila (es cuadratura, mismo motivo que en Niveles) y
    // probé que sumar Inv. Final Planificado/OTB fila por fila tampoco da el mismo total que
    // el dashboard original — no tengo confirmada su fórmula de agregación. Se dejan sin
    // sumar (null) en vez de mostrar un número que podría estar mal.
    min80: null,
    ventasPlanificada: sum(r => r.ventasPlanificada),
    max80: null,
    catNuevo: sum(r => r.catNuevo),
    ventasTotal: sum(r => r.ventasTotal),
    invFinalPlanificado: null,
    otb: null,
    semaforos,
  }
})

// Checkbox maestro del header "Seleccionar" — marca/quita todas las filas visibles
// (ya filtradas por columna) que tengan Nivel3, no todo lo cargado.
const nivel3CheckableRows = computed(() => filteredRows.value.filter(r => r.nivel3))
const allExportChecked = computed(() =>
  nivel3CheckableRows.value.length > 0 && nivel3CheckableRows.value.every(r => exportSelectedRows.has(rowKey(r)))
)
const someExportChecked = computed(() =>
  !allExportChecked.value && nivel3CheckableRows.value.some(r => exportSelectedRows.has(rowKey(r)))
)
function toggleExportAll() {
  if (allExportChecked.value) {
    nivel3CheckableRows.value.forEach(r => exportSelectedRows.delete(rowKey(r)))
  } else {
    nivel3CheckableRows.value.forEach(r => exportSelectedRows.add(rowKey(r)))
  }
}
const selectAllExportEl = ref<HTMLInputElement | null>(null)
watchEffect(() => {
  if (selectAllExportEl.value) selectAllExportEl.value.indeterminate = someExportChecked.value
})

// ── Exportar a Excel: ahora lo genera el backend (agrupación nativa + drill-down de
// TODOS los nodos filtrados, no solo los expandidos en pantalla) — ver
// NEXUS_OTB_ENDPOINT_OTB.md y la conversación sobre POST /otb/{negocio}/export.
const exportandoExcel = ref(false)
const errorExportExcel = ref<string | null>(null)

function buildExportParams() {
  return {
    fecha: fecha.value || undefined,
    tipoMes: tipoMes.value,
    nivel1: colNivel1.value || undefined,
    nivel2: colNivel2.value || undefined,
    nivel3: colNivel3.value || undefined,
    nivel3Multiple: buildNivel3MultipleForExport(),
    genero: colGenero.value || undefined,
    coleccion: coleccion.value || undefined,
    marcaProveedor: marcaProveedor.value || undefined,
    origen: origen.value || undefined,
    descontinuado: descontinuado.value || undefined,
    repocision: repocision.value || undefined,
    inactivo: inactivo.value || undefined,
    sku: skuBusqueda.value || undefined,
  }
}

async function exportarExcel() {
  exportandoExcel.value = true
  errorExportExcel.value = null
  try {
    const blob = await exportOtb(negocio.value, buildExportParams())

    // El backend siempre responde 200 con este endpoint incluso en error de validación,
    // pero como blob — si viene JSON en vez de un xlsx real, hay que leerlo aparte.
    if (blob.type.includes('json')) {
      const texto = await blob.text()
      const parseado = JSON.parse(texto) as { message?: string }
      throw new Error(parseado.message || 'Error generando el Excel.')
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `otb_${negocio.value}_${fecha.value}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    errorExportExcel.value = e instanceof Error ? e.message : 'Error generando el Excel.'
  } finally {
    exportandoExcel.value = false
  }
}

onMounted(cargarOtb)

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Filtros -->
    <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label for="otb-filtro-mes" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Mes objetivo</label>
          <div class="mt-1">
            <FilterDropdown id="otb-filtro-mes" v-model="fecha" :options="otb?.fechasDisponibles ?? []" :placeholder="loadingOtb ? 'Cargando...' : '—'" />
          </div>
        </div>

        <div>
          <label for="otb-filtro-coleccion" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Colección</label>
          <div class="mt-1">
            <FilterDropdown id="otb-filtro-coleccion" v-model="coleccion" :options="otb?.colecciones ?? []" placeholder="Todas" />
          </div>
        </div>

        <div>
          <label for="otb-filtro-marca-proveedor" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Marca proveedor</label>
          <div class="mt-1">
            <FilterDropdown id="otb-filtro-marca-proveedor" v-model="marcaProveedor" :options="otb?.marcasProveedor ?? []" placeholder="Todas" />
          </div>
        </div>

        <div>
          <label for="otb-filtro-origen" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Origen</label>
          <div class="mt-1">
            <FilterDropdown id="otb-filtro-origen" v-model="origen" :options="otb?.origenes ?? []" placeholder="Todos" />
          </div>
        </div>

        <div>
          <label for="otb-filtro-descontinuado" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Descontinuado</label>
          <div class="mt-1">
            <FilterDropdown id="otb-filtro-descontinuado" v-model="descontinuado" :options="otb?.descontinuados ?? []" placeholder="Todos" />
          </div>
        </div>

        <div>
          <label for="otb-filtro-reposicion" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Reposición</label>
          <div class="mt-1">
            <FilterDropdown id="otb-filtro-reposicion" v-model="repocision" :options="otb?.repociones ?? []" placeholder="Todas" />
          </div>
        </div>

        <div>
          <label for="otb-filtro-inactivo" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Inactivo</label>
          <div class="mt-1">
            <FilterDropdown id="otb-filtro-inactivo" v-model="inactivo" :options="otb?.inactivos ?? []" placeholder="Todos" />
          </div>
        </div>

        <div>
          <label for="otb-buscar-sku" class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Buscar SKU</label>
          <div class="relative mt-1">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="otb-buscar-sku"
              v-model="skuBusqueda"
              type="text"
              placeholder="Código o nombre..."
              class="w-full pl-9 pr-3 py-2 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border text-sm"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 mt-3">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo de mes:</span>
          <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              @click="tipoMes = 'regular'"
              class="px-3 py-1.5 text-sm font-medium transition-colors"
              :class="tipoMes === 'regular' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
            >Regular</button>
            <button
              type="button"
              @click="tipoMes = 'pico'"
              class="px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700"
              :class="tipoMes === 'pico' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
            >Pico</button>
          </div>
          <span v-if="otb" class="text-xs text-gray-400 dark:text-gray-500">
            {{ filteredRows.length }} de {{ otb.rows.length }} nodos (Nivel1/2/3/Género)
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handleClearFilters"
            class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium"
          >
            <ArrowPathIcon class="w-4 h-4" />
            <span>Limpiar filtros</span>
          </button>

          <span
            v-if="exportSelectedRows.size > 0"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium"
            title="Filas marcadas con 'Nivel 3 → Excel' — el Excel exportado solo traerá estas"
          >
            {{ exportSelectedRows.size }} fila{{ exportSelectedRows.size === 1 ? '' : 's' }} para Excel
            <button
              type="button"
              @click="exportSelectedRows.clear()"
              class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
              title="Limpiar selección (solo esto, no afecta los demás filtros)"
            >
              <XMarkIcon class="w-3.5 h-3.5" />
            </button>
          </span>

          <button
            @click="exportarExcel"
            :disabled="!otb || exportandoExcel"
            class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon class="w-4 h-4" />
            <span>{{ exportandoExcel ? 'Generando...' : 'Exportar a Excel' }}</span>
          </button>
        </div>
      </div>

      <p v-if="errorExportExcel" class="text-xs text-red-600 dark:text-red-400 mt-2">{{ errorExportExcel }}</p>

      <p v-if="otb" class="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Catálogo nuevo: {{ otb.catNuevoTotal.toLocaleString() }} uds<span v-if="!otb.catNuevoAplicable"> (no aplica con este filtro)</span>
        · {{ otb.nodosMarcados }} nodo(s) con exceso a revisar
        · {{ otb.nodosTopados }} nodo(s) con catálogo nuevo topado
        <span v-if="otb.filtrado"> — filtrado: algunos campos no disponibles con este filtro</span>
      </p>
    </div>

    <div v-if="errorOtb" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded p-3">
      {{ errorOtb }}
    </div>

    <!-- Tabla -->
    <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table class="w-full text-left text-sm">
          <thead class="sticky top-0 z-10">
            <tr class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th scope="col" class="w-8"></th>
              <th scope="col" class="px-3 py-2 min-w-[150px] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('nivel1')">Nivel 1 {{ sortIndicator('nivel1') }}</th>
              <th scope="col" class="px-3 py-2 min-w-[150px] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('nivel2')">Nivel 2 {{ sortIndicator('nivel2') }}</th>
              <th scope="col" class="px-3 py-2 min-w-[150px] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('nivel3')">Nivel 3 {{ sortIndicator('nivel3') }}</th>
              <th scope="col" class="px-3 py-2 min-w-[130px] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('genero')">Género {{ sortIndicator('genero') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('skus')">SKUs {{ sortIndicator('skus') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('stockInicial')">Stock inicial {{ sortIndicator('stockInicial') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('stockDia')">Stock día <span v-if="otb?.diaEjecucionBi"> {{ otb.diaEjecucionBi }}</span> {{ sortIndicator('stockDia') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('transito')">Tránsito {{ sortIndicator('transito') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('min80')">Mín 80% {{ sortIndicator('min80') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('ventasPlanificada')">Ventas planificada {{ sortIndicator('ventasPlanificada') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('max80')">Máx 80% {{ sortIndicator('max80') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('catNuevo')">Catálogo nuevo {{ sortIndicator('catNuevo') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('ventasTotal')">Total nivel {{ sortIndicator('ventasTotal') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right" title="Editable — recalcula Inv. Final Planificado; no recalcula Semáforo/Decisión, ver nota abajo">Cobertura deseada</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right" title="Calculado en el cliente — ver nota abajo">Inv. Final Planificado</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Semáforo</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('coberturaDias')">Cobertura (días) {{ sortIndicator('coberturaDias') }}</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tendencia</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Decisión</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right" title="Calculado en el cliente — ver nota abajo">OTB</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Pedido</th>
              <th scope="col" class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center" title="Marca filas puntuales (Nivel3+Género) para exportar solo esas al Excel, con su Pedido editado">
                <div class="flex items-center justify-center gap-1.5">
                  <input
                    ref="selectAllExportEl"
                    type="checkbox"
                    :checked="allExportChecked"
                    title="Marcar/quitar todas las filas visibles"
                    @change="toggleExportAll"
                  />
                  <span>Seleccionar</span>
                </div>
              </th>
            </tr>
            <tr class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th scope="col"></th>
              <th scope="col" class="px-2 pb-2"><FilterDropdown v-model="colNivel1" :options="colNivel1Options" placeholder="Todos" /></th>
              <th scope="col" class="px-2 pb-2"><FilterDropdown v-model="colNivel2" :options="colNivel2Options" placeholder="Todos" /></th>
              <th scope="col" class="px-2 pb-2"><FilterDropdown v-model="colNivel3" :options="colNivel3Options" placeholder="Todos" /></th>
              <th scope="col" class="px-2 pb-2"><FilterDropdown v-model="colGenero" :options="colGeneroOptions" placeholder="Todos" /></th>
              <th scope="col" colspan="18"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60">
            <tr v-if="loadingOtb">
              <td colspan="23" class="px-4 py-10 text-center text-sm text-gray-400">Cargando OTB...</td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="23" class="px-4 py-10 text-center text-sm text-gray-400">Sin resultados para estos filtros</td>
            </tr>
            <OtbRow
              v-else
              v-for="row in filteredRows"
              :key="rowKey(row) + '|' + loadGen"
              :row="row"
              :negocio="negocio"
              :fecha="otb?.fecha ?? ''"
              :calc="otbCalc"
            />
          </tbody>
          <tfoot v-if="filteredRows.length > 0" class="sticky bottom-0">
            <tr class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 font-bold text-gray-900 dark:text-white">
              <td></td>
              <td colspan="4" class="px-3 py-2">TOTAL ({{ totales.nodos }} nodo{{ totales.nodos === 1 ? '' : 's' }})</td>
              <td class="px-3 py-2 text-right">{{ totales.skus }}</td>
              <td class="px-3 py-2 text-right">{{ totales.stockInicial }}</td>
              <td class="px-3 py-2 text-right">{{ totales.stockDia }}</td>
              <td class="px-3 py-2 text-right">{{ totales.transito }}</td>
              <td class="px-3 py-2 text-right text-gray-400" title="No se suma linealmente (cuadratura)">—</td>
              <td class="px-3 py-2 text-right">{{ totales.ventasPlanificada }}</td>
              <td class="px-3 py-2 text-right text-gray-400" title="No se suma linealmente (cuadratura)">—</td>
              <td class="px-3 py-2 text-right">{{ totales.catNuevo }}</td>
              <td class="px-3 py-2 text-right">{{ totales.ventasTotal }}</td>
              <td></td>
              <td class="px-3 py-2 text-right text-gray-400" title="Fórmula de agregación no confirmada">—</td>
              <td class="px-3 py-2">
                <span class="flex items-center gap-2">
                  <span v-for="s in totales.semaforos" :key="s.semaforo" class="flex items-center gap-1" :class="semaforoColor(s.semaforo)">
                    <span class="w-2 h-2 rounded-full flex-shrink-0" :class="semaforoDot(s.semaforo)"></span>
                    {{ s.cantidad }}
                  </span>
                </span>
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td class="px-3 py-2 text-right text-gray-400" title="Fórmula de agregación no confirmada">—</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <p class="text-xs text-gray-400 dark:text-gray-500">
      "Inv. Final Planificado" y "OTB" se recalculan en el cliente al cambiar Cobertura deseada o
      Tipo de mes (Regular/Pico) — fórmulas confirmadas en <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">NEXUS_OTB_ENDPOINT_OTB.md §5</code>
      y <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">NEXUS_OTB_BUG_INVFINAL.md</code> (el catálogo nuevo nunca entra a
      ninguna de las dos, solo usan Ventas Planificada).
      "Semáforo", "Cobertura (días)" y "Decisión" son los que calculó BI para la Cobertura
      objetivo original ({{ otb?.otbParams.target ?? 90 }} días) — todavía no se recalculan al
      editar Cobertura deseada porque no tengo confirmada la fórmula que convierte el nuevo OTB
      en un Semáforo (aunque ya tengo la matriz de Decisión lista para usar en cuanto se confirme).
    </p>
  </div>
</template>
