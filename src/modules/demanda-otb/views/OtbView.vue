<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { MagnifyingGlassIcon, ArrowPathIcon, ArrowDownTrayIcon, ChevronRightIcon, ChevronDownIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/vue/24/outline'
import FilterDropdown from '../components/FilterDropdown.vue'
import { getOtb, getOtbSkus, exportOtb } from '../services/demandaOtbApi'
import type { NodoFila, OtbResponse, OtbSkuItem } from '../types'

const route = useRoute()
const negocio = computed(() => route.params.negocio as string)

const SEMAFORO_COLOR: Record<string, string> = {
  OK: 'text-emerald-600 dark:text-emerald-400',
  BAJO: 'text-amber-600 dark:text-amber-400',
  CRITICO: 'text-red-600 dark:text-red-400',
  SOBRESTOCK: 'text-blue-600 dark:text-blue-400',
  MARGINAL: 'text-gray-500 dark:text-gray-400',
  'SIN DEMANDA': 'text-gray-500 dark:text-gray-400',
}
const SEMAFORO_DOT: Record<string, string> = {
  OK: 'bg-emerald-500',
  BAJO: 'bg-amber-500',
  CRITICO: 'bg-red-500',
  SOBRESTOCK: 'bg-blue-500',
  MARGINAL: 'bg-gray-400',
  'SIN DEMANDA': 'bg-gray-400',
}
function semaforoColor(v: string | null) {
  return v ? SEMAFORO_COLOR[v.toUpperCase()] ?? 'text-gray-900 dark:text-white' : 'text-gray-400'
}
function semaforoDot(v: string | null) {
  return v ? SEMAFORO_DOT[v.toUpperCase()] ?? 'bg-gray-400' : 'bg-gray-300 dark:bg-gray-600'
}

const TENDENCIA_COLOR: Record<string, string> = {
  ACELERANDO: 'text-emerald-600 dark:text-emerald-400',
  ESTABLE: 'text-gray-500 dark:text-gray-400',
  DESACELERANDO: 'text-red-600 dark:text-red-400',
}
function tendenciaColor(v: string | null) {
  return v ? TENDENCIA_COLOR[v.toUpperCase()] ?? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
}

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
    // Los nodos cambiaron: el drill-down expandido y su caché ya no son válidos.
    expandedKeys.clear()
    skusCache.clear()
    skusLoading.clear()
    skusError.clear()
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

watch(colNivel1, () => { colNivel2.value = ''; colNivel3.value = '' })
watch(colNivel2, () => { colNivel3.value = '' })

// ── Orden por columna (clic en el encabezado, como el "▲" del dashboard original) ──
type SortField = 'nivel1' | 'nivel2' | 'nivel3' | 'genero' | 'skus' | 'stockInicial'
  | 'stockDia' | 'transito' | 'min80' | 'ventasPlanificada' | 'max80' | 'catNuevo'
  | 'ventasTotal' | 'coberturaDias' | 'sugerenciaCompra'
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
    sugerenciaCompra: sum(r => r.sugerenciaCompra),
    semaforos,
  }
})

// ── Drill-down [+] por Nivel1×Nivel2×Nivel3 (sin Género — así lo expone el backend) ──
function nodeKey(row: NodoFila) {
  return `${row.nivel1}|${row.nivel2}|${row.nivel3}`
}

const expandedKeys = reactive(new Set<string>())
const skusCache = reactive(new Map<string, OtbSkuItem[]>())
const skusLoading = reactive(new Set<string>())
const skusError = reactive(new Map<string, string>())

async function toggleExpand(row: NodoFila) {
  const key = nodeKey(row)
  if (expandedKeys.has(key)) {
    expandedKeys.delete(key)
    return
  }
  expandedKeys.add(key)
  if (skusCache.has(key) || skusLoading.has(key)) return

  skusLoading.add(key)
  skusError.delete(key)
  try {
    const resultado = await getOtbSkus(negocio.value, row.nivel1 ?? '', row.nivel2 ?? '', row.nivel3 ?? '', otb.value!.fecha)
    skusCache.set(key, resultado.skus)
  } catch (e) {
    skusError.set(key, e instanceof Error ? e.message : 'Error consultando los SKUs de este nodo.')
  } finally {
    skusLoading.delete(key)
  }
}

