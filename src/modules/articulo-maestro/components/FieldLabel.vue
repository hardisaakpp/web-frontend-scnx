<!--
    Label estandarizado de `.form-field`: sustituye el patrón repetido
    `<label>...</label>` + `:title="isEdit ? LOCK_REASON.x : ''"` en el
    control + `<span class="help">{{ LOCK_REASON.x }}</span>` (40+
    ocurrencias en FormularioArticulo.vue) por un único micro-candado con
    tooltip bajo demanda, sin duplicar el motivo de bloqueo en tres lugares.
-->
<template>
    <label :for="fieldId" class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <span>{{ text }}</span>
        <LockBadge v-if="locked" :reason="reason" />
    </label>
</template>

<script setup lang="ts">
import LockBadge from './LockBadge.vue'

withDefaults(defineProps<{
    fieldId: string
    text: string
    locked?: boolean
    reason?: string
}>(), {
    locked: false,
    reason: '',
})
</script>
