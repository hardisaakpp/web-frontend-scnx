<script setup lang="ts">
import { ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { ConfiguracionDiasTransitoria, TiendaDestino } from '../types'

const props = defineProps<{
    abierto: boolean
    modo: 'nuevo' | 'editar'
    marcas: string[]
    almacenes: TiendaDestino[]
    regla: ConfiguracionDiasTransitoria | null   // null en modo nuevo
    guardando?: boolean
    error?: string
}>()

const emit = defineEmits<{
    guardar: [payload: { marca: string; bodegaCodigo: string | null; dias: number; activo: boolean }]
    cerrar: []
}>()

const inputClass =
    'w-full h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'

const marcaSel = ref('')
const bodegaSel = ref<string | null>(null)
const dias = ref(3)
const activo = ref(true)

const bodegasDeLaMarca = (marca: string) =>
    props.almacenes.filter((a) => a.marca === marca)

watch([() => props.abierto, () => props.regla], ([v]) => {
    if (!v) return
    if (props.modo === 'editar' && props.regla) {
        marcaSel.value = props.regla.marca
        bodegaSel.value = props.regla.bodegaCodigo
        dias.value = props.regla.dias
        activo.value = props.regla.activo
    } else {
        marcaSel.value = ''
        bodegaSel.value = null
        dias.value = 3
        activo.value = true
    }
})

const puedeGuardar = () => !!marcaSel.value && dias.value >= 1 && dias.value <= 365

const onGuardar = () => {
    if (!puedeGuardar()) return
    emit('guardar', {
        marca: marcaSel.value,
        bodegaCodigo: bodegaSel.value,
        dias: dias.value,
        activo: activo.value,
    })
}
</script>

<template>
    <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="!guardando && emit('cerrar')"></div>

        <div
            class="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ modo === 'nuevo' ? 'Nueva configuración de días' : 'Editar configuración de días' }}
                </h2>
                <button type="button" @click="emit('cerrar')"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label for="marcaDiasTransitoria" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Marca</label>
                    <select id="marcaDiasTransitoria" v-model="marcaSel" :class="inputClass" @change="bodegaSel = null">
                        <option value="" disabled>Seleccione una marca…</option>
                        <option v-for="m in marcas" :key="m" :value="m">{{ m }}</option>
                    </select>
                </div>

                <div>
                    <label for="bodegaDiasTransitoria" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Bodega/Tienda <span class="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <select id="bodegaDiasTransitoria" v-model="bodegaSel" :class="inputClass" :disabled="!marcaSel">
                        <option :value="null">Todas</option>
                        <option v-for="a in bodegasDeLaMarca(marcaSel)" :key="a.whsCode" :value="a.uBogTra">
                            {{ a.whsNombre }}
                        </option>
                    </select>
                </div>

                <div>
                    <label for="diasPlazoTransitoria" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Días de plazo</label>
                    <input id="diasPlazoTransitoria" v-model.number="dias" type="number" min="1" max="365" :class="inputClass" />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Entre 1 y 365 días.</p>
                </div>

                <div v-if="modo === 'editar'" class="flex items-center gap-2">
                    <input id="activoDias" type="checkbox" v-model="activo"
                        class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                    <label for="activoDias" class="text-sm text-gray-700 dark:text-gray-200">Regla activa</label>
                </div>

                <p v-if="error"
                    class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    {{ error }}
                </p>
            </div>

            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" @click="emit('cerrar')" :disabled="guardando"
                    class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors">
                    Cancelar
                </button>
                <button type="button" @click="onGuardar" :disabled="guardando || !puedeGuardar()"
                    class="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm">
                    {{ guardando ? 'Guardando…' : 'Guardar' }}
                </button>
            </div>
        </div>
    </div>
</template>
