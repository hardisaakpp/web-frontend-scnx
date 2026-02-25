<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      @click.self="$emit('close')"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" @click.self="$emit('close')"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 shadow-xl transition-all w-full max-w-3xl max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex-shrink-0">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Error al Generar Orden de Compra
              </h3>
              <button
                @click="$emit('close')"
                class="text-white hover:text-gray-200 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-4 overflow-y-auto flex-1">
            <!-- Información del error -->
            <div class="mb-6 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">{{ errorFormatted.title }}</h4>
                  <p v-if="errorFormatted.description" class="text-sm text-red-800 dark:text-red-300">{{ errorFormatted.description }}</p>
                </div>
              </div>
            </div>

            <!-- Detalles técnicos -->
            <div class="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3">Detalles Técnicos</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Código de Error:</span>
                  <p class="font-mono font-medium text-gray-900 dark:text-gray-100 mt-1">{{ errorData.errorCode || 'N/A' }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Origen del Error:</span>
                  <p class="font-medium text-gray-900 dark:text-gray-100 mt-1">{{ errorData.errorSource || 'N/A' }}</p>
                </div>
                <div v-if="errorData.errorMessage" class="col-span-2">
                  <span class="text-gray-500 dark:text-gray-400">Mensaje Completo:</span>
                  <p class="text-sm text-gray-900 dark:text-gray-100 mt-1 break-words">{{ errorData.errorMessage }}</p>
                </div>
              </div>
            </div>

            <!-- Acciones Sugeridas -->
            <div v-if="errorFormatted.suggestedActions && errorFormatted.suggestedActions.length > 0" class="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Acciones Sugeridas
              </h4>
              <ul class="space-y-2">
                <li
                  v-for="(action, index) in errorFormatted.suggestedActions"
                  :key="index"
                  class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{{ action }}</span>
                </li>
              </ul>
            </div>

            <!-- Acciones rápidas -->
            <div class="flex flex-wrap gap-2">
              <button
                v-if="errorData.errorCode && (errorData.errorCode.includes('ITEMCODE') || errorData.errorCode.includes('SKU') || errorData.errorCode === '-5002')"
                @click="handleGoToODCErrores"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Ir a ODC con Errores
              </button>
              <button
                @click="handleGoToHomologaciones"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ver Homologaciones
              </button>
              <button
                @click="handleRetry"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reintentar
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex justify-end gap-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity'
import { useRouter } from 'vue-router'
import { formatSapError } from '../composables/useSapErrorMessages'

interface Props {
  errorData: {
    errorCode?: string | null
    errorSource?: string | null
    errorMessage?: string | null
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  retry: []
}>()

const router = useRouter()

const errorFormatted = computed(() => {
  return formatSapError(
    props.errorData.errorSource,
    props.errorData.errorCode,
    props.errorData.errorMessage
  )
})

function handleGoToODCErrores() {
  router.push('/mba3-consultas/odc-errores')
  emit('close')
}

function handleGoToHomologaciones() {
  router.push('/mba3-consultas/homologaciones')
  emit('close')
}

function handleRetry() {
  emit('retry')
}
</script>
