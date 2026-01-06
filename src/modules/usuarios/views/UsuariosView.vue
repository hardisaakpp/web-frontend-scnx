<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Administra usuarios, roles y permisos</p>
      </div>
      <button 
        @click="openCreateModal"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors"
      >
        + Nuevo Usuario
      </button>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-300">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre o email..."
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          @input="handleSearch"
        />
        <select
          v-model="roleFilter"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          @change="handleSearch"
        >
          <option value="">Todos los roles</option>
          <option v-for="role in rolesStore.roles" :key="role.id" :value="role.name">
            {{ role.name }}
          </option>
        </select>
        <select
          v-model="activeFilter"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          @change="handleSearch"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </div>

    <!-- Tabla de usuarios -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
      <div v-if="store.loading" class="text-center py-12">
        <p class="text-gray-500">Cargando usuarios...</p>
      </div>

      <div v-else-if="store.error" class="text-center py-12">
        <p class="text-red-600">{{ store.error }}</p>
        <button @click="loadData" class="mt-4 text-indigo-600 hover:underline">Reintentar</button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="usuario in store.usuarios" :key="usuario.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ usuario.fullName }}</div>
                  <div class="text-sm text-gray-500">@{{ usuario.userName }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ usuario.email }}</td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="role in usuario.roles"
                    :key="role"
                    class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800"
                  >
                    {{ role }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="usuario.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  class="px-2 py-1 text-xs font-medium rounded-full"
                >
                  {{ usuario.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex gap-2">
                  <button @click="openRolesModal(usuario)" class="text-indigo-600 hover:text-indigo-900" title="Gestionar roles">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </button>
                  <button @click="openEditModal(usuario)" class="text-blue-600 hover:text-blue-900" title="Editar">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="handleDelete(usuario)" class="text-red-600 hover:text-red-900" title="Eliminar">
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

      <!-- Paginación -->
      <div v-if="store.totalPages > 1" class="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Mostrando {{ store.usuarios.length }} de {{ store.total }} usuarios
        </div>
        <div class="flex gap-2">
          <button
            @click="prevPage"
            :disabled="store.currentPage === 1"
            class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Anterior
          </button>
          <span class="px-3 py-1">Página {{ store.currentPage }} de {{ store.totalPages }}</span>
          <button
            @click="nextPage"
            :disabled="store.currentPage === store.totalPages"
            class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <UsuarioModal
      :is-open="showUsuarioModal"
      :usuario="selectedUsuario"
      :loading="store.loading"
      @close="closeUsuarioModal"
      @submit="handleUsuarioSubmit"
    />

    <AsignarRolesModal
      :is-open="showRolesModal"
      :usuario="selectedUsuario"
      :roles="rolesStore.roles"
      :loading="store.loading"
      @close="closeRolesModal"
      @asignar-rol="handleAsignarRol"
      @remover-rol="handleRemoverRol"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUsuariosStore } from '../stores/usuariosStore'
import { useRolesStore } from '../stores/rolesStore'
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../types'
import UsuarioModal from '../components/UsuarioModal.vue'
import AsignarRolesModal from '../components/AsignarRolesModal.vue'

const store = useUsuariosStore()
const rolesStore = useRolesStore()

const search = ref('')
const roleFilter = ref('')
const activeFilter = ref<string>('')
const showUsuarioModal = ref(false)
const showRolesModal = ref(false)
const selectedUsuario = ref<Usuario | null>(null)

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  await Promise.all([
    store.fetchUsuarios(),
    rolesStore.fetchRoles()
  ])
}

const handleSearch = () => {
  const filtros: any = {}
  if (search.value) filtros.search = search.value
  if (roleFilter.value) filtros.role = roleFilter.value
  if (activeFilter.value !== '') filtros.isActive = activeFilter.value === 'true'
  store.fetchUsuarios(filtros)
}

const openCreateModal = () => {
  selectedUsuario.value = null
  showUsuarioModal.value = true
}

const openEditModal = (usuario: Usuario) => {
  selectedUsuario.value = usuario
  showUsuarioModal.value = true
}

const closeUsuarioModal = () => {
  showUsuarioModal.value = false
  selectedUsuario.value = null
}

const handleUsuarioSubmit = async (data: CreateUsuarioDto | UpdateUsuarioDto) => {
  try {
    if (selectedUsuario.value) {
      await store.updateUsuario(selectedUsuario.value.id, data as UpdateUsuarioDto)
    } else {
      await store.createUsuario(data as CreateUsuarioDto)
    }
    closeUsuarioModal()
  } catch (error) {
    // Error ya manejado en el store
  }
}

const handleDelete = async (usuario: Usuario) => {
  if (confirm(`¿Eliminar usuario ${usuario.fullName}?`)) {
    try {
      await store.deleteUsuario(usuario.id)
    } catch (error) {
      // Error ya manejado en el store
    }
  }
}

const openRolesModal = (usuario: Usuario) => {
  selectedUsuario.value = usuario
  showRolesModal.value = true
}

const closeRolesModal = () => {
  showRolesModal.value = false
  selectedUsuario.value = null
}

const handleAsignarRol = async (roleName: string) => {
  if (selectedUsuario.value) {
    try {
      await store.asignarRol(selectedUsuario.value.id, roleName)
    } catch (error) {
      // Error ya manejado en el store
    }
  }
}

const handleRemoverRol = async (roleName: string) => {
  if (selectedUsuario.value) {
    try {
      await store.removerRol(selectedUsuario.value.id, roleName)
    } catch (error) {
      // Error ya manejado en el store
    }
  }
}

const prevPage = () => {
  if (store.currentPage > 1) {
    store.setPage(store.currentPage - 1)
    handleSearch()
  }
}

const nextPage = () => {
  if (store.currentPage < store.totalPages) {
    store.setPage(store.currentPage + 1)
    handleSearch()
  }
}
</script>
