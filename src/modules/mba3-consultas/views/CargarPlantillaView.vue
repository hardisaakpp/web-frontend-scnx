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
        :descargando-plano-mba-bodega="descargandoPlanoMbaBodega"
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
            v-if="!puedeRechazarProduccionPospuesta"
            type="button"
            @click="handleDescartar"
            :disabled="descartando || !(pedido?.puede_descartar ?? false)"
            class="shrink-0 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ descartando ? 'Descartando...' : 'Descartar' }}
          </button>
          <ProduccionPospuestaActions
            :puede-rechazar="puedeRechazarProduccionPospuesta"
            :puede-aceptar="puedeAceptarProduccionPospuesta"
            :rechazando="cancelandoPedidoPospuesto"
            :aceptando="aceptandoProduccionPospuesta"
            @rechazar="handleRechazarProduccionPospuesta"
            @aceptar="handleAceptarProduccionPospuesta"
          />
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
          :default-expanded="!esModoMabelTrading"
          :show-inmediato-option="true"
          :guardando-fecha-pedido="guardandoFechaPedido"
          :guardando-fecha-entrega="guardandoFechaEntrega"
          @copy-to-clipboard="copyToClipboard"
          @update-fecha-pedido="handleUpdateFechaPedido"
          @update-fecha-entrega="handleUpdateFechaEntrega"
          @ver-detalle-sap="handleVerDetalleSap"
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
            <ColumnSelectorDropdown
              :columns="availableColumnsWithVisibility"
              :is-open="columnVisibility.isOpen.value"
              :selector-id="columnVisibility.selectorId"
              :is-syncing="isSyncing"
              @toggle-open="columnVisibility.toggleOpen"
              @toggle-column="columnVisibility.toggleColumnVisibility"
            />
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
                      claseResaltadoModificado(detalle.pedido_detalle_id, column.key),
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

    <!-- Modal de integración SAP: al hacer clic en un "Número OC SAP" de la cabecera -->
    <IntegracionSAPModal
      :is-open="showIntegracionSAPModal"
      :detalle="integracionSAPDetalle"
      :solicitudes-transferencia="integracionSAPSolicitudes"
      :estado-general="integracionSAPEstadoGeneral"
      @close="showIntegracionSAPModal = false"
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
import { useProductosPedidoColumnas } from '../composables/useProductosPedidoColumnas'
import { usePedidoDetalle } from '../composables/usePedidoDetalle'
import { useFechaPedidoHandlers } from '../composables/useFechaPedidoHandlers'
import { useRedistribucion } from '../composables/useRedistribucion'
import {
  ejecutarProcesoCompletoSap,
  getPendingOdcSapProcessingState,
} from '../composables/ejecutarProcesoCompletoSap'
import { useSapProcessProgress } from '../composables/useSapProcessProgress'
import { useProduccionPospuestaActions } from '../composables/useProduccionPospuestaActions'
import { useVerDetalleSapModal } from '../composables/useVerDetalleSapModal'
import {
  isTransientClientError,
  SAP_MAY_STILL_PROCESSING_MESSAGE,
  SAP_SLOW_SYNC_LIKELY_MESSAGE,
  extraerMensajeErrorAnidado,
} from '../utils/httpErrors'
import { descargarBlobComoArchivo } from '../utils/downloadHelpers'
// Componentes
import PedidoHeaderActions from '../components/PedidoHeaderActions.vue'
import ProduccionPospuestaActions from '../components/ProduccionPospuestaActions.vue'
import PedidoCabecera from '../components/PedidoCabecera.vue'
import RedistribucionTiendas from '../components/RedistribucionTiendas.vue'
import UploadErrorModal from '../components/UploadErrorModal.vue'
import IntegracionSAPModal from '../components/IntegracionSAPModal.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ColumnSelectorDropdown from '../components/ColumnSelectorDropdown.vue'

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

