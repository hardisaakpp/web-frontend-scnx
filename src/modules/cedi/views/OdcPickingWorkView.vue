<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import {
  ArrowLeftIcon, CheckBadgeIcon, CheckCircleIcon, CloudArrowUpIcon,
  ExclamationTriangleIcon, LockClosedIcon, QrCodeIcon, TrashIcon,
} from '@heroicons/vue/24/outline'
import { useOdcPickingStore } from '../stores/odcPickingStore'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import ConfirmActionModal from '../components/ConfirmActionModal.vue'
import type { OdcPickingLineDto } from '../types'

// P-006 — odcPickingWork.php del legacy: escanear rápido, acumular local, sincronizar cada
// 5s. P-007 agrega "Cerrar picking" (local) e "Integrar a SAP" (crea el GoodsReceipt
// vinculado a la ODC de origen — ver abajo).

const route = useRoute()
const router = useRouter()
const store = useOdcPickingStore()
const authStore = useAuthStore()
const toast = useToast()

const sessionId = computed(() => route.params.sessionId as string)
const numDoc = computed(() => route.params.numDoc as string)

/** Resetear/marcar completo son acciones de supervisor — separadas del permiso base de escanear. */
const puedeSupervisar = computed(() =>
  authStore.userRoles?.includes('Admin') || authStore.hasPermission('cedi.odc.picking.supervisor'))

const itemCodeInput = ref('')
const cantidadInput = ref(1)
const itemCodeRef = ref<HTMLInputElement | null>(null)

const totalPendiente = computed(() =>
  (store.session?.lineas ?? []).reduce((acc, l) => acc + Math.max(0, l.cantidad - l.cantidadEscaneada), 0))

/** Cuánto hay de ESTE ítem sin sincronizar todavía (para que la barra no se sienta atrasada 5s). */
function enColaDe(itemCode: string) {
  return store.pendingQueue.filter(i => i.itemCode === itemCode).reduce((a, i) => a + i.cantidad, 0)
}

function descripcionDe(itemCode: string) {
  return store.session?.lineas.find(l => l.itemCode === itemCode)?.descripcion
}

function progreso(lineaId: string) {
  const linea = store.session?.lineas.find(l => l.id === lineaId)
  if (!linea || linea.cantidad === 0) return 0
  const optimista = linea.cantidadEscaneada + enColaDe(linea.itemCode)
  return Math.min(100, Math.round((optimista / linea.cantidad) * 100))
}

async function onScan() {
  const itemCode = itemCodeInput.value.trim()
  if (!itemCode) return

  const cantidad = Number(cantidadInput.value) || 0
  if (cantidad <= 0) {
    toast.warning('Cantidad inválida')
    return
  }

  const pendiente = store.pendienteDeLinea(itemCode)
  if (pendiente <= 0) {
    toast.warning('Ítem no pendiente', `"${itemCode}" no pertenece a esta ODC o ya se completó — verificalo con el servidor al sincronizar.`)
    // Igual se agrega: la validación autoritativa es del backend al sincronizar (por si el
    // operador escaneó bien y la caché local está desactualizada, ej. otro repuso stock).
  }

  const cantidadFinal = pendiente > 0 ? Math.min(cantidad, pendiente) : cantidad
  store.addScan(itemCode, cantidadFinal)

  itemCodeInput.value = ''
  cantidadInput.value = 1
  await nextTick()
  itemCodeRef.value?.focus()
}

// ── Acciones de supervisor: resetear un ítem / marcar completo (por ítem o toda la sesión) ──
// + cierre e integración a SAP (P-007) — comparten el mismo modal de confirmación.
type AccionSupervisor = { tipo: 'reset' | 'completar' | 'completarTodo' | 'cerrar' | 'integrar'; itemCode?: string; descripcion?: string }

const accionActiva = ref<AccionSupervisor | null>(null)
const motivoInput = ref('')
const confirmando = ref(false)

