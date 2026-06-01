<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useReposicionStore } from '../stores/reposicionStore'
import reposicionApi from '../services/reposicionApi'
import type { HistorialCabecera } from '../types'
import { 
  ArrowLeftIcon, 
  CalendarIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

const store = useReposicionStore()
const historial = ref<HistorialCabecera[]>([])
const loading = ref(false)

const fechaDesde = ref(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
const fechaHasta = ref(new Date().toISOString().split('T')[0])

const fetchHistorial = async () => {
  loading.value = true
  try {
    historial.value = await reposicionApi.getHistorial(fechaDesde.value, fechaHasta.value)
  } catch (err) {
    console.error('Error al cargar historial', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHistorial()
})

const getStatusClass = (integrado: boolean) => {
  return integrado 
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    : 'bg-amber-100 text-amber-700 border-amber-200'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <router-link to="/reposiciones" class="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
          <ArrowLeftIcon class="w-6 h-6" />
        </router-link>
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Historial de Reposiciones</h1>
          <p class="text-gray-500 mt-1">Consulta tus solicitudes pasadas y su estado de integración.</p>
        </div>
      </div>

      <div class="flex items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm gap-2">
        <div class="flex items-center px-4 py-2 border-r border-gray-100 gap-2">
          <CalendarIcon class="w-5 h-5 text-gray-400" />
          <input type="date" v-model="fechaDesde" class="border-none focus:ring-0 p-0 text-sm font-medium text-gray-700" />
        </div>
        <div class="flex items-center px-4 py-2 gap-2">
          <CalendarIcon class="w-5 h-5 text-gray-400" />
          <input type="date" v-model="fechaHasta" class="border-none focus:ring-0 p-0 text-sm font-medium text-gray-700" />
        </div>
        <button 
          @click="fetchHistorial"
          class="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm ml-2"
        >
          Filtrar
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/50 border-b border-gray-100">
            <th class="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Solicitud</th>
            <th class="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">ID</th>
            <th class="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Flujo</th>
            <th class="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Artículos</th>
            <th class="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
            <td v-for="j in 6" :key="j" class="px-8 py-6"><div class="h-4 bg-gray-100 rounded w-full"></div></td>
          </tr>
          <tr v-else-if="historial.length === 0">
            <td colspan="6" class="px-8 py-20 text-center text-gray-400">
              <DocumentTextIcon class="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p class="text-lg font-medium">No se encontraron registros en este periodo.</p>
            </td>
          </tr>
          <tr v-for="item in historial" :key="item.id" class="hover:bg-gray-50/50 transition-all group">
            <td class="px-8 py-6">
              <div class="flex items-center gap-3">
                <div class="bg-indigo-50 p-2 rounded-xl">
                  <DocumentTextIcon class="w-5 h-5 text-indigo-400" />
                </div>
                <span class="text-sm font-semibold text-gray-900">{{ formatDate(item.fecha) }}</span>
              </div>
            </td>
            <td class="px-8 py-6 text-center">
              <span class="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">#{{ item.id }}</span>
            </td>
            <td class="px-8 py-6">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-600">{{ item.fromWhs }}</span>
                <span class="text-gray-300">→</span>
                <span class="text-sm font-bold text-indigo-600">{{ item.toWhs }}</span>
              </div>
            </td>
            <td class="px-8 py-6 text-center">
              <span class="text-sm font-bold text-gray-900">{{ item.cantidadArticulos }}</span>
            </td>
            <td class="px-8 py-6">
              <div :class="[getStatusClass(item.integrado), 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider']">
                <CheckBadgeIcon v-if="item.integrado" class="w-3.5 h-3.5" />
                <ClockIcon v-else class="w-3.5 h-3.5" />
                {{ item.integrado ? 'Integrado' : 'Pendiente' }}
              </div>
            </td>
            <td class="px-8 py-6 text-right">
              <button class="text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors">
                Ver detalle
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
