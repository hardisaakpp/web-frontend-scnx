<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-sm font-medium text-gray-500">{{ title }}</p>
        <p class="mt-2 text-3xl font-semibold" :class="valueColor">
          {{ formattedValue }}
        </p>
      </div>
      <div class="p-3 rounded-full" :class="iconBgColor">
        <component :is="icon" class="w-6 h-6" :class="iconColor" />
      </div>
    </div>
    <div v-if="trend" class="flex items-center text-sm">
      <span :class="trend > 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center">
        <svg v-if="trend > 0" class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        {{ Math.abs(trend) }}%
      </span>
      <span class="ml-2 text-gray-500">vs mes anterior</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NUMBER_LOCALE } from '@/plugins/locale'

interface Props {
  title: string
  value: number
  type: 'ingreso' | 'egreso' | 'balance'
  icon: any
  trend?: number
}

const props = defineProps<Props>()

const formattedValue = computed(() => {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: 'currency',
    currency: 'USD'
  }).format(props.value)
})

const valueColor = computed(() => {
  switch (props.type) {
    case 'ingreso': return 'text-green-600'
    case 'egreso': return 'text-red-600'
    case 'balance': return 'text-indigo-600'
    default: return 'text-gray-900'
  }
})

const iconBgColor = computed(() => {
  switch (props.type) {
    case 'ingreso': return 'bg-green-100'
    case 'egreso': return 'bg-red-100'
    case 'balance': return 'bg-indigo-100'
    default: return 'bg-gray-100'
  }
})

const iconColor = computed(() => {
  switch (props.type) {
    case 'ingreso': return 'text-green-600'
    case 'egreso': return 'text-red-600'
    case 'balance': return 'text-indigo-600'
    default: return 'text-gray-600'
  }
})
</script>
