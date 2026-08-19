<script setup lang="ts">
withDefaults(defineProps<{ mensaje?: string }>(), { mensaje: 'Cargando…' })
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 gap-3">
    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ mensaje }}</p>
  </div>
</template>
