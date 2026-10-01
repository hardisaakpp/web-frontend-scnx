<script setup lang="ts">
/**
 * Selector de permisos con casillas, agrupado por módulo y con buscador.
 *
 * Reutilizable: lo usa el formulario de rol (permisos iniciales) y el panel de detalle (agregar permisos).
 * - `permisos`: catálogo completo; `excluidos`: ids que no se ofrecen (p. ej. los que el rol ya tiene).
 * - `v-model`: ids seleccionados. La casilla de cada módulo marca o desmarca los permisos que se están viendo
 *   (si hay búsqueda activa, solo los que coinciden).
 */
import { computed, ref } from 'vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import type { Permiso } from '../types'
import { agruparPorModulo, filtrarPermisos } from '../utils/roles'

const props = withDefaults(defineProps<{
  permisos: Permiso[]
  modelValue: number[]
  excluidos?: number[]
  cargando?: boolean
  /** Alto máximo de la lista (clase Tailwind). */
  alturaMaxima?: string
}>(), { excluidos: () => [], cargando: false, alturaMaxima: 'max-h-72' })

const emit = defineEmits<{
  'update:modelValue': [ids: number[]]
}>()

const busqueda = ref('')

const disponibles = computed(() => {
  const fuera = new Set(props.excluidos)
  return props.permisos.filter(p => !fuera.has(p.id))
})
const visibles = computed(() => filtrarPermisos(disponibles.value, busqueda.value))
const grupos = computed(() => agruparPorModulo(visibles.value))
const seleccion = computed(() => new Set(props.modelValue))

function cambiar(ids: number[]) {
  emit('update:modelValue', ids)
}

function alternar(id: number) {
  const nueva = new Set(seleccion.value)
  if (nueva.has(id)) nueva.delete(id)
  else nueva.add(id)
  cambiar([...nueva])
}

function estadoModulo(lista: Permiso[]): 'todos' | 'algunos' | 'ninguno' {
  const marcados = lista.filter(p => seleccion.value.has(p.id)).length
  if (marcados === 0) return 'ninguno'
  return marcados === lista.length ? 'todos' : 'algunos'
}

function alternarModulo(lista: Permiso[]) {
  const nueva = new Set(seleccion.value)
  if (estadoModulo(lista) === 'todos') lista.forEach(p => nueva.delete(p.id))
  else lista.forEach(p => nueva.add(p.id))
  cambiar([...nueva])
}

function limpiar() {
  cambiar([])
}
</script>

<template>
  <div>
    <div class="relative">
      <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        v-model="busqueda"
        type="search"
        autocomplete="off"
        placeholder="Buscar permiso por nombre, módulo o descripción…"
        aria-label="Buscar permisos"
        class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
    </div>

    <div class="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{{ modelValue.length === 0 ? 'Ninguno seleccionado' : `${modelValue.length} seleccionado${modelValue.length === 1 ? '' : 's'}` }}</span>
      <button
        v-if="modelValue.length > 0"
        type="button"
        class="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        @click="limpiar"
      >
        Limpiar selección
      </button>
    </div>

    <div
      class="mt-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-900/40"
      :class="alturaMaxima"
      tabindex="0"
      role="group"
      aria-label="Lista de permisos"
    >
      <p v-if="cargando" class="p-4 text-sm text-gray-500 dark:text-gray-400">Cargando permisos…</p>
      <p v-else-if="disponibles.length === 0" class="p-4 text-sm text-gray-500 dark:text-gray-400">
        No hay más permisos para agregar a este rol.
      </p>
      <p v-else-if="grupos.length === 0" class="p-4 text-sm text-gray-500 dark:text-gray-400">
        Ningún permiso coincide con «{{ busqueda }}».
      </p>

      <section v-for="grupo in grupos" :key="grupo.modulo" class="border-b border-gray-200 last:border-b-0 dark:border-gray-700">
        <label class="flex cursor-pointer items-center gap-2 bg-gray-100/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-500 dark:bg-gray-700"
            :checked="estadoModulo(grupo.permisos) === 'todos'"
            :indeterminate.prop="estadoModulo(grupo.permisos) === 'algunos'"
            :aria-label="`Seleccionar los permisos del módulo ${grupo.modulo}`"
            @change="alternarModulo(grupo.permisos)"
          />
          <span>{{ grupo.modulo }}</span>
          <span class="font-normal normal-case text-gray-400">({{ grupo.permisos.length }})</span>
        </label>
        <ul>
          <li v-for="permiso in grupo.permisos" :key="permiso.id">
            <label class="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-white dark:hover:bg-gray-800">
              <input
                type="checkbox"
                class="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-500 dark:bg-gray-700"
                :checked="seleccion.has(permiso.id)"
                @change="alternar(permiso.id)"
              />
              <span class="min-w-0">
                <span class="block break-all font-mono text-[13px] text-gray-900 dark:text-white">{{ permiso.key }}</span>
                <span v-if="permiso.description" class="block text-xs text-gray-500 dark:text-gray-400">{{ permiso.description }}</span>
              </span>
            </label>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
