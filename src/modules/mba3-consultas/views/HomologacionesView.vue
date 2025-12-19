<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Homologaciones de SKU</h1>
        <p class="mt-1 text-sm text-gray-500">
          Administra las homologaciones de SKU que no coinciden entre MBA3 y SAP
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="realizarCruce"
          :disabled="cruceLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
        >
          <svg v-if="cruceLoading" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Ver Cruce
        </button>
        <button
          @click="mostrarModalBuscarSku = true"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar SKU
        </button>
        <button
          @click="sincronizarMaestros"
          :disabled="sincronizandoMaestros"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 relative group"
          title="Sincroniza los productos desde los sistemas ERP. Este proceso puede tardar varios minutos y se ejecuta automáticamente cada 24 horas."
        >
          <svg v-if="sincronizandoMaestros" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ sincronizandoMaestros ? 'Sincronizando...' : 'Sincronizar ERP' }}
        </button>
      </div>
    </div>

    <!-- Estado de Sincronización -->
    <div v-if="estadoSincronizacion" class="bg-white rounded-lg shadow p-4 border-l-4"
         :class="getSyncStatusClass()">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 mb-2">Estado de Sincronización</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
              <span class="font-medium text-gray-700">MBA3:</span>
              <span class="ml-2" :class="getSyncTextClass(estadoSincronizacion.mba3)">
                {{ formatSyncDate(estadoSincronizacion.mba3?.ultima_sync) }}
              </span>
          </div>
          <div>
              <span class="font-medium text-gray-700">SAP:</span>
              <span class="ml-2" :class="getSyncTextClass(estadoSincronizacion.sap)">
                {{ formatSyncDate(estadoSincronizacion.sap?.ultima_sync) }}
              </span>
          </div>
        </div>
          <div v-if="isSyncOld()" class="mt-3">
            <p class="text-sm text-yellow-700 mb-2">
              ⚠️ La última sincronización es antigua. Se recomienda sincronizar los datos.
            </p>
      </div>
          </div>
        <button
          @click="cargarEstadoSincronizacion"
          class="ml-4 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          title="Actualizar estado"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Sección de Cruce de Productos -->
    <div v-if="cruceResultado" class="space-y-4">
      <!-- Estadísticas del Cruce -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">📊 Resumen del Cruce</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <p class="text-sm font-medium text-gray-600">Total MBA3</p>
            <p class="text-2xl font-bold text-blue-900">{{ cruceResultado.estadisticas.total_productos_mba3 }}</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
            <p class="text-sm font-medium text-gray-600">Total SAP</p>
            <p class="text-2xl font-bold text-purple-900">{{ cruceResultado.estadisticas.total_productos_sap }}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
            <p class="text-sm font-medium text-gray-600">✅ Exactos</p>
            <p class="text-2xl font-bold text-green-900">{{ cruceResultado.estadisticas.homologados_exactos }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ ((cruceResultado.estadisticas.homologados_exactos / cruceResultado.estadisticas.total_productos_mba3) * 100).toFixed(1) }}%
            </p>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
            <p class="text-sm font-medium text-gray-600">⚠️ Homologables</p>
            <p class="text-2xl font-bold text-yellow-900">{{ cruceResultado.estadisticas.homologables }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ ((cruceResultado.estadisticas.homologables / cruceResultado.estadisticas.total_productos_mba3) * 100).toFixed(1) }}%
            </p>
          </div>
          <div class="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
            <p class="text-sm font-medium text-gray-600">❌ Solo MBA3</p>
            <p class="text-2xl font-bold text-red-900">{{ cruceResultado.estadisticas.solo_en_mba3 }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ ((cruceResultado.estadisticas.solo_en_mba3 / cruceResultado.estadisticas.total_productos_mba3) * 100).toFixed(1) }}%
            </p>
          </div>
          <div class="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
            <p class="text-sm font-medium text-gray-600">🔵 Solo SAP</p>
            <p class="text-2xl font-bold text-indigo-900">{{ cruceResultado.estadisticas.solo_en_sap }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ ((cruceResultado.estadisticas.solo_en_sap / cruceResultado.estadisticas.total_productos_sap) * 100).toFixed(1) }}%
            </p>
          </div>
          <div class="bg-violet-50 rounded-lg p-4 border-l-4 border-violet-500">
            <p class="text-sm font-medium text-gray-600">📈 Homologación</p>
            <p class="text-2xl font-bold text-violet-900">{{ cruceResultado.estadisticas.porcentaje_homologacion.toFixed(1) }}%</p>
          </div>
        </div>
      </div>

      <!-- Tabs para cada categoría -->
      <div class="bg-white rounded-lg shadow">
        <!-- Tabs Navigation -->
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px space-x-8 px-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="() => { tabActivo = tab.id; paginaCruce = 1 }"
              :class="getTabButtonClass(tab.id, tab.color)"
            >
              <span>{{ tab.label }}</span>
              <span :class="getTabBadgeClass(tab.id, tab.color)">
                {{ tab.badge }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Selector de Columnas y Barra de Búsqueda (solo para tabs con tablas) -->
          <div v-if="['exactos', 'homologables', 'solo_mba3', 'solo_sap'].includes(tabActivo)" class="mb-4 space-y-4">
            <!-- Barra de Búsqueda -->
            <div class="flex items-center gap-3">
              <div class="flex-1 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  v-model="busquedaCruce"
                  @input="onBusquedaChange"
                  type="text"
                  placeholder="Buscar por código, nombre, pack, corp, grupo, talla..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  v-if="busquedaCruce"
                  @click="limpiarBusqueda"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div v-if="busquedaCruce" class="text-sm text-gray-600 whitespace-nowrap">
                {{ datosFiltradosCruce.length }} resultado(s)
              </div>
            </div>
            
            <!-- Selector de Columnas -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  @click="mostrarSelectorColumnas = !mostrarSelectorColumnas"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Seleccionar Columnas
                </button>
                <button
                  v-if="mostrarSelectorColumnas"
                  @click="seleccionarTodasColumnas"
                  class="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Seleccionar Todas
                </button>
                <button
                  v-if="mostrarSelectorColumnas"
                  @click="deseleccionarTodasColumnas"
                  class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700"
                >
                  Deseleccionar Todas
                </button>
              </div>
            </div>
          </div>

          <!-- Panel de Selección de Columnas -->
          <div v-if="mostrarSelectorColumnas && ['exactos', 'homologables', 'solo_mba3', 'solo_sap'].includes(tabActivo)" class="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <label
                v-for="columna in columnasDisponibles"
                :key="columna.id"
                class="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="columnasVisibles[columna.id]"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="text-sm text-gray-700">{{ columna.label }}</span>
              </label>
            </div>
          </div>

          <!-- Tab: Homologados Exactos -->
          <div v-if="tabActivo === 'exactos'" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="columna in columnasVisiblesActual" :key="columna.id" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ columna.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in datosPaginadosCruce" :key="item.codigo_mba3" class="hover:bg-green-50">
                  <td v-for="columna in columnasVisiblesActual" :key="columna.id" :class="getCellClass(columna.id)">
                    <div v-if="columna.id === 'codigo_mba3' || columna.id === 'codigo_sap'" class="flex items-center gap-2">
                      <span class="font-mono">{{ getCellValue(item, columna.id, tabActivo) }}</span>
                      <button
                        @click="copiarAlPortapapeles(getCellValue(item, columna.id, tabActivo), columna.id)"
                        class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        :title="`Copiar ${columna.id === 'codigo_mba3' ? 'SKU MBA3' : 'SKU SAP'}`"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <span v-else>{{ getCellValue(item, columna.id, tabActivo) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Paginación -->
            <div v-if="totalPaginasCruce > 1" class="mt-4 flex items-center justify-between px-6 pb-4">
              <div class="text-sm text-gray-700">
                Mostrando {{ (paginaCruce - 1) * itemsPorPagina + 1 }} a {{ Math.min(paginaCruce * itemsPorPagina, totalItemsCruce) }} de {{ totalItemsCruce }} resultados
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="paginaCruce = Math.max(1, paginaCruce - 1)"
                  :disabled="paginaCruce === 1"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span class="px-3 py-2 text-sm text-gray-700">
                  Página {{ paginaCruce }} de {{ totalPaginasCruce }}
                </span>
                <button
                  @click="paginaCruce = Math.min(totalPaginasCruce, paginaCruce + 1)"
                  :disabled="paginaCruce === totalPaginasCruce"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Homologables -->
          <div v-if="tabActivo === 'homologables'" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="columna in columnasVisiblesActual" :key="columna.id" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ columna.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in datosPaginadosCruce" :key="item.codigo_mba3" class="hover:bg-yellow-50">
                  <td v-for="columna in columnasVisiblesActual" :key="columna.id" :class="getCellClass(columna.id, 'homologables')">
                    <div v-if="columna.id === 'codigo_mba3' || columna.id === 'codigo_sap'" class="flex items-center gap-2">
                      <span :class="columna.id === 'codigo_sap' && tabActivo === 'homologables' ? 'text-orange-600 font-mono' : 'font-mono'">{{ getCellValue(item, columna.id, tabActivo) }}</span>
                      <button
                        @click="copiarAlPortapapeles(getCellValue(item, columna.id, tabActivo), columna.id)"
                        class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        :title="`Copiar ${columna.id === 'codigo_mba3' ? 'SKU MBA3' : 'SKU SAP'}`"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <span v-else-if="columna.id === 'codigo_sap' && tabActivo === 'homologables'" class="text-orange-600">{{ getCellValue(item, columna.id, tabActivo) }}</span>
                    <span v-else>{{ getCellValue(item, columna.id, tabActivo) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Paginación -->
            <div v-if="totalPaginasCruce > 1" class="mt-4 flex items-center justify-between px-6 pb-4">
              <div class="text-sm text-gray-700">
                Mostrando {{ (paginaCruce - 1) * itemsPorPagina + 1 }} a {{ Math.min(paginaCruce * itemsPorPagina, totalItemsCruce) }} de {{ totalItemsCruce }} resultados
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="paginaCruce = Math.max(1, paginaCruce - 1)"
                  :disabled="paginaCruce === 1"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span class="px-3 py-2 text-sm text-gray-700">
                  Página {{ paginaCruce }} de {{ totalPaginasCruce }}
                </span>
                <button
                  @click="paginaCruce = Math.min(totalPaginasCruce, paginaCruce + 1)"
                  :disabled="paginaCruce === totalPaginasCruce"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Solo en MBA3 -->
          <div v-if="tabActivo === 'solo_mba3'" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="columna in columnasVisiblesActual" :key="columna.id" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ columna.label }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in datosPaginadosCruce" :key="item.codigo_mba3" class="hover:bg-red-50">
                  <td v-for="columna in columnasVisiblesActual" :key="columna.id" :class="getCellClass(columna.id)">
                    <div v-if="columna.id === 'codigo_mba3'" class="flex items-center gap-2">
                      <span class="font-mono">{{ getCellValue(item, columna.id, tabActivo) }}</span>
                      <button
                        @click="copiarAlPortapapeles(getCellValue(item, columna.id, tabActivo), columna.id)"
                        class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copiar SKU MBA3"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <span v-else>{{ getCellValue(item, columna.id, tabActivo) }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      @click="verSugerenciasProducto(item.codigo_mba3)"
                      :disabled="!tieneSugerencias(item.codigo_mba3)"
                      :class="[
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        tieneSugerencias(item.codigo_mba3)
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                      ]"
                    >
                      💡 Ver Sugerencias
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Paginación -->
            <div v-if="totalPaginasCruce > 1" class="mt-4 flex items-center justify-between px-6 pb-4">
              <div class="text-sm text-gray-700">
                Mostrando {{ (paginaCruce - 1) * itemsPorPagina + 1 }} a {{ Math.min(paginaCruce * itemsPorPagina, totalItemsCruce) }} de {{ totalItemsCruce }} resultados
          </div>
              <div class="flex items-center gap-2">
                <button
                  @click="paginaCruce = Math.max(1, paginaCruce - 1)"
                  :disabled="paginaCruce === 1"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span class="px-3 py-2 text-sm text-gray-700">
                  Página {{ paginaCruce }} de {{ totalPaginasCruce }}
                </span>
                <button
                  @click="paginaCruce = Math.min(totalPaginasCruce, paginaCruce + 1)"
                  :disabled="paginaCruce === totalPaginasCruce"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
        </div>
        </div>
      </div>

          <!-- Tab: Sugerencias -->
          <div v-if="tabActivo === 'sugerencias'" class="space-y-4">
            <!-- Barra de Búsqueda para Sugerencias -->
            <div class="flex items-center gap-3 mb-4">
              <div class="flex-1 relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  v-model="busquedaSugerencias"
                  type="text"
                  placeholder="Buscar por código MBA3, nombre, código SAP..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  v-if="busquedaSugerencias"
                  @click="busquedaSugerencias = ''"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div v-if="busquedaSugerencias" class="text-sm text-gray-600 whitespace-nowrap">
                {{ sugerenciasFiltradasConBusqueda.length }} resultado(s)
              </div>
            </div>
            
            <!-- Filtros y controles -->
            <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <span>Score mínimo:</span>
          <input
                    type="range"
                    v-model="scoreMinimo"
                    min="0"
                    max="100"
                    step="5"
                    class="w-32"
                  />
                  <span class="font-semibold">{{ scoreMinimo }}%</span>
        </label>
        <button
                  @click="cargarSugerencias"
                  :disabled="sugerenciasLoading"
                  class="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
        >
                  <svg v-if="sugerenciasLoading" class="animate-spin w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {{ sugerenciasLoading ? 'Leyendo...' : 'Ver Sugerencias' }}
        </button>
      </div>
              <div class="text-sm text-gray-600">
                {{ sugerenciasFiltradas.length }} productos con sugerencias
      </div>
    </div>

            <!-- Loading state -->
            <div v-if="sugerenciasLoading" class="text-center py-12">
              <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
              <p class="mt-4 text-gray-500">Leyendo datos locales...</p>
      </div>

            <!-- Empty state -->
            <div v-else-if="sugerenciasFiltradas.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
        <svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
              <p class="mt-4 text-gray-500">No hay sugerencias disponibles</p>
              <button
                @click="cargarSugerencias"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ver Sugerencias
              </button>
      </div>

            <!-- Cards de sugerencias -->
            <div v-else class="space-y-4">
              <div
                v-for="producto in sugerenciasPaginadas"
                :key="producto.codigo_mba3"
                :data-producto="producto.codigo_mba3"
                class="bg-white rounded-lg border-2 border-blue-200 shadow-md overflow-hidden"
              >
                <!-- Header del producto -->
                <div
                  @click="toggleProductoExpandido(producto.codigo_mba3)"
                  class="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <h3 class="text-lg font-bold font-mono text-gray-900">{{ producto.codigo_mba3 }}</h3>
                      <p class="text-sm text-gray-700 mt-1">{{ producto.nombre_mba3 }}</p>
                      <div class="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span v-if="producto.corp">Corp: {{ producto.corp }}</span>
                        <span v-if="producto.grupo_prenda">Grupo: {{ producto.grupo_prenda }}</span>
                        <span v-if="producto.talla">Talla: {{ producto.talla }}</span>
                        <span v-if="producto.presentacion">Presentación: {{ producto.presentacion }}</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
                      <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        💡 {{ producto.sugerencias.length }} sugerencia{{ producto.sugerencias.length !== 1 ? 's' : '' }}
                      </span>
                      <svg
                        :class="productoExpandido === producto.codigo_mba3 ? 'transform rotate-180' : ''"
                        class="w-5 h-5 text-gray-500 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Sugerencias expandidas -->
                <div v-if="productoExpandido === producto.codigo_mba3" class="p-6 space-y-4 bg-gray-50">
                  <div
                    v-for="(sugerencia, index) in producto.sugerencias"
                    :key="index"
                    class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <span class="font-mono font-semibold text-gray-900">{{ sugerencia.codigo_sap }}</span>
            <span
                            :class="getScoreBadgeClass(sugerencia.score)"
                            class="px-2 py-1 rounded-full text-xs font-semibold"
            >
                            {{ (sugerencia.score * 100).toFixed(0) }}% - {{ getScoreLabel(sugerencia.score) }}
            </span>
                        </div>
                        <p class="text-sm text-gray-700">{{ sugerencia.nombre_sap }}</p>
                        <div class="flex items-center gap-4 mt-2 text-xs text-gray-600">
                          <span v-if="sugerencia.pack_sap">Pack: {{ sugerencia.pack_sap }}</span>
                          <span v-if="sugerencia.group_code">Group Code: {{ sugerencia.group_code }}</span>
                          <span
                            :class="sugerencia.active ? 'text-green-600' : 'text-red-600'"
                            class="font-semibold"
                          >
                            {{ sugerencia.active ? '✓ Activo' : '✗ Inactivo' }}
              </span>
            </div>
          </div>
        </div>

                    <!-- Barra de score -->
                    <div class="mb-3">
                      <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Confianza</span>
                        <span>{{ (sugerencia.score * 100).toFixed(1) }}%</span>
            </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div
                          :class="getScoreBadgeClass(sugerencia.score).replace('text-', 'bg-').replace('-800', '-600')"
                          class="h-2 rounded-full transition-all duration-300"
                          :style="{ width: `${sugerencia.score * 100}%` }"
                        ></div>
            </div>
          </div>

                    <!-- Motivos - Temporalmente deshabilitado -->
                    <!-- <div class="mb-3">
                      <button
                        @click.stop="toggleMotivos(producto.codigo_mba3, index)"
                        class="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                        Ver motivos ({{ sugerencia.motivos.length }})
                      </button>
                      <div v-if="motivosExpandidos[`${producto.codigo_mba3}-${index}`]" class="mt-2 space-y-1">
                        <div
                          v-for="(motivo, mIndex) in sugerencia.motivos"
                          :key="mIndex"
                          class="text-xs text-gray-600 bg-gray-50 p-2 rounded"
                        >
                          <span class="font-semibold">{{ motivo.tipo }}:</span> {{ motivo.descripcion }}
                          <span v-if="motivo.detalle" class="text-gray-500"> ({{ motivo.detalle }})</span>
            </div>
            </div>
          </div> -->

                    <!-- Botones de acción - Temporalmente deshabilitado -->
                    <!-- <div class="flex items-center gap-2 pt-3 border-t border-gray-200">
                      <button
                        @click.stop="aprobarSugerencia(producto, sugerencia)"
                        class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        @click.stop="descartarSugerencia(producto, sugerencia)"
                        class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                      >
                        ❌ Descartar
                      </button>
        </div> -->
      </div>
                </div>
    </div>

              <!-- Paginación para sugerencias -->
              <div v-if="totalPaginasSugerencias > 1" class="mt-4 flex items-center justify-between">
                <div class="text-sm text-gray-700">
                  Mostrando {{ (paginaCruce - 1) * itemsPorPagina + 1 }} a {{ Math.min(paginaCruce * itemsPorPagina, sugerenciasFiltradas.length) }} de {{ sugerenciasFiltradas.length }} productos
                </div>
                <div class="flex items-center gap-2">
          <button
                    @click="paginaCruce = Math.max(1, paginaCruce - 1)"
                    :disabled="paginaCruce === 1"
                    class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
                  <span class="px-3 py-2 text-sm text-gray-700">
                    Página {{ paginaCruce }} de {{ totalPaginasSugerencias }}
                  </span>
          <button
                    @click="paginaCruce = Math.min(totalPaginasSugerencias, paginaCruce + 1)"
                    :disabled="paginaCruce === totalPaginasSugerencias"
                    class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
          </div>
            </div>
          </div>

          <!-- Tab: Solo en SAP -->
          <div v-if="tabActivo === 'solo_sap'" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th v-for="columna in columnasVisiblesActual" :key="columna.id" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ columna.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in datosPaginadosCruce" :key="item.codigo_sap" class="hover:bg-indigo-50">
                  <td v-for="columna in columnasVisiblesActual" :key="columna.id" :class="getCellClass(columna.id)">
                    <template v-if="columna.id === 'active'">
                      <span
                        :class="item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      >
                        {{ item.active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </template>
                    <div v-else-if="columna.id === 'codigo_sap'" class="flex items-center gap-2">
                      <span class="font-mono">{{ getCellValue(item, columna.id, tabActivo) }}</span>
                      <button
                        @click="copiarAlPortapapeles(getCellValue(item, columna.id, tabActivo), columna.id)"
                        class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copiar SKU SAP"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <template v-else>
                      {{ getCellValue(item, columna.id, tabActivo) }}
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Paginación -->
            <div v-if="totalPaginasCruce > 1" class="mt-4 flex items-center justify-between px-6 pb-4">
              <div class="text-sm text-gray-700">
                Mostrando {{ (paginaCruce - 1) * itemsPorPagina + 1 }} a {{ Math.min(paginaCruce * itemsPorPagina, totalItemsCruce) }} de {{ totalItemsCruce }} resultados
              </div>
              <div class="flex items-center gap-2">
              <button
                  @click="paginaCruce = Math.max(1, paginaCruce - 1)"
                  :disabled="paginaCruce === 1"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
              </button>
                <span class="px-3 py-2 text-sm text-gray-700">
                  Página {{ paginaCruce }} de {{ totalPaginasCruce }}
              </span>
              <button
                  @click="paginaCruce = Math.min(totalPaginasCruce, paginaCruce + 1)"
                  :disabled="paginaCruce === totalPaginasCruce"
                  class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
              </button>
          </div>
        </div>
      </div>

          <!-- Tab: Estadísticas -->
          <div v-if="tabActivo === 'estadisticas'" class="space-y-6">
            <div v-if="!cruceResultado" class="text-center py-12 bg-gray-50 rounded-lg">
              <svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p class="mt-4 text-gray-500">Realiza un cruce para ver las estadísticas</p>
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Card: Totales -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-blue-900">Total MBA3</h3>
                  <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p class="text-4xl font-bold text-blue-900">{{ cruceResultado.estadisticas.total_productos_mba3 }}</p>
                <p class="text-sm text-blue-700 mt-2">Productos en sistema MBA3</p>
              </div>

              <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-purple-900">Total SAP</h3>
                  <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p class="text-4xl font-bold text-purple-900">{{ cruceResultado.estadisticas.total_productos_sap }}</p>
                <p class="text-sm text-purple-700 mt-2">Productos en sistema SAP</p>
              </div>

              <div class="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-6 border-2 border-violet-200 shadow-lg">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-violet-900">% Homologación</h3>
                  <svg class="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p class="text-4xl font-bold text-violet-900">{{ cruceResultado.estadisticas.porcentaje_homologacion.toFixed(1) }}%</p>
                <p class="text-sm text-violet-700 mt-2">Porcentaje de homologación</p>
              </div>

              <!-- Card: Exactos -->
              <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" @click="tabActivo = 'exactos'">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-green-900">✅ Exactos</h3>
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="text-4xl font-bold text-green-900">{{ cruceResultado.estadisticas.homologados_exactos }}</p>
                <p class="text-sm text-green-700 mt-2">
                  {{ ((cruceResultado.estadisticas.homologados_exactos / cruceResultado.estadisticas.total_productos_mba3) * 100).toFixed(1) }}% del total MBA3
                </p>
              </div>

              <!-- Card: Homologables -->
              <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" @click="tabActivo = 'homologables'">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-yellow-900">⚠️ Homologables</h3>
                  <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p class="text-4xl font-bold text-yellow-900">{{ cruceResultado.estadisticas.homologables }}</p>
                <p class="text-sm text-yellow-700 mt-2">
                  {{ ((cruceResultado.estadisticas.homologables / cruceResultado.estadisticas.total_productos_mba3) * 100).toFixed(1) }}% del total MBA3
                </p>
              </div>

              <!-- Card: Sugerencias -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" @click="tabActivo = 'sugerencias'">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-blue-900">💡 Sugerencias</h3>
                  <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p class="text-4xl font-bold text-blue-900">{{ sugerenciasData.reduce((sum, p) => sum + p.sugerencias.length, 0) }}</p>
                <p class="text-sm text-blue-700 mt-2">Sugerencias disponibles</p>
              </div>

              <!-- Card: Solo MBA3 -->
              <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" @click="tabActivo = 'solo_mba3'">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-red-900">❌ Solo MBA3</h3>
                  <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p class="text-4xl font-bold text-red-900">{{ cruceResultado.estadisticas.solo_en_mba3 }}</p>
                <p class="text-sm text-red-700 mt-2">
                  {{ ((cruceResultado.estadisticas.solo_en_mba3 / cruceResultado.estadisticas.total_productos_mba3) * 100).toFixed(1) }}% del total MBA3
                </p>
              </div>

              <!-- Card: Solo SAP -->
              <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border-2 border-indigo-200 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" @click="tabActivo = 'solo_sap'">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-bold text-indigo-900">🔵 Solo SAP</h3>
                  <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="text-4xl font-bold text-indigo-900">{{ cruceResultado.estadisticas.solo_en_sap }}</p>
                <p class="text-sm text-indigo-700 mt-2">
                  {{ ((cruceResultado.estadisticas.solo_en_sap / cruceResultado.estadisticas.total_productos_sap) * 100).toFixed(1) }}% del total SAP
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Tarjetas de homologaciones con 2 tablas -->
    <div>
      <div v-if="store.loading" class="text-center py-12 bg-white rounded-lg shadow">
        <svg class="animate-spin h-8 w-8 text-violet-600 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-gray-500">Cargando homologaciones...</p>
      </div>

      <div v-else-if="store.error" class="text-center py-12 bg-white rounded-lg shadow">
        <p class="text-red-600">{{ store.error }}</p>
        <button @click="cargarHomologaciones" class="mt-4 text-violet-600 hover:underline">Reintentar</button>
      </div>

      <div v-else-if="store.filteredHomologaciones.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
        <svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-4 text-gray-500">No se encontraron homologaciones</p>
      </div>


    </div>

    <!-- Modal de Búsqueda de SKU -->
    <BuscarSkuModal
      v-if="mostrarModalBuscarSku"
      @close="mostrarModalBuscarSku = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHomologacionesStore } from '../stores/homologacionesStore'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { CruceProductosData, ProductoConSugerencias, EstadoSincronizacion } from '../types'
import BuscarSkuModal from '../components/BuscarSkuModal.vue'

const route = useRoute()
const store = useHomologacionesStore()
const toast = useToast()

// Estado local
const skuSearch = ref('')
const estadoFilter = ref('')
const tieneDiferenciasFilter = ref<boolean | null>(null)
const tieneDatosSapFilter = ref<boolean | null>(null)
const mostrarHomologados = ref(false) // Por defecto no mostrar homologados

// Estado para el cruce de productos
const cruceLoading = ref(false)
const cruceResultado = ref<CruceProductosData | null>(null)
const tabActivo = ref<'exactos' | 'homologables' | 'sugerencias' | 'solo_mba3' | 'solo_sap' | 'estadisticas'>('exactos')

// Estado para sugerencias
const sugerenciasLoading = ref(false)
const sugerenciasData = ref<ProductoConSugerencias[]>([])
const productoExpandido = ref<string | null>(null)
const scoreMinimo = ref(50) // 0-100
const motivosExpandidos = ref<Record<string, boolean>>({})

// Estado para sincronización
const sincronizandoMaestros = ref(false)
const estadoSincronizacion = ref<EstadoSincronizacion | null>(null)
const cargandoEstadoSync = ref(false)

// Estado para modal de búsqueda de SKU
const mostrarModalBuscarSku = ref(false)

// Estado de paginación para el cruce
const paginaCruce = ref(1)
const itemsPorPagina = 10

// Estado para selector de columnas
const mostrarSelectorColumnas = ref(false)

// Estado para búsqueda
const busquedaCruce = ref('')
const busquedaSugerencias = ref('')

// Definir columnas disponibles para cada tab
const columnasPorTab = {
  exactos: [
    { id: 'codigo_mba3', label: 'Código MBA3', key: 'codigo_mba3' },
    { id: 'nombre_mba3', label: 'Nombre MBA3', key: 'nombre_mba3' },
    { id: 'codigo_sap', label: 'Código SAP', key: 'codigo_sap' },
    { id: 'nombre_sap', label: 'Nombre SAP', key: 'nombre_sap' },
    { id: 'pack_sap', label: 'Pack SAP', key: 'pack_sap' },
    { id: 'corp_grupo_talla', label: 'Corp / Grupo / Talla', key: 'corp_grupo_talla' }
  ],
  homologables: [
    { id: 'codigo_mba3', label: 'Código MBA3', key: 'codigo_mba3' },
    { id: 'nombre_mba3', label: 'Nombre MBA3', key: 'nombre_mba3' },
    { id: 'codigo_sap', label: 'Código SAP', key: 'codigo_sap' },
    { id: 'nombre_sap', label: 'Nombre SAP', key: 'nombre_sap' },
    { id: 'codigo_mba3_normalizado', label: 'Código MBA3 Normalizado', key: 'codigo_mba3_normalizado' },
    { id: 'codigo_sap_normalizado', label: 'Código SAP Normalizado', key: 'codigo_sap_normalizado' },
    { id: 'pack_sap', label: 'Pack SAP', key: 'pack_sap' }
  ],
  solo_mba3: [
    { id: 'codigo_mba3', label: 'Código MBA3', key: 'codigo_mba3' },
    { id: 'nombre_mba3', label: 'Nombre MBA3', key: 'nombre_mba3' },
    { id: 'corp', label: 'Corp', key: 'corp' },
    { id: 'grupo_prenda', label: 'Grupo Prenda', key: 'grupo_prenda' },
    { id: 'talla', label: 'Talla', key: 'talla' },
    { id: 'presentacion', label: 'Presentación', key: 'presentacion' }
  ],
  solo_sap: [
    { id: 'codigo_sap', label: 'Código SAP', key: 'codigo_sap' },
    { id: 'nombre_sap', label: 'Nombre SAP', key: 'nombre_sap' },
    { id: 'pack_sap', label: 'Pack SAP', key: 'pack_sap' },
    { id: 'group_code', label: 'Group Code', key: 'group_code' },
    { id: 'active', label: 'Active', key: 'active' }
  ]
}

// Cargar preferencias de columnas desde localStorage
const STORAGE_KEY_COLUMNS = 'mba3-homologaciones-columnas-visibles'
function cargarPreferenciasColumnas() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMNS)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Error al cargar preferencias de columnas:', e)
  }
  return {}
}

// Guardar preferencias de columnas en localStorage
function guardarPreferenciasColumnas() {
  try {
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(columnasVisibles.value))
  } catch (e) {
    console.warn('Error al guardar preferencias de columnas:', e)
  }
}

// Estado reactivo para columnas visibles
const columnasVisibles = ref<Record<string, boolean>>(cargarPreferenciasColumnas())

// Inicializar columnas visibles si no existen
function inicializarColumnasVisibles() {
  const todasLasColumnas: Record<string, boolean> = {}
  
  Object.values(columnasPorTab).forEach(columnas => {
    columnas.forEach(col => {
      if (!(col.id in columnasVisibles.value)) {
        todasLasColumnas[col.id] = true // Por defecto todas visibles
      } else {
        todasLasColumnas[col.id] = columnasVisibles.value[col.id]
      }
    })
  })
  
  columnasVisibles.value = todasLasColumnas
  guardarPreferenciasColumnas()
}

// Computed para obtener columnas disponibles del tab actual
const columnasDisponibles = computed(() => {
  return columnasPorTab[tabActivo.value] || []
})

// Computed para obtener columnas visibles del tab actual
const columnasVisiblesActual = computed(() => {
  return columnasDisponibles.value.filter(col => columnasVisibles.value[col.id] !== false)
})

// Watch para guardar preferencias cuando cambien
watch(columnasVisibles, () => {
  guardarPreferenciasColumnas()
}, { deep: true })

// Funciones para seleccionar/deseleccionar todas
function seleccionarTodasColumnas() {
  columnasDisponibles.value.forEach(col => {
    columnasVisibles.value[col.id] = true
  })
}

function deseleccionarTodasColumnas() {
  columnasDisponibles.value.forEach(col => {
    columnasVisibles.value[col.id] = false
  })
}

// Función para obtener el valor de una celda
function getCellValue(item: any, columnaId: string, tab: string): string {
  switch (columnaId) {
    case 'codigo_mba3':
      return item.codigo_mba3 || '-'
    case 'nombre_mba3':
      return item.nombre_mba3 || '-'
    case 'codigo_sap':
      return item.codigo_sap || '-'
    case 'nombre_sap':
      return item.nombre_sap || '-'
    case 'pack_sap':
      return item.pack_sap || '-'
    case 'corp_grupo_talla':
      return [item.corp, item.grupo_prenda, item.talla].filter(Boolean).join(' / ') || '-'
    case 'codigo_mba3_normalizado':
      return item.codigo_mba3_normalizado || '-'
    case 'codigo_sap_normalizado':
      return item.codigo_sap_normalizado || '-'
    case 'corp':
      return item.corp || '-'
    case 'grupo_prenda':
      return item.grupo_prenda || '-'
    case 'talla':
      return item.talla || '-'
    case 'presentacion':
      return item.presentacion || '-'
    case 'group_code':
      return item.group_code || '-'
    default:
      return '-'
  }
}

// Función para obtener las clases CSS de una celda
function getCellClass(columnaId: string, tab?: string): string {
  const baseClasses = 'px-6 py-4 text-sm'
  const isCode = columnaId.includes('codigo') || columnaId === 'group_code'
  const isNormalized = columnaId.includes('normalizado')
  
  if (isCode) {
    if (tab === 'homologables' && columnaId === 'codigo_sap') {
      return `${baseClasses} whitespace-nowrap font-mono font-semibold`
    }
    return `${baseClasses} whitespace-nowrap font-mono ${columnaId === 'codigo_mba3' && tab === 'homologables' ? 'font-semibold' : ''} text-gray-900`
  }
  
  if (isNormalized) {
    return `${baseClasses} whitespace-nowrap font-mono text-gray-600`
  }
  
  if (columnaId === 'corp_grupo_talla') {
    return `${baseClasses} text-gray-500`
  }
  
  if (columnaId === 'talla' || columnaId === 'corp') {
    return `${baseClasses} whitespace-nowrap text-gray-900`
  }
  
  return `${baseClasses} text-gray-900`
}

// Computed - Los datos ya vienen paginados del servidor, pero filtramos localmente los homologados
const paginatedHomologaciones = computed(() => {
  // Si hay un filtro de estado específico seleccionado, respetarlo (el backend ya filtró)
  if (estadoFilter.value) {
    return store.homologaciones
  }
  
  // Si no hay filtro de estado y el checkbox está desmarcado, excluir homologados
  if (!mostrarHomologados.value) {
    return store.homologaciones.filter(h => h.estado !== 'HOMOLOGADO')
  }
  
  // Si el checkbox está marcado, mostrar todos
  return store.homologaciones
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = store.totalPages
  const current = store.currentPage
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push(-1) // Separador
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push(-1) // Separador
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push(-1) // Separador
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push(-1) // Separador
      pages.push(total)
    }
  }
  
  return pages.filter(p => p !== -1)
})

