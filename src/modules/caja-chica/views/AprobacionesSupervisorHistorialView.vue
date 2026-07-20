<template>
  <div class="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-6">
    <button
      type="button"
      class="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
      @click="volver"
    >
      <span aria-hidden="true">←</span> Volver
    </button>
    <div class="space-y-6">
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Historial de aprobaciones</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Reporte de aprobaciones y rechazos realizados</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-6">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Filtros</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha desde</label>
              <input
                v-model="fechaDesde"
                type="date"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha hasta</label>
              <input
                v-model="fechaHasta"
                type="date"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between mb-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Listado</h2>
          <div class="flex items-center gap-3 flex-wrap">
            <div ref="columnSelectorWrapRef" class="flex items-center gap-2 relative">
              <button
                type="button"
                class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                :class="{ 'ring-2 ring-emerald-500/50': showColumnSelector }"
                @click="showColumnSelector = !showColumnSelector"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Columnas
              </button>
              <div
                v-if="showColumnSelector"
                class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 p-3"
                @click.stop
              >
                <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 px-1">Mostrar columnas</div>
                <div class="space-y-1 max-h-72 overflow-y-auto">
                  <label
                    v-for="column in availableColumnsWithVisibility"
                    :key="column.key"
                    :class="[
                      'flex items-center gap-2 px-2 py-2 rounded-lg transition-colors cursor-pointer',
                      column.fixed
                        ? 'opacity-60 bg-gray-50 dark:bg-gray-900 cursor-not-allowed'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    ]"
                  >
                    <input
                      type="checkbox"
                      :checked="column.visible"
                      :disabled="column.fixed"
                      class="w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                      @change="!column.fixed && toggleColumnVisibility(column.key)"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-200">{{ column.label }}</span>
                    <span v-if="column.fixed" class="text-xs text-gray-400 ml-1">(fija)</span>
                  </label>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 disabled:opacity-50"
              :disabled="historialFiltrado.length === 0"
              @click="downloadPdf"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="loadHistorial"
            >
              Refrescar
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="historialFiltrado.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones o rechazos registrados{{ (fechaDesde || fechaHasta) ? ' para el rango de fechas seleccionado' : '' }}.
        </div>
        <div v-else class="space-y-6">
          <div
            v-for="group in groupedHistorial"
            :key="group.idLiquidacion"
            class="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden"
          >
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Liquidacion #{{ group.idLiquidacion }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ group.items.length }} detalles · Tienda: {{ group.codAlmacen || '-' }} · Custodio: {{ group.nombreCustodio }} ({{ group.cedulaCustodio || '-' }}) · Fecha: {{ formatDate(group.fechaCreacion) }} · Monto total: {{ formatAmount(group.totalMonto) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600/50 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                  @click="downloadLiquidacionPdf(group.idLiquidacion)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  PDF
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600/50 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  @click="toggleGroup(group.idLiquidacion)"
                >
                  {{ isGroupOpen(group.idLiquidacion) ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>
            <div v-if="isGroupOpen(group.idLiquidacion)" class="overflow-x-auto">
              <table class="min-w-full text-xs">
                <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700/50 shadow-sm">
                  <tr class="text-left font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300 text-[10px]">
                    <th
                      v-for="column in tableColumns"
                      :key="column.key"
                      :class="[
                        'select-none py-1.5',
                        column.key === 'detalle' ? 'pl-3' : 'pl-2',
                        'pr-2'
                      ]"
                    >
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
                  <tr v-for="item in group.items" :key="item.idAprobacion" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td
                      v-for="column in tableColumns"
                      :key="column.key"
                      :class="[
                        'py-1.5 text-gray-700 dark:text-gray-200',
                        column.key === 'detalle' ? 'pl-3' : 'pl-2',
                        'pr-2'
                      ]"
                    >
                      <template v-if="column.key === 'estado'">
                        <span
                          :class="[
                            'px-2 py-1 rounded-full text-xs font-medium inline-block',
                            item.estado === 'RECHAZADO'
                              ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          ]"
                        >
                          {{ item.estado }}
                        </span>
                      </template>
                      <template v-else-if="column.key === 'fechaAprobacion'">
                        <span class="whitespace-nowrap">{{ formatDateTime(item.fechaAprobacion) }}</span>
                      </template>
                      <template v-else-if="column.key === 'acciones'">
                        <button
                          type="button"
                          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          @click="openDetalle(item)"
                        >
                          Ver detalle
                        </button>
                      </template>
                      <template v-else>
                        {{ getCellValue(item, column.key) }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="!loading && historialFiltrado.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Total registros</div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ historialFiltrado.length }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Aprobados</div>
              <div class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{{ aprobadasCount }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Rechazados</div>
              <div class="text-lg font-semibold text-red-600 dark:text-red-400">{{ rechazadasCount }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Monto total aprobado</div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatAmount(totalMontoAprobado) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showDetallePanel" class="fixed inset-0 z-[100]">
      <div class="absolute inset-0 bg-black/40" @click="closeDetalle"></div>
      <aside class="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
        <div class="flex items-start justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="min-w-0">
            <div class="text-xs text-gray-500 dark:text-gray-400">Detalle aprobación</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              #{{ selectedItem?.idAprobacion || '-' }}
            </h3>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Liquidación#{{ selectedItem?.idLiquidacion || '-' }}
            </div>
          </div>
          <button
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="closeDetalle"
          >
            Cerrar
          </button>
        </div>

        <div class="p-4 overflow-y-auto space-y-5">
          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20 p-4">
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Información</div>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Gasto</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem?.nombreGasto || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Total</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem ? formatAmount(selectedItem.total) : '-' }}</dd>
              </div>

              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Fecha consumo</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle ? formatDate(selectedDetalle.fechaConsumo) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">RUC</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.ruc || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Proveedor</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.nombreProveedor || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">N° Comprobante</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.numeroComprobante || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Tipo Documento</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.tipoDocumento || '-' }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Concepto</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.concepto || selectedItem?.concepto || '-' }}</dd>
              </div>

              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Subtotal Base 15%</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle ? formatAmount(selectedDetalle.subtotalConIva) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Subtotal Base 0%</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle ? formatAmount(selectedDetalle.subtotalSinIva) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">IVA</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle ? formatAmount(selectedDetalle.iva) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Adjuntos</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  <span v-if="selectedItem">{{ adjuntosByDetalle[selectedItem.idDetalle] ?? 0 }}</span>
                  <span v-else>-</span>
                </dd>
              </div>
            </dl>
          </div>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Adjuntos</div>
              <button
                v-if="selectedAdjunto"
                type="button"
                class="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 px-2 py-1 text-[11px] text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                @click.stop="downloadAdjunto"
              >
                <svg class="w-3.5 h-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 2a.75.75 0 01.75.75v8.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L5.72 9.53a.75.75 0 111.06-1.06l2.47 2.47V2.75A.75.75 0 0110 2z" />
                  <path d="M4.25 12.5a.75.75 0 01.75.75v1.5A1.25 1.25 0 006.25 16h7.5A1.25 1.25 0 0015 14.75v-1.5a.75.75 0 011.5 0v1.5A2.75 2.75 0 0113.75 17h-7.5A2.75 2.75 0 013.5 14.75v-1.5a.75.75 0 01.75-.75z" />
                </svg>
                <span>Descargar</span>
              </button>
            </div>
            <div v-if="selectedItem && loadingAdjuntosMap[selectedItem.idDetalle]" class="text-sm text-gray-500 dark:text-gray-400">
              Cargando adjuntos...
            </div>
            <div v-else-if="selectedItem && (adjuntosListByDetalle[selectedItem.idDetalle]?.length)">
              <div class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="(adj, index) in adjuntosListByDetalle[selectedItem.idDetalle]"
                    :key="adj.idAdjunto"
                    type="button"
                    class="px-2 py-1 rounded-lg border text-xs truncate max-w-[220px] transition-colors"
                    :class="
                      selectedAdjunto?.idAdjunto === adj.idAdjunto
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-600 dark:text-emerald-200'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700'
                    "
                    :title="formatAdjuntoName(adj.rutaArchivo)"
                    @click="selectedAdjuntoId = adj.idAdjunto"
                  >
                    Adjunto {{ index + 1 }}
                  </button>
                </div>

                <div class="mt-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 min-h-[200px] flex items-center justify-center overflow-hidden cursor-zoom-in"
                  @click="selectedAdjunto && openAdjuntoFull()">
                  <template v-if="selectedAdjunto">
                    <template v-if="isImageFile(selectedAdjunto.rutaArchivo)">
                      <img
                        :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)"
                        alt="Vista previa del adjunto"
                        class="max-h-64 max-w-full object-contain"
                      />
                    </template>
                    <template v-else-if="isPdfFile(selectedAdjunto.rutaArchivo)">
                      <iframe
                        :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)"
                        class="w-full h-64 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                      ></iframe>
                    </template>
                    <template v-else>
                      <div class="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-300 px-4 text-center">
                        <p>
                          Previsualización no disponible para este tipo de archivo.
                          Usa el botón <span class="font-semibold">Descargar</span> para abrirlo en tu equipo.
                        </p>
                      </div>
                    </template>
                  </template>
                  <template v-else>
                    <div class="text-xs text-gray-500 dark:text-gray-400 text-center px-4">
                      Selecciona un adjunto de la lista para previsualizarlo.
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500 dark:text-gray-400">Sin adjuntos.</div>
          </div>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20 p-4">
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Estado de aprobación</div>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Monto aprobado</dt>
                <dd class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedItem ? formatAmount(selectedItem.montoAprobado) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Estado</dt>
                <dd>
                  <span
                    v-if="selectedItem"
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium inline-block',
                      selectedItem.estado === 'RECHAZADO'
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    ]"
                  >
                    {{ selectedItem.estado }}
                  </span>
                  <span v-else>-</span>
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Comentario</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem?.observacion || '-' }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Fecha y Hora</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem ? formatDateTime(selectedItem.fechaAprobacion) : '-' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>

      <div
        v-if="showAdjuntoFull && selectedAdjunto"
        class="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4"
        @click.self="closeAdjuntoFull"
      >
        <div class="relative max-w-5xl w-full max-h-[90vh] bg-gray-900 rounded-xl border border-gray-700 p-3 flex flex-col gap-3">
          <div class="flex items-center justify-between text-xs text-gray-300 gap-3">
            <span class="truncate">{{ formatAdjuntoName(selectedAdjunto.rutaArchivo) }}</span>
            <div class="flex items-center gap-2 shrink-0">
              <div class="flex items-center gap-1 mr-2">
                <button
                  type="button"
                  class="px-1.5 py-0.5 rounded border border-gray-600 text-[11px] text-gray-200 hover:bg-gray-800 disabled:opacity-40"
                  :disabled="!isImageFile(selectedAdjunto.rutaArchivo) || zoomLevel <= 50 / 100"
                  @click.stop="isImageFile(selectedAdjunto.rutaArchivo) && (zoomLevel = Math.max(0.5, zoomLevel - 0.25))"
                >
                  -
                </button>
                <span class="min-w-[3rem] text-center">{{ zoomPercent }}%</span>
                <button
                  type="button"
                  class="px-1.5 py-0.5 rounded border border-gray-600 text-[11px] text-gray-200 hover:bg-gray-800 disabled:opacity-40"
                  :disabled="!isImageFile(selectedAdjunto.rutaArchivo) || zoomLevel >= 300 / 100"
                  @click.stop="isImageFile(selectedAdjunto.rutaArchivo) && (zoomLevel = Math.min(3, zoomLevel + 0.25))"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                class="px-2 py-1 rounded-md border border-gray-500 text-xs text-gray-100 hover:bg-gray-800"
                @click="downloadAdjunto"
              >
                Descargar
              </button>
              <button
                type="button"
                class="px-2 py-1 rounded-md border border-gray-600 text-xs text-gray-200 hover:bg-gray-800"
                @click="closeAdjuntoFull"
              >
                Cerrar
              </button>
            </div>
          </div>
          <div class="flex-1 flex items-center justify-center bg-black/60 rounded-lg p-2">
            <template v-if="selectedAdjunto && isImageFile(selectedAdjunto.rutaArchivo)">
              <div class="max-h-[80vh] max-w-full overflow-auto">
                <img
                  :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)"
                  alt="Adjunto"
                  class="object-contain"
                  :style="{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }"
                />
              </div>
            </template>
            <template v-else-if="selectedAdjunto && isPdfFile(selectedAdjunto.rutaArchivo)">
              <iframe
                :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)"
                class="w-full h-[80vh] rounded-md bg-white"
              ></iframe>
            </template>
            <template v-else-if="selectedAdjunto">
              <div class="text-xs text-gray-300 text-center space-y-2 px-4">
                <p>No se puede previsualizar este tipo de archivo aquí.</p>
                <a
                  :href="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-400 text-xs text-indigo-200 hover:bg-gray-800"
                >
                  Abrir en nueva pestaña
                </a>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { createBuildAdjuntoUrl } from '../utils/buildAdjuntoUrl'
