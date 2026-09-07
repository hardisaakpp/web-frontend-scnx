<template>
  <div class="w-full px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-blue-600 dark:text-blue-400">Inventario</p>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Toma Física</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tomas físicas de inventario. Acceso: supervisores y administradores.
        </p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" class="btn-secondary" :disabled="loading" @click="cargar">
          <ArrowPathIcon class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualizar
        </button>
        <button v-if="canGenerar" type="button" class="btn-primary" @click="mostrarModal = true">
          <PlusIcon class="w-4 h-4 mr-1" />
          Nueva Toma
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

      <!-- Separador vertical -->
      <div class="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

      <!-- Búsqueda -->
      <input
        v-model="busqueda"
        type="search"
        placeholder="Buscar bodega, descripción, referencia..."
        class="search-input w-64"
      />
    </div>

    <div v-if="error" class="mb-4 alert-error">{{ error }}</div>
    <div v-if="exito" class="mb-4 alert-success">{{ exito }}</div>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="loading && sesiones.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
      <div v-else-if="sesionesFiltradas.length === 0" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay tomas físicas{{ filtroEstado ? ' en este estado' : '' }}.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/60">
            <tr>
              <th class="th cursor-pointer select-none" @click="toggleSort('warehouseCode')">Bodega{{ sortIndicator('warehouseCode') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('description')">Descripción{{ sortIndicator('description') }}</th>
              <th class="th cursor-pointer select-none" @click="toggleSort('status')">Estado{{ sortIndicator('status') }}</th>
              <th class="th text-right cursor-pointer select-none" @click="toggleSort('totalItems')">Listado (items / cant.){{ sortIndicator('totalItems') }}</th>
              <th
                class="th cursor-pointer select-none"
                title="Fechas definidas al crear la toma o el plan — no las reales de ejecución (ver Resumen)"
                @click="toggleSort('definedOpenDate')"
              >Fecha definida (apertura → cierre){{ sortIndicator('definedOpenDate') }}</th>
              <th class="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="s in sesionesPaginadas" :key="s.sessionId" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="td">
                <div class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ s.warehouseCode }}</div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ s.warehouseName }}</div>
              </td>
              <td class="td">
                <span v-if="s.description" class="text-sm">{{ s.description }}</span>
                <span v-else class="text-xs text-gray-400 dark:text-gray-600 italic">—</span>
                <div v-if="s.referenceCode" class="mt-0.5">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {{ s.referenceCode }}
                  </span>
                </div>
              </td>
              <td class="td whitespace-nowrap">
                <span :class="['badge', badgeClass(s.status)]">{{ statusLabel(s.status) }}</span>
                <span
                  v-if="s.status === 'Closed' && s.hasApprovedAdjustment"
                  class="inline-flex items-center ml-1 text-emerald-500"
                  title="Cerrado con informe de ajuste aprobado"
                >
                  <CheckBadgeIcon class="w-4 h-4" />
                </span>
                <span
                  v-else-if="s.status === 'Closed' && s.adjustmentDiscarded"
                  class="inline-flex items-center ml-1 text-gray-400"
                  title="Cerrado — revisado sin ajuste"
                >
                  <CheckBadgeIcon class="w-4 h-4" />
                </span>
              </td>
              <td class="td text-right whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {{ s.totalItems }} <span class="text-gray-400 dark:text-gray-500">items</span> / {{ fmtCantidad(s.totalQuantity) }}
              </td>
              <td class="td whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(s.definedOpenDate) }} <span class="text-gray-300 dark:text-gray-600">→</span> {{ s.definedCloseDate ? formatDate(s.definedCloseDate) : '—' }}
              </td>
              <td class="td text-right whitespace-nowrap">
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Más opciones"
                  title="Más opciones"
                  @click="abrirMenu($event, s.sessionId)"
                >
                  <EllipsisVerticalIcon class="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="sesionesFiltradas.length > 0" class="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <span>
          Mostrando {{ (paginaActual - 1) * porPagina + 1 }}–{{ Math.min(paginaActual * porPagina, sesionesFiltradas.length) }}
          de {{ sesionesFiltradas.length }}
        </span>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary px-2 py-1" :disabled="paginaActual === 1" @click="paginaActual--">‹</button>
          <span>{{ paginaActual }} / {{ totalPaginas }}</span>
          <button type="button" class="btn-secondary px-2 py-1" :disabled="paginaActual === totalPaginas" @click="paginaActual++">›</button>
        </div>
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

    <RecountAssignmentModal
      :is-open="!!sesionParaReparto"
      :session-id="sesionParaReparto"
      @close="sesionParaReparto = null"
      @confirmed="onRepartoConfirmado"
    />

    <!-- Menú flotante de acciones (Teleport + overlay) -->
    <Teleport to="body">
      <div v-if="menuAbierto" class="fixed inset-0 z-40" @click="cerrarMenu" />

      <Transition
        enter-active-class="transition-all duration-150"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-100"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="menuAbierto && menuSesion"
          ref="menuRef"
          class="fixed z-50 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-xl
                 border border-gray-100 dark:border-gray-700 py-1 origin-top-right"
          :style="menuStyle"
        >
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            @click="irADetalle(menuSesion.sessionId); cerrarMenu()"
          >
            <EyeIcon class="w-4 h-4 flex-shrink-0 text-gray-400" />
            Ver detalle
          </button>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400
                   hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left"
            @click="irAResumenSupervisor(menuSesion.sessionId); cerrarMenu()"
          >
            <ChartBarIcon class="w-4 h-4 flex-shrink-0" />
            Resumen
          </button>
          <template v-if="menuSesion.status !== 'Closed'">
            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-violet-600 dark:text-violet-400
                     hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-left"
              @click="irAContarArticulos(menuSesion.sessionId); cerrarMenu()"
            >
              <ClipboardDocumentListIcon class="w-4 h-4 flex-shrink-0" />
              Contar artículos
            </button>

            <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              @click="abrirPickers(menuSesion); cerrarMenu()"
            >
              <UsersIcon class="w-4 h-4 flex-shrink-0 text-gray-400" />
              Gestionar usuarios de picking
            </button>

            <div class="border-t border-gray-100 dark:border-gray-700 my-1" />

            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400
                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              @click="confirmandoCierre = menuSesion.sessionId; cerrarMenu()"
            >
              <XCircleIcon class="w-4 h-4 flex-shrink-0" />
              Cerrar toma
            </button>
          </template>
          <button
            v-if="menuSesion.status === 'Open'"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400
                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            @click="confirmandoEliminacion = menuSesion.sessionId; cerrarMenu()"
          >
            <TrashIcon class="w-4 h-4 flex-shrink-0" />
            Eliminar toma
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de confirmación: cerrar toma física -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="confirmandoCierre"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="cerrando !== confirmandoCierre && (confirmandoCierre = null)"
        >
          <div class="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 ring-1 ring-black/5">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ExclamationTriangleIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">Cerrar toma física</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Se generará el snapshot inmutable. No se puede deshacer.</p>
              </div>
            </div>
            <p v-if="sesionAConfirmarCierre" class="text-sm text-gray-600 dark:text-gray-300 mb-6">
              ¿Confirmas cerrar la toma física de
              <span class="font-semibold text-gray-900 dark:text-white">{{ sesionAConfirmarCierre.warehouseName }}</span>?
            </p>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="btn-secondary"
                :disabled="cerrando === confirmandoCierre"
                @click="confirmandoCierre = null"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-danger"
                :disabled="cerrando === confirmandoCierre"
                @click="cerrarTomaFisica(confirmandoCierre)"
              >
                {{ cerrando === confirmandoCierre ? 'Cerrando...' : 'Cerrar toma' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal de confirmación: eliminar toma -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="confirmandoEliminacion"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="eliminando !== confirmandoEliminacion && (confirmandoEliminacion = null)"
        >
          <div class="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 ring-1 ring-black/5">
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ExclamationTriangleIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">Eliminar toma</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Se eliminará junto con todos sus conteos. No se puede deshacer.</p>
              </div>
            </div>
            <p v-if="sesionAConfirmarEliminacion" class="text-sm text-gray-600 dark:text-gray-300 mb-6">
              ¿Confirmas eliminar la toma de
              <span class="font-semibold text-gray-900 dark:text-white">{{ sesionAConfirmarEliminacion.warehouseName }}</span>?
            </p>
            <div class="flex justify-end gap-3">
              <button
                type="button"
                class="btn-secondary"
                :disabled="eliminando === confirmandoEliminacion"
                @click="confirmandoEliminacion = null"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-danger"
                :disabled="eliminando === confirmandoEliminacion"
                @click="eliminarTomaFisica(confirmandoEliminacion)"
              >
                {{ eliminando === confirmandoEliminacion ? 'Eliminando...' : 'Eliminar toma' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowPathIcon,
  PlusIcon,
  UsersIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import { CheckBadgeIcon } from '@heroicons/vue/24/solid'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { InventorySessionListItemDto, InventorySessionStatus } from '../types'
import CrearSesionDirectaModal from '../components/CrearSesionDirectaModal.vue'
import PickerManagementModal from '../components/PickerManagementModal.vue'
import RecountAssignmentModal from '../components/RecountAssignmentModal.vue'
import { useInventarioModulePermissions } from '../composables/useInventarioModulePermissions'

const { canGenerar } = useInventarioModulePermissions()
const router = useRouter()
const sesiones = ref<InventorySessionListItemDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const exito = ref<string | null>(null)
const mostrarModal = ref(false)
const sesionPickers = ref<InventorySessionListItemDto | null>(null)
const sesionParaReparto = ref<string | null>(null)
const filtroEstado = ref<InventorySessionStatus | null>(null)
const confirmandoCierre = ref<string | null>(null)
const cerrando = ref<string | null>(null)
const confirmandoEliminacion = ref<string | null>(null)
const eliminando = ref<string | null>(null)

const menuAbierto = ref<string | null>(null)
const menuStyle = ref({ top: '0px', right: '0px' })
const menuRef = ref<HTMLElement | null>(null)
const menuSesion = computed(() => sesionesFiltradas.value.find(s => s.sessionId === menuAbierto.value) ?? null)
const sesionAConfirmarCierre = computed(() => sesiones.value.find(s => s.sessionId === confirmandoCierre.value) ?? null)
const sesionAConfirmarEliminacion = computed(() => sesiones.value.find(s => s.sessionId === confirmandoEliminacion.value) ?? null)

async function abrirMenu(e: MouseEvent, id: string) {
  e.stopPropagation()
  if (menuAbierto.value === id) { menuAbierto.value = null; return }
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  const margin = 6
  const right = window.innerWidth - rect.right

  // Posición inicial: debajo del botón
  menuStyle.value = { top: `${rect.bottom + window.scrollY + margin}px`, right: `${right}px` }
  menuAbierto.value = id

  // Tras montar el menú, si no cabe debajo lo abrimos hacia arriba
  await nextTick()
  const menuHeight = menuRef.value?.offsetHeight ?? 0
  if (menuHeight && rect.bottom + menuHeight + margin > window.innerHeight) {
    const top = Math.max(margin, rect.top - menuHeight - margin) + window.scrollY
    menuStyle.value = { top: `${top}px`, right: `${right}px` }
  }
}

function cerrarMenu() {
  menuAbierto.value = null
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
// Estándar de listados del proyecto: al abrir, solo los últimos 15 días. El rango viaja al servidor
// (ver inventarioSesionesService.getSesiones): cada toma devuelta implica calcular su alcance contra
// sc_maestros, por eso traer el histórico completo hacía que la pantalla tardara tanto en cargar.
const DIAS_POR_DEFECTO = 15
const hoy = new Date()
const inicioPorDefecto = new Date(hoy)
inicioPorDefecto.setDate(inicioPorDefecto.getDate() - DIAS_POR_DEFECTO)

const fechaDesde = ref<string>(toISODate(inicioPorDefecto))
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

const busqueda = ref('')

type SesionSortKey = 'warehouseCode' | 'description' | 'status' | 'totalItems' | 'definedOpenDate'
const sortKey = ref<SesionSortKey>('definedOpenDate')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(key: SesionSortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIndicator(key: SesionSortKey) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}

function sortValue(s: InventorySessionListItemDto, key: SesionSortKey): string | number {
  if (key === 'definedOpenDate') return new Date(s.definedOpenDate).getTime()
  if (key === 'description') return s.description ?? ''
  return s[key]
}

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

  const q = busqueda.value.trim().toLowerCase()
  if (q) {
    result = result.filter(s =>
      s.warehouseCode.toLowerCase().includes(q) ||
      s.warehouseName.toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q) ||
      (s.referenceCode ?? '').toLowerCase().includes(q)
    )
  }

  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...result].sort((a, b) => {
    const av = sortValue(a, key)
    const bv = sortValue(b, key)
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv)) * dir
    }
    return ((av as number) - (bv as number)) * dir
  })
})

