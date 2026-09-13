<template>
    <button
        type="button"
        :title="reason"
        :aria-label="reason || 'Campo bloqueado'"
        class="inline-flex items-center normal-case text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help transition-colors"
    >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
        </svg>
    </button>
</template>

<script setup lang="ts">
defineProps<{
    /** Texto del tooltip nativo (title) y del aria-label. */
    reason?: string
}>()
</script>
