<template>
  <div :class="embedded ? '' : 'space-y-2'">
    <label
      v-if="!embedded"
      class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"
    >
      <span class="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </span>
      Almacén de consulta
    </label>
    <div class="relative flex flex-col gap-1">
      <div class="relative">
        <input
          ref="inputRef"
          v-model="searchText"
          type="text"
          list="articulo-scan-warehouse-options"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          enterkeyhint="done"
          :disabled="disabled"
          placeholder="Buscar tienda por nombre o código"
          :class="[
            'min-h-[52px] w-full touch-manipulation rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/[0.02] ring-1 ring-slate-900/[0.03] transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500',
            embedded
              ? 'focus:border-sky-500 focus:ring-sky-500/25'
              : 'focus:border-emerald-500 focus:ring-emerald-500/25'
          ]"
          @input="onSearchInput"
          @change="onSearchChange"
        />
        <button
          v-if="searchText"
          type="button"
          title="Limpiar almacén"
          aria-label="Limpiar almacén"
          :disabled="disabled"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40 dark:text-gray-500 dark:hover:text-gray-300"
          @click="clearSelection"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <datalist id="articulo-scan-warehouse-options">
        <option v-for="o in optionsForDatalist" :key="o.cod" :value="o.cod">
          {{ o.label }}
        </option>
      </datalist>
      <p
        v-if="!warehouses.length && !disabled"
        class="text-xs text-amber-700 dark:text-amber-300"
      >
        No hay almacenes cargados. Reintentá o revisá la conexión con el servicio de escaneo.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { WarehouseDto } from '../types'

const props = defineProps<{
  modelValue: string | null
  warehouses: WarehouseDto[]
  disabled?: boolean
  /** Oculta la etiqueta superior; usar cuando el titular vive en el panel padre (p. ej. vista principal). */
  embedded?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const searchText = ref('')

type WarehouseOption = { cod: string; label: string }

const optionsForDatalist = computed((): WarehouseOption[] => {
  const base = props.warehouses.map((w) => ({
    cod: w.code,
    label: (w.name || '').trim() || w.code
  }))
  const c = (props.modelValue || '').trim()
  if (c && !base.some((x) => x.cod === c)) {
    return [{ cod: c, label: 'Valor guardado (revisar)' }, ...base]
  }
  return base
})

watch(
  () => props.modelValue,
  (v) => {
    const code = (v || '').trim()
    if (code !== searchText.value.trim()) {
      searchText.value = code
    }
  },
  { immediate: true }
)

function onSearchInput() {
  const raw = searchText.value.trim().toLowerCase()
  if (!raw) return
  const byCode = props.warehouses.find((w) => w.code.toLowerCase() === raw)
  if (!byCode) return
  emit('update:modelValue', byCode.code)
  nextTick(() => {
    searchText.value = byCode.code
    inputRef.value?.blur()
  })
}

function onSearchChange() {
  const raw = searchText.value.trim().toLowerCase()
  if (!raw) {
    emit('update:modelValue', null)
    return
  }
  const byCode = props.warehouses.find((w) => w.code.toLowerCase() === raw)
  if (byCode) {
    searchText.value = byCode.code
    emit('update:modelValue', byCode.code)
    return
  }
  const byLabel = props.warehouses.find((w) => (w.name || '').toLowerCase().includes(raw))
  if (byLabel) {
    searchText.value = byLabel.code
    emit('update:modelValue', byLabel.code)
    return
  }
  emit('update:modelValue', searchText.value.trim())
}

function clearSelection() {
  searchText.value = ''
  emit('update:modelValue', null)
  nextTick(() => inputRef.value?.focus())
}
</script>
