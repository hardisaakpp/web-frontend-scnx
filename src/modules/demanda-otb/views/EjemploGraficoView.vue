<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { mockArticuloDemo } from '../mockData'

const articulo = mockArticuloDemo

const categories = computed(() => articulo.serie.map(p => p.mes))

const series = computed(() => [
  { name: 'Historia', data: articulo.serie.map(p => p.historia) },
  { name: 'Proyección', data: articulo.serie.map(p => p.proyeccion) },
  { name: 'Máx 80%', data: articulo.serie.map(p => p.max80) },
  { name: 'Mín 80%', data: articulo.serie.map(p => p.min80) },
])

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    background: 'transparent',
  },
  theme: { mode: 'dark' },
  colors: ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444'],
  stroke: {
    curve: 'straight',
    width: [3, 2, 1.5, 1.5],
    dashArray: [0, 6, 4, 4],
  },
  markers: {
    size: [0, 4, 0, 0],
    strokeWidth: 0,
  },
  grid: { borderColor: '#374151' },
  xaxis: {
    categories: categories.value,
    labels: { style: { colors: '#9ca3af' } },
  },
  yaxis: {
    title: { text: 'Unidades', style: { color: '#9ca3af' } },
    labels: { style: { colors: '#9ca3af' } },
  },
  legend: { labels: { colors: '#e5e7eb' } },
  tooltip: { theme: 'dark' },
}))
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-4">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Demanda OTB — Prueba de gráfico</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        POC con datos mock ({{ articulo.codigo }} — {{ articulo.descripcion }})
      </p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
      <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {{ articulo.codigo }} — CHOCOLATE SURTIDO FERRERO
      </h2>
      <VueApexCharts
        type="line"
        height="380"
        :options="chartOptions"
        :series="series"
      />
    </div>
  </div>
</template>
