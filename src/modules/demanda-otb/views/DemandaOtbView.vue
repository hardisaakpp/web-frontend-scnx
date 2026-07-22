<template>
  <iframe
    :src="DASHBOARD_URL"
    title="Dashboard de Demanda OTB"
    class="block w-full h-[calc(100vh-4rem)] border-0"
  ></iframe>
</template>

<script setup lang="ts">
// Ruta relativa: Vite (dev) / Nginx (prod) la proxean al backend real sin exponer su IP al navegador.
const DASHBOARD_URL = '/demanda-otb/dashboard'
</script>
