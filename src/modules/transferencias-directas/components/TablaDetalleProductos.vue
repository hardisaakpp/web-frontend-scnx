<script setup lang="ts">
import { TrashIcon, InboxIcon, MinusIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { CANTIDAD_MAX, type DetalleLinea } from '../types'

defineProps<{ productos: DetalleLinea[] }>()
const emit = defineEmits<{
    eliminar: [itemCode: string]
    'cambiar-cantidad': [itemCode: string, cantidad: number]
}>()

/**
 * Ajusta la cantidad de una línea. El mínimo es 1: para quitar el producto se
 * usa el botón eliminar.
 */
const ajustar = (p: DetalleLinea, delta: number) => {
    const nueva = p.cantidadSolicitada + delta
    if (nueva < 1 || nueva > CANTIDAD_MAX) return
    emit('cambiar-cantidad', p.itemCode, nueva)
}

/** Impide teclear lo que no sea un dígito (bloquea -, +, ., e y letras). */
const soloDigitos = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.key.length > 1) return // permite Ctrl+V, Backspace, flechas…
    if (!/\d/.test(e.key)) e.preventDefault()
}

/**
 * Escritura directa de la cantidad. Se ignora lo inválido (vacío, 0, negativo)
 * y el input se repinta con el valor vigente al salir del campo.
 */
const onCantidadInput = (p: DetalleLinea, e: Event) => {
    const target = e.target as HTMLInputElement
    const valor = Number(target.value)
    if (!Number.isInteger(valor) || valor < 1) return
    if (valor > CANTIDAD_MAX) {
        // Se recorta al tope y se repinta para que el usuario vea el límite aplicado
        target.value = String(CANTIDAD_MAX)
        emit('cambiar-cantidad', p.itemCode, CANTIDAD_MAX)
        return
    }
    emit('cambiar-cantidad', p.itemCode, valor)
}

const onCantidadBlur = (p: DetalleLinea, e: Event) => {
    const target = e.target as HTMLInputElement
    target.value = String(p.cantidadSolicitada)
}
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
                        <td class="px-4 py-3">
                            <div class="flex justify-center">
                                <div
                                    class="inline-flex items-stretch h-[30px] rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                                    <button type="button" @click="ajustar(p, -1)"
                                        :disabled="p.cantidadSolicitada <= 1" title="Quitar una unidad"
                                        class="h-full px-2 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                        <MinusIcon class="w-3.5 h-3.5" />
                                    </button>
                                    <input :value="p.cantidadSolicitada" type="number" min="1" :max="CANTIDAD_MAX"
                                        @keydown="soloDigitos"
                                        @input="onCantidadInput(p, $event)" @blur="onCantidadBlur(p, $event)"
                                        aria-label="Cantidad solicitada"
                                        class="qty-input h-full w-12 text-center text-xs font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-700 outline-none" />
                                    <button type="button" @click="ajustar(p, 1)"
                                        :disabled="p.cantidadSolicitada >= CANTIDAD_MAX" title="Agregar una unidad"
                                        class="h-full px-2 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                        <PlusIcon class="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </td>
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

<style scoped>
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.qty-input {
    -moz-appearance: textfield;
    appearance: textfield;
}
</style>
