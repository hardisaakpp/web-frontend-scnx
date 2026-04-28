<template>
  <div v-if="article" class="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-b from-white to-emerald-50/40 shadow-lg shadow-emerald-900/5 dark:border-emerald-900/40 dark:from-slate-800 dark:to-emerald-950/30">
    <div class="border-b border-emerald-100 bg-emerald-600/95 px-5 py-4 dark:border-emerald-900 dark:bg-emerald-900/80">
      <p class="text-xs font-semibold uppercase tracking-wider text-emerald-100">Resultado</p>
      <p class="mt-1 truncate text-lg font-bold text-white">
        {{ article.description }}
      </p>
      <p class="mt-0.5 font-mono text-sm text-emerald-100/90">
        {{ article.code }}
      </p>
    </div>

    <div class="grid gap-4 p-5 sm:grid-cols-2">
      <dl class="space-y-3">
        <div class="flex gap-3 rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-900/60">
          <dt class="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Marca</dt>
          <dd class="text-sm font-medium text-slate-900 dark:text-white">{{ article.brand || '—' }}</dd>
        </div>
        <div class="flex gap-3 rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-900/60">
          <dt class="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Categoría</dt>
          <dd class="text-sm font-medium text-slate-900 dark:text-white">{{ article.category || '—' }}</dd>
        </div>
        <div class="flex gap-3 rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-900/60">
          <dt class="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Barras</dt>
          <dd class="font-mono text-sm text-slate-800 dark:text-slate-100">{{ article.barcode || '—' }}</dd>
        </div>
      </dl>

      <dl class="space-y-3">
        <div class="rounded-xl bg-slate-900 px-4 py-3 text-white dark:bg-slate-950">
          <dt class="text-[10px] uppercase tracking-wider text-slate-400">Stock</dt>
          <dd class="mt-1 text-2xl font-bold tabular-nums">{{ article.stock ?? '—' }}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-900">
          <dt class="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Precio</dt>
          <dd class="mt-1 text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {{ formatMoney(article.unitPrice, article.currency) }}
          </dd>
        </div>
        <div class="flex gap-3 rounded-xl bg-white/80 px-3 py-2 dark:bg-slate-900/60">
          <dt class="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Últ. venta</dt>
          <dd class="text-sm text-slate-800 dark:text-slate-200">{{ formatDate(article.lastSaleDate) }}</dd>
        </div>
      </dl>
    </div>

    <div
      v-if="article.sales != null || article.prices != null"
      class="border-t border-emerald-100/80 bg-white/60 px-5 py-4 dark:border-emerald-900/50 dark:bg-slate-900/40"
    >
      <details v-if="article.sales != null" class="group">
        <summary class="cursor-pointer text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Ventas (detalle del servicio)
        </summary>
        <pre class="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900/90 p-3 font-mono text-[11px] leading-relaxed text-emerald-100">{{ formatJson(article.sales) }}</pre>
      </details>
      <details v-if="article.prices != null" class="group mt-3">
        <summary class="cursor-pointer text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Precios (detalle del servicio)
        </summary>
        <pre class="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900/90 p-3 font-mono text-[11px] leading-relaxed text-emerald-100">{{ formatJson(article.prices) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetailDto } from '../types'

defineProps<{
  article: ArticleDetailDto | null
}>()

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatMoney(value?: number | null, currency: string | null = 'USD') {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-CL').format(date)
}
</script>
