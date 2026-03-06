<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Migración a SAP</h1>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Sincronización de artículos entre el sistema local y SAP
                </p>
            </div>
            <router-link
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                to="/articulo-maestro">
                Volver al listado
            </router-link>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            <!-- Panel Izquierdo: Acciones Generales -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Card: Importar desde SAP -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                            Traer desde SAP
                        </h2>
                    </div>
                    <div class="px-6 py-5 space-y-4">
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Ingresa los ItemCode separados por comas o saltos de línea para importarlos o actualizarlos desde SAP.
                        </p>
                        <textarea 
                            v-model="pullCodes" 
                            rows="4" 
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

                <!-- Card: Leyenda de Estados -->
                <div class="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 border border-blue-100 dark:border-blue-800/50">
                    <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">Información de Sincronización</h3>
                    <ul class="space-y-2 text-xs text-blue-800 dark:text-blue-400">
                        <li class="flex gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                            <span><strong>BORRADOR:</strong> Artículo nuevo que no existe en SAP.</span>
                        </li>
                        <li class="flex gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0"></span>
                            <span><strong>PENDIENTE:</strong> Listo para enviar o actualizar en SAP.</span>
                        </li>
                        <li class="flex gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></span>
                            <span><strong>ERROR:</strong> Falló el último intento de sincronización.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Panel Derecho: Tabla de Artículos Pendientes -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px]">
                    <!-- Toolbar Tabla -->
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Artículos Pendientes de SAP</h2>
                            <span v-if="selectedCount > 0" class="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-medium">
                                {{ selectedCount }} seleccionados
                            </span>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <button 
                                @click="fetchPending" 
                                class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Refrescar lista"
                                :disabled="loadingPending"
                            >
                                <svg class="w-5 h-5" :class="loadingPending ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            </button>
                            
                            <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                            <button 
                                @click="handleBulkAction('create')"
                                :disabled="selectedCount === 0 || processingAction"
                                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                            >
                                Crear en SAP
                            </button>
                            <button 
                                @click="handleBulkAction('update')"
                                :disabled="selectedCount === 0 || processingAction"
                                class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                            >
                                Actualizar en SAP
                            </button>
                            <button 
                                @click="handleBulkAction('delete')"
                                :disabled="selectedCount === 0 || processingAction"
                                class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                            >
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
                                        <input 
                                            type="checkbox" 
                                            :checked="allSelected" 
                                            @change="toggleSelectAll"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th class="px-6 py-3">ItemCode</th>
                                    <th class="px-6 py-3">Nombre</th>
                                    <th class="px-6 py-3">Estado Local</th>
                                    <th class="px-6 py-3">Origen</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                <tr v-if="loadingPending" v-for="i in 5" :key="i" class="animate-pulse">
                                    <td class="px-6 py-4"><div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td class="px-6 py-4"><div class="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td class="px-6 py-4"><div class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                                    <td class="px-6 py-4"><div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                </tr>
                                
                                <tr v-else-if="pendingArticulos.length === 0">
                                    <td colspan="5" class="px-6 py-12 text-center">
                                        <div class="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                            <p class="text-base font-medium">No hay artículos pendientes</p>
                                            <p class="text-sm">Todos los artículos están sincronizados con SAP.</p>
                                        </div>
                                    </td>
                                </tr>

                                <tr 
                                    v-for="art in pendingArticulos" 
                                    :key="art.itemCode"
                                    class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    :class="selectedCodes.includes(art.itemCode) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''"
                                >
                                    <td class="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            :value="art.itemCode" 
                                            v-model="selectedCodes"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                                    <td class="px-6 py-4">
                                        <span 
                                            class="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                                            :class="getStatusBadgeClass(art.controlSap?.estado || 'BORRADOR')"
                                        >
                                            {{ art.controlSap?.estado || 'BORRADOR' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-xs text-gray-500 uppercase">
                                        {{ art.uOrigen || '-' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Resultados de Sincronización -->
        <Teleport to="body">
            <div v-if="showResultModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeResultModal"></div>
                
                <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl flex flex-col max-h-[90vh]">
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ modalTitle }}</h2>
                            <p class="text-xs text-gray-500 mt-0.5">Resumen de la operación realizada en SAP</p>
                        </div>
                        <button @click="closeResultModal" class="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div v-if="syncResult" class="overflow-y-auto p-6 space-y-6">
                        <!-- Stats -->
                        <div class="grid grid-cols-3 gap-4">
                            <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                                <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ syncResult.success }}</p>
                                <p class="text-xs font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Correctos</p>
                            </div>
                            <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                                <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ syncResult.error }}</p>
                                <p class="text-xs font-medium text-red-800 dark:text-red-400 uppercase tracking-wider">Errores</p>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ syncResult.total }}</p>
                                <p class="text-xs font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider">Total</p>
                            </div>
                        </div>

                        <!-- Details Table -->
                        <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 font-semibold uppercase">
                                    <tr>
                                        <th class="px-4 py-3">ItemCode</th>
                                        <th class="px-4 py-3">Estado</th>
                                        <th class="px-4 py-3">Mensaje</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                    <tr v-for="d in syncResult.details" :key="d.item_code">
                                        <td class="px-4 py-3 font-mono text-gray-900 dark:text-white">{{ d.item_code }}</td>
                                        <td class="px-4 py-3">
                                            <span 
                                                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                                :class="d.status === 'Error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'"
                                            >
                                                {{ d.status }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                                            {{ d.message }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                        <button 
                            @click="closeResultModal" 
                            class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            Entendido
                        </button>
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

// Estados
const pendingArticulos = ref<Articulo[]>([])
const loadingPending = ref(false)
const selectedCodes = ref<string[]>([])
const pullCodes = ref('')
const processingPull = ref(false)
const processingAction = ref(false)

// Modales
const showResultModal = ref(false)
const syncResult = ref<SapSyncResponse | null>(null)
const modalTitle = ref('')

// Computed
const selectedCount = computed(() => selectedCodes.value.length)
const allSelected = computed(() => 
    pendingArticulos.value.length > 0 && 
    selectedCodes.value.length === pendingArticulos.value.length
)

// Cargar pendientes al montar
onMounted(() => {
    fetchPending()
})

async function fetchPending() {
    loadingPending.value = true
    try {
        // Obtenemos los que no están en SAP o tienen errores
        const data = await articuloService.getArticulosByEstado(['BORRADOR', 'ERROR', 'PENDIENTE'])
        pendingArticulos.value = data
        selectedCodes.value = [] // Limpiar selección tras refrescar
    } catch (err) {
        console.error('Error al cargar pendientes:', err)
    } finally {
        loadingPending.value = false
    }
}

function toggleSelectAll() {
    if (allSelected.value) {
        selectedCodes.value = []
    } else {
        selectedCodes.value = pendingArticulos.value.map(art => art.itemCode)
    }
}

function getStatusBadgeClass(status: string) {
    switch (status) {
        case 'BORRADOR': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-700'
        case 'PENDIENTE': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
        case 'ERROR': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
        default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
}

// Acciones Masivas
async function handlePullFromSap() {
    // Limpiar códigos e intentar procesar. Acepta comas, espacios o saltos de línea.
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
        fetchPending() // Refrescar lista local
    } catch (err) {
        alert('Ocurrió un error al intentar importar desde SAP.')
        console.error(err)
    } finally {
        processingPull.value = false
    }
}

async function handleBulkAction(action: 'create' | 'update' | 'delete') {
    if (selectedCodes.value.length === 0) return
    
    const confirmMsg = {
        'create': '¿Deseas enviar a crear estos artículos en SAP?',
        'update': '¿Deseas actualizar estos artículos en SAP con la info local?',
        'delete': '¿Deseas intentar ELIMINAR estos artículos de SAP?'
    }[action]

    if (!confirm(confirmMsg)) return

    processingAction.value = true
    try {
        let result: SapSyncResponse
        
        if (action === 'create') {
            // Usamos syncOrUpdate para ser más robustos (si ya existe, lo actualiza)
            result = await sapService.syncOrUpdate(selectedCodes.value)
            modalTitle.value = 'Creación / Sincronización en SAP'
        } else if (action === 'update') {
            result = await sapService.updateInSap(selectedCodes.value)
            modalTitle.value = 'Actualización en SAP'
        } else {
            result = await sapService.deleteFromSap(selectedCodes.value)
            modalTitle.value = 'Eliminación en SAP'
        }

        syncResult.value = result
        showResultModal.value = true
        fetchPending() // Refrescar lista
    } catch (err) {
        alert('Error al procesar la acción en SAP.')
        console.error(err)
    } finally {
        processingAction.value = false
    }
}

function closeResultModal() {
    showResultModal.value = false
    // syncResult.value = null // Dejarlo para que no parpadee al cerrar
}
</script>

<style scoped>
/* Transiciones suaves */
.modal-enter-active, .modal-leave-active {
    transition: opacity 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
    opacity: 0;
}
</style>