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

          <!-- Banner de advertencia exclusivo para depósitos ya integrados en SAP -->
          <div
            v-if="creadoSAP"
            role="alert"
            class="mt-4 flex items-start gap-2 rounded-lg border border-vermilion-300 bg-vermilion-50 px-3 py-2.5 text-sm text-vermilion-800 dark:border-vermilion-800 dark:bg-vermilion-950/30 dark:text-vermilion-300"
          >
            <ExclamationTriangleIcon class="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <p>
              <strong>ATENCIÓN:</strong> Este depósito se encuentra contabilizado en SAP Business One con
              <strong>DocEntry {{ docEntrySAP ?? '—' }}</strong>. La anulación local debe ejecutarse únicamente
              después de haber cancelado el documento en SAP Desktop (Gestión de Bancos &gt; Depósitos &gt; Cancelar),
              para evitar descuadres fiscales.
            </p>
          </div>

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

          <!-- Checkbox obligatorio de confirmación de reversión manual en SAP Desktop -->
          <label
            v-if="creadoSAP"
            class="mt-3 flex items-start gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 cursor-pointer"
          >
            <input
              v-model="confirmacionSapReversado"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Confirmo que este depósito (DocEntry {{ docEntrySAP ?? '—' }}) ya fue cancelado previamente en SAP Business One Desktop.
            </span>
          </label>
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
            :disabled="!formularioValido || anulando"
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
import { computed, ref, toRef, watch } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useModalFocusTrap } from '../composables/useModalFocusTrap'

const props = defineProps<{
  open: boolean
  numeroComprobante: string
  anulando: boolean
  /** Cuando es true, exige el checkbox de confirmación de reversión manual en SAP Desktop. */
  creadoSAP?: boolean
  docEntrySAP?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmar', motivo: string, confirmacionSapReversado: boolean): void
}>()

const tituloId = `anular-deposito-titulo-${Math.random().toString(36).slice(2, 9)}`
const dialogRef = ref<HTMLElement | null>(null)
const primerCampoRef = ref<HTMLTextAreaElement | null>(null)
const motivo = ref('')
const confirmacionSapReversado = ref(false)

const formularioValido = computed(() =>
  motivo.value.trim().length >= 5 && (!props.creadoSAP || confirmacionSapReversado.value)
)

function cerrar(): void {
  emit('close')
}

function confirmar(): void {
  if (!formularioValido.value) return
  emit('confirmar', motivo.value.trim(), confirmacionSapReversado.value)
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    motivo.value = ''
    confirmacionSapReversado.value = false
  }
})

const { onKeydown } = useModalFocusTrap(dialogRef, primerCampoRef, toRef(props, 'open'), cerrar)
</script>