const modalConfig = computed(() => {
  if (!accionActiva.value) return null
  const item = accionActiva.value.itemCode ? `"${accionActiva.value.itemCode}"${accionActiva.value.descripcion ? ` (${accionActiva.value.descripcion})` : ''}` : ''
  switch (accionActiva.value.tipo) {
    case 'reset':
      return {
        title: 'Resetear escaneo a cero',
        message: `Esto borra TODO lo escaneado de ${item} y lo vuelve a 0. No se puede deshacer — quedará auditado quién lo hizo y cuándo.`,
        confirmLabel: 'Sí, resetear a 0',
        delaySeconds: 5,
        accent: 'red' as const,
      }
    case 'completar':
      return {
        title: 'Marcar completo sin escanear',
        message: `Vas a cargar el faltante de ${item} SIN escanearlo físicamente. Queda registrado que no se escaneó de verdad.`,
        confirmLabel: 'Sí, marcar completo',
        delaySeconds: 0,
        accent: 'amber' as const,
      }
    case 'completarTodo':
      return {
        title: 'Marcar TODO completo',
        message: 'Vas a cargar el faltante de TODAS las líneas pendientes de esta sesión SIN escanearlas. Queda registrado que no se escanearon de verdad.',
        confirmLabel: 'Sí, marcar todo completo',
        delaySeconds: 0,
        accent: 'amber' as const,
      }
    case 'cerrar':
      return {
        title: 'Cerrar picking',
        message: 'Se cierra la sesión con lo escaneado hasta ahora (admite quedar incompleta). Después de cerrar ya no se puede seguir escaneando en esta sesión.',
        confirmLabel: 'Sí, cerrar picking',
        delaySeconds: 0,
        accent: 'amber' as const,
      }
    case 'integrar':
      return {
        title: 'Integrar a SAP',
        message: 'Se va a crear un GoodsReceipt REAL en SAP con lo escaneado, vinculado a esta ODC. Esto reduce el pendiente de la orden de compra en SAP — no es reversible desde acá.',
        confirmLabel: 'Sí, integrar a SAP',
        delaySeconds: 5,
        accent: 'red' as const,
      }
  }
})

function abrirReset(linea: OdcPickingLineDto) {
  accionActiva.value = { tipo: 'reset', itemCode: linea.itemCode, descripcion: linea.descripcion }
  motivoInput.value = ''
}

function abrirCompletarLinea(linea: OdcPickingLineDto) {
  accionActiva.value = { tipo: 'completar', itemCode: linea.itemCode, descripcion: linea.descripcion }
  motivoInput.value = ''
}

function abrirCompletarTodo() {
  accionActiva.value = { tipo: 'completarTodo' }
  motivoInput.value = ''
}

function abrirCerrar() {
  accionActiva.value = { tipo: 'cerrar' }
  motivoInput.value = ''
}

function abrirIntegrar() {
  accionActiva.value = { tipo: 'integrar' }
  motivoInput.value = ''
}

function cerrarModalAccion() {
  accionActiva.value = null
  motivoInput.value = ''
}

async function confirmarAccion() {
  if (!accionActiva.value) return
  confirmando.value = true
  const motivo = motivoInput.value.trim() || null
  try {
    if (accionActiva.value.tipo === 'reset') {
      await store.resetLine(accionActiva.value.itemCode!, motivo)
      toast.success('Reseteado', `Se borró lo escaneado de "${accionActiva.value.itemCode}".`)
    } else if (accionActiva.value.tipo === 'completar') {
      await store.markLineComplete(accionActiva.value.itemCode!, motivo)
      toast.success('Marcado completo', `"${accionActiva.value.itemCode}" quedó completo.`)
    } else if (accionActiva.value.tipo === 'completarTodo') {
      await store.markAllComplete(motivo)
      toast.success('Todo marcado completo')
    } else if (accionActiva.value.tipo === 'cerrar') {
      await store.closeSession()
      toast.success('Picking cerrado', 'Ya se puede integrar a SAP.')
    } else {
      await store.integrateGoodsReceipt()
      toast.success('Integrado a SAP', `GoodsReceipt DocNum ${store.session?.goodsReceiptDocNum}.`)
    }
    cerrarModalAccion()
  } catch (e: any) {
    toast.error('No se pudo completar la acción', e?.response?.data?.message)
  } finally {
    confirmando.value = false
  }
}

onMounted(async () => {
  await store.loadSession(sessionId.value)
  itemCodeRef.value?.focus()
})

