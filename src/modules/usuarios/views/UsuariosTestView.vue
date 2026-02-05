<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Módulo de usuarios funcionando correctamente</p>
      </div>

      <!-- Contenido de prueba -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-8">
        <div class="text-center space-y-4">
          <svg class="w-16 h-16 text-green-600 dark:text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-xl font-medium text-gray-900 dark:text-white">¡Módulo de Usuarios Funcionando!</h2>
          <p class="text-gray-600 dark:text-gray-400">Esta es una vista de prueba simple para verificar que el routing funciona correctamente.</p>
          
          <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">15</div>
              <div class="text-sm text-blue-800 dark:text-blue-300 mt-1">Usuarios Activos</div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div class="text-3xl font-bold text-green-600 dark:text-green-400">5</div>
              <div class="text-sm text-green-800 dark:text-green-300 mt-1">Roles</div>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">25</div>
              <div class="text-sm text-purple-800 dark:text-purple-300 mt-1">Permisos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vista de prueba simple
</script>
