<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { computed, onMounted, ref } from 'vue';
import CardDashboard from '../components/CardDashboard.vue';
import { ClipboardDocumentCheckIcon, ClockIcon, Cog6ToothIcon, TruckIcon } from '@heroicons/vue/24/outline';
import transferenciasService from '../services/transferenciasService.js';
const authStore = useAuthStore()
const puedeCrear = computed(() => authStore.hasPermission('transferenciadirecta.solicitar'))
const puedeConfigurar = computed(() => authStore.hasPermission('transferenciadirecta.configuracion_envios'))
const puedeMatrizAprobacion = computed(() => authStore.hasPermission('transferenciadirecta.matriz_aprobacion'))
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
