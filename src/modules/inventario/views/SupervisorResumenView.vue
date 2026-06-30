<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="router.back()">
            <ChevronLeftIcon class="w-5 h-5" />
          </button>
          <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Resumen de Toma Física</h1>
        <p v-if="summary" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {{ summary.warehouseName }}
          <span class="ml-2 font-mono text-xs text-gray-400">{{ summary.warehouseCode }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
        <button
          v-if="summary"
          type="button"
          class="btn-secondary"
          :disabled="descargando"
          @click="descargarCSV"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-1" />
          {{ descargando ? 'Descargando...' : 'Descargar' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>
    <div v-if="loading && !summary" class="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando resumen...
    </div>

    <template v-if="summary">
      <!-- Status bar -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center gap-4">
        <span :class="['badge text-sm px-3 py-1', badgeClass(summary.status)]">{{ statusLabel(summary.status) }}</span>
        <span v-if="summary.description" class="text-sm text-gray-700 dark:text-gray-300">{{ summary.description }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">Apertura: {{ formatDateTime(summary.openedAt) }}</span>
        <span v-if="summary.closedAt" class="text-xs text-gray-500 dark:text-gray-400">Cierre: {{ formatDateTime(summary.closedAt) }}</span>
      </div>

      <!-- Progress + balance grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Progress -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Progreso de conteo</h2>

          <!-- Progress bar -->
          <div class="mb-4">
            <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>{{ summary.countedItems }} contados</span>
              <span>{{ progressPct }}%</span>
            </div>
            <div class="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                class="h-full rounded-full bg-blue-500 transition-all duration-500"
                :style="{ width: progressPct + '%' }"
              />
            </div>
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>{{ summary.totalSystemItems }} en sistema</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ summary.totalSystemItems }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total</div>
            </div>
            <div class="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ summary.countedItems }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Contados</div>
            </div>
            <div class="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
              <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ summary.pendingItems }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Faltan</div>
            </div>
          </div>
        </div>

        <!-- Balance -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Estado de cuadre</h2>

          <div class="grid grid-cols-3 gap-3 text-center mb-4">
            <div class="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ summary.balancedItems }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cuadraron</div>
            </div>
            <div class="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ summary.differenceItems }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Descuadraron</div>
            </div>
            <div class="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3">
              <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ summary.newItems }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Items nuevos</div>
            </div>
          </div>

          <!-- Balance bar -->
          <div v-if="summary.countedItems + summary.newItems > 0" class="h-2 rounded-full overflow-hidden flex gap-0.5">
            <div
              v-if="summary.balancedItems"
              class="h-full bg-green-500 transition-all"
              :style="{ flexGrow: summary.balancedItems }"
              :title="`${summary.balancedItems} cuadraron`"
            />
            <div
              v-if="summary.differenceItems"
              class="h-full bg-red-500 transition-all"
              :style="{ flexGrow: summary.differenceItems }"
              :title="`${summary.differenceItems} descuadraron`"
            />
            <div
              v-if="summary.newItems"
              class="h-full bg-purple-400 transition-all"
              :style="{ flexGrow: summary.newItems }"
              :title="`${summary.newItems} nuevos`"
            />
          </div>
        </div>
      </div>

      <!-- Users -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Conteo por usuario
            <span class="ml-2 text-blue-600 dark:text-blue-400">{{ summary.userStats.length }} participantes</span>
          </h2>
        </div>
        <div v-if="summary.userStats.length === 0" class="py-8 text-center text-sm text-gray-400 dark:text-gray-600">
          Sin registros de conteo aún.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th class="th">Usuario</th>
                <th class="th text-right">Entradas</th>
                <th class="th text-right">Artículos únicos</th>
                <th class="th">Último registro</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
              <tr v-for="u in summary.userStats" :key="u.userId" class="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                <td class="td font-mono font-medium">{{ u.userId }}</td>
                <td class="td text-right">
                  <span class="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-semibold">
                    {{ u.countEntries }}
                  </span>
                </td>
                <td class="td text-right text-gray-600 dark:text-gray-400">{{ u.uniqueItemsCounted }}</td>
                <td class="td text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(u.lastCountedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Close session -->
      <div v-if="summary.canClose" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Cerrar Toma Física</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <template v-if="summary.status === 'Recount'">
            Esta toma está en <strong>Reconteo</strong>. Al cerrarla se generará el snapshot inmutable y quedará definitivamente <strong>Cerrada</strong>, independientemente de las diferencias.
          </template>
          <template v-else>
            Si todos los artículos cuadran la toma pasará a <strong>Cerrada</strong>.
            Si hay diferencias pasará a estado <strong>Reconteo</strong> para una segunda vuelta.
          </template>
        </p>

        <div v-if="!confirmarCierre" class="flex items-center gap-3">
          <button
            type="button"
            class="btn-danger"
            :disabled="cerrando"
            @click="confirmarCierre = true"
          >
            <LockClosedIcon class="w-4 h-4 mr-1.5" />
            {{ summary.status === 'Recount' ? 'Cerrar definitivamente' : 'Cerrar Toma Física' }}
          </button>
          <span class="text-xs text-gray-400">
            {{ summary.status === 'Recount'
              ? 'Cierre forzado — se creará el snapshot inmutable'
              : summary.differenceItems > 0 ? `${summary.differenceItems} diferencia${summary.differenceItems !== 1 ? 's' : ''} — pasará a Reconteo` : 'Todo cuadra — se cerrará definitivamente' }}
          </span>
        </div>

        <div v-else class="space-y-3">
          <p class="text-sm font-medium text-amber-700 dark:text-amber-400">¿Confirmar cierre de sesión?</p>
          <textarea
            v-model="notaCierre"
            class="note-input"
            rows="2"
            placeholder="Nota opcional (ej: conteo finalizado sin novedades)..."
          />
          <div class="flex items-center gap-3">
            <button type="button" class="btn-danger" :disabled="cerrando" @click="cerrarSesion">
              <svg v-if="cerrando" class="animate-spin w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <LockClosedIcon v-else class="w-4 h-4 mr-1.5" />
              {{ cerrando ? 'Cerrando...' : 'Confirmar cierre' }}
            </button>
            <button type="button" class="btn-secondary" :disabled="cerrando" @click="confirmarCierre = false">
              Cancelar
            </button>
          </div>
        </div>

        <div v-if="errorCierre" class="mt-3 alert-error text-sm">{{ errorCierre }}</div>
      </div>

      <!-- Closed / Recount result message -->
      <div v-if="resultadoCierre" class="mt-4 rounded-xl p-4 border"
        :class="resultadoCierre === 'Closed'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'"
      >
        <p class="font-semibold" :class="resultadoCierre === 'Closed' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'">
          {{ resultadoCierre === 'Closed' ? '✓ Toma física cerrada. Snapshot inmutable generado.' : '⚠ Diferencias detectadas — la toma pasó a estado Reconteo.' }}
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ChevronLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  LockClosedIcon
} from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { SupervisorSummaryDto, InventorySessionStatus } from '../types'

