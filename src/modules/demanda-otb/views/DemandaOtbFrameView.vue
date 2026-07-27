<template>
  <iframe
    :src="dashboardUrl"
    title="Dashboard de Demanda OTB"
    class="block w-full h-[calc(100vh-4rem)] border-0"
  ></iframe>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dashboardPath: string
}>()

// Ruta relativa: Vite (dev) / Nginx (prod) la proxean al backend real sin exponer su IP al navegador.
const dashboardUrl = computed(() => `/demanda-otb/${props.dashboardPath}`)
</script>
