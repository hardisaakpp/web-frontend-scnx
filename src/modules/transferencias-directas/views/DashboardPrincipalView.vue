<script setup lang="ts">
/**
 * Dashboard principal del módulo. Agrupa las tres áreas en submenús:
 * envíos (transferencias), recepciones (transitorias) y configuración.
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import CardDashboard from '../components/CardDashboard.vue'
import { ArchiveBoxIcon, Cog6ToothIcon, TruckIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const puedeVerTransferencias = computed(() => authStore.hasPermission('transferenciadirecta.mod_transferencias'))
const puedeVerTransitorias = computed(() => authStore.hasPermission('transferenciadirecta.mod_transitorias'))
const puedeAdministrar = computed(() => authStore.hasPermission('transferenciadirecta.mod_administracion'))
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
                <CardDashboard v-if="puedeVerTransferencias" title="Transferencias"
                    description="Crear, aprobar y consultar las transferencias enviadas"
                    :to="{ name: 'transferencias-stock-transferencias' }" accent="blue">
                    <template #icon>
                        <TruckIcon />
                    </template>
                </CardDashboard>

                <CardDashboard v-if="puedeVerTransitorias" title="Gestión de Transitorias"
                    description="Seguimiento de la mercadería recibida y sus pendientes"
                    :to="{ name: 'transferencias-stock-transitorias' }" accent="amber">
                    <template #icon>
                        <ArchiveBoxIcon />
                    </template>
                </CardDashboard>

                <CardDashboard v-if="puedeAdministrar" title="Configuración"
                    description="Parámetros de envíos, aprobaciones y notificaciones"
                    :to="{ name: 'transferencias-stock-configuracion' }" accent="purple">
                    <template #icon>
                        <Cog6ToothIcon />
                    </template>
                </CardDashboard>
            </div>
        </div>
    </div>
</template>
