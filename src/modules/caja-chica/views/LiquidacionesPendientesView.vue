<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <button
      type="button"
      class="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
      @click="volver"
    >
      <span aria-hidden="true">←</span> Volver
    </button>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Liquidaciones pendientes</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Solicitudes en revision y contabilidad</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Listado</h2>
          <button
            type="button"
            class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
            @click="loadPendientes"
          >
            Refrescar
          </button>
        </div>

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando liquidaciones...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="pendientes.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay liquidaciones pendientes.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th class="py-2 pr-3">Id</th>
                <th class="py-2 pr-3">Almacen</th>
                <th class="py-2 pr-3">Custodio</th>
                <th class="py-2 pr-3">Fecha</th>
                <th class="py-2 pr-3">Nivel</th>
                <th class="py-2 pr-3">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in pendientes" :key="item.idLiquidacion">
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.idLiquidacion }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.codAlmacen }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nombreCustodio }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.fechaCreacion }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ getNivelAprobacion(item.estado) }}</td>
                <td class="py-2 pr-3">
                  <router-link
                    class="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    :to="`/caja-chica/liquidaciones/${item.idLiquidacion}/detalle`"
                  >
                    Detalles
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

interface LiquidacionItem {
  idLiquidacion: number
  idUsuario: string
  estado: string
  codAlmacen: string
  nombreCustodio: string
  fechaCreacion: string
}

const loading = ref(false)
const error = ref('')
const pendientes = ref<LiquidacionItem[]>([])
const router = useRouter()

const volver = () => {
  router.back()
}

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

const normalizeString = (value: any) => String(value ?? '').trim()

const getCurrentUserId = (): string => {
  if (authStore.userData?.id) return authStore.userData.id
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return ''
    const user = JSON.parse(userStr) as { id?: string }
    return user.id || ''
  } catch {
    return ''
  }
}

const normalizeLiquidacion = (item: any): LiquidacionItem => ({
  idLiquidacion: Number(item.idLiquidacion ?? item.IdLiquidacion ?? 0),
  idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  codAlmacen: normalizeString(item.codAlmacen ?? item.CodAlmacen ?? ''),
  nombreCustodio: normalizeString(item.nombreCustodio ?? item.NombreCustodio ?? ''),
  fechaCreacion: String(item.fechaCreacion ?? item.FechaCreacion ?? '')
})

const getNivelAprobacion = (estado: string) => {
  const normalized = normalizeString(estado).toUpperCase()
  if (normalized === 'SUPERVISION') return 'Supervision'
  if (normalized === 'CONTABILIDAD') return 'Contabilidad'
  return normalized || '-'
}

const loadPendientes = async () => {
  loading.value = true
  error.value = ''
  try {
    const currentUserId = getCurrentUserId()
    const response = await cajaChicaApi.get('/Liquidaciones')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    pendientes.value = items
      .map(normalizeLiquidacion)
      .filter((item: LiquidacionItem) => 
        ['SUPERVISION', 'CONTABILIDAD'].includes(item.estado.toUpperCase()) && 
        item.idUsuario === currentUserId
      )
  } catch {
    error.value = 'No se pudieron cargar las liquidaciones pendientes.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPendientes()
})
</script>
