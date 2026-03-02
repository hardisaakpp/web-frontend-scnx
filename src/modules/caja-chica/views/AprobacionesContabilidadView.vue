<template>
  <div class="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Aprobaciones contabilidad</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Revisar novedades de supervisores y aprobar el valor final</p>
        </div>
        <router-link
          class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-sm px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          to="/caja-chica"
        >
          Volver
        </router-link>
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
                  {{ group.totalItems }} detalles pendientes · Tienda: {{ group.codAlmacen }} · Custodio: {{ group.nombreCustodio }} · Fecha: {{ formatDate(group.fechaCreacion) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <router-link
                  class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600/50 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  :to="`/caja-chica/liquidaciones/${group.idLiquidacion}/detalle`"
                >
                  Ver liquidación
                </router-link>
                <div class="text-xs text-gray-500 dark:text-gray-400">Total: {{ formatAmount(group.totalMonto) }}</div>
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
              Liquidación #{{ selectedItem?.idLiquidacion || '-' }} · Detalle #{{ selectedItem?.idDetalle || '-' }} · Nivel {{ selectedItem?.nivelAprobacion ?? '-' }}
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
                <dt class="text-xs text-gray-500 dark:text-gray-400">Total</dt>
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
                    <span class="text-gray-900 dark:text-white">{{ getUserLabel(decision.idUsuario) }}</span>
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
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Monto final</label>
                <input
                  v-if="selectedItem"
                  v-model="decisions[selectedItem.idAprobacion].montoAprobado"
                  type="number"
                  step="0.01"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nivel</label>
                <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white">
                  {{ selectedItem?.nivelAprobacion ?? '-' }}
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
            <div class="mt-4 flex items-center justify-end gap-2">
              <button
                v-if="selectedItem"
                type="button"
                class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                :disabled="actionLoadingId === selectedItem.idAprobacion"
                @click="reject(selectedItem)"
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
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import axios from 'axios'
import api from '@/services/api'
import { useTablePreferences } from '@/composables/useTablePreferences'

interface ColumnConfig {
  key: string
  label: string
  fixed: boolean
}

interface AprobacionItem {
  idAprobacion: number
  idDetalle: number
  idLiquidacion: number
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
  nombreGasto: string
  concepto: string
  total: number
  nivelAprobacion: number
  estado: string
}

interface DetalleItem {
  idDetalle: number
  fechaConsumo: string
  ruc: string
  nombreProveedor: string
  numeroComprobante: string
  tipoDocumento: string
  concepto: string
  subtotalConIva: number
  subtotalSinIva: number
  iva: number
}

interface SupervisorDecision {
  montoAprobado: number
  observacion: string
  estado: string
  fechaAprobacion?: string
  idUsuario?: string
}

interface UserOption {
  id: string
  label: string
}

interface AdjuntoItem {
  idAdjunto: number
  idDetalle: number
  rutaArchivo: string
  fechaSubida: string
}

interface DecisionState {
  montoAprobado: string
  observacion: string
}

const loading = ref(false)
const error = ref('')
const actionError = ref('')
const actionSuccess = ref('')
const actionLoadingId = ref<number | null>(null)
const pendientes = ref<AprobacionItem[]>([])
const decisions = ref<Record<number, DecisionState>>({})
const openGroups = ref<Record<number, boolean>>({})
const supervisorByDetalle = ref<Record<number, SupervisorDecision[]>>({})
const detallesByLiquidacion = ref<Record<number, DetalleItem[]>>({})
const adjuntosByDetalle = ref<Record<number, number>>({})
const usuarios = ref<UserOption[]>([])
const usuariosById = ref<Record<string, UserOption>>({})

const availableColumns: ColumnConfig[] = [
  { key: 'id', label: 'Id', fixed: false },
  { key: 'detalle', label: 'Detalle', fixed: false },
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
  { key: 'total', label: 'Total', fixed: false },
  { key: 'usuario', label: 'Supervisor', fixed: false },
  { key: 'montoSupervisor', label: 'Monto supervisor', fixed: false },
  { key: 'obsSupervisor', label: 'Obs. supervisor', fixed: false },
  { key: 'novedad', label: 'Novedad', fixed: false },
  { key: 'montoFinal', label: 'Monto final', fixed: true },
  { key: 'nivel', label: 'Nivel', fixed: true },
  { key: 'comentario', label: 'Comentario', fixed: true },
  { key: 'acciones', label: 'Acciones', fixed: true }
]

const defaultVisibleColumns = ['id', 'gasto', 'total', 'novedad', 'montoFinal', 'nivel', 'comentario', 'acciones']
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns: orderedVisibleColumnKeys,
  savePreferences
} = useTablePreferences({
  tableId: 'caja-chica-aprobaciones-contabilidad',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

const orderedVisibleColumns = computed(() => {
  const ordered = orderedVisibleColumnKeys.value
    .map(key => availableColumns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined)
  const nonFixedColumns = ordered.filter(col => !col.fixed)
  const allFixedColumns = availableColumns.filter(col => col.fixed)
  return [...nonFixedColumns, ...allFixedColumns]
})

const tableColumns = orderedVisibleColumns

const showColumnSelector = ref(false)
const columnSelectorWrapRef = ref<HTMLElement | null>(null)

const showDetallePanel = ref(false)
const selectedContext = ref<{ idLiquidacion: number; item: AprobacionItem } | null>(null)
const selectedItem = computed(() => selectedContext.value?.item ?? null)
const selectedDetalle = computed(() => {
  if (!selectedContext.value) return undefined
  const { idLiquidacion, item } = selectedContext.value
  return detallesByLiquidacion.value[idLiquidacion]?.find(d => d.idDetalle === item.idDetalle)
})

const adjuntosListByDetalle = ref<Record<number, AdjuntoItem[]>>({})
const loadingAdjuntosMap = ref<Record<number, boolean>>({})
const selectedAdjuntoId = ref<number | null>(null)
const selectedAdjunto = computed(() => {
  if (!selectedItem.value) return null
  const detalleId = selectedItem.value.idDetalle
  const list = adjuntosListByDetalle.value[detalleId] || []
  if (!list.length) return null
  const found = list.find(a => a.idAdjunto === selectedAdjuntoId.value)
  return found || list[0]
})

const showAdjuntoFull = ref(false)

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
  const visibleNonFixed = current.filter(key => !availableColumns.find(c => c.key === key)?.fixed)
  if (index > -1 && visibleNonFixed.length <= 1) return
  if (index > -1) {
    visibleColumns.value = current.filter(k => k !== columnKey)
  } else {
    visibleColumns.value = [...current, columnKey]
  }
  savePreferences()
}

const draggedColumnKey = ref<string | null>(null)
const dragOverColumnKey = ref<string | null>(null)

function handleDragStart(event: DragEvent, columnKey: string) {
  const column = availableColumns.find(col => col.key === columnKey)
  if (column?.fixed) return
  draggedColumnKey.value = columnKey
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', columnKey)
  }
}

function handleDragOver(event: DragEvent, columnKey: string) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  if (draggedColumnKey.value !== null && draggedColumnKey.value !== columnKey) {
    const target = availableColumns.find(col => col.key === columnKey)
    if (!target?.fixed) dragOverColumnKey.value = columnKey
  } else {
    dragOverColumnKey.value = null
  }
}

