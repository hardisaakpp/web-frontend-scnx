<template>
  <!-- Overlay de bloqueo durante la carga de plantilla Excel con barra de progreso -->
  <Teleport to="body">
    <div 
      v-if="uploading"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
      @click.prevent
      @mousedown.prevent
      @mouseup.prevent
      @touchstart.prevent
      @touchmove.prevent
      @touchend.prevent
    >
      <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center transition-all duration-300 border border-white/30 dark:border-gray-600/30 relative overflow-hidden">
        <!-- Efecto de fondo animado -->
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-600/5 pointer-events-none"></div>
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
        
        <div class="relative z-10 flex flex-col items-center gap-5">
          <!-- Spinner con efecto de pulso -->
          <div class="relative">
            <svg class="animate-spin h-14 w-14 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="absolute inset-0 border-2 border-emerald-300/30 dark:border-emerald-500/30 rounded-full animate-ping"></div>
          </div>
          
          <div class="w-full">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Cargando Plantilla Excel</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">{{ uploadMessage || 'Preparando archivo...' }}</p>
            
            <!-- Barra de progreso -->
            <div class="w-full space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400 font-medium">
                  {{ uploadFase === 'upload' ? 'Subiendo archivo' : (uploadFase === 'processing' ? 'Procesando en servidor' : 'Preparando') }}
                </span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden shadow-inner">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                  :style="{ width: `${uploadProgress}%` }"
                >
                  <!-- Efecto shimmer sobre la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  <!-- Efecto de pulso en la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Indicadores de fase -->
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'upload' || uploadFase === 'processing' || uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Subir</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'processing' || uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Validar</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Guardar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal de bloqueo al enviar ODC a SAP con barra de progreso -->
  <Teleport to="body">
    <div
      v-if="enviandoOdcSap"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
      @click.prevent
      @mousedown.prevent
      @mouseup.prevent
      @touchstart.prevent
      @touchmove.prevent
      @touchend.prevent
    >
      <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center transition-all duration-300 border border-white/30 dark:border-gray-600/30 relative overflow-hidden">
        <!-- Efecto de fondo animado -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-600/5 pointer-events-none"></div>
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
        
        <div class="relative z-10 flex flex-col items-center gap-5">
          <!-- Spinner con efecto de pulso -->
          <div class="relative">
            <svg class="animate-spin h-14 w-14 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="absolute inset-0 border-2 border-blue-300/30 dark:border-blue-500/30 rounded-full animate-ping"></div>
          </div>
          
          <div class="w-full">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Enviando ODC a SAP</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">{{ sapMessage || 'Preparando proceso...' }}</p>
            <p
              v-if="sapAvisoEsperaLarga"
              class="text-xs text-amber-600 dark:text-amber-400 mb-2 transition-colors duration-300"
            >
              {{ SAP_SLOW_SYNC_LIKELY_MESSAGE }}
            </p>

            <!-- Barra de progreso -->
            <div class="w-full space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400 font-medium">Progreso del proceso</span>
                <span class="text-blue-600 dark:text-blue-400 font-bold">{{ sapProgress }}%</span>
              </div>
              <div class="w-full h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden shadow-inner">
                <div
                  class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                  :style="{ width: `${sapProgress}%` }"
                >
                  <!-- Efecto shimmer sobre la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  <!-- Efecto de pulso en la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Indicadores de fase (3 pasos) -->
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                sapFase === 'redistribucion' || sapFase === 'generando' || sapFase === 'enviando' || sapFase === 'complete' 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Redistribuir</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                sapFase === 'generando' || sapFase === 'enviando' || sapFase === 'complete' 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Generar ODC</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                sapFase === 'enviando' || sapFase === 'complete' 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Enviar SAP</span>
            </div>
          </div>
          
          <p class="text-xs text-gray-500 dark:text-gray-400">No cierre esta ventana. Este proceso puede tomar hasta 3 minutos.</p>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal de éxito SAP con botón Descargar PDF y tabla de Solicitudes de Transferencia -->
  <Teleport to="body">
    <div
      v-if="showSAPSuccessModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      @click.self="showSAPSuccessModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-auto border border-gray-200 dark:border-gray-600 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Proceso completado</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">{{ sapSuccessMessage || 'ODC enviada correctamente a SAP.' }}</p>

        <!-- Tabla Solicitudes de Transferencia (ITR): DocNum, Tienda, Nombre -->
        <div
          v-if="sapSuccessSolicitudesTransferencia?.resultados?.length"
          class="mb-4 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
        >
          <div class="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-600">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Solicitudes de Transferencia ({{ sapSuccessSolicitudesTransferencia.transferencias_creadas }} de {{ sapSuccessSolicitudesTransferencia.total_tiendas }})
            </span>
          </div>
          <div class="overflow-x-auto max-h-48 overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">DocNum (ITR)</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tienda</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="r in sapSuccessSolicitudesTransferencia.resultados"
                  :key="r.tienda_codigo"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td class="px-3 py-2 whitespace-nowrap text-gray-900 dark:text-white font-medium">{{ r.doc_num ?? '—' }}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{{ r.tienda_codigo }}</td>
                  <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ r.tienda_nombre ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button
            v-if="sapSuccessOcId"
            type="button"
            class="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
            :disabled="descargandoSAPPDF"
            @click="handleDescargarSAPPDF"
          >
            {{ descargandoSAPPDF ? 'Descargando...' : 'Descargar PDF' }}
          </button>
          <button
            type="button"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            @click="closeSAPSuccessModal"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6" :class="{ 'pointer-events-none opacity-75': uploading || enviandoOdcSap }">
      <!-- Header con botones de acción -->
      <PedidoHeaderActions
        v-model:pedido-id-input="pedidoIdInput"
        v-model:show-search-help="showSearchHelp"
        :titulo-interfaz="tituloInterfaz"
        :pedido-input-ref="pedidoInputRef as any"
        :is-valid-pedido="isValidPedido"
        :uploading="uploading"
        :loading="loading"
        :generando-o-c="generandoOC"
        :confirmando="confirmando"
        :descargando-plano-mba="descargandoPlanoMba"
        :can-generar-o-c="canGenerarOC"
        :es-modo-mabel-trading="esModoMabelTrading"
        :pedido="pedido"
        :hide-confirm-and-download="true"
        :show-crear-pedido="false"
        :hide-cargar-plantillas="!pedido"
        :show-finalizar-pedido="true"
        :puede-finalizar-pedido="puedeFinalizarPedido"
        :finalizando-pedido="finalizandoPedido"
        @cargar-plantillas="goToCargarPlantillas"
        @generar-oc="handleGenerarOCDesdePedido"
        @confirmar="handleConfirmar"
        @go-to-pedido="goToPedidoWrapper"
        @search-blur="handleSearchBlur"
        @descargar-plano-mba="handleDescargarPlanoMba"
        @crear-pedido="handleCrearPedido"
        @finalizar-pedido="handleFinalizarPedido"
      >
        <template v-if="pedido && !loading" #toolbar-extra>
          <button
            type="button"
            @click="handleDescargarMargenExcel"
            :disabled="descargandoMargen"
            class="shrink-0 px-4 py-2 bg-emerald-700 dark:bg-emerald-600 text-white rounded-lg hover:bg-emerald-800 dark:hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Descargar el análisis completo del Margen de Rentabilidad por producto"
          >
            <svg v-if="!descargandoMargen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ descargandoMargen ? 'Descargando...' : 'Descargar Análisis de Margen' }}
          </button>
          <button
            type="button"
            @click="handleDescartar"
            :disabled="descartando || !(pedido?.puede_descartar ?? false)"
            class="shrink-0 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ descartando ? 'Descartando...' : 'Descartar' }}
          </button>
          <button
            v-if="puedeRechazarProduccionPospuesta"
            type="button"
            @click="handleRechazarProduccionPospuesta"
            :disabled="cancelandoPedidoPospuesto"
            class="shrink-0 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ cancelandoPedidoPospuesto ? 'Rechazando...' : 'Rechazar' }}
          </button>
          <button
            v-if="puedeAceptarProduccionPospuesta"
            type="button"
            @click="handleAceptarProduccionPospuesta"
            :disabled="aceptandoProduccionPospuesta"
            class="shrink-0 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ aceptandoProduccionPospuesta ? 'Aceptando...' : 'Aceptar' }}
          </button>
          <button
            v-if="esPedidoBorrador"
            type="button"
            @click="handleEnviar"
            :disabled="enviando"
            class="shrink-0 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ enviando ? 'Enviando...' : 'Enviar' }}
          </button>
        </template>
      </PedidoHeaderActions>

      <!-- Finalizado (Enviar y Descartar van en la fila de PedidoHeaderActions) -->
      <div
        v-if="pedido && !loading && showBotonFinalizado"
        class="flex items-center justify-end gap-3"
      >
        <button
          type="button"
          @click="handleFinalizado"
          :disabled="finalizando"
          class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ finalizando ? 'Finalizando...' : 'Finalizado' }}
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading && !pedido" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <LoadingSpinner message="Cargando pedido..." />
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

      <!-- Estado inicial: cuando no hay pedido, no está cargando y no hay error -->
      <div v-if="!pedido && !loading && !error" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
          <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Busca o carga un pedido</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Usa el campo de búsqueda en el header para buscar un pedido por número, o carga una plantilla Excel.
        </p>
        <div class="flex items-center justify-center gap-3">
          <button
            @click="goToCargarPlantillas"
            :disabled="uploading"
            class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            title="Cargar plantilla Excel"
          >
            <svg v-if="!uploading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <LoadingSpinner v-else layout="inline" size="sm" color="current" aria-label="Cargando plantilla Excel" />
            {{ uploading ? 'Cargando...' : 'Cargar Plantillas Excel' }}
          </button>
        </div>
      </div>

      <!-- Contenido del pedido -->
      <div v-if="pedido && !loading">
        <!-- Información de la cabecera -->
        <PedidoCabecera
          :pedido="pedido"
          :copy-feedback="copyFeedback"
          :editable="!esModoMabelTrading"
          :editable-estado="false"
          :default-expanded="!esModoMabelTrading"
          :show-inmediato-option="true"
          @copy-to-clipboard="copyToClipboard"
          @update-fecha-pedido="handleUpdateFechaPedido"
          @update-fecha-entrega="handleUpdateFechaEntrega"
          @update-estado="handleUpdateEstado"
        />

        <!-- Job SAP async aún en Celery (p. ej. tras timeout del navegador) -->
        <div
          v-if="odcSapProcesoEnServidor && !enviandoOdcSap"
          class="mb-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/25 px-4 py-3 text-sm text-blue-900 dark:text-blue-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p class="flex-1">
            Hay un envío a SAP en proceso en el servidor. Puede seguir el progreso sin iniciar otro envío.
          </p>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium whitespace-nowrap shrink-0"
            @click="handleEnviarOdcSap"
          >
            Seguir progreso
          </button>
        </div>

        <!-- Fallo transitorio SAP (retry_recommended): mismo flujo que "Enviar ODC a SAP" -->
        <div
          v-if="mostrarBannerReintentoConexionSap"
          class="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/25 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p class="flex-1">
            Fallo temporal de conexión con SAP. Puede volver a intentar el envío.
          </p>
          <button
            type="button"
            :disabled="enviandoOdcSap || pedido?.puede_reintentar_envio_odc_sap !== true || !puedeConfirmarRedistribucion"
            class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium whitespace-nowrap shrink-0"
            @click="handleEnviarOdcSap"
          >
            <LoadingSpinner v-if="enviandoOdcSap" layout="inline" size="sm" color="current" aria-label="Reintentando envío a SAP" />
            {{
              enviandoOdcSap
                ? 'Reintentando…'
                : (pedido?.puede_reintentar_envio_odc_sap === true ? 'Reintentar envío a SAP' : 'No aplica reintento')
            }}
          </button>
        </div>

        <!-- ⭐ FASE 4: Ajuste y Redistribución a Tiendas -->
        <RedistribucionTiendas
          :pedido="pedido"
          :es-modo-mabel-trading="esModoMabelTrading"
          :productos-redistribucion="redistribucion.productosRedistribucion"
          :productos-expandidos="redistribucion.productosExpandidos"
          :guardando-redistribucion="redistribucion.guardandoRedistribucion"
          :confirmando-redistribucion="redistribucion.confirmandoRedistribucion"
          :confirmar-deshabilitado-por-estado="confirmarRedistribucionDeshabilitadoPorEstado"
          :columnas-modificadas="columnasModificadas as unknown as Ref<Set<string>>"
          :show-enviar-odc-sap="showEnviarOdcSapButton"
          :enviando-odc-sap="enviandoOdcSap"
          @toggle-expandir-producto="toggleExpandirProducto"
          @actualizar-cantidad-tienda="actualizarCantidadTienda"
          @validar-y-corregir-cantidad="validarYCorregirCantidad"
          @distribuir-proporcionalmente="distribuirProporcionalmente"
          @copiar-distribucion-original="copiarDistribucionOriginal"
          @resetear-distribucion="resetearDistribucion"
          @guardar-borrador="guardarBorradorRedistribucion"
          @confirmar-redistribucion="confirmarRedistribucion"
          @enviar-odc-sap="handleEnviarOdcSap"
        />

        <!-- Detalles del pedido (tabla de productos) -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Productos del Pedido</h2>
            <div class="relative">
              <button
                @click="showColumnSelector = !showColumnSelector"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Columnas
              </button>
              
              <!-- Dropdown de selección de columnas -->
              <div
                v-if="showColumnSelector"
                @click.stop
                class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3"
              >
                <div class="flex items-center justify-between mb-2 px-2">
                  <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Seleccionar columnas</div>
                  <div v-if="isSyncing" class="flex items-center gap-1">
                    <LoadingSpinner layout="inline" size="xs" aria-label="Guardando preferencias" />
                    <span class="text-xs text-indigo-600 dark:text-indigo-400">Guardando...</span>
                  </div>
                </div>
                <div class="space-y-1 max-h-80 overflow-y-auto">
                  <label
                    v-for="column in availableColumnsWithVisibility"
                    :key="column.key"
                    :class="[
                      'flex items-center gap-2 px-2 py-2 rounded transition-colors',
                      column.fixed 
                        ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                    ]"
                  >
                    <input
                      type="checkbox"
                      :checked="column.visible"
                      :disabled="column.fixed"
                      @change="!column.fixed && toggleColumnVisibility(column.key)"
                      class="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ column.label }}
                      <span v-if="column.fixed" class="text-xs text-gray-500 dark:text-gray-500 ml-1">(fija)</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    v-for="(column, index) in orderedVisibleColumns"
                    :key="column.key"
                    :draggable="!column.fixed"
                    @dragstart="!column.fixed && handleDragStart($event, column.key)"
                    @dragover.prevent="!column.fixed && handleDragOver($event, column.key)"
                    @dragleave="!column.fixed && handleDragLeave()"
                    @drop.prevent="!column.fixed && handleDrop($event, column.key)"
                    @dragend="!column.fixed && handleDragEnd()"
                    :class="[
                      'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none',
                      column.fixed ? 'cursor-default' : 'cursor-move',
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                      draggedColumnKey === column.key ? 'opacity-50 bg-indigo-100 dark:bg-indigo-900' : '',
                      dragOverColumnKey === column.key && draggedColumnKey !== null ? 'border-l-4 border-indigo-500' : ''
                    ]"
                  >
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr 
                  v-for="(detalle, detalleIndex) in pedido.detalles" 
                  :key="detalle.pedido_detalle_id"
                >
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-4 text-sm',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : column.align === 'center' ? 'text-center whitespace-nowrap' : '',
                      isColumnaModificada(detalle.pedido_detalle_id, column.key) && column.key !== 'numero'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500 dark:border-amber-400'
                        : '',
                      column.key === 'codigo_interno' && detalle.codigo_interno != null && isCodigoCorregidoHighlight(detalle.codigo_interno)
                        ? 'bg-emerald-50 dark:bg-emerald-900/25 border-l-2 border-emerald-500 dark:border-emerald-400'
                        : '',
                      column.key === 'numero' ? 'font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50' :
                      column.key === 'codigo_interno' ? 'font-medium text-gray-900 dark:text-white whitespace-nowrap' :
                      column.key === 'total' ? 'font-medium text-gray-900 dark:text-white' :
                      column.key === 'descripcion_sap' ? 'text-gray-900 dark:text-white' :
                      column.key === 'costo_doc_sin_iva' ? '' :
                      column.key === 'comentario' ? '' :
                      'text-gray-500 dark:text-gray-400 whitespace-nowrap'
                    ]"
                    :data-column-key="column.key"
                    :data-detalle-id="detalle.pedido_detalle_id"
                    @dblclick="false"
                  >
                    <!-- Mostrar input si estamos editando esta celda -->
                    <template v-if="editingCell?.detalleId === detalle.pedido_detalle_id && ((column.key === 'costo_doc_sin_iva' && editingCell.fieldType === 'costo') || (column.key === 'total' && editingCell.fieldType === 'total') || (column.key === 'comentario' && editingCell.fieldType === 'comentario'))">
                      <input
                        v-if="column.key !== 'comentario'"
                        :data-editing-cell="detalle.pedido_detalle_id"
                        v-model="editingCell.value"
                        type="number"
                        :step="editingCell.fieldType === 'total' ? '0.5' : '0.01'"
                        :inputmode="editingCell.fieldType === 'total' ? 'numeric' : 'decimal'"
                        min="0"
                        @blur="guardarEdicion"
                        @keydown="manejarTeclasEdicion"
                        @click.stop
                        :title="editingCell.fieldType === 'total' ? 'Solo múltiplos de 0,5. Escriba números; use flechas para 0,5, 1,5…' : undefined"
                        class="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                      <textarea
                        v-else
                        :data-editing-cell="detalle.pedido_detalle_id"
                        v-model="editingCell.value"
                        @blur="guardarEdicion"
                        @keydown="manejarTeclasEdicion"
                        @click.stop
                        rows="2"
                        placeholder="Ingrese un comentario..."
                        class="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                      />
                    </template>
                    <!-- Mostrar valor normal si no estamos editando -->
                    <template v-else>
                      <span v-if="column.key === 'comentario' && detalle.comentario" class="text-gray-700 dark:text-gray-300">{{ detalle.comentario }}</span>
                      <span v-else-if="column.key === 'comentario' && !detalle.comentario" class="text-gray-400 dark:text-gray-500 italic text-xs">Sin comentario</span>
                      <template v-else>{{ formatColumnValue(detalle, column, detalleIndex) }}</template>
                    </template>
                  </td>
                </tr>
                <!-- Fila de totales -->
                <tr v-if="pedido && pedido.detalles && pedido.detalles.length > 0" class="bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-3 text-sm',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : column.align === 'center' ? 'text-center whitespace-nowrap' : 'text-left',
                      'text-gray-900 dark:text-white'
                    ]"
                  >
                    <template v-if="column.key === 'numero'">
                      <span class="sr-only"></span>
                    </template>
                    <template v-else-if="column.key === 'costo_doc_sin_iva'">
                      {{ formatCurrencyWithDecimals(totalesCostoUnitario, 4) }}
                    </template>
                    <template v-else-if="column.key === 'subtotal'">
                      {{ formatNumber(totalesSubtotal) }}
                    </template>
                    <template v-else-if="column.key === 'total'">
                      {{ formatNumber(totalesTotal) }}
                    </template>
                    <template v-else-if="column.key === 'codigo_interno'">
                      <span class="text-gray-600 dark:text-gray-400 font-medium">TOTALES</span>
                    </template>
                    <template v-else>
                      <span class="sr-only"></span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para errores de validación del archivo -->
    <UploadErrorModal
      v-model="showErrorModal"
      :upload-error-info="uploadErrorInfo"
      :show-data-protection-message="true"
      @apply-corrections="aplicarCorreccionesYContinuar"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Ref } from '@vue/reactivity'
