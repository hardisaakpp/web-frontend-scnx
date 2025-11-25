<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h1 class="text-2xl font-semibold mb-4">Panel de Administración</h1>
    <p class="text-gray-600">
      Bienvenido Administrador {{ authStore.user }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>