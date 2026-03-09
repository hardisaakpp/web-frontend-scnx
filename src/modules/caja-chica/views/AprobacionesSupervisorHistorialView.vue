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
              @click="loadHistorial"
            >
              Refrescar
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="historial.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones o rechazos registrados.
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
                  {{ group.items.length }} detalles · Monto total: {{ formatAmount(group.totalMonto) }}
                </p>
              </div>
              <button
                type="button"
                class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600/50 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                @click="toggleGroup(group.idLiquidacion)"
              >
                {{ isGroupOpen(group.idLiquidacion) ? 'Ocultar' : 'Ver' }}
              </button>
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

        <div v-if="!loading && historial.length > 0" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Total registros</div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ historial.length }}</div>
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
              Liquidación#{{ selectedItem?.idLiquidacion || '-' }} · Detalle #{{ selectedItem?.idDetalle || '-' }}
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
  { key: 'detalle', label: 'Detalle', fixed: false },
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

const defaultVisibleColumns = ['detalle', 'gasto', 'total', 'montoAprobado', 'estado', 'fechaAprobacion', 'acciones']
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
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
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
  historial.value.filter(item => item.estado === 'APROBADO').length
)

const rechazadasCount = computed(() =>
  historial.value.filter(item => item.estado === 'RECHAZADO').length
)

const totalMontoAprobado = computed(() =>
  historial.value.reduce((acc, item) => acc + item.montoAprobado, 0)
)

const groupedHistorial = computed(() => {
  const groups = new Map<number, HistorialItem[]>()
  historial.value.forEach(item => {
    if (!groups.has(item.idLiquidacion)) {
      groups.set(item.idLiquidacion, [])
    }
    groups.get(item.idLiquidacion)?.push(item)
  })

  return Array.from(groups.entries()).map(([idLiquidacion, items]) => {
    const totalMonto = items.reduce((acc, item) => acc + item.montoAprobado, 0)
    return {
      idLiquidacion,
      items,
      totalMonto
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

    const [aprobacionesRes, detallesRes] = await Promise.all([
      cajaChicaApi.get('/Aprobaciones'),
      cajaChicaApi.get('/LiquidacionesDetalle')
    ])

    const aprobacionesPayload = aprobacionesRes.data as any
    const detallesPayload = detallesRes.data as any

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

    historial.value = aprobaciones.map((aprobacion: AprobacionItem) => {
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
    }).sort((a, b) => {
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

onMounted(() => {
  loadHistorial()
})
</script>
