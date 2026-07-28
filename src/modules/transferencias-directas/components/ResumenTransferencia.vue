<script setup lang="ts">
import { computed } from 'vue'
import type { DetalleLinea } from '../types'

const props = defineProps<{ productos: DetalleLinea[] }>()

// Total Productos = filas distintas (ya consolidadas por itemCode)
const totalProductos = computed(() => props.productos.length)
// Total Unidades = suma de cantidades
const totalUnidades = computed(() =>
  props.productos.reduce((acc, p) => acc + p.cantidadSolicitada, 0)
)
</script>

<template>
  <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-5">
    <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Resumen</h3>
    <dl class="space-y-4">
      <div>
        <dt class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Productos</dt>
        <dd class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ totalProductos }}</dd>
      </div>
      <div>
        <dt class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Unidades</dt>
        <dd class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ totalUnidades }}</dd>
      </div>
    </dl>
  </div>
</template>
