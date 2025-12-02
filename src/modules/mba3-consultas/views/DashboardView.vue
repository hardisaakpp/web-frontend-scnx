<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Integración MBA3-SAP</h1>
        <p class="mt-1 text-sm text-gray-500">Vista general del sistema de integración MBA3-SAP</p>
      </div>

    <!-- Tarjetas de Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
           @click="$router.push('/mba3-consultas/ordenes-compra?estado=PENDIENTE')">
        <div class="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">
          ⏳
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.pendientes }}</h3>
          <p class="text-sm text-gray-500">OCs Pendientes</p>
        </div>
        <div class="text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
           @click="$router.push('/mba3-consultas/ordenes-compra?estado=ENVIADA')">
        <div class="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center text-2xl">
          ✅
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.enviadas }}</h3>
          <p class="text-sm text-gray-500">OCs Enviadas</p>
        </div>
        <div class="text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
           @click="$router.push('/mba3-consultas/ordenes-compra?estado=ERROR')">
        <div class="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center text-2xl">
          ❌
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.errores }}</h3>
          <p class="text-sm text-gray-500">OCs con Error</p>
        </div>
        <div class="text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- Acciones Rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Panel de Procesos -->
      <div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200 flex flex-col h-full">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Procesos de Integración</h2>
            <p class="text-sm text-gray-500 mt-1">Ejecuta migración y procesamiento de OC</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4 flex-grow">
          Ejecuta el flujo completo de integración: Importar despachos desde MBA3 y procesar órdenes de compra.
        </p>
        <button
          @click="$router.push('/mba3-consultas/proceso')"
          class="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-auto"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <span>Ir a Procesos</span>
        </button>
      </div>

      <!-- Panel de Órdenes de Compra -->
      <div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200 flex flex-col h-full">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Órdenes de Compra</h2>
            <p class="text-sm text-gray-500 mt-1">Gestiona y envía órdenes a SAP</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4 flex-grow">
          Visualiza, filtra y envía órdenes de compra individuales o en lote a SAP Service Layer.
        </p>
        <button
          @click="$router.push('/mba3-consultas/ordenes-compra')"
          class="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-auto"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <span>Ver Órdenes de Compra</span>
        </button>
      </div>
    </div>

    <!-- Resumen de Última Ejecución -->
    <div v-if="procesoStore.resultados && !procesoStore.loading" class="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-900">Última Ejecución</h2>
        <button
          @click="$router.push('/mba3-consultas/proceso')"
          class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Ver detalles →
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-if="procesoStore.resultados.metadata?.save_status" class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600 mb-1">Prefacturas Guardadas</p>
          <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.save_status.prefacturas_guardadas || 0 }}</p>
        </div>
        <div v-if="procesoStore.resultados.metadata?.save_status" class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600 mb-1">Prefacturas Actualizadas</p>
          <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.save_status.prefacturas_actualizadas || 0 }}</p>
        </div>
        <div v-if="procesoStore.resultados.metadata?.oc_status" class="bg-gray-50 p-4 rounded-lg">
          <p class="text-xs text-gray-600 mb-1">OCs Creadas</p>
          <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.oc_status.oc_creadas || 0 }}</p>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { useProcesoStore } from '../stores/procesoStore'

const ordenesCompraStore = useOrdenesCompraStore()
const procesoStore = useProcesoStore()

onMounted(async () => {
  await ordenesCompraStore.fetchEstadisticas()
})
</script>
