<template>
  <div class="relative">
    <input
      ref="inputRef"
      type="text"
      v-model="modelValue"
      @input="emit('input')"
      @keyup.enter="emit('keyup-enter')"
      :placeholder="placeholder"
      autocomplete="off"
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
    />
    <button
      v-if="modelValue"
      @mousedown.prevent="handleClear"
      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Input de búsqueda con debounce (Número de Pedido / Creado Por), duplicado 2 veces por archivo
 * en los 4 listados de pedidos del módulo (8 copias en total): input + botón "limpiar" (aparece
 * solo con texto) que refoca el input tras limpiar.
 *
 * Es SOLO el shell de UI -- el debounce en sí sigue siendo responsabilidad de
 * ../composables/useDebouncedFilterInput.ts en cada vista (no se toca ni se reimplementa aquí, tal
 * como pide el encargo). El wiring típico en la vista consumidora:
 *
 *   const { texto, handleInput, commit, clear, dispose } = useDebouncedFilterInput((valor) => { ... })
 *   <DebouncedSearchField
 *     v-model="texto"
 *     placeholder="Buscar por número de pedido..."
 *     @input="handleInput"
 *     @keyup-enter="commit"
 *     @clear="clear"
 *   />
 *
 * `v-model` va atado DIRECTO al `texto` ref del composable (no hay estado propio duplicado acá):
 * al escribir, el `@input` nativo actualiza `texto` vía v-model ANTES de que este componente emita
 * su propio evento `input` (mismo orden de listeners que ya usan hoy los 4 listados con
 * `v-model="busquedaNumeroPedido"` + `@input="handleBusquedaNumeroPedido"` sobre el mismo <input>),
 * así que `handleInput()` -- que no recibe el evento, lee `texto.value` -- ve el valor ya actualizado.
 * El botón "limpiar" NO llama a `clear()` él mismo (no conoce el composable): emite `clear` para que
 * la vista consumidora llame a su propio `clear()`, y este componente solo se encarga de refocar su
 * <input> después (mismo comportamiento que `numeroPedidoInputRef.value?.focus()` en el código actual).
 */
import { ref } from '@vue/reactivity'

const modelValue = defineModel<string>({ default: '' })

defineProps<{
  placeholder?: string
}>()

const emit = defineEmits<{
  /** Espejo del evento nativo `input` del <input>, YA con `modelValue` actualizado -- conéctalo a
   * `handleInput` del composable de debounce. */
  input: []
  /** Enter presionado con el input enfocado -- conéctalo a `commit` del composable (aplica de inmediato,
   * sin esperar el debounce). */
  'keyup-enter': []
  /** Clic en el botón "limpiar" -- conéctalo a `clear` del composable (limpia y aplica de inmediato). */
  clear: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function handleClear() {
  emit('clear')
  inputRef.value?.focus()
}

defineExpose({ focus: () => inputRef.value?.focus() })
</script>
