<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, ArrowPathIcon, TruckIcon } from '@heroicons/vue/24/outline'
import { useOdcStore } from '../stores/odcStore'
import odcApi from '../services/odcApi'
import { useToast } from '@/composables/useToast'
import type { OdcPickingSessionDto } from '../types'

const route = useRoute()
const router = useRouter()
const store = useOdcStore()
const toast = useToast()

const numDoc = computed(() => route.params.numDoc as string)

const sessions = ref<OdcPickingSessionDto[]>([])
const loadingSessions = ref(false)
const starting = ref(false)
const refreshing = ref(false)

const sesionActiva = computed(() => sessions.value.find(s => s.estado === 'Abierta'))

async function cargarTodo() {
  await store.fetchOdc(numDoc.value)
  loadingSessions.value = true
  try {
    sessions.value = await odcApi.getPickingSessions(numDoc.value)
  } finally {
    loadingSessions.value = false
  }
}

async function onRefresh() {
  refreshing.value = true
  try {
    await store.refreshCurrent(numDoc.value)
    toast.success('Actualizado desde SAP')
  } catch (e: any) {
    toast.error('No se pudo refrescar', e?.response?.data?.message)
  } finally {
    refreshing.value = false
  }
}

/** "Recibir" — inicia o retoma la sesión y va directo a la pantalla de escaneo. */
async function onRecibir() {
  starting.value = true
  try {
    const session = await odcApi.startPickingSession(numDoc.value)
    router.push(`/cedi/odc/${numDoc.value}/picking/${session.id}`)
  } catch (e: any) {
    toast.error('No se pudo iniciar el picking', e?.response?.data?.message)
  } finally {
    starting.value = false
  }
}

onMounted(cargarTodo)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      @click="router.push('/cedi/odc')"
    >
      <ArrowLeftIcon class="w-4 h-4" /> Volver al listado
    </button>

    <div v-if="store.loadingCurrent" class="text-center text-gray-400 py-12">Cargando...</div>

    <template v-else-if="store.current">
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">ODC {{ store.current.numDoc }}</h1>
            <p class="text-gray-500 dark:text-gray-400">{{ store.current.proveedor }} · Almacén {{ store.current.almacen }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="refreshing"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              @click="onRefresh"
            >
              <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': refreshing }" /> Actualizar desde SAP
            </button>
            <button
              v-if="store.current.estado === 'Abierta'"
              type="button"
              :disabled="starting"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold shadow-sm"
              @click="onRecibir"
            >
              <TruckIcon class="w-4 h-4" />
              {{ sesionActiva ? 'Continuar picking' : 'Recibir' }}
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <table class="w-full text-sm">
          <thead class="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th class="px-4 py-3">Ítem</th>
              <th class="px-4 py-3">Descripción</th>
              <th class="px-4 py-3">Código de barras</th>
              <th class="px-4 py-3">Pedido</th>
              <th class="px-4 py-3">Recibido</th>
              <th class="px-4 py-3">Pendiente</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="linea in store.current.lineas" :key="linea.id">
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ linea.itemCode }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ linea.descripcion }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{{ linea.codigoBarras ?? '—' }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ linea.cantidadPedida }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ linea.cantidadRecibida }}</td>
              <td class="px-4 py-3 font-semibold" :class="linea.cantidadPedida - linea.cantidadRecibida > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'">
                {{ linea.cantidadPedida - linea.cantidadRecibida }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="sessions.length > 0" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          Historial de picking
        </h2>
        <ul class="space-y-2">
          <li
            v-for="s in sessions"
            :key="s.id"
            class="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <span class="text-gray-700 dark:text-gray-300">
              {{ new Date(s.fechaInicio).toLocaleString() }}
              <span v-if="s.bloqueadaEnSap" class="ml-2 text-xs text-gray-400">(bloqueada en SAP)</span>
            </span>
            <div class="flex items-center gap-3">
              <span class="text-gray-500 dark:text-gray-400">{{ s.cantidadEscaneada }} escaneo(s)</span>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="s.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
              >
                {{ s.estado }}
              </span>
              <router-link
                v-if="s.estado === 'Abierta'"
                :to="`/cedi/odc/${numDoc}/picking/${s.id}`"
                class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Ir a pickear
              </router-link>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
