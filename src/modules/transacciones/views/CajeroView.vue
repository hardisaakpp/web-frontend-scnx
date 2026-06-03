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
        @filtrar="aplicarFiltros"
      />
    </div>

    <!-- Diálogo de confirmación -->
    <DialogoReservar
      :visible="dialogoVisible"
      :transaccion="transaccionSeleccionada"
      :tiendas="tiendas"
      :cargando="store.reservando"
      @confirmar="confirmarReserva"
      @cancelar="cerrarDialogo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import { useAuthStore } from '@/stores/auth'
import { useTransaccionesStore } from '../store/transacciones'
import { useToast } from '@/composables/useToast'
import TablaCajero from '../components/TablaCajero.vue'
import DialogoReservar from '../components/DialogoReservar.vue'
import type { Transaccion, ReservarTransaccionRequest } from '../types'

const authStore = useAuthStore()
const store = useTransaccionesStore()
const toast = useToast()

const idCuenta = computed(() => {
  const id = authStore.userWarehouseAccesses?.[0]?.warehouseGroupId
  return id ? parseInt(id, 10) : 0
})

const tiendas = computed(() =>
  (authStore.userWarehouseAccesses ?? []).map(wa => ({
    codigo: wa.codAlmacen ?? '',
    nombre: wa.warehouseGroupName ?? wa.codAlmacen ?? '',
  }))
)

const montoFiltro = ref<number | null>(null)
const referenciaFiltro = ref<string | null>(null)
const identificacionFiltro = ref<string | null>(null)

async function cargar() {
  if (!idCuenta.value) {
    toast.warning('Sin cuenta', 'No se encontró una cuenta asociada a tu usuario.')
    return
  }
  await store.fetchCajero({
    idCuenta: idCuenta.value,
    monto: montoFiltro.value,
    referencia: referenciaFiltro.value,
    identificacionCliente: identificacionFiltro.value,
  })
}

function aplicarFiltros(monto: number | null, referencia: string | null, identificacion: string | null) {
  montoFiltro.value = monto
  referenciaFiltro.value = referencia
  identificacionFiltro.value = identificacion
  cargar()
}

const dialogoVisible = ref(false)
const transaccionSeleccionada = ref<Transaccion | null>(null)

function abrirDialogo(tx: Transaccion) {
  transaccionSeleccionada.value = tx
  dialogoVisible.value = true
}

function cerrarDialogo() {
  dialogoVisible.value = false
  transaccionSeleccionada.value = null
}

async function confirmarReserva(data: { codVendedor: string; codigoAlmacen: string; nombreAlmacen: string }) {
  if (!transaccionSeleccionada.value) return

  const payload: ReservarTransaccionRequest = {
    codVendedor: data.codVendedor,
    codigoAlmacen: data.codigoAlmacen,
    nombreAlmacen: data.nombreAlmacen,
    usuarioReserva: authStore.userName,
  }

  try {
    await store.reservar(transaccionSeleccionada.value.id, payload)
    toast.success('Reservado', `Transacción ${transaccionSeleccionada.value.referenciaTransaccion} reservada correctamente.`)
    cerrarDialogo()
  } catch (err: any) {
    const status = err?.response?.status
    const mensaje = err?.responseData?.error || err?.response?.data?.error || err?.message || 'Error desconocido'
    if (status === 409) toast.warning('Ya reservada', mensaje)
    else if (status === 404) toast.error('No encontrada', mensaje)
    else toast.error('Error al reservar', mensaje)
  }
}
</script>