// Función para filtrar datos según el término de búsqueda
function filtrarDatosPorBusqueda(datos: any[], termino: string, tab: string): any[] {
  if (!termino.trim()) return datos
  
  const busqueda = termino.toLowerCase().trim()
  
  return datos.filter(item => {
    // Buscar en todos los campos relevantes según el tab
    const campos: string[] = []
    
    switch (tab) {
      case 'exactos':
        campos.push(
          item.codigo_mba3?.toString() || '',
          item.nombre_mba3?.toString() || '',
          item.codigo_sap?.toString() || '',
          item.nombre_sap?.toString() || '',
          item.pack_sap?.toString() || '',
          item.corp_grupo_talla?.toString() || ''
        )
        break
      case 'homologables':
        campos.push(
          item.codigo_mba3?.toString() || '',
          item.nombre_mba3?.toString() || '',
          item.codigo_sap?.toString() || '',
          item.nombre_sap?.toString() || '',
          item.codigo_mba3_normalizado?.toString() || '',
          item.codigo_sap_normalizado?.toString() || '',
          item.pack_sap?.toString() || ''
        )
        break
      case 'solo_mba3':
        campos.push(
          item.codigo_mba3?.toString() || '',
          item.nombre_mba3?.toString() || '',
          item.corp?.toString() || '',
          item.grupo_prenda?.toString() || '',
          item.talla?.toString() || '',
          item.presentacion?.toString() || ''
        )
        break
      case 'solo_sap':
        campos.push(
          item.codigo_sap?.toString() || '',
          item.nombre_sap?.toString() || '',
          item.pack_sap?.toString() || '',
          item.group_code?.toString() || '',
          item.active?.toString() || ''
        )
        break
    }
    
    // Buscar en todos los campos
    return campos.some(campo => campo.toLowerCase().includes(busqueda))
  })
}

