<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
      <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0" @click="volver">
        <ChevronLeftIcon class="w-5 h-5" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span v-if="sessionInfo" class="font-mono text-xs text-gray-400">{{ sessionInfo.warehouseCode }}</span>
          <span v-if="sessionInfo" :class="['badge', badgeClass(sessionInfo.status)]">{{ statusLabel(sessionInfo.status) }}</span>
          <span v-if="!online" class="badge badge-red">Sin conexión</span>
        </div>
        <h1 class="text-base font-semibold text-gray-900 dark:text-white truncate">
          {{ sessionInfo?.warehouseName ?? 'Cargando sesión...' }}
        </h1>
        <p v-if="sessionInfo?.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ sessionInfo.description }}</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="text-right hidden sm:block">
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ enviados.length }} enviados</div>
          <div v-if="errores.length > 0" class="text-xs text-red-500">{{ errores.length }} error{{ errores.length !== 1 ? 'es' : '' }}</div>
        </div>
        <button type="button" class="btn-secondary text-xs px-2.5 py-1.5" @click="irAlResumen">
          Ver Resumen
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      <!-- Left: inputs -->
      <div class="flex flex-col gap-4">
        <!-- Barcode scanner -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Escanear código de barras
          </h2>
          <div class="flex gap-2">
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <input v-model.number="cantidadScan" type="number" min="1" max="9999" class="qty-input" @keydown.enter.prevent="onScanEnter" />
              <span class="text-xs text-gray-400">x</span>
            </div>
            <input
              ref="barcodeInputRef"
              v-model="scanCode"
              type="text"
              class="scan-input flex-1"
              placeholder="Escanear o escribir código..."
              autocomplete="off"
              @keydown.enter.prevent="onScanEnter"
            />
            <button
              type="button"
              class="btn-secondary flex-shrink-0 px-3"
              title="Escanear con cámara"
              @click="mostrarEscaner = true"
            >
              <CameraIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <ScannerPanel
          :visible="mostrarEscaner"
          @detected="onCodigoEscaneado"
          @close="mostrarEscaner = false"
        />

        <!-- Manual itemcode -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            @click="mostrarManual = !mostrarManual"
          >
            <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Ingresar por item code
            </h2>
            <ChevronDownIcon :class="['w-4 h-4 text-gray-400 transition-transform duration-200', mostrarManual && 'rotate-180']" />
          </button>
          <div v-show="mostrarManual" class="px-4 pb-4">
            <div class="flex gap-2">
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <input v-model.number="cantidadManual" type="number" min="1" max="9999" class="qty-input" @keydown.enter.prevent="onManualEnter" />
                <span class="text-xs text-gray-400">x</span>
              </div>
              <input
                v-model="manualItemCode"
                type="text"
                class="scan-input flex-1"
                placeholder="Código de artículo"
                autocomplete="off"
                @keydown.enter.prevent="onManualEnter"
              />
              <button type="button" class="btn-primary text-xs px-3 py-2 flex-shrink-0" @click="onManualEnter">
                Agregar
              </button>
            </div>
          </div>
        </div>

        <!-- Errores -->
        <div v-if="errores.length > 0" class="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Errores
              <span class="ml-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded-full">{{ errores.length }}</span>
            </h2>
            <button type="button" class="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400" @click="reenviarTodos">
              Reenviar todo
            </button>
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            <div
              v-for="e in errores"
              :key="e.id"
              class="flex items-start justify-between gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2"
            >
              <div class="min-w-0 flex-1">
                <div class="text-xs font-mono font-medium text-gray-900 dark:text-white">
                  {{ e.itemCode }} <span class="font-normal text-gray-500 dark:text-gray-400">x{{ e.quantity }}</span>
                </div>
                <div class="text-xs text-red-600 dark:text-red-400 truncate mt-0.5">{{ e.errorMsg }}</div>
              </div>
              <button
                type="button"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 flex-shrink-0"
                @click="reenviarItem(e)"
              >
                Reenviar
              </button>
            </div>
          </div>
        </div>

        <div v-if="errorCarga" class="alert-error text-sm">{{ errorCarga }}</div>
      </div>

      <!-- Right: queues -->
      <div class="flex flex-col gap-4">
        <!-- Temporal queue -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Temporal
              <span class="ml-1 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded-full">{{ cola.length }}</span>
            </h2>
            <span v-if="procesando" class="flex items-center gap-1.5 text-xs text-gray-400">
              <svg class="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </span>
          </div>
          <div v-if="cola.length === 0" class="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
            Cola vacía
          </div>
          <div v-else class="space-y-1 max-h-36 overflow-y-auto">
            <div
              v-for="(item, idx) in cola"
              :key="item.id"
              class="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg transition-colors"
              :class="idx === 0 && procesando ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50 dark:bg-amber-900/10'"
            >
              <span class="font-mono font-medium text-gray-900 dark:text-white">{{ item.itemCode }}</span>
              <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span>x{{ item.quantity }}</span>
                <span class="text-gray-300 dark:text-gray-600 text-[10px]">{{ item.source === 'Scan' ? 'ESC' : 'MAN' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Enviados -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-3">
            Enviados
            <span class="ml-1 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300 px-1.5 py-0.5 rounded-full">{{ enviados.length }}</span>
          </h2>
          <div v-if="enviados.length === 0" class="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
            Aún no hay artículos enviados
          </div>
          <div v-else class="space-y-1 max-h-96 overflow-y-auto">
            <div
              v-for="e in enviados"
              :key="e.id"
              class="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg gap-2"
              :class="{
                'bg-green-50 dark:bg-green-900/10': e.existe === true,
                'bg-red-50 dark:bg-red-900/10': e.existe === false,
                'bg-gray-50 dark:bg-gray-700/20': e.existe === null
              }"
            >
              <div class="min-w-0 flex-1">
                <span class="font-mono font-medium text-gray-900 dark:text-white">{{ e.itemCode }}</span>
                <span v-if="e.description" class="ml-2 text-gray-400 dark:text-gray-500 truncate hidden sm:inline">{{ e.description }}</span>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="text-gray-500 dark:text-gray-400">x{{ e.quantity }}</span>
                <span v-if="e.existe === null" class="text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                  <svg class="animate-spin w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>...</span>
                </span>
                <span v-else-if="e.existe" class="font-medium text-green-600 dark:text-green-400">OK</span>
                <span v-else class="font-medium text-red-600 dark:text-red-400">NO EXISTE CÓDIGO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeftIcon, ChevronDownIcon, CameraIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { InventorySessionStatus } from '../types'
import ScannerPanel from '../components/ScannerPanel.vue'

interface ColaItem {
  id: string
  itemCode: string
  quantity: number
  source: 'Manual' | 'Scan'
  scanCode?: string | null
}

interface EnviadoItem {
  id: string
  itemCode: string
  quantity: number
  existe: boolean | null  // null = validando en background
  description: string | null
}

interface ErrorItem {
  id: string
  itemCode: string
  quantity: number
  source: 'Manual' | 'Scan'
  scanCode?: string | null
  errorMsg: string
}

interface SessionInfo {
  warehouseCode: string
  warehouseName: string
  description?: string | null
  status: InventorySessionStatus
}

interface CachedItemInfo {
  exists: boolean
  description: string | null
  cachedAt: number
}

const ITEM_CACHE_PREFIX = 'inv_item_v1_'
const ITEM_CACHE_TTL = 24 * 60 * 60 * 1000

const router = useRouter()
const route = useRoute()
const sessionId = route.params.sessionId as string

const barcodeInputRef = ref<HTMLInputElement | null>(null)
const sessionInfo = ref<SessionInfo | null>(null)
const errorCarga = ref<string | null>(null)
const online = ref(navigator.onLine)

const scanCode = ref('')
const mostrarEscaner = ref(false)
const cantidadScan = ref(1)
const manualItemCode = ref('')
const cantidadManual = ref(1)
const mostrarManual = ref(false)

const cola = ref<ColaItem[]>([])
const enviados = ref<EnviadoItem[]>([])
const errores = ref<ErrorItem[]>([])
const procesando = ref(false)

const validacionPendiente = new Set<string>()
let validando = false

let idCounter = 0
function genId() {
  return `${Date.now()}-${++idCounter}`
}

function getCachedItem(itemCode: string): CachedItemInfo | null {
  try {
    const raw = localStorage.getItem(ITEM_CACHE_PREFIX + itemCode.toUpperCase())
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedItemInfo
    if (Date.now() - parsed.cachedAt > ITEM_CACHE_TTL) {
      localStorage.removeItem(ITEM_CACHE_PREFIX + itemCode.toUpperCase())
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function setCachedItem(itemCode: string, info: { exists: boolean; description: string | null }) {
  try {
    localStorage.setItem(ITEM_CACHE_PREFIX + itemCode.toUpperCase(), JSON.stringify({
      ...info,
      cachedAt: Date.now()
    }))
  } catch {
    // localStorage full or unavailable — skip
  }
}

function aplicarValidacion(itemCode: string, info: { exists: boolean; description: string | null }) {
  for (const item of enviados.value) {
    if (item.itemCode === itemCode && item.existe === null) {
      item.existe = info.exists
      item.description = info.description
    }
  }
}

async function procesarValidaciones() {
  if (validando || validacionPendiente.size === 0) return
  validando = true

  while (validacionPendiente.size > 0) {
    const [itemCode] = validacionPendiente
    validacionPendiente.delete(itemCode)

    const cached = getCachedItem(itemCode)
    if (cached) {
      aplicarValidacion(itemCode, cached)
      continue
    }

    try {
      const result = await inventarioSesionesService.validateItem(itemCode)
      const info = { exists: result.exists, description: result.description ?? null }
      setCachedItem(itemCode, info)
      aplicarValidacion(itemCode, info)
    } catch {
      // Validation failed — item stays with existe = null (mostrar "...")
    }
  }

  validando = false
}

function encolarValidacion(itemCode: string) {
  const cached = getCachedItem(itemCode)
  if (cached) {
    aplicarValidacion(itemCode, cached)
    return
  }
  if (!validacionPendiente.has(itemCode)) {
    validacionPendiente.add(itemCode)
    procesarValidaciones()
  }
}

function onOnline() { online.value = true }
function onOffline() { online.value = false }

function statusLabel(status: InventorySessionStatus): string {
  return { Open: 'Abierta', Recount: 'Reconteo', Closed: 'Cerrada', Expired: 'No realizado' }[status] ?? status
}

function badgeClass(status: InventorySessionStatus): string {
  return { Open: 'badge-blue', Recount: 'badge-amber', Closed: 'badge-gray', Expired: 'badge-red' }[status] ?? 'badge-gray'
}

function volver() {
  router.push({ name: 'inventario-mis-inventarios' })
}

function irAlResumen() {
  router.push({ name: 'inventario-resumen-picking', params: { sessionId } })
}

async function cargarInfoSesion() {
  errorCarga.value = null
  try {
    const status = await inventarioSesionesService.getSessionStatus(sessionId)
    sessionInfo.value = {
      warehouseCode: status.warehouseCode,
      warehouseName: status.warehouseName,
      description: status.description,
      status: status.status as InventorySessionStatus
    }
  } catch (e: any) {
    errorCarga.value = e.message ?? 'No se pudo cargar la sesión.'
  }
}

function agregarACola(itemCode: string, quantity: number, source: 'Scan' | 'Manual', sc?: string | null) {
  if (!itemCode.trim()) return
  cola.value.push({
    id: genId(),
    itemCode: itemCode.trim().toUpperCase(),
    quantity: quantity >= 1 ? quantity : 1,
    source,
    scanCode: sc ?? null
  })
  procesarCola()
}

async function procesarCola() {
  if (procesando.value || cola.value.length === 0) return
  procesando.value = true

  while (cola.value.length > 0) {
    const item = cola.value[0]
    try {
      const result = await inventarioSesionesService.addCount(sessionId, {
        itemCode: item.itemCode,
        quantity: item.quantity,
        source: item.source,
        scanCode: item.scanCode
      })
      if (item.source === 'Scan') {
        const resolvedCode = result.itemCode
        const wasResolved = resolvedCode.toUpperCase() !== item.itemCode.toUpperCase()
        enviados.value.unshift({
          id: item.id,
          itemCode: resolvedCode,
          quantity: item.quantity,
          existe: wasResolved ? null : false,
          description: null
        })
        if (wasResolved) encolarValidacion(resolvedCode)
      } else {
        enviados.value.unshift({
          id: item.id,
          itemCode: item.itemCode,
          quantity: item.quantity,
          existe: null,
          description: null
        })
        encolarValidacion(item.itemCode)
      }
    } catch (e: any) {
      errores.value.push({
        id: item.id,
        itemCode: item.itemCode,
        quantity: item.quantity,
        source: item.source,
        scanCode: item.scanCode,
        errorMsg: e.message ?? 'Error de conexión'
      })
    }
    cola.value.shift()
  }

  procesando.value = false
}

function onScanEnter() {
  const code = scanCode.value.trim()
  if (!code) return
  agregarACola(code, cantidadScan.value, 'Scan', code)
  scanCode.value = ''
  cantidadScan.value = 1
  nextTick(() => barcodeInputRef.value?.focus())
}

function onCodigoEscaneado(code: string) {
  mostrarEscaner.value = false
  agregarACola(code, cantidadScan.value, 'Scan', code)
  cantidadScan.value = 1
  nextTick(() => barcodeInputRef.value?.focus())
}

function onManualEnter() {
  if (!manualItemCode.value.trim()) return
  agregarACola(manualItemCode.value.trim(), cantidadManual.value, 'Manual', null)
  manualItemCode.value = ''
  cantidadManual.value = 1
}

function reenviarTodos() {
  const items = errores.value.splice(0)
  for (const e of items) {
    cola.value.push({ id: e.id, itemCode: e.itemCode, quantity: e.quantity, source: e.source, scanCode: e.scanCode })
  }
  procesarCola()
}

function reenviarItem(e: ErrorItem) {
  errores.value = errores.value.filter(err => err.id !== e.id)
  cola.value.push({ id: e.id, itemCode: e.itemCode, quantity: e.quantity, source: e.source, scanCode: e.scanCode })
  procesarCola()
}

onMounted(async () => {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  await cargarInfoSesion()
  nextTick(() => barcodeInputRef.value?.focus())
})

onUnmounted(() => {
  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)
})
</script>

<style scoped>
.scan-input {
  @apply w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
}
.qty-input {
  @apply w-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-2.5 text-sm text-gray-900 dark:text-white text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500;
}
.btn-primary {
  @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed;
}
.btn-secondary {
  @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed;
}
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.badge-amber { @apply bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.badge-red { @apply bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
</style>
