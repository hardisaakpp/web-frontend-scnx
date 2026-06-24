<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-6">
      <p class="text-sm font-medium text-blue-600 dark:text-blue-400">StoreControl</p>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Inventario</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Flujo operativo completo: planificar, ejecutar toma, monitorear estado, cerrar snapshot y gestionar ajustes.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <button
        v-for="card in visibleCards"
        :key="card.to"
        type="button"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-left hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
        @click="router.push(card.to)"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold">
            {{ card.badge }}
          </div>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ card.title }}</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ card.description }}</p>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventarioPermissions } from '../composables/useInventarioPermissions'
import { getLegacyUserIdFromToken } from '../utils/legacyUserId'

const router = useRouter()
const { canEdit } = useInventarioPermissions()

const settingsUserId = computed(() => getLegacyUserIdFromToken() ?? 330)

const cards = computed(() => [
  {
    title: 'Mis Inventarios',
    description: 'Ver sesiones de conteo abiertas asignadas a tu bodega o a tu usuario. Acceso para todos.',
    to: '/inventario/mis-inventarios',
    badge: 'MI',
    editOnly: false
  },
  {
    title: 'Planes de inventario',
    description: 'Crear y ejecutar planificaciones por bodega con filtros de género, nivel y material.',
    to: '/inventario/planes',
    badge: 'PL',
    editOnly: false
  },
  {
    title: 'Ejecutar plan / Crear sesión',
    description: 'Ejecutar planes pendientes o crear sesiones de conteo directo sin necesidad de plan previo.',
    to: '/inventario/sesiones',
    badge: 'S',
    editOnly: false
  },
  {
    title: 'Bandeja de Ajustes',
    description: 'Crear ajuste desde sesión cerrada, editar líneas, enviar a revisión, aprobar y marcar envío SAP.',
    to: '/inventario/ajustes',
    badge: 'A',
    editOnly: false
  }
])

const visibleCards = computed(() => cards.value.filter(card => !card.editOnly || canEdit.value))
</script>
