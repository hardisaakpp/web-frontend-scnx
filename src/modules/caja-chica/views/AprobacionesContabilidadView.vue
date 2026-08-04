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
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Aprobaciones contabilidad</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Revisar novedades de supervisores y aprobar el valor final</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
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
              :disabled="groupedPendientes.length === 0"
              @click="downloadPdf"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="loadPendientes"
            >
              Refrescar
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando aprobaciones...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="pendientes.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones pendientes de contabilidad.
        </div>
        <div v-else class="space-y-6">
          <div
            v-for="group in groupedPendientes"
            :key="group.idLiquidacion"
            class="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden"
          >
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Liquidacion #{{ group.idLiquidacion }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ group.totalItems }} detalles pendientes · Tienda: {{ group.codAlmacen }} · Custodio: {{ group.nombreCustodio }} ({{ group.cedulaCustodio || '-' }}) · Supervisor: {{ getGroupSupervisorLabel(group.items) }} · Fecha: {{ formatDate(group.fechaCreacion) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Antes integrar: {{ formatAmount(group.totalMonto) }} · Después integrar: {{ formatAmount(group.totalMontoFinal) }}
                </div>
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
                        column.key === 'id' ? 'pl-3' : 'pl-2',
                        column.key === 'acciones' ? 'pr-2' : 'pr-2',
                        getStickyThClass(column)
                      ]"
                      :style="getStickyStyle(column)"
                      :draggable="!column.fixed"
                      @dragstart="!column.fixed && handleDragStart($event, column.key)"
                      @dragover.prevent="!column.fixed && handleDragOver($event, column.key)"
                      @dragleave="!column.fixed && handleDragLeave()"
                      @drop.prevent="!column.fixed && handleDrop($event, column.key)"
                      @dragend="!column.fixed && handleDragEnd()"
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
                        column.key === 'id' ? 'pl-3' : 'pl-2',
                        column.key === 'acciones' ? 'pr-2' : 'pr-2',
                        getStickyTdClass(column)
                      ]"
                      :style="getStickyStyle(column)"
                    >
                      <template v-if="column.key === 'montoFinal'">
                        {{ decisions[item.idAprobacion]?.montoAprobado ?? formatAmount(item.total) }}
                      </template>
                      <template v-else-if="column.key === 'comentario'">
                        {{ decisions[item.idAprobacion]?.observacion || '-' }}
                      </template>
                      <template v-else-if="column.key === 'nivel'">
                        {{ item.nivelAprobacion }}
                      </template>
                      <template v-else-if="column.key === 'acciones'">
                        <button
                          type="button"
                          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          @click="openDetalle(group.idLiquidacion, item)"
                        >
                          Ver detalle
                        </button>
                      </template>
                      <template v-else>
                        {{ getCellValue(group, item, column.key) }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="actionError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ actionError }}</div>
        <div v-else-if="actionSuccess" class="mt-3 text-sm text-emerald-600 dark:text-emerald-500">{{ actionSuccess }}</div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showDetallePanel" class="fixed inset-0 z-[100]">
      <div class="absolute inset-0 bg-black/40" @click="closeDetalle"></div>
      <aside class="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
        <div class="flex items-start justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="min-w-0">
            <div class="text-xs text-gray-500 dark:text-gray-400">Detalle aprobación contabilidad</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              #{{ selectedItem?.idAprobacion || '-' }}
            </h3>
            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Liquidación #{{ selectedItem?.idLiquidacion || '-' }} · Nivel {{ selectedItem?.nivelAprobacion ?? '-' }}
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
              <div class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Concepto</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.concepto || selectedItem?.concepto || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Fecha consumo</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle ? formatDate(selectedDetalle.fechaConsumo) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Proveedor</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.nombreProveedor || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">RUC</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.ruc || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">N° Comprobante</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.numeroComprobante || '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Tipo documento</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedDetalle?.tipoDocumento || '-' }}</dd>
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
                <dt class="text-xs text-gray-500 dark:text-gray-400">Antes de integrar (total solicitado)</dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedItem ? formatAmount(selectedItem.total) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Novedad supervisor</dt>
                <dd class="text-sm text-gray-900 dark:text-white">{{ selectedItem ? (hasSupervisorNovedad(selectedItem) ? 'Sí' : 'No') : '-' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">Adjuntos</dt>
                <dd class="text-sm text-gray-900 dark:text-white">
                  <span v-if="selectedItem">{{ adjuntosByDetalle[selectedItem.idDetalle] ?? 0 }}</span>
                  <span v-else>-</span>
                </dd>
              </div>
            </dl>
            <div v-if="selectedItem && getSupervisorDecisions(selectedItem.idDetalle).length" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Supervisores</div>
              <div class="space-y-2">
                <div
                  v-for="(decision, index) in getSupervisorDecisions(selectedItem.idDetalle)"
                  :key="index"
                  class="text-xs rounded-lg border border-gray-200 dark:border-gray-600 p-2 bg-white dark:bg-gray-800"
                >
                  <div class="flex justify-between gap-2">
                    <span class="text-gray-500 dark:text-gray-400">Supervisor:</span>
                    <span class="text-gray-900 dark:text-white">{{ decision.nombreUsuario || getUserLabel(decision.idUsuario) }}</span>
                  </div>
                  <div class="flex justify-between gap-2">
                    <span class="text-gray-500 dark:text-gray-400">Estado:</span>
                    <span class="text-gray-900 dark:text-white">{{ decision.estado || '-' }}</span>
                  </div>
                  <div class="flex justify-between gap-2 mt-1">
                    <span class="text-gray-500 dark:text-gray-400">Monto:</span>
                    <span class="text-gray-900 dark:text-white">{{ formatAmount(decision.montoAprobado) }}</span>
                  </div>
                  <div v-if="decision.observacion" class="mt-1 text-gray-700 dark:text-gray-300">{{ decision.observacion }}</div>
                </div>
              </div>
            </div>
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
                <div class="mt-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 min-h-[200px] flex items-center justify-center overflow-hidden cursor-zoom-in" @click="selectedAdjunto && openAdjuntoFull()">
                  <template v-if="selectedAdjunto">
                    <template v-if="isImageFile(selectedAdjunto.rutaArchivo)">
                      <img :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" alt="Vista previa" class="max-h-64 max-w-full object-contain" />
                    </template>
                    <template v-else-if="isPdfFile(selectedAdjunto.rutaArchivo)">
                      <iframe :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" class="w-full h-64 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"></iframe>
                    </template>
                    <template v-else>
                      <div class="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-300 px-4 text-center">
                        Previsualización no disponible. Usa <span class="font-semibold">Descargar</span> para abrirlo.
                      </div>
                    </template>
                  </template>
                  <template v-else>
                    <div class="text-xs text-gray-500 dark:text-gray-400 text-center px-4">Selecciona un adjunto para previsualizarlo.</div>
                  </template>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500 dark:text-gray-400">Sin adjuntos.</div>
          </div>

          <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Aprobación contabilidad</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Después de integrar (monto final)</label>
                <input
                  v-if="selectedItem"
                  v-model="decisions[selectedItem.idAprobacion].montoAprobado"
                  type="number"
                  step="0.01"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Antes de integrar (monto solicitado)</label>
                <div
                  v-if="selectedItem"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  {{ formatAmount(selectedItem.total) }}
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de base</label>
                <div
                  v-if="selectedItem"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  {{ getAutoTipoBaseLabel(selectedItem) }}
                </div>
                <p v-if="selectedItem" class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Regla automática: si se aprueba menos, descuenta primero de base 0%; si no alcanza, descuenta de base 15%.
                </p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Base 0% antes de integrar</label>
                <div
                  v-if="selectedItem"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  {{ formatAmount(getOriginalBaseSplit(selectedItem).montoBase0) }}
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Base 15% antes de integrar</label>
                <div
                  v-if="selectedItem"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  {{ formatAmount(getOriginalBaseSplit(selectedItem).montoBase15) }}
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Base 0% después de integrar</label>
                <div
                  v-if="selectedItem"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  {{ formatAmount(getApprovedBaseSplit(selectedItem).montoBase0) }}
                </div>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Base 15% después de integrar</label>
                <div
                  v-if="selectedItem"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  {{ formatAmount(getApprovedBaseSplit(selectedItem).montoBase15) }}
                </div>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Comentario</label>
                <input
                  v-if="selectedItem"
                  v-model="decisions[selectedItem.idAprobacion].observacion"
                  type="text"
                  placeholder="Comentario contabilidad"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div v-if="showRejectChoice" class="mt-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10 p-3">
              <div class="text-xs font-medium text-red-700 dark:text-red-300 mb-2">Confirmar negación</div>
              <div class="space-y-2 text-sm">
                <label class="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="tipoAccionRechazo" value="DEVOLUCION" v-model="tipoAccionRechazo" class="mt-0.5" />
                  <span>
                    <span class="font-medium text-gray-900 dark:text-white">Devolver para corrección</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">La liquidación regresa a Borrador para que el custodio la corrija y reenvíe.</span>
                  </span>
                </label>
                <label class="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="tipoAccionRechazo" value="RECHAZO_DEFINITIVO" v-model="tipoAccionRechazo" class="mt-0.5" />
                  <span>
                    <span class="font-medium text-gray-900 dark:text-white">Rechazar definitivamente</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">La liquidación queda cerrada y no podrá editarse ni reenviarse.</span>
                  </span>
                </label>
              </div>
              <p v-if="rejectValidationError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ rejectValidationError }}</p>
            </div>

            <div class="mt-4 flex items-center justify-end gap-2">
              <template v-if="!showRejectChoice">
                <button
                  v-if="selectedItem"
                  type="button"
                  class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  :disabled="actionLoadingId === selectedItem.idAprobacion"
                  @click="openRejectChoice"
                >
                  Negar
                </button>
                <button
                  v-if="selectedItem"
                  type="button"
                  class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  :disabled="actionLoadingId === selectedItem.idAprobacion"
                  @click="approve(selectedItem)"
                >
                  Aprobar
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @click="showRejectChoice = false"
                >
                  Cancelar
                </button>
                <button
                  v-if="selectedItem"
                  type="button"
                  class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  :disabled="actionLoadingId === selectedItem.idAprobacion"
                  @click="reject(selectedItem)"
                >
                  Confirmar negación
                </button>
              </template>
            </div>
          </div>
        </div>
      </aside>

      <div v-if="showAdjuntoFull && selectedAdjunto" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4" @click.self="closeAdjuntoFull">
        <div class="relative max-w-5xl w-full max-h-[90vh] bg-gray-900 rounded-xl border border-gray-700 p-3 flex flex-col gap-3">
          <div class="flex items-center justify-between text-xs text-gray-300 gap-3">
            <span class="truncate">{{ formatAdjuntoName(selectedAdjunto.rutaArchivo) }}</span>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" class="px-2 py-1 rounded-md border border-gray-500 text-xs text-gray-100 hover:bg-gray-800" @click="downloadAdjunto">Descargar</button>
              <button type="button" class="px-2 py-1 rounded-md border border-gray-600 text-xs text-gray-200 hover:bg-gray-800" @click="closeAdjuntoFull">Cerrar</button>
            </div>
          </div>
          <div class="flex-1 flex items-center justify-center bg-black/60 rounded-lg p-2">
            <template v-if="isImageFile(selectedAdjunto.rutaArchivo)">
              <img :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" alt="Adjunto" class="max-h-[80vh] max-w-full object-contain" />
            </template>
            <template v-else-if="isPdfFile(selectedAdjunto.rutaArchivo)">
              <iframe :src="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" class="w-full h-[80vh] rounded-md bg-white"></iframe>
            </template>
            <template v-else>
              <a :href="buildAdjuntoUrl(selectedAdjunto.rutaArchivo)" target="_blank" rel="noopener" class="text-indigo-300 hover:underline">Abrir en nueva pestaña</a>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { APP_LOCALE } from '@/plugins/locale'
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { cajaChicaApi } from '@/lib/http'
import api from '@/services/api'

import { useColumnDragReorder } from '@/composables/useColumnDragReorder'
import { useAdjuntosByDetalle } from '@/composables/useAdjuntosByDetalle'
import { useRouter } from 'vue-router'
import { resolveUserNames } from '../utils/resolveUserNames'
import { normalizeString, getCurrentUserId, normalizeDetalle, normalizeAprobacion } from '../utils/normalizeAprobaciones'
import type {
  ColumnConfig,
  AprobacionItem,
  DetalleItem,
  SupervisorDecision,
  UserOption,
  DecisionState
} from '../types/aprobaciones'

const loading = ref(false)
const error = ref('')
const actionError = ref('')
const actionSuccess = ref('')
const actionLoadingId = ref<number | null>(null)
const pendientes = ref<AprobacionItem[]>([])
const router = useRouter()

const volver = () => {
  router.back()
}
const decisions = ref<Record<number, DecisionState>>({})
const openGroups = ref<Record<number, boolean>>({})
const supervisorByDetalle = ref<Record<number, SupervisorDecision[]>>({})
const detallesByLiquidacion = ref<Record<number, DetalleItem[]>>({})
const adjuntosByDetalle = ref<Record<number, number>>({})
const usuarios = ref<UserOption[]>([])
const usuariosById = ref<Record<string, UserOption>>({})
// Cache para nombres de usuario locales
const localUserNames = ref<Record<string, string>>({})
const localUserLoading = ref<Record<string, boolean>>({})

async function fetchLocalUserName(id?: string) {
  if (!id) return '-';
  if (localUserNames.value[id] || localUserLoading.value[id]) return;
  localUserLoading.value[id] = true;
  try {
    const resolved = await resolveUserNames([id]);
    localUserNames.value[id] = resolved[id] || usuariosById.value[id]?.label || id;
  } catch {
    localUserNames.value[id] = usuariosById.value[id]?.label || id;
  } finally {
    localUserLoading.value[id] = false;
  }
}

const availableColumns: ColumnConfig[] = [
  { key: 'id', label: 'Id', fixed: false },
  { key: 'gasto', label: 'Gasto', fixed: false },
  { key: 'fechaConsumo', label: 'Fecha consumo', fixed: false },
  { key: 'ruc', label: 'RUC', fixed: false },
  { key: 'proveedor', label: 'Proveedor', fixed: false },
  { key: 'numeroComprobante', label: 'N° Comprobante', fixed: false },
  { key: 'tipoDocumento', label: 'Tipo documento', fixed: false },
  { key: 'concepto', label: 'Concepto', fixed: false },
  { key: 'subtotalConIva', label: 'Subtotal Base 15%', fixed: false },
  { key: 'subtotalSinIva', label: 'Subtotal Base 0%', fixed: false },
  { key: 'iva', label: 'IVA', fixed: false },
  { key: 'total', label: 'Antes integrar', fixed: false },
  { key: 'usuario', label: 'Supervisor', fixed: false },
  { key: 'montoSupervisor', label: 'Monto supervisor', fixed: false },
  { key: 'obsSupervisor', label: 'Obs. supervisor', fixed: false },
  { key: 'novedad', label: 'Novedad', fixed: false },
  { key: 'montoFinal', label: 'Después integrar', fixed: true },
  { key: 'nivel', label: 'Nivel', fixed: true },
  { key: 'comentario', label: 'Comentario', fixed: true },
  { key: 'acciones', label: 'Acciones', fixed: true }
]

const defaultVisibleColumns = ['id', 'gasto', 'total', 'novedad', 'montoFinal', 'nivel', 'comentario', 'acciones']

const {
  visibleColumns,
  orderedVisibleColumns,
  availableColumnsWithVisibility,
  toggleColumnVisibility,
  showColumnSelector,
  columnSelectorWrapRef,
  draggedColumnKey,
  dragOverColumnKey,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd
} = useColumnDragReorder({
  tableId: 'caja-chica-aprobaciones-contabilidad',
  availableColumns,
  defaultVisibleColumns,
  alwaysIncludeAllFixedColumns: true
})

const tableColumns = orderedVisibleColumns

const showDetallePanel = ref(false)
const showRejectChoice = ref(false)
const tipoAccionRechazo = ref<'DEVOLUCION' | 'RECHAZO_DEFINITIVO'>('DEVOLUCION')
const rejectValidationError = ref('')
const selectedContext = ref<{ idLiquidacion: number; item: AprobacionItem } | null>(null)
const selectedItem = computed(() => selectedContext.value?.item ?? null)
const selectedDetalle = computed(() => {
  if (!selectedContext.value) return undefined
  const { idLiquidacion, item } = selectedContext.value
  return detallesByLiquidacion.value[idLiquidacion]?.find(d => d.idDetalle === item.idDetalle)
})

const {
  adjuntosListByDetalle,
  loadingAdjuntosMap,
  selectedAdjuntoId,
  selectedAdjunto,
  loadAdjuntosForDetalle,
  buildAdjuntoUrl,
  formatAdjuntoName,
  isImageFile,
  isPdfFile
} = useAdjuntosByDetalle(computed(() => selectedItem.value?.idDetalle))

const showAdjuntoFull = ref(false)

function formatDetalleAmount(d: DetalleItem | undefined, amount: number | undefined): string {
  return d != null ? formatAmount(amount ?? 0) : '-'
}

function formatSupervisorList(list: SupervisorDecision[], mapper: (dec: SupervisorDecision) => string): string {
  return list.length ? list.map(mapper).join(', ') : '-'
}

function getCellValue(group: { idLiquidacion: number }, item: AprobacionItem, columnKey: string): string | number {
  const d = detallesByLiquidacion.value[group.idLiquidacion]?.find(det => det.idDetalle === item.idDetalle)
  const list = getSupervisorDecisions(item.idDetalle)
  switch (columnKey) {
    case 'id':
      return item.idAprobacion
    case 'detalle':
      return item.idDetalle
    case 'gasto':
      return item.nombreGasto
    case 'fechaConsumo':
      return formatDate(d?.fechaConsumo ?? '')
    case 'ruc':
      return d?.ruc ?? '-'
    case 'proveedor':
      return d?.nombreProveedor ?? '-'
    case 'numeroComprobante':
      return d?.numeroComprobante ?? '-'
    case 'tipoDocumento':
      return d?.tipoDocumento ?? '-'
    case 'concepto':
      return d?.concepto ?? item.concepto ?? '-'
    case 'subtotalConIva':
      return formatDetalleAmount(d, d?.subtotalConIva)
    case 'subtotalSinIva':
      return formatDetalleAmount(d, d?.subtotalSinIva)
    case 'iva':
      return formatDetalleAmount(d, d?.iva)
    case 'total':
      return formatAmount(item.total)
    case 'usuario':
      return formatSupervisorList(list, dec => dec.nombreUsuario || getUserLabel(dec.idUsuario))
    case 'montoSupervisor':
      return formatSupervisorList(list, dec => formatAmount(dec.montoAprobado))
    case 'obsSupervisor':
      return formatSupervisorList(list, dec => dec.observacion || '-')
    case 'novedad':
      return hasSupervisorNovedad(item) ? 'Sí' : 'No'
    case 'nivel':
      return item.nivelAprobacion
    default:
      return ''
  }
}

const groupedPendientes = computed(() => {
  const groups = new Map<number, AprobacionItem[]>()
  pendientes.value.forEach(item => {
    if (!groups.has(item.idLiquidacion)) {
      groups.set(item.idLiquidacion, [])
    }
    groups.get(item.idLiquidacion)?.push(item)
  })
  return Array.from(groups.entries()).map(([idLiquidacion, items]) => {
    const totalMonto = items.reduce((acc, item) => acc + item.total, 0)
    const totalMontoFinal = items.reduce((acc, item) => acc + getApprovedMonto(item), 0)
    const base = items[0]
    return {
      idLiquidacion,
      items,
      totalMonto,
      totalMontoFinal,
      totalItems: items.length,
      codAlmacen: base?.codAlmacen || '',
      nombreCustodio: base?.nombreCustodio || '',
      cedulaCustodio: base?.cedulaCustodio || '',
      fechaCreacion: base?.fechaCreacion || ''
    }
  })
})

const isGroupOpen = (idLiquidacion: number) => openGroups.value[idLiquidacion] !== false
const toggleGroup = (idLiquidacion: number) => {
  openGroups.value[idLiquidacion] = !isGroupOpen(idLiquidacion)
}

const fixedColumnStickyRight: Record<string, string> = {
  acciones: '0',
  comentario: '8.5rem',
  nivel: '20.5rem',
  montoFinal: '24.5rem'
}
const fixedColumnMinWidth: Record<string, string> = {
  acciones: '8.5rem',
  nivel: '4rem',
  comentario: '12rem',
  montoFinal: '7rem'
}

const stickyThClass = 'select-none py-1.5 pl-2 pr-2 sticky z-10 bg-gray-50 dark:bg-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]'
const stickyTdClass = 'py-1.5 pl-2 pr-2 sticky z-10 bg-white dark:bg-gray-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]'

function getStickyThClass(column: ColumnConfig): string {
  if (!column.fixed) return ''
  const right = fixedColumnStickyRight[column.key]
  const minW = fixedColumnMinWidth[column.key]
  if (!right || !minW) return ''
  return stickyThClass
}

function getStickyTdClass(column: ColumnConfig): string {
  if (!column.fixed) return ''
  const right = fixedColumnStickyRight[column.key]
  const minW = fixedColumnMinWidth[column.key]
  if (!right || !minW) return ''
  return stickyTdClass
}

function getStickyStyle(column: ColumnConfig): { right?: string; minWidth?: string } {
  if (!column.fixed) return {}
  const right = fixedColumnStickyRight[column.key]
  const minW = fixedColumnMinWidth[column.key]
  if (!right || !minW) return {}
  return { right, minWidth: minW }
}

const normalizeUser = (user: any): UserOption => {
  const id = String(user.id ?? user.Id ?? user.idUsuario ?? user.IdUsuario ?? '')
  const userName = String(user.userName ?? user.UsuarioNombre ?? user.username ?? '').trim()
  const fullName = String(user.fullName ?? user.Nombre ?? user.name ?? '').trim()
  const email = String(user.email ?? user.Correo ?? user.mail ?? '').trim()
  const base = fullName || userName || email || id
  const label = email && base !== email ? `${base} (${email})` : base
  return { id, label }
}

const getUserLabel = (id?: string) => {
  if (!id) return '-';
  // Si ya está en el caché local, mostrarlo
  if (localUserNames.value[id]) return localUserNames.value[id];
  // Fallback inmediato con usuarios ya cargados
  if (usuariosById.value[id]?.label) {
    localUserNames.value[id] = usuariosById.value[id].label;
    return localUserNames.value[id];
  }
  // Si está cargando, mostrar '...'
  if (localUserLoading.value[id]) return 'Cargando...';
  // Lanzar la carga y mostrar estado de carga
  fetchLocalUserName(id);
  return 'Cargando...';
}

const normalizeSupervisorDecision = (item: any): SupervisorDecision => ({
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  fechaAprobacion: item.fechaAprobacion ?? item.FechaAprobacion,
  idUsuario: item.idUsuario ?? item.IdUsuario,
  nombreUsuario: normalizeString(item.nombreUsuario ?? item.NombreUsuario ?? '') || undefined
})

function ensureDecision(item: AprobacionItem) {
  if (!decisions.value[item.idAprobacion]) {
    const supervisorDecisions = supervisorByDetalle.value[item.idDetalle] || []
    const lastDecision = supervisorDecisions[supervisorDecisions.length - 1]
    const montoBase = lastDecision?.montoAprobado && lastDecision.montoAprobado > 0 ? lastDecision.montoAprobado : item.total
    decisions.value[item.idAprobacion] = {
      montoAprobado: montoBase.toFixed(2),
      observacion: ''
    }
  }
}

function getDetalleByItem(item: AprobacionItem): DetalleItem | undefined {
  return detallesByLiquidacion.value[item.idLiquidacion]?.find(d => d.idDetalle === item.idDetalle)
}

function getApprovedMonto(item: AprobacionItem): number {
  const total = Math.max(0, Number(item.total ?? 0))
  const rawDecision = Number(decisions.value[item.idAprobacion]?.montoAprobado ?? total)
  if (Number.isNaN(rawDecision)) return total
  return Math.min(total, Math.max(0, rawDecision))
}

function getOriginalBaseSplit(item: AprobacionItem): { montoBase0: number; montoBase15: number } {
  const detalle = getDetalleByItem(item)
  const montoBase0 = Math.max(0, Number(detalle?.subtotalSinIva ?? 0))
  const montoBase15 = Math.max(0, Number(detalle?.subtotalConIva ?? 0))
  return { montoBase0, montoBase15 }
}

function getApprovedBaseSplit(item: AprobacionItem): { montoBase0: number; montoBase15: number; tipoBase: 'BASE_0' | 'BASE_15' } {
  const detalle = getDetalleByItem(item)
  const base0Original = Math.max(0, Number(detalle?.subtotalSinIva ?? 0))
  const base15Original = Math.max(0, Number(detalle?.subtotalConIva ?? 0))
  const total = Math.max(0, Number(item.total ?? 0))
  const montoAprobado = getApprovedMonto(item)

  const diferencia = Math.max(0, total - montoAprobado)
  const reduccionBase0 = Math.min(diferencia, base0Original)
  const reduccionRestante = Math.max(0, diferencia - reduccionBase0)
  const reduccionBase15 = Math.min(reduccionRestante, base15Original)

  const montoBase0 = Math.max(0, base0Original - reduccionBase0)
  const montoBase15 = Math.max(0, base15Original - reduccionBase15)
  const tipoBase: 'BASE_0' | 'BASE_15' = reduccionRestante > 0 || base0Original <= 0 ? 'BASE_15' : 'BASE_0'

  return { montoBase0, montoBase15, tipoBase }
}

function getAutoTipoBase(item: AprobacionItem): 'BASE_0' | 'BASE_15' {
  return getApprovedBaseSplit(item).tipoBase
}

function getAutoTipoBaseLabel(item: AprobacionItem): string {
  return getAutoTipoBase(item) === 'BASE_0' ? 'Base 0% (automático)' : 'Base 15% (automático)'
}

function openDetalle(idLiquidacion: number, item: AprobacionItem) {
  ensureDecision(item)
  selectedAdjuntoId.value = null
  selectedContext.value = { idLiquidacion, item }
  showDetallePanel.value = true
  showRejectChoice.value = false
  rejectValidationError.value = ''
  void loadAdjuntosForDetalle(item.idDetalle)
}

function closeDetalle() {
  showDetallePanel.value = false
  selectedContext.value = null
  selectedAdjuntoId.value = null
  showRejectChoice.value = false
  rejectValidationError.value = ''
}

function openRejectChoice() {
  tipoAccionRechazo.value = 'DEVOLUCION'
  rejectValidationError.value = ''
  showRejectChoice.value = true
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

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDetalleKeydown)
  document.body.classList.remove('overflow-hidden')
})

function openAdjuntoFull() {
  if (!selectedAdjunto.value) return
  showAdjuntoFull.value = true
}

function closeAdjuntoFull() {
  showAdjuntoFull.value = false
}

async function downloadAdjunto() {
  if (!selectedAdjunto.value) return
  try {
    const url = buildAdjuntoUrl(selectedAdjunto.value.rutaArchivo)
    const token = localStorage.getItem('token')
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
    if (!response.ok) throw new Error('No se pudo descargar el archivo.')
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
    alert('No se pudo descargar el archivo.')
  }
}

const getSupervisorDecisions = (idDetalle: number) => supervisorByDetalle.value[idDetalle] || []

const getGroupSupervisorLabel = (items: AprobacionItem[]) => {
  for (const item of items) {
    const decisions = getSupervisorDecisions(item.idDetalle)
    if (decisions.length) {
      const lastDecision = decisions[decisions.length - 1]
      return lastDecision.nombreUsuario || getUserLabel(lastDecision.idUsuario)
    }
  }
  return '-'
}

const hasSupervisorNovedad = (item: AprobacionItem) => {
  const decisionsList = supervisorByDetalle.value[item.idDetalle] || []
  if (!decisionsList.length) return false
  return decisionsList.some(decision => {
    const changedMonto = decision.montoAprobado > 0 && decision.montoAprobado !== item.total
    const hasObs = Boolean(decision.observacion?.trim())
    return changedMonto || hasObs
  })
}

const loadSupervisorDecisions = async (detalleIds: number[]) => {
  if (!detalleIds.length) {
    supervisorByDetalle.value = {}
    return
  }
  const response = await cajaChicaApi.get('/Aprobaciones')
  const payload = response.data as any
  const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
  const result: Record<number, SupervisorDecision[]> = {}
  items.forEach((item: any) => {
    const idDetalle = Number(item.idDetalle ?? item.IdDetalle ?? 0)
    const nivel = Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0)
    if (!detalleIds.includes(idDetalle) || nivel !== 1) return
    const decision = normalizeSupervisorDecision(item)
    if (!result[idDetalle]) result[idDetalle] = []
    result[idDetalle].push(decision)
  })
  Object.keys(result).forEach(key => {
    const id = Number(key)
    result[id].sort((a, b) => {
      const aTime = a.fechaAprobacion ? new Date(a.fechaAprobacion).getTime() : 0
      const bTime = b.fechaAprobacion ? new Date(b.fechaAprobacion).getTime() : 0
      return aTime - bTime
    })
  })
  supervisorByDetalle.value = result
}

