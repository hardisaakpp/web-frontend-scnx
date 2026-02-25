<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Contenido de las pestañas -->
    <div class="p-6">
      <slot :name="`tab-${activeTab}`" :tab="activeTab">
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">
          No hay contenido disponible
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from '@vue/reactivity'
import type { Tab } from '../types'

const props = withDefaults(defineProps<{
  tabs: Tab[]
  defaultTab?: string
  disabled?: boolean
}>(), {
  defaultTab: undefined,
  disabled: false
})

const emit = defineEmits<{
  'tab-changed': [tabId: string]
}>()

const activeTab = ref<string>(props.defaultTab || props.tabs[0]?.id || '')

function selectTab(tabId: string) {
  if (props.disabled) {
    return
  }
  activeTab.value = tabId
  emit('tab-changed', tabId)
}

watch(() => props.defaultTab, (newTab: string | undefined) => {
  if (newTab && newTab !== activeTab.value) {
    activeTab.value = newTab
  }
})

function getTabClass(tab: Tab, index: number): string {
  const isActive = activeTab.value === tab.id
  
  if (isActive) {
    // Pestaña activa
    const colorClasses: Record<string, string> = {
      violet: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-l-4 border-violet-500 dark:border-violet-400',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-500 dark:border-emerald-400',
      rose: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-l-4 border-rose-500 dark:border-rose-400',
      default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-l-4 border-gray-500 dark:border-gray-400'
    }
    return `${colorClasses[tab.color || 'default']} rounded-t-lg`
  }
  
  // Pestaña inactiva
  return 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200'
}

function getActiveIndicatorClass(tab: Tab): string {
  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    default: 'bg-gray-500'
  }
  return colorClasses[tab.color || 'default']
}

function getHoverGlowClass(tab: Tab): string {
  return ''
}

function getBadgeClass(tab: Tab): string {
  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-600',
    emerald: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600',
    rose: 'bg-rose-200 dark:bg-rose-800 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-600',
    default: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
  }
  return colorClasses[tab.color || 'default']
}

function getConnectorClass(tab: Tab): string {
  return ''
}
</script>

<style scoped>
/* Estilos simplificados */
</style>