onBeforeUnmount(() => {
  store.flushAndStop()
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      @click="router.push(`/cedi/odc/${numDoc}`)"
    >
      <ArrowLeftIcon class="w-4 h-4" /> Volver a la ODC {{ numDoc }}
    </button>

    <div v-if="store.loadingSession" class="text-center text-gray-400 py-12">Cargando sesión...</div>

    <template v-else-if="store.session">
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <QrCodeIcon class="w-6 h-6 text-blue-600" />
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">Escaneo — ODC {{ numDoc }}</h1>
          </div>
          <button
            v-if="puedeSupervisar"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
            @click="abrirCompletarTodo"
          >
            <CheckBadgeIcon class="w-4 h-4" /> Marcar TODO completo
          </button>
        </div>

        <form v-if="store.session.estado === 'Abierta'" class="flex flex-wrap gap-3" @submit.prevent="onScan">
          <input
            ref="itemCodeRef"
            v-model="itemCodeInput"
            type="text"
            placeholder="Código de artículo / código de barras"
            autofocus
            class="flex-1 min-w-[200px] px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <input
            v-model.number="cantidadInput"
            type="number"
            min="0.0001"
            step="any"
            class="w-28 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
          >
            Escanear
          </button>
        </form>
        <p v-else class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LockClosedIcon class="w-4 h-4" /> Sesión cerrada — ya no se puede escanear acá.
        </p>
      </div>

      <!-- Estado de sincronización: cuánto hay en cola local y cuándo se mandó lo último -->
      <div class="flex items-center justify-between mb-6 px-1 text-sm">
        <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <CloudArrowUpIcon class="w-4 h-4" :class="{ 'animate-pulse text-blue-500': store.syncing }" />
          <span v-if="store.pendingQueue.length > 0">
            {{ store.pendingQueue.length }} escaneo(s) sin sincronizar ({{ store.cantidadEnCola }} unidades) — se envían solos cada 5s
          </span>
          <span v-else-if="store.syncing">Sincronizando...</span>
          <span v-else>Todo sincronizado</span>
        </div>
        <button
          type="button"
          class="text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50 disabled:no-underline"
          :disabled="store.pendingQueue.length === 0 || store.syncing"
          @click="store.syncNow()"
        >
          Sincronizar ahora
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Progreso por ítem
          </h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ totalPendiente }} unidades pendientes en total</span>
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="linea in store.session.lineas" :key="linea.id" class="p-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 dark:text-white">{{ linea.itemCode }}</span>
                  <span v-if="linea.codigoBarras" class="font-mono text-xs text-gray-400">{{ linea.codigoBarras }}</span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ linea.descripcion }}</p>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 shrink-0">
                <CheckCircleIcon v-if="linea.estado === 'Completado'" class="w-4 h-4 text-emerald-500" />
                {{ linea.cantidadEscaneada }} / {{ linea.cantidad }}
                <span v-if="enColaDe(linea.itemCode) > 0" class="text-amber-500 dark:text-amber-400">
                  (+{{ enColaDe(linea.itemCode) }} sin sincronizar)
                </span>
              </span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="linea.estado === 'Completado' ? 'bg-emerald-500' : 'bg-blue-500'"
                :style="{ width: progreso(linea.id) + '%' }"
              />
            </div>

            <div v-if="puedeSupervisar" class="flex justify-end gap-2 mt-2">
              <button
                v-if="linea.estado !== 'Completado'"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
                @click="abrirCompletarLinea(linea)"
              >
                <CheckBadgeIcon class="w-3.5 h-3.5" /> Marcar completo
              </button>
              <button
                v-if="linea.cantidadEscaneada > 0"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                @click="abrirReset(linea)"
              >
                <TrashIcon class="w-3.5 h-3.5" /> Resetear
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- P-007: cierre e integración a SAP -->
      <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <template v-if="store.session.integradaSap">
          <div class="flex items-start gap-3">
            <CheckCircleIcon class="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">Integrado a SAP</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                GoodsReceipt DocNum <span class="font-mono">{{ store.session.goodsReceiptDocNum }}</span>
                (DocEntry {{ store.session.goodsReceiptDocEntry }}). El pendiente de la ODC en SAP ya se redujo.
              </p>
            </div>
          </div>
        </template>

        <template v-else-if="store.session.estado === 'Abierta'">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Cuando termines de escanear (aunque quede incompleto), cerrá el picking para poder integrarlo a SAP.
            </p>
            <button
              type="button"
              class="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold disabled:opacity-50"
              :disabled="store.session.cantidadEscaneada <= 0"
              @click="abrirCerrar"
            >
              <LockClosedIcon class="w-4 h-4" /> Cerrar picking
            </button>
          </div>
        </template>

        <template v-else>
          <div class="flex items-start gap-3 mb-3" v-if="store.session.ultimoErrorIntegracion">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">Falló el último intento de integración</p>
              <p class="text-sm text-red-600 dark:text-red-400">{{ store.session.ultimoErrorIntegracion }}</p>
            </div>
          </div>
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Picking cerrado ({{ store.session.cantidadEscaneada }} unidad(es) escaneada(s)). Falta integrarlo a SAP.
            </p>
            <button
              v-if="puedeSupervisar"
              type="button"
              class="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              :disabled="store.integrating"
              @click="abrirIntegrar"
            >
              <CheckBadgeIcon class="w-4 h-4" /> {{ store.session.ultimoErrorIntegracion ? 'Reintentar integración' : 'Integrar a SAP' }}
            </button>
            <p v-else class="shrink-0 text-xs text-gray-400 dark:text-gray-500">Requiere permiso de supervisor</p>
          </div>
        </template>
      </div>
    </template>
  </div>

  <!--
    Escaneos rechazados: modal bloqueante, no un toast que se desvanece. El operador tiene
    algo en la mano que NO quedó guardado — tiene que enterarse sí o sí y confirmar que lo
    vio. No se puede cerrar con Escape ni clickeando afuera (@close vacío a propósito),
    solo con el botón "Entendido".
  -->
  <TransitionRoot appear :show="store.pendingRejections.length > 0" as="template">
    <Dialog class="relative z-50" @close="() => {}">
      <TransitionChild
        enter="duration-200 ease-out" enter-from="opacity-0" enter-to="opacity-100"
        leave="duration-150 ease-in" leave-from="opacity-100" leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          enter="duration-200 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
          leave="duration-150 ease-in" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95"
        >
          <DialogPanel class="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-red-500/20 overflow-hidden">
            <div class="bg-red-600 px-5 py-4 flex items-center gap-3">
              <ExclamationTriangleIcon class="w-7 h-7 text-white shrink-0" />
              <DialogTitle class="text-white font-bold text-lg">
                Escaneo{{ store.pendingRejections.length > 1 ? 's' : '' }} NO guardado{{ store.pendingRejections.length > 1 ? 's' : '' }}
              </DialogTitle>
            </div>

            <div class="p-5 max-h-[50vh] overflow-y-auto">
              <ul class="space-y-3">
                <li
                  v-for="(r, idx) in store.pendingRejections"
                  :key="idx"
                  class="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-xl p-3"
                >
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ r.itemCode }}
                    <span class="text-gray-500 dark:text-gray-400 font-normal">· {{ r.cantidad }} unidad(es)</span>
                  </p>
                  <p v-if="descripcionDe(r.itemCode)" class="text-sm text-gray-600 dark:text-gray-300">{{ descripcionDe(r.itemCode) }}</p>
                  <p class="text-sm text-red-700 dark:text-red-400 font-medium mt-1">{{ r.motivo }}</p>
                </li>
              </ul>
            </div>

            <div class="px-5 py-4 bg-gray-50 dark:bg-gray-900/40 flex justify-end">
              <button
                type="button"
                class="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                @click="store.acknowledgeRejections()"
              >
                Entendido
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>

  <!-- Reset (espera 5s) / Marcar completo (por ítem o toda la sesión) — acciones de supervisor -->
  <ConfirmActionModal
    v-if="modalConfig"
    :open="accionActiva !== null"
    :title="modalConfig.title"
    :message="modalConfig.message"
    :confirm-label="modalConfig.confirmLabel"
    :delay-seconds="modalConfig.delaySeconds"
    :accent="modalConfig.accent"
    :busy="confirmando"
    @cancel="cerrarModalAccion"
    @confirm="confirmarAccion"
  >
    <label
      v-if="accionActiva && !['cerrar', 'integrar'].includes(accionActiva.tipo)"
      class="block mt-4 text-sm font-medium text-gray-600 dark:text-gray-400"
    >
      Motivo <span class="font-normal text-gray-400">(opcional, queda guardado)</span>
      <textarea
        v-model="motivoInput"
        rows="2"
        placeholder="Ej: no está seguro de la cantidad, van a devolver unidades..."
        class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
      />
    </label>
  </ConfirmActionModal>
</template>
