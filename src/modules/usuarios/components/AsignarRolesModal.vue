<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
      <div class="fixed inset-0 bg-black bg-opacity-30" />
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
            <DialogTitle class="text-lg font-medium text-gray-900 mb-4">
              Gestionar Roles - {{ usuario?.fullName }}
            </DialogTitle>

            <div class="space-y-4">
              <!-- Roles actuales -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Roles Asignados</h3>
                <div class="flex flex-wrap gap-2 mb-4">
                  <span
                    v-for="role in usuario?.roles"
                    :key="role"
                    class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                  >
                    {{ role }}
                    <button @click="() => emit('remover-rol', role)" class="hover:text-indigo-900">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                </div>
              </div>

              <!-- Agregar nuevo rol -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 mb-2">Agregar Rol</h3>
                <div class="flex gap-2">
                  <select
                    v-model="selectedRole"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar rol...</option>
                    <option v-for="role in rolesDisponibles" :key="role.name" :value="role.name">
                      {{ role.name }}
                    </option>
                  </select>
                  <button
                    @click="handleAsignar"
                    :disabled="!selectedRole || loading"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Asignar
                  </button>
                </div>
              </div>

              <div class="flex gap-3 mt-6">
                <button
                  @click="close"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'
import type { Usuario, Rol } from '../types'

interface Props {
  isOpen: boolean
  usuario: Usuario | null
  roles: Rol[]
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'asignar-rol', roleName: string): void
  (e: 'remover-rol', roleName: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedRole = ref('')

const rolesDisponibles = computed(() => 
  props.roles.filter(r => !props.usuario?.roles.includes(r.name))
)

const close = () => {
  selectedRole.value = ''
  emit('close')
}

const handleAsignar = () => {
  if (selectedRole.value) {
    emit('asignar-rol', selectedRole.value)
    selectedRole.value = ''
  }
}
</script>
