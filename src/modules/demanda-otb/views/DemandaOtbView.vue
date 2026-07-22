<template>
  <iframe
    :src="DASHBOARD_URL"
    title="Dashboard de Demanda OTB"
    class="block w-full h-[calc(100vh-4rem)] border-0"
  ></iframe>
</template>

<script setup lang="ts">
const DASHBOARD_URL = 'http://210.17.1.96:8001/demanda-otb/dashboard'
</script>
