<template>
  <div
    :class="containerClass"
    role="status"
    :aria-label="computedAriaLabel"
    aria-live="polite"
  >
    <span
      :class="[spinnerClass, colorClass]"
      aria-hidden="true"
    ></span>
    <span v-if="message" :class="messageClass">{{ message }}</span>
    <span v-else class="sr-only">{{ computedAriaLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity'

type LoadingColor = 'current' | 'indigo' | 'emerald' | 'blue' | 'violet' | 'purple' | 'red' | 'amber' | 'gray'
type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type LoadingLayout = 'inline' | 'block' | 'center'

const props = withDefaults(defineProps<{
  message?: string
  size?: LoadingSize
  color?: LoadingColor
  layout?: LoadingLayout
  ariaLabel?: string
}>(), {
  size: 'lg',
  color: 'indigo',
  layout: 'block'
})

const sizeClasses: Record<LoadingSize, string> = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-4',
  xl: 'w-12 h-12 border-4'
}

const colorClasses: Record<LoadingColor, string> = {
  current: 'text-current',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
  violet: 'text-violet-600 dark:text-violet-400',
  purple: 'text-purple-600 dark:text-purple-400',
  red: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
  gray: 'text-gray-600 dark:text-gray-400'
}

const layoutClasses: Record<LoadingLayout, string> = {
  inline: 'inline-flex items-center justify-center gap-2 align-middle',
  block: 'flex flex-col items-center justify-center py-12',
  center: 'flex flex-col items-center justify-center py-8'
}

const containerClass = computed(() => layoutClasses[props.layout])
const colorClass = computed(() => colorClasses[props.color])
const spinnerClass = computed(() => [
  'inline-block rounded-full animate-spin border-current border-t-transparent shrink-0',
  sizeClasses[props.size]
])
const messageClass = computed(() => props.layout === 'inline'
  ? 'text-sm text-current'
  : 'mt-4 text-sm text-gray-600 dark:text-gray-400')
const computedAriaLabel = computed(() => props.ariaLabel || props.message || 'Cargando')
</script>

