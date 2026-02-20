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

    <div class="bg-white rounded-lg shadow p-6">
      <div class="text-sm font-semibold text-gray-900 mb-2">Consultar permisos por rol</div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          v-model="roleQuery"
          class="w-full sm:flex-1 rounded border border-gray-200 px-3 py-2 text-sm text-gray-900"
        >
          <option value="" disabled>Selecciona un rol</option>
          <option v-for="rol in rolesStore.rolesOrdenados" :key="rol.id" :value="rol.name">
            {{ rol.name }}
          </option>
        </select>
        <button
          type="button"
          class="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          :disabled="roleQueryLoading || !roleQuery"
          @click="fetchRolePermissions"
        >
          Buscar
        </button>
      </div>
      <div v-if="roleQueryError" class="mt-2 text-sm text-red-600">{{ roleQueryError }}</div>
      <div v-else-if="roleQueryLoading" class="mt-2 text-sm text-gray-500">Cargando permisos...</div>
      <div v-else-if="roleQuerySearched" class="mt-3 space-y-3">
        <!-- Permisos actuales -->
        <div v-if="roleQueryPermissions.length > 0">
          <div class="text-xs font-medium text-gray-600 mb-2">Permisos asignados:</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="permiso in roleQueryPermissions"
              :key="permiso.id"
              class="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
            >
              {{ permiso.key }}
              <button 
                @click="() => handleRemoverPermisoConsulta(permiso.id)" 
                class="hover:text-red-600"
                :disabled="roleQueryLoading"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">Sin permisos asignados.</div>
        
        <!-- Asignar nuevo permiso -->
        <div class="border-t pt-3">
          <div class="text-xs font-medium text-gray-600 mb-2">Asignar nuevo permiso:</div>
          <div class="flex gap-2">
            <select
              v-model="selectedPermissionToAssign"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">Seleccionar permiso para asignar...</option>
              <option v-for="permiso in permisosDisponiblesParaRol" :key="permiso.id" :value="permiso.id">
                [{{ permiso.module }}] {{ permiso.key }} - {{ permiso.description }}
              </option>
            </select>
            <button
              @click="handleAsignarPermisoConsulta"
              :disabled="!selectedPermissionToAssign || roleQueryLoading"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
            >
              Asignar
            </button>
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
import { ref, onMounted, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'
import { useRolesStore } from '../stores/rolesStore'
import { usePermisosStore } from '../stores/permisosStore'
import { permisosService } from '../services/usuariosApi'
import type { Rol } from '../types'
import AsignarPermisosModal from '../components/AsignarPermisosModal.vue'

const rolesStore = useRolesStore()
const permisosStore = usePermisosStore()

const showRolModal = ref(false)
const showPermisosModal = ref(false)
const selectedRol = ref<Rol | null>(null)
const rolForm = ref({ name: '', description: '' })
const roleQuery = ref('')
const roleQueryPermissions = ref<Rol['permissions']>([])
const roleQueryLoading = ref(false)
const roleQueryError = ref('')
const roleQuerySearched = ref(false)
const selectedPermissionToAssign = ref<number | ''>('')

const permisosDisponiblesParaRol = computed(() => 
  permisosStore.permisos.filter(p => !roleQueryPermissions.value.some(rp => rp.id === p.id))
)

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

const handleAsignarPermisoConsulta = async () => {
  if (!selectedPermissionToAssign.value || !roleQuery.value) return
  try {
    await rolesStore.asignarPermiso(roleQuery.value, selectedPermissionToAssign.value as number)
    // Refresh the permissions
    await fetchRolePermissions()
    selectedPermissionToAssign.value = ''
  } catch (error) {
    // Error handled in store
  }
}

const handleRemoverPermisoConsulta = async (permisoId: number) => {
  if (!roleQuery.value) return
  try {
    await rolesStore.removerPermiso(roleQuery.value, permisoId)
    // Refresh the permissions
    await fetchRolePermissions()
  } catch (error) {
    // Error handled in store
  }
}

const fetchRolePermissions = async () => {
  if (!roleQuery.value) {
    roleQueryError.value = 'Ingresa un rol valido.'
    return
  }
  roleQueryLoading.value = true
  roleQueryError.value = ''
  roleQuerySearched.value = true
  roleQueryPermissions.value = []
  try {
    roleQueryPermissions.value = await permisosService.getPermisosPorRol(roleQuery.value)
  } catch (error: any) {
    roleQueryError.value = error?.message || 'No se pudo cargar los permisos del rol.'
  } finally {
    roleQueryLoading.value = false
  }
}
</script>
