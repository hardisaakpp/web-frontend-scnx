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
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" @click.self="$emit('close')"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 shadow-xl transition-all w-full max-w-4xl">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Ingrese el SKU a buscar
              </label>
              <div class="flex gap-2 mb-3">
                <input
                  v-model="skuBusqueda"
                  @keyup.enter="buscarSku"
                  type="text"
                  placeholder="Ej: RL-CD-001"
                  class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
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
              <!-- Checkbox para incluir sugerencias -->
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="incluirSugerencias"
                  class="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                />
                <span>Incluir sugerencias similares de SAP</span>
              </label>
            </div>

            <!-- Resultados -->
            <div v-if="buscando" class="text-center py-12">
              <svg class="animate-spin h-8 w-8 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-4 text-gray-500 dark:text-gray-400">Buscando en MBA3 y SAP...</p>
            </div>

            <div v-else-if="resultadoBusqueda" class="space-y-6">
              <!-- Resultado MBA3 -->
              <div class="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resultado en MBA3
                </h4>
                <div v-if="resultadoBusqueda.mba3" class="space-y-2">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Código:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100 font-mono">{{ resultadoBusqueda.mba3.codigo || '-' }}</p>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Nombre:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100">{{ resultadoBusqueda.mba3.nombre || '-' }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.corp">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Corp:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100">{{ resultadoBusqueda.mba3.corp }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.grupo_prenda">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Grupo Prenda:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100">{{ resultadoBusqueda.mba3.grupo_prenda }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.talla">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Talla:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100">{{ resultadoBusqueda.mba3.talla }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.presentacion">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Presentación:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100">{{ resultadoBusqueda.mba3.presentacion }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.group_code">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Group Code:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100 font-mono">{{ resultadoBusqueda.mba3.group_code }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.tipo_origen">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Tipo Origen:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100">{{ resultadoBusqueda.mba3.tipo_origen }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.descontinuado !== undefined && resultadoBusqueda.mba3.descontinuado !== null">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Descontinuado:</span>
                      <span
                        :class="resultadoBusqueda.mba3.descontinuado ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
                        class="px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ resultadoBusqueda.mba3.descontinuado ? 'Sí' : 'No' }}
                      </span>
                    </div>
                    <div v-if="resultadoBusqueda.mba3.inactive !== undefined && resultadoBusqueda.mba3.inactive !== null">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Inactivo:</span>
                      <span
                        :class="resultadoBusqueda.mba3.inactive ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'"
                        class="px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ resultadoBusqueda.mba3.inactive ? 'Sí' : 'No' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                  No se encontró el SKU en MBA3
                </div>
              </div>

              <!-- Resultado SAP -->
              <div class="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-700 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resultado en SAP
                </h4>
                <div v-if="resultadoBusqueda.sap" class="space-y-2">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Código:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100 font-mono">{{ resultadoBusqueda.sap.codigo || '-' }}</p>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Nombre:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100">{{ resultadoBusqueda.sap.nombre || '-' }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.sap.pack">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Pack:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100">{{ resultadoBusqueda.sap.pack }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.sap.group_code">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Group Code:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100 font-mono">{{ resultadoBusqueda.sap.group_code }}</p>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Card Code:</span>
                      <p class="text-sm text-gray-900 dark:text-gray-100 font-mono">{{ resultadoBusqueda.sap.card_code || '-' }}</p>
                    </div>
                    <div v-if="resultadoBusqueda.sap.estado || resultadoBusqueda.sap.active !== undefined">
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Estado:</span>
                      <span
                        :class="getSapEstadoClass(resultadoBusqueda.sap.estado, resultadoBusqueda.sap.active)"
                        class="px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ getSapEstadoLabel(resultadoBusqueda.sap.estado, resultadoBusqueda.sap.active) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                  No se encontró el SKU en SAP
                </div>
              </div>

              <!-- Sugerencias de SAP -->
              <div v-if="incluirSugerencias && sugerenciasSap.length > 0" class="bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-700 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Sugerencias similares en SAP ({{ sugerenciasSap.length }})
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="sugerencia in sugerenciasSap"
                    :key="sugerencia.codigo"
                    class="bg-white dark:bg-gray-800 border-l-4 rounded-lg p-4"
                    :class="{
                      'border-green-500': sugerencia.score_porcentaje >= 80,
                      'border-yellow-500': sugerencia.score_porcentaje >= 50 && sugerencia.score_porcentaje < 80,
                      'border-red-500': sugerencia.score_porcentaje < 50
                    }"
                  >
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">{{ sugerencia.codigo }}</span>
                          <span
                            class="px-2 py-1 rounded-full text-xs font-semibold"
                            :class="getScoreBadgeClass(sugerencia.score_porcentaje)"
                          >
                            {{ sugerencia.score_porcentaje }}% de coincidencia
                          </span>
                        </div>
                        <p class="text-sm text-gray-700 dark:text-gray-300 font-medium">{{ sugerencia.nombre }}</p>
                      </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <span v-if="sugerencia.pack">Pack: <span class="font-semibold">{{ sugerencia.pack }}</span></span>
                      <span v-if="sugerencia.group_name">Grupo: <span class="font-semibold">{{ sugerencia.group_name }}</span></span>
                      <span
                        :class="sugerencia.estado === 'activo' ? 'text-green-700 dark:text-green-300 font-semibold' : 'text-red-700 dark:text-red-300 font-semibold'"
                      >
                        {{ sugerencia.estado === 'activo' ? 'Activo' : 'Inactivo' }}
                      </span>
                    </div>
                    
                    <!-- Motivos expandibles -->
                    <details v-if="sugerencia.motivos && sugerencia.motivos.length > 0" class="mt-3">
                      <summary class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200">
                        Motivos de la sugerencia ({{ sugerencia.motivos.length }})
                      </summary>
                      <ul class="mt-2 ml-4 space-y-1">
                        <li
                          v-for="(motivo, index) in sugerencia.motivos"
                          :key="index"
                          class="text-xs text-gray-600 dark:text-gray-400 list-disc"
                        >
                          {{ motivo }}
                        </li>
                      </ul>
                    </details>
                  </div>
                </div>
              </div>

              <!-- Mensaje si no hay sugerencias pero se buscaron -->
              <div
                v-if="incluirSugerencias && resultadoBusqueda?.mba3 && sugerenciasSap.length === 0 && !buscando"
                class="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700 rounded-lg p-4"
              >
                <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm font-medium">No se encontraron sugerencias similares en SAP para este código.</p>
                </div>
              </div>
            </div>

            <!-- Mensaje de error -->
            <div v-if="errorBusqueda" class="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700 rounded-lg p-4">
              <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="font-medium">Error al buscar SKU</p>
              </div>
              <p class="text-sm text-red-700 dark:text-red-300 mt-2">{{ errorBusqueda }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
import { ref } from '@vue/reactivity'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { SugerenciaSkuSap } from '../types'

defineEmits<{
  close: []
}>()

const toast = useToast()
const skuBusqueda = ref('')
const buscando = ref(false)
const incluirSugerencias = ref(false)
const sugerenciasSap = ref<SugerenciaSkuSap[]>([])
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
  sugerenciasSap.value = []

  try {
    // Buscar en MBA3 y SAP en paralelo
    const [resultadoMba3, resultadoSap] = await Promise.allSettled([
      mba3ConsultasService.buscarSkuMba3(
        skuBusqueda.value.trim(),
        incluirSugerencias.value,
        20 // límite de sugerencias
      ),
      mba3ConsultasService.buscarSkuSap(skuBusqueda.value.trim())
    ])

    // Extraer datos de MBA3
    let dataMba3: {
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
    } | null = null
    if (resultadoMba3.status === 'fulfilled') {
      const response = resultadoMba3.value
      if (import.meta.env.DEV) console.log('🔍 [BuscarSkuModal] Respuesta completa del backend:', response)
      
      if (response.status === 'success' && response.data) {
        dataMba3 = response.data
        
        // Si se incluyeron sugerencias y existen, guardarlas
        if (incluirSugerencias.value) {
          if (import.meta.env.DEV) console.log('🔍 [BuscarSkuModal] Sugerencias recibidas:', {
            sugerencias_sap: response.sugerencias_sap,
            total_sugerencias_sap: response.total_sugerencias_sap,
            cantidad_array: response.sugerencias_sap?.length || 0
          })
          
          if (response.sugerencias_sap && response.sugerencias_sap.length > 0) {
            sugerenciasSap.value = response.sugerencias_sap
            if (import.meta.env.DEV) console.log('✅ [BuscarSkuModal] Sugerencias asignadas:', sugerenciasSap.value.length)
            
            // Mostrar mensajes de advertencia si hay problemas con las sugerencias
            if (response.sugerencias_sap_timeout) {
              toast.warning('Timeout en sugerencias', 'La búsqueda de sugerencias tardó demasiado tiempo')
            }
            if (response.sugerencias_sap_disabled) {
              toast.warning('Sugerencias deshabilitadas', 'Las sugerencias SAP están deshabilitadas temporalmente')
            }
            if (response.sugerencias_sap_error) {
              console.error('Error en sugerencias SAP:', response.sugerencias_sap_error)
              toast.warning('Error en sugerencias', 'Hubo un problema al obtener las sugerencias, pero la búsqueda principal fue exitosa')
            }
          } else {
            sugerenciasSap.value = []
            if (import.meta.env.DEV) console.log('⚠️ [BuscarSkuModal] No se recibieron sugerencias en el array')
            if (response.total_sugerencias_sap === 0) {
              if (import.meta.env.DEV) console.log('ℹ️ [BuscarSkuModal] Total de sugerencias SAP: 0')
            }
          }
        }
      }
    } else if (resultadoMba3.status === 'rejected') {
      console.error('❌ [BuscarSkuModal] Error al buscar SKU en MBA3:', resultadoMba3.reason)
    }

    resultadoBusqueda.value = {
      mba3: dataMba3,
      sap: resultadoSap.status === 'fulfilled' ? resultadoSap.value.data : null
    }

    // Si no se encontró en ninguno de los sistemas
    if (!resultadoBusqueda.value.mba3 && !resultadoBusqueda.value.sap) {
      toast.warning('SKU no encontrado', `El SKU "${skuBusqueda.value}" no se encontró en MBA3 ni en SAP`)
    } else {
      const sistemas: string[] = []
      if (resultadoBusqueda.value.mba3) sistemas.push('MBA3')
      if (resultadoBusqueda.value.sap) sistemas.push('SAP')
      let mensaje = `SKU encontrado en: ${sistemas.join(' y ')}`
      if (incluirSugerencias.value && sugerenciasSap.value.length > 0) {
        mensaje += ` (${sugerenciasSap.value.length} sugerencia(s) de SAP)`
      }
      toast.success('Búsqueda completada', mensaje)
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
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  if (active !== undefined) {
    return active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
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

// Funciones auxiliares para mostrar el score de sugerencias
function getScoreClass(porcentaje: number): string {
  if (porcentaje >= 80) return 'score-alta'
  if (porcentaje >= 50) return 'score-media'
  return 'score-baja'
}

function getScoreBadgeClass(porcentaje: number): string {
  if (porcentaje >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (porcentaje >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}
</script>