import { onMounted, onActivated, onUnmounted, nextTick, Teleport } from '@vue/runtime-core'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { lastNotification } from '@/composables/useNotificaciones'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { mba3ConsultasService, extractErrorMessage } from '../services/mba3ConsultasApi'
import type { PedidoCompleto, ReporteDiferenciasResponse, UploadPlantillaResponse } from '../types'
// Utilidades extraídas
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatCurrencyWithDecimals,
  formatPorcentaje,
  formatEstadoPedido,
  formatColumnValue,
  getTotalCantidad,
  type ColumnConfig
} from '../utils/formatters'
import {
  getEstadoBadgeClass,
  getEstadoPedidoBadgeClass,
  getCantidadClass,
  getPrecioClass,
  getDiferenciaClass,
  getPorcentajeClass,
  getPorcentajeDiferenciaClass
} from '../utils/styleHelpers'
import {
  getProgresoPorcentaje,
  getProgresoBarClass,
  getProgresoTextClass,
  getMensajeValidacionRedistribucion,
  type ProductoRedistribucion,
  type DistribucionTiendaEditada
} from '../utils/redistribucionHelpers'
// Composables
import { useFileUpload, RESALTADO_CODIGOS_STORAGE_PREFIX } from '../composables/useFileUpload'
import type { CorreccionesPlantilla } from '../composables/useFileUpload'
import { useColumnManagement } from '../composables/useColumnManagement'
import { usePedidoDetalle } from '../composables/usePedidoDetalle'
import { useRedistribucion } from '../composables/useRedistribucion'
import {
  ejecutarProcesoCompletoSap,
  getPendingOdcSapProcessingState,
} from '../composables/ejecutarProcesoCompletoSap'
import { useSapProcessProgress } from '../composables/useSapProcessProgress'
import {
  isTransientClientError,
  SAP_MAY_STILL_PROCESSING_MESSAGE,
  SAP_SLOW_SYNC_LIKELY_MESSAGE,
} from '../utils/httpErrors'
// Componentes
import PedidoHeaderActions from '../components/PedidoHeaderActions.vue'
import PedidoCabecera from '../components/PedidoCabecera.vue'
import RedistribucionTiendas from '../components/RedistribucionTiendas.vue'
import UploadErrorModal from '../components/UploadErrorModal.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