function handleDragLeave() {}

function handleDrop(event: DragEvent, targetColumnKey: string) {
  event.preventDefault()
  if (!draggedColumnKey.value || draggedColumnKey.value === targetColumnKey) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  const draggedColumn = availableColumns.find(col => col.key === draggedColumnKey.value)
  const targetColumn = availableColumns.find(col => col.key === targetColumnKey)
  if (draggedColumn?.fixed || targetColumn?.fixed) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  const fullOrder = [...columnOrder.value]
  const draggedIndexInFull = fullOrder.indexOf(draggedColumnKey.value)
  const targetIndexInFull = fullOrder.indexOf(targetColumnKey)
  if (draggedIndexInFull === -1 || targetIndexInFull === -1) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  fullOrder.splice(draggedIndexInFull, 1)
  const adjustedTarget = targetIndexInFull > draggedIndexInFull ? targetIndexInFull - 1 : targetIndexInFull
  fullOrder.splice(adjustedTarget, 0, draggedColumnKey.value)
  columnOrder.value = fullOrder
  savePreferences()
  draggedColumnKey.value = null
  dragOverColumnKey.value = null
}

function handleDragEnd() {
  draggedColumnKey.value = null
  dragOverColumnKey.value = null
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
      return d != null ? formatAmount(d.subtotalConIva) : '-'
    case 'subtotalSinIva':
      return d != null ? formatAmount(d.subtotalSinIva) : '-'
    case 'iva':
      return d != null ? formatAmount(d.iva) : '-'
    case 'total':
      return formatAmount(item.total)
    case 'usuario':
      return list.length ? list.map(dec => getUserLabel(dec.idUsuario)).join(', ') : '-'
    case 'montoSupervisor':
      return list.length ? list.map(dec => formatAmount(dec.montoAprobado)).join(', ') : '-'
    case 'obsSupervisor':
      return list.length ? list.map(dec => dec.observacion || '-').join(', ') : '-'
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
    const base = items[0]
    return {
      idLiquidacion,
      items,
      totalMonto,
      totalItems: items.length,
      codAlmacen: base?.codAlmacen || '',
      nombreCustodio: base?.nombreCustodio || '',
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

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
})

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const apiBaseUrl = (import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '')
const fileBaseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl

