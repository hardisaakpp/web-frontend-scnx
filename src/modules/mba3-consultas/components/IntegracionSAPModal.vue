<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="handleClose">
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
            <DialogPanel class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
              <!-- Header -->
              <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg
                  v-if="estadoGeneral === 'success'"
                  class="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg
                  v-else-if="estadoGeneral === 'partial'"
                  class="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <svg
                  v-else
                  class="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ tituloModal }}
              </DialogTitle>

              <div v-if="bloques.length > 0" class="space-y-6">
                <div
                  v-for="(bloque, idx) in bloques"
                  :key="bloque.detalle.oc_id || idx"
                  class="space-y-4"
                  :class="{ 'pt-4 border-t border-gray-200 dark:border-gray-700': idx > 0 }"
                >
                  <h4
                    v-if="bloques.length > 1"
                    class="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2"
                  >
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-xs font-bold">
                      {{ idx + 1 }}
                    </span>
                    Orden de Compra {{ idx + 1 }} de {{ bloques.length }}
                  </h4>

                  <!-- Sección 1: Orden de Compra (OC) -->
                  <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Orden de Compra (OC)
                    </h3>

                    <div v-if="bloque.detalle.success" class="space-y-2">
                      <div class="flex items-center gap-2 text-sm">
                        <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="font-medium text-gray-900 dark:text-white">
                          OC enviada exitosamente
                        </span>
                      </div>
                      <div v-if="bloque.detalle.doc_entry != null" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                        DocEntry: {{ bloque.detalle.doc_entry }}
                      </div>
                      <div class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                        Num ODC: {{ bloque.numeroOdcMostrado }}
                      </div>
                      <div v-if="bloque.detalle.doc_num != null && !bloque.solicitudesTransferencia && bloque.detalle.numero_oc_sap != null" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                        DocNum: {{ bloque.detalle.doc_num }}
                      </div>
                      <div v-if="bloque.mensajeExito" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                        {{ bloque.mensajeExito }}
                      </div>
                    </div>

                    <div v-else-if="bloque.detalle.queued" class="space-y-2">
                      <div class="flex items-center gap-2 text-sm">
                        <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="font-medium text-amber-900 dark:text-amber-200">
                          SAP está procesando esta OC
                        </span>
                      </div>
                      <div class="text-sm text-amber-800 dark:text-amber-300 ml-7">
                        SAP está momentáneamente saturado; esta OC quedó en cola y se confirmará automáticamente en unos minutos, sin que tengas que hacer nada.
                      </div>
                    </div>

                    <div v-else class="space-y-2">
                      <div class="flex items-center gap-2 text-sm">
                        <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="font-medium text-red-900 dark:text-red-200">
                          Error al enviar OC
                        </span>
                      </div>
                      <div class="text-sm text-red-800 dark:text-red-300 ml-7">
                        {{ bloque.detalle.error || bloque.detalle.error_message || 'Error desconocido' }}
                      </div>
                      <div v-if="bloque.detalle.error_code" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                        Código de error: {{ bloque.detalle.error_code }}
                      </div>
                      <div v-if="bloque.detalle.error_source" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                        Origen: {{ bloque.detalle.error_source }}
                      </div>
                    </div>
                  </div>

                  <!-- Sección 2: Solicitudes de Transferencia (ITR) - doc_num, tienda_codigo, tienda_nombre -->
                  <div v-if="bloque.solicitudesTransferencia" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Solicitudes de Transferencia (ITR)
                    </h3>

                    <!-- Resumen -->
                    <div class="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div class="flex items-center gap-2 text-sm">
                        <span
                          :class="bloque.erroresTransferencia === 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'"
                          class="font-medium"
                        >
                          {{ bloque.resumenSolicitudesTexto }}
                        </span>
                      </div>
                    </div>

                    <!-- Caso: Sin Solicitudes de Transferencia -->
                    <div v-if="(bloque.solicitudesTransferencia?.total_tiendas === 0) && (bloque.solicitudesTransferencia?.transferencias_creadas === 0)" class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div class="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          OC enviada exitosamente, pero no se generaron Solicitudes de Transferencia (no aplicable para este pedido)
                        </span>
                      </div>
                    </div>

                    <!-- Tabla: solo tienda_codigo y doc_num; se muestra siempre que haya al menos 1 ITR
                         (antes exigía > 1, así que con exactamente 1 ITR nunca se mostraba su DocNum). -->
                    <div v-else-if="bloque.filasItr.length >= 1" class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div class="overflow-x-auto max-h-64 overflow-y-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                          <thead class="bg-gray-100 dark:bg-gray-800/80 sticky top-0">
                            <tr>
                              <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">DocNum</th>
                              <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tienda</th>
                            </tr>
                          </thead>
                          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr
                              v-for="(fila, filaIndex) in bloque.filasItr"
                              :key="`itr-${idx}-${fila.tienda_codigo}-${fila.doc_num}-${filaIndex}`"
                              class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <td class="px-4 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                {{ fila.doc_num }}
                              </td>
                              <td class="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                {{ fila.tienda_codigo }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer: reintento SAP (fallo transitorio) + cerrar -->
              <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div
                  v-if="props.showRetrySapCta"
                  class="flex flex-col gap-2 text-sm max-w-xl"
                >
                  <p class="text-amber-800 dark:text-amber-200">
                    Fallo temporal de conexión con SAP. Puede volver a intentar el envío.
                  </p>
                  <button
                    type="button"
                    :disabled="props.retryLoading"
                    @click="emit('retry-sap')"
                    class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium w-fit"
                  >
                    <svg
                      v-if="props.retryLoading"
                      class="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {{ props.retryLoading ? 'Reintentando…' : 'Reintentar envío a SAP' }}
                  </button>
                </div>
                <div class="flex justify-end sm:ml-auto">
                  <button
                    type="button"
                    :disabled="props.retryLoading"
                    :title="props.retryLoading ? 'Espera a que termine el reintento en curso' : undefined"
                    @click="handleClose"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Cerrar
                  </button>
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
import { computed } from '@vue/reactivity'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import type { IntegracionSAPDetalle, SolicitudesTransferencia } from '../types'

