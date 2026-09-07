<template>
  <div>
    <div v-if="titulo" class="flex items-center justify-between mb-1">
      <span class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ titulo }}</span>
      <button
        v-if="texto"
        type="button"
        class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        @click="copiar"
      >
        {{ copiado ? 'Copiado' : 'Copiar' }}
      </button>
    </div>
    <pre
      v-if="texto"
      class="max-h-72 overflow-auto rounded-lg bg-gray-900 text-gray-100 text-xs p-3 whitespace-pre-wrap break-words"
    >{{ texto }}</pre>
    <p v-else class="text-sm text-gray-500 dark:text-gray-400 italic">{{ vacio }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { prettyJson } from '../utils/formatters'

const props = withDefaults(
  defineProps<{
    value: unknown
    titulo?: string
    vacio?: string
  }>(),
  { titulo: '', vacio: 'Sin contenido' },
)

const texto = computed(() => prettyJson(props.value))
const copiado = ref(false)

async function copiar() {
  try {
    await navigator.clipboard.writeText(texto.value)
    copiado.value = true
    setTimeout(() => {
      copiado.value = false
    }, 1500)
  } catch {
    copiado.value = false
  }
}
</script>
