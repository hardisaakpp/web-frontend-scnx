<template>
    <Teleport to="body">
        <div class="fixed inset-0 z-50 flex items-center justify-center">
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>

            <!-- Modal Content -->
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Carga Masiva de Artículos</h2>
                    <button @click="handleClose" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <!-- Body -->
                <div class="px-6 py-5 overflow-y-auto flex-1 space-y-5">

                    <!-- Paso 1: Seleccionar Acción -->
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">1. ¿Qué deseas hacer?</p>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="tipoCarga" value="crear" @change="handleTipoCargaChange" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                <span class="text-sm text-gray-700 dark:text-gray-300">Crear productos</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="tipoCarga" value="actualizar" @change="handleTipoCargaChange" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                <span class="text-sm text-gray-700 dark:text-gray-300">Modificar productos</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" v-model="tipoCarga" value="actualizar_precios" @change="handleTipoCargaChange" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                <span class="text-sm text-gray-700 dark:text-gray-300">Actualizar listas de precios</span>
                            </label>
                        </div>
                    </div>

                    <!-- Paso 2: Descargar Plantilla -->
                    <div class="flex items-center gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-blue-900 dark:text-blue-200">2. Descarga la plantilla de {{ ETIQUETA_TIPO_CARGA[tipoCarga] }}</p>
                            <p class="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Utiliza esta plantilla para garantizar la versión y los campos correctos.</p>
                            <p v-if="tipoCarga === 'actualizar_precios'" class="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                Permite actualizar Minorista (1), Internacional (4), Tecnología (5) u otras listas de SAP por ItemCode.
                            </p>
                        </div>
                        <button
                            @click="handleDownloadTemplate"
                            :disabled="downloadingTemplate"
                            class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                        >
                            {{ downloadingTemplate ? 'Descargando...' : 'Descargar .xlsx' }}
                        </button>
                    </div>

                    <!-- Paso 3: Subir Archivo -->
                    <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">3. Sube el archivo completado</p>
                        <div
                            class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
                            :class="dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'"
                            @dragover.prevent="dragOver = true"
                            @dragleave.prevent="dragOver = false"
                            @drop.prevent="onDrop"
                        >
                            <input ref="fileInputRef" type="file" accept=".xlsx" aria-label="Seleccionar archivo Excel" class="hidden" @change="onFileSelect" />
                            <div v-if="!selectedFile" class="space-y-2">
                                <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Arrastra tu archivo aquí o <button type="button" @click="fileInputRef?.click()" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">selecciona uno</button></p>
                                <p class="text-xs text-gray-400">.xlsx</p>
                            </div>
                            <div v-else class="flex items-center justify-center gap-3">
                                <svg class="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <span class="text-sm text-gray-900 dark:text-white font-medium">{{ selectedFile.name }}</span>
                                <button type="button" @click="resetCarga" class="text-xs text-red-500 hover:underline">Quitar</button>
                            </div>
                        </div>
                        <p class="text-[10px] text-gray-400 mt-1 italic">* Solo se admite el formato .xlsx</p>
                    </div>

                    <!-- Paso 4 (opcional, solo creación): ZIP de imágenes -->
                    <div v-if="tipoCarga === 'crear'">
                        <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            4. Adjunta el ZIP de imágenes (opcional)
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Si las columnas foto1/foto2/foto3 de la plantilla llevan nombres de archivo, adjunta aquí el .zip que los contiene.
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            También puedes nombrar tus imágenes en el ZIP con el Código de Proveedor (ej: <code class="font-mono">4656.png</code>, <code class="font-mono">4656_1.png</code>, <code class="font-mono">4656_2.png</code>) y dejar las columnas foto1, foto2, foto3 vacías en el Excel. El sistema las vinculará automáticamente.
                        </p>
                        <div
                            class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
                            :class="dragOverZip ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'"
                            @dragover.prevent="dragOverZip = true"
                            @dragleave.prevent="dragOverZip = false"
                            @drop.prevent="onZipDrop"
                        >
                            <input ref="zipInputRef" type="file" accept=".zip" aria-label="Seleccionar archivo ZIP de imágenes" class="hidden" @change="onZipSelect" />
                            <div v-if="!selectedZip" class="space-y-2">
                                <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"/></svg>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Arrastra el .zip aquí o <button type="button" @click="zipInputRef?.click()" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">selecciona uno</button></p>
                            </div>
                            <div v-else class="flex items-center justify-center gap-3">
                                <svg class="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <span class="text-sm text-gray-900 dark:text-white font-medium">{{ selectedZip.name }}</span>
                                <button type="button" @click="resetZip" class="text-xs text-red-500 hover:underline">Quitar</button>
                            </div>
                        </div>
                    </div>

                    <!-- Panel de Diagnóstico (pre-vuelo) -->
                    <div v-if="!importStore.trabajo && importStore.estadoSimulacion !== 'IDLE'">
                        <div
                            v-if="importStore.estadoSimulacion === 'SIMULANDO'"
                            class="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-600 dark:text-gray-300"
                        >
                            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Verificando archivo...
                        </div>

                        <div
                            v-else-if="importStore.estadoSimulacion === 'VALIDO'"
                            class="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300"
                        >
                            Lote listo: {{ importStore.resumenSimulacion?.totalFilas }} artículos verificados sin errores.
                        </div>

                        <div v-else-if="importStore.estadoSimulacion === 'CON_ERRORES'" class="space-y-2">
                            <div class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between gap-3">
                                <span>
                                    {{ importStore.resumenSimulacion?.filasConError }} de
                                    {{ importStore.resumenSimulacion?.totalFilas }} filas contienen errores que impiden la carga.
                                </span>
                                <button
                                    type="button"
                                    @click="handleDescargarReportePreliminar"
                                    class="text-xs font-medium text-red-700 dark:text-red-400 underline whitespace-nowrap"
                                >
                                    Descargar reporte
                                </button>
                            </div>
                            <div class="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table class="w-full text-xs text-left">
                                    <thead class="bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 sticky top-0">
                                        <tr>
                                            <th class="px-3 py-1.5 font-medium">Fila</th>
                                            <th class="px-3 py-1.5 font-medium">Campo</th>
                                            <th class="px-3 py-1.5 font-medium">Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                                        <tr v-for="(err, index) in importStore.resumenSimulacion?.errores ?? []" :key="index">
                                            <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">{{ err.numeroFila ?? '—' }}</td>
                                            <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">{{ err.campoError ?? '—' }}</td>
                                            <td class="px-3 py-1.5 text-gray-700 dark:text-gray-300">{{ err.mensaje }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <ImportacionProgreso v-if="importStore.trabajo" />

                    <!-- Error general (red, servidor, etc.) -->
                    <div v-if="cargaError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        {{ cargaError }}
                    </div>
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        v-if="importStore.isTerminal || cargaError"
                        @click="prepararOtraCarga"
                        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors mr-auto"
                    >
                        Cargar otro archivo
                    </button>
                    <button
                        @click="handleClose"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        {{ importStore.trabajo ? 'Cerrar' : 'Cancelar' }}
                    </button>
                    <button
                        v-if="!importStore.trabajo && !importStore.archivoVerificado"
                        @click="handleVerificar"
                        :disabled="!selectedFile || importStore.estadoSimulacion === 'SIMULANDO'"
                        class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                    >
                        <svg v-if="importStore.estadoSimulacion === 'SIMULANDO'" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        {{ importStore.estadoSimulacion === 'SIMULANDO' ? 'Verificando...' : 'Verificar Archivo' }}
                    </button>
                    <button
                        v-if="!importStore.trabajo && importStore.archivoVerificado"
                        @click="handleUpload"
                        :disabled="uploading"
                        class="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                    >
                        <svg v-if="uploading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        {{ uploading ? 'Procesando...' : `Importar Definitivo (${importStore.resumenSimulacion?.totalFilas ?? 0} Artículos)` }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useImportacionArticulosStore } from '../stores/importacionArticulosStore'
import {
    articuloService,
    type TipoCargaMasiva
} from '../services/articuloService'
import ImportacionProgreso from './ImportacionProgreso.vue'

const emit = defineEmits<(event: 'close') => void>()

const importStore = useImportacionArticulosStore()

const ETIQUETA_TIPO_CARGA: Record<TipoCargaMasiva, string> = {
    crear: 'creación',
    actualizar: 'modificación',
    actualizar_precios: 'actualización de precios'
}

const tipoCarga = ref<TipoCargaMasiva>('crear')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const selectedZip = ref<File | null>(null)
const zipInputRef = ref<HTMLInputElement | null>(null)
const dragOverZip = ref(false)
const uploading = ref(false)
const downloadingTemplate = ref(false)
const cargaError = ref('')

function handleClose(): void {
    if (importStore.isTerminal) importStore.limpiar()
    emit('close')
}

function resetCarga(): void {
    selectedFile.value = null
    cargaError.value = ''
    if (fileInputRef.value) {
        fileInputRef.value.value = ''
    }
    resetZip()
}

function resetZip(): void {
    selectedZip.value = null
    if (zipInputRef.value) {
        zipInputRef.value.value = ''
    }
    importStore.resetVerificacion()
}

function selectZipFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.zip')) {
        selectedZip.value = null
        cargaError.value = 'El archivo de imágenes debe ser formato .zip'
        return
    }
    selectedZip.value = file
    cargaError.value = ''
    importStore.resetVerificacion()
}