/** Un par detalle+ITR de una ODC adicional de un pedido mixto (ver prop `detallesAdicionales`). */
interface DetalleOdcAdicional {
  detalle: IntegracionSAPDetalle
  solicitudesTransferencia: SolicitudesTransferencia | null
}

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    detalle: IntegracionSAPDetalle | null
    solicitudesTransferencia: SolicitudesTransferencia | null
    /**
     * ODC adicionales del mismo pedido: un pedido mixto (tiendas de más de una marca en
     * el mismo Excel) genera 2 ODC -- una por bodega -- que se envían ambas a SAP. La
     * primera ODC sigue yendo en `detalle`/`solicitudesTransferencia`; el resto va aquí
     * para que el modal las muestre todas en vez de solo la primera.
     */
    detallesAdicionales?: DetalleOdcAdicional[]
    estadoGeneral?: 'success' | 'partial' | 'error'
    /** Mostrar CTA de reintento manual cuando el backend indica fallo transitorio (retry_recommended). */
    showRetrySapCta?: boolean
    retryLoading?: boolean
  }>(),
  {
    detallesAdicionales: () => [],
    showRetrySapCta: false,
    retryLoading: false
  }
)

const emit = defineEmits<{
  close: []
  'retry-sap': []
}>()

function calcularFilasItr(st: SolicitudesTransferencia | null) {
  if (!st) return []
  const itrs = st.itrs_por_tienda
  if (itrs?.length) return itrs
  const res = st.resultados ?? []
  return res
    .filter((r: { doc_num?: number | null }) => r.doc_num != null)
    .map((r: { doc_num: number | null; tienda_codigo: string }) => ({ doc_num: r.doc_num!, tienda_codigo: r.tienda_codigo }))
}

// Agrupa todos los valores derivados de una ODC (Num ODC mostrado, mensaje de éxito,
// filas ITR, resumen) para poder renderizar N bloques idénticos en el template.
function construirBloque(detalle: IntegracionSAPDetalle, solicitudesTransferencia: SolicitudesTransferencia | null) {
  const filasItr = calcularFilasItr(solicitudesTransferencia)

  // Num ODC: si el backend aún no informó numero_oc_sap, se muestra el DocNum de SAP en su lugar
  const numeroOdcMostrado = detalle.numero_oc_sap ?? (detalle.doc_num != null ? String(detalle.doc_num) : '—')

  // Mensaje de éxito: "con DocNum" solo cuando hay exactamente 1 solicitud de transferencia (ITR)
  let mensajeExito: string | null = null
  if (detalle.success) {
    if (detalle.doc_num != null && filasItr.length === 1) {
      mensajeExito = `Proceso completado exitosamente. ODC enviada a SAP con DocNum: ${detalle.doc_num}`
    } else if (filasItr.length !== 1) {
      mensajeExito = 'Proceso completado exitosamente.'
    } else {
      mensajeExito = detalle.message ?? null
    }
  }

  // El backend no siempre informa transferencias_errores (queda undefined); se asume 0 en ese caso
  const erroresTransferencia = solicitudesTransferencia?.transferencias_errores ?? 0

  let resumenSolicitudesTexto = ''
  if (solicitudesTransferencia) {
    if (erroresTransferencia === 0) {
      resumenSolicitudesTexto = `✅ ${solicitudesTransferencia.transferencias_creadas} de ${solicitudesTransferencia.total_tiendas} creadas exitosamente`
    } else if (import.meta.env.PROD) {
      resumenSolicitudesTexto = `✅ ${solicitudesTransferencia.transferencias_creadas} de ${solicitudesTransferencia.total_tiendas} creadas`
    } else {
      resumenSolicitudesTexto = `⚠️ ${solicitudesTransferencia.transferencias_creadas} exitosas, ${erroresTransferencia} con errores`
    }
  }

  return {
    detalle,
    solicitudesTransferencia,
    filasItr,
    numeroOdcMostrado,
    mensajeExito,
    erroresTransferencia,
    resumenSolicitudesTexto
  }
}

// Una entrada por cada ODC a mostrar: la principal (props.detalle) más las adicionales
// de un pedido mixto (props.detallesAdicionales). Vacío si no hay ODC principal.
const bloques = computed(() => {
  if (!props.detalle) return []
  const principal = construirBloque(props.detalle, props.solicitudesTransferencia)
  const adicionales = (props.detallesAdicionales ?? []).map((d) =>
    construirBloque(d.detalle, d.solicitudesTransferencia)
  )
  return [principal, ...adicionales]
})

// Determinar título del modal según el estado
const tituloModal = computed(() => {
  if (props.estadoGeneral === 'success' && bloques.value.every((b) => b.detalle.success)) {
    return '✅ Integración con SAP Completada'
  } else if (props.estadoGeneral === 'partial') {
    return '⚠️ Integración con SAP - Resultados Parciales'
  } else {
    return '❌ Error en Integración con SAP'
  }
})

function handleClose() {
  // Con un reintento en curso, el polling sigue corriendo en el componente padre
  // aunque el modal se oculte (no se cancela solo por ocultar el Dialog) -- así que
  // no se permite cerrar por click afuera / Escape mientras retryLoading es true,
  // para no dar la impresión de que el proceso se detuvo.
  if (props.retryLoading) return
  emit('close')
}
</script>
