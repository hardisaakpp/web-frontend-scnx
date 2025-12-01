<template>
  <div class="bg-white rounded-lg shadow p-8 border border-gray-200 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div 
        v-for="(step, index) in getSteps()" 
        :key="step.id"
        class="flex flex-col items-center text-center p-6 rounded-lg transition-all"
        :class="getStepClasses(step.status)"
      >
        <div 
          class="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-sm border"
          :class="getIconClasses(step.status)"
        >
          <span v-if="step.status === 'completed'">✓</span>
          <span v-else-if="step.status === 'active'" class="animate-pulse">⟳</span>
          <span v-else>{{ (index as number) + 1 }}</span>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold mb-2" :class="getTitleClasses(step.status)">{{ step.title }}</h3>
          <p class="text-sm opacity-80" :class="getDescriptionClasses(step.status)">{{ step.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="progress > 0" class="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
      <div 
        class="h-full bg-gradient-to-r from-indigo-600 to-indigo-700 transition-all duration-300 ease-out"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Step {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed'
}

const props = defineProps<{
  currentStep: string | null
  progress: number
}>()

const baseSteps: Omit<Step, 'status'>[] = [
  {
    id: 'consultar',
    title: 'Consultar',
    description: 'Consulta datos desde MBA3'
  },
  {
    id: 'migrar',
    title: 'Migrar',
    description: 'Guarda en base de datos'
  },
  {
    id: 'procesar-oc',
    title: 'Procesar OC',
    description: 'Copia a órdenes de compra'
  },
  {
    id: 'integrar-sap',
    title: 'Integrar SAP',
    description: 'Envía a SAP Service Layer'
  }
]

function getStepStatus(stepId: string): 'pending' | 'active' | 'completed' {
  if (!props.currentStep) return 'pending'
  
  const stepOrder = ['consultar', 'migrar', 'procesar-oc', 'integrar-sap']
  const currentIndex = stepOrder.indexOf(props.currentStep)
  const stepIndex = stepOrder.indexOf(stepId)
  
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

function getSteps(): Step[] {
  return baseSteps.map(step => ({
    ...step,
    status: getStepStatus(step.id)
  }))
}

function getStepClasses(status: 'pending' | 'active' | 'completed'): string {
  const baseClasses = 'border'
  if (status === 'pending') return `${baseClasses} bg-gray-50 border-gray-200`
  if (status === 'active') return `${baseClasses} bg-indigo-50 border-indigo-300 shadow-lg scale-105`
  return `${baseClasses} bg-green-50 border-green-200`
}

function getIconClasses(status: 'pending' | 'active' | 'completed'): string {
  if (status === 'pending') return 'bg-gray-100 text-gray-400 border-gray-200'
  if (status === 'active') return 'bg-indigo-600 text-white border-indigo-700'
  return 'bg-green-600 text-white border-green-700'
}

function getTitleClasses(status: 'pending' | 'active' | 'completed'): string {
  if (status === 'pending') return 'text-gray-400'
  if (status === 'active') return 'text-indigo-700'
  return 'text-green-700'
}

function getDescriptionClasses(status: 'pending' | 'active' | 'completed'): string {
  if (status === 'pending') return 'text-gray-500'
  if (status === 'active') return 'text-indigo-600'
  return 'text-green-600'
}
</script>


