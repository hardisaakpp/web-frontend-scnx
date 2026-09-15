<script setup lang="ts">
/**
 * Botón "atrás" que además abre un menú para saltar directo a otra sección del
 * módulo (Transferencias / Transitorias / Configuración) sin pasar por el
 * dashboard principal. Un solo botón: el clic abre el menú (no navega directo),
 * y desde ahí se elige la sección o "Volver al menú principal".
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeftIcon, ChevronDownIcon, CheckIcon, TruckIcon, ArchiveBoxIcon, Cog6ToothIcon, HomeIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const route = useRoute()

const secciones = computed(() => [
    {
        to: '/transferencias-stock/transferencias',
        label: 'Transferencias',
        icon: TruckIcon,
        activo: route.path.startsWith('/transferencias-stock/transferencias')
            || route.path.startsWith('/transferencias-stock/crearsolicitud')
            || route.path.startsWith('/transferencias-stock/historial'),
        visible: authStore.hasPermission('transferenciadirecta.mod_transferencias'),
    },
    {
        to: '/transferencias-stock/transitorias',
        label: 'Gestión de Transitorias',
        icon: ArchiveBoxIcon,
        activo: route.path.startsWith('/transferencias-stock/transitorias'),
        visible: authStore.hasPermission('transferenciadirecta.mod_transitorias'),
    },
    {
        to: '/transferencias-stock/configuracion',
        label: 'Configuración',
        icon: Cog6ToothIcon,
        activo: route.path.startsWith('/transferencias-stock/configuracion'),
        visible: authStore.hasPermission('transferenciadirecta.mod_administracion'),
    },
].filter((s) => s.visible))

// Solo vale la pena el menú si hay más de una sección disponible
const tieneVariasSecciones = computed(() => secciones.value.length > 1)

const abierto = ref(false)
const raiz = ref<HTMLElement | null>(null)

const cerrarAlClicFuera = (e: MouseEvent) => {
    if (raiz.value && !raiz.value.contains(e.target as Node)) abierto.value = false
}
onMounted(() => document.addEventListener('click', cerrarAlClicFuera))
onUnmounted(() => document.removeEventListener('click', cerrarAlClicFuera))
</script>

<template>
    <!-- Sin permisos para más de una sección: botón atrás simple, sin menú -->
    <router-link v-if="!tieneVariasSecciones" to="/transferencias-stock"
        class="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
        <ArrowLeftIcon class="w-5 h-5" />
    </router-link>

    <div v-else ref="raiz" class="relative inline-block">
        <button type="button" @click="abierto = !abierto"
            class="flex items-center gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors">
            <ArrowLeftIcon class="w-5 h-5" />
            <ChevronDownIcon class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': abierto }" />
        </button>

        <div v-if="abierto"
            class="absolute left-0 top-full mt-2 z-30 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
            <router-link v-for="s in secciones" :key="s.to" :to="s.to" @click="abierto = false"
                class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                :class="s.activo
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'">
                <component :is="s.icon" class="w-4 h-4 shrink-0" />
                <span class="flex-1">{{ s.label }}</span>
                <CheckIcon v-if="s.activo" class="w-4 h-4 shrink-0" />
            </router-link>

            <router-link to="/transferencias-stock" @click="abierto = false"
                class="flex items-center gap-3 px-4 py-2.5 text-sm border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <HomeIcon class="w-4 h-4 shrink-0" />
                Volver al menú principal
            </router-link>
        </div>
    </div>
</template>
