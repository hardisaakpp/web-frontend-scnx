<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      @click.self="$emit('close')"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click.self="$emit('close')"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full max-w-4xl">
          <!-- Header -->
          <div class="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar SKU en MBA3 y SAP
              </h3>
              <button
                @click="$emit('close')"
                class="text-white hover:text-gray-200 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-4">
            <!-- Barra de búsqueda -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Ingrese el SKU a buscar
              </label>
              <div class="flex gap-2">
                <input
                  v-model="skuBusqueda"
                  @keyup.enter="buscarSku"
                  type="text"
                  placeholder="Ej: RL-CD-001"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  @click="buscarSku"
                  :disabled="!skuBusqueda.trim() || buscando"
                  class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg v-if="buscando" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {{ buscando ? 'Buscando...' : 'Buscar' }}
                </button>
              </div>
            </div>

            <!-- Resultados -->
            <div v-if="buscando" class="text-center py-12">
              <svg class="animate-spin h-8 w-8 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-4 text-gray-500">Buscando en MBA3 y SAP...</p>
            </div>

            <div v-else-if="resultadoBusqueda" class="space-y-6">
              <!-- Resultado MBA3 -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resultado en MBA3
                </h4>
                <div v-if="resultadoBusqueda.mba3" class="space-y-2">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="text-sm font-medium text-gray-600">Código:</span>
                      <p class="text-sm text-gray-900 font-mono">{{ resultadoBusqueda.mba3.codigo || '-' }}</p>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-600">Nombre:</span>
                      <p class="text-sm text-gray-900">{{ resultadoBusqueda.mba3.nombre || '-' }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.corp">
                      <span class="text-sm font-medium text-gray-600">Corp:</span>
                      <p class="text-sm text-gray-900">{{ resultadoBusqueda.mba3.corp }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.grupo_prenda">
                      <span class="text-sm font-medium text-gray-600">Grupo Prenda:</span>
                      <p class="text-sm text-gray-900">{{ resultadoBusqueda.mba3.grupo_prenda }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.talla">
                      <span class="text-sm font-medium text-gray-600">Talla:</span>
                      <p class="text-sm text-gray-900">{{ resultadoBusqueda.mba3.talla }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.presentacion">
                      <span class="text-sm font-medium text-gray-600">Presentación:</span>
                      <p class="text-sm text-gray-900">{{ resultadoBusqueda.mba3.presentacion }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.group_code">
                      <span class="text-sm font-medium text-gray-600">Group Code:</span>
                      <p class="text-sm text-gray-900 font-mono">{{ resultadoBusqueda.mba3.group_code }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.tipo_origen">
                      <span class="text-sm font-medium text-gray-600">Tipo Origen:</span>
                      <p class="text-sm text-gray-900">{{ resultadoBusqueda.mba3.tipo_origen }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.descontinuado !== undefined && resultadoBusqueda.mba3.descontinuado !== null">
                      <span class="text-sm font-medium text-gray-600">Descontinuado:</span>
                      <span
                        :class="resultadoBusqueda.mba3.descontinuado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                        class="px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ resultadoBusqueda.mba3.descontinuado ? 'Sí' : 'No' }}
                      </span>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.inactive !== undefined && resultadoBusqueda.mba3.inactive !== null">
                      <span class="text-sm font-medium text-gray-600">Inactivo:</span>
                      <span
                        :class="resultadoBusqueda.mba3.inactive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'"
                        class="px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ resultadoBusqueda.mba3.inactive ? 'Sí' : 'No' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-gray-500 italic">
                  No se encontró el SKU en MBA3
                </div>
              </div>

              <!-- Resultado SAP -->
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resultado en SAP
                </h4>
                <div v-if="resultadoBusqueda.sap" class="space-y-2">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="text-sm font-medium text-gray-600">Código:</span>
                      <p class="text-sm text-gray-900 font-mono">{{ resultadoBusqueda.sap.codigo || '-' }}</p>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-600">Nombre:</span>
                      <p class="text-sm text-gray-900">{{ resultadoBusqueda.sap.nombre || '-' }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.sap.pack">
                      <span class="text-sm font-medium text-gray-600">Pack:</span>
                      <p class="text-sm text-gray-900">{{ resultadoBusqueda.sap.pack }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.sap.group_code">
                      <span class="text-sm font-medium text-gray-600">Group Code:</span>
                      <p class="text-sm text-gray-900 font-mono">{{ resultadoBusqueda.sap.group_code }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.sap.card_code">
                      <span class="text-sm font-medium text-gray-600">Card Code:</span>
                      <p class="text-sm text-gray-900 font-mono">{{ resultadoBusqueda.sap.card_code }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.sap.estado || resultadoBusqueda.sap.active !== undefined">
                      <span class="text-sm font-medium text-gray-600">Estado:</span>
                      <span
                        :class="getSapEstadoClass(resultadoBusqueda.sap.estado, resultadoBusqueda.sap.active)"
                        class="px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ getSapEstadoLabel(resultadoBusqueda.sap.estado, resultadoBusqueda.sap.active) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-gray-500 italic">
                  No se encontró el SKU en SAP
                </div>
              </div>
            </div>

            <!-- Mensaje de error -->
            <div v-if="errorBusqueda" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center gap-2 text-red-800">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="font-medium">Error al buscar SKU</p>
              </div>
              <p class="text-sm text-red-700 mt-2">{{ errorBusqueda }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'

defineEmits<{
  close: []
}>()

const toast = useToast()
const skuBusqueda = ref('')
const buscando = ref(false)
const resultadoBusqueda = ref<{
  mba3: {
    codigo?: string
    nombre?: string
    corp?: string
    grupo_prenda?: string
    talla?: string
    presentacion?: string
    descontinuado?: boolean | string
    group_code?: string
    inactive?: boolean | string
    tipo_origen?: string
  } | null
  sap: {
    codigo?: string
    nombre?: string
    pack?: string
    group_code?: string
    card_code?: string
    estado?: string
    active?: boolean
  } | null
} | null>(null)
const errorBusqueda = ref<string | null>(null)

async function buscarSku() {
  if (!skuBusqueda.value.trim()) {
    toast.warning('SKU requerido', 'Por favor ingrese un SKU para buscar')
    return
  }

  buscando.value = true
  errorBusqueda.value = null
  resultadoBusqueda.value = null

  try {
    // Buscar en MBA3 y SAP en paralelo
    const [resultadoMba3, resultadoSap] = await Promise.allSettled([
      mba3ConsultasService.buscarSkuMba3(skuBusqueda.value.trim()),
      mba3ConsultasService.buscarSkuSap(skuBusqueda.value.trim())
    ])

    resultadoBusqueda.value = {
      mba3: resultadoMba3.status === 'fulfilled' ? resultadoMba3.value.data : null,
      sap: resultadoSap.status === 'fulfilled' ? resultadoSap.value.data : null
    }

    // Si no se encontró en ninguno de los sistemas
    if (!resultadoBusqueda.value.mba3 && !resultadoBusqueda.value.sap) {
      toast.warning('SKU no encontrado', `El SKU "${skuBusqueda.value}" no se encontró en MBA3 ni en SAP`)
    } else {
      const sistemas: string[] = []
      if (resultadoBusqueda.value.mba3) sistemas.push('MBA3')
      if (resultadoBusqueda.value.sap) sistemas.push('SAP')
      toast.success('Búsqueda completada', `SKU encontrado en: ${sistemas.join(' y ')}`)
    }
  } catch (error: any) {
    console.error('Error al buscar SKU:', error)
    errorBusqueda.value = error.message || 'Error desconocido al buscar el SKU'
    toast.error('Error al buscar', errorBusqueda.value ?? undefined)
  } finally {
    buscando.value = false
  }
}

// Funciones auxiliares para mostrar el estado de SAP
function getSapEstadoClass(estado?: string, active?: boolean): string {
  if (estado) {
    const estadoLower = estado.toLowerCase()
    if (estadoLower === 'activo' || estadoLower === 'active') {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-red-100 text-red-800'
  }
  if (active !== undefined) {
    return active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }
  return 'bg-gray-100 text-gray-800'
}

function getSapEstadoLabel(estado?: string, active?: boolean): string {
  if (estado) {
    return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase()
  }
  if (active !== undefined) {
    return active ? 'Activo' : 'Inactivo'
  }
  return 'Desconocido'
}
</script>