// Constantes de configuración
const SCROLL_DELAY_MS = 100
const ROUTE_REDIRECT_DELAY_MS = 1500
const SEARCH_HELP_BLUR_DELAY_MS = 200
const COPY_FEEDBACK_DURATION_MS = 2000

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// ⭐ Función para manejar el click en "Crear Pedido Manual"
function handleCrearPedido() {
  router.push('/mba3-consultas/pedidos/crear')
}

const enviando = ref(false)
async function handleEnviar() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) {
    toast.warning('Sin pedido', 'No hay pedido cargado para enviar')
    return
  }
  if (!confirm('¿Deseas enviar este pedido a EL RAYO?')) return
  enviando.value = true
  try {
    const data = await mba3ConsultasService.enviarPedido(pedidoId)
    // Actualizar tanto el estado como el estado_id para que la interfaz refleje el cambio
    if (pedido.value?.cabecera) {
      pedido.value.cabecera.estado = data.estado_nombre
      pedido.value.cabecera.estado_id = data.estado_id
    }
    toast.success('Pedido enviado', data.message || 'El pedido se ha enviado correctamente')
    // Recargar el pedido completo para asegurar sincronización de todos los campos
    await loadPedido()
  } catch (e: any) {
    toast.error('Error al enviar', extractErrorMessage(e))
  } finally {
    enviando.value = false
  }
}

const descartando = ref(false)
async function handleDescartar() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) {
    toast.warning('Sin pedido', 'No hay pedido cargado para descartar')
    return
  }
  descartando.value = true
  try {
    await mba3ConsultasService.descartarPedido(pedidoId)
    pedido.value = null
    error.value = null
    router.push('/mba3-consultas/cargar-plantilla')
    toast.success('Pedido descartado', 'El pedido se ha eliminado correctamente')
  } catch (e: any) {
    toast.error('Error al descartar', extractErrorMessage(e))
  } finally {
    descartando.value = false
  }
}

const pedido = ref<PedidoCompleto | null>(null)

// ⭐ HU-08: Estado del modal de exportación MBA
// ⭐ HU-08: Descarga directa del archivo plano MBA (un clic, sin modal)
const descargandoPlanoMba = ref(false)

// Req. 1.4/1.5: descarga del Análisis de Margen de Rentabilidad
const descargandoMargen = ref(false)

// ⭐ Set para rastrear columnas modificadas (formato: "detalleId:columnKey")
const columnasModificadas = ref<Set<string>>(new Set())

// Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)
const confirmando = ref(false)
const draggedColumnKey = ref<string | null>(null)
const dragOverColumnKey = ref<string | null>(null)

// La interfaz EditingCell ahora está importada desde composables/useColumnManagement

// ⭐ Funciones para persistencia en sessionStorage (fallback/migración)
// ⚠️ NOTA: El backend es la fuente principal de verdad. sessionStorage solo se usa como fallback.
function getStorageKey(): string {
  return `pedido_columnas_modificadas_${numeroPedido.value}`
}

function guardarColumnasModificadasEnStorage() {
  if (!numeroPedido.value) return
  
  try {
    const storageKey = getStorageKey()
    const columnasArray = Array.from(columnasModificadas.value)
    sessionStorage.setItem(storageKey, JSON.stringify(columnasArray))
  } catch (e) {
    console.warn('Error al guardar columnas modificadas en sessionStorage (fallback):', e)
  }
}

function cargarColumnasModificadasDesdeStorage() {
  if (!numeroPedido.value) return
  
  // Solo cargar desde sessionStorage si no hay modificaciones ya cargadas desde el backend
  // Esto permite migración gradual de datos
  if (columnasModificadas.value.size > 0) {
    if (import.meta.env.DEV) console.log('ℹ️ [PedidoDetalleView] Modificaciones ya cargadas desde backend, omitiendo sessionStorage')
    return
  }
  
  try {
    const storageKey = getStorageKey()
    const stored = sessionStorage.getItem(storageKey)
    
    if (stored) {
      const columnasArray = JSON.parse(stored) as string[]
      // Limpiar antes de cargar desde storage
      columnasModificadas.value.clear()
      columnasModificadas.value = new Set(columnasArray)
      if (import.meta.env.DEV) console.log(`ℹ️ [PedidoDetalleView] Cargadas ${columnasArray.length} modificaciones desde sessionStorage (fallback)`)
    }
  } catch (e) {
    console.warn('Error al cargar columnas modificadas desde sessionStorage (fallback):', e)
  }
}

function limpiarColumnasModificadasEnStorage() {
  if (!numeroPedido.value) return
  
  try {
    const storageKey = getStorageKey()
    sessionStorage.removeItem(storageKey)
    columnasModificadas.value.clear()
  } catch (e) {
    console.warn('Error al limpiar columnas modificadas en sessionStorage:', e)
  }
}

// ⭐ EXTENSIÓN DEL TIPO: Agregar comentario al tipo PedidoDetalle localmente
// La interfaz ColumnConfig ahora está importada desde utils/formatters

// Por defecto: #, CÓDIGO, DESCRIPCIÓN, COSTO UNIT., TOTAL, COMENTARIO (dev y prod)
const availableColumns: ColumnConfig[] = [
  { key: 'numero', label: '#', visible: true, align: 'center', format: 'number', fixed: true },
  { key: 'codigo_interno', label: 'Código', visible: true, align: 'left', format: 'text' },
  { key: 'descripcion_sap', label: 'Descripción', visible: true, align: 'left', format: 'text' },
  { key: 'codigo_barras', label: 'Código de Barras', visible: false, align: 'left', format: 'text' },
  { key: 'pack', label: 'Pack', visible: false, align: 'left', format: 'text' },
  { key: 'costo_doc_sin_iva', label: 'Costo Unit.', visible: true, align: 'right', format: 'currency' },
  { key: 'descuento_1', label: 'Descuento', visible: false, align: 'right', format: 'number' },
  // Solo mabel.view: PVP (precio de venta al público) queda fuera del selector de
  // columnas para odcsap.view y produccion-elrayo.view (ver ocultar_pvp_si_no_mabel).
  ...(authStore.canViewMabel
    ? [{ key: 'pvp', label: 'PVP', visible: false, align: 'right' as const, format: 'currency' as const }]
    : []),
  { key: 'costo_margen', label: 'Costo', visible: true, align: 'right', format: 'currency' },
  { key: 'margen', label: 'Margen', visible: true, align: 'right', format: 'percent' },
  { key: 'subtotal', label: 'Subtotal', visible: false, align: 'right', format: 'number' },
  // Solo mabel.view: cantidad que Mabel Trading cargó originalmente en la plantilla Excel,
  // inmutable desde el INSERT (ver cantidad_solicitada_original en PedidoDetalleRepository.insert).
  ...(authStore.canViewMabel
    ? [{ key: 'cantidad_solicitada_original', label: 'Solicitado Mabel', visible: true, align: 'right', format: 'number' } as ColumnConfig]
    : []),
  { key: 'total', label: 'Total', visible: true, align: 'right', format: 'number' },
  { key: 'comentario', label: 'Comentario', visible: true, align: 'left', format: 'text' }
]

