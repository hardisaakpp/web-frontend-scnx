<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header: fila título + fila de acciones (mismo orden que Cargar plantilla listado) -->
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
                {{ esProduccionElRayo ? 'Listado de Pedidos - Producción EL RAYO' : 'Listado de Pedidos - EL RAYO' }}
              </h1>
              <span v-if="esModoElRayo" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                EL RAYO
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ esModoElRayo
                ? 'Seguimiento de pedidos pendientes que requieren tu acción'
                : 'Visualiza y filtra pedidos según estado, fechas, proveedor y más'
              }}
            </p>
            <!-- Contador de pedidos pendientes -->
            <div v-if="contadorPedidosPendientes > 0" class="mt-2">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {{ contadorPedidosPendientes }} pedido{{ contadorPedidosPendientes !== 1 ? 's' : '' }} {{ esModoElRayo ? 'requieren tu acción' : 'requieren acción' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex w-full flex-wrap items-center justify-end gap-3">
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

      <!-- Filtros -->
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
          <!-- Filtro rápido: Solo pedidos que requieren acción -->
          <div v-if="esModoElRayo || mostrarFiltroRapido" class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
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
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Filtro de Estado -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
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

          <!-- Filtro de Fecha Desde -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Desde
            </label>
            <AppDateInput v-model="filtros.fecha_desde" @keyup.enter="aplicarFiltros" />
          </div>

          <!-- Filtro de Fecha Hasta -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Hasta
            </label>
            <AppDateInput v-model="filtros.fecha_hasta" @keyup.enter="aplicarFiltros" />
          </div>

          <!-- Filtro de Proveedor -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proveedor
            </label>
            <input
              type="text"
              v-model="filtros.proveedor_nombre"
              @keyup.enter="aplicarFiltros"
              placeholder="Buscar por nombre de proveedor..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
            />
          </div>

          <!-- Filtro de Número de Pedido -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Pedido
            </label>
            <input
              type="text"
              v-model="filtros.numero_pedido"
              @keyup.enter="aplicarFiltros"
              placeholder="Buscar por número de pedido..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
            />
          </div>

          <!-- Filtro de Creado Por -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Creado Por
            </label>
            <input
              type="text"
              v-model="filtros.creado_por"
              @keyup.enter="aplicarFiltros"
              placeholder="Buscar por usuario creador..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
            />
          </div>

          <!-- Botones de Acción -->
          <div class="flex items-end gap-2">
            <button
              @click="aplicarFiltros"
              class="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              Buscar
            </button>
            <button
              @click="limpiarFiltros"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium"
            >
              Limpiar
            </button>
          </div>
        </div>
        </div>
      </div>

      <!-- Tabla de Pedidos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <!-- Header de la tabla -->
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

        <!-- Loading state -->
        <LoadingSpinner v-if="loading" message="Cargando pedidos..." />

        <!-- Error state -->
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

        <!-- Empty state -->
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

        <!-- Tabla -->
        <div v-else class="overflow-x-auto">
          <!-- Filtro adicional en frontend si está activo el filtro rápido -->
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
                <th 
                  @click="toggleSort('numero_pedido')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    Número de Pedido
                    <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                      <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'numero_pedido' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                      <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'numero_pedido' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                    </span>
                  </div>
                </th>
                <th 
                  @click="toggleSort('fecha_pedido')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    Fecha Pedido
                    <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                      <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'fecha_pedido' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                      <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'fecha_pedido' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                    </span>
                  </div>
                </th>
                <th 
                  @click="toggleSort('proveedor_nombre')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    Proveedor
                    <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                      <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'proveedor_nombre' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                      <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'proveedor_nombre' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                    </span>
                  </div>
                </th>
                <th 
                  @click="toggleSort('estado')"
                  class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center justify-center gap-1">
                    Estado
                    <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                      <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'estado' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                      <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'estado' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                    </span>
                  </div>
                </th>
                <th 
                  @click="toggleSort('comprador_nombre')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    Comprador
                    <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                      <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'comprador_nombre' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                      <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'comprador_nombre' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                    </span>
                  </div>
                </th>
                <th 
                  @click="toggleSort('creado_en')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    Fecha Creación
                    <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                      <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'creado_en' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                      <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'creado_en' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                    </span>
                  </div>
                </th>
                <th 
                  @click="toggleSort('modificado_fecha')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    Fecha Modificación
                    <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                      <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'modificado_fecha' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                      <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'modificado_fecha' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                    </span>
                  </div>
                </th>
                <th 
                  @click="toggleSort('modificado_por')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    Modificado Por
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
                  requiereAccion(pedido.estado) && esModoElRayo ? 'bg-orange-50/30 dark:bg-orange-900/10 border-l-4 border-orange-500 dark:border-orange-400' : ''
                ]"
                @click="verDetalle(pedido.pedido_id)"
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
                  <div class="flex items-center gap-2">
                    <span>{{ pedido.proveedor_nombre || '-' }}</span>
                    <span v-if="esProveedorElRayo(pedido.proveedor_nombre)" 
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          title="Proveedor: El Rayo">
                      EL RAYO
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="flex items-center justify-center gap-2">
                    <span :class="getEstadoBadgeClass(pedido.estado)">
                      {{ getEstadoLabel(pedido.estado) }}
                    </span>
                    <span v-if="requiereAccion(pedido.estado)" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" title="Requiere acción">
                      !
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ pedido.comprador_nombre || '-' }}
                </td>
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

        <!-- Paginación -->
        <div v-if="pedidos.length > 0 && !loading" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {{ metadata.offset + 1 }} - {{ Math.min(metadata.offset + metadata.limit, metadata.total) }} de {{ metadata.total }} resultados
            </div>
            <QuickTablePagination
              v-model="pedidosListCurrentPage"
              :total-pages="pedidosListTotalPages"
              :disabled="loading"
              aria-label="Paginación de pedidos"
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { lastNotification, reconnectedAfterGap } from '@/composables/useNotificaciones'
import { useRefetchOnFocus } from '@/composables/useRefetchOnFocus'
import { mba3ConsultasService, extractErrorMessage } from '../services/mba3ConsultasApi'
import type { PedidosListadoResponse, PedidoResumido, PedidosListadoFiltros, PedidosListadoMetadata, EstadoPedidoOption } from '../types'
import { formatDate, formatDateTime } from '../utils/formatters'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import AppDateInput from '../components/AppDateInput.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()

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

