<script setup lang="ts">
import { computed } from 'vue'
import { useTemaStore, TEMA_DEFECTO } from '../stores/temaStore'
import { TIPOGRAFIAS_DISPONIBLES } from '../constants/tipografias'
import type { TipografiaConfig } from '../types'

const temaStore = useTemaStore()
const tipografia = computed<TipografiaConfig>(() => temaStore.temaBorrador.tipografia ?? TEMA_DEFECTO.tipografia!)

function actualizar(patch: Partial<TipografiaConfig>) {
  temaStore.actualizarBorrador({ tipografia: { ...tipografia.value, ...patch } })
}
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Familia tipográfica</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="opcion in TIPOGRAFIAS_DISPONIBLES"
          :key="opcion.id"
          @click="actualizar({ familia: opcion.familia })"
          class="px-3 py-2.5 rounded-xl border text-sm text-left transition-colors"
          :class="tipografia.familia === opcion.familia
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300'"
          :style="`font-family: ${opcion.familia}`"
        >
          {{ opcion.etiqueta }}
        </button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-600 dark:text-gray-400">Forzar MAYÚSCULAS</span>
        <button
          @click="actualizar({ mayusculas: !tipografia.mayusculas })"
          role="switch" :aria-checked="tipografia.mayusculas"
          class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
          :class="tipografia.mayusculas ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'"
        >
          <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="tipografia.mayusculas ? 'translate-x-6' : 'translate-x-1'" />
        </button>
      </div>

      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-600 dark:text-gray-400">Orientación del texto</span>
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
          <button
            v-for="opcion in (['arco', 'radial'] as const)"
            :key="opcion"
            @click="actualizar({ orientacion: opcion })"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors"
            :class="tipografia.orientacion === opcion
              ? 'bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
          >
            {{ opcion }}
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-sm text-gray-600 dark:text-gray-400">Sombra del texto</span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-gray-400">{{ tipografia.sombra_intensidad }}%</span>
            <div class="w-7 h-7 rounded-lg border-2 border-gray-200 dark:border-gray-600 overflow-hidden" :style="`background: ${tipografia.sombra_color ?? '#000000'}`">
              <input type="color" :value="tipografia.sombra_color ?? '#000000'" @input="actualizar({ sombra_color: ($event.target as HTMLInputElement).value })" class="opacity-0 w-full h-full cursor-pointer" />
            </div>
          </div>
        </div>
        <input
          type="range" min="0" max="100" step="5" :value="tipografia.sombra_intensidad"
          @input="actualizar({ sombra_intensidad: Number(($event.target as HTMLInputElement).value) })"
          class="w-full accent-violet-600"
        />
      </div>
    </div>
  </div>
</template>
