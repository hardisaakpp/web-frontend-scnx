<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
    label: string
    required?: boolean
    help?: string
    error?: string
}>()
const fieldId = useId()
</script>

<template>
    <div class="flex flex-col gap-1.5">
        <label :for="fieldId" class="text-xs font-medium text-gray-700 dark:text-gray-200">
            {{ label }}
            <span v-if="required" class="text-red-500">*</span>
        </label>
        <slot :id="fieldId" />
        <span v-if="error" class="text-xs text-red-600 dark:text-red-400">
            {{ error }}
        </span>
        <span v-else-if="help" class="text-xs text-gray-500 dark:text-gray-400">
            {{ help }}
        </span>    
    </div>
</template>