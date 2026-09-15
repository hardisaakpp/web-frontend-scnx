<template>
  <Combobox :model-value="null" as="div" class="relative" @update:model-value="onSeleccionar">
    <div class="relative">
      <ComboboxButton as="div" class="relative w-56 cursor-default overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-left focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all sm:text-sm">
        <ComboboxInput
          class="w-full border-none py-2 pl-3 pr-8 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0 outline-none"
          :display-value="() => query"
          placeholder="Buscar tienda por nombre o código..."
          autocomplete="off"
          @change="onInputChange(($event.target as HTMLInputElement).value)"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-2">
          <LoadingSpinner v-if="buscando" layout="inline" size="xs" aria-label="Buscando tiendas" />
          <ChevronUpDownIcon v-else class="h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
        </div>
      </ComboboxButton>

      <TransitionRoot
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <ComboboxOptions class="absolute z-50 mt-1 max-h-60 w-72 max-w-[calc(100vw-2rem)] overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div v-if="!buscando && resultados.length === 0" class="px-4 py-2 text-gray-500 dark:text-gray-400">
            {{ query ? 'No se encontraron tiendas.' : 'Escriba para buscar una tienda...' }}
          </div>

          <ComboboxOption
            v-for="tienda in resultados"
            :key="tienda.tienda_id"
            :value="tienda"
            as="template"
            v-slot="{ active }"
          >
            <li
              class="cursor-default select-none px-4 py-2 transition-colors"
              :class="active ? 'bg-purple-600 text-white' : 'text-gray-900 dark:text-gray-200'"
            >
              <span class="font-medium">{{ tienda.codigo }}</span>
              <span class="ml-2 text-xs" :class="active ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'">
                {{ tienda.nombre }}
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </TransitionRoot>
    </div>
  </Combobox>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { ChevronUpDownIcon } from '@heroicons/vue/20/solid'
import { pedidosService } from '../services/domains/pedidos'
import type { TiendaCatalogoItem } from '../types'
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  /** Códigos de tienda a excluir de los resultados (ya presentes en la matriz de redistribución) */
  excluirCodigos?: string[]
}

const props = withDefaults(defineProps<Props>(), { excluirCodigos: () => [] })
const emit = defineEmits<(e: 'select', tienda: { codigo: string; nombre: string }) => void>()

const query = ref('')
const resultados = ref<TiendaCatalogoItem[]>([])
const buscando = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function ejecutarBusqueda(texto: string) {
  buscando.value = true
  try {
    const excluidos = new Set(props.excluirCodigos.map(c => c.toUpperCase()))
    const data = await pedidosService.buscarTiendas(texto)
    resultados.value = data.filter(t => {
      const codigo = t.codigo.toUpperCase()
      if (excluidos.has(codigo)) return false
      // DESCUENTON (prefijo OUT/TOUT) no participa en redistribución de pedidos hijo.
      if (codigo.startsWith('OUT') || codigo.startsWith('TOUT')) return false
      return true
    })
  } catch (error) {
    console.error('❌ [TiendaSearchCombobox] Error al buscar tiendas:', error)
    resultados.value = []
  } finally {
    buscando.value = false
  }
}

function onInputChange(valor: string) {
  query.value = valor
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => ejecutarBusqueda(valor), 250)
}

function onSeleccionar(tienda: TiendaCatalogoItem | null) {
  if (!tienda) return
  emit('select', { codigo: tienda.codigo, nombre: tienda.nombre || tienda.codigo })
  query.value = ''
  resultados.value = []
}

onMounted(() => {
  // Precarga las primeras tiendas activas para que el desplegable no empiece vacío
  ejecutarBusqueda('')
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