// Computed para datos filtrados del cruce
const datosFiltradosCruce = computed(() => {
  if (!cruceResultado.value) return []
  
  let datos: any[] = []
  switch (tabActivo.value) {
    case 'exactos':
      datos = cruceResultado.value.homologados_exactos
      break
    case 'homologables':
      datos = cruceResultado.value.homologables
      break
    case 'solo_mba3':
      datos = cruceResultado.value.solo_en_mba3
      break
    case 'solo_sap':
      datos = cruceResultado.value.solo_en_sap
      break
    case 'sugerencias':
    case 'estadisticas':
      return [] // Estos tabs tienen su propia paginación
  }
  
  // Aplicar filtro de búsqueda
  return filtrarDatosPorBusqueda(datos, busquedaCruce.value, tabActivo.value)
})

// Computed para paginar los datos del cruce según el tab activo
const datosPaginadosCruce = computed(() => {
  const datosFiltrados = datosFiltradosCruce.value
  
  const inicio = (paginaCruce.value - 1) * itemsPorPagina
  const fin = inicio + itemsPorPagina
  return datosFiltrados.slice(inicio, fin)
})

const totalPaginasCruce = computed(() => {
  if (tabActivo.value === 'sugerencias') {
    return totalPaginasSugerencias.value
  }
  
  // Usar datos filtrados en lugar de datos originales
  const totalItems = datosFiltradosCruce.value.length
  return Math.ceil(totalItems / itemsPorPagina)
})

