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
        <span class="font-medium text-gray-800 dark:text-gray-200" aria-current="page">Mis Depósitos</span>
      </nav>
    </div>

    <!-- Título y descripción -->
    <header>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Mis Depósitos</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Concilie el efectivo recaudado en cada cierre de caja contra lo efectivamente depositado en las cuentas bancarias de la empresa.
      </p>
    </header>

    <!-- Barra de filtros y control -->
    <section aria-label="Filtros de consulta" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-xs">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Selector de almacén con scoping por rol -->
        <div class="flex flex-col gap-1">
          <label for="almacenInput" class="text-xs font-semibold text-gray-700 dark:text-gray-300">Almacén</label>

          <!-- Supervisor / Contabilidad / Admin: selección entre sus almacenes autorizados -->
          <select
            v-if="opcionesAlmacenes.length > 1"
            id="almacenInput"
            v-model="almacenSeleccionado"
            class="w-44 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option v-for="op in opcionesAlmacenes" :key="op.codigo" :value="op.codigo">{{ op.label }}</option>
          </select>

          <!-- Cajero de tienda: tienda física fija e inmutable -->
          <div v-else class="flex flex-col">
            <select
              id="almacenInput"
              v-model="almacenSeleccionado"
              disabled
              aria-describedby="almacenFijoHint"
              class="w-44 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium disabled:opacity-90"
            >
              <option v-for="op in opcionesAlmacenes" :key="op.codigo" :value="op.codigo">{{ op.label }}</option>
            </select>
            <span
              id="almacenFijoHint"
              class="mt-1 inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            >
              Tienda asignada
            </span>
          </div>
        </div>

        <!-- Rango de fechas (últimos 15 días por defecto) -->
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

        <div class="flex flex-col gap-1">
          <label for="fechaHasta" class="text-xs font-semibold text-gray-700 dark:text-gray-300">Hasta</label>
          <input
            id="fechaHasta"
            v-model="fechaHasta"
            type="date"
            :min="fechaDesde"
            :max="hoyStr"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          type="button"
          :disabled="!almacenSeleccionado || loadingResumen"
          :aria-busy="loadingResumen"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs transition-colors"
          @click="consultar"
        >
          <svg v-if="loadingResumen" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <MagnifyingGlassIcon v-else class="h-4 w-4" aria-hidden="true" />
          Consultar
        </button>
      </div>

      <p
        v-if="errorResumen"
        role="alert"
        class="mt-3 rounded-lg bg-vermilion-50 dark:bg-vermilion-900/20 border border-vermilion-200 dark:border-vermilion-800 px-3 py-2 text-sm text-vermilion-800 dark:text-vermilion-300"
      >
        {{ errorResumen }}
      </p>
    </section>

    <!-- Tarjetas KPI reactivas superiores (Modernización StoreControl|22) -->
    <section aria-label="Métricas del período consultado" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardKpiTesoreria
        title="Efectivo Cierres"
        :value="formatCurrency(totalEfectivoPeriodo)"
        :subtitle="`${resumen.length} día(s) con movimientos`"
        tone="indigo"
        :icon="BanknotesIcon"
        :loading="loadingResumen"
      />

      <CardKpiTesoreria
        title="Total Depositado"
        :value="formatCurrency(totalDepositadoPeriodo)"
        subtitle="Comprobantes registrados"
        tone="blue"
        :icon="BuildingLibraryIcon"
        :loading="loadingResumen"
      />

      <CardKpiTesoreria
        title="Diferencia Período"
        :value="formatCurrency(Math.abs(diferenciaPeriodo))"
        :subtitle="kpiDiferenciaSubtitle"
        :tone="kpiDiferenciaTone"
        :icon="kpiDiferenciaIcon"
        :loading="loadingResumen"
        :clickable="true"
        :active="filtroKpiActivo === 'conDiferencia'"
        badge-active-text="Filtro activo"
        aria-label="Filtrar días con diferencia entre efectivo y depositado"
        @click="toggleFiltroKpi('conDiferencia')"
      />

      <CardKpiTesoreria
        title="Pendientes SAP"
        :value="totalPendientesSap"
        :subtitle="totalPendientesSap === 0 ? 'Integraciones al día' : 'Requieren envío'"
        :tone="totalPendientesSap === 0 ? 'emerald' : 'amber'"
        :icon="ClockIcon"
        :loading="loadingResumen"
        :clickable="true"
        :active="filtroKpiActivo === 'pendientesSap'"
        badge-active-text="Filtro activo"
        aria-label="Filtrar días con depósitos pendientes de integrar a SAP"
        @click="toggleFiltroKpi('pendientesSap')"
      />
    </section>

    <!-- Barra de estado del filtro rápido KPI activo -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <output
        v-if="filtroKpiActivo !== 'todos'"
        class="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-800/80 px-4 py-2.5 shadow-sm backdrop-blur-xs"
      >
        <div class="flex items-center gap-2 text-sm text-slate-200">
          <span class="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true"></span>
          <span>Mostrando: <strong class="text-white">{{ etiquetaFiltroActivo }}</strong> ({{ resumenFiltrado.length }} de {{ resumen.length }} días)</span>
        </div>
        <button
          type="button"
          @click="limpiarFiltroKpi"
          class="inline-flex items-center gap-1.5 rounded-md bg-slate-700/60 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <span>Mostrar todos</span>
          <span aria-hidden="true">&times;</span>
        </button>
      </output>
    </Transition>

    <!-- Grilla comparativa diaria -->
    <section aria-label="Resumen diario de depósitos" class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xs">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <caption class="sr-only">Comparativo diario de recaudación en caja vs. depósitos bancarios</caption>
        <thead class="bg-gray-50 dark:bg-gray-900/80">
          <tr>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Fecha Venta</th>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Almacén</th>
            <th scope="col" class="px-4 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">Efectivo Cierre</th>
            <th scope="col" class="px-4 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">Total Depositado</th>
            <th scope="col" class="px-4 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">Estado Conciliación</th>
            <th scope="col" class="px-4 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          <tr v-if="loadingResumen" v-for="i in 4" :key="`sk-${i}`">
            <td v-for="c in 6" :key="c" class="px-4 py-3.5">
              <div class="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" :class="c === 3 || c === 4 ? 'w-20 ml-auto' : 'w-24'"></div>
            </td>
          </tr>
          <tr v-else-if="resumen.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <BanknotesIcon class="h-8 w-8 text-gray-400" aria-hidden="true" />
                <p class="font-medium">No se encontraron movimientos para el almacén y fechas seleccionadas.</p>
                <p class="text-xs">Verifique el almacén seleccionado o amplíe el rango de fechas.</p>
              </div>
            </td>
          </tr>
          <tr v-else-if="resumenFiltrado.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <CheckCircleIcon v-if="filtroKpiActivo === 'pendientesSap'" class="h-8 w-8 text-emerald-500" aria-hidden="true" />
                <CheckCircleIcon v-else-if="filtroKpiActivo === 'conDiferencia'" class="h-8 w-8 text-emerald-500" aria-hidden="true" />
                <BanknotesIcon v-else class="h-8 w-8 text-gray-400" aria-hidden="true" />

                <p v-if="filtroKpiActivo === 'pendientesSap'" class="font-medium text-gray-700 dark:text-gray-200">¡Todo al día! Sin pendientes de integración</p>
                <p v-else-if="filtroKpiActivo === 'conDiferencia'" class="font-medium text-gray-700 dark:text-gray-200">Todos los cierres de caja están cuadrados</p>
                <p v-else class="font-medium">No existen depósitos pendientes de integrar a SAP en este período.</p>

                <p v-if="filtroKpiActivo === 'pendientesSap'" class="text-xs">Todas las papeletas registradas en este rango ya fueron integradas a SAP con éxito.</p>
                <p v-else-if="filtroKpiActivo === 'conDiferencia'" class="text-xs">$0.00 de diferencia entre el efectivo declarado y lo depositado en todos los días del período.</p>

                <button
                  type="button"
                  @click="limpiarFiltroKpi"
                  class="mt-1 inline-flex items-center gap-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition hover:bg-indigo-100 dark:hover:bg-indigo-900/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Ver todos los días
                </button>
              </div>
            </td>
          </tr>
          <template v-for="fila in (loadingResumen ? [] : resumenFiltrado)" :key="fila.fechaCierre">
            <tr
              class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              :class="{ 'bg-indigo-50/70 dark:bg-indigo-900/30 border-l-4 border-l-indigo-500': filaSeleccionada?.fechaCierre === fila.fechaCierre && isDrawerOpen }"
              @click="seleccionarFila(fila)"
            >
              <td class="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">{{ formatDateOnly(fila.fechaCierre) }}</td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300 font-medium">{{ fila.codigoAlmacen }}</td>
              <td class="px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-white">{{ formatCurrency(fila.totalEfectivo) }}</td>
              <td class="px-4 py-3.5 text-right font-semibold text-gray-900 dark:text-white">{{ formatCurrency(fila.totalDepositado) }}</td>
              <td class="px-4 py-3.5">
                <SemaforoDiferenciaBadge :diferencia="fila.diferencia" />
              </td>
              <td class="px-4 py-3.5 text-right">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 rounded py-1 px-2"
                  :aria-expanded="filaSeleccionada?.fechaCierre === fila.fechaCierre && isDrawerOpen"
                  @click.stop="seleccionarFila(fila)"
                >
                  Ver papeletas
                  <ChevronRightIcon class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </section>

    <!-- Cajón lateral de detalle diario -->
    <DrawerDetalleDiario
      :open="isDrawerOpen"
      :fila="filaSeleccionada"
      :detalle="detalleActual"
      :loading="loadingDetalle"
      :error="errorDetalle"
      :enviando-sap-ids="enviandoSapIds"
      :anulando-ids="anulandoIds"
      :puede-crear="puedeCrear"
      :puede-integrar-sap="puedeIntegrarSap"
      :puede-eliminar="puedeEliminar"
      :errores-sap="erroresSapPorDeposito"
      @close="cerrarDrawer"
      @registrar-deposito="abrirModalRegistro"
      @integrar-sap="onIntegrarSap"
      @anular="abrirModalAnular"
      @ver-comprobante="onVerComprobante"
    />

    <!-- Modal para registrar nuevo depósito -->
    <ModalRegistroDeposito
      :open="modalRegistroAbierto"
      :almacen-id="almacenIdActual"
      :codigo-almacen="filaSeleccionada?.codigoAlmacen ?? almacenSeleccionado"
      :fecha-cierre-caja="filaSeleccionada?.fechaCierre ?? ''"
      :cuentas="cuentas"
      :loading-cuentas="loadingCuentas"
      :saldo-pendiente="saldoPendiente"
      :guardando="creandoDeposito"
      :errores-campo="erroresCampoDeposito"
      @close="modalRegistroAbierto = false"
      @guardar="onGuardarDeposito"
    />

    <!-- Modal para visualizar comprobante -->
    <ModalVisorComprobante
      :open="modalVisorAbierto"
      :file-url="urlComprobante"
      :file-name="nombreComprobante"
      :loading="cargandoComprobante"
      @close="modalVisorAbierto = false"
    />

    <!-- Modal de confirmación para anular depósito -->
    <ModalAnularDeposito
      :open="modalAnularAbierto"
      :numero-comprobante="depositoParaAnular?.numeroComprobante ?? ''"
      :anulando="depositoParaAnular ? anulandoIds.has(depositoParaAnular.id) : false"
      :creado-s-a-p="depositoParaAnular?.creadoSAP ?? false"
      :doc-entry-s-a-p="depositoParaAnular?.docEntrySAP ?? null"
      @close="modalAnularAbierto = false"
      @confirmar="onConfirmarAnular"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'
