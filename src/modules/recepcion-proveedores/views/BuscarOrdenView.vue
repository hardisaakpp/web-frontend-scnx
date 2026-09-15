<script setup lang="ts">
import BuscarOdcBar from '../components/BuscarOdcBar.vue'
import VolverButton from '@/components/navegacion/VolverButton.vue'
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <VolverButton to="/recepcion-proveedores" title="Volver" class="shrink-0 self-start mb-4" />

    <div class="max-w-xl mx-auto">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Recepción Proveedores</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Busca una orden de compra por su número (DocNum).</p>

      <BuscarOdcBar autofocus />
    </div>
  </div>
</template>
