<script setup lang="ts">
import BuscarOdcBar from '../components/BuscarOdcBar.vue'
</script>

<template>
  <div class="max-w-xl mx-auto py-10 px-4">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Recepción Proveedores</h1>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Busca una orden de compra por su número (DocNum).</p>

    <BuscarOdcBar autofocus />
  </div>
</template>
