<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, CheckCircleIcon, CloudArrowUpIcon, QrCodeIcon } from '@heroicons/vue/24/outline'
import { useGrupoStore } from '../stores/grupoStore'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { GrupoEstado } from '../types'

const route = useRoute()
const router = useRouter()
const store = useGrupoStore()
const authStore = useAuthStore()
const toast = useToast()

const id = computed(() => route.params.id as string)

const puedeIntegrar = computed(() =>
  authStore.userRoles?.includes('Admin') || authStore.hasPermission('cedi.grupo.picking.supervisor'))

const estadoBadge: Record<GrupoEstado, string> = {
  Nuevo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Recolectando: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Empaquetando: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Despachado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

async function onIniciarPicking() {
  try {
    const session = await store.startPickingSession(id.value)
    router.push(`/cedi/distribucion/grupos/${id.value}/picking/${session.id}`)
  } catch (e: any) {
    toast.error('No se pudo iniciar el picking', e?.response?.data?.message)
  }
}

async function onIntegrarSap() {
  try {
    const result = await store.integrarStockTransfer(id.value)
    const fallidas = result.solicitudes.filter(s => !s.integradaSap)
    if (fallidas.length > 0) {
      toast.warning('Integración parcial', `${fallidas.length} solicitud(es) quedaron pendientes — ver detalle abajo.`)
    } else {
      toast.success('Integrado a SAP', `${result.solicitudes.length} StockTransfer(s) creado(s).`)
    }
  } catch (e: any) {
    toast.error('No se pudo integrar a SAP', e?.response?.data?.message)
  }
}

onMounted(() => store.fetchGrupo(id.value))
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      @click="router.push('/cedi/distribucion/grupos')"
    >
      <ArrowLeftIcon class="w-4 h-4" /> Volver a grupos
    </button>

    <div v-if="store.loadingCurrent" class="text-center text-gray-400 py-12">Cargando...</div>

    <template v-else-if="store.current">
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.current.nombre }}</h1>
              <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="estadoBadge[store.current.estado]">
                {{ store.current.estado }}
              </span>
            </div>
            <p class="text-gray-500 dark:text-gray-400">
              {{ store.current.almacen }} · {{ store.current.tipo }} · {{ store.current.cantidadSolicitudes }} solicitud(es) ·
              {{ store.current.cantidadArticulos }} ítem(s) distintos
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="store.current.estado === 'Nuevo' || store.current.estado === 'Recolectando'"
              type="button"
              :disabled="store.starting"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold shadow-sm"
              @click="onIniciarPicking"
            >
              <QrCodeIcon class="w-4 h-4" />
              {{ store.current.estado === 'Recolectando' ? 'Continuar picking' : 'Iniciar picking' }}
            </button>
            <template v-else-if="store.current.estado === 'Empaquetando'">
              <button
                v-if="puedeIntegrar"
                type="button"
                :disabled="store.integrating"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold shadow-sm"
                @click="onIntegrarSap"
              >
                <CloudArrowUpIcon class="w-4 h-4" />
                {{ store.integrating ? 'Integrando...' : 'Integrar a SAP' }}
              </button>
              <p v-else class="text-xs text-gray-400 dark:text-gray-500">Requiere permiso de supervisor para integrar a SAP</p>
            </template>
          </div>
        </div>
      </div>

      <div v-if="store.current.estado === 'Despachado'" class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-6 flex items-center gap-3">
        <CheckCircleIcon class="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p class="text-sm text-emerald-800 dark:text-emerald-300">
          Grupo totalmente despachado — todas las solicitudes con algo escaneado ya tienen su StockTransfer en SAP.
        </p>
      </div>

      <!-- Resultado de la última integración (solo se ve justo después de integrar en esta sesión de navegador) -->
      <div v-if="store.lastIntegracion" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Resultado de la integración</h2>
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="s in store.lastIntegracion.solicitudes" :key="s.transferenciaSolicitudId" class="p-4 flex items-center justify-between text-sm">
            <div>
              <span class="font-medium text-gray-900 dark:text-white">{{ s.numDoc }}</span>
              <span class="text-gray-400"> → {{ s.tiendaDestino }}</span>
            </div>
            <div v-if="s.integradaSap" class="text-emerald-600 dark:text-emerald-400 font-medium">
              StockTransfer #{{ s.stockTransferDocNum }}
            </div>
            <div v-else class="text-amber-600 dark:text-amber-400 text-xs max-w-xs text-right">
              {{ s.ultimoErrorIntegracion }}
            </div>
          </li>
        </ul>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Solicitudes incluidas</h2>
        </div>
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="px-4 py-3">N° Documento</th>
              <th class="px-4 py-3">Tienda destino</th>
              <th class="px-4 py-3">Cantidad</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="s in store.current.solicitudes" :key="s.transferenciaSolicitudId">
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ s.numDoc }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ s.tiendaDestino }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ s.cantidad }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