const totalItemsCruce = computed(() => {
  if (tabActivo.value === 'sugerencias') {
    return sugerenciasFiltradasConBusqueda.value.length
  }
  
  // Usar datos filtrados en lugar de datos originales
  return datosFiltradosCruce.value.length
})

// Computed para los tabs del cruce
const tabs = computed(() => {
  if (!cruceResultado.value) return []
  
  const totalSugerencias = sugerenciasData.value.reduce((sum, p) => sum + p.sugerencias.length, 0)
  
  return [
    {
      id: 'exactos' as const,
      label: '✅ Exactos',
      badge: cruceResultado.value.homologados_exactos.length,
      color: 'green'
    },
    {
      id: 'homologables' as const,
      label: '⚠️ Homologables',
      badge: cruceResultado.value.homologables.length,
      color: 'yellow'
    },
    {
      id: 'sugerencias' as const,
      label: '💡 Sugerencias',
      badge: totalSugerencias > 0 ? totalSugerencias : undefined,
      color: 'blue'
    },
    {
      id: 'solo_mba3' as const,
      label: '❌ Solo MBA3',
      badge: cruceResultado.value.solo_en_mba3.length,
      color: 'red'
    },
    {
      id: 'solo_sap' as const,
      label: '🔵 Solo SAP',
      badge: cruceResultado.value.solo_en_sap.length,
      color: 'indigo'
    },
    {
      id: 'estadisticas' as const,
      label: '📈 Estadísticas',
      badge: undefined,
      color: 'violet'
    }
  ]
})

