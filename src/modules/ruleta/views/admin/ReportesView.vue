<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { APP_LOCALE } from '@/plugins/locale'
import { useAdminStore } from '../../stores/adminStore'
import { ruletaService } from '../../services/ruletaApi'
import type { HistorialGiroItem } from '../../types'
import VolverButton from '@/components/VolverButton.vue'

const store = useAdminStore()

const campanaSeleccionadaId = ref<string | null>(null)
const registros = ref<HistorialGiroItem[]>([])
const totalRegistros = ref(0)
const totalPaginas = ref(0)
const paginaActual = ref(1)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const PAGE_SIZE = 15

onMounted(async () => {
  await store.cargarCampanas()
  if (store.campanas.length > 0) {
    campanaSeleccionadaId.value = store.campanas[0].id
    await cargarPagina(1)
  }
})

async function onCampanaChange(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  if (!id) return
  campanaSeleccionadaId.value = id
  await cargarPagina(1)
}

async function cargarPagina(pagina: number) {
  if (!campanaSeleccionadaId.value) return
  loading.value = true
  errorMsg.value = null
  try {
    const res = await ruletaService.getHistorialGiros(campanaSeleccionadaId.value, pagina, PAGE_SIZE)
    registros.value = res.items
    totalRegistros.value = res.totalRegistros
    totalPaginas.value = res.totalPaginas
    paginaActual.value = res.paginaActual
  } catch {
    errorMsg.value = 'Error al cargar el historial.'
    registros.value = []
  } finally {
    loading.value = false
  }
}

async function exportarCsv() {
  if (!campanaSeleccionadaId.value) return
  await ruletaService.exportarGirosCsv(campanaSeleccionadaId.value)
}

const TIPO_LABELS: Record<string, string> = {
  Fisico: 'Físico', Digital: 'Digital', Descuento: 'Descuento', SinPremio: 'Sin premio'
}
</script>

<template>
  <div class="space-y-5">

    <VolverButton to="/ruleta/admin" label="Administración" />

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Reportes y exportación</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Historial de participaciones por campaña.</p>
      </div>
      <!-- Selector campaña -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">Campaña:</span>
        <select
          :value="campanaSeleccionadaId"
          @change="onCampanaChange"
          :disabled="store.loadingCampanas"
          class="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-60">
          <option value="" disabled>Selecciona una campaña</option>
          <option v-for="c in store.campanas" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
      </div>
    </div>

    <!-- Botón CSV -->
    <div class="flex items-center gap-3">
      <button
        @click="exportarCsv"
        :disabled="!campanaSeleccionadaId || loading"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm">
        <svg class="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Exportar CSV
      </button>
      <span v-if="totalRegistros > 0" class="text-sm text-gray-400">{{ totalRegistros.toLocaleString() }} registros totales</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="py-10 text-center text-red-500 dark:text-red-400">{{ errorMsg }}</div>

    <!-- Sin campaña -->
    <div v-else-if="!campanaSeleccionadaId" class="py-16 text-center text-gray-400 dark:text-gray-500">
      Selecciona una campaña para ver el historial.
    </div>

    <!-- Tabla -->
    <template v-else>

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white">Historial de participaciones</h3>
          <span class="text-xs text-gray-400">Página {{ paginaActual }} de {{ totalPaginas }}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Identificación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Tienda</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Enrolador</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Premio</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Ganador</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Código</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Redimido</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="r in registros" :key="r.id"
                  class="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {{ new Date(r.fecha).toLocaleDateString(APP_LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }) }}
                </td>
                <td class="px-4 py-3 font-mono text-gray-700 dark:text-gray-200 text-xs">{{ r.identificacion }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{{ r.tiendaCodigo }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 hidden lg:table-cell">{{ r.enroladorNombre ?? '—' }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
                  <span>{{ r.premioNombre }}</span>
                  <span class="ml-1.5 text-xs text-gray-400">{{ TIPO_LABELS[r.premioTipo] ?? r.premioTipo }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span v-if="r.esGanador" class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"/>
                  <span v-else class="inline-block w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600"/>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span v-if="r.codigoRedencion" class="font-mono text-xs text-indigo-600 dark:text-indigo-400">{{ r.codigoRedencion }}</span>
                  <span v-else class="text-xs text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span v-if="r.redimido" class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"/>
                  <span v-else class="inline-block w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600"/>
                </td>
              </tr>
              <tr v-if="registros.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-sm text-gray-400">Sin registros para esta campaña.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="flex items-center justify-center gap-2">
        <button
          @click="cargarPagina(paginaActual - 1)"
          :disabled="paginaActual <= 1 || loading"
          class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
          Anterior
        </button>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ paginaActual }} / {{ totalPaginas }}</span>
        <button
          @click="cargarPagina(paginaActual + 1)"
          :disabled="paginaActual >= totalPaginas || loading"
          class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
          Siguiente
        </button>
      </div>

    </template>

  </div>
</template>
