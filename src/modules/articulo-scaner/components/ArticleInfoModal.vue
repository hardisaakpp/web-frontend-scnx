<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-info-title"
    >
      <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" @click="$emit('close')" />

      <div
        class="relative z-[101] max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.2),0_0_0_1px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/[0.05] dark:bg-slate-900 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.55)] dark:ring-white/[0.06]"
      >
        <header
          class="flex items-center justify-between border-b border-indigo-200/60 bg-gradient-to-r from-indigo-50/95 via-white to-indigo-50/40 px-6 py-4 dark:border-indigo-900/45 dark:bg-gradient-to-r dark:from-indigo-950/70 dark:via-slate-900 dark:to-indigo-950/35"
        >
          <div class="flex min-w-0 items-center gap-3.5">
            <span class="inline-flex h-11 shrink-0 items-center">
              <Transition name="header-code-morph">
                <button
                  v-if="!headerCodeEditing"
                  key="header-code-trigger"
                  type="button"
                  class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-0 bg-indigo-600/10 text-indigo-700 shadow-sm shadow-indigo-900/5 ring-1 ring-indigo-500/20 transition-colors hover:bg-indigo-600/18 hover:ring-indigo-500/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:bg-indigo-400/15 dark:text-indigo-200 dark:shadow-none dark:ring-indigo-400/30 dark:hover:bg-indigo-400/22 dark:focus-visible:ring-indigo-400/50 dark:focus-visible:ring-offset-slate-900"
                  :disabled="loading"
                  aria-label="Escribir código manualmente"
                  title="Escribir código"
                  @click="startHeaderInlineEdit"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </button>
                <input
                  v-else
                  key="header-code-field"
                  ref="headerInlineInputRef"
                  v-model="headerInlineCode"
                  type="text"
                  enterkeyhint="search"
                  inputmode="text"
                  autocomplete="off"
                  autocorrect="off"
                  spellcheck="false"
                  maxlength="50"
                  aria-label="Código a consultar"
                  placeholder="Código"
                  class="h-11 w-[10.25rem] max-w-[min(16rem,calc(100vw-10rem))] rounded-2xl border-0 bg-white py-2 pl-3 pr-2 font-mono text-sm text-indigo-950 shadow-sm ring-1 ring-indigo-500/30 transition-shadow placeholder:text-indigo-400/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-0 disabled:opacity-50 dark:bg-slate-900/90 dark:text-indigo-50 dark:ring-indigo-400/35 dark:placeholder:text-indigo-500 sm:w-44"
                  :disabled="loading"
                  @keydown="onHeaderInlineKeydown"
                  @blur="scheduleHeaderInlineBlurCollapse"
                  @focus="cancelHeaderInlineBlurCollapse"
                />
              </Transition>
            </span>
            <div class="min-w-0">
              <h3 id="article-info-title" class="truncate text-[1.0625rem] font-semibold leading-snug tracking-tight text-indigo-950 dark:text-indigo-50">
                Información del artículo
              </h3>
              <p class="mt-0.5 hidden text-[0.8125rem] leading-relaxed text-indigo-800/70 dark:text-indigo-300/85 sm:block">
                Datos consultados para el código escaneado
              </p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-600/35 bg-emerald-500/[0.12] text-emerald-800 shadow-sm transition-colors hover:bg-emerald-500/25 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-50 disabled:pointer-events-none disabled:opacity-40 dark:border-emerald-400/35 dark:bg-emerald-400/15 dark:text-emerald-200 dark:hover:bg-emerald-400/22 dark:hover:text-emerald-50 dark:focus-visible:ring-emerald-400/50 dark:focus-visible:ring-offset-slate-900 sm:h-10 sm:w-10"
              :disabled="loading"
              aria-label="Consultar otro código (lector o manual)"
              title="Consultar otro código"
              @click="$emit('retry-search')"
            >
              <!-- Mismo ícono que cabecera módulo escáner: visor + barras + línea -->
              <svg class="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.85"
                  d="M9.75 4.75H5v4.75M14.25 4.75H19v4.75M14.25 19.25H19v-4.75M9.75 19.25H5v-4.75"
                />
                <g fill="currentColor" opacity="0.92">
                  <rect x="10.1" y="8.05" width="0.42" height="7.9" rx="0.06" />
                  <rect x="10.82" y="7.85" width="0.72" height="8.35" rx="0.06" />
                  <rect x="11.92" y="8.25" width="0.42" height="7.65" rx="0.06" />
                  <rect x="12.68" y="7.72" width="0.94" height="8.72" rx="0.06" />
                  <rect x="13.98" y="8.08" width="0.52" height="7.94" rx="0.06" />
                </g>
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.45"
                  d="M8.95 11.97h6.1"
                  opacity="0.98"
                />
              </svg>
            </button>
            <button
              type="button"
              class="touch-target shrink-0 rounded-xl text-indigo-700/70 transition-colors hover:bg-indigo-100/80 hover:text-indigo-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-50 dark:text-indigo-300/80 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-100 dark:focus-visible:ring-indigo-400/45 dark:focus-visible:ring-offset-slate-900"
              @click="$emit('close')"
              aria-label="Cerrar modal"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <section
          class="max-h-[68vh] overflow-y-auto bg-gradient-to-b from-slate-50/90 via-slate-50/60 to-slate-100/30 p-5 sm:p-6 dark:from-slate-950/50 dark:via-slate-950/30 dark:to-slate-900/20"
        >
          <div
            v-if="loading"
            class="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white/90 px-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-[1px] dark:border-slate-700/70 dark:bg-slate-900/60"
          >
            <span
              class="h-10 w-10 animate-spin rounded-full border-2 border-slate-200/90 border-t-indigo-600 dark:border-slate-600/80 dark:border-t-indigo-400"
            />
            <p class="mt-5 text-sm font-medium tracking-tight text-slate-700 dark:text-slate-200">Buscando información del artículo…</p>
            <p class="mt-1.5 max-w-[240px] text-xs leading-relaxed text-slate-500 dark:text-slate-500">Esto puede tardar unos segundos</p>
          </div>

          <div
            v-else-if="status === 'not-found'"
            class="flex gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-4 shadow-[0_1px_2px_rgba(120,53,15,0.06)] dark:border-amber-900/45 dark:bg-amber-950/30"
          >
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100/90 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" aria-hidden="true">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-amber-950 dark:text-amber-100">Artículo no encontrado</p>
              <p class="mt-1 text-sm leading-relaxed text-amber-900/88 dark:text-amber-200/90">
                No se encontró el código
                <span class="mx-0.5 inline-block rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-[0.8125rem] text-amber-950 ring-1 ring-amber-200/60 dark:bg-amber-900/45 dark:text-amber-50 dark:ring-amber-800/50">{{ scanCode || 'N/A' }}</span>
                en el almacén seleccionado.
              </p>
            </div>
          </div>

          <div
            v-else-if="status === 'error'"
            class="flex gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-4 shadow-[0_1px_2px_rgba(127,29,29,0.06)] dark:border-red-900/45 dark:bg-red-950/30"
          >
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100/90 text-red-700 dark:bg-red-900/50 dark:text-red-300" aria-hidden="true">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-red-950 dark:text-red-100">Error al consultar</p>
              <p class="mt-1 text-sm leading-relaxed text-red-900/88 dark:text-red-200/90">
                {{ errorMessage || 'No fue posible obtener la información del artículo.' }}
              </p>
            </div>
          </div>

          <div v-else-if="article" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <article
                class="overflow-hidden rounded-2xl border border-indigo-200/75 bg-gradient-to-b from-indigo-50/55 via-white to-white shadow-[0_2px_10px_-3px_rgba(79,70,229,0.18)] ring-1 ring-indigo-500/[0.08] dark:border-indigo-500/35 dark:from-indigo-950/50 dark:via-slate-900/85 dark:to-slate-950/90 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.45)] dark:ring-indigo-400/15"
              >
                <header
                  class="flex items-center gap-3 border-b border-indigo-200/55 bg-gradient-to-r from-indigo-100/50 to-indigo-50/30 px-4 py-3 dark:border-indigo-500/25 dark:from-indigo-950/80 dark:to-indigo-950/35"
                >
                  <span
                    class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 ring-1 ring-indigo-500/20 dark:bg-indigo-400/15 dark:text-indigo-300 dark:ring-indigo-400/25"
                    aria-hidden="true"
                  >
                    <span class="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-300" />
                  </span>
                  <h4 class="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-900/85 dark:text-indigo-200/95">
                    Detalle producto
                  </h4>
                </header>
                <dl class="divide-y divide-indigo-100/80 text-sm dark:divide-indigo-900/40">
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Referencia</dt>
                    <dd class="break-words text-right font-mono text-sm text-slate-900 tabular-nums dark:text-slate-100">{{ referenceText }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Descripción</dt>
                    <dd class="max-w-[65%] break-words text-right text-sm leading-snug text-slate-800 dark:text-slate-100">{{ descriptionText }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Código barras</dt>
                    <dd class="break-words text-right font-mono text-sm text-slate-900 tabular-nums dark:text-slate-100">{{ barcodeText }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Marca</dt>
                    <dd class="break-words text-right text-sm text-slate-800 dark:text-slate-100">{{ brandText }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Categoría</dt>
                    <dd class="break-words text-right text-sm text-slate-800 dark:text-slate-100">{{ asText('categoria', article.category) }}</dd>
                  </div>
                </dl>
              </article>

              <article
                class="overflow-hidden rounded-2xl border border-emerald-200/75 bg-gradient-to-b from-emerald-50/50 via-white to-white shadow-[0_2px_10px_-3px_rgba(5,150,105,0.16)] ring-1 ring-emerald-500/[0.08] dark:border-emerald-500/35 dark:from-emerald-950/45 dark:via-slate-900/85 dark:to-slate-950/90 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.45)] dark:ring-emerald-400/12"
              >
                <header
                  class="flex items-center gap-3 border-b border-emerald-200/55 bg-gradient-to-r from-emerald-100/45 to-emerald-50/25 px-4 py-3 dark:border-emerald-500/25 dark:from-emerald-950/75 dark:to-emerald-950/30"
                >
                  <span
                    class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/25"
                    aria-hidden="true"
                  >
                    <span class="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-300" />
                  </span>
                  <h4 class="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-900/85 dark:text-emerald-200/95">
                    Ventas
                  </h4>
                </header>
                <dl class="divide-y divide-emerald-100/80 text-sm dark:divide-emerald-900/35">
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Promedio 30 días</dt>
                    <dd class="break-words text-right text-sm text-slate-800 dark:text-slate-100">{{ formatDailyUnits(article.sales?.avg30, raw('VentaPromedio')) }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Total 30 días</dt>
                    <dd class="break-words text-right text-sm text-slate-800 dark:text-slate-100">{{ asUnits(article.sales?.total30, raw('CantidadTotalTreintaDias')) }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Total 90 días</dt>
                    <dd class="break-words text-right text-sm text-slate-800 dark:text-slate-100">{{ asUnits(article.sales?.total90, raw('CantidadTotalNoventaDias')) }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Último ingreso</dt>
                    <dd class="break-words text-right text-sm text-slate-800 dark:text-slate-100">{{ formatDate(article.sales?.lastIngressDate ?? raw('ultima_fecha_ingreso')) }}</dd>
                  </div>
                </dl>
              </article>

              <article
                class="overflow-hidden rounded-2xl border border-sky-200/75 bg-gradient-to-b from-sky-50/50 via-white to-white shadow-[0_2px_10px_-3px_rgba(14,165,233,0.18)] ring-1 ring-sky-500/[0.09] dark:border-sky-500/35 dark:from-sky-950/45 dark:via-slate-900/85 dark:to-slate-950/90 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.45)] dark:ring-sky-400/12"
              >
                <header
                  class="flex items-center gap-3 border-b border-sky-200/55 bg-gradient-to-r from-sky-100/45 to-sky-50/25 px-4 py-3 dark:border-sky-500/25 dark:from-sky-950/75 dark:to-sky-950/30"
                >
                  <span
                    class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-600/10 text-sky-600 ring-1 ring-sky-500/20 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/25"
                    aria-hidden="true"
                  >
                    <span class="h-2 w-2 rounded-full bg-sky-600 dark:bg-sky-300" />
                  </span>
                  <h4 class="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-900/85 dark:text-sky-200/95">
                    Stock
                  </h4>
                </header>
                <dl class="divide-y divide-sky-100/80 text-sm dark:divide-sky-900/35">
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Stock tienda</dt>
                    <dd class="break-words text-right text-sm tabular-nums text-slate-800 dark:text-slate-100">{{ asUnits(article.stock?.store, raw('total_Tienda')) }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Stock bodega</dt>
                    <dd class="break-words text-right text-sm tabular-nums text-slate-800 dark:text-slate-100">{{ asUnits(article.stock?.warehouse, raw('total_Bodega')) }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Stock tránsito</dt>
                    <dd class="break-words text-right text-sm tabular-nums text-slate-800 dark:text-slate-100">{{ asUnits(article.stock?.transit, raw('total_Transitoria_Tienda')) }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Stock total general</dt>
                    <dd class="break-words text-right text-sm font-medium tabular-nums text-slate-900 dark:text-slate-50">{{ asStockTotalGeneral(article.stock?.totalGeneral, raw('totalGeneralStock')) }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">Almacén</dt>
                    <dd class="max-w-[62%] break-words text-right text-sm leading-snug text-slate-800 dark:text-slate-100">{{ warehouseLabel }}</dd>
                  </div>
                </dl>
              </article>

              <article
                class="overflow-hidden rounded-2xl border border-amber-200/75 bg-gradient-to-b from-amber-50/50 via-white to-white shadow-[0_2px_10px_-3px_rgba(217,119,6,0.18)] ring-1 ring-amber-500/[0.1] dark:border-amber-500/35 dark:from-amber-950/45 dark:via-slate-900/85 dark:to-slate-950/90 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.45)] dark:ring-amber-400/12"
              >
                <header
                  class="flex items-center gap-3 border-b border-amber-200/55 bg-gradient-to-r from-amber-100/50 to-amber-50/30 px-4 py-3 dark:border-amber-500/25 dark:from-amber-950/80 dark:to-amber-950/35"
                >
                  <span
                    class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/25 dark:bg-amber-400/12 dark:text-amber-300 dark:ring-amber-400/25"
                    aria-hidden="true"
                  >
                    <span class="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                  </span>
                  <h4 class="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-950/80 dark:text-amber-200/95">
                    Precios
                  </h4>
                </header>
                <dl class="divide-y divide-amber-100/80 text-sm dark:divide-amber-900/35">
                  <div v-if="canViewCost" class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Último costo</dt>
                    <dd class="break-words text-right text-sm tabular-nums text-slate-800 dark:text-slate-100">{{ formatCurrency(pricing.avgPrice, article.currency || 'CLP', 'No autorizado') }}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Precio de venta</dt>
                    <dd class="break-words text-right text-sm font-medium tabular-nums text-slate-900 dark:text-slate-50">{{ formatCurrency(pricing.price, article.currency || 'CLP', 'No autorizado') }}</dd>
                  </div>
                  <div v-if="canViewCost" class="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt class="text-xs font-medium text-slate-500 dark:text-slate-400">Margen</dt>
                    <dd class="break-words text-right text-sm tabular-nums text-slate-800 dark:text-slate-100">{{ formatPercent(pricing.margin, 'No autorizado') }}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { ArticleDetailDto, ScanStatus, WarehouseDto } from '../types'
import { extractArticlePricing, formatCurrency, formatPercent } from '../utils/pricing'

const props = withDefaults(defineProps<{
  visible: boolean
  loading: boolean
  status: ScanStatus
  article: ArticleDetailDto | null
  errorMessage?: string | null
  scanCode?: string | null
  selectedWarehouse?: string | null
  warehouses: WarehouseDto[]
  canViewCost?: boolean
}>(), {
  canViewCost: true
})

const emit = defineEmits<{
  close: []
  'retry-search': []
  'submit-inline-code': [code: string]
}>()

const headerCodeEditing = ref(false)
const headerInlineCode = ref('')
const headerInlineInputRef = ref<HTMLInputElement | null>(null)
let headerBlurCollapseTimer: number | null = null

watch(
  () => props.visible,
  (open) => {
    if (!open) {
      headerCodeEditing.value = false
      headerInlineCode.value = ''
      cancelHeaderInlineBlurCollapse()
    }
  }
)

function startHeaderInlineEdit() {
  if (props.loading) return
  headerInlineCode.value = (props.scanCode ?? '').trim()
  headerCodeEditing.value = true
  // Sin mode=out-in el input se monta de inmediato; el foco tras pintar evita retraso del cursor.
  void nextTick(() => {
    requestAnimationFrame(() => {
      const el = headerInlineInputRef.value
      if (!el) return
      el.focus({ preventScroll: true })
      if (el.value.length > 0) el.select()
    })
  })
}

function cancelHeaderInlineBlurCollapse() {
  if (headerBlurCollapseTimer != null) {
    clearTimeout(headerBlurCollapseTimer)
    headerBlurCollapseTimer = null
  }
}

function scheduleHeaderInlineBlurCollapse() {
  cancelHeaderInlineBlurCollapse()
  headerBlurCollapseTimer = window.setTimeout(() => {
    headerBlurCollapseTimer = null
    headerCodeEditing.value = false
    headerInlineCode.value = ''
  }, 150)
}

function onHeaderInlineKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    cancelHeaderInlineBlurCollapse()
    headerCodeEditing.value = false
    headerInlineCode.value = ''
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    submitHeaderInline()
  }
}

function submitHeaderInline() {
  const code = headerInlineCode.value.trim()
  if (!code) return
  cancelHeaderInlineBlurCollapse()
  headerCodeEditing.value = false
  headerInlineCode.value = ''
  emit('submit-inline-code', code)
}

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
  return `${parsed.toFixed(2)} u. por dia`
}

function asStockTotalGeneral(value: unknown, fallback?: unknown): string {
  const resolved = value ?? fallback
  if (resolved == null) return '0 u.'
  const parsed = typeof resolved === 'number' ? resolved : Number(resolved)
  if (!Number.isFinite(parsed)) return '0 u.'
  return `${Math.floor(parsed)} u.`
}

function formatDate(value: unknown): string {
  if (!value) return 'N/A'
  if (typeof value !== 'string' && !(value instanceof Date)) return 'N/A'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('es-CL').format(date)
}


</script>

<style scoped>
/* Transición botón ícono ↔ campo código: salida corta para no competir con el foco del input */
.header-code-morph-enter-active {
  will-change: transform, opacity;
  transition:
    opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.26s cubic-bezier(0.34, 1.12, 0.56, 1);
}
.header-code-morph-leave-active {
  will-change: transform, opacity;
  transition:
    opacity 0.1s cubic-bezier(0.4, 0, 1, 1),
    transform 0.11s cubic-bezier(0.4, 0, 1, 1);
}
.header-code-morph-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(4px);
}
.header-code-morph-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(-3px);
}
.header-code-morph-enter-to,
.header-code-morph-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>
