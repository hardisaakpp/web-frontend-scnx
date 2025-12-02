<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Procesos de Integración MBA3-SAP</h1>
      <p class="mt-1 text-sm text-gray-500">Ejecuta los pasos de integración de forma individual</p>
    </div>

    <!-- Panel Unificado de Procesos -->
    <div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <!-- Header -->
      <div class="mb-6 pb-4 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-gray-900">Pasos de Integración</h2>
        <p class="text-sm text-gray-500 mt-1">
          Ejecuta cada paso en orden: Importar-Despachos → Procesar OC → Integrar SAP
        </p>
      </div>

      <!-- Flujo Visual con Botones de Acción Integrados -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Paso 1: Importar-Despachos -->
        <div 
          class="relative p-6 rounded-lg border-2 transition-all duration-300"
          :class="getProcesoCardClass('migrar')"
        >
          <div class="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 transform -translate-y-1/2 z-10"
            :class="getConnectorClass('migrar')">
          </div>
          
          <div class="flex flex-col items-center text-center mb-4">
            <div 
              class="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-md transition-all border-2"
              :class="getProcesoIconClass('migrar')"
            >
              <span v-if="getStepStatus('migrar') === 'active'" class="animate-spin">⟳</span>
              <span v-else-if="getStepStatus('migrar') === 'completed'">✓</span>
              <span v-else-if="getStepStatus('migrar') === 'error'">✗</span>
              <span v-else>1</span>
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ getStepTitle('migrar') }}</h3>
            <p class="text-sm text-gray-600 mb-4">{{ getStepDescription('migrar') }}</p>
            <div class="text-sm font-medium mb-4" :class="getStepStatusTextClass('migrar')">
              {{ getStepStatusText('migrar') }}
            </div>
          </div>
          
          <!-- Botón de acción -->
          <button
            @click="ejecutarMigrar"
            :disabled="procesoStore.loading"
            class="w-full px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :class="getButtonClass('migrar')"
          >
            <span v-if="procesoStore.loading && procesoStore.currentStep === 'migrar'" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Ejecutando...
            </span>
            <span v-else-if="getStepStatus('migrar') === 'completed'">✓ Completado</span>
            <span v-else>Ejecutar Importación</span>
          </button>
          
          <div v-if="getStepStatus('migrar') === 'completed'" class="absolute top-2 right-2">
            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        </div>

        <!-- Paso 2: Procesar OC -->
        <div 
          class="relative p-6 rounded-lg border-2 transition-all duration-300"
          :class="getProcesoCardClass('procesar-oc')"
        >
          <div class="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 transform -translate-y-1/2 z-10"
            :class="getConnectorClass('procesar-oc')">
          </div>
          
          <div class="flex flex-col items-center text-center mb-4">
            <div 
              class="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-md transition-all border-2"
              :class="getProcesoIconClass('procesar-oc')"
            >
              <span v-if="getStepStatus('procesar-oc') === 'active'" class="animate-spin">⟳</span>
              <span v-else-if="getStepStatus('procesar-oc') === 'completed'">✓</span>
              <span v-else-if="getStepStatus('procesar-oc') === 'error'">✗</span>
              <span v-else>2</span>
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ getStepTitle('procesar-oc') }}</h3>
            <p class="text-sm text-gray-600 mb-4">{{ getStepDescription('procesar-oc') }}</p>
            <div class="text-sm font-medium mb-4" :class="getStepStatusTextClass('procesar-oc')">
              {{ getStepStatusText('procesar-oc') }}
            </div>
          </div>
          
          <!-- Botón de acción -->
          <button
            @click="ejecutarProcesarOC"
            :disabled="procesoStore.loading || !puedeProcesarOC"
            class="w-full px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :class="getButtonClass('procesar-oc')"
          >
            <span v-if="procesoStore.loading && procesoStore.currentStep === 'procesar-oc'" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Ejecutando...
            </span>
            <span v-else-if="getStepStatus('procesar-oc') === 'completed'">✓ Completado</span>
            <span v-else-if="!puedeProcesarOC">
              {{ hayDespachos ? 'Sin despachos disponibles' : 'Esperando Importación' }}
            </span>
            <span v-else>Ejecutar Procesamiento</span>
          </button>
          
          <!-- Mensaje informativo cuando hay despachos disponibles pero no se ha migrado -->
          <p v-if="hayDespachos && getStepStatus('migrar') !== 'completed' && !procesoStore.loading && getStepStatus('procesar-oc') !== 'completed'" class="mt-2 text-xs text-blue-600 text-center">
            {{ despachosCount }} despacho(s) disponible(s) en la base de datos
          </p>
          
          <div v-if="getStepStatus('procesar-oc') === 'completed'" class="absolute top-2 right-2">
            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        </div>

        <!-- Paso 3: Integrar SAP -->
        <div 
          class="relative p-6 rounded-lg border-2 transition-all duration-300"
          :class="getProcesoCardClass('integrar-sap')"
        >
          <div class="flex flex-col items-center text-center mb-4">
            <div 
              class="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-md transition-all border-2"
              :class="getProcesoIconClass('integrar-sap')"
            >
              <span v-if="getStepStatus('integrar-sap') === 'active'" class="animate-spin">⟳</span>
              <span v-else-if="getStepStatus('integrar-sap') === 'completed'">✓</span>
              <span v-else-if="getStepStatus('integrar-sap') === 'error'">✗</span>
              <span v-else>3</span>
            </div>
            <h3 class="text-lg font-semibold mb-2">{{ getStepTitle('integrar-sap') }}</h3>
            <p class="text-sm text-gray-600 mb-4">{{ getStepDescription('integrar-sap') }}</p>
            <div class="text-sm font-medium mb-4" :class="getStepStatusTextClass('integrar-sap')">
              {{ getStepStatusText('integrar-sap') }}
            </div>
          </div>
          
          <!-- Botón de acción -->
          <button
            @click="ejecutarIntegrarSAP"
            :disabled="procesoStore.loading || !hayOrdenesCompra"
            class="w-full px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :class="getButtonClass('integrar-sap')"
          >
            <span v-if="procesoStore.loading && procesoStore.currentStep === 'integrar-sap'" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Ejecutando...
            </span>
            <span v-else-if="getStepStatus('integrar-sap') === 'completed'">✓ Completado</span>
            <span v-else-if="!hayOrdenesCompra">Sin órdenes disponibles</span>
            <span v-else>Ejecutar Integración</span>
          </button>
          
          <!-- Mensaje informativo cuando no hay OCs -->
          <p v-if="!hayOrdenesCompra && !procesoStore.loading && getStepStatus('integrar-sap') !== 'completed'" class="mt-2 text-xs text-gray-500 text-center">
            Primero debe procesar órdenes de compra
          </p>
          
          <div v-if="getStepStatus('integrar-sap') === 'completed'" class="absolute top-2 right-2">
            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </div>
        </div>
      </div>

      <!-- Barra de progreso global -->
      <div v-if="procesoStore.loading" class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Progreso del proceso</span>
          <span class="text-sm text-gray-500">{{ procesoStore.progress }}%</span>
        </div>
        <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 ease-out"
            :style="{ width: `${procesoStore.progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Acciones adicionales -->
      <div class="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
        <button 
          @click="procesoStore.reset" 
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          :disabled="procesoStore.loading"
        >
          Limpiar Resultados
        </button>
      </div>
    </div>

    <!-- Mensajes de error -->
    <div v-if="procesoStore.error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
      <div class="flex">
        <div class="ml-3">
          <p class="text-sm text-red-700">
            <strong>Error:</strong> {{ procesoStore.error }}
          </p>
        </div>
      </div>
    </div>

    <!-- Resultados del Proceso -->
    <div v-if="procesoStore.resultados && !procesoStore.loading" class="space-y-3">
      <!-- Resumen de Migración -->
      <div v-if="procesoStore.resultados.metadata?.save_status" class="border border-gray-200 rounded-lg overflow-hidden">
        <button
          @click="showMigrarResults = !showMigrarResults"
          class="w-full px-4 py-3 bg-yellow-50 hover:bg-yellow-100 transition-colors flex items-center justify-between text-left"
        >
          <div class="flex items-center gap-2">
            <span class="text-yellow-700 font-medium">✓ Importación completada</span>
            <span class="text-xs text-yellow-600">
              {{ procesoStore.resultados.metadata.save_status.prefacturas_guardadas || 0 }} guardadas, 
              {{ procesoStore.resultados.metadata.save_status.prefacturas_actualizadas || 0 }} actualizadas
            </span>
          </div>
          <span class="text-yellow-700">{{ showMigrarResults ? '▼' : '▶' }}</span>
        </button>
        <div v-if="showMigrarResults" class="p-4 bg-white border-t border-gray-200">
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-gray-50 p-3 rounded text-center">
              <p class="text-xs text-gray-600 mb-1">Prefacturas Guardadas</p>
              <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.save_status.prefacturas_guardadas || 0 }}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded text-center">
              <p class="text-xs text-gray-600 mb-1">Prefacturas Actualizadas</p>
              <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.save_status.prefacturas_actualizadas || 0 }}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded text-center">
              <p class="text-xs text-gray-600 mb-1">Total Detalles</p>
              <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.save_status.total_detalles || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen de Procesamiento OC -->
      <div v-if="procesoStore.resultados.metadata?.oc_status" class="border border-gray-200 rounded-lg overflow-hidden">
        <button
          @click="showProcesarOCResults = !showProcesarOCResults"
          class="w-full px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-between text-left"
        >
          <div class="flex items-center gap-2">
            <span class="text-green-700 font-medium">✓ Procesamiento completado</span>
            <span class="text-xs text-green-600">
              {{ procesoStore.resultados.metadata.oc_status.oc_creadas || 0 }} OCs creadas
            </span>
          </div>
          <span class="text-green-700">{{ showProcesarOCResults ? '▼' : '▶' }}</span>
        </button>
        <div v-if="showProcesarOCResults" class="p-4 bg-white border-t border-gray-200">
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div class="bg-gray-50 p-3 rounded text-center">
              <p class="text-xs text-gray-600 mb-1">OCs Creadas</p>
              <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.oc_status.oc_creadas || 0 }}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded text-center">
              <p class="text-xs text-gray-600 mb-1">Errores</p>
              <p class="text-2xl font-bold text-red-600">{{ procesoStore.resultados.metadata.oc_status.oc_errores || 0 }}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded text-center">
              <p class="text-xs text-gray-600 mb-1">Total Procesadas</p>
              <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.oc_status.total_procesadas || 0 }}</p>
            </div>
          </div>
          
          <!-- Detalles de errores si los hay -->
          <div v-if="procesoStore.resultados.metadata.oc_status.oc_errores > 0 && procesoStore.resultados.metadata.oc_status.detalles" class="mt-3">
            <details class="cursor-pointer">
              <summary class="text-sm font-medium text-red-700 mb-2">
                Ver detalles de errores ({{ procesoStore.resultados.metadata.oc_status.oc_errores }})
              </summary>
              <div class="mt-2 bg-red-50 border border-red-200 rounded p-3 max-h-48 overflow-y-auto">
                <ul class="space-y-1 text-xs text-red-800">
                  <li v-for="(error, index) in procesoStore.resultados.metadata.oc_status.detalles" :key="index">
                    • {{ error }}
                  </li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- Vista JSON completa -->
      <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <details class="cursor-pointer">
          <summary class="text-sm font-medium text-gray-700 mb-2">
            Ver datos completos del proceso (JSON)
          </summary>
          <pre class="mt-2 bg-white p-4 rounded border border-gray-200 overflow-x-auto text-xs text-gray-800 max-h-96 overflow-y-auto font-mono">{{ JSON.stringify(procesoStore.resultados, null, 2) }}</pre>
        </details>
      </div>
    </div>

    <!-- Tabla de Despachos -->
    <div v-if="hayDespachos" class="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Despachos Disponibles</h2>
          <p class="mt-1 text-sm text-gray-500">
            Despachos guardados en la base de datos ({{ despachosCount }} total)
          </p>
        </div>
        <button 
          @click="cargarDespachos" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          :disabled="loadingDespachos"
        >
          <svg v-if="loadingDespachos" class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loadingDespachos ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>

      <SkeletonTable v-if="loadingDespachos && despachos.length === 0" />

      <DespachosTable 
        v-else
        :despachos="despachos"
        :loading="loadingDespachos"
        :total-despachos="despachosCount"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProcesoStore } from '../stores/procesoStore'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { Prefactura, Despacho } from '../types'
