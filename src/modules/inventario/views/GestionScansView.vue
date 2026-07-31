<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="router.back()">
            <ChevronLeftIcon class="w-5 h-5" />
          </button>
          <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario · Toma Física</p>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Scans</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Elimina escaneos de cualquier usuario dentro de esta toma. Acción exclusiva de administradores/auditores de inventario.
        </p>
      </div>
      <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
        <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
        Actualizar
      </button>
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>
    <div v-if="exito" class="mb-4 alert-success">{{ exito }}</div>

    <div v-if="loading && !scansData" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando scans...
    </div>

    <template v-else-if="scansData">
      <!-- Summary by user -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resumen por usuario</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="th">Usuario</th>
                <th class="th text-right">Scans</th>
                <th class="th text-right">Artículos únicos</th>
                <th class="th">Primer scan</th>
                <th class="th">Último scan</th>
                <th class="th text-right">Filtro</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
              <tr
                v-for="u in scansData.summary"
                :key="u.userId"
                :class="['hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer', userFilter === u.userId ? 'bg-blue-50/60 dark:bg-blue-900/10' : '']"
                @click="userFilter = userFilter === u.userId ? '' : u.userId"
              >
                <td class="td font-mono font-semibold">{{ u.userId }}</td>
                <td class="td text-right">
                  <span class="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-bold">{{ u.totalScans.toLocaleString() }}</span>
                </td>
                <td class="td text-right text-gray-600 dark:text-gray-400">{{ u.uniqueItems.toLocaleString() }}</td>
                <td class="td text-xs text-gray-500 dark:text-gray-400">{{ fmtDt(u.firstScan) }}</td>
                <td class="td text-xs text-gray-500 dark:text-gray-400">{{ fmtDt(u.lastScan) }}</td>
                <td class="td text-right">
                  <span class="link text-xs">{{ userFilter === u.userId ? 'Quitar filtro' : 'Ver solo este usuario' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detail with delete actions -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detalle de escaneos</h2>
          <div class="flex-1" />
          <input v-model="search" type="search" placeholder="Buscar usuario, código, descripción..." class="search-input w-64" />
          <span class="text-xs text-gray-400">{{ filteredDetail.length.toLocaleString() }} registros</span>
        </div>

        <div v-if="filteredDetail.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin escaneos que coincidan con el filtro.
        </div>
        <div v-else class="overflow-x-auto max-h-[32rem]">
          <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
              <tr>
                <th class="th">Fecha/Hora</th>
                <th class="th">Usuario</th>
                <th class="th">Cód. Barras</th>
                <th class="th">Item Code</th>
                <th class="th">Descripción</th>
                <th class="th text-right">Cantidad</th>
                <th class="th text-right">Ronda</th>
                <th class="th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
              <tr
                v-for="d in pagedDetail"
                :key="d.countId"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/20"
                :class="{ 'opacity-40 line-through': eliminados.has(d.countId) }"
              >
                <td class="td text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">{{ fmtDt(d.scannedAt) }}</td>
                <td class="td font-mono text-xs font-semibold">{{ d.userId }}</td>
                <td class="td font-mono text-xs">{{ d.barcode ?? '—' }}</td>
                <td class="td font-mono text-xs font-semibold">{{ d.itemCode }}</td>
                <td class="td text-xs max-w-xs truncate">{{ d.description ?? '—' }}</td>
                <td class="td text-right font-mono text-xs">{{ fmtQty(d.quantity) }}</td>
                <td class="td text-right text-xs text-gray-400">{{ d.round }}</td>
                <td class="td text-right whitespace-nowrap">
                  <button
                    v-if="d.canDelete && !eliminados.has(d.countId)"
                    type="button"
                    class="link-danger text-xs"
                    :disabled="eliminando === d.countId"
                    @click="confirmarEliminar(d)"
                  >
                    {{ eliminando === d.countId ? 'Eliminando...' : 'Eliminar' }}
                  </button>
                  <span v-else-if="eliminados.has(d.countId)" class="text-xs text-gray-400">Eliminado</span>
                  <span v-else class="text-xs text-gray-300 dark:text-gray-600">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredDetail.length > 0" class="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Mostrando {{ pageStart + 1 }}–{{ Math.min(pageStart + pageSize, filteredDetail.length) }} de {{ filteredDetail.length.toLocaleString() }}</span>
          <div class="flex items-center gap-2">
            <button class="pag-btn" :disabled="page === 0" @click="page--">‹</button>
            <span>{{ page + 1 }} / {{ totalPages }}</span>
            <button class="pag-btn" :disabled="page >= totalPages - 1" @click="page++">›</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Confirm delete -->
    <TransitionRoot :show="!!porEliminar" as="template">
      <Dialog as="div" class="relative z-50" @close="porEliminar = null">
        <TransitionChild enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-black bg-opacity-30" />
        </TransitionChild>
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
            <DialogPanel class="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
              <DialogTitle class="text-base font-semibold text-gray-900 dark:text-white mb-2">Eliminar escaneo</DialogTitle>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                ¿Eliminar el escaneo de <strong>{{ porEliminar?.itemCode }}</strong> registrado por
                <strong>{{ porEliminar?.userId }}</strong>? Esta acción no se puede deshacer.
              </p>
              <div class="flex justify-end gap-3">
                <button type="button" class="btn-secondary" @click="porEliminar = null">Cancelar</button>
                <button type="button" class="btn-danger" :disabled="!!eliminando" @click="eliminar">
                  {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { ChevronLeftIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { SessionScansByUserDto, UserScanDetailEntryDto } from '../types'
import { APP_LOCALE } from '@/plugins/locale'

const router = useRouter()
const route = useRoute()
const sessionId = route.params.sessionId as string

const scansData = ref<SessionScansByUserDto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const exito = ref<string | null>(null)

const userFilter = ref('')
const search = ref('')
const page = ref(0)
const pageSize = 100

const eliminando = ref<string | null>(null)
const eliminados = ref<Set<string>>(new Set())
const porEliminar = ref<UserScanDetailEntryDto | null>(null)

watch([userFilter, search], () => { page.value = 0 })

async function cargar() {
  loading.value = true
  error.value = null
  try {
    scansData.value = await inventarioSesionesService.getScansByUser(sessionId)
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar los scans de la sesión.'
  } finally {
    loading.value = false
  }
}

const filteredDetail = computed(() => {
  if (!scansData.value) return []
  const q = search.value.trim().toLowerCase()
  return scansData.value.detail.filter(d => {
    if (userFilter.value && !d.userId.toLowerCase().includes(userFilter.value.toLowerCase())) return false
    if (!q) return true
    return d.userId.toLowerCase().includes(q) ||
      d.itemCode.toLowerCase().includes(q) ||
      (d.barcode ?? '').toLowerCase().includes(q) ||
      (d.description ?? '').toLowerCase().includes(q)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredDetail.value.length / pageSize)))
const pageStart = computed(() => page.value * pageSize)
const pagedDetail = computed(() => filteredDetail.value.slice(pageStart.value, pageStart.value + pageSize))

function confirmarEliminar(entry: UserScanDetailEntryDto) {
  exito.value = null
  porEliminar.value = entry
}

async function eliminar() {
  if (!porEliminar.value) return
  const entry = porEliminar.value
  eliminando.value = entry.countId
  error.value = null
  try {
    await inventarioSesionesService.deleteCount(sessionId, entry.countId)
    eliminados.value.add(entry.countId)
    exito.value = `Escaneo de ${entry.itemCode} (usuario ${entry.userId}) eliminado.`
    porEliminar.value = null
  } catch (e: any) {
    error.value = e.message ?? 'Error al eliminar el escaneo.'
  } finally {
    eliminando.value = null
  }
}

function fmtQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function fmtDt(v: string): string {
  const d = new Date(v)
  return d.toLocaleDateString(APP_LOCALE, { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString(APP_LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(cargar)
</script>

<style scoped>
.th { @apply px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap; }
.td { @apply px-3 py-2 text-sm text-gray-700 dark:text-gray-300; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-danger { @apply inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.link { @apply text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300; }
.link-danger { @apply text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed; }
.search-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.pag-btn { @apply px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.alert-success { @apply rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300; }
</style>
