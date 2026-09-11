<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity ease-in-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in-out duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-40" @click="cerrar"></div>
    </Transition>

    <Transition
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="open"
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        class="fixed inset-y-0 right-0 z-50 w-full max-w-xl sm:max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
        @keydown="onKeydown"
      >
        <!-- Cabecera fija -->
        <header class="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 flex-shrink-0">
          <div class="min-w-0">
            <h2 id="drawer-title" class="text-lg font-bold text-white truncate">
              Cierre del {{ formatDateOnly(fila?.fechaCierre) }} — {{ fila?.codigoAlmacen }}
            </h2>
            <p class="mt-0.5 text-xs text-slate-400">
              Detalle de recaudación física y comprobantes bancarios
            </p>
          </div>
          <button
            ref="botonCerrarRef"
            type="button"
            aria-label="Cerrar panel"
            class="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <!-- Cuerpo desplazable -->
        <div class="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <!-- Mini-tarjetas KPI del día -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Efectivo Recaudado</p>
              <p class="mt-1 text-lg font-bold text-white">{{ formatCurrency(fila?.totalEfectivo) }}</p>
              <p class="mt-0.5 text-[11px] text-slate-500">Arqueo de caja</p>
            </div>
            <div class="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total en Banco</p>
              <p class="mt-1 text-lg font-bold text-white">{{ formatCurrency(fila?.totalDepositado) }}</p>
              <p class="mt-0.5 text-[11px] text-slate-500">Papeletas registradas</p>
            </div>
            <div class="min-w-0 rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 flex flex-col justify-between">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Diferencia del Día</p>
              <SemaforoDiferenciaBadge v-if="fila" :diferencia="fila.diferencia" class="mt-1.5" />
            </div>
          </div>

          <!-- Banner de política de días de gracia -->
          <div
            v-if="detalle && !detalle.permitirNuevoDeposito"
            role="alert"
            class="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-600/40 p-3.5 text-sm text-amber-200"
          >
            <ExclamationTriangleIcon class="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
            <div>
              <p class="font-semibold text-amber-100">Registro bloqueado por antigüedad (política de días de gracia)</p>
              <p class="mt-0.5 text-xs text-amber-300/90">
                {{ detalle.motivoBloqueo || 'El plazo límite para registrar depósitos correspondientes a esta fecha ha expirado.' }}
                Para registrar una papeleta extemporánea, comuníquese con el departamento de Contabilidad.
              </p>
            </div>
          </div>

          <p
            v-if="error"
            role="alert"
            class="rounded-lg bg-vermilion-500/10 border border-vermilion-600/40 px-3 py-2 text-sm text-vermilion-300"
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
            <h3 class="text-sm font-semibold text-slate-200 mb-2">Papeletas registradas</h3>
            <TablaDetallePapeletas
              :depositos="detalle?.depositos ?? []"
              :loading="loading"
              :enviando-sap-ids="enviandoSapIds"
              :anulando-ids="anulandoIds"
              :puede-integrar-sap="puedeIntegrarSap"
              :puede-eliminar="puedeEliminar"
              @integrar-sap="(deposito) => emit('integrar-sap', deposito)"
              @anular="(deposito) => emit('anular', deposito)"
              @ver-comprobante="(deposito) => emit('ver-comprobante', deposito)"
            />
          </div>
        </div>

        <!-- Pie fijo -->
        <footer class="flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/95 px-5 py-3.5 flex-shrink-0">
          <p class="text-xs text-slate-400">
            <strong class="text-slate-200">{{ detalle?.depositos.length ?? 0 }}</strong> papeleta(s) registrada(s)
          </p>
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            Cerrar <span class="text-slate-500">(Esc)</span>
          </button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, toRef, watch } from 'vue'
import { ExclamationTriangleIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useModalFocusTrap } from '../composables/useModalFocusTrap'
import { formatCurrency, formatDateOnly } from '../utils/formatters'
import type { DepositoDto, DetalleDiarioDto, ResumenComparativoDto } from '../types/tesoreria.types'
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
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'registrar-deposito'): void
  (e: 'integrar-sap', deposito: DepositoDto): void
  (e: 'anular', deposito: DepositoDto): void
  (e: 'ver-comprobante', deposito: DepositoDto): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const botonCerrarRef = ref<HTMLButtonElement | null>(null)

/** Bloqueado mientras el detalle aún no carga (evita registrar sin conocer permitirNuevoDeposito). */
const puedeRegistrar = computed(() => (props.detalle ? props.detalle.permitirNuevoDeposito : true))

function cerrar(): void {
  emit('close')
}

const { onKeydown } = useModalFocusTrap(dialogRef, botonCerrarRef, toRef(props, 'open'), cerrar)

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