const buildAdjuntoUrl = (ruta: string) => {
  if (!ruta) return '#'
  if (ruta.startsWith('http')) return ruta
  if (ruta.startsWith('/uploads')) return ruta
  return `${fileBaseUrl}${ruta}`
}

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
  if (!id) return '-'
  const user = usuariosById.value[id]
  return user?.label || id || '-'
}

const normalizeDetalle = (item: any): DetalleItem => ({
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  fechaConsumo: String(item.fechaConsumo ?? item.FechaConsumo ?? ''),
  ruc: normalizeString(item.ruc ?? item.Ruc ?? ''),
  nombreProveedor: normalizeString(item.nombreProveedor ?? item.NombreProveedor ?? ''),
  numeroComprobante: normalizeString(item.numeroComprobante ?? item.NumeroComprobante ?? ''),
  tipoDocumento: normalizeString(item.numeroAutorizacion ?? item.NumeroAutorizacion ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  subtotalConIva: Number(item.subtotal_Con_Iva ?? item.Subtotal_Con_Iva ?? item.subtotalConIva ?? 0),
  subtotalSinIva: Number(item.subtotal_Sin_Iva ?? item.Subtotal_Sin_Iva ?? item.subtotalSinIva ?? 0),
  iva: Number(item.iva ?? item.Iva ?? 0)
})

const normalizeAprobacion = (item: any): AprobacionItem => ({
  idAprobacion: Number(item.idAprobacion ?? item.IdAprobacion ?? 0),
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
  nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
  fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? ''),
  nombreGasto: normalizeString(item.nombreGasto ?? item.NombreGasto ?? ''),
  concepto: normalizeString(item.concepto ?? item.Concepto ?? ''),
  total: Number(item.total ?? item.Total ?? 0),
  nivelAprobacion: Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0),
  estado: normalizeString(item.estado ?? item.Estado ?? '')
})

const normalizeSupervisorDecision = (item: any): SupervisorDecision => ({
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  observacion: normalizeString(item.observacion ?? item.Observacion ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  fechaAprobacion: item.fechaAprobacion ?? item.FechaAprobacion,
  idUsuario: item.idUsuario ?? item.IdUsuario
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

function openDetalle(idLiquidacion: number, item: AprobacionItem) {
  ensureDecision(item)
  selectedAdjuntoId.value = null
  selectedContext.value = { idLiquidacion, item }
  showDetallePanel.value = true
  void loadAdjuntosForDetalle(item.idDetalle)
}

function closeDetalle() {
  showDetallePanel.value = false
  selectedContext.value = null
  selectedAdjuntoId.value = null
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
  document.removeEventListener('click', closeColumnSelectorOnClickOutside)
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
        const res = await cajaChicaApi.get(`/Liquidaciones/${idLiq}/detalle`)
        const payloadRes = res.data as any
        const detailItems = Array.isArray(payloadRes) ? payloadRes : Array.isArray(payloadRes?.data) ? payloadRes.data : []
        detallesByLiquidacion.value[idLiq] = detailItems.map(normalizeDetalle)
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
      if (acc[item.idLiquidacion] === undefined) acc[item.idLiquidacion] = true
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
    const monto = Number(decision?.montoAprobado ?? item.total)
    await cajaChicaApi.post(`/Aprobaciones/${item.idAprobacion}/aprobar`, {
      MontoAprobado: Number.isNaN(monto) ? item.total : monto,
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
  actionError.value = ''
  actionSuccess.value = ''
  actionLoadingId.value = item.idAprobacion
  try {
    const decision = decisions.value[item.idAprobacion]
    const monto = Number(decision?.montoAprobado ?? 0)
    await cajaChicaApi.post(`/Aprobaciones/${item.idAprobacion}/rechazar`, {
      MontoAprobado: Number.isNaN(monto) ? 0 : monto,
      Observacion: decision?.observacion || ''
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

onMounted(() => {
  loadPendientes()
  loadUsuarios()
})
</script>
