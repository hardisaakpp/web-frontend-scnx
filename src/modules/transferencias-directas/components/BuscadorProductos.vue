<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { QrCodeIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon } from '@heroicons/vue/24/outline'
import productosService from '../services/productosService'
import type { ProductoBusqueda, BuscarProductosQuery, TipoBusquedaProducto } from '../types'

const props = defineProps<{
    whsCodeOrigen?: string
}>()

const emit = defineEmits<{ agregar: [producto: ProductoBusqueda, cantidad: number] }>()


const control =
    'w-full h-[35px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors'
const miniLabel = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
const disabledClass = 'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800'

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

// Cancela la búsqueda en vuelo al disparar una nueva: el backend consulta stock
// en tiempo real y puede tardar segundos, así que sin cancelar las respuestas
// llegan desordenadas y una tecla vieja termina pisando un resultado más nuevo.
let peticionEnVuelo: AbortController | null = null

// Caché del último resultado completo (no truncado por el TOP 50 del backend).
// Permite filtrar en memoria mientras el usuario solo agrega caracteres al mismo
// prefijo, en vez de golpear el backend en cada tecla.
const TOPE_RESULTADOS = 50
let cacheTermino = ''
let cacheTipo: TipoBusquedaProducto | null = null
let cacheDatos: ProductoBusqueda[] = []

const guardarCache = (termino: string, datos: ProductoBusqueda[]) => {
    // Si vino al tope, pudo haberse cortado: no es seguro filtrar sobre esos datos.
    if (datos.length >= TOPE_RESULTADOS) { invalidarCache(); return }
    cacheTermino = termino.toLowerCase()
    cacheTipo = tipoBusqueda.value
    cacheDatos = datos
}

const invalidarCache = () => {
    cacheTermino = ''
    cacheTipo = null
    cacheDatos = []
}

/** Campo del producto sobre el que se filtra, según el tipo de búsqueda activo. */
const valorSegunTipo = (p: ProductoBusqueda) =>
    (tipoBusqueda.value === 'itemCode' ? p.itemCode : p.itemName ?? '').toLowerCase()

/**
 * Devuelve los resultados filtrados en memoria si el término solo extiende el
 * prefijo ya consultado (mismo tipo de búsqueda); null si hay que ir al backend.
 */
const filtrarDesdeCache = (q: string): ProductoBusqueda[] | null => {
    if (!cacheTipo || cacheTipo !== tipoBusqueda.value) return null
    const termino = q.toLowerCase()
    if (!cacheTermino || !termino.startsWith(cacheTermino)) return null

    return cacheDatos.filter((p) =>
        tipoBusqueda.value === 'itemCode'
            ? valorSegunTipo(p).startsWith(termino) // el backend busca por prefijo
            : valorSegunTipo(p).includes(termino)   // por nombre busca "contiene"
    )
}

const placeholder = computed(() => {
    if (tipoBusqueda.value === 'codeBars') return 'Ingrese o escanee el código de barras'
    if (tipoBusqueda.value === 'itemCode') return 'Ingrese el código del producto (mín. 2 carácteres)'
    return 'Ingrese el nombre del producto (mín. 2 carácteres)'
})
const mostrarDropdown = computed(() => resultados.value.length > 0)

// Sin tienda origen no se puede conocer el stock: el buscador queda inhabilitado.
const sinOrigen = computed(() => !props.whsCodeOrigen)

const puedeAgregar = computed(() => {
    if (sinOrigen.value) return false
    return tipoBusqueda.value === 'codeBars'
        ? termino.value.trim().length > 0
        : productoSeleccionado.value != null
})

// ── Búsqueda ─────────────────────────────────────────────────────────────────
/** Distingue una cancelación deliberada de un error real de red/servidor. */
const esPeticionCancelada = (e: any) =>
    e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.name === 'AbortError'

/**
 * Pistoleo: con una sola coincidencia se agrega directo y se re-enfoca el input
 * para el próximo escaneo. Si el stock no alcanza, no se limpia (queda el error).
 */
const resolverEscaneo = async (data: ProductoBusqueda[]) => {
    if (data.length === 0) { info('Producto no encontrado.'); return }
    if (data.length > 1) { resultados.value = data; return }

    if (agregarProducto(data[0])) {
        limpiarBusqueda()
        await nextTick()
        inputRef.value?.focus()
    }
}

