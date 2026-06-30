<template>
  <div class="px-4 py-6 sm:px-0">
    <!-- User Info Card -->
    <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg mb-6 transition-colors duration-300">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Información del Usuario
        </h3>
        <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ authStore.fullName }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Usuario</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ authStore.userName }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ authStore.userEmail }}</dd>
          </div>
        </div>
      </div>
    </div>

    <!-- Roles & Permissions -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Roles -->
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-300">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Roles
          </h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="role in authStore.userRoles"
              :key="role"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300"
            >
              {{ role }}
            </span>
          </div>
        </div>
      </div>

      <!-- Permissions -->
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-300">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Permisos ({{ authStore.userPermissions.length }})
          </h3>
          <div class="max-h-40 overflow-y-auto">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="permission in authStore.userPermissions"
                :key="permission"
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
              >
                {{ permission }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>