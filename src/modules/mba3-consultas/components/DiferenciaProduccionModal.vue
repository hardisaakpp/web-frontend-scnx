<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="handleCancelar">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
              <div class="flex flex-col gap-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-white">
                      Diferencia con lo solicitado
                    </DialogTitle>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {{ detalles.length }} producto{{ detalles.length === 1 ? '' : 's' }} con una cantidad menor a lo solicitado originalmente en la plantilla Excel.
                    </p>
                  </div>
                </div>

                <div class="max-h-56 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                      <tr>
                        <th class="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Código</th>
                        <th class="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Solicitado</th>
                        <th class="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Confirmado</th>
                        <th class="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Diferencia</th>
                        <th class="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Repartido</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                      <tr v-for="d in detalles" :key="d.pedido_detalle_id">
                        <td class="px-3 py-2 text-gray-900 dark:text-gray-100">{{ d.codigo_interno || 'N/A' }}</td>
                        <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ d.cantidad_solicitada_original }}</td>
                        <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ d.total_actual }}</td>
                        <td class="px-3 py-2 text-right font-medium text-purple-600 dark:text-purple-400">{{ d.diferencia }}</td>
                        <td
                          class="px-3 py-2 text-right font-medium"
                          :class="lineaValida(d) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                        >
                          {{ formatNumber(totalAsignado(d.pedido_detalle_id)) }} / {{ formatNumber(d.diferencia) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="flex flex-col gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    :disabled="procesando"
                    @click="handleDiferenciaNoEntregada"
                    class="w-full px-4 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Diferencia no será entregada
                  </button>

                  <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                      <label class="text-sm text-gray-600 dark:text-gray-400" for="diferencia-num-hijos">
                        ¿En cuántos pedidos desea repartir la diferencia?
                      </label>
                      <input
                        id="diferencia-num-hijos"
                        v-model.number="numHijos"
                        type="number"
                        min="1"
                        :disabled="procesando"
                        class="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        :disabled="procesando"
                        @click="repartirEquitativamente"
                        class="ml-auto text-sm text-purple-700 dark:text-purple-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Repartir equitativamente
                      </button>
                    </div>

                    <div class="max-h-72 overflow-y-auto flex flex-col gap-3 pr-1">
                      <div
                        v-for="(hijo, idx) in hijos"
                        :key="idx"
                        class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2"
                      >
                        <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                          Pedido hijo .{{ sufijo(idx) }}
                        </p>

                        <label :for="`fecha-entrega-hijo-${idx}`" class="text-xs text-gray-500 dark:text-gray-400">
                          Fecha de entrega
                        </label>
                        <AppDateInput
                          :id="`fecha-entrega-hijo-${idx}`"
                          v-model="hijo.fecha_entrega"
                          :disabled="procesando"
                        />

                        <table class="w-full text-sm mt-1">
                          <thead>
                            <tr>
                              <th class="text-left px-2 py-1 font-medium text-gray-500 dark:text-gray-400">Código</th>
                              <th class="text-right px-2 py-1 font-medium text-gray-500 dark:text-gray-400">Cantidad asignada</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr v-for="d in detalles" :key="d.pedido_detalle_id">
                              <td class="px-2 py-1 text-gray-700 dark:text-gray-300">{{ d.codigo_interno || 'N/A' }}</td>
                              <td class="px-2 py-1 text-right">
                                <input
                                  v-model.number="hijo.cantidades[d.pedido_detalle_id]"
                                  type="number"
                                  min="0"
                                  step="1"
                                  :disabled="procesando"
                                  class="w-24 px-2 py-1 text-right border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <p v-if="!cantidadesEnteras()" class="text-xs text-red-600 dark:text-red-400">
                      Las cantidades son unidades de producto: no se pueden fraccionar. Ajuste los valores a números enteros.
                    </p>

                    <button
                      type="button"
                      :disabled="procesando || !todoValido"
                      @click="handleConfirmarConDiferencia"
                      class="w-full px-4 py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg v-if="procesando" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {{ procesando ? 'Confirmando pedido...' : `Confirmar pedido y generar ${hijos.length} pedido${hijos.length === 1 ? '' : 's'} con la diferencia` }}
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import type { DetalleDiferenciaProduccion, HijoDiferenciaPayload } from '../types'
import { formatNumber } from '../utils/formatters'
import AppDateInput from './AppDateInput.vue'

const props = defineProps<{
  isOpen: boolean
  detalles: DetalleDiferenciaProduccion[]
  procesando?: boolean
}>()

const emit = defineEmits<{
  cancelar: []
  'diferencia-no-entregada': []
  'confirmar-con-diferencia': [hijos: HijoDiferenciaPayload[]]
}>()

interface HijoForm {
  fecha_entrega: string
  /** cantidad asignada por pedido_detalle_id */
  cantidades: Record<string, number>
}

function cantidadesVacias(): Record<string, number> {
  const map: Record<string, number> = {}
  for (const d of props.detalles) map[d.pedido_detalle_id] = 0
  return map
}

function cantidadesCompletas(): Record<string, number> {
  const map: Record<string, number> = {}
  for (const d of props.detalles) map[d.pedido_detalle_id] = d.diferencia
  return map
}

// Con un solo hijo (caso por defecto) arranca con el 100% de cada diferencia, igual
// que el comportamiento anterior: nadie que solo quiera un pedido hijo tiene pasos extra.
const numHijos = ref(1)
const hijos = ref<HijoForm[]>([{ fecha_entrega: '', cantidades: cantidadesCompletas() }])

function sufijo(idx: number): string {
  return String(idx + 1).padStart(2, '0')
}

function resetear() {
  numHijos.value = 1
  hijos.value = [{ fecha_entrega: '', cantidades: cantidadesCompletas() }]
}

watch(() => props.isOpen, (open) => {
  if (!open) resetear()
})

function agregarHijosHasta(cantidad: number) {
  while (hijos.value.length < cantidad) {
    hijos.value.push({ fecha_entrega: '', cantidades: cantidadesVacias() })
  }
}

function fusionarCantidades(destino: HijoForm, removido: HijoForm) {
  for (const id of Object.keys(removido.cantidades)) {
    destino.cantidades[id] = (Number(destino.cantidades[id]) || 0) + (Number(removido.cantidades[id]) || 0)
  }
}

function removerHijosHasta(cantidad: number) {
  while (hijos.value.length > cantidad) {
    const removido = hijos.value.pop()
    const destino = hijos.value[hijos.value.length - 1]
    if (removido && destino) {
      fusionarCantidades(destino, removido)
    }
  }
}

// Al subir N, los hijos nuevos arrancan en 0 (lo que ya tenían los demás no se toca,
// así que la suma total sigue cuadrando). Al bajar N, lo asignado al hijo removido se
// reabsorbe en el hijo anterior por el mismo motivo: cambiar N nunca debe romper el
// reparto por sí solo.
watch(numHijos, (valor) => {
  const cantidad = Math.max(1, Math.floor(Number(valor)) || 1)
  if (cantidad !== valor) {
    numHijos.value = cantidad
    return
  }
  if (cantidad === hijos.value.length) return
  if (cantidad > hijos.value.length) {
    agregarHijosHasta(cantidad)
  } else {
    removerHijosHasta(cantidad)
  }
})

function totalAsignado(pedidoDetalleId: string): number {
  return hijos.value.reduce((sum, h) => sum + (Number(h.cantidades[pedidoDetalleId]) || 0), 0)
}

function lineaValida(d: DetalleDiferenciaProduccion): boolean {
  return Math.abs(totalAsignado(d.pedido_detalle_id) - d.diferencia) < 0.0001
}

// Las cantidades son unidades de producto: no se pueden fraccionar.
function cantidadesEnteras(): boolean {
  return hijos.value.every(h =>
    Object.values(h.cantidades).every(c => Number.isInteger(Number(c) || 0))
  )
}

const todoValido = computed(() =>
  props.detalles.length > 0 &&
  props.detalles.every(lineaValida) &&
  cantidadesEnteras() &&
  hijos.value.every(h => !!h.fecha_entrega)
)

/** Reparte cada diferencia en partes iguales (enteras) entre los hijos actuales: las
 * unidades de producto no se pueden fraccionar, así que se usa división entera y el
 * resto (si la diferencia no es múltiplo exacto de N) queda en el último hijo, para
 * que la suma cuadre siempre exacto. */
function repartirEquitativamente() {
  const n = hijos.value.length
  for (const d of props.detalles) {
    const total = Math.round(d.diferencia)
    const base = Math.floor(total / n)
    hijos.value.forEach((hijo, idx) => {
      hijo.cantidades[d.pedido_detalle_id] = idx === n - 1 ? total - base * (n - 1) : base
    })
  }
}

function handleCancelar() {
  if (props.procesando) return
  emit('cancelar')
}

function handleDiferenciaNoEntregada() {
  emit('diferencia-no-entregada')
}

function handleConfirmarConDiferencia() {
  if (!todoValido.value) return
  const payload: HijoDiferenciaPayload[] = hijos.value.map(h => ({
    fecha_entrega: h.fecha_entrega,
    detalles: Object.entries(h.cantidades)
      .filter(([, cantidad]) => Number(cantidad) > 0)
      .map(([pedido_detalle_id, cantidad]) => ({ pedido_detalle_id, cantidad: Number(cantidad) }))
  }))
  emit('confirmar-con-diferencia', payload)
}
</script>
