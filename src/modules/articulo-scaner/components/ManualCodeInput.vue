<template>
  <div class="space-y-2">
    <label class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      </span>
      Código de artículo
    </label>
    <div class="space-y-3">
      <div class="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/25 dark:border-slate-600 dark:bg-slate-900 dark:ring-white/5">
        <input
          :value="modelValue"
          :disabled="disabled"
          type="text"
          maxlength="50"
          placeholder="Escribe o escanea el código"
          class="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60 dark:text-white sm:text-sm"
          @input="onInput"
          @keyup.enter="$emit('submit')"
        />
        <button
          type="button"
          title="Escanear con cámara"
          :disabled="disabled || scannerDisabled"
          class="group relative shrink-0 border-l border-emerald-600/30 bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500"
          @click="$emit('open-scanner')"
        >
          <svg class="h-6 w-6 transition group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 8a2 2 0 0 1 2-2h2l1.2-2h5.6L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        :disabled="disabled || !modelValue.trim()"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:from-blue-700 hover:to-sky-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none"
        @click="$emit('submit')"
      >
        <svg class="h-5 w-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Consultar artículo
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  disabled?: boolean
  scannerDisabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
  (e: 'open-scanner'): void
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value.trimStart())
}
</script>
