<template>
  <Listbox v-model="selected" as="div" class="relative">
    <ListboxButton class="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-2 pl-3 pr-10 text-left text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all">
      <span class="block truncate">{{ modelValue || placeholder }}</span>
      <span class="absolute inset-y-0 right-0 flex items-center pr-2">
        <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
      </span>
    </ListboxButton>

    <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <ListboxOptions class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <ListboxOption v-slot="{ active, selected: isSelected }" :value="''" as="template">
          <li
            class="relative cursor-default select-none py-2 pl-10 pr-4 transition-colors"
            :class="active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'"
          >
            <span class="block truncate" :class="{ 'font-medium': isSelected, 'font-normal': !isSelected }">{{ placeholder }}</span>
            <span v-if="isSelected" class="absolute inset-y-0 left-0 flex items-center pl-3" :class="active ? 'text-white' : 'text-blue-600'">
              <CheckIcon class="h-5 w-5" aria-hidden="true" />
            </span>
          </li>
        </ListboxOption>

        <ListboxOption v-for="opt in options" :key="opt" v-slot="{ active, selected: isSelected }" :value="opt" as="template">
          <li
            class="relative cursor-default select-none py-2 pl-10 pr-4 transition-colors"
            :class="active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-200'"
          >
            <span class="block truncate" :class="{ 'font-medium': isSelected, 'font-normal': !isSelected }">{{ opt }}</span>
            <span v-if="isSelected" class="absolute inset-y-0 left-0 flex items-center pl-3" :class="active ? 'text-white' : 'text-blue-600'">
              <CheckIcon class="h-5 w-5" aria-hidden="true" />
            </span>
          </li>
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'

const props = withDefaults(defineProps<{
  modelValue: string
  options: string[]
  placeholder?: string
}>(), {
  placeholder: 'Todos',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selected = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>
