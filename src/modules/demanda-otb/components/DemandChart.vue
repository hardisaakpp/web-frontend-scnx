<script setup lang="ts">
import { computed, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useThemeStore } from '@/stores/theme'
import type { DemandaSeriePunto } from '../types'

const props = defineProps<{ serie: DemandaSeriePunto[] }>()
const themeStore = useThemeStore()

// "2026-03" -> "Mar 2026", igual que la regleta de meses del legacy.
function formatMes(mes: string): string {
  const [anio, mesNum] = mes.split('-')
  const fecha = new Date(Number(anio), Number(mesNum) - 1, 1)
  const etiqueta = fecha.toLocaleDateString('es', { month: 'short', year: 'numeric' })
  return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1).replace('.', '')
}

const categories = computed(() => props.serie.map(p => formatMes(p.mes)))

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

/**
 * El detalle punto-por-punto NO se muestra como tooltip flotante — sin importar si
 * se ancla al dato o se fija en una esquina, siempre termina tapando parte de la
 * línea que el usuario está mirando (más aún con hasta 7 series). En vez de eso,
 * el hover solo actualiza `hoveredIndex` (vía tooltip.custom, que ya resuelve el
 * mes más cercano al cursor aunque no se esté justo sobre un punto) y el detalle
 * se pinta en una fila de ancho completo ARRIBA del gráfico — nunca se superpone
 * porque no vive dentro del área de dibujo.
 */
const hoveredIndex = ref<number | null>(null)

interface TooltipRow {
  name: string
  color: string
  display: string
}

const hoveredMes = computed(() => (hoveredIndex.value !== null ? categories.value[hoveredIndex.value] ?? '' : ''))

const hoveredRows = computed<TooltipRow[] | null>(() => {
  if (hoveredIndex.value === null) return null
  const idx = hoveredIndex.value
  return seriesConfig.value.map(cfg => {
    const raw = cfg.data[idx]
    const display = raw === null || raw === undefined || Number.isNaN(raw) ? '—' : raw.toFixed(2)
    return { name: cfg.name, color: cfg.color, display }
  })
})

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
      events: {
        mouseLeave: () => {
          hoveredIndex.value = null
        },
      },
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
      // Un punto de Historia rodeado de meses sin dato (null) igual dibuja un
      // círculo aislado por defecto, aunque el size sea 0 — así salían esos
      // "huecos" con puntos sueltos en vez de solo el corte de línea esperado.
      showNullDataPoints: false,
    },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    xaxis: {
      categories: categories.value,
      labels: {
        style: { colors: axisColor, fontSize: '11px' },
        rotate: 0,
        hideOverlappingLabels: true,
      },
      tickAmount: Math.min(12, categories.value.length),
    },
    yaxis: {
      title: { text: 'Unidades', style: { color: axisColor } },
      labels: {
        style: { colors: axisColor },
        formatter: (val: number) => val.toFixed(2),
      },
    },
    legend: { labels: { colors: legendColor }, fontSize: '13px' },
    tooltip: {
      shared: true,
      intersect: false,
      // Sin contenido visual propio — solo dispara el cálculo de "mes más
      // cercano al cursor" de ApexCharts y lo volcamos en hoveredIndex. La caja
      // flotante que normalmente pintaría queda oculta por CSS más abajo.
      custom: (opts: { dataPointIndex: number }) => {
        hoveredIndex.value = opts.dataPointIndex
        return ''
      },
    },
  }
})
</script>

<template>
  <div>
    <div class="mb-2 min-h-[3rem] rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-1">
      <template v-if="hoveredRows">
        <span class="text-xs font-bold text-gray-900 dark:text-gray-100">{{ hoveredMes }}</span>
        <span v-for="row in hoveredRows" :key="row.name" class="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: row.color }"></span>
          {{ row.name }}: <span class="font-semibold text-gray-900 dark:text-gray-100">{{ row.display }}</span>
        </span>
      </template>
      <span v-else class="text-xs text-gray-400 dark:text-gray-500">Pasa el mouse sobre el gráfico para ver el detalle de cada mes.</span>
    </div>
    <div class="demand-chart-hide-tooltip">
      <VueApexCharts type="line" height="380" :options="chartOptions" :series="series" />
    </div>
  </div>
</template>

<style scoped>
/* El detalle vive en la fila de arriba — la caja flotante nativa de ApexCharts
   (vacía, por el tooltip.custom de arriba) se oculta para que no deje un
   recuadro fantasma sobre el gráfico. */
.demand-chart-hide-tooltip :deep(.apexcharts-tooltip) {
  display: none !important;
}
</style>
