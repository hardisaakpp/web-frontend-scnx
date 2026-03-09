<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <!-- Overlay para móvil -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-0 left-0 h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 z-30 shadow-2xl',
        isSidebarCollapsed ? 'w-20' : 'w-72',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <!-- Header del Sidebar -->
      <div class="flex-shrink-0 flex items-center justify-between p-5 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/10 to-sky-500/10 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <img 
            src="/favicon.png" 
            alt="Logo de la empresa" 
            class="w-10 h-10 object-contain"
          />
          <div v-show="!isSidebarCollapsed" class="transition-opacity duration-300">
            <h2 class="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              SCNexus
            </h2>
            <p class="text-xs text-slate-400">Sistema Integrado</p>
          </div>
        </div>
      </div>

      <!-- Toggle Button (Solo desktop) -->
      <button
        @click="isSidebarCollapsed = !isSidebarCollapsed"
        class="hidden md:flex absolute -right-4 top-24 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 border-2 border-slate-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 z-40 hover:scale-110"
        title="Contraer/Expandir"
      >
        <ChevronLeftIcon v-if="!isSidebarCollapsed" class="h-4 w-4 text-white" />
        <ChevronRightIcon v-else class="h-4 w-4 text-white" />
      </button>

      <!-- Navigation -->
      <nav class="flex-1 min-h-0 overflow-y-auto p-4 pb-4 space-y-1 custom-scrollbar">
        <!-- Sección Principal -->
        <div v-show="!isSidebarCollapsed" class="px-3 py-2 mb-2">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Principal</p>
        </div>

        <!-- Dashboard -->
        <router-link
          to="/dashboard"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/dashboard',
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': $route.path !== '/dashboard'
          }"
          :title="isSidebarCollapsed ? 'Dashboard' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <HomeIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path === '/dashboard' }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Dashboard</span>
        </router-link>

        <!-- Admin Panel -->
        <router-link
          v-if="authStore.isAdmin"
          to="/admin"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/admin',
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': $route.path !== '/admin'
          }"
          :title="isSidebarCollapsed ? 'Panel de Admin' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <UserGroupIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path === '/admin' }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Panel de Admin</span>
        </router-link>

        <!-- User Panel -->
        <router-link
          v-if="authStore.isUser"
          to="/user"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/user',
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': $route.path !== '/user'
          }"
          :title="isSidebarCollapsed ? 'Panel de Usuario' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <UserIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path === '/user' }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Panel de Usuario</span>
        </router-link>

        <!-- Separador Módulos -->
        <div v-show="!isSidebarCollapsed" class="px-3 py-2 my-3">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Módulos</p>
        </div>

        <!-- Caja Chica -->
        <router-link
          v-if="hasModuleAccess('cajachica')"
          to="/caja-chica"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50': $route.path.startsWith('/caja-chica'),
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': !$route.path.startsWith('/caja-chica')
          }"
          :title="isSidebarCollapsed ? 'Caja Chica' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <DocumentCheckIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path.startsWith('/caja-chica') }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Caja Chica</span>
        </router-link>

        <!-- Conciliación -->
        <router-link
          v-if="hasModuleAccess('conciliacion')"
          to="/conciliacion"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/conciliacion',
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': $route.path !== '/conciliacion'
          }"
          :title="isSidebarCollapsed ? 'Conciliación' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <ClipboardDocumentCheckIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path === '/conciliacion' }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Conciliación</span>
        </router-link>

        <!-- Gestión ODC SAP: visible con odc.view (canViewOdcSap), odcsap.view (canManageOrder/canViewOrderList) o mabel.view (canViewMabel) -->
        <router-link
          v-if="authStore.canViewOdcSap || authStore.canManageOrder || authStore.canViewOrderList || authStore.canViewMabel"
          to="/mba3-consultas"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/mba3-consultas'),
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': !$route.path.startsWith('/mba3-consultas')
          }"
          :title="isSidebarCollapsed ? 'Gestión ODC SAP' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <ArrowsRightLeftIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path.startsWith('/mba3-consultas') }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Gestión ODC SAP</span>
        </router-link>

        <!-- Separador Administración -->
        <div v-if="hasModuleAccess('usuarios') || hasModuleAccess('roles') || hasModuleAccess('permisos') || authStore.isAdmin" v-show="!isSidebarCollapsed" class="px-3 py-2 my-3">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administración</p>
        </div>

        <!-- Usuarios -->
        <router-link
          v-if="hasModuleAccess('usuarios')"
          to="/users"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50': $route.path.startsWith('/users'),
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': !$route.path.startsWith('/users')
          }"
          :title="isSidebarCollapsed ? 'Usuarios' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <UsersIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path.startsWith('/users') }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Usuarios</span>
        </router-link>

        <!-- Roles (Solo Admin) -->
        <router-link
          v-if="authStore.isAdmin"
          to="/roles"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/roles',
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': $route.path !== '/roles'
          }"
          :title="isSidebarCollapsed ? 'Roles' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <ShieldCheckIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path === '/roles' }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Roles</span>
        </router-link>

        <!-- Permisos (Solo Admin) -->
        <router-link
          v-if="authStore.isAdmin"
          to="/permisos"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/permisos',
            'text-slate-300 hover:bg-slate-800/50 hover:text-white': $route.path !== '/permisos'
          }"
          :title="isSidebarCollapsed ? 'Permisos' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <LockClosedIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path === '/permisos' }" />
          <span v-show="!isSidebarCollapsed" class="relative z-10 font-medium">Permisos</span>
        </router-link>
      </nav>

      <!-- Footer del Sidebar -->
      <div class="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div v-show="!isSidebarCollapsed" class="mb-3 px-2">
          <div class="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-xs font-bold">
              {{ authStore.userName?.charAt(0).toUpperCase() || 'U' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ authStore.userName }}</p>
              <p class="text-xs text-slate-400 truncate">{{ authStore.fullName || 'Usuario' }}</p>
            </div>
          </div>
        </div>
        <button
          @click="logout"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
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
        isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
      ]"
    >
      <!-- Mobile Header -->
      <header class="bg-white dark:bg-gray-800 shadow md:hidden sticky top-0 z-30 transition-colors duration-300">
        <div class="px-4 py-3 flex items-center justify-between">
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <Bars3Icon class="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </button>
          <h1 class="text-xl font-semibold text-gray-800 dark:text-white">SCNexus</h1>
          <button
            @click="themeStore.toggleTheme()"
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="themeStore.isDark ? 'Modo Claro' : 'Modo Oscuro'"
          >
            <SunIcon v-if="themeStore.isDark" class="h-5 w-5 text-yellow-400" />
            <MoonIcon v-else class="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      <!-- Desktop Header -->
      <header class="hidden md:block bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 transition-colors duration-300">
        <div class="px-6 py-4 flex items-center justify-between">
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white">
            {{ pageTitle }}
          </h1>
          <div class="flex items-center gap-4">
            <button
              @click="themeStore.toggleTheme()"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              :title="themeStore.isDark ? 'Modo Claro' : 'Modo Oscuro'"
            >
              <SunIcon v-if="themeStore.isDark" class="h-6 w-6 text-yellow-400 group-hover:scale-110 transition-transform" />
              <MoonIcon v-else class="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
            </button>
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ authStore.fullName || authStore.userName }}</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
        <router-view></router-view>
      </main>
    </div>
    
    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Bars3Icon,
  HomeIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  ArrowsRightLeftIcon,
  DocumentCheckIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import ToastContainer from '../components/ToastContainer.vue'
