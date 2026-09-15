<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePickingStore } from '../stores/pickingStore'
import { useAuthStore } from '@/stores/auth'
import type { OrdenPickingLineaResponse } from '../types'
import LoadingSpinner from '@/components/feedback/LoadingSpinner.vue'
import ErrorModal from '@/components/modales/ErrorModal.vue'
import ConfirmModal from '@/components/modales/ConfirmModal.vue'
import SuccessModal from '@/components/modales/SuccessModal.vue'
import VolverButton from '@/components/navegacion/VolverButton.vue'

const route = useRoute()
const router = useRouter()
const pickingStore = usePickingStore()
const authStore = useAuthStore()

const sesionId = computed(() => Number(route.params.sesionId))
const usuarioActualId = computed(() => authStore.userData?.id ?? null)

const codigoInput = ref('')
const cantidadInput = ref(1)
const codigoInputEl = ref<HTMLInputElement | null>(null)
const cantidadInputEl = ref<HTMLInputElement | null>(null)

const mostrarLogs = ref(false)
const mostrarConfirmarCierre = ref(false)
const mostrarCierreExitoso = ref(false)
const mostrarConfirmarIntegrarSap = ref(false)
const mostrarIntegracionExitosa = ref(false)
const mostrarConfirmarEliminar = ref(false)

const enProceso = computed(() => pickingStore.sesion?.estado === 'EnProceso')
const puedeCerrar = computed(() => pickingStore.sesion?.estado === 'EnProceso' && pickingStore.scans.length > 0)
const puedeIntegrarSap = computed(() => pickingStore.sesion?.estado === 'Finalizada' || pickingStore.sesion?.estado === 'ErrorSap')
const puedeVerificarEstadoSap = computed(() => pickingStore.sesion?.estado === 'EnviandoSap')
const puedeEliminarPicking = computed(
  () => pickingStore.sesion?.estado !== 'EnviandoSap' && pickingStore.sesion?.estado !== 'IntegradaSap'
)

async function cargar(): Promise<void> {
  await pickingStore.cargarSesion(sesionId.value)
  await pickingStore.cargarScans()
}

async function escanear(): Promise<void> {
  const codigo = codigoInput.value.trim()
  if (!codigo || !enProceso.value) return
  const ok = await pickingStore.escanear(codigo, Math.max(1, cantidadInput.value || 1))
  if (ok) {
    codigoInput.value = ''
    cantidadInput.value = 1
  }
  codigoInputEl.value?.focus()
}

/**
 * Clic sobre una fila de la tabla: llena el código sin tener que escribirlo/escanearlo y
 * salta directo a "Cantidad" — mismo flujo que ya conocen (código -> cantidad -> Enter), solo
 * que el código lo puso el clic en vez del teclado o el lector.
 */
function seleccionarLinea(linea: OrdenPickingLineaResponse): void {
  if (!enProceso.value || linea.estadoLinea === 'Completa' || pickingStore.isSubmitting) return
  codigoInput.value = linea.itemCode
  nextTick(() => {
    cantidadInputEl.value?.focus()
    cantidadInputEl.value?.select()
  })
}

/**
 * Clic sobre la celda "Pedido": ademas de llenar el código, precarga la cantidad restante
 * completa. Se precarga el pendiente real (cantidadPendiente - cantidadPickeada), no el
 * "Pedido" original, para no superar el pendiente si ya hay algo pickeado en la linea.
 */
function seleccionarLineaCompleta(linea: OrdenPickingLineaResponse): void {
  if (!enProceso.value || linea.estadoLinea === 'Completa' || pickingStore.isSubmitting) return
  codigoInput.value = linea.itemCode
  cantidadInput.value = linea.cantidadPendiente - linea.cantidadPickeada
  nextTick(() => {
    cantidadInputEl.value?.focus()
    cantidadInputEl.value?.select()
  })
}

async function eliminarScan(scanId: number): Promise<void> {
  await pickingStore.eliminarScan(scanId)
  codigoInputEl.value?.focus()
}

async function confirmarCierre(): Promise<void> {
  mostrarConfirmarCierre.value = false
  const ok = await pickingStore.cerrar()
  if (ok) mostrarCierreExitoso.value = true
}

async function confirmarIntegrarSap(): Promise<void> {
  mostrarConfirmarIntegrarSap.value = false
  const ok = await pickingStore.integrarSap()
  if (ok && pickingStore.sesion?.estado === 'IntegradaSap') mostrarIntegracionExitosa.value = true
}

