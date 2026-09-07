<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import {
  ArrowLeftIcon, CheckBadgeIcon, CheckCircleIcon, ClipboardDocumentListIcon, CloudArrowUpIcon,
  ExclamationTriangleIcon, LockClosedIcon, QrCodeIcon,
} from '@heroicons/vue/24/outline'
import { usePickingDistribucionStore } from '../stores/pickingDistribucionStore'
import { useGrupoStore } from '../stores/grupoStore'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import ConfirmActionModal from '../components/ConfirmActionModal.vue'

// P-009 (picking transversal por artículo, escaneo rápido con cola local + autosync 5s,
// mismo patrón que OdcPickingWorkView) + P-010 (picking por documento — sección aparte, más
// lenta de tráfico, sin cola local) + cierre del picking (parcial exige supervisor).

const route = useRoute()
const router = useRouter()
const store = usePickingDistribucionStore()
const grupoStore = useGrupoStore()
const authStore = useAuthStore()
const toast = useToast()

const grupoId = computed(() => route.params.id as string)
const sessionId = computed(() => route.params.sessionId as string)

const puedeSupervisar = computed(() =>
  authStore.userRoles?.includes('Admin') || authStore.hasPermission('cedi.grupo.picking.supervisor'))

const itemCodeInput = ref('')
const cantidadInput = ref(1)
const itemCodeRef = ref<HTMLInputElement | null>(null)

const totalPendiente = computed(() =>
  (store.session?.articulos ?? []).reduce((acc, a) => acc + Math.max(0, a.cantidadTotal - a.cantidadEscaneada), 0))

function enColaDe(itemCode: string) {
  return store.pendingQueue.filter(i => i.itemCode === itemCode).reduce((a, i) => a + i.cantidad, 0)
}

function progreso(itemCode: string) {
  const articulo = store.session?.articulos.find(a => a.itemCode === itemCode)
  if (!articulo || articulo.cantidadTotal === 0) return 0
  const optimista = articulo.cantidadEscaneada + enColaDe(itemCode)
  return Math.min(100, Math.round((optimista / articulo.cantidadTotal) * 100))
}

async function onScan() {
  const itemCode = itemCodeInput.value.trim()
  if (!itemCode) return

  const cantidad = Number(cantidadInput.value) || 0
  if (cantidad <= 0) {
    toast.warning('Cantidad inválida')
    return
  }

  const pendiente = store.pendienteDeArticulo(itemCode)
  if (pendiente <= 0) {
    toast.warning('Ítem no pendiente', `"${itemCode}" no pertenece a este grupo o ya se completó.`)
  }

  const cantidadFinal = pendiente > 0 ? Math.min(cantidad, pendiente) : cantidad
  store.addScan(itemCode, cantidadFinal)

  itemCodeInput.value = ''
  cantidadInput.value = 1
  await nextTick()
  itemCodeRef.value?.focus()
}

// ── Cerrar picking ────────────────────────────────────────────────────────────────────
const confirmandoCierre = ref(false)
const cerrando = ref(false)

async function onCerrar() {
  cerrando.value = true
  try {
    await store.closeSession()
    toast.success('Picking cerrado', 'Ya se puede integrar a SAP desde el detalle del grupo.')
    confirmandoCierre.value = false
  } catch (e: any) {
    toast.error('No se pudo cerrar el picking', e?.response?.data?.message)
  } finally {
    cerrando.value = false
  }
}

// ── Picking por Documento (P-010) ────────────────────────────────────────────────────
const verPorDocumento = ref(false)
const solicitudAbierta = ref<string | null>(null)
const scanPorDocInput = ref<Record<string, number>>({})
const accionCompletarSolicitud = ref<{ id: string; numDoc: string } | null>(null)
const motivoCompletar = ref('')
const completando = ref(false)

async function toggleSolicitud(id: string) {
  if (solicitudAbierta.value === id) {
    solicitudAbierta.value = null
    return
  }
  solicitudAbierta.value = id
  await store.loadSolicitud(id)
}

async function onScanSolicitud(itemCode: string) {
  if (!solicitudAbierta.value) return
  const cantidad = Number(scanPorDocInput.value[itemCode]) || 0
  if (cantidad <= 0) return
  try {
    await store.scanSolicitud(solicitudAbierta.value, itemCode, cantidad)
    scanPorDocInput.value[itemCode] = 0
    toast.success('Escaneado', `${cantidad} de "${itemCode}" guardado(s).`)
  } catch (e: any) {
    toast.error('No se pudo guardar el escaneo', e?.response?.data?.message)
  }
}

