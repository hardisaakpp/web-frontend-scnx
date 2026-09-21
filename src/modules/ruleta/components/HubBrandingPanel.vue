<script setup lang="ts">
import { computed } from 'vue'
import { useTemaStore, TEMA_DEFECTO } from '../stores/temaStore'

const temaStore = useTemaStore()

const hub = computed(() => temaStore.temaBorrador.hub ?? TEMA_DEFECTO.hub!)

function actualizarHub(patch: Partial<typeof hub.value>) {
  temaStore.actualizarBorrador({ hub: { ...hub.value, ...patch } })
}
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Disco central</h3>
      <label v-for="campo in ([
        { key: 'color_hub_fondo', etiqueta: 'Color de fondo del hub' },
        { key: 'color_hub_acento', etiqueta: 'Color de acento del hub' },
      ] as const)" :key="campo.key" class="flex items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
        {{ campo.etiqueta }}
        <input type="color" :value="temaStore.temaBorrador[campo.key]"
          @input="temaStore.actualizarBorrador({ [campo.key]: ($event.target as HTMLInputElement).value })"
          class="h-9 w-12 cursor-pointer rounded border border-gray-300" />
      </label>
    </div>

    <!-- Comportamiento -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Comportamiento</h3>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="hub-escala" class="text-sm text-gray-600 dark:text-gray-400">Escala del disco central</label>
          <span class="text-xs font-mono text-gray-400">{{ hub.escala.toFixed(1) }}x</span>
        </div>
        <input
          id="hub-escala" type="range" min="0.5" max="3" step="0.1" :value="hub.escala"
          @input="actualizarHub({ escala: Number(($event.target as HTMLInputElement).value) })"
          class="w-full accent-violet-600"
        />
      </div>

      <div class="flex items-center justify-between gap-3">
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-400 block">Rotación del disco central</span>
          <span class="text-xs text-gray-400">{{ hub.rotacion_fija ? 'Fijo (no gira con la rueda)' : 'Gira junto con los segmentos' }}</span>
        </div>
        <button
          @click="actualizarHub({ rotacion_fija: !hub.rotacion_fija })"
          role="switch" aria-label="Mantener disco central fijo" :aria-checked="hub.rotacion_fija"
          class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
          :class="hub.rotacion_fija ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'"
        >
          <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="hub.rotacion_fija ? 'translate-x-6' : 'translate-x-1'" />
        </button>
      </div>

      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-600 dark:text-gray-400">Borde decorativo</span>
        <button
          @click="actualizarHub({ borde_decorativo: !hub.borde_decorativo })"
          role="switch" aria-label="Borde decorativo" :aria-checked="hub.borde_decorativo"
          class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
          :class="hub.borde_decorativo ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'"
        >
          <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="hub.borde_decorativo ? 'translate-x-6' : 'translate-x-1'" />
        </button>
      </div>
    </div>
  </div>
</template>