import { useTablePreferences } from '@/composables/useTablePreferences'

interface ColumnConfig {
  key: string
  label: string
  fixed: boolean
}

interface LiquidacionDetalleItem {
  idDetalle: number
  idLiquidacion: number
  idGasto: string
  nombreGasto: string
  concepto: string
  total: number
  fechaConsumo: string
  ruc: string
  nombreProveedor: string
  numeroComprobante: string
  tipoDocumento: string
  subtotalConIva: number
  subtotalSinIva: number
  iva: number
}

interface AprobacionItem {
  idAprobacion: number
  idDetalle: number
  idUsuario: string
  nivelAprobacion: number
  estado: string
  montoAprobado: number
  observacion: string
  fechaAprobacion?: string
}

interface HistorialItem {
  idAprobacion: number
  idDetalle: number
  idLiquidacion: number
  nombreGasto: string
  concepto: string
  total: number
  estado: string
  montoAprobado: number
  observacion: string
  fechaAprobacion: string
}

interface LiquidacionInfo {
  idLiquidacion: number
  codAlmacen: string
  nombreCustodio: string
  cedulaCustodio: string
  fechaCreacion: string
}

interface AdjuntoItem {
  idAdjunto: number
  idDetalle: number
  rutaArchivo: string
  fechaSubida: string
}