function abrirCompletarSolicitud(id: string, numDoc: string) {
  accionCompletarSolicitud.value = { id, numDoc }
  motivoCompletar.value = ''
}

async function confirmarCompletarSolicitud() {
  if (!accionCompletarSolicitud.value) return
  completando.value = true
  try {
    await store.completarSolicitud(accionCompletarSolicitud.value.id, motivoCompletar.value.trim() || null)
    toast.success('Solicitud completada', `"${accionCompletarSolicitud.value.numDoc}" marcada 100% completa.`)
    accionCompletarSolicitud.value = null
  } catch (e: any) {
    toast.error('No se pudo completar', e?.response?.data?.message)
  } finally {
    completando.value = false
  }
}

onMounted(async () => {
  await Promise.all([store.loadSession(sessionId.value), grupoStore.fetchGrupo(grupoId.value)])
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
      @click="router.push(`/cedi/distribucion/grupos/${grupoId}`)"
    >
      <ArrowLeftIcon class="w-4 h-4" /> Volver al grupo
    </button>

    <div v-if="store.loadingSession" class="text-center text-gray-400 py-12">Cargando sesión...</div>

    <template v-else-if="store.session">
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <QrCodeIcon class="w-6 h-6 text-blue-600" />
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">Picking transversal — {{ store.session.grupoNombre }}</h1>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            @click="verPorDocumento = !verPorDocumento"
          >
            <ClipboardDocumentListIcon class="w-4 h-4" /> {{ verPorDocumento ? 'Ver transversal' : 'Ver por documento' }}
          </button>
        </div>

        <form v-if="store.session.estado === 'Abierta' && !verPorDocumento" class="flex flex-wrap gap-3" @submit.prevent="onScan">
          <input
            ref="itemCodeRef"
            v-model="itemCodeInput"
            type="text"
            placeholder="Código de artículo"
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
          <button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
            Escanear
          </button>
        </form>
        <p v-else-if="!verPorDocumento" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LockClosedIcon class="w-4 h-4" /> Sesión cerrada — ya no se puede escanear acá.
        </p>
      </div>

      <!-- Estado de sincronización (solo vista transversal) -->
      <div v-if="!verPorDocumento" class="flex items-center justify-between mb-6 px-1 text-sm">
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

      <!-- Vista transversal (P-009) -->
      <div v-if="!verPorDocumento" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Progreso por ítem</h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ totalPendiente }} unidades pendientes en total</span>
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="articulo in store.session.articulos" :key="articulo.itemCode" class="p-4">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 dark:text-white">{{ articulo.itemCode }}</span>
                  <span class="text-xs text-gray-400">({{ articulo.cantidadTiendas }} tienda(s))</span>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ articulo.descripcion }}</p>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 shrink-0">
                <CheckCircleIcon v-if="articulo.estado === 'Completado'" class="w-4 h-4 text-emerald-500" />
                {{ articulo.cantidadEscaneada }} / {{ articulo.cantidadTotal }}
                <span v-if="enColaDe(articulo.itemCode) > 0" class="text-amber-500 dark:text-amber-400">
                  (+{{ enColaDe(articulo.itemCode) }} sin sincronizar)
                </span>
              </span>
            </div>
            <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="articulo.estado === 'Completado' ? 'bg-emerald-500' : 'bg-blue-500'"
                :style="{ width: progreso(articulo.itemCode) + '%' }"
              />
            </div>
          </li>
        </ul>
      </div>

      <!-- Vista por documento (P-010) -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Solicitudes del grupo</h2>
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="s in grupoStore.current?.solicitudes ?? []" :key="s.transferenciaSolicitudId">
            <button
              type="button"
              class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
              @click="toggleSolicitud(s.transferenciaSolicitudId)"
            >
              <span class="font-medium text-gray-900 dark:text-white">{{ s.numDoc }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">→ {{ s.tiendaDestino }}</span>
            </button>

            <div v-if="solicitudAbierta === s.transferenciaSolicitudId" class="px-4 pb-4">
              <div v-if="store.loadingSolicitud" class="text-sm text-gray-400 py-4">Cargando...</div>
              <template v-else-if="store.solicitudDetalle">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    {{ store.solicitudDetalle.cantidadEscaneada }} / {{ store.solicitudDetalle.cantidadTotal }} escaneado
                  </span>
                  <button
                    v-if="puedeSupervisar && store.solicitudDetalle.cantidadEscaneada < store.solicitudDetalle.cantidadTotal"
                    type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium"
                    @click="abrirCompletarSolicitud(s.transferenciaSolicitudId, s.numDoc)"
                  >
                    <CheckBadgeIcon class="w-3.5 h-3.5" /> Marcar completo
                  </button>
                </div>
                <ul class="space-y-2">
                  <li
                    v-for="linea in store.solicitudDetalle.lineas"
                    :key="linea.id"
                    class="flex items-center justify-between gap-3 text-sm bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3"
                  >
                    <div class="min-w-0">
                      <p class="font-medium text-gray-900 dark:text-white truncate">{{ linea.itemCode }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ linea.descripcion }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ linea.cantidadEscaneada }}/{{ linea.cantidadSolicitada }}</span>
                      <template v-if="linea.cantidadEscaneada < linea.cantidadSolicitada && store.session.estado === 'Abierta'">
                        <input
                          v-model.number="scanPorDocInput[linea.itemCode]"
                          type="number"
                          min="0"
                          :placeholder="String(linea.cantidadSolicitada - linea.cantidadEscaneada)"
                          class="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          :disabled="store.scanningSolicitud"
                          class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold"
                          @click="onScanSolicitud(linea.itemCode)"
                        >
                          Escanear
                        </button>
                      </template>
                      <CheckCircleIcon v-else-if="linea.cantidadEscaneada >= linea.cantidadSolicitada" class="w-4 h-4 text-emerald-500" />
                    </div>
                  </li>
                </ul>
              </template>
            </div>
          </li>
        </ul>
      </div>

      <!-- Cierre del picking -->
      <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <template v-if="store.session.estado === 'Abierta'">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Cuando termines (aunque quede incompleto), cerrá el picking para poder integrarlo a SAP desde el grupo.
            </p>
            <button
              type="button"
              class="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold disabled:opacity-50"
              :disabled="store.session.cantidadEscaneadaTotal <= 0"
              @click="confirmandoCierre = true"
            >
              <LockClosedIcon class="w-4 h-4" /> Cerrar picking
            </button>
          </div>
        </template>
        <div v-else class="flex items-center gap-3">
          <CheckCircleIcon class="w-6 h-6 text-emerald-500 shrink-0" />
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Picking cerrado ({{ store.session.cantidadEscaneadaTotal }} unidad(es) escaneada(s)).
            <router-link :to="`/cedi/distribucion/grupos/${grupoId}`" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Ir al grupo para integrar a SAP
            </router-link>
          </p>
        </div>
      </div>
    </template>
  </div>

  <!-- Escaneos rechazados: modal bloqueante (mismo patrón que ODC — P-006) -->
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

  <!-- Confirmar cierre de picking -->
  <ConfirmActionModal
    :open="confirmandoCierre"
    title="Cerrar picking"
    message="Se cierra la sesión con lo escaneado hasta ahora (admite quedar incompleta). Si queda algo sin completar, se necesita permiso de supervisor para cerrar."
    confirm-label="Sí, cerrar picking"
    accent="amber"
    :busy="cerrando"
    @cancel="confirmandoCierre = false"
    @confirm="onCerrar"
  />

  <!-- Confirmar "marcar completo" de una solicitud sin escanear -->
  <ConfirmActionModal
    :open="accionCompletarSolicitud !== null"
    title="Marcar completo sin escanear"
    :message="`Vas a cargar el faltante de '${accionCompletarSolicitud?.numDoc}' SIN escanearlo físicamente. Queda registrado que no se escaneó de verdad.`"
    confirm-label="Sí, marcar completo"
    accent="amber"
    :busy="completando"
    @cancel="accionCompletarSolicitud = null"
    @confirm="confirmarCompletarSolicitud"
  >
    <label class="block mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
      Motivo <span class="font-normal text-gray-400">(opcional, queda guardado)</span>
      <textarea
        v-model="motivoCompletar"
        rows="2"
        class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
      />
    </label>
  </ConfirmActionModal>
</template>
