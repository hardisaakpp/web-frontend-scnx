<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="cerrar">
      <TransitionChild enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-black bg-opacity-40" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-start justify-center p-4 pt-16">
          <TransitionChild enter="ease-out duration-200" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100" leave="ease-in duration-150" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95">
            <DialogPanel class="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-xl">
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <DialogTitle class="text-base font-semibold text-gray-900 dark:text-white">
                    Usuarios de picking
                  </DialogTitle>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Sesión {{ session?.sessionId.slice(0, 8) }}… — {{ session?.warehouseCode }} {{ session?.warehouseName }}
                  </p>
                </div>
                <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="cerrar">
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>

              <div class="px-6 py-5 space-y-4">
                <div v-if="error" class="alert-error">{{ error }}</div>

                <!-- Descripción del acceso -->
                <div class="rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
                  Los usuarios asignados aquí podrán acceder directamente a esta sesión de conteo para registrar tomas físicas. No tendrán acceso al resto del sistema de inventario.
                </div>

                <!-- Agregar usuario -->
                <div>
                  <label class="label">Agregar usuario (nombre de usuario AD)</label>
                  <div class="mt-1 flex gap-2">
                    <input
                      v-model="nuevoUserId"
                      type="text"
                      class="input flex-1"
                      placeholder="Ej: jperez o jperez@empresa.com"
                      @keydown.enter.prevent="agregarPicker"
                      :disabled="agregando"
                    />
                    <button
                      type="button"
                      class="btn-primary flex-shrink-0"
                      :disabled="!nuevoUserId.trim() || agregando"
                      @click="agregarPicker"
                    >
                      {{ agregando ? '...' : 'Agregar' }}
                    </button>
                  </div>
                </div>

                <!-- Lista de pickers -->
                <div>
                  <p class="label mb-2">
                    Usuarios asignados
                    <span class="font-normal text-gray-400">({{ pickers.length }})</span>
                  </p>

                  <div v-if="loadingPickers" class="py-4 text-center text-sm text-gray-400">
                    Cargando...
                  </div>
                  <div v-else-if="pickers.length === 0" class="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                    No hay usuarios asignados a esta sesión.
                  </div>
                  <div v-else class="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700 max-h-56 overflow-y-auto">
                    <div
                      v-for="p in pickers"
                      :key="p.id"
                      class="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{{ p.userId }}</div>
                        <div class="text-xs text-gray-400 dark:text-gray-500">
                          Asignado por {{ p.assignedByUserId }} · {{ formatDate(p.assignedAt) }}
                        </div>
                      </div>
                      <button
                        type="button"
                        class="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        :disabled="eliminando === p.userId"
                        @click="quitarPicker(p.userId)"
                      >
                        {{ eliminando === p.userId ? '...' : 'Quitar' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-end px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" class="btn-secondary" @click="cerrar">Cerrar</button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { inventarioSesionesService } from '../services/inventarioSesionesApi'
import type { InventorySessionListItemDto, InventorySessionPickerDto } from '../types'

const props = defineProps<{
  isOpen: boolean
  session: InventorySessionListItemDto | null
}>()

const emit = defineEmits<{ close: [] }>()

const pickers = ref<InventorySessionPickerDto[]>([])
const loadingPickers = ref(false)
const nuevoUserId = ref('')
const agregando = ref(false)
const eliminando = ref<string | null>(null)
const error = ref<string | null>(null)

watch(() => props.isOpen, async (open) => {
  if (!open || !props.session) return
  error.value = null
  nuevoUserId.value = ''
  await cargarPickers()
})

async function cargarPickers() {
  if (!props.session) return
  loadingPickers.value = true
  try {
    pickers.value = await inventarioSesionesService.getPickers(props.session.sessionId)
  } catch (e: any) {
    error.value = e.message ?? 'Error al cargar pickers.'
  } finally {
    loadingPickers.value = false
  }
}

async function agregarPicker() {
  const userId = nuevoUserId.value.trim()
  if (!userId || !props.session) return
  agregando.value = true
  error.value = null
  try {
    const picker = await inventarioSesionesService.addPicker(props.session.sessionId, userId)
    pickers.value.push(picker)
    nuevoUserId.value = ''
  } catch (e: any) {
    error.value = e.message ?? 'Error al agregar usuario.'
  } finally {
    agregando.value = false
  }
}

async function quitarPicker(userId: string) {
  if (!props.session) return
  eliminando.value = userId
  error.value = null
  try {
    await inventarioSesionesService.removePicker(props.session.sessionId, userId)
    pickers.value = pickers.value.filter(p => p.userId !== userId)
  } catch (e: any) {
    error.value = e.message ?? 'Error al quitar usuario.'
  } finally {
    eliminando.value = null
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + new Date(value).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function cerrar() {
  emit('close')
}
</script>

<style scoped>
.label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300; }
.input { @apply block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500; }
.btn-primary { @apply inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed; }
.btn-secondary { @apply inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700; }
.alert-error { @apply rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300; }
</style>
