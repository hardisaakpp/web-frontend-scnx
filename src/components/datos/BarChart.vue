<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
      <span v-if="total > 0" class="text-sm text-gray-500 dark:text-gray-400">Total: {{ total }}</span>
    </div>
    <div v-if="total > 0" class="space-y-3">
      <div
        v-for="(item, index) in data"
        :key="index"
        class="flex items-center gap-3"
      >
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ item.label }}</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.value }} ({{ percentage(item.value) }}%)</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              :class="item.color"
              class="h-full rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${percentage(item.value)}%` }"
            ></div>
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

interface BarChartData {
  label: string
  value: number
  color: string
}

const props = defineProps<{
  title: string
  data: BarChartData[]
}>()

const total = computed(() => props.data.reduce((sum, item) => sum + item.value, 0))

function percentage(value: number): number {
  if (total.value === 0) return 0
  return Math.round((value / total.value) * 100)
}
</script>