const ejecutarBusqueda = async (q: string, esBarcode = false) => {
    if (sinOrigen.value) return

    // Cancela la anterior y registra esta como la vigente
    peticionEnVuelo?.abort()
    const controller = new AbortController()
    peticionEnVuelo = controller

    cargando.value = true
    mensaje.value = ''
    esError.value = false
    try {
        const query: BuscarProductosQuery = { whsCode: props.whsCodeOrigen }
        if (tipoBusqueda.value === 'codeBars') query.codeBars = q
        else if (tipoBusqueda.value === 'itemCode') query.itemCode = q
        else query.itemName = q

        const data = await productosService.buscar(query, controller.signal)

        // Si mientras esperábamos se disparó otra búsqueda, esta respuesta ya es
        // obsoleta: descartarla en vez de pisar el resultado más reciente.
        if (peticionEnVuelo !== controller) return

        if (esBarcode) await resolverEscaneo(data)
        else {
            guardarCache(q, data)
            resultados.value = data
            if (data.length === 0) info('Producto no encontrado.')
            else if (data.length >= TOPE_RESULTADOS) info('Se muestran los primeros 50 resultados')
        }
    } catch (e: any) {
        if (esPeticionCancelada(e)) return // cancelación esperada: no es un error para el usuario
        manejarError(e)
    } finally {
        if (peticionEnVuelo === controller) {
            peticionEnVuelo = null
            cargando.value = false
        }
    }
}

watch(termino, (val) => {
    if (tipoBusqueda.value === 'codeBars') return
    if (ignorarWatch) { ignorarWatch = false; return }
    productoSeleccionado.value = null
    if (debounceTimer) clearTimeout(debounceTimer)

    const q = val.trim()
    if (q.length < 2) {
        resultados.value = []
        mensaje.value = ''
        invalidarCache() // al bajar del mínimo se pierde el prefijo de referencia
        return
    }

    // Si el término solo extiende un prefijo ya consultado, se filtra en memoria
    // y se evita la llamada al backend (que consulta stock en tiempo real).
    const enMemoria = filtrarDesdeCache(q)
    if (enMemoria) {
        peticionEnVuelo?.abort() // descarta cualquier búsqueda previa aún en curso
        peticionEnVuelo = null
        cargando.value = false
        resultados.value = enMemoria
        mensaje.value = enMemoria.length === 0 ? 'Producto no encontrado.' : ''
        esError.value = false
        return
    }

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
    } else if (productoSeleccionado.value && agregarProducto(productoSeleccionado.value)) {
        limpiarBusqueda()
    }
}


/**
 * Agrega el producto al detalle. El stock NO se valida aquí (haría lento el
 * picking): lo valida el backend al enviar a aprobación.
 */
const agregarProducto = (p: ProductoBusqueda): boolean => {
    emit('agregar', p, cantidad.value)
    cantidad.value = 1
    return true
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


// Cambiar el campo de búsqueda invalida el caché: el prefijo aplica a otro campo.
watch(tipoBusqueda, () => { invalidarCache(); limpiarBusqueda() })

// Cambiar la tienda origen invalida el caché: el stock corresponde a otra bodega.
watch(() => props.whsCodeOrigen, () => { invalidarCache(); limpiarBusqueda() })

const onFocusOut = () => { setTimeout(() => { resultados.value = [] }, 150) }


const incrementar = () => { cantidad.value++ }
const decrementar = () => { if (cantidad.value > 1) cantidad.value-- }

// Al desmontar: cortar la petición en vuelo y el debounce pendiente.
onUnmounted(() => {
    peticionEnVuelo?.abort()
    if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
    <div>
        <div class="flex flex-col sm:flex-row sm:items-end gap-3">
            <!-- Tipo de búsqueda -->
            <div class="sm:w-48">
                <label for="comBusqueda" :class="miniLabel">Buscar por</label>
                <select id="comBusqueda" v-model="tipoBusqueda" :disabled="sinOrigen" :class="[control, disabledClass]">
                    <option value="codeBars">Código de Barras</option>
                    <option value="itemCode">Código de Producto</option>
                    <option value="itemName">Nombre del Producto</option>
                </select>
            </div>
            <div class="flex-1 min-w-0">
                <label for="ingresoBusqueda" :class="miniLabel">Valor de búsqueda</label>
                <div id="ingresoBusqueda" class="relative" @focusout="onFocusOut">
                    <input ref="inputRef" v-model="termino" type="text" :placeholder="placeholder" autocomplete="off"
                        :disabled="sinOrigen" :class="[control, disabledClass, 'pr-10']" @keyup.enter="onEnter" />
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
                <label for="cantidad" :class="miniLabel">Cantidad</label>
                <div
                    class="inline-flex items-stretch h-[35px] rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    <button type="button" @click="decrementar"
                        class="h-full px-2.5 flex items-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-600 transition-colors">
                        <MinusIcon class="w-4 h-4" />
                    </button>
                    <input id="cantidad" v-model.number="cantidad" type="number" min="1"
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

        <!-- Sin tienda origen no se puede consultar el stock -->
        <p v-if="sinOrigen" class="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Selecciona primero la tienda origen para poder buscar productos.
        </p>

        <p v-else-if="mensaje" class="mt-2 text-xs"
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
