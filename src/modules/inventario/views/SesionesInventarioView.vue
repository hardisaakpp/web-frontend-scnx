<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Sesiones de Conteo</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tomas físicas generadas. Acceso: supervisores y administradores.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
        <button type="button" class="btn-primary" @click="mostrarModal = true">
          <PlusIcon class="w-4 h-4 mr-1" />
          Nueva sesión
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <!-- Estado -->
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="f in FILTROS_ESTADO"
          :key="String(f.value)"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            filtroEstado === f.value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
          ]"
          @click="filtroEstado = f.value"
        >
          {{ f.label }}
          <span class="ml-1 text-inherit opacity-70">({{ contarPorEstado(f.value) }})</span>
        </button>
      </div>

      <!-- Separador vertical -->
      <div class="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

      <!-- Rango de fechas -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Apertura:</span>
        <input
          v-model="fechaDesde"
          type="date"
          class="date-input"
          title="Desde"
        />
        <span class="text-xs text-gray-400">—</span>
        <input
          v-model="fechaHasta"
          type="date"
          class="date-input"
          title="Hasta"
        />
        <button
          v-if="fechaDesde || fechaHasta"
          type="button"
          class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          title="Limpiar fechas"
          @click="limpiarFechas"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>
    <div v-if="exito" class="mb-4 alert-success">{{ exito }}</div>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="loading && sesiones.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
      <div v-else-if="sesionesFiltradas.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay sesiones{{ filtroEstado ? ' en este estado' : '' }}.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th">Bodega</th>
              <th class="th">Descripción</th>
              <th class="th">Estado</th>
              <th class="th">Plan</th>
              <th class="th">Sesión</th>
              <th class="th">Creado por</th>
              <th class="th">Apertura</th>
              <th class="th">Cierre</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="s in sesionesFiltradas" :key="s.sessionId" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="td">
                <div class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ s.warehouseCode }}</div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ s.warehouseName }}</div>
              </td>
              <td class="td">
                <span v-if="s.description" class="text-sm">{{ s.description }}</span>
                <span v-else class="text-xs text-gray-400 dark:text-gray-600 italic">—</span>
              </td>
              <td class="td whitespace-nowrap">
                <span :class="['badge', badgeClass(s.status)]">{{ statusLabel(s.status) }}</span>
              </td>
              <td class="td whitespace-nowrap">
                <span v-if="s.planId" class="font-mono text-xs text-blue-600 dark:text-blue-400" :title="s.planId">
                  {{ s.planId.slice(0, 8) }}…
                </span>
                <span v-else class="text-xs text-gray-400 dark:text-gray-600 italic">Directa</span>
              </td>
              <td class="td whitespace-nowrap">
                <span class="font-mono text-xs text-gray-500 dark:text-gray-400" :title="s.sessionId">
                  {{ s.sessionId.slice(0, 8) }}…
                </span>
              </td>
              <td class="td whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {{ s.createdByUserId }}
              </td>
              <td class="td whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                {{ formatDateTime(s.openedAt) }}
              </td>
              <td class="td whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                {{ s.closedAt ? formatDateTime(s.closedAt) : '—' }}
              </td>
              <td class="td text-right whitespace-nowrap">
                <div class="flex justify-end items-center gap-3">
                  <button
                    type="button"
                    class="link"
                    @click="irASesion(s.sessionId)"
                  >
                    {{ s.status === 'Closed' ? 'Ver snapshot' : 'Ingresar' }}
                  </button>
                  <button
                    type="button"
                    class="link-muted"
                    :title="linkCopiado === s.sessionId ? 'Link copiado!' : 'Copiar link de picking'"
                    @click="copiarLink(s.sessionId)"
                  >
                    <ClipboardDocumentCheckIcon v-if="linkCopiado === s.sessionId" class="w-4 h-4 text-green-500" />
                    <LinkIcon v-else class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="link-muted"
                    :title="'Gestionar usuarios de picking'"
                    @click="abrirPickers(s)"
                  >
                    <UsersIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CrearSesionDirectaModal
      :is-open="mostrarModal"
      @close="mostrarModal = false"
      @creada="onSesionCreada"
    />

    <PickerManagementModal
      :is-open="!!sesionPickers"
      :session="sesionPickers"
      @close="sesionPickers = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowPathIcon, PlusIcon, UsersIcon, LinkIcon, ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { InventorySessionListItemDto, InventorySessionStatus } from '../types'
