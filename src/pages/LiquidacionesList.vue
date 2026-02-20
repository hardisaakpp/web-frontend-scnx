<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Liquidaciones</h1>
    <button class="mb-4 px-4 py-2 bg-blue-600 text-white rounded" @click="goToCreate">Nueva Liquidación</button>
    <table class="min-w-full bg-white border">
      <thead>
        <tr>
          <th class="py-2 px-4 border-b">ID</th>
          <th class="py-2 px-4 border-b">Fecha Creación</th>
          <th class="py-2 px-4 border-b">Almacén</th>
          <th class="py-2 px-4 border-b">Empresa</th>
          <th class="py-2 px-4 border-b">Estado</th>
          <th class="py-2 px-4 border-b">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="liq in liquidaciones" :key="liq.idLiquidacion">
          <td class="py-2 px-4 border-b">{{ liq.idLiquidacion }}</td>
          <td class="py-2 px-4 border-b">{{ formatDate(liq.fechaCreacion) }}</td>
          <td class="py-2 px-4 border-b">{{ liq.codAlmacen }}</td>
          <td class="py-2 px-4 border-b">{{ liq.empresa }}</td>
          <td class="py-2 px-4 border-b">{{ liq.estado }}</td>
          <td class="py-2 px-4 border-b">
            <button class="text-blue-600" @click="view(liq.idLiquidacion)">Ver</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const liquidaciones = ref<any[]>([]);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function goToCreate() {
  router.push({ name: 'CrearLiquidacion' });
}

function view(id: number) {
  router.push({ name: 'VerLiquidacion', params: { id } });
}

async function fetchLiquidaciones() {
  const res = await fetch('/api/liquidaciones');
  if (res.ok) {
    liquidaciones.value = await res.json();
  }
}

onMounted(fetchLiquidaciones);
</script>

<style scoped>
.container { max-width: 900px; }
</style>
