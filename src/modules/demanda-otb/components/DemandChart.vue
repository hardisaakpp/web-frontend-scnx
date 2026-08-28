<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useThemeStore } from '@/stores/theme'
import type { DemandaSeriePunto } from '../types'

const props = defineProps<{ serie: DemandaSeriePunto[] }>()
const themeStore = useThemeStore()

const categories = computed(() => props.serie.map(p => p.mes))

const series = computed(() => [
  { name: 'Historia', data: props.serie.map(p => p.historia) },
  { name: 'Proyección', data: props.serie.map(p => p.proyeccion) },
  { name: 'Máx 80%', data: props.serie.map(p => p.max80) },
  { name: 'Mín 80%', data: props.serie.map(p => p.min80) },
])

const chartOptions = computed<ApexOptions>(() => {
  const dark = themeStore.isDark
  const axisColor = dark ? '#9ca3af' : '#6b7280'
  const gridColor = dark ? '#374151' : '#e5e7eb'
  const legendColor = dark ? '#e5e7eb' : '#374151'

  return {
    chart: {
      type: 'line',
      toolbar: { show: false },
      background: 'transparent',
    },
    theme: { mode: dark ? 'dark' : 'light' },
    colors: ['#3b82f6', '#f59e0b', '#a5b4fc', '#93c5fd'],
    stroke: {
      curve: 'straight',
      width: [3, 2, 1, 1],
      dashArray: [0, 6, 3, 3],
    },
    markers: {
      size: [0, 4, 0, 0],
      strokeWidth: 0,
    },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    xaxis: {
      categories: categories.value,
      labels: {
        style: { colors: axisColor, fontSize: '11px' },
        rotate: -45,
        hideOverlappingLabels: true,
      },
      tickAmount: Math.min(12, categories.value.length),
    },
    yaxis: {
      title: { text: 'Unidades', style: { color: axisColor } },
      labels: { style: { colors: axisColor } },
    },
    legend: { labels: { colors: legendColor }, fontSize: '13px' },
    tooltip: { theme: dark ? 'dark' : 'light', shared: true },
  }
})
</script>

<template>
  <VueApexCharts type="line" height="380" :options="chartOptions" :series="series" />
</template>
