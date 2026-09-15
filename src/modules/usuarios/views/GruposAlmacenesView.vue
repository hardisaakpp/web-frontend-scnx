<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <VolverButton to="/admin" title="Volver al Panel de Administración" class="shrink-0" />
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Grupos de almacenes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea grupos y asigna códigos de almacenes</p>
      </div>

      <!-- Formulario (solo para crear) -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-4 text-left"
          @click="showCreateForm = !showCreateForm"
        >
          <span class="text-sm font-semibold text-gray-900 dark:text-white">Nuevo grupo</span>
          <svg
            class="w-4 h-4 text-slate-400 transition-transform shrink-0"
            :class="{ 'rotate-180': showCreateForm }"
            viewBox="0 0 20 20" fill="currentColor"
          >
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </button>
        <div v-if="showCreateForm" class="px-5 pb-5 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre del grupo</label>
            <input
              v-model.trim="groupName"
              type="text"
              placeholder="Ej: Tiendas Norte"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/25"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Descripción</label>
            <input
              v-model.trim="groupDescription"
              type="text"
              placeholder="Opcional"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/25"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">

          <!-- Almacenes dropdown con checkboxes -->
          <div class="relative" ref="almacenDropdownRef">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Almacenes</label>
            <button
              type="button"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-4 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/25 flex items-center justify-between text-left"
              :disabled="almacenesLoading"
              @click="showAlmacenDropdown = !showAlmacenDropdown"
            >
              <span v-if="almacenesLoading" class="text-slate-400">Cargando almacenes...</span>
              <span v-else-if="selectedAlmacenes.length === 0" class="text-slate-400">Seleccionar almacenes...</span>
              <span v-else class="text-slate-900 dark:text-slate-100">{{ selectedAlmacenes.length }} almacén(es) seleccionado(s)</span>
              <svg
                class="w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2"
                :class="{ 'rotate-180': showAlmacenDropdown }"
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>
            </button>
            <div
              v-if="showAlmacenDropdown"
              class="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <div class="p-2 border-b border-slate-100 dark:border-slate-800">
                <input
                  v-model.trim="almacenSearch"
                  autofocus
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div class="max-h-52 overflow-y-auto py-1">
                <div v-if="almacenesError" class="px-3 py-2 text-xs text-red-600 dark:text-red-400">{{ almacenesError }}</div>
                <div v-else-if="filteredAlmacenes.length === 0" class="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
                <button
                  v-else
                  v-for="almacen in filteredAlmacenes"
                  :key="almacen.codAlmacen"
                  type="button"
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  @mousedown.prevent="toggleAlmacen(almacen)"
                >
                  <span
                    class="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                    :class="isAlmacenSelected(almacen.codAlmacen) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500'"
                  >
                    <svg v-if="isAlmacenSelected(almacen.codAlmacen)" class="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span>{{ almacen.nombre }} ({{ almacen.codAlmacen }})</span>
                </button>
              </div>
              <div class="flex items-center justify-between px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span>{{ selectedAlmacenes.length }} seleccionado(s)</span>
                <button
                  type="button"
                  class="text-emerald-600 dark:text-emerald-400 hover:underline"
                  @mousedown.prevent="selectedAlmacenes = []"
                >Limpiar</button>
              </div>
            </div>
            <div v-if="selectedAlmacenes.length" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="almacen in selectedAlmacenes"
                :key="almacen.codAlmacen"
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-2.5 py-0.5 text-xs font-medium"
              >
                {{ almacen.codAlmacen }}
                <button type="button" class="hover:text-emerald-900 dark:hover:text-white leading-none" @click="removeAlmacen(almacen.codAlmacen)">×</button>
              </span>
            </div>
          </div>

          <!-- Bodega central — selección única -->
          <div class="relative" ref="bodegaCentralDropdownRef">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Bodega central</label>
            <button
              type="button"
              class="min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-4 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/25 flex items-center justify-between text-left"
              :disabled="almacenesLoading"
              @click="showBodegaCentralDropdown = !showBodegaCentralDropdown"
            >
              <span v-if="almacenesLoading" class="text-slate-400">Cargando...</span>
              <span v-else-if="!selectedBodegaCentral" class="text-slate-400">Seleccionar bodega central...</span>
              <span v-else class="text-slate-900 dark:text-slate-100">{{ selectedBodegaCentral.nombre }} ({{ selectedBodegaCentral.codAlmacen }})</span>
              <svg
                class="w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2"
                :class="{ 'rotate-180': showBodegaCentralDropdown }"
                viewBox="0 0 20 20" fill="currentColor"
              >
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>
            </button>
            <div
              v-if="showBodegaCentralDropdown"
              class="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <div class="p-2 border-b border-slate-100 dark:border-slate-800">
                <input
                  v-model.trim="bodegaCentralSearch"
                  autofocus
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  class="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div class="max-h-52 overflow-y-auto py-1">
                <div v-if="almacenesError" class="px-3 py-2 text-xs text-red-600 dark:text-red-400">{{ almacenesError }}</div>
                <div v-else-if="filteredBodegaCentral.length === 0" class="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
                <button
                  v-else
                  v-for="almacen in filteredBodegaCentral"
                  :key="almacen.codAlmacen"
                  type="button"
                  class="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  @mousedown.prevent="selectBodegaCentral(almacen)"
                >
                  <span
                    class="flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
                    :class="selectedBodegaCentral?.codAlmacen === almacen.codAlmacen ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500'"
                  >
                    <span v-if="selectedBodegaCentral?.codAlmacen === almacen.codAlmacen" class="w-2 h-2 rounded-full bg-white block" />
                  </span>
                  <span>{{ almacen.nombre }} ({{ almacen.codAlmacen }})</span>
                </button>
              </div>
              <div class="flex items-center justify-end px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  class="text-emerald-600 dark:text-emerald-400 hover:underline"
                  @mousedown.prevent="selectedBodegaCentral = null"
                >Limpiar</button>
              </div>
            </div>
            <div v-if="selectedBodegaCentral" class="mt-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                {{ selectedBodegaCentral.codAlmacen }}
                <button type="button" class="hover:text-emerald-900 dark:hover:text-white leading-none" @click="selectedBodegaCentral = null">×</button>
              </span>
            </div>
          </div>

        </div>
        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
            :disabled="!canAddGroup"
            @click="addGroup"
          >
            Agregar grupo
          </button>
          <span v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</span>
        </div>
        </div>
      </div>

      <!-- Listado -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
          Total: <span class="font-semibold text-gray-900 dark:text-white">{{ grupos.length }}</span>
        </div>
        <div v-if="listLoading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Cargando...</div>
        <div v-else-if="grupos.length === 0" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Sin grupos registrados.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Grupo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Descripción</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Almacenes</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Bodega central</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">F. Creación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">F. Modificación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Modificado por</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="grupo in grupos" :key="grupo.id">

                <!-- GRUPO -->
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  <template v-if="editingGroupId === grupo.id">
                    <input
                      v-model.trim="editGroupName"
                      type="text"
                      class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </template>
                  <template v-else>{{ grupo.grupo }}</template>
                </td>

                <!-- DESCRIPCION -->
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  <template v-if="editingGroupId === grupo.id">
                    <input
                      v-model.trim="editGroupDescription"
                      type="text"
                      placeholder="Opcional"
                      class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </template>
                  <template v-else>{{ grupo.descripcion || '-' }}</template>
                </td>

                <!-- ALMACENES -->
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  <template v-if="editingGroupId === grupo.id">
                    <div class="relative" ref="editAlmacenDropdownRef">
                      <button
                        type="button"
                        class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 flex items-center justify-between gap-1 min-h-[28px]"
                        @click="showEditAlmacenDropdown = !showEditAlmacenDropdown"
                      >
                        <span :class="editGroupAlmacenes.length === 0 ? 'text-slate-400 dark:text-slate-500' : ''">
                          {{ editGroupAlmacenes.length === 0 ? 'Seleccionar...' : `${editGroupAlmacenes.length} sel.` }}
                        </span>
                        <svg class="h-3 w-3 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                      </button>
                      <div
                        v-if="showEditAlmacenDropdown"
                        class="absolute z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div class="p-1.5 border-b border-slate-100 dark:border-slate-800">
                          <input
                            v-model.trim="editAlmacenSearch"
                            type="text"
                            placeholder="Buscar..."
                            class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div class="max-h-44 overflow-y-auto py-1">
                          <div v-if="filteredEditAlmacenes.length === 0" class="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
                          <button
                            v-else
                            v-for="a in filteredEditAlmacenes"
                            :key="a.codAlmacen"
                            type="button"
                            class="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            @mousedown.prevent="toggleEditAlmacen(a)"
                          >
                            <span
                              class="flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center"
                              :class="isEditAlmacenSelected(a.codAlmacen) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500'"
                            >
                              <svg v-if="isEditAlmacenSelected(a.codAlmacen)" class="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </span>
                            <span class="truncate">{{ a.codAlmacen }}</span>
                          </button>
                        </div>
                        <div class="flex items-center justify-between px-2.5 py-1.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <span class="text-slate-500">{{ editGroupAlmacenes.length }} sel.</span>
                          <button type="button" class="text-emerald-600 dark:text-emerald-400 hover:underline" @mousedown.prevent="editGroupAlmacenes = []">Limpiar</button>
                        </div>
                      </div>
                      <div v-if="editGroupAlmacenes.length" class="mt-1 flex flex-wrap gap-1">
                        <span
                          v-for="a in editGroupAlmacenes"
                          :key="a.codAlmacen"
                          class="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 px-2 py-0.5 text-xs font-medium"
                        >
                          {{ a.codAlmacen }}
                          <button type="button" class="hover:text-emerald-900 dark:hover:text-white leading-none" @click="removeEditAlmacen(a.codAlmacen)">×</button>
                        </span>
                      </div>
                    </div>
                  </template>
                  <template v-else>{{ grupo.almacenes.join(', ') }}</template>
                </td>

                <!-- BODEGA CENTRAL -->
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-200">
                  <template v-if="editingGroupId === grupo.id">
                    <div class="relative" ref="editBodegaDropdownRef">
                      <button
                        type="button"
                        class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 flex items-center justify-between gap-1 min-h-[28px]"
                        @click="showEditBodegaDropdown = !showEditBodegaDropdown"
                      >
                        <span :class="!editGroupBodegaCentral ? 'text-slate-400 dark:text-slate-500' : ''">
                          {{ editGroupBodegaCentral ? editGroupBodegaCentral.codAlmacen : 'Seleccionar...' }}
                        </span>
                        <svg class="h-3 w-3 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                      </button>
                      <div
                        v-if="showEditBodegaDropdown"
                        class="absolute z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div class="p-1.5 border-b border-slate-100 dark:border-slate-800">
                          <input
                            v-model.trim="editBodegaSearch"
                            type="text"
                            placeholder="Buscar..."
                            class="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div class="max-h-44 overflow-y-auto py-1">
                          <div v-if="filteredEditBodega.length === 0" class="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
                          <button
                            v-else
                            v-for="a in filteredEditBodega"
                            :key="a.codAlmacen"
                            type="button"
                            class="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            @mousedown.prevent="selectEditBodega(a)"
                          >
                            <span
                              class="flex-shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                              :class="editGroupBodegaCentral?.codAlmacen === a.codAlmacen ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500'"
                            >
                              <span v-if="editGroupBodegaCentral?.codAlmacen === a.codAlmacen" class="w-1.5 h-1.5 rounded-full bg-white block" />
                            </span>
                            <span class="truncate">{{ a.codAlmacen }}</span>
                          </button>
                        </div>
                        <div class="flex items-center justify-end px-2.5 py-1.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <button type="button" class="text-emerald-600 dark:text-emerald-400 hover:underline" @mousedown.prevent="editGroupBodegaCentral = null">Limpiar</button>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else>{{ grupo.bodegaCentral || '-' }}</template>
                </td>

                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDate(grupo.fechaCreacion) }}</td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatDate(grupo.fechaModificacion) }}</td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{{ grupo.modificadoPor || '-' }}</td>

                <!-- ACCIONES -->
                <td class="px-4 py-3 text-right">
                  <template v-if="editingGroupId === grupo.id">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="rounded border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300 hover:border-emerald-300 disabled:opacity-50"
                        :disabled="editGroupSaveLoading"
                        @click="saveInlineEdit(grupo.id)"
                      >
                        {{ editGroupSaveLoading ? 'Guardando...' : 'Guardar' }}
                      </button>
                      <button
                        type="button"
                        class="rounded border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        @click="cancelInlineEdit"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div v-if="editGroupError" class="mt-1 text-xs text-red-600 dark:text-red-400 text-right">{{ editGroupError }}</div>
                  </template>
                  <template v-else>
                    <button
                      type="button"
                      class="mr-2 rounded border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs text-blue-700 dark:text-blue-300 hover:border-blue-300"
                      @click="startInlineEdit(grupo)"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      class="rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs text-red-700 dark:text-red-300 hover:border-red-300"
                      @click="removeGroup(grupo.id)"
                    >
                      Eliminar
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { APP_LOCALE } from '@/plugins/locale'
import api from '@/services/api'
import { randomUUID } from '@/utils/uuid'
import VolverButton from '@/components/navegacion/VolverButton.vue'