// Computed para sugerencias filtradas y paginadas
const sugerenciasFiltradas = computed(() => {
  return sugerenciasData.value
    .map(producto => ({
      ...producto,
      sugerencias: producto.sugerencias.filter(s => (s.score * 100) >= scoreMinimo.value)
    }))
    .filter(producto => producto.sugerencias.length > 0)
    .sort((a, b) => {
      // Ordenar por el score más alto de sus sugerencias
      const maxA = Math.max(...a.sugerencias.map(s => s.score))
      const maxB = Math.max(...b.sugerencias.map(s => s.score))
      return maxB - maxA
    })
})

// Computed para sugerencias filtradas con búsqueda
const sugerenciasFiltradasConBusqueda = computed(() => {
  let datos = sugerenciasFiltradas.value
  
  if (!busquedaSugerencias.value.trim()) return datos
  
  const busqueda = busquedaSugerencias.value.toLowerCase().trim()
  
  return datos.filter(producto => {
    const campos: string[] = [
      producto.codigo_mba3?.toString() || '',
      producto.nombre_mba3?.toString() || '',
      ...producto.sugerencias.map(s => s.codigo_sap?.toString() || ''),
      ...producto.sugerencias.map(s => s.nombre_sap?.toString() || '')
    ]
    
    return campos.some(campo => campo.toLowerCase().includes(busqueda))
  })
})

