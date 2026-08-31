<script setup lang="ts">
import { XMarkIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { APP_LOCALE } from '@/plugins/locale'

import EstadoRecepcionBadge from './EstadoRecepcionBadge.vue'
import CargandoSpinner from './CargandoSpinner.vue'
import { ESTADOS_RECEPCION_TERMINALES, type TransitoriaDetalle } from '../types'

const props = defineProps<{
    abierto: boolean
    detalle: TransitoriaDetalle | null
    cargando: boolean
    sincronizando?: boolean
    error?: string
}>()

const emit = defineEmits<{ cerrar: []; sincronizar: [id: number] }>()

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
/** null ≠ 0: null significa que nunca se sincronizó con SAP. */
const mostrarNumero = (n: number | null) => (n === null || n === undefined ? '—' : String(n))

const puedeSincronizar = (estado?: string) =>
    !!estado && !ESTADOS_RECEPCION_TERMINALES.includes(estado as any)
</script>

<template>
    <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('cerrar')"></div>

        <div
            class="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                        Transitoria
                        <span v-if="detalle?.sapTransferDocNum">#{{ detalle.sapTransferDocNum }}</span>
                    </h2>
                    <EstadoRecepcionBadge v-if="detalle" :estado="detalle.estadoRecepcion" />
                </div>

                <div class="flex items-center gap-2">
                    <button v-if="detalle && puedeSincronizar(detalle.estadoRecepcion)" type="button"
                        @click="emit('sincronizar', detalle.id)" :disabled="sincronizando"
                        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-600 dark:border-indigo-500 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                        <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': sincronizando }" />
                        {{ sincronizando ? 'Actualizando…' : 'Actualizar estado' }}
                    </button>
                    <button type="button" @click="emit('cerrar')"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div class="overflow-y-auto p-6 space-y-6">
                <CargandoSpinner v-if="cargando" mensaje="Cargando detalle…" />

                <template v-else-if="detalle">
                    <p v-if="error"
                        class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                        {{ error }}
                    </p>

                    <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Origen</dt>
                            <dd class="text-gray-900 dark:text-white">{{ detalle.tiendaOrigen }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Destino (Tránsito)</dt>
                            <dd class="text-gray-900 dark:text-white">{{ detalle.tiendaDestinoCodigo }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Guía Courier</dt>
                            <dd class="text-gray-900 dark:text-white">{{ mostrarTexto(detalle.guiaEnvio) }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">DocNum</dt>
                            <dd class="text-gray-900 dark:text-white">{{ mostrarTexto(detalle.sapTransferDocNum) }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">DocEntry</dt>
                            <dd class="text-gray-900 dark:text-white">{{ mostrarTexto(detalle.sapTransferDocEntry) }}
                            </dd>
                        </div>
                        <div>
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Fecha de Envío</dt>
                            <dd class="text-gray-900 dark:text-white">{{ formatFechaHora(detalle.fechaEnvioSap) }}</dd>
                        </div>
                        <div v-if="detalle.fechaUltimaSincronizacion" class="sm:col-span-3">
                            <dt class="text-xs text-gray-500 dark:text-gray-400">Última actualización</dt>
                            <dd class="text-gray-900 dark:text-white">
                                {{ formatFechaHora(detalle.fechaUltimaSincronizacion) }}
                            </dd>
                        </div>
                    </dl>

                    <div>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Productos</h3>
                        <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div class="overflow-x-auto overflow-y-auto max-h-[40vh]">
                                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead>
                                        <tr>
                                            <th
                                                class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Artículo</th>
                                            <th
                                                class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Enviado</th>
                                            <th
                                                class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Recibido</th>
                                            <th
                                                class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Pendiente</th>
                                        </tr>
                                    </thead>
                                    <tbody
                                        class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                        <!-- Las líneas con saldo se resaltan para ubicarlas de inmediato -->
                                        <tr v-for="l in detalle.lineas" :key="l.itemCode"
                                            :class="(l.cantidadPendiente ?? 0) > 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''">
                                            <td class="px-4 py-2">
                                                <div class="text-xs font-semibold text-gray-900 dark:text-white">
                                                    {{ l.itemCode }}
                                                </div>
                                                <div class="text-[11px] text-gray-500 dark:text-gray-400">
                                                    {{ l.codeBars }}
                                                </div>
                                                <div class="text-[11px] text-gray-400 dark:text-gray-500">
                                                    {{ l.itemName || '—' }}
                                                </div>
                                            </td>
                                            <td class="px-4 py-2 text-xs text-center text-gray-600 dark:text-gray-300">
                                                {{ l.cantidadSolicitada }}
                                            </td>
                                            <td class="px-4 py-2 text-xs text-center"
                                                :class="l.cantidadRecibida === null ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'">
                                                {{ mostrarNumero(l.cantidadRecibida) }}
                                            </td>
                                            <td class="px-4 py-2 text-xs text-center font-semibold" :class="l.cantidadPendiente === null
                                                ? 'text-gray-400'
                                                : l.cantidadPendiente > 0
                                                    ? 'text-amber-600 dark:text-amber-400'
                                                    : 'text-emerald-600 dark:text-emerald-400'">
                                                {{ mostrarNumero(l.cantidadPendiente) }}
                                            </td>
                                        </tr>
                                        <tr v-if="detalle.lineas.length === 0">
                                            <td colspan="4" class="px-4 py-6 text-center text-xs text-gray-400">
                                                Sin productos.
                                            </td>
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