// ⭐ CAMBIO: Usar composable useTablePreferences
// Asegurar que la columna 'numero' esté siempre visible y al inicio
const defaultVisibleColumns = availableColumns.filter(col => col.visible || col.fixed).map(col => col.key)
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns: orderedVisibleColumnKeys,
  savePreferences,
  resetPreferences: resetTablePreferences,
  selectAllColumns: selectAllTableColumns,
  isSyncing
} = useTablePreferences({
  tableId: 'productos-pedido',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// ⭐ NUEVO: Computed para obtener objetos ColumnConfig ordenados
// Asegurar que la columna 'numero' siempre esté al inicio
const orderedVisibleColumns = computed(() => {
  const ordered = orderedVisibleColumnKeys.value
    .map(key => availableColumns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined)
  
  // Separar columnas fijas y no fijas
  const fixedColumns = ordered.filter(col => col.fixed)
  const nonFixedColumns = ordered.filter(col => !col.fixed)
  
  // Asegurar que 'numero' esté al inicio si existe
  const numeroColumn = fixedColumns.find(col => col.key === 'numero')
  const otherFixedColumns = fixedColumns.filter(col => col.key !== 'numero')
  
  // Reconstruir el orden: primero 'numero', luego otras fijas, luego no fijas
  return [
    ...(numeroColumn ? [numeroColumn] : []),
    ...otherFixedColumns,
    ...nonFixedColumns
  ]
})

// ⭐ NUEVO: Computed para obtener todas las columnas con su estado de visibilidad
const availableColumnsWithVisibility = computed(() => {
  return availableColumns.map(col => ({
    ...col,
    visible: col.fixed ? true : visibleColumns.value.includes(col.key)
  }))
})

// ⭐ Asegurar que la columna 'numero' siempre esté visible
watch(
  () => visibleColumns.value,
  (newVisible) => {
    if (!newVisible.includes('numero')) {
      visibleColumns.value = ['numero', ...newVisible.filter((key: string) => key !== 'numero')]
      savePreferences()
    }
  },
  { immediate: true }
)

// ⭐ Totales: usar pedido.totales del backend cuando exista; si no, recalcular desde detalles (fallback)
const totalesCostoUnitario = computed(() => {
  const t = pedido.value?.totales
  if (t != null && typeof t.total_costo_unitario === 'number') return t.total_costo_unitario
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.costo_doc_sin_iva || 0), 0)
})

const totalesSubtotal = computed(() => {
  const t = pedido.value?.totales
  if (t != null && typeof t.total_subtotal === 'number') return t.total_subtotal
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.subtotal || 0), 0)
})

const totalesTotal = computed(() => {
  const t = pedido.value?.totales
  if (t != null && typeof t.total_total === 'number') return t.total_total
  if (!pedido.value?.detalles) return 0
  return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.total || 0), 0)
})

// El parámetro de ruta ahora es numero_pedido
const numeroPedido = computed(() => {
  const id = route.params.id as string
  return id ? decodeURIComponent(id) : ''
})

/** Número de pedido para el que se muestra el botón "Finalizado" (solo Cargar plantilla, estado Despachar y Facturar). */
const NUMERO_PEDIDO_FINALIZADO = 'P-12.01 - 12 - 2025'
const showBotonFinalizado = computed(() =>
  numeroPedido.value === NUMERO_PEDIDO_FINALIZADO && pedido.value?.cabecera?.estado_id === 17
)
const finalizando = ref(false)

// ⭐ Botón "Finalizar Pedido" en PedidoHeaderActions (usa flag puede_finalizar del backend)
const finalizandoPedido = ref(false)
const puedeFinalizarPedido = computed(() => pedido.value?.puede_finalizar === true)

// Req. 1.2: botones "Rechazar" / "Aceptar" sobre un pedido "hijo" en Producción Pospuesta
// (estado_id 22), exclusivos de mabel.view. Mismo par que en PedidoDetalleView.vue.
const cancelandoPedidoPospuesto = ref(false)
const aceptandoProduccionPospuesta = ref(false)
const puedeRechazarProduccionPospuesta = computed(() => {
  if (!authStore.canViewMabel) return false
  return pedido.value?.cabecera?.estado_id === 22 && pedido.value?.puede_cancelar_pedido === true
})
const puedeAceptarProduccionPospuesta = computed(() => {
  if (!authStore.canViewMabel) return false
  return pedido.value?.cabecera?.estado_id === 22 && pedido.value?.puede_aceptar_produccion_pospuesta === true
})

// ⭐ Botón "Enviar ODC a SAP" (proceso completo: redistribución + ODC + SAP)
const enviandoOdcSap = ref(false)
/** La visibilidad depende de la vista; la habilitación del reintento depende del flag backend. */
const showEnviarOdcSapButton = computed(() => true)
/** Banner + CTA cuando proceso-completo-sap devuelve retry_recommended (fallo transitorio). */
const mostrarBannerReintentoConexionSap = ref(false)
/** Celery aún procesando un envío SAP previo (sessionStorage + GET resultado). */
const odcSapProcesoEnServidor = ref(false)

const {
  sapProgress,
  sapFase,
  sapMessage,
  sapAvisoEsperaLarga,
  resetSapProgress,
  startSapProgressSimulation,
  applySapPollingUpdate,
  marcarPosibleEsperaLarga,
  completeSapProgress,
  stopSimulation: stopSapProgressSimulation,
} = useSapProcessProgress()

// Modal de éxito SAP y PDF
const showSAPSuccessModal = ref(false)
const sapSuccessOcId = ref<string | null>(null)
const sapSuccessMessage = ref('')
const sapSuccessSolicitudesTransferencia = ref<import('@/modules/mba3-consultas/types').SolicitudesTransferencia | null>(null)
const descargandoSAPPDF = ref(false)

async function refreshPendingOdcSapState() {
  if (!numeroPedido.value) {
    odcSapProcesoEnServidor.value = false
    return
  }
  const state = await getPendingOdcSapProcessingState(numeroPedido.value)
  odcSapProcesoEnServidor.value = state.processing
}

