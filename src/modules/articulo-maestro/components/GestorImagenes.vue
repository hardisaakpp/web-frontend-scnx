<template>
    <section class="space-y-5">
        <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Imágenes del artículo</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Selecciona hasta tres imágenes del sitio autorizado de SharePoint. La posición 1 siempre es la principal.
            </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
            <article
                v-for="position in positions"
                :key="position.value"
                class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
                <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <div>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ position.label }}</h3>
                        <p class="text-xs text-gray-500">{{ position.description }}</p>
                    </div>
                    <span
                        v-if="getImage(position.value)?.estado"
                        class="rounded-full px-2 py-1 text-[10px] font-bold"
                        :class="statusClass(getImage(position.value)?.estado)"
                    >
                        {{ statusLabel(getImage(position.value)?.estado) }}
                    </span>
                </div>

                <div class="aspect-square bg-gray-100 dark:bg-gray-900">
                    <img
                        v-if="previews[position.value]"
                        :src="previews[position.value]"
                        :alt="`Previsualización de ${position.label}`"
                        class="h-full w-full object-contain"
                    />
                    <div v-else class="flex h-full flex-col items-center justify-center px-5 text-center text-gray-400">
                        <svg class="mb-2 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m3 16 5-5 4 4 3-3 6 6M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                        </svg>
                        <span class="text-xs">{{ previewLoading[position.value] ? 'Cargando vista previa...' : 'Sin imagen seleccionada' }}</span>
                    </div>
                </div>

                <div class="space-y-3 p-4">
                    <div v-if="getImage(position.value)" class="min-h-10">
                        <p class="truncate text-sm font-medium text-gray-900 dark:text-white" :title="getImage(position.value)?.nombreOriginal ?? ''">
                            {{ getImage(position.value)?.nombreOriginal || getImage(position.value)?.nombreFinal || 'Imagen de SharePoint' }}
                        </p>
                        <p v-if="getImage(position.value)?.mensajeError" class="mt-1 text-xs text-red-600 dark:text-red-400">
                            {{ getImage(position.value)?.mensajeError }}
                        </p>
                    </div>
                    <div v-else class="min-h-10 text-xs text-gray-400">
                        JPG, JPEG, PNG o WEBP
                    </div>

                    <p v-if="errors[position.value]" class="text-xs text-red-600 dark:text-red-400">
                        {{ errors[position.value] }}
                    </p>

                    <div class="flex gap-2">
                        <button
                            type="button"
                            class="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="disabled || selectingPosition !== null"
                            @click="selectImage(position.value)"
                        >
                            {{ selectingPosition === position.value ? 'Abriendo...' : getImage(position.value) ? 'Reemplazar' : 'Seleccionar desde SharePoint' }}
                        </button>
                        <button
                            v-if="getImage(position.value)"
                            type="button"
                            class="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                            :disabled="disabled"
                            @click="removeImage(position.value)"
                        >
                            Quitar
                        </button>
                    </div>
                </div>
            </article>
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400">
            Las imágenes se copian y renombran en segundo plano después de guardar el artículo.
        </p>
    </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
    articuloService
} from '../services/articuloService'
import type { ImagenArticuloReferencia } from '../types'
import { seleccionarImagenSharePoint } from '../services/microsoftFilePicker'

const props = withDefaults(defineProps<{
    modelValue?: ImagenArticuloReferencia[]
    disabled?: boolean
}>(), {
    modelValue: () => [],
    disabled: false
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: ImagenArticuloReferencia[]): void
}>()

const positions = [
    { value: 1 as const, label: 'Imagen principal', description: 'Posición 1' },
    { value: 2 as const, label: 'Secundaria 1', description: 'Posición 2' },
    { value: 3 as const, label: 'Secundaria 2', description: 'Posición 3' }
]
const previews = reactive<Record<number, string>>({})
const previewKeys = reactive<Record<number, string>>({})
const previewLoading = reactive<Record<number, boolean>>({})
const errors = reactive<Record<number, string>>({})
const selectingPosition = ref<number | null>(null)

function getImage(position: number): ImagenArticuloReferencia | undefined {
    return props.modelValue.find(image => image.posicion === position)
}

function revokePreview(position: number): void {
    if (previews[position]) globalThis.URL.revokeObjectURL(previews[position])
    delete previews[position]
    delete previewKeys[position]
}

async function loadPreview(image: ImagenArticuloReferencia): Promise<void> {
    if (!image.driveId || !image.itemId) return
    const key = `${image.driveId}:${image.itemId}`
    if (previewKeys[image.posicion] === key) return
    revokePreview(image.posicion)
    previewLoading[image.posicion] = true
    try {
        const blob = await articuloService.getSharePointPreview({
            driveId: image.driveId,
            itemId: image.itemId
        })
        previews[image.posicion] = globalThis.URL.createObjectURL(blob)
        previewKeys[image.posicion] = key
        delete errors[image.posicion]
    } catch {
        errors[image.posicion] =
            'La imagen fue seleccionada, pero la vista previa no está disponible.'
    } finally {
        previewLoading[image.posicion] = false
    }
}

async function selectImage(position: 1 | 2 | 3): Promise<void> {
    selectingPosition.value = position
    delete errors[position]
    try {
        const selected = await seleccionarImagenSharePoint()
        const image: ImagenArticuloReferencia = {
            ...selected,
            posicion: position,
            esPrincipal: position === 1,
            estado: 'PENDIENTE'
        }
        const next = props.modelValue
            .filter(current => current.posicion !== position)
            .concat(image)
            .sort((left, right) => left.posicion - right.posicion)
        emit('update:modelValue', next)
        await loadPreview(image)
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : 'No fue posible abrir SharePoint.'
        if (message !== 'Selección cancelada.') errors[position] = message
    } finally {
        selectingPosition.value = null
    }
}

function removeImage(position: number): void {
    revokePreview(position)
    delete errors[position]
    emit(
        'update:modelValue',
        props.modelValue.filter(image => image.posicion !== position)
    )
}

function statusLabel(
    status?: ImagenArticuloReferencia['estado']
): string {
    return {
        PENDIENTE: 'Pendiente',
        PROCESANDO: 'Procesando',
        COMPLETADA: 'Completada',
        ERROR: 'Error'
    }[status ?? 'PENDIENTE']
}

function statusClass(
    status?: ImagenArticuloReferencia['estado']
): string {
    return {
        PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        PROCESANDO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        COMPLETADA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    }[status ?? 'PENDIENTE']
}

watch(
    () => props.modelValue,
    images => {
        const activePositions = new Set(images.map(image => image.posicion))
        positions.forEach(({ value }) => {
            if (!activePositions.has(value)) revokePreview(value)
        })
        images.forEach(image => {
            if (image.driveId && image.itemId) void loadPreview(image)
        })
    },
    { immediate: true, deep: true }
)

onBeforeUnmount(() => {
    Object.keys(previews).forEach(position => revokePreview(Number(position)))
})
</script>
