<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
    <!-- Header colapsable -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
    >
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Información del Pedido</h2>
      <svg
        class="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    <!-- Contenido colapsable -->
    <div
      v-show="isExpanded"
      class="px-6 pb-6 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número de Pedido</label>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.numero_pedido || 'N/A' }}</p>
          <button
            v-if="pedido.cabecera.numero_pedido"
            @click="$emit('copy-to-clipboard', pedido.cabecera.numero_pedido)"
            :title="copyFeedback ? 'Copiado!' : 'Copiar número de pedido'"
            class="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors duration-200"
            :class="{ 'text-green-600 dark:text-green-400': copyFeedback }"
          >
            <svg v-if="!copyFeedback" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Pedido</label>
        <input
          v-if="editable"
          v-model="fechaPedidoLocal"
          type="date"
          @blur="actualizarFechaPedido"
          @keydown.enter="actualizarFechaPedido"
          class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <p v-else class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.cabecera.fecha_pedido) }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Entrega</label>
        <div v-if="editable" class="mt-1 space-y-2">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="entrega-inmediato"
              :checked="fechaEntregaLocal === 'INMEDIATO'"
              @change="handleInmediatoChange"
              class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <label for="entrega-inmediato" class="text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              INMEDIATO
            </label>
          </div>
          <input
            v-if="fechaEntregaLocal !== 'INMEDIATO'"
            v-model="fechaEntregaLocal"
            type="date"
            @blur="actualizarFechaEntrega"
            @keydown.enter="actualizarFechaEntrega"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div
            v-else
            class="w-full px-3 py-2 border border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-900 dark:text-indigo-100 font-medium"
          >
            INMEDIATO
          </div>
        </div>
        <p v-else class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.cabecera.fecha_entrega) }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.proveedor_nombre || 'N/A' }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comprador</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.comprador_nombre || 'N/A' }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Forma de Pago</label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ pedido.cabecera.forma_pago || 'N/A' }}</p>
      </div>
      <div v-if="pedido.cabecera.estado || editable">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado del Pedido</label>
        <!-- Cuando está en "Confirmado y Enviado" y es editable: botón (badge) que despliega solo "Despachar y Facturar" -->
        <div v-if="editable && (editableEstado !== false) && esConfirmadoEnviado" class="relative inline-block mt-1">
          <button
            type="button"
            @click.stop="dropdownDespacharOpen = !dropdownDespacharOpen"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500"
            :class="getEstadoPedidoBadgeClass(pedido.cabecera.estado)"
            title="Clic para marcar como Despachar y Facturar"
          >
            {{ formatEstadoPedido(pedido.cabecera.estado) }}
            <svg class="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-show="dropdownDespacharOpen"
            @click.stop
            class="absolute left-0 top-full mt-1 z-20 min-w-[200px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
          >
            <button
              type="button"
              @click="elegirDespacharYFacturar"
              class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">Despachar y Facturar</span>
            </button>
          </div>
        </div>
        <!-- Resto de estados editables: select completo -->
        <select
          v-else-if="editable && (editableEstado !== false)"
          v-model="estadoLocal"
          @change="actualizarEstado"
          class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">-- Seleccionar estado --</option>
          <option value="PENDIENTE_CONFIRMACION_PROVEEDOR">Pendiente Confirmación Proveedor</option>
          <option value="RESPUESTA_PROVEEDOR_CARGADA">Respuesta Proveedor Cargada</option>
          <option value="CONFIRMADO_PROVEEDOR">Confirmado Proveedor</option>
          <option value="ORDEN_COMPRA_CREADA">Orden Compra Creada</option>
          <option value="ENVIADA_SAP">Enviada SAP</option>
          <option value="CONFIRMADO_ENVIADO">Confirmado Enviado</option>
          <option value="DESPACHAR Y FACTURAR">Despachar y Facturar</option>
          <option value="CERRADO">Cerrado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <!-- Solo lectura: badge -->
        <p v-else class="mt-1">
          <span class="px-2 py-1 text-xs font-medium rounded-full" :class="getEstadoPedidoBadgeClass(pedido.cabecera.estado)">
            {{ formatEstadoPedido(pedido.cabecera.estado) }}
          </span>
        </p>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import type { PedidoCompleto } from '../types'
import { formatDate, formatEstadoPedido } from '../utils/formatters'
import { getEstadoPedidoBadgeClass } from '../utils/styleHelpers'