import DespachosTable from '../components/DespachosTable.vue'
import SkeletonTable from '../components/SkeletonTable.vue'

const procesoStore = useProcesoStore()
const ordenesCompraStore = useOrdenesCompraStore()
const toast = useToast()

// Estados de visualización de resultados
const showMigrarResults = ref(false)
const showProcesarOCResults = ref(false)

// Estados para verificar disponibilidad de despachos
const hayDespachos = ref(false)
const despachosCount = ref(0)
const despachos = ref<Despacho[]>([])
const loadingDespachos = ref(false)

// Computed para verificar si hay órdenes de compra disponibles
const hayOrdenesCompra = computed(() => {
  const totalOCs = ordenesCompraStore.pendientes + ordenesCompraStore.enviadas + ordenesCompraStore.errores
  return totalOCs > 0
})

// Computed para verificar si se puede procesar OC
const puedeProcesarOC = computed(() => {
  // Verificar si hay despachos disponibles O si el paso de migrar está completado
  const migrarCompletado = procesoStore.resultados?.metadata?.save_status !== undefined
  return hayDespachos.value || migrarCompletado
})

// Función para verificar despachos disponibles
async function verificarDespachos() {
  try {
    const result = await mba3ConsultasService.getDespachosCount()
    hayDespachos.value = result.disponible && result.count > 0
    despachosCount.value = result.count || 0
    
    // Si hay despachos, cargarlos automáticamente
    if (hayDespachos.value && despachos.value.length === 0) {
      await cargarDespachos()
    }
  } catch (error: any) {
    console.error('Error al verificar despachos:', error)
    // Solo mostrar error si es un error de serialización (problema del backend)
    if (error.message && error.message.includes('Decimal') || error.message?.includes('serialización')) {
      console.warn('⚠️ Error de serialización en el backend. El backend necesita convertir Decimal a números.')
      // No mostrar toast porque esto puede pasar silenciosamente
    }
    hayDespachos.value = false
    despachosCount.value = 0
  }
}

