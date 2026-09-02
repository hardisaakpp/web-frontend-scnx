<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useThemeStore } from '@/stores/theme'
import type { DesgloseGrupo, DesgloseResponse } from '../types'

const props = withDefaults(defineProps<{
  titulo: string
  desglose: DesgloseResponse
  topN?: number
}>(), {
  topN: 8,
})

const themeStore = useThemeStore()

// Top-N + "Otras": el backend ya envía los grupos ordenados por peso — solo agrupamos
// la cola en un solo renglón para que el gráfico no se vuelva ilegible con 30+ marcas.
const filas = computed<DesgloseGrupo[]>(() => {
  const grupos = props.desglose.grupos
  if (grupos.length <= props.topN) return grupos

  const top = grupos.slice(0, props.topN)
  const resto = grupos.slice(props.topN)
  const otras: DesgloseGrupo = {
    valor: `Otras (${resto.length})`,
    nSkus: resto.reduce((acc, g) => acc + g.nSkus, 0),
    prediccionProximoMes: resto.reduce((acc, g) => acc + g.prediccionProximoMes, 0),
    // El rango 80% no es la suma de los rangos individuales (cuadratura) — no se puede
    // reconstruir para "Otras" agrupando, y tampoco se muestra en la tabla, así que queda en 0.
    rangoMin80: 0,
    rangoMax80: 0,
    totalHorizonte: resto.reduce((acc, g) => acc + g.totalHorizonte, 0),
    pct: resto.reduce((acc, g) => acc + g.pct, 0),
  }
  return [...top, otras]
})

const categories = computed(() => filas.value.map(f => f.valor))
const series = computed(() => [{ name: 'Unidades (12m)', data: filas.value.map(f => f.totalHorizonte) }])

const chartOptions = computed<ApexOptions>(() => {
  const dark = themeStore.isDark
  const axisColor = dark ? '#9ca3af' : '#6b7280'
  const gridColor = dark ? '#374151' : '#e5e7eb'
  const pctByIndex = filas.value.map(f => f.pct)

  return {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
    },
    theme: { mode: dark ? 'dark' : 'light' },
    colors: ['#22d3ee'],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '60%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 8,
      style: { colors: [axisColor], fontSize: '12px' },
      formatter: (_val, opts) => `${(pctByIndex[opts?.dataPointIndex ?? 0] ?? 0).toFixed(1)}%`,
    },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    xaxis: {
      categories: categories.value,
      title: { text: 'Unidades (12m)', style: { color: axisColor } },
      labels: { style: { colors: axisColor } },
    },
    yaxis: {
      labels: { style: { colors: axisColor } },
    },
    legend: { show: false },
    tooltip: {
      theme: dark ? 'dark' : 'light',
      y: { formatter: (val) => `${val.toFixed(1)} uds` },
    },
  }
})

const chartHeight = computed(() => Math.max(180, filas.value.length * 45))
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
    <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
      {{ titulo }} — {{ desglose.valor }} · próximo mes: {{ desglose.proximoMes }}
    </h4>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
      <VueApexCharts type="bar" :height="chartHeight" :options="chartOptions" :series="series" />

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="py-2 pr-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ titulo }}</th>
              <th class="py-2 pr-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Próximo mes</th>
              <th class="py-2 pr-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Total 12M</th>
              <th class="py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">%</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60">
            <tr v-for="f in filas" :key="f.valor">
              <td class="py-2 pr-4 text-gray-900 dark:text-white">{{ f.valor }}</td>
              <td class="py-2 pr-4 text-right text-gray-700 dark:text-gray-300">{{ f.prediccionProximoMes.toFixed(1) }}</td>
              <td class="py-2 pr-4 text-right text-gray-700 dark:text-gray-300">{{ f.totalHorizonte.toFixed(1) }}</td>
              <td class="py-2 text-right text-gray-700 dark:text-gray-300">{{ f.pct.toFixed(1) }}%</td>
            </tr>
            <tr class="font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700">
              <td class="py-2 pr-4">TOTAL</td>
              <td class="py-2 pr-4 text-right">{{ desglose.totalProx.toFixed(1) }}</td>
              <td class="py-2 pr-4 text-right">{{ desglose.totalHorizonte.toFixed(1) }}</td>
              <td class="py-2 text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
