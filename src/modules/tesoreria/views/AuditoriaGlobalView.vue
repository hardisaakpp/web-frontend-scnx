<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <!-- Navegación superior -->
    <div class="flex items-center justify-between">
      <VolverButton to="/tesoreria" label="Tesorería" />
      <nav aria-label="Ruta de navegación" class="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <router-link to="/" class="hover:text-gray-900 dark:hover:text-gray-200">Inicio</router-link>
        <span aria-hidden="true">/</span>
        <router-link to="/tesoreria" class="hover:text-gray-900 dark:hover:text-gray-200">Tesorería</router-link>
        <span aria-hidden="true">/</span>
        <span class="font-medium text-gray-800 dark:text-gray-200" aria-current="page">Auditoría Mabel</span>
      </nav>
    </div>

    <!-- Título y descripción -->
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
        Auditoría de Depósitos — Mabel Trading
      </h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ tieneAccesoGlobal ? 'Sábana general consolidada a nivel nacional con trazabilidad de comprobantes e integración a SAP.' : 'Sábana consolidada de las tiendas pertenecientes a su zona asignada.' }}
      </p>
    </header>

    <!-- Barra de filtros -->
    <section aria-label="Filtros de auditoría" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-xs">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Fecha Desde -->
        <div class="flex flex-col gap-1">
          <label for="fechaDesde" class="text-xs font-semibold text-gray-700 dark:text-gray-300">Desde</label>
          <input
            id="fechaDesde"
            v-model="fechaDesde"
            type="date"
            :max="fechaHasta"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <!-- Fecha Hasta -->
        <div class="flex flex-col gap-1">
          <label for="fechaHasta" class="text-xs font-semibold text-gray-700 dark:text-gray-300">Hasta</label>
          <input
            id="fechaHasta"
            v-model="fechaHasta"
            type="date"
            :min="fechaDesde"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <!-- Filtro por almacén -->
        <div class="flex flex-col gap-1">
          <label for="almacenFiltro" class="text-xs font-semibold text-gray-700 dark:text-gray-300">Almacén</label>
          <select
            id="almacenFiltro"
            v-model="codigoAlmacenFiltro"
            class="w-44 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option v-for="op in opcionesAlmacenes" :key="op.codigo" :value="op.codigo">{{ op.label }}</option>
          </select>
        </div>

        <!-- Búsqueda rápida sobre la página actual -->
        <div class="flex flex-col gap-1 flex-1 min-w-[14rem]">
          <label for="busquedaRapida" class="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Filtro rápido en página
          </label>
          <div class="relative">
            <input
              id="busquedaRapida"
              v-model="busquedaRapida"
              type="search"
              placeholder="Buscar por comprobante o responsable…"
              class="w-full px-3 py-2 pl-9 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="!!errorRango || loading"
            :aria-busy="loading"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs transition-colors"
            @click="consultar(1)"
          >
            <svg v-if="loading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <MagnifyingGlassIcon v-else class="h-4 w-4" aria-hidden="true" />
            Consultar
          </button>

          <button
            type="button"
            :disabled="!!errorRango || loadingCsv || items.length === 0"
            :aria-busy="loadingCsv"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 shadow-2xs transition-colors"
            @click="onExportarCsv"
          >
            <svg v-if="loadingCsv" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <ArrowDownTrayIcon v-else class="h-4 w-4" aria-hidden="true" />
            Exportar CSV
          </button>
        </div>
      </div>

      <p v-if="errorRango" class="mt-2 text-xs font-semibold text-vermilion-700 dark:text-vermilion-400">
        {{ errorRango }}
      </p>

      <p
        v-if="error"
        role="alert"
        class="mt-3 rounded-lg bg-vermilion-50 dark:bg-vermilion-900/20 border border-vermilion-200 dark:border-vermilion-800 px-3 py-2 text-sm text-vermilion-800 dark:text-vermilion-300"
      >
        {{ error }}
      </p>
    </section>

    <!-- Grilla de auditoría global -->
    <section aria-label="Sábana de comprobantes" class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xs">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <caption class="sr-only">Sábana de auditoría de depósitos bancarios</caption>
        <thead class="bg-gray-50 dark:bg-gray-900/80">
          <tr>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Almacén</th>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Cierre Caja</th>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Fecha Depósito</th>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">N.º Comprobante</th>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Responsable</th>
            <th scope="col" class="px-4 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">Monto</th>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Estado</th>
            <th scope="col" class="px-4 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          <tr v-if="loading" v-for="i in 6" :key="`sk-${i}`">
            <td v-for="c in 8" :key="c" class="px-4 py-3.5">
              <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" :class="c === 6 ? 'w-16 ml-auto' : 'w-20'"></div>
            </td>
          </tr>
          <tr v-else-if="itemsFiltrados.length === 0">
            <td colspan="8" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              No se encontraron depósitos que coincidan con los filtros seleccionados.
            </td>
          </tr>
          <tr
            v-for="item in (loading ? [] : itemsFiltrados)"
            :key="item.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            :class="item.creadoSAP ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-l-4 border-l-emerald-500' : ''"
          >
            <td class="px-4 py-3.5 font-bold text-gray-900 dark:text-white">{{ item.codigoAlmacen }}</td>
            <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">{{ formatDateOnly(item.fechaCierreCaja) }}</td>
            <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">{{ formatDateOnly(item.fechaDepositoBanco) }}</td>
            <td class="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">{{ item.numeroComprobante }}</td>
            <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">{{ item.responsable }}</td>
            <td class="px-4 py-3.5 text-right font-bold text-gray-900 dark:text-white">{{ formatCurrency(item.montoDepositado) }}</td>
            <td class="px-4 py-3.5">
              <SemaforoEstadoBadge
                :estado="item.estado"
                :creado-s-a-p="item.creadoSAP"
                :doc-entry-s-a-p="item.docEntrySAP"
              />
            </td>
            <td class="px-4 py-3.5">
              <div class="flex items-center justify-end gap-1.5">
                <!-- Ver comprobante -->
                <button
                  type="button"
                  class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  title="Ver comprobante adjunto"
                  aria-label="Ver comprobante adjunto"
                  @click="onVerComprobante(item)"
                >
                  <EyeIcon class="h-4 w-4" aria-hidden="true" />
                </button>

                <!-- Reintentar envío a SAP -->
                <button
                  v-if="puedeIntegrarSap && item.estado !== EstadoDeposito.IntegradoSAP && item.estado !== EstadoDeposito.Anulado"
                  type="button"
                  :disabled="reintentandoIds.has(item.id)"
                  :aria-busy="reintentandoIds.has(item.id)"
                  class="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  title="Reintentar integración a SAP"
                  aria-label="Reintentar integración a SAP"
                  @click="reintentarSap(item)"
                >
                  <ArrowPathIcon class="h-4 w-4" :class="{ 'animate-spin': reintentandoIds.has(item.id) }" aria-hidden="true" />
                </button>

                <!-- Anular depósito si no está integrado en SAP -->
                <button
                  v-if="puedeEliminar && !item.creadoSAP && item.estado !== EstadoDeposito.Anulado"
                  type="button"
                  :disabled="anulandoIds.has(item.id)"
                  :aria-busy="anulandoIds.has(item.id)"
                  class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  title="Anular depósito"
                  aria-label="Anular depósito"
                  @click="abrirModalAnular(item)"
                >
                  <TrashIcon class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Paginador accesible -->
    <footer class="flex items-center justify-between">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Mostrando {{ itemsFiltrados.length }} de <strong>{{ totalCount }}</strong> registro(s) en total
      </p>
      <QuickTablePagination
        :model-value="pageNumber"
        :total-pages="totalPages"
        :disabled="loading"
        @update:model-value="consultar"
      />
    </footer>

    <!-- Modales -->
    <ModalVisorComprobante
      :open="modalVisorAbierto"
      :file-url="urlComprobante"
      :file-name="itemParaVisor?.nombreArchivoOriginal ?? itemParaVisor?.numeroComprobante ?? null"
      @close="modalVisorAbierto = false"
    />

    <ModalAnularDeposito
      :open="modalAnularAbierto"
      :numero-comprobante="itemParaAnular?.numeroComprobante ?? ''"
      :anulando="itemParaAnular ? anulandoIds.has(itemParaAnular.id) : false"
      @close="modalAnularAbierto = false"
      @confirmar="onConfirmarAnular"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowDownTrayIcon, ArrowPathIcon, EyeIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import VolverButton from '@/components/VolverButton.vue'