import { useToast } from '@/composables/useToast'
import { useReposicionStore } from '@/modules/reposiciones/stores/reposicionStore'
import reposicionApi from '@/modules/reposiciones/services/reposicionApi'
import VolverButton from '@/components/navegacion/VolverButton.vue'
import { useMisDepositos } from '../composables/useMisDepositos'
import { useComprobante } from '../composables/useComprobante'
import { useTesoreriaAccess } from '../composables/useTesoreriaAccess'
import { extraerMensajeError } from '../services/tesoreriaService'
import { formatCurrency, formatDateOnly, toDateOnlyString } from '../utils/formatters'
import type { CrearDepositoPayload, DepositoDto, ResumenComparativoDto } from '../types/tesoreria.types'
import CardKpiTesoreria, { type KpiTone } from '../components/CardKpiTesoreria.vue'
import SemaforoDiferenciaBadge from '../components/SemaforoDiferenciaBadge.vue'
import DrawerDetalleDiario from '../components/DrawerDetalleDiario.vue'
import ModalRegistroDeposito from '../components/ModalRegistroDeposito.vue'
import ModalVisorComprobante from '../components/ModalVisorComprobante.vue'
import ModalAnularDeposito from '../components/ModalAnularDeposito.vue'

const toast = useToast()
const reposicionStore = useReposicionStore()
const {
  resumen, resumenFiltrado, filtroKpiActivo, detalleActual, cuentas,
  loadingResumen, loadingDetalle, loadingCuentas, creandoDeposito,
  enviandoSapIds, anulandoIds, erroresSapPorDeposito, errorResumen, errorDetalle, erroresCampoDeposito,
  totalEfectivoPeriodo, totalDepositadoPeriodo, diferenciaPeriodo, totalPendientesSap,
  fetchResumen, fetchDetalle, fetchCuentas, crearDeposito, integrarSap, anularDeposito,
  toggleFiltroKpi, limpiarFiltroKpi
} = useMisDepositos()

