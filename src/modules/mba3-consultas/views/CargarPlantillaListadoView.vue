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

  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6" :class="{ 'pointer-events-none opacity-75': uploading }">
      <!-- Header: fila título + fila de acciones (misma lógica que PedidoHeaderActions) -->
      <div class="space-y-4">
        <OdcSapVolverButton
          v-if="odcSapVolverTarget"
          :to="odcSapVolverTarget"
          :title="odcSapVolverTitle"
          class="shrink-0 self-start"
        />
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Cargar Plantilla
              </h1>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                MABEL TRADING
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Selecciona un pedido para cargar plantilla Excel, editar o continuar el flujo
            </p>
            <!-- Contador de pedidos pendientes -->
            <div v-if="contadorPedidosPendientes > 0" class="mt-2">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {{ contadorPedidosPendientes }} pedido{{ contadorPedidosPendientes !== 1 ? 's' : '' }} requieren acción
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex w-full flex-wrap items-center justify-end gap-3">
          <!-- Temporalmente oculto: Crear pedido -->
          <button
            v-if="false"
            @click="router.push('/mba3-consultas/pedidos/crear')"
            class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear pedido
          </button>
          <button
            @click="openFileSelector"
            :disabled="uploading"
            class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            title="Cargar plantilla Excel"
          >
            <svg v-if="!uploading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Cargando plantilla Excel" />
            {{ uploading ? 'Cargando...' : 'Cargar Plantillas Excel' }}
          </button>
          <button
            @click="cargarPedidos"
            class="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            :disabled="loading"
          >
            <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Cargando pedidos" />
            {{ loading ? 'Cargando...' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <!-- Filtros (misma estructura que PedidosListView) -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div
          @click="filtrosColapsados = !filtrosColapsados"
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Filtros de Búsqueda</h2>
            <svg
              :class="['w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200', filtrosColapsados ? '' : 'rotate-180']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div v-show="!filtrosColapsados" class="p-6">
          <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="filtroSoloPendientes"
                  @change="aplicarFiltroPendientes"
                  class="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-400 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Solo pedidos que requieren acción
                </span>
              </label>
              <span v-if="filtroSoloPendientes" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                {{ contadorPedidosPendientes }} encontrados
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Muestra solo pedidos en estados: Pendiente Confirmación, Respuesta Cargada, Confirmado Proveedor
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
              <select
                v-model="filtros.estado"
                @keyup.enter="aplicarFiltros"
                @change="actualizarFiltroPendientes(); aplicarFiltros()"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              >
                <option value="">Todos los estados</option>
                <option
                  v-for="estado in estadosDisponibles"
                  :key="estado.id"
                  :value="estado.nombre"
                >
                  {{ getEstadoLabel(estado.nombre) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha</label>
              <AppDateFilterInput
                v-model:tipo="filtros.tipo_fecha"
                v-model:desde="filtros.fecha_desde"
                v-model:hasta="filtros.fecha_hasta"
                @change="aplicarFiltros"
                @keyup.enter="aplicarFiltros"
              />
            </div>
            <div v-if="MOSTRAR_FILTRO_PROVEEDOR_PEDIDOS">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proveedor</label>
              <input
                type="text"
                v-model="filtros.proveedor_nombre"
                @keyup.enter="aplicarFiltros"
                placeholder="Buscar por nombre de proveedor..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número de Pedido</label>
              <div class="relative">
                <input
                  ref="numeroPedidoInputRef"
                  type="text"
                  v-model="busquedaNumeroPedido"
                  @input="handleBusquedaNumeroPedido"
                  @keyup.enter="buscarNumeroPedidoInmediato"
                  placeholder="Buscar por número de pedido (ej: P-12.08)"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
                />
                <!-- Clear button -->
                <button
                  v-if="busquedaNumeroPedido"
                  @mousedown.prevent="limpiarBusquedaNumeroPedido"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Creado Por</label>
              <div class="relative">
                <input
                  ref="creadoPorInputRef"
                  type="text"
                  v-model="busquedaCreadoPor"
                  @input="handleBusquedaCreadoPor"
                  @keyup.enter="buscarCreadoPorInmediato"
                  placeholder="Buscar por usuario creador..."
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
                />
                <button
                  v-if="busquedaCreadoPor"
                  @mousedown.prevent="limpiarBusquedaCreadoPor"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex items-end gap-2">
              <button
                @click="limpiarFiltros"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Pedidos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div
          @click="pedidosColapsados = !pedidosColapsados"
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Pedidos</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Mostrando {{ metadata.offset + 1 }} - {{ Math.min(metadata.offset + metadata.limit, metadata.total) }} de {{ metadata.total }} resultados
              </p>
            </div>
            <svg
              :class="['w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200', pedidosColapsados ? '' : 'rotate-180']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div v-show="!pedidosColapsados">
          <LoadingSpinner v-if="loading" message="Cargando pedidos..." />

          <div v-else-if="error" class="p-6">
            <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-red-900 dark:text-red-200">Error al cargar pedidos</p>
                  <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ error }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="pedidos.length === 0" class="p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">No se encontraron pedidos</p>
            <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Intenta ajustar los filtros o
              <button @click="limpiarFiltros" class="text-indigo-600 hover:text-indigo-700 underline">
                limpiar los filtros
              </button>
            </p>
          </div>

          <div v-else class="overflow-x-auto">
            <div v-if="filtroSoloPendientes && pedidos.length > 0" class="px-6 py-2 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
              <p class="text-xs text-orange-700 dark:text-orange-300">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mostrando solo pedidos que requieren acción.
                <button @click="filtroSoloPendientes = false; aplicarFiltroPendientes()" class="underline font-medium">
                  Mostrar todos
                </button>
              </p>
            </div>
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">#</th>
                  <th @click="toggleSort('numero_pedido')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Número de Pedido
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'numero_pedido' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'numero_pedido' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('fecha_pedido')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Fecha Pedido
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'fecha_pedido' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'fecha_pedido' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('proveedor_nombre')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Proveedor
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'proveedor_nombre' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'proveedor_nombre' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('estado')" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center justify-center gap-1">Estado
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'estado' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'estado' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('comprador_nombre')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Comprador
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'comprador_nombre' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'comprador_nombre' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('creado_en')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Fecha Creación
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'creado_en' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'creado_en' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('modificado_fecha')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Fecha Modificación
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'modificado_fecha' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'modificado_fecha' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('modificado_por')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Modificado Por
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'modificado_por' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'modificado_por' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(pedido, index) in sortedPedidos"
                  :key="pedido.pedido_id"
                  :class="[
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                    requiereAccion(pedido.estado) ? 'bg-orange-50/30 dark:bg-orange-900/10 border-l-4 border-orange-500 dark:border-orange-400' : ''
                  ]"
                  @click="abrirPedido(pedido)"
                >
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
                    {{ metadata.offset + index + 1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {{ pedido.numero_pedido }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {{ pedido.fecha_pedido ? formatDate(pedido.fecha_pedido) : '-' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <span
                      v-if="esProveedorElRayo(pedido.proveedor_nombre)"
                      class="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      title="Proveedor: El Rayo"
                    >
                      {{ pedido.proveedor_nombre }}
                    </span>
                    <span v-else>{{ pedido.proveedor_nombre || '-' }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="flex items-center justify-center gap-2">
                      <span :class="getEstadoBadgeClass(pedido.estado)">{{ getEstadoLabel(pedido.estado) }}</span>
                      <span v-if="requiereAccion(pedido.estado)" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" title="Requiere acción">!</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ pedido.comprador_nombre || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {{ pedido.creado_en ? formatDateTime(pedido.creado_en) : '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {{ pedido.modificado_fecha ? formatDateTime(pedido.modificado_fecha) : '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {{ pedido.modificado_por || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="pedidos.length > 0 && !loading" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {{ metadata.offset + 1 }} - {{ Math.min(metadata.offset + metadata.limit, metadata.total) }} de {{ metadata.total }} resultados
              </div>
              <QuickTablePagination
                v-model="plantillaListCurrentPage"
                :total-pages="plantillaListTotalPages"
                :page-size="metadata.limit"
                :page-size-options="PAGE_SIZE_OPTIONS"
                :disabled="loading"
                aria-label="Paginación de pedidos (cargar plantilla)"
                @update:page-size="cambiarTamanoPagina"
              />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted, onUnmounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useFileUpload } from '../composables/useFileUpload'
import type { CorreccionesPlantilla } from '../composables/useFileUpload'
import UploadErrorModal from '../components/UploadErrorModal.vue'
import AppDateFilterInput from '../components/AppDateFilterInput.vue'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'
import type { PedidosListadoResponse, PedidoResumido, PedidosListadoFiltros, PedidosListadoMetadata, PlantillasPedidosResponse, EstadoPedidoOption } from '../types'
import { formatDate, formatDateTime } from '../utils/formatters'
import { esProveedorElRayo } from '../utils/styleHelpers'
import { MOSTRAR_FILTRO_PROVEEDOR_PEDIDOS } from '../config/featureFlags'
import { PAGE_SIZE_OPTIONS } from '../config/pagination'
import { useDebouncedFilterInput } from '../composables/useDebouncedFilterInput'
import { lastNotification, reconnectedAfterGap } from '@/composables/useNotificaciones'
import { useRefetchOnFocus } from '@/composables/useRefetchOnFocus'

const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()
const router = useRouter()
const toast = useToast()

// ========== Búsqueda por Número de Pedido (con debounce, filtra en vivo) ==========
const numeroPedidoInputRef = ref<HTMLInputElement | null>(null)
const {
  texto: busquedaNumeroPedido,
  handleInput: handleBusquedaNumeroPedido,
  commit: buscarNumeroPedidoInmediato,
  clear: limpiarBusquedaNumeroPedidoTexto,
  dispose: disposeBusquedaNumeroPedido
} = useDebouncedFilterInput((valor) => {
  if (filtros.value.numero_pedido !== valor) {
    filtros.value.numero_pedido = valor
    aplicarFiltros()
  }
})

function limpiarBusquedaNumeroPedido() {
  limpiarBusquedaNumeroPedidoTexto()
  numeroPedidoInputRef.value?.focus()
}

// Carga de plantillas Excel (redirige a cargar-plantilla/:id tras subir). useAsyncUpload: no bloquea la app (Celery).
// onUploadSuccess: refrescar lista para que al volver desde el detalle el nuevo pedido esté visible.
const fileUploadComposable = useFileUpload({
  redirectToCargarPlantilla: true,
  useAsyncUpload: true,
  onUploadSuccess: () => { cargarPedidos() }
})
const {
  uploading,
  openFileSelector,
  showErrorModal,
  uploadErrorInfo,
  archivoOriginal: archivoOriginalDelComposable,
  reintentarConCorrecciones,
  // ⭐ NUEVO: Variables de progreso de carga
  uploadProgress,
  uploadFase,
  uploadMessage
} = fileUploadComposable

async function aplicarCorreccionesYContinuar(correcciones: CorreccionesPlantilla): Promise<void> {
  const archivo = archivoOriginalDelComposable.value
  if (!archivo) {
    toast.error('Error', 'No se encontró el archivo original. Por favor, vuelve a subir el archivo.')
    return
  }
  try {
    showErrorModal.value = false
    await reintentarConCorrecciones(archivo, correcciones)
  } catch (error: any) {
    console.error('❌ Error al aplicar correcciones:', error)
    if (uploadErrorInfo.value) showErrorModal.value = true
    toast.error('Error al aplicar correcciones', error.message || 'No se pudo procesar el archivo con las correcciones aplicadas')
  }
}

const pedidos = ref<PedidoResumido[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const estadosDisponibles = ref<EstadoPedidoOption[]>([])
const PAGE_SIZE = 10
const metadata = ref<PedidosListadoMetadata>({
  total: 0,
  limit: PAGE_SIZE,
  offset: 0,
  has_more: false
})

const plantillaListTotalPages = computed(() =>
  metadata.value.total > 0 ? Math.max(1, Math.ceil(metadata.value.total / metadata.value.limit)) : 1
)

const plantillaListCurrentPage = computed({
  get() {
    if (metadata.value.limit <= 0) return 1
    return Math.floor(metadata.value.offset / metadata.value.limit) + 1
  },
  set(p: number) {
    const limit = metadata.value.limit
    const max = plantillaListTotalPages.value
    const n = Math.min(max, Math.max(1, Math.round(p)))
    cambiarPagina((n - 1) * limit)
  }
})

const filtrosColapsados = ref(true)
const pedidosColapsados = ref(false)
const filtroSoloPendientes = ref(false)

// Ordenamiento de columnas
type SortDirection = 'asc' | 'desc' | null
const sortColumn = ref<string | null>(null)
const sortDirection = ref<SortDirection>(null)

const filtros = ref<PedidosListadoFiltros>({
  estado: '',
  fecha_desde: '',
  fecha_hasta: '',
  tipo_fecha: 'pedido',
  proveedor_nombre: '',
  numero_pedido: '',
  creado_por: '',
  limit: PAGE_SIZE,
  offset: 0
})

// ========== Búsqueda por Creado Por (con debounce, filtra en vivo) ==========
const creadoPorInputRef = ref<HTMLInputElement | null>(null)
const {
  texto: busquedaCreadoPor,
  handleInput: handleBusquedaCreadoPor,
  commit: buscarCreadoPorInmediato,
  clear: limpiarBusquedaCreadoPorTexto,
  dispose: disposeBusquedaCreadoPor
} = useDebouncedFilterInput((valor) => {
  if (filtros.value.creado_por !== valor) {
    filtros.value.creado_por = valor
    aplicarFiltros()
  }
})

function limpiarBusquedaCreadoPor() {
  limpiarBusquedaCreadoPorTexto()
  creadoPorInputRef.value?.focus()
}

function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    'BORRADOR': 'Borrador',
    'NUEVO PEDIDO': 'Nuevo Pedido',
    'NUEVO_PEDIDO': 'Nuevo Pedido',
    'GESTIONAR PEDIDO': 'Gestionar Pedido',
    'GESTIONAR_PEDIDO': 'Gestionar Pedido',
    'REDISTRIBUCION': 'Redistribución',
    'PENDIENTE_CONFIRMACION_PROVEEDOR': 'Pendiente Confirmación',
    'RESPUESTA_PROVEEDOR_CARGADA': 'Respuesta Cargada',
    'CONFIRMADO_PROVEEDOR': 'Confirmado Proveedor',
    'CONFIRMADO': 'Confirmado',
    'CONFIRMADO REDISTRIBUCION': 'Confirmado redistribución',
    'REDISTRIBUIDO': 'Redistribuido',
    'PEDIDO_CONFIRMADO': 'Pedido Confirmado',
    'PENDIENTE_LOGISTICA': 'Pendiente Logística',
    'ERROR_DATOS_MAESTROS': 'Error Datos Maestros',
    'PROCESADO_SAP': 'Procesado SAP',
    'ORDEN_COMPRA_CREADA': 'OC Creada',
    'ENVIADA_SAP': 'Enviada SAP',
    'CONFIRMADO_ENVIADO': 'Confirmado y Enviado',
    'CONFIRMADO Y ENVIADO': 'Confirmado y Enviado',
    'CONFIRMADO_Y_ENVIADO': 'Confirmado y Enviado',
    'ENVIADA': 'Confirmado y Enviado',
    'DESPACHAR Y FACTURAR': 'Despachar y Facturar',
    'DESPACHAR_Y_FACTURAR': 'Despachar y Facturar',
    'FINALIZADO': 'Finalizado',
    'CERRADO': 'Cerrado',
    'CANCELADO': 'Cancelado',
    'CANCELADO POR EL RAYO': 'Cancelado por El Rayo',
    'CANCELADO_POR_EL_RAYO': 'Cancelado por El Rayo',
    'CONFIRMADO POR EL RAYO': 'Confirmado por El Rayo',
    'CONFIRMADO_POR_EL_RAYO': 'Confirmado por El Rayo',
    'CONFIRMADO POR PRODUCCION': 'Confirmado por Producción',
    'CONFIRMADO_POR_PRODUCCION': 'Confirmado por Producción',
    'ERROR ENVIO SAP REINTENTO': 'Error envío SAP (reintentar)',
    'ERROR_ENVIO_SAP_REINTENTO': 'Error envío SAP (reintentar)',
    'PRODUCCION POSPUESTA': 'Producción Pospuesta',
    'PRODUCCION_POSPUESTA': 'Producción Pospuesta',
    'RECHAZADO': 'Rechazado',
    'LISTO PARA REDISTRIBUCION': 'Listo para Redistribución',
    'LISTO_PARA_REDISTRIBUCION': 'Listo para Redistribución'
  }
  return labels[estado] || estado
}

function getEstadoBadgeClass(estado: string): string {
  const baseClasses = 'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300'
  const darkClasses = 'dark:bg-opacity-30'
  // Paleta por rol (permiso que produce el estado, ver docs/requeriments/PYTD002_ODC-MABEL-RAYO_SEGUIMIENTO.md):
  // mabel.view = verde/esmeralda/teal/lima (BORRADOR → ... → FINALIZADO); produccion-elrayo.view =
  // ámbar (calza el botón "Confirmar Producción", bg-amber-600); odcsap.view = púrpura (calza el
  // botón "Confirmar", bg-purple-600); Cancelado/Rechazado = rojo/rosa, cruza roles.
  const classes: Record<string, string> = {
    'BORRADOR': `bg-emerald-50 text-emerald-700 ${darkClasses} dark:bg-emerald-950/40 dark:text-emerald-300`,
    'NUEVO PEDIDO': `bg-green-100 text-green-800 ${darkClasses} dark:bg-green-900/50 dark:text-green-200`,
    'NUEVO_PEDIDO': `bg-green-100 text-green-800 ${darkClasses} dark:bg-green-900/50 dark:text-green-200`,
    'GESTIONAR PEDIDO': `bg-amber-100 text-amber-800 ${darkClasses} dark:bg-amber-900/50 dark:text-amber-200`,
    'GESTIONAR_PEDIDO': `bg-amber-100 text-amber-800 ${darkClasses} dark:bg-amber-900/50 dark:text-amber-200`,
    'REDISTRIBUCION': `bg-purple-100 text-purple-800 ${darkClasses} dark:bg-purple-900/50 dark:text-purple-200`,
    'PENDIENTE_CONFIRMACION_PROVEEDOR': `bg-yellow-100 text-yellow-800 ${darkClasses} dark:bg-yellow-900/50 dark:text-yellow-200`,
    'RESPUESTA_PROVEEDOR_CARGADA': `bg-blue-100 text-blue-800 ${darkClasses} dark:bg-blue-900/50 dark:text-blue-200`,
    'CONFIRMADO_PROVEEDOR': `bg-green-100 text-green-800 ${darkClasses} dark:bg-green-900/50 dark:text-green-200`,
    'CONFIRMADO': `bg-green-100 text-green-800 ${darkClasses} dark:bg-green-900/50 dark:text-green-200`,
    'CONFIRMADO REDISTRIBUCION': `bg-teal-100 text-teal-800 ${darkClasses} dark:bg-teal-900/50 dark:text-teal-200`,
    'REDISTRIBUIDO': `bg-teal-100 text-teal-800 ${darkClasses} dark:bg-teal-900/50 dark:text-teal-200`,
    'PEDIDO_CONFIRMADO': `bg-teal-200 text-teal-900 ${darkClasses} dark:bg-teal-900/60 dark:text-teal-100`,
    'PENDIENTE_LOGISTICA': `bg-lime-100 text-lime-800 ${darkClasses} dark:bg-lime-900/50 dark:text-lime-200`,
    'ERROR_DATOS_MAESTROS': `bg-vermilion-100 text-vermilion-800 ${darkClasses} dark:bg-vermilion-900/50 dark:text-vermilion-200`,
    'PROCESADO_SAP': `bg-indigo-100 text-indigo-800 ${darkClasses} dark:bg-indigo-900/50 dark:text-indigo-200`,
    'ORDEN_COMPRA_CREADA': `bg-fuchsia-100 text-fuchsia-800 ${darkClasses} dark:bg-fuchsia-900/50 dark:text-fuchsia-200`,
    'ENVIADA_SAP': `bg-purple-100 text-purple-800 ${darkClasses} dark:bg-purple-900/50 dark:text-purple-200`,
    'CONFIRMADO_ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'CONFIRMADO Y ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'CONFIRMADO_Y_ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'Confirmado y Enviado': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'ENVIADA': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'DESPACHAR Y FACTURAR': `bg-purple-200 text-purple-900 ${darkClasses} dark:bg-purple-900/60 dark:text-purple-100`,
    'DESPACHAR_Y_FACTURAR': `bg-purple-200 text-purple-900 ${darkClasses} dark:bg-purple-900/60 dark:text-purple-100`,
    'FINALIZADO': `bg-green-300 text-green-900 ${darkClasses} dark:bg-green-900/70 dark:text-green-100`,
    'CERRADO': `bg-stone-100 text-stone-700 ${darkClasses} dark:bg-stone-600 dark:text-stone-200`,
    'CANCELADO': `bg-rose-100 text-rose-800 ${darkClasses} dark:bg-rose-900/50 dark:text-rose-200`,
    'CANCELADO POR EL RAYO': `bg-red-200 text-red-900 ${darkClasses} dark:bg-red-900/70 dark:text-red-100`,
    'CANCELADO_POR_EL_RAYO': `bg-red-200 text-red-900 ${darkClasses} dark:bg-red-900/70 dark:text-red-100`,
    'CONFIRMADO POR EL RAYO': `bg-purple-100 text-purple-800 ${darkClasses} dark:bg-purple-900/50 dark:text-purple-200`,
    'CONFIRMADO_POR_EL_RAYO': `bg-purple-100 text-purple-800 ${darkClasses} dark:bg-purple-900/50 dark:text-purple-200`,
    'CONFIRMADO POR PRODUCCION': `bg-amber-300 text-amber-900 ${darkClasses} dark:bg-amber-900/70 dark:text-amber-100`,
    'CONFIRMADO_POR_PRODUCCION': `bg-amber-300 text-amber-900 ${darkClasses} dark:bg-amber-900/70 dark:text-amber-100`,
    'ERROR ENVIO SAP REINTENTO': `bg-vermilion-100 text-vermilion-800 ${darkClasses} dark:bg-vermilion-900/50 dark:text-vermilion-200`,
    'ERROR_ENVIO_SAP_REINTENTO': `bg-vermilion-100 text-vermilion-800 ${darkClasses} dark:bg-vermilion-900/50 dark:text-vermilion-200`,
    'PRODUCCION POSPUESTA': `bg-purple-200 text-purple-900 ${darkClasses} dark:bg-purple-900/60 dark:text-purple-100`,
    'PRODUCCION_POSPUESTA': `bg-purple-200 text-purple-900 ${darkClasses} dark:bg-purple-900/60 dark:text-purple-100`,
    'RECHAZADO': `bg-red-100 text-red-800 ${darkClasses} dark:bg-red-900/50 dark:text-red-200`,
    'LISTO PARA REDISTRIBUCION': `bg-purple-200 text-purple-900 ${darkClasses} dark:bg-purple-900/60 dark:text-purple-100`,
    'LISTO_PARA_REDISTRIBUCION': `bg-purple-200 text-purple-900 ${darkClasses} dark:bg-purple-900/60 dark:text-purple-100`
  }
  return `${baseClasses} ${classes[estado] || `bg-gray-100 text-gray-800 ${darkClasses} dark:bg-gray-700 dark:text-gray-200`}`
}

function requiereAccion(estado: string): boolean {
  return ['PENDIENTE_CONFIRMACION_PROVEEDOR', 'RESPUESTA_PROVEEDOR_CARGADA', 'CONFIRMADO_PROVEEDOR'].includes(estado)
}

const contadorPedidosPendientes = computed(() => {
  if (filtroSoloPendientes.value) {
    return pedidos.value.filter(p => requiereAccion(p.estado)).length
  }
  return pedidos.value.filter(p => requiereAccion(p.estado)).length
})

// Función para alternar el ordenamiento de una columna
function toggleSort(column: string) {
  if (sortColumn.value === column) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else if (sortDirection.value === 'desc') {
      sortColumn.value = null
      sortDirection.value = null
    }
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

// Columnas de tipo fecha para ordenar correctamente
const dateColumns = ['fecha_pedido', 'creado_en', 'modificado_fecha']

// Pedidos ordenados (computed)
const sortedPedidos = computed(() => {
  const lista = pedidos.value

  if (!sortColumn.value || !sortDirection.value) {
    return lista
  }

  const col = sortColumn.value
  const dir = sortDirection.value
  const isDate = dateColumns.includes(col)

  return [...lista].sort((a: any, b: any) => {
    let valA = a[col]
    let valB = b[col]

    if (valA == null && valB == null) return 0
    if (valA == null) return dir === 'asc' ? 1 : -1
    if (valB == null) return dir === 'asc' ? -1 : 1

    if (isDate) {
      const dateA = new Date(valA).getTime()
      const dateB = new Date(valB).getTime()
      return dir === 'asc' ? dateA - dateB : dateB - dateA
    }

    const strA = String(valA).toLowerCase()
    const strB = String(valB).toLowerCase()
    if (strA < strB) return dir === 'asc' ? -1 : 1
    if (strA > strB) return dir === 'asc' ? 1 : -1
    return 0
  })
})

async function cargarEstados() {
  try {
    const response = await mba3ConsultasService.getEstadosPedido('cargar-plantilla')
    estadosDisponibles.value = response.data
  } catch (e: any) {
    console.error('Error al cargar estados:', e)
  }
}

async function cargarPedidos() {
  loading.value = true
  error.value = null
  try {
    // ⭐ Usar getPlantillasPedidos en lugar de getPedidosListado
    // El endpoint /api/plantillas/pedidos INCLUYE pedidos BORRADOR (no filtra por usuario)
    const response: PlantillasPedidosResponse = await mba3ConsultasService.getPlantillasPedidos({
      estado: filtros.value.estado || undefined,
      numero_pedido: filtros.value.numero_pedido || undefined,
      creado_por: filtros.value.creado_por || undefined,
      fecha_desde: filtros.value.fecha_desde || undefined,
      fecha_hasta: filtros.value.fecha_hasta || undefined,
      tipo_fecha: filtros.value.tipo_fecha,
      limit: metadata.value.limit,
      offset: metadata.value.offset,
      solo_pendientes_accion: filtroSoloPendientes.value || undefined,
    })
    pedidos.value = response.data
    metadata.value = response.metadata
  } catch (e: any) {
    console.error('Error al cargar pedidos:', e)
    error.value = e.message || 'No se pudieron cargar los pedidos'
    toast.error('Error', error.value ?? undefined)
  } finally {
    loading.value = false
  }
}

function aplicarFiltroPendientes() {
  if (filtroSoloPendientes.value) {
    const estadoAnterior = filtros.value.estado
    const estadosPendientes = ['PENDIENTE_CONFIRMACION_PROVEEDOR', 'RESPUESTA_PROVEEDOR_CARGADA', 'CONFIRMADO_PROVEEDOR']
    if (estadoAnterior && estadosPendientes.includes(estadoAnterior)) {
      filtros.value.estado = ''
    }
  }
  aplicarFiltros()
}

function actualizarFiltroPendientes() {
  const estadoActual = filtros.value.estado
  const estadosPendientes = ['PENDIENTE_CONFIRMACION_PROVEEDOR', 'RESPUESTA_PROVEEDOR_CARGADA', 'CONFIRMADO_PROVEEDOR']
  if (estadoActual && !estadosPendientes.includes(estadoActual)) {
    filtroSoloPendientes.value = false
  }
}

function aplicarFiltros() {
  metadata.value.offset = 0
  filtros.value.offset = 0
  cargarPedidos()
}

function limpiarFiltros() {
  filtros.value = {
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    tipo_fecha: 'pedido',
    proveedor_nombre: '',
    numero_pedido: '',
    creado_por: '',
    limit: PAGE_SIZE,
    offset: 0
  }
  // Mantener en sync los inputs de búsqueda con debounce (Número de Pedido, Creado Por)
  busquedaNumeroPedido.value = ''
  busquedaCreadoPor.value = ''
  filtroSoloPendientes.value = false
  metadata.value.offset = 0
  cargarPedidos()
}

function cambiarPagina(nuevoOffset: number) {
  metadata.value.offset = nuevoOffset
  filtros.value.offset = nuevoOffset
  cargarPedidos()
}

function cambiarTamanoPagina(nuevoLimit: number) {
  metadata.value.limit = nuevoLimit
  metadata.value.offset = 0
  filtros.value.offset = 0
  cargarPedidos()
}

/** Navega a la vista Cargar Plantilla con el pedido seleccionado (sin llamar a gestionarPedido) */
function abrirPedido(pedido: PedidoResumido) {
  router.push(`/mba3-consultas/cargar-plantilla/${encodeURIComponent(pedido.numero_pedido)}`)
}

// Recargar listado automáticamente ante cualquier notificación de pedido relevante
// (ej: EL RAYO abrió el pedido para gestionarlo, lo canceló, lo confirmó, etc.)
watch(lastNotification, (notif) => {
  if (!notif) return
  if (!notif.metadata?.accion) return
  cargarPedidos()
})

// ⭐ Si el stream SSE reconectó tras una desconexión, pudimos habernos perdido una
// notificación (ej. pestaña en segundo plano durante el evento). Refrescar igual.
watch(reconnectedAfterGap, () => {
  cargarPedidos()
})

// ⭐ Refrescar al recuperar foco/visibilidad (ej. otra ventana encima que se minimiza)
useRefetchOnFocus(() => cargarPedidos())

onMounted(() => {
  cargarEstados()
  cargarPedidos()
})

onUnmounted(() => {
  disposeBusquedaNumeroPedido()
  disposeBusquedaCreadoPor()
})
</script>