// ── Cobertura Deseada + Tipo de mes: ambas 100% cliente, no pegan al backend ──
// (mismo criterio que NEXUS_OTB_ENDPOINT_OTB.md §5: "Tipo de mes" solo re-pinta la tabla
// ya cargada con otra fórmula de Inventario Final, sin llamada nueva a la API).
const tipoMes = ref<'regular' | 'pico'>('regular')

const coberturaDeseada = reactive(new Map<string, number>())
function rowKey(row: NodoFila) {
  return nodeKey(row) + '|' + row.genero
}
function coberturaDeseadaValue(row: NodoFila) {
  const key = rowKey(row)
  if (!coberturaDeseada.has(key)) {
    coberturaDeseada.set(key, otb.value?.otbParams.target ?? 90)
  }
  return coberturaDeseada.get(key)!
}
function setCoberturaDeseada(row: NodoFila, value: number) {
  coberturaDeseada.set(rowKey(row), value)
}

// Fórmula literal de NEXUS_OTB_ENDPOINT_OTB.md §5 (otbInvFinal): Inventario Final Planificado
// para la Cobertura Deseada editada, usando el ritmo de venta diario (Total Nivel = ventas +
// catálogo nuevo — NUNCA entra a este cálculo, es una estimación de productos que
// todavía no existen: solo informativa, no participa en inventario/compra, ver
// NEXUS_OTB_BUG_INVFINAL.md). En modo "pico" el ritmo diario se calcula sobre 1/3 del
// mes (demanda concentrada), no sobre el mes completo.
function invFinalPlanificado(row: NodoFila) {
  const ventas = row.ventasPlanificada ?? 0
  const cobertura = coberturaDeseadaValue(row)
  const ritmoDiario = tipoMes.value === 'pico' ? (ventas / 3) / 30 : ventas / 30
  return cobertura * ritmoDiario
}

// OTB = Inv. Final Planificado + Ventas Planificada − Stock Inicial − Tránsito
// (NEXUS_OTB_BUG_INVFINAL.md §4-5, otbCalc() del original).
function otbUnidades(row: NodoFila) {
  const ventas = row.ventasPlanificada ?? 0
  const stock = row.stockInicial ?? 0
  const transito = row.transito ?? 0
  return invFinalPlanificado(row) + ventas - stock - transito
}

// ── Mismo cálculo, a nivel de SKU individual (filas del drill-down) — Cobertura Deseada
// propia por SKU, igual que en el dashboard original. `/otb/skus` no trae Tránsito por SKU
// (solo a nivel de nodo), así que el OTB por SKU queda sin ese descuento — aproximado, no
// idéntico al nodo padre.
const coberturaDeseadaSku = reactive(new Map<string, number>())
function coberturaDeseadaSkuValue(sku: OtbSkuItem) {
  if (!coberturaDeseadaSku.has(sku.codigo)) {
    coberturaDeseadaSku.set(sku.codigo, otb.value?.otbParams.target ?? 90)
  }
  return coberturaDeseadaSku.get(sku.codigo)!
}
function setCoberturaDeseadaSku(sku: OtbSkuItem, value: number) {
  coberturaDeseadaSku.set(sku.codigo, value)
}
function invFinalPlanificadoSku(sku: OtbSkuItem) {
  const ventas = sku.predUnidades ?? 0
  const cobertura = coberturaDeseadaSkuValue(sku)
  const ritmoDiario = tipoMes.value === 'pico' ? (ventas / 3) / 30 : ventas / 30
  return cobertura * ritmoDiario
}
function otbUnidadesSku(sku: OtbSkuItem) {
  const ventas = sku.predUnidades ?? 0
  const stock = sku.stockInicial ?? 0
  return invFinalPlanificadoSku(sku) + ventas - stock
}

