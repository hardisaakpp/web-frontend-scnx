<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Modal de bloqueo al confirmar redistribución (sincronizado con backend hasta que termina) -->
    <Teleport to="body">
      <div
        v-if="redistribucion.confirmandoRedistribucion.value"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        @click.prevent
        @mousedown.prevent
        @mouseup.prevent
        @touchstart.prevent
        @touchmove.prevent
        @touchend.prevent
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
          <div class="flex flex-col items-center gap-4">
            <svg class="animate-spin h-12 w-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirmando redistribución</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">Espere mientras se procesa en el servidor. No cierre esta ventana.</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      class="space-y-6"
      :class="{ 'pointer-events-none opacity-75': redistribucion.confirmandoRedistribucion.value }"
    >
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ soloLectura ? 'Ver distribución de Productos - EL RAYO' : 'Redistribución de Productos - MABEL TRADING' }}
            </h1>
            <p v-if="pedido" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pedido: <span class="font-medium text-gray-900 dark:text-white">{{ pedido.cabecera.numero_pedido }}</span>
            </p>
          </div>
          <div v-if="!soloLectura" class="flex items-center gap-3">
            <div class="relative">
              <input
                v-model="pedidoIdInput"
                @keyup.enter="goToPedido"
                type="text"
                placeholder="Buscar por N° de pedido"
                class="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado de carga al montar /redistribucion sin id: GET /api/pedidos/ultimo-redistribucion -->
      <div v-if="(loading || cargandoUltimoConfirmado) && !pedido" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">{{ cargandoUltimoConfirmado ? 'Buscando último pedido...' : 'Cargando pedido...' }}</p>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 transition-colors duration-300">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-900 dark:text-red-200">Error al cargar el pedido</p>
            <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Información básica del pedido (opcional, solo si hay pedido) -->
      <PedidoCabecera
        v-if="pedido"
        :pedido="pedido"
        :copy-feedback="copyFeedback"
        @copy-to-clipboard="copyToClipboard"
      />

      <!-- Sección de Redistribución (siempre visible si hay pedido) -->
      <RedistribucionTiendas
        v-if="pedido"
        :pedido="pedido"
        :es-modo-mabel-trading="true"
        :solo-lectura="soloLectura"
        :productos-redistribucion="redistribucion.productosRedistribucion"
        :productos-expandidos="redistribucion.productosExpandidos"
        :guardando-redistribucion="redistribucion.guardandoRedistribucion"
        :confirmando-redistribucion="redistribucion.confirmandoRedistribucion"
        :confirmar-deshabilitado-por-estado="confirmarDeshabilitadoPorEstado"
        :columnas-modificadas="columnasModificadas as unknown as Ref<Set<string>>"
        @toggle-expandir-producto="toggleExpandirProducto"
        @actualizar-cantidad-tienda="actualizarCantidadTienda"
        @validar-y-corregir-cantidad="validarYCorregirCantidad"
        @distribuir-proporcionalmente="distribuirProporcionalmente"
        @copiar-distribucion-original="copiarDistribucionOriginal"
        @resetear-distribucion="resetearDistribucion"
        @guardar-borrador="guardarBorradorRedistribucion"
        @confirmar-redistribucion="confirmarRedistribucion"
      />

      <!-- Sin pedido: solo búsqueda manual por número -->
      <div v-if="!pedido && !loading && !cargandoUltimoConfirmado && !error" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Ingrese un número de pedido</h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Use el campo de búsqueda arriba para buscar un pedido y comenzar la redistribución.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { PedidoCompleto } from '../types'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import { usePedidoDetalle } from '../composables/usePedidoDetalle'
import { useRedistribucion } from '../composables/useRedistribucion'
import PedidoCabecera from '../components/PedidoCabecera.vue'
import RedistribucionTiendas from '../components/RedistribucionTiendas.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const pedido = ref<PedidoCompleto | null>(null)
const pedidoIdInput = ref('')

// ⭐ Set para rastrear columnas modificadas (para resaltado en redistribución)
const columnasModificadas: Ref<Set<string>> = ref<Set<string>>(new Set())

const numeroPedido = computed(() => {
  const id = route.params.id as string
  return id ? decodeURIComponent(id) : ''
})

/** Modo solo lectura: EL RAYO revisa distribución sin poder editar (query soloLectura=1) */
const soloLectura = computed(() => route.query.soloLectura === '1')

const esModoMabelTrading = computed(() => true) // Siempre true en esta vista