const sugerenciasPaginadas = computed(() => {
  const inicio = (paginaCruce.value - 1) * itemsPorPagina
  const fin = inicio + itemsPorPagina
  return sugerenciasFiltradasConBusqueda.value.slice(inicio, fin)
})

const totalPaginasSugerencias = computed(() => {
  return Math.ceil(sugerenciasFiltradasConBusqueda.value.length / itemsPorPagina)
})

// Métodos
async function cargarHomologaciones() {
  try {
    await store.fetchHomologaciones(store.currentPage)
  } catch (error: any) {
    toast.error('Error al cargar homologaciones', error.message)
  }
}

// Funciones para manejar la búsqueda
function onBusquedaChange() {
  // Resetear a la primera página cuando cambia la búsqueda
  paginaCruce.value = 1
}

function limpiarBusqueda() {
  busquedaCruce.value = ''
  paginaCruce.value = 1
}

function handleSkuSearch() {
  store.setSkuSearchFilter(skuSearch.value)
  store.currentPage = 1
  cargarHomologaciones()
}

function handleEstadoFilter() {
  // Si el filtro de estado está vacío y no queremos mostrar homologados, excluirlos
  aplicarFiltroEstado()
  store.currentPage = 1
  cargarHomologaciones()
}

function handleMostrarHomologados() {
  // Cuando cambia el checkbox, aplicar el filtro de estado
  aplicarFiltroEstado()
  store.currentPage = 1
  cargarHomologaciones()
}

