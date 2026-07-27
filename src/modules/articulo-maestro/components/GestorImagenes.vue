<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Gestión de Imágenes (Enlaces)</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Ingresa los enlaces (por ejemplo de SharePoint) para las imágenes de este artículo.
                </p>
            </div>
        </div>

        <div class="space-y-4">
            <div class="form-field">
                <label for="url1">URL Imagen 1 (Principal)</label>
                <div class="flex gap-2">
                    <input id="url1" v-model="internalUrl1" type="url" placeholder="https://mabelgroup.sharepoint.com/..." class="flex-1" />
                    <a v-if="internalUrl1" :href="internalUrl1" target="_blank" class="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg font-medium hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        Ver enlace
                    </a>
                </div>
            </div>
            
            <div class="form-field">
                <label for="url2">URL Imagen 2</label>
                <div class="flex gap-2">
                    <input id="url2" v-model="internalUrl2" type="url" placeholder="https://mabelgroup.sharepoint.com/..." class="flex-1" />
                    <a v-if="internalUrl2" :href="internalUrl2" target="_blank" class="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg font-medium hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        Ver enlace
                    </a>
                </div>
            </div>
            
            <div class="form-field">
                <label for="url3">URL Imagen 3</label>
                <div class="flex gap-2">
                    <input id="url3" v-model="internalUrl3" type="url" placeholder="https://mabelgroup.sharepoint.com/..." class="flex-1" />
                    <a v-if="internalUrl3" :href="internalUrl3" target="_blank" class="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg font-medium hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        Ver enlace
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    urlImagen1?: string | null
    urlImagen2?: string | null
    urlImagen3?: string | null
}>()

const emit = defineEmits<{
    (e: 'update:urlImagen1', value: string): void
    (e: 'update:urlImagen2', value: string): void
    (e: 'update:urlImagen3', value: string): void
}>()

const internalUrl1 = computed({
    get: () => props.urlImagen1 || '',
    set: (val) => emit('update:urlImagen1', val)
})

const internalUrl2 = computed({
    get: () => props.urlImagen2 || '',
    set: (val) => emit('update:urlImagen2', val)
})

const internalUrl3 = computed({
    get: () => props.urlImagen3 || '',
    set: (val) => emit('update:urlImagen3', val)
})
</script>

<style scoped>
.form-field {
    @apply flex flex-col gap-1.5;
}
.form-field label {
    @apply text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide;
}
.form-field input {
    @apply w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900
           px-3 py-2 text-sm text-gray-900 dark:text-white
           placeholder:text-gray-400 dark:placeholder:text-gray-600
           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all;
}
</style>
