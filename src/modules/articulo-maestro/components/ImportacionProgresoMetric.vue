<template>
    <div class="rounded-md bg-white p-3 dark:bg-gray-800">
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p class="font-semibold" :class="toneClass">{{ value }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    label: string
    value: string | number
    tone?: 'default' | 'success' | 'error' | 'warning' | 'info'
}>(), {
    tone: 'default'
})

const toneClass = computed(() => ({
    default: 'text-gray-900 dark:text-white',
    success: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400'
})[props.tone])
</script>
