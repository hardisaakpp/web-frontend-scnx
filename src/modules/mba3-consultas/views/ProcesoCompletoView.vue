<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Proceso Completo</h1>
      <p class="mt-1 text-sm text-gray-500">Ejecuta el flujo completo de procesamiento MBA3</p>
    </div>
    
    <ProcesoFlujo 
      :current-step="procesoStore.currentStep"
      :progress="procesoStore.progress"
    />

    <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 class="text-xl font-semibold text-gray-900 mb-4">Acciones</h3>
      <div class="flex flex-wrap gap-3">
        <button 
          @click="ejecutarProcesoCompleto" 
          class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          :disabled="procesoStore.loading"
        >
          {{ procesoStore.loading ? 'Ejecutando...' : 'Ejecutar Proceso Completo' }}
        </button>
        <button 
          @click="ejecutarPasoAPaso" 
          class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          :disabled="procesoStore.loading"
        >
          Ejecutar Paso a Paso
        </button>
        <button 
          @click="procesoStore.reset" 
          class="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          :disabled="procesoStore.loading"
        >
          Limpiar
        </button>
      </div>
    </div>

    <div v-if="procesoStore.error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
      <div class="flex">
        <div class="ml-3">
          <p class="text-sm text-red-700">
            <strong>Error:</strong> {{ procesoStore.error }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="procesoStore.resultados" class="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 class="text-xl font-semibold text-gray-900 mb-4">Resultados</h3>
      <div class="space-y-4">
        <div v-if="procesoStore.resultados.metadata?.save_status" class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 class="text-lg font-medium text-gray-900 mb-3">Guardado en Base de Datos</h4>
          <ul class="list-disc list-inside space-y-1 text-gray-600">
            <li>Facturas guardadas: {{ procesoStore.resultados.metadata.save_status.facturas_guardadas || 0 }}</li>
            <li>Facturas actualizadas: {{ procesoStore.resultados.metadata.save_status.facturas_actualizadas || 0 }}</li>
            <li>Total detalles: {{ procesoStore.resultados.metadata.save_status.total_detalles || 0 }}</li>
          </ul>
        </div>

        <div v-if="procesoStore.resultados.metadata?.oc_status" class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 class="text-lg font-medium text-gray-900 mb-3">Órdenes de Compra</h4>
          <ul class="list-disc list-inside space-y-1 text-gray-600">
            <li>OCs creadas: {{ procesoStore.resultados.metadata.oc_status.oc_creadas || 0 }}</li>
            <li>Errores: {{ procesoStore.resultados.metadata.oc_status.oc_errores || 0 }}</li>
            <li>Total procesadas: {{ procesoStore.resultados.metadata.oc_status.total_procesadas || 0 }}</li>
          </ul>
        </div>

        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 class="text-lg font-medium text-gray-900 mb-3">Datos Completos</h4>
          <pre class="bg-white p-4 rounded border border-gray-200 overflow-x-auto text-sm text-gray-800 max-h-96 overflow-y-auto font-mono">{{ JSON.stringify(procesoStore.resultados, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <div v-if="pasoAPasoMode" class="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 class="text-xl font-semibold text-gray-900 mb-4">Ejecutar Paso a Paso</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button 
          @click="ejecutarConsultar" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          :disabled="procesoStore.loading"
        >
          {{ procesoStore.loading && procesoStore.currentStep === 'consultar' ? 'Ejecutando...' : '1. Consultar' }}
        </button>
        <button 
          @click="ejecutarMigrar" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          :disabled="procesoStore.loading"
        >
          {{ procesoStore.loading && procesoStore.currentStep === 'migrar' ? 'Ejecutando...' : '2. Migrar' }}
        </button>
        <button 
          @click="ejecutarProcesarOC" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          :disabled="procesoStore.loading"
        >
          {{ procesoStore.loading && procesoStore.currentStep === 'procesar-oc' ? 'Ejecutando...' : '3. Procesar OC' }}
        </button>
        <button 
          @click="ejecutarIntegrarSAP" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          :disabled="procesoStore.loading"
        >
          {{ procesoStore.loading && procesoStore.currentStep === 'integrar-sap' ? 'Ejecutando...' : '4. Integrar SAP' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProcesoStore } from '../stores/procesoStore'
import ProcesoFlujo from '../components/ProcesoFlujo.vue'

const procesoStore = useProcesoStore()
const pasoAPasoMode = ref(false)

async function ejecutarProcesoCompleto() {
  try {
    await procesoStore.procesoCompleto()
  } catch (error) {
    console.error('Error en proceso completo:', error)
  }
}

function ejecutarPasoAPaso() {
  pasoAPasoMode.value = true
}

async function ejecutarConsultar() {
  try {
    await procesoStore.consultar()
  } catch (error) {
    console.error('Error al consultar:', error)
  }
}

async function ejecutarMigrar() {
  try {
    await procesoStore.migrar()
  } catch (error) {
    console.error('Error al migrar:', error)
  }
}

async function ejecutarProcesarOC() {
  try {
    await procesoStore.procesarOC()
  } catch (error) {
    console.error('Error al procesar OC:', error)
  }
}

async function ejecutarIntegrarSAP() {
  try {
    await procesoStore.integrarSAP()
  } catch (error) {
    console.error('Error al integrar SAP:', error)
  }
}
</script>


