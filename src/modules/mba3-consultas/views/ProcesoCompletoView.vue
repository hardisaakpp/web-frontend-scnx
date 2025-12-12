<template>
  <div class="space-y-6 relative">
    <!-- Overlay de bloqueo cuando se ejecuta la importación -->
    <Teleport to="body">
      <div 
        v-if="procesoStore.loading && procesoStore.currentStep === 'migrar'"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        @click.prevent
        @mousedown.prevent
        @mouseup.prevent
        @touchstart.prevent
        @touchmove.prevent
        @touchend.prevent
      >
      <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
        <div class="flex flex-col items-center gap-4">
          <svg class="animate-spin h-12 w-12 text-violet-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Ejecutando Importación</h3>
            <p class="text-sm text-gray-600">Por favor espera mientras se completa el proceso...</p>
            <div class="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-all duration-300"
                :style="{ width: `${procesoStore.progress}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ procesoStore.progress }}% completado</p>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Overlay de bloqueo cuando se ejecuta el envío a SAP desde Procesar ODC -->
    <Teleport to="body">
      <div 
        v-if="procesoStore.loading && (procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc')"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        @click.prevent
        @mousedown.prevent
        @mouseup.prevent
        @touchstart.prevent
        @touchmove.prevent
        @touchend.prevent
      >
      <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
        <div class="flex flex-col items-center gap-4">
          <svg class="animate-spin h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Enviando Órdenes a SAP</h3>
            <p class="text-sm text-gray-600">Por favor espera mientras se procesan y envían las órdenes de compra...</p>
            <div class="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 transition-all duration-300"
                :style="{ width: `${procesoStore.progress}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ procesoStore.progress }}% completado</p>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Contenedor principal con bloqueo de interacción -->
    <div 
      :class="{
        'pointer-events-none opacity-75': procesoStore.loading && (procesoStore.currentStep === 'migrar' || procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc')
      }"
    >
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Procesos de Integración MBA3-SAP</h1>
        <p class="mt-1 text-sm text-gray-500">Ejecuta cada paso del proceso de integración de forma independiente cuando lo necesites</p>
      </div>

      <!-- Sistema de Pestañas -->
      <FolderTabs
        :tabs="tabs"
        :default-tab="activeTab"
        @tab-changed="handleTabChange"
        :disabled="procesoStore.loading && (procesoStore.currentStep === 'migrar' || procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc')"
      >
      <!-- Pestaña 1: Importar-Despachos -->
      <template #tab-migrar>
        <div class="space-y-6">
          <!-- Botón de acción y estado -->
          <div class="flex items-center justify-between flex-wrap gap-4 p-6 rounded-xl border border-white/30 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
            :class="getProcesoCardClass('migrar')">
            <div class="absolute inset-0 pointer-events-none" :class="getProcesoOverlayClass('migrar')"></div>
            <div class="flex items-center gap-4 relative z-10">
              <div 
                class="w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all duration-300 border-2 relative overflow-hidden"
              :class="getProcesoIconClass('migrar')"
            >
              <div class="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
              <div class="relative z-10">
                <span v-if="getStepStatus('migrar') === 'active'" class="animate-spin">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
                <span v-else-if="getStepStatus('migrar') === 'completed'">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span v-else-if="getStepStatus('migrar') === 'retry'">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
                <span v-else-if="getStepStatus('migrar') === 'error'">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            </div>
            </div>
              <div class="relative z-10">
                <h3 class="text-lg font-semibold mb-1">{{ getStepTitle('migrar') }}</h3>
                <p class="text-sm text-gray-600">{{ getStepDescription('migrar') }}</p>
            </div>
          </div>
          
          <button
            @click="ejecutarMigrar"
            :disabled="procesoStore.loading"
              class="px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden backdrop-blur-md shadow-lg hover:shadow-xl"
            :class="getButtonClass('migrar')"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <span class="relative z-10">
            <span v-if="procesoStore.loading && procesoStore.currentStep === 'migrar'" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Ejecutando...
            </span>
            <span v-else-if="getStepStatus('migrar') === 'retry'" class="flex items-center justify-center gap-2">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reintentar
            </span>
            <span v-else-if="getStepStatus('migrar') === 'completed'">✓ Completado</span>
            <span v-else>Ejecutar Importación</span>
            </span>
          </button>
          </div>

          <!-- Barra de progreso para Importar Despachos -->
          <div v-if="procesoStore.loading && procesoStore.currentStep === 'migrar'" 
               class="bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl p-4 border border-white/30 relative overflow-hidden transition-all duration-300">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            
            <!-- Efecto de ondas animadas (shimmer) -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            
            <!-- Partículas/puntos animados -->
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute top-2 left-1/4 w-2 h-2 bg-violet-400/60 rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-1/2 w-2 h-2 bg-violet-500/60 rounded-full animate-bounce" style="animation-delay: 0.3s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-3/4 w-2 h-2 bg-violet-600/60 rounded-full animate-bounce" style="animation-delay: 0.6s; animation-duration: 1s;"></div>
            </div>
            
            <div class="flex items-center justify-between mb-2 relative z-10">
              <div class="flex items-center gap-2">
                <!-- Spinner animado -->
                <div class="relative w-4 h-4">
                  <svg class="animate-spin h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div class="absolute inset-0 border-2 border-violet-300/30 rounded-full animate-ping"></div>
                </div>
                <span class="text-sm font-medium text-gray-700">Progreso de importación</span>
              </div>
              <span class="text-sm text-gray-500 font-semibold">{{ procesoStore.progress }}%</span>
            </div>
            <div class="w-full h-4 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner relative z-10">
              <div
                class="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                :style="{ width: `${procesoStore.progress}%` }"
              >
                <!-- Efecto shimmer sobre la barra de progreso -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                
                <!-- Barra de progreso animada interna -->
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 animate-progress-bar"></div>
                </div>
                
                <!-- Efecto de pulso en la barra -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Resultados de migración -->
          <div v-if="procesoStore.resultados?.metadata?.save_status && !procesoStore.loading" class="border border-white/30 rounded-xl overflow-hidden backdrop-blur-xl bg-gradient-to-br from-violet-50/80 to-violet-100/60 shadow-xl relative">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            <button
              @click="showMigrarResults = !showMigrarResults"
              :disabled="procesoStore.loading && procesoStore.currentStep === 'migrar'"
              class="w-full px-4 py-3 bg-violet-100/60 hover:bg-violet-200/70 backdrop-blur-sm transition-all duration-300 flex items-center justify-between text-left relative z-10 border-b border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="flex items-center gap-2">
                <span class="text-violet-700 font-medium">✓ Importación completada</span>
                <span class="text-xs text-violet-600">
                  {{ procesoStore.resultados.metadata.save_status.prefacturas_guardadas || 0 }} guardadas, 
                  {{ procesoStore.resultados.metadata.save_status.prefacturas_actualizadas || 0 }} actualizadas
                </span>
              </div>
              <span class="text-violet-700">{{ showMigrarResults ? '▼' : '▶' }}</span>
            </button>
            <div v-if="showMigrarResults" class="p-4 bg-white/60 backdrop-blur-md border-t border-white/20 relative z-10">
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl text-center border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <p class="text-xs text-gray-600 mb-1">Prefacturas Guardadas</p>
                  <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.save_status.prefacturas_guardadas || 0 }}</p>
                </div>
                <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl text-center border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <p class="text-xs text-gray-600 mb-1">Prefacturas Actualizadas</p>
                  <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.save_status.prefacturas_actualizadas || 0 }}</p>
                </div>
                <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl text-center border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <p class="text-xs text-gray-600 mb-1">Total Detalles</p>
                  <p class="text-2xl font-bold text-green-700">{{ procesoStore.resultados.metadata.save_status.total_detalles || 0 }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Barra de progreso para Generar ODC desde Despachos -->
          <div v-if="generandoODC" 
               class="bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl p-4 border border-white/30 relative overflow-hidden transition-all duration-300">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            
            <!-- Efecto de ondas animadas (shimmer) -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            
            <!-- Partículas/puntos animados -->
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute top-2 left-1/4 w-2 h-2 bg-violet-400/60 rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-1/2 w-2 h-2 bg-violet-500/60 rounded-full animate-bounce" style="animation-delay: 0.3s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-3/4 w-2 h-2 bg-violet-600/60 rounded-full animate-bounce" style="animation-delay: 0.6s; animation-duration: 1s;"></div>
            </div>
            
            <div class="flex items-center justify-between mb-2 relative z-10">
              <div class="flex items-center gap-2">
                <!-- Spinner animado -->
                <div class="relative w-4 h-4">
                  <svg class="animate-spin h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div class="absolute inset-0 border-2 border-violet-300/30 rounded-full animate-ping"></div>
                </div>
                <span class="text-sm font-medium text-gray-700">Generando órdenes de compra</span>
              </div>
              <span class="text-sm text-gray-500 font-semibold">{{ progresoGenerarODC }}%</span>
            </div>
            <div class="w-full h-4 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner relative z-10">
              <div
                class="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                :style="{ width: `${progresoGenerarODC}%` }"
              >
                <!-- Efecto shimmer sobre la barra de progreso -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                
                <!-- Barra de progreso animada interna -->
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 animate-progress-bar"></div>
                </div>
                
                <!-- Efecto de pulso en la barra -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Tabla de Despachos -->
          <div class="bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl p-6 border border-white/30 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">Despachos Disponibles</h2>
                <p class="mt-1 text-sm text-gray-500">
                  Despachos guardados en la base de datos ({{ despachosCount }} total)
                </p>
              </div>
            </div>

            <SkeletonTable v-if="loadingDespachos && despachos.length === 0" />

            <DespachosTable 
              v-else
              ref="despachosTableRef"
              :despachos="despachos"
              :loading="loadingDespachos"
              :total-despachos="despachosCount"
              :processing="generandoODC || (procesoStore.loading && procesoStore.currentStep === 'procesar-oc')"
              @generar-odc="handleGenerarODCIndividual"
              @generar-odc-multiples="handleGenerarODCMultiples"
            />
          </div>
        </div>
      </template>

      <!-- Pestaña 2: Procesar ODC -->
      <template #tab-procesar-oc>
        <div class="space-y-6">
          <!-- Botón de acción y estado -->
          <div class="flex items-center justify-between flex-wrap gap-4 p-6 rounded-xl border border-white/30 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
            :class="getProcesoCardClass('procesar-oc')">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            <div class="flex items-center gap-4 relative z-10">
              <div 
                class="w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all duration-300 border-2 relative overflow-hidden"
              :class="getProcesoIconClass('procesar-oc')"
            >
              <div class="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
              <div class="relative z-10">
                <span v-if="getStepStatus('procesar-oc') === 'active'" class="animate-spin">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
                <span v-else-if="getStepStatus('procesar-oc') === 'completed'">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span v-else-if="getStepStatus('procesar-oc') === 'error'">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            </div>
              <div class="relative z-10">
                <h3 class="text-lg font-semibold mb-1">{{ getStepTitle('procesar-oc') }}</h3>
                <p class="text-sm text-gray-600">{{ getStepDescription('procesar-oc') }}</p>
            </div>
          </div>
          
          <button
            @click="ejecutarIntegrarSAPDesdeProcesarOC"
            :disabled="procesoStore.loading || !puedeEnviarOCaSAP || (procesoStore.loading && procesoStore.currentStep === 'migrar')"
            class="px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden backdrop-blur-md shadow-lg hover:shadow-xl"
            :class="[
              getButtonClass('procesar-oc'),
              procesoStore.loading && (procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc') ? 'animate-pulse' : ''
            ]"
          >
            <!-- Efecto de ondas animadas cuando está cargando -->
            <div v-if="procesoStore.loading && (procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc')" 
                 class="absolute inset-0 overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            
            <!-- Barra de progreso animada -->
            <div v-if="procesoStore.loading && (procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc')" 
                 class="absolute bottom-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 animate-progress-bar"></div>
            </div>
            
            <!-- Efecto de partículas/puntos animados -->
            <div v-if="procesoStore.loading && (procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc')" 
                 class="absolute inset-0 pointer-events-none">
              <div class="absolute top-1/2 left-1/4 w-2 h-2 bg-white/60 rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 1s;"></div>
              <div class="absolute top-1/2 left-1/2 w-2 h-2 bg-white/60 rounded-full animate-bounce" style="animation-delay: 0.3s; animation-duration: 1s;"></div>
              <div class="absolute top-1/2 left-3/4 w-2 h-2 bg-white/60 rounded-full animate-bounce" style="animation-delay: 0.6s; animation-duration: 1s;"></div>
            </div>
            
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <span class="relative z-10 flex items-center justify-center gap-2">
              <span v-if="procesoStore.loading && (procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc')" class="flex items-center justify-center gap-2">
                <!-- Spinner mejorado con múltiples círculos -->
                <div class="relative w-5 h-5">
                  <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <!-- Círculo exterior animado -->
                  <div class="absolute inset-0 border-2 border-white/30 rounded-full animate-ping"></div>
                </div>
                <span class="font-semibold">Procesando...</span>
              </span>
              <span v-else-if="getStepStatus('integrar-sap') === 'completed'" class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Completado
              </span>
              <span v-else-if="!puedeEnviarOCaSAP">
                {{ ordenesCompraStore.pendientes === 0 ? 'Sin órdenes pendientes' : 'Sin órdenes disponibles' }}
            </span>
              <span v-else class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Enviar ODC a SAP
              </span>
            </span>
          </button>
          </div>

          <!-- Barra de progreso para Procesar ODC / Integrar SAP -->
          <div v-if="procesoStore.loading && (procesoStore.currentStep === 'procesar-oc' || procesoStore.currentStep === 'integrar-sap')" 
               class="bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl p-4 border border-white/30 relative overflow-hidden transition-all duration-300">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            
            <!-- Efecto de ondas animadas (shimmer) -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            
            <!-- Partículas/puntos animados -->
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute top-2 left-1/4 w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-1/2 w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style="animation-delay: 0.3s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-3/4 w-2 h-2 bg-pink-400/60 rounded-full animate-bounce" style="animation-delay: 0.6s; animation-duration: 1s;"></div>
            </div>
            
            <div class="flex items-center justify-between mb-2 relative z-10">
              <div class="flex items-center gap-2">
                <!-- Spinner animado -->
                <div class="relative w-4 h-4">
                  <svg class="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div class="absolute inset-0 border-2 border-indigo-300/30 rounded-full animate-ping"></div>
                </div>
                <span class="text-sm font-medium text-gray-700">Progreso del proceso</span>
              </div>
              <span class="text-sm text-gray-500 font-semibold">{{ procesoStore.progress }}%</span>
            </div>
            <div class="w-full h-4 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner relative z-10">
              <div
                class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                :style="{ width: `${procesoStore.progress}%` }"
              >
                <!-- Efecto shimmer sobre la barra de progreso -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                
                <!-- Barra de progreso animada interna -->
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 animate-progress-bar"></div>
                </div>
                
                <!-- Efecto de pulso en la barra -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Barra de progreso para Eliminar ODC -->
          <div v-if="eliminando" 
               class="flex items-center justify-between flex-wrap gap-4 p-6 rounded-xl border border-white/30 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl border-emerald-300/50 bg-gradient-to-br from-emerald-100/80 to-emerald-200/60">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            
            <!-- Efecto de ondas animadas (shimmer) -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            
            <!-- Partículas/puntos animados -->
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute top-2 left-1/4 w-2 h-2 bg-red-400/60 rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-1/2 w-2 h-2 bg-red-500/60 rounded-full animate-bounce" style="animation-delay: 0.3s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-3/4 w-2 h-2 bg-red-600/60 rounded-full animate-bounce" style="animation-delay: 0.6s; animation-duration: 1s;"></div>
            </div>
            
            <div class="relative z-10 w-full space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <!-- Spinner animado -->
                  <div class="relative w-4 h-4">
                    <svg class="animate-spin h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div class="absolute inset-0 border-2 border-red-300/30 rounded-full animate-ping"></div>
                  </div>
                  <span class="text-sm font-medium text-gray-700">Eliminando órdenes de compra</span>
                </div>
                <span class="text-sm text-gray-500 font-semibold">{{ progresoEliminar }}%</span>
              </div>
              <div class="w-full h-4 bg-gray-200/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
                <div
                  class="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                  :style="{ width: `${progresoEliminar}%` }"
                >
                  <!-- Efecto shimmer sobre la barra de progreso -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  
                  <!-- Barra de progreso animada interna -->
                  <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300 animate-progress-bar"></div>
                  </div>
                  
                  <!-- Efecto de pulso en la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabla de Órdenes de Compra (Todas) -->
          <div class="bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl p-6 border border-white/30 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
            <div class="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">Órdenes de Compra Generadas</h2>
                <p class="mt-1 text-sm text-gray-500">
                  Todas las órdenes de compra generadas (Pendientes, Enviadas y con Error)
                </p>
              </div>
            </div>

            <SkeletonTable v-if="ordenesCompraStore.loading && ordenesCompraStore.ordenesCompra.length === 0" />

            <OrdenCompraTable 
              v-else
              :ordenes-compra="ordenesCompraStore.ordenesCompra"
              :loading="ordenesCompraStore.loading"
              :total-ordenes="ordenesCompraStore.total"
              :allow-delete="true"
              @integrar="handleIntegrarOC"
              @integrar-multiples="handleIntegrarOCMultiples"
              @eliminar="handleEliminarOC"
              ref="ordenCompraTableRef"
            />

            <!-- Paginación -->
            <div v-if="ordenesCompraStore.totalPages > 1 && !ordenesCompraStore.loading" class="mt-4 flex items-center justify-between flex-wrap gap-4">
              <div class="text-sm text-gray-700">
                Mostrando {{ ordenesCompraStore.ordenesCompra.length }} de {{ ordenesCompraStore.total }} órdenes
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="prevPageOC"
                  :disabled="ordenesCompraStore.currentPage === 1 || ordenesCompraStore.loading || (procesoStore.loading && procesoStore.currentStep === 'migrar')"
                  class="px-4 py-2 border border-white/30 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg"
                >
                  Anterior
                </button>
                <span class="px-4 py-2 text-sm text-gray-700 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20">
                  Página {{ ordenesCompraStore.currentPage }} de {{ ordenesCompraStore.totalPages }}
                </span>
                <button
                  @click="nextPageOC"
                  :disabled="ordenesCompraStore.currentPage === ordenesCompraStore.totalPages || ordenesCompraStore.loading || (procesoStore.loading && procesoStore.currentStep === 'migrar')"
                  class="px-4 py-2 border border-white/30 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      </FolderTabs>

      <!-- Mensajes de error globales -->
      <div v-if="procesoStore.error" 
           :class="isConsultaMBA3Error(procesoStore.error) 
             ? 'bg-yellow-100/80 backdrop-blur-xl border-l-4 border-yellow-500 p-4 rounded-xl shadow-xl relative overflow-hidden' 
             : 'bg-red-100/80 backdrop-blur-xl border-l-4 border-red-500 p-4 rounded-xl shadow-xl relative overflow-hidden'">
        <div :class="isConsultaMBA3Error(procesoStore.error)
          ? 'absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-transparent pointer-events-none'
          : 'absolute inset-0 bg-gradient-to-br from-red-200/20 via-transparent to-transparent pointer-events-none'"></div>
        <div class="flex relative z-10">
          <div class="ml-3">
            <p :class="isConsultaMBA3Error(procesoStore.error)
              ? 'text-sm text-yellow-700 font-medium'
              : 'text-sm text-red-700 font-medium'">
              <strong>{{ isConsultaMBA3Error(procesoStore.error) ? 'Reintentar:' : 'Error:' }}</strong> {{ procesoStore.error }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useProcesoStore } from '../stores/procesoStore'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { Despacho, OrdenCompra } from '../types'
import DespachosTable from '../components/DespachosTable.vue'
import OrdenCompraTable from '../components/OrdenCompraTable.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import FolderTabs from '../components/FolderTabs.vue'
import type { Tab } from '../types'

const procesoStore = useProcesoStore()
const ordenesCompraStore = useOrdenesCompraStore()
const toast = useToast()

// Estado de pestañas
const activeTab = ref('migrar')

// Estados de visualización de resultados
const showMigrarResults = ref(false)

// Estados para despachos
const hayDespachos = ref(false)
const despachosCount = ref(0)
const despachos = ref<Despacho[]>([])
const loadingDespachos = ref(false)

// Estado para eliminación
const eliminando = ref(false)
const progresoEliminar = ref(0)

// Estado para generación de ODC desde despachos
const generandoODC = ref(false)
const progresoGenerarODC = ref(0)

// Referencia al componente de tabla de órdenes de compra
const ordenCompraTableRef = ref<{ 
  clearSendingState?: () => void
  clearSelection?: () => void
  clearSendingMultipleState?: () => void
} | null>(null)

// Referencia al componente de tabla de despachos
const despachosTableRef = ref<{
  clearSendingState?: () => void
  clearSelection?: () => void
  clearSendingMultipleState?: () => void
} | null>(null)

// Funciones auxiliares
function isConsultaMBA3Error(error: string | null): boolean {
  if (!error) return false
  return error.toLowerCase().includes('error al ejecutar consulta en mba3') || 
         error.toLowerCase().includes('ejecutar consulta en mba3')
}

// Definir las pestañas con colores temáticos
const tabs = computed<Tab[]>(() => {
  // Calcular el número real de despachos
  // Prioridad: usar el largo del array si hay despachos cargados (más confiable)
  // Si no hay despachos cargados, usar despachosCount del backend
  const totalDespachos = despachos.value.length > 0 
    ? despachos.value.length 
    : (despachosCount.value > 0 ? despachosCount.value : 0)
  
  // Calcular el total de órdenes de compra en la pestaña Procesar ODC
  // Usar el total del store (que contiene todas las órdenes: PENDIENTE, ENVIADA, ERROR)
  // Si no hay total, usar la longitud del array, sino la suma de todas las estadísticas
  const totalOrdenesProcesarOC = ordenesCompraStore.total > 0
    ? ordenesCompraStore.total
    : (ordenesCompraStore.ordenesCompra.length > 0
      ? ordenesCompraStore.ordenesCompra.length
      : (ordenesCompraStore.pendientes + ordenesCompraStore.enviadas + ordenesCompraStore.errores))
  
  return [
    {
      id: 'migrar',
      label: 'Importar despachos',
      badge: totalDespachos > 0 ? totalDespachos : undefined,
      color: 'violet'
    },
    {
      id: 'procesar-oc',
      label: 'Procesar ODC',
      badge: totalOrdenesProcesarOC > 0 ? totalOrdenesProcesarOC : undefined,
      color: 'emerald'
    }
  ]
})

// Computed para verificar si hay órdenes de compra disponibles
const hayOrdenesCompra = computed(() => {
  const totalODCs = ordenesCompraStore.pendientes + ordenesCompraStore.enviadas + ordenesCompraStore.errores
  return totalODCs > 0
})

// Computed para verificar si se puede enviar ODCs a SAP (en pestaña Procesar ODC)
const puedeEnviarOCaSAP = computed(() => {
  // Verificar tanto las estadísticas como las órdenes cargadas en el array
  const hayPendientesEnStats = ordenesCompraStore.pendientes > 0
  const hayPendientesEnArray = ordenesCompraStore.ordenesCompra.some(oc => oc.estado === 'PENDIENTE')
  return hayOrdenesCompra.value && (hayPendientesEnStats || hayPendientesEnArray)
})

// Función para cambiar de pestaña
async function handleTabChange(tabId: string) {
  activeTab.value = tabId
  
  // Cargar datos cuando se cambia de pestaña
  if (tabId === 'migrar') {
    // Siempre cargar despachos cuando se entra a la pestaña de importar despachos
    // Esto asegura que los datos estén actualizados
    await cargarDespachos()
  } else if (tabId === 'procesar-oc') {
    // Cargar estadísticas primero para que el botón se habilite correctamente
    await ordenesCompraStore.fetchEstadisticas()
    await cargarOrdenesCompraPendientes()
  }
}

// Función para verificar despachos disponibles
async function verificarDespachos() {
  try {
    const result = await mba3ConsultasService.getDespachosCount()
    hayDespachos.value = result.disponible && result.count > 0
    despachosCount.value = result.count || 0
    
    if (hayDespachos.value && despachos.value.length === 0) {
      await cargarDespachos()
    }
  } catch (error: any) {
    console.error('Error al verificar despachos:', error)
    if (error.message && (error.message.includes('Decimal') || error.message?.includes('serialización'))) {
      console.warn('⚠️ Error de serialización en el backend. El backend necesita convertir Decimal a números.')
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
    
    // Actualizar el conteo con el valor más confiable disponible
    // La longitud del array es la fuente más confiable, ya que refleja lo que realmente está en la BD
    if (response.data && response.data.length > 0) {
      despachosCount.value = response.data.length
    } else if (response.metadata?.count !== undefined) {
      despachosCount.value = response.metadata.count
    } else if (response.total !== undefined) {
      despachosCount.value = response.total
    }
  } catch (error: any) {
    console.error('Error al cargar despachos:', error)
    toast.error('Error al cargar despachos', error.message || 'No se pudieron cargar los despachos')
    despachos.value = []
  } finally {
    loadingDespachos.value = false
  }
}

// Función para cargar órdenes de compra pendientes
// Nota: Ahora carga todas las órdenes (PENDIENTE, ENVIADA, ERROR) para mostrar en la pestaña Procesar ODC
async function cargarOrdenesCompraPendientes() {
  ordenesCompraStore.loading = true
  try {
    // Si el backend no devuelve todas las órdenes cuando no se especifica estado,
    // hacer llamadas separadas para cada estado y combinar resultados
    const estados = ['PENDIENTE', 'ENVIADA', 'ERROR']
    const todasLasOrdenes: any[] = []
    let totalCombinado = 0
    
    // Cargar órdenes de cada estado
    for (const estado of estados) {
      try {
        const response = await mba3ConsultasService.getOrdenesCompra(estado, 1, 1000) // pageSize grande para obtener todas
        if (response.data && Array.isArray(response.data)) {
          todasLasOrdenes.push(...response.data)
        }
        // Sumar los totales
        if (response.total !== undefined) {
          totalCombinado += response.total
        } else if (response.metadata?.count !== undefined) {
          totalCombinado += response.metadata.count
        }
      } catch (err) {
        console.warn(`Error al cargar órdenes con estado ${estado}:`, err)
      }
    }
    
    // Actualizar el store con todas las órdenes combinadas
    ordenesCompraStore.ordenesCompra = todasLasOrdenes
    ordenesCompraStore.total = totalCombinado > 0 ? totalCombinado : todasLasOrdenes.length
    ordenesCompraStore.estadoFilter = undefined
    ordenesCompraStore.currentPage = 1
  } catch (error: any) {
    console.error('Error al cargar órdenes de compra:', error)
    toast.error('Error al cargar órdenes', error.message || 'No se pudieron cargar las órdenes de compra')
  } finally {
    ordenesCompraStore.loading = false
  }
}


// Funciones de paginación para ODC
function prevPageOC() {
  if (ordenesCompraStore.currentPage > 1) {
    ordenesCompraStore.setPage(ordenesCompraStore.currentPage - 1)
    ordenesCompraStore.fetchOrdenesCompra(undefined, ordenesCompraStore.currentPage)
  }
}

function nextPageOC() {
  if (ordenesCompraStore.currentPage < ordenesCompraStore.totalPages) {
    ordenesCompraStore.setPage(ordenesCompraStore.currentPage + 1)
    ordenesCompraStore.fetchOrdenesCompra(undefined, ordenesCompraStore.currentPage)
  }
}

// Funciones de ejecución de procesos
async function ejecutarMigrar() {
  try {
    toast.info('Ejecutando importación...', 'Importando despachos y guardando prefacturas en base de datos')
    await procesoStore.migrar()
    
    // Mostrar resultados si están disponibles
    if (procesoStore.resultados?.metadata?.save_status) {
      showMigrarResults.value = true
      const status = procesoStore.resultados.metadata.save_status
      toast.success(
        'Importación completada',
        `${status.prefacturas_guardadas || 0} guardadas, ${status.prefacturas_actualizadas || 0} actualizadas`
      )
    }
    
    // SIEMPRE cargar despachos después de la migración, independientemente del resultado
    // Intentar cargar con reintentos en caso de delay en la BD
    let intentos = 0
    const maxIntentos = 3
    const delayEntreIntentos = 500 // 500ms entre intentos
    
    const cargarDespachosConReintento = async () => {
      while (intentos < maxIntentos) {
        try {
          // Pequeño delay solo en reintentos (no en el primer intento)
          if (intentos > 0) {
            await new Promise(resolve => setTimeout(resolve, delayEntreIntentos))
          }
          
          // Cargar despachos directamente
          await cargarDespachos()
          
          // Si se cargaron despachos exitosamente (incluso si es 0), actualizar estado y salir
          despachosCount.value = despachos.value.length
          hayDespachos.value = despachos.value.length > 0
          return // Salir del loop si la carga fue exitosa (incluso con 0 despachos)
          
        } catch (err: any) {
          console.warn(`Intento ${intentos + 1}/${maxIntentos} de cargar despachos:`, err)
          intentos++
          
          // Si es el último intento, intentar verificar el conteo como fallback
          if (intentos >= maxIntentos) {
            try {
              await verificarDespachos()
              // Si el conteo indica que hay despachos, intentar cargar una vez más
              if (despachosCount.value > 0 && despachos.value.length === 0) {
                await cargarDespachos()
              }
            } catch (verifyErr) {
              console.warn('Error al verificar despachos después de migración:', verifyErr)
            }
            // No lanzar el error, solo loguearlo - queremos mostrar la tabla incluso si hay errores
            return
          }
        }
      }
    }
    
    // Intentar cargar despachos con reintentos
    await cargarDespachosConReintento()
    
  } catch (error: any) {
    console.error('Error al importar:', error)
    const errorMessage = error.message || 'No se pudo completar la importación'
    
    // Si es el error específico de consulta MBA3, mostrar mensaje de reintento
    if (isConsultaMBA3Error(errorMessage)) {
      toast.warning('Error al ejecutar consulta', 'Por favor, intenta nuevamente haciendo clic en "Reintentar"')
    } else {
      toast.error('Error en importación', errorMessage)
    }
    
    // Intentar cargar despachos incluso si hubo error en la migración
    // (puede que haya despachos previos que mostrar)
    try {
      await cargarDespachos()
    } catch (loadError) {
      console.warn('Error al cargar despachos después de error en migración:', loadError)
    }
  }
}

// Función para enviar ODCs a SAP desde la pestaña Procesar ODC
// Envía las órdenes pendientes una por una
async function ejecutarIntegrarSAPDesdeProcesarOC() {
  // Verificar que no esté ya ejecutándose
  if (procesoStore.loading || ordenesCompraStore.loading) {
    return
  }
  
  try {
    // Obtener todas las órdenes pendientes del store
    const ordenesPendientes = ordenesCompraStore.ordenesCompra.filter(
      oc => oc.estado === 'PENDIENTE'
    )
    
    if (ordenesPendientes.length === 0) {
      toast.warning('No hay órdenes pendientes', 'No hay órdenes de compra pendientes para enviar')
      return
    }
    
    // Establecer loading en procesoStore para que el botón se deshabilite
    procesoStore.loading = true
    procesoStore.currentStep = 'integrar-sap'
    procesoStore.progress = 0
    
    // Esperar a que Vue actualice el DOM para que el overlay aparezca
    await nextTick()
    
    toast.info('Enviando órdenes a SAP...', `Enviando ${ordenesPendientes.length} orden(es) pendiente(s) una por una`)
    
    let successCount = 0
    let errorCount = 0
    const totalOrdenes = ordenesPendientes.length
    
    // Enviar cada orden una por una usando el servicio directamente para evitar conflictos de loading
    for (let i = 0; i < ordenesPendientes.length; i++) {
      const orden = ordenesPendientes[i]
      try {
        await mba3ConsultasService.integrarSAP(orden.referencia_despacho)
        successCount++
        
        // Actualizar progreso basado en las órdenes procesadas
        procesoStore.progress = Math.round(((i + 1) / totalOrdenes) * 100)
        
        // Pequeño delay entre envíos para no saturar el servidor
        if (i < ordenesPendientes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        console.error(`Error al enviar orden ${orden.referencia_despacho}:`, error)
        errorCount++
        // Actualizar progreso incluso si hay error
        procesoStore.progress = Math.round(((i + 1) / totalOrdenes) * 100)
        // Continuar con la siguiente orden aunque haya un error
      }
    }
    
    // Asegurar que el progreso esté al 100% al finalizar
    procesoStore.progress = 100
    
    // Actualizar estadísticas y recargar órdenes
    await ordenesCompraStore.fetchEstadisticas()
    await cargarOrdenesCompraPendientes()
    
    // Mostrar resultado
    if (errorCount === 0) {
      toast.success('Integración completada', `Se han enviado ${successCount} orden(es) correctamente a SAP`)
      procesoStore.resultados = { ...procesoStore.resultados, integrarSAP: { success: successCount } }
    } else {
      toast.warning(
        'Integración parcial', 
        `Se enviaron ${successCount} orden(es) correctamente, ${errorCount} con errores`
      )
    }
  } catch (error: any) {
    console.error('Error al integrar SAP:', error)
    toast.error('Error en integración SAP', error.message || 'No se pudo integrar con SAP')
    procesoStore.error = error.message || 'No se pudo integrar con SAP'
  } finally {
    // Pequeño delay para mostrar el 100% antes de ocultar el overlay
    await new Promise(resolve => setTimeout(resolve, 500))
    procesoStore.loading = false
    procesoStore.currentStep = null
    procesoStore.progress = 0
  }
}

// Funciones para generar ODC individual y múltiple
async function handleGenerarODCIndividual(despachoId: string) {
  try {
    generandoODC.value = true
    progresoGenerarODC.value = 0
    
    // Simular progreso durante la generación
    const progressInterval = setInterval(() => {
      if (progresoGenerarODC.value < 80) {
        progresoGenerarODC.value += 10
      }
    }, 300)
    
    const despacho = despachos.value.find(d => d.despacho_id === despachoId)
    const referencia = despacho?.codigo_factura || despachoId
    
    toast.info('Generando ODC...', `Generando orden de compra para despacho ${referencia}`)
    
    await procesoStore.procesarOC(despachoId)
    
    clearInterval(progressInterval)
    progresoGenerarODC.value = 100
    
    // Pequeño delay para mostrar el 100%
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (procesoStore.resultados?.metadata?.oc_status) {
      const status = procesoStore.resultados.metadata.oc_status
      toast.success(
        'ODC generada',
        `Orden de compra generada exitosamente${status.oc_errores > 0 ? ` (con advertencias)` : ''}`
      )
    } else {
      toast.success('ODC generada', 'La orden de compra se ha generado exitosamente')
    }
    
    // Actualizar datos
    await ordenesCompraStore.fetchEstadisticas()
    await cargarOrdenesCompraPendientes()
    await cargarDespachos()
    
    // Cambiar automáticamente a la pestaña "Procesar ODC"
    activeTab.value = 'procesar-oc'
    await handleTabChange('procesar-oc')
    
    // Limpiar estado del botón individual
    if (despachosTableRef.value?.clearSendingState) {
      despachosTableRef.value.clearSendingState()
    }
  } catch (error: any) {
    console.error('Error al generar ODC individual:', error)
    toast.error('Error al generar ODC', error.message || 'No se pudo generar la orden de compra')
    
    // Limpiar estado del botón individual en caso de error
    if (despachosTableRef.value?.clearSendingState) {
      despachosTableRef.value.clearSendingState()
    }
  } finally {
    generandoODC.value = false
    progresoGenerarODC.value = 0
  }
}

async function handleGenerarODCMultiples(despachoIds: string[]) {
  try {
    generandoODC.value = true
    progresoGenerarODC.value = 0
    
    // Simular progreso durante la generación
    const progressInterval = setInterval(() => {
      if (progresoGenerarODC.value < 80) {
        progresoGenerarODC.value += 10
      }
    }, 300)
    
    toast.info('Generando ODCs...', `Generando ${despachoIds.length} orden(es) de compra`)
    
    // Si es un solo despacho, usar el método individual
    // (la función individual ya cambiará la pestaña automáticamente)
    if (despachoIds.length === 1) {
      await handleGenerarODCIndividual(despachoIds[0])
      clearInterval(progressInterval)
      progresoGenerarODC.value = 100
      await new Promise(resolve => setTimeout(resolve, 300))
      generandoODC.value = false
      progresoGenerarODC.value = 0
      return
    }
    
    // Si son múltiples, enviar array
    await procesoStore.procesarOC(despachoIds)
    
    clearInterval(progressInterval)
    progresoGenerarODC.value = 100
    
    // Pequeño delay para mostrar el 100%
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (procesoStore.resultados?.metadata?.oc_status) {
      const status = procesoStore.resultados.metadata.oc_status
      toast.success(
        'ODCs generadas',
        `${status.oc_creadas || despachoIds.length} ODC(s) generada(s)${status.oc_errores > 0 ? `, ${status.oc_errores} con errores` : ''}`
      )
    } else {
      toast.success('ODCs generadas', `${despachoIds.length} orden(es) de compra generada(s)`)
    }
    
    // Actualizar datos
    await ordenesCompraStore.fetchEstadisticas()
    await cargarOrdenesCompraPendientes()
    await cargarDespachos()
    
    // Cambiar automáticamente a la pestaña "Procesar ODC"
    activeTab.value = 'procesar-oc'
    await handleTabChange('procesar-oc')
    
    // Limpiar estado de envío múltiple
    if (despachosTableRef.value?.clearSendingMultipleState) {
      despachosTableRef.value.clearSendingMultipleState()
    }
  } catch (error: any) {
    console.error('Error al generar ODCs múltiples:', error)
    toast.error('Error al generar ODCs', error.message || 'No se pudieron generar las órdenes de compra')
    
    // Limpiar estado de envío múltiple en caso de error
    if (despachosTableRef.value?.clearSendingMultipleState) {
      despachosTableRef.value.clearSendingMultipleState()
    }
  } finally {
    generandoODC.value = false
    progresoGenerarODC.value = 0
  }
}

// Funciones de integración individuales
async function handleIntegrarOC(referenciaDespacho: string) {
  // Verificar que no esté ya ejecutándose
  if (procesoStore.loading || ordenesCompraStore.loading) {
    return
  }
  
  try {
    // Establecer loading en procesoStore para mostrar el overlay
    procesoStore.loading = true
    procesoStore.currentStep = 'integrar-sap'
    procesoStore.progress = 0
    
    // Esperar a que Vue actualice el DOM para que el overlay aparezca
    await nextTick()
    
    toast.info('Enviando orden a SAP...', `Enviando ${referenciaDespacho}`)
    
    // Simular progreso mientras se envía
    procesoStore.progress = 50
    
    // Usar el servicio directamente para enviar la orden
    await mba3ConsultasService.integrarSAP(referenciaDespacho)
    
    // Completar el progreso
    procesoStore.progress = 100
    
    // Pequeño delay para mostrar el 100% antes de ocultar
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast.success('Orden enviada', 'La orden se ha enviado correctamente a SAP')
    // Actualizar datos después del envío
    await ordenesCompraStore.fetchEstadisticas()
    await cargarOrdenesCompraPendientes()
    // Limpiar el estado de envío en el componente hijo
    if (ordenCompraTableRef.value?.clearSendingState) {
      ordenCompraTableRef.value.clearSendingState()
    }
  } catch (error: any) {
    console.error('Error al integrar ODC:', error)
    toast.error('Error al integrar', error.message || 'No se pudo enviar la orden a SAP')
    // Limpiar el estado de envío incluso si hay error
    if (ordenCompraTableRef.value?.clearSendingState) {
      ordenCompraTableRef.value.clearSendingState()
    }
  } finally {
    // Asegurar que el loading se limpie
    procesoStore.loading = false
    procesoStore.currentStep = null
    procesoStore.progress = 0
  }
}

async function handleIntegrarOCMultiples(referencias: string[]) {
  // Verificar que no esté ya ejecutándose
  if (procesoStore.loading || ordenesCompraStore.loading) {
    return
  }
  
  try {
    if (referencias.length === 0) {
      toast.warning('No hay órdenes seleccionadas para enviar')
      return
    }

    // Establecer loading en procesoStore para mostrar el overlay
    procesoStore.loading = true
    procesoStore.currentStep = 'integrar-sap'
    procesoStore.progress = 0
    
    // Esperar a que Vue actualice el DOM para que el overlay aparezca
    await nextTick()

    toast.info('Enviando órdenes a SAP...', `Enviando ${referencias.length} orden(es) a SAP`)
    
    // Usar el servicio directamente para enviar las órdenes
    // Si es una sola referencia, enviarla directamente
    if (referencias.length === 1) {
      procesoStore.progress = 50
      await mba3ConsultasService.integrarSAP(referencias[0])
    } else {
      // Si son múltiples, enviar todas en una sola llamada
      // Simular progreso progresivo
      procesoStore.progress = 30
      await mba3ConsultasService.integrarSAP(referencias)
    }
    
    // Completar el progreso
    procesoStore.progress = 100
    
    // Pequeño delay para mostrar el 100% antes de ocultar
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast.success('Órdenes enviadas', `Se han enviado ${referencias.length} orden(es) a SAP exitosamente`)
    // Actualizar datos después del envío
    await ordenesCompraStore.fetchEstadisticas()
    await cargarOrdenesCompraPendientes()
    
    // Limpiar el estado de envío múltiple en el componente hijo
    if (ordenCompraTableRef.value?.clearSendingMultipleState) {
      ordenCompraTableRef.value.clearSendingMultipleState()
    }
    
    // Limpiar la selección después de enviar exitosamente
    if (ordenCompraTableRef.value?.clearSelection) {
      ordenCompraTableRef.value.clearSelection()
    }
  } catch (error: any) {
    console.error('Error al integrar múltiples ODCs:', error)
    toast.error('Error al integrar', error.message || 'No se pudieron enviar todas las órdenes')
    
    // Limpiar el estado de envío múltiple incluso si hay error
    if (ordenCompraTableRef.value?.clearSendingMultipleState) {
      ordenCompraTableRef.value.clearSendingMultipleState()
    }
  } finally {
    // Asegurar que el loading se limpie
    procesoStore.loading = false
    procesoStore.currentStep = null
    procesoStore.progress = 0
  }
}

async function handleEliminarOC(ocIds: string[]) {
  try {
    if (!ocIds || ocIds.length === 0) {
      toast.warning('No hay órdenes seleccionadas para eliminar')
      return
    }

    // Confirmar eliminación
    const confirmMessage = ocIds.length === 1 
      ? '¿Estás seguro de que deseas eliminar esta orden de compra? Esta acción no se puede deshacer.'
      : `¿Estás seguro de que deseas eliminar ${ocIds.length} órdenes de compra? Esta acción no se puede deshacer.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    eliminando.value = true
    progresoEliminar.value = 0
    
    // Simular progreso durante la eliminación
    const progressInterval = setInterval(() => {
      if (progresoEliminar.value < 90) {
        progresoEliminar.value += 10
      }
    }, 200)

    toast.info('Eliminando órdenes...', `Eliminando ${ocIds.length} orden(es) de compra`)
    
    await mba3ConsultasService.deleteOrdenesCompra(ocIds.length === 1 ? ocIds[0] : ocIds)
    
    clearInterval(progressInterval)
    progresoEliminar.value = 100
    
    // Pequeño delay para mostrar el 100%
    await new Promise(resolve => setTimeout(resolve, 300))
    
    toast.success('Órdenes eliminadas', `${ocIds.length} orden(es) de compra eliminada(s) exitosamente`)
    
    // Actualizar datos
    await ordenesCompraStore.fetchEstadisticas()
    await cargarOrdenesCompraPendientes()
    
    // Actualizar el total del store basándose en las estadísticas actualizadas
    // Esto asegura que el badge del tab se actualice correctamente
    ordenesCompraStore.total = ordenesCompraStore.pendientes + ordenesCompraStore.enviadas + ordenesCompraStore.errores
    
    // Limpiar la selección después de eliminar exitosamente
    if (ordenCompraTableRef.value?.clearSelection) {
      ordenCompraTableRef.value.clearSelection()
    }
  } catch (error: any) {
    console.error('Error al eliminar órdenes:', error)
    toast.error('Error al eliminar órdenes', error.message || 'No se pudieron eliminar las órdenes de compra')
  } finally {
    eliminando.value = false
    progresoEliminar.value = 0
  }
}

// Cargar estadísticas al montar el componente
onMounted(async () => {
  await ordenesCompraStore.fetchEstadisticas()
  // Siempre cargar despachos al montar para asegurar que la información esté actualizada
  await cargarDespachos()
})

function getStepStatus(step: string): 'pending' | 'active' | 'completed' | 'error' | 'retry' {
  if (!procesoStore.currentStep && !procesoStore.resultados) return 'pending'
  
  const stepOrder = ['migrar', 'procesar-oc']
  const currentIndex = stepOrder.indexOf(procesoStore.currentStep || '')
  const stepIndex = stepOrder.indexOf(step)
  
  if (procesoStore.error) {
    if (stepIndex === currentIndex) {
      // Si es el error específico de consulta MBA3, devolver 'retry' en lugar de 'error'
      if (isConsultaMBA3Error(procesoStore.error)) {
        return 'retry'
      }
      return 'error'
    }
    if (stepIndex < currentIndex) return 'completed'
    return 'pending'
  }
  
  if (procesoStore.resultados && !procesoStore.loading) {
    if (step === 'migrar' && procesoStore.resultados.metadata?.save_status) return 'completed'
    // La pestaña procesar-oc ahora también envía a SAP, así que verifica integrarSAP
    if (step === 'procesar-oc' && procesoStore.resultados.integrarSAP) return 'completed'
  }
  
  if (procesoStore.loading) {
    if (procesoStore.currentStep === 'integrar-sap') {
      // Si está ejecutando integración SAP, la pestaña procesar-oc debería mostrarse como activa
      if (step === 'procesar-oc') return 'active'
      if (stepIndex < currentIndex) return 'completed'
      return 'pending'
    }
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }
  
  return 'pending'
}

function getStepTitle(step: string): string {
  const titles: Record<string, string> = {
    'migrar': 'Importar despachos',
    'procesar-oc': 'Procesar ODC'
  }
  return titles[step] || step
}

function getStepDescription(step: string): string {
  const descriptions: Record<string, string> = {
    'migrar': 'Importa y almacena las prefacturas en el sistema',
    'procesar-oc': 'Envía órdenes de compra a SAP'
  }
  return descriptions[step] || ''
}

function getProcesoCardClass(step: string): string {
  const status = getStepStatus(step)
  
  const baseColors: Record<string, string> = {
    'migrar': 'border-violet-200/50 bg-gradient-to-br from-violet-50/80 to-violet-100/60',
    'procesar-oc': 'border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-emerald-100/60'
  }
  
  const baseColor = baseColors[step] || 'border-gray-200/50 bg-gradient-to-br from-gray-50/80 to-gray-100/60'
  
  if (status === 'retry') return 'border-yellow-300/50 bg-gradient-to-br from-yellow-50/80 to-yellow-100/60'
  if (status === 'error') return 'border-red-300/50 bg-gradient-to-br from-red-50/80 to-red-100/60'
  if (status === 'active') {
    const activeColors: Record<string, string> = {
      'migrar': 'border-violet-300/60 bg-gradient-to-br from-violet-100/90 to-violet-200/70 shadow-2xl',
      'procesar-oc': 'border-emerald-300/60 bg-gradient-to-br from-emerald-100/90 to-emerald-200/70 shadow-2xl'
    }
    return activeColors[step] || 'border-blue-300/60 bg-gradient-to-br from-blue-100/90 to-blue-200/70 shadow-xl'
  }
  if (status === 'completed') {
    const completedColors: Record<string, string> = {
      'migrar': 'border-violet-300/50 bg-gradient-to-br from-violet-100/80 to-violet-200/60',
      'procesar-oc': 'border-emerald-300/50 bg-gradient-to-br from-emerald-100/80 to-emerald-200/60'
    }
    return completedColors[step] || 'border-green-200/50 bg-gradient-to-br from-green-100/80 to-green-200/60'
  }
  return baseColor
}

function getProcesoIconClass(step: string): string {
  const status = getStepStatus(step)
  
  const pendingColors: Record<string, string> = {
    'migrar': 'bg-gradient-to-br from-violet-200/90 to-violet-300/80 text-violet-700 border-violet-300/60',
    'procesar-oc': 'bg-gradient-to-br from-emerald-200/90 to-emerald-300/80 text-emerald-700 border-emerald-300/60'
  }
  
  if (status === 'retry') return 'bg-gradient-to-br from-yellow-400/90 to-yellow-500/80 text-white border-yellow-500/60'
  if (status === 'error') return 'bg-gradient-to-br from-red-400/90 to-red-500/80 text-white border-red-500/60'
  if (status === 'active') {
    const activeColors: Record<string, string> = {
      'migrar': 'bg-gradient-to-br from-violet-400/90 to-violet-500/80 text-white border-violet-500/60 animate-pulse shadow-lg shadow-violet-300/50',
      'procesar-oc': 'bg-gradient-to-br from-emerald-400/90 to-emerald-500/80 text-white border-emerald-500/60 animate-pulse shadow-lg shadow-emerald-300/50'
    }
    return activeColors[step] || 'bg-gradient-to-br from-blue-400/90 to-blue-500/80 text-white border-blue-500/60 animate-pulse shadow-lg'
  }
  if (status === 'completed') {
    const completedColors: Record<string, string> = {
      'migrar': 'bg-gradient-to-br from-violet-500/90 to-violet-600/80 text-white border-violet-600/60 shadow-lg',
      'procesar-oc': 'bg-gradient-to-br from-emerald-500/90 to-emerald-600/80 text-white border-emerald-600/60 shadow-lg'
    }
    return completedColors[step] || 'bg-gradient-to-br from-green-400/90 to-green-500/80 text-white border-green-500/60 shadow-lg'
  }
  return pendingColors[step] || 'bg-gradient-to-br from-gray-200/90 to-gray-300/80 text-gray-500 border-gray-300/60'
}

function getProcesoOverlayClass(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'retry') {
    return 'bg-gradient-to-br from-yellow-100/30 via-transparent to-transparent'
  }
  if (status === 'error') {
    return 'bg-gradient-to-br from-red-100/30 via-transparent to-transparent'
  }
  return 'bg-gradient-to-br from-white/20 via-transparent to-transparent'
}

function getButtonClass(step: string): string {
  const status = getStepStatus(step)
  
  const pendingButtonColors: Record<string, string> = {
    'migrar': 'bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700',
    'procesar-oc': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
  }
  
  if (status === 'completed') {
    const completedColors: Record<string, string> = {
      'migrar': 'bg-gradient-to-r from-violet-200/90 to-violet-300/80 text-violet-800 hover:from-violet-300 hover:to-violet-400 border border-violet-300/50',
      'procesar-oc': 'bg-gradient-to-r from-emerald-200/90 to-emerald-300/80 text-emerald-800 hover:from-emerald-300 hover:to-emerald-400 border border-emerald-300/50'
    }
    return completedColors[step] || 'bg-gradient-to-r from-green-100/90 to-green-200/80 text-green-800 hover:from-green-200 hover:to-green-300 border border-green-300/50'
  }
  if (status === 'active') {
    const activeColors: Record<string, string> = {
      'migrar': 'bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:from-violet-700 hover:to-violet-800 shadow-lg shadow-violet-500/30',
      'procesar-oc': 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/30'
    }
    return activeColors[step] || 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
  }
  if (status === 'retry') {
    return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/30'
  }
  if (status === 'error') {
    return 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30'
  }
  return pendingButtonColors[step] || 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700'
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
  
  const pendingTextColors: Record<string, string> = {
    'migrar': 'text-violet-600',
    'procesar-oc': 'text-emerald-600'
  }
  
  if (status === 'active') {
    const activeColors: Record<string, string> = {
      'migrar': 'text-violet-700',
      'procesar-oc': 'text-emerald-700'
    }
    return activeColors[step] || 'text-blue-600'
  }
  if (status === 'completed') {
    const completedColors: Record<string, string> = {
      'migrar': 'text-violet-700',
      'procesar-oc': 'text-emerald-700'
    }
    return completedColors[step] || 'text-green-600'
  }
  if (status === 'error') return 'text-red-600'
  return pendingTextColors[step] || 'text-gray-500'
}

</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-15deg);
  }
  100% {
    transform: translateX(200%) skewX(-15deg);
  }
}

@keyframes progress-bar {
  0% {
    transform: translateX(-100%);
    width: 0%;
  }
  50% {
    transform: translateX(0%);
    width: 100%;
  }
  100% {
    transform: translateX(100%);
    width: 0%;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-progress-bar {
  animation: progress-bar 1.5s ease-in-out infinite;
}
</style>