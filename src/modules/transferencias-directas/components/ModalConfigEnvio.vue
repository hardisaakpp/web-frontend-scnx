<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  abierto: boolean
  modo: 'nuevo' | 'editar'
  marcas: string[]
  marcasOrigenUsadas: string[]
  marcaOrigen?: string
  destinosActuales?: string[]
  guardando?: boolean
  error?: string
}>()

const emit = defineEmits<{
  guardar: [payload: { marcaOrigen: string; destinos: string[] }]
  cerrar: []
}>()

const origenSel = ref('')
const destinosSel = ref<Set<string>>(new Set())

// Nuevo: solo marcas SIN config previa
const opcionesOrigen = computed(() => props.marcas.filter((m) => !props.marcasOrigenUsadas.includes(m)))

watch(() => props.abierto, (v) => {
  if (!v) return
  if (props.modo === 'editar') {
    origenSel.value = props.marcaOrigen ?? ''
    destinosSel.value = new Set(props.destinosActuales ?? [])
  } else {
    origenSel.value = ''
    destinosSel.value = new Set()
  }
})

const estaChequeado = (m: string) => destinosSel.value.has(m)
const toggleDestino = (m: string) => {
  const s = new Set(destinosSel.value)
  s.has(m) ? s.delete(m) : s.add(m)
  destinosSel.value = s
}

const puedeGuardar = computed(() => !!origenSel.value && destinosSel.value.size > 0)
const onGuardar = () => {
  if (puedeGuardar.value) emit('guardar', { marcaOrigen: origenSel.value, destinos: Array.from(destinosSel.value) })
}

const inputClass =
  'w-full h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
</script>

<template>
  <div v-if="abierto" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="!guardando && emit('cerrar')"></div>

    <div class="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ modo === 'nuevo' ? 'Nueva configuración' : 'Editar configuración' }}
        </h2>
        <button type="button" @click="emit('cerrar')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="overflow-y-auto p-6 space-y-5">
        <div>
          <label for="marcasConfig"class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Marca Origen</label>
          <select id="marcasConfig" v-if="modo === 'nuevo'" v-model="origenSel" :class="inputClass">
            <option value="" disabled>Seleccione una marca…</option>
            <option v-for="m in opcionesOrigen" :key="m" :value="m">{{ m }}</option>
          </select>
          <input v-else type="text" :value="origenSel" disabled :class="[inputClass, 'opacity-60 cursor-not-allowed']" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Marcas Destino</label>
          <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <label v-for="m in marcas" :key="m" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input type="checkbox" :checked="estaChequeado(m)" @change="toggleDestino(m)"
                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" />
              {{ m }}
            </label>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{{ error }}</p>
      </div>

      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" @click="emit('cerrar')" :disabled="guardando"
          class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-colors">
          Cancelar
        </button>
        <button type="button" @click="onGuardar" :disabled="guardando || !puedeGuardar"
          class="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm">
          {{ guardando ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>