const pedidosListTotalPages = computed(() =>
  metadata.value.total > 0 ? Math.max(1, Math.ceil(metadata.value.total / metadata.value.limit)) : 1
)

const pedidosListCurrentPage = computed({
  get() {
    if (metadata.value.limit <= 0) return 1
    return Math.floor(metadata.value.offset / metadata.value.limit) + 1
  },
  set(p: number) {
    const limit = metadata.value.limit
    const max = pedidosListTotalPages.value
    const n = Math.min(max, Math.max(1, Math.round(p)))
    cambiarPagina((n - 1) * limit)
  }
})

// Estados de colapso (por defecto abiertos)
const filtrosColapsados = ref(true)
const pedidosColapsados = ref(false)

// Ordenamiento de columnas
type SortDirection = 'asc' | 'desc' | null
const sortColumn = ref<string | null>(null)
const sortDirection = ref<SortDirection>(null)

// Detectar si es modo El Rayo desde query params
const esModoElRayo = computed(() => {
  return route.query.usuario === 'el-rayo' || route.query.modo === 'el-rayo'
})

// Pantalla exclusiva de Producción El Rayo (req. 1.8): mismo componente que
// /mba3-consultas/pedidos, pero restringido a NUEVO_PEDIDO/GESTIONAR_PEDIDO.
// Se detecta por ruta (no por permiso) para no afectar /mba3-consultas/pedidos.
const esProduccionElRayo = computed(() => {
  return route.name === 'mba3-consultas-produccion-pedidos-listado'
})

// Filtro rápido para pedidos pendientes
const filtroSoloPendientes = ref(false)
const mostrarFiltroRapido = ref(true) // Mostrar siempre el filtro rápido

const filtros = ref<PedidosListadoFiltros>({
  estado: '',
  fecha_desde: '',
  fecha_hasta: '',
  proveedor_nombre: '',
  numero_pedido: '',
  creado_por: '',
  limit: PAGE_SIZE,
  offset: 0
})

// Función para obtener la etiqueta del estado (alineada con formatEstadoPedido de formatters)
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
    'PEDIDO_CONFIRMADO': 'Pedido Confirmado',
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
    'ERROR_ENVIO_SAP_REINTENTO': 'Error envío SAP (reintentar)'
  }
  return labels[estado] || estado
}

