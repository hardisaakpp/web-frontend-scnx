<template>
  <Layout>
    <div class="px-4 py-6 sm:px-0">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

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

      <!-- Módulos Disponibles -->
      <div class="mt-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Módulos Disponibles</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="relative rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-gray-600 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition-colors duration-300"
          >
            <div class="flex-1 min-w-0">
              <span class="absolute inset-0" aria-hidden="true"></span>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '@/components/Layout.vue'
import { useAuthStore } from '@/stores/auth'
import { useMenu } from '@/composables/useMenu'

const authStore = useAuthStore()
const { menuItems } = useMenu()
</script>