<script setup lang="ts">
/**
 * Submenú de Gestión de Transitorias: seguimiento de la mercadería recibida
 * (lo que llegó a la transitoria de la tienda y quedó pendiente de recibir).
 */
import CardDashboard from '../components/CardDashboard.vue';
import BotonAtrasModulo from '../components/BotonAtrasModulo.vue';
import { ClockIcon } from 'lucide-vue-next';
</script>

<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <BotonAtrasModulo />
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Transitorias</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Monitoreo y gestión de transferencias de stock en tránsito y sus diferencias.
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <CardDashboard title="Historial de Transitorias"
                    description="Consulta el historial de transferencias de stock recibidas, unidades en tránsito y su estado."
                    :to="{ name: 'transitorias-historial' }" accent="cyan">
                    <template #icon>
                        <ClockIcon />
                    </template>
                </CardDashboard>
            </div>

        </div>
    </div>
</template>
