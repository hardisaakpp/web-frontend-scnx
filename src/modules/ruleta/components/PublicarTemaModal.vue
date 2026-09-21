<script setup lang="ts">
import { computed } from 'vue'
import type { TemaVisualConfig } from '../types'

const props = defineProps<{
  activo: TemaVisualConfig
  borrador: TemaVisualConfig
  destino: string
  publicando: boolean
}>()

const emit = defineEmits<{
  confirmar: []
  cancelar: []
}>()

const ETIQUETAS_CAMPO: Record<string, string> = {
  paleta_segmentos: 'Paleta de segmentos',
  color_texto_segmentos: 'Color de texto en segmentos',
  color_aro_primario: 'Aro — color primario',
  color_aro_secundario: 'Aro — color secundario',
  color_hub_fondo: 'Hub — color de fondo',
  color_hub_acento: 'Hub — color de acento',
  color_puntero: 'Color del puntero',
  color_fondo_inicio: 'Fondo — color inicial',
  color_fondo_fin: 'Fondo — color final',
  color_halo: 'Halo / glow',
  color_boton: 'Botón Girar Ruleta',
  hub: 'Branding del hub (logo, escala, rotación)',
  fondo: 'Fondo de pantalla y atenuación',
  particulas: 'Partículas atmosféricas',
  tipografia: 'Tipografía',
  vip: 'Estilo del Premio Mayor / Estrella',
}

const camposCambiados = computed(() => {
  const activo = props.activo as unknown as Record<string, unknown>
  const borrador = props.borrador as unknown as Record<string, unknown>
  const claves = new Set([...Object.keys(activo), ...Object.keys(borrador)])
  return [...claves]
    .filter((k) => JSON.stringify(activo[k]) !== JSON.stringify(borrador[k]))
    .map((k) => ETIQUETAS_CAMPO[k] ?? k)
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="emit('cancelar')">
    <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
      <div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Publicar en tiendas</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Los cambios se aplicarán {{ destino }}. Las terminales verán el nuevo tema en su próxima carga.
        </p>
      </div>

      <div v-if="camposCambiados.length > 0" class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Cambios a publicar:</p>
        <ul class="space-y-1">
          <li v-for="campo in camposCambiados" :key="campo" class="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
            {{ campo }}
          </li>
        </ul>
      </div>
      <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">No se detectaron cambios respecto al tema publicado.</p>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button
          @click="emit('cancelar')"
          :disabled="publicando"
          class="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          @click="emit('confirmar')"
          :disabled="publicando || camposCambiados.length === 0"
          class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-40"
        >
          {{ publicando ? 'Publicando…' : 'Confirmar publicación' }}
        </button>
      </div>
    </div>
  </div>
</template>
