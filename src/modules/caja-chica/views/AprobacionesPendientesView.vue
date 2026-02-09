<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Aprobaciones pendientes</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Pendientes por aprobar para tu usuario</p>
        </div>
        <router-link
          class="rounded border border-gray-200 dark:border-gray-700 text-sm px-3 py-1.5"
          to="/caja-chica"
        >
          Volver
        </router-link>
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

        <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Cargando aprobaciones...</div>
        <div v-else-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
        <div v-else-if="pendientes.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No hay aprobaciones pendientes.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th class="py-2 pr-3">Id</th>
                <th class="py-2 pr-3">Detalle</th>
                <th class="py-2 pr-3">Monto</th>
                <th class="py-2 pr-3">Nivel</th>
                <th class="py-2 pr-3">Fecha</th>
                <th class="py-2 pr-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="item in pendientes" :key="item.idAprobacion">
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.idAprobacion }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.idDetalle }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatAmount(item.montoAprobado) }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.nivelAprobacion }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ formatDate(item.fechaAprobacion) }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ item.estado }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from '@vue/runtime-core'
import axios from 'axios'

interface AprobacionItem {
  idAprobacion: number
  idDetalle: number
  idUsuario: string
  montoAprobado: number
  fechaAprobacion: string
  estado: string
  nivelAprobacion: number
}

const loading = ref(false)
const error = ref('')
const pendientes = ref<AprobacionItem[]>([])

const cajaChicaApi = axios.create({
  baseURL: import.meta.env.VITE_CAJA_CHICA_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

cajaChicaApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    }
  }
  return config
})

const getCurrentUserId = (): string => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return ''
    const user = JSON.parse(userStr) as { id?: string }
    return user.id || ''
  } catch {
    return ''
  }
}

const normalizeString = (value: any) => String(value ?? '').trim()

const normalizeAprobacion = (item: any): AprobacionItem => ({
  idAprobacion: Number(item.idAprobacion ?? item.IdAprobacion ?? 0),
  idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? 0),
  idUsuario: normalizeString(item.idUsuario ?? item.IdUsuario ?? ''),
  montoAprobado: Number(item.montoAprobado ?? item.MontoAprobado ?? 0),
  fechaAprobacion: String(item.fechaAprobacion ?? item.FechaAprobacion ?? ''),
  estado: normalizeString(item.estado ?? item.Estado ?? ''),
  nivelAprobacion: Number(item.nivelAprobacion ?? item.NivelAprobacion ?? 0)
})

const loadPendientes = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await cajaChicaApi.get('/Aprobaciones')
    const payload = response.data as any
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
    const userId = getCurrentUserId()
    pendientes.value = items
      .map(normalizeAprobacion)
      .filter(item => item.estado.toUpperCase() === 'PENDIENTE')
      .filter(item => userId && String(item.idUsuario) === userId)
  } catch {
    error.value = 'No se pudieron cargar las aprobaciones pendientes.'
  } finally {
    loading.value = false
  }
}

const formatAmount = (value: number) => value.toFixed(2)
const formatDate = (value: string) => value ? value.substring(0, 10) : ''

onMounted(() => {
  loadPendientes()
})
</script>
