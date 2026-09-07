<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <VolverButton to="/admin" title="Volver al Panel de Administración" />
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
      </div>
      <button 
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-lg hover:shadow-xl"
      >
        <UserPlusIcon class="h-5 w-5" />
        Nuevo Usuario
      </button>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
            <UsersIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Usuarios</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircleIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Activos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.usuariosActivos.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-red-100 dark:bg-red-900">
            <XCircleIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Inactivos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.total - store.usuariosActivos.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900">
            <ShieldCheckIcon class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Roles Activos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ rolesStore.roles.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Búsqueda -->
        <div class="flex-1 relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </div>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por nombre, usuario o email..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            @input="handleSearch"
          />
        </div>

        <!-- Filtro por Rol -->
        <div class="w-full md:w-48">
          <select
            v-model="roleFilter"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            @change="handleSearch"
          >
            <option value="">Todos los roles</option>
            <option v-for="role in rolesStore.roles" :key="role.id" :value="role.name">
              {{ role.name }}
            </option>
          </select>
        </div>

        <!-- Filtro por Estado -->
        <div class="w-full md:w-48">
          <select
            v-model="activeFilter"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            @change="handleSearch"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <!-- Botón Limpiar Filtros -->
        <button
          v-if="search || roleFilter || activeFilter"
          @click="clearFilters"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <XMarkIcon class="h-5 w-5" />
          Limpiar
        </button>
      </div>
    </div>

    <!-- Tabla de usuarios -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
      <!-- Loading State -->
      <div v-if="store.loading" class="flex flex-col items-center justify-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        <p class="mt-4 text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="store.error" class="flex flex-col items-center justify-center py-16">
        <ExclamationTriangleIcon class="h-16 w-16 text-red-500 mb-4" />
        <p class="text-red-600 dark:text-red-400 mb-4">{{ store.error }}</p>
        <button 
          @click="loadData" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Reintentar
        </button>
      </div>

      <!-- Table -->
      <div v-else-if="store.usuarios.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Roles
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha Creación
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="usuario in store.usuarios" 
              :key="usuario.id" 
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <!-- Usuario -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {{ getInitials(usuario.fullName) }}
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ usuario.fullName }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      @{{ usuario.userName }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center text-sm text-gray-900 dark:text-gray-300">
                  <EnvelopeIcon class="h-4 w-4 mr-2 text-gray-400" />
                  {{ usuario.email }}
                </div>
              </td>

              <!-- Roles -->
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="role in usuario.roles"
                    :key="role"
                    :class="getRoleColor(role)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    <ShieldCheckIcon class="h-3 w-3 mr-1" />
                    {{ role }}
                  </span>
                  <span 
                    v-if="usuario.roles.length === 0"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    Sin roles
                  </span>
                </div>
              </td>

              <!-- Estado -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="usuario.isActive 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  <span 
                    :class="usuario.isActive ? 'bg-green-400' : 'bg-red-400'"
                    class="w-2 h-2 rounded-full mr-1.5"
                  ></span>
                  {{ usuario.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <!-- Fecha Creación -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(usuario.createdAt) }}
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div class="flex justify-end gap-2">
                  <!-- Ver Detalles -->
                  <button 
                    @click="verDetalles(usuario)" 
                    class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" 
                    title="Ver detalles"
                  >
                    <EyeIcon class="h-5 w-5" />
                  </button>

                  <!-- Gestionar Roles -->
                  <button 
                    @click="openRolesModal(usuario)" 
                    class="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" 
                    title="Gestionar roles"
                  >
                    <UserGroupIcon class="h-5 w-5" />
                  </button>

                  <!-- Editar -->
                  <button 
                    @click="openEditModal(usuario)" 
                    class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" 
                    title="Editar"
                  >
                    <PencilSquareIcon class="h-5 w-5" />
                  </button>

                  <!-- Eliminar -->
                  <button 
                    @click="handleDelete(usuario)" 
                    class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                    title="Eliminar"
                  >
                    <TrashIcon class="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-16">
        <UsersIcon class="h-16 w-16 text-gray-400 mb-4" />
        <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">No se encontraron usuarios</p>
        <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">
          {{ search || roleFilter || activeFilter ? 'Intenta ajustar los filtros' : 'Comienza creando un nuevo usuario' }}
        </p>
        <button
          v-if="!search && !roleFilter && !activeFilter"
          @click="openCreateModal"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Crear Primer Usuario
        </button>
      </div>

      <!-- Paginación -->
      <div 
        v-if="store.totalPages > 1" 
        class="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Mostrando <span class="font-medium">{{ (store.currentPage - 1) * store.pageSize + 1 }}</span> a 
          <span class="font-medium">{{ Math.min(store.currentPage * store.pageSize, store.total) }}</span> de 
          <span class="font-medium">{{ store.total }}</span> usuarios
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="prevPage"
            :disabled="store.currentPage === 1"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
          >
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          
          <!-- Números de página -->
          <div class="flex gap-1">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'px-3 py-2 rounded-lg transition-colors',
                page === store.currentPage
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="nextPage"
            :disabled="store.currentPage === store.totalPages"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
          >
            <ChevronRightIcon class="h-5 w-5" />
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
import { ref, onMounted, computed } from 'vue'
import { APP_LOCALE } from '@/plugins/locale'
import { useUsuariosStore } from '../stores/usuariosStore'
import { useRolesStore } from '../stores/rolesStore'
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../types'
import VolverButton from '@/components/VolverButton.vue'
import UsuarioModal from '../components/UsuarioModal.vue'
import AsignarRolesModal from '../components/AsignarRolesModal.vue'
import {
  UsersIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  UserGroupIcon,
  PencilSquareIcon,
  TrashIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

const store = useUsuariosStore()
const rolesStore = useRolesStore()

const search = ref('')
const roleFilter = ref('')
const activeFilter = ref<string>('')
const showUsuarioModal = ref(false)
const showRolesModal = ref(false)
const selectedUsuario = ref<Usuario | null>(null)

// Páginas visibles para paginación
const visiblePages = computed(() => {
  const current = store.currentPage
  const total = store.totalPages
  const pages: number[] = []
  
  if (total <= 7) {
    // Mostrar todas las páginas si son 7 o menos
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Mostrar páginas con elipsis
    if (current <= 3) {
      pages.push(1, 2, 3, 4)
    } else if (current >= total - 2) {
      pages.push(total - 3, total - 2, total - 1, total)
    } else {
      pages.push(current - 1, current, current + 1)
    }
  }
  
  return pages
})

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

const clearFilters = () => {
  search.value = ''
  roleFilter.value = ''
  activeFilter.value = ''
  handleSearch()
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
  if (confirm(`¿Está seguro de eliminar al usuario "${usuario.fullName}"?\n\nEsta acción no se puede deshacer.`)) {
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

const verDetalles = (usuario: Usuario) => {
  // Mostrar modal de detalles o navegar a página de detalles
  alert(`Detalles de ${usuario.fullName}:\n\nEmail: ${usuario.email}\nUsuario: ${usuario.userName}\nRoles: ${usuario.roles.join(', ')}\nEstado: ${usuario.isActive ? 'Activo' : 'Inactivo'}`)
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

const goToPage = (page: number) => {
  store.setPage(page)
  handleSearch()
}

// Helpers
const getInitials = (fullName: string): string => {
  const names = fullName.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return fullName.substring(0, 2).toUpperCase()
}

const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    'Admin': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    'Gerente': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
    'User': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    'Contador': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    'Inventarista': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
  }
  return colors[role] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString(APP_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