async function handleDescargarSAPPDF() {
  const ocId = sapSuccessOcId.value
  if (!ocId) return
  descargandoSAPPDF.value = true
  try {
    const blob = await mba3ConsultasService.descargarODCPDF(ocId)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ODC_${ocId.substring(0, 8)}.pdf`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Descarga completada', 'El PDF se ha descargado correctamente')
    closeSAPSuccessModal()
  } catch (e: any) {
    toast.error('Error al descargar', e?.message || 'No se pudo descargar el PDF')
  } finally {
    descargandoSAPPDF.value = false
  }
}

function closeSAPSuccessModal() {
  showSAPSuccessModal.value = false
  sapSuccessSolicitudesTransferencia.value = null
}

async function handleFinalizarPedido() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) {
    toast.error('Error', 'No hay pedido para finalizar')
    return
  }
  if (finalizandoPedido.value) return

  finalizandoPedido.value = true
  toast.info('Finalizando pedido...', 'Por favor espera')

  try {
    const actualizado = await mba3ConsultasService.marcarFinalizado(pedidoId)
    pedido.value = actualizado
    toast.success('Pedido finalizado', 'El pedido se ha marcado como Finalizado correctamente.')
    await loadPedido()
  } catch (e: any) {
    console.error('Error al finalizar pedido:', e)
    const status = e.response?.status
    const data = e.response?.data
    const errorCode = data?.error
    const detail = data?.detail
    const msg = (typeof detail === 'object' && detail?.message) ? detail.message : (typeof detail === 'string' ? detail : null) ?? data?.message ?? e.message

    if (status === 400 && (errorCode === 'estado_no_despachar_y_facturar' || msg?.includes('Despachar y Facturar'))) {
      toast.error('Estado incorrecto', 'Solo se puede finalizar un pedido cuando está en estado "Despachar y Facturar".')
    } else {
      toast.error('Error al finalizar', msg || 'No se pudo finalizar el pedido.')
    }
    await loadPedido()
  } finally {
    finalizandoPedido.value = false
  }
}

// ⭐ Detectar el modo de interfaz según query params
const esModoMabelTrading = computed(() => {
  return route.query.usuario === 'mabel-trading' || route.query.modo === 'confirmacion'
})

// Inicializar composable de pedido detalle primero
const pedidoDetalle = usePedidoDetalle({
  pedido,
  numeroPedido,
  esModoMabelTrading,
  columnasModificadas,
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
  cargarColumnasModificadasDesdeStorage: () => {
    if (!numeroPedido.value) return
    try {
      const storageKey = `pedido_columnas_modificadas_${numeroPedido.value}`
      const stored = sessionStorage.getItem(storageKey)
      if (stored) {
        const columnasArray = JSON.parse(stored) as string[]
        columnasModificadas.value = new Set(columnasArray)
      }
    } catch (e) {
      console.warn('Error al cargar columnas modificadas desde sessionStorage:', e)
    }
  }
})

// Inicializar composable de redistribución después de pedidoDetalle
const redistribucion = useRedistribucion({
  pedido,
  numeroPedido,
  esModoMabelTrading,
  getReporteDiferencias: () => pedidoDetalle.reporteDiferencias,
  loadPedido: () => pedidoDetalle.loadPedido(),
  loadReporteDiferencias: () => pedidoDetalle.loadReporteDiferencias()
})

// Extraer variables del composable de pedido detalle
const {
  loading,
  error,
  pedidoIdInput,
  pedidoInputRef,
  showSearchHelp,
  copyFeedback,
  generandoOC,
  isValidPedido,
  loadPedido,
  handleGenerarOCDesdePedido,
  goToPedido,
  handleSearchBlur,
  copyToClipboard
} = pedidoDetalle

async function handleFinalizado() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) return
  finalizando.value = true
  try {
    const actualizado = await mba3ConsultasService.marcarFinalizado(pedidoId)
    if (pedido.value?.cabecera && actualizado?.cabecera) {
      pedido.value.cabecera.estado_id = actualizado.cabecera.estado_id
      pedido.value.cabecera.estado = actualizado.cabecera.estado ?? 'FINALIZADO'
    }
    toast.success('Estado actualizado', 'El pedido se ha marcado como Finalizado.')
  } catch (e: any) {
    const msg = extractErrorMessage(e)
    const errorCode = e.response?.data?.error
    if (e.response?.status === 400 && errorCode === 'estado_no_despachar_y_facturar') {
      toast.warning('Estado incorrecto', 'El pedido ya no está en Despachar y Facturar. Se recargará.')
      await loadPedido()
    } else {
      toast.error('Error', msg || 'No se pudo marcar como Finalizado.')
    }
  } finally {
    finalizando.value = false
  }
}

// Req. 1.2: rechazar un pedido "hijo" en Producción Pospuesta. Reutiliza el mismo
// endpoint /cancelar; el backend distingue el destino (RECHAZADO en vez de
// CANCELADO) según el estado de origen -- ver pedidos_cancelar_endpoints.py.
async function handleRechazarProduccionPospuesta() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) return
  const confirmado = window.confirm(
    `¿Estás seguro de que deseas rechazar este pedido?\n\n` +
    `Pedido: ${pedido.value?.cabecera?.numero_pedido}\n` +
    `El pedido cambiará a estado "Rechazado".`
  )
  if (!confirmado) return

  cancelandoPedidoPospuesto.value = true
  toast.info('Rechazando pedido...', 'Por favor espera')
  try {
    await mba3ConsultasService.cancelarPedido(pedidoId)
    toast.success('Pedido rechazado', 'El pedido ha sido rechazado exitosamente')
    if (pedido.value?.cabecera) {
      pedido.value.cabecera.estado = 'RECHAZADO'
      pedido.value.cabecera.estado_id = 24
    }
  } catch (e: any) {
    const msg = extractErrorMessage(e)
    toast.error('Error al rechazar', msg || 'No se pudo rechazar el pedido')
  } finally {
    cancelandoPedidoPospuesto.value = false
  }
}

// Req. 1.2: aceptar la diferencia pospuesta, enviándola directo a la cola de
// redistribución (LISTO PARA REDISTRIBUCION, 25).
async function handleAceptarProduccionPospuesta() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) return
  const confirmado = window.confirm(
    `¿Estás seguro de que deseas aceptar este pedido?\n\n` +
    `Pedido: ${pedido.value?.cabecera?.numero_pedido}\n` +
    `El pedido pasará a "Listo para Redistribución".`
  )
  if (!confirmado) return

  aceptandoProduccionPospuesta.value = true
  toast.info('Aceptando pedido...', 'Por favor espera')
  try {
    await mba3ConsultasService.aceptarProduccionPospuesta(pedidoId)
    toast.success('Pedido aceptado', 'El pedido está listo para redistribución')
    if (pedido.value?.cabecera) {
      pedido.value.cabecera.estado = 'LISTO PARA REDISTRIBUCION'
      pedido.value.cabecera.estado_id = 25
    }
  } catch (e: any) {
    const msg = extractErrorMessage(e)
    toast.error('Error al aceptar', msg || 'No se pudo aceptar el pedido')
  } finally {
    aceptandoProduccionPospuesta.value = false
  }
}

// Extraer variables del composable de redistribución
// Ahora se acceden directamente desde redistribucion.productosRedistribucion, etc.

// ⭐ Título de la interfaz según el modo
const tituloInterfaz = computed(() => {
  return 'Cargar Plantilla - MABEL TRADING'
})

/** Mostrar botón Enviar solo cuando el pedido está en BORRADOR (estado_id 1 / estado "BORRADOR") */
const esPedidoBorrador = computed(() => pedido.value?.cabecera?.estado === 'BORRADOR')

// ⭐ Variables para controlar la carga automática del último pedido
const cargandoUltimoPedido = ref(false)
const busquedaManualRealizada = ref(false)

/**
 * Carga automáticamente el último pedido del usuario cuando no hay :id en la ruta
 * Se ejecuta cada vez que el usuario entra a "Cargar Plantilla" sin un número de pedido
 */
async function cargarUltimoPedido() {
  // Si ya hay un número de pedido en la ruta, no hacer nada
  if (numeroPedido.value) {
    return
  }

  // Evitar múltiples llamadas simultáneas
  if (cargandoUltimoPedido.value) {
    return
  }

  // Si el usuario hizo una búsqueda manual, no redirigir automáticamente
  if (busquedaManualRealizada.value) {
    return
  }

  cargandoUltimoPedido.value = true
  
  try {
    const ultimoPedido = await mba3ConsultasService.getUltimoPedido(false)
    
    if (ultimoPedido && ultimoPedido.cabecera.numero_pedido) {
      // Mostrar badge informativo
      toast.info(
        'Último pedido cargado',
        `Mostrando último pedido: ${ultimoPedido.cabecera.numero_pedido}`
      )
      
      // Redirigir a la misma ruta pero con el número de pedido
      if (!busquedaManualRealizada.value) {
        router.push(`/mba3-consultas/cargar-plantilla/${encodeURIComponent(ultimoPedido.cabecera.numero_pedido)}`)
      }
    }
  } catch (error: any) {
    // Si es un error que no sea 404, loguearlo pero no mostrar error al usuario
    // (el 404 ya se maneja en el servicio retornando null)
    if (error.response?.status !== 404 && error.message && !error.message.includes('404')) {
      console.error('Error al cargar último pedido:', error)
    }
    // No mostrar error al usuario, simplemente no redirigir
  } finally {
    cargandoUltimoPedido.value = false
  }
}

/**
 * Resetea el flag de búsqueda manual cuando se monta/activa el componente
 * Esto permite que al regresar a "Cargar Plantilla", se vuelva a cargar el último pedido
 */
function resetearEstado() {
  busquedaManualRealizada.value = false
}

// ⭐ Wrapper para goToPedido que navega a la ruta correcta y marca búsqueda manual
async function goToPedidoWrapper() {
  const numeroPedidoBuscado = pedidoIdInput.value.trim()
  
  if (!numeroPedidoBuscado) {
    toast.warning('Campo vacío', 'Por favor ingresa un número de pedido')
    pedidoInputRef.value?.focus()
    return
  }
  
  // Validar formato antes de navegar
  if (!isValidPedido.value) {
    toast.warning(
      'Formato inválido',
      'Usa el número de pedido tal como aparece en el Excel. Ejemplo: P-12.48 - 12 - 2025'
    )
    pedidoInputRef.value?.focus()
    return
  }
  
  // Marcar que se hizo una búsqueda manual (evita redirección automática)
  busquedaManualRealizada.value = true
  
  // Navegar a la ruta de cargar plantilla con el número de pedido
  router.push(`/mba3-consultas/cargar-plantilla/${encodeURIComponent(numeroPedidoBuscado)}`)
  
  // Limpiar el input después de navegar
  pedidoIdInput.value = ''
}

// ⭐ FASE 4: Computed para resumen de redistribución
const resumenRedistribucion = computed(() => {
  if (redistribucion.productosRedistribucion.value.length === 0) {
    return {
      total_solicitado: 0,
      total_confirmado: 0,
      total_distribuido: 0,
      diferencia_pendiente: 0
    }
  }
  
  const total_solicitado = redistribucion.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_solicitada, 0)
  const total_confirmado = redistribucion.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_confirmada, 0)
  const total_distribuido = redistribucion.productosRedistribucion.value.reduce((sum, p) => sum + p.cantidad_distribuida, 0)
  const diferencia_pendiente = total_confirmado - total_distribuido
  
  return {
    total_solicitado,
    total_confirmado,
    total_distribuido,
    diferencia_pendiente
  }
})

// ⭐ FASE 4: Computed para impacto económico
const impactoEconomico = computed(() => {
  let costo_unitario_total = 0
  let subtotal_original = 0
  let subtotal_ajustado = 0
  let diferencia_economica = 0
  
  redistribucion.productosRedistribucion.value.forEach(producto => {
    const costo = producto.costo_unitario || 0
    costo_unitario_total += costo
    subtotal_original += producto.cantidad_solicitada * costo
    subtotal_ajustado += producto.cantidad_distribuida * costo
  })
  
  diferencia_economica = subtotal_ajustado - subtotal_original
  
  return {
    costo_unitario_promedio: redistribucion.productosRedistribucion.value.length > 0 
      ? costo_unitario_total / redistribucion.productosRedistribucion.value.length 
      : 0,
    subtotal_original,
    subtotal_ajustado,
    diferencia_economica
  }
})

// ⭐ FASE 4: Validar si se puede confirmar
const puedeConfirmarRedistribucion = computed(() => {
  return resumenRedistribucion.value.diferencia_pendiente === 0 &&
         redistribucion.productosRedistribucion.value.every(p => p.diferencia === 0) &&
         redistribucion.productosRedistribucion.value.every(p => !p.error)
})

// Deshabilitar "Confirmar Redistribución" usando el flag del backend (incluye CANCELADO y estados ya confirmados)
const confirmarRedistribucionDeshabilitadoPorEstado = computed(() =>
  pedido.value?.puede_confirmar_redistribucion === false
)

const canGenerarOC = computed(() => {
  // Permitir generar OC si el pedido está confirmado por proveedor
  const estado = pedido.value?.cabecera.estado
  return estado === 'CONFIRMADO_PROVEEDOR'
})

// Funciones de carga y gestión del pedido ahora están en el composable usePedidoDetalle

// Códigos de producto corregidos al aplicar sugerencias (para resaltar la celda en la tabla)
// Origen de verdad: sessionStorage por numero_pedido (guardado en useFileUpload antes del redirect en flujo async)
const codigosCorregidosHighlight = ref<Set<string>>(new Set())

function syncCodigosResaltadoDesdeStorage(): void {
  const num = numeroPedido.value
  if (!num) {
    codigosCorregidosHighlight.value = new Set()
    return
  }
  try {
    const raw = sessionStorage.getItem(RESALTADO_CODIGOS_STORAGE_PREFIX + num)
    const correcciones = raw ? JSON.parse(raw) : []
    const list = Array.isArray(correcciones) ? correcciones : []
    codigosCorregidosHighlight.value = new Set(
      list.map((c: any) => String(c.codigo_corregido ?? c.codigoCorregido ?? '').trim()).filter(Boolean)
    )
  } catch {
    codigosCorregidosHighlight.value = new Set()
  }
}

function isCodigoCorregidoHighlight(codigo: string | null | undefined): boolean {
  if (codigo == null) return false
  return codigosCorregidosHighlight.value.has(String(codigo).trim())
}

// Inicializar composable de carga de archivos
const fileUploadComposable = useFileUpload({
  pedido,
  loadPedido: () => pedidoDetalle.loadPedido(),
  redirectToCargarPlantilla: true,
  useAsyncUpload: true, // Procesamiento en segundo plano (Celery), no bloquea la app
  onUploadSuccess: async (numeroPedido, response) => {
    // Extraer correcciones: puede venir en response o dentro de response.resultado/result (async GET devuelve PlantillaProcesoEstado)
    const payload = (response != null && 'resultado' in response ? (response as { resultado?: UploadPlantillaResponse }).resultado : undefined) ?? (response as any)?.result ?? response
    const correcciones = payload?.correcciones_aplicadas ?? payload?.correccionesAplicadas ?? response?.correcciones_aplicadas ?? (response as any)?.correccionesAplicadas ?? []
    const list = Array.isArray(correcciones) ? correcciones : []

    if (list.length > 0) {
      // Normalizar códigos corregidos (soporta codigo_corregido y codigoCorregido) y trim para coincidencia en tabla
      codigosCorregidosHighlight.value = new Set(
        list.map((c: any) => String((c.codigo_corregido ?? c.codigoCorregido ?? '')).trim()).filter(Boolean)
      )
      // Persistir en sessionStorage para que tras redirect o al recargar la vista se mantenga el resaltado
      if (numeroPedido) {
        try {
          sessionStorage.setItem(RESALTADO_CODIGOS_STORAGE_PREFIX + numeroPedido, JSON.stringify(list))
        } catch {}
      }
      if (import.meta.env.DEV) console.log('[CargarPlantilla] correcciones_aplicadas aplicadas, resaltando códigos:', Array.from(codigosCorregidosHighlight.value))
      await pedidoDetalle.loadPedido()
    } else {
      codigosCorregidosHighlight.value = new Set()
      if (numeroPedido) {
        try {
          sessionStorage.setItem(RESALTADO_CODIGOS_STORAGE_PREFIX + numeroPedido, JSON.stringify([]))
        } catch {}
      }
      if (import.meta.env.DEV) console.log('[CargarPlantilla] onUploadSuccess sin correcciones_aplicadas. response keys:', response ? Object.keys(response) : [])
    }
    if (numeroPedido && numeroPedido !== pedido.value?.cabecera.numero_pedido) {
      await pedidoDetalle.loadPedido()
    }
  }
})

const {
  uploading,
  showErrorModal,
  uploadErrorInfo,
  openFileSelector: goToCargarPlantillas,
  validateFile,
  reintentarConCorrecciones,
  archivoOriginal: archivoOriginalDelComposable,
  // ⭐ NUEVO: Variables de progreso de carga
  uploadProgress,
  uploadFase,
  uploadMessage
} = fileUploadComposable

// ⭐ REMOVIDO: Refs de sugerencias movidas a UploadErrorModal.vue

// ⭐ REMOVIDO: Funciones de sugerencias movidas a UploadErrorModal.vue
// - extraerCodigosProductoNoEncontrados
// - getInfoMba3
// - buscarSugerenciasParaCodigo
// - buscarSugerenciasAutomaticas
// - limpiarSugerencias
// - todosCodigosTienenCorreccion (computed)

/**
 * Aplica las correcciones seleccionadas (código y/o pack/pvp, lo que UploadErrorModal reporte
 * en esta respuesta) y reintenta el flujo de carga en un solo reintento.
 */
async function aplicarCorreccionesYContinuar(correcciones: CorreccionesPlantilla): Promise<void> {
  // Obtener archivo original desde el composable
  // El composable lo guarda cuando hay error SAP
  const archivo = archivoOriginalDelComposable.value

  if (!archivo) {
    toast.error(
      'Error',
      'No se encontró el archivo original. Por favor, vuelve a subir el archivo.'
    )
    return
  }

  try {
    // Ocultar modal temporalmente mientras se procesa
    showErrorModal.value = false

    await reintentarConCorrecciones(archivo, correcciones)
  } catch (error: any) {
    console.error('❌ Error al aplicar correcciones:', error)
    // Mostrar modal de nuevo con el nuevo error si existe
    if (uploadErrorInfo.value) {
      showErrorModal.value = true
    }
    toast.error(
      'Error al aplicar correcciones',
      error.message || 'No se pudo procesar el archivo con las correcciones aplicadas'
    )
  }
}

// ⭐ REMOVIDO: Watchers y funciones auxiliares de sugerencias movidas a UploadErrorModal.vue
// - watch(showErrorModal)
// - watch(uploadErrorInfo)
// - getScoreBadgeClass
// - getSugerenciasLimitadas
// - getLimiteSugerencias
// - setLimiteSugerencias
// - inicializarLimiteSugerencias

const columnManagement = useColumnManagement(pedido, numeroPedido, columnasModificadas)

// Extraer funciones del composable para uso directo
const { editingCell, iniciarEdicion, cancelarEdicion, manejarTeclasEdicion, isColumnaModificada, getColumnaModificadaKey } = columnManagement

// Wrapper para guardarEdicion que incluye guardar en storage (fallback)
// ⚠️ NOTA: El backend se actualiza automáticamente en useColumnManagement
async function guardarEdicion() {
  await columnManagement.guardarEdicion(() => {
    // Guardar en sessionStorage como fallback (migración)
    guardarColumnasModificadasEnStorage()
  })
}

// ⭐ ELIMINADO: loadTablePreferences, saveTablePreferences, debouncedSavePreferences
// El composable useTablePreferences maneja esto automáticamente

// Funciones de gestión del pedido ahora están en el composable usePedidoDetalle

// ⭐ HU-06: Funciones para actualizar cabecera del pedido
async function handleUpdateFechaPedido(fecha: string | null) {
  if (!pedido.value?.cabecera?.pedido_id) return
  
  try {
    await mba3ConsultasService.actualizarCabeceraPedido(pedido.value.cabecera.pedido_id, {
      fecha_pedido: fecha
    })
    
    // Actualizar el valor localmente
    if (pedido.value.cabecera) {
      pedido.value.cabecera.fecha_pedido = fecha
    }
    
    toast.success('Fecha actualizada', 'La fecha de pedido se ha actualizado correctamente')
    
    // Recargar el pedido para asegurar sincronización
    await loadPedido()
  } catch (e: any) {
    console.error('Error al actualizar fecha de pedido:', e)
    toast.error('Error al actualizar', e.message || 'No se pudo actualizar la fecha de pedido')
    // Recargar para restaurar valor original
    await loadPedido()
  }
}

async function handleUpdateFechaEntrega(fecha: string | null) {
  if (!pedido.value?.cabecera?.pedido_id) return
  
  try {
    await mba3ConsultasService.actualizarCabeceraPedido(pedido.value.cabecera.pedido_id, {
      fecha_entrega: fecha
    })
    
    // Actualizar el valor localmente
    if (pedido.value.cabecera) {
      pedido.value.cabecera.fecha_entrega = fecha
    }
    
    toast.success('Fecha actualizada', 'La fecha de entrega se ha actualizado correctamente')
    
    // Recargar el pedido para asegurar sincronización
    await loadPedido()
  } catch (e: any) {
    console.error('Error al actualizar fecha de entrega:', e)
    toast.error('Error al actualizar', e.message || 'No se pudo actualizar la fecha de entrega')
    // Recargar para restaurar valor original
    await loadPedido()
  }
}

async function handleUpdateEstado(estado: string | null) {
  if (!pedido.value?.cabecera?.pedido_id) return
  
  try {
    await mba3ConsultasService.actualizarCabeceraPedido(pedido.value.cabecera.pedido_id, {
      estado: estado || undefined
    })
    
    // Actualizar el valor localmente
    if (pedido.value.cabecera) {
      pedido.value.cabecera.estado = estado || undefined
    }
    
    toast.success('Estado actualizado', 'El estado del pedido se ha actualizado correctamente')
    
    // Recargar el pedido para asegurar sincronización
    await loadPedido()
  } catch (e: any) {
    console.error('Error al actualizar estado:', e)
    toast.error('Error al actualizar', e.message || 'No se pudo actualizar el estado del pedido')
    // Recargar para restaurar valor original
    await loadPedido()
  }
}

// Pese al nombre del botón/función, esto NO es una confirmación real del pedido (req.
// 1.2/1.8): es el paso "Fase 3" de Mabel Trading -- guarda cambios y crea la respuesta del
// proveedor, y de ahí redirige a Redistribución (Fase 4), que es donde ocurre la
// confirmación real del flujo de El Rayo. En este punto nadie ha editado "Total" todavía,
// así que el chequeo de diferencia de producción (ver PedidoDetalleView.vue) no aplica
// aquí y no se le agregó el modal correspondiente -- confirmado con el usuario 2026-08-17,
// ver docs/requeriments/PYTD002_ODC-MABEL-RAYO_SEGUIMIENTO.md punto 1.2.
async function handleConfirmar() {
  // Prevenir múltiples clics
  if (confirmando.value || !pedido.value || !numeroPedido.value) return

  // Establecer estado de confirmación
  confirmando.value = true

  // Mostrar indicador de carga
  toast.info('Guardando cambios...', 'Guardando los cambios realizados en la tabla')

  try {
    // Usar pedido_id si está disponible (más eficiente), sino usar numero_pedido
    const pedidoId = pedido.value?.cabecera?.pedido_id
    await mba3ConsultasService.crearRespuestaProveedorDesdePedido(numeroPedido.value, pedidoId)
    
    toast.success('Cambios guardados', 'Los cambios han sido guardados. Redirigiendo a redistribución...')
    
    // Recargar el pedido para obtener respuesta_proveedor actualizada
    await loadPedido()
    
    // Navegar a la interfaz específica de MABEL TRADING (Fase 4)
    router.push({
      name: 'mba3-consultas-pedido-redistribucion',
      params: { id: encodeURIComponent(numeroPedido.value) }
    })
  } catch (e: any) {
    console.error('Error al confirmar:', e)
    
    // Si la respuesta ya existe, navegar directamente
    if (e.message?.includes('ya existe') || (e as any).isConflict || (e as any).statusCode === 409) {
      toast.info('Redirigiendo', 'La respuesta ya está creada. Abriendo redistribución...')
      // Recargar pedido para asegurar que tenemos los datos actualizados
      await loadPedido()
      router.push({
        name: 'mba3-consultas-pedido-redistribucion',
        params: { id: encodeURIComponent(numeroPedido.value) }
      })
    } else {
      toast.error('Error al guardar', e.message || 'No se pudieron guardar los cambios')
      // Solo resetear el estado si hay un error real (no si es conflicto 409)
      confirmando.value = false
    }
  }
  // Nota: No resetear confirmando.value aquí porque se redirige a otra página
  // Si hay un error y no se redirige, ya se resetea en el catch
}

// ⭐ HU-08: Descarga directa del archivo plano MBA (un clic, sin modal)
async function handleDescargarPlanoMba() {
  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido seleccionado')
    return
  }
  if (descargandoPlanoMba.value) return
  descargandoPlanoMba.value = true
  try {
    const blob = await mba3ConsultasService.exportarPedidoPlanoMba(numeroPedido.value, 'txt')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const nombreArchivo = `pedido_mba_${numeroPedido.value.replace(/[^a-zA-Z0-9.-]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Descarga completada', 'El archivo se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al descargar pedido plano:', e)
    toast.error('Error al descargar', e.message || 'No se pudo descargar el archivo')
  } finally {
    descargandoPlanoMba.value = false
  }
}

// Req. 1.4/1.5: descarga del Análisis de Margen de Rentabilidad (botón en pantalla de carga)
async function handleDescargarMargenExcel() {
  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido seleccionado')
    return
  }
  if (descargandoMargen.value) return
  descargandoMargen.value = true
  try {
    const blob = await mba3ConsultasService.exportarAnalisisMargen(numeroPedido.value)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const nombreArchivo = `analisis_margen_${numeroPedido.value.replace(/[^a-zA-Z0-9.-]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Descarga completada', 'El análisis de margen se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al descargar análisis de margen:', e)
    toast.error('Error al descargar', e.message || 'No se pudo descargar el análisis de margen')
  } finally {
    descargandoMargen.value = false
  }
}

// Función formatDate ahora importada desde utils/formatters

// ⭐ REMOVIDO: Funciones de redistribución movidas al composable useRedistribucion.ts

// ⭐ FASE 4: Funciones de redistribución - ahora delegadas al composable useRedistribucion
// Las funciones se pasan al componente RedistribucionTiendas como eventos
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

/** Aplica el resultado del proceso SAP en esta vista (modal éxito + loadPedido). */
async function applySAPResponseCargarPlantilla(response: import('@/modules/mba3-consultas/types').ProcesoCompletoSAPResponse) {
  const innerStatus = (response as any).status === 'success' || (response as any).status === 'partial' || (response as any).status === 'error'
    ? (response as any).status
    : (response.envio_sap?.doc_num != null ? 'success' : response.error_detalle ? 'partial' : 'error')

  if (innerStatus === 'success') {
    mostrarBannerReintentoConexionSap.value = false
    const docNum = response.envio_sap?.doc_num
    sapSuccessMessage.value = docNum
      ? `ODC enviada exitosamente a SAP. Num ODC: ${docNum}`
      : (response.message || 'ODC procesada correctamente en SAP')
    sapSuccessOcId.value = response.envio_sap?.oc_id ?? null
    sapSuccessSolicitudesTransferencia.value =
      response.solicitudes_transferencia ?? response.envio_sap?.solicitudes_transferencia ?? null
    showSAPSuccessModal.value = true
    if (sapSuccessSolicitudesTransferencia.value?.transferencias_creadas) {
      const st = sapSuccessSolicitudesTransferencia.value
      toast.success('Solicitudes de Transferencia', `Se crearon ${st.transferencias_creadas} de ${st.total_tiendas} solicitudes`)
    }
    await loadPedido()
  } else if (innerStatus === 'partial') {
    const env = response.envio_sap
    toast.warning(
      `Error en paso: ${response.paso_fallido ?? 'desconocido'}`,
      response.error_detalle || response.message || 'El proceso no se completó totalmente'
    )
    if (response.redistribucion) toast.info('Redistribución confirmada', `Versión: ${response.redistribucion.version_confirmada}`)
    if (response.odc_generada) toast.info('ODC generada', `ID: ${response.odc_generada.oc_id}`)
    await loadPedido()

    // Refresh antes de pintar el CTA/botón de reintento (flag backend como única fuente).
    const puedeReintentar = pedido.value?.puede_reintentar_envio_odc_sap === true
    mostrarBannerReintentoConexionSap.value =
      env?.retry_recommended === true && env?.doc_num == null && puedeReintentar
  } else {
    mostrarBannerReintentoConexionSap.value = false
    toast.error('Error', response.message || 'No se pudo completar el proceso')
    // Refresco adicional para que el flag backend (puede_reintentar_envio_odc_sap) quede sincronizado.
    try {
      await loadPedido()
    } catch (e) {
      console.warn('[applySAPResponseCargarPlantilla] loadPedido tras error SAP:', e)
    }
  }
}

/**
 * Ejecuta el proceso completo: Redistribución + Generar ODC + Enviar a SAP.
 * Intenta async (Celery); si backend responde 503 (Redis/Celery no disponible), fallback a sync.
 */
async function handleEnviarOdcSap() {
  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido seleccionado')
    return
  }

  if (enviandoOdcSap.value) return

  if (!puedeConfirmarRedistribucion.value) {
    toast.warning('Validación requerida', 'Debe completar la redistribución correctamente antes de enviar a SAP')
    return
  }

  mostrarBannerReintentoConexionSap.value = false

  const ajustesDetalle = redistribucion.productosRedistribucion.value.map(producto => ({
    codigo_producto: producto.codigo_producto,
    descripcion: producto.descripcion,
    cantidad_solicitada: producto.cantidad_solicitada,
    cantidad_confirmada: producto.cantidad_confirmada,
    cantidad_ajustada: producto.cantidad_distribuida,
    distribucion_tiendas: producto.distribucion_tiendas.map(tienda => ({
      tienda_codigo: tienda.tienda_codigo,
      tienda_nombre: tienda.tienda_nombre,
      cantidad: tienda.cantidad_asignada
    })),
    costo_original: producto.costo_unitario,
    costo_ajustado: producto.costo_unitario,
    cambio_precio: false
  }))

  enviandoOdcSap.value = true
  startSapProgressSimulation()
  toast.info('Procesando...', 'Proceso SAP en segundo plano. No cierre la ventana.')

  try {
    const response = await ejecutarProcesoCompletoSap(numeroPedido.value, ajustesDetalle, {
      onFallbackSync: () => {
        if (import.meta.env.DEV) console.warn('[handleEnviarOdcSap] Async no disponible (503), usando proceso SAP síncrono')
        toast.info('Proceso en segundo plano no disponible', 'Se ejecutará en modo síncrono. No cierre la ventana.')
        sapMessage.value = 'Ejecutando proceso en modo síncrono...'
      },
      onResumePending: () => {
        toast.info('Proceso en curso', 'Retomando el envío SAP iniciado anteriormente...')
        odcSapProcesoEnServidor.value = false
      },
      onPollingUpdate: applySapPollingUpdate,
      onSlowSyncLikely: marcarPosibleEsperaLarga,
    })
    completeSapProgress()
    odcSapProcesoEnServidor.value = false
    await new Promise(r => setTimeout(r, 400))
    await applySAPResponseCargarPlantilla(response)
  } catch (e: any) {
    console.error('Error al iniciar proceso completo SAP:', e)
    const isTransient = isTransientClientError(e) || e?.isTransientClientError === true
    const message = isTransient
      ? SAP_MAY_STILL_PROCESSING_MESSAGE
      : e?.response?.data?.message || e?.message || 'No se pudo iniciar el proceso'
    if (isTransient) {
      toast.warning('Tiempo de espera agotado', message)
      await refreshPendingOdcSapState()
    } else {
      toast.error('Error al enviar a SAP', message)
    }
    try {
      await loadPedido()
    } catch (loadErr) {
      console.warn('[handleEnviarOdcSap] loadPedido tras error SAP:', loadErr)
    }
  } finally {
    enviandoOdcSap.value = false
    setTimeout(resetSapProgress, 500)
  }
}

// Función copyToClipboard ahora está en el composable usePedidoDetalle

// Funciones de formato ahora importadas desde utils/formatters y utils/styleHelpers

// Funciones de redistribución ahora importadas desde utils/redistribucionHelpers y utils/styleHelpers
// Función getMensajeValidacionRedistribucion ahora requiere pasar productosRedistribucion.value como parámetro

onMounted(() => {
  resetearEstado()
  
  // Si no hay número de pedido en la ruta, cargar el último pedido automáticamente
  if (!numeroPedido.value) {
    cargarUltimoPedido()
  } else {
    // Si hay número de pedido, cargar ese pedido
    loadPedido()
  }

  void refreshPendingOdcSapState()
  
  // Sincronizar códigos a resaltar desde sessionStorage (flujo async: correcciones guardadas antes del redirect)
  syncCodigosResaltadoDesdeStorage()

  // ⭐ Las columnas modificadas se cargan automáticamente en loadPedido()
  // Agregar listener para cerrar dropdown al hacer click fuera
  document.addEventListener('click', handleClickOutsideColumnSelector)
})

// ⭐ Si el componente está en un keep-alive, también cargar al activarse
onActivated(() => {
  resetearEstado()
  
  // Si no hay número de pedido en la ruta, cargar el último pedido automáticamente
  if (!numeroPedido.value) {
    cargarUltimoPedido()
  } else {
    // Si hay número de pedido, recargar ese pedido
    loadPedido()
  }

  void refreshPendingOdcSapState()
})

// Watch para reaccionar a cambios en el parámetro de ruta
// ⭐ MEJORADO: Observar numeroPedido directamente (computed reactivo) para mayor robustez
watch(
  () => numeroPedido.value,
  async (newNumeroPedido, oldNumeroPedido) => {
    // Sincronizar Set de códigos a resaltar desde sessionStorage (origen de verdad tras flujo async)
    syncCodigosResaltadoDesdeStorage()
    // Solo recargar si el número de pedido realmente cambió y no es la carga inicial
    if (newNumeroPedido && newNumeroPedido !== oldNumeroPedido) {
      if (import.meta.env.DEV) console.log(`🔄 [PedidoDetalleView] Cambio de pedido detectado: ${oldNumeroPedido || '(ninguno)'} → ${newNumeroPedido}`)
      await loadPedido()
      await refreshPendingOdcSapState()
      // Limpiar el input de búsqueda después de navegar
      pedidoIdInput.value = ''
    }
  },
  { immediate: false }
)

// ⭐ FASE 4: Watch para inicializar redistribución cuando cambie el pedido o el modo
watch(
  [() => pedido.value?.respuesta_proveedor, () => esModoMabelTrading.value],
  async () => {
    if (pedido.value?.respuesta_proveedor && esModoMabelTrading.value) {
      await redistribucion.cargarYInicializarRedistribucion()
    } else {
      redistribucion.productosRedistribucion.value = []
      redistribucion.productosExpandidos.value.clear()
    }
  },
  { immediate: true }
)

// ⭐ Watch para recargar pedido cuando llega una notificación SSE relevante
// (ej: otro usuario confirma el pedido que tenemos abierto → recargar para deshabilitar botones)
watch(lastNotification, async (notification) => {
  if (!notification) return

  const meta = notification.metadata
  if (!meta.pedido_id && !meta.numero_pedido) return

  // Si hay un pedido cargado, verificar si la notificación es sobre ese pedido
  if (pedido.value) {
    const pedidoActual = pedido.value.cabecera
    const coincide =
      (meta.pedido_id && meta.pedido_id === pedidoActual.pedido_id) ||
      (meta.numero_pedido && meta.numero_pedido === pedidoActual.numero_pedido)

    if (coincide) {
      if (import.meta.env.DEV) {
        console.log('🔄 [CargarPlantillaView] Notificación SSE recibida para pedido actual:', meta.accion)
      }

      // Si el pedido fue descartado/cancelado, redirigir a cargar-plantilla (el pedido ya no existe)
      if (meta.accion === 'pedido_descartado' || meta.accion === 'pedido_cancelado') {
        pedido.value = null
        router.push('/mba3-consultas/cargar-plantilla')
        return
      }

      await loadPedido()
    }
  } else {
    // Sin pedido cargado (URL base /cargar-plantilla): recargar último pedido
    // para mostrar datos actualizados si otro usuario modificó el estado
    if (import.meta.env.DEV) {
      console.log('🔄 [CargarPlantillaView] Notificación SSE recibida sin pedido cargado, recargando último pedido...', meta.accion)
    }
    await cargarUltimoPedido()
  }
})

// Cleanup: eliminar listener del dropdown cuando el componente se destruye
// El composable useFileUpload maneja el cleanup del fileInput
onUnmounted(() => {
  // Remover listener del dropdown
  document.removeEventListener('click', handleClickOutsideColumnSelector)
  
  // ⭐ Limpiar intervalo de progreso SAP si existe
  stopSapProgressSimulation()
})

function handleClickOutsideColumnSelector(event: MouseEvent) {
  if (!showColumnSelector.value) return
  
  const target = event.target as HTMLElement
  // Si el click es dentro del dropdown o del botón, no hacer nada
  if (target.closest('.relative')) {
    return
  }
  
  // Cerrar el dropdown
  showColumnSelector.value = false
}

function handleDragStart(event: DragEvent, columnKey: string) {
  const column = availableColumns.find(col => col.key === columnKey)
  if (column?.fixed) {
    return
  }
  
  draggedColumnKey.value = columnKey
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', columnKey)
  }
}

function handleDragOver(event: DragEvent, columnKey: string) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  
  if (draggedColumnKey.value !== null && draggedColumnKey.value !== columnKey) {
    dragOverColumnKey.value = columnKey
  }
  else {
    dragOverColumnKey.value = null
  }
}

function handleDragLeave() {
  // No limpiar dragOverColumnKey aquí porque puede causar parpadeo
  // Se limpiará en handleDrop o handleDragEnd
}

// ⭐ ACTUALIZAR: handleDrop para usar columnKey en lugar de índices
function handleDrop(event: DragEvent, targetColumnKey: string) {
  event.preventDefault()
  
  if (!draggedColumnKey.value || draggedColumnKey.value === targetColumnKey) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // No permitir arrastrar columnas fijas
  const draggedColumn = availableColumns.find(col => col.key === draggedColumnKey.value)
  if (draggedColumn?.fixed) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // No permitir colocar columnas antes de columnas fijas
  const targetColumn = availableColumns.find(col => col.key === targetColumnKey)
  if (targetColumn?.fixed) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // Reordenar usando el composable
  // Preservar el orden completo (incluyendo columnas no visibles)
  const fullOrder = [...columnOrder.value]
  const visibleOrder = [...orderedVisibleColumnKeys.value]
  
  const draggedIndex = visibleOrder.indexOf(draggedColumnKey.value)
  const targetIndex = visibleOrder.indexOf(targetColumnKey)
  
  if (draggedIndex === -1 || targetIndex === -1) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // Obtener índices en el orden completo
  const draggedIndexInFull = fullOrder.indexOf(draggedColumnKey.value)
  const targetIndexInFull = fullOrder.indexOf(targetColumnKey)
  
  if (draggedIndexInFull === -1 || targetIndexInFull === -1) {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
    return
  }
  
  // Remover columna arrastrada del orden completo
  fullOrder.splice(draggedIndexInFull, 1)
  
  // Insertar en nueva posición en el orden completo
  // Si el índice objetivo es mayor que el arrastrado, ajustar porque ya removimos un elemento
  const adjustedTargetIndex = targetIndexInFull > draggedIndexInFull ? targetIndexInFull - 1 : targetIndexInFull
  fullOrder.splice(adjustedTargetIndex, 0, draggedColumnKey.value)
  
  // Asegurar que 'numero' esté al inicio
  const numeroIndex = fullOrder.indexOf('numero')
  if (numeroIndex > 0) {
    fullOrder.splice(numeroIndex, 1)
    fullOrder.unshift('numero')
  }
  
  // Actualizar el orden usando el composable
  columnOrder.value = fullOrder
  
  // Guardar preferencias
  savePreferences()
  
  // Limpiar estados
  draggedColumnKey.value = null
  dragOverColumnKey.value = null
}

function handleDragEnd() {
  draggedColumnKey.value = null
  dragOverColumnKey.value = null
}

// ⭐ NUEVO: Función para toggle de visibilidad de columnas
function toggleColumnVisibility(columnKey: string) {
  // No permitir ocultar columnas fijas
  const column = availableColumns.find(col => col.key === columnKey)
  if (column?.fixed) {
    return
  }
  
  const currentVisible = [...visibleColumns.value]
  const index = currentVisible.indexOf(columnKey)
  
  // Validación: Asegurar que hay al menos una columna visible (excluyendo fijas)
  const visibleNonFixed = currentVisible.filter(key => {
    const col = availableColumns.find(c => c.key === key)
    return !col?.fixed
  })
  
  if (index > -1 && visibleNonFixed.length === 1) {
    console.warn('⚠️ Debe haber al menos una columna visible. Operación cancelada.')
    return
  }
  
  if (index > -1) {
    // Ocultar columna
    currentVisible.splice(index, 1)
  } else {
    // Mostrar columna
    currentVisible.push(columnKey)
  }
  
  visibleColumns.value = currentVisible
  savePreferences()
}

// Funciones de edición ahora están en el composable useColumnManagement
</script>