import { useAuditoriaGlobal } from '../composables/useAuditoriaGlobal'
import { useTesoreriaAccess } from '../composables/useTesoreriaAccess'
import { extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import { formatCurrency, formatDateOnly, toDateOnlyString } from '../utils/formatters'
import { EstadoDeposito, type AuditoriaGlobalDto } from '../types/tesoreria.types'
import SemaforoEstadoBadge from '../components/SemaforoEstadoBadge.vue'
import ModalVisorComprobante from '../components/ModalVisorComprobante.vue'
import ModalAnularDeposito from '../components/ModalAnularDeposito.vue'

const RANGO_MAXIMO_DIAS = 30

const toast = useToast()
const {
  items, totalCount, pageNumber, pageSize, totalPages, loading, loadingCsv, error,
  reintentandoIds, anulandoIds,
  fetchAuditoria, exportarCsv, reintentarSap, anular
} = useAuditoriaGlobal()

const { tieneAccesoGlobal, opcionesAlmacenes, puedeEliminar, puedeIntegrarSap } = useTesoreriaAccess()

const hoy = new Date()
const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)

const fechaDesde = ref(toDateOnlyString(hace7Dias))
const fechaHasta = ref(toDateOnlyString(hoy))
const codigoAlmacenFiltro = ref(tieneAccesoGlobal.value ? '' : (opcionesAlmacenes.value[0]?.codigo ?? ''))
const busquedaRapida = ref('')

