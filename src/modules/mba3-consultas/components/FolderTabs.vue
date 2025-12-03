<template>
  <div class="bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden relative">
    <!-- Efecto de brillo sutil en el fondo -->
    <div class="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none"></div>
    
    <!-- Pestañas tipo carpeta con efecto Liquid Glass -->
    <div class="flex border-b border-white/30 bg-gradient-to-b from-white/30 to-white/10 backdrop-blur-md relative">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id"
        @click="selectTab(tab.id)"
        :disabled="disabled"
        class="relative flex-1 px-4 py-4 font-medium text-sm transition-all duration-300 focus:outline-none text-center group disabled:opacity-50 disabled:cursor-not-allowed"
        :class="getTabClass(tab, index)"
      >
        <!-- Efecto de pestaña tipo carpeta -->
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <span class="whitespace-nowrap">{{ tab.label }}</span>
          <span v-if="tab.badge" class="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" :class="getBadgeClass(tab)">
            {{ tab.badge }}
          </span>
        </div>
        
        <!-- Efecto de brillo en hover -->
        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg"
             :class="getHoverGlowClass(tab)"></div>
        
        <!-- Indicador de pestaña activa (línea inferior con efecto glass) -->
        <div
          v-if="activeTab === tab.id"
          class="absolute bottom-0 left-0 right-0 h-1 transition-all duration-300 rounded-t-full shadow-lg"
          :class="getActiveIndicatorClass(tab)"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
        
        <!-- Conector tipo carpeta (solo en escritorio, para las no activas) -->
        <div
          v-if="index < tabs.length - 1 && activeTab !== tab.id"
          class="hidden md:block absolute top-0 -right-4 w-4 h-full z-10"
          :class="getConnectorClass(tab)"
          style="clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 20% 50%)"
        ></div>
      </button>
    </div>

    <!-- Contenido de las pestañas -->
    <div class="p-6">
      <slot :name="`tab-${activeTab}`" :tab="activeTab">
        <div class="text-center py-12 text-gray-500">
          No hay contenido disponible
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

watch(() => props.defaultTab, (newTab) => {
  if (newTab) {
    activeTab.value = newTab
  }
})

function getTabClass(tab: Tab, index: number): string {
  const isActive = activeTab.value === tab.id
  
  if (isActive) {
    // Pestaña activa: efecto Liquid Glass con gradiente y brillo
    const colorClasses: Record<string, string> = {
      violet: 'bg-gradient-to-b from-violet-100/80 to-violet-50/60 text-violet-700 backdrop-blur-sm border-l-4 border-violet-400/80 shadow-lg shadow-violet-200/50',
      emerald: 'bg-gradient-to-b from-emerald-100/80 to-emerald-50/60 text-emerald-700 backdrop-blur-sm border-l-4 border-emerald-400/80 shadow-lg shadow-emerald-200/50',
      rose: 'bg-gradient-to-b from-rose-100/80 to-rose-50/60 text-rose-700 backdrop-blur-sm border-l-4 border-rose-400/80 shadow-lg shadow-rose-200/50',
      default: 'bg-gradient-to-b from-gray-100/80 to-gray-50/60 text-gray-700 backdrop-blur-sm border-l-4 border-gray-400/80 shadow-lg shadow-gray-200/50'
    }
    return `${colorClasses[tab.color || 'default']} rounded-tl-xl rounded-tr-xl relative z-10`
  }
  
  // Pestaña inactiva: efecto glass sutil con hover mejorado
  return 'text-gray-600/80 hover:text-gray-900 hover:bg-white/40 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:shadow-gray-200/30'
}

function getActiveIndicatorClass(tab: Tab): string {
  const colorClasses: Record<string, string> = {
    violet: 'bg-gradient-to-r from-violet-400 via-violet-500 to-violet-400',
    emerald: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400',
    rose: 'bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400',
    default: 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400'
  }
  return colorClasses[tab.color || 'default']
}

function getHoverGlowClass(tab: Tab): string {
  const colorClasses: Record<string, string> = {
    violet: 'bg-gradient-to-br from-violet-200/30 to-transparent',
    emerald: 'bg-gradient-to-br from-emerald-200/30 to-transparent',
    rose: 'bg-gradient-to-br from-rose-200/30 to-transparent',
    default: 'bg-gradient-to-br from-gray-200/30 to-transparent'
  }
  return colorClasses[tab.color || 'default']
}

function getBadgeClass(tab: Tab): string {
  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-200/80 backdrop-blur-sm text-violet-700 border border-violet-300/50 shadow-sm',
    emerald: 'bg-emerald-200/80 backdrop-blur-sm text-emerald-700 border border-emerald-300/50 shadow-sm',
    rose: 'bg-rose-200/80 backdrop-blur-sm text-rose-700 border border-rose-300/50 shadow-sm',
    default: 'bg-gray-200/80 backdrop-blur-sm text-gray-700 border border-gray-300/50 shadow-sm'
  }
  return colorClasses[tab.color || 'default']
}

function getConnectorClass(tab: Tab): string {
  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-50/40 backdrop-blur-sm',
    emerald: 'bg-emerald-50/40 backdrop-blur-sm',
    rose: 'bg-rose-50/40 backdrop-blur-sm',
    default: 'bg-gray-50/40 backdrop-blur-sm'
  }
  return colorClasses[tab.color || 'default']
}
</script>

<style scoped>
/* Efecto Liquid Glass mejorado */
button:has(.absolute.bottom-0) {
  position: relative;
  z-index: 1;
}

/* Animación suave para el brillo */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* Efecto de brillo animado en pestañas activas */
button.group::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transition: left 0.5s;
}

button.group:hover::before {
  left: 100%;
}

/* Mejora de transiciones */
button {
  position: relative;
  overflow: hidden;
}

/* Efecto de profundidad con múltiples sombras */
.bg-white\/80 {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
</style>