// Función para cargar la lista de despachos
async function cargarDespachos() {
  loadingDespachos.value = true
  try {
    const response = await mba3ConsultasService.getDespachos(1, 100)
    despachos.value = response.data || []
    
    // Actualizar el conteo si viene en la respuesta
    if (response.metadata?.count) {
      despachosCount.value = response.metadata.count
    }
  } catch (error: any) {
    console.error('Error al cargar despachos:', error)
    toast.error('Error al cargar despachos', error.message || 'No se pudieron cargar los despachos')
    despachos.value = []
  } finally {
    loadingDespachos.value = false
  }
}

// Cargar estadísticas al montar el componente
onMounted(async () => {
  await ordenesCompraStore.fetchEstadisticas()
  await verificarDespachos()
})

async function ejecutarMigrar() {
  try {
    toast.info('Ejecutando importación...', 'Importando despachos y guardando prefacturas en base de datos')
    await procesoStore.migrar()
    if (procesoStore.resultados?.metadata?.save_status) {
      showMigrarResults.value = true
      const status = procesoStore.resultados.metadata.save_status
      toast.success(
        'Importación completada',
        `${status.prefacturas_guardadas || 0} guardadas, ${status.prefacturas_actualizadas || 0} actualizadas`
      )
      // Actualizar estado de despachos después de migrar
      await verificarDespachos()
      // Recargar la lista de despachos
      await cargarDespachos()
    }
  } catch (error: any) {
    console.error('Error al importar:', error)
    toast.error('Error en importación', error.message || 'No se pudo completar la importación')
  }
}