const props = defineProps<{
  pedido: PedidoCompleto
  copyFeedback: boolean
  defaultExpanded?: boolean
  editable?: boolean
  /** Si false, el estado del pedido se muestra solo lectura (badge) aunque editable sea true. Por defecto true. */
  editableEstado?: boolean
}>()

const emit = defineEmits<{
  'copy-to-clipboard': [text: string]
  'update-fecha-pedido': [fecha: string | null]
  'update-fecha-entrega': [fecha: string | null]
  'update-estado': [estado: string | null]
}>()

// Estado colapsable - por defecto encogido, a menos que se especifique defaultExpanded
const isExpanded = ref(props.defaultExpanded ?? false)

// Desplegable "Despachar y Facturar" cuando el estado es Confirmado y Enviado
const dropdownDespacharOpen = ref(false)

// Normalizar estado a clave para comparar con "Confirmado y Enviado" (incl. orden_compra_cabecera.estado = "ENVIADA")
function normalizarEstadoConfirmadoEnviado(val: string): boolean {
  const u = String(val).trim().toUpperCase()
  if (!u) return false
  if (u === 'ENVIADA') return true // orden_compra_cabecera.estado ENVIADA = Confirmado y Enviado en UI
  if (u === 'CONFIRMADO_ENVIADO' || u === 'CONFIRMADO Y ENVIADO' || u === 'CONFIRMADO ENVIADO') return true
  if (u === 'CONFIRMADO_Y_ENVIADO') return true
  const normalizado = u.replace(/\s+/g, '_').replace(/\s*Y\s*/gi, '_')
  if (normalizado === 'CONFIRMADO_ENVIADO' || normalizado === 'CONFIRMADO_Y_ENVIADO') return true
  if (u.includes('CONFIRMADO') && u.includes('ENVIADO')) return true
  return false
}

// Mostrar botón desplegable "Despachar y Facturar" cuando el estado es Confirmado y Enviado (id 12 o texto equivalente)
const esConfirmadoEnviado = computed(() => {
  const cabecera = props.pedido?.cabecera
  if (!cabecera) return false
  const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
  if (estadoId === 12) return true
  const raw = cabecera.estado ?? (cabecera as { estado_nombre?: string }).estado_nombre ?? ''
  if (normalizarEstadoConfirmadoEnviado(raw)) return true
  // Por si el backend solo envía el label: si el formato actual es "Confirmado y Enviado", tratarlo igual
  if (formatEstadoPedido(raw) === 'Confirmado y Enviado') return true
  return false
})

function cerrarDropdownDespachar() {
  dropdownDespacharOpen.value = false
}

function elegirDespacharYFacturar() {
  emit('update-estado', 'DESPACHAR Y FACTURAR')
  dropdownDespacharOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', cerrarDropdownDespachar)
})
onUnmounted(() => {
  document.removeEventListener('click', cerrarDropdownDespachar)
})

// Estados locales para edición
const fechaPedidoLocal = ref<string>('')
const fechaEntregaLocal = ref<string | null>(null)
const estadoLocal = ref<string>('')

// Convertir fecha a formato YYYY-MM-DD para input type="date"
function dateToInputFormat(dateString: string | null): string {
  if (!dateString) return ''
  if (dateString === 'INMEDIATO' || dateString.toUpperCase() === 'INMEDIATO') return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

// Inicializar valores locales desde el pedido
watch(() => props.pedido, (newPedido) => {
  if (newPedido?.cabecera) {
    fechaPedidoLocal.value = dateToInputFormat(newPedido.cabecera.fecha_pedido)
    fechaEntregaLocal.value = newPedido.cabecera.fecha_entrega || null
    estadoLocal.value = newPedido.cabecera.estado || ''
  }
}, { immediate: true, deep: true })

// Funciones para actualizar valores
function actualizarFechaPedido() {
  emit('update-fecha-pedido', fechaPedidoLocal.value || null)
}

function actualizarFechaEntrega() {
  if (fechaEntregaLocal.value !== 'INMEDIATO') {
    emit('update-fecha-entrega', fechaEntregaLocal.value || null)
  }
}

function handleInmediatoChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    fechaEntregaLocal.value = 'INMEDIATO'
    emit('update-fecha-entrega', 'INMEDIATO')
  } else {
    fechaEntregaLocal.value = null
    emit('update-fecha-entrega', null)
  }
}

function actualizarEstado() {
  emit('update-estado', estadoLocal.value || null)
}
</script>
