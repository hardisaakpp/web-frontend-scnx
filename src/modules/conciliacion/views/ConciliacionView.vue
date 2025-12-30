<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header más compacto -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Crear Conciliación</h1>
        <p class="mt-1 text-sm text-gray-600">Suba un archivo Excel para procesar la conciliación</p>
      </div>

      <!-- Error message -->
      <div v-if="store.error" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
        <div class="flex items-center justify-between">
          <p>{{ store.error }}</p>
          <button 
            @click="store.clearError()" 
            class="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Contenido -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <DocumentoUpload 
          @uploaded="handleDocumentoUploaded"
          @reset="handleDocumentoReset"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConciliacionStore } from '../stores/conciliacionStore'
import DocumentoUpload from '../components/DocumentoUpload.vue'

const store = useConciliacionStore()

const handleDocumentoUploaded = (id: string) => {
  // Documento cargado exitosamente
}

const handleDocumentoReset = () => {
  // Documento reseteado
}
</script>