interface GrupoAlmacenForm {
  id: string
  grupo: string
  descripcion: string
  almacenes: string[]
  bodegaCentral: string | null
  fechaCreacion: string | null
  fechaModificacion: string | null
  modificadoPor: string | null
}

interface AlmacenItem {
  codAlmacen: string
  nombre: string
}

// Create form state
const showCreateForm = ref(false)
const groupName = ref('')
const groupDescription = ref('')
const formError = ref('')
const grupos = ref<GrupoAlmacenForm[]>([])
const almacenSearch = ref('')
const bodegaCentralSearch = ref('')
const almacenes = ref<AlmacenItem[]>([])
const selectedAlmacenes = ref<AlmacenItem[]>([])
const selectedBodegaCentral = ref<AlmacenItem | null>(null)
const almacenesLoading = ref(false)
const almacenesError = ref('')
const listLoading = ref(false)
const showAlmacenDropdown = ref(false)
const showBodegaCentralDropdown = ref(false)
const almacenDropdownRef = ref<HTMLElement | null>(null)
const bodegaCentralDropdownRef = ref<HTMLElement | null>(null)

// Inline edit state
const editingGroupId = ref<string | null>(null)
const editGroupName = ref('')
const editGroupDescription = ref('')
const editGroupAlmacenes = ref<AlmacenItem[]>([])
const editGroupBodegaCentral = ref<AlmacenItem | null>(null)
const editGroupSaveLoading = ref(false)
const editGroupError = ref('')
const showEditAlmacenDropdown = ref(false)
const editAlmacenSearch = ref('')
const showEditBodegaDropdown = ref(false)
const editBodegaSearch = ref('')
const editAlmacenDropdownRef = ref<HTMLElement | null>(null)
const editBodegaDropdownRef = ref<HTMLElement | null>(null)




