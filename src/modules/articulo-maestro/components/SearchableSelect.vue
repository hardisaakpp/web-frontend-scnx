<template>
  <Combobox v-model="selectedOption" :disabled="disabled" as="div" class="relative">
    <div class="relative">
      <ComboboxButton as="div" class="relative w-full cursor-default overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-left focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all sm:text-sm">
        <ComboboxInput
          class="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0 outline-none"
          :id="inputId"
          :displayValue="(opt: any) => opt?.nombre || ''"
          @change="query = $event.target.value"
          @focus="$event.target.select()"
          :placeholder="placeholder"
          :required="required"
          autocomplete="off"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-2">
          <button
            v-if="modelValue && !disabled"
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
        @after-leave="query = ''"
      >
        <ComboboxOptions class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          <div v-if="filteredOptions.length === 0 && query !== ''" class="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
            No se encontraron resultados.
          </div>

          <ComboboxOption
            v-for="opt in filteredOptions"
            as="template"
            :key="opt.codigo || opt.id || opt.nombre"
            :value="opt"
            v-slot="{ selected, active }"
          >
            <li
              class="relative cursor-default select-none py-2 pl-10 pr-4 transition-colors"
              :class="{
                'bg-blue-600 text-white': active,
                'text-gray-900 dark:text-gray-200': !active,
              }"
            >
              <span class="block truncate" :class="{ 'font-medium': selected, 'font-normal': !selected }">
                {{ opt.nombre }}
              </span>
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3"
                :class="{ 'text-white': active, 'text-blue-600': !active }"
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

interface Option {
  codigo?: string | number
  id?: number
  nombre: string
}

const props = defineProps<{
  modelValue: string | number | null | undefined
  options: Option[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  // Obligatorio: qué propiedad de la opción espera el backend (nombre o codigo) para este campo.
  valueKey: keyof Option
  inputId?: string
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const query = ref('')

const selectedOption = computed({
  get: () => {
    // Si no hay valor, devolver null
    if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return null
    
    const checkMatch = (optVal: any, modelVal: any) => {
      if (optVal === modelVal) return true
      if (optVal == null || modelVal == null) return false
      if (String(optVal) === String(modelVal)) return true
      
      // Comparación numérica para códigos (ej: "01" vs 1)
      const nOpt = Number(optVal)
      const nModel = Number(modelVal)
      if (!isNaN(nOpt) && !isNaN(nModel) && String(optVal).trim() !== '' && String(modelVal).trim() !== '') {
        return nOpt === nModel
      }
      return false
    }

    // Buscar la opción que coincida con el valor
    const found = props.options.find(opt => checkMatch(opt[props.valueKey], props.modelValue))
    return found || null
  },
  set: (val: any) => {
    if (!val) {
      emit('update:modelValue', '')
      emit('change', null)
      return
    }
    emit('update:modelValue', val[props.valueKey])
    emit('change', val)
  }
})

const filteredOptions = computed(() =>
  query.value === ''
    ? props.options
    : props.options.filter((opt) =>
        opt.nombre
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.value.toLowerCase().replace(/\s+/g, ''))
      )
)

function clearSelection() {
  emit('update:modelValue', '')
  emit('change', null)
  query.value = ''
}
</script>

