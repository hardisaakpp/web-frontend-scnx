<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <router-link
      to="/transacciones"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Transacciones
    </router-link>

    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Cajero</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Ingrese monto y referencia para consultar transacciones de los últimos 20 minutos.
      </p>
    </div>

    <!-- Error global -->
    <div
      v-if="store.errorCajero"
      class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400"
    >
      {{ store.errorCajero }}
    </div>

    <!-- Tabla -->
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
      <TablaCajero
        :transacciones="store.transaccionesCajero"
        :loading="store.loadingCajero"
        :reservando="store.reservando"
        @reservar="abrirDialogo"
        @filtrar="(m, r, dt, r2, dc, dtr) => aplicarFiltros(m, r, dt, r2, dc, dtr)"
      />
    </div>

    <!-- Diálogo de éxito -->
    <Teleport to="body">
      <div
        v-if="exitoVisible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 text-center px-8 py-8">
          <div class="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-4">
            <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">¡Reserva exitosa!</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            La transacción <span class="font-mono font-semibold text-gray-700 dark:text-gray-300">{{ exitoReferencia }}</span> fue reservada correctamente.
          </p>
          <button
            @click="exitoVisible = false"
            class="w-full px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Diálogo de confirmación -->
    <DialogoReservar
      :visible="dialogoVisible"
      :transaccion="transaccionSeleccionada"
      :tiendas="tiendas"
      :cod-almacen-default="codAlmacenDefault"
      :cargando="store.reservando"
      @confirmar="confirmarReserva"
      @cancelar="cerrarDialogo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTransaccionesStore } from '../store/transacciones'
import { useToast } from '@/composables/useToast'
import TablaCajero from '../components/TablaCajero.vue'
import DialogoReservar from '../components/DialogoReservar.vue'
import { transaccionesService } from '../services/transaccionesApi'
import type { Transaccion, ReservarTransaccionRequest } from '../types'

const authStore = useAuthStore()
const store = useTransaccionesStore()
const toast = useToast()

const tiendas = computed(() =>
  store.almacenes.map(a => ({ codigo: a.codAlmacen, nombre: a.nombre }))
)

const codAlmacenDefault = computed(() => {
  const accesses = authStore.userWarehouseAccesses
  const first = Array.isArray(accesses) ? accesses[0] : accesses
  return first?.codAlmacen ?? ''
})

onMounted(() => store.fetchAlmacenes())
onUnmounted(() => store.limpiarCajero())

const montoFiltro = ref<number | null>(null)
const referenciaFiltro = ref<string | null>(null)
const descripcionTransferenciaFiltro = ref<string | null>(null)
const referenciaTransaccion2Filtro = ref<string | null>(null)
const descripcionCausalFiltro = ref<string | null>(null)
const descripcionTransaccionFiltro = ref<string | null>(null)

async function cargar() {
  if (montoFiltro.value == null || !referenciaFiltro.value) return
  try {
    await store.fetchCajero({
      valorMontoTotal: montoFiltro.value,
      referenciaTransaccion: referenciaFiltro.value,
      descripcionTransferencia: descripcionTransferenciaFiltro.value,
      referenciaTransaccion2: referenciaTransaccion2Filtro.value,
      descripcionCausal: descripcionCausalFiltro.value,
      descripcionTransaccion: descripcionTransaccionFiltro.value,
    })
  } catch {
    // error ya visible en store.errorCajero
  }
}

function aplicarFiltros(
  monto: number | null,
  referencia: string | null,
  descripcionTransferencia: string | null,
  referenciaTransaccion2: string | null,
  descripcionCausal: string | null,
  descripcionTransaccion: string | null,
) {
  montoFiltro.value = monto
  referenciaFiltro.value = referencia
  descripcionTransferenciaFiltro.value = descripcionTransferencia
  referenciaTransaccion2Filtro.value = referenciaTransaccion2
  descripcionCausalFiltro.value = descripcionCausal
  descripcionTransaccionFiltro.value = descripcionTransaccion
  cargar()
}

const dialogoVisible = ref(false)
const transaccionSeleccionada = ref<Transaccion | null>(null)
const exitoVisible = ref(false)
const exitoReferencia = ref('')

function abrirDialogo(tx: Transaccion) {
  transaccionSeleccionada.value = tx
  dialogoVisible.value = true
  // Auditoria: registrar que el usuario abrió el dialogo de reserva (fire-and-forget)
  transaccionesService.cajero.registrarEvento({
    tipoEvento: 'INICIO_RESERVA',
    idTransaccion: tx.id,
  }).catch(() => { /* silencioso — no bloquea la UI */ })
}

function cerrarDialogo(registrarCancelacion = true) {
  if (registrarCancelacion && transaccionSeleccionada.value) {
    // Auditoria: registrar que el usuario canceló sin confirmar (fire-and-forget)
    transaccionesService.cajero.registrarEvento({
      tipoEvento: 'CANCELAR_RESERVA',
      idTransaccion: transaccionSeleccionada.value.id,
    }).catch(() => { /* silencioso — no bloquea la UI */ })
  }
  dialogoVisible.value = false
  transaccionSeleccionada.value = null
}

async function confirmarReserva(data: { codVendedor: string; codigoAlmacen: string; nombreAlmacen: string }) {
  if (!transaccionSeleccionada.value) return

  const payload: ReservarTransaccionRequest = {
    codigoAlmacen: data.codigoAlmacen,
    nombreAlmacen: data.nombreAlmacen,
    codVendedor: data.codVendedor,
  }

  try {
    exitoReferencia.value = transaccionSeleccionada.value.referenciaTransaccion
    await store.reservar(transaccionSeleccionada.value.id, payload)
    cerrarDialogo(false) // exito: no registrar cancelacion
    exitoVisible.value = true
  } catch (err: any) {
    const status = err?.response?.status
    const mensaje = err?.response?.data?.error || err?.message || 'Error desconocido'
    if (status === 409) toast.warning('Ya reservada', mensaje)
    else if (status === 404) toast.error('No encontrada', mensaje)
    else if (status === 422) toast.error('Código de vendedor inválido', mensaje)
    else toast.error('Error al reservar', mensaje)
  }
}
</script>