const loadPendientes = async () => {
  loading.value = true
  error.value = ''
  actionError.value = ''
  actionSuccess.value = ''
  decisions.value = {}
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      error.value = 'No se encontro el usuario logeado.'
      return
    }
    const response = await cajaChicaApi.get(`/Aprobaciones/pendientes/${userId}`)
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    const normalized: AprobacionItem[] = items
      .map(normalizeAprobacion)
      .filter((item: AprobacionItem) => item.estado.toUpperCase() === 'PENDIENTE')
      .filter((item: AprobacionItem) => item.nivelAprobacion === 2)

    pendientes.value = normalized
    const detalleIds = normalized.map(item => item.idDetalle)
    await loadSupervisorDecisions(detalleIds)

    detallesByLiquidacion.value = {}
    adjuntosByDetalle.value = {}
    const liquidacionIds = [...new Set(normalized.map(p => p.idLiquidacion))]
    for (const idLiq of liquidacionIds) {
      try {
        const res = await cajaChicaApi.get('/LiquidacionesDetalle')
        const payloadRes = res.data as any
        const detailItems = Array.isArray(payloadRes) ? payloadRes : Array.isArray(payloadRes?.data) ? payloadRes.data : []
        detallesByLiquidacion.value[idLiq] = detailItems
          .map(normalizeDetalle)
          .filter((d: DetalleItem) => d.idLiquidacion === idLiq)
        for (const d of detallesByLiquidacion.value[idLiq]) {
          try {
            const adjRes = await cajaChicaApi.get(`/Adjuntos/por-detalle/${d.idDetalle}`)
            const adjPayload = adjRes.data as any
            const adjList = Array.isArray(adjPayload) ? adjPayload : Array.isArray(adjPayload?.data) ? adjPayload.data : []
            adjuntosByDetalle.value[d.idDetalle] = adjList.length
          } catch {
            adjuntosByDetalle.value[d.idDetalle] = 0
          }
        }
      } catch {
        detallesByLiquidacion.value[idLiq] = []
      }
    }

    normalized.forEach(ensureDecision)
    openGroups.value = normalized.reduce<Record<number, boolean>>((acc, item) => {
      if (acc[item.idLiquidacion] === undefined) acc[item.idLiquidacion] = false
      return acc
    }, {})
  } catch {
    error.value = 'No se pudieron cargar las aprobaciones de contabilidad.'
  } finally {
    loading.value = false
  }
}

