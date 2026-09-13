<template>
    <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Monitoreo de Sincronización SAP</h1>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Auditoría en tiempo real y resolución de excepciones
                </p>
            </div>
            <div class="flex items-center gap-3">
                <router-link
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    to="/articulo-maestro/lista">
                    Gestión de Artículos
                </router-link>
                <router-link
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    to="/articulo-maestro">
                    Menú Principal
                </router-link>
            </div>
        </div>

        <!-- Aviso: la sincronización ya no requiere acción manual -->
        <div class="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
            <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <p class="text-sm text-emerald-800 dark:text-emerald-300">
                <strong>La sincronización con SAP ahora es automática.</strong>
                Al crear o editar un artículo (individual o por Excel), el sistema lo encola y lo envía en segundo plano de inmediato.
                Usa este panel solo para ver el progreso en vivo y para reintentar los artículos que SAP haya rechazado.
            </p>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            <!-- Panel Izquierdo: Acciones Generales -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Card: Importar desde SAP -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                            Traer desde SAP
                        </h2>
                    </div>
                    <div class="px-6 py-5 space-y-4">
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Ingresa los ItemCode separados por comas o saltos de línea para importarlos o actualizarlos desde SAP.
                        </p>
                        <textarea
                            v-model="pullCodes"
                            rows="4"
                            aria-label="Códigos de artículos a importar"
                            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="ART-01, ART-02..."
                        ></textarea>
                        <button
                            @click="handlePullFromSap"
                            :disabled="!pullCodes.trim() || processingPull"
                            class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <svg v-if="processingPull" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            {{ processingPull ? 'Importando...' : 'Traer del SAP' }}
                        </button>
                        <div v-if="pullError" class="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2">
                            <span class="text-xs text-red-700 dark:text-red-400">{{ pullError }}</span>
                            <button @click="pullError = ''" class="text-red-500 hover:text-red-700 ml-2 text-xs font-medium">✕</button>
                        </div>
                    </div>
                </div>
                <!-- Card: Filtrar por Código -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Filtrar por Código</h2>
                    </div>
                    <div class="px-6 py-5 space-y-4">
                        <input
                            v-model="searchCode"
                            type="text"
                            aria-label="Buscar por ItemCode"
                            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Buscar ItemCode..."
                        />
                    </div>
                </div>

                <!-- Card: Leyenda de Estados -->
                <div class="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 border border-blue-100 dark:border-blue-800/50">
                    <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">Información de Sincronización</h3>
                    <ul class="space-y-2 text-xs text-blue-800 dark:text-blue-400">
                        <li class="flex gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1 shrink-0"></span>
                            <span><strong>BORRADOR:</strong> No debería verse aquí más que un instante; se encola solo al guardar.</span>
                        </li>
                        <li class="flex gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                            <span><strong>EN_COLA:</strong> El worker lo está enviando a SAP en este momento. Bloqueado para edición.</span>
                        </li>
                        <li class="flex gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0"></span>
                            <span><strong>PENDIENTE:</strong> Se guardó localmente pero todavía no se ha encolado (caso raro).</span>
                        </li>
                        <li class="flex gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></span>
                            <span><strong>ERROR:</strong> SAP rechazó el último intento. Corrige el dato y usa "Reintentar Fallidos".</span>
                        </li>
                        <li class="flex gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                            <span><strong>SINCRONIZADO:</strong> Confirmado en SAP. No aparece en esta tabla.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Panel Derecho: Tabla de Artículos Pendientes -->
            <div class="lg:col-span-2 space-y-6">
                
                <!-- Monitor de Tareas en Segundo Plano -->
                <div v-if="lotesImportacion.length > 0 || tareasSueltas.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
                        <h3 class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <span class="relative flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Sincronización en curso y actividad reciente
                        </h3>
                        <span v-if="isPolling" class="text-[10px] font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                            Actualizando en vivo...
                        </span>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-gray-800">
                        <!-- Tarjeta maestra por lote de importación (Excel): consolida TODOS
                             los grupos/artículos del archivo en una sola barra de progreso, en
                             vez de una tarjeta por grupo -- ver `lotesImportacion`. -->
                        <div v-for="lote in lotesImportacion" :key="`lote-${lote.id}`" class="p-4 flex flex-col gap-3 bg-indigo-50/30 dark:bg-indigo-900/5">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-gray-900 dark:text-white">
                                            Lote #{{ lote.id }}: {{ lote.nombreArchivo }} ({{ lote.totalFilas }} artículo{{ lote.totalFilas === 1 ? '' : 's' }})
                                        </p>
                                        <p class="text-[10px] text-gray-500">Iniciado por {{ lote.usuario }} · Tiempo transcurrido: {{ tiempoTranscurrido(lote) }}</p>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" :class="loteBadgeClass(lote.estado)">
                                        {{ lote.estado }}
                                    </span>
                                    <p class="text-[10px] text-gray-400 mt-1 uppercase font-medium">
                                        {{ progresoLote(lote).completados }} de {{ lote.totalFilas }} completados ({{ progresoLote(lote).porcentaje }}%)
                                    </p>
                                </div>
                            </div>
                            <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                    class="h-full transition-all duration-500 ease-out"
                                    :class="progresoLote(lote).barraClass"
                                    :style="{ width: `${progresoLote(lote).porcentaje}%` }"
                                ></div>
                            </div>
                            <p class="text-[10px] text-gray-500 dark:text-gray-400">
                                <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ lote.filasCorrectas }} éxitos</span>
                                <span class="mx-1">·</span>
                                <span class="text-red-600 dark:text-red-400 font-semibold">{{ lote.filasError }} errores</span>
                                <span class="mx-1">·</span>
                                <span>{{ progresoLote(lote).enCola }} en cola</span>
                            </p>
                        </div>

                        <div v-for="task in tareasSueltas" :key="task.id" class="p-4 flex flex-col gap-3">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                    </div>
                                    <div>
                                        <p class="text-sm font-semibold text-gray-900 dark:text-white">Tarea #{{ task.id }}: {{ task.nombre_tarea }}</p>
                                        <p class="text-[10px] text-gray-500">Iniciada por {{ task.usuario }}</p>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end">
                                    <span
                                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                        :class="{
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30': task.estado === 'PROCESANDO',
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30': task.estado === 'FINALIZADO',
                                            'bg-red-100 text-red-700 dark:bg-red-900/30': task.estado === 'ERROR'
                                        }"
                                    >
                                        {{ task.estado }}
                                    </span>
                                    <p class="text-[10px] text-gray-400 mt-1 uppercase font-medium">{{ task.items_procesados }} de {{ task.total_items }} completados</p>
                                </div>
                            </div>
                            <!-- Barra de Progreso -->
                            <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                    class="h-full transition-all duration-500 ease-out"
                                    :class="task.estado === 'ERROR' ? 'bg-red-500' : 'bg-blue-500'"
                                    :style="{ width: `${task.progreso_porcentaje}%` }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px]">
                    <!-- Toolbar Tabla -->
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Excepciones y Artículos en Cola</h2>
                            <span v-if="selectedCount > 0" class="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-medium">
                                {{ selectedCount }} seleccionados
                            </span>
                        </div>

                        <!-- Filtros rápidos por prioridad operativa -->
                        <div class="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-900/50 p-1">
                            <button
                                type="button"
                                @click="filtroEstado = 'todos'"
                                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                                :class="filtroEstado === 'todos' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                            >
                                Todos ({{ pendingArticulos.length }})
                            </button>
                            <button
                                type="button"
                                @click="filtroEstado = 'en_cola'"
                                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                                :class="filtroEstado === 'en_cola' ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                            >
                                ⏳ En Cola ({{ countEnCola }})
                            </button>
                            <button
                                type="button"
                                @click="filtroEstado = 'error'"
                                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                                :class="filtroEstado === 'error' ? 'bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                            >
                                ❌ Errores ({{ countError }})
                            </button>
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                @click="fetchPending"
                                class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Refrescar lista"
                                :disabled="loadingPending"
                            >
                                <svg class="w-5 h-5" :class="loadingPending ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            </button>

                            <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                            <button
                                @click="requestBulkAction('create')"
                                :disabled="selectedCount === 0 || processingAction"
                                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                                title="Vuelve a encolar los artículos seleccionados (útil para los que quedaron en ERROR)"
                            >
                                Reintentar Fallidos
                            </button>
                        </div>
                        <div v-if="actionError" class="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 mt-2">
                            <span class="text-xs text-red-700 dark:text-red-400">{{ actionError }}</span>
                            <button @click="actionError = ''" class="text-red-500 hover:text-red-700 ml-2 text-xs font-medium">✕</button>
                        </div>
                    </div>

                    <!-- Tabla -->
                    <div class="flex-1 overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th class="px-6 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            :checked="allSelected"
                                            aria-label="Seleccionar todos"
                                            @change="toggleSelectAll"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th class="px-6 py-3">ItemCode</th>
                                    <th class="px-6 py-3">Producto</th>
                                    <th class="px-6 py-3">Estado</th>
                                    <th class="px-6 py-3">Diagnóstico / Respuesta SAP</th>
                                    <th class="px-6 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                <template v-if="loadingPending">
                                    <tr v-for="i in 5" :key="i" class="animate-pulse">
                                        <td class="px-6 py-4"><div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td class="px-6 py-4"><div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td class="px-6 py-4"><div class="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td class="px-6 py-4"><div class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                                        <td class="px-6 py-4"><div class="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td class="px-6 py-4"><div class="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
                                    </tr>
                                </template>

                                <tr v-else-if="pendingArticulos.length === 0">
                                    <td colspan="6" class="px-6 py-12 text-center">
                                        <div class="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                            <p class="text-base font-medium">Sin excepciones</p>
                                            <p class="text-sm">Todos los artículos están sincronizados o no hay nada en cola.</p>
                                        </div>
                                    </td>
                                </tr>

                                <tr v-else-if="filteredArticulosConDiagnostico.length === 0">
                                    <td colspan="6" class="px-6 py-12 text-center">
                                        <div class="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                            <svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 21H5a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                            <p class="text-base font-medium">Nada que mostrar con este filtro</p>
                                            <p class="text-sm">Prueba con "Todos" o ajusta la búsqueda por código.</p>
                                        </div>
                                    </td>
                                </tr>

                                <tr
                                    v-for="{ articulo: art, diagnostico: diag } in filteredArticulosConDiagnostico"
                                    :key="art.itemCode"
                                    class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    :class="selectedCodes.includes(art.itemCode) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''"
                                >
                                    <td class="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            :value="art.itemCode"
                                            :aria-label="'Seleccionar ' + art.itemCode"
                                            v-model="selectedCodes"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td class="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">
                                        {{ art.itemCode }}
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="truncate max-w-xs text-xs" :title="art.itemName">
                                            {{ art.itemName }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button
                                            type="button"
                                            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-default"
                                            :class="getStatusBadgeClass(art.controlSap?.estado ?? 'BORRADOR')"
                                            @mouseenter="showTooltip($event, art.itemCode)"
                                            @mouseleave="hideTooltip"
                                            @focus="showTooltip($event, art.itemCode)"
                                            @blur="hideTooltip"
                                        >
                                            <span v-if="(art.controlSap?.estado ?? 'BORRADOR') === 'EN_COLA'" class="relative flex h-1.5 w-1.5" aria-hidden="true">
                                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                            </span>
                                            {{ art.controlSap?.estado ?? 'BORRADOR' }}
                                        </button>
                                    </td>
                                    <td class="px-6 py-4 max-w-xs">
                                        <div class="flex items-start gap-1.5">
                                            <span v-if="diag.tipo === 'error' || diag.tipo === 'warning'" class="shrink-0" aria-hidden="true">{{ diagnosticoIcono(diag.tipo) }}</span>
                                            <span class="truncate text-xs" :class="diagnosticoTextClass(diag.tipo)" :title="diag.mensaje">
                                                {{ diag.mensaje }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            @click="abrirDetalle(art)"
                                            class="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
                                        >
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tooltip flotante: diagnóstico rápido al pasar el mouse/foco sobre el badge de Estado -->
        <Teleport to="body">
            <div
                v-if="tooltipArticulo && tooltipDiagnostico"
                class="fixed z-[70] w-72 rounded-lg border shadow-lg px-3 py-2.5 text-xs pointer-events-none"
                :class="diagnosticoBoxClass(tooltipDiagnostico.tipo)"
                :style="{ top: tooltipPos.top + 'px', left: tooltipPos.left + 'px' }"
            >
                <p class="font-semibold">
                    <span v-if="tooltipDiagnostico.tipo === 'error' || tooltipDiagnostico.tipo === 'warning'" aria-hidden="true">{{ diagnosticoIcono(tooltipDiagnostico.tipo) }} </span>{{ tooltipDiagnostico.mensaje }}
                </p>
                <p v-if="tooltipDiagnostico.accion" class="mt-1.5 opacity-90">
                    <strong>Acción:</strong> {{ tooltipDiagnostico.accion }}
                </p>
            </div>
        </Teleport>

        <!-- Modal de Detalle de Sincronización (Nivel 3): causa + pasos de resolución -->
        <Teleport to="body">
            <div v-if="detalleArticulo" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="cerrarDetalle"></div>
                <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl flex flex-col max-h-[90vh]">
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                            Detalle de Sincronización — <span class="font-mono">{{ detalleArticulo.itemCode }}</span>
                        </h2>
                        <button
                            type="button"
                            @click="cerrarDetalle"
                            aria-label="Cerrar"
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div v-if="detalleDiagnostico" class="overflow-y-auto p-6 space-y-6">
                        <!-- Información del producto -->
                        <section>
                            <h3 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <span aria-hidden="true">📦</span> Información del Producto
                            </h3>
                            <dl class="mt-3 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <dt class="text-xs text-gray-500 dark:text-gray-400">Código Interno</dt>
                                    <dd class="font-mono font-semibold text-gray-900 dark:text-white">{{ detalleArticulo.itemCode }}</dd>
                                </div>
                                <div>
                                    <dt class="text-xs text-gray-500 dark:text-gray-400">Marca</dt>
                                    <dd class="text-gray-900 dark:text-white">{{ detalleArticulo.uMarca || '-' }}</dd>
                                </div>
                                <div>
                                    <dt class="text-xs text-gray-500 dark:text-gray-400">Producto</dt>
                                    <dd class="text-gray-900 dark:text-white">{{ detalleArticulo.itemName || '-' }}</dd>
                                </div>
                                <div>
                                    <dt class="text-xs text-gray-500 dark:text-gray-400">PVP</dt>
                                    <dd class="text-gray-900 dark:text-white">$ {{ (detalleArticulo.price ?? 0).toFixed(2) }}</dd>
                                </div>
                            </dl>
                        </section>

                        <!-- Diagnóstico de integración -->
                        <section>
                            <h3 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <span aria-hidden="true">🚦</span> Diagnóstico de Integración
                            </h3>
                            <div class="mt-3 rounded-xl border p-4" :class="diagnosticoBoxClass(detalleDiagnostico.tipo)">
                                <div class="flex items-center justify-between gap-3 flex-wrap">
                                    <span class="text-sm font-bold">
                                        <span aria-hidden="true">{{ diagnosticoIcono(detalleDiagnostico.tipo) }}</span>
                                        ESTADO: {{ estadoLabel(detalleArticulo) }}
                                    </span>
                                    <span v-if="detalleArticulo.controlSap?.fecha_ultimo_intento" class="text-xs opacity-75">
                                        Fecha: {{ formatDate(detalleArticulo.controlSap.fecha_ultimo_intento) }}
                                    </span>
                                </div>

                                <p class="mt-3 text-sm">
                                    <strong>¿Qué ocurrió?</strong><br>
                                    {{ detalleDiagnostico.mensaje }}
                                </p>

                                <p v-if="detalleDiagnostico.accion" class="mt-3 text-sm">
                                    <strong>¿Cómo solucionarlo?</strong><br>
                                    {{ detalleDiagnostico.accion }}
                                </p>
                            </div>

                            <template v-if="detalleDiagnostico.detalleTecnico">
                                <button
                                    type="button"
                                    @click="detalleTecnicoAbierto = !detalleTecnicoAbierto"
                                    class="mt-3 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline decoration-dotted"
                                >
                                    {{ detalleTecnicoAbierto ? 'Ocultar' : 'Ver' }} información técnica de soporte (solo TI)
                                </button>
                                <pre
                                    v-if="detalleTecnicoAbierto"
                                    class="mt-2 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words"
                                >{{ detalleDiagnostico.detalleTecnico }}</pre>
                            </template>
                        </section>
                    </div>

                    <!-- Footer -->
                    <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                        <router-link
                            v-if="detalleArticulo.controlSap?.estado === 'ERROR'"
                            :to="`/articulo-maestro/editar/${detalleArticulo.itemCode}`"
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            ✏️ Editar Artículo
                        </router-link>
                        <button
                            type="button"
                            @click="cerrarDetalle"
                            class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal de Resultados de Sincronización -->
        <Teleport to="body">
            <div v-if="showResultModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeResultModal"></div>
                
                <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl flex flex-col max-h-[90vh]">
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ modalTitle }}</h2>
                            <p class="text-xs text-gray-500 mt-0.5">Resumen de la operación realizada en SAP</p>
                        </div>
                        <button @click="closeResultModal" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors">
                            Entendido
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div v-if="syncResult" class="overflow-y-auto p-6 space-y-6">
                        
                        <!-- CASO 1: Nueva estructura de Tarea / Novedades -->
                        <template v-if="syncResult.message || syncResult.tarea_id">
                            <!-- Message & Task ID -->
                            <div 
                                class="p-4 rounded-xl border flex items-start gap-4"
                                :class="syncResult.success ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'"
                            >
                                <div class="p-2 rounded-lg" :class="syncResult.success ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-amber-100 dark:bg-amber-800'">
                                    <svg v-if="syncResult.success" class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                    <svg v-else class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold" :class="syncResult.success ? 'text-emerald-900 dark:text-emerald-300' : 'text-amber-900 dark:text-amber-300'">
                                        {{ syncResult.success ? 'Operación Iniciada' : 'Atención' }}
                                    </h3>
                                    <p class="text-sm mt-1" :class="syncResult.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'">
                                        {{ syncResult.message }}
                                    </p>
                                    <div v-if="syncResult.tarea_id" class="mt-3 flex items-center gap-2">
                                        <span class="px-2 py-1 bg-white/50 dark:bg-black/20 rounded text-xs font-mono font-bold">
                                            ID Tarea: #{{ syncResult.tarea_id }}
                                        </span>
                                        <router-link to="/articulo-maestro/historial-sap" class="text-xs underline hover:no-underline">
                                            Ver progreso en auditoría
                                        </router-link>
                                    </div>
                                </div>
                            </div>

                            <!-- Novedades Table -->
                            <div v-if="syncResult.novedades && syncResult.novedades.length > 0" class="space-y-3">
                                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    Artículos con observaciones
                                </h4>
                                <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <table class="w-full text-left text-sm">
                                        <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 font-semibold uppercase">
                                            <tr>
                                                <th class="px-4 py-3">ItemCode</th>
                                                <th class="px-4 py-3">Motivo / Observación</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                            <tr v-for="n in syncResult.novedades" :key="n.item_code">
                                                <td class="px-4 py-3 font-mono text-gray-900 dark:text-white">{{ n.item_code }}</td>
                                                <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {{ n.motivo }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </template>

                        <!-- CASO 2: Estructura antigua (Estadísticas) -->
                        <template v-else>
                            <div class="grid grid-cols-3 gap-4">
                                <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                                    <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ (syncResult as any).success }}</p>
                                    <p class="text-xs font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Correctos</p>
                                </div>
                                <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                                    <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ (syncResult as any).error }}</p>
                                    <p class="text-xs font-medium text-red-800 dark:text-red-400 uppercase tracking-wider">Errores</p>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ (syncResult as any).total }}</p>
                                    <p class="text-xs font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider">Total</p>
                                </div>
                            </div>
                            <!-- Detalle por artículo: tarjeta con badge + mensaje de negocio limpio;
                                 la traza técnica cruda (pymssql/SQL Server) queda reservada al
                                 acordeón "Ver detalles técnicos" en vez de mostrarse siempre. -->
                            <div v-if="(syncResult as any).details" class="space-y-2">
                                <div
                                    v-for="(d, idx) in ((syncResult as any).details as SapSyncDetalle[])"
                                    :key="`${d.item_code}-${idx}`"
                                    class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                                >
                                    <div class="flex items-start gap-3 px-4 py-3">
                                        <div
                                            class="mt-0.5 shrink-0 p-1.5 rounded-full"
                                            :class="esDetalleError(d.status) ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'"
                                        >
                                            <svg v-if="esDetalleError(d.status)" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 flex-wrap">
                                                <span class="font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ d.item_code }}</span>
                                                <span
                                                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                                    :class="esDetalleError(d.status) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'"
                                                >
                                                    {{ d.status }}
                                                </span>
                                            </div>
                                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                {{ resumirDetalleSap(d).resumen }}
                                            </p>

                                            <template v-if="resumirDetalleSap(d).detalleTecnico">
                                                <button
                                                    @click="toggleDetalleTecnico(idx)"
                                                    class="mt-2 text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline decoration-dotted"
                                                >
                                                    {{ detallesTecnicosAbiertos.has(idx) ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos' }}
                                                </button>
                                                <pre
                                                    v-if="detallesTecnicosAbiertos.has(idx)"
                                                    class="mt-2 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words"
                                                >{{ resumirDetalleSap(d).detalleTecnico }}</pre>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>

                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal Confirmación Acción Masiva -->
        <Teleport to="body">
            <div v-if="pendingBulkAction" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/50" @click="pendingBulkAction = null"></div>
                <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirmar acción</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">{{ bulkActionMsg }}</p>
                    <div class="flex justify-end gap-3">
                        <button
                            @click="pendingBulkAction = null"
                            class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            @click="confirmBulkAction"
                            :disabled="processingAction"
                            class="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                        >
                            {{ processingAction ? 'Procesando...' : 'Confirmar' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { articuloService, sapService, resumirDetalleSap, diagnosticoDeArticulo } from '../services/articuloService'
import type { Articulo } from '../types'
import type { SapTask, SapSyncResponse, SapSyncDetalle, DiagnosticoTipo, ImportacionTrabajoResumen } from '../services/articuloService'
import {
    ordenarPorPrioridadOperativa,
    filtrarPorPestana,
    contarPorEstado,
    calcularProgresoLote,
    tareasSinLote,
    formatearTiempoTranscurrido,
    loteBadgeClass as loteBadgeClaseUtil,
    hayLoteActivo,
    type FiltroEstadoTabla
} from '../utils/monitoreoSap'

const route = useRoute()

// Estados
const pendingArticulos = ref<Articulo[]>([])
const loadingPending = ref(false)
const selectedCodes = ref<string[]>([])
// Prellenado desde FormularioArticulo: el enlace "Ver monitoreo de SAP" tras
// crear/editar un artículo llega con ?codigo=<ItemCode> para abrir esta
// pantalla ya filtrada al artículo recién guardado.
const searchCode = ref((route.query.codigo as string) || '')
const pullCodes = ref('')
const processingPull = ref(false)
const processingAction = ref(false)

// Estado de Tareas (Task Monitoring)
const recentTasks = ref<SapTask[]>([])
// Lotes de importación (carga masiva por Excel): una SapSyncTarea POR GRUPO
// del archivo (ver encolar_articulos_para_sap en cada _procesar_grupo_* del
// backend) inundaba este panel con una tarjeta por grupo -- si un Excel
// traía 100 artículos en, digamos, 20 grupos, aparecían 20 tarjetas de "1 de
// 1 completados" y ninguna vista consolidada del lote completo. Este nuevo
// estado consulta el trabajo de importación (ImportacionTrabajo) en sí, que
// ya trae el conteo agregado real (totalFilas/filasCorrectas/filasError).
const lotesImportacion = ref<ImportacionTrabajoResumen[]>([])
const isPolling = ref(false)
let pollingTimer: ReturnType<typeof setInterval> | null = null

// Solo tareas individuales de un SKU; las de Excel se muestran arriba,
// consolidadas en `lotesImportacion`, aunque cada subtarea tenga un SKU.
const tareasSueltas = computed(() => tareasSinLote(recentTasks.value))

// Modales
const showResultModal = ref(false)
const syncResult = ref<SapSyncResponse | null>(null)
const modalTitle = ref('')
const pendingBulkAction = ref<'create' | 'update' | 'delete' | null>(null)
const bulkActionMsg = ref('')
const actionError = ref('')
const pullError = ref('')
// Índices (dentro de syncResult.details) cuyo acordeón de "detalles
// técnicos" está expandido — se reinicia en cada nuevo resultado.
const detallesTecnicosAbiertos = ref<Set<number>>(new Set())

// --- Diagnóstico por artículo: tooltip (Nivel 2) y modal de detalle (Nivel 3) ---
// Tooltip flotante: se teletransporta a <body> y se posiciona con `fixed`
// (no `absolute` dentro de la tabla) para no quedar recortado por el
// contenedor con overflow-x-auto de la tabla al pasar el mouse cerca de los
// bordes de la fila.
const tooltipItemCode = ref<string | null>(null)
const tooltipPos = ref({ top: 0, left: 0 })

const tooltipArticulo = computed(() =>
    pendingArticulos.value.find(a => a.itemCode === tooltipItemCode.value) ?? null
)
const tooltipDiagnostico = computed(() =>
    tooltipArticulo.value ? diagnosticoDeArticulo(tooltipArticulo.value) : null
)

function showTooltip(event: MouseEvent | FocusEvent, itemCode: string) {
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const anchoTooltip = 288 // w-72
    tooltipPos.value = {
        top: rect.bottom + 8,
        left: Math.min(rect.left, globalThis.innerWidth - anchoTooltip - 16),
    }
    tooltipItemCode.value = itemCode
}

function hideTooltip() {
    tooltipItemCode.value = null
}

// Modal de Detalle de Sincronización (Nivel 3)
const detalleArticulo = ref<Articulo | null>(null)
const detalleTecnicoAbierto = ref(false)
const detalleDiagnostico = computed(() =>
    detalleArticulo.value ? diagnosticoDeArticulo(detalleArticulo.value) : null
)

function abrirDetalle(articulo: Articulo) {
    detalleTecnicoAbierto.value = false
    detalleArticulo.value = articulo
}

function cerrarDetalle() {
    detalleArticulo.value = null
}

function estadoLabel(articulo: Articulo): string {
    // El estado local (controlSap.estado) sigue siendo ERROR tanto para un
    // rechazo real de SAP como para un timeout de confirmación — la
    // etiqueta del diagnóstico distingue ambos casos para no mostrar
    // "ESTADO: ERROR" dentro de una caja ámbar de "SAP está tardando".
    if (articulo.controlSap?.estado === 'ERROR' && articulo.controlSap?.es_timeout_sap) {
        return 'ESPERANDO CONFIRMACIÓN DE SAP'
    }
    return articulo.controlSap?.estado ?? 'BORRADOR'
}

function diagnosticoIcono(tipo: DiagnosticoTipo): string {
    switch (tipo) {
        case 'success': return '✅'
        case 'error': return '❌'
        case 'warning': return '🟠'
        case 'info': return '🔵'
        default: return '⚪'
    }
}

// Clases de texto/caja compartidas entre la celda de la tabla, el tooltip y
// el modal, para que los 3 niveles de detalle luzcan visualmente coherentes.
function diagnosticoTextClass(tipo: DiagnosticoTipo): string {
    switch (tipo) {
        case 'success': return 'text-emerald-700 dark:text-emerald-400'
        case 'error': return 'text-red-700 dark:text-red-400 font-medium'
        case 'warning': return 'text-amber-700 dark:text-amber-400'
        case 'info': return 'text-blue-700 dark:text-blue-400'
        default: return 'text-gray-500 dark:text-gray-400'
    }
}

function diagnosticoBoxClass(tipo: DiagnosticoTipo): string {
    switch (tipo) {
        case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
        case 'error': return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
        case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'
        case 'info': return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
        default: return 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/40 dark:border-gray-700 dark:text-gray-300'
    }
}

function formatDate(date: string | null | undefined): string {
    if (!date) return '-'
    return new Date(date).toLocaleString()
}

// Computed
const selectedCount = computed(() => selectedCodes.value.length)
const allSelected = computed(() =>
    pendingArticulos.value.length > 0 &&
    selectedCodes.value.length === pendingArticulos.value.length
)

// Prioridad operativa: lo que está pasando AHORA MISMO (EN_COLA) siempre
// arriba; ERROR (lo que requiere acción) se ordena por fecha_ultimo_intento
// DESC dentro de su propio grupo -- el error más reciente arriba, no el más
// antiguo. Antes la tabla no ordenaba nada (orden de llegada de
// getArticulosByEstado), así que un artículo recién encolado en un lote de
// 100 podía terminar en la última página. Ver utils/monitoreoSap.ts.
const sortedArticulos = computed(() => ordenarPorPrioridadOperativa(pendingArticulos.value))

const filtroEstado = ref<FiltroEstadoTabla>('todos')

const countEnCola = computed(() => contarPorEstado(pendingArticulos.value, 'EN_COLA'))
const countError = computed(() => contarPorEstado(pendingArticulos.value, 'ERROR'))

const filteredArticulos = computed(() => {
    const lista = filtrarPorPestana(sortedArticulos.value, filtroEstado.value)
    if (!searchCode.value) return lista
    const q = searchCode.value.trim().toUpperCase()
    return lista.filter(a => {
        const code = (a.itemCode ?? '').toString().toUpperCase()
        const name = (a.itemName ?? '').toString().toUpperCase()
        return code.includes(q) || name.includes(q)
    })
})

// Diagnóstico calculado una sola vez por artículo visible (no en cada
// acceso desde el template) para la columna "Diagnóstico / Respuesta SAP".
const filteredArticulosConDiagnostico = computed(() =>
    filteredArticulos.value.map(articulo => ({
        articulo,
        diagnostico: diagnosticoDeArticulo(articulo),
    }))
)

// Cargar pendientes y tareas al montar (startPolling ya dispara la primera
// consulta de tareas/lotes de inmediato, ver más abajo).
onMounted(() => {
    fetchPending()
    startPolling()
})

onUnmounted(() => {
    stopPolling()
})

async function fetchPending() {
    loadingPending.value = true
    try {
        // Incluye EN_COLA (no solo lo que falló) para poder ver en vivo
        // qué se está enviando ahora mismo (fire & forget).
        const data = await articuloService.getArticulosByEstado(['BORRADOR', 'PENDIENTE', 'EN_COLA', 'ERROR'])
        pendingArticulos.value = data
        selectedCodes.value = [] // Limpiar selección tras refrescar
    } catch {
        // error silencioso — la UI ya muestra estado vacío
    } finally {
        loadingPending.value = false
    }
}

// --- Lógica de Monitoreo de Tareas ---

async function fetchTasks() {
    try {
        const tasks = await sapService.getTasks()

        // Verificar si alguna tarea terminó justo ahora para refrescar la tabla de artículos
        const hadProcessing = recentTasks.value.some(t => t.estado === 'PROCESANDO')
        const allFinished = tasks.length > 0 && tasks.every(t => t.estado !== 'PROCESANDO')

        recentTasks.value = tasks

        if (hadProcessing && allFinished) {
            // Si antes había algo procesando y ahora no, refrescamos la lista de pendientes
            fetchPending()
        }
    } catch {
        // error silencioso — el polling reintentará en el siguiente ciclo
    }
}

async function fetchLotes() {
    try {
        // Los más recientes primero (backend ordena por id DESC): alcanza
        // con una página pequeña, igual que sapService.getTasks() ya trae
        // solo las últimas 3 tareas sueltas.
        const pagina = await articuloService.listarImportaciones({ limit: 5 })

        const teniaLoteActivo = hayLoteActivo(lotesImportacion.value)
        const siguenActivos = hayLoteActivo(pagina.items)

        lotesImportacion.value = pagina.items

        if (teniaLoteActivo && !siguenActivos) {
            fetchPending()
        }
    } catch {
        // error silencioso — el polling reintentará en el siguiente ciclo
    }
}

async function actualizarActividad() {
    await Promise.all([fetchTasks(), fetchLotes()])

    // Las subtareas del Excel siguen sincronizando con SAP después de que
    // termine la importación local; ocultarlas no debe detener el polling.
    const hayTareaActiva = recentTasks.value.some(t =>
        ['ESPERANDO', 'PENDIENTE', 'PROCESANDO'].includes(t.estado)
    )
    if (!hayTareaActiva && !hayLoteActivo(lotesImportacion.value) && isPolling.value) {
        stopPolling()
    }
}

function startPolling() {
    if (pollingTimer) return
    isPolling.value = true
    // Primera ejecución inmediata
    actualizarActividad()
    pollingTimer = setInterval(() => {
        actualizarActividad()
    }, 2000)
}

function stopPolling() {
    if (pollingTimer) {
        clearInterval(pollingTimer)
        pollingTimer = null
    }
    isPolling.value = false
}

function toggleSelectAll() {
    if (allSelected.value) {
        selectedCodes.value = []
    } else {
        selectedCodes.value = pendingArticulos.value.map(art => art.itemCode)
    }
}

function esDetalleError(status: string): boolean {
    return status.toUpperCase() === 'ERROR'
}

function toggleDetalleTecnico(idx: number) {
    const abiertos = new Set(detallesTecnicosAbiertos.value)
    if (abiertos.has(idx)) {
        abiertos.delete(idx)
    } else {
        abiertos.add(idx)
    }
    detallesTecnicosAbiertos.value = abiertos
}

// Progreso agregado de un lote de importación: filasCorrectas/filasError ya
// vienen consolidados desde el backend (ImportacionTrabajoResumen), así que
// "en cola" es simplemente lo que falta por resolver del total.
// Wrappers finos sobre utils/monitoreoSap.ts (lógica pura, cubierta por
// tests/unit/articulo-maestro/monitoreoSap.test.ts) -- se mantienen como
// funciones locales solo para que el template las invoque con el nombre
// corto de siempre.
function progresoLote(lote: ImportacionTrabajoResumen) {
    return calcularProgresoLote(lote)
}

function loteBadgeClass(estado: string) {
    return loteBadgeClaseUtil(estado)
}

function tiempoTranscurrido(lote: ImportacionTrabajoResumen): string {
    return formatearTiempoTranscurrido(lote.fechaInicio, lote.fechaFin)
}

function getStatusBadgeClass(status: string) {
    switch (status) {
        case 'BORRADOR': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-700'
        case 'PENDIENTE': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
        case 'EN_COLA': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
        case 'SINCRONIZADO': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
        case 'ERROR': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
        default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
}

// Acciones Masivas
async function handlePullFromSap() {
    // Limpiar códigos e intentar procesar. Acepta comas, espacios o saltos de línea.
    const codes = pullCodes.value
        .split(/[,\s]+/)
        .map(c => c.trim())
        .filter(c => c.length > 0)
    
    if (codes.length === 0) return

    processingPull.value = true
    pullError.value = ''
    try {
        const result = await sapService.pullFromSap(codes)
        syncResult.value = result
        modalTitle.value = 'Importación desde SAP'
        detallesTecnicosAbiertos.value = new Set()
        showResultModal.value = true
        pullCodes.value = ''
        fetchPending()
    } catch {
        pullError.value = 'Ocurrió un error al intentar importar desde SAP.'
    } finally {
        processingPull.value = false
    }
}

function requestBulkAction(action: 'create' | 'update' | 'delete') {
    if (selectedCodes.value.length === 0) return
    const msgs = {
        create: '¿Deseas volver a encolar estos artículos para SAP (crearlos o reintentar el envío si fallaron)?',
        update: '¿Deseas actualizar estos artículos en SAP con la info local?',
        delete: '¿Deseas intentar ELIMINAR estos artículos de SAP?'
    }
    bulkActionMsg.value = msgs[action] ?? '¿Confirmas esta acción?'
    pendingBulkAction.value = action
}

async function confirmBulkAction() {
    if (!pendingBulkAction.value) return
    const action = pendingBulkAction.value
    pendingBulkAction.value = null
    processingAction.value = true
    actionError.value = ''
    try {
        let result: SapSyncResponse
        if (action === 'create') {
            result = await sapService.syncOrUpdate(selectedCodes.value)
            modalTitle.value = 'Creación / Sincronización en SAP'
        } else if (action === 'update') {
            result = await sapService.updateInSap(selectedCodes.value)
            modalTitle.value = 'Actualización en SAP'
        } else {
            result = await sapService.deleteFromSap(selectedCodes.value)
            modalTitle.value = 'Eliminación en SAP'
        }
        syncResult.value = result
        detallesTecnicosAbiertos.value = new Set()
        showResultModal.value = true
        startPolling()
        fetchPending()
    } catch {
        actionError.value = 'Error al procesar la acción en SAP.'
    } finally {
        processingAction.value = false
    }
}

function closeResultModal() {
    showResultModal.value = false
}
</script>

<style scoped>
/* Transiciones suaves */
.modal-enter-active, .modal-leave-active {
    transition: opacity 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
    opacity: 0;
}
</style>
