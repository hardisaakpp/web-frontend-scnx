<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <div
      :class="[
        'fixed top-0 left-0 h-full w-64 bg-gray-800 text-white transition-transform',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      ]"
    >
      <div class="p-4">
        <h2 class="text-2xl font-bold mb-8">SCNexus</h2>
        <nav class="space-y-2">
          <template v-if="authStore.isAdmin">
            <router-link
              to="/admin"
              class="block px-4 py-2 rounded hover:bg-gray-700"
              :class="{ 'bg-gray-700': $route.path === '/admin' }"
            >
              Panel de Admin
            </router-link>
          </template>
          <template v-if="authStore.isUser">
            <router-link
              to="/user"
              class="block px-4 py-2 rounded hover:bg-gray-700"
              :class="{ 'bg-gray-700': $route.path === '/user' }"
            >
              Panel de Usuario
            </router-link>
          </template>
        </nav>
      </div>
      <div class="absolute bottom-0 left-0 right-0 p-4">
        <button
          @click="logout"
          class="w-full px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="md:ml-64">
      <!-- Mobile Header -->
      <div class="bg-white shadow md:hidden">
        <div class="px-4 py-2 flex items-center justify-between">
          <button
            @click="isSidebarOpen = !isSidebarOpen"
            class="p-2 rounded-md hover:bg-gray-100"
          >
            <Bars3Icon class="h-6 w-6" />
          </button>
          <h1 class="text-xl font-semibold">SCNexus</h1>
        </div>
      </div>

      <!-- Page Content -->
      <main class="p-4">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isSidebarOpen = ref(false)

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>