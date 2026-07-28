<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { QrCodeIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon } from '@heroicons/vue/24/outline'
import productosService from '../services/productosService'
import type { ProductoBusqueda, BuscarProductosQuery, TipoBusquedaProducto } from '../types'

const emit = defineEmits<{ agregar: [producto: ProductoBusqueda, cantidad: number] }>()


const control =
    'w-full h-[35px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors'
const miniLabel = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

// ── Estado ───────────────────────────────────────────────────────────────────
const tipoBusqueda = ref<TipoBusquedaProducto>('codeBars')
const termino = ref('')
const cantidad = ref(1)
const resultados = ref<ProductoBusqueda[]>([])
const productoSeleccionado = ref<ProductoBusqueda | null>(null)
const cargando = ref(false)
const mensaje = ref('')
const esError = ref(false)

const inputRef = ref<HTMLInputElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let ignorarWatch = false // evita re-buscar cuando llenamos el input al seleccionar

const placeholder = computed(() => {
    if (tipoBusqueda.value === 'codeBars') return 'Ingrese o escanee el código de barras'
    if (tipoBusqueda.value === 'itemCode') return 'Ingrese el código del producto (mín. 2 carácteres)'
    return 'Ingrese el nombre del producto (mín. 2 carácteres)'
})
const mostrarDropdown = computed(() => resultados.value.length > 0)
const puedeAgregar = computed(() =>
    tipoBusqueda.value === 'codeBars'
        ? termino.value.trim().length > 0
        : productoSeleccionado.value != null
)

// ── Búsqueda ─────────────────────────────────────────────────────────────────
const ejecutarBusqueda = async (q: string, esBarcode = false) => {
    cargando.value = true
    mensaje.value = ''
    esError.value = false
    try {
        const query: BuscarProductosQuery = {}
        if (tipoBusqueda.value === 'codeBars') query.codeBars = q
        else if (tipoBusqueda.value === 'itemCode') query.itemCode = q
        else query.itemName = q

        const data = await productosService.buscar(query)

        if (esBarcode) {
            if (data.length === 1) {
                agregarProducto(data[0]) // pistoleo: agrega directo
                limpiarBusqueda()
                await nextTick(); inputRef.value?.focus() // listo para el próximo escaneo
            } else if (data.length === 0) {
                info('Producto no encontrado.')
            } else {
                resultados.value = data
            }
        } else {
            resultados.value = data
            if (data.length === 0) info('Producto no encontrado.')
            else if (data.length >= 50) info('Se muestran los primeros 50 resultados')
        }
    } catch (e: any) {
        manejarError(e)
    } finally {
        cargando.value = false
    }
}

watch(termino, (val) => {
    if (tipoBusqueda.value === 'codeBars') return
    if (ignorarWatch) { ignorarWatch = false; return }
    productoSeleccionado.value = null
    if (debounceTimer) clearTimeout(debounceTimer)
    const q = val.trim()
    if (q.length < 2) { resultados.value = []; mensaje.value = ''; return }
    debounceTimer = setTimeout(() => ejecutarBusqueda(q), 350)
})

const onEnter = () => {
    if (tipoBusqueda.value !== 'codeBars') return
    const q = termino.value.trim()
    if (q) ejecutarBusqueda(q, true)
}

const seleccionarProducto = (p: ProductoBusqueda) => {
    productoSeleccionado.value = p
    ignorarWatch = true
    termino.value = `${p.itemCode} - ${p.itemName}`
    resultados.value = []
    mensaje.value = ''
}

const onAgregarClick = () => {
    if (tipoBusqueda.value === 'codeBars') {
        const q = termino.value.trim()
        if (q) ejecutarBusqueda(q, true)
    } else if (productoSeleccionado.value) {
        agregarProducto(productoSeleccionado.value)
        limpiarBusqueda()
    }
}

const agregarProducto = (p: ProductoBusqueda) => {
    emit('agregar', p, cantidad.value)
    cantidad.value = 1
}

const limpiarBusqueda = () => {
    termino.value = ''
    resultados.value = []
    productoSeleccionado.value = null
    mensaje.value = ''
    esError.value = false
}

const info = (m: string) => { mensaje.value = m; esError.value = false }
const manejarError = (e: any) => {
    resultados.value = []
    esError.value = true
    const status = e?.response?.status
    if (status === 429) mensaje.value = 'Demasiadas búsquedas. Esperá un momento e intentá de nuevo.'
    else if (status === 400) mensaje.value = e?.response?.data?.error ?? 'Búsqueda inválida.'
    else mensaje.value = 'Ocurrió un error al buscar. Intentá de nuevo.'
}


watch(tipoBusqueda, () => limpiarBusqueda())

const onFocusOut = () => { setTimeout(() => { resultados.value = [] }, 150) }


const incrementar = () => { cantidad.value++ }
const decrementar = () => { if (cantidad.value > 1) cantidad.value-- }
</script>

<template>
    <div>
        <div class="flex flex-col sm:flex-row sm:items-end gap-3">
            <!-- Tipo de búsqueda -->
            <div class="sm:w-48">
                <label for="comBusqueda":class="miniLabel">Buscar por</label>
                <select id="comBusqueda" v-model="tipoBusqueda" :class="control">
                    <option value="codeBars">Código de Barras</option>
                    <option value="itemCode">Código de Producto</option>
                    <option value="itemName">Nombre del Producto</option>
                </select>
            </div>
            <div class="flex-1 min-w-0">
                <label for="ingresoBusqueda":class="miniLabel">Valor de búsqueda</label>
                <div id="ingresoBusqueda" class="relative" @focusout="onFocusOut">
                    <input ref="inputRef" v-model="termino" type="text" :placeholder="placeholder" autocomplete="off"
                        :class="[control, 'pr-10']" @keyup.enter="onEnter" />
                    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg v-if="cargando" class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        <QrCodeIcon v-else-if="tipoBusqueda === 'codeBars'" class="w-5 h-5" />
                        <MagnifyingGlassIcon v-else class="w-5 h-5" />
                    </span>

                    <!-- Listado dinámico: itemCode — Nombre -->
                    <ul v-if="mostrarDropdown"
                        class="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                        <li v-for="p in resultados" :key="p.itemCode + '|' + p.codeBars"
                            @mousedown.prevent="seleccionarProducto(p)"
                            class="px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200">
                            <span class="font-medium">{{ p.itemCode }}</span> — {{ p.itemName }}
                        </li>
                    </ul>
                </div>
            </div>

            <div>
                <label :class="miniLabel">Cantidad</label>
                <div
                    class="inline-flex items-stretch h-[35px] rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    <button type="button" @click="decrementar"
                        class="h-full px-2.5 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-600 transition-colors">
                        <MinusIcon class="w-4 h-4" />
                    </button>
                    <input v-model.number="cantidad" type="number" min="1"
                        class="qty-input h-full w-14 text-center text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
                    <button type="button" @click="incrementar"
                        class="h-full px-2.5 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l border-gray-300 dark:border-gray-600 transition-colors">
                        <PlusIcon class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <!-- Agregar -->
            <div>
                <button type="button" @click="onAgregarClick" :disabled="!puedeAgregar"
                    class="h-[35px] px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap">
                    Agregar a la lista
                </button>
            </div>
        </div>

        <!-- Mensajes (0 resultados / refina / 429 / error) -->
        <p v-if="mensaje" class="mt-2 text-xs"
            :class="esError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
            {{ mensaje }}
        </p>
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
}
</style>