// ⭐ Función para cargar columnas modificadas desde storage
const cargarColumnasModificadasDesdeStorage = () => {
  if (!numeroPedido.value) return
  try {
    const storageKey = `pedido_columnas_modificadas_${numeroPedido.value}`
    const stored = sessionStorage.getItem(storageKey)
    if (stored) {
      const columnasArray = JSON.parse(stored) as string[]
      columnasModificadas.value = new Set(columnasArray)
      if (import.meta.env.DEV) console.log(`📦 [MabelTradingRedistribucionView] Cargadas ${columnasArray.length} columnas modificadas desde sessionStorage para ${numeroPedido.value}`)
      if (import.meta.env.DEV) console.log(`   Columnas: ${Array.from(columnasModificadas.value).join(', ')}`)
    } else {
      if (import.meta.env.DEV) console.log(`📦 [MabelTradingRedistribucionView] No hay columnas modificadas en sessionStorage para ${numeroPedido.value}`)
    }
  } catch (e) {
    console.warn('Error al cargar columnas modificadas desde sessionStorage:', e)
  }
}

// Inicializar composable de pedido detalle
const pedidoDetalle = usePedidoDetalle({
  pedido,
  numeroPedido,
  esModoMabelTrading,
  columnasModificadas,
  reporteDiferencias: ref(null),
  limpiarColumnasModificadasEnStorage: () => {
    if (!numeroPedido.value) return
    try {
      const storageKey = `pedido_columnas_modificadas_${numeroPedido.value}`
      sessionStorage.removeItem(storageKey)
      columnasModificadas.value.clear()
    } catch (e) {
      console.warn('Error al limpiar columnas modificadas en sessionStorage:', e)
    }
  },
  cargarColumnasModificadasDesdeStorage
})

const {
  loading,
  error,
  loadPedido,
  copyFeedback,
  copyToClipboard
} = pedidoDetalle

// Inicializar composable de redistribución
const redistribucion = useRedistribucion({
  pedido,
  numeroPedido,
  esModoMabelTrading,
  getReporteDiferencias: () => pedidoDetalle.reporteDiferencias,
  loadPedido: () => pedidoDetalle.loadPedido(),
  loadReporteDiferencias: () => pedidoDetalle.loadReporteDiferencias()
})

// Computed para validar si se puede confirmar
const puedeConfirmarRedistribucion = computed(() => {
  const productos = redistribucion.productosRedistribucion.value
  if (productos.length === 0) return false
  
  const total_confirmado = productos.reduce((sum, p) => sum + p.cantidad_confirmada, 0)
  const total_distribuido = productos.reduce((sum, p) => sum + p.cantidad_distribuida, 0)
  const diferencia_pendiente = total_confirmado - total_distribuido
  
  return diferencia_pendiente === 0 &&
         productos.every(p => p.diferencia === 0) &&
         productos.every(p => !p.error)
})

// Deshabilitar "Confirmar Redistribución" cuando el pedido ya está confirmado (docs/FRONTEND.md §1.3.1: PEDIDO_CONFIRMADO o posterior)
const ESTADOS_REDISTRIBUCION_YA_CONFIRMADA = ['PEDIDO_CONFIRMADO', 'PROCESADO_SAP']
const confirmarDeshabilitadoPorEstado = computed(() =>
  ESTADOS_REDISTRIBUCION_YA_CONFIRMADA.includes(pedido.value?.cabecera?.estado ?? '')
)

// Funciones de redistribución
function toggleExpandirProducto(codigoProducto: string) {
  redistribucion.toggleExpandirProducto(codigoProducto)
}

function actualizarCantidadTienda(codigoProducto: string, tiendaCodigo: string, event: Event) {
  redistribucion.actualizarCantidadTienda(codigoProducto, tiendaCodigo, event)
}

function validarYCorregirCantidad(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada) {
  redistribucion.validarYCorregirCantidad(producto, tienda)
}

function distribuirProporcionalmente(codigoProducto: string) {
  redistribucion.distribuirProporcionalmente(codigoProducto)
}

function copiarDistribucionOriginal(codigoProducto: string) {
  redistribucion.copiarDistribucionOriginal(codigoProducto)
}

function resetearDistribucion(codigoProducto: string) {
  redistribucion.resetearDistribucion(codigoProducto)
}

async function guardarBorradorRedistribucion() {
  await redistribucion.guardarBorradorRedistribucion()
}

async function confirmarRedistribucion() {
  await redistribucion.confirmarRedistribucion(puedeConfirmarRedistribucion)
}

