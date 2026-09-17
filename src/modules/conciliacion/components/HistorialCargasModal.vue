<template>
  <Teleport to="body">
    <dialog
      ref="modalRef"
      aria-labelledby="historial-cargas-modal-title"
      class="historial-cargas-modal-dialog relative p-0 m-auto border-0 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      @cancel.prevent="cerrarModal"
      @click="onBackdropClick"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div class="flex items-center justify-between">
          <h3 id="historial-cargas-modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">Historial completo de cargas</h3>
          <button type="button" @click="cerrarModal" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="overflow-auto flex-1">
        <div v-if="cargando && cargas.length === 0" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando historial...
        </div>
        <div v-else-if="cargas.length === 0" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No hay cargas registradas
        </div>
        <HistorialCargasTable v-else :cargas="cargas" />
      </div>

      <!-- Footer: paginación, mismo patrón que /reposiciones/catalogo -->
      <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
        <div class="flex items-center gap-6">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Mostrando <span class="font-medium text-gray-900 dark:text-white">{{ cargas.length }}</span> de <span class="font-medium text-gray-900 dark:text-white">{{ total }}</span> cargas
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cantidad por página:</span>
            <select
              v-model.number="cantidad"
              @change="onCambiarCantidad"
              :disabled="cargando"
              class="h-8 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs px-2 focus:ring-blue-500 focus:border-blue-500 border bg-white shadow-sm disabled:opacity-50"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="pagina = Math.max(1, pagina - 1)"
            :disabled="cargando || pagina === 1"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium"
          >
            Anterior
          </button>
          <div class="text-xs text-gray-600 dark:text-gray-300 font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
            Página {{ pagina }} de {{ totalPages }}
          </div>
          <button
            @click="pagina = Math.min(totalPages, pagina + 1)"
            :disabled="cargando || pagina >= totalPages"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all shadow-sm text-xs font-medium"
          >
            Siguiente
          </button>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import HistorialCargasTable from './HistorialCargasTable.vue'

const emit = defineEmits<{
  close: []
}>()

const store = useConciliacionStore()
const modalRef = ref<HTMLDialogElement | null>(null)

const pagina = ref(1)
const cantidad = ref(10)
const cargando = ref(false)

const cargas = computed(() => store.cargasPaginadas)
const total = computed(() => store.cargasPaginadasMeta?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / cantidad.value)))

onMounted(() => {
  modalRef.value?.showModal()
  cargar()
})

watch(pagina, () => cargar())

async function cargar() {
  cargando.value = true
  try {
    await store.fetchCargasPaginado(pagina.value, cantidad.value)
  } catch {
    // el error queda reflejado en store.error; el modal simplemente muestra la lista vacía
  } finally {
    cargando.value = false
  }
}

function onCambiarCantidad() {
  pagina.value = 1
  cargar()
}

function cerrarModal(): void {
  modalRef.value?.close()
  emit('close')
}

function onBackdropClick(evento: MouseEvent): void {
  if (evento.target === modalRef.value) cerrarModal()
}
</script>

<style>
/* ::backdrop del <dialog> nativo: no se puede scopear, por eso una clase específica sin scoped. */
.historial-cargas-modal-dialog::backdrop {
  background-color: rgb(100 116 139 / 0.75);
}
.dark .historial-cargas-modal-dialog::backdrop {
  background-color: rgb(15 23 42 / 0.8);
}
</style>