async function ejecutarProcesarOC() {
  try {
    toast.info('Procesando órdenes de compra...', 'Generando OCs desde prefacturas')
    await procesoStore.procesarOC()
    if (procesoStore.resultados?.metadata?.oc_status) {
      showProcesarOCResults.value = true
      const status = procesoStore.resultados.metadata.oc_status
      toast.success(
        'Procesamiento completado',
        `${status.oc_creadas || 0} OCs creadas${status.oc_errores > 0 ? `, ${status.oc_errores} con errores` : ''}`
      )
    }
    await ordenesCompraStore.fetchEstadisticas()
  } catch (error: any) {
    console.error('Error al procesar OC:', error)
    toast.error('Error al procesar OC', error.message || 'No se pudieron procesar las órdenes de compra')
  }
}

async function ejecutarIntegrarSAP() {
  try {
    toast.info('Integrando con SAP...', 'Enviando órdenes a SAP Service Layer')
    await procesoStore.integrarSAP()
    toast.success('Integración completada', 'Las órdenes se han enviado correctamente a SAP')
    // Actualizar estadísticas después de integrar
    await ordenesCompraStore.fetchEstadisticas()
  } catch (error: any) {
    console.error('Error al integrar SAP:', error)
    toast.error('Error en integración SAP', error.message || 'No se pudo integrar con SAP')
  }
}