const router = useRouter()

const volver = () => {
  router.back()
}

const loading = ref(false)
const error = ref('')
const historial = ref<HistorialItem[]>([])
const openGroups = ref<Record<number, boolean>>({})
const liquidacionesInfo = ref<Record<number, LiquidacionInfo>>({})

// Filtros de fecha - por defecto última semana
const fechaHasta = ref('')
const fechaDesde = ref('')

const showDetallePanel = ref(false)
const selectedItem = ref<HistorialItem | null>(null)
const selectedDetalle = ref<LiquidacionDetalleItem | undefined>(undefined)
const detallesByIdDetalle = ref<Record<number, LiquidacionDetalleItem>>({})
const adjuntosByDetalle = ref<Record<number, number>>({})
const adjuntosListByDetalle = ref<Record<number, AdjuntoItem[]>>({})
const loadingAdjuntosMap = ref<Record<number, boolean>>({})
const selectedAdjuntoId = ref<number | null>(null)
const showAdjuntoFull = ref(false)
const zoomLevel = ref(1)

const availableColumns: ColumnConfig[] = [
  { key: 'gasto', label: 'Gasto', fixed: false },
  { key: 'fechaConsumo', label: 'Fecha consumo', fixed: false },
  { key: 'ruc', label: 'RUC', fixed: false },
  { key: 'proveedor', label: 'Proveedor', fixed: false },
  { key: 'numeroComprobante', label: 'N° Comprobante', fixed: false },
  { key: 'tipoDocumento', label: 'Tipo Documento', fixed: false },
  { key: 'concepto', label: 'Concepto', fixed: false },
  { key: 'subtotalConIva', label: 'Subtotal Base 15%', fixed: false },
  { key: 'subtotalSinIva', label: 'Subtotal Base 0%', fixed: false },
  { key: 'iva', label: 'IVA', fixed: false },
  { key: 'total', label: 'Monto Total', fixed: false },
  { key: 'adjuntos', label: 'Adjuntos', fixed: false },
  { key: 'montoAprobado', label: 'Monto Aprobado', fixed: true },
  { key: 'estado', label: 'Estado', fixed: true },
  { key: 'observacion', label: 'Comentario', fixed: true },
  { key: 'fechaAprobacion', label: 'Fecha y Hora', fixed: true },
  { key: 'acciones', label: 'Acciones', fixed: true }
]

const defaultVisibleColumns = ['gasto', 'total', 'montoAprobado', 'estado', 'fechaAprobacion', 'acciones']
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns: orderedVisibleColumnKeys,
  savePreferences
} = useTablePreferences({
  tableId: 'caja-chica-historial-supervisor',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

const orderedVisibleColumns = computed(() => {
  const ordered = orderedVisibleColumnKeys.value
    .map(key => availableColumns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined)
  const fixedColumns = ordered.filter(col => col.fixed)
  const nonFixedColumns = ordered.filter(col => !col.fixed)
  return [...nonFixedColumns, ...fixedColumns]
})

const tableColumns = orderedVisibleColumns

const showColumnSelector = ref(false)
const columnSelectorWrapRef = ref<HTMLElement | null>(null)

const availableColumnsWithVisibility = computed(() =>
  availableColumns.map(col => ({
    ...col,
    visible: col.fixed ? true : visibleColumns.value.includes(col.key)
  }))
)

function toggleColumnVisibility(columnKey: string) {
  const column = availableColumns.find(col => col.key === columnKey)
  if (column?.fixed) return
  const current = visibleColumns.value
  const index = current.indexOf(columnKey)
  const visibleNonFixed = current.filter(
    key => !availableColumns.find(c => c.key === key)?.fixed
  )
  if (index > -1 && visibleNonFixed.length <= 1) return
  if (index > -1) {
    visibleColumns.value = current.filter(k => k !== columnKey)
  } else {
    visibleColumns.value = [...current, columnKey]
  }
  savePreferences()
}

function closeColumnSelectorOnClickOutside(e: MouseEvent) {
  if (columnSelectorWrapRef.value && !columnSelectorWrapRef.value.contains(e.target as Node)) {
    showColumnSelector.value = false
    document.removeEventListener('click', closeColumnSelectorOnClickOutside)
  }
}

watch(showColumnSelector, (isOpen) => {
  if (isOpen) {
    nextTick(() => document.addEventListener('click', closeColumnSelectorOnClickOutside))
  } else {
    document.removeEventListener('click', closeColumnSelectorOnClickOutside)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeColumnSelectorOnClickOutside)
  document.removeEventListener('keydown', onDetalleKeydown)
  document.body.classList.remove('overflow-hidden')
})

const selectedAdjunto = computed(() => {
  if (!selectedItem.value) return null
  const detalleId = selectedItem.value.idDetalle
  const list = adjuntosListByDetalle.value[detalleId] || []
  if (!list.length) return null
  const found = list.find(a => a.idAdjunto === selectedAdjuntoId.value)
  return found || list[0]
})

const zoomPercent = computed(() => Math.round(zoomLevel.value * 100))

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || '/caja-chica-api',
  headers: {
    'Content-Type': 'application/json'
  }
})

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const buildAdjuntoUrl = createBuildAdjuntoUrl()

