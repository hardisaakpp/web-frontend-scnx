<template>
  <div class="flex flex-col items-center justify-center py-12">
    <div class="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
    <p v-if="message" class="mt-4 text-gray-600 text-sm">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

