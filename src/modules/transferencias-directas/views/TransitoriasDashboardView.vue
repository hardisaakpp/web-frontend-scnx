<script setup lang="ts">
/**
 * Submenú de Gestión de Transitorias: seguimiento de la mercadería recibida
 * (lo que llegó a la transitoria de la tienda y quedó pendiente de recibir).
 */
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
</script>

<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <router-link to="/transferencias-stock"
                    class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
                    <ArrowLeftIcon class="w-5 h-5" />
                </router-link>
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Transitorias</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Seguimiento de la mercadería recibida y sus pendientes.
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <!-- TODO Fase 3: habilitar cuando existan las vistas y sus endpoints
                <CardDashboard title="Transitorias Abiertas"
                    description="Transitorias con mercadería pendiente de recibir"
                    :to="{ name: 'transitorias-abiertas' }" accent="amber">
                    <template #icon><ArchiveBoxIcon /></template>
                </CardDashboard>

                <CardDashboard title="Historial de Transitorias"
                    description="Consulta el historial de las transitorias y su estado"
                    :to="{ name: 'transitorias-historial' }" accent="cyan">
                    <template #icon><ClockIcon /></template>
                </CardDashboard>
                -->

                <p class="text-sm text-gray-400 dark:text-gray-500">
                    Las opciones de esta sección estarán disponibles próximamente.
                </p>
            </div>
        </div>
    </div>
</template>