const formatAdjuntoName = (ruta: string) => {
  if (!ruta) return ''
  const parts = ruta.split('/')
  return parts[parts.length - 1]
}

const isImageFile = (ruta: string) => /\.(png|jpe?g|gif|webp)$/i.test(ruta)
const isPdfFile = (ruta: string) => /\.pdf$/i.test(ruta)

const getCurrentUserId = (): string => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return ''
    const user = JSON.parse(userStr) as { id?: string }
    return user.id || ''
  } catch {
    return ''
  }
}

const normalizeString = (value: any) => String(value ?? '').trim()

const normalizeDetalle = (item: any): LiquidacionDetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  idGasto: normalizeString(item.idGasto ?? item.IdGasto ?? ''),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  total: Number(item.total ?? item.Total ?? 0),
  fechaConsumo: String(item.fechaConsumo ?? item.FechaConsumo ?? ''),
  ruc: normalizeString(item.ruc ?? item.Ruc ?? ''),
  nombreProveedor: normalizeString(item.nombreProveedor ?? item.NombreProveedor ?? ''),
  numeroComprobante: normalizeString(item.numeroComprobante ?? item.NumeroComprobante ?? ''),
  tipoDocumento: normalizeString(item.numeroAutorizacion ?? item.NumeroAutorizacion ?? ''),
  subtotalConIva: Number(item.subtotal_Con_Iva ?? item.Subtotal_Con_Iva ?? item.subtotalConIva ?? 0),
  subtotalSinIva: Number(item.subtotal_Sin_Iva ?? item.Subtotal_Sin_Iva ?? item.subtotalSinIva ?? 0),
  iva: Number(item.iva ?? item.Iva ?? 0)
})

const normalizeAprobacion = (item: any): AprobacionItem => ({
  idAprobacion: Number(item.idAprobacion ?? item.IdAprobacion ?? 0),
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? ''),
  nivelAprobacion: Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
  fechaAprobacion: String(item.fechaAprobacion ?? item.FechaAprobacion ?? '')
})

const aprobadasCount = computed(() => 
  historialFiltrado.value.filter(item => item.estado === 'APROBADO').length
)

const rechazadasCount = computed(() =>
  historialFiltrado.value.filter(item => item.estado === 'RECHAZADO').length
)

const totalMontoAprobado = computed(() =>
  historialFiltrado.value.reduce((acc, item) => acc + item.montoAprobado, 0)
)

const historialFiltrado = computed(() => {
  if (!fechaDesde.value && !fechaHasta.value) return historial.value
  
  return historial.value.filter(item => {
    if (!item.fechaAprobacion) return false
    const fecha = item.fechaAprobacion.substring(0, 10) // YYYY-MM-DD
    
    if (fechaDesde.value && fecha < fechaDesde.value) return false
    if (fechaHasta.value && fecha > fechaHasta.value) return false
    
    return true
  })
})

const groupedHistorial = computed(() => {
  const groups = new Map<number, HistorialItem[]>()
  historialFiltrado.value.forEach(item => {
    if (!groups.has(item.idLiquidacion)) {
      groups.set(item.idLiquidacion, [])
    }
    groups.get(item.idLiquidacion)?.push(item)
  })

  return Array.from(groups.entries()).map(([idLiquidacion, items]) => {
    const totalMonto = items.reduce((acc, item) => acc + item.montoAprobado, 0)
    const liquidacionInfo = liquidacionesInfo.value[idLiquidacion]
    return {
      idLiquidacion,
      items,
      totalMonto,
      codAlmacen: liquidacionInfo?.codAlmacen || '',
      nombreCustodio: liquidacionInfo?.nombreCustodio || '',
      cedulaCustodio: liquidacionInfo?.cedulaCustodio || '',
      fechaCreacion: liquidacionInfo?.fechaCreacion || ''
    }
  }).sort((a, b) => b.idLiquidacion - a.idLiquidacion)
})

const isGroupOpen = (idLiquidacion: number) => openGroups.value[idLiquidacion] !== false

const toggleGroup = (idLiquidacion: number) => {
  openGroups.value[idLiquidacion] = !isGroupOpen(idLiquidacion)
}

function getCellValue(item: HistorialItem, columnKey: string): string | number {
  const d = detallesByIdDetalle.value[item.idDetalle]
  switch (columnKey) {
    case 'detalle': return item.idDetalle
    case 'gasto': return item.nombreGasto
    case 'fechaConsumo': return formatDate(d?.fechaConsumo ?? '')
    case 'ruc': return d?.ruc ?? '-'
    case 'proveedor': return d?.nombreProveedor ?? '-'
    case 'numeroComprobante': return d?.numeroComprobante ?? '-'
    case 'tipoDocumento': return d?.tipoDocumento || '-'
    case 'concepto': return d?.concepto ?? item.concepto ?? '-'
    case 'subtotalConIva': return d != null ? formatAmount(d.subtotalConIva) : '-'
    case 'subtotalSinIva': return d != null ? formatAmount(d.subtotalSinIva) : '-'
    case 'iva': return d != null ? formatAmount(d.iva) : '-'
    case 'total': return formatAmount(item.total)
    case 'adjuntos': return adjuntosByDetalle.value[item.idDetalle] ?? 0
    case 'montoAprobado': return formatAmount(item.montoAprobado)
    case 'observacion': return item.observacion || '-'
    default: return ''
  }
}

