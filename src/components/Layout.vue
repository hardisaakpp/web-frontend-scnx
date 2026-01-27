<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <!-- Navbar -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-indigo-600 dark:text-indigo-400">{{ appName }}</h1>
            </div>

          </div>

          <!-- User Menu -->
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ authStore.fullName || authStore.userName }}
            </span>
            <button
              @click="handleLogout"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
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

const appName = import.meta.env.VITE_APP_NAME
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
}
</script>