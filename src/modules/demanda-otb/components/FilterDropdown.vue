<template>
  <Combobox v-model="selected" as="div" class="relative">
    <div class="relative">
      <ComboboxButton as="div" class="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-left focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/20 focus-within:border-blue-500 transition-all">
        <ComboboxInput
          :id="id"
          class="w-full border-none py-2 pl-3 pr-16 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0 outline-none"
          :displayValue="(val: unknown) => (val as string) || ''"
          :placeholder="placeholder"
          autocomplete="off"
          @change="query = $event.target.value"
          @focus="($event.target as HTMLInputElement).select()"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          <button
            v-if="modelValue"
            type="button"
            @click.stop="clearSelection"
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            :title="`Limpiar (${placeholder})`"
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
        @after-leave="query = ''"
      >
        <ComboboxOptions class="absolute z-50 mt-1 max-h-60 min-w-full w-max max-w-xs overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div v-if="filteredOptions.length === 0" class="relative cursor-default select-none py-2 px-4 text-gray-500 dark:text-gray-400">
            No se encontraron resultados.
          </div>

          <ComboboxOption v-for="opt in filteredOptions" :key="opt" v-slot="{ active, selected: isSelected }" :value="opt" as="template">
            <li
              class="relative cursor-default select-none py-2 pl-10 pr-4 transition-colors"
              :class="active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'"
            >
              <span class="block whitespace-normal break-words" :class="{ 'font-medium': isSelected, 'font-normal': !isSelected }">{{ opt }}</span>
              <span v-if="isSelected" class="absolute inset-y-0 left-0 flex items-center pl-3" :class="active ? 'text-white' : 'text-blue-600'">
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
import { ref, computed } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/vue/20/solid'

const props = withDefaults(defineProps<{
  modelValue: string
  options: string[]
  placeholder?: string
  id?: string
}>(), {
  placeholder: 'Todos',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selected = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value ?? ''),
})

const query = ref('')

const filteredOptions = computed(() => {
  if (query.value === '') return props.options
  const q = query.value.toLowerCase()
  return props.options.filter(opt => opt.toLowerCase().includes(q))
})

function clearSelection() {
  emit('update:modelValue', '')
  query.value = ''
}
</script>
