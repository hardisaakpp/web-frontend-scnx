<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { MARCA_TODAS, MatrizAprobacion, TiendaDestino } from '../types';
import almacenesService from '../services/almacenesServices';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import CargandoSpinner from './CargandoSpinner.vue';


const props = defineProps<{
    abierto: boolean
    modo: 'nuevo' | 'editar'
    marcas: string[]
    regla: MatrizAprobacion | null
    guardando?: boolean
    error?: string
}>()

const emit = defineEmits<{
    guardar: [payload: {
        marcaOrigen: string
        marcaDestino: string
        whsCodeDestino: string | null
        requiereAprobacion: boolean
        rolAprobador: string | null
        activo: boolean
    }]
    cerrar: []
}>()

const inputClass =
    'w-full h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ' +
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800'

const marcaOrigenSel = ref('')
const marcaDestinoSel = ref('')
const whsDestinoSel = ref<string | null>(null)
const requiereAprobacion = ref(true)
const rolAprobador = ref('')
const activo = ref(true)

const todosLosAlmacenes = ref<TiendaDestino[]>([])

const bodegasDeLaMarca = computed(() =>
    marcaDestinoSel.value === MARCA_TODAS
        ? []
        : todosLosAlmacenes.value.filter((a) => a.marca === marcaDestinoSel.value)
)
const bodegaDeshabilitada = computed(() => marcaDestinoSel.value === MARCA_TODAS)
const cargandoDatos = ref(false)

watch(requiereAprobacion, (val) => { if (!val) rolAprobador.value = '' })

watch([() => props.abierto, () => props.regla], async ([v]) => {
    if (!v) return
    cargandoDatos.value = true
    try {
        if (todosLosAlmacenes.value.length === 0) {
            todosLosAlmacenes.value = await almacenesService.listar('Destino')
        }
        if (props.modo === 'editar' && props.regla) {
            marcaOrigenSel.value = props.regla.marcaOrigen
            marcaDestinoSel.value = props.regla.marcaDestino
            requiereAprobacion.value = props.regla.requiereAprobacion
            rolAprobador.value = props.regla.rolAprobador ?? ''
            activo.value = props.regla.activo
            whsDestinoSel.value = props.regla.whsCodeDestino
        } else {
            marcaOrigenSel.value = ''
            marcaDestinoSel.value = ''
            whsDestinoSel.value = null
            requiereAprobacion.value = true
            rolAprobador.value = ''
            activo.value = true
        }
    } finally {
        cargandoDatos.value = false
    }
})

const puedeGuardar = computed(() => !!marcaOrigenSel.value && !!marcaDestinoSel.value)

const onGuardar = () => {
    if (!puedeGuardar.value) return
    emit('guardar', {
        marcaOrigen: marcaOrigenSel.value,
        marcaDestino: marcaDestinoSel.value,
        whsCodeDestino: bodegaDeshabilitada.value ? null : whsDestinoSel.value,
        requiereAprobacion: requiereAprobacion.value,
        rolAprobador: requiereAprobacion.value ? (rolAprobador.value.trim() || null) : null,
        activo: activo.value,
    })
}
</script>


<template>
    <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="!guardando && emit('cerrar')"></div>

        <div
            class="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ modo === 'nuevo' ? 'Nueva Regla' : 'Editar Regla' }}
                </h3>
                <button type="button" @click="emit('cerrar')"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>

            <div class="overflow-y-auto p-6 space-y-4">
                <CargandoSpinner v-if="cargandoDatos" mensaje="Cargando…" />
                <template v-else>
                    <div>
                        <label for="marcOrig"
                            class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Marca
                            Origen</label>
                        <select id="marcOrig" v-model="marcaOrigenSel" :class="inputClass">
                            <option value="" disabled>Seleccione una marca…</option>
                            <option v-for="m in marcas" :key="m" :value="m">{{ m }}</option>
                        </select>
                    </div>

                    <div>
                        <label for="marcDest"
                            class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Marca
                            Destino</label>
                        <select id="marcDest" v-model="marcaDestinoSel" :class="inputClass" @change="whsDestinoSel = null">
                            <option value="" disabled>Seleccione una marca…</option>
                            <option :value="MARCA_TODAS">Todas las Marcas</option>
                            <option v-for="m in marcas" :key="m" :value="m">{{ m }}</option>
                        </select>
                    </div>

                    <div>
                        <label for="bodDest"
                            class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Bodega
                            Destino(Tránsito)</label>
                        <select id="bodDest" v-model="whsDestinoSel" :class="inputClass"
                            :disabled="bodegaDeshabilitada">
                            <option :value="null">Todas</option>
                            <option v-for="a in bodegasDeLaMarca" :key="a.whsCode" :value="a.uBogTra">{{ a.whsNombre }}
                            </option>
                        </select>
                    </div>

                    <div class="flex items-center gap-3 pt-1">
                        <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200 cursor-pointer">
                            <input type="checkbox" v-model="requiereAprobacion"
                                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                            ¿Requiere aprobación?
                        </label>
                    </div>

                    <!-- Rol Aprobador: solo si requiere aprobación -->
                    <div v-if="requiereAprobacion">
                        <label for="rolAprob"
                            class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Rol
                            Aprobador <span class="text-gray-400 font-normal">(opcional)</span></label>
                        <input id="rolAprob" v-model="rolAprobador" type="text" placeholder="Ej. Planificación"
                            :class="inputClass" />
                    </div>

                    <div v-if="modo === 'editar'" class="flex items-center gap-3 pt-1">
                        <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200 cursor-pointer">
                            <input type="checkbox" v-model="activo"
                                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" />
                            Regla activa
                        </label>
                    </div>

                    <p v-if="error"
                        class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                        {{
                            error }}</p>


                </template>
            </div>


            <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" @click="emit('cerrar')" :disabled="guardando"
                    class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors">
                    Cancelar
                </button>
                <button type="button" @click="onGuardar" :disabled="guardando || !puedeGuardar"
                    class="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium transition-colors shadow-sm">
                    {{ guardando ? 'Guardando…' : 'Guardar' }}
                </button>
            </div>
        </div>
    </div>
</template>
