<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <button
      type="button"
      class="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
      @click="volver"
    >
      <span aria-hidden="true">←</span> Volver
    </button>
    <div class="space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Aprobaciones</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Aprobar o rechazar liquidaciones pendientes</p>
      </div>

      <!-- Contenido -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p class="text-gray-500 dark:text-gray-400">Vista de Aprobaciones en construcción</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const volver = () => {
  router.back()
}
</script>
