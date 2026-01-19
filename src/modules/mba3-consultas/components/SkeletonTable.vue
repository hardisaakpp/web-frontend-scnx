<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
    <!-- Header skeleton -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
    </div>
    
    <!-- Table skeleton -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th v-for="i in columns" :key="i" class="px-6 py-3">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="i in rows" :key="i" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td v-for="j in columns" :key="j" class="px-6 py-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" :class="getWidthClass(j)"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  columns?: number
  rows?: number
}>()

const columns = 7
const rows = 5

function getWidthClass(index: number): string {
  const widths = ['w-32', 'w-24', 'w-28', 'w-20', 'w-16', 'w-24', 'w-20']
  return widths[index % widths.length] || 'w-24'
}
</script>
