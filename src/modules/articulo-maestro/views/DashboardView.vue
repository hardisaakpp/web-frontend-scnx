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

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-6">
            
            <!-- Gestion de articulos -->
            <router-link
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
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Gestion de articulos</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Visualizar y administrar artículos</div>
                    </div>
                </div>
            </router-link>

            <!-- Migracion a SAP -->
            <router-link
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
                        <div class="font-medium text-gray-900 dark:text-white text-sm">Migracion a SAP</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Sincronización de artículos locales a SAP</div>
                    </div>
                </div>
            </router-link>

            <!-- Historial articulos locales -->
            <router-link
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