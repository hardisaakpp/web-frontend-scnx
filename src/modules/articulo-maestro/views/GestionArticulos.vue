<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de artículos</h1>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Administración de artículos maestros
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <button
                        class="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        @click="showKeyboardHelp = true"
                        title="Atajos de teclado"
                    >
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18V6ZM7.5 9h.008v.008H7.5V9Zm3 0h.008v.008H10.5V9Zm3 0h.008v.008H13.5V9Zm3 0h.008v.008H16.5V9Zm-9 3h.008v.008H7.5V12Zm3 0h.008v.008H10.5V12Zm3 0h.008v.008H13.5V12Zm3 0h.008v.008H16.5V12Zm-6 3h.008v.008H10.5V15Zm3 0h.008v.008H13.5V15Z" />
                        </svg>
                    </button>
                    <router-link
                        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 transition-colors shadow-sm"
                        to="/articulo-maestro/migracion">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                        Sincronización SAP
                    </router-link>
                    <router-link
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        to="/articulo-maestro">
                        Volver
                    </router-link>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="mt-6 flex gap-3">
                <button
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                    @click="router.push('/articulo-maestro/nuevo')"
                >
                    + Agregar artículo
                </button>
                <button
                    class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
                    @click="openCargaModal"
                >
                    + Cargar archivo
                </button>
                <button
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
                    @click="handleDescargarReporte"
                    :disabled="downloadingReport"
                >
                    <svg v-if="downloadingReport" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    {{ downloadingReport ? 'Descargando...' : 'Descargar Reporte del Día' }}
                </button>
            </div>

            <button
                v-if="importStore.trabajo"
                type="button"
                class="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left shadow-sm transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                @click="openCargaModal"
            >
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <p class="text-sm font-semibold text-blue-900 dark:text-blue-200">
                            Importación #{{ importStore.trabajo.id }} · {{ estadoImportacionLabel }}
                        </p>
                        <p class="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
                            {{ importStore.trabajo.gruposProcesados }} de {{ importStore.trabajo.totalGrupos }} grupos · {{ importStore.progress }} %
                        </p>
                    </div>
                    <span class="text-xs font-semibold text-blue-700 dark:text-blue-300">Ver detalle</span>
                </div>
            </button>
            
            <!-- Table Container -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                
                <!-- Barra de acción masiva -->
                <div v-if="selectedCodes.size > 0" class="mb-4 flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2.5">
                    <span class="text-sm font-medium text-blue-800 dark:text-blue-300">{{ selectedCodes.size }} artículo(s) seleccionado(s)</span>
                    <div class="flex items-center gap-3">
                        <button type="button" class="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline" @click="selectedCodes.clear()">Limpiar selección</button>
                        <button
                            type="button"
                            class="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
                            @click="confirmandoBulkDelete = true"
                        >
                            Eliminar seleccionados
                        </button>
                    </div>
                </div>

                <!-- Filters and Controls -->
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div class="flex flex-col gap-1">
                        <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            Total encontrados: <span class="font-bold text-gray-900 dark:text-white">{{ filteredArticulos.length }}</span>
                            <span class="text-gray-400 font-normal ml-1">de {{ totalCount }}</span>
                        </div>
                        <div class="text-[10px] text-gray-400">
                            {{ hiddenColumns.size > 0 ? `${hiddenColumns.size} columnas ocultas` : 'Todas las columnas visibles' }}
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 items-center">
                        <!-- Column Visibility Popover -->
                        <Popover v-slot="{ open }" class="relative">
                            <PopoverButton :class="open ? 'bg-gray-100 dark:bg-gray-700' : ''" class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors outline-none">
                                <ViewColumnsIcon class="h-4 w-4" />
                                <span>Columnas</span>
                            </PopoverButton>

                            <transition
                                enter-active-class="transition duration-200 ease-out"
                                enter-from-class="translate-y-1 opacity-0"
                                enter-to-class="translate-y-0 opacity-100"
                                leave-active-class="transition duration-150 ease-in"
                                leave-from-class="translate-y-0 opacity-100"
                                leave-to-class="translate-y-1 opacity-0"
                            >
                                <PopoverPanel class="absolute right-0 z-20 mt-2 w-72 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700">
                                    <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <h3 class="font-semibold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Visibilidad de Columnas</h3>
                                        <div class="flex gap-3">
                                            <button @click="resetColumns" class="text-[10px] text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">Mostrar todas</button>
                                            <button @click="hideAllColumns" class="text-[10px] text-rose-600 hover:text-rose-800 font-medium whitespace-nowrap">Ocultar todas</button>
                                        </div>
                                    </div>

                                    <div class="max-h-80 overflow-y-auto p-2 grid grid-cols-1 gap-1">
                                        <button 
                                            v-for="col in allColumns" 
                                            :key="col.key"
                                            @click="toggleColumn(col.key)"
                                            class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-left transition-colors"
                                        >
                                            <div :class="!hiddenColumns.has(col.key) ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-300 dark:border-gray-600'" class="w-4 h-4 rounded border flex items-center justify-center transition-colors">
                                                <CheckIcon v-if="!hiddenColumns.has(col.key)" class="h-3 w-3 text-white" />
                                            </div>
                                            <span :class="!hiddenColumns.has(col.key) ? 'text-gray-900 dark:text-white' : 'text-gray-400'" class="text-xs truncate">{{ col.label }}</span>
                                        </button>
                                    </div>
                                </PopoverPanel>
                            </transition>
                        </Popover>

                        <input
                            v-model.trim="searchQuery"
                            type="text"
                            placeholder="Buscar..."
                            aria-label="Buscar artículos"
                            class="w-full sm:w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all"
                        />
                        <select v-model.number="pageSize" aria-label="Filas por página" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all cursor-pointer">
                            <option :value="5">5 filas</option>
                            <option :value="10">10 filas</option>
                            <option :value="20">20 filas</option>
                            <option :value="50">50 filas</option>
                            <option :value="100">100 filas</option>
                        </select>
                    </div>
                </div>


                <!-- States -->
                <div v-if="loading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    Cargando artículos...
                </div> 
                <div v-else-if="error" class="py-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 border border-red-200 dark:border-red-800">
                    {{ error }}
                </div>
                <div v-else-if="filteredArticulos.length === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron artículos con la búsqueda actual.
                </div>
                
                <!-- Table -->
                <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                        <thead class="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th class="px-4 py-3 w-10 sticky left-0 bg-gray-50 dark:bg-gray-900/50 z-10">
                                    <input
                                        type="checkbox"
                                        aria-label="Seleccionar todos los artículos de la página"
                                        class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        :checked="allOnPageSelected"
                                        @change="toggleSelectAllOnPage"
                                    />
                                </th>
                                <th
                                    v-for="col in visibleColumns"
                                    :key="col.key"
                                    @click="toggleSort(col.key)"
                                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px] whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div class="flex items-center gap-1">
                                        {{ col.label }}
                                        <div class="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity" :class="{ 'opacity-100': sortKey === col.key }">
                                            <ChevronUpIcon class="h-2 w-2" :class="sortKey === col.key && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'" />
                                            <ChevronDownIcon class="h-2 w-2" :class="sortKey === col.key && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'" />
                                        </div>
                                    </div>
                                </th>
                                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32 sticky right-0 bg-gray-50 dark:bg-gray-900 z-10 shadow-[-4px_0_4px_rgba(0,0,0,0.05)]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            <tr v-for="articulo in pagedArticulos" :key="articulo.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                <td class="px-4 py-3 w-10 sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 z-10">
                                    <input
                                        type="checkbox"
                                        :aria-label="`Seleccionar ${articulo.itemCode}`"
                                        class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        :checked="selectedCodes.has(articulo.itemCode)"
                                        @change="toggleSelectRow(articulo.itemCode)"
                                    />
                                </td>
                                <td
                                    v-for="col in visibleColumns"
                                    :key="col.key"
                                    class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 truncate"
                                >
                                    <template v-if="col.key === 'uPrArq' || col.key === 'price'">
                                        ${{ Number(articuloValor(articulo, col.key) ?? 0).toFixed(2) }}
                                    </template>
                                    <template v-else-if="col.key === 'uGen'">
                                        {{ articulo.uGen?.toString().toUpperCase() ?? '-' }}
                                    </template>
                                    <template v-else-if="col.key === 'estadoProducto'">
                                        <span :class="articulo.estadoProducto ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'">
                                            {{ articulo.estadoProducto ? 'Activo' : 'Inactivo' }}
                                        </span>
                                    </template>
                                    <template v-else-if="col.key === 'listasPrecio'">
                                        {{ formatListasPrecio(articulo) }}
                                    </template>
                                    <template v-else-if="col.key === 'estadoSap'">
                                        <span
                                            class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                                            :class="estadoBadge(articulo).classes"
                                            :title="articulo.controlSap?.estado === 'ERROR' ? (articulo.controlSap?.mensaje_sap_amigable || articulo.controlSap?.mensaje_sap || 'Error de sincronización con SAP.') : ''"
                                        >
                                            <svg v-if="estadoBadge(articulo).spin" class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                            {{ estadoBadge(articulo).label }}
                                        </span>
                                    </template>
                                    <template v-else>
                                        {{ articuloValor(articulo, col.key) ?? '-' }}
                                    </template>
                                </td>
                                <td class="px-4 py-3 text-sm text-right whitespace-nowrap sticky right-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 z-10 shadow-[-4px_0_4px_rgba(0,0,0,0.05)]">
                                    <button
                                        class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium mr-3 transition-colors text-xs inline-flex items-center gap-1"
                                        @click="openInspeccion(articulo)"
                                    >
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                        Fotos
                                    </button>
                                    <button
                                        class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium mr-3 transition-colors text-xs"
                                        @click="router.push(`/articulo-maestro/editar/${articulo.itemCode}`)"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        class="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 font-medium transition-colors text-xs"
                                        :disabled="deletingCode === articulo.itemCode"
                                        @click="handleDelete(articulo.itemCode)"
                                    >
                                        {{ deletingCode === articulo.itemCode ? 'Eliminando...' : 'Eliminar' }}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>


                <!-- Pagination Footer -->
                <div v-if="filteredArticulos.length > 0" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        Mostrando <span class="font-medium text-gray-900 dark:text-white">{{ pageStart }}</span> a <span class="font-medium text-gray-900 dark:text-white">{{ pageEnd }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            :disabled="page === 1"
                            @click="page--"
                        >
                            Anterior
                        </button>
                        <div class="text-xs text-gray-600 dark:text-gray-300 font-medium bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                            {{ page }} / {{ totalPages }}
                        </div>
                        <button
                            type="button"
                            class="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            :disabled="page >= totalPages"
                            @click="page++"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Modal Carga Masiva -->
    <ModalImportacion v-if="showCargaModal" @close="closeCargaModal" />

    <KeyboardHelpModal
        :is-open="showKeyboardHelp"
        :shortcuts="shortcuts"
        @close="showKeyboardHelp = false"
    />

    <!-- Modal Confirmación Eliminar -->
    <Teleport to="body">
        <div v-if="pendingDeleteCode" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/50" @click="pendingDeleteCode = null"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirmar eliminación</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    ¿Estás seguro de que deseas eliminar el artículo
                    <strong class="text-gray-900 dark:text-white font-mono">{{ pendingDeleteCode }}</strong>?
                    Esta acción no se puede deshacer.
                </p>
                <div class="flex justify-end gap-3">
                    <button
                        @click="pendingDeleteCode = null"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        @click="confirmDelete"
                        :disabled="!!deletingCode"
                        class="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-colors"
                    >
                        {{ deletingCode ? 'Eliminando...' : 'Eliminar' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <Teleport to="body">
        <InspeccionVisualModal
            :is-open="modalInspeccionAbierto"
            :articulo-base="articuloAInspeccionar"
            @close="modalInspeccionAbierto = false"
        />
    </Teleport>

    <!-- Confirmación de borrado masivo -->
    <Teleport to="body">
        <div v-if="confirmandoBulkDelete" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/50" @click="confirmandoBulkDelete = false"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirmar eliminación masiva</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    ¿Estás seguro de que deseas eliminar los <strong class="text-gray-900 dark:text-white">{{ selectedCodes.size }}</strong> artículos seleccionados?
                    Esta acción no se puede deshacer.
                </p>
                <div class="flex justify-end gap-3">
                    <button
                        type="button"
                        @click="confirmandoBulkDelete = false"
                        class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        @click="handleBulkDelete"
                        :disabled="bulkDeleting"
                        class="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-colors"
                    >
                        {{ bulkDeleting ? 'Eliminando...' : 'Eliminar' }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Resultado multi-estado del borrado masivo -->
    <Teleport to="body">
        <div v-if="bulkDeleteResult" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/50" @click="bulkDeleteResult = null"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Resultado de la eliminación</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span class="font-medium text-emerald-600 dark:text-emerald-400">{{ bulkDeleteResult.success_count }}</span> eliminados correctamente de
                    <span class="font-medium text-gray-900 dark:text-white">{{ bulkDeleteResult.total }}</span> seleccionados.
                    <span v-if="bulkDeleteResult.error_count > 0" class="text-rose-600 dark:text-rose-400 font-medium">
                        {{ bulkDeleteResult.error_count }} fallaron.
                    </span>
                </p>
                <div v-if="bulkDeleteResult.errores.length > 0" class="overflow-y-auto flex-1 space-y-2 mb-4">
                    <div
                        v-for="err in bulkDeleteResult.errores"
                        :key="err.item_code"
                        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2"
                    >
                        <p class="text-sm font-mono font-semibold text-red-800 dark:text-red-300">{{ err.item_code }}</p>
                        <p class="text-xs text-red-700 dark:text-red-400">{{ err.detail }}</p>
                    </div>
                </div>
                <div class="flex justify-end">
                    <button
                        type="button"
                        @click="bulkDeleteResult = null"
                        class="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import {
    ChevronUpIcon,
    ChevronDownIcon,
    ViewColumnsIcon,
    CheckIcon
} from '@heroicons/vue/20/solid'
import { useArticuloStore, type ReporteDiarioError } from '../stores/articuloStore'
import { useImportacionArticulosStore } from '../stores/importacionArticulosStore'
import { articuloService, type ArticuloBulkDeleteResponse } from '../services/articuloService'
import type { Articulo, EstadoSincronizacion } from '../types'
import KeyboardHelpModal from '../components/KeyboardHelpModal.vue'
import ModalImportacion from '../components/ModalImportacion.vue'
import InspeccionVisualModal from '../components/InspeccionVisualModal.vue'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const modalInspeccionAbierto = ref(false)
const articuloAInspeccionar = ref<Articulo | null>(null)

function openInspeccion(articulo: Articulo) {
    articuloAInspeccionar.value = articulo
    modalInspeccionAbierto.value = true
}

const router = useRouter()
const importStore = useImportacionArticulosStore()

const showKeyboardHelp = ref(false)
const shortcuts = {
    'Ctrl+M': {
        description: 'Nuevo artículo',
        action: () => router.push('/articulo-maestro/nuevo')
    },
    'Ctrl+F': {
        description: 'Buscar artículo',
        action: () => {
            const input = document.querySelector('input[placeholder="Buscar..."]') as HTMLInputElement
            if (input) input.focus()
        }
    },
    'Esc': {
        description: 'Cerrar modal',
        action: () => {
            if (showKeyboardHelp.value) {
                showKeyboardHelp.value = false
            } else if (showCargaModal.value) {
                closeCargaModal()
            } else if (pendingDeleteCode.value) {
                pendingDeleteCode.value = null
            }
        }
    }
}
useKeyboardShortcuts(shortcuts)
const store = useArticuloStore()

// Obtenemos el estado reactivo desde el store
const { articulos, loading, error, filters } = storeToRefs(store)

const searchQuery = computed({
    get: () => filters.value.search || '',
    set: (val: string) => store.setSearchFilter(val)
})

const pageSize = computed({
    get: () => filters.value.pageSize || 10,
    set: (val: number) => {
        store.filters.pageSize = val
        store.setPage(1)
    }
})

const page = computed({
    get: () => store.pagination.page,
    set: (val: number) => store.setPage(val)
})

const totalCount = computed(() => store.pagination.total)

// ─── Columnas y Visibilidad ───
// 'listasPrecio' y 'estadoSap' son columnas sintéticas (derivadas, no viven
// tal cual en Articulo), de ahí la unión con keyof Articulo.
type ColumnKey = keyof Articulo | 'listasPrecio' | 'estadoSap'

function articuloValor(articulo: Articulo, key: ColumnKey): unknown {
    return (articulo as unknown as Record<string, unknown>)[key]
}

const allColumns: Array<{ key: ColumnKey; label: string }> = [
    { key: 'itemCode', label: 'CODIGO INTERNO' },
    { key: 'barCode', label: 'CODIGO DE BARRAS' },
    { key: 'codigoAlterno', label: 'CODIGO ALTERNO' },
    { key: 'tieneCodigoProveedor', label: 'TIENE CODIGO PROVEEDOR' },
    { key: 'uGen', label: 'GENERO' },
    { key: 'foreignName', label: 'DESCRIPCION SAP' },
    { key: 'uDescEcomm', label: 'DESCRIPCION ETIQUETA' },
    { key: 'itemName', label: 'DESCRIPCION FACTURA' },
    { key: 'uCodColor', label: 'COD COLOR PRIMARIO' },
    { key: 'uIxxColores', label: 'COLOR PRIMARIO' },
    { key: 'uCodColSecu', label: 'COD COLOR SECUNDARIO' },
    { key: 'uColorSecu', label: 'COLOR SECUNDARIO' },
    { key: 'uSxxSkuSinTalla', label: 'REFERENCIA' },
    { key: 'uIxxTalla', label: 'TALLA' },
    { key: 'uIxxMaterial', label: 'MATERIAL' },
    { key: 'uIxxComposicion', label: 'COMPOSICION' },
    { key: 'uNv3', label: 'LINEA' },
    { key: 'uNv2', label: 'CATEGORIA' },
    { key: 'uNv1', label: 'SECCION' },
    { key: 'uAtrMed', label: 'ATRIBUTO UNICO TEXTIL/CALZADO' },
    { key: 'uAtrUni', label: 'ATRIBUTO UNICO 2' },
    { key: 'uIxxPack', label: 'UNIDAD DE VENTA (PACK)' },
    { key: 'uCodPvr', label: 'CODIGO PROVEEDOR' },
    { key: 'uMarca', label: 'MARCA' },
    { key: 'uNomColeccion', label: 'NOMBRE COLECCION' },
    { key: 'uReposicion', label: 'ESTATUS DE PERMANENCIA' },
    { key: 'uOrigen', label: 'ORIGEN DE COMPRA' },
    { key: 'uPOri', label: 'PAIS DE ORIGEN' },
    { key: 'leadTime', label: 'LEAD TIME PROVEEDOR (DIAS)' },
    { key: 'minOrderQuantity', label: 'CANTIDAD MINIMA DE COMPRA' },
    { key: 'uTipAbs', label: 'ENVIO DIRECTO A TIENDA' },
    { key: 'uUnidadDespacho', label: 'UNIDAD DE EMPAQUE - OUTER' },
    { key: 'uDespIn', label: 'UNIDAD DE EMPAQUE - INNER' },
    { key: 'uCanalVenta', label: 'CANAL DE VENTA' },
    { key: 'uRegion', label: 'REGION DE VENTA' },
    { key: 'uPrArq', label: 'COSTO DE ARRANQUE' },
    { key: 'price', label: 'PVP' },
    { key: 'uLiq', label: 'LIQUIDACION' },
    { key: 'listasPrecio', label: 'LISTAS DE PRECIO' },
    { key: 'itemsGroupCode', label: 'GRUPO ARTICULOS' },
    { key: 'uIxxMarca', label: 'NEGOCIO' },
    { key: 'itemType', label: 'ItemType' },
    { key: 'costAccountingMethod', label: 'EvalSystem' },
    { key: 'glMethod', label: 'GLMethod' },
    { key: 'manageStockByWarehouse', label: 'ByWh' },
    { key: 'purchaseItem', label: 'PrchseItem' },
    { key: 'salesItem', label: 'SellItem' },
    { key: 'inventoryItem', label: 'InvntItem' },
    { key: 'vatLiable', label: 'VATLiable' },
    { key: 'wtLiable', label: 'WTLiable' },
    { key: 'indirectTax', label: 'IndirctTax' },
    { key: 'arTaxCode', label: 'TaxCodeAR' },
    { key: 'apTaxCode', label: 'TaxCodeAP' },
    { key: 'manufacturer', label: 'FirmCode' },
    { key: 'shipType', label: 'ShipType' },
    { key: 'manageBatchNumbers', label: 'Gestión por Lotes' },
    { key: 'estadoSap', label: 'SINCRONIZACIÓN' },
    { key: 'estadoProducto', label: 'ESTADO PRODUCTO' },
    { key: 'aplicaEcommerce', label: 'APLICA ECOMMERCE' },
    { key: 'planningSystem', label: 'PlaningSys' },
    { key: 'procurementMethod', label: 'PrcrmntMtd' },
    { key: 'inventoryUom', label: 'InvntryUom' },
    { key: 'purchaseUnit', label: 'BuyUnitMsr' },
    { key: 'purchaseItemsPerUnit', label: 'NumInBuy' },
    { key: 'salesUnit', label: 'SalUnitMsr' },
    { key: 'salesItemsPerUnit', label: 'NumInSale' },
    { key: 'uTipoBien', label: 'U_TIPO_BIEN' },
]

function formatListasPrecio(articulo: Articulo): string {
    const listas: string[] = []
    if (articulo.aplicaPrecioMinorista) listas.push('Minorista')
    if (articulo.aplicaPrecioInternacional) listas.push('Internacional')
    return listas.length ? listas.join(', ') : '-'
}

// ─── Badge de estado de sincronización SAP ───
const ESTADO_BADGE: Record<EstadoSincronizacion, { label: string; classes: string; spin?: boolean }> = {
    SINCRONIZADO: {
        label: 'Sincronizado',
        classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    },
    EN_COLA: {
        label: 'En Sincronización',
        classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        spin: true
    },
    PENDIENTE: {
        label: 'Pendiente',
        classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    BORRADOR: {
        label: 'Borrador Local',
        classes: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    },
    ERROR: {
        label: 'Error',
        classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    }
}

function estadoBadge(articulo: Articulo) {
    const estado = articulo.controlSap?.estado ?? 'BORRADOR'
    return ESTADO_BADGE[estado] ?? ESTADO_BADGE.BORRADOR
}

const hiddenColumns = ref<Set<string>>(new Set())

const visibleColumns = computed(() => 
    allColumns.filter(col => !hiddenColumns.value.has(col.key))
)

function toggleColumn(key: string) {
    if (hiddenColumns.value.has(key)) {
        hiddenColumns.value.delete(key)
    } else {
        hiddenColumns.value.add(key)
    }
}

function resetColumns() {
    hiddenColumns.value.clear()
}

function hideAllColumns() {
    allColumns.forEach(col => hiddenColumns.value.add(col.key))
}


// ─── Ordenamiento ───
const sortKey = ref<ColumnKey>('itemCode')
const sortOrder = ref<'asc' | 'desc'>('asc')

function toggleSort(key: ColumnKey) {
    if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = key
        sortOrder.value = 'asc'
    }
}

const filteredArticulos = computed(() => {
    // Ya no filtramos localmente por query, confiamos en el filtrado del backend
    let result = articulos.value

    // Aplicar ordenamiento local sobre los resultados entregados por el servidor
    if (sortKey.value) {
        result = [...result].sort((a, b) => {
            const valA = articuloValor(a, sortKey.value)
            const valB = articuloValor(b, sortKey.value)
            if (valA === valB) return 0
            if (valA == null) return 1
            if (valB == null) return -1
            
            let comparison = 0
            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB
            } else {
                comparison = String(valA).localeCompare(String(valB))
            }
            return sortOrder.value === 'asc' ? comparison : -comparison
        })
    }

    return result
})

const totalPages = computed(() => store.pagination.totalPages)

const pagedArticulos = computed(() => {
    // Como ahora la paginación es del lado del servidor, filteredArticulos ya contiene
    // solo los elementos de la página actual. No necesitamos hacer .slice() local.
    return filteredArticulos.value
})

const pageStart = computed(() => {
    if (filteredArticulos.value.length === 0) return 0
    return (page.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
    const end = page.value * pageSize.value
    // Usamos totalCount (total real en servidor) para el límite superior
    return Math.min(end, totalCount.value)
})

// Observadores (Watchers)
watch(filteredArticulos, () => {
    if (page.value > totalPages.value && totalPages.value > 0) {
        page.value = totalPages.value
    }
})

// Si el usuario cambia la búsqueda o la cantidad de ítems por página, lo regresamos a la página 1.
watch([searchQuery, pageSize], () => {
    page.value = 1
})

// Ciclo de Vida
onMounted(async () => {
    await Promise.all([
        store.fetchArticulos(),
        importStore.restaurar()
    ])
})

watch(
    () => importStore.trabajo?.estado,
    (estado, anterior) => {
        if (
            estado &&
            estado !== anterior &&
            ['COMPLETADO', 'COMPLETADO_CON_ERRORES', 'ERROR'].includes(estado)
        ) {
            store.fetchArticulos()
        }
    }
)

// ─── Manejo normalizado de errores HTTP ───
// El backend ya traduce los 422 de Pydantic a mensajes de negocio en español
// (ver app/core/error_translator.py): cada item de `detail` trae un `msg` ya
// listo para mostrarse. Para 400/404/409/503 el `detail` es un string plano.
function extraerMensajeError(error: unknown, fallback: string): string {
    const axiosErr = error as {
        response?: {
            status?: number
            data?: { detail?: string | { msg: string }[] }
        }
    }
    const status = axiosErr.response?.status
    const detail = axiosErr.response?.data?.detail

    if (Array.isArray(detail)) return detail.map(d => d.msg).join(' ')
    if (typeof detail === 'string') return detail
    if (status === 409) return 'El artículo ya existe o se encuentra bloqueado por una tarea en proceso.'
    if (status === 503) return 'Servicio SAP no disponible temporalmente. La operación no se aplicó para proteger el inventario.'
    if (status === 403) return 'Acción denegada: el artículo ya está sincronizado con SAP y no permite esta modificación.'
    return fallback
}

// Eliminar artículo con confirmación
const deletingCode = ref<string | null>(null)
const pendingDeleteCode = ref<string | null>(null)

function handleDelete(itemCode: string) {
    pendingDeleteCode.value = itemCode
}

async function confirmDelete() {
    if (!pendingDeleteCode.value) return
    const itemCode = pendingDeleteCode.value
    deletingCode.value = itemCode
    try {
        await articuloService.deleteArticulo(itemCode)
        pendingDeleteCode.value = null
        selectedCodes.delete(itemCode)
        await store.fetchArticulos()
    } catch (err: unknown) {
        toast.error('No se pudo eliminar el artículo', extraerMensajeError(err, 'Inténtalo de nuevo.'))
        pendingDeleteCode.value = null
    } finally {
        deletingCode.value = null
    }
}

// ─── Selección y borrado masivo ───
const selectedCodes = reactive(new Set<string>())
const confirmandoBulkDelete = ref(false)
const bulkDeleting = ref(false)
const bulkDeleteResult = ref<ArticuloBulkDeleteResponse | null>(null)

const allOnPageSelected = computed(() =>
    pagedArticulos.value.length > 0 &&
    pagedArticulos.value.every(articulo => selectedCodes.has(articulo.itemCode))
)

function toggleSelectRow(itemCode: string): void {
    if (selectedCodes.has(itemCode)) {
        selectedCodes.delete(itemCode)
    } else {
        selectedCodes.add(itemCode)
    }
}

function toggleSelectAllOnPage(): void {
    if (allOnPageSelected.value) {
        pagedArticulos.value.forEach(articulo => selectedCodes.delete(articulo.itemCode))
    } else {
        pagedArticulos.value.forEach(articulo => selectedCodes.add(articulo.itemCode))
    }
}

async function handleBulkDelete(): Promise<void> {
    bulkDeleting.value = true
    try {
        const resultado = await articuloService.eliminarArticulosBulk([...selectedCodes])
        confirmandoBulkDelete.value = false
        bulkDeleteResult.value = resultado
        selectedCodes.clear()
        await store.fetchArticulos()
    } catch (err: unknown) {
        toast.error('No se pudo completar la eliminación masiva', extraerMensajeError(err, 'Inténtalo de nuevo.'))
        confirmandoBulkDelete.value = false
    } finally {
        bulkDeleting.value = false
    }
}

// ─── Carga Masiva ───
const showCargaModal = ref(false)

function closeCargaModal(): void {
    showCargaModal.value = false
}

function openCargaModal(): void {
    showCargaModal.value = true
}

const estadoImportacionLabel = computed(() => {
    const labels = {
        ESPERANDO: 'En espera',
        PROCESANDO: 'Procesando',
        COMPLETADO: 'Completado',
        COMPLETADO_CON_ERRORES: 'Completado con errores',
        ERROR: 'Error'
    }
    const estado = importStore.trabajo?.estado
    return estado ? labels[estado] : ''
})

const downloadingReport = ref(false)

async function handleDescargarReporte() {
    downloadingReport.value = true
    try {
        await store.descargarReporteDiario()
    } catch (err: unknown) {
        // El store ya desempaqueta el Blob de error (ver parsearErrorBlob en
        // articuloService) y relanza { status, message }. Un 404 significa
        // "no hubo artículos ese día" — no es un fallo real, así que se
        // muestra como aviso informativo en vez de error genérico en rojo.
        const { status, message } = err as ReporteDiarioError
        if (status === 404) {
            toast.info('Sin artículos para reportar', message)
        } else {
            toast.error('No se pudo descargar el reporte', message || 'Inténtalo de nuevo.')
        }
    } finally {
        downloadingReport.value = false
    }
}

</script>
