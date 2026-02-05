<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Caja Chica</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de liquidaciones y gastos menores</p>
      </div>

      <!-- Estadísticas -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
        <div class="grid grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-semibold text-orange-600 dark:text-orange-400">12</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Pendientes</div>
          </div>
          <div class="text-center border-x border-gray-200 dark:border-gray-700">
            <div class="text-2xl font-semibold text-blue-600 dark:text-blue-400">8</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">En Revisión</div>
          </div>
          <div class="text-center border-r border-gray-200 dark:border-gray-700">
            <div class="text-2xl font-semibold text-green-600 dark:text-green-400">45</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Aprobadas</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-red-600 dark:text-red-400">3</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Rechazadas</div>
          </div>
        </div>
      </div>

      <!-- Menú de Opciones -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Liquidaciones -->
        <router-link
          to="/caja-chica/liquidaciones"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Liquidaciones</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Gestión de liquidaciones de caja chica</div>
            </div>
          </div>
        </router-link>

        <!-- Aprobaciones -->
        <router-link
          to="/caja-chica/aprobaciones"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Aprobaciones</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Aprobar o rechazar liquidaciones</div>
            </div>
          </div>
        </router-link>

        <!-- Catálogo de Gastos -->
        <router-link
          to="/caja-chica/catalogo-gastos"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Catálogo de Gastos</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Tipos de gastos permitidos</div>
            </div>
          </div>
        </router-link>

        <!-- Aprobadores por Tienda -->
        <router-link
          to="/caja-chica/aprobadores"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Aprobadores por Tienda</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Configurar aprobadores</div>
            </div>
          </div>
        </router-link>

        <!-- Almacenes -->
        <router-link
          to="/caja-chica/almacenes"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Almacenes</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Gestión de almacenes y tiendas</div>
            </div>
          </div>
        </router-link>

        <!-- Formas de Pago -->
        <router-link
          to="/caja-chica/formas-pago"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Formas de Pago</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Métodos de pago disponibles</div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Información adicional -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-blue-900 dark:text-blue-300">Información</h3>
            <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Seleccione una opción del menú para gestionar los diferentes aspectos del módulo de Caja Chica.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dashboard principal de Caja Chica
</script>