import CrearSesionDirectaModal from '../components/CrearSesionDirectaModal.vue'
import PickerManagementModal from '../components/PickerManagementModal.vue'

const router = useRouter()
const sesiones = ref<InventorySessionListItemDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const exito = ref<string | null>(null)
const mostrarModal = ref(false)
const sesionPickers = ref<InventorySessionListItemDto | null>(null)
const linkCopiado = ref<string | null>(null)
const filtroEstado = ref<InventorySessionStatus | null>(null)

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
const hoy = new Date()
const unMesAtras = new Date(hoy)
unMesAtras.setMonth(unMesAtras.getMonth() - 1)

const fechaDesde = ref<string>(toISODate(unMesAtras))
const fechaHasta = ref<string>(toISODate(hoy))

function limpiarFechas() {
  fechaDesde.value = ''
  fechaHasta.value = ''
}

const FILTROS_ESTADO = [
  { label: 'Todas', value: null },
  { label: 'Abiertas', value: 'Open' as InventorySessionStatus },
  { label: 'Reconteo', value: 'Recount' as InventorySessionStatus },
  { label: 'Cerradas', value: 'Closed' as InventorySessionStatus },
]

const sesionesFiltradas = computed(() => {
  let result = sesiones.value

  if (filtroEstado.value) {
    result = result.filter(s => s.status === filtroEstado.value)
  }

  if (fechaDesde.value) {
    const desde = new Date(fechaDesde.value + 'T00:00:00')
    result = result.filter(s => new Date(s.openedAt) >= desde)
  }

  if (fechaHasta.value) {
    const hasta = new Date(fechaHasta.value + 'T23:59:59')
    result = result.filter(s => new Date(s.openedAt) <= hasta)
  }

  return result
})

// Conteo aplica solo filtro de fecha (no el de estado) para que los chips siempre sean precisos
const sesionesEnFecha = computed(() => {
  let result = sesiones.value
  if (fechaDesde.value) {
    const desde = new Date(fechaDesde.value + 'T00:00:00')
    result = result.filter(s => new Date(s.openedAt) >= desde)
  }
  if (fechaHasta.value) {
    const hasta = new Date(fechaHasta.value + 'T23:59:59')
    result = result.filter(s => new Date(s.openedAt) <= hasta)
  }
  return result
})

function contarPorEstado(estado: InventorySessionStatus | null): number {
  if (estado === null) return sesionesEnFecha.value.length
  return sesionesEnFecha.value.filter(s => s.status === estado).length
}

function statusLabel(status: InventorySessionStatus): string {
  return { Open: 'Abierta', Recount: 'Reconteo', Closed: 'Cerrada' }[status] ?? status
}

function badgeClass(status: InventorySessionStatus): string {
  return {
    Open: 'badge-blue',
    Recount: 'badge-amber',
    Closed: 'badge-gray'
  }[status] ?? 'badge-gray'
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    sesiones.value = await inventarioSesionesService.getSesiones()
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar sesiones.'
  } finally {
    loading.value = false
  }
}

function irASesion(sessionId: string) {
  router.push({ name: 'inventario-sesion-detalle', params: { sessionId } })
}

function copiarLink(sessionId: string) {
  const url = `${window.location.origin}/inventario/sesiones/${sessionId}`
  navigator.clipboard.writeText(url).then(() => {
    linkCopiado.value = sessionId
    setTimeout(() => { linkCopiado.value = null }, 2000)
  })
}

function abrirPickers(s: InventorySessionListItemDto) {
  sesionPickers.value = s
}

function onSesionCreada(sessionId: string) {
  mostrarModal.value = false
  exito.value = 'Sesión creada correctamente.'
  cargar()
  router.push({ name: 'inventario-sesion-detalle', params: { sessionId } })
}

onMounted(cargar)
</script>

<style scoped>
.th { @apply px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle; }
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.link { @apply text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300; }
.link-muted { @apply text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.badge-amber { @apply bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.alert-success { @apply rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300; }
.date-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