// Req. 1.2: par "Rechazar" / "Aceptar" en Producción Pospuesta (compartido con PedidoDetalleView.vue)
const {
  puedeRechazar: puedeRechazarProduccionPospuesta,
  puedeAceptar: puedeAceptarProduccionPospuesta,
  rechazando: cancelandoPedidoPospuesto,
  aceptando: aceptandoProduccionPospuesta,
  handleRechazar: handleRechazarProduccionPospuesta,
  handleAceptar: handleAceptarProduccionPospuesta,
} = useProduccionPospuestaActions(pedido)

// ⭐ HU-08: Estado del modal de exportación MBA
// ⭐ HU-08: Descarga directa del archivo plano MBA (un clic, sin modal)
const descargandoPlanoMba = ref(false)
// Bodega del botón que disparó la descarga en curso (pedidos con más de una ODC) --
// permite mostrar el spinner solo en ese botón, no en todos (ver PedidoHeaderActions.vue)
const descargandoPlanoMbaBodega = ref<string | undefined>(undefined)

// Req. 1.4/1.5: descarga del Análisis de Margen de Rentabilidad
const descargandoMargen = ref(false)

// ⭐ Set para rastrear columnas modificadas (formato: "detalleId:columnKey")
const columnasModificadas = ref<Set<string>>(new Set())

// Rol responsable de la última modificación de cada columna ('PRODUCCION_ELRAYO' | 'ODCSAP' | null),
// misma clave "detalleId:columnKey". Determina el color de resaltado de COSTO UNIT. (púrpura/ámbar).
const rolesModificacion = ref<Map<string, string | null>>(new Map())

// Gestión de columnas visibles en la tabla
const confirmando = ref(false)

// La interfaz EditingCell ahora está importada desde composables/useColumnManagement

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

// Orquestación de columnas (preferencias, visibilidad, drag & drop) y totales/numeroPedido,
// compartida con PedidoDetalleView.vue vía useProductosPedidoColumnas (mismo tableId).
const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumnKeys,
  savePreferences,
  resetTablePreferences,
  selectAllTableColumns,
  isSyncing,
  columnVisibility,
  draggedColumnKey,
  dragOverColumnKey,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  orderedVisibleColumns,
  availableColumnsWithVisibility,
  totalesCostoUnitario,
  totalesSubtotal,
  totalesTotal,
  numeroPedido,
  columnasModificadasStorage
} = useProductosPedidoColumnas(availableColumns, pedido, columnasModificadas, rolesModificacion)

/** Número de pedido para el que se muestra el botón "Finalizado" (solo Cargar plantilla, estado Despachar y Facturar). */
const NUMERO_PEDIDO_FINALIZADO = 'P-12.01 - 12 - 2025'
const showBotonFinalizado = computed(() =>
  numeroPedido.value === NUMERO_PEDIDO_FINALIZADO && pedido.value?.cabecera?.estado_id === 17
)
const finalizando = ref(false)

// ⭐ Botón "Finalizar Pedido" en PedidoHeaderActions (usa flag puede_finalizar del backend)
const finalizandoPedido = ref(false)
const puedeFinalizarPedido = computed(() => pedido.value?.puede_finalizar === true)

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
    const { status, errorCode, msg } = extraerMensajeErrorAnidado(e)

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
  rolesModificacion,
  limpiarColumnasModificadasEnStorage: columnasModificadasStorage.limpiar,
  cargarColumnasModificadasDesdeStorage: columnasModificadasStorage.cargar
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

// ⭐ FASE 4: resumen de redistribución / impacto económico / validación de confirmación,
// ahora calculados dentro de useRedistribucion (dependen solo de su propio estado interno).
const { resumenRedistribucion, impactoEconomico, puedeConfirmarRedistribucion } = redistribucion

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

const columnManagement = useColumnManagement(pedido, numeroPedido, columnasModificadas, rolesModificacion)

// Extraer funciones del composable para uso directo
const { editingCell, iniciarEdicion, cancelarEdicion, manejarTeclasEdicion, isColumnaModificada, getColumnaModificadaKey, getRolModificador } = columnManagement

