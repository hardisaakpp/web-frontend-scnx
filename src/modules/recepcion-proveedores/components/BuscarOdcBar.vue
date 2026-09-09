<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

withDefaults(defineProps<{ autofocus?: boolean }>(), { autofocus: false })

const router = useRouter()
const docNum = ref<string>('')
const buscando = ref(false)
const error = ref<string | null>(null)

async function buscar(): Promise<void> {
  const valor = Number(docNum.value)
  if (!Number.isFinite(valor) || valor <= 0) {
    error.value = 'Ingresa un número de ODC válido.'
    return
  }
  error.value = null
  buscando.value = true
  try {
    await router.push({ name: 'recepcion-proveedores-detalle', params: { docNum: valor } })
    docNum.value = ''
  } finally {
    buscando.value = false
  }
}
</script>

<template>
  <div>
    <form class="flex gap-2" @submit.prevent="buscar">
      <label for="buscar-odc-input" class="sr-only">Número de ODC</label>
      <input
        id="buscar-odc-input"
        v-model="docNum"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        :autofocus="autofocus"
        placeholder="Número de ODC (DocNum)"
        class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      />
      <button
        type="submit"
        :disabled="buscando"
        class="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Buscar
      </button>
      <RouterLink
        to="/recepcion-proveedores/logs"
        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
      >
        Logs
      </RouterLink>
    </form>
    <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>