// Colores distintivos por estado (misma paleta que getEstadoPedidoBadgeClass en styleHelpers)
function getEstadoBadgeClass(estado: string): string {
  const baseClasses = 'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300'
  const darkClasses = 'dark:bg-opacity-30'

  const classes: Record<string, string> = {
    'BORRADOR': `bg-slate-100 text-slate-800 ${darkClasses} dark:bg-slate-700 dark:text-slate-200`,
    'NUEVO PEDIDO': `bg-sky-100 text-sky-800 ${darkClasses} dark:bg-sky-900/50 dark:text-sky-200`,
    'NUEVO_PEDIDO': `bg-sky-100 text-sky-800 ${darkClasses} dark:bg-sky-900/50 dark:text-sky-200`,
    'GESTIONAR PEDIDO': `bg-amber-100 text-amber-800 ${darkClasses} dark:bg-amber-900/50 dark:text-amber-200`,
    'GESTIONAR_PEDIDO': `bg-amber-100 text-amber-800 ${darkClasses} dark:bg-amber-900/50 dark:text-amber-200`,
    'REDISTRIBUCION': `bg-violet-100 text-violet-800 ${darkClasses} dark:bg-violet-900/50 dark:text-violet-200`,
    'PENDIENTE_CONFIRMACION_PROVEEDOR': `bg-yellow-100 text-yellow-800 ${darkClasses} dark:bg-yellow-900/50 dark:text-yellow-200`,
    'RESPUESTA_PROVEEDOR_CARGADA': `bg-blue-100 text-blue-800 ${darkClasses} dark:bg-blue-900/50 dark:text-blue-200`,
    'CONFIRMADO_PROVEEDOR': `bg-green-100 text-green-800 ${darkClasses} dark:bg-green-900/50 dark:text-green-200`,
    'CONFIRMADO': `bg-green-100 text-green-800 ${darkClasses} dark:bg-green-900/50 dark:text-green-200`,
    'CONFIRMADO REDISTRIBUCION': `bg-teal-100 text-teal-800 ${darkClasses} dark:bg-teal-900/50 dark:text-teal-200`,
    'PEDIDO_CONFIRMADO': `bg-cyan-100 text-cyan-800 ${darkClasses} dark:bg-cyan-900/50 dark:text-cyan-200`,
    'PROCESADO_SAP': `bg-indigo-100 text-indigo-800 ${darkClasses} dark:bg-indigo-900/50 dark:text-indigo-200`,
    'ORDEN_COMPRA_CREADA': `bg-fuchsia-100 text-fuchsia-800 ${darkClasses} dark:bg-fuchsia-900/50 dark:text-fuchsia-200`,
    'ENVIADA_SAP': `bg-purple-100 text-purple-800 ${darkClasses} dark:bg-purple-900/50 dark:text-purple-200`,
    'CONFIRMADO_ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'CONFIRMADO Y ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'CONFIRMADO_Y_ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'Confirmado y Enviado': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'ENVIADA': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'DESPACHAR Y FACTURAR': `bg-orange-100 text-orange-800 ${darkClasses} dark:bg-orange-900/50 dark:text-orange-200`,
    'DESPACHAR_Y_FACTURAR': `bg-orange-100 text-orange-800 ${darkClasses} dark:bg-orange-900/50 dark:text-orange-200`,
    'FINALIZADO': `bg-lime-100 text-lime-800 ${darkClasses} dark:bg-lime-900/50 dark:text-lime-200`,
    'CERRADO': `bg-stone-100 text-stone-700 ${darkClasses} dark:bg-stone-600 dark:text-stone-200`,
    'CANCELADO': `bg-rose-100 text-rose-800 ${darkClasses} dark:bg-rose-900/50 dark:text-rose-200`,
    'CANCELADO POR EL RAYO': `bg-red-100 text-red-800 ${darkClasses} dark:bg-red-900/50 dark:text-red-200`,
    'CANCELADO_POR_EL_RAYO': `bg-red-100 text-red-800 ${darkClasses} dark:bg-red-900/50 dark:text-red-200`,
    'CONFIRMADO POR EL RAYO': `bg-violet-100 text-violet-800 ${darkClasses} dark:bg-violet-900/50 dark:text-violet-200`,
    'CONFIRMADO_POR_EL_RAYO': `bg-violet-100 text-violet-800 ${darkClasses} dark:bg-violet-900/50 dark:text-violet-200`,
    'CONFIRMADO POR PRODUCCION': `bg-yellow-100 text-yellow-800 ${darkClasses} dark:bg-yellow-900/50 dark:text-yellow-200`,
    'CONFIRMADO_POR_PRODUCCION': `bg-yellow-100 text-yellow-800 ${darkClasses} dark:bg-yellow-900/50 dark:text-yellow-200`,
    'ERROR ENVIO SAP REINTENTO': `bg-amber-100 text-amber-900 ${darkClasses} dark:bg-amber-900/40 dark:text-amber-100`,
    'ERROR_ENVIO_SAP_REINTENTO': `bg-amber-100 text-amber-900 ${darkClasses} dark:bg-amber-900/40 dark:text-amber-100`
  }

  return `${baseClasses} ${classes[estado] || `bg-gray-100 text-gray-800 ${darkClasses} dark:bg-gray-700 dark:text-gray-200`}`
}

