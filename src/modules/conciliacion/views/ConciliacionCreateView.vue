<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Header más compacto -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Crear Conciliación</h1>
        <p class="mt-1 text-sm text-gray-600">Suba un documento y complete el formulario</p>
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

      <!-- Contenido con menos espacio -->
      <div class="space-y-6">
        <!-- Sección 1: Carga de documento -->
        <DocumentoUpload 
          @uploaded="handleDocumentoUploaded"
          @reset="handleDocumentoReset"
        />

        <!-- Sección 2: Formulario -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Información de la Conciliación</h2>
          <ConciliacionCreateForm 
            :documento-id="documentoId"
            @created="handleConciliacionCreated"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'
import DocumentoUpload from '../components/DocumentoUpload.vue'
import ConciliacionCreateForm from '../components/ConciliacionCreateForm.vue'

const router = useRouter()
const store = useConciliacionStore()
const toast = useToast()

const documentoId = ref<string | undefined>(undefined)

const handleDocumentoUploaded = (id: string) => {
  documentoId.value = id
}

const handleDocumentoReset = () => {
  documentoId.value = undefined
}

const handleConciliacionCreated = () => {
  // Opcional: redirigir a la lista de conciliaciones o mostrar éxito
  toast.success('Conciliación creada', 'La conciliación se ha creado exitosamente')
  
  // Opcional: redirigir después de un breve delay
  setTimeout(() => {
    router.push({ name: 'conciliacion' })
  }, 2000)
}
</script>

