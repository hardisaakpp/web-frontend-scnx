<template>
  <thead class="bg-gray-50 dark:bg-gray-900">
    <tr>
      <th
        v-if="showIndexColumn"
        class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12"
      >
        {{ indexLabel }}
      </th>
      <th
        v-for="column in columns"
        :key="column.key"
        @click="emit('toggle-sort', column.key)"
        :class="[
          'px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          column.align === 'center' ? 'text-center' : 'text-left'
        ]"
      >
        <div :class="['flex items-center gap-1', column.align === 'center' ? 'justify-center' : '']">
          {{ column.label }}
          <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
            <svg
              :class="['w-3 h-3 -mb-0.5', sortColumn === column.key && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']"
              viewBox="0 0 24 24"
              fill="currentColor"
            ><path d="M7 14l5-5 5 5z"/></svg>
            <svg
              :class="['w-3 h-3 -mt-0.5', sortColumn === column.key && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']"
              viewBox="0 0 24 24"
              fill="currentColor"
            ><path d="M7 10l5 5 5-5z"/></svg>
          </span>
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup lang="ts">
/**
 * <thead> genérico de "columna ordenable al clic", duplicado carácter por carácter (mismas clases
 * Tailwind, mismos 2 SVGs de flecha arriba/abajo) en los 4 listados de pedidos del módulo -- solo
 * cambia la lista de columnas (key/label/alineación) y, en RevisarRedistribucionListadoView.vue,
 * la etiqueta "Fecha" en vez de "Fecha Pedido" para la misma columna `fecha_pedido`.
 *
 * Renderiza SOLO el <thead>, no el <table> que lo envuelve -- se usa como hijo directo de la
 * <table> existente en cada vista, ej.:
 *   <table class="min-w-full ...">
 *     <SortableTableHead :columns="columns" :sort-column="sortColumn" :sort-direction="sortDirection" @toggle-sort="toggleSort" />
 *     <tbody>...</tbody>
 *   </table>
 * `sortColumn`/`sortDirection`/`toggleSort` son los que devuelve useSortableList (../composables/useSortableList.ts).
 *
 * No asume nada sobre qué columnas existen -- las recibe todas por prop. Los 4 listados actuales le
 * pasarían las mismas 8 columnas (numero_pedido, fecha_pedido, proveedor_nombre, estado [centrada],
 * comprador_nombre, creado_en, modificado_fecha, modificado_por), pero nada aquí depende de esos keys.
 */
import type { SortableColumnDef } from '../composables/useSortableList'

withDefaults(
  defineProps<{
    columns: SortableColumnDef[]
    sortColumn: string | null
    sortDirection: 'asc' | 'desc' | null
    /** Muestra la primera columna fija "#" (numeración de fila), no ordenable. Default true: los 4
     * listados actuales siempre la muestran. */
    showIndexColumn?: boolean
    /** Texto de la columna "#". Default '#'. */
    indexLabel?: string
  }>(),
  {
    showIndexColumn: true,
    indexLabel: '#'
  }
)

const emit = defineEmits<{
  'toggle-sort': [key: string]
}>()
</script>
