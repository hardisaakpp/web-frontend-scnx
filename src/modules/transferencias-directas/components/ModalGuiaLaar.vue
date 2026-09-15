<script setup lang="ts">
/**
 * Captura la guía LAAR en el momento de enviar a aprobación.
 *
 * No se pide en el formulario de Crear/Editar a propósito: ahí el usuario aún
 * no ha despachado y terminaba inventando un número (0000000000) que nunca
 * corregía. Aquí ya tiene la guía real en la mano.
 */
import { ref, computed, watch, nextTick } from 'vue'
import { TruckIcon } from '@heroicons/vue/24/outline'
import ErrorStockFaltante from './ErrorStockFaltante.vue'
import { GUIA_LARGO, normalizarGuia, esGuiaValida, type StockFaltante } from '../types'

const props = withDefaults(defineProps<{
    abierto: boolean
    /** Valor ya guardado (al reintentar tras un fallo de stock llega precargado). */
    guiaActual?: string | null
    cargando?: boolean
    error?: string
    faltantes?: StockFaltante[]
}>(), {
    guiaActual: '',
    cargando: false,
    faltantes: () => [],
})

const emit = defineEmits<{ confirmar: [guia: string]; cancelar: [] }>()

const guia = ref('')
const input = ref<HTMLInputElement | null>(null)

// Cada apertura parte del valor guardado: si el envío falló por stock, la guía
// ya se persistió y el usuario solo confirma en vez de volver a escribirla.
watch(() => props.abierto, async (abierto) => {
    if (!abierto) return
    guia.value = normalizarGuia(props.guiaActual ?? '')
    await nextTick()
    input.value?.focus()
})

const onInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    guia.value = normalizarGuia(target.value)
    target.value = guia.value // refleja el filtrado en el input
}

const valida = computed(() => esGuiaValida(guia.value))
const puedeConfirmar = computed(() => valida.value && !props.cargando)

/** Ya existe una guía guardada: es una confirmación, no una captura desde cero. */
const yaTieneGuia = computed(() => esGuiaValida(normalizarGuia(props.guiaActual ?? '')))

const titulo = computed(() => (yaTieneGuia.value ? 'Confirmar guía LAAR' : 'Guía Courier'))
const subtitulo = computed(() =>
    yaTieneGuia.value
        ? '¿Es correcta la guía con la que se envía esta solicitud, o deseas corregirla?'
        : 'Ingresa la guía con la que se envía esta solicitud.'
)
const textoConfirmar = computed(() => (yaTieneGuia.value ? 'Confirmar y enviar' : 'Ingresar y enviar'))

const confirmar = () => {
    if (!puedeConfirmar.value) return
    emit('confirmar', guia.value)
}
</script>

<template>
    <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="!cargando && emit('cancelar')"></div>

        <div class="relative w-full rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
            :class="faltantes.length > 0 ? 'max-w-lg' : 'max-w-sm'">
            <div
                class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 mb-4">
                <TruckIcon class="h-9 w-9 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>

            <h3 class="text-xl font-bold leading-6 text-gray-900 dark:text-white mb-2 text-center">
                {{ titulo }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                {{ subtitulo }}
            </p>

            <div class="mt-4">
                <label for="guiaLaar" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Guía Courier
                </label>
                <input id="guiaLaar" ref="input" :value="guia" @input="onInput" @keyup.enter="confirmar"
                    type="text" :maxlength="GUIA_LARGO" placeholder="Ej. ABCD123456" autocomplete="off"
                    :disabled="cargando"
                    class="w-full h-[42px] px-3 py-2 border rounded-lg text-sm tracking-widest font-mono uppercase
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        border-gray-300 dark:border-gray-600
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors
                        disabled:opacity-60 disabled:cursor-not-allowed" />
                <p class="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {{ guia.length }} de {{ GUIA_LARGO }} caracteres alfanuméricos.
                </p>
            </div>

            <!-- Error con detalle de stock faltante (la guía ya quedó guardada) -->
            <ErrorStockFaltante v-if="error && faltantes.length > 0" :mensaje="error" :faltantes="faltantes"
                class="mt-3 text-left" />
            <p v-else-if="error"
                class="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {{ error }}
            </p>

            <div class="mt-6 flex justify-center gap-3">
                <button type="button" @click="emit('cancelar')" :disabled="cargando"
                    class="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-60 transition-all shadow-sm">
                    Cancelar
                </button>
                <button type="button" @click="confirmar" :disabled="!puedeConfirmar"
                    class="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 hover:bg-blue-700 px-6 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm">
                    {{ cargando ? 'Enviando…' : textoConfirmar }}
                </button>
            </div>
        </div>
    </div>
</template>
