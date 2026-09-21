<script setup lang="ts">
import { ref } from 'vue'
import { useTemaStore } from '../stores/temaStore'
import { useToast } from '@/composables/useToast'
import type { TemaPresetBackend } from '../types'

const temaStore = useTemaStore()
const toast = useToast()

const mostrandoFormularioGuardar = ref(false)
const nombreNuevoPreset = ref('')
const guardando = ref(false)
const eliminandoId = ref<string | null>(null)

function aplicar(preset: TemaPresetBackend) {
  temaStore.aplicarPreset(preset)
  toast.info('Plantilla aplicada', `"${preset.nombre}" se aplicó al borrador. Publica para llevarla a tiendas.`)
}

async function guardar() {
  const nombre = nombreNuevoPreset.value.trim()
  if (!nombre || guardando.value) return
  guardando.value = true
  try {
    await temaStore.guardarNuevoPreset(nombre)
    toast.success('Plantilla guardada', `"${nombre}" ya está disponible en la galería.`)
    nombreNuevoPreset.value = ''
    mostrandoFormularioGuardar.value = false
  } catch (e) {
    console.error('Error al guardar la plantilla:', e)
    toast.error('No se pudo guardar la plantilla')
  } finally {
    guardando.value = false
  }
}

async function eliminar(preset: TemaPresetBackend) {
  if (preset.esSistema) return
  if (!window.confirm(`¿Eliminar la plantilla "${preset.nombre}"? Esta acción no se puede deshacer.`)) return
  eliminandoId.value = preset.id
  try {
    await temaStore.eliminarPreset(preset.id)
  } catch (e) {
    console.error('Error al eliminar la plantilla:', e)
    toast.error('No se pudo eliminar la plantilla')
  } finally {
    eliminandoId.value = null
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Plantillas</h3>
      <button
        @click="mostrandoFormularioGuardar = !mostrandoFormularioGuardar"
        class="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
      >
        {{ mostrandoFormularioGuardar ? 'Cancelar' : 'Guardar como nueva plantilla' }}
      </button>
    </div>

    <div v-if="mostrandoFormularioGuardar" class="flex items-center gap-2">
      <input
        v-model="nombreNuevoPreset"
        type="text"
        placeholder="Nombre de la plantilla"
        maxlength="150"
        class="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
        @keyup.enter="guardar"
      />
      <button
        @click="guardar"
        :disabled="!nombreNuevoPreset.trim() || guardando"
        class="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors disabled:opacity-40"
      >
        {{ guardando ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>

    <div v-if="temaStore.presets.length === 0" class="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
      {{ temaStore.cargandoPresets ? 'Cargando plantillas…' : temaStore.errorPresets || 'Aún no hay plantillas. Guarda tu primer diseño.' }}
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div
        v-for="preset in temaStore.presets"
        :key="preset.id"
        class="group relative rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
      >
        <button @click="aplicar(preset)" class="block w-full text-left">
          <div class="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
            <img v-if="preset.miniaturaUrl" :src="preset.miniaturaUrl" :alt="preset.nombre" class="w-full h-full object-cover" />
            <span v-else class="text-xs text-gray-400">Sin miniatura</span>
          </div>
          <div class="p-2">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{{ preset.nombre }}</p>
            <span v-if="!preset.esSistema" class="text-[10px] text-violet-600">Personalizada</span>
            <span v-if="preset.esSistema" class="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Sistema</span>
          </div>
        </button>
        <button
          v-if="!preset.esSistema"
          @click="eliminar(preset)"
          :disabled="eliminandoId === preset.id"
          title="Eliminar plantilla"
          class="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 dark:bg-gray-900/90 text-gray-400 hover:text-red-500 opacity-100 transition-opacity disabled:opacity-100"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