async function openDetalle(item: HistorialItem) {
  selectedItem.value = item
  selectedDetalle.value = detallesByIdDetalle.value[item.idDetalle]
  selectedAdjuntoId.value = null
  showDetallePanel.value = true
  await loadAdjuntosForDetalle(item.idDetalle)
}

function closeDetalle() {
  showDetallePanel.value = false
  selectedItem.value = null
  selectedDetalle.value = undefined
  selectedAdjuntoId.value = null
}

async function loadAdjuntosForDetalle(idDetalle: number) {
  if (!idDetalle) return
  if (adjuntosListByDetalle.value[idDetalle]) return
  if (loadingAdjuntosMap.value[idDetalle]) return

  loadingAdjuntosMap.value = { ...loadingAdjuntosMap.value, [idDetalle]: true }
  try {
    const response = await cajaChicaApi.get(`/Adjuntos/por-detalle/${idDetalle}`)
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    adjuntosListByDetalle.value = {
      ...adjuntosListByDetalle.value,
      [idDetalle]: items.map((item: any) => ({
        idAdjunto: Number(item.idAdjunto ?? item.IdAdjunto ?? 0),
        idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? idDetalle),
        rutaArchivo: String(item.rutaArchivo ?? item.RutaArchivo ?? ''),
        fechaSubida: String(item.fechaSubida ?? item.FechaSubida ?? '')
      }))
    }
  } catch {
    adjuntosListByDetalle.value = { ...adjuntosListByDetalle.value, [idDetalle]: [] }
  } finally {
    loadingAdjuntosMap.value = { ...loadingAdjuntosMap.value, [idDetalle]: false }
  }
}

function onDetalleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeDetalle()
}

watch(showDetallePanel, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', onDetalleKeydown)
    document.body.classList.add('overflow-hidden')
  } else {
    document.removeEventListener('keydown', onDetalleKeydown)
    document.body.classList.remove('overflow-hidden')
  }
})

function openAdjuntoFull() {
  if (!selectedAdjunto.value) return
  showAdjuntoFull.value = true
  zoomLevel.value = 1
}

function closeAdjuntoFull() {
  showAdjuntoFull.value = false
  zoomLevel.value = 1
}

async function downloadAdjunto() {
  if (!selectedAdjunto.value) return

  try {
    const url = buildAdjuntoUrl(selectedAdjunto.value.rutaArchivo)
    const token = localStorage.getItem('token')

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })

    if (!response.ok) {
      throw new Error('No se pudo descargar el archivo.')
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = formatAdjuntoName(selectedAdjunto.value.rutaArchivo) || 'archivo'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('Error al descargar el adjunto', err)
    alert('No se pudo descargar el archivo. Verifique su conexión o intente nuevamente.')
  }
}

const loadHistorial = async () => {
  loading.value = true
  error.value = ''
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'No se encontro el usuario logeado.'
      return
    }

    const [aprobacionesRes, detallesRes, liquidacionesRes] = await Promise.all([
      cajaChicaApi.get('/Aprobaciones'),
      cajaChicaApi.get('/LiquidacionesDetalle'),
      cajaChicaApi.get('/Liquidaciones')
    ])

    const aprobacionesPayload = aprobacionesRes.data as any
    const detallesPayload = detallesRes.data as any
    const liquidacionesPayload = liquidacionesRes.data as any

    // Procesar liquidaciones
    const liquidaciones = (Array.isArray(liquidacionesPayload) ? liquidacionesPayload : liquidacionesPayload?.data || [])
    liquidacionesInfo.value = {}
    liquidaciones.forEach((liq: any) => {
      const idLiq = Number(liq.idLiquidacion ?? liq.IdLiquidacion ?? 0)
      if (idLiq) {
        liquidacionesInfo.value[idLiq] = {
          idLiquidacion: idLiq,
          codAlmacen: normalizeString(liq.codAlmacen ?? liq.CodAlmacen ?? ''),
          nombreCustodio: normalizeString(liq.nombreCustodio ?? liq.NombreCustodio ?? ''),
          cedulaCustodio: normalizeString(liq.cedulaCustodio ?? liq.CedulaCustodio ?? ''),
          fechaCreacion: String(liq.fechaCreacion ?? liq.FechaCreacion ?? '')
        }
      }
    })

    const aprobaciones = (Array.isArray(aprobacionesPayload) ? aprobacionesPayload : aprobacionesPayload?.data || [])
      .map(normalizeAprobacion)
      .filter((item: AprobacionItem) => item.idUsuario === userId)
      .filter((item: AprobacionItem) => item.nivelAprobacion === 1)
      .filter((item: AprobacionItem) => ['APROBADO', 'RECHAZADO'].includes(item.estado.toUpperCase()))

    const detalles: LiquidacionDetalleItem[] = (Array.isArray(detallesPayload) ? detallesPayload : detallesPayload?.data || [])
      .map(normalizeDetalle)

    const detalleMap = new Map<number, LiquidacionDetalleItem>()
    detalles.forEach((detalle: LiquidacionDetalleItem) => {
      detalleMap.set(detalle.idDetalle, detalle)
    })

    detallesByIdDetalle.value = Object.fromEntries(detalleMap)

    historial.value = aprobaciones.map((aprobacion: AprobacionItem): HistorialItem => {
      const detalle = detalleMap.get(aprobacion.idDetalle)
      return {
        idAprobacion: aprobacion.idAprobacion,
        idDetalle: aprobacion.idDetalle,
        idLiquidacion: detalle?.idLiquidacion || 0,
        nombreGasto: detalle?.nombreGasto || '-',
        concepto: detalle?.concepto || '-',
        total: detalle?.total || 0,
        estado: aprobacion.estado,
        montoAprobado: aprobacion.montoAprobado,
        observacion: aprobacion.observacion,
        fechaAprobacion: aprobacion.fechaAprobacion || ''
      }
    }).sort((a: HistorialItem, b: HistorialItem) => {
      const dateA = new Date(a.fechaAprobacion).getTime()
      const dateB = new Date(b.fechaAprobacion).getTime()
      return dateB - dateA
    })

    openGroups.value = historial.value.reduce<Record<number, boolean>>((acc, item) => {
      if (item.idLiquidacion && acc[item.idLiquidacion] === undefined) {
        acc[item.idLiquidacion] = true
      }
      return acc
    }, {})

    // Cargar contadores de adjuntos
    adjuntosByDetalle.value = {}
    const detalleIds = [...new Set(historial.value.map(h => h.idDetalle))]
    for (const idDetalle of detalleIds) {
      try {
        const adjRes = await cajaChicaApi.get(`/Adjuntos/por-detalle/${idDetalle}`)
        const adjPayload = adjRes.data as any
        const adjList = Array.isArray(adjPayload) ? adjPayload : Array.isArray(adjPayload?.data) ? adjPayload.data : []
        adjuntosByDetalle.value[idDetalle] = adjList.length
      } catch {
        adjuntosByDetalle.value[idDetalle] = 0
      }
    }
  } catch {
    error.value = 'No se pudo cargar el historial de aprobaciones.'
  } finally {
    loading.value = false
  }
}