const router = useRouter()
const route = useRoute()
const sessionId = route.params.sessionId as string

const summary = ref<SupervisorSummaryDto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const confirmarCierre = ref(false)
const notaCierre = ref('')
const cerrando = ref(false)
const errorCierre = ref<string | null>(null)
const resultadoCierre = ref<string | null>(null)

const descargando = ref(false)

const progressPct = computed(() => {
  if (!summary.value || summary.value.totalSystemItems === 0) return 0
  return Math.round((summary.value.countedItems / summary.value.totalSystemItems) * 100)
})

function statusLabel(status: InventorySessionStatus): string {
  return { Open: 'Abierta', Recount: 'Reconteo', Closed: 'Cerrada' }[status] ?? status
}

function badgeClass(status: InventorySessionStatus): string {
  return { Open: 'badge-blue', Recount: 'badge-amber', Closed: 'badge-gray' }[status] ?? 'badge-gray'
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
    summary.value = await inventarioSesionesService.getSupervisorSummary(sessionId)
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar el resumen.'
  } finally {
    loading.value = false
  }
}

async function descargarCSV() {
  descargando.value = true
  try {
    const status = await inventarioSesionesService.getSessionStatus(sessionId)
    const rows: string[] = [
      'Código,Descripción,Stock Sistema,Contado,Diferencia,Estado'
    ]
    for (const line of status.lines) {
      const desc = (line.itemDescription ?? '').replace(/"/g, '""')
      const estado = line.balanceStatus === 'Balanced' ? 'Cuadrado'
        : line.systemQuantity === 0 ? 'Nuevo'
        : 'Diferencia'
      rows.push(`${line.itemCode},"${desc}",${line.systemQuantity},${line.countedQuantity},${line.difference},${estado}`)
    }
    const csv = rows.join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventario_${summary.value?.warehouseCode ?? sessionId.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    error.value = e.message ?? 'Error al descargar el detalle.'
  } finally {
    descargando.value = false
  }
}

async function cerrarSesion() {
  cerrando.value = true
  errorCierre.value = null
  try {
    const result = await inventarioSesionesService.closeSession(sessionId, notaCierre.value || null)
    resultadoCierre.value = result.status
    confirmarCierre.value = false
    await cargar()
  } catch (e: any) {
    errorCierre.value = e.message ?? 'Error al cerrar la sesión.'
  } finally {
    cerrando.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.th { @apply px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-4 py-3 text-sm text-gray-700 dark:text-gray-300; }
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-danger { @apply inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.badge-amber { @apply bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.note-input { @apply w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none; }
</style>