function onZipSelect(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) selectZipFile(file)
}

function onZipDrop(event: DragEvent): void {
    dragOverZip.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) selectZipFile(file)
}

function handleTipoCargaChange(): void {
    resetCarga()
}

function prepararOtraCarga(): void {
    if (importStore.isTerminal) importStore.limpiar()
    resetCarga()
}

function selectExcelFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        selectedFile.value = null
        cargaError.value = 'Solo se permiten archivos .xlsx'
        return
    }

    selectedFile.value = file
    cargaError.value = ''
    importStore.resetVerificacion()
}

function onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
        selectExcelFile(file)
    }
}

function onDrop(event: DragEvent): void {
    dragOver.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) {
        selectExcelFile(file)
    }
}

async function handleDownloadTemplate(): Promise<void> {
    downloadingTemplate.value = true
    try {
        await articuloService.downloadTemplate(tipoCarga.value)
    } catch {
        cargaError.value = 'No se pudo descargar la plantilla.'
    } finally {
        downloadingTemplate.value = false
    }
}

async function handleVerificar(): Promise<void> {
    if (!selectedFile.value) return
    cargaError.value = ''
    try {
        await importStore.verificar(
            selectedFile.value,
            tipoCarga.value,
            tipoCarga.value === 'crear' ? selectedZip.value : null
        )
    } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        cargaError.value = axiosErr?.response?.data?.detail || 'No se pudo verificar el archivo. Verifica el formato e inténtalo de nuevo.'
    }
}