// Navegación
function goToPedido() {
  if (!pedidoIdInput.value.trim()) return
  
  router.push({
    name: 'mba3-consultas-pedido-redistribucion',
    params: { id: encodeURIComponent(pedidoIdInput.value.trim()) }
  })
}

// Watch para inicializar redistribución cuando cambie el pedido
watch(
  () => pedido.value,
  async (newPedido) => {
    if (!newPedido) {
      redistribucion.productosRedistribucion.value = []
      redistribucion.productosExpandidos.value.clear()
      return
    }
    
    // ⭐ CRÍTICO: Cargar columnas modificadas ANTES de inicializar la redistribución
    // Esto hereda el resaltado del flujo anterior (Detalle del Pedido - EL RAYO)
    // Debe ejecutarse primero para que el resaltado esté disponible cuando se rendericen los productos
    cargarColumnasModificadasDesdeStorage()
    const columnasAntes = columnasModificadas.value.size
    if (import.meta.env.DEV) console.log(`🎨 [MabelTradingRedistribucionView] Columnas modificadas ANTES de inicializar: ${columnasAntes}`)
    
    // Solo inicializar redistribución si ya existe respuesta_proveedor.
    // NO llamar a crear-respuesta-desde-pedido aquí: esa acción es exclusiva del clic en "Confirmar"
    // en Cargar Plantilla o Detalle del Pedido (EL RAYO). Llamarla al cargar esta vista disparaba
    // confirmación y envío de email en el backend sin intervención del usuario.
    if (newPedido.respuesta_proveedor) {
      redistribucion.inicializarProductosRedistribucion()
      
      // ⭐ CRÍTICO: Asegurar que las columnas modificadas se mantengan después de inicializar
      await nextTick()
      
      if (columnasModificadas.value.size === 0 && columnasAntes > 0) {
        console.warn(`⚠️ [MabelTradingRedistribucionView] Columnas modificadas se perdieron después de inicializar, recargando...`)
        cargarColumnasModificadasDesdeStorage()
      }
      if (import.meta.env.DEV) console.log(`🎨 [MabelTradingRedistribucionView] Columnas modificadas DESPUÉS de inicializar: ${columnasModificadas.value.size}`)
    }
    // Si no hay respuesta_proveedor: no crear automáticamente. El usuario debe confirmar desde
    // Cargar Plantilla o Detalle del Pedido (EL RAYO) para que exista la respuesta.
  },
  { immediate: true }
)

// Watch para reaccionar a cambios en el parámetro de ruta
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await loadPedido()
      pedidoIdInput.value = ''
      cargarColumnasModificadasDesdeStorage()
    }
    // Navegación a /redistribucion sin id: limpiar pedido y cargar último + lista
    if (!newId && oldId !== undefined) {
      pedido.value = null
      await cargarRedistribucionSinPedido()
    }
  }
)

// ⭐ Cargando último pedido (RESPUESTA_PROVEEDOR_CARGADA) al entrar desde dashboard (ruta sin id)
const cargandoUltimoConfirmado = ref(false)

// Lógica para /redistribucion sin id: último pedido RESPUESTA_PROVEEDOR_CARGADA (GET /api/pedidos/ultimo-redistribucion)
async function cargarRedistribucionSinPedido() {
  cargandoUltimoConfirmado.value = true
  try {
    const ultimo = await mba3ConsultasService.getUltimoPedidoRedistribucion(true)
    const num = ultimo?.numero_pedido
    if (num) {
      toast.info('Último pedido', `Cargando pedido ${num}`)
      await router.replace({
        name: 'mba3-consultas-pedido-redistribucion',
        params: { id: encodeURIComponent(num) }
      })
    }
  } catch {
    // Si falla, se queda en /redistribucion con el input de búsqueda
  } finally {
    cargandoUltimoConfirmado.value = false
  }
}

onMounted(async () => {
  if (numeroPedido.value) {
    await loadPedido()
    cargarColumnasModificadasDesdeStorage()
    if (import.meta.env.DEV) console.log(`🎨 [MabelTradingRedistribucionView] Estado final de columnas modificadas: ${columnasModificadas.value.size} modificaciones`)
    if (columnasModificadas.value.size > 0) {
      if (import.meta.env.DEV) console.log(`   Columnas modificadas: ${Array.from(columnasModificadas.value).join(', ')}`)
    }
    return
  }

  await cargarRedistribucionSinPedido()
})
</script>
