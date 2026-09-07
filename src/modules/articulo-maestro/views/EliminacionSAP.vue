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
            <div class="flex items-center gap-3">
                <router-link
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    to="/articulo-maestro/lista">
                    Gestión de Artículos
                </router-link>
                <router-link
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    to="/articulo-maestro">
                    Menú Principal
                </router-link>
            </div>
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
                        <label for="pullCodes" class="sr-only">Códigos para importar</label>
                        <textarea 
                            id="pullCodes"
                            v-model="pullCodes" 
                            rows="3" 
                            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ART-01, ART-02..."
                        ></textarea>
                        <div v-if="pullError" class="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2">
                            <span class="text-xs text-red-700 dark:text-red-400">{{ pullError }}</span>
                            <button @click="pullError = ''" class="text-red-500 hover:text-red-700 ml-2 text-xs font-medium">✕</button>
                        </div>
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
                        <label for="searchCode" class="sr-only">Filtrar por código</label>
                        <input 
                            id="searchCode"
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
                        <div v-if="actionError" class="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 mt-2 w-full">
                            <span class="text-xs text-red-700 dark:text-red-400">{{ actionError }}</span>
                            <button @click="actionError = ''" class="text-red-500 hover:text-red-700 ml-2 text-xs font-medium">✕</button>
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
                                <template v-if="loading">
                                    <tr v-for="i in 5" :key="i" class="animate-pulse">
                                        <td class="px-6 py-4"><div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td class="px-6 py-4"><div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td class="px-6 py-4"><div class="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td class="px-6 py-4"><div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td class="px-6 py-4"><div class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                                    </tr>
                                </template>
                                
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
                                        <label :for="'check-' + art.itemCode" class="sr-only">Seleccionar {{ art.itemCode }}</label>
                                        <input 
                                            :id="'check-' + art.itemCode"
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
                                        {{ art.uSxxSkuSinTalla ?? '-' }}
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
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ modalTitle }}</h2>
                            <p class="text-xs text-gray-500 mt-0.5">Resumen de la operación realizada en SAP</p>
                        </div>
                        <button @click="closeResultModal" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors">
                            Entendido
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div v-if="syncResult" class="overflow-y-auto p-6 space-y-6">
                        
                        <!-- CASO 1: Nueva estructura de Tarea / Novedades -->
                        <template v-if="syncResult.message || syncResult.tarea_id">
                            <!-- Message & Task ID -->
                            <div 
                                class="p-4 rounded-xl border flex items-start gap-4"
                                :class="syncResult.success ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'"
                            >
                                <div class="p-2 rounded-lg" :class="syncResult.success ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-amber-100 dark:bg-amber-800'">
                                    <svg v-if="syncResult.success" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                    <svg v-else class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold" :class="syncResult.success ? 'text-emerald-900 dark:text-emerald-300' : 'text-amber-900 dark:text-amber-300'">
                                        {{ syncResult.success ? 'Operación Iniciada' : 'Atención' }}
                                    </h3>
                                    <p class="text-sm mt-1" :class="syncResult.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'">
                                        {{ syncResult.message }}
                                    </p>
                                    <div v-if="syncResult.tarea_id" class="mt-3 flex items-center gap-2">
                                        <span class="px-2 py-1 bg-white/50 dark:bg-black/20 rounded text-xs font-mono font-bold">
                                            ID Tarea: #{{ syncResult.tarea_id }}
                                        </span>
                                        <router-link to="/articulo-maestro/historial-sap" class="text-xs underline hover:no-underline">
                                            Ver progreso en auditoría
                                        </router-link>
                                    </div>
                                </div>
                            </div>

                            <!-- Novedades Table -->
                            <div v-if="syncResult.novedades && syncResult.novedades.length > 0" class="space-y-3">
                                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    Artículos con observaciones
                                </h4>
                                <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <table class="w-full text-left text-sm">
                                        <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 font-semibold uppercase">
                                            <tr>
                                                <th class="px-4 py-3">ItemCode</th>
                                                <th class="px-4 py-3">Motivo / Observación</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                            <tr v-for="n in syncResult.novedades" :key="n.item_code">
                                                <td class="px-4 py-3 font-mono text-gray-900 dark:text-white">{{ n.item_code }}</td>
                                                <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {{ n.motivo }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </template>

                        <!-- CASO 2: Estructura antigua (Estadísticas) -->
                        <template v-else>
                            <div class="grid grid-cols-3 gap-4">
                                <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                                    <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ (syncResult as any).success }}</p>
                                    <p class="text-xs font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Correctos</p>
                                </div>
                                <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                                    <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ (syncResult as any).error }}</p>
                                    <p class="text-xs font-medium text-red-800 dark:text-red-400 uppercase tracking-wider">Errores</p>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ (syncResult as any).total }}</p>
                                    <p class="text-xs font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider">Total</p>
                                </div>
                            </div>
                            <!-- Details Table (Si existe el campo antiguo details) -->
                            <div v-if="(syncResult as any).details" class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <table class="w-full text-left text-sm">
                                    <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 font-semibold uppercase">
                                        <tr>
                                            <th class="px-4 py-3">ItemCode</th>
                                            <th class="px-4 py-3">Estado</th>
                                            <th class="px-4 py-3">Mensaje</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                        <tr v-for="d in (syncResult as any).details" :key="d.item_code">
                                            <td class="px-4 py-3 font-mono text-gray-900 dark:text-white">{{ d.item_code }}</td>
                                            <td class="px-4 py-3">
                                                <span 
                                                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                                    :class="d.status === 'Error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'"
                                                >
                                                    {{ d.status }}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{{ d.message }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </template>

                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal Confirmación Eliminación Masiva -->
        <Teleport to="body">
            <div v-if="pendingDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/50" @click="pendingDeleteConfirm = false"></div>
                <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-red-200 dark:border-red-800 w-full max-w-md mx-4 p-6">
                    <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">⚠ Confirmar Eliminación</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Vas a eliminar <strong class="text-gray-900 dark:text-white">{{ selectedCount }}</strong> artículo(s) de SAP y desactivarlos localmente. <strong>Esta acción es irreversible.</strong>
                    </p>
                    <div class="flex justify-end gap-3">
                        <button
                            @click="pendingDeleteConfirm = false"
                            class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            @click="confirmBulkDelete"
                            :disabled="processingAction"
                            class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                            {{ processingAction ? 'Eliminando...' : 'Sí, eliminar' }}
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
const pendingDeleteConfirm = ref(false)
const actionError = ref('')
const pullError = ref('')

const selectedCount = computed(() => selectedCodes.value.length)

const filteredArticulos = computed(() => {
    if (!searchCode.value) return articulosSincronizados.value
    const q = searchCode.value.trim().toUpperCase()
    return articulosSincronizados.value.filter(a => a.itemCode?.toUpperCase().includes(q))
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
    } catch {
        // error silencioso — la tabla muestra estado vacío
    } finally {
        loading.value = false
    }
}

function handleBulkDelete() {
    if (selectedCodes.value.length === 0) return
    pendingDeleteConfirm.value = true
}

async function confirmBulkDelete() {
    pendingDeleteConfirm.value = false
    processingAction.value = true
    actionError.value = ''
    try {
        const result = await sapService.deleteFromSap(selectedCodes.value)
        syncResult.value = result
        modalTitle.value = 'Resultado de Eliminación'
        showResultModal.value = true
        fetchSyncArticulos()
    } catch {
        actionError.value = 'Ocurrió un error al procesar la eliminación en SAP.'
    } finally {
        processingAction.value = false
    }
}

async function handlePullFromSap() {
    const codes = pullCodes.value
        .split(/[,\s]+/)
        .map(c => c.trim())
        .filter(c => c.length > 0)
    
    if (codes.length === 0) return

    processingPull.value = true
    pullError.value = ''
    try {
        const result = await sapService.pullFromSap(codes)
        syncResult.value = result
        modalTitle.value = 'Importación desde SAP'
        showResultModal.value = true
        pullCodes.value = ''
        fetchSyncArticulos()
    } catch {
        pullError.value = 'Error al importar desde SAP.'
    } finally {
        processingPull.value = false
    }
}

function closeResultModal() {
    showResultModal.value = false
}
</script>
