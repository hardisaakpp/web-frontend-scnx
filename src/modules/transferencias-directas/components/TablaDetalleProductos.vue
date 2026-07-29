<script setup lang="ts">
import { TrashIcon, InboxIcon } from '@heroicons/vue/24/outline'
import type { DetalleLinea } from '../types'

defineProps<{ productos: DetalleLinea[] }>()
const emit = defineEmits<{ eliminar: [itemCode: string] }>()
</script>

<template>
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- max-h ≈ 5 filas + cabecera → a partir de ahí, scroll con header fijo -->
        <div class="overflow-x-auto overflow-y-auto max-h-[280px]">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                    <tr>
                        <th
                            class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Código Producto</th>
                        <th
                            class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Nombre Producto</th>
                        <th
                            class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Código de Barras</th>
                        <th
                            class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Cantidad</th>
                        <th
                            class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    <tr v-for="p in productos" :key="p.itemCode"
                        class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ p.itemCode }}</td>
                        <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ p.itemName }}</td>
                        <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ p.codeBars }}</td>
                        <td class="px-4 py-3 text-xs text-center font-medium text-gray-900 dark:text-white">{{
                            p.cantidadSolicitada }}</td>
                        <td class="px-4 py-3 text-right">
                            <button type="button" @click="emit('eliminar', p.itemCode)" title="Eliminar"
                                class="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
                                <TrashIcon class="w-4 h-4 inline" />
                            </button>
                        </td>
                    </tr>

                    <tr v-if="productos.length === 0">
                        <td colspan="5" class="px-4 py-12 text-center">
                            <InboxIcon class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                            <p class="text-xs text-gray-400 dark:text-gray-500">Aún no agregaste productos a la
                                transferencia.</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