const {
  almacenBase, almacenesAutorizados, opcionesAlmacenes,
  puedeCrear, puedeEliminar, puedeIntegrarSap
} = useTesoreriaAccess()

const hoy = new Date()
const hace15Dias = new Date(hoy.getTime() - 15 * 24 * 60 * 60 * 1000)
const hoyStr = toDateOnlyString(hoy)

const fechaDesde = ref(toDateOnlyString(hace15Dias))
const fechaHasta = ref(hoyStr)
const almacenSeleccionado = ref(almacenBase.value ?? (almacenesAutorizados.value[0] ?? ''))
const almacenIdActual = computed(() => {
  const codigo = (filaSeleccionada.value?.codigoAlmacen ?? almacenSeleccionado.value).trim().toUpperCase()
  const id = reposicionStore.catalogoAlmacenes.find(almacen => almacen.code.trim().toUpperCase() === codigo)?.id
  // Compatibilidad solicitada: mantener el flujo si el catálogo no contiene un ID válido.
  return id !== undefined && Number.isSafeInteger(id) && id > 0 ? id : 0
})

const filaSeleccionada = ref<ResumenComparativoDto | null>(null)
const saldoPendiente = computed(() => {
  const saldo = filaSeleccionada.value
    ? filaSeleccionada.value.totalEfectivo - filaSeleccionada.value.totalDepositado
    : 0
  return Math.max(0, Math.round(saldo * 100) / 100)
})
const isDrawerOpen = ref(false)
const modalRegistroAbierto = ref(false)
const { modalVisorAbierto, urlComprobante, nombreComprobante, cargandoComprobante, abrirComprobante } = useComprobante()
const modalAnularAbierto = ref(false)
const depositoParaAnular = ref<DepositoDto | null>(null)

