<template>
  <Combobox v-model="selectedOption" as="div" class="relative">
    <div class="relative">
      <ComboboxButton as="div" class="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-left focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/20 focus-within:border-blue-500 transition-all">
        <ComboboxInput
          :id="id"
          class="w-full border-none py-2 pl-3 pr-16 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0 outline-none"
          :displayValue="(opt: any) => opt ? `${opt.codigoProducto} — ${opt.nombreProducto || 'Sin nombre'}` : ''"
          :placeholder="loading ? 'Cargando...' : 'Buscar por código o nombre...'"
          autocomplete="off"
          @change="onQueryChange"
          @focus="($event.target as HTMLInputElement).select()"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          <button
            v-if="modelValue"
            type="button"
            @click.stop="clearSelection"
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Limpiar selección"
          >
            <XMarkIcon class="h-4 w-4" aria-hidden="true" />
          </button>
          <ChevronUpDownIcon class="h-5 w-5 text-gray-400 pointer-events-none" aria-hidden="true" />
        </div>
      </ComboboxButton>

      <TransitionRoot
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <ComboboxOptions class="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div v-if="loading" class="relative cursor-default select-none py-2 px-4 text-gray-500 dark:text-gray-400">
            Buscando...
          </div>
          <div v-else-if="items.length === 0" class="relative cursor-default select-none py-2 px-4 text-gray-500 dark:text-gray-400">
            No se encontraron resultados.
          </div>

          <ComboboxOption
            v-for="item in items"
            as="template"
            :key="item.codigoProducto"
            :value="item"
            v-slot="{ selected, active }"
          >
            <li
              class="relative cursor-default select-none py-2 pl-10 pr-4 transition-colors"
              :class="active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'"
            >
              <span
                class="flex items-start gap-1"
                :class="{ 'font-medium': selected, 'font-normal': !selected }"
                :title="item.tieneProyeccion ? 'Con proyección' : 'Sin proyección'"
              >
                <CheckBadgeIcon
                  v-if="item.tieneProyeccion"
                  class="h-4 w-4 flex-shrink-0 mt-0.5"
                  :class="active ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'"
                />
                <ExclamationTriangleIcon
                  v-else
                  class="h-4 w-4 flex-shrink-0 mt-0.5"
                  :class="active ? 'text-white' : 'text-amber-500 dark:text-amber-400'"
                />
                <span class="whitespace-normal break-words">
                  <span
                    class="font-bold"
                    :class="active ? 'text-white' : (item.tieneProyeccion ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')"
                  >{{ item.codigoProducto }}</span>
                  <span :class="active ? 'text-white' : (item.tieneProyeccion ? '' : 'text-amber-600 dark:text-amber-400')">
                    — {{ item.nombreProducto || 'Sin nombre' }}
                  </span>
                </span>
              </span>
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3"
                :class="active ? 'text-white' : 'text-blue-600'"
              >
                <CheckIcon class="h-5 w-5" aria-hidden="true" />
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </TransitionRoot>
    </div>
  </Combobox>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { CheckBadgeIcon, CheckIcon, ChevronUpDownIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import type { CatalogoItem } from '../types'

const props = defineProps<{
  modelValue: string
  items: CatalogoItem[]
  loading?: boolean
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [item: CatalogoItem | null]
  search: [texto: string]
}>()

const selectedOption = computed<CatalogoItem | null>({
  get: () => props.items.find(i => i.codigoProducto === props.modelValue) ?? null,
  set: (item) => {
    emit('update:modelValue', item?.codigoProducto ?? '')
    emit('change', item ?? null)
  },
})

function onQueryChange(event: Event) {
  emit('search', (event.target as HTMLInputElement).value)
}

function clearSelection() {
  emit('update:modelValue', '')
  emit('change', null)
}
</script>
