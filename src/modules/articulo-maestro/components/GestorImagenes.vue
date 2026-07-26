<template>
    <div class="space-y-6">
        <!-- Título y Descripción -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Gestión de Imágenes</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Sube imágenes para el artículo. El formato de nombre sugerido es <code>[Código_Interno]-[0-9].jpg</code>
                </p>
            </div>
            <!-- Botón opcional para reglas de nombrado -->
        </div>

        <!-- Zona de Drag and Drop -->
        <div 
            class="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all"
            :class="[
                isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
        >
            <div class="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                <svg class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span class="font-semibold text-blue-600 dark:text-blue-400">Haz clic para subir</span> o arrastra y suelta
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, JPEG (Máx. 5MB por imagen)</p>
            </div>
            <input 
                ref="fileInput"
                type="file" 
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                multiple 
                accept="image/jpeg, image/png, image/jpg"
                @change="handleFileSelect"
                :disabled="isUploading"
            />
        </div>

        <!-- Feedback de Carga (Spinner) -->
        <div v-if="isUploading" class="flex items-center justify-center py-8">
            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Subiendo {{ selectedFiles.length }} imágenes...</span>
        </div>

        <!-- Resumen de Carga (Multi-Status) -->
        <div v-if="uploadResponse && !isUploading" class="space-y-4">
            <!-- Banner de Éxito Parcial o Total -->
            <div 
                class="p-4 rounded-lg flex items-start gap-3"
                :class="uploadResponse.status === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'"
            >
                <svg v-if="uploadResponse.status === 'success'" class="w-6 h-6 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <svg v-else class="w-6 h-6 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                
                <div class="flex-1">
                    <h4 class="text-sm font-bold">
                        {{ uploadResponse.status === 'success' ? '¡Imágenes subidas con éxito!' : 'Carga con Novedades (Éxito Parcial)' }}
                    </h4>
                    <p class="text-sm mt-1">
                        Se procesaron <strong>{{ uploadResponse.summary.total_received }}</strong> imágenes: 
                        <span class="text-green-600 font-semibold">{{ uploadResponse.summary.successful }} exitosas</span> y 
                        <span class="text-red-600 font-semibold">{{ uploadResponse.summary.failed }} con errores</span>.
                    </p>
                </div>
            </div>

            <!-- Tabla de Errores (Si hay fallos) -->
            <div v-if="uploadResponse.errors && uploadResponse.errors.length > 0" class="overflow-hidden bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800/50 rounded-lg shadow-sm">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-red-50 dark:bg-red-900/10">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Archivo</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Motivo del Error</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr v-for="(err, index) in uploadResponse.errors" :key="index">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ err.file_name }}</td>
                            <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ err.reason }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- TODO: Grilla de Imágenes Existentes (Fase 2: Lectura de MinIO) -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Imágenes Actuales</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div class="text-sm text-gray-500 italic col-span-full">
                    No hay imágenes cargadas o la previsualización estará disponible próximamente.
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { imagenService } from '../services/articuloService'
import type { MultiStatusUploadResponse } from '../types'

const props = defineProps<{
    itemCode?: string
    sessionToken?: string
}>()

const isDragging = ref(false)
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const uploadResponse = ref<MultiStatusUploadResponse | null>(null)

const handleDrop = async (e: DragEvent) => {
    isDragging.value = false
    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length > 0) {
        await processFiles(files)
    }
}

const handleFileSelect = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files || [])
    if (files.length > 0) {
        await processFiles(files)
    }
    // Reset input
    if (fileInput.value) fileInput.value.value = ''
}

const processFiles = async (files: File[]) => {
    // Validaciones básicas de cliente
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
    if (validFiles.length === 0) {
        alert("Ningún archivo válido para subir. Asegúrate de que sean imágenes menores a 5MB.")
        return
    }

    selectedFiles.value = validFiles
    isUploading.value = true
    uploadResponse.value = null

    try {
        const response = await imagenService.uploadImages(validFiles, props.sessionToken)
        uploadResponse.value = response
    } catch (error) {
        console.error("Error al subir imágenes:", error)
        alert("Ocurrió un error inesperado de red o servidor al subir las imágenes.")
    } finally {
        isUploading.value = false
        selectedFiles.value = []
    }
}
</script>
