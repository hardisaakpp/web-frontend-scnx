<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <!-- Breadcrumb accesible -->
    <nav aria-label="Ruta de navegación" class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <router-link to="/" class="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Inicio</router-link>
      <span aria-hidden="true">/</span>
      <span class="font-medium text-gray-800 dark:text-gray-200" aria-current="page">Tesorería</span>
    </nav>

    <!-- Encabezado -->
    <header class="border-b border-gray-200 dark:border-gray-800 pb-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Tesorería y Depósitos Bancarios
          </h1>
          <p class="mt-1.5 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            Gestión de depósitos bancarios de efectivo para <strong>Mabel Trading S.A.</strong> Conciliación de cierres de caja en tiendas físicas, integración con SAP Business One y auditoría multitienda.
          </p>
        </div>
        <div v-if="almacenBase" class="inline-flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs text-indigo-700 dark:text-indigo-300">
          <BuildingStorefrontIcon class="h-4 w-4" aria-hidden="true" />
          <span>Tienda asignada: <strong>{{ almacenBase }}</strong></span>
        </div>
      </div>
    </header>

    <!-- Malla de submódulos según permisos y rol -->
    <section aria-label="Módulos de tesorería" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <!-- 1. Mis Depósitos (Siempre visible con puedeConsultar) -->
      <CardDashboard
        v-if="puedeConsultar"
        title="Mis Depósitos"
        description="Compare el efectivo de sus cierres de caja contra lo depositado y registre nuevas papeletas."
        :to="{ name: 'tesoreria-mis-depositos' }"
        accent="emerald"
      >
        <template #icon>
          <BanknotesIcon />
        </template>
      </CardDashboard>

      <!-- 2. Auditoría Global (Visible para Admin, Contabilidad y Supervisor) -->
      <CardDashboard
        v-if="puedeAuditarGlobal"
        title="Auditoría Global (Sábana Mabel)"
        description="Sábana consolidada multitienda, conciliación nacional, estados de integración a SAP y exportación a Excel."
        :to="{ name: 'tesoreria-auditoria' }"
        accent="rose"
      >
        <template #icon>
          <BuildingLibraryIcon />
        </template>
      </CardDashboard>

      <!-- 3. Configuración y Días de Gracia (Visible para Admin y Contabilidad) -->
      <CardDashboard
        v-if="puedeConfigurar"
        title="Configuración y Días de Gracia"
        description="Administre las ventanas de tiempo permitidas para depósitos y reglas de bloqueo contable."
        :to="{ name: 'tesoreria-configuracion' }"
        accent="purple"
      >
        <template #icon>
          <Cog6ToothIcon />
        </template>
      </CardDashboard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { BanknotesIcon, BuildingLibraryIcon, BuildingStorefrontIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import CardDashboard from '../components/CardDashboard.vue'
import { useTesoreriaAccess } from '../composables/useTesoreriaAccess'

const { puedeConsultar, puedeAuditarGlobal, puedeConfigurar, almacenBase } = useTesoreriaAccess()
</script>