// Función para determinar si un pedido requiere acción
function requiereAccion(estado: string): boolean {
  const estadosQueRequierenAccion = [
    'PENDIENTE_CONFIRMACION_PROVEEDOR',
    'RESPUESTA_PROVEEDOR_CARGADA',
    'CONFIRMADO_PROVEEDOR'
  ]
  return estadosQueRequierenAccion.includes(estado)
}

// Función para verificar si un proveedor es El Rayo
function esProveedorElRayo(proveedorNombre: string | null | undefined): boolean {
  if (!proveedorNombre) return false
  const nombreUpper = proveedorNombre.toUpperCase()
  return nombreUpper.includes('EL RAYO') || nombreUpper.includes('RAYO')
}

// Contador de pedidos pendientes (computado desde los pedidos cargados)
const contadorPedidosPendientes = computed(() => {
  // Si el filtro rápido está activo, contar todos los pedidos cargados que requieren acción
  // (ya que estamos filtrando en el frontend)
  if (filtroSoloPendientes.value) {
    return pedidos.value.filter(p => requiereAccion(p.estado)).length
  }
  
  // Si no está activo, contar los pedidos visibles que requieren acción
  // Nota: Esto solo cuenta los pedidos de la página actual
  // Para un conteo total preciso, se necesitaría una llamada adicional al backend
  const pedidosPendientes = pedidos.value.filter(p => requiereAccion(p.estado))
  return pedidosPendientes.length
})

// Función para alternar el ordenamiento de una columna
function toggleSort(column: string) {
  if (sortColumn.value === column) {
    // Ciclo: asc -> desc -> sin orden
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

    // Manejar valores nulos/undefined
    if (valA == null && valB == null) return 0
    if (valA == null) return dir === 'asc' ? 1 : -1
    if (valB == null) return dir === 'asc' ? -1 : 1

    if (isDate) {
      // Comparar como fechas
      const dateA = new Date(valA).getTime()
      const dateB = new Date(valB).getTime()
      return dir === 'asc' ? dateA - dateB : dateB - dateA
    }

    // Comparar como texto (case insensitive)
    const strA = String(valA).toLowerCase()
    const strB = String(valB).toLowerCase()
    if (strA < strB) return dir === 'asc' ? -1 : 1
    if (strA > strB) return dir === 'asc' ? 1 : -1
    return 0
  })
})

// Cargar estados disponibles para el dropdown de filtros
async function cargarEstados() {
  try {
    const response = await mba3ConsultasService.getEstadosPedido(esProduccionElRayo.value ? 'produccion' : 'pedidos')
    estadosDisponibles.value = response.data
  } catch (e: any) {
    console.error('Error al cargar estados:', e)
    // Si falla, el dropdown quedará vacío pero no bloquea la UI
  }
}