const loadUsuarios = async () => {
  try {
    const response = await api.get('/Users')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    const mapped: UserOption[] = items.map(normalizeUser)
    usuarios.value = mapped
    usuariosById.value = mapped.reduce((acc: Record<string, UserOption>, user: UserOption) => {
      if (user.id) acc[user.id] = user
      return acc
    }, {} as Record<string, UserOption>)
  } catch {
    usuarios.value = []
    usuariosById.value = {}
  }
}

const approve = async (item: AprobacionItem) => {
  actionError.value = ''
  actionSuccess.value = ''
  actionLoadingId.value = item.idAprobacion
  try {
    const decision = decisions.value[item.idAprobacion]
    const montoAprobado = getApprovedMonto(item)
    const split = getApprovedBaseSplit(item)
    await cajaChicaApi.post(`/Aprobaciones/${item.idAprobacion}/aprobar`, {
      MontoAprobado: montoAprobado,
      TipoBase: split.tipoBase,
      MontoBase0: split.montoBase0,
      MontoBase15: split.montoBase15,
      Observacion: decision?.observacion || ''
    })
    actionSuccess.value = 'Aprobacion registrada.'
    closeDetalle()
    await loadPendientes()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    actionError.value = message || 'No se pudo aprobar la solicitud.'
  } finally {
    actionLoadingId.value = null
  }
}