// Color de resaltado de celda modificada en COSTO UNIT./TOTAL/COMENTARIO: púrpura si la
// última edición (propia o heredada del padre en un pedido hijo) la hizo odcsap.view, ámbar
// si la hizo produccion-elrayo.view. Depende de quién editó cada celda (persistido en
// backend), igual que en PedidoDetalleView.vue.
function claseResaltadoModificado(detalleId: string, columnKey: string): string {
  if (columnKey === 'numero' || !isColumnaModificada(detalleId, columnKey)) return ''
  if (getRolModificador(detalleId, columnKey) === 'ODCSAP') {
    return 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500 dark:border-purple-400'
  }
  return 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500 dark:border-amber-400'
}

// Wrapper para guardarEdicion que incluye guardar en storage (fallback)
// ⚠️ NOTA: El backend se actualiza automáticamente en useColumnManagement
async function guardarEdicion() {
  await columnManagement.guardarEdicion(() => {
    // Guardar en sessionStorage como fallback (migración)
    columnasModificadasStorage.guardar()
  })
}

// ⭐ ELIMINADO: loadTablePreferences, saveTablePreferences, debouncedSavePreferences
// El composable useTablePreferences maneja esto automáticamente

// Funciones de gestión del pedido ahora están en el composable usePedidoDetalle

// ⭐ HU-06: Funciones para actualizar cabecera del pedido
const { handleUpdateFechaPedido, handleUpdateFechaEntrega, guardandoFechaPedido, guardandoFechaEntrega } =
  useFechaPedidoHandlers(pedido, toast, loadPedido)

