<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-info-title"
    >
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" @click="$emit('close')" />

      <div class="relative z-[101] max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10">
        <header class="flex items-center justify-between bg-gradient-to-r from-indigo-700 via-violet-700 to-blue-700 px-5 py-4 text-white">
          <div class="flex items-center gap-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <div>
              <h3 id="article-info-title" class="text-lg font-semibold">Informacion del Articulo</h3>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
            @click="$emit('close')"
            aria-label="Cerrar modal"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <section class="max-h-[68vh] overflow-y-auto p-5 sm:p-6">
          <div
            v-if="loading"
            class="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-800/40"
          >
            <span class="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
            <p class="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">Buscando informacion del articulo...</p>
          </div>

          <div
            v-else-if="status === 'not-found'"
            class="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <p class="text-sm font-semibold">Articulo no encontrado</p>
            <p class="mt-1 text-sm">
              No se encontro el codigo <span class="font-mono">{{ scanCode || 'N/A' }}</span> en el almacen seleccionado.
            </p>
          </div>

          <div
            v-else-if="status === 'error'"
            class="rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          >
            <p class="text-sm font-semibold">Error al consultar</p>
            <p class="mt-1 text-sm">{{ errorMessage || 'No fue posible obtener la informacion del articulo.' }}</p>
          </div>

          <div v-else-if="article" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <article class="overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900/50">
                <header class="bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">Detalle producto</header>
                <dl class="space-y-2 bg-white p-4 text-sm dark:bg-slate-900/60">
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Referencia</dt><dd class="font-mono text-slate-900 dark:text-slate-100">{{ referenceText }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Descripcion</dt><dd class="text-right text-slate-900 dark:text-slate-100">{{ descriptionText }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Codigo barras</dt><dd class="font-mono text-slate-900 dark:text-slate-100">{{ barcodeText }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Marca</dt><dd class="text-slate-900 dark:text-slate-100">{{ brandText }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Categoria</dt><dd class="text-slate-900 dark:text-slate-100">{{ asText('categoria', article.category) }}</dd></div>
                </dl>
              </article>

              <article class="overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <header class="bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">Ventas</header>
                <dl class="space-y-2 bg-white p-4 text-sm dark:bg-slate-900/60">
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Promedio 30 dias</dt><dd class="text-slate-900 dark:text-slate-100">{{ formatDailyUnits(article.sales?.avg30, raw('VentaPromedio')) }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Total 30 dias</dt><dd class="text-slate-900 dark:text-slate-100">{{ asUnits(article.sales?.total30, raw('CantidadTotalTreintaDias')) }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Total 90 dias</dt><dd class="text-slate-900 dark:text-slate-100">{{ asUnits(article.sales?.total90, raw('CantidadTotalNoventaDias')) }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Ultimo ingreso</dt><dd class="text-slate-900 dark:text-slate-100">{{ formatDate(article.sales?.lastIngressDate ?? raw('ultima_fecha_ingreso')) }}</dd></div>
                </dl>
              </article>

              <article class="overflow-hidden rounded-xl border border-sky-200 dark:border-sky-900/50">
                <header class="bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">Stock</header>
                <dl class="space-y-2 bg-white p-4 text-sm dark:bg-slate-900/60">
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Stock tienda</dt><dd class="text-slate-900 dark:text-slate-100">{{ asUnits(article.stock?.store, raw('total_Tienda')) }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Stock bodega</dt><dd class="text-slate-900 dark:text-slate-100">{{ asUnits(article.stock?.warehouse, raw('total_Bodega')) }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Stock transito</dt><dd class="text-slate-900 dark:text-slate-100">{{ asUnits(article.stock?.transit, raw('total_Transitoria_Tienda')) }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Stock total general</dt><dd class="text-slate-900 dark:text-slate-100">{{ asUnits(totalGeneralStock) }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-slate-500">Almacen</dt><dd class="text-right text-slate-900 dark:text-slate-100">{{ warehouseLabel }}</dd></div>
                </dl>
              </article>

              <article class="overflow-hidden rounded-xl border border-amber-200 dark:border-amber-900/50">
                <header class="bg-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">Precios</header>
                <dl class="space-y-2 bg-white p-4 text-sm dark:bg-slate-900/60">
                  <div class="flex justify-between gap-4">
                    <dt class="text-slate-500">Ultimo costo</dt>
                    <dd class="text-slate-900 dark:text-slate-100">{{ formatCurrency(pricing.avgPrice, article.currency || 'CLP', 'No autorizado') }}</dd>
                  </div>
                  <div class="flex justify-between gap-4">
                    <dt class="text-slate-500">Precio de venta</dt>
                    <dd class="text-slate-900 dark:text-slate-100">{{ formatCurrency(pricing.price, article.currency || 'CLP', 'No autorizado') }}</dd>
                  </div>
                  <div class="flex justify-between gap-4">
                    <dt class="text-slate-500">Margen</dt>
                    <dd class="text-slate-900 dark:text-slate-100">{{ formatPercent(pricing.margin, 'No autorizado') }}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </div>
        </section>

        <footer class="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/70">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            @click="$emit('close')"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ArticleDetailDto, ScanStatus, WarehouseDto } from '../types'
import { extractArticlePricing, formatCurrency, formatPercent } from '../utils/pricing'

const props = defineProps<{
  visible: boolean
  loading: boolean
  status: ScanStatus
  article: ArticleDetailDto | null
  errorMessage?: string | null
  scanCode?: string | null
  selectedWarehouse?: string | null
  warehouses: WarehouseDto[]
}>()

defineEmits<{
  close: []
}>()

const rawRecord = computed<Record<string, unknown>>(() => {
  if (!props.article || typeof props.article !== 'object') return {}
  return props.article as unknown as Record<string, unknown>
})

const warehouseLabel = computed(() => {
  const selectedCode = props.selectedWarehouse
  if (!selectedCode) return 'N/A'
  const selected = props.warehouses.find((w) => w.code === selectedCode)
  return selected ? `${selected.code} - ${selected.name}` : selectedCode
})

const referenceText = computed(() => asTextFrom(['itemCode', 'ItemCode'], props.article?.itemCode ?? props.article?.code))
const descriptionText = computed(() => asTextFrom(['itemName', 'ItemName'], props.article?.itemName ?? props.article?.description))
const barcodeText = computed(() => asTextFrom(['codeBars', 'CodeBars'], props.article?.codeBars ?? props.article?.barcode))
const brandText = computed(() => asTextFrom(['brand', 'marca'], props.article?.brand))
const pricing = computed(() => extractArticlePricing(props.article))
const totalGeneralStock = computed(() => {
  const store = asFiniteNumber(props.article?.stock?.store ?? raw('total_Tienda'))
  const warehouse = asFiniteNumber(props.article?.stock?.warehouse ?? raw('total_Bodega'))
  const transit = asFiniteNumber(props.article?.stock?.transit ?? raw('total_Transitoria_Tienda'))
  if (store === null && warehouse === null && transit === null) return null
  return (store ?? 0) + (warehouse ?? 0) + (transit ?? 0)
})

function raw(key: string, fallback?: unknown): unknown {
  const value = rawRecord.value[key]
  return value ?? fallback ?? null
}

function asText(key: string, fallback?: string | null): string {
  const value = raw(key, fallback)
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return 'N/A'
}

function asTextFrom(keys: string[], fallback?: string | null): string {
  for (const key of keys) {
    const value = raw(key)
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  if (typeof fallback === 'string' && fallback.trim()) return fallback
  return 'N/A'
}

function asNumberText(value: unknown, fallback?: unknown): string {
  const resolved = value ?? fallback
  if (typeof resolved === 'number' && Number.isFinite(resolved)) return resolved.toLocaleString('es-CL')
  if (typeof resolved === 'string' && resolved.trim()) return resolved
  return 'N/A'
}

function asUnits(value: unknown, fallback?: unknown): string {
  const resolved = value ?? fallback
  const parsed = typeof resolved === 'number' ? resolved : Number(resolved)
  if (Number.isFinite(parsed)) return `${Math.floor(parsed)} u.`
  return 'N/A'
}

function formatDailyUnits(value: unknown, fallback?: unknown): string {
  const resolved = value ?? fallback
  const parsed = typeof resolved === 'number' ? resolved : Number(resolved)
  if (!Number.isFinite(parsed)) return 'N/A'
  const normalized = parsed.toFixed(2).replace(/\.?0+$/, '')
  return `${normalized} u. por dia`
}

function asFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatDate(value: unknown): string {
  if (!value) return 'N/A'
  if (typeof value !== 'string' && !(value instanceof Date)) return 'N/A'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('es-CL').format(date)
}


</script>
