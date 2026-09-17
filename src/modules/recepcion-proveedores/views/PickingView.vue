<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { usePickingStore } from '../stores/pickingStore'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
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
const toast = useToast()

const sesionId = computed(() => Number(route.params.sesionId))
const usuarioActualId = computed(() => authStore.userData?.id ?? null)

const codigoInput = ref('')
const cantidadInput = ref(1)
const codigoInputEl = ref<HTMLInputElement | null>(null)
const cantidadInputEl = ref<HTMLInputElement | null>(null)

const mostrarConfirmarPicking = ref(false)
const mostrarConfirmarParcial = ref(false)
const mostrarIntegracionExitosa = ref(false)
const mostrarConfirmarEliminar = ref(false)

/**
 * pickingStore.isSubmitting es una unica bandera compartida por las acciones del store, pero
 * varios botones pueden estar visibles a la vez (ej. Confirmar Picking y Confirmar Parcial en
 * EnProceso). Se rastrea aqui cual accion puntual esta en curso para que el spinner salga solo
 * en el boton que el usuario realmente presiono, no en todos los que comparten isSubmitting.
 */
const accionEnCurso = ref<'confirmarPicking' | 'confirmarParcial' | 'verificar' | 'eliminar' | null>(null)

const enProceso = computed(() => pickingStore.sesion?.estado === 'EnProceso')
const puedeConfirmarPicking = computed(() => enProceso.value && pickingStore.scans.length > 0)
const puedeConfirmarParcial = computed(
  () => enProceso.value && (pickingStore.sesion?.lineas.some((l) => l.estadoLinea === 'Completa') ?? false)
)
/** "Reintentar": la sesion ya se cerro (Finalizada/ErrorSap) en el modo persistido en sesion.modoConfirmacion. */
const puedeReintentar = computed(() => pickingStore.sesion?.estado === 'Finalizada' || pickingStore.sesion?.estado === 'ErrorSap')
const modoReintento = computed(() => pickingStore.sesion?.modoConfirmacion ?? 'Picking')
const puedeVerificarEstadoSap = computed(() => pickingStore.sesion?.estado === 'EnviandoSap')
/**
 * Solo antes de confirmar (parcial o picking): una vez cerrada la sesion, la unica salida es
 * reintentar, no eliminar. Ademas, "Eliminar Picking" borra la sesion completa (ver
 * confirmarEliminarPicking) asi que sin escaneos no hay nada que perder: deshabilitado para
 * evitar el viaje redondo (eliminar -> reiniciar sesion -> recargar la ODC desde SAP) sin motivo.
 */
const puedeEliminarPicking = computed(() => enProceso.value && pickingStore.scans.length > 0)

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

/**
 * Clic sobre la celda "Código de barras": llena el campo Código con el codeBars en vez del
 * itemCode, para el caso en que el usuario quiera buscar/escanear por ese valor puntual.
 */
function seleccionarLineaPorCodigoBarras(linea: OrdenPickingLineaResponse): void {
  if (!enProceso.value || linea.estadoLinea === 'Completa' || pickingStore.isSubmitting || !linea.codeBars) return
  codigoInput.value = linea.codeBars
  nextTick(() => {
    cantidadInputEl.value?.focus()
    cantidadInputEl.value?.select()
  })
}

async function copiarAlPortapapeles(texto: string): Promise<void> {
  if (!texto) return
  try {
    await navigator.clipboard.writeText(texto)
    toast.success('Copiado al portapapeles', texto)
  } catch {
    toast.error('Error al copiar', 'No se pudo copiar al portapapeles')
  }
}

async function eliminarScan(scanId: number): Promise<void> {
  await pickingStore.eliminarScan(scanId)
  codigoInputEl.value?.focus()
}

async function confirmarPicking(): Promise<void> {
  mostrarConfirmarPicking.value = false
  accionEnCurso.value = 'confirmarPicking'
  try {
    const ok = await pickingStore.confirmarPicking()
    if (ok && pickingStore.sesion?.estado === 'IntegradaSap') mostrarIntegracionExitosa.value = true
  } finally {
    accionEnCurso.value = null
  }
}

async function confirmarParcial(): Promise<void> {
  mostrarConfirmarParcial.value = false
  accionEnCurso.value = 'confirmarParcial'
  try {
    const ok = await pickingStore.confirmarParcial()
    if (ok && pickingStore.sesion?.estado === 'IntegradaSap') mostrarIntegracionExitosa.value = true
  } finally {
    accionEnCurso.value = null
  }
}