const porPagina = 10
const paginaActual = ref(1)
const totalPaginas = computed(() => Math.max(1, Math.ceil(sesionesFiltradas.value.length / porPagina)))
const sesionesPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina
  return sesionesFiltradas.value.slice(inicio, inicio + porPagina)
})

// Cualquier cambio de filtro/orden vuelve a la página 1 — evita quedar parado en una página vacía.
watch([filtroEstado, fechaDesde, fechaHasta, busqueda, sortKey, sortDir], () => { paginaActual.value = 1 })

// El rango de fechas se resuelve en el servidor: al cambiarlo se vuelve a consultar (con una pausa
// corta para no disparar una consulta por cada tecla del selector de fecha).
let recargaPendiente: ReturnType<typeof setTimeout> | null = null
watch([fechaDesde, fechaHasta], () => {
  if (recargaPendiente) clearTimeout(recargaPendiente)
  recargaPendiente = setTimeout(() => { void cargar() }, 400)
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
  return { Open: 'Abierta', Recount: 'Reconteo', Closed: 'Cerrada', Expired: 'No realizado' }[status] ?? status
}

function badgeClass(status: InventorySessionStatus): string {
  return {
    Open: 'badge-blue',
    Recount: 'badge-amber',
    Closed: 'badge-gray',
    Expired: 'badge-red'
  }[status] ?? 'badge-gray'
}

// Fechas DEFINIDAS (plan/toma), sin hora — a diferencia de las reales de ejecución que se ven en
// el Resumen de Supervisor, estas son fechas puras sin componente de tiempo significativo.
function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const cantidadFmt = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 })
function fmtCantidad(value: number): string {
  return cantidadFmt.format(value || 0)
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    sesiones.value = await inventarioSesionesService.getSesiones({
      since: fechaDesde.value ? `${fechaDesde.value}T00:00:00` : undefined,
      until: fechaHasta.value ? `${fechaHasta.value}T23:59:59` : undefined,
    })
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar sesiones.'
  } finally {
    loading.value = false
  }
}

