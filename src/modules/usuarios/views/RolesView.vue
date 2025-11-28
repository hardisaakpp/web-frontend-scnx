<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
        <p class="mt-1 text-sm text-gray-500">Define roles y asigna permisos</p>
      </div>
      <button 
        @click="openCreateModal"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        + Nuevo Rol
      </button>
    </div>

    <div v-if="rolesStore.loading" class="text-center py-12">
      <p class="text-gray-500">Cargando roles...</p>
    </div>

    <div v-else-if="rolesStore.error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-600 mb-2">{{ rolesStore.error }}</p>
      <button @click="loadData" class="text-indigo-600 hover:underline">Reintentar</button>
    </div>

    <div v-else-if="rolesStore.roles.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay roles</h3>
      <p class="mt-1 text-sm text-gray-500">Comienza creando un nuevo rol</p>
      <button
        @click="openCreateModal"
        class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        + Crear Primer Rol
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="rol in rolesStore.rolesOrdenados"
        :key="rol.id"
        class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">{{ rol.name }}</h3>
            <p v-if="rol.description" class="text-sm text-gray-500 mt-1">{{ rol.description }}</p>
          </div>
          <div class="flex gap-2">
            <button @click="openPermisosModal(rol)" class="text-green-600 hover:text-green-900" title="Gestionar permisos">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
            <button @click="openEditModal(rol)" class="text-blue-600 hover:text-blue-900" title="Editar">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="handleDelete(rol)" class="text-red-600 hover:text-red-900" title="Eliminar">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="border-t pt-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-gray-600">Permisos:</span>
            <span class="font-semibold text-indigo-600">{{ rol.permissions?.length || 0 }}</span>
          </div>
          <div v-if="rol.permissions && rol.permissions.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="permiso in rol.permissions.slice(0, 3)"
              :key="permiso.id"
              class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
            >
              {{ permiso.key }}
            </span>
            <span v-if="rol.permissions.length > 3" class="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
              +{{ rol.permissions.length - 3 }} más
            </span>
          </div>
        </div>

        <div v-if="rol.usersCount !== undefined" class="mt-4 pt-4 border-t">
          <div class="flex items-center text-sm text-gray-600">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {{ rol.usersCount }} {{ rol.usersCount === 1 ? 'usuario' : 'usuarios' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar rol -->
    <TransitionRoot :show="showRolModal" as="template">
      <Dialog as="div" class="relative z-50" @close="closeRolModal">
        <div class="fixed inset-0 bg-black bg-opacity-30" />
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl">
              <DialogTitle class="text-lg font-medium text-gray-900 mb-4">
                {{ selectedRol ? 'Editar Rol' : 'Crear Rol' }}
              </DialogTitle>

              <form @submit.prevent="handleRolSubmit" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
                  <input
                    v-model="rolForm.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    v-model="rolForm.description"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <div class="flex gap-3 mt-6">
                  <button
                    type="button"
                    @click="closeRolModal"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    :disabled="rolesStore.loading"
                    class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {{ rolesStore.loading ? 'Guardando...' : selectedRol ? 'Actualizar' : 'Crear' }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Modal de permisos -->
    <AsignarPermisosModal
      :is-open="showPermisosModal"
      :rol="selectedRol"
      :permisos="permisosStore.permisos"
      :loading="rolesStore.loading"
      @close="closePermisosModal"
      @asignar-permiso="handleAsignarPermiso"
      @remover-permiso="handleRemoverPermiso"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'
import { useRolesStore } from '../stores/rolesStore'
import { usePermisosStore } from '../stores/permisosStore'
import type { Rol } from '../types'
import AsignarPermisosModal from '../components/AsignarPermisosModal.vue'

const rolesStore = useRolesStore()
const permisosStore = usePermisosStore()

const showRolModal = ref(false)
const showPermisosModal = ref(false)
const selectedRol = ref<Rol | null>(null)
const rolForm = ref({ name: '', description: '' })

onMounted(async () => {
  await Promise.all([
    rolesStore.fetchRoles(),
    permisosStore.fetchPermisos()
  ])
})

const openCreateModal = () => {
  selectedRol.value = null
  rolForm.value = { name: '', description: '' }
  showRolModal.value = true
}

const openEditModal = (rol: Rol) => {
  selectedRol.value = rol
  rolForm.value = { name: rol.name, description: rol.description || '' }
  showRolModal.value = true
}

const closeRolModal = () => {
  showRolModal.value = false
  selectedRol.value = null
}

const handleRolSubmit = async () => {
  try {
    if (selectedRol.value) {
      await rolesStore.updateRol(selectedRol.value.id, rolForm.value)
    } else {
      await rolesStore.createRol(rolForm.value)
    }
    closeRolModal()
  } catch (error) {
    // Error ya manejado en el store
  }
}

const handleDelete = async (rol: Rol) => {
  if (confirm(`¿Eliminar rol "${rol.name}"?`)) {
    try {
      await rolesStore.deleteRol(rol.id)
    } catch (error) {
      // Error ya manejado en el store
    }
  }
}

const openPermisosModal = async (rol: Rol) => {
  selectedRol.value = rol
  if (!rol.permissions || rol.permissions.length === 0) {
    await rolesStore.fetchPermisosRol(rol.name)
  }
  showPermisosModal.value = true
}

const closePermisosModal = () => {
  showPermisosModal.value = false
  selectedRol.value = null
}

const handleAsignarPermiso = async (permisoId: number) => {
  if (selectedRol.value) {
    try {
      await rolesStore.asignarPermiso(selectedRol.value.name, permisoId)
    } catch (error) {
      // Error ya manejado en el store
    }
  }
}

const handleRemoverPermiso = async (permisoId: number) => {
  if (selectedRol.value) {
    try {
      await rolesStore.removerPermiso(selectedRol.value.name, permisoId)
    } catch (error) {
      // Error ya manejado en el store
    }
  }
}
</script>
