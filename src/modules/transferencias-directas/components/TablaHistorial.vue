<script setup lang="ts">
import { EyeIcon, PencilSquareIcon, InboxIcon, CheckBadgeIcon, PaperAirplaneIcon, ClipboardDocumentCheckIcon, ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/vue/24/outline'
import { APP_LOCALE } from '@/plugins/locale'

import type { SolicitudResumen } from '../types'
import EstadosPlantilla from './EstadosPlantilla.vue';
import CargandoSpinner from './CargandoSpinner.vue';
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore()
const props = defineProps<{
    solicitudes: SolicitudResumen[]
    cargando: boolean
    ordenarPor?: string
    direccion?: 'asc' | 'desc'
}>()
const emit = defineEmits<{
    ver: [id: number]
    editar: [id: number]
    'enviar-aprobacion': [id: number]
    'crear-definitiva': [id: number]
    'ver-errores': [id: number]
    ordenar: [campo: string]
}>()

const thClass =
    'sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400'
const thOrdenableClass = `${thClass} cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`

/** Indica si la columna es la activa del ordenamiento y en qué sentido. */
const esOrdenActivo = (campo: string) => props.ordenarPor === campo
const esAscendente = (campo: string) => esOrdenActivo(campo) && props.direccion === 'asc'

const formatFecha = (iso: string) =>
    iso
        ? new Date(iso).toLocaleString(APP_LOCALE, {
            dateStyle: 'short',
            timeStyle: 'short',
        })
        : ''
const mostrarGuia = (g: string | null) => (g && g.trim() ? g : '—')
const puedeAprobar = computed(() => authStore.hasPermission('transferenciadirecta.aprobar'))

</script>

<template>
    <div class="overflow-x-auto overflow-y-auto max-h-[60vh]">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
                <tr>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'id')">
                        <span class="inline-flex items-center gap-1">
                            ID
                            <ChevronUpIcon v-if="esAscendente('id')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('id')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'tiendaOrigen')">
                        <span class="inline-flex items-center gap-1">
                            Tienda Origen
                            <ChevronUpIcon v-if="esAscendente('tiendaOrigen')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('tiendaOrigen')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'tiendaDestino')">
                        <span class="inline-flex items-center gap-1">
                            Tienda Destino(Tránsito)
                            <ChevronUpIcon v-if="esAscendente('tiendaDestino')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('tiendaDestino')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'fechaSolicitud')">
                        <span class="inline-flex items-center gap-1">
                            Fecha Creación
                            <ChevronUpIcon v-if="esAscendente('fechaSolicitud')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('fechaSolicitud')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thOrdenableClass" @click="emit('ordenar', 'estado')">
                        <span class="inline-flex items-center gap-1">
                            Estado
                            <ChevronUpIcon v-if="esAscendente('estado')" class="w-3 h-3" />
                            <ChevronDownIcon v-else-if="esOrdenActivo('estado')" class="w-3 h-3" />
                            <ChevronUpDownIcon v-else class="w-3 h-3 opacity-40" />
                        </span>
                    </th>
                    <th :class="thClass">Cantidad de Productos</th>
                    <th :class="thClass">Guía Courier</th>
                    <th :class="thClass">Responsable del Envió</th>
                    <th :class="thClass">Observaciones</th>
                    <th :class="[thClass, 'text-right']">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <tr v-if="cargando">
                    <td colspan="10" class="px-4 py-6">
                        <CargandoSpinner mensaje="Cargando solicitudes…" />
                    </td>
                </tr>
                <tr v-for="s in solicitudes" v-else :key="s.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-2 py-3 text-center">
                        <span
                            class="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">#{{
                            s.id }}
                        </span>
                    </td>

                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ s.tiendaOrigen }}</td>
                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ s.tiendaDestinoCodigo }}</td>
                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{{
                        formatFecha(s.fechaSolicitud) }}</td>
                    <td class="px-4 py-3">
                        <button  v-if="s.estado === 'ErrorEnvioSap'"  type="button" @click="emit('ver-errores', s.id)"
                            title="Ver errores de SAP"
                            class="cursor-pointer rounded-full hover:ring-2 hover:ring-rose-300 dark:hover:ring-rose-700 transition ">
                            <EstadosPlantilla :estado="s.estado" />
                        </button>
                        <EstadosPlantilla v-else :estado="s.estado" />
                    </td>
                    <td class="px-4 py-3 text-xs text-center text-gray-600 dark:text-gray-300">{{ s.cantidadProductos }}
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ mostrarGuia(s.guiaEnvio) }}</td>
                    <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ s.usuarioSolicitante }}</td>
                    <td class="px-4 py-3 text-xs  text-gray-600 dark:text-gray-300">{{ s.justificacion }}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-1">
                            <!-- Ver (siempre) -->
                             <button type="button" @click="emit('ver', s.id)"
                                :title="puedeAprobar && s.estado === 'PendienteAprobacion' ? 'Revisar y aprobar' : 'Ver detalle'"
                                class="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                <ClipboardDocumentCheckIcon v-if="puedeAprobar && s.estado === 'PendienteAprobacion'" class="w-5 h-5" />
                                <EyeIcon v-else class="w-5 h-5" />
                            </button>

                            <!-- Borrador: Editar + Enviar a aprobación -->
                            <template v-if="s.estado === 'Borrador'">
                                <button type="button" @click="emit('editar', s.id)" title="Editar"
                                    class="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                                    <PencilSquareIcon class="w-5 h-5" />
                                </button>
                                <button type="button" @click="emit('enviar-aprobacion', s.id)"
                                    title="Enviar a aprobación"
                                    class="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                                    <PaperAirplaneIcon class="w-5 h-5" />
                                </button>
                            </template>

                            <!-- Aprobado: Crear transferencia definitiva -->
                            <button v-if="s.estado === 'Aprobado'" type="button" @click="emit('crear-definitiva', s.id)"
                                title="Crear Transferencia"
                                class="p-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                                <CheckBadgeIcon class="w-5 h-5" />
                            </button>
                        </div>
                    </td>

                </tr>
                <tr v-if="!cargando && solicitudes.length === 0">
                    <td colspan="10" class="px-4 py-16 text-center">
                        <InboxIcon class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p class="text-sm text-gray-400 dark:text-gray-500">No hay solicitudes para mostrar.</p>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
