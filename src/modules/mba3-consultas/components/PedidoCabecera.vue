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
          :disabled="!fechasEditables"
          @blur="actualizarFechaPedido"
          @keydown.enter="actualizarFechaPedido"
          :class="[
            'mt-1 w-full px-3 py-2 border rounded-lg text-sm',
            fechasEditables
              ? 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          ]"
        />
        <p v-else class="mt-1 text-sm text-gray-900 dark:text-white">{{ formatDate(pedido.cabecera.fecha_pedido) }}</p>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha de Entrega</label>
        <div v-if="editable" class="mt-1 space-y-2">
          <!-- Checkbox INMEDIATO: solo mostrar si showInmediatoOption !== false -->
          <div v-if="showInmediatoOption !== false" class="flex items-center gap-2">
            <input
              type="checkbox"
              id="entrega-inmediato"
              :checked="fechaEntregaLocal === 'INMEDIATO'"
              :disabled="!fechasEditables"
              @change="handleInmediatoChange"
              :class="[
                'w-4 h-4 rounded',
                fechasEditables
                  ? 'text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 cursor-pointer'
                  : 'text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
              ]"
            />
            <label 
              for="entrega-inmediato" 
              :class="[
                'text-sm',
                fechasEditables
                  ? 'text-gray-700 dark:text-gray-200 cursor-pointer'
                  : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              ]"
            >
              INMEDIATO
            </label>
          </div>
          <!-- Input de fecha: mostrar si showInmediatoOption es false, o si no está seleccionado INMEDIATO -->
          <input
            v-if="showInmediatoOption === false || fechaEntregaLocal !== 'INMEDIATO'"
            v-model="fechaEntregaLocal"
            type="date"
            :disabled="!fechasEditables"
            @blur="actualizarFechaEntrega"
            @keydown.enter="actualizarFechaEntrega"
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm',
              fechasEditables
                ? 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            ]"
          />
          <!-- Badge INMEDIATO: solo mostrar si showInmediatoOption !== false y está seleccionado INMEDIATO -->
          <div
            v-else-if="showInmediatoOption !== false && fechaEntregaLocal === 'INMEDIATO'"
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm font-medium',
              fechasEditables
                ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100'
                : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            ]"
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
        <!-- Editable: select con todos los estados -->
        <select
          v-if="editable && (editableEstado !== false)"
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
      <!-- Campos de SAP (solo cuando el pedido está CONFIRMADO_ENVIADO) -->
      <div v-if="pedido.cabecera.numero_oc_sap">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número OC SAP</label>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-sm font-mono text-blue-600 dark:text-blue-400 font-medium">{{ pedido.cabecera.numero_oc_sap }}</p>
          <button
            @click="$emit('copy-to-clipboard', pedido.cabecera.numero_oc_sap!)"
            :title="copyFeedback ? 'Copiado!' : 'Copiar número OC SAP'"
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
      <div v-if="pedido.cabecera.doc_entry">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">DocEntry SAP</label>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-sm font-mono text-purple-600 dark:text-purple-400 font-medium">{{ pedido.cabecera.doc_entry }}</p>
          <button
            @click="$emit('copy-to-clipboard', String(pedido.cabecera.doc_entry))"
            :title="copyFeedback ? 'Copiado!' : 'Copiar DocEntry'"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
  /** 
   * Si true, permite editar fechas cuando el estado sea GESTIONAR_PEDIDO (estado_id = 3).
   * Por defecto false (solo editable en BORRADOR).
   * Usar true en la interfaz de detalle de pedido (/pedidos/{id}).
   * Usar false en la interfaz de cargar plantilla (/cargar-plantilla/{id}).
   */
  permitirEdicionFechasEnGestionar?: boolean
  /**
   * Si true, muestra el checkbox INMEDIATO para la fecha de entrega.
   * Por defecto true.
   * Usar false en la interfaz de detalle de pedido (/pedidos/{id}).
   * Usar true en la interfaz de cargar plantilla (/cargar-plantilla/{id}).
   */
  showInmediatoOption?: boolean
}>()