const modalVisorAbierto = ref(false)
const modalAnularAbierto = ref(false)
const itemParaVisor = ref<AuditoriaGlobalDto | null>(null)
const itemParaAnular = ref<AuditoriaGlobalDto | null>(null)
const urlComprobante = ref<string | null>(null)

const errorRango = computed(() => {
  if (!fechaDesde.value || !fechaHasta.value) return null
  const dias = (new Date(fechaHasta.value).getTime() - new Date(fechaDesde.value).getTime()) / (1000 * 60 * 60 * 24)
  if (dias < 0) return 'La fecha "Hasta" debe ser posterior a la fecha "Desde".'
  if (dias > RANGO_MAXIMO_DIAS) return `El rango máximo permitido es de ${RANGO_MAXIMO_DIAS} días continuos.`
  return null
})

const itemsFiltrados = computed(() => {
  const termino = busquedaRapida.value.trim().toLowerCase()
  if (!termino) return items.value
  return items.value.filter(
    i => i.numeroComprobante.toLowerCase().includes(termino) || i.responsable.toLowerCase().includes(termino)
  )
})

async function consultar(pagina = 1): Promise<void> {
  if (errorRango.value) return
  await fetchAuditoria({
    fechaDesde: fechaDesde.value,
    fechaHasta: fechaHasta.value,
    codigoAlmacen: codigoAlmacenFiltro.value.trim().toUpperCase() || null,
    pageNumber: pagina,
    pageSize: pageSize.value
  })
}

async function onExportarCsv(): Promise<void> {
  if (errorRango.value) return
  await exportarCsv({
    fechaDesde: fechaDesde.value,
    fechaHasta: fechaHasta.value,
    codigoAlmacen: codigoAlmacenFiltro.value.trim().toUpperCase() || null
  })
}

async function onVerComprobante(item: AuditoriaGlobalDto): Promise<void> {
  itemParaVisor.value = item
  urlComprobante.value = null
  modalVisorAbierto.value = true
  try {
    const resultado = await tesoreriaService.obtenerUrlComprobante(item.id)
    urlComprobante.value = resultado.url
  } catch (err) {
    toast.error('No se pudo cargar el comprobante', extraerMensajeError(err))
  }
}

function abrirModalAnular(item: AuditoriaGlobalDto): void {
  itemParaAnular.value = item
  modalAnularAbierto.value = true
}

async function onConfirmarAnular(motivo: string): Promise<void> {
  if (!itemParaAnular.value) return
  await anular(itemParaAnular.value, motivo)
  modalAnularAbierto.value = false
}

onMounted(() => {
  consultar(1)
})
</script>