/** Reintentar: repite la misma accion (modoReintento) que cerro originalmente la sesion. */
async function reintentar(): Promise<void> {
  accionEnCurso.value = modoReintento.value === 'Parcial' ? 'confirmarParcial' : 'confirmarPicking'
  try {
    const ok = modoReintento.value === 'Parcial' ? await pickingStore.confirmarParcial() : await pickingStore.confirmarPicking()
    if (ok && pickingStore.sesion?.estado === 'IntegradaSap') mostrarIntegracionExitosa.value = true
  } finally {
    accionEnCurso.value = null
  }
}

async function verificarEstado(): Promise<void> {
  accionEnCurso.value = 'verificar'
  try {
    const ok = await pickingStore.verificarEstadoSap()
    if (ok && pickingStore.sesion?.estado === 'IntegradaSap') mostrarIntegracionExitosa.value = true
  } finally {
    accionEnCurso.value = null
  }
}

/**
 * Al eliminar, la sesion se borra por completo en el backend (no queda nada que recargar bajo
 * este mismo sesionId). Para no forzar al usuario a esperar la recarga de la ODC desde SAP en
 * OrdenCompraDetailView, se reinicia aqui mismo una sesion nueva y vacia para la misma ODC/almacen
 * y se reemplaza la ruta (replace, no push) para no dejar el sesionId eliminado en el historial.
 * Solo si ese reinicio falla se cae al comportamiento anterior (volver al detalle de la ODC).
 */