/**
 * Los campos de Fecha de Pedido, Fecha de Entrega y checkbox INMEDIATO
 * son editables según el estado del pedido:
 * - BORRADOR (estado_id = 1): siempre editable
 * - GESTIONAR_PEDIDO (estado_id = 3): editable solo si permitirEdicionFechasEnGestionar es true
 * - Otros estados: no editable
 */
const fechasEditables = computed(() => {
  const estadoIdRaw = props.pedido?.cabecera?.estado_id
  const estadoNombre = props.pedido?.cabecera?.estado
  
  // DEBUG: Log para diagnosticar el problema
  if (import.meta.env.DEV) {
    console.log('🔍 [PedidoCabecera] fechasEditables check:', {
      estadoIdRaw,
      estadoNombre,
      tipoEstadoId: typeof estadoIdRaw,
      editable: props.editable,
      permitirEdicionFechasEnGestionar: props.permitirEdicionFechasEnGestionar
    })
  }
  
  // Si no tiene estado definido, permitir edición
  if (estadoIdRaw === undefined || estadoIdRaw === null) return true
  
  // Normalizar a número (el backend podría devolver string o number)
  const estadoId = typeof estadoIdRaw === 'string' ? parseInt(estadoIdRaw, 10) : estadoIdRaw
  
  // Si no se pudo parsear, permitir edición (caso edge)
  if (isNaN(estadoId)) return true
  
  // En BORRADOR (estado_id = 1): siempre editable
  if (estadoId === 1) return true
  
  // En GESTIONAR_PEDIDO (estado_id = 3): editable solo si permitirEdicionFechasEnGestionar es true
  if (estadoId === 3 && props.permitirEdicionFechasEnGestionar) return true
  
  // En cualquier otro estado: no editable
  return false
})

const emit = defineEmits<{
  'copy-to-clipboard': [text: string]
  'update-fecha-pedido': [fecha: string | null]
  'update-fecha-entrega': [fecha: string | null]
  'update-estado': [estado: string | null]
}>()

// Estado colapsable - por defecto encogido, a menos que se especifique defaultExpanded
const isExpanded = ref(props.defaultExpanded ?? false)

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
  // No actualizar si las fechas no son editables (estado >= NUEVO_PEDIDO)
  if (!fechasEditables.value) return
  emit('update-fecha-pedido', fechaPedidoLocal.value || null)
}

function actualizarFechaEntrega() {
  // No actualizar si las fechas no son editables (estado >= NUEVO_PEDIDO)
  if (!fechasEditables.value) return
  if (fechaEntregaLocal.value !== 'INMEDIATO') {
    emit('update-fecha-entrega', fechaEntregaLocal.value || null)
  }
}

function handleInmediatoChange(event: Event) {
  // No actualizar si las fechas no son editables (estado >= NUEVO_PEDIDO)
  if (!fechasEditables.value) {
    if (import.meta.env.DEV) {
      console.log('🚫 [PedidoCabecera] handleInmediatoChange bloqueado: fechasEditables es false')
    }
    return
  }
  const target = event.target as HTMLInputElement
  
  if (import.meta.env.DEV) {
    console.log('✅ [PedidoCabecera] handleInmediatoChange:', {
      checked: target.checked,
      fechaEntregaLocalAntes: fechaEntregaLocal.value
    })
  }
  
  if (target.checked) {
    fechaEntregaLocal.value = 'INMEDIATO'
    emit('update-fecha-entrega', 'INMEDIATO')
  } else {
    fechaEntregaLocal.value = null
    emit('update-fecha-entrega', null)
  }
  
  if (import.meta.env.DEV) {
    console.log('✅ [PedidoCabecera] fechaEntregaLocal después:', fechaEntregaLocal.value)
  }
}

function actualizarEstado() {
  emit('update-estado', estadoLocal.value || null)
}
</script>