// ─── Tone & Subtitle dinámicos para KPI Diferencia ───────────────────────────
const kpiDiferenciaTone = computed<KpiTone>(() => {
  if (Math.abs(diferenciaPeriodo.value) < 0.01) return 'emerald'
  return diferenciaPeriodo.value > 0 ? 'amber' : 'blue'
})

const kpiDiferenciaIcon = computed(() => {
  if (Math.abs(diferenciaPeriodo.value) < 0.01) return CheckCircleIcon
  return ExclamationCircleIcon
})

const kpiDiferenciaSubtitle = computed(() => {
  if (Math.abs(diferenciaPeriodo.value) < 0.01) return 'Conciliación al 100%'
  if (diferenciaPeriodo.value > 0) return 'Pendiente por depositar'
  return 'Excedente / sobrante registrado'
})

// ─── Filtro rápido KPI: etiqueta del banner + Escape para limpiarlo ──────────
const etiquetaFiltroActivo = computed(() => {
  switch (filtroKpiActivo.value) {
    case 'pendientesSap':
      return 'Días con pendientes SAP'
    case 'conDiferencia':
      return 'Días con diferencia'
    case 'cuadrados':
      return 'Días cuadrados'
    default:
      return ''
  }
})

// Esc limpia el filtro rápido, pero solo cuando no hay un drawer/modal abierto — ahí Escape ya
// tiene un significado más específico (cerrarlo) y debe tener prioridad.
function onKeydownGlobal(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  if (isDrawerOpen.value || modalRegistroAbierto.value || modalVisorAbierto.value || modalAnularAbierto.value) return
  if (filtroKpiActivo.value === 'todos') return
  limpiarFiltroKpi()
}