const canAddGroup = computed(() => groupName.value.trim() && selectedAlmacenes.value.length > 0)

const resetForm = () => {
  groupName.value = ''
  groupDescription.value = ''
  almacenSearch.value = ''
  bodegaCentralSearch.value = ''
  selectedAlmacenes.value = []
  selectedBodegaCentral.value = null
  showAlmacenDropdown.value = false
  showBodegaCentralDropdown.value = false
  formError.value = ''
}

const addGroup = async () => {
  formError.value = ''
  const nombre = groupName.value.trim()
  const codsAlmacenes = selectedAlmacenes.value.map(item => item.codAlmacen)

  if (!nombre) { formError.value = 'El nombre del grupo es obligatorio.'; return }
  if (codsAlmacenes.length === 0) { formError.value = 'Debes agregar al menos un almacén.'; return }
  const nombreLower = nombre.toLowerCase()
  if (grupos.value.some(g => g.grupo.toLowerCase() === nombreLower)) {
    formError.value = `Ya existe un grupo con el nombre '${nombre}'.`
    return
  }

  try {
    const payload = {
      Grupo: nombre,
      Descripcion: groupDescription.value.trim(),
      Almacenes: codsAlmacenes,
      BodegaCentral: selectedBodegaCentral.value?.codAlmacen ?? null
    }
    const response = await api.post('/WarehouseGroups', payload)
    const data = response.data as any
    grupos.value.unshift({
      id: data?.id ?? randomUUID(),
      grupo: data?.grupo ?? nombre,
      descripcion: data?.descripcion ?? groupDescription.value.trim(),
      almacenes: Array.isArray(data?.almacenes) ? data.almacenes : codsAlmacenes,
      bodegaCentral: data?.bodegaCentral ?? selectedBodegaCentral.value?.codAlmacen ?? null,
      fechaCreacion: data?.fechaCreacion ?? null,
      fechaModificacion: null,
      modificadoPor: data?.modificadoPor ?? null
    })
    resetForm()
    showCreateForm.value = false
  } catch (err: any) {
    formError.value = err?.response?.data?.message || err?.response?.data || 'No se pudo guardar el grupo.'
  }
}

