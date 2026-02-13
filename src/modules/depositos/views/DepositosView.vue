<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Depósitos</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Administración de depósitos bancarios</p>
      </div>
      <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors">
        Nuevo Depósito
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Lista de Depósitos</h2>
      </div>
      <div class="p-6">
        <p class="text-gray-500 dark:text-gray-400">Contenido del módulo de depósitos</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Módulo Depósitos
</script>
