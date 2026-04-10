<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
      <div class="fixed inset-0 bg-black bg-opacity-30 dark:bg-black/60" />
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <DialogPanel class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl border border-transparent dark:border-gray-700 transition-colors">
            <DialogTitle class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Gestionar Permisos - Rol: {{ rol?.name }}
            </DialogTitle>

            <div class="space-y-4">
              <!-- Permisos actuales agrupados por módulo -->
              <div>
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permisos Asignados</h3>
                <div v-if="permisosPorModulo && Object.keys(permisosPorModulo).length > 0" class="space-y-3">
                  <div v-for="(permisos, modulo) in permisosPorModulo" :key="modulo" class="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-900/40">
                    <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2 capitalize">{{ modulo }}</h4>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="permiso in permisos"
                        :key="permiso.id"
                        class="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full text-sm"
                      >
                        {{ permiso.key }}
                        <button @click="() => emit('remover-permiso', permiso.id)" class="hover:text-green-900 dark:hover:text-green-200">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
                <p v-else class="text-sm text-gray-500 dark:text-gray-400">No hay permisos asignados</p>
              </div>

              <!-- Agregar nuevo permiso -->
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agregar Permiso</h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Filtrar por módulo</label>
                    <select
                      v-model="selectedModule"
                      :disabled="cargandoListaPermisos"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-wait disabled:opacity-80"
                    >
                      <option value="">{{ cargandoListaPermisos ? 'Cargando…' : 'Todos los módulos' }}</option>
                      <option v-for="modulo in modulos" :key="modulo" :value="modulo">
                        {{ modulo }}
                      </option>
                    </select>
                  </div>
                  <div class="flex gap-2">
                    <div class="flex min-w-0 flex-1 items-center gap-2">
                      <select
                        v-model="selectedPermission"
                        :disabled="cargandoListaPermisos || loading"
                        :aria-busy="cargandoListaPermisos"
                        :aria-label="cargandoListaPermisos ? 'Cargando catálogo de permisos' : 'Seleccionar permiso a asignar'"
                        class="min-w-0 flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-wait disabled:opacity-80"
                      >
                        <option value="">{{ cargandoListaPermisos ? 'Cargando permisos…' : 'Seleccionar permiso...' }}</option>
                        <option v-for="permiso in permisosDisponiblesFiltrados" :key="permiso.id" :value="permiso.id">
                          [{{ permiso.module }}] {{ permiso.key }} - {{ permiso.description }}
                        </option>
                      </select>
                      <span
                        v-if="cargandoListaPermisos"
                        class="inline-flex shrink-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
                        title="Cargando permisos"
                      >
                        <svg class="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span class="hidden sm:inline">Cargando…</span>
                      </span>
                    </div>
                    <button
                      @click="handleAsignar"
                      :disabled="!selectedPermission || loading || cargandoListaPermisos"
                      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 transition-colors shrink-0"
                    >
                      Asignar
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex gap-3 mt-6">
                <button
                  @click="close"
                  class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot } from '@headlessui/vue'
import { usePermisosStore } from '../stores/permisosStore'
import type { Rol, Permiso } from '../types'

const permisosStore = usePermisosStore()

/** Catálogo global de permisos aún vacío mientras corre la carga inicial (misma idea que el select de roles). */
const cargandoListaPermisos = computed(
  () => permisosStore.loading && permisosStore.permisos.length === 0
)

interface Props {
  isOpen: boolean
  rol: Rol | null
  permisos: Permiso[]
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'asignar-permiso', permisoId: number): void
  (e: 'remover-permiso', permisoId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedPermission = ref<number | ''>('')
const selectedModule = ref('')

const permisosPorModulo = computed(() => {
  if (!props.rol?.permissions) return {}
  const map: Record<string, Permiso[]> = {}
  props.rol.permissions.forEach(p => {
    if (!map[p.module]) map[p.module] = []
    map[p.module].push(p)
  })
  return map
})

const modulos = computed(() => 
  Array.from(new Set(props.permisos.map(p => p.module))).sort()
)

const permisosDisponibles = computed(() => 
  props.permisos.filter(p => !props.rol?.permissions.some(rp => rp.id === p.id))
)

const permisosDisponiblesFiltrados = computed(() => 
  selectedModule.value
    ? permisosDisponibles.value.filter(p => p.module === selectedModule.value)
    : permisosDisponibles.value
)

const close = () => {
  selectedPermission.value = ''
  selectedModule.value = ''
  emit('close')
}

const handleAsignar = () => {
  if (selectedPermission.value) {
    emit('asignar-permiso', selectedPermission.value as number)
    selectedPermission.value = ''
  }
}
</script>