async function consultar(): Promise<void> {
  if (!almacenSeleccionado.value) return
  filaSeleccionada.value = null
  isDrawerOpen.value = false
  await fetchResumen(almacenSeleccionado.value.toUpperCase().trim(), fechaDesde.value, fechaHasta.value)
}

async function seleccionarFila(fila: ResumenComparativoDto): Promise<void> {
  filaSeleccionada.value = fila
  isDrawerOpen.value = true
  await fetchDetalle(fila.codigoAlmacen, fila.fechaCierre)
}

function cerrarDrawer(): void {
  isDrawerOpen.value = false
  filaSeleccionada.value = null
}

let cargaCatalogo: Promise<void> | null = null
function cargarCatalogoAlmacenes(): Promise<void> {
  if (reposicionStore.catalogoAlmacenes.length > 0) return Promise.resolve()
  cargaCatalogo ??= reposicionApi.getAlmacenes()
    .then(almacenes => { reposicionStore.catalogoAlmacenes = almacenes })
    .catch(err => { toast.warning('No se pudo cargar el catálogo de almacenes', extraerMensajeError(err)) })
    .finally(() => { cargaCatalogo = null })
  return cargaCatalogo
}

async function abrirModalRegistro(): Promise<void> {
  const fila = filaSeleccionada.value
  if (!puedeCrear.value || loadingDetalle.value || !detalleActual.value?.permitirNuevoDeposito || !fila) return
  await cargarCatalogoAlmacenes()
  if (!isDrawerOpen.value || filaSeleccionada.value !== fila) return
  erroresCampoDeposito.value = null
  fetchCuentas()
  modalRegistroAbierto.value = true
}

async function onGuardarDeposito(payload: CrearDepositoPayload): Promise<void> {
  if (creandoDeposito.value) return
  const creado = await crearDeposito(payload, { fechaDesde: fechaDesde.value, fechaHasta: fechaHasta.value })
  if (creado) modalRegistroAbierto.value = false
}

async function onIntegrarSap(deposito: DepositoDto): Promise<void> {
  await integrarSap(deposito, { fechaDesde: fechaDesde.value, fechaHasta: fechaHasta.value })
}

function abrirModalAnular(deposito: DepositoDto): void {
  depositoParaAnular.value = deposito
  modalAnularAbierto.value = true
}

async function onConfirmarAnular(motivo: string): Promise<void> {
  if (!depositoParaAnular.value) return
  // TablaDetallePapeletas.vue mantiene oculta la papelera para creadoSAP === true en esta vista de
  // tienda: el flujo con checkbox de reversión SAP nunca se dispara desde aquí, por diseño.
  const ok = await anularDeposito(depositoParaAnular.value, motivo, { fechaDesde: fechaDesde.value, fechaHasta: fechaHasta.value })
  if (ok) modalAnularAbierto.value = false
}

async function onVerComprobante(deposito: DepositoDto): Promise<void> {
  await abrirComprobante(deposito.id)
}

watch(almacenBase, (nuevo) => {
  if (nuevo && !almacenSeleccionado.value) almacenSeleccionado.value = nuevo
})

// Re-sincroniza filaSeleccionada con el resumen recién cargado (p. ej. tras registrar/anular un
// depósito) para que las mini-tarjetas KPI del drawer reflejen los totales actualizados.
watch(resumen, (nuevoResumen) => {
  if (!filaSeleccionada.value) return
  const actualizada = nuevoResumen.find(
    r => r.fechaCierre === filaSeleccionada.value!.fechaCierre && r.codigoAlmacen === filaSeleccionada.value!.codigoAlmacen
  )
  if (actualizada) filaSeleccionada.value = actualizada
})

onMounted(() => {
  if (puedeCrear.value) cargarCatalogoAlmacenes()
  if (almacenSeleccionado.value) consultar()
  window.addEventListener('keydown', onKeydownGlobal)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydownGlobal)
})
</script>