// Funciones auxiliares para estilos y estados visuales
function getStepStatus(step: string): 'pending' | 'active' | 'completed' | 'error' {
  if (!procesoStore.currentStep && !procesoStore.resultados) return 'pending'
  
  const stepOrder = ['migrar', 'procesar-oc', 'integrar-sap']
  const currentIndex = stepOrder.indexOf(procesoStore.currentStep || '')
  const stepIndex = stepOrder.indexOf(step)
  
  // Si hay error en el proceso
  if (procesoStore.error) {
    if (stepIndex === currentIndex) return 'error'
    if (stepIndex < currentIndex) return 'completed'
    return 'pending'
  }
  
  // Si hay resultados completos
  if (procesoStore.resultados && !procesoStore.loading) {
    // Verificar si el paso específico tiene resultados
    if (step === 'migrar' && procesoStore.resultados.metadata?.save_status) return 'completed'
    if (step === 'procesar-oc' && procesoStore.resultados.metadata?.oc_status) return 'completed'
    if (step === 'integrar-sap' && procesoStore.resultados.integrarSAP) return 'completed'
  }
  
  // Si está en ejecución
  if (procesoStore.loading) {
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }
  
  return 'pending'
}

function getStepTitle(step: string): string {
  const titles: Record<string, string> = {
    'migrar': 'Importar-Despachos',
    'procesar-oc': 'Procesar OC',
    'integrar-sap': 'Integrar SAP'
  }
  return titles[step] || step
}

function getStepDescription(step: string): string {
  const descriptions: Record<string, string> = {
    'migrar': 'Guarda prefacturas en base de datos',
    'procesar-oc': 'Genera órdenes de compra',
    'integrar-sap': 'Envía órdenes a SAP'
  }
  return descriptions[step] || ''
}

function getProcesoCardClass(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'error') return 'border-red-300 bg-red-50'
  if (status === 'active') return 'border-blue-400 bg-blue-50 shadow-md scale-105'
  if (status === 'completed') return 'border-green-300 bg-green-50'
  return 'border-gray-200 bg-white'
}

function getProcesoIconClass(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'error') return 'bg-red-500 text-white border-red-600'
  if (status === 'active') return 'bg-blue-500 text-white border-blue-600 animate-pulse'
  if (status === 'completed') return 'bg-green-500 text-white border-green-600'
  return 'bg-gray-200 text-gray-500 border-gray-300'
}

function getButtonClass(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'completed') {
    return 'bg-green-100 text-green-800 hover:bg-green-200'
  }
  if (status === 'active') {
    return 'bg-blue-600 text-white hover:bg-blue-700'
  }
  if (status === 'error') {
    return 'bg-red-600 text-white hover:bg-red-700'
  }
  return 'bg-indigo-600 text-white hover:bg-indigo-700'
}

function getStepStatusText(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'active') return 'En ejecución...'
  if (status === 'completed') return 'Completado'
  if (status === 'error') return 'Error'
  return 'Pendiente'
}

function getStepStatusTextClass(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'active') return 'text-blue-600'
  if (status === 'completed') return 'text-green-600'
  if (status === 'error') return 'text-red-600'
  return 'text-gray-500'
}

function getConnectorClass(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'completed') return 'bg-green-400'
  if (status === 'active') return 'bg-blue-400'
  return 'bg-gray-300'
}
</script>

