<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60"></div>

      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="tituloId"
        class="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        @keydown="onKeydown"
      >
        <div class="px-5 py-4">
          <h2 :id="tituloId" class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <ExclamationTriangleIcon class="h-5 w-5 text-amber-500" aria-hidden="true" />
            Anular papeleta {{ numeroComprobante }}
          </h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Esta acción marcará el depósito como anulado y quedará registrada en la auditoría. No se puede deshacer.
          </p>

          <label for="motivoAnulacion" class="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo de la anulación <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <textarea
            id="motivoAnulacion"
            ref="primerCampoRef"
            v-model="motivo"
            rows="3"
            maxlength="250"
            placeholder="Ej. Comprobante ingresado por error, se registró duplicado con el número correcto."
            class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
          <p class="mt-1 text-xs text-gray-400">{{ motivo.length }}/250</p>
        </div>

        <footer class="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 px-5 py-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            @click="cerrar"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="motivo.trim().length < 5 || anulando"
            :aria-busy="anulando"
            class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            @click="confirmar"
          >
            <svg v-if="anulando" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {{ anulando ? 'Anulando…' : 'Confirmar anulación' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useModalFocusTrap } from '../composables/useModalFocusTrap'

const props = defineProps<{
  open: boolean
  numeroComprobante: string
  anulando: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmar', motivo: string): void
}>()

const tituloId = `anular-deposito-titulo-${Math.random().toString(36).slice(2, 9)}`
const dialogRef = ref<HTMLElement | null>(null)
const primerCampoRef = ref<HTMLTextAreaElement | null>(null)
const motivo = ref('')

function cerrar(): void {
  emit('close')
}

function confirmar(): void {
  if (motivo.value.trim().length < 5) return
  emit('confirmar', motivo.value.trim())
}

watch(() => props.open, (isOpen) => {
  if (isOpen) motivo.value = ''
})

const { onKeydown } = useModalFocusTrap(dialogRef, primerCampoRef, toRef(props, 'open'), cerrar)
</script>
