<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Eliminación en SAP</h1>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Gestión de artículos para eliminar del ERP Externo (SAP) e inactivar en el sistema local.
                </p>
            </div>
            <router-link
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                to="/articulo-maestro">
                Volver al listado
            </router-link>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            <!-- Panel Izquierdo: Acciones y Notas -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Info de Advertencia -->
                <div class="bg-red-50 dark:bg-red-900/10 rounded-xl p-5 border border-red-100 dark:border-red-800/50">
                    <h3 class="text-sm font-semibold text-red-900 dark:text-red-300 mb-3 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        Advertencia Crítica
                    </h3>
                    <p class="text-xs text-red-800 dark:text-red-400 leading-relaxed">
                        Esta acción <strong>eliminará permanentemente</strong> el artículo de SAP Service Layer e <strong>inactivará</strong> el registro en este sistema.
                        <br><br>
                        Solo los artículos con estado <strong>SINCRONIZADO</strong> aparecerán en esta lista para ser eliminados.
                    </p>
                </div>

                <!-- Card: Traer desde SAP -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                            Traer desde SAP
                        </h2>
                    </div>
                    <div class="px-6 py-5 space-y-4">
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Ingresa los ItemCode para importarlos o asegurar que existen en el ERP antes de eliminar.
                        </p>
                        <textarea 
                            v-model="pullCodes" 
                            rows="3" 
                            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ART-01, ART-02..."
                        ></textarea>
                        <button 
                            @click="handlePullFromSap"
                            :disabled="!pullCodes.trim() || processingPull"
                            class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <svg v-if="processingPull" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            {{ processingPull ? 'Importando...' : 'Traer del SAP' }}
                        </button>
                    </div>
                </div>

                <!-- Card: Buscar Código Específico -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Filtrar por Código</h2>
                    </div>
                    <div class="px-6 py-5 space-y-4">
                        <input 
                            v-model="searchCode" 
                            type="text"
                            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 text-sm focus:ring-red-500 focus:border-red-500"
                            placeholder="Buscar ItemCode..."
                        />
                    </div>
                </div>
            </div>

            <!-- Panel Derecho: Tabla de Artículos Sincronizados -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px]">
                    <!-- Toolbar Tabla -->
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Artículos Disponibles para Eliminar</h2>
                            <span v-if="selectedCount > 0" class="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded text-xs font-medium">
                                {{ selectedCount }} seleccionados
                            </span>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <button 
                                @click="fetchSyncArticulos" 
                                class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Refrescar lista"
                                :disabled="loading"
                            >
                                <svg class="w-5 h-5" :class="loading ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            </button>
                            
                            <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                            <button 
                                @click="handleBulkDelete"
                                :disabled="selectedCount === 0 || processingAction"
                                class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                            >
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                Eliminar de SAP
                            </button>
                        </div>
                    </div>

                    <!-- Tabla -->
                    <div class="flex-1 overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th class="px-6 py-3 w-10">
                                        <!-- Checkbox individual únicamente -->
                                    </th>
                                    <th class="px-6 py-3">ItemCode</th>
                                    <th class="px-6 py-3">Nombre</th>
                                    <th class="px-6 py-3">Referencia</th>
                                    <th class="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
                                    <td class="px-6 py-4"><div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td class="px-6 py-4"><div class="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td class="px-6 py-4"><div class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                                </tr>
                                
                                <tr v-else-if="filteredArticulos.length === 0">
                                    <td colspan="5" class="px-6 py-12 text-center">
                                        <div class="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h.01M12 12h.01M15 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                            <p class="text-base font-medium">No hay artículos sincronizados disponibles</p>
                                            <p class="text-sm">Solo se pueden eliminar artículos que ya existan en SAP.</p>
                                        </div>
                                    </td>
                                </tr>

                                <tr 
                                    v-for="art in filteredArticulos" 
                                    :key="art.itemCode"
                                    class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    :class="selectedCodes.includes(art.itemCode) ? 'bg-red-50/30 dark:bg-red-900/10' : ''"
                                >
                                    <td class="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            :value="art.itemCode" 
                                            v-model="selectedCodes"
                                            class="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                    </td>
                                    <td class="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">
                                        {{ art.itemCode }}
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="truncate max-w-xs text-xs" :title="art.itemName">
                                            {{ art.itemName }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-xs">
                                        {{ art.uSxxSkuSinTalla || '-' }}
                                    </td>
                                    <td class="px-6 py-4 text-xs font-medium text-gray-400">
                                        <!-- SINCRONIZADO implícito -->
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Resultados de Eliminación -->
        <Teleport to="body">
            <div v-if="showResultModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeResultModal"></div>
                <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl flex flex-col max-h-[90vh]">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ modalTitle }}</h2>
                            <p class="text-xs text-gray-500 mt-0.5">Resumen de la operación en SAP</p>
                        </div>
                        <button @click="closeResultModal" class="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <div v-if="syncResult" class="overflow-y-auto p-6 space-y-6">
                        <div class="grid grid-cols-3 gap-4">
                            <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                                <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ syncResult.success }}</p>
                                <p class="text-xs font-medium uppercase text-emerald-800 dark:text-emerald-400">Correctos</p>
                            </div>
                            <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                                <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ syncResult.error }}</p>
                                <p class="text-xs font-medium uppercase text-red-800 dark:text-red-400">Errores</p>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ syncResult.total }}</p>
                                <p class="text-xs font-medium uppercase text-gray-800 dark:text-gray-400">Total</p>
                            </div>
                        </div>

                        <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50 dark:bg-gray-900/50 text-[10px] text-gray-500 font-bold uppercase">
                                    <tr>
                                        <th class="px-4 py-2">ItemCode</th>
                                        <th class="px-4 py-2">Estado</th>
                                        <th class="px-4 py-2">Mensaje</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                    <tr v-for="d in syncResult.details" :key="d.item_code">
                                        <td class="px-4 py-2 font-mono text-xs">{{ d.item_code }}</td>
                                        <td class="px-4 py-2">
                                            <span 
                                                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                                :class="d.status === 'Error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
                                            >
                                                {{ d.status }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-2 text-xs text-gray-500">{{ d.message }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                        <button @click="closeResultModal" class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold">Entendido</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { articuloService, sapService } from '../services/articuloService'
import type { Articulo } from '../types'
import type { SapSyncResponse } from '../services/articuloService'

const articulosSincronizados = ref<Articulo[]>([])
const loading = ref(false)
const selectedCodes = ref<string[]>([])
const searchCode = ref('')
const pullCodes = ref('')
const processingPull = ref(false)
const processingAction = ref(false)

const showResultModal = ref(false)
const syncResult = ref<SapSyncResponse | null>(null)
const modalTitle = ref('')

const selectedCount = computed(() => selectedCodes.value.length)
const allSelected = computed(() => 
    articulosSincronizados.value.length > 0 && selectedCodes.value.length === articulosSincronizados.value.length
)

const filteredArticulos = computed(() => {
    if (!searchCode.value) return articulosSincronizados.value
    const q = searchCode.value.trim().toUpperCase()
    return articulosSincronizados.value.filter(a => a.itemCode.toUpperCase().includes(q))
})

onMounted(() => {
    fetchSyncArticulos()
})

async function fetchSyncArticulos() {
    loading.value = true
    try {
        // Filtrar específicamente por estado=SINCRONIZADO como se detalla en endpoints.temp
        const data = await articuloService.getArticulosByEstado(['SINCRONIZADO'])
        articulosSincronizados.value = data
        selectedCodes.value = []
    } catch (err) {
        console.error('Error al cargar artículos sincronizados:', err)
    } finally {
        loading.value = false
    }
}

function toggleSelectAll() {
    selectedCodes.value = allSelected.value ? [] : articulosSincronizados.value.map(art => art.itemCode)
}

async function handleBulkDelete() {
    if (selectedCodes.value.length === 0) return
    
    if (!confirm(`¿ESTÁS SEGURO?\n\nVas a eliminar ${selectedCount.value} artículos de SAP y desactivarlos localmente. Esta acción es irreversible.`)) {
        return
    }

    processingAction.value = true
    try {
        // Usar el endpoint de eliminación en SAP (delete-from-sap)
        const result = await sapService.deleteFromSap(selectedCodes.value)
        syncResult.value = result
        modalTitle.value = 'Resultado de Eliminación'
        showResultModal.value = true
        fetchSyncArticulos()
    } catch (err) {
        console.error('Error en eliminación masiva:', err)
        alert('Ocurrió un error al procesar la eliminación en SAP.')
    } finally {
        processingAction.value = false
    }
}

async function handlePullFromSap() {
    const codes = pullCodes.value
        .split(/[,\s\n]+/)
        .map(c => c.trim())
        .filter(c => c.length > 0)
    
    if (codes.length === 0) return

    processingPull.value = true
    try {
        const result = await sapService.pullFromSap(codes)
        syncResult.value = result
        modalTitle.value = 'Importación desde SAP'
        showResultModal.value = true
        pullCodes.value = ''
        fetchSyncArticulos()
    } catch (err) {
        alert('Error al importar desde SAP.')
        console.error(err)
    } finally {
        processingPull.value = false
    }
}

function closeResultModal() {
    showResultModal.value = false
}
</script>