const reject = async (item: AprobacionItem) => {
  const decision = decisions.value[item.idAprobacion]
  const observacion = (decision?.observacion || '').trim()
  if (!observacion) {
    rejectValidationError.value = 'El comentario es obligatorio para negar una solicitud.'
    return
  }

  actionError.value = ''
  actionSuccess.value = ''
  rejectValidationError.value = ''
  actionLoadingId.value = item.idAprobacion
  try {
    const montoAprobado = getApprovedMonto(item)
    const split = getApprovedBaseSplit(item)
    await cajaChicaApi.post(`/Aprobaciones/${item.idAprobacion}/rechazar`, {
      MontoAprobado: montoAprobado,
      TipoBase: split.tipoBase,
      MontoBase0: split.montoBase0,
      MontoBase15: split.montoBase15,
      Observacion: observacion,
      TipoAccion: tipoAccionRechazo.value
    })
    actionSuccess.value = 'Aprobacion rechazada.'
    closeDetalle()
    await loadPendientes()
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.response?.data
    actionError.value = message || 'No se pudo rechazar la solicitud.'
  } finally {
    actionLoadingId.value = null
  }
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => (value ? value.substring(0, 10) : '')

const downloadPdf = () => {
  const groups = groupedPendientes.value
  if (groups.length === 0) return
  const esc = (s: string | number | undefined | null) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fmt = (v: string) => v ? v.substring(0, 10) : '-'
  const fmtAmt = (v: number | string) => {
    const n = Number(v)
    return !Number.isNaN(n) ? n.toFixed(2) : '0.00'
  }

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;padding:20px}
    .liquidacion{border:1px solid #d1d5db;border-radius:6px;margin-bottom:28px;overflow:hidden;page-break-inside:avoid}
    .cabecera{background:#7c3aed;color:#fff;padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
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
    .novedad{color:#d97706;font-weight:600}
    .no-novedad{color:#9ca3af}
    .no-data{padding:10px 14px;font-size:10px;color:#9ca3af;font-style:italic}
    .sup-decisions{font-size:9px;color:#6b7280;margin-top:2px}
    .footer-bar{background:#f9fafb;padding:8px 14px;display:flex;justify-content:flex-end;gap:24px;border-top:1px solid #e5e7eb}
    .footer-bar span{font-size:10px;color:#6b7280}
    .footer-bar strong{font-size:11px;color:#111}
    @media print{body{padding:8mm}@page{size:A4;margin:10mm}.liquidacion{margin-bottom:16px}}
  `

  let sectionsHtml = ''

  groups.forEach(group => {
    const totalInicial = group.items.reduce((a, i) => a + i.total, 0)
    const totalFinal = group.items.reduce((a, i) => {
      const monto = decisions.value[i.idAprobacion]?.montoAprobado
      return a + (monto !== undefined ? Number(monto) : i.total)
    }, 0)
    const conNovedad = group.items.filter(i => hasSupervisorNovedad(i)).length

    const filas = group.items.map(item => {
      const d = detallesByLiquidacion.value[group.idLiquidacion]?.find(det => det.idDetalle === item.idDetalle)
      const montoFinal = decisions.value[item.idAprobacion]?.montoAprobado ?? fmtAmt(item.total)
      const novedad = hasSupervisorNovedad(item)
      const supDecisions = getSupervisorDecisions(item.idDetalle)
      const supHtml = supDecisions.length
        ? supDecisions.map(sd => `${getUserLabel(sd.idUsuario)}: ${esc(sd.estado)} $${fmtAmt(sd.montoAprobado)}${sd.observacion ? ' — ' + esc(sd.observacion) : ''}`).join('<br>')
        : '-'
      return `<tr>
        <td>${esc(item.idAprobacion)}</td>
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
        <td class="amount">${fmtAmt(montoFinal)}</td>
        <td class="${novedad ? 'novedad' : 'no-novedad'}">${novedad ? 'Sí' : 'No'}</td>
        <td class="amount">${esc(item.nivelAprobacion)}</td>
        <td><div class="sup-decisions">${supHtml}</div></td>
      </tr>`
    }).join('')

    sectionsHtml += `
      <div class="liquidacion">
        <div class="cabecera">
          <div>
            <div class="sub">Aprobaciones contabilidad — Liquidación de caja chica</div>
            <h2>Liquidación #${esc(group.idLiquidacion)}</h2>
            <div class="stats">
              <span class="stat">Ítems: <strong>${group.totalItems}</strong></span>
              <span class="stat">Con novedad: <strong>${conNovedad}</strong></span>
              <span class="stat">Total inicial: <strong>$${fmtAmt(totalInicial)}</strong></span>
              <span class="stat">Total final: <strong>$${fmtAmt(totalFinal)}</strong></span>
            </div>
          </div>
        </div>
        <div class="meta">
          <div class="meta-item"><div class="meta-label">Almacén / Tienda</div><div class="meta-value">${esc(group.codAlmacen || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Custodio</div><div class="meta-value">${esc(group.nombreCustodio || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Cédula custodio</div><div class="meta-value">${esc(group.cedulaCustodio || '-')}</div></div>
          <div class="meta-item"><div class="meta-label">Fecha creación</div><div class="meta-value">${fmt(group.fechaCreacion)}</div></div>
          <div class="meta-item"><div class="meta-label">Nivel aprobación</div><div class="meta-value">Contabilidad (Niv. 2)</div></div>
        </div>
        <div class="section-title">Ítems pendientes de aprobación</div>
        <table><thead><tr>
          <th>Aprobación</th><th>Gasto</th><th>Concepto</th><th>Proveedor</th><th>RUC</th><th>Comprobante</th><th>F. Consumo</th>
          <th>Base 15%</th><th>Base 0%</th><th>IVA</th><th>Total</th><th>Monto final</th><th>Novedad</th><th>Nivel</th><th>Supervisores</th>
        </tr></thead><tbody>${filas}</tbody></table>
        <div class="footer-bar">
          <span>Total inicial&nbsp;<strong>$${fmtAmt(totalInicial)}</strong></span>
          <span>Total final&nbsp;<strong>$${fmtAmt(totalFinal)}</strong></span>
        </div>
      </div>`
  })

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Aprobaciones Contabilidad</title><style>${CSS}</style></head><body>
    <div style="margin-bottom:16px;border-bottom:2px solid #7c3aed;padding-bottom:8px;display:flex;justify-content:space-between;align-items:flex-end">
      <div><div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Reporte</div><div style="font-size:16px;font-weight:700;color:#7c3aed">Aprobaciones Contabilidad</div></div>
      <div style="text-align:right;font-size:10px;color:#6b7280">Generado: ${new Date().toLocaleString('es-ES')}<br>${groups.length} liquidación(es) pendientes</div>
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
  loadPendientes()
  loadUsuarios()
})
</script>
