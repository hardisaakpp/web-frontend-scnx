<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Mis Inventarios</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tomas físicas abiertas asignadas a tu bodega o a tu usuario.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" class="btn-secondary" @click="irAHistorial">Mi Historial</button>
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>

    <div v-if="loading && sesiones.length === 0" class="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <div v-else-if="sesiones.length === 0" class="py-20 text-center">
      <ArchiveBoxXMarkIcon class="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">No tienes tomas físicas abiertas asignadas.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="s in sesiones"
        :key="s.sessionId"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['badge', badgeClass(s.status)]">{{ statusLabel(s.status) }}</span>
              <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ s.warehouseCode }}</span>
              <span v-if="s.planId" class="text-xs text-blue-600 dark:text-blue-400 font-mono" :title="'Plan: ' + s.planId">
                Plan {{ s.planId.slice(0, 8) }}…
              </span>
              <span v-else class="text-xs text-gray-400 dark:text-gray-500 italic">Toma directa</span>
            </div>

            <h2 class="mt-2 text-base font-semibold text-gray-900 dark:text-white">
              {{ s.warehouseName }}
            </h2>

            <p v-if="s.description" class="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              {{ s.description }}
            </p>

            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Apertura: {{ formatDate(s.openedAt) }}</span>
              <span v-if="s.plannedCloseDate">Cierre estimado: {{ formatDateOnly(s.plannedCloseDate) }}</span>
              <span>Generada por: {{ s.createdByUserId }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-2 flex-shrink-0">
            <button
              v-if="isTiendaAssignedTo(s.warehouseCode)"
              type="button"
              class="btn-secondary"
              @click="irAContarArticulos(s.sessionId)"
            >
              Contar artículos
            </button>
            <button
              type="button"
              class="btn-primary"
              @click="iniciarPicking(s.sessionId)"
            >
              Iniciar picking
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowPathIcon, ArchiveBoxXMarkIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { InventorySessionListItemDto, InventorySessionStatus } from '../types'
import { useWarehouseAccessType } from '../composables/useWarehouseAccessType'

const router = useRouter()
const sesiones = ref<InventorySessionListItemDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const { isTiendaAssignedTo } = useWarehouseAccessType()

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

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function formatDateOnly(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value + 'T00:00:00')
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    sesiones.value = await inventarioSesionesService.getMisSesiones()
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar sesiones.'
  } finally {
    loading.value = false
  }
}

function iniciarPicking(sessionId: string) {
  router.push({ name: 'inventario-picking', params: { sessionId } })
}

function irAContarArticulos(sessionId: string) {
  router.push({ name: 'inventario-contar-articulos', params: { sessionId } })
}

function irAHistorial() {
  router.push({ name: 'inventario-historial-conteos' })
}

onMounted(cargar)
</script>

<style scoped>
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.badge-amber { @apply bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
</style>
