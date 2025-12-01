<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Overlay para móvil -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 z-30',
        isSidebarCollapsed ? 'w-16' : 'w-64',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <!-- Header del Sidebar -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 
          v-show="!isSidebarCollapsed" 
          class="text-2xl font-bold transition-opacity duration-300"
        >
          SCNexus
        </h2>
        <h2 
          v-show="isSidebarCollapsed" 
          class="text-2xl font-bold mx-auto"
        >
          SC
        </h2>
      </div>

      <!-- Toggle Button (Solo desktop) -->
      <button
        @click="isSidebarCollapsed = !isSidebarCollapsed"
        class="hidden md:flex absolute -right-3 top-20 bg-gray-800 border border-gray-600 rounded-full p-1 hover:bg-gray-700 transition-colors z-40"
        title="Contraer/Expandir"
      >
        <ChevronLeftIcon v-if="!isSidebarCollapsed" class="h-4 w-4" />
        <ChevronRightIcon v-else class="h-4 w-4" />
      </button>

      <!-- Navigation -->
      <nav class="p-4 space-y-2 overflow-y-auto h-[calc(100vh-140px)]">
        <!-- Dashboard -->
        <router-link
          to="/dashboard"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors group"
          :class="{ 'bg-gray-700': $route.path === '/dashboard' }"
          :title="isSidebarCollapsed ? 'Dashboard' : ''"
        >
          <HomeIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Dashboard</span>
        </router-link>

        <!-- Admin Panel -->
        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/admin' }"
          :title="isSidebarCollapsed ? 'Panel de Admin' : ''"
        >
          <UserGroupIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Panel de Admin</span>
        </router-link>

        <!-- User Panel -->
        <router-link
          v-if="authStore.isUser"
          to="/user"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/user' }"
          :title="isSidebarCollapsed ? 'Panel de Usuario' : ''"
        >
          <UserIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Panel de Usuario</span>
        </router-link>

        <!-- Contabilidad -->
        <router-link
          to="/contabilidad"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/contabilidad' }"
          :title="isSidebarCollapsed ? 'Contabilidad' : ''"
        >
          <CalculatorIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Contabilidad</span>
        </router-link>

        <!-- Depósitos -->
        <router-link
          to="/depositos"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/depositos' }"
          :title="isSidebarCollapsed ? 'Depósitos' : ''"
        >
          <BuildingLibraryIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Depósitos</span>
        </router-link>

        <!-- Reportes -->
        <router-link
          to="/reportes"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/reportes' }"
          :title="isSidebarCollapsed ? 'Reportes' : ''"
        >
          <DocumentChartBarIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Reportes</span>
        </router-link>

        <!-- Integración MBA3-SAP -->
        <router-link
          v-if="(authStore.userRoles?.includes('Admin') || authStore.hasPermission('mba3-consultas.view'))"
          to="/mba3-consultas"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path.startsWith('/mba3-consultas') }"
          :title="isSidebarCollapsed ? 'Integración MBA3-SAP' : ''"
        >
          <DocumentTextIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Integración MBA3-SAP</span>
        </router-link>

        <!-- Separador Admin -->
        <div v-if="authStore.isAdmin" class="border-t border-gray-700 my-2"></div>

        <!-- Usuarios (Solo Admin) -->
        <router-link
          v-if="authStore.isAdmin"
          to="/usuarios"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/usuarios' }"
          :title="isSidebarCollapsed ? 'Usuarios' : ''"
        >
          <UsersIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Usuarios</span>
        </router-link>

        <!-- Roles (Solo Admin) -->
        <router-link
          v-if="authStore.isAdmin"
          to="/roles"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/roles' }"
          :title="isSidebarCollapsed ? 'Roles' : ''"
        >
          <ShieldCheckIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Roles</span>
        </router-link>

        <!-- Permisos (Solo Admin) -->
        <router-link
          v-if="authStore.isAdmin"
          to="/permisos"
          class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700': $route.path === '/permisos' }"
          :title="isSidebarCollapsed ? 'Permisos' : ''"
        >
          <LockClosedIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Permisos</span>
        </router-link>
      </nav>

      <!-- Footer del Sidebar -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div v-show="!isSidebarCollapsed" class="mb-2">
          <p class="text-sm text-gray-400 truncate">{{ authStore.userName }}</p>
        </div>
        <button
          @click="logout"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
          :title="isSidebarCollapsed ? 'Cerrar Sesión' : ''"
        >
          <ArrowRightOnRectangleIcon class="h-5 w-5 flex-shrink-0" />
          <span v-show="!isSidebarCollapsed">Cerrar Sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div 
      :class="[
        'transition-all duration-300',
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      ]"
    >
      <!-- Mobile Header -->
      <header class="bg-white shadow md:hidden sticky top-0 z-10">
        <div class="px-4 py-3 flex items-center justify-between">
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Bars3Icon class="h-6 w-6" />
          </button>
          <h1 class="text-xl font-semibold">SCNexus</h1>
          <div class="w-10"></div>
        </div>
      </header>

      <!-- Desktop Header -->
      <header class="hidden md:block bg-white shadow-sm sticky top-0 z-10">
        <div class="px-6 py-4 flex items-center justify-between">
          <h1 class="text-2xl font-semibold text-gray-800">
            {{ pageTitle }}
          </h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ authStore.fullName || authStore.userName }}</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 md:p-6 lg:p-8">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Bars3Icon,
  HomeIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  CalculatorIcon,
  BuildingLibraryIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  LockClosedIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/admin': 'Panel de Administración',
    '/user': 'Panel de Usuario',
    '/contabilidad': 'Contabilidad',
    '/depositos': 'Depósitos',
    '/reportes': 'Reportes',
    '/mba3-consultas': 'Integración MBA3-SAP',
    '/mba3-consultas/facturas': 'Facturas MBA3',
    '/mba3-consultas/ordenes-compra': 'Órdenes de Compra',
    '/mba3-consultas/proceso': 'Proceso Completo',
    '/usuarios': 'Gestión de Usuarios',
    '/roles': 'Gestión de Roles',
    '/permisos': 'Gestión de Permisos'
  }
  return titles[route.path] || 'SCNexus'
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>