// ── Exportar a Excel: ahora lo genera el backend (agrupación nativa + drill-down de
// TODOS los nodos filtrados, no solo los expandidos en pantalla) — ver
// NEXUS_OTB_ENDPOINT_OTB.md y la conversación sobre POST /otb/{negocio}/export.
const exportandoExcel = ref(false)
const errorExportExcel = ref<string | null>(null)

async function exportarExcel() {
  exportandoExcel.value = true
  errorExportExcel.value = null
  try {
    const blob = await exportOtb(negocio.value, {
      fecha: fecha.value || undefined,
      tipoMes: tipoMes.value,
      nivel1: colNivel1.value || undefined,
      nivel2: colNivel2.value || undefined,
      nivel3: colNivel3.value || undefined,
      genero: colGenero.value || undefined,
      coleccion: coleccion.value || undefined,
      marcaProveedor: marcaProveedor.value || undefined,
      origen: origen.value || undefined,
      descontinuado: descontinuado.value || undefined,
      repocision: repocision.value || undefined,
      inactivo: inactivo.value || undefined,
      sku: skuBusqueda.value || undefined,
    })

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
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Mes objetivo</label>
          <div class="mt-1 w-36">
            <FilterDropdown v-model="fecha" :options="otb?.fechasDisponibles ?? []" :placeholder="loadingOtb ? 'Cargando...' : '—'" />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Colección</label>
          <div class="mt-1 w-40">
            <FilterDropdown v-model="coleccion" :options="otb?.colecciones ?? []" placeholder="Todas" />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Marca proveedor</label>
          <div class="mt-1 w-40">
            <FilterDropdown v-model="marcaProveedor" :options="otb?.marcasProveedor ?? []" placeholder="Todas" />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Origen</label>
          <div class="mt-1 w-32">
            <FilterDropdown v-model="origen" :options="otb?.origenes ?? []" placeholder="Todos" />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Descontinuado</label>
          <div class="mt-1 w-28">
            <FilterDropdown v-model="descontinuado" :options="otb?.descontinuados ?? []" placeholder="Todos" />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Reposición</label>
          <div class="mt-1 w-32">
            <FilterDropdown v-model="repocision" :options="otb?.repociones ?? []" placeholder="Todas" />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Inactivo</label>
          <div class="mt-1 w-24">
            <FilterDropdown v-model="inactivo" :options="otb?.inactivos ?? []" placeholder="Todos" />
          </div>
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Buscar SKU</label>
          <div class="relative mt-1">
            <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
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
              <th class="w-8"></th>
              <th class="px-3 py-2 min-w-[150px] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('nivel1')">Nivel 1 {{ sortIndicator('nivel1') }}</th>
              <th class="px-3 py-2 min-w-[150px] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('nivel2')">Nivel 2 {{ sortIndicator('nivel2') }}</th>
              <th class="px-3 py-2 min-w-[150px] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('nivel3')">Nivel 3 {{ sortIndicator('nivel3') }}</th>
              <th class="px-3 py-2 min-w-[130px] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('genero')">Género {{ sortIndicator('genero') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('skus')">SKUs {{ sortIndicator('skus') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right" title="Editable — recalcula Inv. Final Planificado; no recalcula Semáforo/Decisión, ver nota abajo">Cobertura deseada</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('stockInicial')">Stock inicial {{ sortIndicator('stockInicial') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('stockDia')">Stock día {{ sortIndicator('stockDia') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('transito')">Tránsito {{ sortIndicator('transito') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('min80')">Mín 80% {{ sortIndicator('min80') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('ventasPlanificada')">Ventas planificada {{ sortIndicator('ventasPlanificada') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('max80')">Máx 80% {{ sortIndicator('max80') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('catNuevo')">Catálogo nuevo {{ sortIndicator('catNuevo') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('ventasTotal')">Total nivel {{ sortIndicator('ventasTotal') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right" title="Calculado en el cliente — ver nota abajo">Inv. Final Planificado</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right" title="Calculado en el cliente — ver nota abajo">OTB</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Semáforo</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('coberturaDias')">Cobertura (días) {{ sortIndicator('coberturaDias') }}</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tendencia</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Decisión</th>
              <th class="px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('sugerenciaCompra')">Sugerencia {{ sortIndicator('sugerenciaCompra') }}</th>
            </tr>
            <tr class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th></th>
              <th class="px-2 pb-2"><FilterDropdown v-model="colNivel1" :options="colNivel1Options" placeholder="Todos" /></th>
              <th class="px-2 pb-2"><FilterDropdown v-model="colNivel2" :options="colNivel2Options" placeholder="Todos" /></th>
              <th class="px-2 pb-2"><FilterDropdown v-model="colNivel3" :options="colNivel3Options" placeholder="Todos" /></th>
              <th class="px-2 pb-2"><FilterDropdown v-model="colGenero" :options="colGeneroOptions" placeholder="Todos" /></th>
              <th colspan="17"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60">
            <tr v-if="loadingOtb">
              <td colspan="22" class="px-4 py-10 text-center text-sm text-gray-400">Cargando OTB...</td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="22" class="px-4 py-10 text-center text-sm text-gray-400">Sin resultados para estos filtros</td>
            </tr>
            <template v-else v-for="row in filteredRows" :key="rowKey(row)">
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="pl-3">
                  <button
                    v-if="row.nivel1 && row.nivel2 && row.nivel3"
                    type="button"
                    class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    @click="toggleExpand(row)"
                  >
                    <ChevronDownIcon v-if="expandedKeys.has(nodeKey(row))" class="w-4 h-4" />
                    <ChevronRightIcon v-else class="w-4 h-4" />
                  </button>
                </td>
                <td class="px-3 py-2 text-gray-900 dark:text-white">{{ row.nivel1 ?? '—' }}</td>
                <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ row.nivel2 ?? '—' }}</td>
                <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ row.nivel3 ?? '—' }}</td>
                <td class="px-3 py-2 text-gray-500 dark:text-gray-400">{{ row.genero ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-900 dark:text-white font-medium">{{ row.skus ?? '—' }}</td>
                <td class="px-3 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    class="w-16 text-right rounded border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-sm py-1 px-1.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border"
                    :value="coberturaDeseadaValue(row)"
                    @change="setCoberturaDeseada(row, Number(($event.target as HTMLInputElement).value))"
                  />
                </td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.stockInicial ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.stockDia ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.transito ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.min80 ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.ventasPlanificada ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.max80 ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.catNuevo ?? '—' }}</td>
                <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{{ row.ventasTotal ?? '—' }}</td>
                <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{{ invFinalPlanificado(row).toFixed(1) }}</td>
                <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{{ otbUnidades(row).toFixed(1) }}</td>
                <td class="px-3 py-2">
                  <span class="flex items-center gap-1.5 font-medium" :class="semaforoColor(row.semaforo)">
                    <span class="w-2 h-2 rounded-full flex-shrink-0" :class="semaforoDot(row.semaforo)"></span>
                    {{ row.semaforo || '—' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.coberturaDias ?? '—' }}</td>
                <td class="px-3 py-2">
                  <span v-if="row.tendencia" class="flex items-center gap-1" :class="tendenciaColor(row.tendencia)">
                    <ArrowTrendingUpIcon v-if="row.tendencia.toUpperCase() === 'ACELERANDO'" class="w-3.5 h-3.5" />
                    <ArrowTrendingDownIcon v-else-if="row.tendencia.toUpperCase() === 'DESACELERANDO'" class="w-3.5 h-3.5" />
                    <MinusIcon v-else class="w-3.5 h-3.5" />
                    {{ row.tendencia }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-[220px] truncate" :title="row.decisionOtb ?? ''">{{ row.decisionOtb || '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ row.sugerenciaCompra ?? '—' }}</td>
              </tr>

              <tr v-if="expandedKeys.has(nodeKey(row)) && skusLoading.has(nodeKey(row))">
                <td></td>
                <td colspan="21" class="px-4 py-2 text-xs text-gray-400">Cargando SKUs...</td>
              </tr>
              <tr v-if="expandedKeys.has(nodeKey(row)) && skusError.has(nodeKey(row))">
                <td></td>
                <td colspan="21" class="px-4 py-2 text-xs text-red-600 dark:text-red-400">{{ skusError.get(nodeKey(row)) }}</td>
              </tr>
              <tr
                v-for="sku in (expandedKeys.has(nodeKey(row)) ? skusCache.get(nodeKey(row)) ?? [] : [])"
                :key="sku.codigo"
                class="bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-colors"
              >
                <td></td>
                <td colspan="4" class="px-3 py-2 text-blue-700 dark:text-blue-400 font-medium">
                  {{ sku.codigo }} — {{ sku.nombre }} <span class="text-gray-400 dark:text-gray-500 font-normal">[{{ negocio }}]</span>
                </td>
                <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">1</td>
                <td class="px-3 py-2 text-right">
                  <input
                    type="number"
                    min="0"
                    class="w-16 text-right rounded border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-sm py-1 px-1.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 border"
                    :value="coberturaDeseadaSkuValue(sku)"
                    @change="setCoberturaDeseadaSku(sku, Number(($event.target as HTMLInputElement).value))"
                  />
                </td>
                <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{{ sku.stockInicial ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
                <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
                <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
                <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{{ sku.predUnidades ?? '—' }}</td>
                <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
                <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
                <td class="px-3 py-2 text-right text-gray-400" title="No disponible por SKU en /otb/skus">—</td>
                <td class="px-3 py-2 text-right font-medium text-blue-700 dark:text-blue-400" title="Estimado sin Tránsito por SKU">{{ invFinalPlanificadoSku(sku).toFixed(1) }}</td>
                <td class="px-3 py-2 text-right font-medium text-blue-700 dark:text-blue-400" title="Estimado sin Tránsito por SKU">{{ otbUnidadesSku(sku).toFixed(1) }}</td>
                <td class="px-3 py-2">
                  <span class="flex items-center gap-1.5" :class="semaforoColor(sku.semaforo)">
                    <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="semaforoDot(sku.semaforo)"></span>
                    {{ sku.semaforo ?? '—' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{{ sku.coberturaDias ?? '—' }}</td>
                <td class="px-3 py-2 text-gray-400">—</td>
                <td class="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-[220px] truncate" :title="sku.decisionOtb ?? ''">{{ sku.decisionOtb || '—' }}</td>
                <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{{ sku.sugerenciaCompra ?? '—' }}</td>
              </tr>
            </template>
          </tbody>
          <tfoot v-if="filteredRows.length > 0" class="sticky bottom-0">
            <tr class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 font-bold text-gray-900 dark:text-white">
              <td></td>
              <td colspan="4" class="px-3 py-2">TOTAL ({{ totales.nodos }} nodo{{ totales.nodos === 1 ? '' : 's' }})</td>
              <td class="px-3 py-2 text-right">{{ totales.skus }}</td>
              <td></td>
              <td class="px-3 py-2 text-right">{{ totales.stockInicial }}</td>
              <td class="px-3 py-2 text-right">{{ totales.stockDia }}</td>
              <td class="px-3 py-2 text-right">{{ totales.transito }}</td>
              <td class="px-3 py-2 text-right text-gray-400" title="No se suma linealmente (cuadratura)">—</td>
              <td class="px-3 py-2 text-right">{{ totales.ventasPlanificada }}</td>
              <td class="px-3 py-2 text-right text-gray-400" title="No se suma linealmente (cuadratura)">—</td>
              <td class="px-3 py-2 text-right">{{ totales.catNuevo }}</td>
              <td class="px-3 py-2 text-right">{{ totales.ventasTotal }}</td>
              <td class="px-3 py-2 text-right text-gray-400" title="Fórmula de agregación no confirmada">—</td>
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
              <td class="px-3 py-2 text-right">{{ totales.sugerenciaCompra }}</td>
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
