<script setup lang="ts">
import { computed } from 'vue'
import {
  BuildingStorefrontIcon,
  PresentationChartLineIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isTienda = computed(() => authStore.hasPermission('reposiciones.tienda'))
const isAdmin = computed(() => authStore.hasPermission('reposiciones.administrador'))
const isNegocio = computed(() => authStore.hasPermission('reposiciones.negocio'))
const canManage = computed(() => isAdmin.value || isNegocio.value)

const options = computed(() => [
  ...(isTienda.value ? [{
    title: 'Catálogo - Operativo de tienda',
    description: 'Solicita artículos, gestiona tu carrito y revisa el historial específico de tus tiendas asignadas.',
    link: '/reposiciones/catalogo',
    icon: BuildingStorefrontIcon,
    color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
  }] : []),
  ...(canManage.value ? [
    {
      title: 'Catálogo - Administrador',
      description: 'Consulta el catálogo por tienda y solicitudes en curso - Diseñado para administradores',
      link: '/reposiciones/admin/catalogo',
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Historial Global',
      description: 'Accede al panel de historial global y descarga reportes consolidados.',
      link: '/reposiciones/admin/historial',
      icon: PresentationChartLineIcon,
      color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
    }
  ] : []),
  ...(isAdmin.value ? [
    {
      title: 'Configuración',
      description: 'Administración general del módulo, almacenes, centros de distribución y más parámetros.',
      link: '/reposiciones/admin/configuracion',
      icon: Cog6ToothIcon,
      color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    }
  ] : [])
])
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Menú de Reposiciones</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Modulo pensado para gestionar reposiciones de productos en tiendas.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <router-link
        v-for="opt in options"
        :key="opt.title"
        :to="opt.link"
        class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
      >
        <div class="flex items-start gap-3">
          <div :class="[opt.color, 'w-8 h-8 rounded flex items-center justify-center flex-shrink-0']">
            <component :is="opt.icon" class="w-4 h-4" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white text-sm">{{ opt.title }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ opt.description }}</div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
