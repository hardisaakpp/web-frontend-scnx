<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePickingStore } from '../stores/pickingStore'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorModal from '@/components/ErrorModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import SuccessModal from '@/components/SuccessModal.vue'

const route = useRoute()
const router = useRouter()
const pickingStore = usePickingStore()
const authStore = useAuthStore()

const sesionId = computed(() => Number(route.params.sesionId))
const usuarioActualId = computed(() => authStore.userData?.id ?? null)

const codigoInput = ref('')
const cantidadInput = ref(1)
const codigoInputEl = ref<HTMLInputElement | null>(null)

const mostrarLogs = ref(false)
const mostrarConfirmarCierre = ref(false)
const mostrarCierreExitoso = ref(false)

const sesionFinalizada = computed(() => pickingStore.sesion?.estado === 'Finalizada')
const puedeCerrar = computed(() => pickingStore.sesion?.estado === 'EnProceso' && pickingStore.scans.length > 0)

async function cargar(): Promise<void> {
  await pickingStore.cargarSesion(sesionId.value)
  await pickingStore.cargarScans()
}

async function escanear(): Promise<void> {
  const codigo = codigoInput.value.trim()
  if (!codigo || sesionFinalizada.value) return
  const ok = await pickingStore.escanear(codigo, Math.max(1, cantidadInput.value || 1))
  if (ok) {
    codigoInput.value = ''
    cantidadInput.value = 1
  }
  codigoInputEl.value?.focus()
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

async function alternarLogs(): Promise<void> {
  mostrarLogs.value = !mostrarLogs.value
  if (mostrarLogs.value && pickingStore.logs.length === 0) {
    await pickingStore.cargarLogs()
  }
}

function volverAOrden(): void {
  if (pickingStore.sesion) {
    router.push({ name: 'recepcion-proveedores-detalle', params: { docNum: pickingStore.sesion.docNum } })
  }
}

function cerrarModalExito(): void {
  mostrarCierreExitoso.value = false
  volverAOrden()
}

onMounted(cargar)
watch(sesionId, cargar)
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <LoadingSpinner v-if="pickingStore.loading" message="Cargando sesión de picking..." />

    <template v-else-if="pickingStore.sesion">
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            Picking — ODC {{ pickingStore.sesion.docNum }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Almacén {{ pickingStore.sesion.whsCode }} · Estado: {{ pickingStore.sesion.estado }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="alternarLogs"
          >
            {{ mostrarLogs ? 'Ocultar logs' : 'Ver logs' }}
          </button>
          <button
            type="button"
            :disabled="!puedeCerrar || pickingStore.isSubmitting"
            class="px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="mostrarConfirmarCierre = true"
          >
            Cerrar Picking
          </button>
        </div>
      </div>

      <!-- Input de escaneo: lector de codigo de barras actuando como teclado (Enter = escanear). -->
      <form
        v-if="!sesionFinalizada"
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
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pedido</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pickeado</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pendiente</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="linea in pickingStore.sesion.lineas" :key="linea.id">
              <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ linea.itemCode }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.itemDescription }}</td>
              <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">{{ linea.cantidadPedida }}</td>
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
                  v-if="!sesionFinalizada && scan.usuarioId === usuarioActualId"
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

    <ErrorModal
      :open="!!pickingStore.actionError"
      title="No se pudo completar la acción"
      :message="pickingStore.actionError ?? ''"
      @close="pickingStore.limpiarActionError()"
    />
  </div>
</template>
