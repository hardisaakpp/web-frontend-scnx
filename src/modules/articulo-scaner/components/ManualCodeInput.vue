<template>
  <div :class="embedded ? 'space-y-3' : 'space-y-2'">
    <div
      v-if="!embedded"
      class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
    >
      <label for="articulo-scan-code" class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </span>
        Lectura del código
      </label>
      <span class="text-xs text-slate-500 dark:text-slate-400">Manual o cámara</span>
    </div>
    <div class="space-y-3">
      <div class="relative">
        <div class="flex min-h-[52px] items-stretch overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-inner shadow-slate-900/[0.03] ring-1 ring-slate-900/[0.04] transition focus-within:border-emerald-500/70 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.15)] dark:border-slate-600 dark:bg-slate-950/50 dark:ring-white/[0.06] dark:focus-within:border-emerald-500/50">
        <div class="relative min-w-0 flex-1">
          <input
            id="articulo-scan-code"
            ref="inputRef"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            enterkeyhint="search"
            inputmode="text"
            :value="props.modelValue"
            :disabled="props.disabled"
            type="text"
            maxlength="50"
            :placeholder="props.scannerDisabled ? 'Primero elegí un almacén' : 'Código de barras o referencia'"
            class="min-w-0 w-full border-0 bg-transparent py-3.5 pl-4 pr-10 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60 dark:text-white sm:text-[15px]"
            @input="onInput"
            @focus="onFocusInput"
            @click="onFocusInput"
            @blur="onBlurInput"
            @keyup.enter="onSubmit"
          />
          <button
            v-if="props.modelValue"
            type="button"
            title="Limpiar búsqueda"
            :disabled="props.disabled"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
            @click="clearInput"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span class="sr-only">Limpiar código</span>
          </button>
        </div>
        <button
          type="button"
          aria-label="Escanear con cámara"
          title="Escanear con cámara"
          :disabled="props.disabled || props.scannerDisabled"
          class="touch-target relative shrink-0 border-l border-sky-600/35 bg-gradient-to-b from-sky-500 via-sky-600 to-blue-600 px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:brightness-105 active:brightness-95 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500 disabled:brightness-100"
          @click="$emit('open-scanner')"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M4 8a2 2 0 0 1 2-2h2l1.2-2h5.6L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </button>
      </div>
        <div
          v-if="showSuggestions && filteredSuggestions.length"
          class="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 py-1 shadow-lg shadow-slate-900/8 ring-1 ring-slate-900/[0.04] backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/95 dark:ring-white/[0.06]"
        >
          <p class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Recientes</p>
          <button
            v-for="code in filteredSuggestions"
            :key="code"
            type="button"
            class="block w-full px-3 py-2.5 text-left text-sm font-mono text-slate-800 transition hover:bg-emerald-50 active:bg-emerald-100 dark:text-slate-100 dark:hover:bg-slate-800"
            @mousedown.prevent="selectSuggestion(code)"
          >
            {{ code }}
          </button>
        </div>
      </div>
      <button
        type="button"
        :disabled="props.disabled || !props.modelValue.trim()"
        class="flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:brightness-[1.03] active:scale-[0.99] active:brightness-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none disabled:hover:brightness-100"
        @click="onSubmit"
      >
        <svg class="h-5 w-5 opacity-95" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Consultar artículo
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const RECENT_CODES_KEY = 'articulo-scaner:recent-codes'
const RECENT_CODES_LIMIT = 10

const props = defineProps<{
  modelValue: string
  disabled?: boolean
  scannerDisabled?: boolean
  /** Oculta la fila de etiqueta; usar cuando el titular vive en el panel padre. */
  embedded?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
  (e: 'open-scanner'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const showSuggestions = ref(false)
const recentCodes = ref<string[]>([])

const filteredSuggestions = computed(() => {
  const query = props.modelValue.trim().toLowerCase()
  if (!query) return recentCodes.value
  return recentCodes.value.filter((code) => code.toLowerCase().includes(query))
})

onMounted(() => {
  loadRecentCodes()
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value.trimStart())
  showSuggestions.value = !props.disabled
}

function clearInput() {
  emit('update:modelValue', '')
  showSuggestions.value = !props.disabled && recentCodes.value.length > 0
  inputRef.value?.focus()
}

function onFocusInput() {
  if (props.disabled) return
  showSuggestions.value = recentCodes.value.length > 0
}

function onBlurInput() {
  window.setTimeout(() => {
    showSuggestions.value = false
  }, 120)
}

function selectSuggestion(code: string) {
  emit('update:modelValue', code)
  showSuggestions.value = false
}

function onSubmit() {
  const code = props.modelValue.trim()
  if (!code || props.disabled) return
  saveRecentCode(code)
  emit('submit')
}

function loadRecentCodes() {
  try {
    const raw = localStorage.getItem(RECENT_CODES_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    recentCodes.value = parsed
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim())
      .slice(0, RECENT_CODES_LIMIT)
  } catch {
    recentCodes.value = []
  }
}

function saveRecentCode(code: string) {
  const next = [code, ...recentCodes.value.filter((item) => item !== code)].slice(0, RECENT_CODES_LIMIT)
  recentCodes.value = next
  try {
    localStorage.setItem(RECENT_CODES_KEY, JSON.stringify(next))
  } catch {
    // noop: si storage falla, mantenemos cache en memoria
  }
}

function focusInput() {
  if (props.disabled) return
  inputRef.value?.focus({ preventScroll: true })
  if (inputRef.value?.value) {
    inputRef.value.select()
  }
}

defineExpose({ focusInput })
</script>