import { userPreferencesService } from '@/services/userPreferencesService'
import { useNotificaciones } from '@/composables/useNotificaciones'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { connect: connectNotificaciones, disconnect: disconnectNotificaciones } = useNotificaciones()
const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)

// Clave para localStorage del sidebar
const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed'

// Función para cargar el estado del sidebar desde localStorage
function loadSidebarState() {
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (saved !== null) {
      isSidebarCollapsed.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error cargando estado del sidebar:', error)
  }
}

// Función para guardar el estado del sidebar en localStorage
function saveSidebarToLocalStorage() {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isSidebarCollapsed.value))
  } catch (error) {
    console.error('Error guardando estado del sidebar:', error)
  }
}

// Función para sincronizar el estado del sidebar con el servidor
async function syncSidebarToServer() {
  if (!authStore.isAuthenticated) {
    return
  }

  try {
    await userPreferencesService.saveSidebarPreferences({
      collapsed: isSidebarCollapsed.value
    })
  } catch (error) {
    console.warn('Error sincronizando estado del sidebar al servidor:', error)
    // No lanzar error, el estado ya está guardado en localStorage
  }
}

// Función para cargar el estado del sidebar desde el servidor
async function loadSidebarFromServer() {
  if (!authStore.isAuthenticated) {
    return false
  }

  try {
    const serverPrefs = await userPreferencesService.getSidebarPreferences()
    if (serverPrefs) {
      isSidebarCollapsed.value = serverPrefs.collapsed
      // Guardar también en localStorage como backup
      saveSidebarToLocalStorage()
      return true
    }
  } catch (error) {
    console.warn('No se pudieron cargar preferencias del sidebar del servidor:', error)
  }

  return false
}

