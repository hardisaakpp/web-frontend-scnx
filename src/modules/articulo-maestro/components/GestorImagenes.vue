<template>
    <section class="space-y-5">
        <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Imágenes del artículo</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Arrastra una imagen sobre cada casilla (o haz clic para seleccionarla). La posición 1 siempre es la principal.
            </p>
            <p v-if="!itemCode" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Las imágenes se subirán automáticamente en cuanto guardes el artículo por primera vez.
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
                        v-if="isErrorOnly(position.value)"
                        class="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    >
                        Error
                    </span>
                </div>

                <div
                    class="group relative aspect-square cursor-pointer bg-gray-100 transition-colors dark:bg-gray-900"
                    :class="dragOverPosition === position.value ? 'ring-2 ring-inset ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''"
                    @click="!disabled && pickFile(position.value)"
                    @dragover.prevent="!disabled && (dragOverPosition = position.value)"
                    @dragleave.prevent="dragOverPosition === position.value && (dragOverPosition = null)"
                    @drop.prevent="onDrop(position.value, $event)"
                >
                    <input
                        :id="`gestorImagenesInput-${position.value}`"
                        :ref="el => setInputRef(position.value, el)"
                        type="file"
                        :aria-label="`Seleccionar archivo para ${position.label}`"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        class="hidden"
                        @click.stop
                        @change="onFileInputChange(position.value, $event)"
                    />

                    <img
                        v-if="previewUrl(position.value)"
                        :src="previewUrl(position.value) ?? undefined"
                        :alt="`Previsualización de ${position.label}`"
                        class="h-full w-full object-contain"
                    />
                    <div v-else class="flex h-full flex-col items-center justify-center px-5 text-center text-gray-400">
                        <svg class="mb-2 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m3 16 5-5 4 4 3-3 6 6M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
                        </svg>
                        <span class="text-xs">Arrastra o haz clic</span>
                        <span class="mt-1 text-[10px] text-gray-400">JPG, JPEG, PNG o WEBP</span>
                    </div>

                    <div
                        v-if="uploading[position.value]"
                        class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70"
                    >
                        <svg class="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    </div>
                </div>

                <div class="space-y-2 p-4">
                    <div v-if="fileNameFor(position.value)" class="min-h-5">
                        <p
                            class="truncate text-sm font-medium text-gray-900 dark:text-white"
                            :title="fileNameFor(position.value) ?? ''"
                        >
                            {{ fileNameFor(position.value) }}
                        </p>
                        <p v-if="isStaged(position.value)" class="text-[11px] text-amber-600 dark:text-amber-400">
                            Pendiente de subir al guardar
                        </p>
                    </div>
                    <div v-else class="min-h-5 text-xs text-gray-400">Sin imagen</div>

                    <button
                        v-if="fileNameFor(position.value)"
                        type="button"
                        class="w-full rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        :disabled="disabled || uploading[position.value]"
                        @click.stop="removeImage(position.value)"
                    >
                        Quitar
                    </button>
                </div>
            </article>
        </div>
    </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { articuloService } from '../services/articuloService'
import type { ImagenArticuloReferencia } from '../types'
import { useToast } from '@/composables/useToast'

const props = withDefaults(defineProps<{
    itemCode?: string | null
    images?: ImagenArticuloReferencia[]
    disabled?: boolean
}>(), {
    itemCode: null,
    images: () => [],
    disabled: false
})

const emit = defineEmits<(event: 'update:images', value: ImagenArticuloReferencia[]) => void>()

const toast = useToast()

const positions = [
    { value: 1 as const, label: 'Imagen principal', description: 'Posición 1' },
    { value: 2 as const, label: 'Secundaria 1', description: 'Posición 2' },
    { value: 3 as const, label: 'Secundaria 2', description: 'Posición 3' }
]

type Posicion = 1 | 2 | 3

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

// Archivos elegidos antes de que el artículo tenga ItemCode (aún no se puede
// subir nada: los endpoints de imagen requieren un artículo ya creado). Se
// suben en cuanto el padre llama a flushPendingUploads() tras el POST inicial.
const stagedFiles = reactive<Record<number, File>>({})
const stagedPreviews = reactive<Record<number, string>>({})
const uploading = reactive<Record<number, boolean>>({})
const dragOverPosition = ref<number | null>(null)
const inputRefs: Record<number, HTMLInputElement | null> = {}

function setInputRef(position: number, el: unknown): void {
    inputRefs[position] = (el as HTMLInputElement | null) ?? null
}

function pickFile(position: number): void {
    inputRefs[position]?.click()
}

function persistedImage(position: number): ImagenArticuloReferencia | undefined {
    return props.images.find(image => image.posicion === position)
}

function isStaged(position: number): boolean {
    return !!stagedFiles[position]
}

