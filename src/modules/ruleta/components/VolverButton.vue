<script setup lang="ts">
defineProps<{
  to: string
  label?: string
}>()
</script>

<template>
  <router-link
    :to="to"
    class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400
           hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
  >
    <svg
      class="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
    </svg>
    {{ label ?? 'Volver' }}
  </router-link>
</template>