// Función para cargar preferencias: primero del servidor, luego localStorage
async function loadSidebarPreferences() {
  // Intentar cargar del servidor primero
  const serverLoaded = await loadSidebarFromServer()
  
  // Si no se cargaron del servidor, usar localStorage
  if (!serverLoaded) {
    loadSidebarState()
  }
}

// Función para guardar preferencias: primero localStorage (inmediato), luego servidor (background)
async function saveSidebarPreferences() {
  // Guardar inmediatamente en localStorage
  saveSidebarToLocalStorage()

  // Sincronizar con servidor en background (no bloquea)
  syncSidebarToServer()
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/admin': 'Panel de Administración',
    '/user': 'Panel de Usuario',
    '/conciliacion': 'Conciliación',
    '/mba3-consultas': 'Gestión ODC SAP',
    '/mba3-consultas/ordenes-compra': 'Órdenes de Compra',
    '/mba3-consultas/proceso': 'Enviar ODC a SAP',
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

// Función helper para verificar si el usuario tiene algún permiso de un módulo
const hasModuleAccess = (moduleName: string): boolean => {
  // Verificar si tiene algún permiso del módulo (modulo.*) - case insensitive
  // No hay excepciones para Admin - debe tener permisos explícitos
  const permissions = authStore.userPermissions || []
  const normalizedModule = moduleName.toLowerCase()
  return permissions.some((permission: string) => 
    permission.toLowerCase().startsWith(`${normalizedModule}.`)
  )
}

// Cargar preferencias del sidebar al montar y asegurar capabilities (p. ej. tras recarga)
onMounted(async () => {
  if (authStore.token && !authStore.capabilities) {
    await authStore.fetchMe()
  }
  loadSidebarPreferences()
  
  // 📢 Conectar al sistema de notificaciones en tiempo real (SSE)
  if (authStore.isAuthenticated) {
    connectNotificaciones()
  }
})

// Observar cambios de autenticación para conectar/desconectar notificaciones
watch(() => authStore.isAuthenticated, (isAuth: boolean) => {
  if (isAuth) {
    connectNotificaciones()
  } else {
    disconnectNotificaciones()
  }
})

// Guardar preferencias cuando cambia el estado del sidebar
watch(isSidebarCollapsed, () => {
  saveSidebarPreferences()
})

// Sincronizar cuando el usuario se autentica
watch(() => authStore.isAuthenticated, (isAuthenticated: boolean) => {
  if (isAuthenticated) {
    // Cargar preferencias del servidor cuando el usuario se autentica
    loadSidebarPreferences()
  }
})
</script>

<style scoped>
/* Scrollbar personalizado para el sidebar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>