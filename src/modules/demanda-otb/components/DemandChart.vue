<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useThemeStore } from '@/stores/theme'
import type { DemandaSeriePunto } from '../types'

const props = defineProps<{ serie: DemandaSeriePunto[] }>()
const themeStore = useThemeStore()

const categories = computed(() => props.serie.map(p => p.mes))

interface ChartSeriesItem {
  name: string
  data: (number | null)[]
  color: string
  strokeWidth: number
  dashArray: number
  markerSize: number
}

const seriesConfig = computed<ChartSeriesItem[]>(() => {
  const items: ChartSeriesItem[] = []

  // Historia
  items.push({
    name: 'Historia',
    data: props.serie.map(p => p.historia ?? null),
    color: '#3b82f6', // blue-500
    strokeWidth: 3,
    dashArray: 0,
    markerSize: 0,
  })

  // Historia Comparable (si viene en la respuesta)
  const hasHistoriaComp = props.serie.some(p => p.historiaComparable !== undefined && p.historiaComparable !== null)
  if (hasHistoriaComp) {
    items.push({
      name: 'Historia Comparable',
      data: props.serie.map(p => p.historiaComparable ?? null),
      color: '#06b6d4', // cyan-500
      strokeWidth: 2,
      dashArray: 4,
      markerSize: 0,
    })
  }

  // Proyección
  items.push({
    name: 'Proyección',
    data: props.serie.map(p => p.proyeccion ?? null),
    color: '#f59e0b', // amber-500
    strokeWidth: 2.5,
    dashArray: 6,
    markerSize: 4,
  })

  // Rango 80%
  items.push(
    {
      name: 'Máx 80%',
      data: props.serie.map(p => p.max80 ?? null),
      color: '#818cf8', // indigo-400
      strokeWidth: 1.5,
      dashArray: 3,
      markerSize: 0,
    },
    {
      name: 'Mín 80%',
      data: props.serie.map(p => p.min80 ?? null),
      color: '#93c5fd', // blue-300
      strokeWidth: 1.5,
      dashArray: 3,
      markerSize: 0,
    }
  )

  // Rango 95% (si viene en la respuesta)
  const hasRange95 = props.serie.some(p => (p.max95 !== undefined && p.max95 !== null) || (p.min95 !== undefined && p.min95 !== null))
  if (hasRange95) {
    items.push(
      {
        name: 'Máx 95%',
        data: props.serie.map(p => p.max95 ?? null),
        color: '#c084fc', // purple-400
        strokeWidth: 1,
        dashArray: 2,
        markerSize: 0,
      },
      {
        name: 'Mín 95%',
        data: props.serie.map(p => p.min95 ?? null),
        color: '#e879f9', // fuchsia-400
        strokeWidth: 1,
        dashArray: 2,
        markerSize: 0,
      }
    )
  }

  return items
})

const series = computed(() => seriesConfig.value.map(s => ({ name: s.name, data: s.data })))

const chartOptions = computed<ApexOptions>(() => {
  const dark = themeStore.isDark
  const axisColor = dark ? '#9ca3af' : '#6b7280'
  const gridColor = dark ? '#374151' : '#e5e7eb'
  const legendColor = dark ? '#e5e7eb' : '#374151'

  const configs = seriesConfig.value

  return {
    chart: {
      type: 'line',
      toolbar: { show: false },
      background: 'transparent',
    },
    theme: { mode: dark ? 'dark' : 'light' },
    colors: configs.map(s => s.color),
    stroke: {
      curve: 'straight',
      width: configs.map(s => s.strokeWidth),
      dashArray: configs.map(s => s.dashArray),
    },
    markers: {
      size: configs.map(s => s.markerSize),
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