const removeGroup = async (id: string) => {
  const grupo = grupos.value.find(g => g.id === id)
  if (!confirm(`¿Está seguro de eliminar el grupo "${grupo?.grupo ?? ''}"?\n\nEsta acción no se puede deshacer.`)) return
  try {
    await api.delete(`/WarehouseGroups/${id}`)
    grupos.value = grupos.value.filter(g => g.id !== id)
  } catch {
    formError.value = 'No se pudo eliminar el grupo.'
  }
}

const startInlineEdit = (grupo: GrupoAlmacenForm) => {
  editingGroupId.value = grupo.id
  editGroupName.value = grupo.grupo
  editGroupDescription.value = grupo.descripcion
  editGroupAlmacenes.value = grupo.almacenes.map(cod => {
    const found = almacenes.value.find(a => a.codAlmacen === cod)
    return found ?? { codAlmacen: cod, nombre: cod }
  })
  if (grupo.bodegaCentral) {
    const found = almacenes.value.find(a => a.codAlmacen === grupo.bodegaCentral)
    editGroupBodegaCentral.value = found ?? { codAlmacen: grupo.bodegaCentral, nombre: grupo.bodegaCentral }
  } else {
    editGroupBodegaCentral.value = null
  }
  editGroupError.value = ''
  showEditAlmacenDropdown.value = false
  showEditBodegaDropdown.value = false
  editAlmacenSearch.value = ''
  editBodegaSearch.value = ''
}

