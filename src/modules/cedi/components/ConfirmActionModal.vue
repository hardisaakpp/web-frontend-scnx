<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

/**
 * Confirmación para acciones de supervisor (resetear escaneo / marcar completo sin
 * escanear) — no se cierra con Escape ni clic afuera (@close vacío a propósito). Con
 * `delaySeconds > 0` el botón de confirmar queda deshabilitado y cuenta hacia atrás,
 * para forzar a leer el aviso antes de poder confirmar (pedido explícito del usuario
 * para el reset, en vez de una clave fija como hacía el legacy).
 */
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  delaySeconds?: number
  accent?: 'red' | 'amber'
  /** Deshabilita el botón de confirmar independiente de la cuenta regresiva (mientras se guarda). */
  busy?: boolean
}>(), {
  confirmLabel: 'Confirmar',
  delaySeconds: 0,
  accent: 'red',
  busy: false,
})

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const remaining = ref(props.delaySeconds)
let timer: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(() => props.open, (isOpen) => {
  stopTimer()
  if (isOpen) {
    remaining.value = props.delaySeconds
    if (props.delaySeconds > 0) {
      timer = setInterval(() => {
        remaining.value -= 1
        if (remaining.value <= 0) stopTimer()
      }, 1000)
    }
  }
})
</script>

<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog class="relative z-50" @close="() => {}">
      <TransitionChild
        enter="duration-200 ease-out" enter-from="opacity-0" enter-to="opacity-100"
        leave="duration-150 ease-in" leave-from="opacity-100" leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50" />
      </TransitionChild>

      <div class="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          enter="duration-200 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
          leave="duration-150 ease-in" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95"
        >
          <DialogPanel
            class="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
            :class="accent === 'red' ? 'ring-1 ring-red-500/20' : 'ring-1 ring-amber-500/20'"
          >
            <div class="px-5 py-4 flex items-center gap-3" :class="accent === 'red' ? 'bg-red-600' : 'bg-amber-500'">
              <ExclamationTriangleIcon class="w-7 h-7 text-white shrink-0" />
              <DialogTitle class="text-white font-bold text-lg">{{ title }}</DialogTitle>
            </div>

            <div class="p-5">
              <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ message }}</p>
              <slot />
            </div>

            <div class="px-5 py-4 bg-gray-50 dark:bg-gray-900/40 flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="emit('cancel')"
              >
                Cancelar
              </button>
              <button
                type="button"
                :disabled="remaining > 0 || busy"
                class="px-5 py-2.5 rounded-lg text-white font-semibold shadow-sm min-w-[150px] disabled:opacity-50 disabled:cursor-not-allowed"
                :class="accent === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'"
                @click="emit('confirm')"
              >
                {{ remaining > 0 ? `Esperá ${remaining}s...` : confirmLabel }}
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
