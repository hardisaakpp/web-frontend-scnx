<template>
  <span
    class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
    :class="activo
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
      : 'border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'"
  >
    {{ activo ? 'Activo' : 'Inactivo' }}
  </span>
</template>

<script setup lang="ts">
defineProps<{ activo: boolean }>()
</script>
