<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const docNum = ref<string>('')
const buscando = ref(false)
const errorBusqueda = ref<string | null>(null)

function irADetalle(): void {
  const valor = Number(docNum.value)
  if (!Number.isFinite(valor) || valor <= 0) {
    errorBusqueda.value = 'Ingresa un número de ODC válido.'
    return
  }
  errorBusqueda.value = null
  buscando.value = true
  router.push({ name: 'recepcion-proveedores-detalle', params: { docNum: valor } })
}
</script>

<template>
  <div class="max-w-xl mx-auto py-10 px-4">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Recepción Proveedores</h1>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Busca una orden de compra por su número (DocNum).</p>

    <form class="flex gap-2" @submit.prevent="irADetalle">
      <label for="docnum-input" class="sr-only">Número de ODC</label>
      <input
        id="docnum-input"
        v-model="docNum"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        autofocus
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
    </form>

    <p v-if="errorBusqueda" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ errorBusqueda }}</p>
  </div>
</template>
