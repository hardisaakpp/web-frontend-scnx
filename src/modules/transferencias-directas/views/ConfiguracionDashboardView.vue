<script setup lang="ts">
/** Submenú de configuración: agrupa los parámetros del módulo. */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import CardDashboard from '../components/CardDashboard.vue'
import BotonAtrasModulo from '../components/BotonAtrasModulo.vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const puedeConfigurar = computed(() => authStore.hasPermission('transferenciadirecta.configuracion_envios'))
const puedeMatrizAprobacion = computed(() => authStore.hasPermission('transferenciadirecta.matriz_aprobacion'))
</script>

<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-6">
            <div class="flex items-center gap-4">
                <BotonAtrasModulo />
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Configuración</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Parámetros de envíos, aprobaciones y notificaciones.
                    </p>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <CardDashboard v-if="puedeConfigurar" title="Configuración de Envíos"
                    description="Marcas origen y destino permitidas"
                    :to="{ name: 'transferencias-stock-config-envios' }" accent="purple">
                    <template #icon>
                        <Cog6ToothIcon />
                    </template>
                </CardDashboard>

                <CardDashboard v-if="puedeMatrizAprobacion" title="Configuración Matriz de Aprobación"
                    description="Reglas de aprobación por marca origen y tienda/bodega destino"
                    :to="{ name: 'transferencias-stock-matriz-aprobacion' }" accent="amber">
                    <template #icon>
                        <Cog6ToothIcon />
                    </template>
                </CardDashboard>
            </div>
        </div>
    </div>
</template>