// No existe un jobId en el pre-vuelo (nada se persistió en el backend), así
// que a diferencia de descargarErroresImportacion/descargarErroresPlantilla
// (que piden el reporte a un job real) este CSV se arma en el propio
// navegador a partir de resumenSimulacion.errores.
function handleDescargarReportePreliminar(): void {
    // Mismo vocabulario de columnas que la hoja Detalle_Errores del backend
    // (ver reporte_errores_importacion.py) por consistencia entre ambas
    // superficies de error. A diferencia de esa hoja, este CSV sigue siendo
    // solo un log: el pre-vuelo no recibe los datos originales de cada fila,
    // así que no hay un archivo "Articulos" reimportable que generar aquí.
    const errores = importStore.resumenSimulacion?.errores ?? []
    const encabezado = ['Fila', 'Campo', 'Valor Recibido', 'Motivo del Error']
    const filas = errores.map(err => [
        err.numeroFila ?? '',
        err.campoError ?? '',
        err.valorRecibido ?? '',
        err.mensaje
    ])
    const csv = [encabezado, ...filas]
        .map(fila => fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(','))
        .join('\n')

    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = globalThis.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'reporte_preliminar_importacion.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    globalThis.URL.revokeObjectURL(url)
}

async function handleUpload(): Promise<void> {
    if (!selectedFile.value) return
    uploading.value = true
    cargaError.value = ''
    try {
        await importStore.iniciar(
            selectedFile.value,
            tipoCarga.value,
            tipoCarga.value === 'crear' ? selectedZip.value : null
        )
        selectedFile.value = null
        if (fileInputRef.value) fileInputRef.value.value = ''
        resetZip()
    } catch (err: unknown) {
        // Solo llega aquí si fue un error de red/servidor (no de validación)
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        cargaError.value = axiosErr?.response?.data?.detail || 'Error al procesar el archivo. Verifica el formato e inténtalo de nuevo.'
    } finally {
        uploading.value = false
    }
}
</script>