function irAResumenSupervisor(sessionId: string) {
  router.push({ name: 'inventario-supervisor-resumen', params: { sessionId } })
}

function irAContarArticulos(sessionId: string) {
  router.push({ name: 'inventario-contar-articulos', params: { sessionId } })
}

function irADetalle(sessionId: string) {
  router.push({ name: 'inventario-detalle-toma', params: { sessionId } })
}

async function cerrarTomaFisica(sessionId: string) {
  cerrando.value = sessionId
  error.value = null
  try {
    const result = await inventarioSesionesService.closeSession(sessionId, null)
    confirmandoCierre.value = null
    if (result.status === 'Recount') {
      exito.value = 'Se encontraron diferencias — la toma pasó a Reconteo.'
      sesionParaReparto.value = sessionId
    } else {
      exito.value = 'Toma física cerrada. El snapshot inmutable fue generado.'
    }
    setTimeout(() => { exito.value = null }, 4000)
    await cargar()
  } catch (e: any) {
    error.value = e.message ?? 'Error al cerrar la toma física.'
  } finally {
    cerrando.value = null
  }
}

function onRepartoConfirmado() {
  exito.value = 'Reparto de reconteo confirmado.'
  setTimeout(() => { exito.value = null }, 4000)
}

async function eliminarTomaFisica(sessionId: string) {
  eliminando.value = sessionId
  error.value = null
  try {
    await inventarioSesionesService.deleteSesion(sessionId)
    confirmandoEliminacion.value = null
    exito.value = 'Toma eliminada correctamente.'
    setTimeout(() => { exito.value = null }, 4000)
    await cargar()
  } catch (e: any) {
    error.value = e.message ?? 'Error al eliminar la toma.'
  } finally {
    eliminando.value = null
  }
}

function abrirPickers(s: InventorySessionListItemDto) {
  sesionPickers.value = s
}

function onSesionCreada() {
  mostrarModal.value = false
  exito.value = 'Sesión creada correctamente.'
  setTimeout(() => { exito.value = null }, 4000)
  cargar()
}

onMounted(cargar)
</script>

<style scoped>
.th { @apply px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400; }
.td { @apply px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle; }
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-danger { @apply inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-blue { @apply bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300; }
.badge-amber { @apply bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300; }
.badge-gray { @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400; }
.badge-red { @apply bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
.alert-success { @apply rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-300; }
.date-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.search-input { @apply rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
</style>