// Modal de integración SAP: al hacer clic en un "Número OC SAP" de la cabecera
// (pedidos con más de una ODC muestran un botón por cada una, ver PedidoCabecera.vue).
const {
  showIntegracionSAPModal,
  integracionSAPDetalle,
  integracionSAPSolicitudes,
  integracionSAPEstadoGeneral,
  handleVerDetalleSap
} = useVerDetalleSapModal()

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
// codigoBodega viene del botón correspondiente cuando el pedido tiene más de una ODC
// (una por bodega/CD, ver PedidoHeaderActions.vue -> ordenesCompraParaTxt).
async function handleDescargarPlanoMba(codigoBodega?: string) {
  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido seleccionado')
    return
  }
  if (descargandoPlanoMba.value) return
  descargandoPlanoMba.value = true
  descargandoPlanoMbaBodega.value = codigoBodega
  try {
    const blob = await mba3ConsultasService.exportarPedidoPlanoMba(numeroPedido.value, 'txt', codigoBodega)
    const sufijoBodega = codigoBodega ? `_${codigoBodega}` : ''
    const nombreArchivo = `pedido_mba_${numeroPedido.value.replace(/[^a-zA-Z0-9.-]/g, '_')}${sufijoBodega}_${new Date().toISOString().split('T')[0]}.txt`
    descargarBlobComoArchivo(blob, nombreArchivo)
    toast.success('Descarga completada', 'El archivo se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al descargar pedido plano:', e)
    toast.error('Error al descargar', e.message || 'No se pudo descargar el archivo')
  } finally {
    descargandoPlanoMba.value = false
    descargandoPlanoMbaBodega.value = undefined
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
    const nombreArchivo = `analisis_margen_${numeroPedido.value.replace(/[^a-zA-Z0-9.-]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    descargarBlobComoArchivo(blob, nombreArchivo)
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

// ⭐ FASE 4: Funciones de redistribución - delegadas directamente al composable useRedistribucion
// (mismos nombres que antes: la plantilla las sigue usando como @evento="funcion" sin cambios).
// Las funciones se pasan al componente RedistribucionTiendas como eventos
const {
  toggleExpandirProducto,
  actualizarCantidadTienda,
  validarYCorregirCantidad,
  distribuirProporcionalmente,
  copiarDistribucionOriginal,
  resetearDistribucion,
  guardarBorradorRedistribucion
} = redistribucion

async function confirmarRedistribucion() {
  await redistribucion.confirmarRedistribucion(puedeConfirmarRedistribucion)
}

/** Aplica el resultado del proceso SAP en esta vista (modal éxito + loadPedido). */
type SAPCargarPlantillaResponse = import('@/modules/mba3-consultas/types').ProcesoCompletoSAPResponse

function resolveInnerStatusCargarPlantilla(response: SAPCargarPlantillaResponse): 'success' | 'partial' | 'error' {
  if ((response as any).status === 'success' || (response as any).status === 'partial' || (response as any).status === 'error') {
    return (response as any).status
  } else if (response.envio_sap?.doc_num != null) {
    return 'success'
  } else if (response.error_detalle) {
    return 'partial'
  } else {
    return 'error'
  }
}

async function handleSAPResponseSuccessCargarPlantilla(response: SAPCargarPlantillaResponse) {
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
}

async function handleSAPResponsePartialCargarPlantilla(response: SAPCargarPlantillaResponse) {
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
}

async function handleSAPResponseErrorCargarPlantilla(response: SAPCargarPlantillaResponse) {
  mostrarBannerReintentoConexionSap.value = false
  toast.error('Error', response.message || 'No se pudo completar el proceso')
  // Refresco adicional para que el flag backend (puede_reintentar_envio_odc_sap) quede sincronizado.
  try {
    await loadPedido()
  } catch (e) {
    console.warn('[applySAPResponseCargarPlantilla] loadPedido tras error SAP:', e)
  }
}

async function applySAPResponseCargarPlantilla(response: SAPCargarPlantillaResponse) {
  const innerStatus = resolveInnerStatusCargarPlantilla(response)
  if (innerStatus === 'success') {
    await handleSAPResponseSuccessCargarPlantilla(response)
  } else if (innerStatus === 'partial') {
    await handleSAPResponsePartialCargarPlantilla(response)
  } else {
    await handleSAPResponseErrorCargarPlantilla(response)
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

type NotificacionSSEMetaCargarPlantilla = import('@/composables/useNotificaciones').SSENotification['metadata']

async function handleNotificacionSSEConPedidoCargado(
  pedidoActual: PedidoCompleto['cabecera'],
  meta: NotificacionSSEMetaCargarPlantilla
) {
  const coincide =
    (meta.pedido_id && meta.pedido_id === pedidoActual.pedido_id) ||
    (meta.numero_pedido && meta.numero_pedido === pedidoActual.numero_pedido)

  if (!coincide) return

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

async function handleNotificacionSSESinPedidoCargado(meta: NotificacionSSEMetaCargarPlantilla) {
  // Sin pedido cargado (URL base /cargar-plantilla): recargar último pedido
  // para mostrar datos actualizados si otro usuario modificó el estado
  if (import.meta.env.DEV) {
    console.log('🔄 [CargarPlantillaView] Notificación SSE recibida sin pedido cargado, recargando último pedido...', meta.accion)
  }
  await cargarUltimoPedido()
}

// ⭐ Watch para recargar pedido cuando llega una notificación SSE relevante
// (ej: otro usuario confirma el pedido que tenemos abierto → recargar para deshabilitar botones)
watch(lastNotification, async (notification) => {
  if (!notification) return

  const meta = notification.metadata
  if (!meta.pedido_id && !meta.numero_pedido) return

  // Si hay un pedido cargado, verificar si la notificación es sobre ese pedido
  if (pedido.value) {
    await handleNotificacionSSEConPedidoCargado(pedido.value.cabecera, meta)
  } else {
    await handleNotificacionSSESinPedidoCargado(meta)
  }
})

// Cleanup: el composable useFileUpload maneja el cleanup del fileInput
onUnmounted(() => {
  // ⭐ Limpiar intervalo de progreso SAP si existe
  stopSapProgressSimulation()
})

// Funciones de drag & drop de columnas ahora están en el composable useColumnDragAndDrop
// Funciones de edición ahora están en el composable useColumnManagement
</script>

