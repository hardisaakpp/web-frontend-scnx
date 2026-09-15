<script setup lang="ts">
import { XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { APP_LOCALE } from '@/plugins/locale'

import EstadosPlantilla from './EstadosPlantilla.vue'
import CargandoSpinner from './CargandoSpinner.vue'
import type { ErrorSap, TransitoriaReverso } from '../types'

const props = defineProps<{
    abierto: boolean
    reverso: TransitoriaReverso | null
    cargando: boolean
    erroresSap: ErrorSap[]
    cargandoErroresSap: boolean
    reintentando: boolean
}>()

const emit = defineEmits<{ cerrar: []; reintentar: [] }>()

function formatFechaHora(iso: string | null) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleString(APP_LOCALE, {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
        })
    } catch { return iso }
}

const mostrarTexto = (t: string | number | null) => (t !== null && t !== '' ? String(t) : '—')
</script>

<template>
    <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('cerrar')"></div>

        <div
            class="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                        {{ reverso?.estado === 'ErrorEnvioSap' ? 'Error en Regularización' : 'Detalle de Regularización'
                        }}
                        <span v-if="reverso?.baseDocumento"
                            class="text-sm font-normal text-gray-500 dark:text-gray-400">
                            · DocNum Base: {{ reverso.baseDocumento }}
                        </span>
                    </h2>
                    <EstadosPlantilla v-if="reverso" :estado="reverso.estado" />
                </div>
                <button type="button" @click="emit('cerrar')"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>

            <div class="overflow-y-auto p-6 space-y-6">
                <CargandoSpinner v-if="cargando" mensaje="Cargando regularización…" />

                <template v-else-if="reverso">
                    <!-- Bloque de error SAP: solo si el reverso falló al enviarse -->
                    <div v-if="reverso.estado === 'ErrorEnvioSap'"
                        class="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 p-4">
                        <div class="flex items-center gap-2 mb-3">
                            <ExclamationTriangleIcon class="w-5 h-5 text-rose-500" />
                            <h3 class="text-sm font-semibold text-rose-700 dark:text-rose-400">Error al enviar a SAP
                            </h3>
                        </div>

                        <CargandoSpinner v-if="cargandoErroresSap" mensaje="Cargando errores…" />
                        <div v-else-if="erroresSap.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
                            No hay detalles de error registrados.
                        </div>
                        <div v-else
                            class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th
                                            class="bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            Fecha</th>
                                        <th
                                            class="bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            Operación</th>
                                        <th
                                            class="bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            Mensaje</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr v-for="(e, i) in erroresSap" :key="i">
                                        <td
                                            class="px-3 py-2 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {{ formatFechaHora(e.fecha) }}</td>
                                        <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{{ e.operacion }}
                                        </td>
                                        <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{{ e.mensaje }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <button type="button" @click="emit('reintentar')" :disabled="reintentando"
                            class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                            <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': reintentando }" />
                            {{ reintentando ? 'Reintentando…' : 'Reintentar Envío a SAP' }}
                        </button>
                    </div>

                    <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Origen (Tránsito)</dt>
                            <dd class="text-gray-900 dark:text-white">{{ reverso.tiendaOrigen }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Destino (Real)</dt>
                            <dd class="text-gray-900 dark:text-white">{{ reverso.tiendaDestinoCodigo }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">DocNum Regularización</dt>
                            <dd class="text-gray-900 dark:text-white">{{ mostrarTexto(reverso.sapTransferDocNum) }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">DocEntry Regularización</dt>
                            <dd class="text-gray-900 dark:text-white">{{ mostrarTexto(reverso.sapTransferDocEntry) }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Fecha de Envio a Sap</dt>
                            <dd class="text-gray-900 dark:text-white">{{ formatFechaHora(reverso.fechaEnvioSap) }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Realizado por</dt>
                            <dd class="text-gray-900 dark:text-white">{{ reverso.usuarioSolicitante }}</dd>
                        </div>
                        <div class="sm:col-span-3">
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Justificación</dt>
                            <dd class="text-gray-900 dark:text-white">{{ reverso.justificacion }}</dd>
                        </div>
                    </dl>

                    <div>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Productos regularizados
                        </h3>
                        <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div class="overflow-x-auto overflow-y-auto max-h-[30vh]">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead>
                                        <tr>
                                            <th
                                                class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Artículo</th>
                                            <th
                                                class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody
                                        class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                        <tr v-for="l in reverso.lineas" :key="l.itemCode">
                                            <td class="px-4 py-2">
                                                <div class="text-xs font-semibold text-gray-900 dark:text-white">{{
                                                    l.itemCode }}</div>
                                                <div class="text-[11px] text-gray-500 dark:text-gray-400">{{ l.codeBars
                                                    }}</div>
                                                <div class="text-[11px] text-gray-400 dark:text-gray-500">{{ l.itemName
                                                    || '—' }}</div>
                                            </td>
                                            <td class="px-4 py-2 text-xs text-center text-gray-600 dark:text-gray-300">
                                                {{ l.cantidadSolicitada }}</td>
                                        </tr>
                                        <tr v-if="reverso.lineas.length === 0">
                                            <td colspan="2" class="px-4 py-6 text-center text-xs text-gray-400">Sin
                                                productos.</td>
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
