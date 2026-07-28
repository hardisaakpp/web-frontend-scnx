<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';
import CardDashboard from '../components/CardDashboard.vue';
import { ClockIcon, Cog6ToothIcon, TruckIcon } from '@heroicons/vue/24/outline';
const authStore = useAuthStore()
const puedeCrear = computed(() => authStore.hasPermission('transferenciadirecta.solicitar'))
const puedeConfigurar = computed(() => authStore.hasPermission('transferenciadirecta.configuracion_envios'))

</script>

<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-6">
            <!--Cabecera-->
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
                    Transferencias de Stock
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Gestiona las transferencias de mercadería entre tiendas.
                </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <CardDashboard v-if="puedeCrear" title="Crear Transferencia"
                    description="Solicitar una nueva trasnferencia de mercadería"
                    :to="{ name: 'transferencias-stock-crearsolicitud' }" accent="emerald">
                    <template #icon>
                        <TruckIcon />
                    </template>
                </CardDashboard>

                <CardDashboard title="Historial de Transferencias"
                    description="Consulta el historial de las solicitudes enviadas y su estado"
                    :to="{ name: 'transferencias-stock-historial' }" accent="blue">
                    <template #icon>
                        <ClockIcon />
                    </template>
                </CardDashboard>
                <CardDashboard v-if="puedeConfigurar" title="Configuración de Envíos"
                    description="Marcas origen y destino permitidas"
                    :to="{ name: 'transferencias-stock-config-envios' }" accent="purple">
                    <template #icon>
                        <Cog6ToothIcon />
                    </template>
                </CardDashboard>
            </div>
        </div>
    </div>
</template>
