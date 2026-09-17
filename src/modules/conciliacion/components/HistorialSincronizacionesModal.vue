<template>
  <Teleport to="body">
    <dialog
      ref="modalRef"
      aria-labelledby="historial-sync-modal-title"
      class="historial-sync-modal-dialog relative p-0 m-auto border-0 rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
      @cancel.prevent="cerrarModal"
      @click="onBackdropClick"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div class="flex items-center justify-between">
          <h3 id="historial-sync-modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">Historial de sincronizaciones SAP</h3>
          <button type="button" @click="cerrarModal" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="overflow-auto flex-1">
        <div v-if="cargando && sincronizaciones.length === 0" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando historial...
        </div>
        <div v-else-if="sincronizaciones.length === 0" class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No hay sincronizaciones registradas
        </div>
        <table v-else class="w-full text-left border-separate border-spacing-0 table-auto min-w-full">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th class="sticky top-0 z-10 px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 rounded-tl-xl">Estado</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Período filtrado</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">Inicio</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Nuevos</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Actualiz.</th>
              <th class="sticky top-0 z-10 px-2 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900">Incomp.</th>
              <th class="sticky top-0 z-10 px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center bg-gray-50 dark:bg-gray-900 rounded-tr-xl">Alertas</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <template v-for="sync in sincronizaciones" :key="sync.id">
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-4 py-3">
                  <button
                    v-if="sync.estado === 'ERROR' && sync.error_mensaje"
                    @click="toggleExpandido(sync.id)"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold hover:underline"
                    :class="estadoBadgeClass(sync.estado)"
                  >
                    {{ sync.estado }}
                    <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': expandidoId === sync.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <span v-else class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold" :class="estadoBadgeClass(sync.estado)">
                    {{ sync.estado }}
                  </span>
                </td>
                <td class="px-2 py-3 text-xs text-gray-600 dark:text-gray-300">{{ sync.fecha_desde_filtro }} — {{ sync.fecha_hasta_filtro }}</td>
                <td class="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatFechaCarga(sync.fecha_inicio) }}</td>
                <td class="px-2 py-3 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ sync.insertados ?? '—' }}</td>
                <td class="px-2 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{{ sync.actualizados ?? '—' }}</td>
                <td class="px-2 py-3 text-center text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">{{ sync.registros_incompletos ?? '—' }}</td>
                <td class="px-4 py-3 text-center text-sm font-bold font-mono" :class="sync.alertas_conciliados_modificados ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'">
                  {{ sync.alertas_conciliados_modificados ?? '—' }}
                </td>
              </tr>
              <tr v-if="expandidoId === sync.id" class="bg-gray-50 dark:bg-gray-900/40">
                <td colspan="7" class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                  {{ sync.error_mensaje }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Footer: paginación -->
      <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
        <div class="flex items-center gap-6">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Mostrando <span class="font-medium text-gray-900 dark:text-white">{{ sincronizaciones.length }}</span> de <span class="font-medium text-gray-900 dark:text-white">{{ total }}</span> sincronizaciones
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cantidad por página:</span>
            <select
              v-model.number="cantidad"
              @change="onCambiarCantidad"
              :disabled="cargando"
              class="h-8 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs px-2 focus:ring-blue-500 focus:border-blue-500 border bg-white shadow-sm disabled:opacity-50"
            >
              <option :value="4">4</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
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
import { formatFechaCarga } from '../utils/cargas'

const emit = defineEmits<{
  close: []
}>()

const store = useConciliacionStore()
const modalRef = ref<HTMLDialogElement | null>(null)

const pagina = ref(1)
const cantidad = ref(4)
const cargando = ref(false)
const expandidoId = ref<string | null>(null)

const sincronizaciones = computed(() => store.sincronizacionesSAP)
const total = computed(() => store.sincronizacionesSAPMeta?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / cantidad.value)))

onMounted(() => {
  modalRef.value?.showModal()
  cargar()
})

watch(pagina, () => cargar())

async function cargar() {
  cargando.value = true
  try {
    await store.fetchSincronizacionesSAP(pagina.value, cantidad.value)
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

function toggleExpandido(id: string) {
  expandidoId.value = expandidoId.value === id ? null : id
}

function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'COMPLETADO':
      return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    case 'EN_PROGRESO':
      return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    case 'ERROR':
      return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  }
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
.historial-sync-modal-dialog::backdrop {
  background-color: rgb(100 116 139 / 0.75);
}
.dark .historial-sync-modal-dialog::backdrop {
  background-color: rgb(15 23 42 / 0.8);
}
</style>
