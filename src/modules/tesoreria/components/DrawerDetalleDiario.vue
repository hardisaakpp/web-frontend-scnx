<template>
  <DrawerPanel
    :open="open"
    title-id="drawer-detalle-title"
    max-width-class="sm:max-w-xl md:max-w-2xl"
    @close="cerrar"
  >
    <template #header>
      <h2 id="drawer-detalle-title" class="text-lg font-bold text-gray-900 dark:text-white truncate">
        Cierre del {{ formatDateOnly(fila?.fechaCierre) }} — {{ fila?.codigoAlmacen }}
      </h2>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Detalle de recaudación física y comprobantes bancarios
      </p>
    </template>

    <div class="space-y-5">
      <!-- Mini-tarjetas KPI del día -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/60 p-3.5">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Efectivo Recaudado</p>
          <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">{{ formatCurrency(fila?.totalEfectivo) }}</p>
          <p class="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Arqueo de caja</p>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/60 p-3.5">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total en Banco</p>
          <p class="mt-1 text-lg font-bold text-gray-900 dark:text-white">{{ formatCurrency(fila?.totalDepositado) }}</p>
          <p class="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Papeletas registradas</p>
        </div>
        <div class="min-w-0 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/60 p-3.5 flex flex-col justify-between">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Diferencia del Día</p>
          <SemaforoDiferenciaBadge v-if="fila" :diferencia="fila.diferencia" class="mt-1.5" />
        </div>
      </div>

      <!-- Banner de política de días de gracia -->
      <div
        v-if="detalle && !detalle.permitirNuevoDeposito"
        role="alert"
        class="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-300 dark:bg-amber-500/10 dark:border-amber-600/40 p-3.5 text-sm text-amber-800 dark:text-amber-200"
      >
        <ExclamationTriangleIcon class="h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" aria-hidden="true" />
        <div>
          <p class="font-semibold text-amber-900 dark:text-amber-100">Registro bloqueado por antigüedad (política de días de gracia)</p>
          <p class="mt-0.5 text-xs text-amber-700/90 dark:text-amber-300/90">
            {{ detalle.motivoBloqueo || 'El plazo límite para registrar depósitos correspondientes a esta fecha ha expirado.' }}
            Para registrar una papeleta extemporánea, comuníquese con el departamento de Contabilidad.
          </p>
        </div>
      </div>

      <p
        v-if="error"
        role="alert"
        class="rounded-lg bg-vermilion-50 border border-vermilion-300 text-vermilion-800 dark:bg-vermilion-500/10 dark:border-vermilion-600/40 dark:text-vermilion-300 px-3 py-2 text-sm"
      >
        {{ error }}
      </p>

      <!-- Botón de acción principal -->
      <button
        v-if="puedeCrear"
        type="button"
        :disabled="!puedeRegistrar"
        class="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-2xs transition-colors"
        @click="emit('registrar-deposito')"
      >
        <PlusIcon class="h-4 w-4" aria-hidden="true" />
        Registrar Nuevo Depósito
      </button>

      <!-- Listado de papeletas -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Papeletas registradas</h3>
        <TablaDetallePapeletas
          :depositos="detalle?.depositos ?? []"
          :loading="loading"
          :enviando-sap-ids="enviandoSapIds"
          :anulando-ids="anulandoIds"
          :puede-integrar-sap="puedeIntegrarSap"
          :puede-eliminar="puedeEliminar"
          :errores-sap="erroresSap"
          @integrar-sap="(deposito) => emit('integrar-sap', deposito)"
          @anular="(deposito) => emit('anular', deposito)"
          @ver-comprobante="(deposito) => emit('ver-comprobante', deposito)"
        />
      </div>
    </div>

    <template #footer>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        <strong class="text-gray-800 dark:text-gray-200">{{ detalle?.depositos.length ?? 0 }}</strong> papeleta(s) registrada(s)
      </p>
      <button
        type="button"
        class="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        @click="cerrar"
      >
        Cerrar <span class="text-gray-400 dark:text-gray-500">(Esc)</span>
      </button>
    </template>
  </DrawerPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ExclamationTriangleIcon, PlusIcon } from '@heroicons/vue/24/outline'
import DrawerPanel from '@/components/modales/DrawerPanel.vue'
import { formatCurrency, formatDateOnly } from '../utils/formatters'
import type { DepositoDto, DetalleDiarioDto, ResumenComparativoDto } from '../types/tesoreria.types'
import type { SapErrorFriendly } from '../utils/tesoreriaErrorHandler'
import SemaforoDiferenciaBadge from './SemaforoDiferenciaBadge.vue'
import TablaDetallePapeletas from './TablaDetallePapeletas.vue'

const props = defineProps<{
  open: boolean
  fila: ResumenComparativoDto | null
  detalle: DetalleDiarioDto | null
  loading: boolean
  error: string | null
  enviandoSapIds: Set<number>
  anulandoIds: Set<number>
  puedeCrear: boolean
  puedeIntegrarSap: boolean
  puedeEliminar: boolean
  erroresSap?: Map<number, SapErrorFriendly>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'registrar-deposito'): void
  (e: 'integrar-sap', deposito: DepositoDto): void
  (e: 'anular', deposito: DepositoDto): void
  (e: 'ver-comprobante', deposito: DepositoDto): void
}>()

/** Bloqueado mientras el detalle aún no carga (evita registrar sin conocer permitirNuevoDeposito). */
const puedeRegistrar = computed(() =>
  !props.loading && !props.error && props.detalle?.permitirNuevoDeposito === true &&
  props.detalle.codigoAlmacen === props.fila?.codigoAlmacen &&
  props.detalle.fechaCierreCaja === props.fila?.fechaCierre
)

function cerrar(): void {
  emit('close')
}
</script>
