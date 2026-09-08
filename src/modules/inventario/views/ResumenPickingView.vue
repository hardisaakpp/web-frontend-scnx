<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0" @click="volver">
        <ChevronLeftIcon class="w-5 h-5" />
      </button>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Inventario · Picking</p>
        <h1 class="text-base font-semibold text-gray-900 dark:text-white">Resumen de Conteo</h1>
        <p class="text-xs text-gray-400 font-mono truncate">{{ sessionId.slice(0, 16) }}…</p>
      </div>
      <button type="button" class="btn-secondary text-xs px-2.5 py-1.5 flex-shrink-0" :disabled="loading" @click="cargar">
        <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <div v-if="error" class="m-4 alert-error">{{ error }}</div>

    <div v-if="loading && !summary" class="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      Cargando resumen...
    </div>

    <div v-else-if="summary" class="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Left: level totals -->
      <div class="flex flex-col gap-4">
        <!-- By Level 1 -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Por Nivel 1
            <span class="ml-1 text-blue-600 dark:text-blue-400">{{ summary.byLevel1.length }} grupos</span>
          </h2>
          <div v-if="summary.byLevel1.length === 0" class="py-4 text-center text-xs text-gray-400">
            Sin datos
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <th class="text-left py-1.5 pr-4 font-medium text-gray-500 dark:text-gray-400">Nivel</th>
                  <th class="text-right py-1.5 pr-4 font-medium text-gray-500 dark:text-gray-400">Artículos</th>
                  <th class="text-right py-1.5 font-medium text-gray-500 dark:text-gray-400">Unidades</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                <tr v-for="row in summary.byLevel1" :key="row.level">
                  <td class="py-1.5 pr-4 font-medium text-gray-900 dark:text-white">{{ row.level }}</td>
                  <td class="py-1.5 pr-4 text-right text-gray-600 dark:text-gray-300">{{ row.lines }}</td>
                  <td class="py-1.5 text-right font-semibold text-blue-600 dark:text-blue-400">{{ formatQty(row.totalQuantity) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-gray-200 dark:border-gray-600">
                  <td class="py-1.5 pr-4 font-semibold text-gray-700 dark:text-gray-300">Total</td>
                  <td class="py-1.5 pr-4 text-right font-semibold text-gray-700 dark:text-gray-300">{{ totalLines1 }}</td>
                  <td class="py-1.5 text-right font-bold text-blue-600 dark:text-blue-400">{{ formatQty(totalQty1) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- By Level 2 -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Por Nivel 1 / Nivel 2
            <span class="ml-1 text-blue-600 dark:text-blue-400">{{ summary.byLevel2.length }} grupos</span>
          </h2>
          <div v-if="summary.byLevel2.length === 0" class="py-4 text-center text-xs text-gray-400">
            Sin datos
          </div>
          <div v-else class="overflow-x-auto max-h-64 overflow-y-auto">
            <table class="min-w-full text-xs">
              <thead class="sticky top-0 bg-white dark:bg-gray-800">
                <tr class="border-b border-gray-100 dark:border-gray-700">
                  <th class="text-left py-1.5 pr-4 font-medium text-gray-500 dark:text-gray-400">Nivel</th>
                  <th class="text-right py-1.5 pr-4 font-medium text-gray-500 dark:text-gray-400">Artículos</th>
                  <th class="text-right py-1.5 font-medium text-gray-500 dark:text-gray-400">Unidades</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                <tr v-for="row in summary.byLevel2" :key="row.level">
                  <td class="py-1.5 pr-4 text-gray-700 dark:text-gray-300">{{ row.level }}</td>
                  <td class="py-1.5 pr-4 text-right text-gray-600 dark:text-gray-300">{{ row.lines }}</td>
                  <td class="py-1.5 text-right font-semibold text-blue-600 dark:text-blue-400">{{ formatQty(row.totalQuantity) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: recent counts -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3 flex-shrink-0">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Últimos 30 ingresos
          </h2>
          <span v-if="eliminando" class="text-xs text-gray-400 flex items-center gap-1">
            <svg class="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Eliminando...
          </span>
        </div>

        <!-- Selección múltiple (como en el sistema anterior: marcar los registros de la pantalla y eliminarlos) -->
        <div v-if="seleccionables.length > 0" class="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
          <label class="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              :checked="todosSeleccionados"
              :indeterminate="algunosSeleccionados"
              :disabled="eliminando"
              @change="toggleTodos"
            >
            Seleccionar todos ({{ seleccionables.length }})
          </label>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="eliminando || seleccionados.size === 0"
            @click="eliminarSeleccionados"
          >
            <TrashIcon class="w-3.5 h-3.5" />
            Eliminar seleccionados<span v-if="seleccionados.size > 0"> ({{ seleccionados.size }})</span>
          </button>
        </div>

        <div v-if="summary.recentCounts.length === 0" class="py-4 text-center text-xs text-gray-400">
          Sin registros
        </div>
        <div v-else class="overflow-y-auto flex-1 space-y-1">
          <div
            v-for="item in localRecentCounts"
            :key="item.countId"
            class="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
            :class="item._deleted ? 'opacity-40 line-through' : (seleccionados.has(item.countId) ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/20')"
          >
            <input
              v-if="item.canDelete && !item._deleted"
              type="checkbox"
              class="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              :checked="seleccionados.has(item.countId)"
              :disabled="eliminando"
              :aria-label="`Seleccionar ${item.itemCode}`"
              @change="toggleSeleccion(item.countId)"
            >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-mono font-medium text-gray-900 dark:text-white">{{ item.itemCode }}</span>
                <span class="font-semibold text-gray-700 dark:text-gray-200">x{{ item.quantity }}</span>
              </div>
              <div v-if="item.description" class="text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ item.description }}</div>
              <div v-if="item.barcode" class="font-mono text-gray-600 dark:text-gray-300 mt-0.5">
                <span class="font-sans text-gray-400 dark:text-gray-500">Cód. barras </span>{{ item.barcode }}
              </div>
              <div class="flex items-center gap-2 mt-0.5 text-gray-400 dark:text-gray-500">
                <span v-if="item.level1">{{ item.level1 }}<span v-if="item.level2"> / {{ item.level2 }}</span></span>
                <span>{{ formatTime(item.countedAt) }}</span>
                <span class="truncate">{{ userLabel(item.countedByUserId) }}</span>
              </div>
            </div>
            <button
              v-if="item.canDelete && !item._deleted"
              type="button"
              class="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-40"
              :disabled="eliminando"
              title="Eliminar este ingreso"
              @click="eliminar(item)"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="errorEliminar" class="mt-2 text-xs text-red-600 dark:text-red-400 flex-shrink-0">{{ errorEliminar }}</div>
        <div v-if="avisoEliminar" class="mt-2 text-xs text-amber-700 dark:text-amber-300 flex-shrink-0">{{ avisoEliminar }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeftIcon, ArrowPathIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { InventoryPickingSummaryDto, RecentCountItemDto } from '../types'
import { APP_LOCALE } from '@/plugins/locale'
import { resolveUserNames } from '@/utils/resolveUserNames'

type LocalRecentCountItem = RecentCountItemDto & { _deleted?: boolean }

const router = useRouter()
const route = useRoute()
const sessionId = route.params.sessionId as string

const summary = ref<InventoryPickingSummaryDto | null>(null)
const localRecentCounts = ref<LocalRecentCountItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const eliminando = ref(false)
const errorEliminar = ref<string | null>(null)
const avisoEliminar = ref<string | null>(null)

// ─── Selección múltiple ──────────────────────────────────────────────────────
const seleccionados = ref<Set<string>>(new Set())
const seleccionables = computed(() => localRecentCounts.value.filter(i => i.canDelete && !i._deleted))
const todosSeleccionados = computed(() => seleccionables.value.length > 0 && seleccionables.value.every(i => seleccionados.value.has(i.countId)))
const algunosSeleccionados = computed(() => seleccionados.value.size > 0 && !todosSeleccionados.value)

function toggleSeleccion(countId: string) {
  const next = new Set(seleccionados.value)
  if (next.has(countId)) next.delete(countId)
  else next.add(countId)
  seleccionados.value = next
}

function toggleTodos() {
  seleccionados.value = todosSeleccionados.value
    ? new Set()
    : new Set(seleccionables.value.map(i => i.countId))
}
const userNames = ref<Record<string, string>>({})

function userLabel(userId: string): string {
  return userNames.value[userId] || userId
}

const totalLines1 = computed(() => summary.value?.byLevel1.reduce((s, r) => s + r.lines, 0) ?? 0)
const totalQty1 = computed(() => summary.value?.byLevel1.reduce((s, r) => s + r.totalQuantity, 0) ?? 0)

function formatQty(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2)
}

function formatTime(value: string): string {
  const d = new Date(value)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit' })
    + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function volver() {
  router.push({ name: 'inventario-picking', params: { sessionId } })
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    summary.value = await inventarioSesionesService.getPickingSummary(sessionId)
    localRecentCounts.value = summary.value.recentCounts.map(c => ({ ...c }))
    seleccionados.value = new Set()
    // Nombre del operador en vez del id (los ingresos pueden ser de varios usuarios de la misma toma).
    userNames.value = await resolveUserNames(localRecentCounts.value.map(c => c.countedByUserId))
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar el resumen.'
  } finally {
    loading.value = false
  }
}

async function eliminar(item: LocalRecentCountItem) {
  errorEliminar.value = null
  avisoEliminar.value = null
  eliminando.value = true
  try {
    await inventarioSesionesService.deleteCount(sessionId, item.countId)
    item._deleted = true
    if (seleccionados.value.has(item.countId)) toggleSeleccion(item.countId)
  } catch (e: any) {
    errorEliminar.value = e.message ?? 'No se pudo eliminar el ingreso.'
  } finally {
    eliminando.value = false
  }
}

async function eliminarSeleccionados() {
  const ids = [...seleccionados.value]
  if (ids.length === 0) return
  const unidades = seleccionables.value
    .filter(i => seleccionados.value.has(i.countId))
    .reduce((s, i) => s + i.quantity, 0)
  if (!window.confirm(`Se eliminarán ${ids.length} ingreso(s) (${formatQty(unidades)} unidades) de esta toma. Esta acción no se puede deshacer. ¿Continuar?`)) return

  errorEliminar.value = null
  avisoEliminar.value = null
  eliminando.value = true
  try {
    const result = await inventarioSesionesService.deleteCounts(sessionId, ids)
    const omitidos = new Set(result.skipped.map(s => s.countId))
    for (const item of localRecentCounts.value) {
      if (seleccionados.value.has(item.countId) && !omitidos.has(item.countId)) item._deleted = true
    }
    seleccionados.value = new Set()
    if (result.skipped.length > 0) {
      const motivos = [...new Set(result.skipped.map(s => s.reason))].join(' ')
      avisoEliminar.value = `Se eliminaron ${result.deleted}. No se pudieron eliminar ${result.skipped.length}: ${motivos}`
    }
  } catch (e: any) {
    errorEliminar.value = e.message ?? 'No se pudieron eliminar los ingresos seleccionados.'
  } finally {
    eliminando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.btn-secondary {
  @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed;
}
.alert-error {
  @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300;
}
</style>
