<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-30" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
              <DialogTitle class="text-lg font-medium text-gray-900 mb-4">
                {{ usuario ? 'Editar Usuario' : 'Crear Usuario' }}
              </DialogTitle>

              <form @submit.prevent="handleSubmit" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                  <input
                    v-model="form.userName"
                    type="text"
                    required
                    :disabled="!!usuario"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    v-model="form.email"
                    type="email"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    v-model="form.fullName"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div v-if="!usuario">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    v-model="form.password"
                    type="password"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div v-if="usuario" class="flex items-center">
                  <input
                    v-model="form.isActive"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label class="ml-2 block text-sm text-gray-700">Usuario activo</label>
                </div>

                <div class="flex gap-3 mt-6">
                  <button
                    type="button"
                    @click="close"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    :disabled="loading"
                    class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {{ loading ? 'Guardando...' : usuario ? 'Actualizar' : 'Crear' }}
                  </button>
                </div>
              </form>
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
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../types'

interface Props {
  isOpen: boolean
  usuario?: Usuario | null
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: CreateUsuarioDto | UpdateUsuarioDto): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  userName: '',
  email: '',
  fullName: '',
  password: '',
  isActive: true
})

watch(() => props.usuario, (newUsuario) => {
  if (newUsuario) {
    form.value = {
      userName: newUsuario.userName,
      email: newUsuario.email,
      fullName: newUsuario.fullName,
      password: '',
      isActive: newUsuario.isActive
    }
  } else {
    form.value = {
      userName: '',
      email: '',
      fullName: '',
      password: '',
      isActive: true
    }
  }
}, { immediate: true })

const close = () => {
  emit('close')
}

const handleSubmit = () => {
  if (props.usuario) {
    // Actualizar
    const data: UpdateUsuarioDto = {
      email: form.value.email,
      fullName: form.value.fullName,
      isActive: form.value.isActive
    }
    emit('submit', data)
  } else {
    // Crear
    const data: CreateUsuarioDto = {
      userName: form.value.userName,
      email: form.value.email,
      fullName: form.value.fullName,
      password: form.value.password
    }
    emit('submit', data)
  }
}
</script>
