<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Catálogos</h1>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Administrar listas generales y categorías jerárquicas del sistema
                </p>
            </div>
            <router-link
                class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                to="/articulo-maestro">
                ← Volver al Dashboard
            </router-link>
        </div>

        <!-- Tabs -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
            <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    @click="activeTab = tab.id"
                    :class="[
                        'px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none',
                        activeTab === tab.id
                            ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50'
                    ]"
                >
                    {{ tab.label }}
                </button>
            </div>

            <div class="p-6">
                <!-- Tab: Generales -->
                <div v-show="activeTab === 'generales'">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Lista de Catálogos -->
                        <div class="col-span-1 border-r border-gray-200 dark:border-gray-700 pr-4">
                            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-4">Listas Disponibles</h3>
                            <ul class="space-y-1">
                                <li v-for="cat in catalogosGeneralesList" :key="cat.codigo">
                                    <button 
                                        @click="selectCatalogoGeneral(cat)"
                                        :class="[
                                            'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                                            selectedCatalogoGeneral?.codigo === cat.codigo
                                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        ]"
                                    >
                                        {{ cat.nombre }}
                                    </button>
                                </li>
                            </ul>
                        </div>
                        
                        <!-- Valores del Catálogo Seleccionado -->
                        <div class="col-span-2 pl-2">
                            <div v-if="selectedCatalogoGeneral">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ selectedCatalogoGeneral.nombre }}</h3>
                                    <button @click="openModalGeneral()" class="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                        Nuevo Valor
                                    </button>
                                </div>
                                <div v-if="loadingG" class="text-sm text-gray-500">Cargando valores...</div>
                                <div v-else class="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-lg">
                                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead class="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                                <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                            <tr v-for="item in valoresCatalogoGeneral" :key="item.id">
                                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ item.id }}</td>
                                                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{{ item.codigo }}</td>
                                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ item.nombre }}</td>
                                                <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <button @click="openModalGeneral(item)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Editar</button>
                                                    <button @click="handleDeleteGeneral(item)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Eliminar</button>
                                                </td>
                                            </tr>
                                            <tr v-if="valoresCatalogoGeneral.length === 0">
                                                <td colspan="5" class="px-4 py-4 text-center text-sm text-gray-500">No hay valores registrados.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div v-else class="flex h-full items-center justify-center text-gray-400 text-sm">
                                Selecciona una lista de la izquierda para ver sus valores
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Jerarquías -->
                <div v-show="activeTab === 'jerarquias'">
                    <div class="mb-4 flex justify-between items-center">
                        <div>
                            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Jerarquía de Artículos</h2>
                            <p class="text-xs text-gray-500">Agrupado por Sección (Nivel 1) → Categoría (Nivel 2) → Línea (Nivel 3)</p>
                        </div>
                        <button @click="openModalJerarquia()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Nuevo Elemento Jerárquico
                        </button>
                    </div>

                    <div v-if="loadingJ1" class="text-center py-8 text-gray-500">Cargando jerarquías...</div>
                    <div v-else class="space-y-4">
                        <!-- Acordeón Secciones -->
                        <div v-for="seccion in secciones" :key="seccion.nombre" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-hidden">
                            <div @click="toggleSeccion(seccion)" class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 cursor-pointer flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <h3 class="text-md font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <svg :class="['w-4 h-4 transition-transform duration-200', expandedSecciones.includes(seccion.nombre) ? 'rotate-90' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                    {{ seccion.nombre }}
                                </h3>
                                <span class="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">Sección</span>
                            </div>

                            <div v-if="expandedSecciones.includes(seccion.nombre)" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div v-if="loadingCategorias[seccion.nombre]" class="text-sm text-gray-500 py-2">Cargando categorías...</div>
                                <div v-else class="space-y-4">
                                    <div v-for="categoria in (categoriasCache[seccion.nombre] || [])" :key="categoria.nombre" class="pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/50">
                                        <div @click="toggleCategoria(seccion.nombre, categoria)" class="py-1 cursor-pointer flex justify-between items-center text-sm font-medium text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                                            <div class="flex items-center gap-1">
                                                <svg :class="['w-3 h-3 transition-transform duration-200', isCategoriaExpanded(seccion.nombre, categoria.nombre) ? 'rotate-90' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                                {{ categoria.nombre }}
                                            </div>
                                            <span class="text-[10px] text-gray-400 uppercase tracking-widest">Categoría</span>
                                        </div>

                                        <div v-if="isCategoriaExpanded(seccion.nombre, categoria.nombre)" class="mt-2 ml-4">
                                            <div v-if="loadingLineas[categoria.nombre]" class="text-xs text-gray-500">Cargando líneas...</div>
                                            <div v-else>
                                                <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-800 mt-2 border border-gray-100 dark:border-gray-800 rounded">
                                                    <thead class="bg-gray-50/50 dark:bg-gray-900/50">
                                                        <tr>
                                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Línea (Nivel 3)</th>
                                                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 w-24">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                                        <tr v-for="linea in (lineasCache[categoria.nombre] || [])" :key="linea.id || linea.nombre" class="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                                                            <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                {{ linea.nombre }}
                                                                <span v-if="linea.id" class="ml-2 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">ID: {{ linea.id }}</span>
                                                            </td>
                                                            <td class="px-4 py-2 text-right text-xs">
                                                                <button @click="openModalJerarquia({ seccion: seccion.nombre, categoria: categoria.nombre, linea })" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-2" title="Editar">Editar</button>
                                                                <button @click="handleDeleteJerarquia(linea, seccion.nombre, categoria.nombre)" class="text-red-600 hover:text-red-900 dark:text-red-400" title="Eliminar">Eliminar</button>
                                                            </td>
                                                        </tr>
                                                        <tr v-if="!(lineasCache[categoria.nombre]?.length)">
                                                            <td colspan="2" class="px-4 py-2 text-xs text-gray-400 text-center">No hay líneas</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="!(categoriasCache[seccion.nombre]?.length)" class="text-sm text-gray-400 text-center py-2">
                                        Esta sección no tiene categorías registradas
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="secciones.length === 0" class="text-center py-8 text-gray-500">
                            No hay elementos registrados.
                        </div>
                    </div>
                </div>

                <!-- Tab: Atributos Únicos -->
                <div v-show="activeTab === 'atributos'">
                    <div class="mb-4 flex justify-between items-center">
                        <div>
                            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Atributos Únicos</h2>
                            <p class="text-xs text-gray-500">Agrupado por Línea → Atributos textiles o de calzado</p>
                        </div>
                        <button @click="openModalAtributo()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Nuevo Atributo Único
                        </button>
                    </div>

                    <div v-if="loadingA1" class="text-center py-8 text-gray-500">Cargando líneas de atributos...</div>
                    <div v-else class="space-y-4">
                        <div v-for="linea in lineasAtributo" :key="linea.nombre" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-hidden">
                            <div @click="toggleLineaAtributo(linea)" class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 cursor-pointer flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <h3 class="text-md font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <svg :class="['w-4 h-4 transition-transform duration-200', expandedLineasAtr.includes(linea.nombre) ? 'rotate-90' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                    Línea: {{ linea.nombre }}
                                </h3>
                            </div>

                            <div v-if="expandedLineasAtr.includes(linea.nombre)" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                                <div v-if="loadingAtributos[linea.nombre]" class="text-sm text-gray-500">Cargando atributos...</div>
                                <div v-else>
                                    <table class="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                                        <thead>
                                            <tr>
                                                <th class="py-2 text-left text-xs font-medium text-gray-500 uppercase">Atributo</th>
                                                <th class="py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                                            <tr v-for="attr in (atributosCache[linea.nombre] || [])" :key="attr.id || attr.nombre">
                                                <td class="py-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    {{ attr.nombre }} 
                                                    <span v-if="attr.id" class="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded ml-2">ID: {{ attr.id }}</span>
                                                </td>
                                                <td class="py-2 text-right">
                                                    <button @click="openModalAtributo(attr, linea.nombre)" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-2 text-xs" title="Editar">Editar</button>
                                                    <button @click="handleDeleteAtributo(attr, linea.nombre)" class="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                                                </td>
                                            </tr>
                                            <tr v-if="!(atributosCache[linea.nombre]?.length)">
                                                <td colspan="2" class="py-2 text-xs text-gray-400 text-center">No hay atributos en esta línea</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- ======================= -->
        <!-- MODALES DE FORMULARIO   -->
        <!-- ======================= -->

        <!-- Modal Lista General -->
        <TransitionRoot :show="isModalGeneralOpen" as="template">
            <Dialog as="div" class="relative z-50" @close="isModalGeneralOpen = false">
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {{ generalForm.id ? `Editar Valor (ID: ${generalForm.id})` : 'Nuevo Valor' }}
                                <span class="text-sm font-normal text-gray-500 block">Lista: {{ selectedCatalogoGeneral?.nombre }}</span>
                            </h3>
                            <form @submit.prevent="submitGeneralForm" class="space-y-4">
                                <div>
                                    <label for="generalFormCodigo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                                    <input id="generalFormCodigo" v-model="generalForm.codigo" required type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label for="generalFormNombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                    <input id="generalFormNombre" v-model="generalForm.nombre" required type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div class="flex items-center gap-2 mt-4">
                                    <input v-model="generalForm.activo" id="checkActivo" type="checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                    <label for="checkActivo" class="text-sm text-gray-700 dark:text-gray-300">Activo</label>
                                </div>
                                <div class="flex justify-end gap-3 mt-6">
                                    <button type="button" @click="isModalGeneralOpen = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                                    <button type="submit" :disabled="isSubmitting" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Guardar</button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Modal Jerarquías -->
        <TransitionRoot :show="isModalJerarquiaOpen" as="template">
            <Dialog as="div" class="relative z-50" @close="isModalJerarquiaOpen = false">
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {{ jerarquiaEditId ? `Editar Línea (ID: ${jerarquiaEditId})` : 'Nuevo Elemento Jerárquico' }}
                            </h3>
                            <form @submit.prevent="submitJerarquiaForm" class="space-y-4">
                                <!-- SECCION -->
                                <div>
                                    <label for="jerarquiaSeccion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sección (Nivel 1)</label>
                                    <select id="jerarquiaSeccion" v-if="!jerarquiaIsNuevaSeccion" v-model="jerarquiaForm.seccion" @change="onFormSeccionChange" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
                                        <option value="">-- Seleccionar Sección --</option>
                                        <option v-for="s in formSeccionesDisponibles" :key="s.nombre" :value="s.nombre">{{ s.nombre }}</option>
                                        <option value="__nuevo__" class="font-bold text-indigo-600">+ Crear nueva sección</option>
                                    </select>
                                    <div v-if="jerarquiaIsNuevaSeccion" class="flex gap-2">
                                        <input v-model="jerarquiaForm.seccion" aria-label="Nueva sección" type="text" placeholder="Nombre de nueva sección" required class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                        <button type="button" @click="cancelNuevaSeccion" class="px-2 text-xs text-red-500 hover:text-red-700">Cancelar</button>
                                    </div>
                                </div>

                                <!-- CATEGORIA -->
                                <div>
                                    <label for="jerarquiaCategoria" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría (Nivel 2)</label>
                                    <select id="jerarquiaCategoria" v-if="!jerarquiaIsNuevaCategoria" v-model="jerarquiaForm.categoria" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" :disabled="!jerarquiaForm.seccion && !jerarquiaIsNuevaSeccion">
                                        <option value="">-- Seleccionar Categoría --</option>
                                        <option v-for="c in formCategoriasDisponibles" :key="c.nombre" :value="c.nombre">{{ c.nombre }}</option>
                                        <option v-if="jerarquiaForm.seccion" value="__nuevo__" class="font-bold text-indigo-600">+ Crear nueva categoría</option>
                                    </select>
                                    <div v-if="jerarquiaIsNuevaCategoria" class="flex gap-2">
                                        <input v-model="jerarquiaForm.categoria" aria-label="Nueva categoría" type="text" placeholder="Nombre de nueva categoría" required class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                        <button type="button" @click="cancelNuevaCategoria" class="px-2 text-xs text-red-500 hover:text-red-700">Cancelar</button>
                                    </div>
                                </div>

                                <!-- LINEA -->
                                <div>
                                    <label for="jerarquiaLinea" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Línea (Nivel 3)</label>
                                    <input id="jerarquiaLinea" v-model="jerarquiaForm.linea" required type="text" placeholder="Ej: PANTALON M&M" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                </div>

                                <div class="flex justify-end gap-3 mt-6">
                                    <button type="button" @click="isModalJerarquiaOpen = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                                    <button type="submit" :disabled="isSubmitting" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Guardar</button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

        <!-- Modal Atributos -->
        <TransitionRoot :show="isModalAtributoOpen" as="template">
            <Dialog as="div" class="relative z-50" @close="isModalAtributoOpen = false">
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4">
                        <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {{ atributoEditId ? `Editar Atributo (ID: ${atributoEditId})` : 'Nuevo Atributo Único' }}
                            </h3>
                            <form @submit.prevent="submitAtributoForm" class="space-y-4">
                                <div>
                                    <label for="atributoLinea" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Línea de Atributo</label>
                                    <select id="atributoLinea" v-if="!atributoIsNuevaLinea" v-model="atributoForm.linea" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white">
                                        <option value="">-- Seleccionar Línea --</option>
                                        <option v-for="l in lineasAtributo" :key="l.nombre" :value="l.nombre">{{ l.nombre }}</option>
                                        <option value="__nuevo__" class="font-bold text-indigo-600">+ Crear nueva línea</option>
                                    </select>
                                    <div v-if="atributoIsNuevaLinea" class="flex gap-2">
                                        <input v-model="atributoForm.linea" aria-label="Nueva línea de atributo" type="text" placeholder="Nombre de nueva línea" required class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                        <button type="button" @click="atributoIsNuevaLinea = false; atributoForm.linea = ''" class="px-2 text-xs text-red-500 hover:text-red-700">Cancelar</button>
                                    </div>
                                </div>
                                <div>
                                    <label for="atributoNombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Atributo</label>
                                    <input id="atributoNombre" v-model="atributoForm.atributo" required type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div class="flex justify-end gap-3 mt-6">
                                    <button type="button" @click="isModalAtributoOpen = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                                    <button type="submit" :disabled="isSubmitting" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Guardar</button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch } from 'vue'
import { Dialog, DialogPanel, TransitionRoot } from '@headlessui/vue'
import { catalogoService } from '../services/articuloService'
import type { CatalogoItem, JerarquiaItem } from '../services/articuloService'

const tabs = [
    { id: 'generales', label: 'Listas Generales' },
    { id: 'jerarquias', label: 'Jerarquías (Sec -> Cat -> Línea)' },
    { id: 'atributos', label: 'Atributos Únicos (Línea -> Atributo)' }
]
const activeTab = ref('generales')
const isSubmitting = ref(false)

// ==========================================
// ESTADO: GENERALES
// ==========================================
const catalogosGeneralesList = ref<CatalogoItem[]>([])
const selectedCatalogoGeneral = ref<CatalogoItem | null>(null)
const valoresCatalogoGeneral = ref<CatalogoItem[]>([])
const loadingG = ref(false)

const isModalGeneralOpen = ref(false)
const generalForm = ref<{id?: number, codigo: string, nombre: string, activo: boolean}>({
    codigo: '', nombre: '', activo: true
})

// ==========================================
// ESTADO: JERARQUIAS (ACORDEON & CACHE)
// ==========================================
const secciones = ref<JerarquiaItem[]>([])
const loadingJ1 = ref(false)

const expandedSecciones = ref<string[]>([])
const loadingCategorias = reactive<Record<string, boolean>>({})
const categoriasCache = reactive<Record<string, JerarquiaItem[]>>({})

const expandedCategorias = ref<string[]>([]) // formato "seccion|categoria"
const loadingLineas = reactive<Record<string, boolean>>({}) // key: categoria nombre
const lineasCache = reactive<Record<string, JerarquiaItem[]>>({}) // key: categoria nombre

// Estado del Modal de Jerarquias
const isModalJerarquiaOpen = ref(false)
const jerarquiaEditId = ref<number | null>(null)
const jerarquiaForm = ref({ seccion: '', categoria: '', linea: '' })
const jerarquiaIsNuevaSeccion = ref(false)
const jerarquiaIsNuevaCategoria = ref(false)
const formSeccionesDisponibles = ref<JerarquiaItem[]>([])
const formCategoriasDisponibles = ref<JerarquiaItem[]>([])

// ==========================================
// ESTADO: ATRIBUTOS UNICOS
// ==========================================
const lineasAtributo = ref<JerarquiaItem[]>([])
const loadingA1 = ref(false)
const expandedLineasAtr = ref<string[]>([])
const loadingAtributos = reactive<Record<string, boolean>>({})
const atributosCache = reactive<Record<string, JerarquiaItem[]>>({})

const isModalAtributoOpen = ref(false)
const atributoEditId = ref<number | null>(null)
const atributoForm = ref({ linea: '', atributo: '' })
const atributoIsNuevaLinea = ref(false)

watch(() => atributoForm.value.linea, (val) => {
    if (val === '__nuevo__') {
        atributoIsNuevaLinea.value = true
        atributoForm.value.linea = ''
    }
})

onMounted(async () => {
    catalogosGeneralesList.value = await catalogoService.getGenerales()
    
    loadingJ1.value = true
    secciones.value = await catalogoService.getSecciones()
    formSeccionesDisponibles.value = [...secciones.value]
    loadingJ1.value = false
    
    loadingA1.value = true
    lineasAtributo.value = await catalogoService.getLineasAtributo()
    loadingA1.value = false
})

// === LOGICA GENERALES ===
async function selectCatalogoGeneral(cat: CatalogoItem) {
    selectedCatalogoGeneral.value = cat
    loadingG.value = true
    try {
        valoresCatalogoGeneral.value = await catalogoService.getGenerales(cat.nombre)
    } finally {
        loadingG.value = false
    }
}

function openModalGeneral(item?: CatalogoItem) {
    if (item) {
        generalForm.value = {
            ...item,
            activo: item.activo ?? true
        }
    } else {
        generalForm.value = { codigo: '', nombre: '', activo: true }
    }
    isModalGeneralOpen.value = true
}

async function submitGeneralForm() {
    if (!selectedCatalogoGeneral.value) return
    isSubmitting.value = true
    try {
        if (generalForm.value.id) {
            await catalogoService.updateCatalogoGeneral(generalForm.value.id, generalForm.value)
        } else {
            await catalogoService.createCatalogoGeneral(selectedCatalogoGeneral.value.nombre, generalForm.value)
        }
        isModalGeneralOpen.value = false
        // refresh
        await selectCatalogoGeneral(selectedCatalogoGeneral.value)
    } catch (e) {
        console.error(e)
        alert("Error al guardar")
    } finally {
        isSubmitting.value = false
    }
}

async function handleDeleteGeneral(item: CatalogoItem) {
    if(!confirm(`¿Eliminar ${item.nombre}?`)) return
    try {
        await catalogoService.deleteCatalogoGeneral(item.id)
        if(selectedCatalogoGeneral.value) {
            await selectCatalogoGeneral(selectedCatalogoGeneral.value)
        }
    } catch (e) {
        console.error(e)
        alert("Error al eliminar")
    }
}


// === LOGICA JERARQUIAS ===
async function toggleSeccion(seccion: JerarquiaItem) {
    const idx = expandedSecciones.value.indexOf(seccion.nombre)
    if (idx >= 0) {
        expandedSecciones.value.splice(idx, 1) // collapse
    } else {
        expandedSecciones.value.push(seccion.nombre) // expand
        if (!categoriasCache[seccion.nombre]) {
            loadingCategorias[seccion.nombre] = true
            try {
                categoriasCache[seccion.nombre] = await catalogoService.getCategorias(seccion.nombre)
            } finally {
                loadingCategorias[seccion.nombre] = false
            }
        }
    }
}

function isCategoriaExpanded(seccionNombre: string, categoriaNombre: string) {
    return expandedCategorias.value.includes(`${seccionNombre}|${categoriaNombre}`)
}

async function toggleCategoria(seccionNombre: string, categoria: JerarquiaItem) {
    const key = `${seccionNombre}|${categoria.nombre}`
    const idx = expandedCategorias.value.indexOf(key)
    if (idx >= 0) {
        expandedCategorias.value.splice(idx, 1)
    } else {
        expandedCategorias.value.push(key)
        if (!lineasCache[categoria.nombre]) {
            loadingLineas[categoria.nombre] = true
            try {
                lineasCache[categoria.nombre] = await catalogoService.getLineas(categoria.nombre)
            } finally {
                loadingLineas[categoria.nombre] = false
            }
        }
    }
}

async function onFormSeccionChange() {
    if (jerarquiaForm.value.seccion === '__nuevo__') {
        jerarquiaIsNuevaSeccion.value = true
        jerarquiaForm.value.seccion = ''
        jerarquiaForm.value.categoria = ''
        formCategoriasDisponibles.value = []
        return
    }
    // Fetch categories for this section for the form
    jerarquiaForm.value.categoria = ''
    if (jerarquiaForm.value.seccion) {
        formCategoriasDisponibles.value = await catalogoService.getCategorias(jerarquiaForm.value.seccion)
    } else {
        formCategoriasDisponibles.value = []
    }
}

watch(() => jerarquiaForm.value.categoria, (val) => {
    if (val === '__nuevo__') {
        jerarquiaIsNuevaCategoria.value = true
        jerarquiaForm.value.categoria = ''
    }
})

function cancelNuevaSeccion() {
    jerarquiaIsNuevaSeccion.value = false
    jerarquiaForm.value.seccion = ''
    formCategoriasDisponibles.value = []
}

function cancelNuevaCategoria() {
    jerarquiaIsNuevaCategoria.value = false
    jerarquiaForm.value.categoria = ''
}

function openModalJerarquia(itemToEdit?: { seccion: string, categoria: string, linea: JerarquiaItem }) {
    formSeccionesDisponibles.value = [...secciones.value]
    if (itemToEdit) {
        jerarquiaEditId.value = itemToEdit.linea.id ?? null
        jerarquiaForm.value = {
            seccion: itemToEdit.seccion,
            categoria: itemToEdit.categoria,
            linea: itemToEdit.linea.nombre
        }
        jerarquiaIsNuevaSeccion.value = false
        jerarquiaIsNuevaCategoria.value = false
        // Trigger fetch form cats
        onFormSeccionChange()
    } else {
        jerarquiaEditId.value = null
        jerarquiaForm.value = { seccion: '', categoria: '', linea: '' }
        jerarquiaIsNuevaSeccion.value = false
        jerarquiaIsNuevaCategoria.value = false
        formCategoriasDisponibles.value = []
    }
    isModalJerarquiaOpen.value = true
}

async function submitJerarquiaForm() {
    isSubmitting.value = true
    try {
        const payload = {
            seccion: jerarquiaForm.value.seccion,
            categoria: jerarquiaForm.value.categoria,
            linea: jerarquiaForm.value.linea
        }
        if (jerarquiaEditId.value) {
            await catalogoService.updateJerarquia(jerarquiaEditId.value, payload)
        } else {
            await catalogoService.createJerarquia(payload)
            // Invalidar caches si se agregó una nueva para que re-descargue al expandir
            delete categoriasCache[payload.seccion]
            delete lineasCache[payload.categoria]
            secciones.value = await catalogoService.getSecciones()
        }
        isModalJerarquiaOpen.value = false
        
        // Refrescar vistas si están expandidas
        if (expandedCategorias.value.includes(`${payload.seccion}|${payload.categoria}`)) {
            lineasCache[payload.categoria] = await catalogoService.getLineas(payload.categoria)
        }
    } catch (e) {
        console.error(e)
        alert("Error al guardar jerarquía.")
    } finally {
        isSubmitting.value = false
    }
}

async function handleDeleteJerarquia(linea: JerarquiaItem, seccion: string, categoria: string) {
    if(!linea.id) return
    if(!confirm(`¿Eliminar la línea "${linea.nombre}"?`)) return
    try {
        await catalogoService.deleteJerarquia(linea.id)
        
        // Refresh local cache
        if (expandedCategorias.value.includes(`${seccion}|${categoria}`)) {
            const lineas = await catalogoService.getLineas(categoria)
            lineasCache[categoria] = lineas
            
            // Si no quedan líneas, es mejor refrescar las categorías para ver si la categoría padre sigue existiendo o si se debe limpiar
            if (lineas.length === 0) {
                const cats = await catalogoService.getCategorias(seccion)
                categoriasCache[seccion] = cats
                
                // Si la categoría ha desaparecido (borrado en cascada), también refrescamos secciones
                if (!cats.some(c => c.nombre === categoria)) {
                    secciones.value = await catalogoService.getSecciones()
                }
            }
        }
    } catch (e) {
        console.error(e)
        alert("Error al eliminar jerarquía.")
    }
}

// === LOGICA ATRIBUTOS ===
async function toggleLineaAtributo(linea: JerarquiaItem) {
    const idx = expandedLineasAtr.value.indexOf(linea.nombre)
    if (idx >= 0) {
        expandedLineasAtr.value.splice(idx, 1)
    } else {
        expandedLineasAtr.value.push(linea.nombre)
        if (!atributosCache[linea.nombre]) {
            loadingAtributos[linea.nombre] = true
            try {
                atributosCache[linea.nombre] = await catalogoService.getAtributos(linea.nombre)
            } finally {
                loadingAtributos[linea.nombre] = false
            }
        }
    }
}

function openModalAtributo(itemToEdit?: JerarquiaItem, lineaNombre?: string) {
    if (itemToEdit && lineaNombre) {
        atributoForm.value = { linea: lineaNombre, atributo: itemToEdit.nombre }
        atributoEditId.value = itemToEdit.id ?? null
        atributoIsNuevaLinea.value = false
    } else {
        atributoForm.value = { linea: '', atributo: '' }
        atributoIsNuevaLinea.value = false
        atributoEditId.value = null
    }
    isModalAtributoOpen.value = true
}

async function submitAtributoForm() {
    isSubmitting.value = true
    try {
        const payload = {
            linea: atributoForm.value.linea,
            atributo: atributoForm.value.atributo
        }
        if (atributoEditId.value) {
            await catalogoService.updateAtributo(atributoEditId.value, payload)
        } else {
            await catalogoService.createAtributo(payload)
            lineasAtributo.value = await catalogoService.getLineasAtributo()
        }
        isModalAtributoOpen.value = false
        
        // Refresh data
        if (expandedLineasAtr.value.includes(payload.linea)) {
            atributosCache[payload.linea] = await catalogoService.getAtributos(payload.linea)
        }
    } catch (e) {
        console.error(e)
        alert("Error al guardar atributo.")
    } finally {
        isSubmitting.value = false
    }
}

async function handleDeleteAtributo(attr: JerarquiaItem, linea: string) {
    if(!attr.id) return
    if(!confirm(`¿Eliminar atributo "${attr.nombre}"?`)) return
    try {
        await catalogoService.deleteAtributo(attr.id)
        if (expandedLineasAtr.value.includes(linea)) {
            const attrs = await catalogoService.getAtributos(linea)
            atributosCache[linea] = attrs
            
            // Si se borraron todos los atributos de esa línea, refrescamos la lista de líneas de atributos
            if (attrs.length === 0) {
                lineasAtributo.value = await catalogoService.getLineasAtributo()
            }
        }
    } catch(e) {
        console.error(e)
        alert("Error al eliminar atributo.")
    }
}
</script>
