<script setup lang="ts">
import { computed } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = withDefaults(defineProps<{
    abierto: boolean
    titulo: string
    mensaje: string
    textoConfirmar?: string
    textoCancelar?: string
    cargando?: boolean
    variante?: 'primary' | 'peligro'
    error?: string
}>(), {
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    cargando: false,
    variante: 'primary',
})

const emit = defineEmits<{ confirmar: []; cancelar: [] }>()

const claseConfirmar = computed(() =>
    props.variante === 'peligro' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
)
</script>

<template>
    <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="!cargando && emit('cancelar')"></div>

        <div
            class="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 text-center shadow-2xl border border-gray-200 dark:border-gray-700">
            <div
                class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30 mb-4">
                <ExclamationTriangleIcon class="h-10 w-10 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>

            <h3 class="text-xl font-bold leading-6 text-gray-900 dark:text-white mb-2">{{ titulo }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ mensaje }}</p>
            <p v-if="error"
                class="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {{ error }}
            </p>
            <div class="mt-6 flex justify-center gap-3">
                <button type="button" @click="emit('cancelar')" :disabled="cargando"
                    class="inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-60 transition-all shadow-sm">
                    {{ textoCancelar }}
                </button>
                <button type="button" @click="emit('confirmar')" :disabled="cargando"
                    class="inline-flex justify-center rounded-lg border border-transparent px-6 py-2 text-sm font-medium text-white disabled:opacity-60 transition-all shadow-sm"
                    :class="claseConfirmar">
                    {{ cargando ? 'Procesando…' : textoConfirmar }}
                </button>
            </div>
        </div>
    </div>
</template>
