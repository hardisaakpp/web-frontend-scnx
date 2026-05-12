<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>

<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Artículos Maestros</h1>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Administrar artículos maestros del sistema
                </p>
            </div>
        </div>
        <!-- body -->

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            
            <!-- Gestión de artículos -->
            <router-link
                v-if="authStore.isAdmin || authStore.hasPermission('articulomaestro.articulos')"
                to="/articulo-maestro/lista"
                class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
            >
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Gestión de artículos</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Visualizar y administrar artículos</div>
                    </div>
                </div>
            </router-link>

            <!-- Migracion a SAP -->
            <router-link
                v-if="authStore.isAdmin || authStore.hasPermission('articulomaestro.migracion')"
                to="/articulo-maestro/migracion"
                class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
            >
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded bg-yellow-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Migración a SAP</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Sincronización de artículos locales a SAP</div>
                    </div>
                </div>
            </router-link>

            <!-- Eliminacion en SAP -->
            <router-link
                v-if="authStore.isAdmin || authStore.hasPermission('articulomaestro.eliminacionSAP')"
                to="/articulo-maestro/eliminacion"
                class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
            >
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Eliminación en SAP</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Eliminar artícuos en SAP e inactivar localmente</div>
                    </div>
                </div>
            </router-link>

            <!-- Gestion de Catálogos -->
            <router-link
                v-if="authStore.isAdmin || authStore.hasPermission('articulomaestro.catalogos')"
                to="/articulo-maestro/catalogos"
                class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
            >
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Gestión de Catálogos</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Administrar listas generales y jerarquías</div>
                    </div>
                </div>
            </router-link>

            <!-- Historial articulos locales -->
            <router-link
                v-if="authStore.isAdmin || authStore.hasPermission('articulomaestro.historialCRUD')"
                to="/articulo-maestro/historial-locales"
                class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
            >
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded bg-green-50 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Historial de artículos locales</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Cambios realizados en el sistema</div>
                    </div>
                </div>
            </router-link>
            
            <!-- Historial articulos SAP -->
            <router-link
                v-if="authStore.isAdmin || authStore.hasPermission('articulomaestro.historialSAP')"
                to="/articulo-maestro/historial-sap"
                class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left block"
            >
                <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded bg-green-50 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"/>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Historial de artículos SAP</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Registro de sincronizaciones con SAP</div>
                    </div>
                </div>
            </router-link>

        </div>
    </div>
</template >