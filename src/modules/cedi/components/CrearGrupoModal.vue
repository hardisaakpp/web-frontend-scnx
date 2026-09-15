<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { RectangleStackIcon } from '@heroicons/vue/24/outline'
import type { SolicitudTransferenciaDto, TipoGrupo } from '../types'

/** "Crea Lista D." (P-008) — a diferencia de ConfirmActionModal, esto es un formulario de alta, no una confirmación de riesgo. */
const props = defineProps<{
  open: boolean
  solicitudes: SolicitudTransferenciaDto[]
  busy?: boolean
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [{ nombre: string; almacen: string; tipo: TipoGrupo }]
}>()

const nombre = ref('')
const almacen = ref('')
const tipo = ref<TipoGrupo>('Crossdocking')

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nombre.value = ''
    almacen.value = props.solicitudes[0]?.almacenOrigen ?? ''
    tipo.value = 'Crossdocking'
  }
})

function onSubmit() {
  if (!nombre.value.trim() || !almacen.value.trim()) return
  emit('confirm', { nombre: nombre.value.trim(), almacen: almacen.value.trim(), tipo: tipo.value })
}
</script>

<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog class="relative z-50" @close="emit('cancel')">
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
          <DialogPanel class="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <div class="px-5 py-4 flex items-center gap-3 bg-blue-600">
              <RectangleStackIcon class="w-6 h-6 text-white shrink-0" />
              <DialogTitle class="text-white font-bold text-lg">Crear Grupo</DialogTitle>
            </div>

            <form class="p-5 space-y-4" @submit.prevent="onSubmit">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Se van a consolidar <strong>{{ solicitudes.length }}</strong> solicitud(es) en un grupo nuevo
                y se van a bloquear en SAP:
                <span class="block mt-1 font-mono text-xs text-gray-400">
                  {{ solicitudes.map(s => s.numDoc).join(', ') }}
                </span>
              </p>

              <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Nombre
                <input
                  v-model="nombre"
                  type="text"
                  required
                  placeholder="Ej: Reposición semana 34 - Costa"
                  class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div class="grid grid-cols-2 gap-4">
                <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Almacén origen
                  <input
                    v-model="almacen"
                    type="text"
                    required
                    class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tipo
                  <select
                    v-model="tipo"
                    class="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Crossdocking">Crossdocking</option>
                    <option value="Reposicion">Reposición</option>
                  </select>
                </label>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  class="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="emit('cancel')"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="busy"
                  class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold shadow-sm min-w-[140px]"
                >
                  {{ busy ? 'Creando...' : 'Crear grupo' }}
                </button>
              </div>
            </form>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
