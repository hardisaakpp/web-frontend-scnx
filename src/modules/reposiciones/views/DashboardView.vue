<script setup lang="ts">
import { 
  BuildingStorefrontIcon, 
  PresentationChartLineIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'

const options = [
  {
    title: 'Operativa de Tienda',
    description: 'Solicita artículos, gestiona tu carrito y revisa el historial específico de tus bodegas asignadas.',
    link: '/reposiciones/catalogo',
    icon: BuildingStorefrontIcon,
    color: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100 hover:border-emerald-500'
  },
  {
    title: 'Control Administrativo',
    description: 'Accede al panel de control global, consulta el historial de todas las tiendas y descarga reportes consolidados.',
    link: '/reposiciones/admin/historial',
    icon: PresentationChartLineIcon,
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100 hover:border-blue-500'
  }
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">Bienvenido al Módulo de Reposiciones</h1>
      <p class="text-xl text-gray-500 dark:text-gray-400">Selecciona el perfil con el que deseas trabajar hoy.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      <router-link 
        v-for="opt in options" 
        :key="opt.title" 
        :to="opt.link"
        class="group bg-white dark:bg-gray-800 p-8 rounded-3xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl transform hover:-translate-y-1"
        :class="opt.border"
      >
        <div class="flex flex-col h-full">
          <div :class="[opt.color, 'p-4 rounded-2xl w-fit mb-6 shadow-inner']">
            <component :is="opt.icon" class="w-10 h-10" />
          </div>
          
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center group-hover:text-current transition-colors">
            {{ opt.title }}
            <ChevronRightIcon class="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
          </h3>
          
          <p class="text-gray-500 dark:text-gray-400 leading-relaxed">
            {{ opt.description }}
          </p>

          <div class="mt-auto pt-8">
            <span class="inline-flex items-center text-sm font-bold uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">
              Entrar ahora
            </span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