function aplicarFiltroEstado() {
  // Si el usuario seleccionó un estado específico en el dropdown, usar ese
  if (estadoFilter.value) {
    store.setEstadoFilter(estadoFilter.value)
  } else {
    // Si no hay filtro específico, dejar vacío (el filtrado local se encargará)
    store.setEstadoFilter('')
  }
}

function handleTieneDiferenciasFilter() {
  store.setTieneDiferenciasFilter(tieneDiferenciasFilter.value)
  store.currentPage = 1
  cargarHomologaciones()
}

function handleTieneDatosSapFilter() {
  store.setTieneDatosSapFilter(tieneDatosSapFilter.value)
  store.currentPage = 1
  cargarHomologaciones()
}

function limpiarFiltros() {
  skuSearch.value = ''
  estadoFilter.value = ''
  tieneDiferenciasFilter.value = null
  tieneDatosSapFilter.value = null
  mostrarHomologados.value = false // Resetear a no mostrar homologados
  store.clearFilters()
  aplicarFiltroEstado()
  store.currentPage = 1
  cargarHomologaciones()
}

function cambiarPagina(page: number) {
  if (page >= 1 && page <= store.totalPages) {
    store.currentPage = page
    cargarHomologaciones()
  }
}


async function realizarCruce() {
  cruceLoading.value = true
  try {
    toast.info('Leyendo datos locales...', 'Consultando productos desde datos sincronizados')
    const response = await mba3ConsultasService.realizarCruce()
    cruceResultado.value = response.data
    tabActivo.value = 'exactos' // Mostrar primero los exactos
    toast.success('Cruce completado', response.message || 'El cruce de productos se ha completado exitosamente')
    
    // Cargar sugerencias automáticamente después del cruce para poder verificar qué productos tienen sugerencias
    if (sugerenciasData.value.length === 0) {
      // Cargar en segundo plano sin mostrar toast
      cargarSugerencias(false).catch(() => {
        // Silenciar errores en la carga automática
      })
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Error desconocido'
    
    // Manejo específico para staging no disponible
    if (errorMessage.includes('Staging no disponible') || errorMessage.includes('no están sincronizados')) {
      toast.error(
        'Datos no sincronizados',
        'Los datos no están sincronizados. Por favor, ejecuta la sincronización primero.',
        5000
      )
      // Cargar estado de sincronización para mostrar información
      await cargarEstadoSincronizacion()
    } else {
      toast.error('Error al realizar cruce', errorMessage)
    }
    cruceResultado.value = null
  } finally {
    cruceLoading.value = false
  }
}

async function cargarSugerencias(mostrarToast: boolean = true) {
  sugerenciasLoading.value = true
  try {
    if (mostrarToast) {
      toast.info('Leyendo sugerencias...', 'Consultando sugerencias desde datos locales')
    }
    const response = await mba3ConsultasService.obtenerSugerencias()
    sugerenciasData.value = response.data
    if (mostrarToast) {
      toast.success('Sugerencias cargadas', `Se encontraron ${response.data.length} productos con sugerencias`)
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Error desconocido'
    
    // Manejo específico para staging no disponible
    if (errorMessage.includes('Staging no disponible') || errorMessage.includes('no están sincronizados')) {
      if (mostrarToast) {
        toast.error(
          'Datos no sincronizados',
          'Los datos no están sincronizados. Por favor, ejecuta la sincronización primero.',
          5000
        )
      }
      await cargarEstadoSincronizacion()
    } else {
      if (mostrarToast) {
        toast.error('Error al cargar sugerencias', errorMessage)
      }
    }
    sugerenciasData.value = []
  } finally {
    sugerenciasLoading.value = false
  }
}

async function sincronizarMaestros() {
  const confirmar = confirm(
    '¿Deseas sincronizar los productos desde los sistemas ERP?\n\n' +
    'Este proceso puede tardar varios minutos y se ejecuta automáticamente cada 24 horas.\n\n' +
    '¿Continuar?'
  )
  
  if (!confirmar) return
  
  sincronizandoMaestros.value = true
  try {
    toast.info('Sincronizando maestros...', 'Este proceso puede tardar varios minutos. Por favor espera...')
    const response = await mba3ConsultasService.sincronizarMaestros()
    
    const detalles: string[] = []
    if (response.data?.mba3) {
      detalles.push(`MBA3: ${response.data.mba3.productos_sincronizados} productos`)
    }
    if (response.data?.sap) {
      detalles.push(`SAP: ${response.data.sap.productos_sincronizados} productos`)
    }
    
    toast.success(
      'Sincronización completada',
      detalles.length > 0 ? detalles.join(', ') : response.message || 'Sincronización exitosa'
    )
    
    // Actualizar estado de sincronización
    await cargarEstadoSincronizacion()
  } catch (error: any) {
    toast.error('Error al sincronizar', error.message || 'No se pudo completar la sincronización')
  } finally {
    sincronizandoMaestros.value = false
  }
}

async function cargarEstadoSincronizacion() {
  cargandoEstadoSync.value = true
  try {
    const response = await mba3ConsultasService.obtenerEstadoSincronizacion()
    estadoSincronizacion.value = response.data
  } catch (error: any) {
    console.warn('No se pudo cargar el estado de sincronización:', error)
    estadoSincronizacion.value = null
  } finally {
    cargandoEstadoSync.value = false
  }
}

function formatSyncDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Nunca sincronizado'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Hace menos de 1 minuto'
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
    
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return dateString
  }
}

function getSyncStatusClass(): string {
  if (!estadoSincronizacion.value) return 'border-gray-300'
  
  const isOld = isSyncOld()
  if (isOld) return 'border-yellow-400 bg-yellow-50'
  
  return 'border-green-400 bg-green-50'
}

function getSyncTextClass(sync?: { ultima_sync: string | null; estado?: string }): string {
  if (!sync || !sync.ultima_sync) return 'text-gray-500 italic'
  if (sync.estado === 'error') return 'text-red-600'
  return 'text-gray-700'
}

function isSyncOld(): boolean {
  if (!estadoSincronizacion.value) return false
  
  const checkSync = (sync?: { ultima_sync: string | null }) => {
    if (!sync || !sync.ultima_sync) return true
    
    try {
      const date = new Date(sync.ultima_sync)
      const now = new Date()
      const diffHours = (now.getTime() - date.getTime()) / 3600000
      return diffHours > 24 // Más de 24 horas
    } catch {
      return true
    }
  }
  
  return checkSync(estadoSincronizacion.value.mba3) || checkSync(estadoSincronizacion.value.sap)
}

function toggleProductoExpandido(codigo: string) {
  productoExpandido.value = productoExpandido.value === codigo ? null : codigo
}