const cancelInlineEdit = () => {
  editingGroupId.value = null
  editGroupError.value = ''
  showEditAlmacenDropdown.value = false
  showEditBodegaDropdown.value = false
}

const saveInlineEdit = async (id: string) => {
  editGroupError.value = ''
  const nombre = editGroupName.value.trim()
  const codsAlmacenes = editGroupAlmacenes.value.map(item => item.codAlmacen)

  if (!nombre) { editGroupError.value = 'El nombre es obligatorio.'; return }
  if (codsAlmacenes.length === 0) { editGroupError.value = 'Debes tener al menos un almacén.'; return }
  const nombreLowerEdit = nombre.toLowerCase()
  if (grupos.value.some(g => g.id !== id && g.grupo.toLowerCase() === nombreLowerEdit)) {
    editGroupError.value = `Ya existe un grupo con el nombre '${nombre}'.`
    return
  }

  editGroupSaveLoading.value = true
  try {
    const payload = {
      Grupo: nombre,
      Descripcion: editGroupDescription.value.trim(),
      Almacenes: codsAlmacenes,
      BodegaCentral: editGroupBodegaCentral.value?.codAlmacen ?? null
    }
    const response = await api.put(`/WarehouseGroups/${id}`, payload)
    const data = response.data as any
    grupos.value = grupos.value.map(g =>
      g.id === id
        ? {
            id: data?.id ?? g.id,
            grupo: data?.grupo ?? nombre,
            descripcion: data?.descripcion ?? editGroupDescription.value.trim(),
            almacenes: Array.isArray(data?.almacenes) ? data.almacenes : codsAlmacenes,
            bodegaCentral: data?.bodegaCentral ?? editGroupBodegaCentral.value?.codAlmacen ?? null,
            fechaCreacion: data?.fechaCreacion ?? g.fechaCreacion,
            fechaModificacion: data?.fechaModificacion ?? null,
            modificadoPor: data?.modificadoPor ?? null
          }
        : g
    )
    editingGroupId.value = null
  } catch (err: any) {
    editGroupError.value = err?.response?.data?.message || err?.response?.data || 'No se pudo guardar el grupo.'
  } finally {
    editGroupSaveLoading.value = false
  }
}

// Inline edit almacen helpers
const isEditAlmacenSelected = (codAlmacen: string) =>
  editGroupAlmacenes.value.some(item => item.codAlmacen === codAlmacen)

const toggleEditAlmacen = (almacen: AlmacenItem) => {
  if (isEditAlmacenSelected(almacen.codAlmacen)) removeEditAlmacen(almacen.codAlmacen)
  else editGroupAlmacenes.value.push(almacen)
}

const removeEditAlmacen = (codAlmacen: string) => {
  editGroupAlmacenes.value = editGroupAlmacenes.value.filter(item => item.codAlmacen !== codAlmacen)
}

const selectEditBodega = (almacen: AlmacenItem) => {
  editGroupBodegaCentral.value = almacen
  showEditBodegaDropdown.value = false
  editBodegaSearch.value = ''
}

const filteredEditAlmacenes = computed(() => {
  const query = editAlmacenSearch.value.toLowerCase().trim()
  if (!query) return almacenes.value
  return almacenes.value.filter(item =>
    item.codAlmacen.toLowerCase().includes(query) || item.nombre.toLowerCase().includes(query)
  )
})