// Cargar pedidos
async function cargarPedidos() {
  loading.value = true
  error.value = null

  try {
    const response: PedidosListadoResponse = await mba3ConsultasService.getPedidosListado({
      ...filtros.value,
      limit: metadata.value.limit,
      offset: metadata.value.offset,
      solo_pendientes_accion: filtroSoloPendientes.value || undefined,
      solo_produccion_elrayo: esProduccionElRayo.value || undefined,
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

// Aplicar filtro de pedidos pendientes
function aplicarFiltroPendientes() {
  if (filtroSoloPendientes.value) {
    // Cuando el filtro rápido está activo, no aplicamos filtro de estado en el backend
    // para obtener todos los pedidos y luego filtrar en el frontend por los estados que requieren acción
    // Esto permite mostrar todos los pedidos pendientes independientemente de su estado específico
    const estadoAnterior = filtros.value.estado
    const estadosPendientes = ['PENDIENTE_CONFIRMACION_PROVEEDOR', 'RESPUESTA_PROVEEDOR_CARGADA', 'CONFIRMADO_PROVEEDOR']
    
    // Solo limpiar el estado si estaba filtrando por uno de los estados pendientes
    if (estadoAnterior && estadosPendientes.includes(estadoAnterior)) {
      filtros.value.estado = ''
    }
  } else {
    // Si se desactiva, limpiar el filtro de estado solo si estaba activo por el filtro rápido
    const estadoActual = filtros.value.estado
    const estadosPendientes = ['PENDIENTE_CONFIRMACION_PROVEEDOR', 'RESPUESTA_PROVEEDOR_CARGADA', 'CONFIRMADO_PROVEEDOR']
    
    // No limpiar si el usuario había seleccionado manualmente un estado
    // Solo limpiar si el estado actual es uno de los pendientes (probablemente activado por el filtro rápido)
    if (estadoActual && estadosPendientes.includes(estadoActual)) {
      // Verificar si fue el filtro rápido quien lo activó (no limpiar si el usuario lo seleccionó manualmente)
      // Por ahora, no limpiamos automáticamente para no perder la selección del usuario
    }
  }
  aplicarFiltros()
}

// Actualizar filtro pendientes cuando cambia el estado manualmente
function actualizarFiltroPendientes() {
  const estadoActual = filtros.value.estado
  const estadosPendientes = ['PENDIENTE_CONFIRMACION_PROVEEDOR', 'RESPUESTA_PROVEEDOR_CARGADA', 'CONFIRMADO_PROVEEDOR']
  
  // Si el estado seleccionado no es uno de los pendientes, desactivar el filtro rápido
  if (estadoActual && !estadosPendientes.includes(estadoActual)) {
    filtroSoloPendientes.value = false
  }
}

// Aplicar filtros
function aplicarFiltros() {
  metadata.value.offset = 0
  filtros.value.offset = 0
  cargarPedidos()
}

// Limpiar filtros
function limpiarFiltros() {
  filtros.value = {
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    proveedor_nombre: '',
    numero_pedido: '',
    creado_por: '',
    limit: PAGE_SIZE,
    offset: 0
  }
  filtroSoloPendientes.value = false
  metadata.value.offset = 0
  cargarPedidos()
}

// Cambiar página
function cambiarPagina(nuevoOffset: number) {
  metadata.value.offset = nuevoOffset
  filtros.value.offset = nuevoOffset
  cargarPedidos()
}

// Ver detalle del pedido: llama POST .../gestionar (estado GESTIONAR_PEDIDO) y navega
const verDetalleCargandoId = ref<string | null>(null)
async function verDetalle(pedidoId: string) {
  verDetalleCargandoId.value = pedidoId
  try {
    await mba3ConsultasService.gestionarPedido(pedidoId)
    router.push(`/mba3-consultas/pedidos/${pedidoId}`)
  } catch (e: any) {
    toast.error('Error al abrir detalle', extractErrorMessage(e))
  } finally {
    verDetalleCargandoId.value = null
  }
}

// Cargar datos al montar
onMounted(() => {
  cargarEstados()
  // Si es modo El Rayo, activar filtro de pendientes por defecto
  if (esModoElRayo.value) {
    filtroSoloPendientes.value = true
    aplicarFiltroPendientes()
  } else {
    cargarPedidos()
  }
})

// Watch para detectar cambios en query params
watch(
  () => route.query.usuario,
  (newUsuario) => {
    if (newUsuario === 'el-rayo' && !filtroSoloPendientes.value) {
      filtroSoloPendientes.value = true
      aplicarFiltroPendientes()
    }
  }
)

// ⭐ Watch para recargar lista cuando llega una notificación SSE relevante
// (ej: nuevo pedido ingresado, pedido confirmado, pedido cancelado, etc.)
watch(lastNotification, (notification) => {
  if (!notification) return

  const accion = notification.metadata?.accion
  if (!accion) return

  // Recargar la lista para cualquier acción que cambie estado de pedidos
  if (import.meta.env.DEV) {
    console.log('🔄 [PedidosListView] Notificación SSE recibida, recargando lista...', accion)
  }
  cargarPedidos()
})

// ⭐ Si el stream SSE reconectó tras una desconexión, pudimos habernos perdido una
// notificación (ej. pestaña en segundo plano durante el evento). Refrescar igual.
watch(reconnectedAfterGap, () => {
  if (import.meta.env.DEV) {
    console.log('🔄 [PedidosListView] SSE reconectado tras desconexión, recargando lista...')
  }
  cargarPedidos()
})

// ⭐ Refrescar al recuperar foco/visibilidad (ej. otra ventana encima que se minimiza)
useRefetchOnFocus(() => cargarPedidos())
</script>
