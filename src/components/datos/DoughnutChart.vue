<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
    </div>
    <div v-if="total > 0" class="flex flex-col md:flex-row items-center gap-6">
      <!-- SVG Chart -->
      <div class="relative" style="width: 200px; height: 200px;">
        <svg viewBox="0 0 100 100" class="transform -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="8" />
          <circle
            v-for="(segment, index) in segments"
            :key="index"
            cx="50"
            cy="50"
            r="40"
            fill="none"
            :stroke="segment.color"
            stroke-width="8"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.offset"
            stroke-linecap="round"
            class="transition-all duration-500"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ total }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex-1 space-y-2">
        <div
          v-for="(item, index) in data"
          :key="index"
          class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: item.color }"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ item.label }}</span>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.value }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ percentage(item.value) }}%</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>No hay datos para mostrar</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface DoughnutChartData {
  label: string
  value: number
  color: string
}

const props = defineProps<{
  title: string
  data: DoughnutChartData[]
}>()

const total = computed(() => props.data.reduce((sum, item) => sum + item.value, 0))
const circumference = 2 * Math.PI * 40 // radius = 40

const segments = computed(() => {
  if (total.value === 0) return []

  let currentOffset = 0
  return props.data.map((item) => {
    const percentageValue = item.value / total.value
    const dashLength = percentageValue * circumference
    const offset = circumference - currentOffset
    const dashArray = `${dashLength} ${circumference}`
    currentOffset += dashLength
    return { color: item.color, dashArray, offset }
  })
})

function percentage(value: number): number {
  if (total.value === 0) return 0
  return Math.round((value / total.value) * 100)
}
</script>