const filteredEditBodega = computed(() => {
  const query = editBodegaSearch.value.toLowerCase().trim()
  if (!query) return almacenes.value
  return almacenes.value.filter(item =>
    item.codAlmacen.toLowerCase().includes(query) || item.nombre.toLowerCase().includes(query)
  )
})

// Create form almacen helpers
const isAlmacenSelected = (codAlmacen: string) =>
  selectedAlmacenes.value.some(item => item.codAlmacen === codAlmacen)

const toggleAlmacen = (almacen: AlmacenItem) => {
  if (isAlmacenSelected(almacen.codAlmacen)) removeAlmacen(almacen.codAlmacen)
  else selectedAlmacenes.value.push(almacen)
}

const selectBodegaCentral = (almacen: AlmacenItem) => {
  selectedBodegaCentral.value = almacen
  showBodegaCentralDropdown.value = false
  bodegaCentralSearch.value = ''
}

const removeAlmacen = (codAlmacen: string) => {
  selectedAlmacenes.value = selectedAlmacenes.value.filter(item => item.codAlmacen !== codAlmacen)
}

const filteredAlmacenes = computed(() => {
  const query = almacenSearch.value.toLowerCase().trim()
  if (!query) return almacenes.value
  return almacenes.value.filter(item =>
    item.codAlmacen.toLowerCase().includes(query) || item.nombre.toLowerCase().includes(query)
  )
})

const filteredBodegaCentral = computed(() => {
  const query = bodegaCentralSearch.value.toLowerCase().trim()
  if (!query) return almacenes.value
  return almacenes.value.filter(item =>
    item.codAlmacen.toLowerCase().includes(query) || item.nombre.toLowerCase().includes(query)
  )
})

const handleClickOutside = (e: MouseEvent) => {
  if (almacenDropdownRef.value && !almacenDropdownRef.value.contains(e.target as Node)) {
    showAlmacenDropdown.value = false
    almacenSearch.value = ''
  }
  if (bodegaCentralDropdownRef.value && !bodegaCentralDropdownRef.value.contains(e.target as Node)) {
    showBodegaCentralDropdown.value = false
    bodegaCentralSearch.value = ''
  }
  if (editAlmacenDropdownRef.value && !editAlmacenDropdownRef.value.contains(e.target as Node)) {
    showEditAlmacenDropdown.value = false
    editAlmacenSearch.value = ''
  }
  if (editBodegaDropdownRef.value && !editBodegaDropdownRef.value.contains(e.target as Node)) {
    showEditBodegaDropdown.value = false
    editBodegaSearch.value = ''
  }
}

const loadAlmacenes = async () => {
  almacenesLoading.value = true
  almacenesError.value = ''
  try {
    const response = await api.get('/UsuariosAlmacenes/almacenes')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    almacenes.value = items
      .map((item: any) => ({ codAlmacen: String(item.codAlmacen ?? item.CodAlmacen ?? '').trim(), nombre: String(item.nombre ?? item.Nombre ?? '').trim() }))
      .filter((item: AlmacenItem) => item.codAlmacen)
  } catch {
    almacenesError.value = 'No se pudieron cargar los almacenes.'
  } finally {
    almacenesLoading.value = false
  }
}

const loadGrupos = async () => {
  listLoading.value = true
  try {
    const response = await api.get('/WarehouseGroups')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    grupos.value = items.map((item: any) => ({
      id: item.id ?? item.Id ?? '',
      grupo: item.grupo ?? item.Grupo ?? '',
      descripcion: item.descripcion ?? item.Descripcion ?? '',
      almacenes: Array.isArray(item.almacenes) ? item.almacenes : item.Almacenes ?? [],
      bodegaCentral: item.bodegaCentral ?? item.BodegaCentral ?? null,
      fechaCreacion: item.fechaCreacion ?? item.FechaCreacion ?? null,
      fechaModificacion: item.fechaModificacion ?? item.FechaModificacion ?? null,
      modificadoPor: item.modificadoPor ?? item.ModificadoPor ?? null
    }))
  } catch {
    grupos.value = []
  } finally {
    listLoading.value = false
  }
}

const formatDate = (value: string | null): string => {
  if (!value) return '-'
  const d = new Date(value)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString(APP_LOCALE, { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(() => {
  loadAlmacenes()
  loadGrupos()
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>
