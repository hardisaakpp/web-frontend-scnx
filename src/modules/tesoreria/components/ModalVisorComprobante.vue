<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      aria-modal="true"
      :aria-labelledby="tituloId"
      class="tesoreria-modal max-w-2xl rounded-2xl"
      @cancel.prevent.stop="cerrar"
      @keydown.esc.stop
      @click="onBackdropClick"
    >
      <div
        v-if="open"
        class="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <header class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <h2 :id="tituloId" class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <DocumentTextIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
            {{ fileName || 'Comprobante de depósito' }}
          </h2>
          <button
            ref="closeButtonRef"
            type="button"
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            aria-label="Cerrar visor de comprobante"
            @click="cerrar"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div class="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
          <p v-if="loading" role="status" class="py-16 text-center text-sm text-gray-500 dark:text-gray-400">Cargando comprobante…</p>
          <div v-else-if="!fileUrl" role="alert" class="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-500 dark:text-gray-400">
            <ExclamationTriangleIcon class="h-8 w-8 text-amber-500" aria-hidden="true" />
            <p class="max-w-sm text-sm">
              No fue posible cargar el comprobante. Verifique su conexión o contacte a soporte si el problema persiste.
            </p>
          </div>
          <iframe
            v-else-if="esPdf"
            :src="fileUrl"
            :title="`Vista previa de ${fileName || 'comprobante'}`"
            class="h-[65vh] w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
          />
          <img
            v-else
            :src="fileUrl"
            :alt="`Comprobante de depósito ${fileName ? `— ${fileName}` : ''}`"
            class="mx-auto max-h-[65vh] rounded-lg border border-gray-200 dark:border-gray-700 object-contain"
          />
        </div>

        <footer class="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 px-5 py-3">
          <a
            v-if="fileUrl"
            :href="fileUrl"
            :download="fileName || 'comprobante'"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <ArrowDownTrayIcon class="h-4 w-4" aria-hidden="true" />
            Descargar
          </a>
          <button
            type="button"
            class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            @click="cerrar"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { ArrowDownTrayIcon, DocumentTextIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useDialogModal } from '../composables/useDialogModal'

const props = defineProps<{
  open: boolean
  loading?: boolean
  fileUrl: string | null
  fileName?: string | null
  mimeType?: string | null
}>()

const emit = defineEmits<(e: 'close') => void>()

const tituloId = `visor-comprobante-titulo-${Math.random().toString(36).slice(2, 9)}`
const dialogRef = ref<HTMLDialogElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)

const esPdf = computed(() => {
  if (props.mimeType) return props.mimeType.includes('pdf')
  return !!props.fileName?.toLowerCase().endsWith('.pdf')
})

function cerrar(): void {
  dialogRef.value?.close()
  emit('close')
}

const { onBackdropClick } = useDialogModal(dialogRef, toRef(props, 'open'), closeButtonRef, cerrar)
</script>
