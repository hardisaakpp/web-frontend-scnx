<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { APP_LOCALE } from '@/plugins/locale'
import EstadosPlantilla from './EstadosPlantilla.vue'
import type { SolicitudDetalle } from '../types'
import CargandoSpinner from './CargandoSpinner.vue';

defineProps<{ abierto: boolean; detalle: SolicitudDetalle | null; cargando: boolean }>()
const emit = defineEmits<{ cerrar: [] }>()

const formatFecha = (iso: string) => (iso ? new Date(iso).toLocaleDateString(APP_LOCALE) : '')
const mostrarGuia = (g: string | null) => (g && g.trim() ? g : '—')
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('cerrar')"></div>

    <div class="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Solicitud <span v-if="detalle">#{{ detalle.id }}</span>
          </h2>
          <EstadosPlantilla v-if="detalle" :estado="detalle.estado" />
        </div>
        <button type="button" @click="emit('cerrar')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="overflow-y-auto p-6 space-y-6">
        <CargandoSpinner v-if="cargando" mensaje="Cargando detalle…" />

        <template v-else-if="detalle">
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt class="text-xs text-gray-500 dark:text-gray-400">Responsable</dt><dd class="text-gray-900 dark:text-white">{{ detalle.usuarioSolicitante }}</dd></div>
            <div><dt class="text-xs text-gray-500 dark:text-gray-400">Fecha</dt><dd class="text-gray-900 dark:text-white">{{ formatFecha(detalle.fechaSolicitud) }}</dd></div>
            <div><dt class="text-xs text-gray-500 dark:text-gray-400">Origen</dt><dd class="text-gray-900 dark:text-white">{{ detalle.tiendaOrigen }}</dd></div>
            <div><dt class="text-xs text-gray-500 dark:text-gray-400">Destino</dt><dd class="text-gray-900 dark:text-white">{{ detalle.tiendaDestino }}</dd></div>
            <div><dt class="text-xs text-gray-500 dark:text-gray-400">Guía</dt><dd class="text-gray-900 dark:text-white">{{ mostrarGuia(detalle.guiaEnvio) }}</dd></div>
            <div><dt class="text-xs text-gray-500 dark:text-gray-400">Justificación</dt><dd class="text-gray-900 dark:text-white">{{ detalle.justificacion || '—' }}</dd></div>
          </dl>

          <div v-if="detalle.comentarioSap || detalle.sapDraftDocEntry || detalle.sapTransferDocNum" class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Información SAP</h3>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div v-if="detalle.comentarioSap" class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Comentario SAP</dt>
                <dd class="text-gray-900 dark:text-white">{{ detalle.comentarioSap }}</dd>
              </div>
              <div v-if="detalle.sapTransferDocNum">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Doc. Transferencia</dt>
                <dd class="text-gray-900 dark:text-white">{{ detalle.sapTransferDocNum }}</dd>
              </div>
              <div v-else-if="detalle.sapDraftDocEntry">
                <dt class="text-xs text-gray-500 dark:text-gray-400">Doc. Borrador</dt>
                <dd class="text-gray-900 dark:text-white">{{ detalle.sapDraftDocEntry }}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Productos</h3>
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="overflow-x-auto overflow-y-auto max-h-[40vh]">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código de Barras</th>
                      <th class="sticky top-0 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    <tr v-for="p in detalle.productos" :key="p.itemCode">
                      <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ p.itemCode }}</td>
                      <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ p.itemName }}</td>
                      <td class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{{ p.codeBars }}</td>
                      <td class="px-4 py-2 text-sm text-center text-gray-600 dark:text-gray-300">{{ p.cantidadSolicitada }}</td>
                    </tr>
                    <tr v-if="detalle.productos.length === 0">
                      <td colspan="4" class="px-4 py-6 text-center text-sm text-gray-400">Sin productos.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
