<template>
  <RouterLink
    :to="to"
    :title="title"
    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
  >
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
    {{ label ?? 'Volver' }}
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  to: string
  label?: string
  title?: string
}>()
</script>
