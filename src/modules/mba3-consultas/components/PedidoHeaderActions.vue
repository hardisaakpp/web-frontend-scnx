<template>
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ tituloInterfaz }}
      </h1>
    </div>
    <div class="flex items-center gap-3">
      <slot name="leading" />
      <!-- Búsqueda directa de pedidos -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          :ref="(el) => { if (props.pedidoInputRef) props.pedidoInputRef.value = el as HTMLInputElement | null }"
          v-model="pedidoIdInputModel"
          @keyup.enter="goToPedido"
          @focus="showSearchHelpModel = true"
          @blur="handleSearchBlur"
          type="text"
          placeholder="Buscar por N° de pedido (ej: P-12.48 - 12 - 2025)"
          :class="[
            'w-80 pl-10 pr-10 py-2 border rounded-lg text-sm transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
            pedidoIdInputModel && !isValidPedido
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500'
          ]"
        />
        <button
          v-if="pedidoIdInputModel"
          @click="pedidoIdInputModel = ''"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Limpiar búsqueda"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <!-- Texto de ayuda contextual -->
        <div
          v-if="showSearchHelpModel && pedidoIdInputModel && !isValidPedido"
          class="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-2 z-10"
        >
          <p class="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Formato inválido</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Ejemplo válido: <span class="font-mono text-purple-600 dark:text-purple-400">P-12.48 - 12 - 2025</span></p>
        </div>
      </div>
      <button
        v-if="showCrearPedido"
        @click="$emit('crear-pedido')"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
        title="Crear pedido manualmente"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Crear Pedido Manual
      </button>
      <button
        v-if="!hideCargarPlantillas"
        @click="$emit('cargar-plantillas')"
        :disabled="uploading"
        class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
      >
        <svg v-if="!uploading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ uploading ? 'Cargando...' : 'Cargar Plantillas Excel' }}
      </button>
      <button
        v-if="!esModoMabelTrading && !hideConfirmAndDownload"
        @click="$emit('descargar-plano-mba')"
        :disabled="loading || !pedido"
        class="px-4 py-2 bg-cyan-600 dark:bg-cyan-500 text-white rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        title="Descargar pedido en formato plano para subir en MBA"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Descargar para MBA
      </button>
      <button
        v-if="canGenerarOC"
        @click="$emit('generar-oc')"
        :disabled="loading || generandoOC"
        class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
      >
        <svg v-if="!generandoOC" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ generandoOC ? 'Generando...' : 'Generar Orden de Compra' }}
      </button>
      <button
        v-if="!esModoMabelTrading && !hideConfirmAndDownload"
        @click="$emit('confirmar')"
        :disabled="loading || !pedido || confirmando || confirmarDeshabilitado"
        class="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
      >
        <svg v-if="!confirmando" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ confirmando ? 'Confirmando...' : 'Confirmar' }}
      </button>
      <button
        v-if="showDespacharYFacturar && puedeDespacharYFacturar"
        type="button"
        @click="$emit('update-estado', 'DESPACHAR Y FACTURAR')"
        class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Despachar y Facturar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Ref } from 'vue'

const props = defineProps<{
  tituloInterfaz: string
  pedidoInputRef?: Ref<HTMLInputElement | null> | null
  isValidPedido: boolean
  uploading: boolean
  loading: boolean
  generandoOC: boolean
  confirmando?: boolean
  canGenerarOC: boolean
  esModoMabelTrading: boolean
  pedido: any
  /** Deshabilita "Confirmar" cuando el pedido ya tiene respuesta cargada o está confirmado (ver docs/FRONTEND.md §2) */
  confirmarDeshabilitado?: boolean
  hideConfirmAndDownload?: boolean
  showCrearPedido?: boolean
  hideCargarPlantillas?: boolean
  /** Mostrar botón "Despachar y Facturar" (solo en vista detalle de pedido, no en Cargar Plantilla) */
  showDespacharYFacturar?: boolean
}>()

const emit = defineEmits<{
  'cargar-plantillas': []
  'generar-oc': []
  'confirmar': []
  'go-to-pedido': []
  'search-blur': []
  'descargar-plano-mba': []
  'crear-pedido': []
  'update-estado': [estado: string]
}>()

const pedidoIdInputModel = defineModel<string>('pedidoIdInput', { default: '' })
const showSearchHelpModel = defineModel<boolean>('showSearchHelp', { default: false })

const goToPedido = () => emit('go-to-pedido')
const handleSearchBlur = () => emit('search-blur')

// Mostrar botón "Despachar y Facturar" solo cuando el estado es Confirmado y Enviado (estado_id 12 o CONFIRMADO_ENVIADO/ENVIADA)
const puedeDespacharYFacturar = computed(() => {
  const c = props.pedido?.cabecera
  if (!c) return false
  if (c.estado_id != null && Number(c.estado_id) === 12) return true
  const e = String(c.estado ?? (c as { estado_nombre?: string }).estado_nombre ?? '').trim().toUpperCase()
  if (!e) return false
  if (e === 'CONFIRMADO_ENVIADO' || e === 'CONFIRMADO Y ENVIADO' || e === 'CONFIRMADO_Y_ENVIADO' || e === 'ENVIADA') return true
  if (e.replace(/\s+/g, '_').replace(/\s*Y\s*/gi, '_') === 'CONFIRMADO_ENVIADO') return true
  return false
})
</script>