function getScoreBadgeClass(score: number): string {
  const porcentaje = score * 100
  if (porcentaje >= 80) return 'bg-green-100 text-green-800'
  if (porcentaje >= 50) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function getScoreLabel(score: number): string {
  const porcentaje = score * 100
  if (porcentaje >= 80) return 'Alta'
  if (porcentaje >= 50) return 'Media'
  return 'Baja'
}

function aprobarSugerencia(producto: ProductoConSugerencias, sugerencia: any) {
  toast.info('Aprobando homologación...', `Aprobando match entre ${producto.codigo_mba3} y ${sugerencia.codigo_sap}`)
  // TODO: Implementar endpoint de aprobación
  console.log('Aprobar:', { producto, sugerencia })
}

function descartarSugerencia(producto: ProductoConSugerencias, sugerencia: any) {
  toast.info('Descartando sugerencia...', `Descartando match entre ${producto.codigo_mba3} y ${sugerencia.codigo_sap}`)
  // TODO: Implementar endpoint de descarte
  console.log('Descartar:', { producto, sugerencia })
}

function toggleMotivos(codigoProducto: string, indexSugerencia: number) {
  const key = `${codigoProducto}-${indexSugerencia}`
  motivosExpandidos.value[key] = !motivosExpandidos.value[key]
}

// Función para verificar si un producto tiene sugerencias
function tieneSugerencias(codigoMba3: string): boolean {
  // Si las sugerencias no están cargadas, no podemos saber si tiene sugerencias
  // En ese caso, retornamos false para deshabilitar el botón
  if (sugerenciasData.value.length === 0) {
    return false
  }
  
  // Buscar el producto en la lista de sugerencias
  const producto = sugerenciasData.value.find(p => p.codigo_mba3 === codigoMba3)
  
  // Verificar si el producto existe y tiene sugerencias (filtrando por score mínimo)
  if (!producto || !producto.sugerencias || producto.sugerencias.length === 0) {
    return false
  }
  
  // Verificar si tiene sugerencias que cumplan con el score mínimo
  const sugerenciasValidas = producto.sugerencias.filter(s => (s.score * 100) >= scoreMinimo.value)
  return sugerenciasValidas.length > 0
}

function verSugerenciasProducto(codigo: string) {
  // Verificar si realmente tiene sugerencias antes de proceder
  if (!tieneSugerencias(codigo)) {
    toast.warning('Sin sugerencias', `El producto ${codigo} no tiene sugerencias disponibles`)
    return
  }
  
  // Cambiar a pestaña de sugerencias
  tabActivo.value = 'sugerencias'
  paginaCruce.value = 1
  
  // Cargar sugerencias si no están cargadas
  if (sugerenciasData.value.length === 0) {
    cargarSugerencias().then(() => {
      // Después de cargar, verificar nuevamente y expandir si tiene sugerencias
      if (tieneSugerencias(codigo)) {
        setTimeout(() => {
          productoExpandido.value = codigo
          const elemento = document.querySelector(`[data-producto="${codigo}"]`)
          if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 500)
      }
    })
  } else {
    // Expandir el producto específico cuando se carguen las sugerencias
    setTimeout(() => {
      productoExpandido.value = codigo
      // Scroll al producto si está visible
      const elemento = document.querySelector(`[data-producto="${codigo}"]`)
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }
}

// Función para copiar al portapapeles
async function copiarAlPortapapeles(texto: string, tipo: string) {
  if (!texto || texto === '-') {
    toast.warning('Sin contenido', 'No hay texto para copiar')
    return
  }

  try {
    await navigator.clipboard.writeText(texto)
    const tipoLabel = tipo === 'codigo_mba3' ? 'SKU MBA3' : 'SKU SAP'
    toast.success('Copiado', `${tipoLabel} "${texto}" copiado al portapapeles`)
  } catch (error: any) {
    console.error('Error al copiar al portapapeles:', error)
    // Fallback para navegadores que no soportan clipboard API
    try {
      const textArea = document.createElement('textarea')
      textArea.value = texto
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      const tipoLabel = tipo === 'codigo_mba3' ? 'SKU MBA3' : 'SKU SAP'
      toast.success('Copiado', `${tipoLabel} "${texto}" copiado al portapapeles`)
    } catch (fallbackError) {
      toast.error('Error al copiar', 'No se pudo copiar al portapapeles')
    }
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

function getComparisonClass(mba3Value: number | null | undefined, sapValue: number | null | undefined): string {
  if (sapValue === null || sapValue === undefined) return 'text-red-600'
  if (mba3Value === null || mba3Value === undefined) return 'text-green-600'
  if (Math.abs(mba3Value - sapValue) < 0.01) return 'text-green-600'
  return 'text-orange-600'
}

function getEstadoClass(estado: string): string {
  switch (estado) {
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-800'
    case 'HOMOLOGADO':
      return 'bg-green-100 text-green-800'
    case 'ERROR':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'PENDIENTE':
      return 'Pendiente'
    case 'HOMOLOGADO':
      return 'Homologado'
    case 'ERROR':
      return 'Error'
    default:
      return estado
  }
}

function getTabButtonClass(tabId: string, color: string): string {
  const isActive = tabActivo.value === tabId
  const baseClasses = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
  
  if (!isActive) {
    return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`
  }
  
  // Clases activas según el color
  const colorClasses: Record<string, string> = {
    green: 'border-green-500 text-green-600',
    yellow: 'border-yellow-500 text-yellow-600',
    red: 'border-red-500 text-red-600',
    indigo: 'border-indigo-500 text-indigo-600',
    blue: 'border-blue-500 text-blue-600',
    violet: 'border-violet-500 text-violet-600',
  }
  
  return `${baseClasses} ${colorClasses[color] || 'border-gray-500 text-gray-600'}`
}

function getTabBadgeClass(tabId: string, color: string): string {
  const isActive = tabActivo.value === tabId
  const baseClasses = 'ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium'
  
  if (!isActive) {
    return `${baseClasses} bg-gray-100 text-gray-600`
  }
  
  // Clases activas según el color
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
  }
  
  return `${baseClasses} ${colorClasses[color] || 'bg-gray-100 text-gray-600'}`
}

// Watch para resetear página y búsqueda al cambiar de tab
watch(tabActivo, () => {
  paginaCruce.value = 1
  // Opcional: limpiar búsqueda al cambiar de tab
  // busquedaCruce.value = ''
  // busquedaSugerencias.value = ''
})

// Cargar datos al montar
onMounted(async () => {
  // Cargar estado de sincronización primero
  await cargarEstadoSincronizacion()
  
  // Inicializar columnas visibles
  inicializarColumnasVisibles()
  
  // Verificar si hay parámetros de query (sku o despacho_id) para aplicar filtros automáticamente
  const querySku = route.query.sku as string | undefined
  const queryDespachoId = route.query.despacho_id as string | undefined
  
  if (querySku) {
    // Si hay un SKU en los query params, aplicarlo al filtro de búsqueda
    skuSearch.value = querySku
    store.setSkuSearchFilter(querySku)
    toast.info('Filtro aplicado', `Mostrando homologaciones para SKU: ${querySku}`)
  }
  
  if (queryDespachoId) {
    // Si hay un despacho_id, podríamos filtrar por él (aunque el backend no lo soporta aún)
    // Por ahora solo mostramos un mensaje informativo
    toast.info('Despacho seleccionado', `Despacho ID: ${queryDespachoId}`)
  }
  
  aplicarFiltroEstado()
  cargarHomologaciones()
})

// Watch para resetear la página cuando cambia el tab activo
watch(tabActivo, (newTab) => {
  paginaCruce.value = 1
  productoExpandido.value = null
  
  // Cargar sugerencias automáticamente cuando se cambia a esa pestaña
  if (newTab === 'sugerencias' && sugerenciasData.value.length === 0) {
    cargarSugerencias()
  }
})
</script>

