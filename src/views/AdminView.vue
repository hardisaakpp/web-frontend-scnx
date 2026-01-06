<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
    <h1 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Panel de Administración</h1>
    <p class="text-gray-600 dark:text-gray-400">
      Bienvenido Administrador {{ authStore.user }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>