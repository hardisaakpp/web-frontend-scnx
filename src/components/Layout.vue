<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-indigo-600">{{ appName }}</h1>
            </div>

            <!-- Menu Items -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                v-for="item in menuItems"
                :key="item.path"
                :to="item.path"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                active-class="border-indigo-500 text-gray-900"
                inactive-class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                {{ item.name }}
              </router-link>
            </div>
          </div>

          <!-- User Menu -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="text-sm text-gray-700 mr-4">
                {{ authStore.fullName || authStore.userName }}
              </span>
              <button
                @click="handleLogout"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors"
            active-class="bg-indigo-50 border-indigo-500 text-indigo-700"
            inactive-class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
          >
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Page Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useMenu } from '@/composables/useMenu'

const appName = import.meta.env.VITE_APP_NAME
const authStore = useAuthStore()
const { menuItems } = useMenu()

const handleLogout = () => {
  authStore.logout()
}
</script>