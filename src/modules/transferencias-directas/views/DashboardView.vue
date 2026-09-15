<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { computed, onMounted, ref } from 'vue';
import CardDashboard from '../components/CardDashboard.vue';
import BotonAtrasModulo from '../components/BotonAtrasModulo.vue';
import { ClipboardDocumentCheckIcon, ClockIcon, TruckIcon } from '@heroicons/vue/24/outline';
import transferenciasService from '../services/transferenciasService.js';
const authStore = useAuthStore()
const puedeCrear = computed(() => authStore.hasPermission('transferenciadirecta.solicitar'))
const puedeAprobar = computed(() => authStore.hasPermission('transferenciadirecta.aprobar'))
const totalPendientes = ref(0)
const cargandoContador = ref(false)


onMounted(async () => {
    if (!puedeAprobar.value) return
    cargandoContador.value = true
    try {
        totalPendientes.value = await transferenciasService.contadorPendientesAprobacion()
    } catch {
    } finally {
        cargandoContador.value = false
    }
})
</script>

<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-6">
            <!--Cabecera-->
            <div class="flex items-center gap-4">
                <BotonAtrasModulo />
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
                        Transferencias
                    </h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona las transferencias de mercadería entre tiendas.
                    </p>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <CardDashboard v-if="puedeCrear" title="Crear Transferencia"
                    description="Solicitar una nueva transferencia de mercadería"
                    :to="{ name: 'transferencias-stock-crearsolicitud' }" accent="emerald">
                    <template #icon>
                        <TruckIcon />
                    </template>
                </CardDashboard>
                <CardDashboard v-if="puedeAprobar" title="Bandeja de Aprobación"
                    description="Solicitudes pendientes de aprobación"
                    :to="{ name: 'transferencias-stock-bandeja-aprobacion' }" accent="rose"
                    :badge="totalPendientes" :badge-cargando="cargandoContador">
                    <template #icon>
                        <ClipboardDocumentCheckIcon />
                    </template>
                </CardDashboard>

                <CardDashboard title="Historial de Transferencias"
                    description="Consulta el historial de las solicitudes enviadas y su estado"
                    :to="{ name: 'transferencias-stock-historial' }" accent="blue">
                    <template #icon>
                        <ClockIcon />
                    </template>
                </CardDashboard>
            </div>
        </div>
    </div>
</template>
