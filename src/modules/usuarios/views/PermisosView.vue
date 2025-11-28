<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Gestión de Permisos</h1>
        <p class="mt-1 text-sm text-gray-500">Define permisos disponibles en el sistema</p>
      </div>
      <button 
        @click="openCreateModal"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        + Nuevo Permiso
      </button>
    </div>

    <div v-if="store.loading" class="text-center py-12">
      <p class="text-gray-500">Cargando permisos...</p>
    </div>

    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-600 mb-2">{{ store.error }}</p>
      <button @click="loadData" class="text-indigo-600 hover:underline">Reintentar</button>
    </div>

    <div v-else-if="store.permisos.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay permisos</h3>
      <p class="mt-1 text-sm text-gray-500">Comienza creando un nuevo permiso</p>
      <button
        @click="openCreateModal"
        class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        + Crear Primer Permiso
      </button>
    </div>

    <div v-else class="space-y-6">
      <!-- Permisos agrupados por módulo -->
      <div v-for="(permisos, modulo) in store.permisosPorModulo" :key="modulo" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h2 class="text-lg font-semibold text-gray-900 capitalize">{{ modulo }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="permiso in permisos" :key="permiso.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <code class="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{{ permiso.key }}</code>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ permiso.description }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex gap-2">
                    <button @click="openEditModal(permiso)" class="text-blue-600 hover:text-blue-900" title="Editar">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="handleDelete(permiso)" class="text-red-600 hover:text-red-900" title="Eliminar">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar permiso -->
    <TransitionRoot :show="showModal" as="template">
      <Dialog as="div" class="relative z-50" @close="closeModal">
        <div class="fixed inset-0 bg-black bg-opacity-30" />
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
              <DialogTitle class="text-lg font-medium text-gray-900 mb-4">
                {{ selectedPermiso ? 'Editar Permiso' : 'Crear Permiso' }}
              </DialogTitle>

              <form @submit.prevent="handleSubmit" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Key (ej: depositos.view)</label>
                  <input
                    v-model="form.key"
                    type="text"
                    required
                    placeholder="modulo.accion"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <p class="mt-1 text-xs text-gray-500">Formato: modulo.accion (ej: users.create, depositos.view)</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    v-model="form.description"
                    type="text"
                    required
                    placeholder="Descripción del permiso"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
                  <select
                    v-model="form.module"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar módulo...</option>
                    <option v-for="modulo in store.modulos" :key="modulo" :value="modulo">{{ modulo }}</option>
                    <option value="__nuevo__">+ Crear nuevo módulo</option>
                  </select>
                </div>

                <div v-if="form.module === '__nuevo__'">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del nuevo módulo</label>
                  <input
                    v-model="nuevoModulo"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div class="flex gap-3 mt-6">
                  <button
                    type="button"
                    @click="closeModal"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    :disabled="store.loading"
                    class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {{ store.loading ? 'Guardando...' : selectedPermiso ? 'Actualizar' : 'Crear' }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'
import { usePermisosStore } from '../stores/permisosStore'
import type { Permiso } from '../types'

const store = usePermisosStore()

const showModal = ref(false)
const selectedPermiso = ref<Permiso | null>(null)
const form = ref({ key: '', description: '', module: '' })
const nuevoModulo = ref('')

onMounted(() => {
  store.fetchPermisos()
})

const openCreateModal = () => {
  selectedPermiso.value = null
  form.value = { key: '', description: '', module: '' }
  nuevoModulo.value = ''
  showModal.value = true
}

const openEditModal = (permiso: Permiso) => {
  selectedPermiso.value = permiso
  form.value = {
    key: permiso.key,
    description: permiso.description,
    module: permiso.module
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedPermiso.value = null
}

const handleSubmit = async () => {
  try {
    const data = { ...form.value }
    if (data.module === '__nuevo__') {
      data.module = nuevoModulo.value
    }

    if (selectedPermiso.value) {
      await store.updatePermiso(selectedPermiso.value.id, data)
    } else {
      await store.createPermiso(data)
    }
    closeModal()
  } catch (error) {
    // Error ya manejado en el store
  }
}

const handleDelete = async (permiso: Permiso) => {
  if (confirm(`¿Eliminar permiso "${permiso.key}"?`)) {
    try {
      await store.deletePermiso(permiso.id)
    } catch (error) {
      // Error ya manejado en el store
    }
  }
}
</script>
