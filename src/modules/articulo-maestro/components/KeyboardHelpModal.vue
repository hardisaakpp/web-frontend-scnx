<template>
    <Teleport to="body">
        <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50" @click="$emit('close')"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18V6ZM7.5 9h.008v.008H7.5V9Zm3 0h.008v.008H10.5V9Zm3 0h.008v.008H13.5V9Zm3 0h.008v.008H16.5V9Zm-9 3h.008v.008H7.5V12Zm3 0h.008v.008H10.5V12Zm3 0h.008v.008H13.5V12Zm3 0h.008v.008H16.5V12Zm-6 3h.008v.008H10.5V15Zm3 0h.008v.008H13.5V15Z" />
                        </svg>
                        Atajos de Teclado
                    </h3>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                
                <ul class="space-y-3">
                    <li v-for="(desc, combo) in shortcutsList" :key="combo" class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                        <span class="text-sm text-gray-600 dark:text-gray-300">{{ desc }}</span>
                        <div class="flex items-center gap-1">
                            <kbd v-for="key in combo.split('+')" :key="key" class="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-mono text-gray-700 dark:text-gray-300 shadow-sm uppercase">
                                {{ key }}
                            </kbd>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    isOpen: boolean
    shortcuts: Record<string, { description: string }>
}>()

defineEmits(['close'])

const shortcutsList = computed(() => {
    const list: Record<string, string> = {}
    for (const [combo, config] of Object.entries(props.shortcuts)) {
        list[combo] = config.description
    }
    return list
})
</script>