async function confirmarEliminarPicking(): Promise<void> {
  mostrarConfirmarEliminar.value = false
  accionEnCurso.value = 'eliminar'
  try {
    const docNum = pickingStore.sesion?.docNum
    const whsCode = pickingStore.sesion?.whsCode
    const ok = await pickingStore.eliminarSesion()
    if (!ok || docNum === undefined || whsCode === undefined) return

    const nuevaSesion = await pickingStore.iniciar(docNum, whsCode)
    if (nuevaSesion) {
      router.replace({ name: 'recepcion-proveedores-picking', params: { sesionId: nuevaSesion.id } })
    } else {
      router.push({ name: 'recepcion-proveedores-detalle', params: { docNum } })
    }
  } finally {
    accionEnCurso.value = null
  }
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
            {{ pickingStore.sesion.proveedor ?? 'Proveedor no disponible' }} · Almacén {{ pickingStore.sesion.whsCode }}
            <template v-if="pickingStore.sesion.docDueDate"> · Fecha entrega: {{ pickingStore.sesion.docDueDate }}</template>
            · Estado: {{ pickingStore.sesion.estado }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="enProceso"
            type="button"
            :disabled="!puedeConfirmarParcial || pickingStore.isSubmitting"
            title="Envía a SAP solo los productos completos; el resto queda pendiente para otro picking."
            class="px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="mostrarConfirmarParcial = true"
          >
            <LoadingSpinner v-if="accionEnCurso === 'confirmarParcial'" layout="inline" size="sm" color="current" aria-label="Confirmando" />
            {{ accionEnCurso === 'confirmarParcial' ? 'Confirmando...' : 'Confirmar Parcial' }}
          </button>
          <button
            v-if="enProceso"
            type="button"
            :disabled="!puedeConfirmarPicking || pickingStore.isSubmitting"
            title="Cierra la ODC y envía a SAP todo lo escaneado, sin opción a recibir el resto después."
            class="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="mostrarConfirmarPicking = true"
          >
            <LoadingSpinner v-if="accionEnCurso === 'confirmarPicking'" layout="inline" size="sm" color="current" aria-label="Confirmando" />
            {{ accionEnCurso === 'confirmarPicking' ? 'Confirmando...' : 'Confirmar Picking' }}
          </button>
          <button
            v-if="puedeReintentar"
            type="button"
            :disabled="pickingStore.isSubmitting"
            class="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="reintentar"
          >
            <LoadingSpinner v-if="accionEnCurso === 'confirmarPicking' || accionEnCurso === 'confirmarParcial'" layout="inline" size="sm" color="current" aria-label="Reintentando" />
            {{
              accionEnCurso
                ? 'Reintentando...'
                : `Reintentar ${modoReintento === 'Parcial' ? 'Confirmar Parcial' : 'Confirmar Picking'}`
            }}
          </button>
          <button
            v-if="puedeVerificarEstadoSap"
            type="button"
            :disabled="pickingStore.isSubmitting"
            class="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            @click="verificarEstado"
          >
            <LoadingSpinner v-if="accionEnCurso === 'verificar'" layout="inline" size="sm" color="current" aria-label="Verificando" />
            {{ accionEnCurso === 'verificar' ? 'Verificando...' : 'Verificar estado' }}
          </button>
          <button
            v-if="enProceso"
            type="button"
            :disabled="!puedeEliminarPicking || pickingStore.isSubmitting"
            :title="!puedeEliminarPicking ? 'No hay escaneos registrados para eliminar' : undefined"
            class="px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            @click="mostrarConfirmarEliminar = true"
          >
            <LoadingSpinner v-if="accionEnCurso === 'eliminar'" layout="inline" size="sm" color="current" aria-label="Eliminando" />
            {{ accionEnCurso === 'eliminar' ? 'Eliminando...' : 'Eliminar Picking' }}
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
              <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">
                <span class="inline-flex items-center gap-1.5">
                  {{ linea.itemCode }}
                  <button
                    type="button"
                    class="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Copiar código de producto"
                    @click.stop="copiarAlPortapapeles(linea.itemCode)"
                  >
                    <ClipboardDocumentIcon class="w-4 h-4" />
                  </button>
                </span>
              </td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.itemDescription }}</td>
              <td
                class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                :class="{ 'cursor-pointer hover:underline': enProceso && linea.estadoLinea !== 'Completa' && linea.codeBars }"
                :title="enProceso && linea.estadoLinea !== 'Completa' && linea.codeBars ? 'Clic para escanear con este código de barras' : undefined"
                @click.stop="seleccionarLineaPorCodigoBarras(linea)"
              >
                <span v-if="linea.codeBars" class="inline-flex items-center gap-1.5">
                  {{ linea.codeBars }}
                  <button
                    type="button"
                    class="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Copiar código de barras"
                    @click.stop="copiarAlPortapapeles(linea.codeBars)"
                  >
                    <ClipboardDocumentIcon class="w-4 h-4" />
                  </button>
                </span>
              </td>
              <td
                class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white"
                :class="{ 'cursor-pointer hover:underline': enProceso && linea.estadoLinea !== 'Completa' }"
                :title="enProceso && linea.estadoLinea !== 'Completa' ? 'Clic para escanear toda la cantidad pendiente' : undefined"
                @click.stop="seleccionarLineaCompleta(linea)"
              >
                {{ linea.cantidadPedida }}
              </td>
              <td class="px-4 py-2 text-sm text-right font-semibold text-gray-900 dark:text-white">{{ linea.cantidadPickeada }}</td>
              <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">{{ Math.max(0, linea.cantidadPendiente - linea.cantidadPickeada) }}</td>
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
                <span
                  v-if="linea.cantidadSobrante > 0"
                  class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                  title="Cantidad recibida por encima de lo pedido en esta línea"
                >
                  Sobrante: {{ linea.cantidadSobrante }}
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

    </template>

    <p v-else-if="pickingStore.error" class="text-sm text-red-600 dark:text-red-400">{{ pickingStore.error }}</p>

    <ConfirmModal
      :open="mostrarConfirmarParcial"
      title="¿Confirmar Parcial?"
      message="Se creará un Goods Receipt en SAP solo con los productos completos. Los productos pendientes o parciales quedarán disponibles para otra sesión de picking."
      confirm-label="Confirmar Parcial"
      @confirm="confirmarParcial"
      @cancel="mostrarConfirmarParcial = false"
    />

    <ConfirmModal
      :open="mostrarConfirmarPicking"
      title="¿Confirmar Picking?"
      message="Se cerrará esta ODC y se creará un Goods Receipt en SAP con todo lo escaneado. No podrás recibir el resto después."
      confirm-label="Confirmar Picking"
      @confirm="confirmarPicking"
      @cancel="mostrarConfirmarPicking = false"
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
      message="Se eliminarán todos los escaneos registrados y se iniciará una nueva sesión de picking vacía para esta ODC. No se puede deshacer. ¿Desea continuar?"
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
