<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Ruleta One Card</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Selecciona tu área de trabajo
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">

      <!-- Enrolador: girar ruleta -->
      <router-link
        v-if="authStore.isAdmin || authStore.hasPermission('ruleta.enrolar')"
        to="/ruleta/enrolador"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Girar Ruleta</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Identificar cliente y ejecutar giro</div>
          </div>
        </div>
      </router-link>

      <!-- Admin: panel de administración -->
      <router-link
        v-if="authStore.isAdmin || authStore.hasPermission('ruleta.administrar')"
        to="/ruleta/admin"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Administración</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Campañas, premios, inventario y métricas globales</div>
          </div>
        </div>
      </router-link>

      <!-- Supervisor: monitoreo de enroladores -->
      <router-link
        v-if="authStore.isAdmin || authStore.hasPermission('ruleta.supervisar')"
        to="/ruleta/supervisor"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">Monitoreo de Enroladores</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">KPIs y rendimiento en tiempo real</div>
          </div>
        </div>
      </router-link>


    </div>
  </div>
</template>
