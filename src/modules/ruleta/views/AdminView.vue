<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import VolverButton from '../components/VolverButton.vue'
const authStore = useAuthStore()

</script>

<template>
  <div class="space-y-6">

    <VolverButton to="/ruleta" label="Ruleta One Card" />

    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Administración — Ruleta One Card</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Configura campañas, premios, inventario y métricas globales.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

      <!-- Gestión de campañas -->
      <router-link to="/ruleta/admin/campanas"
        class="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-600 transition-all">
        <div class="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
          </svg>
        </div>
        <p class="text-base font-bold text-gray-900 dark:text-white mb-1">Gestión de campañas</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Configura reglas, fechas, ubicaciones y diseño visual de las ruletas activas.</p>
      </router-link>

      <!-- Inventario por tienda -->
      <router-link to="/ruleta/admin/inventario"
        class="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-600 transition-all">
        <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <p class="text-base font-bold text-gray-900 dark:text-white mb-1">Inventario por tienda</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Control de stock en tiempo real distribuido por locación física y alertas de reposición.</p>
      </router-link>

      <!-- Dashboard global -->
      <router-link to="/ruleta/admin/dashboard"
        class="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-600 transition-all">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
          </svg>
        </div>
        <p class="text-base font-bold text-gray-900 dark:text-white mb-1">Dashboard global</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Métricas a nivel nacional de participación, conversión de afiliaciones y gasto en premios.</p>
      </router-link>

      <!-- Diseño Visual -->
      <router-link to="/ruleta/admin/tema"
        class="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-600 transition-all">
        <div class="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
          </svg>
        </div>
        <p class="text-base font-bold text-gray-900 dark:text-white mb-1">Diseño Visual</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Personaliza colores de segmentos, aro, hub, fondo y puntero de la ruleta.</p>
      </router-link>

      <!-- Enroladores y ranking -->
      <router-link to="/ruleta/admin/enroladores"
        class="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-600 transition-all">
        <div class="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <p class="text-base font-bold text-gray-900 dark:text-white mb-1">Enroladores y ranking</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Monitorea el desempeño de los promotores en tiendas y su ranking de afiliaciones.</p>
      </router-link>

    </div>
  </div>
</template>
