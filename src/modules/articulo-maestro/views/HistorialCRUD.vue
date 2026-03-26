<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Auditoría: Cambios Locales (CRUD)</h1>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Historial de inserciones, actualizaciones y eliminaciones en el sistema local
                </p>
            </div>
            <router-link
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                to="/articulo-maestro">
                Volver
            </router-link>
        </div>

        <!-- Filtros -->
        <div class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center gap-4">
            <div class="flex-1 min-w-[300px]">
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input 
                        v-model="searchCode" 
                        type="text" 
                        placeholder="Filtrar por ItemCode..." 
                        class="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                        @keyup.enter="handleSearch"
                    />
                </div>
            </div>
            <button 
                @click="handleSearch"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                :disabled="loading"
            >
                Buscar
            </button>
            <button 
                @click="resetFilters"
                class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700"
            >
                Limpiar
            </button>
        </div>

        <!-- Tabla -->
        <div class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-[400px]">
            <div class="overflow-x-auto selection-none">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <tr>
                            <th class="px-6 py-3">ID</th>
                            <th class="px-6 py-3">ItemCode</th>
                            <th class="px-6 py-3">Acción</th>
                            <th class="px-6 py-3">Usuario</th>
                            <th class="px-6 py-3">IP Origen</th>
                            <th class="px-6 py-3">Origen</th>
                            <th class="px-6 py-3">Fecha</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                        <tr v-if="loading" v-for="i in 10" :key="i" class="animate-pulse">
                            <td class="px-6 py-4"><div class="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td class="px-6 py-4"><div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td class="px-6 py-4"><div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td class="px-6 py-4"><div class="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td class="px-6 py-4"><div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td class="px-6 py-4"><div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td class="px-6 py-4"><div class="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                        </tr>
                        
                        <tr v-else-if="records.length === 0">
                            <td colspan="7" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                No se encontraron registros de auditoría.
                            </td>
                        </tr>

                        <tr v-for="record in records" :key="record.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td class="px-6 py-4 text-xs font-mono text-gray-400">{{ record.id }}</td>
                            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ record.item_code }}</td>
                            <td class="px-6 py-4">
                                <span 
                                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                    :class="getAccionClass(record.accion)"
                                >
                                    {{ record.accion }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-xs">{{ record.usuario }}</td>
                            <td class="px-6 py-4 text-xs font-mono">{{ record.ip_origen || '-' }}</td>
                            <td class="px-6 py-4 text-xs">
                                <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{{ record.origen }}</span>
                            </td>
                            <td class="px-6 py-4 text-xs text-gray-500">{{ formatDate(record.fecha) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginación -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p class="text-xs text-gray-500">
                    Mostrando {{ records.length }} de {{ total }} registros
                </p>
                <div class="flex items-center gap-2">
                    <button 
                        @click="handlePageChange(currentPage - 1)" 
                        :disabled="currentPage === 1 || loading"
                        class="px-3 py-1 rounded border border-gray-300 text-xs hover:bg-white disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span class="text-xs font-medium">Página {{ currentPage }} de {{ totalPages }}</span>
                    <button 
                        @click="handlePageChange(currentPage + 1)" 
                        :disabled="currentPage >= totalPages || loading"
                        class="px-3 py-1 rounded border border-gray-300 text-xs hover:bg-white disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { historialService } from '../services/articuloService'
import type { HistorialLocalRecord } from '../services/articuloService'

const records = ref<HistorialLocalRecord[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(15)
const searchCode = ref('')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

onMounted(() => {
    fetchHistory()
})

async function fetchHistory() {
    loading.value = true
    try {
        const response = await historialService.getLocalHistory(
            currentPage.value, 
            pageSize.value, 
            searchCode.value.trim() || undefined
        )
        records.value = response.data
        total.value = response.total
    } catch (err) {
        console.error('Error fetching local history:', err)
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    currentPage.value = 1
    fetchHistory()
}

function resetFilters() {
    searchCode.value = ''
    currentPage.value = 1
    fetchHistory()
}

function handlePageChange(page: number) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    fetchHistory()
}

function getAccionClass(accion: string) {
    switch(accion) {
        case 'INSERT': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
        case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
        case 'DELETE': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
        default: return 'bg-gray-100 text-gray-700'
    }
}

function formatDate(date: string | null) {
    if (!date) return 'Sin fecha'
    return new Date(date).toLocaleString()
}
</script>