function isErrorOnly(position: number): boolean {
    const image = persistedImage(position)
    return !isStaged(position) && image?.estado === 'ERROR' && !image.urlFinal
}

function previewUrl(position: number): string | null {
    if (stagedPreviews[position]) return stagedPreviews[position]
    return persistedImage(position)?.urlFinal ?? null
}

function fileNameFor(position: number): string | null {
    if (stagedFiles[position]) return stagedFiles[position].name
    const image = persistedImage(position)
    return image?.nombreOriginal ?? image?.nombreFinal ?? null
}

function revokeStagedPreview(position: number): void {
    if (stagedPreviews[position]) globalThis.URL.revokeObjectURL(stagedPreviews[position])
    delete stagedPreviews[position]
    delete stagedFiles[position]
}

function extensionPermitida(file: File): boolean {
    const nombre = file.name.toLowerCase()
    return ALLOWED_EXTENSIONS.some(ext => nombre.endsWith(ext))
}

function extractErrorMessage(error: unknown): string {
    const axiosErr = error as { response?: { data?: { detail?: string } } }
    return axiosErr?.response?.data?.detail || 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}

async function handleFile(position: Posicion, file: File): Promise<void> {
    if (props.disabled) return
    if (!extensionPermitida(file)) {
        toast.warning('Archivo no válido', 'Selecciona una imagen JPG, JPEG, PNG o WEBP.')
        return
    }

    if (!props.itemCode) {
        // Sin ItemCode todavía: solo vista previa local, se sube al guardar.
        revokeStagedPreview(position)
        stagedFiles[position] = file
        stagedPreviews[position] = globalThis.URL.createObjectURL(file)
        return
    }

    uploading[position] = true
    try {
        const resultado = await articuloService.subirImagenArticulo(
            props.itemCode,
            position,
            file
        )
        emitImageUpdate(position, resultado)
        toast.success('Imagen actualizada', `Se subió la imagen de la posición ${position}.`)
    } catch (error: unknown) {
        toast.error('No se pudo subir la imagen', extractErrorMessage(error))
    } finally {
        uploading[position] = false
    }
}

function emitImageUpdate(position: number, imagen: ImagenArticuloReferencia | null): void {
    const siguiente = props.images.filter(image => image.posicion !== position)
    if (imagen) siguiente.push(imagen)
    siguiente.sort((left, right) => left.posicion - right.posicion)
    emit('update:images', siguiente)
}

async function removeImage(position: Posicion): Promise<void> {
    if (props.disabled) return

    if (isStaged(position)) {
        revokeStagedPreview(position)
        return
    }

    if (!persistedImage(position) || !props.itemCode) return

    uploading[position] = true
    try {
        await articuloService.eliminarImagenArticulo(props.itemCode, position)
        emitImageUpdate(position, null)
        toast.success('Imagen eliminada', `Se quitó la imagen de la posición ${position}.`)
    } catch (error: unknown) {
        toast.error('No se pudo eliminar la imagen', extractErrorMessage(error))
    } finally {
        uploading[position] = false
    }
}

function onFileInputChange(position: Posicion, event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
        handleFile(position, file)
    }
    input.value = ''
}

function onDrop(position: Posicion, event: DragEvent): void {
    dragOverPosition.value = null
    if (props.disabled) return
    const file = event.dataTransfer?.files?.[0]
    if (file) {
        handleFile(position, file)
    }
}

// Llamado por el formulario padre justo después de crear el artículo (ya con
// ItemCode), para subir las imágenes que quedaron en espera.
async function flushPendingUploads(nuevoItemCode: string): Promise<void> {
    const pendientes = Object.entries(stagedFiles) as unknown as [string, File][]
    if (!pendientes.length) return

    let actuales = [...props.images]
    for (const [posicionStr, file] of pendientes) {
        const posicion = Number(posicionStr) as 1 | 2 | 3
        try {
            const resultado = await articuloService.subirImagenArticulo(
                nuevoItemCode,
                posicion,
                file
            )
            actuales = actuales.filter(image => image.posicion !== posicion)
            actuales.push(resultado)
            revokeStagedPreview(posicion)
        } catch (error: unknown) {
            toast.error(
                `No se pudo subir la imagen de la posición ${posicion}`,
                extractErrorMessage(error)
            )
        }
    }
    actuales.sort((left, right) => left.posicion - right.posicion)
    emit('update:images', actuales)
}

defineExpose({ flushPendingUploads })

watch(
    () => props.itemCode,
    itemCode => {
        // Si el padre nos da un ItemCode nuevo (p. ej. tras crear el
        // artículo) y ya no quedan archivos en espera, no hay nada que hacer;
        // el propio padre es quien invoca flushPendingUploads explícitamente.
        if (itemCode) return
    }
)

onBeforeUnmount(() => {
    Object.keys(stagedPreviews).forEach(position => revokeStagedPreview(Number(position)))
})
</script>
