<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-64px)]">
    
    <!-- Header -->
    <div class="flex-shrink-0 space-y-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors font-medium">Conciliación</router-link>
            <span class="text-gray-400">/</span>
            <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">Reportes</span>
            <span class="text-gray-400">/</span>
            <span class="text-sm text-gray-700 dark:text-gray-300 font-medium tracking-tight">Reporte Maestro</span>
          </div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white uppercase tracking-tight">Reporte Maestro Unificado</h1>
        </div>
      </div>

      <!-- Filtros Avanzados -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
          
          <div class="col-span-1 md:col-span-2 lg:col-span-2">
            <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Banco</label>
            <select v-model="filtros.id_banco" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow">
              <option :value="undefined">Todos los bancos</option>
              <option v-for="b in store.bancos" :key="b.id_banco" :value="b.id_banco">{{ b.nombre_banco }}</option>
            </select>
          </div>

          <div class="col-span-1">
             <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Desde</label>
             <input v-model="filtros.fecha_desde" type="date" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow" />
          </div>

          <div class="col-span-1">
             <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Hasta</label>
             <input v-model="filtros.fecha_hasta" type="date" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow" />
          </div>

          <div class="col-span-1 md:col-span-2 lg:col-span-1">
            <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Estado</label>
            <select v-model="filtros.estado" class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow">
              <option :value="undefined">Todos</option>
              <option value="CONCILIADO">Conciliado</option>
              <option value="PENDIENTE">Pendiente</option>
            </select>
          </div>

          <div class="col-span-1 md:col-span-2 lg:col-span-2 flex gap-2 justify-end">
            <button @click="buscar" :disabled="store.loading" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all disabled:opacity-50">
              {{ store.loading ? 'Buscando...' : 'Consultar' }}
            </button>
            <button @click="descargarExcel" :disabled="isDownloading" class="flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 justify-center">
              <svg v-if="!isDownloading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>{{ isDownloading ? '...' : 'Descargar Reporte' }}</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>

    <!-- Tabla de Resultados -->
    <div class="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col min-h-0">
      <div v-if="store.loading" class="flex-1 flex justify-center items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      
      <div v-else-if="!store.reporteMaestroList.length" class="flex-1 flex justify-center items-center text-gray-400 italic text-sm">
        No se encontraron resultados para los filtros seleccionados.
      </div>
      
      <div v-else class="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <table class="w-full text-[11px] text-left whitespace-nowrap">
          <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <tr class="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest border-b border-gray-200 dark:border-gray-700">
              <th class="px-4 py-3">Banco</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Origen</th>
              <th class="px-4 py-3">Referencia</th>
              <th class="px-4 py-3">Referencia 2</th>
              <th class="px-4 py-3">Descripción</th>
              <th class="px-4 py-3">Código Único</th>
              <th class="px-4 py-3">Observación</th>
              <th class="px-4 py-3">Estado</th>
              <th class="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <tr v-for="(m, idx) in store.reporteMaestroList" :key="idx" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ m.banco }}</td>
              <td class="px-4 py-2 text-gray-500">{{ m.fecha }}</td>
              <td class="px-4 py-2">
                <span :class="['px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', m.origen === 'SAP' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30']">
                  {{ m.origen }}
                </span>
              </td>
              <td class="px-4 py-2 font-mono text-gray-800 dark:text-gray-200">{{ m.referencia || '-' }}</td>
              <td class="px-4 py-2 font-mono text-gray-600 dark:text-gray-400">{{ m.referencia2 || '-' }}</td>
              <td class="px-4 py-2 text-gray-600 dark:text-gray-300 truncate max-w-[200px]" :title="m.descripcion || ''">{{ m.descripcion || '-' }}</td>
              <td class="px-4 py-2 font-mono text-xs text-gray-500">{{ m.codigo_unico || '-' }}</td>
              <td class="px-4 py-2 text-gray-500 truncate max-w-[150px]" :title="m.observacion || ''">{{ m.observacion || '-' }}</td>
              <td class="px-4 py-2">
                <span :class="['px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase border', m.estado === 'CONCILIADO' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800']">
                  {{ m.estado }}
                </span>
              </td>
              <td class="px-4 py-2 text-right font-black font-mono text-gray-900 dark:text-white tracking-tighter">${{ formatMonto(m.valor) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'
import type { ReporteMaestroParams } from '../types'

const store = useConciliacionStore()
const toast = useToast()

const filtros = reactive<ReporteMaestroParams>({
  id_banco: undefined,
  fecha_desde: '',
  fecha_hasta: '',
  estado: undefined,
})

const isDownloading = ref(false)

onMounted(async () => {
  if (!store.hasBancos) await store.fetchBancos()
  
  // Por defecto, últimos 15 días
  const d = new Date()
  filtros.fecha_hasta = d.toISOString().split('T')[0]
  d.setDate(d.getDate() - 15)
  filtros.fecha_desde = d.toISOString().split('T')[0]

  buscar()
})

async function buscar() {
  try {
    // Limpiamos undefined o strings vacíos
    const cleanFilters = Object.fromEntries(
      Object.entries(filtros).filter(([_, v]) => v !== undefined && v !== '')
    )
    await store.fetchReporteMaestro(cleanFilters)
  } catch (error: any) {
    toast.error('Error', error.message || 'No se pudo cargar el reporte maestro')
  }
}

async function descargarExcel() {
  isDownloading.value = true
  try {
    const cleanFilters = Object.fromEntries(
      Object.entries(filtros).filter(([_, v]) => v !== undefined && v !== '')
    )
    const blob = await store.descargarMaestroExcel(cleanFilters)
    
    // Crear un link temporal para la descarga del Blob
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Reporte_Maestro_${filtros.fecha_desde}_al_${filtros.fecha_hasta}.xlsx`)
    document.body.appendChild(link)
    link.click()
    
    // Limpiar
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
    
  } catch (error: any) {
    toast.error('Error', error.message || 'No se pudo generar el Excel')
  } finally {
    isDownloading.value = false
  }
}

const formatMonto = (m: number) => m.toLocaleString('en-US', { minimumFractionDigits: 2 })
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
</style>