// Inicializar fechas por defecto (última semana)
const initializeDateFilters = () => {
  const hoy = new Date()
  const haceUnaSemana = new Date()
  haceUnaSemana.setDate(hoy.getDate() - 7)
  
  fechaHasta.value = hoy.toISOString().substring(0, 10)
  fechaDesde.value = haceUnaSemana.toISOString().substring(0, 10)
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')
const formatDateTime = (value: string) => {
  if (!value) return '-'
  try {
    const date = new Date(value)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return value.substring(0, 16)
  }
}

const downloadLiquidacionPdf = (idLiquidacion: number) => {
  const esc = (s: string | number | undefined | null) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fmt = (v: string | undefined | null) => (v ? String(v).substring(0, 10) : '-')
  const fmtAmt = (v: number | undefined | null) => {
    const n = Number(v ?? 0)
    return Number.isNaN(n) ? '0.00' : n.toFixed(2)
  }

  const liqInfo = liquidacionesInfo.value[idLiquidacion]
  const aprobaciones = historialFiltrado.value.filter(h => h.idLiquidacion === idLiquidacion)
  const aprobCount = aprobaciones.filter(h => h.estado === 'APROBADO').length
  const rechazCount = aprobaciones.filter(h => h.estado === 'RECHAZADO').length
  const totalSolicitado = aprobaciones.reduce((a, h) => a + h.total, 0)
  const totalAprobado = aprobaciones.reduce((a, h) => a + h.montoAprobado, 0)
  const filtro = (fechaDesde.value || fechaHasta.value)
    ? `${fechaDesde.value || '-'} al ${fechaHasta.value || '-'}`
    : 'Sin filtro'

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:24px}
    .header-doc{border-bottom:3px solid #1e40af;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end}
    .header-doc .title-block .label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#1e40af;font-weight:600}
    .header-doc .title-block h1{font-size:20px;font-weight:800;color:#1e1b4b;line-height:1.1}
    .header-doc .meta-right{text-align:right;font-size:10px;color:#6b7280;line-height:1.6}
    .section{border:1px solid #e5e7eb;border-radius:6px;margin-bottom:20px;overflow:hidden}
    .section-head{background:#1e40af;color:#fff;padding:9px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;display:flex;justify-content:space-between;align-items:center}
    .section-head.green{background:#065f46}
    .section-head .badge{background:rgba(255,255,255,.2);border-radius:3px;padding:2px 7px;font-size:9px;font-weight:700;letter-spacing:.4px}
    .stats-row{display:flex;gap:18px;font-size:10px;color:rgba(255,255,255,.85)}
    .stats-row span strong{font-weight:700;color:#fff}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr)}
    .grid3{display:grid;grid-template-columns:repeat(3,1fr)}
    .meta-cell{padding:9px 14px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}
    .meta-cell:last-child{border-right:none}
    .meta-label{font-size:8.5px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:2px}
    .meta-value{font-size:11px;font-weight:600;color:#111}
    table{width:100%;border-collapse:collapse}
    th{background:#f3f4f6;text-align:left;padding:6px 10px;font-size:8.5px;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;border-bottom:1px solid #e5e7eb}
    td{padding:5px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:10px;color:#374151}
    tr:last-child td{border-bottom:none}
    .amount{text-align:right;font-variant-numeric:tabular-nums;font-family:'Courier New',monospace;font-size:10px}
    .aprobado{color:#059669;font-weight:600}
    .rechazado{color:#dc2626;font-weight:600}
    .footer-totals{background:#f9fafb;padding:10px 14px;display:flex;justify-content:flex-end;gap:28px;border-top:2px solid #e5e7eb}
    .total-item{text-align:right}
    .total-label{font-size:9px;text-transform:uppercase;color:#6b7280;letter-spacing:.4px}
    .total-value{font-size:13px;font-weight:700;color:#111}
    .total-value.primary{color:#1e40af}
    .no-data{padding:10px 14px;font-size:10px;color:#9ca3af;font-style:italic}
    @media print{body{padding:8mm}@page{size:A4;margin:10mm}}
  `

  // --- CABECERA ---
  const cabeceraHtml = `
    <div class="section">
      <div class="section-head"><span>Cabecera de la liquidación</span><span class="badge">#${esc(idLiquidacion)}</span></div>
      <div class="grid4">
        <div class="meta-cell"><div class="meta-label">Almacén / Tienda</div><div class="meta-value">${esc(liqInfo?.codAlmacen || '-')}</div></div>
        <div class="meta-cell"><div class="meta-label">Custodio</div><div class="meta-value">${esc(liqInfo?.nombreCustodio || '-')}</div></div>
        <div class="meta-cell"><div class="meta-label">Cédula custodio</div><div class="meta-value">${esc(liqInfo?.cedulaCustodio || '-')}</div></div>
        <div class="meta-cell"><div class="meta-label">Fecha creación</div><div class="meta-value">${fmt(liqInfo?.fechaCreacion)}</div></div>
        <div class="meta-cell"><div class="meta-label">Período filtrado</div><div class="meta-value" style="font-size:10px;font-weight:400">${esc(filtro)}</div></div>
      </div>
      <div class="grid4">
        <div class="meta-cell"><div class="meta-label"># Ítems</div><div class="meta-value">${aprobaciones.length}</div></div>
        <div class="meta-cell"><div class="meta-label">Aprobados</div><div class="meta-value aprobado">${aprobCount}</div></div>
        <div class="meta-cell"><div class="meta-label">Rechazados</div><div class="meta-value rechazado">${rechazCount}</div></div>
        <div class="meta-cell"><div class="meta-label">Total aprobado</div><div class="meta-value primary" style="color:#1e40af">$${fmtAmt(totalAprobado)}</div></div>
      </div>
    </div>`

  // --- DETALLE DE GASTOS (desde detallesByIdDetalle) ---
  const detalleIds = [...new Set(aprobaciones.map(h => h.idDetalle))]
  let detallesRows = ''
  detalleIds.forEach(idDetalle => {
    const d = detallesByIdDetalle.value[idDetalle]
    const adjCount = adjuntosByDetalle.value[idDetalle] ?? 0
    const iva = d ? (d.total - d.subtotalConIva - d.subtotalSinIva) : 0
    detallesRows += `<tr>
      <td>${esc(d?.nombreGasto ?? '-')}</td>
      <td>${esc(d?.concepto ?? '-')}</td>
      <td>${esc(d?.nombreProveedor ?? '-')}</td>
      <td>${esc(d?.ruc ?? '-')}</td>
      <td>${esc(d?.numeroComprobante ?? '-')}</td>
      <td>${esc(d?.tipoDocumento ?? '-')}</td>
      <td>${fmt(d?.fechaConsumo ?? '')}</td>
      <td class="amount">${d ? fmtAmt(d.subtotalConIva) : '-'}</td>
      <td class="amount">${d ? fmtAmt(d.subtotalSinIva) : '-'}</td>
      <td class="amount">${d ? fmtAmt(iva < 0 ? 0 : iva) : '-'}</td>
      <td class="amount">${d ? fmtAmt(d.total) : '-'}</td>
      <td style="text-align:right">${adjCount}</td>
    </tr>`
  })
  const detalleHtml = `
    <div class="section">
      <div class="section-head green"><span>Detalle de gastos</span><span class="stats-row"><span>Ítems: <strong>${detalleIds.length}</strong></span><span>Total: <strong>$${fmtAmt(totalSolicitado)}</strong></span></span></div>
      <table><thead><tr>
        <th>Gasto</th><th>Concepto</th><th>Proveedor</th><th>RUC</th><th>Comprobante</th><th>Tipo doc.</th><th>F. Consumo</th>
        <th>Base 15%</th><th>Base 0%</th><th>IVA</th><th>Total</th><th>Adj.</th>
      </tr></thead><tbody>${detallesRows || '<tr><td colspan="12" class="no-data">Sin detalles cargados.</td></tr>'}</tbody></table>
      <div class="footer-totals">
        <div class="total-item"><div class="total-label">Total solicitado</div><div class="total-value">$${fmtAmt(totalSolicitado)}</div></div>
      </div>
    </div>`

  // --- APROBACIONES ---
  let aprobRows = ''
  aprobaciones.forEach(h => {
    const estadoClass = h.estado === 'RECHAZADO' ? 'rechazado' : 'aprobado'
    aprobRows += `<tr>
      <td>${esc(h.idAprobacion)}</td>
      <td>${esc(h.nombreGasto)}</td>
      <td>${esc(h.concepto)}</td>
      <td class="amount">${fmtAmt(h.total)}</td>
      <td class="amount">${fmtAmt(h.montoAprobado)}</td>
      <td class="${estadoClass}">${esc(h.estado)}</td>
      <td>${esc(h.observacion || '-')}</td>
      <td>${formatDateTime(h.fechaAprobacion)}</td>
    </tr>`
  })
  const aprobHtml = `
    <div class="section">
      <div class="section-head"><span>Aprobaciones / Rechazos supervisor</span><span class="stats-row"><span>Aprobados: <strong>${aprobCount}</strong></span><span>Rechazados: <strong>${rechazCount}</strong></span><span>Total aprobado: <strong>$${fmtAmt(totalAprobado)}</strong></span></span></div>
      <table><thead><tr>
        <th>Aprob.</th><th>Gasto</th><th>Concepto</th>
        <th>Total</th><th>Monto aprobado</th><th>Estado</th><th>Comentario</th><th>Fecha y hora</th>
      </tr></thead><tbody>${aprobRows || '<tr><td colspan="8" class="no-data">Sin aprobaciones.</td></tr>'}</tbody></table>
      <div class="footer-totals">
        <div class="total-item"><div class="total-label">Total solicitado</div><div class="total-value">$${fmtAmt(totalSolicitado)}</div></div>
        <div class="total-item"><div class="total-label">Total aprobado supervisor</div><div class="total-value primary">$${fmtAmt(totalAprobado)}</div></div>
      </div>
    </div>`

  const generado = new Date().toLocaleString('es-ES')
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Liquidacion #${idLiquidacion}</title><style>${CSS}</style></head><body>
    <div class="header-doc">
      <div class="title-block">
        <div class="label">Historial Supervisor</div>
        <h1>Liquidación #${esc(idLiquidacion)}</h1>
      </div>
      <div class="meta-right">
        Tienda: <strong>${esc(liqInfo?.codAlmacen || '-')}</strong><br>
        Custodio: <strong>${esc(liqInfo?.nombreCustodio || '-')}</strong><br>
        Generado: ${generado}
      </div>
    </div>
    ${cabeceraHtml}
    ${detalleHtml}
    ${aprobHtml}
  </body></html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Por favor permite ventanas emergentes para descargar el PDF.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}

const downloadPdf = () => {
  const groups = groupedHistorial.value
  if (groups.length === 0) return
  const esc = (s: string | number | undefined | null) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fmt = (v: string) => v ? v.substring(0, 10) : '-'
  const fmtAmt = (v: number) => v != null ? v.toFixed(2) : '0.00'

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:20px}
    .liquidacion{border:1px solid #d1d5db;border-radius:6px;margin-bottom:28px;overflow:hidden;page-break-inside:avoid}
    .cabecera{background:#1e40af;color:#fff;padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
    .cabecera h2{font-size:13px;font-weight:700;margin-bottom:2px}
    .cabecera .sub{font-size:10px;opacity:.8}
    .cabecera .stats{display:flex;gap:14px;margin-top:4px}
    .cabecera .stat{font-size:10px;opacity:.85}
    .cabecera .stat strong{font-weight:700;opacity:1}
    .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid #e5e7eb}
    .meta-item{padding:8px 14px;border-right:1px solid #e5e7eb}
    .meta-item:last-child{border-right:none}
    .meta-label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:2px}
    .meta-value{font-size:11px;font-weight:600;color:#111}
    .section-title{background:#f9fafb;padding:6px 14px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#374151;border-bottom:1px solid #e5e7eb}
    table{width:100%;border-collapse:collapse}
    th{background:#f3f4f6;text-align:left;padding:6px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:#6b7280;border-bottom:1px solid #e5e7eb}
    td{padding:5px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;font-size:10px}
    tr:last-child td{border-bottom:none}
    .amount{text-align:right;font-variant-numeric:tabular-nums}
    .aprobado{color:#059669;font-weight:600}
    .rechazado{color:#dc2626;font-weight:600}
    .no-data{padding:10px 14px;font-size:10px;color:#9ca3af;font-style:italic}
    .footer-bar{background:#f9fafb;padding:8px 14px;display:flex;justify-content:flex-end;gap:24px;border-top:1px solid #e5e7eb}
    .footer-bar span{font-size:10px;color:#6b7280}
    .footer-bar strong{font-size:11px;color:#111}
    @media print{body{padding:8mm}@page{size:A4;margin:10mm}.liquidacion{margin-bottom:16px}}
  `

  let sectionsHtml = ''
  const filtro = (fechaDesde.value || fechaHasta.value)
    ? `${fechaDesde.value || '-'} al ${fechaHasta.value || '-'}`
    : 'Sin filtro de fechas'

  groups.forEach(group => {
    const aprobCount = group.items.filter(i => i.estado === 'APROBADO').length
    const rechazCount = group.items.filter(i => i.estado === 'RECHAZADO').length
    const totalMonto = group.items.reduce((a, i) => a + i.montoAprobado, 0)

    const filas = group.items.map(item => {
      const d = detallesByIdDetalle.value[item.idDetalle]
      const estadoClass = item.estado === 'RECHAZADO' ? 'rechazado' : 'aprobado'
      return `<tr>
        <td>${esc(item.nombreGasto)}</td>
        <td>${esc(d?.concepto ?? item.concepto ?? '-')}</td>
        <td>${esc(d?.nombreProveedor ?? '-')}</td>
        <td>${esc(d?.ruc ?? '-')}</td>
        <td>${esc(d?.numeroComprobante ?? '-')}</td>
        <td>${fmt(String(d?.fechaConsumo ?? ''))}</td>
        <td class="amount">${d ? fmtAmt(d.subtotalConIva) : '-'}</td>
        <td class="amount">${d ? fmtAmt(d.subtotalSinIva) : '-'}</td>
        <td class="amount">${d ? fmtAmt(d.iva) : '-'}</td>
        <td class="amount">${fmtAmt(item.total)}</td>
        <td class="amount">${fmtAmt(item.montoAprobado)}</td>
        <td class="${estadoClass}">${esc(item.estado)}</td>
        <td>${esc(item.observacion || '-')}</td>
        <td>${formatDateTime(item.fechaAprobacion)}</td>
      </tr>`
    }).join('')

    sectionsHtml += `
      <div class="liquidacion">
        <div class="cabecera">
          <div>
            <div class="sub">Historial supervisor — Liquidación de caja chica</div>
            <h2>Liquidación #${esc(group.idLiquidacion)}</h2>
            <div class="stats">
              <span class="stat">Aprobados: <strong>${aprobCount}</strong></span>
              <span class="stat">Rechazados: <strong>${rechazCount}</strong></span>
              <span class="stat">Monto total: <strong>$${fmtAmt(totalMonto)}</strong></span>
            </div>
          </div>
        </div>
        <div class="meta">
          <div class="meta-item"><div class="meta-label">Almacén / Tienda</div><div class="meta-value">${esc(group.codAlmacen || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Custodio</div><div class="meta-value">${esc(group.nombreCustodio || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Cédula custodio</div><div class="meta-value">${esc(group.cedulaCustodio || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Fecha creación</div><div class="meta-value">${fmt(group.fechaCreacion)}</div></div>
          <div class="meta-item"><div class="meta-label">Período</div><div class="meta-value">${esc(filtro)}</div></div>
        </div>
        <div class="section-title">Ítems aprobados / rechazados</div>
        <table><thead><tr>
          <th>Gasto</th><th>Concepto</th><th>Proveedor</th><th>RUC</th><th>Comprobante</th><th>F. Consumo</th>
          <th>Base 15%</th><th>Base 0%</th><th>IVA</th><th>Total</th><th>Monto aprobado</th><th>Estado</th><th>Comentario</th><th>Fecha aprobación</th>
        </tr></thead><tbody>${filas}</tbody></table>
        <div class="footer-bar">
          <span>Total aprobado&nbsp;<strong>$${fmtAmt(totalMonto)}</strong></span>
        </div>
      </div>`
  })

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Historial Supervisor</title><style>${CSS}</style></head><body>
    <div style="margin-bottom:16px;border-bottom:2px solid #1e40af;padding-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end">
      <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Reporte</div><div style="font-size:16px;font-weight:700;color:#1e40af">Historial de Aprobaciones — Supervisor</div></div>
      <div style="text-align:right;font-size:10px;color:#6b7280">Generado: ${new Date().toLocaleString('es-ES')}<br>Período: ${esc(filtro)} &middot; ${groups.length} liquidación(es)</div>
    </div>
    ${sectionsHtml}
  </body></html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Por favor permite ventanas emergentes para descargar el PDF.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}

onMounted(() => {
  initializeDateFilters()
  loadHistorial()
})
</script>
