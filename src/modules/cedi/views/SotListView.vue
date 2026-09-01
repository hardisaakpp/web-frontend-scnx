<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowPathIcon, MagnifyingGlassIcon, RectangleStackIcon } from '@heroicons/vue/24/outline'
import { useSotStore } from '../stores/sotStore'
import { useGrupoStore } from '../stores/grupoStore'
import { useToast } from '@/composables/useToast'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import CrearGrupoModal from '../components/CrearGrupoModal.vue'
import type { TransferenciaEstado, TipoGrupo } from '../types'

const store = useSotStore()
const grupoStore = useGrupoStore()
const toast = useToast()
const router = useRouter()

const totalPages = computed(() => Math.max(1, Math.ceil(store.totalCount / store.pageSize)))
const modalAbierto = ref(false)

const estadoBadge: Record<TransferenciaEstado, string> = {
  Abierta: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Parcial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Cerrada: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

async function onSync() {
  try {
    const result = await store.sync(5)
    toast.success(
      'Sincronización completa',
      `${result.solicitudesNuevas} nuevas, ${result.solicitudesActualizadas} actualizadas (${result.paginasConsultadas} página(s) de SAP).`,
    )
  } catch {
    toast.error('No se pudo sincronizar', store.error ?? undefined)
  }
}

async function onCrearGrupo(datos: { nombre: string; almacen: string; tipo: TipoGrupo }) {
  try {
    const result = await grupoStore.crearGrupo({
      nombre: datos.nombre,
      almacen: datos.almacen,
      tipo: datos.tipo,
      prioridad: 'Normal',
      solicitudIds: store.solicitudesSeleccionadas.map(s => s.id),
    })
    modalAbierto.value = false
    store.limpiarSeleccion()
    if (result.solicitudesNoBloqueadasEnSap.length > 0) {
      toast.warning(
        'Grupo creado con avisos',
        `No se pudieron bloquear en SAP: ${result.solicitudesNoBloqueadasEnSap.join(', ')}.`,
      )
    } else {
      toast.success('Grupo creado', `"${result.grupo.nombre}" con ${result.grupo.cantidadSolicitudes} solicitud(es).`)
    }
    router.push(`/cedi/distribucion/grupos/${result.grupo.id}`)
  } catch (e: any) {
    toast.error('No se pudo crear el grupo', e?.response?.data?.message)
  }
}

onMounted(() => store.fetchSolicitudes())
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Distribución — Solicitudes de Transferencia</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Elegí las solicitudes disponibles y armá un grupo para pickear (Crossdocking/Reposición).
        </p>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          to="/cedi/distribucion/grupos"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold"
        >
          Ver grupos
        </router-link>
        <button
          type="button"
          :disabled="store.syncing"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition-colors"
          @click="onSync"
        >
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': store.syncing }" />
          {{ store.syncing ? 'Sincronizando...' : 'Sincronizar desde SAP' }}
        </button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="flex flex-wrap gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
        <div class="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            :value="store.filters.numDoc"
            type="text"
            placeholder="Buscar por N° de documento..."
            class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            @input="store.setFilters({ numDoc: ($event.target as HTMLInputElement).value || undefined })"
          />
        </div>
        <input
          :value="store.filters.almacenOrigen"
          type="text"
          placeholder="Almacén origen"
          class="w-36 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          @input="store.setFilters({ almacenOrigen: ($event.target as HTMLInputElement).value || undefined })"
        />
        <label class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            :checked="store.filters.soloDisponibles"
            class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            @change="store.setFilters({ soloDisponibles: ($event.target as HTMLInputElement).checked })"
          />
          Solo disponibles
        </label>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="px-4 py-3 w-10"></th>
              <th class="px-4 py-3">N° Documento</th>
              <th class="px-4 py-3">Origen → Destino</th>
              <th class="px-4 py-3">Fecha</th>
              <th class="px-4 py-3">Líneas</th>
              <th class="px-4 py-3">Cantidad</th>
              <th class="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="store.loading">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">Cargando...</td>
            </tr>
            <tr v-else-if="store.items.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                Sin resultados — probá "Sincronizar desde SAP" si esperabas ver algo acá.
              </td>
            </tr>
            <tr
              v-for="sot in store.items"
              :key="sot.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              :class="{ 'opacity-50': !sot.disponible }"
            >
              <td class="px-4 py-3">
                <input
                  type="checkbox"
                  :disabled="!sot.disponible"
                  :checked="store.seleccionadas.has(sot.id)"
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                  @change="store.toggleSeleccion(sot.id)"
                />
              </td>
              <td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                {{ sot.numDoc }}
                <span v-if="!sot.disponible" class="block text-xs font-normal text-gray-400">ya en un grupo</span>
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ sot.almacenOrigen }} → {{ sot.tiendaDestino }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ new Date(sot.fechaCreacion).toLocaleDateString() }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ sot.cantidadLineas }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ sot.cantidadSolicitada }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="estadoBadge[sot.estado]">
                  {{ sot.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ store.seleccionadas.size }} seleccionada(s)
        </span>
        <QuickTablePagination
          :model-value="store.page"
          :total-pages="totalPages"
          :disabled="store.loading"
          @update:model-value="store.setPage"
        />
      </div>
    </div>

    <!-- Botón flotante de crear grupo, visible solo con selección -->
    <div v-if="store.seleccionadas.size > 0" class="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
        @click="modalAbierto = true"
      >
        <RectangleStackIcon class="w-5 h-5" />
        Crear grupo con {{ store.seleccionadas.size }} solicitud(es)
      </button>
    </div>

    <CrearGrupoModal
      :open="modalAbierto"
      :solicitudes="store.solicitudesSeleccionadas"
      :busy="grupoStore.creating"
      @cancel="modalAbierto = false"
      @confirm="onCrearGrupo"
    />
  </div>
</template>
