<script setup lang="ts">
import { APP_LOCALE } from '@/plugins/locale';
import { CampoOrdenTransitoria, ESTADOS_RECEPCION_TERMINALES, TransitoriaResumen } from '../types';
import { ChevronDownIcon, ChevronUpIcon, EyeIcon } from 'lucide-vue-next';
import { ArrowPathIcon, ArrowUturnLeftIcon, ChevronUpDownIcon, InboxIcon } from '@heroicons/vue/24/outline';
import EstadoRecepcionBadge from './EstadoRecepcionBadge.vue';
import CargandoSpinner from './CargandoSpinner.vue';
import { useAuthStore } from '@/stores/auth';
import EstadosPlantilla from './EstadosPlantilla.vue';
const authStore = useAuthStore()
const props = defineProps<{
    transitorias: TransitoriaResumen[]
    cargando: boolean
    ordenarPor?: CampoOrdenTransitoria
    direccion?: 'Asc' | 'Desc'
    sincronizandoId?: number | null
    regularizandoId?: number | null
}>()

const emit = defineEmits<{
    ver: [id: number]
    sincronizar: [id: number]
    ordenar: [campo: CampoOrdenTransitoria]
    regularizar: [id: number]
    verReverso: [id: number]
}>()

const thClass =
    'sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400'
const thOrdenableClass = `${thClass} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`

const esOrdenActivo = (campo: CampoOrdenTransitoria) => props.ordenarPor === campo
const esAscendente = (campo: CampoOrdenTransitoria) => esOrdenActivo(campo) && props.direccion === 'Asc'

function formatFecha(iso: string | null) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleString(APP_LOCALE, {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
        })
    } catch { return iso }
}

/** null ≠ 0: null significa que nunca se sincronizó con SAP. */
const mostrarNumero = (n: number | null) => (n === null || n === undefined ? '—' : String(n))
const mostrarTexto = (t: string | null) => (t?.trim() ? t : '—')

/** Los estados resueltos ya no se vuelven a consultar en SAP. */
const puedeSincronizar = (estado: string) =>
    !ESTADOS_RECEPCION_TERMINALES.includes(estado as any)
const puedeRegularizar = authStore.hasPermission('transferenciadirecta.transitorias.regularizar')

//diasconfigurador: null = falta configurar, no "en plazo"
const tooltipRegularizar = (t: TransitoriaResumen) => {
    if (!t.diasConfigurados) return 'Falta configurar los días de transitoria de esta bodega'
    if (!t.plazoVencido) return `Faltan ${t.diasConfigurados - t.diasTranscurridos} día(s) para regularizar`
    return 'Regularizar Transitoria'
}
</script>

<template>
    <div class="overflow-x-auto overflow-y-auto max-h-[60vh]">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
                <tr>
                    <th :class="thClass">DocNum SAP</th>
                    <th :class="thClass">Guía Courier</th>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'TiendaOrigen')">
                        <span class="inline-flex items-center gap-1">
                            Tienda Origen
                            <ChevronUpIcon v-if="esAscendente('TiendaOrigen')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('TiendaOrigen')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'TiendaDestino')">
                        <span class="inline-flex items-center gap-1">
                            Tienda Destino(Tránsito)
                            <ChevronUpIcon v-if="esAscendente('TiendaDestino')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('TiendaDestino')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'FechaEnvioSap')">
                        <span class="inline-flex items-center gap-1">
                            Fecha Envío SAP
                            <ChevronUpIcon v-if="esAscendente('FechaEnvioSap')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('FechaEnvioSap')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="[thClass, 'text-center']">Unidades Enviadas</th>
                    <th :class="[thClass, 'text-center']">Unidades Recibidas</th>
                    <th :class="thOrdenableClass + ' text-center'" @click="emit('ordenar', 'TotalPendiente')">
                        <span class="inline-flex items-center gap-1">
                            Pendiente
                            <ChevronUpIcon v-if="esAscendente('TotalPendiente')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('TotalPendiente')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'EstadoRecepcion')">
                        <span class="inline-flex items-center gap-1">
                            Estado
                            <ChevronUpIcon v-if="esAscendente('EstadoRecepcion')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('EstadoRecepcion')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thClass">DocNum Regularización</th>

                    <th :class="[thClass, 'text-right']">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <tr v-if="cargando">
                    <td colspan="12" class="px-4 py-6">
                        <CargandoSpinner mensaje="Cargando transitorias…" />
                    </td>
                </tr>

                <tr v-for="t in transitorias" v-else :key="t.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-4 py-3 text-xs">
                        <span v-if="t.sapTransferDocNum" class="font-medium text-gray-900 dark:text-white">
                            {{ t.sapTransferDocNum }}
                        </span>
                        <span v-else class="text-gray-400">—</span>
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ mostrarTexto(t.guiaEnvio) }}</td>
                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ t.tiendaOrigen }}</td>
                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ t.tiendaDestinoCodigo }}</td>
                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {{ formatFecha(t.fechaEnvioSap) }}
                    </td>
                    <td class="px-4 py-3 text-xs text-center text-gray-600 dark:text-gray-300">
                        {{ t.unidadesEnviadas }}
                    </td>
                    <td class="px-4 py-3 text-xs text-center"
                        :class="t.unidadesRecibidas === null ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'">
                        {{ mostrarNumero(t.unidadesRecibidas) }}
                    </td>
                    <td class="px-4 py-3 text-xs text-center font-semibold" :class="t.totalPendiente === null
                        ? 'text-gray-400'
                        : t.totalPendiente > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'">
                        {{ mostrarNumero(t.totalPendiente) }}
                    </td>
                    <td class="px-4 py-3">
                        <EstadoRecepcionBadge :estado="t.estadoRecepcion" />
                    </td>
                    <td class="px-4 py-3">
                        <button v-if="t.reversoEstado" type="button" @click="emit('verReverso', t.id)"
                            class="inline-flex items-center gap-1 hover:opacity-75 transition-opacity">
                            <span v-if="t.reversoEstado === 'TransferenciaCreada'"
                                class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {{ t.reversoSapTransferDocNum }}
                            </span>
                            <EstadosPlantilla v-else :estado="t.reversoEstado" />
                            <EyeIcon class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        </button>
                        <span v-else class="text-xs text-gray-400">—</span>
                    </td>

                    <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-1">
                            <button type="button" @click="emit('ver', t.id)" title="Ver detalle"
                                class="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                <EyeIcon class="w-5 h-5" />
                            </button>

                            <!-- Solo en estados no terminales: los resueltos ya no se consultan -->
                            <button v-if="puedeSincronizar(t.estadoRecepcion)" type="button"
                                @click="emit('sincronizar', t.id)" :disabled="sincronizandoId === t.id"
                                title="Actualizar estado desde SAP"
                                class="p-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': sincronizandoId === t.id }" />
                            </button>
                            <button
                                v-if="puedeRegularizar && (t.estadoRecepcion === 'TransitoriaAbierta' || t.estadoRecepcion === 'RecepcionParcial')"
                                type="button" @click="emit('regularizar', t.id)"
                                :disabled="!t.puedeReversarse || regularizandoId === t.id"
                                :title="tooltipRegularizar(t)"
                                class="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                <ArrowUturnLeftIcon class="w-5 h-5"
                                    :class="{ 'animate-pulse': regularizandoId === t.id }" />
                            </button>

                        </div>
                    </td>
                </tr>

                <tr v-if="!cargando && transitorias.length === 0">
                    <td colspan="12" class="px-4 py-16 text-center">
                        <InboxIcon class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p class="text-sm text-gray-400 dark:text-gray-500">No hay transitorias para mostrar.</p>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>