async function verificarEstado(): Promise<void> {
  const ok = await pickingStore.verificarEstadoSap()
  if (ok && pickingStore.sesion?.estado === 'IntegradaSap') mostrarIntegracionExitosa.value = true
}

async function alternarLogs(): Promise<void> {
  mostrarLogs.value = !mostrarLogs.value
  if (mostrarLogs.value && pickingStore.logs.length === 0) {
    await pickingStore.cargarLogs()
  }
}

async function confirmarEliminarPicking(): Promise<void> {
  mostrarConfirmarEliminar.value = false
  const docNum = pickingStore.sesion?.docNum
  const ok = await pickingStore.eliminarSesion()
  if (ok && docNum !== undefined) {
    router.push({ name: 'recepcion-proveedores-detalle', params: { docNum } })
  }
}

function cerrarModalExito(): void {
  mostrarCierreExitoso.value = false
}

onMounted(cargar)
watch(sesionId, cargar)
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <LoadingSpinner v-if="pickingStore.loading" message="Cargando sesión de picking..." />

    <template v-else-if="pickingStore.sesion">
      <VolverButton
        :to="`/recepcion-proveedores/ordenes-compra/${pickingStore.sesion.docNum}`"
        title="Volver a la orden de compra"
        class="shrink-0 self-start mb-4"
      />

      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            Picking — ODC {{ pickingStore.sesion.docNum }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Almacén {{ pickingStore.sesion.whsCode }} · Estado: {{ pickingStore.sesion.estado }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="alternarLogs"
          >
            {{ mostrarLogs ? 'Ocultar logs de esta sesión' : 'Ver logs de esta sesión' }}
          </button>
          <button
            type="button"
            :disabled="!puedeCerrar || pickingStore.isSubmitting"
            class="px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="mostrarConfirmarCierre = true"
          >
            Cerrar Picking
          </button>
          <button
            v-if="puedeIntegrarSap"
            type="button"
            :disabled="pickingStore.isSubmitting"
            class="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="mostrarConfirmarIntegrarSap = true"
          >
            {{ pickingStore.sesion.estado === 'ErrorSap' ? 'Reintentar integración SAP' : 'Integrar a SAP' }}
          </button>
          <button
            v-if="puedeVerificarEstadoSap"
            type="button"
            :disabled="pickingStore.isSubmitting"
            class="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            @click="verificarEstado"
          >
            Verificar estado
          </button>
          <button
            v-if="puedeEliminarPicking"
            type="button"
            :disabled="pickingStore.isSubmitting"
            class="px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="mostrarConfirmarEliminar = true"
          >
            Eliminar Picking
          </button>
        </div>
      </div>

      <div v-if="pickingStore.sesion.estado === 'ErrorSap'" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
        No se pudo integrar a SAP: {{ pickingStore.sesion.sapErrorMensaje }}
      </div>
      <div v-else-if="pickingStore.sesion.estado === 'EnviandoSap'" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        SAP está procesando la integración. Usa "Verificar estado" en unos momentos.
      </div>
      <div v-else-if="pickingStore.sesion.estado === 'IntegradaSap'" class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
        Integrado a SAP — Goods Receipt DocEntry {{ pickingStore.sesion.sapDocEntry }}, DocNum {{ pickingStore.sesion.sapDocNum }}.
      </div>

      <!-- Input de escaneo: lector de codigo de barras actuando como teclado (Enter = escanear). -->
      <form
        v-if="enProceso"
        class="flex flex-wrap gap-2 items-end mb-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
        @submit.prevent="escanear"
      >
        <div class="flex flex-col gap-0.5">
          <label for="codigo-scan-input" class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Código</label>
          <input
            id="codigo-scan-input"
            ref="codigoInputEl"
            v-model="codigoInput"
            type="text"
            autofocus
            placeholder="Escanee o ingrese el código"
            class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            @keyup.enter.prevent="escanear"
          />
        </div>
        <div class="flex flex-col gap-0.5">
          <label for="cantidad-scan-input" class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cantidad</label>
          <input
            id="cantidad-scan-input"
            ref="cantidadInputEl"
            v-model.number="cantidadInput"
            type="number"
            min="1"
            class="w-20 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          type="submit"
          :disabled="!codigoInput || pickingStore.isSubmitting"
          class="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Escanear
        </button>
      </form>

      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Código</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Descripción</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Código de barras</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pedido</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pickeado</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pendiente</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="linea in pickingStore.sesion.lineas"
              :key="linea.id"
              :class="{
                'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20': enProceso && linea.estadoLinea !== 'Completa',
              }"
              :title="enProceso && linea.estadoLinea !== 'Completa' ? 'Clic para escanear este producto' : undefined"
              @click="seleccionarLinea(linea)"
            >
              <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ linea.itemCode }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.itemDescription }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.codeBars }}</td>
              <td
                class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white"
                :class="{ 'cursor-pointer hover:underline': enProceso && linea.estadoLinea !== 'Completa' }"
                :title="enProceso && linea.estadoLinea !== 'Completa' ? 'Clic para escanear toda la cantidad pendiente' : undefined"
                @click.stop="seleccionarLineaCompleta(linea)"
              >
                {{ linea.cantidadPedida }}
              </td>
              <td class="px-4 py-2 text-sm text-right font-semibold text-gray-900 dark:text-white">{{ linea.cantidadPickeada }}</td>
              <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">{{ linea.cantidadPendiente - linea.cantidadPickeada }}</td>
              <td class="px-4 py-2 text-sm">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300': linea.estadoLinea === 'Pendiente',
                    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300': linea.estadoLinea === 'Parcial',
                    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300': linea.estadoLinea === 'Completa',
                  }"
                >
                  {{ linea.estadoLinea }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Escaneos registrados</h2>
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Código</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
              <th class="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="scan in pickingStore.scans" :key="scan.id">
              <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ scan.codigoEscaneado }}</td>
              <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">{{ scan.cantidad }}</td>
              <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{{ new Date(scan.fechaHora).toLocaleString() }}</td>
              <td class="px-4 py-2 text-right">
                <button
                  v-if="enProceso && scan.usuarioId === usuarioActualId"
                  type="button"
                  :disabled="pickingStore.isSubmitting"
                  class="text-xs font-medium text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                  @click="eliminarScan(scan.id)"
                >
                  Eliminar
                </button>
              </td>
            </tr>
            <tr v-if="pickingStore.scans.length === 0">
              <td colspan="4" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Aún no hay escaneos.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="mostrarLogs" class="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Registro de eventos</h2>
        <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <li v-for="log in pickingStore.logs" :key="log.id">
            [{{ new Date(log.fechaHora).toLocaleString() }}] {{ log.evento }} — {{ log.detalle }}
          </li>
          <li v-if="pickingStore.logs.length === 0">Sin eventos registrados.</li>
        </ul>
      </div>
    </template>

    <p v-else-if="pickingStore.error" class="text-sm text-red-600 dark:text-red-400">{{ pickingStore.error }}</p>

    <ConfirmModal
      :open="mostrarConfirmarCierre"
      title="¿Cerrar picking?"
      message="No podrás registrar más escaneos en esta sesión después de cerrarla."
      confirm-label="Cerrar picking"
      @confirm="confirmarCierre"
      @cancel="mostrarConfirmarCierre = false"
    />

    <SuccessModal
      :open="mostrarCierreExitoso"
      title="Picking cerrado"
      message="La sesión de picking se cerró correctamente."
      @close="cerrarModalExito"
    />

    <ConfirmModal
      :open="mostrarConfirmarIntegrarSap"
      title="¿Integrar a SAP?"
      message="Se creará un Goods Receipt en SAP con lo escaneado en esta sesión."
      confirm-label="Integrar a SAP"
      @confirm="confirmarIntegrarSap"
      @cancel="mostrarConfirmarIntegrarSap = false"
    />

    <SuccessModal
      :open="mostrarIntegracionExitosa"
      title="Integración a SAP exitosa"
      :message="`Goods Receipt creado: DocEntry ${pickingStore.sesion?.sapDocEntry}, DocNum ${pickingStore.sesion?.sapDocNum}.`"
      @close="mostrarIntegracionExitosa = false"
    />

    <ConfirmModal
      :open="mostrarConfirmarEliminar"
      title="¿Eliminar picking?"
      message="Esta acción eliminará todo el picking y no se puede deshacer. ¿Desea continuar?"
      confirm-label="Eliminar Picking"
      @confirm="confirmarEliminarPicking"
      @cancel="mostrarConfirmarEliminar = false"
    />

    <ErrorModal
      :open="!!pickingStore.actionError"
      title="No se pudo completar la acción"
      :message="pickingStore.actionError ?? ''"
      @close="pickingStore.limpiarActionError()"
    />
  </div>
</template>
