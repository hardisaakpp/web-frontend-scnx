<template>
  <button
    v-if="puedeRechazar"
    type="button"
    @click="$emit('rechazar')"
    :disabled="rechazando"
    class="shrink-0 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    title="Rechazar este pedido"
  >
    {{ rechazando ? 'Rechazando...' : 'Rechazar' }}
  </button>
  <button
    v-if="puedeAceptar"
    type="button"
    @click="$emit('aceptar')"
    :disabled="aceptando"
    class="shrink-0 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    title="Aceptar la diferencia y enviarla a redistribución"
  >
    {{ aceptando ? 'Aceptando...' : 'Aceptar' }}
  </button>
</template>

<script setup lang="ts">
defineProps<{
  puedeRechazar: boolean
  puedeAceptar: boolean
  rechazando: boolean
  aceptando: boolean
}>()

defineEmits<{
  rechazar: []
  aceptar: []
}>()
</script>
