<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { APP_LOCALE } from '@/plugins/locale'
import type { HistoryRow, ReceptionLine } from '../types'

defineProps<{
  open: boolean
  row: HistoryRow | null
}>()

const emit = defineEmits<{
  close: []
}>()

// Same UTC-safe parsing as TransferDetailView.vue's formatDateTime/parseUtc — backend datetime2
// columns arrive without a trailing 'Z', so a naive `new Date()` would parse them as local time.
function parseUtc(dateStr: string): Date {
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(dateStr) ? dateStr : `${dateStr}Z`)
}

function formatDateTime(dateStr: string): string {
  return parseUtc(dateStr).toLocaleDateString(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function lineDiferencia(line: ReceptionLine): number {
  return line.quantity - line.scanned
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open && row" data-testid="history-detail-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

      <div class="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Transferencia {{ row.documentNumber }}
          </h2>
          <button
            type="button"
            data-testid="history-detail-modal-close-btn"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            @click="emit('close')"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="overflow-y-auto p-6 space-y-6">
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Origen</dt>
              <dd class="text-gray-900 dark:text-white">{{ row.originWarehouseCode ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Destino</dt>
              <dd class="text-gray-900 dark:text-white">{{ row.transitWarehouseCode ?? row.destinationWarehouseCode ?? row.warehouseCode }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Fecha</dt>
              <dd class="text-gray-900 dark:text-white">{{ formatDateTime(row.materializedAtUtc) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Responsable</dt>
              <dd class="text-gray-900 dark:text-white">{{ row.responsibleName || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Guía courier</dt>
              <dd class="text-gray-900 dark:text-white">{{ row.courierWaybillNumber || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">DocNum SAP</dt>
              <dd class="text-gray-900 dark:text-white">{{ row.sapStockTransferDocNum ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-500 dark:text-gray-400">Ticket GLPI</dt>
              <dd class="text-gray-900 dark:text-white">{{ row.glpiTicket || 'Sin ticket' }}</dd>
            </div>
          </dl>

          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Productos</h3>
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="overflow-x-auto overflow-y-auto max-h-[30vh]">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Código de barras
                      </th>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Artículo
                      </th>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Escaneados
                      </th>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Diferencia
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    <tr v-for="line in row.lines ?? []" :key="line.lineId">
                      <td class="px-4 py-2 text-xs text-gray-600 dark:text-gray-300">{{ line.barcode || 'Sin código de barras' }}</td>
                      <td class="px-4 py-2 text-xs text-gray-600 dark:text-gray-300">{{ line.itemCode }} - {{ line.itemName }}</td>
                      <td class="px-4 py-2 text-xs text-center text-gray-600 dark:text-gray-300">{{ line.quantity }}</td>
                      <td class="px-4 py-2 text-xs text-center text-gray-600 dark:text-gray-300">{{ line.scanned }}</td>
                      <td
                        class="px-4 py-2 text-xs text-center"
                        :class="lineDiferencia(line) !== 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-600 dark:text-gray-300'"
                      >
                        {{ lineDiferencia(line) }}
                      </td>
                    </tr>
                    <tr v-if="(row.lines ?? []).length === 0">
                      <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-400">Sin líneas.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
