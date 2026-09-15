<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import CargandoSpinner from './CargandoSpinner.vue'
import type { TransitoriaDetalle } from '../types'

const props = defineProps<{
    abierto: boolean
    detalle: TransitoriaDetalle | null
    cargando: boolean
    regularizando: boolean
    error?: string
}>()

const emit = defineEmits<{ confirmar: [responsable: string]; cancelar: [] }>()

const lineasPendientes = (detalle: TransitoriaDetalle) =>
    detalle.lineas.filter((l) => (l.cantidadPendiente ?? 0) > 0)

const responsable = ref('')

watch(() => props.abierto, (v) => {
    if (v) responsable.value = ''
})

const onResponsableInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    responsable.value = target.value.toUpperCase()
}

const puedeConfirmar = computed(() => responsable.value.trim().length > 0)
</script>

<template>
    <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="!regularizando && emit('cancelar')"></div>

        <div
            class="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <ExclamationTriangleIcon class="w-5 h-5 text-indigo-500" />
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">¿Regularizar esta transitoria?</h2>
                <button type="button" @click="emit('cancelar')" :disabled="regularizando"
                    class="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>

            <div class="overflow-y-auto p-6 space-y-4">
                <CargandoSpinner v-if="cargando" mensaje="Cargando productos…" />

                <template v-else-if="detalle">
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        Se creará una transferencia inversa hacia
                        <span class="font-semibold text-gray-900 dark:text-white">{{ detalle.tiendaOrigen }}</span>
                        por el saldo pendiente que quedó en
                        <span class="font-semibold text-gray-900 dark:text-white">{{ detalle.tiendaDestinoCodigo }}</span>.
                        
                    </p>

                    <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div class="overflow-x-auto overflow-y-auto max-h-[35vh]">
                            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead>
                                    <tr>
                                        <th class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Artículo</th>
                                        <th class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pendiente</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                    <tr v-for="l in lineasPendientes(detalle)" :key="l.itemCode">
                                        <td class="px-4 py-2">
                                            <div class="text-xs font-semibold text-gray-900 dark:text-white">{{ l.itemCode }}</div>
                                            <div class="text-[11px] text-gray-400 dark:text-gray-500">{{ l.itemName || '—' }}</div>
                                        </td>
                                        <td class="px-4 py-2 text-xs text-center font-semibold text-amber-600 dark:text-amber-400">
                                            {{ l.cantidadPendiente }}
                                        </td>
                                    </tr>
                                    <tr v-if="lineasPendientes(detalle).length === 0">
                                        <td colspan="2" class="px-4 py-6 text-center text-xs text-gray-400">
                                            No hay productos con saldo pendiente.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <p class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0" />
                        Esta acción moverá el saldo pendiente de vuelta al inventario de la tienda origen y no se puede
                        deshacer desde aquí.
                    </p>

                    <div>
                        <label for="responsableRegularizar"
                            class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                            Responsable
                        </label>
                        <input id="responsableRegularizar" :value="responsable" @input="onResponsableInput"
                            type="text" placeholder="Nombre del responsable" maxlength="139"
                            class="w-full h-[38px] px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm uppercase bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                    </div>

                    <p v-if="error"
                        class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                        {{ error }}
                    </p>
                </template>
            </div>

            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" @click="emit('cancelar')" :disabled="regularizando"
                    class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors">
                    Cancelar
                </button>
                <button type="button" @click="emit('confirmar', responsable.trim())"
                    :disabled="regularizando || cargando || !puedeConfirmar"
                    class="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm">
                    {{ regularizando ? 'Regularizando…' : 'Sí, regularizar transitoria' }}
                </button>
            </div>
        </div>
    </div>
</template>
