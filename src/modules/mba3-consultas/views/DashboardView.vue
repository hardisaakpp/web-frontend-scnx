<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión ODC SAP</h1>
      </div>

      <!-- Estadísticas (oculto momentáneamente) -->
      <div v-if="false" class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-semibold text-orange-600 dark:text-orange-400">{{ ordenesCompraStore.pendientes }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Pendientes</div>
          </div>
          <div class="text-center border-x border-gray-200 dark:border-gray-700">
            <div class="text-2xl font-semibold text-green-600 dark:text-green-400">{{ ordenesCompraStore.enviadas }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Enviadas</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-red-600 dark:text-red-400">{{ ordenesCompraStore.errores }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Errores</div>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <!-- Cargar Plantilla: capability mabel_view (mabel.view). Solo capabilities, no permissions ni modo. -->
        <button
          v-if="authStore.canViewMabel"
          @click="$router.push('/mba3-consultas/cargar-plantilla')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Cargar Plantilla</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">MABEL TRADING - Ver y editar pedido</div>
            </div>
          </div>
        </button>

        <!-- Listado de Pedidos: solo capability can_view_order_list (odcsap.view). Ver docs/FRONTEND.md § 0.5.7.2 -->
        <button
          v-if="authStore.canViewOrderList"
          @click="$router.push('/mba3-consultas/pedidos')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Listado de Pedidos</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">EL RAYO — Ver todos los pedidos</div>
            </div>
          </div>
        </button>

        <!-- Redistribución: capability mabel_view (mabel.view). Solo capabilities. -->
        <button
          v-if="authStore.canViewMabel"
          @click="$router.push('/mba3-consultas/redistribucion')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Redistribución</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">MABEL TRADING - distribuir por tienda</div>
            </div>
          </div>
        </button>

        <!-- Revisar Redistribución: EL RAYO, solo lectura (odcsap.view). Al lado de Redistribución. -->
        <button
          v-if="authStore.canViewOrderList"
          @click="router.push({ name: 'mba3-consultas-revisar-redistribucion' })"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Revisar Redistribución</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">EL RAYO - Ver distribucion por tienda</div>
            </div>
          </div>
        </button>

        <!-- ODC a SAP: capability mabel_view (mabel.view) o can_manage_order (odcsap.view). Ambos permisos. -->
        <button
          v-if="authStore.canViewMabel || authStore.canManageOrder"
          @click="navigateToProceso"
          :disabled="loadingDespachos"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">ODC a SAP</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Generar ODC y enviar a SAP</div>
              <div v-if="loadingDespachos" class="text-xs text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
                <svg class="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Cargando...
              </div>
            </div>
          </div>
        </button>

        <!-- Contenedor colapsable: Órdenes de Compra, ODC con Errores, Reporte de Diferencias -->
        <div class="xl:col-span-full lg:col-span-3 md:col-span-2 col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            <button
              type="button"
              @click="odcConsultasAbierto = !odcConsultasAbierto"
              class="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span class="font-medium text-gray-900 dark:text-white text-sm">Información Pedidos y ODC (EN DESARROLLO)</span>
              <svg
                class="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': odcConsultasAbierto }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              class="grid border-t border-gray-200 dark:border-gray-700 transition-[grid-template-rows] duration-200 ease-out"
              :style="{ gridTemplateRows: odcConsultasAbierto ? '1fr' : '0fr' }"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <!-- Órdenes de Compra -->
                  <button
                    @click="$router.push('/mba3-consultas/ordenes-compra')"
                    class="bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 p-4 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all text-left"
                  >
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Órdenes de Compra</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Historial completo</div>
                      </div>
                    </div>
                  </button>

                  <!-- ODC con Errores (solo visible en desarrollo; oculto en producción) -->
                  <button
                    v-if="isDev"
                    @click="$router.push('/mba3-consultas/odc-errores')"
                    class="bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 p-4 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all text-left"
                  >
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">ODC con Errores</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span v-if="ordenesCompraStore.errores > 0">{{ ordenesCompraStore.errores }} pendiente(s)</span>
                          <span v-else>Corregir SKUs</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <!-- Reporte de Diferencias (solo visible en desarrollo; oculto en producción) -->
                  <button
                    v-if="isDev"
                    @click="$router.push('/mba3-consultas/reporte-diferencias')"
                    class="bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 p-4 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all text-left"
                  >
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Reporte de Diferencias</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ver diferencias pedido vs confirmado</div>
                      </div>
                    </div>
                  </button>

                  <!-- Listado Pedidos Originales: capability can_view_plantillas_originales (mabel.view o admin) o odcsap.view (EL RAYO) -->
                  <button
                    v-if="authStore.canViewPlantillasOriginales || authStore.canViewOrderList"
                    @click="showListadoPedidosOriginalesModal = true"
                    class="bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 p-4 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all text-left"
                  >
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Listado Pedidos Originales</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Archivos Excel en storage</div>
                      </div>
                    </div>
                  </button>

                  <!-- Procesamiento SAP: capability mabel_view (mabel.view). Navega a lista de pedidos. -->
                  <button
                    v-if="authStore.canViewMabel"
                    @click="$router.push('/mba3-consultas/procesamiento-sap')"
                    class="bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 p-4 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all text-left"
                  >
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Procesamiento SAP</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">MABEL TRADING - Ver pedidos confirmados</div>
                      </div>
                    </div>
                  </button>

                  <!-- Homologaciones: capability mabel_view (mabel.view) o odcsap.view (EL RAYO). Ambos usuarios. -->
                  <button
                    v-if="authStore.canViewMabel || authStore.canViewOrderList"
                    @click="$router.push('/mba3-consultas/homologaciones')"
                    class="bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 p-4 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all text-left"
                  >
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Homologaciones</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">SKUs no coincidentes</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Remisiones (Legacy - Oculto) -->
        <!--
        <button
          @click="$router.push('/mba3-consultas/remisiones')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Remisiones</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Documentos disponibles</div>
            </div>
          </div>
        </button>
        -->

      </div>
    </div>

    <!-- Modal para buscar procesamiento SAP (no usado: botón navega a lista) -->
    <div
      v-if="showProcesamientoSAPModal"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      @click.self="closeProcesamientoSAPModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Buscar Procesamiento SAP</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ingrese el número de pedido para ver su procesamiento SAP
            </p>
          </div>
          <button
            @click="closeProcesamientoSAPModal"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Contenido del modal -->
        <div class="px-6 py-4">
          <div class="space-y-4">
            <div>
              <label for="pedido-procesamiento-sap" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Pedido
              </label>
              <input
                id="pedido-procesamiento-sap"
                v-model="pedidoProcesamientoSAP"
                type="text"
                placeholder="Ej: P-12.48 - 12 - 2025"
                @keydown.enter="navigateToProcesamientoSAP"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                :disabled="loadingProcesamientoSAP"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Presione Enter para buscar
              </p>
            </div>
          </div>
        </div>

        <!-- Footer del modal -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            @click="closeProcesamientoSAPModal"
            :disabled="loadingProcesamientoSAP"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            @click="navigateToProcesamientoSAP"
            :disabled="loadingProcesamientoSAP || !pedidoProcesamientoSAP.trim()"
            class="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              v-if="loadingProcesamientoSAP"
              class="animate-spin w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loadingProcesamientoSAP ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Listado Pedidos Originales -->
    <ListadoPedidosOriginalesModal
      :visible="showListadoPedidosOriginalesModal"
      @close="showListadoPedidosOriginalesModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useToast } from '@/composables/useToast'
import ListadoPedidosOriginalesModal from '../components/ListadoPedidosOriginalesModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const ordenesCompraStore = useOrdenesCompraStore()
const toast = useToast()

/** Solo en desarrollo: mostrar botones ODC con Errores y Reporte de Diferencias (ocultos en producción) */
const isDev = import.meta.env.DEV

const loadingDespachos = ref(false)
const odcConsultasAbierto = ref(false)
// (Modal Procesamiento SAP retirado: se navega a lista /mba3-consultas/procesamiento-sap)
const showProcesamientoSAPModal = ref(false)
const pedidoProcesamientoSAP = ref('')
const loadingProcesamientoSAP = ref(false)
const showListadoPedidosOriginalesModal = ref(false)

function closeProcesamientoSAPModal() {
  showProcesamientoSAPModal.value = false
  pedidoProcesamientoSAP.value = ''
}
async function navigateToProcesamientoSAP() {
  // Navegación movida a lista; este modal ya no se usa
}

// Función para cargar despachos antes de navegar
async function cargarDespachos() {
  loadingDespachos.value = true
  try {
    await mba3ConsultasService.getDespachos(1, 100)
    // Los despachos se cargarán automáticamente en ProcesoCompletoView cuando se monte
    // pero cargarlos aquí asegura que estén disponibles más rápido
  } catch (error: any) {
    console.error('Error al cargar despachos:', error)
    // No mostrar error al usuario, ya que ProcesoCompletoView intentará cargarlos de nuevo
  } finally {
    loadingDespachos.value = false
  }
}

// Función para navegar a la página de procesos después de cargar despachos
async function navigateToProceso() {
  await cargarDespachos()
  router.push('/mba3-consultas/proceso')
}

onMounted(async () => {
  await ordenesCompraStore.fetchEstadisticas()
})
</script>
